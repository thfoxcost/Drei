package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
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

	writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
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
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	var req CreateOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.Email = strings.TrimSpace(req.Email)
	req.Purpose = strings.TrimSpace(req.Purpose)

	if req.Name == "" {
		writeErrorCoded(w, http.StatusBadRequest, "organization_name_required", "organization name is required")
		return
	}

	if len(req.Name) > 100 {
		writeErrorCoded(w, http.StatusBadRequest, "organization_name_too_long", "organization name must be 100 characters or less")
		return
	}

	if req.Visibility == "" {
		req.Visibility = "public"
	}

	if req.Visibility != "public" && req.Visibility != "members" {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_organization_visibility", "visibility must be 'public' or 'members'")
		return
	}

	if req.Email != "" && !strings.Contains(req.Email, "@") {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_email", "invalid email address")
		return
	}

	slug := generateSlug(req.Name)

	exists, err := database.SlugExists(slug)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_slug", "failed to check slug availability")
		return
	}

	if exists {
		// Try appending a numeric suffix.
		for i := 2; i <= 99; i++ {
			candidate := fmt.Sprintf("%s-%d", slug, i)
			exists, err = database.SlugExists(candidate)
			if err != nil {
				writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_slug", "failed to check slug availability")
				return
			}
			if !exists {
				slug = candidate
				break
			}
		}

		if exists {
			writeErrorCoded(w, http.StatusConflict, "organization_name_taken", "organization name is already taken")
			return
		}
	}

	verified, err := database.IsPlatformOwner(user.ID)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_verify_platform_owner", "failed to verify platform owner status")
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
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_create_organization", "failed to create organization")
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
		Status:      "active",
		CreatedBy:   user.ID,
	})
	if err != nil {
		log.Printf("ERROR: failed to create organization: %v", err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_create_organization", "failed to create organization")
		return
	}

	if err := database.AddOrganizationMemberInTx(ctx, tx, orgID, user.ID, "owner", req.Pinned); err != nil {
		log.Printf("ERROR: failed to add owner as member: %v", err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_add_org_owner", "failed to add owner as member")
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
			writeErrorCoded(w, http.StatusInternalServerError, "failed_to_set_organization_tags", "failed to set organization tags")
			return
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Printf("ERROR: failed to commit transaction: %v", err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_create_organization", "failed to create organization")
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
			Status:      "active",
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
	setCORS(w, r, "GET, PATCH, DELETE, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	// Updates share this path; PATCH is dispatched here so the CORS
	// preflight (OPTIONS, which carries no method) lands on a handler that
	// advertises PATCH. A separate "PATCH /api/orgs/{slug}" pattern would
	// never see the preflight and the browser would block the request.
	if r.Method == http.MethodPatch {
		UpdateOrganizationHandler(w, r)
		return
	}

	if r.Method == http.MethodDelete {
		DeleteOrganizationHandler(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	slug := r.PathValue("slug")

	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusNotFound, "organization_not_found", "organization not found")
			return
		}
		log.Printf("ERROR: failed to fetch organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organization", "failed to fetch organization")
		return
	}

	// Members-only orgs require authentication and membership.
	if org.Visibility == "members" {
		user, err := authenticate(r)
		if err != nil {
			writeErrorCoded(w, http.StatusUnauthorized, "auth_required_for_private_org", "authentication required for private organizations")
			return
		}

		member, err := database.IsOrganizationMember(org.ID, user.ID)
		if err != nil {
			writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
			return
		}

		if !member {
			writeErrorCoded(w, http.StatusForbidden, "not_an_organization_member", "you are not a member of this organization")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(org)
}

// getOrganizationBySlugOr404 fetches the organization for the given slug and
// writes a 404/500 response when it cannot be resolved. It reports whether
// the caller may continue.
func getOrganizationBySlugOr404(w http.ResponseWriter, slug string) (*database.OrganizationDetail, bool) {
	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusNotFound, "organization_not_found", "organization not found")
			return nil, false
		}
		log.Printf("ERROR: failed to fetch organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organization", "failed to fetch organization")
		return nil, false
	}

	return org, true
}

// orgRoleRank orders organization roles for minimum-role checks.
func orgRoleRank(role string) int {
	switch role {
	case "owner":
		return 3
	case "admin":
		return 2
	case "member":
		return 1
	default:
		return 0
	}
}

// requireOrgRole authenticates the caller and requires at least minRole
// ("member", "admin", or "owner") in the given organization. It writes the
// error response itself and reports whether the caller may continue.
func requireOrgRole(w http.ResponseWriter, r *http.Request, org *database.OrganizationDetail, minRole string) (*AuthUser, bool) {
	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return nil, false
	}

	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusForbidden, "not_an_organization_member", "you are not a member of this organization")
			return nil, false
		}
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
		return nil, false
	}

	if orgRoleRank(role) < orgRoleRank(minRole) {
		if minRole == "owner" {
			writeErrorCoded(w, http.StatusForbidden, "org_owner_required", "only organization owners can perform this action")
		} else {
			writeErrorCoded(w, http.StatusForbidden, "org_owner_or_admin_required", "only organization owners and admins can perform this action")
		}
		return nil, false
	}

	return user, true
}

// authorizeOrgRepo enforces minRole on an organization-owned repository.
// Personal repositories (OrganizationID == nil) keep their existing behavior
// and are always allowed through.
func authorizeOrgRepo(w http.ResponseWriter, r *http.Request, info *database.RepoInfo, minRole string) bool {
	if info.OrganizationID == nil {
		return true
	}

	org, ok := getOrganizationBySlugOr404(w, info.Owner)
	if !ok {
		return false
	}

	_, ok = requireOrgRole(w, r, org, minRole)

	return ok
}

// authorizeOrgRepoView enforces the view rules for an organization-owned
// repository: members-only organizations require membership, and private
// repositories are hidden from non-members. Personal repositories are always
// allowed through, preserving existing behavior.
func authorizeOrgRepoView(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	if info.OrganizationID == nil {
		return true
	}

	org, ok := getOrganizationBySlugOr404(w, info.Owner)
	if !ok {
		return false
	}

	var isMember bool

	if user, err := authenticate(r); err == nil {
		if member, err := database.IsOrganizationMember(org.ID, user.ID); err == nil && member {
			isMember = true
		}
	}

	if org.Visibility == "members" && !isMember {
		writeErrorCoded(w, http.StatusUnauthorized, "auth_required_for_private_org", "authentication required for private organizations")
		return false
	}

	if !info.Visibility && !isMember {
		writeErrorCoded(w, http.StatusForbidden, "repository_is_private", "this repository is private")
		return false
	}

	return true
}

// GetOrganizationMembersHandler godoc
//
//	@Summary		List organization members
//	@Description	Returns all members of the organization ordered by join date
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/members [get]
func GetOrganizationMembersHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	// Members-only orgs require authentication and membership, mirroring
	// GetOrganizationHandler so private orgs never expose their member list.
	if org.Visibility == "members" {
		user, err := authenticate(r)
		if err != nil {
			writeErrorCoded(w, http.StatusUnauthorized, "auth_required_for_private_org", "authentication required for private organizations")
			return
		}

		member, err := database.IsOrganizationMember(org.ID, user.ID)
		if err != nil {
			writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
			return
		}

		if !member {
			writeErrorCoded(w, http.StatusForbidden, "not_an_organization_member", "you are not a member of this organization")
			return
		}
	}

	members, err := database.GetOrganizationMembers(org.ID)
	if err != nil {
		log.Printf("ERROR: failed to fetch members for organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organization_members", "failed to fetch organization members")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"members": members,
	})
}

// JoinOrganizationHandler godoc
//
//	@Summary		Join an organization
//	@Description	Creates an organization_members row for the authenticated user
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/join [post]
func JoinOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	member, err := database.IsOrganizationMember(org.ID, user.ID)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
		return
	}

	if member {
		writeErrorCoded(w, http.StatusConflict, "already_organization_member", "already a member of this organization")
		return
	}

	if err := database.CreateOrganizationMember(org.ID, user.ID, "member", false); err != nil {
		log.Printf("ERROR: failed to add member %s to organization %q: %v", user.ID, slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_join_organization", "failed to join organization")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

// LeaveOrganizationHandler godoc
//
//	@Summary		Leave an organization
//	@Description	Removes the authenticated user's organization_members row
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/leave [post]
func LeaveOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusNotFound, "not_an_organization_member", "not a member of this organization")
			return
		}
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
		return
	}

	// The organization creator (always an owner) must never be able to leave
	// through this path, and no other owner may orphan the organization either.
	if user.ID == org.CreatedBy.ID || role == "owner" {
		writeErrorCoded(w, http.StatusForbidden, "org_owner_cannot_leave", "organization owners cannot leave the organization")
		return
	}

	if err := database.RemoveOrganizationMember(org.ID, user.ID); err != nil {
		log.Printf("ERROR: failed to remove member %s from organization %q: %v", user.ID, slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_leave_organization", "failed to leave organization")
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
	})
}

// UpdateOrganizationRequest carries the editable organization fields. The
// slug and ownership are intentionally absent: the slug stays immutable so
// existing routes keep working, and ownership can never change here.
type UpdateOrganizationRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Purpose     string   `json:"purpose"`
	Email       string   `json:"email"`
	Status      string   `json:"status"`
	Tags        []string `json:"tags"`
}

// allowedOrganizationPurposes mirrors the client-side organizationPurposes
// definition (client/src/components/organization/purpose.ts).
var allowedOrganizationPurposes = map[string]bool{
	"work":         true,
	"school":       true,
	"hardware":     true,
	"software":     true,
	"recreational": true,
}

// UpdateOrganizationHandler godoc
//
//	@Summary		Update an organization
//	@Description	Updates the organization's editable fields; creator/owner only
//	@Tags			Organizations
//	@Accept			json
//	@Produce		json
//	@Param			slug	path		string						true	"Organization slug"
//	@Param			org		body		UpdateOrganizationRequest	true	"Updated organization fields"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug} [patch]
func UpdateOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "PATCH, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPatch {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	// Only the organization creator/owner may edit settings for now.
	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusForbidden, "org_owner_required", "only organization owners can edit settings")
			return
		}
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
		return
	}

	if role != "owner" || user.ID != org.CreatedBy.ID {
		writeErrorCoded(w, http.StatusForbidden, "org_owner_required", "only organization owners can edit settings")
		return
	}

	var req UpdateOrganizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.Purpose = strings.TrimSpace(req.Purpose)
	req.Email = strings.TrimSpace(req.Email)
	req.Status = strings.TrimSpace(req.Status)

	if req.Name == "" {
		writeErrorCoded(w, http.StatusBadRequest, "organization_name_required", "organization name is required")
		return
	}

	if len(req.Name) > 100 {
		writeErrorCoded(w, http.StatusBadRequest, "organization_name_too_long", "organization name must be 100 characters or less")
		return
	}

	if req.Status != "active" && req.Status != "suspended" {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_organization_status", "status must be 'active' or 'suspended'")
		return
	}

	if req.Email != "" && !strings.Contains(req.Email, "@") {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_email", "invalid email address")
		return
	}

	if req.Purpose != "" && !allowedOrganizationPurposes[req.Purpose] {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_purpose", "invalid purpose")
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

	var cleanTags []string
	for _, tag := range req.Tags {
		trimmed := strings.TrimSpace(tag)
		if trimmed != "" {
			cleanTags = append(cleanTags, trimmed)
		}
	}

	if err := database.UpdateOrganization(org.ID, req.Name, description, email, purpose, req.Status, cleanTags); err != nil {
		log.Printf("ERROR: failed to update organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_update_organization", "failed to update organization")
		return
	}

	updated, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		log.Printf("ERROR: failed to fetch updated organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_updated_organization", "failed to fetch updated organization")
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success":      true,
		"organization": updated,
	})
}

// DeleteOrganizationHandler godoc
//
//	@Summary		Delete an organization
//	@Description	Permanently deletes an organization, its repositories on disk, and its data
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug} [delete]
func DeleteOrganizationHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "DELETE, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodDelete {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	// Only the organization creator/owner may delete, mirroring updates.
	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusForbidden, "org_owner_required", "only organization owners can delete this organization")
			return
		}
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
		return
	}

	if role != "owner" || user.ID != org.CreatedBy.ID {
		writeErrorCoded(w, http.StatusForbidden, "org_owner_required", "only organization owners can delete this organization")
		return
	}

	// Remove each organization-owned bare repository from disk. The DB rows
	// follow via ON DELETE CASCADE, but the .git directories do not.
	if repos, err := database.GetOrganizationRepositories(org.ID); err != nil {
		log.Printf("ERROR: failed to fetch repositories for organization delete %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_delete_organization", "failed to delete organization")
		return
	} else {
		for _, repo := range repos {
			if err := gitrepo.RemoveRepository(org.Slug, repo.Name, repo.Logo); err != nil {
				log.Printf("ERROR: failed to remove repository %q/%q during organization delete: %v", org.Slug, repo.Name, err)
				writeErrorCoded(w, http.StatusInternalServerError, "failed_to_delete_organization_repos", "failed to delete organization repositories")
				return
			}
		}
	}

	if err := database.DeleteOrganization(org.ID); err != nil {
		log.Printf("ERROR: failed to delete organization %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_delete_organization", "failed to delete organization")
		return
	}

	// Clean up the organization namespace directory and avatar files.
	// Best-effort: the DB row is already gone at this point.
	for _, ext := range []string{".png", ".jpg", ".webp", ".gif"} {
		_ = os.Remove(filepath.Join(config.App.ReposPath, "orgs", slug+ext))
	}
	_ = os.RemoveAll(filepath.Join(config.App.ReposPath, slug))

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Organization deleted successfully",
	})
}

// OrganizationRepoItem is a single repository in an organization listing.
// Language is null when no language could be detected (e.g. empty repos).
type OrganizationRepoItem struct {
	ID              int64   `json:"id"`
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	Visibility      bool    `json:"visibility"`
	Archived        bool    `json:"archived"`
	Forked          bool    `json:"forked"`
	ForkedFromOwner string  `json:"forkedFromOwner"`
	ForkedFromName  string  `json:"forkedFromName"`
	Language        *string `json:"language"`
	LastUpdatedAt   string  `json:"lastUpdatedAt"`
	Forks           int64   `json:"forks"`
	OpenPRs         int     `json:"openPRs"`
	Size            int64   `json:"size"`
	Activity        []int   `json:"activity"`
}

// listVisibleOrgRepos returns the organization's repositories visible to the
// caller. Members-only organizations require authentication and membership
// (mirroring GetOrganizationHandler); private repositories are hidden from
// non-members. The second return value reports whether the caller may
// continue (false after an error response has been written).
func listVisibleOrgRepos(w http.ResponseWriter, r *http.Request, org *database.OrganizationDetail) ([]database.RepoInfo, bool) {
	var isMember bool

	if org.Visibility == "members" {
		user, err := authenticate(r)
		if err != nil {
			writeErrorCoded(w, http.StatusUnauthorized, "auth_required_for_private_org", "authentication required for private organizations")
			return nil, false
		}

		member, err := database.IsOrganizationMember(org.ID, user.ID)
		if err != nil {
			writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_membership", "failed to check membership")
			return nil, false
		}

		if !member {
			writeErrorCoded(w, http.StatusForbidden, "not_an_organization_member", "you are not a member of this organization")
			return nil, false
		}

		isMember = true
	} else if user, err := authenticate(r); err == nil {
		if member, err := database.IsOrganizationMember(org.ID, user.ID); err == nil && member {
			isMember = true
		}
	}

	repos, err := database.GetOrganizationRepositories(org.ID)
	if err != nil {
		log.Printf("ERROR: failed to fetch repositories for organization %q: %v", org.Slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organization_repos", "failed to fetch organization repositories")
		return nil, false
	}

	visible := repos[:0]
	for _, repo := range repos {
		if !repo.Visibility && !isMember {
			continue
		}
		visible = append(visible, repo)
	}

	return visible, true
}

// repoHeadTime returns the HEAD commit time of the repository, or false when
// the repository has no reachable commits (e.g. freshly created).
func repoHeadTime(owner, name string) (time.Time, bool) {
	repoPath := filepath.Join(config.App.ReposPath, owner, name+".git")

	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return time.Time{}, false
	}

	head, err := repo.Head()
	if err != nil {
		return time.Time{}, false
	}

	commit, err := repo.CommitObject(head.Hash())
	if err != nil {
		return time.Time{}, false
	}

	return commit.Author.When, true
}

// OrganizationReposHandler is the dispatcher for /api/orgs/{slug}/repos. A
// single handler serves both methods so the CORS preflight (OPTIONS, which
// carries no method) lands on a handler that advertises GET and POST —
// separate method-qualified patterns would hide POST from the preflight and
// browsers would block the request.
func OrganizationReposHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	switch r.Method {
	case http.MethodGet:
		GetOrganizationReposHandler(w, r)
	case http.MethodPost:
		CreateOrganizationRepoHandler(w, r)
	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

// GetOrganizationReposHandler godoc
//
//	@Summary		List organization repositories
//	@Description	Returns real repository data for the organization, DB-driven so empty repositories are included
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/repos [get]
func GetOrganizationReposHandler(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	repos, ok := listVisibleOrgRepos(w, r, org)
	if !ok {
		return
	}

	items := make([]OrganizationRepoItem, 0, len(repos))

	for _, meta := range repos {
		item := OrganizationRepoItem{
			ID:              meta.ID,
			Name:            meta.Name,
			Description:     meta.Description,
			Visibility:      meta.Visibility,
			Archived:        meta.Archived,
			Forked:          meta.ForkedFromID != nil,
			ForkedFromOwner: meta.ForkedFromOwner,
			ForkedFromName:  meta.ForkedFromName,
			LastUpdatedAt:   meta.CreatedAt.UTC().Format(time.RFC3339),
			Activity:        make([]int, gitrepo.DefaultActivityWeeks),
		}

		if headTime, ok := repoHeadTime(slug, meta.Name); ok {
			item.LastUpdatedAt = headTime.UTC().Format(time.RFC3339)
		}

		if langs, err := gitrepo.GetLang(slug, meta.Name, ""); err == nil && len(langs) > 0 {
			language := langs[0].Name
			item.Language = &language
		}

		if forks, err := database.CountForks(meta.ID); err == nil {
			item.Forks = forks
		}

		if open, _, _, err := database.CountPullRequests(meta.ID, database.PullRequestFilter{}); err == nil {
			item.OpenPRs = open
		}

		if size, err := gitrepo.CalcRepoSize(slug, meta.Name, ""); err == nil {
			item.Size = size
		}

		if activity, err := gitrepo.GetCommitActivityWindow(slug, meta.Name, "", gitrepo.DefaultActivityWeeks); err == nil {
			item.Activity = activity
		}

		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"repositories": items,
		"total":        len(items),
	})
}

// GetOrganizationLanguagesHandler godoc
//
//	@Summary		Organization top languages
//	@Description	Aggregates language bytes across the organization's visible repositories using the existing GetLang detection
//	@Tags			Organizations
//	@Produce		json
//	@Param			slug	path		string	true	"Organization slug"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/languages [get]
func GetOrganizationLanguagesHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, OPTIONS")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	repos, ok := listVisibleOrgRepos(w, r, org)
	if !ok {
		return
	}

	langBytes := make(map[string]int64)
	var totalBytes int64

	for _, meta := range repos {
		langs, err := gitrepo.GetLang(slug, meta.Name, "")
		if err != nil || len(langs) == 0 {
			continue
		}

		for _, lang := range langs {
			langBytes[lang.Name] += lang.Bytes
			totalBytes += lang.Bytes
		}
	}

	type orgLanguage struct {
		Name    string  `json:"name"`
		Bytes   int64   `json:"bytes"`
		Percent float64 `json:"percent"`
	}

	languages := make([]orgLanguage, 0, len(langBytes))

	for name, bytes := range langBytes {
		percent := 0.0
		if totalBytes > 0 {
			percent = (float64(bytes) / float64(totalBytes)) * 100
		}

		languages = append(languages, orgLanguage{
			Name:    name,
			Bytes:   bytes,
			Percent: percent,
		})
	}

	sort.Slice(languages, func(i, j int) bool {
		return languages[i].Bytes > languages[j].Bytes
	})

	if len(languages) > 5 {
		languages = languages[:5]
	}

	if languages == nil {
		languages = []orgLanguage{}
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"languages": languages,
	})
}

// CreateOrganizationRepoRequest carries the fields for a new organization
// repository. The namespace always comes from the URL slug, never the body.
type CreateOrganizationRepoRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Visibility  bool   `json:"visibility"`
}

// CreateOrganizationRepoHandler godoc
//
//	@Summary		Create an organization repository
//	@Description	Creates a bare repository under the organization namespace; owner/admin only
//	@Tags			Organizations
//	@Accept			json
//	@Produce		json
//	@Param			slug	path		string							true	"Organization slug"
//	@Param			repo	body		CreateOrganizationRepoRequest	true	"Repository details"
//	@Success		201		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		403		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		409		{object}	map[string]interface{}
//	@Router			/orgs/{slug}/repos [post]
func CreateOrganizationRepoHandler(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	org, ok := getOrganizationBySlugOr404(w, slug)
	if !ok {
		return
	}

	user, ok := requireOrgRole(w, r, org, "admin")
	if !ok {
		return
	}

	var req CreateOrganizationRepoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
		return
	}

	name := strings.TrimSpace(req.Name)
	description := strings.TrimSpace(req.Description)

	if name == "" {
		writeErrorCoded(w, http.StatusBadRequest, "repository_name_required", "repository name is required")
		return
	}

	if strings.HasPrefix(req.Name, " ") {
		writeErrorCoded(w, http.StatusBadRequest, "repository_name_leading_space", "repository name cannot start with a space")
		return
	}

	if _, err := createBareRepository(org.Slug, user.ID, user.Name, &org.ID, name, description, req.Visibility, user.Image); err != nil {
		if errors.Is(err, errRepositoryExists) {
			writeErrorCoded(w, http.StatusConflict, "repository_already_exists", "repository already exists")
			return
		}
		log.Printf("ERROR: failed to create repository %q for organization %q: %v", name, slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_create_repository", "failed to create repository")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository created successfully",
		"repository": map[string]any{
			"owner": org.Slug,
			"name":  name,
		},
	})
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
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	orgs, err := database.GetUserOrganizations(user.ID)
	if err != nil {
		log.Printf("ERROR: failed to fetch organizations for user %s: %v", user.ID, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organizations", "failed to fetch organizations")
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
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	slug := strings.TrimSpace(r.URL.Query().Get("slug"))
	if slug == "" {
		writeErrorCoded(w, http.StatusBadRequest, "slug_required", "slug parameter is required")
		return
	}

	exists, err := database.SlugExists(slug)
	if err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_check_slug", "failed to check slug")
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
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	slug := r.PathValue("slug")

	org, err := database.GetOrganizationBySlug(slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrorCoded(w, http.StatusNotFound, "organization_not_found", "organization not found")
			return
		}
		log.Printf("ERROR: failed to fetch organization %q for avatar upload: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_fetch_organization", "failed to fetch organization")
		return
	}

	role, err := database.GetOrganizationMemberRole(org.ID, user.ID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("ERROR: failed to fetch member role for org %q: %v", slug, err)
			writeErrorCoded(w, http.StatusInternalServerError, "failed_to_verify_org_role", "failed to verify organization role")
			return
		}
		writeErrorCoded(w, http.StatusForbidden, "org_owner_or_admin_required", "only owners and admins can upload an avatar")
		return
	}
	if role != "owner" && role != "admin" {
		writeErrorCoded(w, http.StatusForbidden, "org_owner_or_admin_required", "only owners and admins can upload an avatar")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxOrgAvatarSize+(1<<20))

	file, _, err := r.FormFile("avatar")
	if err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "missing_avatar_file", "missing avatar file")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		writeErrorCoded(w, http.StatusBadRequest, "failed_to_read_uploaded_file", "failed to read uploaded file")
		return
	}

	if len(data) == 0 {
		writeErrorCoded(w, http.StatusBadRequest, "uploaded_file_empty", "uploaded file is empty")
		return
	}

	if len(data) > maxOrgAvatarSize {
		writeErrorCoded(w, http.StatusBadRequest, "image_too_large_2mb", "image is too large. Maximum size is 2 MB")
		return
	}

	ext, ok := orgImageExtension(data)
	if !ok {
		writeErrorCoded(w, http.StatusBadRequest, "unsupported_image_type", "unsupported file type. Please upload a PNG, JPG, WebP, or GIF image")
		return
	}

	avatarsDir := filepath.Join(config.App.ReposPath, "orgs")
	if err := os.MkdirAll(avatarsDir, 0755); err != nil {
		log.Printf("ERROR: failed to create org avatars directory: %v", err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_store_avatar", "failed to store avatar")
		return
	}

	target := filepath.Join(avatarsDir, slug+ext)
	if err := os.WriteFile(target, data, 0644); err != nil {
		log.Printf("ERROR: failed to write org avatar %q: %v", target, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_store_avatar", "failed to store avatar")
		return
	}

	avatar := fmt.Sprintf("orgs/%s%s", slug, ext)

	if err := database.UpdateOrganizationAvatar(slug, avatar); err != nil {
		log.Printf("ERROR: failed to persist org avatar for %q: %v", slug, err)
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_save_avatar", "failed to save avatar")
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
