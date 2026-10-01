package test

import (
	"backend/internal/handlers"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

const thirdCookie = "session=test-session-3"

// addContributor adds a user as a collaborator via the API as the repository
// owner. It is idempotent: re-adding an existing contributor succeeds
// without effect.
func addContributor(t *testing.T, id, username string) {
	t.Helper()

	w := callHandler(handlers.CollaboratorsHandler, http.MethodPost, repoParams(nil),
		fmt.Sprintf(`{"id":%q,"username":%q}`, id, username), ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("add contributor %s: status %d, body: %s", username, w.Code, w.Body.String())
	}
}

func TestNonMemberCannotMutatePRs(t *testing.T) {
	number := createPR(t, ownerCookie)
	params := repoParams(map[string]string{"number": fmt.Sprint(number)})

	// Close by a non-contributor is forbidden and leaves the PR open.
	w := callHandler(handlers.PullCloseHandler, http.MethodPost, params, `{}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member close: status %d, body: %s", w.Code, w.Body.String())
	}

	pull, err := getTestPull(number)
	if err != nil {
		t.Fatalf("fetch PR: %v", err)
	}

	if pull.State != "open" {
		t.Fatalf("PR state changed by non-member close: %s", pull.State)
	}

	// Unauthenticated close is rejected before anything else.
	w = callHandler(handlers.PullCloseHandler, http.MethodPost, params, `{}`, "")
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous close: status %d", w.Code)
	}

	// Owner closes, then non-member reopen is forbidden.
	w = callHandler(handlers.PullCloseHandler, http.MethodPost, params, `{}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("owner close: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullReopenHandler, http.MethodPost, params, `{}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member reopen: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullReopenHandler, http.MethodPost, params, `{}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("owner reopen: status %d, body: %s", w.Code, w.Body.String())
	}

	// Editing the title, commenting and reviewing all require membership too.
	w = callHandler(handlers.PullHandler, http.MethodPatch, params,
		`{"title":"Hijacked","description":"hijacked"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member PR edit: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullCommentsHandler, http.MethodPost, params,
		`{"body":"stranger comment"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member PR comment: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullReviewsHandler, http.MethodPost, params,
		`{"state":"approved","body":"stranger approval"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member PR review: status %d, body: %s", w.Code, w.Body.String())
	}
}

func TestNonMemberCannotMutateIssues(t *testing.T) {
	number := createIssue(t, ownerCookie)
	params := repoParams(map[string]string{"number": fmt.Sprint(number)})

	w := callHandler(handlers.IssueHandler, http.MethodPatch, params,
		`{"title":"Hijacked"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member issue edit: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.IssueStateHandler, http.MethodPost, params,
		`{"state":"closed","reason":"completed"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member issue close: status %d, body: %s", w.Code, w.Body.String())
	}

	issue, err := getTestIssue(number)
	if err != nil {
		t.Fatalf("fetch issue: %v", err)
	}

	if issue.State != "open" {
		t.Fatalf("issue state changed by non-member close: %s", issue.State)
	}

	w = callHandler(handlers.IssueCommentsHandler, http.MethodPost, params,
		`{"body":"stranger comment"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-member issue comment: status %d, body: %s", w.Code, w.Body.String())
	}
}

func TestCommentAuthorship(t *testing.T) {
	addContributor(t, testUser2.ID, testUser2.Username)
	addContributor(t, testUser3.ID, testUser3.Username)

	// A contributor's PR comment can only be edited or deleted by its
	// author or a repository admin.
	prNumber := createPR(t, ownerCookie)
	prParams := repoParams(map[string]string{"number": fmt.Sprint(prNumber)})

	w := callHandler(handlers.PullCommentsHandler, http.MethodPost, prParams,
		`{"body":"second user note"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("member comment: status %d, body: %s", w.Code, w.Body.String())
	}

	var created map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode comment: %v", err)
	}

	commentParams := repoParams(map[string]string{
		"number":    fmt.Sprint(prNumber),
		"commentId": fmt.Sprint(int(created["id"].(float64))),
	})

	w = callHandler(handlers.PullCommentHandler, http.MethodPatch, commentParams,
		`{"body":"hijacked edit"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("contributor editing another user's comment: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullCommentHandler, http.MethodDelete, commentParams, "", thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("contributor deleting another user's comment: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.PullCommentHandler, http.MethodPatch, commentParams, `{"body":"hijacked"}`, "")
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous comment edit: status %d", w.Code)
	}

	// The author can edit their own comment.
	w = callHandler(handlers.PullCommentHandler, http.MethodPatch, commentParams,
		`{"body":"edited by author"}`, otherCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("author edit: status %d, body: %s", w.Code, w.Body.String())
	}

	// The repository owner (admin) can delete it.
	w = callHandler(handlers.PullCommentHandler, http.MethodDelete, commentParams, "", ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("admin delete: status %d, body: %s", w.Code, w.Body.String())
	}

	// Same rules for issue comments.
	issueNumber := createIssue(t, ownerCookie)
	issueParams := repoParams(map[string]string{"number": fmt.Sprint(issueNumber)})

	w = callHandler(handlers.IssueCommentsHandler, http.MethodPost, issueParams,
		`{"body":"second user issue note"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("member issue comment: status %d, body: %s", w.Code, w.Body.String())
	}

	if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode issue comment: %v", err)
	}

	issueCommentParams := repoParams(map[string]string{
		"number":    fmt.Sprint(issueNumber),
		"commentId": fmt.Sprint(int(created["id"].(float64))),
	})

	w = callHandler(handlers.IssueCommentHandler, http.MethodPatch, issueCommentParams,
		`{"body":"hijacked edit"}`, thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("contributor editing another user's issue comment: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.IssueCommentHandler, http.MethodDelete, issueCommentParams, "", thirdCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("contributor deleting another user's issue comment: status %d, body: %s", w.Code, w.Body.String())
	}

	w = callHandler(handlers.IssueCommentHandler, http.MethodDelete, issueCommentParams, "", ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("admin issue comment delete: status %d, body: %s", w.Code, w.Body.String())
	}
}

func getTestPull(number int) (struct {
	State string `json:"state"`
}, error) {
	var pull struct {
		State string `json:"state"`
	}

	w := callHandler(handlers.PullHandler, http.MethodGet, repoParams(map[string]string{"number": fmt.Sprint(number)}), "", "")
	if w.Code != http.StatusOK {
		return pull, fmt.Errorf("status %d", w.Code)
	}

	err := json.Unmarshal(w.Body.Bytes(), &pull)

	return pull, err
}

func getTestIssue(number int) (struct {
	State string `json:"state"`
}, error) {
	var issue struct {
		State string `json:"state"`
	}

	w := callHandler(handlers.IssueHandler, http.MethodGet, repoParams(map[string]string{"number": fmt.Sprint(number)}), "", "")
	if w.Code != http.StatusOK {
		return issue, fmt.Errorf("status %d", w.Code)
	}

	err := json.Unmarshal(w.Body.Bytes(), &issue)

	return issue, err
}
