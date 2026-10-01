package handlers

import (
	"backend/internal/database"
	"net/http"
	"net/http/cgi"
	"os"
	"strings"
)

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
//	@Failure		500		{string}	string
//	@Router			/git/{owner}/{repo}.git [get]
//	@Router			/git/{owner}/{repo}.git [post]
func GitHandler(w http.ResponseWriter, r *http.Request) {
	// Remove the /git prefix
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/git")

	// Pushes (receive-pack) always require authentication and repository
	// permission. Reads follow the same visibility rules as the API:
	// private repositories require the same permission as a push.
	// Unresolvable paths and unknown repositories fall through to
	// git-http-backend, which denies them as before.
	if owner, repo, ok := repoFromGitPath(r.URL.Path); ok {
		if info, err := database.GetRepository(owner, repo); err == nil {
			if isPushRequest(r, r.URL.Path) {
				// Archived repositories are read-only: refuse push attempts
				// (including the ref advertisement git clients make before
				// sending objects) with an HTTP 403 so the client reports
				// the failure cleanly.
				if info.Archived {
					http.Error(w, "this repository has been archived and is read-only", http.StatusForbidden)
					return
				}

				if !authorizeGitPush(w, r, info) {
					return
				}
			} else if !authorizeGitRead(w, r, info) {
				return
			}
		}
	}

	gitBackend := os.Getenv("GIT_HTTP_BACKEND")
	reposPath := os.Getenv("REPOS_PATH")

	handler := &cgi.Handler{
		Path: gitBackend,
		Env: []string{
			"GIT_PROJECT_ROOT=" + reposPath,
			"GIT_HTTP_EXPORT_ALL=",
			"PATH_INFO=" + r.URL.Path,
			"REQUEST_METHOD=" + r.Method,
			"QUERY_STRING=" + r.URL.RawQuery,
		},
	}

	handler.ServeHTTP(w, r)
}

// authorizeGitPush enforces push permission for git-over-HTTP: the caller
// must be signed in (via the better-auth session cookie, e.g. git
// `http.extraHeader` with `Cookie:`), and must hold repository permission —
// contributor membership on personal repositories, organization membership
// on organization repositories. It writes the denial itself.
func authorizeGitPush(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	user, err := authenticate(r)
	if err != nil {
		http.Error(w, "authentication required to push", http.StatusUnauthorized)
		return false
	}

	if info.OrganizationID != nil {
		return authorizeOrgRepo(w, r, info, "member")
	}

	return requireRepoMember(w, info, user, "contributor_required", "you must be a contributor of this repository to push")
}

// authorizeGitRead enforces repository visibility for git-over-HTTP reads
// (clone/fetch), mirroring the API read rules: organization-owned access is
// decided by authorizeOrgRepoView, and private personal repositories require
// the same contributor permission as a push. Public personal repositories
// stay openly readable.
func authorizeGitRead(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	if info.OrganizationID != nil {
		return authorizeOrgRepoView(w, r, info)
	}

	if info.Visibility {
		return true
	}

	user, err := authenticate(r)
	if err != nil {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return false
	}

	return requireRepoMember(w, info, user, "contributor_required", "you must be a contributor of this repository")
}
