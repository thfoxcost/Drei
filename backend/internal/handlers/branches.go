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
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	branch := strings.TrimSpace(r.PathValue("branch"))
	if branch == "" {
		writeErrorCoded(w, http.StatusBadRequest, "branch_name_required", "branch name is required")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "sign_in_required", "you must be signed in")
		return
	}

	member, err := database.IsRepoMember(info.ID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeErrorCoded(w, http.StatusForbidden, "contributor_required", "you must be a contributor of this repository")
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
