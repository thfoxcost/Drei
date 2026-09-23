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

// IssueUser is a resolved user record attached to an issue. Avatar is nil when
// the user has no image set.
type IssueUser struct {
	ID       string  `json:"id"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar"`
}

// IssueComment is a comment on an issue with its author resolved to a user.
type IssueComment struct {
	ID        int64     `json:"id"`
	Body      string    `json:"body"`
	CreatedBy IssueUser `json:"createdBy"`
	CreatedAt string    `json:"createdAt"`
	UpdatedAt string    `json:"updatedAt"`
}

// Issue is the JSON shape returned to the frontend. Author, assignees and
// closedBy are resolved against the "user" table so the frontend never has to
// reconstruct relationships itself.
type Issue struct {
	ID           int64          `json:"id"`
	Number       int            `json:"number"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	State        string         `json:"state"`
	Author       IssueUser      `json:"author"`
	Assignees    []IssueUser    `json:"assignees"`
	Labels       []string       `json:"labels"`
	Owner        string         `json:"owner"`
	Repo         string         `json:"repo"`
	CreatedAt    string         `json:"createdAt"`
	UpdatedAt    string         `json:"updatedAt"`
	ClosedAt     *string        `json:"closedAt"`
	ClosedBy     *IssueUser     `json:"closedBy"`
	CloseReason  *string        `json:"closeReason"`
	DueDate      *string        `json:"dueDate"`
	CommentCount int            `json:"commentCount"`
	Comments     []IssueComment `json:"comments,omitempty"`
}

// IssueFilter describes the optional filters and sort applied when listing
// issues. An empty State keeps both open and closed issues.
type IssueFilter struct {
	State    string
	AuthorID string
	Assignee string
	Search   string
	Label    string
	Sort     string
}

// IssueLabel is a label that can be attached to issues of a repository.
type IssueLabel struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

const issueSelectColumns = `
	i.id,
	i.number,
	i.title,
	COALESCE(i.description, ''),
	i.state,
	i.author_id,
	COALESCE(au.name, ''),
	au.image,
	COALESCE((
		SELECT json_agg(json_build_object(
			'id', u.id,
			'username', COALESCE(u.name, ''),
			'avatar', u.image
		) ORDER BY u.name)
		FROM issue_assignees ia
		JOIN "user" u ON u.id = ia.user_id
		WHERE ia.issue_id = i.id
	), '[]'::json),
	i.closed_at,
	i.closed_by,
	cbu.name,
	cbu.image,
	i.close_reason,
	i.created_at,
	i.updated_at,
	i.due_date,
	COALESCE((
		SELECT array_agg(l.name ORDER BY l.name)
		FROM issue_label_links il
		JOIN issue_labels l ON l.id = il.label_id
		WHERE il.issue_id = i.id
	), '{}'),
	(
		SELECT COUNT(*)
		FROM issue_comments ic
		WHERE ic.issue_id = i.id
	),
	r.owner,
	r.name`

const issueFromClause = `
	FROM issues i
	LEFT JOIN "user" au ON au.id = i.author_id
	LEFT JOIN "user" cbu ON cbu.id = i.closed_by
	JOIN repositories r ON r.id = i.repo_id`

// rowScanner is satisfied by both *pgx.Row and pgx.Rows.
type rowScanner interface {
	Scan(dest ...any) error
}

// scanIssue maps a row from the shared issue select columns into an Issue.
func scanIssue(row rowScanner) (Issue, error) {
	var issue Issue

	var (
		closedAt       *time.Time
		closedByID     *string
		closedByName   *string
		closedByAvatar *string
		closeReason    *string
		createdAt      time.Time
		updatedAt      time.Time
		dueDate        *time.Time
		assigneesJSON  []byte
	)

	err := row.Scan(
		&issue.ID,
		&issue.Number,
		&issue.Title,
		&issue.Description,
		&issue.State,
		&issue.Author.ID,
		&issue.Author.Username,
		&issue.Author.Avatar,
		&assigneesJSON,
		&closedAt,
		&closedByID,
		&closedByName,
		&closedByAvatar,
		&closeReason,
		&createdAt,
		&updatedAt,
		&dueDate,
		&issue.Labels,
		&issue.CommentCount,
		&issue.Owner,
		&issue.Repo,
	)
	if err != nil {
		return Issue{}, err
	}

	if err := json.Unmarshal(assigneesJSON, &issue.Assignees); err != nil {
		return Issue{}, err
	}

	if issue.Assignees == nil {
		issue.Assignees = []IssueUser{}
	}

	issue.CreatedAt = createdAt.Format(time.RFC3339)
	issue.UpdatedAt = updatedAt.Format(time.RFC3339)

	if closedAt != nil {
		formatted := closedAt.Format(time.RFC3339)
		issue.ClosedAt = &formatted
	}

	if dueDate != nil {
		formatted := dueDate.Format(time.RFC3339)
		issue.DueDate = &formatted
	}

	if closedByID != nil {
		issue.ClosedBy = &IssueUser{
			ID:       *closedByID,
			Username: coalesceString(closedByName),
			Avatar:   closedByAvatar,
		}
	}

	issue.CloseReason = closeReason

	return issue, nil
}

func coalesceString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

// GetIssue returns a single issue by its repository-scoped number.
func GetIssue(repoID int64, number int) (*Issue, error) {
	issue, err := scanIssue(DB.QueryRow(
		context.Background(),
		`SELECT `+issueSelectColumns+`
		`+issueFromClause+`
		WHERE i.repo_id = $1 AND i.number = $2`,
		repoID,
		number,
	))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &issue, nil
}

// issueWhere builds the WHERE clause and arguments for a filter, without the
// state predicate. Callers apply the state filter themselves so list queries
// and counts share the same non-state filters. A nil repoID scopes the clause
// to every repository, which makes it safe to share between per-repo and
// global queries.
func issueWhere(repoID *int64, filter IssueFilter) (string, []any, int) {
	var query string
	var args []any
	param := 1

	if repoID != nil {
		query = " WHERE i.repo_id = $1"
		args = append(args, *repoID)
		param = 2
	} else {
		query = " WHERE TRUE"
	}

	if filter.AuthorID != "" {
		query += fmt.Sprintf(" AND i.author_id = $%d", param)
		args = append(args, filter.AuthorID)
		param++
	}

	switch filter.Assignee {
	case "none":
		query += " AND NOT EXISTS (SELECT 1 FROM issue_assignees ia WHERE ia.issue_id = i.id)"
	case "":
	default:
		query += fmt.Sprintf(" AND EXISTS (SELECT 1 FROM issue_assignees ia WHERE ia.issue_id = i.id AND ia.user_id = $%d)", param)
		args = append(args, filter.Assignee)
		param++
	}

	if filter.Search != "" {
		pattern := "%" + filter.Search + "%"
		query += fmt.Sprintf(
			" AND (i.title ILIKE $%d OR i.description ILIKE $%d OR i.number::text = $%d)",
			param, param+1, param+2,
		)
		args = append(args, pattern, pattern, filter.Search)
		param += 3
	}

	if filter.Label != "" {
		query += fmt.Sprintf(
			" AND EXISTS (SELECT 1 FROM issue_label_links ill JOIN issue_labels l ON l.id = ill.label_id WHERE ill.issue_id = i.id AND lower(l.name) = lower($%d))",
			param,
		)
		args = append(args, filter.Label)
		param++
	}

	return query, args, param
}

// appendIssueStateAndSort appends the state predicate and ORDER BY clause for
// an issues list query.
func appendIssueStateAndSort(query string, param int, args []any, filter IssueFilter) (string, []any) {
	if filter.State == "open" || filter.State == "closed" {
		query += fmt.Sprintf(" AND i.state = $%d", param)
		args = append(args, filter.State)
		param++
	}

	switch filter.Sort {
	case "oldest":
		query += " ORDER BY i.created_at ASC"
	case "recently-updated":
		query += " ORDER BY i.updated_at DESC"
	case "least-updated":
		query += " ORDER BY i.updated_at ASC"
	case "most-commented":
		query += " ORDER BY comment_count DESC, i.id DESC"
	case "least-commented":
		query += " ORDER BY comment_count ASC, i.id ASC"
	case "nearest-due":
		query += " ORDER BY i.due_date ASC NULLS LAST"
	case "farthest-due":
		query += " ORDER BY i.due_date DESC NULLS LAST"
	default:
		query += " ORDER BY i.created_at DESC"
	}

	return query, args
}

// listIssues runs the shared issues list query scoped to a single repository
// when repoID is non-nil and across every repository otherwise.
func listIssues(repoID *int64, filter IssueFilter) ([]Issue, error) {
	query := `SELECT ` + issueSelectColumns + `
		` + issueFromClause
	where, args, param := issueWhere(repoID, filter)
	query += where

	query, args = appendIssueStateAndSort(query, param, args, filter)

	rows, err := DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var issues []Issue

	for rows.Next() {
		issue, err := scanIssue(rows)
		if err != nil {
			return nil, err
		}

		issues = append(issues, issue)
	}

	return issues, rows.Err()
}

// ListIssues returns the issues of a repository, filtered and sorted according
// to the given filter. Search matches title, description and number.
func ListIssues(repoID int64, filter IssueFilter) ([]Issue, error) {
	return listIssues(&repoID, filter)
}

// ListAllIssues returns issues across every repository, filtered and sorted
// according to the given filter. Search matches title, description and number.
func ListAllIssues(filter IssueFilter) ([]Issue, error) {
	return listIssues(nil, filter)
}

// countIssues runs the shared issues count query scoped to a single repository
// when repoID is non-nil and across every repository otherwise.
func countIssues(repoID *int64, filter IssueFilter) (open, closed int, err error) {
	where, args, _ := issueWhere(repoID, filter)

	err = DB.QueryRow(
		context.Background(),
		`SELECT COUNT(*) FILTER (WHERE i.state = 'open'),
		       COUNT(*) FILTER (WHERE i.state = 'closed')
		FROM issues i`+where,
		args...,
	).Scan(&open, &closed)

	return open, closed, err
}

// CountIssues returns the open and closed issue counts for a repository after
// applying every non-state filter, so the counts always match the tabbed list.
func CountIssues(repoID int64, filter IssueFilter) (open, closed int, err error) {
	return countIssues(&repoID, filter)
}

// CountAllIssues returns the open and closed issue counts across every
// repository after applying every non-state filter.
func CountAllIssues(filter IssueFilter) (open, closed int, err error) {
	return countIssues(nil, filter)
}

// CreateIssue inserts a new open issue, allocating the next repository-scoped
// number atomically under a row lock on the repository. Labels are reused from
// the repository when they already exist and created otherwise; assignees are
// linked through the issue_assignees join table.
func CreateIssue(repoID int64, authorID, title, description string, labels, assignees []string, dueDate *time.Time) (Issue, error) {
	ctx := context.Background()

	tx, err := DB.Begin(ctx)
	if err != nil {
		return Issue{}, err
	}
	defer tx.Rollback(ctx)

	// Serialize issue/PR number allocation per repository. The lock on the
	// repository row prevents two concurrent creates (issue or PR) from
	// producing the same number.
	_, err = tx.Exec(ctx, `SELECT id FROM repositories WHERE id = $1 FOR UPDATE`, repoID)
	if err != nil {
		return Issue{}, err
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
		return Issue{}, err
	}

	var issueID int64

	err = tx.QueryRow(
		ctx,
		`
		INSERT INTO issues (repo_id, number, title, description, state, author_id, due_date)
		VALUES ($1, $2, $3, $4, 'open', $5, $6)
		RETURNING id
		`,
		repoID,
		number,
		title,
		description,
		authorID,
		dueDate,
	).Scan(&issueID)
	if err != nil {
		return Issue{}, err
	}

	if err := linkIssueLabels(ctx, tx, issueID, repoID, labels); err != nil {
		return Issue{}, err
	}

	if err := linkIssueAssignees(ctx, tx, issueID, assignees); err != nil {
		return Issue{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Issue{}, err
	}

	created, err := GetIssue(repoID, number)
	if err != nil {
		return Issue{}, err
	}

	if created == nil {
		return Issue{}, pgx.ErrNoRows
	}

	return *created, nil
}

// linkIssueAssignees links the given users to an issue. Each user id must
// already be validated as a member of the issue's repository by the caller.
func linkIssueAssignees(ctx context.Context, tx pgx.Tx, issueID int64, userIDs []string) error {
	for _, userID := range userIDs {
		userID = strings.TrimSpace(userID)

		if userID == "" {
			continue
		}

		_, err := tx.Exec(
			ctx,
			`
			INSERT INTO issue_assignees (issue_id, user_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			issueID,
			userID,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// linkIssueLabels ensures every given label exists for the repository and
// links it to the given issue, without touching labels not in the list.
// Existing labels are reused case-insensitively so a repository never ends up
// with duplicates differing only by case.
func linkIssueLabels(ctx context.Context, tx pgx.Tx, issueID, repoID int64, labels []string) error {
	for _, label := range labels {
		label = strings.TrimSpace(label)

		if label == "" {
			continue
		}

		var labelID int64

		err := tx.QueryRow(
			ctx,
			`
			SELECT id
			FROM issue_labels
			WHERE repo_id = $1 AND lower(name) = lower($2)
			`,
			repoID,
			label,
		).Scan(&labelID)

		if errors.Is(err, pgx.ErrNoRows) {
			err = tx.QueryRow(
				ctx,
				`
				INSERT INTO issue_labels (repo_id, name)
				VALUES ($1, $2)
				RETURNING id
				`,
				repoID,
				label,
			).Scan(&labelID)
		}

		if err != nil {
			return err
		}

		_, err = tx.Exec(
			ctx,
			`
			INSERT INTO issue_label_links (issue_id, label_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
			`,
			issueID,
			labelID,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// UpdateIssue updates the editable fields of an issue. All values are set
// explicitly; an empty title/description clears the field and a nil dueDate
// clears the due date.
func UpdateIssue(repoID int64, number int, title, description string, dueDate *time.Time) error {
	_, err := DB.Exec(
		context.Background(),
		`
		UPDATE issues
		SET title = $3,
		    description = $4,
		    due_date = $5,
		    updated_at = NOW()
		WHERE repo_id = $1 AND number = $2
		`,
		repoID,
		number,
		title,
		description,
		dueDate,
	)

	return err
}

// UpdateIssueState closes or reopens an issue. Closing records who closed it,
// when, and why (closeReason); reopening clears all three.
func UpdateIssueState(repoID int64, number int, state, actorID, closeReason string) error {
	var err error

	switch state {
	case "closed":
		_, err = DB.Exec(
			context.Background(),
			`
			UPDATE issues
			SET state = 'closed',
			    closed_at = NOW(),
			    closed_by = $3,
			    close_reason = NULLIF($4, ''),
			    updated_at = NOW()
			WHERE repo_id = $1 AND number = $2
			`,
			repoID,
			number,
			actorID,
			closeReason,
		)
	case "open":
		_, err = DB.Exec(
			context.Background(),
			`
			UPDATE issues
			SET state = 'open',
			    closed_at = NULL,
			    closed_by = NULL,
			    close_reason = NULL,
			    updated_at = NOW()
			WHERE repo_id = $1 AND number = $2
			`,
			repoID,
			number,
		)
	default:
		return fmt.Errorf("invalid issue state %q", state)
	}

	return err
}

// DeleteIssue permanently removes an issue. Related comments, assignee links
// and label links are removed by ON DELETE CASCADE.
func DeleteIssue(repoID int64, number int) error {
	_, err := DB.Exec(
		context.Background(),
		`
		DELETE FROM issues
		WHERE repo_id = $1 AND number = $2
		`,
		repoID,
		number,
	)

	return err
}

// SetIssueAssignees replaces the assignee set of an issue. Users not in the
// given list are unlinked, and each user id must already be validated as a
// member of the issue's repository by the caller.
func SetIssueAssignees(repoID int64, number int, userIDs []string) error {
	ctx := context.Background()

	var issueID int64

	err := DB.QueryRow(
		ctx,
		`SELECT id FROM issues WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&issueID)
	if err != nil {
		return err
	}

	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM issue_assignees WHERE issue_id = $1`, issueID)
	if err != nil {
		return err
	}

	if err := linkIssueAssignees(ctx, tx, issueID, userIDs); err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `UPDATE issues SET updated_at = NOW() WHERE id = $1`, issueID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// IsRepoMember reports whether the given user is the repository owner, one
// of its contributors, or a member of the owning organization, i.e. someone
// allowed to create issues and be assigned to them.
func IsRepoMember(repoID int64, userID string) (bool, error) {
	var member bool

	err := DB.QueryRow(
		context.Background(),
		`
		SELECT EXISTS (
			SELECT 1
			FROM repositories r
			WHERE r.id = $1 AND r.owner_id = $2
			UNION ALL
			SELECT 1
			FROM contributors c
			JOIN "user" u ON lower(u.name) = lower(c.username)
			WHERE c.repo_id = $1 AND u.id = $2
			UNION ALL
			SELECT 1
			FROM repositories r
			JOIN organization_members om ON om.organization_id = r.organization_id
			WHERE r.id = $1 AND om.user_id = $2
		)
		`,
		repoID,
		userID,
	).Scan(&member)

	return member, err
}

// SetIssueLabels replaces the label set of an issue. Labels not in the given
// list are unlinked, and new labels are created on demand.
func SetIssueLabels(repoID int64, number int, labels []string) error {
	ctx := context.Background()

	var issueID int64

	err := DB.QueryRow(
		ctx,
		`SELECT id FROM issues WHERE repo_id = $1 AND number = $2`,
		repoID,
		number,
	).Scan(&issueID)
	if err != nil {
		return err
	}

	tx, err := DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM issue_label_links WHERE issue_id = $1`, issueID)
	if err != nil {
		return err
	}

	if err := linkIssueLabels(ctx, tx, issueID, repoID, labels); err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `UPDATE issues SET updated_at = NOW() WHERE id = $1`, issueID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ListIssueComments returns the comments of an issue in creation order, with
// authors resolved against the "user" table.
func ListIssueComments(repoID int64, number int) ([]IssueComment, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT ic.id, ic.body, ic.created_by, COALESCE(u.name, ''), u.image, ic.created_at, ic.updated_at
		FROM issue_comments ic
		JOIN issues i ON i.id = ic.issue_id
		LEFT JOIN "user" u ON u.id = ic.created_by
		WHERE i.repo_id = $1 AND i.number = $2
		ORDER BY ic.created_at ASC, ic.id ASC
		`,
		repoID,
		number,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []IssueComment

	for rows.Next() {
		var comment IssueComment

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

// AddIssueComment creates a comment on an issue and returns it resolved.
func AddIssueComment(repoID int64, number int, authorID, body string) (IssueComment, error) {
	var comment IssueComment

	var (
		createdAt time.Time
		updatedAt time.Time
	)

	err := DB.QueryRow(
		context.Background(),
		`
		INSERT INTO issue_comments (issue_id, body, created_by)
		SELECT i.id, $2, $3
		FROM issues i
		WHERE i.repo_id = $1 AND i.number = $4
		RETURNING id, body, created_by, created_at, updated_at
		`,
		repoID,
		body,
		authorID,
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
			return IssueComment{}, nil
		}
		return IssueComment{}, err
	}

	comment.CreatedAt = createdAt.Format(time.RFC3339)
	comment.UpdatedAt = updatedAt.Format(time.RFC3339)

	err = DB.QueryRow(
		context.Background(),
		`SELECT COALESCE(u.name, ''), u.image FROM "user" u WHERE u.id = $1`,
		authorID,
	).Scan(&comment.CreatedBy.Username, &comment.CreatedBy.Avatar)
	if err != nil {
		return IssueComment{}, err
	}

	_, err = DB.Exec(
		context.Background(),
		`
		UPDATE issues
		SET updated_at = NOW()
		WHERE repo_id = $1 AND number = $2
		`,
		repoID,
		number,
	)

	return comment, err
}

// UpdateIssueComment updates the body of a comment belonging to an issue.
func UpdateIssueComment(repoID int64, number int, commentID int64, body string) (IssueComment, error) {
	var comment IssueComment

	var (
		createdAt time.Time
		updatedAt time.Time
	)

	err := DB.QueryRow(
		context.Background(),
		`
		UPDATE issue_comments ic
		SET body = $1, updated_at = NOW()
		FROM issues i
		WHERE ic.id = $2
		  AND i.id = ic.issue_id
		  AND i.repo_id = $3
		  AND i.number = $4
		RETURNING ic.id, ic.body, ic.created_by, ic.created_at, ic.updated_at
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
			return IssueComment{}, nil
		}
		return IssueComment{}, err
	}

	comment.CreatedAt = createdAt.Format(time.RFC3339)
	comment.UpdatedAt = updatedAt.Format(time.RFC3339)

	err = DB.QueryRow(
		context.Background(),
		`SELECT COALESCE(u.name, ''), u.image FROM "user" u WHERE u.id = $1`,
		comment.CreatedBy.ID,
	).Scan(&comment.CreatedBy.Username, &comment.CreatedBy.Avatar)
	if err != nil {
		return IssueComment{}, err
	}

	return comment, nil
}

// DeleteIssueComment removes a comment belonging to an issue.
func DeleteIssueComment(repoID int64, number int, commentID int64) error {
	_, err := DB.Exec(
		context.Background(),
		`
		DELETE FROM issue_comments ic
		USING issues i
		WHERE ic.id = $1
		  AND i.id = ic.issue_id
		  AND i.repo_id = $2
		  AND i.number = $3
		`,
		commentID,
		repoID,
		number,
	)

	return err
}

// GetIssueLabels returns all labels defined for a repository.
func GetIssueLabels(repoID int64) ([]IssueLabel, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, name, COALESCE(color, '')
		FROM issue_labels
		WHERE repo_id = $1
		ORDER BY name
		`,
		repoID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []IssueLabel

	for rows.Next() {
		var label IssueLabel

		if err := rows.Scan(&label.ID, &label.Name, &label.Color); err != nil {
			return nil, err
		}

		labels = append(labels, label)
	}

	return labels, rows.Err()
}

// CreateIssueLabel adds a label to a repository.
func CreateIssueLabel(repoID int64, name, color string) (IssueLabel, error) {
	var label IssueLabel

	err := DB.QueryRow(
		context.Background(),
		`
		INSERT INTO issue_labels (repo_id, name, color)
		VALUES ($1, $2, $3)
		ON CONFLICT (repo_id, name) DO UPDATE SET color = EXCLUDED.color
		RETURNING id, name, COALESCE(color, '')
		`,
		repoID,
		name,
		color,
	).Scan(&label.ID, &label.Name, &label.Color)

	return label, err
}

// DeleteIssueLabel removes a label from a repository. Link rows are removed by
// cascade.
func DeleteIssueLabel(repoID, labelID int64) error {
	_, err := DB.Exec(
		context.Background(),
		`DELETE FROM issue_labels WHERE id = $1 AND repo_id = $2`,
		labelID,
		repoID,
	)

	return err
}
