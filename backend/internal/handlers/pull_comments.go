package handlers

import (
	"backend/internal/database"
	"net/http"
	"strconv"
	"strings"
	"encoding/json"
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
			writeError(w, http.StatusUnauthorized, "you must be signed in to comment")
			return
		}

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

		comment, err := database.AddPullRequestComment(info.ID, number, user.ID, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if comment.ID == 0 {
			writeError(w, http.StatusNotFound, "pull request not found")
			return
		}

		writeJSON(w, http.StatusCreated, comment)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
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

		comment, err := database.UpdatePullRequestComment(info.ID, number, commentID, req.Body)
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
		if err := database.DeletePullRequestComment(info.ID, number, commentID); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeSuccess(w, map[string]any{"success": true})

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
