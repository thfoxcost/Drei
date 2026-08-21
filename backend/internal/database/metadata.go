package database

import (
	"context"
	"time"
)

type RepoInfo struct {
	ID              int64
	OwnerID         string
	Owner           string
	Name            string
	Description     string
	Visibility      bool
	Logo            string
	Website         string
	Archived        bool
	ArchivedAt      *time.Time
	DefaultBranch   string
	Path            string
	CreatedAt       time.Time
	ForkedFromID    *int64
	ForkedFromOwner string
	ForkedFromName  string
}

func GetRepository(owner, name string) (*RepoInfo, error) {
	var repo RepoInfo

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT
			r.id,
			r.owner_id,
			r.owner,
			r.name,
			r.description,
			r.visibility,
			COALESCE(r.logo, ''),
			COALESCE(r.website, ''),
			r.archived,
			r.archived_at,
			r.default_branch,
			r.path,
			r.created_at,
			r.forked_from_id,
			COALESCE(src.owner, ''),
			COALESCE(src.name, '')
		FROM repositories r
		LEFT JOIN repositories src ON r.forked_from_id = src.id
		WHERE r.owner = $1 AND r.name = $2
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
		&repo.ForkedFromID,
		&repo.ForkedFromOwner,
		&repo.ForkedFromName,
	)

	if err != nil {
		return nil, err
	}

	return &repo, nil
}
