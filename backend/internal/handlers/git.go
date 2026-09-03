package handlers

import (
	"backend/internal/database"
	"fmt"
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
//	@Failure		403		{string}	string
//	@Failure		500		{string}	string
//	@Router			/git/{owner}/{repo}.git [get]
//	@Router			/git/{owner}/{repo}.git [post]
func GitHandler(w http.ResponseWriter, r *http.Request) {
	// Remove the /git prefix
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/git")

	// Archived repositories are read-only: refuse push attempts (including the
	// ref advertisement git clients make before sending objects) with an HTTP
	// 403 so the client reports the failure cleanly.
	if isPushRequest(r, r.URL.Path) {
		if owner, repo, ok := repoFromGitPath(r.URL.Path); ok {
			info, err := database.GetRepository(owner, repo)
			if err == nil && info.Archived {
				http.Error(w, "this repository has been archived and is read-only", http.StatusForbidden)
				return
			}
		}
	}

	gitBackend := os.Getenv("GIT_HTTP_BACKEND")
	reposPath := os.Getenv("REPOS_PATH")

	fmt.Println("Method:", r.Method)
	fmt.Println("Path:", r.URL.Path)
	fmt.Println("Query:", r.URL.RawQuery)

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
