package handlers

import (
	"backend/internal/gitrepo"
	"encoding/base64"
	"net/http"
	"strings"
)

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
