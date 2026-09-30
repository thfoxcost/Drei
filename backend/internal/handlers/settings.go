package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"time"
)

func writeSuccess(w http.ResponseWriter, payload map[string]any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

// ErrCodeUnknown is the code emitted by writeError when the caller does not
// supply a stable one. The client only translates known codes, so an
// uncoded error always falls back to the English `error` text.
const ErrCodeUnknown = "unknown"

// writeError emits the legacy shape: a human-readable English message only.
//
// It now also emits a `code` field so the client response shape is uniform
// across every endpoint. Callers that surface a message the UI needs to
// translate should use writeErrorCoded instead.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeErrorCoded(w, status, ErrCodeUnknown, msg)
}

// writeErrorCoded emits `{"success": false, "code": "...", "error": "..."}`.
//
// `code` is a stable, machine-readable identifier (lower_snake_case) that the
// client maps to a translated message. `msg` stays as the English fallback so
// older clients and API consumers keep working unchanged.
func writeErrorCoded(w http.ResponseWriter, status int, code string, msg string) {
	if code == "" {
		code = ErrCodeUnknown
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"code":    code,
		"error":   msg,
	})
}

func setCORS(w http.ResponseWriter, r *http.Request, methods string) {
	// Echo the request origin instead of using "*" so credentialed requests
	// (the better-auth session cookie) are allowed by the browser.
	origin := r.Header.Get("Origin")

	if origin == "" {
		origin = "*"
	}

	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", methods+", OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Vary", "Origin")
}

func handleOptions(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// ArchiveHandler godoc
//
//	@Summary		Archive or unarchive a repository
//	@Description	Sets the archived state of a repository
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			archive	body		object	true	"Archived state"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/archive [post]
func ArchiveHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	var req struct {
		Archived bool `json:"archived"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	// Organization repositories require an owner/admin role to archive.
	if !authorizeOrgRepo(w, r, info, "admin") {
		return
	}

	var archivedAt *time.Time
	if req.Archived {
		now := time.Now()
		archivedAt = &now
	}

	if err := database.UpdateRepositoryArchived(owner, repo, req.Archived, archivedAt); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success":  true,
		"archived": req.Archived,
	})
}

// VisibilityHandler godoc
//
//	@Summary		Update repository visibility
//	@Description	Sets the visibility (public/private) of a repository
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			owner		path		string	true	"Repository owner"
//	@Param			repo		path		string	true	"Repository name"
//	@Param			visibility	body		object	true	"Visibility setting"
//	@Success		200			{object}	map[string]interface{}
//	@Failure		400			{object}	map[string]interface{}
//	@Failure		500			{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/visibility [post]
func VisibilityHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	var req struct {
		Visibility bool `json:"visibility"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	// Organization repositories require an owner/admin role to change visibility.
	if !authorizeOrgRepo(w, r, info, "admin") {
		return
	}

	if err := database.UpdateRepositoryVisibility(owner, repo, req.Visibility); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success":    true,
		"visibility": req.Visibility,
	})
}
