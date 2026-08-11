package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"strings"
)

// CollaboratorsHandler manages the collaborators of a repository.
//
//	GET    /api/repos/{owner}/{repo}/collaborators -> users that can be added
//	POST   /api/repos/{owner}/{repo}/collaborators -> add a collaborator
//	DELETE /api/repos/{owner}/{repo}/collaborators -> remove a collaborator
func CollaboratorsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST, DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
		return
	}

	switch r.Method {
	case http.MethodGet:
		candidates, err := database.GetCollaboratorCandidates(info.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if candidates == nil {
			candidates = []database.Contributor{}
		}

		writeSuccess(w, map[string]any{"users": candidates})

	case http.MethodPost:
		var req database.Contributor

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Username = strings.TrimSpace(req.Username)

		if req.Username == "" {
			writeError(w, http.StatusBadRequest, "username is required")
			return
		}

		// The owner can never be re-added as a collaborator; they already own
		// the repository and always stay in the contributors table.
		if strings.EqualFold(req.Username, info.Owner) {
			writeError(w, http.StatusBadRequest, "cannot add the repository owner")
			return
		}

		if err := database.CreateContributor(info.ID, req); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	case http.MethodDelete:
		var req struct {
			Username string `json:"username"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Username = strings.TrimSpace(req.Username)

		if req.Username == "" {
			writeError(w, http.StatusBadRequest, "username is required")
			return
		}

		if strings.EqualFold(req.Username, info.Owner) {
			writeError(w, http.StatusBadRequest, "cannot remove the repository owner")
			return
		}

		if err := database.DeleteContributor(info.ID, req.Username); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
