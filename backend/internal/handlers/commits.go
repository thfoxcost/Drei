package handlers

import (
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
)

func CommitHandler(w http.ResponseWriter, r *http.Request) {
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
	hash := r.PathValue("hash")

	if owner == "" || repo == "" || hash == "" {
		writeError(w, http.StatusBadRequest, "missing required path parameters")
		return
	}

	commit, err := gitrepo.GetCommitDetail(owner, repo, hash)
	if err != nil {
		writeError(w, http.StatusNotFound, "commit not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(commit); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to encode response")
		return
	}
}
