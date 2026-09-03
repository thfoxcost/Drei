package handlers

import (
	"backend/internal/gitrepo"
	"encoding/base64"
	"net/http"
	"strings"
)

// RawHandler godoc
//
//	@Summary		Get raw file content
//	@Description	Returns the raw file content as plain text
//	@Tags			Files
//	@Produce		plain
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			branch	path		string	true	"Branch name"
//	@Param			path	path		string	true	"File path within the repository"
//	@Success		200		{string}	string
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/raw/{branch}/{path} [get]
func RawHandler(w http.ResponseWriter, r *http.Request) {
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

	decoded, err := base64.StdEncoding.DecodeString(file.Content)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to decode file content")
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Content-Disposition", "inline; filename=\""+file.Name+"\"")
	w.Write(decoded)
}
