package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

// todoRequest is the JSON body accepted when creating or updating a to-do.
// Every field is a pointer so a PATCH only touches what was sent, and so a
// reminder can be cleared by sending an explicit null.
type todoRequest struct {
	ID       string            `json:"id"`
	Title    *string           `json:"title"`
	Status   *string           `json:"status"`
	Pinned   *bool             `json:"pinned"`
	Reminder *todoReminderBody `json:"reminder"`
}

// todoReminderBody is the reminder payload. Fields not relevant to Kind are
// ignored by the database layer.
type todoReminderBody struct {
	Kind string `json:"kind"`
	At   string `json:"at"`
	Repo *struct {
		Owner string `json:"owner"`
		Name  string `json:"name"`
	} `json:"repo"`
}

// toInput converts the request body into the database input, reporting whether
// the payload was valid.
func (req todoRequest) toInput() (database.TodoInput, string) {
	input := database.TodoInput{
		ID:     strings.TrimSpace(req.ID),
		Title:  req.Title,
		Status: req.Status,
		Pinned: req.Pinned,
	}

	if req.Reminder == nil {
		return input, ""
	}

	kind := strings.TrimSpace(req.Reminder.Kind)

	// An empty kind means "no reminder"; the database treats it as NULL and
	// clears the stored columns.
	input.ReminderKind = &kind

	if kind == database.TodoReminderTime {
		at := strings.TrimSpace(req.Reminder.At)

		if at == "" {
			return input, "reminder.at is required for time reminders"
		}

		parsed, err := time.Parse(time.RFC3339, at)
		if err != nil {
			return input, "invalid reminder.at"
		}

		input.ReminderAt = &parsed
	}

	if kind == database.TodoReminderRepoPage {
		if req.Reminder.Repo == nil {
			return input, "reminder.repo is required for repo page reminders"
		}

		owner := strings.TrimSpace(req.Reminder.Repo.Owner)
		name := strings.TrimSpace(req.Reminder.Repo.Name)

		if owner == "" || name == "" {
			return input, "reminder.repo requires owner and name"
		}

		input.ReminderOwner = &owner
		input.ReminderRepo = &name
	}

	return input, ""
}

// TodosHandler lists and creates the signed-in user's to-dos.
//
//	GET  /api/todos
//	POST /api/todos
//
//	@Summary		List to-dos
//	@Description	Returns every to-do of the authenticated user, pinned first
//	@Tags			Todos
//	@Produce		json
//	@Success		200		{array}		database.Todo
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/todos [get]
//
//	@Summary		Create a to-do
//	@Description	Creates a to-do. The id is client-generated so the row can be rendered optimistically.
//	@Tags			Todos
//	@Accept			json
//	@Produce		json
//	@Param			todo	body		object	true	"To-do details (id, title, status, pinned, reminder)"
//	@Success		201		{object}	database.Todo
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/todos [post]
func TodosHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	switch r.Method {
	case http.MethodGet:
		todos, err := database.ListTodos(user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, todos)

	case http.MethodPost:
		var req todoRequest

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
			return
		}

		input, problem := req.toInput()
		if problem != "" {
			writeError(w, http.StatusBadRequest, problem)
			return
		}

		if input.ID == "" {
			writeErrorCoded(w, http.StatusBadRequest, "id_required", "id is required")
			return
		}

		if input.Title != nil && strings.TrimSpace(*input.Title) == "" {
			writeErrorCoded(w, http.StatusBadRequest, "title_required", "title is required")
			return
		}

		todo, err := database.CreateTodo(user.ID, input)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, todo)

	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

// TodoHandler updates and deletes a single to-do.
//
//	PATCH  /api/todos/{id}
//	DELETE /api/todos/{id}
//
//	@Summary		Update a to-do
//	@Description	Applies a partial update to a to-do
//	@Tags			Todos
//	@Accept			json
//	@Produce		json
//	@Param			id	path		string	true	"To-do ID"
//	@Param			todo	body	object	true	"Fields to update (title, status, pinned, reminder)"
//	@Success		200		{object}	database.Todo
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/todos/{id} [patch]
//
//	@Summary		Delete a to-do
//	@Description	Deletes a to-do
//	@Tags			Todos
//	@Produce		json
//	@Param			id	path	string	true	"To-do ID"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		404		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/todos/{id} [delete]
func TodoHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "PATCH, DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_todo_id", "invalid to-do id")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var req todoRequest

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
			return
		}

		input, problem := req.toInput()
		if problem != "" {
			writeError(w, http.StatusBadRequest, problem)
			return
		}

		if input.Title != nil && strings.TrimSpace(*input.Title) == "" {
			writeErrorCoded(w, http.StatusBadRequest, "title_required", "title cannot be empty")
			return
		}

		todo, found, err := database.UpdateTodo(user.ID, id, input)
		if err != nil {
			if err == database.ErrInvalidTodoStatus {
				writeError(w, http.StatusBadRequest, err.Error())
				return
			}

			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if !found {
			writeErrorCoded(w, http.StatusNotFound, "todo_not_found", "to-do not found")
			return
		}

		writeJSON(w, http.StatusOK, todo)

	case http.MethodDelete:
		deleted, err := database.DeleteTodo(user.ID, id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if !deleted {
			writeErrorCoded(w, http.StatusNotFound, "todo_not_found", "to-do not found")
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}
