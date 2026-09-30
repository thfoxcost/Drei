package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"net/http"
	"strings"
)

// DownloadHandler serves the repository contents as a zip or tar.gz archive
// built from the current ref (a branch, tag, or commit SHA selected with the
// "ref" query parameter; the legacy "branch" parameter still works).
//
//	@Summary		Download repository archive
//	@Description	Downloads a repository as a zip or tar.gz archive
//	@Tags			Repositories
//	@Produce		application/zip
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			ref		query		string	false	"Branch, tag, or commit SHA (defaults to default branch)"
//	@Param			branch	query		string	false	"Branch name, deprecated: use ref instead"
//	@Param			format	query		string	false	"Archive format: zip or tar.gz (defaults to zip)"
//	@Success		200		{file}		binary
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/download [get]
func DownloadHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	if _, err := database.GetRepository(owner, repo); err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	branch := effectiveRef(r)
	format := strings.ToLower(r.URL.Query().Get("format"))

	var gitFormat, contentType, filename string

	switch format {
	case "", "zip":
		gitFormat = "zip"
		contentType = "application/zip"
		filename = repo + ".zip"
	case "tar.gz", "targz":
		gitFormat = "tar.gz"
		contentType = "application/gzip"
		filename = repo + ".tar.gz"
	default:
		writeErrorCoded(w, http.StatusBadRequest, "unsupported_archive_format", "unsupported archive format")
		return
	}

	// Resolve the tree before streaming so errors (empty repository, missing
	// branch) are reported as a proper HTTP response instead of a broken file.
	if err := gitrepo.VerifyArchiveSource(owner, repo, branch); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", `attachment; filename="`+filename+`"`)
	w.Header().Set("X-Content-Type-Options", "nosniff")

	if err := gitrepo.WriteArchive(owner, repo, branch, gitFormat, w); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
}
