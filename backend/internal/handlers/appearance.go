package handlers

import (
	"backend/internal/database"
	"context"
	"encoding/json"
	"net/http"
)

// validThemes is the set of theme values accepted by the API.
var validThemes = map[string]bool{
	"light":  true,
	"dark":   true,
	"system": true,
}

// validLanguages is the set of language codes accepted by the API.
// Add new languages here as they become available.
var validLanguages = map[string]bool{
	"en": true,
	// Future: "ar", "fr", "de"
}

// AppearanceResponse is the JSON shape returned by GET /api/user/appearance.
type AppearanceResponse struct {
	Theme    string `json:"theme"`
	Language string `json:"language"`
}

// AppearanceHandler serves GET and PUT /api/user/appearance.
func AppearanceHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PUT")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGetAppearance(w, user)
	case http.MethodPut:
		handlePutAppearance(w, r, user)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleGetAppearance(w http.ResponseWriter, user *AuthUser) {
	var theme, language string

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT appearance_theme, appearance_language FROM "user" WHERE id = $1`,
		user.ID,
	).Scan(&theme, &language)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load appearance")
		return
	}

	if theme == "" {
		theme = "system"
	}
	if language == "" {
		language = "en"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AppearanceResponse{
		Theme:    theme,
		Language: language,
	})
}

func handlePutAppearance(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		Theme    string `json:"theme"`
		Language string `json:"language"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if !validThemes[req.Theme] {
		writeError(w, http.StatusBadRequest, "invalid theme")
		return
	}

	if !validLanguages[req.Language] {
		writeError(w, http.StatusBadRequest, "invalid language")
		return
	}

	tag, err := database.DB.Exec(
		context.Background(),
		`UPDATE "user" SET appearance_theme = $1, appearance_language = $2 WHERE id = $3`,
		req.Theme,
		req.Language,
		user.ID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save appearance")
		return
	}

	rows := tag.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeSuccess(w, map[string]any{
		"success":  true,
		"theme":    req.Theme,
		"language": req.Language,
	})
}
