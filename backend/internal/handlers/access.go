package handlers

import (
	"backend/internal/database"
	"net/http"
)

// canViewRepository reports whether the request may read this repository, and
// whether the request carried a valid session.
//
// The rule, in one place so every read path behaves identically:
//
//   - A public personal repository is open to everyone, including anonymous
//     callers, and costs no session lookup.
//   - A public repository in a public organization is likewise open. A
//     members-only organization always requires membership.
//   - Everything else - private personal repositories, private organization
//     repositories, and members-only organizations - requires membership.
//     database.IsRepoMember is the single definition of membership: the
//     repository owner, its contributors, and members of the owning
//     organization.
//
// The boolean pair lets the caller answer 401 versus 403 without a second
// session lookup.
func canViewRepository(r *http.Request, info *database.RepoInfo) (allowed, authenticated bool) {
	if info.OrganizationID == nil {
		if info.Visibility {
			return true, false
		}
	} else {
		org, err := database.GetOrganizationBySlug(info.Owner)
		if err != nil {
			// An organization repository whose organization row is missing is
			// not readable by anyone.
			return false, false
		}

		if info.Visibility && org.Visibility != "members" {
			return true, false
		}
	}

	user, err := authenticate(r)
	if err != nil {
		return false, false
	}

	member, err := database.IsRepoMember(info.ID, user.ID)
	if err != nil {
		// Fail closed: a membership lookup that errors is not a licence.
		return false, true
	}

	return member, true
}

// requireRepositoryView is the response-writing form of canViewRepository.
func requireRepositoryView(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) bool {
	allowed, authenticated := canViewRepository(r, info)
	if allowed {
		return true
	}

	if !authenticated {
		writeError(w, http.StatusUnauthorized, "authentication required to view this repository")
		return false
	}

	writeError(w, http.StatusForbidden, "this repository is private")

	return false
}

// RepositoryView gates every repository-scoped route on the shared view rule.
//
// It exists so that authorization cannot be forgotten. The audit found reads
// spread across three shapes - routes with no repository lookup at all (blob,
// raw, commits, insights), routes gated only by an existence check (the 26
// handlers built on resolveRepo), and routes with a bespoke check - and each
// shape had to be fixed separately, which is exactly how they drifted apart.
// Wrapping every /api/repos/{owner}/{repo} route makes the rule the default.
//
// Applied at mux-registration time, not in front of the mux, because net/http
// only populates r.PathValue after a pattern has matched.
//
// Requests for a repository with no database row are passed through
// untouched: the handler produces its own 404, and answering here would turn
// this wrapper into a repository-existence oracle.
func RepositoryView(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		owner, repo := r.PathValue("owner"), r.PathValue("repo")
		if owner == "" || repo == "" {
			next.ServeHTTP(w, r)
			return
		}

		info, err := database.GetRepository(owner, repo)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		if !requireRepositoryView(w, r, info) {
			return
		}

		next.ServeHTTP(w, r)
	})
}

// requireRepoMember enforces write access to a repository: the caller must
// have a valid session and be a member of the repository.
//
// database.IsRepoMember defines membership - owner, contributors, and members
// of the owning organization - which is the same bar the branch, pull request
// merge and pull request revert paths already apply. It is deliberately less
// strict than authorizeOrgRepo, which reserves repository settings for the
// owner.
//
// Several handlers still inline this sequence; new code should call this.
func requireRepoMember(w http.ResponseWriter, r *http.Request, info *database.RepoInfo) (*AuthUser, bool) {
	user, err := authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in")
		return nil, false
	}

	member, err := database.IsRepoMember(info.ID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return nil, false
	}

	if !member {
		writeError(w, http.StatusForbidden, "you must be a contributor of this repository")
		return nil, false
	}

	return user, true
}

// repositoryViewer resolves the session into the scope a cross-repository
// listing should be filtered to. An unauthenticated caller yields the zero
// Viewer, which sees public repositories only.
func repositoryViewer(r *http.Request) database.Viewer {
	var viewer database.Viewer

	if user, err := authenticate(r); err == nil {
		viewer.UserID = user.ID
	}

	return viewer
}
