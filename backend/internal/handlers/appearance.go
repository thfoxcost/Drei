package handlers

import (
	"backend/internal/database"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
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
	Theme               string `json:"theme"`
	Language            string `json:"language"`
	HeatmapProfileColor bool   `json:"heatmapProfileColor"`
}

// AppearanceHandler serves GET and PUT /api/user/appearance.
//
//	@Summary		Get appearance settings
//	@Description	Returns the authenticated user's theme and language preferences
//	@Tags			Settings
//	@Produce		json
//	@Success		200	{object}	handlers.AppearanceResponse
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/user/appearance [get]
//
//	@Summary		Update appearance settings
//	@Description	Updates the authenticated user's theme and language preferences
//	@Tags			Settings
//	@Accept			json
//	@Produce		json
//	@Param			appearance	body		object	true	"Theme (light|dark|system) and language (en)"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/user/appearance [put]
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
	var heatmapProfileColor bool

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT appearance_theme, appearance_language, appearance_heatmap_profile_color FROM "user" WHERE id = $1`,
		user.ID,
	).Scan(&theme, &language, &heatmapProfileColor)
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
		Theme:               theme,
		Language:            language,
		HeatmapProfileColor: heatmapProfileColor,
	})
}

func handlePutAppearance(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		Theme               string `json:"theme"`
		Language            string `json:"language"`
		HeatmapProfileColor *bool  `json:"heatmapProfileColor"`
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

	// The profile-color toggle is optional so older clients that don't send
	// it leave the stored value untouched.
	query := `UPDATE "user" SET appearance_theme = $1, appearance_language = $2`
	args := []any{req.Theme, req.Language}

	if req.HeatmapProfileColor != nil {
		query += `, appearance_heatmap_profile_color = $3`
		args = append(args, *req.HeatmapProfileColor)
	}

	query += ` WHERE id = $` + strconv.Itoa(len(args)+1)
	args = append(args, user.ID)

	tag, err := database.DB.Exec(context.Background(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save appearance")
		return
	}

	rows := tag.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	resp := map[string]any{
		"success":  true,
		"theme":    req.Theme,
		"language": req.Language,
	}
	if req.HeatmapProfileColor != nil {
		resp["heatmapProfileColor"] = *req.HeatmapProfileColor
	}

	writeSuccess(w, resp)
}
