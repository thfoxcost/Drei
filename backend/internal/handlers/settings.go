package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func writeSuccess(w http.ResponseWriter, payload map[string]any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"error":   msg,
	})
}

// setCORS emits CORS headers only for origins on the allowlist.
//
// The previous implementation echoed whatever Origin the request carried and
// always set Access-Control-Allow-Credentials, which is worse than a wildcard:
// any site a signed-in user visited could issue credentialed requests against
// the API and read the responses.
//
// The allowlist is the origin of CLIENT_URL, the same value used to resolve
// sessions. A deployment that serves the API from a different origin than the
// client must therefore set CLIENT_URL to the public client origin.
//
// Requests without an Origin header (same-origin navigation, curl, server-side
// calls) get no CORS headers, which is correct: CORS only constrains browsers.
func setCORS(w http.ResponseWriter, r *http.Request, methods string) {
	w.Header().Add("Vary", "Origin")

	origin := r.Header.Get("Origin")
	if origin == "" {
		return
	}

	if !originAllowed(origin) {
		// No headers at all: the browser blocks the response, and we do not
		// hand the caller an origin it can read.
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", origin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", methods+", OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// originAllowed reports whether origin matches the configured client origin.
// Comparison is exact on scheme, host and port after normalising a trailing
// slash, so a look-alike host cannot satisfy the check.
func originAllowed(origin string) bool {
	allowed, err := url.Parse(config.App.ClientURL)
	if err != nil || allowed.Host == "" {
		return false
	}

	requested, err := url.Parse(origin)
	if err != nil {
		return false
	}

	return strings.EqualFold(requested.Scheme, allowed.Scheme) &&
		strings.EqualFold(requested.Host, allowed.Host)
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
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req struct {
		Archived bool `json:"archived"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
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
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req struct {
		Visibility bool `json:"visibility"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
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
