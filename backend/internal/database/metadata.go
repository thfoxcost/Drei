package database

import (
	"context"
	"time"
)

type RepoInfo struct {
	ID            int64
	OwnerID       string
	Owner         string
	Name          string
	Description   string
	Visibility    bool
	Logo          string
	Website       string
	Archived      bool
	ArchivedAt    *time.Time
	DefaultBranch string
	Path          string
	CreatedAt     time.Time
}

func GetRepository(owner, name string) (*RepoInfo, error) {
	var repo RepoInfo

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT
			id,
			owner_id,
			owner,
			name,
			description,
			visibility,
			COALESCE(logo, ''),
			COALESCE(website, ''),
			archived,
			archived_at,
			default_branch,
			path,
			created_at
		FROM repositories
		WHERE owner = $1 AND name = $2
		`,
		owner,
		name,
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
	)

	if err != nil {
		return nil, err
	}

	return &repo, nil
}
