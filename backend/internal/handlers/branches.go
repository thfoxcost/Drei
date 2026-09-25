package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"net/http"
	"strings"
)

// BranchHandler deletes a single branch from a repository.
//
//	DELETE /api/repos/{owner}/{repo}/branches/{branch...}
//
// Uses safe deletion (git branch -d): unmerged branches are rejected. The
// default/HEAD branch can never be deleted, even when called directly.
func BranchHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	branch := strings.TrimSpace(r.PathValue("branch"))
	if branch == "" {
		writeError(w, http.StatusBadRequest, "branch name is required")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in")
		return
	}

	member, err := database.IsRepoMember(info.ID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository")
		return
	}

	if err := gitrepo.DeleteBranch(info.Owner, info.Name, branch); err != nil {
		if strings.Contains(err.Error(), "cannot delete the default branch") {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		if strings.Contains(err.Error(), "not fully merged") {
			writeError(w, http.StatusConflict, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}
