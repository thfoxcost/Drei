package db

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

func CreateRepository(repo Repository) error {
	_, err := DB.Exec(
		context.Background(),
		`INSERT INTO repositories
		(name, owner_id, owner, description, visibility, path)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		repo.Name,
		repo.OwnerID,
		repo.Owner,
		repo.Description,
		repo.Visibility,
		repo.Path,
	)

	return err
}
