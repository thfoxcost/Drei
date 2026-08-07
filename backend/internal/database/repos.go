package database

import (
	"context"
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
