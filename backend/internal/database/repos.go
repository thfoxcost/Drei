package database

import (
	"context"
	"time"
)

type Repository struct {
	Name          string
	OwnerID       string
	Owner         string
	Description   string
	Visibility    bool
	Path          string
	DefaultBranch string
}

func CreateRepository(repo Repository) (int64, error) {
	var id int64

	err := DB.QueryRow(
		context.Background(),
		`INSERT INTO repositories
		(name, owner_id, owner, description, visibility, path, default_branch)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`,
		repo.Name,
		repo.OwnerID,
		repo.Owner,
		repo.Description,
		repo.Visibility,
		repo.Path,
		repo.DefaultBranch,
	).Scan(&id)

	return id, err
}

func UpdateRepositoryDefaultBranch(owner, name, branch string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET default_branch = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		branch,
	)

	return err
}

func UpdateRepositoryName(owner, oldName, newName, newPath string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET name = $3, path = $4, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		oldName,
		newName,
		newPath,
	)

	return err
}

func UpdateRepositoryDescription(owner, name, description string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET description = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		description,
	)

	return err
}

func UpdateRepositoryWebsite(owner, name, website string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET website = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		website,
	)

	return err
}

func UpdateRepositoryLogo(owner, name, logo string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET logo = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		logo,
	)

	return err
}

func UpdateRepositoryArchived(owner, name string, archived bool, archivedAt *time.Time) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET archived = $3, archived_at = $4, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		archived,
		archivedAt,
	)

	return err
}

func UpdateRepositoryVisibility(owner, name string, visibility bool) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET visibility = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		visibility,
	)

	return err
}

func DeleteRepository(owner, name string) error {
	_, err := DB.Exec(
		context.Background(),
		`DELETE FROM repositories
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
	)

	return err
}

// GetRepositoryByID returns the repository row by its primary key.
func GetRepositoryByID(id int64) (*RepoInfo, error) {
	var repo RepoInfo

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT
			r.id, r.owner_id, r.owner, r.name, r.description, r.visibility,
			COALESCE(r.logo, ''), COALESCE(r.website, ''),
			r.archived, r.archived_at, r.default_branch, r.path, r.created_at,
			r.organization_id,
			r.forked_from_id,
			COALESCE(src.owner, ''),
			COALESCE(src.name, '')
		FROM repositories r
		LEFT JOIN repositories src ON r.forked_from_id = src.id
		WHERE r.id = $1
		`,
		id,
	).Scan(
		&repo.ID,
		&repo.OwnerID,
		&repo.Owner,
		&repo.Name,
		&repo.Description,
		&repo.Visibility,
		&repo.Logo,
		&repo.Website,
		&repo.Archived,
		&repo.ArchivedAt,
		&repo.DefaultBranch,
		&repo.Path,
		&repo.CreatedAt,
		&repo.OrganizationID,
		&repo.ForkedFromID,
		&repo.ForkedFromOwner,
		&repo.ForkedFromName,
	)

	if err != nil {
		return nil, err
	}

	return &repo, nil
}

// HasUserFork checks whether the given user already has a fork of the source
// repository. It matches on the user's ID stored in the repositories table.
func HasUserFork(userID string, sourceRepoID int64) (bool, error) {
	var exists bool

	err := DB.QueryRow(
		context.Background(),
		`SELECT EXISTS (
			SELECT 1 FROM repositories
			WHERE owner_id = $1 AND forked_from_id = $2
		)`,
		userID,
		sourceRepoID,
	).Scan(&exists)

	return exists, err
}

// ForkOwner represents a user who has forked a repository.
type ForkOwner struct {
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

// GetForks returns the fork count and the list of users who forked a repository.
// Avatars are resolved from the "user" table so every returned owner is a real
// registered user record.
func GetForks(sourceRepoID int64) (int64, []ForkOwner, error) {
	var count int64

	err := DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FROM repositories WHERE forked_from_id = $1`,
		sourceRepoID,
	).Scan(&count)
	if err != nil {
		return 0, nil, err
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT DISTINCT ON (lower(r.owner))
		       r.owner AS username,
		       COALESCE(u.image, '') AS avatar
		FROM repositories r
		LEFT JOIN "user" u ON lower(u.name) = lower(r.owner)
		WHERE r.forked_from_id = $1
		ORDER BY lower(r.owner), r.created_at ASC
		`,
		sourceRepoID,
	)
	if err != nil {
		return count, nil, err
	}
	defer rows.Close()

	var owners []ForkOwner

	for rows.Next() {
		var fo ForkOwner
		if err := rows.Scan(&fo.Username, &fo.Avatar); err != nil {
			return count, nil, err
		}

		owners = append(owners, fo)
	}

	return count, owners, rows.Err()
}

// CreateForkRepository inserts a new forked repository row. The forked_from_id
// column links back to the source repository.
func CreateForkRepository(repo Repository, forkedFromID int64) (int64, error) {
	var id int64

	err := DB.QueryRow(
		context.Background(),
		`INSERT INTO repositories
		(name, owner_id, owner, description, visibility, path, default_branch, forked_from_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`,
		repo.Name,
		repo.OwnerID,
		repo.Owner,
		repo.Description,
		repo.Visibility,
		repo.Path,
		repo.DefaultBranch,
		forkedFromID,
	).Scan(&id)

	return id, err
}

// CreateOrganizationRepository inserts a new organization-owned repository
// row. owner is the organization slug (disk/URL namespace), owner_id is the
// creating user's ID (provenance), and organization_id links the org.
func CreateOrganizationRepository(repo Repository, organizationID int64) (int64, error) {
	var id int64

	err := DB.QueryRow(
		context.Background(),
		`INSERT INTO repositories
		(name, owner_id, owner, description, visibility, path, default_branch, organization_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id`,
		repo.Name,
		repo.OwnerID,
		repo.Owner,
		repo.Description,
		repo.Visibility,
		repo.Path,
		repo.DefaultBranch,
		organizationID,
	).Scan(&id)

	return id, err
}

// GetOrganizationRepositories returns all repository rows owned by the given
// organization, ordered by most recently updated. DB-driven (not a disk
// scan) so repositories without commits are included.
func GetOrganizationRepositories(organizationID int64) ([]RepoInfo, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT
			r.id, r.owner_id, r.owner, r.name, r.description, r.visibility,
			COALESCE(r.logo, ''), COALESCE(r.website, ''),
			r.archived, r.archived_at, r.default_branch, r.path, r.created_at,
			r.organization_id,
			r.forked_from_id,
			COALESCE(src.owner, ''),
			COALESCE(src.name, '')
		FROM repositories r
		LEFT JOIN repositories src ON r.forked_from_id = src.id
		WHERE r.organization_id = $1
		ORDER BY r.updated_at DESC
		`,
		organizationID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var repos []RepoInfo

	for rows.Next() {
		var repo RepoInfo

		if err := rows.Scan(
			&repo.ID,
			&repo.OwnerID,
			&repo.Owner,
			&repo.Name,
			&repo.Description,
			&repo.Visibility,
			&repo.Logo,
			&repo.Website,
			&repo.Archived,
			&repo.ArchivedAt,
			&repo.DefaultBranch,
			&repo.Path,
			&repo.CreatedAt,
			&repo.OrganizationID,
			&repo.ForkedFromID,
			&repo.ForkedFromOwner,
			&repo.ForkedFromName,
		); err != nil {
			return nil, err
		}

		repos = append(repos, repo)
	}

	if repos == nil {
		repos = []RepoInfo{}
	}

	return repos, rows.Err()
}

// CountForks returns the number of repositories forked from the given repo.
func CountForks(sourceRepoID int64) (int64, error) {
	var count int64

	err := DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FROM repositories WHERE forked_from_id = $1`,
		sourceRepoID,
	).Scan(&count)

	return count, err
}
