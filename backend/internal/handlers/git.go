package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"log"
	"net/http"
	"net/http/cgi"
	"os"
	"strings"
)

// proxyUserHeader is set by the reverse proxy after it has authenticated the
// request. It is only trustworthy because the server binds to loopback
// (config.App.BindAddr), so the proxy is the only possible source of it. If
// the server is ever bound to a routable address, this header becomes
// attacker-controlled and the push gate below is worthless.
const proxyUserHeader = "X-Drei-Git-User"

// repoFromGitPath extracts the owner and repository name from a git HTTP path
// like "/<owner>/<repo>.git/git-receive-pack". It returns false when the path
// does not match the expected shape.
func repoFromGitPath(path string) (owner, repo string, ok bool) {
	trimmed := strings.TrimPrefix(path, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) < 2 {
		return "", "", false
	}

	owner = parts[0]
	repo = strings.TrimSuffix(parts[1], ".git")

	if owner == "" || repo == "" || repo == parts[1] {
		return "", "", false
	}

	return owner, repo, true
}

// isPushRequest reports whether the git-over-HTTP request is a push
// (advertisement or the receive-pack call itself).
func isPushRequest(r *http.Request, path string) bool {
	if r.Method == http.MethodGet && strings.HasSuffix(path, "/info/refs") &&
		r.URL.Query().Get("service") == "git-receive-pack" {
		return true
	}

	if r.Method == http.MethodPost && strings.HasSuffix(path, "/git-receive-pack") {
		return true
	}

	return false
}

// gitRequestAuthorized decides whether a git-over-HTTP request may proceed,
// and returns the identity to expose to git-http-backend as REMOTE_USER.
//
// Two accepted credentials:
//
//   - A trusted reverse proxy that already authenticated the request, which
//     signals with proxyUserHeader.
//   - A better-auth session cookie on the request itself, which is how a
//     browser-driven or cookie-carrying client authenticates.
//
// An empty identity means anonymous, and an anonymous request is only ever
// allowed to read a repository whose visibility is public.
func gitRequestAuthorized(r *http.Request, info *database.RepoInfo, push bool) (string, bool) {
	// Trusted proxy credential. The proxy is the authorization boundary here.
	if user := r.Header.Get(proxyUserHeader); user != "" {
		return user, true
	}

	// Session credential.
	if user, err := authenticate(r); err == nil {
		// A public repository is readable by any authenticated caller, and so
		// is a push checked below. A private one requires membership for both,
		// which the read branch used to skip entirely.
		if info.Visibility {
			return user.Name, true
		}

		member, err := database.IsRepoMember(info.ID, user.ID)
		if err != nil {
			log.Printf("[WARN] git: membership check failed for repo %d: %v", info.ID, err)
			return "", false
		}

		if !member {
			return "", false
		}

		return user.Name, true
	}

	// Anonymous. Reads of public repositories only; pushes are never allowed.
	if push || !info.Visibility {
		return "", false
	}

	return "", true
}

// GitHandler godoc
//
//	@Summary		Git HTTP backend
//	@Description	Passthrough to git-http-backend CGI for git clone/push operations
//	@Tags			Git
//	@Produce		application/x-git-upload-pack-result
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name (with .git suffix)"
//	@Param			*		query		string	false	"Git CGI query parameters"
//	@Success		200		{string}	string
//	@Failure		401		{string}	string
//	@Failure		403		{string}	string
//	@Failure		404		{string}	string
//	@Failure		500		{string}	string
//	@Router			/git/{owner}/{repo}.git [get]
//	@Router			/git/{owner}/{repo}.git [post]
func GitHandler(w http.ResponseWriter, r *http.Request) {
	// Remove the /git prefix
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/git")

	owner, name, ok := repoFromGitPath(r.URL.Path)
	if !ok || !ValidNamespace(owner) || !ValidNamespace(name) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	push := isPushRequest(r, r.URL.Path)

	info, err := database.GetRepository(owner, name)
	if err != nil {
		// Do not distinguish "no such repository" from "not visible to you".
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	// Archived repositories are read-only: refuse push attempts (including the
	// ref advertisement git clients make before sending objects) with an HTTP
	// 403 so the client reports the failure cleanly.
	if push && info.Archived {
		http.Error(w, "this repository has been archived and is read-only", http.StatusForbidden)
		return
	}

	remoteUser, allowed := gitRequestAuthorized(r, info, push)
	if !allowed {
		if push {
			http.Error(w, "authentication required to push", http.StatusUnauthorized)
		} else {
			http.Error(w, "authentication required to read this repository", http.StatusUnauthorized)
		}

		return
	}

	gitBackend := os.Getenv("GIT_HTTP_BACKEND")
	if gitBackend == "" {
		http.Error(w, "git http backend is not configured", http.StatusInternalServerError)
		return
	}

	// git-http-backend refuses to serve a directory that is neither covered by
	// GIT_HTTP_EXPORT_ALL nor marked with git-daemon-export-ok. We do not set
	// the blanket export, so ensure the per-repository marker exists. The
	// request is already authorized at this point; the marker is not what
	// grants access.
	if err := gitrepo.EnsureExportable(owner, name); err != nil {
		log.Printf("[WARN] git: could not create export marker for %s/%s: %v", owner, name, err)
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	reposPath := os.Getenv("REPOS_PATH")
	if reposPath == "" {
		reposPath = config.App.ReposPath
	}

	env := []string{
		"GIT_PROJECT_ROOT=" + reposPath,
		"PATH_INFO=" + r.URL.Path,
		"REQUEST_METHOD=" + r.Method,
		"QUERY_STRING=" + r.URL.RawQuery,
	}

	// GIT_HTTP_EXPORT_ALL is deliberately not set. Setting it (even to the
	// empty string) tells git-http-backend to skip its own authentication,
	// which is what previously allowed anonymous access to every repository.
	// Leaving it unset restores the backend's credential check.
	//
	// REMOTE_USER is passed only for authenticated requests, so the backend
	// sees an anonymous fetch when the request is anonymous.
	if remoteUser != "" {
		env = append(env, "REMOTE_USER="+remoteUser)
	}

	log.Printf("[INFO] git %s %s (push=%t authenticated=%t)", r.Method, r.URL.Path, push, remoteUser != "")

	handler := &cgi.Handler{
		Path: gitBackend,
		Env:  env,
	}

	handler.ServeHTTP(w, r)
}
