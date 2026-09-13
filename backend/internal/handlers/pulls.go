package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// PullsHandler lists and creates pull requests for a repository.
//
//	GET  /api/repos/{owner}/{repo}/pulls  ?state=&author=&search=&sort=
//	POST /api/repos/{owner}/{repo}/pulls
func PullsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST")

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
		filter := database.PullRequestFilter{
			State:    r.URL.Query().Get("state"),
			AuthorID: r.URL.Query().Get("author"),
			Search:   r.URL.Query().Get("search"),
			Sort:     r.URL.Query().Get("sort"),
		}

		pulls, err := database.ListPullRequests(info.ID, filter)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if pulls == nil {
			pulls = []database.PullRequest{}
		}

		open, closed, merged, err := database.CountPullRequests(info.ID, filter)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{
			"pulls":  pulls,
			"open":   open,
			"closed": closed,
			"merged": merged,
		})

	case http.MethodPost:
		user, err := authenticate(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "you must be signed in to create a pull request")
			return
		}

		member, err := database.IsRepoMember(info.ID, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if !member {
			writeError(w, http.StatusForbidden, "you must be a contributor of this repository to create a pull request")
			return
		}

		var req struct {
			Title        string `json:"title"`
			Description  string `json:"description"`
			SourceBranch string `json:"sourceBranch"`
			TargetBranch string `json:"targetBranch"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Title = strings.TrimSpace(req.Title)

		if req.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}

		req.SourceBranch = strings.TrimSpace(req.SourceBranch)
		req.TargetBranch = strings.TrimSpace(req.TargetBranch)

		if req.SourceBranch == "" {
			writeError(w, http.StatusBadRequest, "sourceBranch is required")
			return
		}

		if req.TargetBranch == "" {
			writeError(w, http.StatusBadRequest, "targetBranch is required")
			return
		}

		if req.SourceBranch == req.TargetBranch {
			writeError(w, http.StatusBadRequest, "source and target branches must be different")
			return
		}

		// Verify both branches exist in the Git repository.
		if err := gitrepo.VerifyBranchExists(info.Owner, info.Name, req.SourceBranch); err != nil {
			writeError(w, http.StatusBadRequest, "source branch not found")
			return
		}

		if err := gitrepo.VerifyBranchExists(info.Owner, info.Name, req.TargetBranch); err != nil {
			writeError(w, http.StatusBadRequest, "target branch not found")
			return
		}

		pull, err := database.CreatePullRequest(
			info.ID,
			user.ID,
			req.Title,
			req.Description,
			req.SourceBranch,
			req.TargetBranch,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, pull)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// PullHandler fetches and updates a single pull request. GET returns the PR
// with its comments attached, matching the IssueHandler convention.
//
//	GET   /api/repos/{owner}/{repo}/pulls/{number}
//	PATCH /api/repos/{owner}/{repo}/pulls/{number}
func PullHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PATCH")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	switch r.Method {
	case http.MethodGet:
		pull, ok := getPullOr404(w, info.ID, number)
		if !ok {
			return
		}

		comments, err := database.ListPullRequestComments(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comments == nil {
			comments = []database.PullRequestComment{}
		}

		pull.Comments = comments

		writeJSON(w, http.StatusOK, pull)

	case http.MethodPatch:
		if _, ok := getPullOr404(w, info.ID, number); !ok {
			return
		}

		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Title = strings.TrimSpace(req.Title)
		req.Description = strings.TrimSpace(req.Description)

		if req.Title == "" {
			writeError(w, http.StatusBadRequest, "title is required")
			return
		}

		if err := database.UpdatePullRequest(info.ID, number, req.Title, req.Description); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		updated, err := database.GetPullRequest(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusOK, updated)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// PullCloseHandler closes an open pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/close
func PullCloseHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

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

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to close a pull request")
		return
	}

	if _, ok := getPullOr404(w, info.ID, number); !ok {
		return
	}

	if err := database.ClosePullRequest(info.ID, number, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"success": true})
}

// PullReopenHandler reopens a closed pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/reopen
func PullReopenHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

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

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to reopen a pull request")
		return
	}

	if _, ok := getPullOr404(w, info.ID, number); !ok {
		return
	}

	if err := database.ReopenPullRequest(info.ID, number, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"success": true})
}

// PullMergeHandler merges the source branch into the target branch via Git,
// then records the merge in the database.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/merge
func PullMergeHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

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

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to merge a pull request")
		return
	}

	member, err := database.IsRepoMember(info.ID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository to merge a pull request")
		return
	}

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	if pull.State != "open" {
		writeError(w, http.StatusConflict, "pull request is not open")
		return
	}

	mergeCommitHash, err := gitrepo.MergeBranches(
		info.Owner,
		info.Name,
		pull.SourceBranch,
		pull.TargetBranch,
		user.Name,
		number,
	)
	if err != nil {
		errMsg := err.Error()
		if strings.HasPrefix(errMsg, "merge conflicts in:") {
			writeError(w, http.StatusConflict, errMsg)
			return
		}

		writeError(w, http.StatusInternalServerError, errMsg)
		return
	}

	if err := database.MergePullRequest(info.ID, number, user.ID, mergeCommitHash); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"mergeCommitHash": mergeCommitHash})
}

// PullCompareHandler returns the diff between two branches.
//
//	GET /api/repos/{owner}/{repo}/pulls/compare?base=&head=
func PullCompareHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	base := strings.TrimSpace(r.URL.Query().Get("base"))
	head := strings.TrimSpace(r.URL.Query().Get("head"))

	if base == "" || head == "" {
		writeError(w, http.StatusBadRequest, "base and head query parameters are required")
		return
	}

	compare, err := gitrepo.CompareBranches(info.Owner, info.Name, base, head)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, compare)
}

// PullEventsHandler returns the activity timeline for a pull request.
//
//	GET /api/repos/{owner}/{repo}/pulls/{number}/events
func PullEventsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	if _, ok := getPullOr404(w, info.ID, number); !ok {
		return
	}

	events, err := database.ListPullRequestEvents(info.ID, number)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if events == nil {
		events = []database.PullRequestEvent{}
	}

	writeSuccess(w, map[string]any{"events": events})
}

// parsePullNumber extracts and validates the PR number from the URL path.
func parsePullNumber(w http.ResponseWriter, r *http.Request) (int, bool) {
	number, err := strconv.Atoi(r.PathValue("number"))
	if err != nil || number <= 0 {
		writeError(w, http.StatusBadRequest, "invalid pull request number")
		return 0, false
	}

	return number, true
}

// getPullOr404 loads a pull request or writes a 404 error.
func getPullOr404(w http.ResponseWriter, repoID int64, number int) (*database.PullRequest, bool) {
	pull, err := database.GetPullRequest(repoID, number)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return nil, false
	}

	if pull == nil {
		writeError(w, http.StatusNotFound, "pull request not found")
		return nil, false
	}

	return pull, true
}
