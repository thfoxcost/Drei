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

// GetContributors returns the contributors stored for a repository in the
// contributors table, resolved against the "user" table so every returned
// contributor is a full user record (id, username, avatar). Contributors that
// cannot be matched to a user are omitted, so empty ids are never returned.
// Users are deduplicated by id so the same user never appears twice. The
// earliest inserted row wins, which keeps the repository owner (inserted
// first) at the top.
func GetContributors(repoID int64) ([]Contributor, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, username, avatar
		FROM (
			SELECT DISTINCT ON (u.id)
			       u.id AS id,
			       u.name AS username,
			       u.image AS avatar,
			       c.id AS row_id
			FROM contributors c
			JOIN "user" u ON lower(u.name) = lower(c.username)
			WHERE c.repo_id = $1
			ORDER BY u.id, c.id
		) contrib
		ORDER BY row_id
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

// SyncContributors records the registered users behind the given commit
// author names as contributors for a repository. Only usernames that resolve
// to a row in the "user" table are stored, so every stored contributor is a
// complete user record (id, username, avatar). Rows that already exist but are
// missing a user id or avatar are backfilled with the resolved values. The
// database remains the single source of truth for contributors; usernames
// already stored are never regenerated from commit history.
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
		INSERT INTO contributors (repo_id, user_id, username, avatar)
		SELECT $1, u.id, c.username, u.image
		FROM unnest($2::text[]) AS c(username)
		JOIN "user" u ON lower(u.name) = lower(c.username)
		ON CONFLICT (repo_id, lower(username)) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			avatar = EXCLUDED.avatar
		WHERE contributors.user_id = '' OR contributors.avatar IS NULL
		`,
		repoID,
		cleaned,
	)

	return err
}
