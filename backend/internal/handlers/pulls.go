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
			Title        string   `json:"title"`
			Description  string   `json:"description"`
			SourceBranch string   `json:"sourceBranch"`
			TargetBranch string   `json:"targetBranch"`
			Labels       []string `json:"labels"`
			Assignees    []string `json:"assignees"`
			Reviewers    []string `json:"reviewers"`
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

		labels := cleanLabels(req.Labels)

		assignees, err := validateRepoMembers(info.ID, req.Assignees)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		reviewers, err := validateRepoMembers(info.ID, req.Reviewers)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		pull, err := database.CreatePullRequest(
			info.ID,
			user.ID,
			req.Title,
			req.Description,
			req.SourceBranch,
			req.TargetBranch,
			labels,
			assignees,
			reviewers,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Record the initial commit count so the events handler can
		// distinguish the original commits from future pushes.
		if initCommits, err := gitrepo.CommitsBetweenBranches(
			info.Owner, info.Name, req.TargetBranch, req.SourceBranch,
		); err == nil && len(initCommits) > 0 {
			database.UpdatePullRequestEventMetadata(info.ID, pull.Number, "opened", map[string]any{
				"source_branch":        req.SourceBranch,
				"target_branch":        req.TargetBranch,
				"initial_commit_count": len(initCommits),
			})
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

		assignees, err := database.GetPRAssignees(pull.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if assignees == nil {
			assignees = []database.PullRequestUser{}
		}

		pull.Assignees = assignees

		reviewers, err := database.GetPRReviewers(pull.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if reviewers == nil {
			reviewers = []database.PullRequestUser{}
		}

		pull.Reviewers = reviewers

		labels, err := database.GetPRLabels(pull.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if labels == nil {
			labels = []database.PRLabel{}
		}

		pull.Labels = labels

		participants, err := database.GetPRParticipants(pull.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if participants == nil {
			participants = []database.PullRequestUser{}
		}

		pull.Participants = participants

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

// PullCompareCommitsHandler returns the commits between two branches for a
// pull request view.
//
//	GET /api/repos/{owner}/{repo}/pulls/compare/commits?base=&head=
func PullCompareCommitsHandler(w http.ResponseWriter, r *http.Request) {
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

	if base == head {
		writeJSON(w, http.StatusOK, []any{})
		return
	}

	commits, err := gitrepo.CommitsBetweenBranches(info.Owner, info.Name, base, head)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if commits == nil {
		commits = []gitrepo.CommitInfo{}
	}

	writeJSON(w, http.StatusOK, commits)
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

// PullDuplicateHandler checks whether an open pull request already exists for
// the given source → target branch pair.
//
//	GET /api/repos/{owner}/{repo}/pulls/duplicate?source=&target=
func PullDuplicateHandler(w http.ResponseWriter, r *http.Request) {
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

	source := strings.TrimSpace(r.URL.Query().Get("source"))
	target := strings.TrimSpace(r.URL.Query().Get("target"))

	if source == "" || target == "" {
		writeError(w, http.StatusBadRequest, "source and target query parameters are required")
		return
	}

	number, err := database.FindOpenDuplicatePR(info.ID, source, target)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"duplicate": number != nil,
		"number":    number,
	})
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

	pull, _ := database.GetPullRequest(info.ID, number)
	if pull != nil && pull.State == "open" {
		detectAndRecordPushEvents(info.Owner, info.Name, info.ID, number, pull)
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

// PRAssigneeHandler sets the assignees on a pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/assignee
func PRAssigneeHandler(w http.ResponseWriter, r *http.Request) {
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

	author, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to update assignees")
		return
	}

	member, err := database.IsRepoMember(info.ID, author.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository to update assignees")
		return
	}

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	var req struct {
		Assignees []string `json:"assignees"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	assignees, err := validateRepoMembers(info.ID, req.Assignees)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := database.SetPRAssignees(pull.ID, assignees); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, pull)
}

// PRReviewerHandler sets the reviewers on a pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/reviewers
func PRReviewerHandler(w http.ResponseWriter, r *http.Request) {
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

	author, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to update reviewers")
		return
	}

	member, err := database.IsRepoMember(info.ID, author.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository to update reviewers")
		return
	}

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	var req struct {
		Reviewers []string `json:"reviewers"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	reviewers, err := validateRepoMembers(info.ID, req.Reviewers)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := database.SetPRReviewers(pull.ID, reviewers); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, pull)
}

// PRLabelHandler sets the labels on a pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/labels
func PRLabelHandler(w http.ResponseWriter, r *http.Request) {
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

	author, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to update labels")
		return
	}

	member, err := database.IsRepoMember(info.ID, author.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository to update labels")
		return
	}

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	var req struct {
		Labels []int64 `json:"labels"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := database.SetPRLabels(pull.ID, req.Labels); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, pull)
}

// PRNotificationsHandler updates the notification preference for a pull request.
//
//	POST /api/repos/{owner}/{repo}/pulls/{number}/notifications
func PRNotificationsHandler(w http.ResponseWriter, r *http.Request) {
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

	_, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to update notifications")
		return
	}

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	var req struct {
		Notifications bool `json:"notifications"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := database.SetPRNotifications(pull.ID, req.Notifications); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	pull.Notifications = req.Notifications

	writeJSON(w, http.StatusOK, pull)
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

// detectAndRecordPushEvents compares the commits on the source branch with
// existing push events and records new ones for any unseen commits.
func detectAndRecordPushEvents(owner, repo string, repoID int64, number int, pull *database.PullRequest) {
	commits, err := gitrepo.CommitsBetweenBranches(owner, repo, pull.TargetBranch, pull.SourceBranch)
	if err != nil || len(commits) == 0 {
		return
	}

	// Reverse to oldest-first so skip logic works correctly.
	for i, j := 0, len(commits)-1; i < j; i, j = i+1, j-1 {
		commits[i], commits[j] = commits[j], commits[i]
	}

	events, err := database.ListPullRequestEvents(repoID, number)
	if err != nil {
		return
	}

	// Collect all commit hashes already covered by existing push events.
	seen := make(map[string]bool)
	for _, ev := range events {
		if ev.Type != "push" {
			continue
		}
		commitsRaw, ok := ev.Metadata["commits"].([]any)
		if !ok {
			continue
		}
		for _, c := range commitsRaw {
			obj, ok := c.(map[string]any)
			if !ok {
				continue
			}
			if hash, ok := obj["hash"].(string); ok {
				seen[hash] = true
			}
		}
	}

	// Find the initial commit count from the "opened" event to skip
	// commits that existed when the PR was first created.
	initialCount := 0
	for _, ev := range events {
		if ev.Type == "opened" {
			if n, ok := ev.Metadata["initial_commit_count"].(float64); ok {
				initialCount = int(n)
			}
			break
		}
	}

	var newCommits []map[string]string
	for i, c := range commits {
		// Skip commits that were part of the initial PR creation.
		if i < initialCount {
			continue
		}
		if !seen[c.Hash] {
			newCommits = append(newCommits, map[string]string{
				"hash":    c.Hash,
				"message": strings.SplitN(c.Message, "\n", 2)[0],
			})
		}
	}

	if len(newCommits) == 0 {
		return
	}

	metadata, _ := json.Marshal(map[string]any{
		"commit_count": len(newCommits),
		"commits":      newCommits,
	})

	database.InsertPullRequestEvent(repoID, number, pull.Author.ID, "push", metadata)
}

// PullFilesHandler returns the changed files and line-level diffs for a pull
// request. It resolves the PR's source and target branches from the database
// and delegates to CompareBranches for the actual Git diff computation.
//
//	GET /api/repos/{owner}/{repo}/pulls/{number}/files
func PullFilesHandler(w http.ResponseWriter, r *http.Request) {
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

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	compare, err := gitrepo.CompareBranches(info.Owner, info.Name, pull.TargetBranch, pull.SourceBranch)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, compare)
}

// PullViewedFilesHandler manages the user's per-file viewed state for a pull
// request.
//
//	GET    /api/repos/{owner}/{repo}/pulls/{number}/viewed
//	PUT    /api/repos/{owner}/{repo}/pulls/{number}/viewed
//	POST   /api/repos/{owner}/{repo}/pulls/{number}/viewed
//	DELETE /api/repos/{owner}/{repo}/pulls/{number}/viewed
func PullViewedFilesHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, PUT, POST, DELETE")

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

	pull, ok := getPullOr404(w, info.ID, number)
	if !ok {
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in")
		return
	}

	switch r.Method {
	case http.MethodGet:
		paths, err := database.GetPRViewedFiles(pull.ID, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if paths == nil {
			paths = []string{}
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"viewedFiles": paths,
		})

	case http.MethodPut:
		var req struct {
			Files []string `json:"files"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := database.SetPRViewedFiles(pull.ID, user.ID, req.Files); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})

	case http.MethodPost:
		var req struct {
			FilePath string `json:"filePath"`
			Viewed   bool   `json:"viewed"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.FilePath == "" {
			writeError(w, http.StatusBadRequest, "filePath is required")
			return
		}
		if req.Viewed {
			if err := database.MarkPRFileViewed(pull.ID, user.ID, req.FilePath); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		} else {
			if err := database.UnmarkPRFileViewed(pull.ID, user.ID, req.FilePath); err != nil {
				writeError(w, http.StatusInternalServerError, err.Error())
				return
			}
		}
		paths, err := database.GetPRViewedFiles(pull.ID, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if paths == nil {
			paths = []string{}
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"viewedFiles": paths,
		})

	case http.MethodDelete:
		if err := database.SetPRViewedFiles(pull.ID, user.ID, nil); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
