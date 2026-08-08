package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// resolveRepo loads the repository identified by the {owner}/{repo} path
// values, or writes a 404 and returns false when it does not exist.
func resolveRepo(w http.ResponseWriter, r *http.Request) (*database.RepoInfo, bool) {
	info, err := database.GetRepository(r.PathValue("owner"), r.PathValue("repo"))
	if err != nil {
		writeError(w, http.StatusNotFound, "repository not found")
		return nil, false
	}

	return info, true
}

func parseIssueNumber(w http.ResponseWriter, r *http.Request) (int, bool) {
	number, err := strconv.Atoi(r.PathValue("number"))
	if err != nil || number <= 0 {
		writeError(w, http.StatusBadRequest, "invalid issue number")
		return 0, false
	}

	return number, true
}

func getIssueOr404(w http.ResponseWriter, repoID int64, number int) (*database.Issue, bool) {
	issue, err := database.GetIssue(repoID, number)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return nil, false
	}

	if issue == nil {
		writeError(w, http.StatusNotFound, "issue not found")
		return nil, false
	}

	return issue, true
}

// parseDueDate converts a JSON due date value. A nil or "null" raw value
// produces a nil pointer, and an empty string is treated as "no due date".
func parseDueDate(raw json.RawMessage) (*time.Time, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return nil, nil
	}

	var value string

	if err := json.Unmarshal(raw, &value); err != nil {
		return nil, err
	}

	if strings.TrimSpace(value) == "" {
		return nil, nil
	}

	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, err
	}

	return &parsed, nil
}

// IssuesHandler lists and creates the issues of a repository.
//
//	GET  /api/repos/{owner}/{repo}/issues  ?state=open&author=&assignee=&search=&sort=&label=
//	POST /api/repos/{owner}/{repo}/issues
func IssuesHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "GET, POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		filter := database.IssueFilter{
			State:    r.URL.Query().Get("state"),
			AuthorID: r.URL.Query().Get("author"),
			Assignee: r.URL.Query().Get("assignee"),
			Search:   r.URL.Query().Get("search"),
			Label:    r.URL.Query().Get("label"),
			Sort:     r.URL.Query().Get("sort"),
		}

		issues, err := database.ListIssues(info.ID, filter)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if issues == nil {
			issues = []database.Issue{}
		}

		open, closed, err := database.CountIssues(info.ID, filter)
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

	case http.MethodPost:
		var req struct {
			UserID      string   `json:"userId"`
			Username    string   `json:"username"`
			Title       string   `json:"title"`
			Description string   `json:"description"`
			Labels      []string `json:"labels"`
			DueDate     *string  `json:"dueDate"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Title = strings.TrimSpace(req.Title)

		if req.UserID == "" {
			writeError(w, http.StatusBadRequest, "userId is required")
			return
		}

		if req.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}

		var dueDate *time.Time

		if req.DueDate != nil && strings.TrimSpace(*req.DueDate) != "" {
			parsed, err := time.Parse(time.RFC3339, *req.DueDate)
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid dueDate")
				return
			}
			dueDate = &parsed
		}

		issue, err := database.CreateIssue(
			info.ID,
			req.UserID,
			req.Title,
			req.Description,
			req.Labels,
			dueDate,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, issue)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// IssueHandler fetches and updates a single issue.
//
//	GET   /api/repos/{owner}/{repo}/issues/{number}
//	PATCH /api/repos/{owner}/{repo}/issues/{number}
func IssueHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "GET, PATCH")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parseIssueNumber(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		issue, ok := getIssueOr404(w, info.ID, number)
		if !ok {
			return
		}

		comments, err := database.ListIssueComments(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comments == nil {
			comments = []database.IssueComment{}
		}

		issue.Comments = comments

		writeJSON(w, http.StatusOK, issue)

	case http.MethodPatch:
		if _, ok := getIssueOr404(w, info.ID, number); !ok {
			return
		}

		var raw map[string]json.RawMessage

		if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if rawTitle, hasTitle := raw["title"]; hasTitle {
			var title string
			var description string

			if err := json.Unmarshal(rawTitle, &title); err != nil {
				writeError(w, http.StatusBadRequest, "invalid title")
				return
			}

			if rawDescription, ok := raw["description"]; ok {
				if err := json.Unmarshal(rawDescription, &description); err != nil {
					writeError(w, http.StatusBadRequest, "invalid description")
					return
				}
			}

			dueDate, err := parseDueDate(raw["dueDate"])
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid dueDate")
				return
			}

			if err := database.UpdateIssue(info.ID, number, strings.TrimSpace(title), description, dueDate); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}

		if rawLabels, hasLabels := raw["labels"]; hasLabels {
			var labels []string

			if err := json.Unmarshal(rawLabels, &labels); err != nil {
				writeError(w, http.StatusBadRequest, "invalid labels")
				return
			}

			if err := database.SetIssueLabels(info.ID, number, labels); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}

		updated, err := database.GetIssue(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, updated)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// IssueStateHandler closes or reopens an issue.
//
//	POST /api/repos/{owner}/{repo}/issues/{number}/state
func IssueStateHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parseIssueNumber(w, r)
	if !ok {
		return
	}

	var req struct {
		State    string `json:"state"`
		UserID   string `json:"userId"`
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.State != "open" && req.State != "closed" {
		writeError(w, http.StatusBadRequest, "state must be 'open' or 'closed'")
		return
	}

	if req.State == "closed" && req.UserID == "" {
		writeError(w, http.StatusBadRequest, "userId is required to close an issue")
		return
	}

	if _, ok := getIssueOr404(w, info.ID, number); !ok {
		return
	}

	if err := database.UpdateIssueState(info.ID, number, req.State, req.UserID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	issue, err := database.GetIssue(info.ID, number)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

// IssueAssigneeHandler assigns or unassigns an issue.
//
//	POST /api/repos/{owner}/{repo}/issues/{number}/assignee
func IssueAssigneeHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parseIssueNumber(w, r)
	if !ok {
		return
	}

	var req struct {
		AssigneeID *string `json:"assigneeId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var assigneeID *string

	if req.AssigneeID != nil && strings.TrimSpace(*req.AssigneeID) != "" {
		value := strings.TrimSpace(*req.AssigneeID)
		assigneeID = &value
	}

	if _, ok := getIssueOr404(w, info.ID, number); !ok {
		return
	}

	if err := database.UpdateIssueAssignee(info.ID, number, assigneeID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	issue, err := database.GetIssue(info.ID, number)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

// IssueCommentsHandler lists and creates comments on an issue.
//
//	GET  /api/repos/{owner}/{repo}/issues/{number}/comments
//	POST /api/repos/{owner}/{repo}/issues/{number}/comments
func IssueCommentsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "GET, POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parseIssueNumber(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		comments, err := database.ListIssueComments(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comments == nil {
			comments = []database.IssueComment{}
		}

		writeSuccess(w, map[string]any{"comments": comments})

	case http.MethodPost:
		var req struct {
			UserID   string `json:"userId"`
			Username string `json:"username"`
			Body     string `json:"body"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if req.UserID == "" {
			writeError(w, http.StatusBadRequest, "userId is required")
			return
		}

		req.Body = strings.TrimSpace(req.Body)

		if req.Body == "" {
			writeError(w, http.StatusBadRequest, "comment body is required")
			return
		}

		comment, err := database.AddIssueComment(info.ID, number, req.UserID, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comment.ID == 0 {
			writeError(w, http.StatusNotFound, "issue not found")
			return
		}

		writeJSON(w, http.StatusCreated, comment)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// IssueCommentHandler updates and deletes a single comment.
//
//	PATCH  /api/repos/{owner}/{repo}/issues/{number}/comments/{commentId}
//	DELETE /api/repos/{owner}/{repo}/issues/{number}/comments/{commentId}
func IssueCommentHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "PATCH, DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parseIssueNumber(w, r)
	if !ok {
		return
	}

	commentID, err := strconv.ParseInt(r.PathValue("commentId"), 10, 64)
	if err != nil || commentID <= 0 {
		writeError(w, http.StatusBadRequest, "invalid comment id")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var req struct {
			Body string `json:"body"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Body = strings.TrimSpace(req.Body)

		if req.Body == "" {
			writeError(w, http.StatusBadRequest, "comment body is required")
			return
		}

		comment, err := database.UpdateIssueComment(info.ID, number, commentID, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comment.ID == 0 {
			writeError(w, http.StatusNotFound, "comment not found")
			return
		}

		writeJSON(w, http.StatusOK, comment)

	case http.MethodDelete:
		if err := database.DeleteIssueComment(info.ID, number, commentID); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// IssueLabelsHandler lists and creates repository labels.
//
//	GET  /api/repos/{owner}/{repo}/labels
//	POST /api/repos/{owner}/{repo}/labels
func IssueLabelsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "GET, POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		labels, err := database.GetIssueLabels(info.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if labels == nil {
			labels = []database.IssueLabel{}
		}

		writeSuccess(w, map[string]any{"labels": labels})

	case http.MethodPost:
		var req struct {
			Name  string `json:"name"`
			Color string `json:"color"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Name = strings.TrimSpace(req.Name)

		if req.Name == "" {
			writeError(w, http.StatusBadRequest, "label name is required")
			return
		}

		label, err := database.CreateIssueLabel(info.ID, req.Name, req.Color)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, label)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// IssueLabelHandler deletes a repository label.
//
//	DELETE /api/repos/{owner}/{repo}/labels/{labelId}
func IssueLabelHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, "DELETE")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodDelete {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	labelID, err := strconv.ParseInt(r.PathValue("labelId"), 10, 64)
	if err != nil || labelID <= 0 {
		writeError(w, http.StatusBadRequest, "invalid label id")
		return
	}

	if err := database.DeleteIssueLabel(info.ID, labelID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"success": true})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
