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
	if len(comments) != 0 {
		t.Fatalf("expected 0 comments, got %d", len(comments))
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
	if len(comments) != 2 {
		t.Fatalf("expected 2 comments, got %d", len(comments))
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
		`{"body":"Updated body"}`, false)
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
		`{"body":""}`, false)
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

	w := req(t, "DELETE",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/%d", num, commentID),
		"", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Verify comment is gone.
	listW := req(t, "GET", fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments", num), "", false)
	listResult := parseJSON(t, listW)
	comments := listResult["comments"].([]any)
	if len(comments) != 0 {
		t.Fatalf("expected 0 comments after delete, got %d", len(comments))
	}
}

func TestDeletePullComment_InvalidID(t *testing.T) {
	num := createTestPR(t)
	w := req(t, "DELETE",
		fmt.Sprintf("/api/repos/testowner/testrepo/pulls/%d/comments/9999", num),
		"", false)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 (no-op delete), got %d", w.Code)
	}
}
