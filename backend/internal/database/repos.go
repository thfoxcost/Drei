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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
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
		WHERE owner = $1 AND name = $2`,
		owner,
		name,
	)

	return err
}
