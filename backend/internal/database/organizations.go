package database

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Organization struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
	Visibility  string  `json:"visibility"`
	Email       *string `json:"email"`
	Purpose     *string `json:"purpose"`
	Avatar      *string `json:"avatar"`
	Verified    bool    `json:"verified"`
	CreatedBy   string  `json:"createdBy"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type OrganizationMember struct {
	ID             int64  `json:"id"`
	OrganizationID int64  `json:"organizationId"`
	UserID         string `json:"userId"`
	Role           string `json:"role"`
	Pinned         bool   `json:"pinned"`
	CreatedAt      string `json:"createdAt"`
}

type OrganizationListItem struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Avatar      *string `json:"avatar"`
	Verified    bool    `json:"verified"`
	Role        string  `json:"role"`
	Pinned      bool    `json:"pinned"`
	MemberCount int     `json:"memberCount"`
	CreatedAt   string  `json:"createdAt"`
}

type OrganizationDetail struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description *string  `json:"description"`
	Visibility  string   `json:"visibility"`
	Email       *string  `json:"email"`
	Purpose     *string  `json:"purpose"`
	Avatar      *string  `json:"avatar"`
	Verified    bool     `json:"verified"`
	CreatedBy   UserRef  `json:"createdBy"`
	MemberCount int      `json:"memberCount"`
	Tags        []string `json:"tags"`
	CreatedAt   string   `json:"createdAt"`
	UpdatedAt   string   `json:"updatedAt"`
}

type UserRef struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Image *string `json:"image"`
}

// SlugExists reports whether the given slug is already taken.
func SlugExists(slug string) (bool, error) {
	var exists bool

	err := DB.QueryRow(
		context.Background(),
		`SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = $1)`,
		slug,
	).Scan(&exists)

	return exists, err
}

// IsPlatformOwner reports whether the given user has the platform_owner flag.
func IsPlatformOwner(userID string) (bool, error) {
	var isOwner bool

	err := DB.QueryRow(
		context.Background(),
		`SELECT COALESCE(platform_owner, FALSE) FROM "user" WHERE id = $1`,
		userID,
	).Scan(&isOwner)

	return isOwner, err
}

// CreateOrganization inserts a new organization and returns its ID.
func CreateOrganization(org Organization) (int64, error) {
	var id int64

	err := DB.QueryRow(
		context.Background(),
		`
		INSERT INTO organizations (name, slug, description, visibility, email, purpose, verified, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
		`,
		org.Name,
		org.Slug,
		org.Description,
		org.Visibility,
		org.Email,
		org.Purpose,
		org.Verified,
		org.CreatedBy,
	).Scan(&id)

	return id, err
}

// CreateOrganizationMember adds a user to an organization with the given role.
func CreateOrganizationMember(orgID int64, userID, role string, pinned bool) error {
	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO organization_members (organization_id, user_id, role, pinned)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (organization_id, user_id) DO NOTHING
		`,
		orgID,
		userID,
		role,
		pinned,
	)

	return err
}

// SetOrganizationTags replaces all tags for an organization.
func SetOrganizationTags(orgID int64, tags []string) error {
	if len(tags) == 0 {
		return nil
	}

	// Delete existing tags first.
	_, err := DB.Exec(
		context.Background(),
		`DELETE FROM organization_tags WHERE organization_id = $1`,
		orgID,
	)
	if err != nil {
		return err
	}

	// Insert new tags.
	for _, tag := range tags {
		trimmed := strings.TrimSpace(tag)
		if trimmed == "" {
			continue
		}

		_, err := DB.Exec(
			context.Background(),
			`INSERT INTO organization_tags (organization_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			orgID,
			trimmed,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetOrganizationTags returns all tags for an organization.
func GetOrganizationTags(orgID int64) ([]string, error) {
	rows, err := DB.Query(
		context.Background(),
		`SELECT tag FROM organization_tags WHERE organization_id = $1 ORDER BY tag`,
		orgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []string

	for rows.Next() {
		var tag string

		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}

		tags = append(tags, tag)
	}

	return tags, rows.Err()
}

// GetOrganizationBySlug returns the organization detail for the given slug.
func GetOrganizationBySlug(slug string) (*OrganizationDetail, error) {
	var org OrganizationDetail
	var createdAt, updatedAt time.Time

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT
			o.id, o.name, o.slug, o.description, o.visibility,
			o.email, o.purpose, o.avatar, o.verified,
			u.id, COALESCE(u.name, ''), u.image,
			(SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id),
			o.created_at, o.updated_at
		FROM organizations o
		JOIN "user" u ON u.id = o.created_by
		WHERE o.slug = $1
		`,
		slug,
	).Scan(
		&org.ID, &org.Name, &org.Slug, &org.Description, &org.Visibility,
		&org.Email, &org.Purpose, &org.Avatar, &org.Verified,
		&org.CreatedBy.ID, &org.CreatedBy.Name, &org.CreatedBy.Image,
		&org.MemberCount,
		&createdAt, &updatedAt,
	)

	if err != nil {
		return nil, err
	}

	org.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	org.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	tags, err := GetOrganizationTags(org.ID)
	if err != nil {
		return nil, err
	}

	org.Tags = tags

	return &org, nil
}

// GetUserOrganizations returns all organizations the user is a member of.
func GetUserOrganizations(userID string) ([]OrganizationListItem, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT
			o.id, o.name, o.slug, o.avatar, o.verified,
			om.role, om.pinned,
			(SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id),
			o.created_at
		FROM organizations o
		JOIN organization_members om ON om.organization_id = o.id
		WHERE om.user_id = $1
		ORDER BY om.pinned DESC, o.created_at DESC
		`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orgs []OrganizationListItem

	for rows.Next() {
		var org OrganizationListItem
		var createdAt time.Time

		if err := rows.Scan(
			&org.ID, &org.Name, &org.Slug, &org.Avatar, &org.Verified,
			&org.Role, &org.Pinned,
			&org.MemberCount,
			&createdAt,
		); err != nil {
			return nil, err
		}

		org.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		orgs = append(orgs, org)
	}

	return orgs, rows.Err()
}

// IsOrganizationMember reports whether the given user is a member of the org.
func IsOrganizationMember(orgID int64, userID string) (bool, error) {
	var member bool

	err := DB.QueryRow(
		context.Background(),
		`SELECT EXISTS(SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2)`,
		orgID,
		userID,
	).Scan(&member)

	return member, err
}

// GetOrganizationMemberRole returns the user's role in the organization, or
// empty string if not a member.
func GetOrganizationMemberRole(orgID int64, userID string) (string, error) {
	var role string

	err := DB.QueryRow(
		context.Background(),
		`SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
		orgID,
		userID,
	).Scan(&role)

	if err != nil {
		return "", err
	}

	return role, nil
}

// UpdateOrganizationAvatar sets the avatar path for an organization.
func UpdateOrganizationAvatar(slug, avatar string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE organizations SET avatar = $1, updated_at = NOW() WHERE slug = $2`,
		avatar,
		slug,
	)

	return err
}

// CreateOrganizationInTx inserts a new organization inside the given transaction.
func CreateOrganizationInTx(ctx context.Context, tx pgx.Tx, org Organization) (int64, error) {
	var id int64

	err := tx.QueryRow(
		ctx,
		`
		INSERT INTO organizations (name, slug, description, visibility, email, purpose, verified, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
		`,
		org.Name,
		org.Slug,
		org.Description,
		org.Visibility,
		org.Email,
		org.Purpose,
		org.Verified,
		org.CreatedBy,
	).Scan(&id)

	return id, err
}

// AddOrganizationMemberInTx adds a user to an organization inside the given transaction.
func AddOrganizationMemberInTx(ctx context.Context, tx pgx.Tx, orgID int64, userID, role string, pinned bool) error {
	_, err := tx.Exec(
		ctx,
		`
		INSERT INTO organization_members (organization_id, user_id, role, pinned)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (organization_id, user_id) DO NOTHING
		`,
		orgID,
		userID,
		role,
		pinned,
	)

	return err
}

// SetOrganizationTagsInTx replaces all tags for an organization inside the given transaction.
func SetOrganizationTagsInTx(ctx context.Context, tx pgx.Tx, orgID int64, tags []string) error {
	if len(tags) == 0 {
		return nil
	}

	_, err := tx.Exec(
		ctx,
		`DELETE FROM organization_tags WHERE organization_id = $1`,
		orgID,
	)
	if err != nil {
		return err
	}

	for _, tag := range tags {
		trimmed := strings.TrimSpace(tag)
		if trimmed == "" {
			continue
		}

		_, err := tx.Exec(
			ctx,
			`INSERT INTO organization_tags (organization_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			orgID,
			trimmed,
		)
		if err != nil {
			return err
		}
	}

	return nil
}
