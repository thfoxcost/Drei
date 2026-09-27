package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
)

// canViewBackup enforces the same view rules as the repository itself, which
// are defined once in canViewRepository. Running a backup is open to anyone
// with read access; the bundle is a copy of the repository, so it must not be
// more available than the repository is.
func canViewBackup(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	return authorizeOrgRepoView(w, r, info)
}

// requireBackupToggle restricts enable/disable to the repository owner (or an
// organization owner/admin). Running a backup is open to anyone with access,
// but flipping the feature itself stays privileged.
func requireBackupToggle(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	if info.OrganizationID != nil {
		return authorizeOrgRepo(w, r, info, "admin")
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return false
	}

	if user.ID != info.OwnerID {
		writeError(w, http.StatusForbidden, "only the repository owner can manage backups")
		return false
	}

	return true
}

// backupStatus builds the status payload shared by the status and run
// responses. isLatest is true only when backups are enabled, a snapshot
// exists, and its commit matches the current HEAD.
func backupStatus(info *database.RepoInfo, enabled bool) map[string]any {
	status := map[string]any{
		"success":      true,
		"enabled":      enabled,
		"isLatest":     false,
		"lastBackupAt": "",
		"commitHash":   "",
		"size":         0,
	}

	if !enabled {
		return status
	}

	backup, err := database.GetLatestBackup(info.ID)
	if err != nil || backup == nil {
		return status
	}

	head, err := gitrepo.HeadHash(info.Owner, info.Name)
	if err != nil {
		return status
	}

	status["lastBackupAt"] = backup.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
	status["commitHash"] = backup.CommitHash
	status["size"] = backup.SizeBytes
	status["isLatest"] = backup.CommitHash == head

	return status
}

// BackupStatusHandler godoc
//
//	@Summary		Get repository backup status
//	@Description	Returns whether backups are enabled and whether the retained snapshot matches HEAD
//	@Tags			Backups
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/backup/status [get]
func BackupStatusHandler(w http.ResponseWriter, r *http.Request) {
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

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
		return
	}

	if !canViewBackup(w, r, info) {
		return
	}

	enabled, err := database.IsBackupEnabled(owner, repo)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, backupStatus(info, enabled))
}

// BackupToggleHandler godoc
//
//	@Summary		Enable or disable repository backups
//	@Description	Flips the per-repository backup opt-in flag
//	@Tags			Backups
//	@Accept			json
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			backup	body		object	true	"Backup setting"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/backup [post]
func BackupToggleHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
		return
	}

	if !requireBackupToggle(w, r, info) {
		return
	}

	var req struct {
		Enabled bool `json:"enabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := database.SetBackupEnabled(owner, repo, req.Enabled); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"enabled": req.Enabled,
	})
}

// BackupRunHandler godoc
//
//	@Summary		Create a repository backup
//	@Description	Builds a verified git bundle snapshot and installs it as the retained backup
//	@Tags			Backups
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/backup/run [post]
func BackupRunHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
		return
	}

	if !canViewBackup(w, r, info) {
		return
	}

	// Anyone with access may run a backup, but the request must belong to a
	// signed-in user so anonymous visitors cannot trigger disk writes.
	if _, err := authenticate(r); err != nil {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return
	}

	enabled, err := database.IsBackupEnabled(owner, repo)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !enabled {
		writeError(w, http.StatusConflict, "backups are disabled for this repository")
		return
	}

	// RunBackup only replaces the previous bundle after the new one is built
	// and verified, so a failed run keeps the old backup intact.
	hash, size, path, err := gitrepo.RunBackup(owner, repo)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// The bundle is already installed at this point; if the metadata upsert
	// below fails the next status check reports isLatest=false (stored hash
	// still differs from HEAD) so the user can simply retry.
	if _, err := database.UpsertBackup(info.ID, path, hash, size); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, backupStatus(info, true))
}
