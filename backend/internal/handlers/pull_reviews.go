package handlers

import (
	"backend/internal/database"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
)

// PullReviewsHandler lists and creates reviews on a pull request.
//
//	GET  /api/repos/{owner}/{repo}/pulls/{number}/reviews
//	POST /api/repos/{owner}/{repo}/pulls/{number}/reviews
func PullReviewsHandler(w http.ResponseWriter, r *http.Request) {
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
		reviews, err := database.ListPullRequestReviews(info.ID, number)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		if reviews == nil {
			reviews = []database.PullRequestReview{}
		}

		writeSuccess(w, map[string]any{"reviews": reviews})

	case http.MethodPost:
		user, err := authenticate(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "you must be signed in to review")
			return
		}

		pull, ok := getPullOr404(w, info.ID, number)
		if !ok {
			return
		}

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		var req struct {
			State string `json:"state"`
			Body  string `json:"body"`
		}

		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		// PR authors cannot approve or request changes on their own PR.
		if pull.Author.ID == user.ID {
			if req.State == "approved" || req.State == "changes_requested" {
				writeError(w, http.StatusForbidden, "you cannot approve or request changes on your own pull request")
				return
			}
		}

		req.State = strings.TrimSpace(req.State)
		req.Body = strings.TrimSpace(req.Body)

		if req.State != "comment" && req.State != "approved" && req.State != "changes_requested" {
			writeError(w, http.StatusBadRequest, "invalid review state: must be comment, approved, or changes_requested")
			return
		}

		// Comment reviews require a body.
		if req.State == "comment" && req.Body == "" {
			writeError(w, http.StatusBadRequest, "comment reviews require a body")
			return
		}

		review, err := database.AddPullRequestReview(info.ID, number, user.ID, req.State, req.Body)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}

		writeJSON(w, http.StatusCreated, review)

	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// PullReviewHandler deletes a single review on a pull request.
//
//	DELETE /api/repos/{owner}/{repo}/pulls/{number}/reviews/{reviewId}
func PullReviewHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "DELETE")

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

	number, ok := parsePullNumber(w, r)
	if !ok {
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to delete a review")
		return
	}

	reviewID, err := strconv.ParseInt(r.PathValue("reviewId"), 10, 64)
	if err != nil || reviewID <= 0 {
		writeError(w, http.StatusBadRequest, "invalid review id")
		return
	}

	if err := database.DeletePullRequestReview(info.ID, number, reviewID, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"success": true})
}
