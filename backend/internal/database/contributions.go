package database

import (
	"context"
	"time"
)

// ContributionRepo is a repository namespace relevant to a user's activity:
// repositories they own plus repositories they collaborate on.
type ContributionRepo struct {
	Owner      string
	Name       string
	Visibility bool
}

// ContributionIdentity is the account identity used to attribute git commits
// and database events to a user.
type ContributionIdentity struct {
	ID       string
	Username string
	Email    string
}

// GetContributionIdentity resolves a username (case-insensitive) to the
// account id, canonical username, and email used for activity attribution.
// A missing user returns sql.ErrNoRows-equivalent error from QueryRow.
func GetContributionIdentity(username string) (*ContributionIdentity, error) {
	var ident ContributionIdentity

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT id, name, COALESCE(email, '')
		FROM "user"
		WHERE lower(name) = lower($1)
		`,
		username,
	).Scan(&ident.ID, &ident.Username, &ident.Email)

	if err != nil {
		return nil, err
	}

	return &ident, nil
}

// ListContributionRepos returns every repository namespace a user participates
// in: repositories in their personal namespace plus repositories where they
// are recorded as a contributor (collaborator). Organization repositories they
// own via membership are covered through the contributors table.
func ListContributionRepos(userID, username string) ([]ContributionRepo, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT DISTINCT r.owner, r.name, r.visibility
		FROM repositories r
		LEFT JOIN contributors c ON c.repo_id = r.id
		WHERE lower(r.owner) = lower($1)
		   OR c.user_id = $2
		   OR lower(c.username) = lower($1)
		ORDER BY r.owner, r.name
		`,
		username,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	repos := []ContributionRepo{}

	for rows.Next() {
		var repo ContributionRepo

		if err := rows.Scan(&repo.Owner, &repo.Name, &repo.Visibility); err != nil {
			return nil, err
		}

		repos = append(repos, repo)
	}

	return repos, rows.Err()
}

// countEventsByDay groups rows created by a user in [start, end) by UTC
// calendar day. table must be one of the known event tables with author_id
// and created_at columns; the caller passes a literal, never user input.
func countEventsByDay(table, userID string, start, end time.Time) (map[string]int, error) {
	var query string

	switch table {
	case "issues":
		query = `SELECT (created_at AT TIME ZONE 'UTC')::date, COUNT(*) FROM issues`
	case "pull_requests":
		query = `SELECT (created_at AT TIME ZONE 'UTC')::date, COUNT(*) FROM pull_requests`
	default:
		return map[string]int{}, nil
	}

	query += ` WHERE author_id = $1 AND created_at >= $2 AND created_at < $3
		GROUP BY 1`

	rows, err := DB.Query(context.Background(), query, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := map[string]int{}

	for rows.Next() {
		var day time.Time
		var n int

		if err := rows.Scan(&day, &n); err != nil {
			return nil, err
		}

		counts[day.Format("2006-01-02")] = n
	}

	return counts, rows.Err()
}

// CountIssuesOpenedByDay returns per-day counts of issues opened by the user.
func CountIssuesOpenedByDay(userID string, start, end time.Time) (map[string]int, error) {
	return countEventsByDay("issues", userID, start, end)
}

// CountPullRequestsOpenedByDay returns per-day counts of pull requests opened
// by the user.
func CountPullRequestsOpenedByDay(userID string, start, end time.Time) (map[string]int, error) {
	return countEventsByDay("pull_requests", userID, start, end)
}

// IsRepoContributor reports whether the user collaborates on the given
// repository (by id or username match), used to grant visibility into private
// repositories they participate in.
func IsRepoContributor(repoOwner, repoName, userID, username string) (bool, error) {
	var exists bool

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM repositories r
			JOIN contributors c ON c.repo_id = r.id
			WHERE lower(r.owner) = lower($1)
			  AND lower(r.name) = lower($2)
			  AND (c.user_id = $3 OR lower(c.username) = lower($4))
		)
		`,
		repoOwner,
		repoName,
		userID,
		username,
	).Scan(&exists)

	return exists, err
}
