package test

import (
	"fmt"
	"net/http"
	"testing"
)

// ── PullsHandler ────────────────────────────────────────────────────────

func TestListPullRequests_Success(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	if _, ok := result["pulls"]; !ok {
		t.Fatalf("expected 'pulls' key in response")
	}
}

func TestCreatePullRequest_Success(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"title": "Add feature",
		"description": "Adds a new feature",
		"sourceBranch": "feature-branch",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["title"] != "Add feature" {
		t.Fatalf("expected title 'Add feature', got %v", result["title"])
	}
	if result["sourceBranch"] != "feature-branch" {
		t.Fatalf("expected sourceBranch 'feature-branch', got %v", result["sourceBranch"])
	}
	if result["state"] != "open" {
		t.Fatalf("expected state 'open', got %v", result["state"])
	}
}

func TestCreatePullRequest_Unauthenticated(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"title": "Test",
		"sourceBranch": "feature-branch",
		"targetBranch": "main"
	}`, false)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestCreatePullRequest_MissingTitle(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"sourceBranch": "feature-branch",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreatePullRequest_MissingSourceBranch(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"title": "Test",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreatePullRequest_SameBranches(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"title": "Test",
		"sourceBranch": "main",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreatePullRequest_NonexistentBranch(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", `{
		"title": "Test",
		"sourceBranch": "nonexistent-branch",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCreatePullRequest_NonexistentRepo(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/nonexistent/pulls", `{
		"title": "Test",
		"sourceBranch": "feature-branch",
		"targetBranch": "main"
	}`, true)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestListPullRequests_AfterCreate(t *testing.T) {
	createTestPR(t)
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	pulls := result["pulls"].([]any)
	if len(pulls) < 1 {
		t.Fatalf("expected at least 1 pull, got %d", len(pulls))
	}
}

func TestListPullRequests_FilterState(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls?state=open", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	open := int(result["open"].(float64))
	if open < 1 {
		t.Fatalf("expected at least 1 open PR, got %d", open)
	}
}

// ── PullHandler ─────────────────────────────────────────────────────────

func TestGetPullRequest_Success(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	if result["number"].(float64) != float64(num) {
		t.Fatalf("expected PR number %d, got %v", num, result["number"])
	}
}

func TestGetPullRequest_NotFound(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/9999", "", false)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestGetPullRequest_InvalidNumber(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/abc", "", false)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestGetPullRequest_IncludesComments(t *testing.T) {
	num := createTestPR(t)

	// Add a comment.
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Looks good!"}`, true)

	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	comments := result["comments"].([]any)
	if len(comments) != 1 {
		t.Fatalf("expected 1 comment, got %d", len(comments))
	}
}

func TestUpdatePullRequest_Success(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "PATCH", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), `{
		"title": "Updated PR title",
		"description": "Updated description"
	}`, false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["title"] != "Updated PR title" {
		t.Fatalf("expected updated title, got %v", result["title"])
	}
}

func TestUpdatePullRequest_EmptyTitle(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "PATCH", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), `{
		"title": ""
	}`, false)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// ── PullCloseHandler ────────────────────────────────────────────────────

func TestClosePullRequest_Success(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", true)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify state is closed.
	w2 := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), "", false)
	result := parseJSON(t, w2)
	if result["state"] != "closed" {
		t.Fatalf("expected state 'closed', got %v", result["state"])
	}
}

func TestClosePullRequest_Unauthenticated(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", false)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestClosePullRequest_NotFound(t *testing.T) {
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls/9999/close", "", true)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// ── PullReopenHandler ───────────────────────────────────────────────────

func TestReopenPullRequest_Success(t *testing.T) {
	num := createTestPR(t)
	// Close first.
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", true)
	// Reopen.
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/reopen", num), "", true)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify state is open again.
	w2 := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), "", false)
	result := parseJSON(t, w2)
	if result["state"] != "open" {
		t.Fatalf("expected state 'open', got %v", result["state"])
	}
}

func TestReopenPullRequest_Unauthenticated(t *testing.T) {
	num := createTestPR(t)
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", true)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/reopen", num), "", false)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ── PullMergeHandler ────────────────────────────────────────────────────

func TestMergePullRequest_Success(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/merge", num), "", true)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["mergeCommitHash"] == nil || result["mergeCommitHash"] == "" {
		t.Fatalf("expected merge commit hash, got %v", result["mergeCommitHash"])
	}

	// Verify state is merged.
	w2 := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d", num), "", false)
	pr := parseJSON(t, w2)
	if pr["state"] != "merged" {
		t.Fatalf("expected state 'merged', got %v", pr["state"])
	}
}

func TestMergePullRequest_Unauthenticated(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/merge", num), "", false)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestMergePullRequest_NotOpen(t *testing.T) {
	num := createTestPR(t)
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", true)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/merge", num), "", true)
	if w.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", w.Code)
	}
}

// ── PullCompareHandler ──────────────────────────────────────────────────

func TestCompareBranches_Success(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/compare?base=main&head=compare-branch", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["mergeBase"] == "" {
		t.Fatalf("expected mergeBase, got empty")
	}
	if result["mergeable"] == nil {
		t.Fatalf("expected mergeable field, got nil")
	}
}

func TestCompareBranches_MissingParams(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/compare?base=main", "", false)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCompareBranches_NonexistentBranch(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/compare?base=main&head=nonexistent", "", false)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestCompareBranches_AheadBehind(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/compare?base=main&head=compare-branch", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	ahead := int(result["ahead"].(float64))
	if ahead < 1 {
		t.Fatalf("expected at least 1 commit ahead, got %d", ahead)
	}
}

func TestCompareBranches_Files(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/compare?base=main&head=compare-branch", "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	files := result["files"].([]any)
	if len(files) < 1 {
		t.Fatalf("expected at least 1 changed file, got %d", len(files))
	}
}

// ── PullEventsHandler ───────────────────────────────────────────────────

func TestListPullRequestEvents_AfterCreate(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/events", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	events := result["events"].([]any)
	if len(events) < 1 {
		t.Fatalf("expected at least 1 event (opened), got %d", len(events))
	}
	first := events[0].(map[string]any)
	if first["type"] != "opened" {
		t.Fatalf("expected first event type 'opened', got %v", first["type"])
	}
}

func TestListPullRequestEvents_AfterClose(t *testing.T) {
	num := createTestPR(t)
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/close", num), "", true)

	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/events", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	events := result["events"].([]any)
	if len(events) < 2 {
		t.Fatalf("expected at least 2 events (opened + state_change), got %d", len(events))
	}
}

func TestListPullRequestEvents_NotFound(t *testing.T) {
	w := req(t, "GET", "/api/repos/testowner/testrepo/pulls/9999/events", "", false)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}
