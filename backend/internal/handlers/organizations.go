package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
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

	orgID, err := database.CreateOrganization(database.Organization{
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
		writeError(w, http.StatusInternalServerError, "failed to create organization")
		return
	}

	if err := database.CreateOrganizationMember(orgID, user.ID, "owner", req.Pinned); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to add owner as member")
		return
	}

	if len(req.Tags) > 0 {
		if err := database.SetOrganizationTags(orgID, req.Tags); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to set organization tags")
			return
		}
	}

	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch created organization")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"success":      true,
		"organization": org,
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
		writeError(w, http.StatusNotFound, "organization not found")
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
		writeError(w, http.StatusNotFound, "organization not found")
		return
	}

	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil || (role != "owner" && role != "admin") {
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
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	target := filepath.Join(avatarsDir, slug+ext)
	if err := os.WriteFile(target, data, 0644); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	avatar := fmt.Sprintf("orgs/%s%s", slug, ext)

	if err := database.UpdateOrganizationAvatar(slug, avatar); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
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
