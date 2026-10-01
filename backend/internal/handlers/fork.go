package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

// ForksHandler returns the fork count and the list of users who forked a
// repository. The current user's fork status is also included so the frontend
// can disable the fork button appropriately.
//
//	GET /api/repos/{owner}/{repo}/forks
//
//	@Summary		List repository forks
//	@Description	Returns the fork count, list of fork owners, and current user's fork status
//	@Tags			Repositories
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/forks [get]
func ForksHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	sourceOwner := r.PathValue("owner")
	sourceRepoName := r.PathValue("repo")

	sourceInfo, err := database.GetRepository(sourceOwner, sourceRepoName)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	count, owners, err := database.GetForks(sourceInfo.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Resolve the current user (may be nil for unauthenticated requests).
	user, _ := authenticate(r)

	var hasFork bool

	if user != nil {
		hasFork, _ = database.HasUserFork(user.ID, sourceInfo.ID)
	}

	writeSuccess(w, map[string]any{
		"count":   count,
		"forks":   owners,
		"hasFork": hasFork,
	})
}

// ForkHandler creates a real Git fork of a repository. It authenticates the
// current user, clones the bare repo, inserts the forked repository row with
// a forked_from_id back-reference, and adds the user as a contributor.
//
//	POST /api/repos/{owner}/{repo}/fork
//
//	@Summary		Fork a repository
//	@Description	Creates a Git fork of a repository for the authenticated user
//	@Tags			Repositories
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/repos/{owner}/{repo}/fork [post]
func ForkHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	// ── 1. Authenticate ────────────────────────────────────────────────
	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "authentication_required", "authentication required")
		return
	}

	// ── 2. Find source repository ──────────────────────────────────────
	sourceOwner := r.PathValue("owner")
	sourceRepoName := r.PathValue("repo")

	sourceInfo, err := database.GetRepository(sourceOwner, sourceRepoName)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	// ── 3. Reject if user is the owner ─────────────────────────────────
	if user.ID == sourceInfo.OwnerID {
		writeErrorCoded(w, http.StatusConflict, "cannot_fork_own_repository", "you cannot fork your own repository")
		return
	}

	// ── 4. Check for existing fork ─────────────────────────────────────
	hasFork, err := database.HasUserFork(user.ID, sourceInfo.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if hasFork {
		writeErrorCoded(w, http.StatusConflict, "fork_already_exists", "you already have a fork of this repository")
		return
	}

	// ── 5. Determine fork name (keep original when possible) ───────────
	forkName := sourceRepoName

	// If the user already owns a repo with that name, append "-fork".
	_, nameErr := database.GetRepository(user.Name, forkName)
	if nameErr == nil {
		// Name exists — try with "-fork" suffix.
		forkName = sourceRepoName + "-fork"

		_, forkErr := database.GetRepository(user.Name, forkName)
		if forkErr == nil {
			// Still taken — fall back to a unique name with a short suffix.
			forkName = fmt.Sprintf("%s-fork-%d", sourceRepoName, sourceInfo.ID)
		}
	}

	// ── 6. Clone the bare repository ───────────────────────────────────
	userPath := filepath.Join(config.App.ReposPath, user.Name)
	forkPath := filepath.Join(userPath, forkName+".git")

	gitrepo.CreateReposDIR(config.App.ReposPath)
	gitrepo.CreateUserDIR(userPath)

	if err := gitrepo.ForkBareRepo(sourceInfo.Path, forkPath); err != nil {
		// Clean up on failure.
		_ = os.RemoveAll(forkPath)
		writeError(w, http.StatusInternalServerError, "failed to create fork: "+err.Error())
		return
	}

	// ── 7. Insert the forked repository row ────────────────────────────
	newRepoID, err := database.CreateForkRepository(database.Repository{
		Name:          forkName,
		OwnerID:       user.ID,
		Owner:         user.Name,
		Description:   sourceInfo.Description,
		Visibility:    sourceInfo.Visibility,
		Path:          forkPath,
		DefaultBranch: sourceInfo.DefaultBranch,
	}, sourceInfo.ID)

	if err != nil {
		// Clean up the cloned repo on DB failure.
		_ = os.RemoveAll(forkPath)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// ── 8. Add the forking user as the first contributor ───────────────
	if _, err := database.CreateContributor(newRepoID, database.Contributor{
		ID:       user.ID,
		Username: user.Name,
		Avatar:   user.Image,
	}); err != nil {
		// Non-fatal: log but don't fail the fork.
		fmt.Printf("[WARN] failed to add contributor for fork %s/%s: %v\n", user.Name, forkName, err)
	}

	// ── 9. Return success ──────────────────────────────────────────────
	writeSuccess(w, map[string]any{
		"success":  true,
		"message":  "Repository forked successfully",
		"owner":    user.Name,
		"name":     forkName,
		"cloneUrl": fmt.Sprintf("http://localhost:3200/git/%s/%s.git", user.Name, forkName),
	})
}
