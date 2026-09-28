package database

import (
	"context"
	"strings"
	"time"
)

// Activity event types returned by the activity feed. Branch deletions and
// issue reopenings are intentionally absent: neither has a backing record
// (branches leave no trace when deleted; reopening an issue just clears
// closed_at), so they cannot be reconstructed reliably.
const (
	ActivityRepoCreated = "repo_created"
	ActivityRepoForked  = "repo_forked"
	ActivityIssueOpened = "issue_opened"
	ActivityIssueClosed = "issue_closed"
	ActivityPROpened    = "pr_opened"
	ActivityPRClosed    = "pr_closed"
	ActivityPRMerged    = "pr_merged"
	ActivityPRApproved  = "pr_approved"
	ActivityPush        = "push"
)

// ActivityActor is the user who performed the event.
type ActivityActor struct {
	ID       string  `json:"id"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

// ActivityRepo is the repository namespace the event belongs to.
type ActivityRepo struct {
	Owner string `json:"owner"`
	Name  string `json:"name"`
}

// ActivityItem is a single feed entry. Number is set for issue/PR events,
// Sha/Message for pushes, Title for issues/PRs, ForkedFrom for fork events.
type ActivityItem struct {
	ID         string        `json:"id"`
	Type       string        `json:"type"`
	Actor      ActivityActor `json:"actor"`
	Repo       ActivityRepo  `json:"repo"`
	ForkedFrom *ActivityRepo `json:"forkedFrom,omitempty"`
	Number     *int          `json:"number,omitempty"`
	Title      string        `json:"title,omitempty"`
	Sha        string        `json:"sha,omitempty"`
	Message    string        `json:"message,omitempty"`
	CreatedAt  string        `json:"createdAt"`
}

// activityTime is the parsed timestamp used for sorting before formatting.
type activityTime struct {
	item ActivityItem
	when time.Time
}

// ActivityRepoScope is a repository the viewer participates in: one they own
// (owner_id), collaborate on (contributors), or access via organization
// membership. ListContributionRepos misses organization repos whose owner is
// the org slug, so this query covers all three explicitly.
type ActivityRepoScope struct {
	ID           int64
	Owner        string
	Name         string
	Visibility   bool
	Organization *int64
}

// ListActivityRepos returns the repositories relevant to a viewer's network
// feed, most recently updated first (capped so git fan-out stays bounded).
func ListActivityRepos(userID string, limit int) ([]ActivityRepoScope, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT DISTINCT r.id, r.owner, r.name, r.visibility, r.organization_id
		FROM repositories r
		LEFT JOIN contributors c ON c.repo_id = r.id AND c.user_id = $1
		LEFT JOIN organization_members om ON om.organization_id = r.organization_id AND om.user_id = $1
		WHERE r.owner_id = $1
		   OR c.user_id = $1
		   OR om.user_id = $1
		ORDER BY r.id DESC
		LIMIT $2
		`,
		userID,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	repos := []ActivityRepoScope{}

	for rows.Next() {
		var repo ActivityRepoScope

		if err := rows.Scan(&repo.ID, &repo.Owner, &repo.Name, &repo.Visibility, &repo.Organization); err != nil {
			return nil, err
		}

		repos = append(repos, repo)
	}

	return repos, rows.Err()
}

// repoIDs extracts the ids for ANY($1) clauses.
func repoIDs(repos []ActivityRepoScope) []int64 {
	ids := make([]int64, 0, len(repos))
	for _, r := range repos {
		ids = append(ids, r.ID)
	}
	return ids
}

// ListRepoActivityEvents returns issue/PR/repo-creation events on the given
// repositories from any actor (the network half of the feed). Pushes are
// collected from git history by the caller.
func ListRepoActivityEvents(repos []ActivityRepoScope) ([]ActivityItem, error) {
	items := []ActivityItem{}

	if len(repos) == 0 {
		return items, nil
	}

	ids := repoIDs(repos)

	if err := appendRepoCreatedEvents(&items, ids); err != nil {
		return nil, err
	}
	if err := appendForkEvents(&items, ids); err != nil {
		return nil, err
	}
	if err := appendIssueEvents(&items, ids); err != nil {
		return nil, err
	}
	if err := appendPREvents(&items, ids); err != nil {
		return nil, err
	}
	if err := appendPRApprovalEvents(&items, ids); err != nil {
		return nil, err
	}

	return items, nil
}

// ListAuthoredActivityElsewhere returns the viewer's own issue/PR actions on
// public repositories outside their network scope (e.g. opening an issue on a
// stranger's public repo). Private repos are excluded: the viewer has no
// access there by definition when the repo is out of scope.
func ListAuthoredActivityElsewhere(viewerID string, scopeIDs []int64) ([]ActivityItem, error) {
	items := []ActivityItem{}

	if err := appendAuthoredIssueEvents(&items, viewerID, scopeIDs); err != nil {
		return nil, err
	}
	if err := appendAuthoredPREvents(&items, viewerID, scopeIDs); err != nil {
		return nil, err
	}

	return items, nil
}

func appendRepoCreatedEvents(items *[]ActivityItem, ids []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT r.id, r.owner, r.name, r.created_at,
		       u.id, COALESCE(u.name, ''), u.image
		FROM repositories r
		JOIN "user" u ON u.id = r.owner_id
		WHERE r.id = ANY($1::bigint[])
		  AND r.forked_from_id IS NULL
		`,
		ids,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id        int64
			owner     string
			name      string
			createdAt time.Time
			actor     ActivityActor
		)

		if err := rows.Scan(&id, &owner, &name, &createdAt, &actor.ID, &actor.Username, &actor.Avatar); err != nil {
			return err
		}

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("repo", id),
			Type:      ActivityRepoCreated,
			Actor:     actor,
			Repo:      ActivityRepo{Owner: owner, Name: name},
			CreatedAt: createdAt.Format(time.RFC3339),
		})
	}

	return rows.Err()
}

// appendForkEvents adds "user forked repo from source" entries for forked
// repositories in scope. Forks are excluded from repo_created events above,
// so each fork appears exactly once, as a fork.
func appendForkEvents(items *[]ActivityItem, ids []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT r.id, r.owner, r.name, r.created_at,
		       u.id, COALESCE(u.name, ''), u.image,
		       src.owner, src.name
		FROM repositories r
		JOIN "user" u ON u.id = r.owner_id
		JOIN repositories src ON src.id = r.forked_from_id
		WHERE r.id = ANY($1::bigint[])
		  AND r.forked_from_id IS NOT NULL
		`,
		ids,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id        int64
			owner     string
			name      string
			createdAt time.Time
			actor     ActivityActor
			srcOwner  string
			srcName   string
		)

		if err := rows.Scan(&id, &owner, &name, &createdAt, &actor.ID, &actor.Username, &actor.Avatar, &srcOwner, &srcName); err != nil {
			return err
		}

		*items = append(*items, ActivityItem{
			ID:         formatActivityID("repo-fork", id),
			Type:       ActivityRepoForked,
			Actor:      actor,
			Repo:       ActivityRepo{Owner: owner, Name: name},
			ForkedFrom: &ActivityRepo{Owner: srcOwner, Name: srcName},
			CreatedAt:  createdAt.Format(time.RFC3339),
		})
	}

	return rows.Err()
}

func appendIssueEvents(items *[]ActivityItem, ids []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT i.id, i.number, i.title, i.created_at, i.closed_at,
		       au.id, COALESCE(au.name, ''), au.image,
		       cu.id, COALESCE(cu.name, ''), cu.image,
		       r.owner, r.name
		FROM issues i
		JOIN repositories r ON r.id = i.repo_id
		LEFT JOIN "user" au ON au.id = i.author_id
		LEFT JOIN "user" cu ON cu.id = i.closed_by
		WHERE i.repo_id = ANY($1::bigint[])
		`,
		ids,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id        int64
			number    int
			title     string
			createdAt time.Time
			closedAt  *time.Time
			author    ActivityActor
			closer    ActivityActor
			closerID  *string
			owner     string
			name      string
		)

		if err := rows.Scan(&id, &number, &title, &createdAt, &closedAt,
			&author.ID, &author.Username, &author.Avatar,
			&closerID, &closer.Username, &closer.Avatar,
			&owner, &name); err != nil {
			return err
		}

		if closerID != nil {
			closer.ID = *closerID
		}

		repo := ActivityRepo{Owner: owner, Name: name}
		n := number

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("issue-open", id),
			Type:      ActivityIssueOpened,
			Actor:     author,
			Repo:      repo,
			Number:    &n,
			Title:     title,
			CreatedAt: createdAt.Format(time.RFC3339),
		})

		if closedAt != nil && closerID != nil {
			*items = append(*items, ActivityItem{
				ID:        formatActivityID("issue-close", id),
				Type:      ActivityIssueClosed,
				Actor:     closer,
				Repo:      repo,
				Number:    &n,
				Title:     title,
				CreatedAt: closedAt.Format(time.RFC3339),
			})
		}
	}

	return rows.Err()
}

func appendPREvents(items *[]ActivityItem, ids []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT pr.id, pr.number, pr.title, pr.created_at, pr.closed_at, pr.merged_at,
		       au.id, COALESCE(au.name, ''), au.image,
		       cu.id, COALESCE(cu.name, ''), cu.image,
		       mu.id, COALESCE(mu.name, ''), mu.image,
		       r.owner, r.name
		FROM pull_requests pr
		JOIN repositories r ON r.id = pr.repo_id
		LEFT JOIN "user" au ON au.id = pr.author_id
		LEFT JOIN "user" cu ON cu.id = pr.closed_by
		LEFT JOIN "user" mu ON mu.id = pr.merged_by
		WHERE pr.repo_id = ANY($1::bigint[])
		`,
		ids,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id       int64
			number   int
			title    string
			created  time.Time
			closedAt *time.Time
			mergedAt *time.Time
			author   ActivityActor
			closer   ActivityActor
			merger   ActivityActor
			closerID *string
			mergerID *string
			owner    string
			name     string
		)

		if err := rows.Scan(&id, &number, &title, &created, &closedAt, &mergedAt,
			&author.ID, &author.Username, &author.Avatar,
			&closerID, &closer.Username, &closer.Avatar,
			&mergerID, &merger.Username, &merger.Avatar,
			&owner, &name); err != nil {
			return err
		}
		if closerID != nil {
			closer.ID = *closerID
		}
		if mergerID != nil {
			merger.ID = *mergerID
		}

		repo := ActivityRepo{Owner: owner, Name: name}
		n := number

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("pr-open", id),
			Type:      ActivityPROpened,
			Actor:     author,
			Repo:      repo,
			Number:    &n,
			Title:     title,
			CreatedAt: created.Format(time.RFC3339),
		})

		if mergedAt != nil && mergerID != nil {
			*items = append(*items, ActivityItem{
				ID:        formatActivityID("pr-merge", id),
				Type:      ActivityPRMerged,
				Actor:     merger,
				Repo:      repo,
				Number:    &n,
				Title:     title,
				CreatedAt: mergedAt.Format(time.RFC3339),
			})
		} else if closedAt != nil && closerID != nil {
			*items = append(*items, ActivityItem{
				ID:        formatActivityID("pr-close", id),
				Type:      ActivityPRClosed,
				Actor:     closer,
				Repo:      repo,
				Number:    &n,
				Title:     title,
				CreatedAt: closedAt.Format(time.RFC3339),
			})
		}
	}

	return rows.Err()
}

func appendPRApprovalEvents(items *[]ActivityItem, ids []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT rev.pull_request_id, pr.number, pr.title, MIN(rev.created_at),
		       ru.id, COALESCE(ru.name, ''), ru.image,
		       r.owner, r.name
		FROM pull_request_reviews rev
		JOIN pull_requests pr ON pr.id = rev.pull_request_id
		JOIN repositories r ON r.id = pr.repo_id
		JOIN "user" ru ON ru.id = rev.reviewer_id
		WHERE pr.repo_id = ANY($1::bigint[])
		  AND rev.state = 'approved'
		GROUP BY rev.pull_request_id, pr.number, pr.title, ru.id, ru.name, ru.image, r.owner, r.name
		`,
		ids,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			prID      int64
			number    int
			title     string
			createdAt time.Time
			reviewer  ActivityActor
			owner     string
			name      string
		)

		if err := rows.Scan(&prID, &number, &title, &createdAt,
			&reviewer.ID, &reviewer.Username, &reviewer.Avatar,
			&owner, &name); err != nil {
			return err
		}

		n := number

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("pr-approve", prID),
			Type:      ActivityPRApproved,
			Actor:     reviewer,
			Repo:      ActivityRepo{Owner: owner, Name: name},
			Number:    &n,
			Title:     title,
			CreatedAt: createdAt.Format(time.RFC3339),
		})
	}

	return rows.Err()
}

func appendAuthoredIssueEvents(items *[]ActivityItem, viewerID string, scopeIDs []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT i.id, i.number, i.title, i.created_at,
		       u.id, COALESCE(u.name, ''), u.image,
		       r.owner, r.name
		FROM issues i
		JOIN repositories r ON r.id = i.repo_id
		JOIN "user" u ON u.id = i.author_id
		WHERE i.author_id = $1
		  AND r.visibility = TRUE
		  AND NOT (r.id = ANY($2::bigint[]))
		`,
		viewerID,
		scopeIDs,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id        int64
			number    int
			title     string
			createdAt time.Time
			author    ActivityActor
			owner     string
			name      string
		)

		if err := rows.Scan(&id, &number, &title, &createdAt,
			&author.ID, &author.Username, &author.Avatar,
			&owner, &name); err != nil {
			return err
		}

		n := number

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("issue-open", id),
			Type:      ActivityIssueOpened,
			Actor:     author,
			Repo:      ActivityRepo{Owner: owner, Name: name},
			Number:    &n,
			Title:     title,
			CreatedAt: createdAt.Format(time.RFC3339),
		})
	}

	return rows.Err()
}

func appendAuthoredPREvents(items *[]ActivityItem, viewerID string, scopeIDs []int64) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT pr.id, pr.number, pr.title, pr.created_at,
		       u.id, COALESCE(u.name, ''), u.image,
		       r.owner, r.name
		FROM pull_requests pr
		JOIN repositories r ON r.id = pr.repo_id
		JOIN "user" u ON u.id = pr.author_id
		WHERE pr.author_id = $1
		  AND r.visibility = TRUE
		  AND NOT (pr.repo_id = ANY($2::bigint[]))
		`,
		viewerID,
		scopeIDs,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var (
			id        int64
			number    int
			title     string
			createdAt time.Time
			author    ActivityActor
			owner     string
			name      string
		)

		if err := rows.Scan(&id, &number, &title, &createdAt,
			&author.ID, &author.Username, &author.Avatar,
			&owner, &name); err != nil {
			return err
		}

		n := number

		*items = append(*items, ActivityItem{
			ID:        formatActivityID("pr-open", id),
			Type:      ActivityPROpened,
			Actor:     author,
			Repo:      ActivityRepo{Owner: owner, Name: name},
			Number:    &n,
			Title:     title,
			CreatedAt: createdAt.Format(time.RFC3339),
		})
	}

	return rows.Err()
}

// ResolveActivityActorsByName batch-resolves usernames (case-insensitive) to
// full actor records for push attribution. Unknown names are absent.
func ResolveActivityActorsByName(usernames []string) (map[string]ActivityActor, error) {
	actors := map[string]ActivityActor{}

	if len(usernames) == 0 {
		return actors, nil
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, name, image
		FROM "user"
		WHERE lower(name) = ANY($1::text[])
		`,
		lowerStrings(usernames),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var actor ActivityActor

		if err := rows.Scan(&actor.ID, &actor.Username, &actor.Avatar); err != nil {
			return nil, err
		}

		actors[strings.ToLower(actor.Username)] = actor
	}

	return actors, rows.Err()
}

func lowerStrings(values []string) []string {
	out := make([]string, 0, len(values))
	seen := map[string]struct{}{}

	for _, v := range values {
		l := strings.ToLower(v)
		if l == "" {
			continue
		}
		if _, ok := seen[l]; ok {
			continue
		}
		seen[l] = struct{}{}
		out = append(out, l)
	}

	return out
}

func formatActivityID(prefix string, id int64) string {
	return prefix + "-" + itoa(id)
}

func itoa(n int64) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
