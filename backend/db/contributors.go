package db

import (
	"context"
	"strings"
)

type Contributor struct {
	ID       string  `json:"id"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

// GetContributors returns the contributors for a repository, deduplicated
// case-insensitively by username so the same user can never appear twice in
// the API response. The earliest inserted row wins, which keeps the
// repository owner (inserted first) at the top.
func GetContributors(repoID int64) ([]Contributor, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT user_id, username, avatar
		FROM (
			SELECT id, user_id, username, avatar,
			       ROW_NUMBER() OVER (PARTITION BY lower(username) ORDER BY id) AS rn
			FROM contributors
			WHERE repo_id = $1
		) c
		WHERE rn = 1
		ORDER BY id
		`,
		repoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contributors []Contributor

	for rows.Next() {
		var c Contributor

		if err := rows.Scan(&c.ID, &c.Username, &c.Avatar); err != nil {
			return nil, err
		}

		contributors = append(contributors, c)
	}

	return contributors, rows.Err()
}

// CreateContributor inserts a new contributor for a repository. The unique
// index on (repo_id, lower(username)) plus ON CONFLICT DO NOTHING guarantee a
// user is never stored twice for the same repository.
func CreateContributor(repoID int64, c Contributor) error {
	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO contributors (repo_id, user_id, username, avatar)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (repo_id, lower(username)) DO NOTHING
		`,
		repoID,
		c.ID,
		c.Username,
		c.Avatar,
	)

	return err
}

// SyncContributors upserts commit-derived author names into the contributors
// table so the database stays the single source of truth for contributor
// data, including contributors discovered from git history.
func SyncContributors(repoID int64, usernames []string) error {
	cleaned := make([]string, 0, len(usernames))

	for _, username := range usernames {
		trimmed := strings.TrimSpace(username)

		if trimmed == "" {
			continue
		}

		cleaned = append(cleaned, trimmed)
	}

	if len(cleaned) == 0 {
		return nil
	}

	_, err := DB.Exec(
		context.Background(),
		`
		INSERT INTO contributors (repo_id, username)
		SELECT $1, unnest($2::text[])
		ON CONFLICT (repo_id, lower(username)) DO NOTHING
		`,
		repoID,
		cleaned,
	)

	return err
}
