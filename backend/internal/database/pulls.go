package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// PullRequestUser is a resolved user record attached to a pull request.
type PullRequestUser struct {
	ID       string  `json:"id"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

// PullRequestComment is a comment on a pull request with its author resolved.
type PullRequestComment struct {
	ID        int64            `json:"id"`
	Body      string           `json:"body"`
	CreatedBy PullRequestUser  `json:"createdBy"`
	CreatedAt string           `json:"createdAt"`
	UpdatedAt string           `json:"updatedAt"`
}

// PullRequestEvent is a timeline entry for a pull request.
type PullRequestEvent struct {
	ID        int64            `json:"id"`
	Type      string           `json:"type"`
	Actor     PullRequestUser  `json:"actor"`
	Metadata  map[string]any   `json:"metadata,omitempty"`
	CreatedAt string           `json:"createdAt"`
}

// PullRequest is the JSON shape returned to the frontend.
type PullRequest struct {
	ID              int64               `json:"id"`
	Number          int                 `json:"number"`
	Title           string              `json:"title"`
	Description     string              `json:"description"`
	State           string              `json:"state"`
	Author          PullRequestUser     `json:"author"`
	SourceBranch    string              `json:"sourceBranch"`
	TargetBranch    string              `json:"targetBranch"`
	MergeCommitHash *string             `json:"mergeCommitHash"`
	MergedAt        *string             `json:"mergedAt"`
	MergedBy        *PullRequestUser    `json:"mergedBy"`
	ClosedAt        *string             `json:"closedAt"`
	ClosedBy        *PullRequestUser    `json:"closedBy"`
	CreatedAt       string              `json:"createdAt"`
	UpdatedAt       string              `json:"updatedAt"`
	CommentCount    int                 `json:"commentCount"`
	Comments        []PullRequestComment `json:"comments"`
	Assignees       []PullRequestUser   `json:"assignees"`
	Reviewers       []PullRequestUser   `json:"reviewers"`
	Labels          []PRLabel           `json:"labels"`
	Participants    []PullRequestUser   `json:"participants"`
	Notifications   bool                `json:"notifications"`
}

// PullRequestFilter describes the optional filters and sort applied when
// listing pull requests.
type PullRequestFilter struct {
	State    string
	AuthorID string
	Search   string
	Sort     string
}

const prSelectColumns = `
	pr.id,
	pr.number,
	pr.title,
	COALESCE(pr.description, ''),
	pr.state,
	pr.author_id,
	COALESCE(au.name, ''),
	au.image,
	pr.source_branch,
	pr.target_branch,
	pr.merge_commit_hash,
	pr.merged_at,
	pr.merged_by,
	COALESCE(mu.name, ''),
	mu.image,
	pr.closed_at,
	pr.closed_by,
	COALESCE(cbu.name, ''),
	cbu.image,
	pr.created_at,
	pr.updated_at,
	COALESCE((
		SELECT COUNT(*)
		FROM pull_request_comments pc
		WHERE pc.pull_request_id = pr.id
	), 0),
	pr.notifications`

const prFromClause = `
	FROM pull_requests pr
	LEFT JOIN "user" au ON au.id = pr.author_id
	LEFT JOIN "user" mu ON mu.id = pr.merged_by
	LEFT JOIN "user" cbu ON cbu.id = pr.closed_by`

func scanPullRequest(row rowScanner) (PullRequest, error) {
	var pr PullRequest

	var (
		mergedAt        *time.Time
		mergedByID      *string
		mergedByName    *string
		mergedByAvatar  *string
		closedAt        *time.Time
		closedByID      *string
		closedByName    *string
		closedByAvatar  *string
		createdAt       time.Time
		updatedAt       time.Time
		mergeCommitHash *string
	)

	err := row.Scan(
		&pr.ID,
		&pr.Number,
		&pr.Title,
		&pr.Description,
		&pr.State,
		&pr.Author.ID,
		&pr.Author.Username,
		&pr.Author.Avatar,
		&pr.SourceBranch,
		&pr.TargetBranch,
		&mergeCommitHash,
		&mergedAt,
		&mergedByID,
		&mergedByName,
		&mergedByAvatar,
		&closedAt,
		&closedByID,
		&closedByName,
		&closedByAvatar,
		&createdAt,
		&updatedAt,
		&pr.CommentCount,
		&pr.Notifications,
	)
	if err != nil {
		return PullRequest{}, err
	}

	pr.MergeCommitHash = mergeCommitHash
	pr.CreatedAt = createdAt.Format(time.RFC3339)
	pr.UpdatedAt = updatedAt.Format(time.RFC3339)

	if mergedAt != nil {
		formatted := mergedAt.Format(time.RFC3339)
		pr.MergedAt = &formatted
	}

	if mergedByID != nil {
		pr.MergedBy = &PullRequestUser{
			ID:       *mergedByID,
			Username: coalesceString(mergedByName),
			Avatar:   mergedByAvatar,
		}
	}

	if closedAt != nil {
		formatted := closedAt.Format(time.RFC3339)
		pr.ClosedAt = &formatted
	}

	if closedByID != nil {
		pr.ClosedBy = &PullRequestUser{
			ID:       *closedByID,
			Username: coalesceString(closedByName),
			Avatar:   closedByAvatar,
		}
	}

	pr.Comments = []PullRequestComment{}
	pr.Assignees = []PullRequestUser{}
	pr.Reviewers = []PullRequestUser{}
	pr.Labels = []PRLabel{}
	pr.Participants = []PullRequestUser{}

	return pr, nil
}

// FindOpenDuplicatePR returns the number of an open pull request that has the
// same source and target branch pair, or nil if none exists.
func FindOpenDuplicatePR(repoID int64, sourceBranch, targetBranch string) (*int, error) {
	var number int

	err := DB.QueryRow(
		context.Background(),
		`SELECT number FROM pull_requests
		WHERE repo_id = $1 AND source_branch = $2 AND target_branch = $3 AND state = 'open'
		LIMIT 1`,
		repoID, sourceBranch, targetBranch,
	).Scan(&number)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &number, nil
}

// GetPullRequest returns a single pull request by its repository-scoped number.
func GetPullRequest(repoID int64, number int) (*PullRequest, error) {
	pr, err := scanPullRequest(DB.QueryRow(
		context.Background(),
		`SELECT `+prSelectColumns+`
		`+prFromClause+`
		WHERE pr.repo_id = $1 AND pr.number = $2`,
		repoID,
		number,
	))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &pr, nil
}

// pullRequestWhere builds the WHERE clause and arguments for a filter, without
// the state predicate.
func pullRequestWhere(repoID int64, filter PullRequestFilter) (string, []any, int) {
	query := " WHERE pr.repo_id = $1"
	args := []any{repoID}
	param := 2

	if filter.AuthorID != "" {
		query += fmt.Sprintf(" AND pr.author_id = $%d", param)
		args = append(args, filter.AuthorID)
		param++
	}

	if filter.Search != "" {
		pattern := "%" + filter.Search + "%"
		query += fmt.Sprintf(
			" AND (pr.title ILIKE $%d OR pr.description ILIKE $%d OR pr.number::text = $%d)",
			param, param+1, param+2,
		)
		args = append(args, pattern, pattern, filter.Search)
		param += 3
	}

	return query, args, param
}

// appendPRStateAndSort appends the state predicate and ORDER BY clause for a
// pull requests list query.
func appendPRStateAndSort(query string, param int, args []any, filter PullRequestFilter) (string, []any) {
	switch filter.State {
	case "open":
		query += fmt.Sprintf(" AND pr.state = 'open'")
	case "closed":
		query += fmt.Sprintf(" AND pr.state = 'closed'")
	case "merged":
		query += fmt.Sprintf(" AND pr.state = 'merged'")
	}

	switch filter.Sort {
	case "oldest":
		query += " ORDER BY pr.created_at ASC"
	case "recently-updated":
		query += " ORDER BY pr.updated_at DESC"
	case "least-updated":
		query += " ORDER BY pr.updated_at ASC"
	case "most-commented":
		query += " ORDER BY comment_count DESC, pr.id DESC"
	case "least-commented":
		query += " ORDER BY comment_count ASC, pr.id ASC"
	case "source-branch":
		query += " ORDER BY pr.source_branch ASC, pr.number DESC"
	case "target-branch":
		query += " ORDER BY pr.target_branch ASC, pr.number DESC"
	default:
		query += " ORDER BY pr.created_at DESC"
	}

	return query, args
}

// listPullRequests runs the shared pull requests list query.
func listPullRequests(repoID int64, filter PullRequestFilter) ([]PullRequest, error) {
	query := `SELECT ` + prSelectColumns + `
		` + prFromClause
	where, args, param := pullRequestWhere(repoID, filter)
	query += where

	query, args = appendPRStateAndSort(query, param, args, filter)

	rows, err := DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pullRequests []PullRequest

	for rows.Next() {
		pr, err := scanPullRequest(rows)
		if err != nil {
			return nil, err
		}

		pullRequests = append(pullRequests, pr)
	}

	return pullRequests, rows.Err()
}

// ListPullRequests returns the pull requests of a repository, filtered and
// sorted according to the given filter.
func ListPullRequests(repoID int64, filter PullRequestFilter) ([]PullRequest, error) {
	return listPullRequests(repoID, filter)
}

// CountPullRequests returns the open, closed, and merged pull request counts
// for a repository after applying every non-state filter.
func CountPullRequests(repoID int64, filter PullRequestFilter) (open, closed, merged int, err error) {
	where, args, _ := pullRequestWhere(repoID, filter)

	err = DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FILTER (WHERE pr.state = 'open'),
		       COUNT(*) FILTER (WHERE pr.state = 'closed'),
		       COUNT(*) FILTER (WHERE pr.state = 'merged')
		FROM pull_requests pr`+where,
		args...,
	).Scan(&open, &closed, &merged)

	return open, closed, merged, err
}

// linkPRLabels creates labels if they don't exist and links them to a PR.
func linkPRLabels(pullRequestID, repoID int64, labelNames []string) error {
	ctx := context.Background()

	for _, name := range labelNames {
		name = strings.TrimSpace(name)

		if name == "" {
			continue
		}

		var labelID int64

		err := DB.QueryRow(
			ctx,
			`SELECT id FROM issue_labels WHERE repo_id = $1 AND lower(name) = lower($2)`,
			repoID, name,
		).Scan(&labelID)

		if errors.Is(err, pgx.ErrNoRows) {
			err = DB.QueryRow(
				ctx,
				`INSERT INTO issue_labels (repo_id, name) VALUES ($1, $2) RETURNING id`,
				repoID, name,
			).Scan(&labelID)
		}

		if err != nil {
			return err
		}

		_, err = DB.Exec(
			ctx,
			`INSERT INTO pr_label_links (pull_request_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			pullRequestID, labelID,
		)

		if err != nil {
			return err
		}
	}

	return nil
}

// CreatePullRequest inserts a new open pull request, allocating the next
// repository-scoped number atomically under a row lock on the repository.
// An "opened" event is recorded in the same transaction.
func CreatePullRequest(repoID int64, authorID, title, description, sourceBranch, targetBranch string, labelNames []string, assigneeIDs, reviewerIDs []string) (PullRequest, error) {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return PullRequest{}, err
	}
	defer tx.Rollback(ctx)

	// Serialize issue/PR number allocation per repository.
	_, err = tx.Exec(ctx, `SELECT id FROM repositories WHERE id = $1 FOR UPDATE`, repoID)
	if err != nil {
		return PullRequest{}, err
	}

	var number int

	err = tx.QueryRow(
		ctx,
		`
		SELECT COALESCE(MAX(n), 0) + 1 FROM (
			SELECT MAX(number) AS n FROM issues       WHERE repo_id = $1
			UNION ALL
			SELECT MAX(number) AS n FROM pull_requests WHERE repo_id = $1
		) combined
		`,
		repoID,
	).Scan(&number)
	if err != nil {
		return PullRequest{}, err
	}

	var prID int64

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO pull_requests (repo_id, number, title, description, state, author_id, source_branch, target_branch)
		VALUES ($1, $2, $3, $4, 'open', $5, $6, $7)
		RETURNING id
		`,
		repoID,
		number,
		title,
		description,
		authorID,
		sourceBranch,
		targetBranch,
	).Scan(&prID)
	if err != nil {
		return PullRequest{}, err
	}

	metadata, _ := json.Marshal(map[string]any{
		"source_branch": sourceBranch,
		"target_branch": targetBranch,
	})

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, 'opened', $2, $3)`,
		prID,
		authorID,
		metadata,
	)
	if err != nil {
		return PullRequest{}, err
	}

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_comments (pull_request_id, body, created_by)
		 VALUES ($1, '*No description*', $2)`,
		prID,
		authorID,
	)
	if err != nil {
		return PullRequest{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PullRequest{}, err
	}

	created, err := GetPullRequest(repoID, number)
	if err != nil {
		return PullRequest{}, err
	}

	if created == nil {
		return PullRequest{}, pgx.ErrNoRows
	}

	if len(labelNames) > 0 {
		if err := linkPRLabels(created.ID, repoID, labelNames); err != nil {
			return PullRequest{}, err
		}
	}

	if len(assigneeIDs) > 0 {
		if err := SetPRAssignees(created.ID, assigneeIDs); err != nil {
			return PullRequest{}, err
		}
	}

	if len(reviewerIDs) > 0 {
		if err := SetPRReviewers(created.ID, reviewerIDs); err != nil {
			return PullRequest{}, err
		}
	}

	return *created, nil
}

// UpdatePullRequest updates the editable fields of a pull request.
func UpdatePullRequest(repoID int64, number int, title, description string) error {
	_, err := DB.Exec(
		context.Background(),
		`
		UPDATE pull_requests
		SET title = $3,
		    description = $4,
		    updated_at = NOW()
		WHERE repo_id = $1 AND number = $2
		`,
		repoID,
		number,
		title,
		description,
	)

	return err
}

// ClosePullRequest closes an open pull request without merging. Only open PRs
// can be closed. A "state_change" event is recorded.
func ClosePullRequest(repoID int64, number int, actorID string) error {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var prID int64

	err = tx.QueryRow(
		ctx,
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&prID)
	if err != nil {
		return err
	}

	result, err := tx.Exec(
		ctx,
		`
		UPDATE pull_requests
		SET state = 'closed',
		    closed_at = NOW(),
		    closed_by = $3,
		    updated_at = NOW()
		WHERE repo_id = $1 AND number = $2 AND state = 'open'
		`,
		repoID,
		number,
		actorID,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pull request #%d is not open", number)
	}

	metadata, _ := json.Marshal(map[string]any{
		"old_state": "open",
		"new_state": "closed",
	})

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, 'state_change', $2, $3)`,
		prID,
		actorID,
		metadata,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// MergePullRequest merges an open pull request. Only open PRs can be merged.
// Sets the merge commit hash, merged_at, and merged_by fields. A "merged"
// event is recorded.
func MergePullRequest(repoID int64, number int, actorID, mergeCommitHash string) error {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var prID int64

	err = tx.QueryRow(
		ctx,
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&prID)
	if err != nil {
		return err
	}

	result, err := tx.Exec(
		ctx,
		`
		UPDATE pull_requests
		SET state = 'merged',
		    merge_commit_hash = $3,
		    merged_at = NOW(),
		    merged_by = $4,
		    updated_at = NOW()
		WHERE repo_id = $1 AND number = $2 AND state = 'open'
		`,
		repoID,
		number,
		mergeCommitHash,
		actorID,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pull request #%d is not open", number)
	}

	metadata, _ := json.Marshal(map[string]any{
		"merge_commit_hash": mergeCommitHash,
	})

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, 'merged', $2, $3)`,
		prID,
		actorID,
		metadata,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ReopenPullRequest reopens a closed (but not merged) pull request. Only
// closed PRs can be reopened; merged PRs cannot. A "state_change" event is
// recorded.
func ReopenPullRequest(repoID int64, number int, actorID string) error {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var prID int64

	err = tx.QueryRow(
		ctx,
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&prID)
	if err != nil {
		return err
	}

	result, err := tx.Exec(
		ctx,
		`
		UPDATE pull_requests
		SET state = 'open',
		    closed_at = NULL,
		    closed_by = NULL,
		    updated_at = NOW()
		WHERE repo_id = $1 AND number = $2 AND state = 'closed'
		`,
		repoID,
		number,
	)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("pull request #%d is not closed", number)
	}

	metadata, _ := json.Marshal(map[string]any{
		"old_state": "closed",
		"new_state": "open",
	})

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, 'state_change', $2, $3)`,
		prID,
		actorID,
		metadata,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ListPullRequestComments returns the comments of a pull request in creation
// order, with authors resolved against the "user" table.
func ListPullRequestComments(repoID int64, number int) ([]PullRequestComment, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT pc.id, pc.body, pc.created_by, COALESCE(u.name, ''), u.image, pc.created_at, pc.updated_at
		FROM pull_request_comments pc
		JOIN pull_requests pr ON pr.id = pc.pull_request_id
		LEFT JOIN "user" u ON u.id = pc.created_by
		WHERE pr.repo_id = $1 AND pr.number = $2
		ORDER BY pc.created_at ASC, pc.id ASC
		`,
		repoID,
		number,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []PullRequestComment

	for rows.Next() {
		var comment PullRequestComment

		var (
			createdAt time.Time
			updatedAt time.Time
		)

		if err := rows.Scan(
			&comment.ID,
			&comment.Body,
			&comment.CreatedBy.ID,
			&comment.CreatedBy.Username,
			&comment.CreatedBy.Avatar,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}

		comment.CreatedAt = createdAt.Format(time.RFC3339)
		comment.UpdatedAt = updatedAt.Format(time.RFC3339)

		comments = append(comments, comment)
	}

	return comments, rows.Err()
}

// AddPullRequestComment creates a comment on a pull request and returns it
// resolved. A "comment" event is recorded in the same transaction.
func AddPullRequestComment(repoID int64, number int, authorID, body string) (PullRequestComment, error) {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return PullRequestComment{}, err
	}
	defer tx.Rollback(ctx)

	var prID int64

	err = tx.QueryRow(
		ctx,
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&prID)
	if err != nil {
		return PullRequestComment{}, err
	}

	var comment PullRequestComment

	var (
		createdAt time.Time
		updatedAt time.Time
	)

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO pull_request_comments (pull_request_id, body, created_by)
		VALUES ($1, $2, $3)
		RETURNING id, body, created_by, created_at, updated_at
		`,
		prID,
		body,
		authorID,
	).Scan(
		&comment.ID,
		&comment.Body,
		&comment.CreatedBy.ID,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return PullRequestComment{}, err
	}

	comment.CreatedAt = createdAt.Format(time.RFC3339)
	comment.UpdatedAt = updatedAt.Format(time.RFC3339)

	err = tx.QueryRow(
		ctx,
		`SELECT COALESCE(u.name, ''), u.image FROM "user" u WHERE u.id = $1`,
		authorID,
	).Scan(&comment.CreatedBy.Username, &comment.CreatedBy.Avatar)
	if err != nil {
		return PullRequestComment{}, err
	}

	_, err = tx.Exec(
		ctx,
		`UPDATE pull_requests SET updated_at = NOW() WHERE id = $1`,
		prID,
	)
	if err != nil {
		return PullRequestComment{}, err
	}

	preview := body
	if len(preview) > 100 {
		preview = preview[:100]
	}

	metadata, _ := json.Marshal(map[string]any{
		"body_preview": preview,
	})

	_, err = tx.Exec(
		ctx,
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, 'comment', $2, $3)`,
		prID,
		authorID,
		metadata,
	)
	if err != nil {
		return PullRequestComment{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PullRequestComment{}, err
	}

	return comment, nil
}

// UpdatePullRequestComment updates the body of a comment belonging to a pull
// request.
func UpdatePullRequestComment(repoID int64, number int, commentID int64, body string) (PullRequestComment, error) {
	var comment PullRequestComment

	var (
		createdAt time.Time
		updatedAt time.Time
	)

	err := DB.QueryRow(
		context.Background(),
		`
		UPDATE pull_request_comments pc
		SET body = $1, updated_at = NOW()
		FROM pull_requests pr
		WHERE pc.id = $2
		  AND pr.id = pc.pull_request_id
		  AND pr.repo_id = $3
		  AND pr.number = $4
		RETURNING pc.id, pc.body, pc.created_by, pc.created_at, pc.updated_at
		`,
		body,
		commentID,
		repoID,
		number,
	).Scan(
		&comment.ID,
		&comment.Body,
		&comment.CreatedBy.ID,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PullRequestComment{}, nil
		}
		return PullRequestComment{}, err
	}

	comment.CreatedAt = createdAt.Format(time.RFC3339)
	comment.UpdatedAt = updatedAt.Format(time.RFC3339)

	err = DB.QueryRow(
		context.Background(),
		`SELECT COALESCE(u.name, ''), u.image FROM "user" u WHERE u.id = $1`,
		comment.CreatedBy.ID,
	).Scan(&comment.CreatedBy.Username, &comment.CreatedBy.Avatar)
	if err != nil {
		return PullRequestComment{}, err
	}

	return comment, nil
}

// DeletePullRequestComment removes a comment belonging to a pull request.
func DeletePullRequestComment(repoID int64, number int, commentID int64) error {
	_, err := DB.Exec(
		context.Background(),
		`
		DELETE FROM pull_request_comments pc
		USING pull_requests pr
		WHERE pc.id = $1
		  AND pr.id = pc.pull_request_id
		  AND pr.repo_id = $2
		  AND pr.number = $3
		`,
		commentID,
		repoID,
		number,
	)

	return err
}

// ListPullRequestEvents returns the activity timeline of a pull request in
// chronological order, with actors resolved against the "user" table.
func ListPullRequestEvents(repoID int64, number int) ([]PullRequestEvent, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT pe.id, pe.type, pe.actor_id, COALESCE(u.name, ''), u.image,
		       pe.metadata, pe.created_at
		FROM pull_request_events pe
		JOIN pull_requests pr ON pr.id = pe.pull_request_id
		LEFT JOIN "user" u ON u.id = pe.actor_id
		WHERE pr.repo_id = $1 AND pr.number = $2
		ORDER BY pe.created_at ASC, pe.id ASC
		`,
		repoID,
		number,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []PullRequestEvent

	for rows.Next() {
		var event PullRequestEvent
		var metadataBytes []byte
		var createdAt time.Time

		if err := rows.Scan(
			&event.ID,
			&event.Type,
			&event.Actor.ID,
			&event.Actor.Username,
			&event.Actor.Avatar,
			&metadataBytes,
			&createdAt,
		); err != nil {
			return nil, err
		}

		if metadataBytes != nil {
			if err := json.Unmarshal(metadataBytes, &event.Metadata); err != nil {
				return nil, err
			}
		}

		event.CreatedAt = createdAt.Format(time.RFC3339)

		events = append(events, event)
	}

	return events, rows.Err()
}

// InsertPullRequestEvent inserts a single event for a pull request.
func InsertPullRequestEvent(repoID int64, number int, actorID, eventType string, metadata []byte) {
	var prID int64
	err := DB.QueryRow(
		context.Background(),
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID, number,
	).Scan(&prID)
	if err != nil {
		return
	}

	_, _ = DB.Exec(
		context.Background(),
		`INSERT INTO pull_request_events (pull_request_id, type, actor_id, metadata)
		 VALUES ($1, $2, $3, $4)`,
		prID, eventType, actorID, metadata,
	)
}

// UpdatePullRequestEventMetadata updates the metadata of the first event of
// the given type for a pull request.
func UpdatePullRequestEventMetadata(repoID int64, number int, eventType string, metadata map[string]any) {
	var prID int64
	err := DB.QueryRow(
		context.Background(),
		`SELECT id FROM pull_requests WHERE repo_id = $1 AND number = $2`,
		repoID, number,
	).Scan(&prID)
	if err != nil {
		return
	}

	metaBytes, err := json.Marshal(metadata)
	if err != nil {
		return
	}

	_, _ = DB.Exec(
		context.Background(),
		`UPDATE pull_request_events SET metadata = $1
		 WHERE id = (
			SELECT id FROM pull_request_events
			WHERE pull_request_id = $2 AND type = $3
			ORDER BY id ASC LIMIT 1
		 )`,
		metaBytes, prID, eventType,
	)
}

// ── PR Assignees ────────────────────────────────────────────────────────────

// SetPRAssignees replaces the full set of assignees on a pull request.
func SetPRAssignees(pullRequestID int64, assigneeIDs []string) error {
	tx, err := DB.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background()) //nolint:errcheck

	if _, err := tx.Exec(context.Background(),
		`DELETE FROM pr_assignees WHERE pull_request_id = $1`, pullRequestID); err != nil {
		return err
	}

	for _, userID := range assigneeIDs {
		if _, err := tx.Exec(context.Background(),
			`INSERT INTO pr_assignees (pull_request_id, user_id) VALUES ($1, $2)`,
			pullRequestID, userID); err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}

// GetPRAssignees returns the users assigned to a pull request.
func GetPRAssignees(pullRequestID int64) ([]PullRequestUser, error) {
	rows, err := DB.Query(context.Background(), `
		SELECT u.id, COALESCE(u.name, ''), u.image
		FROM pr_assignees pa
		JOIN "user" u ON u.id = pa.user_id
		WHERE pa.pull_request_id = $1
		ORDER BY pa.created_at
	`, pullRequestID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var assignees []PullRequestUser

	for rows.Next() {
		var u PullRequestUser

		if err := rows.Scan(&u.ID, &u.Username, &u.Avatar); err != nil {
			return nil, err
		}

		assignees = append(assignees, u)
	}

	return assignees, rows.Err()
}

// ── PR Reviewers ────────────────────────────────────────────────────────────

// SetPRReviewers replaces the full set of reviewers on a pull request.
func SetPRReviewers(pullRequestID int64, reviewerIDs []string) error {
	tx, err := DB.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background()) //nolint:errcheck

	if _, err := tx.Exec(context.Background(),
		`DELETE FROM pr_reviewers WHERE pull_request_id = $1`, pullRequestID); err != nil {
		return err
	}

	for _, userID := range reviewerIDs {
		if _, err := tx.Exec(context.Background(),
			`INSERT INTO pr_reviewers (pull_request_id, user_id) VALUES ($1, $2)`,
			pullRequestID, userID); err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}

// GetPRReviewers returns the users assigned as reviewers on a pull request.
func GetPRReviewers(pullRequestID int64) ([]PullRequestUser, error) {
	rows, err := DB.Query(context.Background(), `
		SELECT u.id, COALESCE(u.name, ''), u.image
		FROM pr_reviewers prr
		JOIN "user" u ON u.id = prr.user_id
		WHERE prr.pull_request_id = $1
		ORDER BY prr.created_at
	`, pullRequestID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var reviewers []PullRequestUser

	for rows.Next() {
		var u PullRequestUser

		if err := rows.Scan(&u.ID, &u.Username, &u.Avatar); err != nil {
			return nil, err
		}

		reviewers = append(reviewers, u)
	}

	return reviewers, rows.Err()
}

// ── PR Labels ───────────────────────────────────────────────────────────────

// PRLabel is a repository label linked to a pull request.
type PRLabel struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

// SetPRLabels replaces the full set of labels on a pull request.
func SetPRLabels(pullRequestID int64, labelIDs []int64) error {
	tx, err := DB.Begin(context.Background())
	if err != nil {
		return err
	}

	defer tx.Rollback(context.Background()) //nolint:errcheck

	if _, err := tx.Exec(context.Background(),
		`DELETE FROM pr_label_links WHERE pull_request_id = $1`, pullRequestID); err != nil {
		return err
	}

	for _, labelID := range labelIDs {
		if _, err := tx.Exec(context.Background(),
			`INSERT INTO pr_label_links (pull_request_id, label_id) VALUES ($1, $2)`,
			pullRequestID, labelID); err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}

// GetPRLabels returns the labels linked to a pull request.
func GetPRLabels(pullRequestID int64) ([]PRLabel, error) {
	rows, err := DB.Query(context.Background(), `
		SELECT il.id, il.name, COALESCE(il.color, '')
		FROM pr_label_links pll
		JOIN issue_labels il ON il.id = pll.label_id
		WHERE pll.pull_request_id = $1
		ORDER BY il.name
	`, pullRequestID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var labels []PRLabel

	for rows.Next() {
		var l PRLabel

		if err := rows.Scan(&l.ID, &l.Name, &l.Color); err != nil {
			return nil, err
		}

		labels = append(labels, l)
	}

	return labels, rows.Err()
}

// GetPRParticipants returns all unique users who participated in a pull
// request — the author, commenters, assignees, and reviewers.
func GetPRParticipants(pullRequestID int64) ([]PullRequestUser, error) {
	rows, err := DB.Query(context.Background(), `
		SELECT DISTINCT u.id, COALESCE(u.name, ''), u.image
		FROM (
			SELECT pr.author_id AS user_id
			FROM pull_requests pr
			WHERE pr.id = $1
			UNION
			SELECT prc.created_by
			FROM pull_request_comments prc
			WHERE prc.pull_request_id = $1
			UNION
			SELECT pa.user_id
			FROM pr_assignees pa
			WHERE pa.pull_request_id = $1
			UNION
			SELECT prr.user_id
			FROM pr_reviewers prr
			WHERE prr.pull_request_id = $1
		) all_users
		JOIN "user" u ON u.id = all_users.user_id
		ORDER BY u.id
	`, pullRequestID)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var users []PullRequestUser

	for rows.Next() {
		var u PullRequestUser

		if err := rows.Scan(&u.ID, &u.Username, &u.Avatar); err != nil {
			return nil, err
		}

		users = append(users, u)
	}

	return users, rows.Err()
}

// ── PR Notifications ──────────────────────────────────────────────────────

// SetPRNotifications updates the notification preference for a pull request.
func SetPRNotifications(pullRequestID int64, enabled bool) error {
	_, err := DB.Exec(context.Background(),
		`UPDATE pull_requests SET notifications = $2, updated_at = NOW() WHERE id = $1`,
		pullRequestID, enabled,
	)
	return err
}

// ── PR Viewed Files ───────────────────────────────────────────────────────

// GetPRViewedFiles returns the set of file paths the given user has marked as
// viewed for the specified pull request.
func GetPRViewedFiles(pullRequestID int64, userID string) ([]string, error) {
	rows, err := DB.Query(context.Background(),
		`SELECT file_path FROM pr_viewed_files
		 WHERE pull_request_id = $1 AND user_id = $2
		 ORDER BY file_path`,
		pullRequestID, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var paths []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		paths = append(paths, p)
	}
	return paths, rows.Err()
}

// MarkPRFileViewed marks a single file as viewed for the given user and PR.
// It is idempotent — marking an already-viewed file is a no-op.
func MarkPRFileViewed(pullRequestID int64, userID, filePath string) error {
	_, err := DB.Exec(context.Background(),
		`INSERT INTO pr_viewed_files (pull_request_id, user_id, file_path)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (pull_request_id, user_id, file_path) DO NOTHING`,
		pullRequestID, userID, filePath,
	)
	return err
}

// UnmarkPRFileViewed removes the viewed mark for a single file.
func UnmarkPRFileViewed(pullRequestID int64, userID, filePath string) error {
	_, err := DB.Exec(context.Background(),
		`DELETE FROM pr_viewed_files
		 WHERE pull_request_id = $1 AND user_id = $2 AND file_path = $3`,
		pullRequestID, userID, filePath,
	)
	return err
}

// SetPRViewedFiles replaces the entire set of viewed files for a user and PR
// in a single transaction. It deletes all existing rows and inserts the new set.
func SetPRViewedFiles(pullRequestID int64, userID string, filePaths []string) error {
	tx, err := DB.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	_, err = tx.Exec(context.Background(),
		`DELETE FROM pr_viewed_files WHERE pull_request_id = $1 AND user_id = $2`,
		pullRequestID, userID,
	)
	if err != nil {
		return err
	}

	for _, fp := range filePaths {
		_, err = tx.Exec(context.Background(),
			`INSERT INTO pr_viewed_files (pull_request_id, user_id, file_path)
			 VALUES ($1, $2, $3)`,
			pullRequestID, userID, fp,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(context.Background())
}
