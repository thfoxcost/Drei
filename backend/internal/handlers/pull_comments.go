package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

// PullCommentsHandler lists and creates comments on a pull request.
//
//	GET  /api/repos/{owner}/{repo}/pulls/{number}/comments
//	POST /api/repos/{owner}/{repo}/pulls/{number}/comments
func PullCommentsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET, POST")

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
		comments, err := database.ListPullRequestComments(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comments == nil {
			comments = []database.PullRequestComment{}
		}

		writeSuccess(w, map[string]any{"comments": comments})

	case http.MethodPost:
		user, err := authenticate(r)
		if err != nil {
			writeErrorCoded(w, http.StatusUnauthorized, "sign_in_required_to_comment", "you must be signed in to comment")
			return
		}

		var req struct {
			Body string `json:"body"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
			return
		}

		req.Body = strings.TrimSpace(req.Body)

		if req.Body == "" {
			writeErrorCoded(w, http.StatusBadRequest, "comment_body_required", "comment body is required")
			return
		}

		comment, err := database.AddPullRequestComment(info.ID, number, user.ID, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comment.ID == 0 {
			writeErrorCoded(w, http.StatusNotFound, "pull_request_not_found", "pull request not found")
			return
		}

		writeJSON(w, http.StatusCreated, comment)

	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}

// PullCommentHandler updates and deletes a single comment on a pull request.
//
//	PATCH  /api/repos/{owner}/{repo}/pulls/{number}/comments/{commentId}
//	DELETE /api/repos/{owner}/{repo}/pulls/{number}/comments/{commentId}
func PullCommentHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "PATCH, DELETE")

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

	commentID, err := strconv.ParseInt(r.PathValue("commentId"), 10, 64)
	if err != nil || commentID <= 0 {
		writeErrorCoded(w, http.StatusBadRequest, "invalid_comment_id", "invalid comment id")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var req struct {
			Body string `json:"body"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_request_body", "invalid request body")
			return
		}

		req.Body = strings.TrimSpace(req.Body)

		if req.Body == "" {
			writeErrorCoded(w, http.StatusBadRequest, "comment_body_required", "comment body is required")
			return
		}

		comment, err := database.UpdatePullRequestComment(info.ID, number, commentID, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comment.ID == 0 {
			writeErrorCoded(w, http.StatusNotFound, "comment_not_found", "comment not found")
			return
		}

		writeJSON(w, http.StatusOK, comment)

	case http.MethodDelete:
		if err := database.DeletePullRequestComment(info.ID, number, commentID); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
	}
}
