package handlers

import (
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
	"strings"
)

// BlobHandler godoc
//
//	@Summary		Get file blob
//	@Description	Returns file content and metadata for a specific file in a repository
//	@Tags			Files
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			branch	path		string	true	"Branch, tag, or commit SHA"
//	@Param			path	path		string	true	"File path within the repository"
//	@Success		200		{object}	gitrepo.BlobFile
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/blob/{branch}/{path} [get]
func BlobHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")
	branch := r.PathValue("branch")
	filePath := r.PathValue("path")
	filePath = strings.TrimPrefix(filePath, "/")

	if owner == "" || repo == "" || filePath == "" {
		writeError(w, http.StatusBadRequest, "missing required parameters")
		return
	}

	file, err := gitrepo.GetFile(owner, repo, branch, filePath)
	if err != nil {
		writeError(w, http.StatusNotFound, "file not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(file); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
}
