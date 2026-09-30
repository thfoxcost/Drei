package handlers

import (
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
)

// CommitHandler godoc
//
//	@Summary		Get commit details
//	@Description	Returns detailed metadata and diffs for a specific commit
//	@Tags			Commits
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			hash	path		string	true	"Commit hash (full or short)"
//	@Success		200		{object}	gitrepo.CommitDetail
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/commits/{hash} [get]
func CommitHandler(w http.ResponseWriter, r *http.Request) {
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
	hash := r.PathValue("hash")

	if owner == "" || repo == "" || hash == "" {
		writeErrorCoded(w, http.StatusBadRequest, "missing_required_path_parameters", "missing required path parameters")
		return
	}

	commit, err := gitrepo.GetCommitDetail(owner, repo, hash)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "commit_not_found", "commit not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(commit); err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_encode_response", "failed to encode response")
		return
	}
}
