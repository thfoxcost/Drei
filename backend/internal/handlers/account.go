package handlers

import (
	"backend/internal/database"
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// AccountInfo is the response shape for GET /api/user/account.
type AccountInfo struct {
	Email string `json:"email"`
}

// AccountHandler routes /api/user/account to the appropriate method.
func AccountHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PATCH, DELETE")

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
		handleGetAccount(w, user)
	case http.MethodPatch:
		handleUpdateEmail(w, r, user)
	case http.MethodDelete:
		handleDeleteAccount(w, r, user)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// AccountPasswordHandler handles POST /api/user/account/password.
func AccountPasswordHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	handleChangePassword(w, r, user)
}

// handleGetAccount returns the authenticated user's email.
func handleGetAccount(w http.ResponseWriter, user *AuthUser) {
	var email string

	err := database.DB.QueryRow(context.Background(), `
		SELECT email FROM "user" WHERE id = $1
	`, user.ID).Scan(&email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch account")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AccountInfo{Email: email})
}

// handleUpdateEmail updates the authenticated user's email.
func handleUpdateEmail(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	email := strings.TrimSpace(req.Email)
	if email == "" {
		writeError(w, http.StatusBadRequest, "email is required")
		return
	}

	_, err := database.DB.Exec(context.Background(), `
		UPDATE "user" SET email = $1, updated_at = NOW() WHERE id = $2
	`, email, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update email")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"email":   email,
	})
}

// handleChangePassword verifies the current password and sets a new one.
func handleChangePassword(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CurrentPassword == "" {
		writeError(w, http.StatusBadRequest, "current password is required")
		return
	}

	if req.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "new password is required")
		return
	}

	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "new password must be at least 8 characters")
		return
	}

	// Fetch the current password hash from the account table.
	var passwordHash *string

	err := database.DB.QueryRow(context.Background(), `
		SELECT password FROM account WHERE user_id = $1 AND provider_id = 'credential'
	`, user.ID).Scan(&passwordHash)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify account")
		return
	}

	if passwordHash == nil || *passwordHash == "" {
		writeError(w, http.StatusBadRequest, "no password set for this account")
		return
	}

	// Verify current password against stored hash.
	if err := bcrypt.CompareHashAndPassword([]byte(*passwordHash), []byte(req.CurrentPassword)); err != nil {
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	// Hash the new password.
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	// Update the password in the account table.
	_, err = database.DB.Exec(context.Background(), `
		UPDATE account SET password = $1, updated_at = NOW() WHERE user_id = $2 AND provider_id = 'credential'
	`, string(newHash), user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

// handleDeleteAccount deletes the authenticated user after password verification.
func handleDeleteAccount(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}

	// Fetch the current password hash.
	var passwordHash *string

	err := database.DB.QueryRow(context.Background(), `
		SELECT password FROM account WHERE user_id = $1 AND provider_id = 'credential'
	`, user.ID).Scan(&passwordHash)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify account")
		return
	}

	if passwordHash == nil || *passwordHash == "" {
		writeError(w, http.StatusBadRequest, "no password set for this account")
		return
	}

	// Verify password.
	if err := bcrypt.CompareHashAndPassword([]byte(*passwordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "incorrect password")
		return
	}

	// Delete the user. Cascading deletes will remove sessions, accounts, etc.
	_, err = database.DB.Exec(context.Background(), `
		DELETE FROM "user" WHERE id = $1
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete account")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}
