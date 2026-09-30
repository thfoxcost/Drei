package handlers

import (
	"backend/internal/database"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// validThemes is the set of theme values accepted by the API.
var validThemes = map[string]bool{
	"light":  true,
	"dark":   true,
	"system": true,
}

// validLanguages is the set of language codes accepted by the API.
// These must stay in sync with `SUPPORTED_LOCALES` in the client's
// `src/i18n/config.ts`; the client ships the translations, the server only
// validates the code. Add new languages here as they become available.
var validLanguages = map[string]bool{
	"en": true,
	"de": true,
	// Future: "ar", "fr"
}

// AppearanceResponse is the JSON shape returned by GET /api/user/appearance.
type AppearanceResponse struct {
	Theme               string `json:"theme"`
	Language            string `json:"language"`
	HeatmapProfileColor bool   `json:"heatmapProfileColor"`
	TodosEnabled        bool   `json:"todosEnabled"`
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
//	@Param			appearance	body		object	true	"Theme (light|dark|system) and language (en|de)"
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
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	switch r.Method {
	case http.MethodGet:
		handleGetAppearance(w, user)
	case http.MethodPut:
		handlePutAppearance(w, r, user)
	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

func handleGetAppearance(w http.ResponseWriter, user *AuthUser) {
	var theme, language string
	var heatmapProfileColor, todosEnabled bool

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT appearance_theme, appearance_language, appearance_heatmap_profile_color, todos_enabled FROM "user" WHERE id = $1`,
		user.ID,
	).Scan(&theme, &language, &heatmapProfileColor, &todosEnabled)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_load_appearance", "failed to load appearance")
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
		TodosEnabled:        todosEnabled,
	})
}

func handlePutAppearance(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	// Every field is optional: each settings tab sends only the preference it
	// owns, so a missing field means "leave the stored value untouched".
	var req struct {
		Theme               *string `json:"theme"`
		Language            *string `json:"language"`
		HeatmapProfileColor *bool   `json:"heatmapProfileColor"`
		TodosEnabled        *bool   `json:"todosEnabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	if req.Theme != nil && !validThemes[*req.Theme] {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_theme", "invalid theme")
		return
	}

	if req.Language != nil && !validLanguages[*req.Language] {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_language", "invalid language")
		return
	}

	sets := []string{}
	args := []any{}

	set := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s = $%d", column, len(args)))
	}

	if req.Theme != nil {
		set("appearance_theme", *req.Theme)
	}

	if req.Language != nil {
		set("appearance_language", *req.Language)
	}

	if req.HeatmapProfileColor != nil {
		set("appearance_heatmap_profile_color", *req.HeatmapProfileColor)
	}

	if req.TodosEnabled != nil {
		set("todos_enabled", *req.TodosEnabled)
	}

	if len(sets) == 0 {
		writeErrorCoded(w, http.StatusBadRequest, "no_settings_provided", "no settings provided")
		return
	}

	args = append(args, user.ID)

	query := `UPDATE "user" SET ` + strings.Join(sets, ", ") +
		fmt.Sprintf(" WHERE id = $%d", len(args))

	tag, err := database.DB.Exec(context.Background(), query, args...)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_save_appearance", "failed to save appearance")
		return
	}

	rows := tag.RowsAffected()
	if rows == 0 {
		writeErrorCoded(w, http.StatusNotFound, "user_not_found", "user not found")
		return
	}

	resp := map[string]any{"success": true}

	if req.Theme != nil {
		resp["theme"] = *req.Theme
	}

	if req.Language != nil {
		resp["language"] = *req.Language
	}

	if req.HeatmapProfileColor != nil {
		resp["heatmapProfileColor"] = *req.HeatmapProfileColor
	}

	if req.TodosEnabled != nil {
		resp["todosEnabled"] = *req.TodosEnabled
	}

	writeSuccess(w, resp)
}
