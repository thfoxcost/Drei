package test

import (
	"fmt"
	"net/http"
	"testing"
)

func TestListPullComments_Empty(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	comments := result["comments"].([]any)
	// A freshly created PR carries the "*No description*" seed comment.
	if len(comments) != 1 {
		t.Fatalf("expected 1 seed comment, got %d", len(comments))
	}
}

func TestCreatePullComment_Success(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"This looks great!"}`, true)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["body"] != "This looks great!" {
		t.Fatalf("expected body 'This looks great!', got %v", result["body"])
	}
}

func TestCreatePullComment_Unauthenticated(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Test"}`, false)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestCreatePullComment_EmptyBody(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":""}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestListPullComments_AfterCreate(t *testing.T) {
	num := createTestPR(t)
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Comment one"}`, true)
	req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Comment two"}`, true)

	w := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num), "", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	result := parseJSON(t, w)
	comments := result["comments"].([]any)
	// Seed comment plus the two created ones.
	if len(comments) != 3 {
		t.Fatalf("expected 3 comments, got %d", len(comments))
	}
}

func TestUpdatePullComment_Success(t *testing.T) {
	num := createTestPR(t)
	createW := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Original"}`, true)
	createResult := parseJSON(t, createW)
	commentID := int(createResult["id"].(float64))

	w := req(t, "PATCH",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/%d", num, commentID),
		`{"body":"Updated body"}`, true)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	if result["body"] != "Updated body" {
		t.Fatalf("expected body 'Updated body', got %v", result["body"])
	}
}

func TestUpdatePullComment_EmptyBody(t *testing.T) {
	num := createTestPR(t)
	createW := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"Original"}`, true)
	createResult := parseJSON(t, createW)
	commentID := int(createResult["id"].(float64))

	w := req(t, "PATCH",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/%d", num, commentID),
		`{"body":""}`, true)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestDeletePullComment_Success(t *testing.T) {
	num := createTestPR(t)
	createW := req(t, "POST", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num),
		`{"body":"To be deleted"}`, true)
	createResult := parseJSON(t, createW)
	commentID := int(createResult["id"].(float64))

	countComments := func() int {
		listW := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num), "", false)
		listResult := parseJSON(t, listW)
		return len(listResult["comments"].([]any))
	}

	before := countComments()

	w := req(t, "DELETE",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/%d", num, commentID),
		"", true)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Verify the comment is gone.
	if after := countComments(); after != before-1 {
		t.Fatalf("expected %d comments after delete, got %d", before-1, after)
	}
}

func TestDeletePullComment_InvalidID(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "DELETE",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/9999", num),
		"", true)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for unknown comment, got %d", w.Code)
	}
}
