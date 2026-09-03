package handlers

import (
	"backend/internal/database"
	"net/http"
)

// AllIssuesHandler lists and counts issues across every repository.
//
//	GET /api/issues  ?state=open&author=&assignee=&search=&sort=&label=
//
//	@Summary		List all issues across repositories
//	@Description	Returns issues from all repositories with optional filters for state, author, assignee, search, label, and sort
//	@Tags			Issues
//	@Produce		json
//	@Param			state	query		string	false	"Issue state filter (open or closed)"
//	@Param			author	query		string	false	"Author user ID"
//	@Param			assignee	query		string	false	"Assignee user ID"
//	@Param			search	query		string	false	"Search term (matches title, description, number)"
//	@Param			label	query		string	false	"Label name"
//	@Param			sort	query		string	false	"Sort order (newest, oldest, recently-updated, etc.)"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/issues [get]
func AllIssuesHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	filter := database.IssueFilter{
		State:    r.URL.Query().Get("state"),
		AuthorID: r.URL.Query().Get("author"),
		Assignee: r.URL.Query().Get("assignee"),
		Search:   r.URL.Query().Get("search"),
		Label:    r.URL.Query().Get("label"),
		Sort:     r.URL.Query().Get("sort"),
	}

	issues, err := database.ListAllIssues(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if issues == nil {
		issues = []database.Issue{}
	}

	open, closed, err := database.CountAllIssues(filter)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"issues": issues,
		"open":   open,
		"closed": closed,
		"total":  open + closed,
	})
}

// UsersHandler lists every registered user, used to populate global filters
// such as the author and assignee dropdowns.
//
//	GET /api/users
//
//	@Summary		List all users
//	@Description	Returns all registered users
//	@Tags			Users
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Router			/users [get]
func UsersHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	users, err := database.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if users == nil {
		users = []database.Contributor{}
	}

	writeSuccess(w, map[string]any{"users": users})
}
