package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type CreateOrganizationRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Visibility  string   `json:"visibility"`
	Email       string   `json:"email"`
	Purpose     string   `json:"purpose"`
	Tags        []string `json:"tags"`
	Pinned      bool     `json:"pinned"`
}

var orgSlugRe = regexp.MustCompile(`[^a-z0-9-]`)

// OrganizationsHandler is the top-level dispatcher for /api/orgs. It routes to
// the appropriate sub-handler based on HTTP method and query parameters.
func OrganizationsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	// Check slug availability: GET /api/orgs?slug=...
	if r.Method == http.MethodGet && r.URL.Query().Get("slug") != "" {
		CheckSlugHandler(w, r)
		return
	}

	if r.Method == http.MethodGet {
		ListUserOrganizationsHandler(w, r)
		return
	}

	if r.Method == http.MethodPost {
		CreateOrganizationHandler(w, r)
		return
	}

	writeError(w, http.StatusMethodNotAllowed, "method not allowed")
}

// generateSlug converts a display name into a URL-safe slug.
func generateSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = orgSlugRe.ReplaceAllString(slug, "")
	// Collapse multiple hyphens.
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "org"
	}
	return slug
}

// CreateOrganizationHandler godoc
//
//	@Summary		Create an organization
//	@Description	Creates a new organization with the authenticated user as owner
//	@Tags			Organizations
//	@Accept			json
//	@Produce		json
//	@Param			org		body		CreateOrganizationRequest	true	"Organization details"
//	@Success		201		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/orgs [post]
func CreateOrganizationHandler(w http.ResponseWriter, r *http.Request) {
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

	var req CreateOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.Email = strings.TrimSpace(req.Email)
	req.Purpose = strings.TrimSpace(req.Purpose)

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "organization name is required")
		return
	}

	if len(req.Name) > 100 {
		writeError(w, http.StatusBadRequest, "organization name must be 100 characters or less")
		return
	}

	if req.Visibility == "" {
		req.Visibility = "public"
	}

	if req.Visibility != "public" && req.Visibility != "members" {
		writeError(w, http.StatusBadRequest, "visibility must be 'public' or 'members'")
		return
	}

	if req.Email != "" && !strings.Contains(req.Email, "@") {
		writeError(w, http.StatusBadRequest, "invalid email address")
		return
	}

	slug := generateSlug(req.Name)

	exists, err := database.SlugExists(slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check slug availability")
		return
	}

	if exists {
		// Try appending a numeric suffix.
		for i := 2; i <= 99; i++ {
			candidate := fmt.Sprintf("%s-%d", slug, i)
			exists, err = database.SlugExists(candidate)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "failed to check slug availability")
				return
			}
			if !exists {
				slug = candidate
				break
			}
		}

		if exists {
			writeError(w, http.StatusConflict, "organization name is already taken")
			return
		}
	}

	verified, err := database.IsPlatformOwner(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to verify platform owner status")
		return
	}

	var description *string
	if req.Description != "" {
		description = &req.Description
	}

	var email *string
	if req.Email != "" {
		email = &req.Email
	}

	var purpose *string
	if req.Purpose != "" {
		purpose = &req.Purpose
	}

	ctx := r.Context()

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		log.Printf("ERROR: failed to begin transaction: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create organization")
		return
	}
	defer tx.Rollback(ctx)

	orgID, err := database.CreateOrganizationInTx(ctx, tx, database.Organization{
		Name:        req.Name,
		Slug:        slug,
		Description: description,
		Visibility:  req.Visibility,
		Email:       email,
		Purpose:     purpose,
		Verified:    verified,
		CreatedBy:   user.ID,
	})
	if err != nil {
		log.Printf("ERROR: failed to create organization: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create organization")
		return
	}

	if err := database.AddOrganizationMemberInTx(ctx, tx, orgID, user.ID, "owner", req.Pinned); err != nil {
		log.Printf("ERROR: failed to add owner as member: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to add owner as member")
		return
	}

	var cleanTags []string
	for _, tag := range req.Tags {
		trimmed := strings.TrimSpace(tag)
		if trimmed != "" {
			cleanTags = append(cleanTags, trimmed)
		}
	}
	if len(cleanTags) > 0 {
		if err := database.SetOrganizationTagsInTx(ctx, tx, orgID, cleanTags); err != nil {
			log.Printf("ERROR: failed to set organization tags: %v", err)
			writeError(w, http.StatusInternalServerError, "failed to set organization tags")
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("ERROR: failed to commit transaction: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create organization")
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"organization": &database.OrganizationDetail{
			ID:          orgID,
			Name:        req.Name,
			Slug:        slug,
			Description: description,
			Visibility:  req.Visibility,
			Email:       email,
			Purpose:     purpose,
			Verified:    verified,
			CreatedBy: database.UserRef{
				ID:    user.ID,
				Name:  user.Name,
				Image: user.Image,
			},
			MemberCount: 1,
			Tags:        cleanTags,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	})
}

// GetOrganizationHandler godoc
//
//	@Summary		Get organization details
//	@Description	Returns full organization metadata by slug
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	database.OrganizationDetail
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug} [get]
func GetOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	slug := r.PathValue("slug")

	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "organization not found")
			return
		}
		log.Printf("ERROR: failed to fetch organization %q: %v", slug, err)
		writeError(w, http.StatusInternalServerError, "failed to fetch organization")
		return
	}

	// Members-only orgs require authentication and membership.
	if org.Visibility == "members" {
		user, err := authenticate(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "authentication required for private organizations")
			return
		}

		member, err := database.IsOrganizationMember(org.ID, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to check membership")
			return
		}

		if !member {
			writeError(w, http.StatusForbidden, "you are not a member of this organization")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(org)
}

// ListUserOrganizationsHandler godoc
//
//	@Summary		List current user's organizations
//	@Description	Returns all organizations the authenticated user is a member of
//	@Tags			Organizations
//	@Produce		json
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Router			/orgs [get]
func ListUserOrganizationsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	orgs, err := database.GetUserOrganizations(user.ID)
	if err != nil {
		log.Printf("ERROR: failed to fetch organizations for user %s: %v", user.ID, err)
		writeError(w, http.StatusInternalServerError, "failed to fetch organizations")
		return
	}

	if orgs == nil {
		orgs = []database.OrganizationListItem{}
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"organizations": orgs,
	})
}

// CheckSlugHandler godoc
//
//	@Summary		Check organization slug availability
//	@Description	Returns whether the given slug is available for use
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	query		string	true	"Slug to check"
//	@Success		200		{object}	map[string]interface{}
//	@Router			/orgs/check [get]
func CheckSlugHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	slug := strings.TrimSpace(r.URL.Query().Get("slug"))
	if slug == "" {
		writeError(w, http.StatusBadRequest, "slug parameter is required")
		return
	}

	exists, err := database.SlugExists(slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to check slug")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"available": !exists,
	})
}

const maxOrgAvatarSize = 2 * 1024 * 1024

// OrganizationAvatarHandler godoc
//
//	@Summary		Upload organization avatar
//	@Description	Uploads an avatar image for an organization
//	@Tags			Organizations
//	@Accept			multipart/form-data
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Param			avatar	formData	file	true	"Avatar image"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/avatar [post]
func OrganizationAvatarHandler(w http.ResponseWriter, r *http.Request) {
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

	slug := r.PathValue("slug")

	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeError(w, http.StatusNotFound, "organization not found")
			return
		}
		log.Printf("ERROR: failed to fetch organization %q for avatar upload: %v", slug, err)
		writeError(w, http.StatusInternalServerError, "failed to fetch organization")
		return
	}

	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("ERROR: failed to fetch member role for org %q: %v", slug, err)
			writeError(w, http.StatusInternalServerError, "failed to verify organization role")
			return
		}
		writeError(w, http.StatusForbidden, "only owners and admins can upload an avatar")
		return
	}
	if role != "owner" && role != "admin" {
		writeError(w, http.StatusForbidden, "only owners and admins can upload an avatar")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxOrgAvatarSize+(1<<20))

	file, _, err := r.FormFile("avatar")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing avatar file")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read uploaded file")
		return
	}

	if len(data) == 0 {
		writeError(w, http.StatusBadRequest, "uploaded file is empty")
		return
	}

	if len(data) > maxOrgAvatarSize {
		writeError(w, http.StatusBadRequest, "image is too large. Maximum size is 2 MB")
		return
	}

	ext, ok := orgImageExtension(data)
	if !ok {
		writeError(w, http.StatusBadRequest, "unsupported file type. Please upload a PNG, JPG, WebP, or GIF image")
		return
	}

	avatarsDir := filepath.Join(config.App.ReposPath, "orgs")
	if err := os.MkdirAll(avatarsDir, 0755); err != nil {
		log.Printf("ERROR: failed to create org avatars directory: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to store avatar")
		return
	}

	target := filepath.Join(avatarsDir, slug+ext)
	if err := os.WriteFile(target, data, 0644); err != nil {
		log.Printf("ERROR: failed to write org avatar %q: %v", target, err)
		writeError(w, http.StatusInternalServerError, "failed to store avatar")
		return
	}

	avatar := fmt.Sprintf("orgs/%s%s", slug, ext)

	if err := database.UpdateOrganizationAvatar(slug, avatar); err != nil {
		log.Printf("ERROR: failed to persist org avatar for %q: %v", slug, err)
		writeError(w, http.StatusInternalServerError, "failed to save avatar")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"avatar":  "http://localhost:3200/uploads/" + avatar,
	})
}

func orgImageExtension(data []byte) (string, bool) {
	mime := http.DetectContentType(data)

	switch {
	case strings.HasPrefix(mime, "image/png"):
		return ".png", true
	case strings.HasPrefix(mime, "image/jpeg"):
		return ".jpg", true
	case strings.HasPrefix(mime, "image/webp"):
		return ".webp", true
	case strings.HasPrefix(mime, "image/gif"):
		return ".gif", true
	default:
		return "", false
	}
}
