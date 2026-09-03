package handlers

import (
	"backend/internal/database"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Webhook represents a stored webhook notification configuration.
type Webhook struct {
	ID           int64   `json:"id"`
	UserID       string  `json:"user_id"`
	RepositoryID *int64  `json:"repository_id"`
	Type         string  `json:"type"`
	EncodedURL   string  `json:"encoded_url"`
	Enabled      bool    `json:"enabled"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

// NotificationsHandler routes /api/notifications to the appropriate method.
//
//	@Summary		List notification webhooks
//	@Description	Returns all webhooks for the authenticated user
//	@Tags			Notifications
//	@Produce		json
//	@Success		200	{object}	[]handlers.Webhook
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications [get]
//
//	@Summary		Create a notification webhook
//	@Description	Creates a new webhook for the authenticated user
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			webhook	body		object	true	"Webhook configuration (type, encoded_url, repository_id)"
//	@Success		201		{object}	handlers.Webhook
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications [post]
func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST, OPTIONS")

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
		handleListNotifications(w, user)
	case http.MethodPost:
		handleCreateNotification(w, r, user)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// NotificationItemHandler routes /api/notifications/{id} for PATCH and DELETE.
//
//	@Summary		Update a notification webhook
//	@Description	Updates a webhook's URL or enabled state
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			id			path		string	true	"Webhook ID"
//	@Param			webhook		body		object	true	"Fields to update (encoded_url, enabled)"
//	@Success		200			{object}	map[string]interface{}
//	@Failure		400			{object}	map[string]interface{}
//	@Failure		401			{object}	map[string]interface{}
//	@Failure		500			{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications/{id} [patch]
//
//	@Summary		Delete a notification webhook
//	@Description	Permanently deletes a webhook
//	@Tags			Notifications
//	@Produce		json
//	@Param			id	path		string	true	"Webhook ID"
//	@Success		200	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications/{id} [delete]
func NotificationItemHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "PATCH, DELETE, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id := r.PathValue("id")

	switch r.Method {
	case http.MethodPatch:
		handleUpdateNotification(w, r, user, id)
	case http.MethodDelete:
		handleDeleteNotification(w, user, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// NotificationTestHandler routes POST /api/notifications/test.
//
//	@Summary		Test a notification webhook
//	@Description	Sends a test notification to the specified webhook
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			test	body		object	true	"Test notification details (webhook_id, title, description)"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications/test [post]
func NotificationTestHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST, OPTIONS")

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

	var req struct {
		WebhookID   int64  `json:"webhook_id"`
		Title       string `json:"title"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Fetch the webhook and verify ownership.
	var encodedURL string
	var webhookType string

	err = database.DB.QueryRow(context.Background(), `
		SELECT encoded_url, type FROM webhooks
		WHERE id = $1 AND user_id = $2
	`, req.WebhookID, user.ID).Scan(&encodedURL, &webhookType)
	if err != nil {
		writeError(w, http.StatusNotFound, "webhook not found")
		return
	}

	decodedURL, err := base64.StdEncoding.DecodeString(encodedURL)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to decode webhook URL")
		return
	}

	if webhookType == "discord" {
		if err := sendDiscordNotification(normalizeWebhookURL(string(decodedURL)), req.Title, req.Description); err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to send notification: %v", err))
			return
		}
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

// NotificationSendHandler routes POST /api/notifications/send.
// It sends a notification to all matching webhooks for the authenticated user.
// Intended for future application event integration.
//
//	@Summary		Send a notification
//	@Description	Sends a notification to all matching webhooks for the user
//	@Tags			Notifications
//	@Accept			json
//	@Produce		json
//	@Param			notification	body		object	true	"Notification details (repository_id, title, description)"
//	@Success		200				{object}	map[string]interface{}
//	@Failure		400				{object}	map[string]interface{}
//	@Failure		401				{object}	map[string]interface{}
//	@Failure		500				{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/notifications/send [post]
func NotificationSendHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST, OPTIONS")

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

	var req struct {
		RepositoryID *int64 `json:"repository_id"`
		Title       string `json:"title"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title is required")
		return
	}

	rows, err := database.DB.Query(context.Background(), `
		SELECT id, encoded_url, type FROM webhooks
		WHERE user_id = $1 AND enabled = TRUE
		  AND (repository_id IS NULL OR repository_id = $2)
	`, user.ID, req.RepositoryID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}
	defer rows.Close()

	sent := 0

	for rows.Next() {
		var id int64
		var encodedURL string
		var webhookType string

		if err := rows.Scan(&id, &encodedURL, &webhookType); err != nil {
			continue
		}

		decodedURL, err := base64.StdEncoding.DecodeString(encodedURL)
		if err != nil {
			continue
		}

		if webhookType == "discord" {
			if err := sendDiscordNotification(normalizeWebhookURL(string(decodedURL)), req.Title, req.Description); err == nil {
				sent++
			}
		}
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"sent":    sent,
	})
}

// SendNotificationByContext sends a notification for the given user and optional
// repository context. It is intended for future application event integration.
func SendNotificationByContext(userID string, repositoryID *int64, title, description string) {
	rows, err := database.DB.Query(context.Background(), `
		SELECT id, encoded_url, type FROM webhooks
		WHERE user_id = $1 AND enabled = TRUE
		  AND (repository_id IS NULL OR repository_id = $2)
	`, userID, repositoryID)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id int64
		var encodedURL string
		var webhookType string

		if err := rows.Scan(&id, &encodedURL, &webhookType); err != nil {
			continue
		}

		decodedURL, err := base64.StdEncoding.DecodeString(encodedURL)
		if err != nil {
			continue
		}

		if webhookType == "discord" {
			_ = sendDiscordNotification(normalizeWebhookURL(string(decodedURL)), title, description)
		}
	}
}

func handleListNotifications(w http.ResponseWriter, user *AuthUser) {
	rows, err := database.DB.Query(context.Background(), `
		SELECT id, user_id, repository_id, type, encoded_url, enabled,
		       created_at, updated_at
		FROM webhooks
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}
	defer rows.Close()

	var notifications []Webhook

	for rows.Next() {
		var n Webhook
		var createdAt, updatedAt time.Time

		if err := rows.Scan(
			&n.ID, &n.UserID, &n.RepositoryID, &n.Type,
			&n.EncodedURL, &n.Enabled, &createdAt, &updatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to scan notification")
			return
		}

		n.CreatedAt = createdAt.Format(time.RFC3339)
		n.UpdatedAt = updatedAt.Format(time.RFC3339)
		notifications = append(notifications, n)
	}

	if notifications == nil {
		notifications = []Webhook{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

func handleCreateNotification(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var req struct {
		Type         string  `json:"type"`
		EncodedURL   string  `json:"encoded_url"`
		RepositoryID *int64  `json:"repository_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Type == "" {
		req.Type = "discord"
	}

	if req.EncodedURL == "" {
		writeError(w, http.StatusBadRequest, "encoded_url is required")
		return
	}

	var n Webhook
	var createdAt, updatedAt time.Time

	err := database.DB.QueryRow(context.Background(), `
		INSERT INTO webhooks (user_id, repository_id, type, encoded_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, repository_id, type, encoded_url, enabled, created_at, updated_at
	`, user.ID, req.RepositoryID, req.Type, req.EncodedURL).Scan(
		&n.ID, &n.UserID, &n.RepositoryID, &n.Type,
		&n.EncodedURL, &n.Enabled, &createdAt, &updatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create notification")
		return
	}

	n.CreatedAt = createdAt.Format(time.RFC3339)
	n.UpdatedAt = updatedAt.Format(time.RFC3339)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(n)
}

func handleUpdateNotification(w http.ResponseWriter, r *http.Request, user *AuthUser, id string) {
	var req struct {
		EncodedURL *string `json:"encoded_url"`
		Enabled    *bool   `json:"enabled"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.EncodedURL != nil {
		_, err := database.DB.Exec(context.Background(), `
			UPDATE webhooks
			SET encoded_url = $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
		`, *req.EncodedURL, id, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update notification")
			return
		}
	}

	if req.Enabled != nil {
		_, err := database.DB.Exec(context.Background(), `
			UPDATE webhooks
			SET enabled = $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3
		`, *req.Enabled, id, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to update notification")
			return
		}
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

func handleDeleteNotification(w http.ResponseWriter, user *AuthUser, id string) {
	_, err := database.DB.Exec(context.Background(), `
		DELETE FROM webhooks WHERE id = $1 AND user_id = $2
	`, id, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete notification")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

func sendDiscordNotification(webhookURL, title, description string) error {
	payload := map[string]any{
		"embeds": []map[string]any{
			{
				"title":       title,
				"description": description,
				"color":       5814783,
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("discord returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// normalizeWebhookURL ensures the decoded URL has exactly one https:// prefix.
// The database stores URLs without the protocol; this function adds it back
// and handles malformed values such as "https://https//discord.com/...".
func normalizeWebhookURL(decoded string) string {
	trimmed := strings.TrimSpace(decoded)

	// Strip all leading http:// or https:// prefixes (handles duplicates).
	for strings.HasPrefix(trimmed, "https://") || strings.HasPrefix(trimmed, "http://") {
		trimmed = strings.TrimPrefix(trimmed, "https://")
		trimmed = strings.TrimPrefix(trimmed, "http://")
	}

	// Strip any leading slashes left over from malformed values like "https//..."
	trimmed = strings.TrimLeft(trimmed, "/")

	return "https://" + trimmed
}
