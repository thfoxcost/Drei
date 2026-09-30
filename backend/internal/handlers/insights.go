package handlers

import (
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
	"strconv"
)

// PulseHandler returns recent activity stats for the insight Pulse page.
//
//	GET /api/repos/{owner}/{repo}/insights/pulse?days=7&branch=main
func PulseHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	if owner == "" || repo == "" {
		writeErrorCoded(w, http.StatusBadRequest, "missing_required_path_parameters", "missing required path parameters")
		return
	}

	days := 7
	if raw := r.URL.Query().Get("days"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			days = parsed
		}
	}

	branch := effectiveRef(r)

	stats, err := gitrepo.GetPulse(owner, repo, branch, days)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found_or_no_commits", "repository not found or has no commits")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// ContributorsInsightHandler returns per-author stats for the Contributors page.
//
//	GET /api/repos/{owner}/{repo}/insights/contributors?branch=main
func ContributorsInsightHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	if owner == "" || repo == "" {
		writeErrorCoded(w, http.StatusBadRequest, "missing_required_path_parameters", "missing required path parameters")
		return
	}

	insight, err := gitrepo.GetContributorsInsight(owner, repo, effectiveRef(r))
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found_or_no_commits", "repository not found or has no commits")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(insight)
}

// CodeFrequencyHandler returns weekly additions/deletions for the
// Code Frequency page.
//
//	GET /api/repos/{owner}/{repo}/insights/code-frequency?branch=main
func CodeFrequencyHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	if owner == "" || repo == "" {
		writeErrorCoded(w, http.StatusBadRequest, "missing_required_path_parameters", "missing required path parameters")
		return
	}

	weeks, err := gitrepo.GetCodeFrequency(owner, repo, effectiveRef(r))
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found_or_no_commits", "repository not found or has no commits")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"weeks": weeks})
}
