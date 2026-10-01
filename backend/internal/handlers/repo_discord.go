package handlers

import (
	"backend/internal/database"
	"backend/internal/discord"
	"encoding/json"
	"net/http"
)

// authorizeRepoAdmin authenticates the caller and requires repository admin
// permission: the repository owner for personal repositories, or an
// organization owner/admin for organization repositories. Ordinary
// contributors and members are rejected. It writes the error response itself
// and reports whether the caller may continue.
func authorizeRepoAdmin(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) (*AuthUser, bool) {
	if info.OrganizationID != nil {
		org, ok := getOrganizationBySlugOr404(w, info.Owner)
		if !ok {
			return nil, false
		}

		return requireOrgRole(w, r, org, "admin")
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return nil, false
	}

	if info.OwnerID != user.ID {
		writeErrorCoded(w, http.StatusForbidden, "repository_admin_required", "only the repository owner can manage Discord notifications")
		return nil, false
	}

	return user, true
}

// repoDiscordPublic renders a stored configuration without ever exposing the
// complete webhook URL.
func repoDiscordPublic(cfg *database.RepoDiscordConfig) map[string]any {
	if cfg == nil {
		return map[string]any{
			"configured":          false,
			"pr_notifications":    false,
			"issue_notifications": false,
			"masked_url":          nil,
			"updated_at":          nil,
		}
	}

	return map[string]any{
		"configured":          true,
		"pr_notifications":    cfg.PRNotifications,
		"issue_notifications": cfg.IssueNotifications,
		"masked_url":          discord.MaskedURL(cfg.EncodedURL),
		"updated_at":          cfg.UpdatedAt,
	}
}

// RepoDiscordHandler manages the repository-owned Discord webhook.
//
//	GET    /api/repos/{owner}/{repo}/discord -> masked configuration
//	PUT    /api/repos/{owner}/{repo}/discord -> create/update webhook and toggles
//	DELETE /api/repos/{owner}/{repo}/discord -> remove the configuration
//
//	@Summary		Get repository Discord configuration
//	@Description	Returns the masked repository Discord webhook configuration
//	@Tags			Repositories
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/discord [get]
//
//	@Summary		Configure repository Discord webhook
//	@Description	Creates or updates the repository Discord webhook and notification toggles
//	@Tags			Repositories
//	@Accept			json
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Param			config	body		object	true	"Discord configuration (url, pr_notifications, issue_notifications)"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/discord [put]
//
//	@Summary		Remove repository Discord configuration
//	@Description	Permanently removes the repository Discord webhook configuration
//	@Tags			Repositories
//	@Produce		json
//	@Param			owner	path		string	true	"Repository owner"
//	@Param			repo	path		string	true	"Repository name"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/repos/{owner}/{repo}/discord [delete]
func RepoDiscordHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PUT, DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	if _, ok := authorizeRepoAdmin(w, r, info); !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		cfg, err := database.GetRepoDiscordConfig(info.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, repoDiscordPublic(cfg))

	case http.MethodPut:
		var req struct {
			URL                *string `json:"url"`
			PRNotifications    *bool   `json:"pr_notifications"`
			IssueNotifications *bool   `json:"issue_notifications"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
			return
		}

		var encoded *string

		if req.URL != nil {
			normalized, err := discord.NormalizeWebhookURL(*req.URL)
			if err != nil {
				writeErrorCoded(w, http.StatusBadRequest, "invalid_webhook_url", err.Error())
				return
			}

			value := discord.EncodeWebhookURL(normalized)
			encoded = &value
		}

		cfg, err := database.UpsertRepoDiscordConfig(info.ID, encoded, req.PRNotifications, req.IssueNotifications)
		if err != nil {
			if err.Error() == "webhook URL is required" {
				writeErrorCoded(w, http.StatusBadRequest, "webhook_url_required", "webhook URL is required")
				return
			}
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, repoDiscordPublic(cfg))

	case http.MethodDelete:
		if err := database.DeleteRepoDiscordConfig(info.ID); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}
