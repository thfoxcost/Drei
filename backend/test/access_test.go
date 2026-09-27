package test

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// accessFixture holds the repositories the private-read tests operate on.
//
// Three cases are needed to tell the view rule apart from a blanket denial:
// a public repository, a private repository the caller owns, and a private
// repository the caller has nothing to do with.
type accessFixture struct {
	publicRepoID     int64
	ownPrivateID     int64
	otherPrivateID   int64
	otherPrivateName string
	ownPrivateOwner  string
	otherOwner       string
	issueTitle       string
	labelID          int64
}

const (
	accessTestOwner      = "accesstestowner"
	accessTestOtherOwner = "accesstestother"
)

func newAccessMux() *http.ServeMux {
	m := http.NewServeMux()

	// Mirror main.go's registration: every repository-scoped route goes
	// through both wrappers, which is the behaviour under test.
	reg := func(pattern string, h http.HandlerFunc) {
		m.Handle(pattern, handlers.PathValidation(handlers.RepositoryView(h)))
	}

	reg("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	reg("/api/repos/{owner}/{repo}/blob/{branch}/{path...}", handlers.BlobHandler)
	reg("/api/repos/{owner}/{repo}/raw/{branch}/{path...}", handlers.RawHandler)
	reg("/api/repos/{owner}/{repo}/issues", handlers.IssuesHandler)
	reg("/api/repos/{owner}/{repo}/issues/{number}", handlers.IssueHandler)
	reg("/api/repos/{owner}/{repo}/labels/{labelId}", handlers.IssueLabelHandler)
	reg("/api/repos/{owner}/{repo}/backup/status", handlers.BackupStatusHandler)

	m.HandleFunc("/api/issues", handlers.AllIssuesHandler)
	m.HandleFunc("/api/pulls", handlers.AllPullsHandler)
	m.HandleFunc("/api/users/{owner}/repos", handlers.GetRepos)

	return m
}

func setupAccessFixture(t *testing.T) *accessFixture {
	t.Helper()

	cleanup := func() {
		ctx := context.Background()

		for _, owner := range []string{accessTestOwner, accessTestOtherOwner} {
			database.DB.Exec(ctx,
				`DELETE FROM issue_label_links WHERE label_id IN
				 (SELECT id FROM issue_labels WHERE repo_id IN
				  (SELECT id FROM repositories WHERE owner = $1))`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM issue_assignees WHERE issue_id IN
				 (SELECT id FROM issues WHERE repo_id IN
				  (SELECT id FROM repositories WHERE owner = $1))`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM issue_label_links WHERE issue_id IN
				 (SELECT id FROM issues WHERE repo_id IN
				  (SELECT id FROM repositories WHERE owner = $1))`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM issue_comments WHERE issue_id IN
				 (SELECT id FROM issues WHERE repo_id IN
				  (SELECT id FROM repositories WHERE owner = $1))`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM issues WHERE repo_id IN
				 (SELECT id FROM repositories WHERE owner = $1)`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM issue_labels WHERE repo_id IN
				 (SELECT id FROM repositories WHERE owner = $1)`, owner)
			database.DB.Exec(ctx,
				`DELETE FROM contributors WHERE repo_id IN
				 (SELECT id FROM repositories WHERE owner = $1)`, owner)
			database.DB.Exec(ctx, `DELETE FROM repositories WHERE owner = $1`, owner)
			database.DB.Exec(ctx, `DELETE FROM "user" WHERE id = $1`, "accesstest-other-user-id")
		}
	}

	cleanup()
	t.Cleanup(cleanup)

	// The repository-scoped handlers read from disk, so the fixture needs real
	// bare repositories at the paths they resolve. Cloning the harness
	// repository gives each one real commits to serve blob and raw from.
	mkOnDisk := func(owner, name string) string {
		t.Helper()

		dest := filepath.Join(config.App.ReposPath, owner, name+".git")
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			t.Fatal(err)
		}

		_ = os.RemoveAll(dest)

		if out, err := exec.Command("git", "clone", "--bare", testRepoDir, dest).CombinedOutput(); err != nil {
			t.Fatalf("clone fixture repo: %v: %s", err, out)
		}

		t.Cleanup(func() { _ = os.RemoveAll(dest) })

		return dest
	}

	// The other owner needs a user row so contributor lookups can join.
	if _, err := database.DB.Exec(context.Background(),
		`INSERT INTO "user" (id, name, email, "emailVerified") VALUES ($1, $2, $3, false)
		 ON CONFLICT (id) DO NOTHING`,
		"accesstest-other-user-id", accessTestOtherOwner, "accesstest-other@example.com",
	); err != nil {
		t.Fatalf("insert other user: %v", err)
	}

	mk := func(owner, ownerID, name string, visibility bool) int64 {
		t.Helper()

		id, err := database.CreateRepository(database.Repository{
			Name:          name,
			OwnerID:       ownerID,
			Owner:         owner,
			Description:   "access fixture",
			Visibility:    visibility,
			Path:          mkOnDisk(owner, name),
			DefaultBranch: "main",
		})
		if err != nil {
			t.Fatalf("create %s/%s: %v", owner, name, err)
		}

		return id
	}

	f := &accessFixture{
		ownPrivateOwner:  accessTestOwner,
		otherOwner:       accessTestOtherOwner,
		otherPrivateName: "hidden",
		publicRepoID:     mk(accessTestOwner, testUser.ID, "open", true),
		ownPrivateID:     mk(accessTestOwner, testUser.ID, "mine", false),
		otherPrivateID:   mk(accessTestOtherOwner, "accesstest-other-user-id", "hidden", false),
	}

	// An issue in the caller's own private repository, so the global feeds have
	// a private row to filter on.
	title := "accesstest private issue marker"
	if _, err := database.CreateIssue(f.ownPrivateID, testUser.ID, title, "private body", nil, nil, nil); err != nil {
		t.Fatalf("create issue: %v", err)
	}

	f.issueTitle = title

	label, err := database.CreateIssueLabel(f.ownPrivateID, "accesstest-label", "ff0000")
	if err != nil {
		t.Fatalf("create label: %v", err)
	}

	f.labelID = label.ID

	return f
}

func accessRequest(t *testing.T, m *http.ServeMux, method, path string, auth bool) *httptest.ResponseRecorder {
	t.Helper()

	r := httptest.NewRequest(method, path, nil)
	r.Header.Set("Content-Type", "application/json")

	if auth {
		r.Header.Set("Cookie", "session=test-session")
	}

	w := httptest.NewRecorder()
	m.ServeHTTP(w, r)

	return w
}

// TestPrivateRepoReadsRequireMembership is the core regression test: every
// repository-scoped read must refuse an anonymous caller on a private
// repository, and must accept the owner.
func TestPrivateRepoReadsRequireMembership(t *testing.T) {
	f := setupAccessFixture(t)
	m := newAccessMux()

	cases := []struct {
		name       string
		path       string
		wantPublic int
	}{
		{"repository metadata", fmt.Sprintf("/api/repos/%s/mine", accessTestOwner), http.StatusOK},
		// The blob, raw, issue and backup routes are the ones that used to
		// perform no authorization at all, or only an existence check.
		{"blob contents", fmt.Sprintf("/api/repos/%s/mine/blob/main/README.md", accessTestOwner), http.StatusOK},
		{"raw contents", fmt.Sprintf("/api/repos/%s/mine/raw/main/README.md", accessTestOwner), http.StatusOK},
		{"issue list", fmt.Sprintf("/api/repos/%s/mine/issues", accessTestOwner), http.StatusOK},
		{"issue detail", fmt.Sprintf("/api/repos/%s/mine/issues/1", accessTestOwner), http.StatusOK},
		{"backup status", fmt.Sprintf("/api/repos/%s/mine/backup/status", accessTestOwner), http.StatusOK},
	}

	for _, tc := range cases {
		t.Run(tc.name+" owner is allowed", func(t *testing.T) {
			if got := accessRequest(t, m, http.MethodGet, tc.path, true).Code; got != tc.wantPublic {
				t.Errorf("status = %d, want %d", got, tc.wantPublic)
			}
		})

		t.Run(tc.name+" anonymous is refused", func(t *testing.T) {
			got := accessRequest(t, m, http.MethodGet, tc.path, false).Code
			if got != http.StatusUnauthorized {
				t.Errorf("status = %d, want %d", got, http.StatusUnauthorized)
			}
		})
	}

	t.Run("public repository stays anonymous-readable", func(t *testing.T) {
		if got := accessRequest(t, m, http.MethodGet, "/api/repos/"+accessTestOwner+"/open", false).Code; got != http.StatusOK {
			t.Errorf("status = %d, want %d", got, http.StatusOK)
		}
	})

	t.Run("authenticated non-member is forbidden", func(t *testing.T) {
		path := fmt.Sprintf("/api/repos/%s/%s", accessTestOtherOwner, f.otherPrivateName)
		if got := accessRequest(t, m, http.MethodGet, path, true).Code; got != http.StatusForbidden {
			t.Errorf("status = %d, want %d", got, http.StatusForbidden)
		}
	})
}

// TestIssueLabelDeletionRequiresMembership is the regression test for the
// unauthenticated label deletion: DELETE on a label used to succeed with no
// session whatsoever.
func TestIssueLabelDeletionRequiresMembership(t *testing.T) {
	f := setupAccessFixture(t)
	m := newAccessMux()

	path := fmt.Sprintf("/api/repos/%s/mine/labels/%d", accessTestOwner, f.labelID)

	t.Run("anonymous cannot delete", func(t *testing.T) {
		w := accessRequest(t, m, http.MethodDelete, path, false)
		if w.Code == http.StatusOK {
			t.Fatal("label was deleted without authentication")
		}

		if w.Code != http.StatusUnauthorized && w.Code != http.StatusNotFound {
			t.Errorf("status = %d, want 401 or 404", w.Code)
		}

		// The label must still exist.
		labels, err := database.GetIssueLabels(f.ownPrivateID)
		if err != nil {
			t.Fatal(err)
		}

		if len(labels) == 0 {
			t.Fatal("the label was deleted by an unauthenticated request")
		}
	})

	t.Run("owner can delete", func(t *testing.T) {
		if got := accessRequest(t, m, http.MethodDelete, path, true).Code; got != http.StatusOK {
			t.Errorf("status = %d, want %d", got, http.StatusOK)
		}

		labels, err := database.GetIssueLabels(f.ownPrivateID)
		if err != nil {
			t.Fatal(err)
		}

		if len(labels) != 0 {
			t.Errorf("label count = %d, want 0 after the owner deleted it", len(labels))
		}
	})
}

// TestGlobalIssueFeedHidesPrivateRepositories covers the cross-repository
// listings, which had no visibility predicate in SQL at all.
func TestGlobalIssueFeedHidesPrivateRepositories(t *testing.T) {
	f := setupAccessFixture(t)
	m := newAccessMux()

	titles := func(w *httptest.ResponseRecorder) []string {
		t.Helper()

		var payload struct {
			Issues []struct {
				Title string `json:"title"`
			} `json:"issues"`
		}

		if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
			t.Fatalf("decode: %v (body %s)", err, w.Body.String())
		}

		out := make([]string, 0, len(payload.Issues))
		for _, issue := range payload.Issues {
			out = append(out, issue.Title)
		}

		return out
	}

	t.Run("anonymous does not see the private issue", func(t *testing.T) {
		for _, title := range titles(accessRequest(t, m, http.MethodGet, "/api/issues", false)) {
			if title == f.issueTitle {
				t.Error("the global issue feed exposed an issue from a private repository")
			}
		}
	})

	t.Run("owner sees the private issue", func(t *testing.T) {
		found := false

		for _, title := range titles(accessRequest(t, m, http.MethodGet, "/api/issues", true)) {
			if title == f.issueTitle {
				found = true
			}
		}

		if !found {
			t.Error("the owner cannot see their own private repository's issue in the global feed")
		}
	})
}

// TestUserRepoListingHidesPrivateRepositories covers the disk-driven listing,
// which enumerated every repository directory under an owner and used the
// database metadata only to decorate the response.
func TestUserRepoListingHidesPrivateRepositories(t *testing.T) {
	setupAccessFixture(t)
	m := newAccessMux()

	names := func(w *httptest.ResponseRecorder) map[string]bool {
		t.Helper()

		var payload []struct {
			Name string `json:"name"`
		}

		if err := json.Unmarshal(w.Body.Bytes(), &payload); err != nil {
			t.Fatalf("decode: %v (body %s)", err, w.Body.String())
		}

		out := map[string]bool{}
		for _, repo := range payload {
			out[repo.Name] = true
		}

		return out
	}

	path := "/api/users/" + accessTestOwner + "/repos"

	t.Run("anonymous sees the public repository only", func(t *testing.T) {
		got := names(accessRequest(t, m, http.MethodGet, path, false))

		if !got["open"] {
			t.Error("the listing dropped a public repository; the filter is too broad")
		}

		if got["mine"] {
			t.Error("the listing exposed a private repository to an anonymous caller")
		}
	})

	t.Run("owner sees both repositories", func(t *testing.T) {
		got := names(accessRequest(t, m, http.MethodGet, path, true))

		if !got["open"] {
			t.Error("the listing dropped a public repository")
		}

		if !got["mine"] {
			t.Error("the owner cannot see their own private repository in the listing")
		}
	})
}
