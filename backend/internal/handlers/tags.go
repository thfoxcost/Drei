package handlers

import (
	"backend/internal/gitrepo"
	"encoding/json"
	"net/http"
)

// effectiveRef returns the generic Git ref for ref-dependent endpoints. The
// ?ref= query parameter (branch, tag, or commit SHA) takes precedence; the
// legacy ?branch= parameter is honored for backward compatibility. Empty
// means HEAD (the default branch).
func effectiveRef(r *http.Request) string {
	if ref := r.URL.Query().Get("ref"); ref != "" {
		return ref
	}
	return r.URL.Query().Get("branch")
}

// TagsHandler lists all tags in a repository with rich metadata.
//
//	GET /api/repos/{owner}/{repo}/tags
//
// Tags are read-only in v1: they are created, moved, and deleted through
// normal Git operations (pushes via /git/), and this endpoint always reflects
// the current state of the bare repository. Git is the source of truth; there
// is no cache, fetcher, or database mirror.
func TagsHandler(w http.ResponseWriter, r *http.Request) {
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

	if _, ok := resolveRepo(w, r); !ok {
		return
	}

	tags, err := gitrepo.GetTagInfos(owner, repo)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "repository_not_found", "repository not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(tags); err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_encode_response", "failed to encode response")
		return
	}
}

// TagHandler returns a single tag with rich metadata, including the peeled
// commit it resolves to.
//
//	GET /api/repos/{owner}/{repo}/tags/{tag...}
//
// The {tag...} wildcard matches slashes so tags like "release/v2" work.
func TagHandler(w http.ResponseWriter, r *http.Request) {
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
	tag := r.PathValue("tag")

	if owner == "" || repo == "" || tag == "" {
		writeErrorCoded(w, http.StatusBadRequest, "missing_required_path_parameters", "missing required path parameters")
		return
	}

	if _, ok := resolveRepo(w, r); !ok {
		return
	}

	info, err := gitrepo.GetTag(owner, repo, tag)
	if err != nil {
		writeErrorCoded(w, http.StatusNotFound, "tag_not_found", "tag not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(info); err != nil {
		writeErrorCoded(w, http.StatusInternalServerError, "failed_to_encode_response", "failed to encode response")
		return
	}
}
