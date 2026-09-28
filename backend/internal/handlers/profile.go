package handlers

import (
	"backend/internal/database"
	"context"
	"encoding/json"
	"net/http"
)

type ProfileData struct {
	Name             string  `json:"name"`
	Email            string  `json:"email"`
	Profession       *string `json:"profession"`
	Biography        *string `json:"biography"`
	Description      *string `json:"description"`
	Country          *string `json:"country"`
	QuotePersonName  *string `json:"quotePersonName"`
	QuoteText        *string `json:"quoteText"`
	QuotePersonTitle *string `json:"quotePersonTitle"`
	QuotePersonImage *string `json:"quotePersonImage"`
	QuoteVerified    bool    `json:"quoteVerified"`
}

// ProfileHandler godoc
//
//	@Summary		Get user profile
//	@Description	Returns the authenticated user's full profile
//	@Tags			Users
//	@Produce		json
//	@Success		200	{object}	handlers.ProfileData
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/profile [get]
//
//	@Summary		Update user profile
//	@Description	Updates the authenticated user's profile fields
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			profile	body		handlers.ProfileData	true	"Profile fields to update"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/profile [patch]
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PATCH")

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
		handleGetProfile(w, user)
	case http.MethodPatch:
		handleUpdateProfile(w, r, user)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func handleGetProfile(w http.ResponseWriter, user *AuthUser) {
	var profile ProfileData

	err := database.DB.QueryRow(context.Background(), `
		SELECT name, email, profession, biography, description, country,
		       quote_person_name, quote_text, quote_person_title,
		       quote_person_image, quote_verified
		FROM "user"
		WHERE id = $1
	`, user.ID).Scan(
		&profile.Name, &profile.Email,
		&profile.Profession, &profile.Biography, &profile.Description, &profile.Country,
		&profile.QuotePersonName, &profile.QuoteText,
		&profile.QuotePersonTitle, &profile.QuotePersonImage,
		&profile.QuoteVerified,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch profile: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

func handleUpdateProfile(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req ProfileData

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	_, err := database.DB.Exec(context.Background(), `
		UPDATE "user"
		SET name = $1,
		    email = $2,
		    profession = $3,
		    biography = $4,
		    description = $5,
		    country = $6,
		    quote_person_name = $7,
		    quote_text = $8,
		    quote_person_title = $9,
		    quote_person_image = $10,
		    quote_verified = $11,
		    "updatedAt" = NOW()
		WHERE id = $12
	`,
		req.Name, req.Email,
		req.Profession, req.Biography, req.Description, req.Country,
		req.QuotePersonName, req.QuoteText,
		req.QuotePersonTitle, req.QuotePersonImage,
		req.QuoteVerified, user.ID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update profile: "+err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}
