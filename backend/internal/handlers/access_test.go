package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// repoInfo builds a RepoInfo for the view-rule tests. Only the fields the rule
// reads are populated.
func repoInfo(visibility bool, orgID *int64) *database.RepoInfo {
	return &database.RepoInfo{
		ID:             1,
		OwnerID:        "owner-id",
		Owner:          "alice",
		Name:           "secret",
		Visibility:     visibility,
		OrganizationID: orgID,
	}
}

// TestCanViewRepositoryNeedsNoDatabase exercises the one branch of the view
// rule that is decided before any session lookup or membership query: a public
// personal repository is open to everyone. Passing an ownerID that could not
// possibly resolve keeps the test honest, because reaching the database here
// would panic on a nil pool.
func TestCanViewRepositoryPublicPersonalNeedsNoDatabase(t *testing.T) {
	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	// An unroutable client URL: if the rule tried to resolve a session it
	// would block for the client timeout instead of returning promptly.
	config.App.ClientURL = "http://127.0.0.1:1"

	req := httptest.NewRequest(http.MethodGet, "/api/repos/alice/public-repo", nil)

	allowed, authenticated := canViewRepository(req, repoInfo(true, nil))
	if !allowed {
		t.Error("a public personal repository must be readable by an anonymous caller")
	}

	if authenticated {
		t.Error("no session was presented, so authenticated must be false")
	}
}

// TestRequireRepositoryViewStatusCodes pins the 401/403 split, which is what
// lets a client tell "sign in" apart from "not allowed".
func TestRequireRepositoryViewStatusCodes(t *testing.T) {
	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	config.App.ClientURL = "http://127.0.0.1:1"

	rec := httptest.NewRecorder()
	ok := requireRepositoryView(rec, httptest.NewRequest(http.MethodGet, "/x", nil), repoInfo(false, nil))

	if ok {
		t.Fatal("an anonymous caller must not view a private personal repository")
	}

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d for an unauthenticated caller", rec.Code, http.StatusUnauthorized)
	}

	var body struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}

	if body.Error == "" {
		t.Error("the error response must carry a message")
	}
}

// TestRepositoryViewPassesThroughUnrelatedRoutes confirms the wrapper is inert
// for routes without owner/repo wildcards, which is most of the API.
func TestRepositoryViewPassesThroughUnrelatedRoutes(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle("/api/status", RepositoryView(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	})))

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/status", nil))

	if rec.Code != http.StatusTeapot {
		t.Errorf("status = %d, want %d: the wrapper must not touch unparameterised routes", rec.Code, http.StatusTeapot)
	}
}

// TestRepositoryViewPassesThroughUnknownRepository pins the pass-through for a
// repository with no database row. The wrapper must not answer, because doing
// so would turn it into a repository-existence oracle distinct from whatever
// 404 the handler produces.
func TestRepositoryViewPassesThroughUnknownRepository(t *testing.T) {
	if database.DB == nil {
		t.Skip("no database pool; needs the integration harness")
	}

	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	config.App.ClientURL = "http://127.0.0.1:1"

	mux := http.NewServeMux()
	mux.Handle("/api/repos/{owner}/{repo}", RepositoryView(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	})))

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/repos/nobody/definitely-missing", nil))

	if rec.Code != http.StatusTeapot {
		t.Errorf("status = %d, want %d: an unknown repository must reach the handler", rec.Code, http.StatusTeapot)
	}
}

// TestRequireRepoMemberRejectsAnonymous covers the label-deletion fix: the
// handler must refuse before touching the database, so an unauthenticated
// caller can never delete a label.
func TestRequireRepoMemberRejectsAnonymous(t *testing.T) {
	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	config.App.ClientURL = "http://127.0.0.1:1"

	rec := httptest.NewRecorder()
	user, ok := requireRepoMember(rec, httptest.NewRequest(http.MethodDelete, "/x", nil), repoInfo(true, nil))

	if ok {
		t.Fatal("an anonymous caller must not pass the membership gate")
	}

	if user != nil {
		t.Error("no user should be returned for an unauthenticated caller")
	}

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusUnauthorized)
	}
}

// TestIssueLabelHandlerRequiresAuthentication is the regression test for the
// reported hole: DELETE on a label used to succeed with no session at all.
func TestIssueLabelHandlerRequiresAuthentication(t *testing.T) {
	if database.DB == nil {
		t.Skip("needs a database to resolve the repository")
	}

	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	config.App.ClientURL = "http://127.0.0.1:1"

	mux := http.NewServeMux()
	mux.Handle("/api/repos/{owner}/{repo}/labels/{labelId}", PathValidation(RepositoryView(http.HandlerFunc(IssueLabelHandler))))

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodDelete, "/api/repos/nobody/no-such-repo/labels/1", nil))

	// Either the repository does not exist (404) or it does and the caller is
	// not authorized (401). What must never happen is a 200.
	if rec.Code == http.StatusOK {
		t.Fatal("label deletion succeeded without authentication")
	}

	if rec.Code != http.StatusUnauthorized && rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 401 or 404", rec.Code)
	}
}

// TestViewerAnonymous pins the listing scope's zero value, which the SQL
// predicate branches on.
func TestViewerAnonymous(t *testing.T) {
	if !(database.Viewer{}).Anonymous() {
		t.Error("the zero Viewer must be anonymous")
	}

	if (database.Viewer{UserID: "u1"}).Anonymous() {
		t.Error("a Viewer with a user id must not be anonymous")
	}
}
