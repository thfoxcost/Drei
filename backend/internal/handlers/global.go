package handlers

import (
	"backend/internal/database"
	"net/http"
)

// AllIssuesHandler lists and counts issues across every repository.
//
//	GET /api/issues  ?state=open&author=&assignee=&search=&sort=&label=
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
