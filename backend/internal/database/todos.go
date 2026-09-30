package database

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

// ErrInvalidTodoStatus is returned when a caller sends a status outside the
// allowed set.
var ErrInvalidTodoStatus = errors.New("invalid todo status")

// Todo statuses. A to-do is always in exactly one of these.
const (
	TodoStatusUndone    = "undone"
	TodoStatusProgress  = "progress"
	TodoStatusDone      = "done"
	TodoStatusDiscarded = "discarded"
)

// Reminder kinds. "next-open" is a client-side trigger and stores no extra
// columns; "time" uses ReminderAt; "repo-page" uses ReminderOwner/ReminderRepo.
const (
	TodoReminderNextOpen = "next-open"
	TodoReminderTime     = "time"
	TodoReminderRepoPage = "repo-page"
)

// ValidTodoStatuses is the set of statuses accepted by the API.
var ValidTodoStatuses = map[string]bool{
	TodoStatusUndone:    true,
	TodoStatusProgress:  true,
	TodoStatusDone:      true,
	TodoStatusDiscarded: true,
}

// ValidTodoReminderKinds is the set of reminder kinds accepted by the API.
var ValidTodoReminderKinds = map[string]bool{
	TodoReminderNextOpen: true,
	TodoReminderTime:     true,
	TodoReminderRepoPage: true,
}

// Todo is the JSON shape returned to the frontend. Reminder is nil when no
// reminder is armed, and Reminder.Repo is nil unless the reminder targets a
// specific repository page.
type Todo struct {
	ID        string        `json:"id"`
	Title     string        `json:"title"`
	Status    string        `json:"status"`
	Pinned    bool          `json:"pinned"`
	Reminder  *TodoReminder `json:"reminder"`
	CreatedAt string        `json:"createdAt"`
	UpdatedAt string        `json:"updatedAt"`
}

// TodoReminder describes when a to-do should surface a notification.
type TodoReminder struct {
	Kind string            `json:"kind"`
	At   *string           `json:"at"`
	Repo *TodoReminderRepo `json:"repo"`
}

// TodoReminderRepo is the repository a "repo-page" reminder waits for.
type TodoReminderRepo struct {
	Owner string `json:"owner"`
	Name  string `json:"name"`
}

// TodoInput carries the mutable fields of a to-do. Pointer fields are nil when
// the caller left them untouched, which is what UpdateTodo relies on to build a
// partial UPDATE.
type TodoInput struct {
	// ID is only read when creating a to-do; updates address rows by path.
	ID            string
	Title         *string
	Status        *string
	Pinned        *bool
	ReminderKind  *string
	ReminderAt    *time.Time
	ReminderOwner *string
	ReminderRepo  *string
}

// ListTodos returns every to-do belonging to the user, pinned first and then
// newest first.
func ListTodos(userID string) ([]Todo, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, title, status, pinned, reminder_kind, reminder_at,
		       reminder_owner, reminder_repo, created_at, updated_at
		FROM todos
		WHERE user_id = $1
		ORDER BY pinned DESC, created_at DESC
		`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	todos := []Todo{}

	for rows.Next() {
		todo, err := scanTodo(rows)
		if err != nil {
			return nil, err
		}

		todos = append(todos, todo)
	}

	return todos, rows.Err()
}

// GetTodo returns a single to-do owned by the user, or nil when it does not
// exist (or belongs to somebody else).
func GetTodo(userID, id string) (*Todo, error) {
	row := DB.QueryRow(
		context.Background(),
		`
		SELECT id, title, status, pinned, reminder_kind, reminder_at,
		       reminder_owner, reminder_repo, created_at, updated_at
		FROM todos
		WHERE user_id = $1 AND id = $2
		`,
		userID,
		id,
	)

	todo, err := scanTodo(row)
	if err != nil {
		return nil, err
	}

	return &todo, nil
}

// CreateTodo inserts a to-do for the user. The id is supplied by the client so
// the UI can render the row before the request resolves.
func CreateTodo(userID string, input TodoInput) (*Todo, error) {
	title := ""
	if input.Title != nil {
		title = strings.TrimSpace(*input.Title)
	}

	if title == "" {
		title = "Untitled to-do"
	}

	status := TodoStatusUndone
	if input.Status != nil && ValidTodoStatuses[*input.Status] {
		status = *input.Status
	}

	pinned := false
	if input.Pinned != nil {
		pinned = *input.Pinned
	}

	reminder := reminderColumns(input)

	row := DB.QueryRow(
		context.Background(),
		`
		INSERT INTO todos (
			id, user_id, title, status, pinned,
			reminder_kind, reminder_at, reminder_owner, reminder_repo
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, title, status, pinned, reminder_kind, reminder_at,
		          reminder_owner, reminder_repo, created_at, updated_at
		`,
		input.ID,
		userID,
		title,
		status,
		pinned,
		reminder.kind,
		reminder.at,
		reminder.owner,
		reminder.repo,
	)

	todo, err := scanTodo(row)
	if err != nil {
		return nil, err
	}

	return &todo, nil
}

// UpdateTodo applies a partial update and returns the stored row. It reports
// found = false when the to-do does not exist for this user.
func UpdateTodo(userID, id string, input TodoInput) (*Todo, bool, error) {
	sets := []string{"updated_at = NOW()"}
	args := []any{}

	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, column+" = $"+strconv.Itoa(len(args)))
	}

	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if title == "" {
			title = "Untitled to-do"
		}

		add("title", title)
	}

	if input.Status != nil {
		if !ValidTodoStatuses[*input.Status] {
			return nil, false, ErrInvalidTodoStatus
		}

		add("status", *input.Status)
	}

	if input.Pinned != nil {
		add("pinned", *input.Pinned)
	}

	// A reminder is replaced as a whole: the caller sends the fields of the new
	// reminder and the old columns are overwritten, so switching from "at a
	// time" to "next app open" cannot leave a stale timestamp behind.
	if input.ReminderKind != nil {
		reminder := reminderColumns(input)

		add("reminder_kind", reminder.kind)
		add("reminder_at", reminder.at)
		add("reminder_owner", reminder.owner)
		add("reminder_repo", reminder.repo)
	}

	args = append(args, userID, id)

	row := DB.QueryRow(
		context.Background(),
		`
		UPDATE todos
		SET `+strings.Join(sets, ", ")+`
		WHERE user_id = $`+strconv.Itoa(len(args)-1)+` AND id = $`+strconv.Itoa(len(args))+`
		RETURNING id, title, status, pinned, reminder_kind, reminder_at,
		          reminder_owner, reminder_repo, created_at, updated_at
		`,
		args...,
	)

	todo, err := scanTodo(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, false, nil
		}

		return nil, false, err
	}

	return &todo, true, nil
}

// DeleteTodo removes a to-do and reports whether a row was deleted.
func DeleteTodo(userID, id string) (bool, error) {
	tag, err := DB.Exec(
		context.Background(),
		`DELETE FROM todos WHERE user_id = $1 AND id = $2`,
		userID,
		id,
	)
	if err != nil {
		return false, err
	}

	return tag.RowsAffected() > 0, nil
}

// todoScanner is satisfied by both pgx.Rows and pgx.Row.
type todoScanner interface {
	Scan(dest ...any) error
}

func scanTodo(row todoScanner) (Todo, error) {
	var (
		todo         Todo
		reminderKind *string
		reminderAt   *time.Time
		reminderOwn  *string
		reminderRepo *string
		createdAt    time.Time
		updatedAt    time.Time
	)

	err := row.Scan(
		&todo.ID,
		&todo.Title,
		&todo.Status,
		&todo.Pinned,
		&reminderKind,
		&reminderAt,
		&reminderOwn,
		&reminderRepo,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return todo, err
	}

	todo.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	todo.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	todo.Reminder = buildReminder(reminderKind, reminderAt, reminderOwn, reminderRepo)

	return todo, nil
}

func buildReminder(
	kind *string,
	at *time.Time,
	owner *string,
	repo *string,
) *TodoReminder {
	if kind == nil || *kind == "" {
		return nil
	}

	reminder := &TodoReminder{Kind: *kind}

	if at != nil {
		formatted := at.UTC().Format(time.RFC3339)
		reminder.At = &formatted
	}

	if owner != nil && repo != nil && *owner != "" && *repo != "" {
		reminder.Repo = &TodoReminderRepo{Owner: *owner, Name: *repo}
	}

	return reminder
}

// reminderColumns resolves the three reminder columns from the input, dropping
// values that do not belong to the chosen kind.
func reminderColumns(input TodoInput) struct {
	kind  *string
	at    *time.Time
	owner *string
	repo  *string
} {
	out := struct {
		kind  *string
		at    *time.Time
		owner *string
		repo  *string
	}{}

	if input.ReminderKind == nil || *input.ReminderKind == "" {
		return out
	}

	kind := *input.ReminderKind

	if !ValidTodoReminderKinds[kind] {
		return out
	}

	out.kind = &kind

	if kind == TodoReminderTime {
		out.at = input.ReminderAt
	}

	if kind == TodoReminderRepoPage {
		if input.ReminderOwner != nil && *input.ReminderOwner != "" {
			out.owner = input.ReminderOwner
		}

		if input.ReminderRepo != nil && *input.ReminderRepo != "" {
			out.repo = input.ReminderRepo
		}
	}

	return out
}
