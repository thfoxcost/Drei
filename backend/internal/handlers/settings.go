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

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]any{
		"success": false,
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

	if err := database.UpdateRepositoryVisibility(owner, repo, req.Visibility); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success":    true,
		"visibility": req.Visibility,
	})
}
