package test

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"backend/internal/handlers"
	"bytes"
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

var (
	testUser    = &database.Contributor{ID: "test-user-id", Username: "testuser"}
	testRepoID  int64
	testRepoDir string
	mux         *http.ServeMux
	authServer  *httptest.Server
)

func TestMain(m *testing.M) {
	os.Setenv("DATABASE_URL", "postgres://user:password@localhost:5432/pg?sslmode=disable")
	os.Setenv("REPOS_PATH", filepath.Join(os.TempDir(), "drei-test-repos"))

	if err := config.Load(); err != nil {
		fmt.Fprintf(os.Stderr, "load config: %v\n", err)
		os.Exit(1)
	}

	if err := database.Connect(config.App.DatabaseURL); err != nil {
		fmt.Fprintf(os.Stderr, "connect database: %v\n", err)
		os.Exit(1)
	}

	if err := database.Migrate(); err != nil {
		fmt.Fprintf(os.Stderr, "migrate: %v\n", err)
		os.Exit(1)
	}

	cleanup := setupTestData()
	code := m.Run()
	cleanup()
	database.DB.Close()
	os.Exit(code)
}

func setupTestData() func() {
	// Clean previous test data.
	database.DB.Exec(context.Background(), `DELETE FROM pull_request_events`)
	database.DB.Exec(context.Background(), `DELETE FROM pull_request_comments`)
	database.DB.Exec(context.Background(), `DELETE FROM pull_requests`)
	database.DB.Exec(context.Background(), `DELETE FROM issue_comments`)
	database.DB.Exec(context.Background(), `DELETE FROM issue_label_links`)
	database.DB.Exec(context.Background(), `DELETE FROM issue_assignees`)
	database.DB.Exec(context.Background(), `DELETE FROM issues`)
	database.DB.Exec(context.Background(), `DELETE FROM issue_labels`)
	database.DB.Exec(context.Background(), `DELETE FROM contributors`)
	database.DB.Exec(context.Background(), `DELETE FROM repositories`)
	database.DB.Exec(context.Background(), `DELETE FROM "user"`)

	// Create test user.
	_, err := database.DB.Exec(context.Background(),
		`INSERT INTO "user" (id, name, email, "emailVerified")
		 VALUES ($1, $2, $3, false)
		 ON CONFLICT (id) DO UPDATE SET name = $2`,
		testUser.ID, testUser.Username, "test@example.com",
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "insert user: %v\n", err)
		os.Exit(1)
	}

	// Create test bare repo with two branches.
	testRepoDir = filepath.Join(config.App.ReposPath, "testowner", "testrepo.git")
	os.MkdirAll(filepath.Dir(testRepoDir), 0755)
	os.RemoveAll(testRepoDir)

	if err := gitrepo.Init(testRepoDir); err != nil {
		fmt.Fprintf(os.Stderr, "init repo: %v\n", err)
		os.Exit(1)
	}

	// Create initial commit on main.
	tmpClone := filepath.Join(os.TempDir(), "drei-test-clone")
	os.RemoveAll(tmpClone)
	defer os.RemoveAll(tmpClone)

	runGit("clone", testRepoDir, tmpClone)
	runGit("-C", tmpClone, "config", "user.email", "test@example.com")
	runGit("-C", tmpClone, "config", "user.name", "testuser")
	os.WriteFile(filepath.Join(tmpClone, "README.md"), []byte("# test\n"), 0644)
	runGit("-C", tmpClone, "add", ".")
	runGit("-C", tmpClone, "commit", "-m", "initial commit")

	// Create feature branch with a commit.
	runGit("-C", tmpClone, "checkout", "-b", "feature-branch")
	os.WriteFile(filepath.Join(tmpClone, "feature.txt"), []byte("feature content\n"), 0644)
	runGit("-C", tmpClone, "add", ".")
	runGit("-C", tmpClone, "commit", "-m", "add feature")

	// Create a second branch for compare tests (not merged into main).
	runGit("-C", tmpClone, "checkout", "main")
	runGit("-C", tmpClone, "checkout", "-b", "compare-branch")
	os.WriteFile(filepath.Join(tmpClone, "compare.txt"), []byte("compare content\n"), 0644)
	runGit("-C", tmpClone, "add", ".")
	runGit("-C", tmpClone, "commit", "-m", "add compare file")

	// Push all branches.
	runGit("-C", tmpClone, "push", "origin", "main")
	runGit("-C", tmpClone, "push", "origin", "feature-branch")
	runGit("-C", tmpClone, "push", "origin", "compare-branch")

	// Insert repo in database.
	repoID, err := database.CreateRepository(database.Repository{
		Name:          "testrepo",
		OwnerID:       testUser.ID,
		Owner:         "testowner",
		Description:   "Test repository",
		Visibility:    true,
		Path:          testRepoDir,
		DefaultBranch: "main",
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "create repo: %v\n", err)
		os.Exit(1)
	}
	testRepoID = repoID

	// Add user as contributor.
	database.CreateContributor(repoID, database.Contributor{
		ID:       testUser.ID,
		Username: testUser.Username,
	})

	// Start mock auth server.
	authServer = startAuthServer()
	config.App.ClientURL = authServer.URL

	// Register handlers.
	mux = http.NewServeMux()
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/compare", handlers.PullCompareHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls", handlers.PullsHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}", handlers.PullHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/close", handlers.PullCloseHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/reopen", handlers.PullReopenHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/merge", handlers.PullMergeHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/comments", handlers.PullCommentsHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/comments/{commentId}", handlers.PullCommentHandler)
	mux.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/events", handlers.PullEventsHandler)

	return func() {
		authServer.Close()
		os.RemoveAll(testRepoDir)
		os.RemoveAll(tmpClone)
		database.DB.Exec(context.Background(), `DELETE FROM pull_request_events`)
		database.DB.Exec(context.Background(), `DELETE FROM pull_request_comments`)
		database.DB.Exec(context.Background(), `DELETE FROM pull_requests`)
		database.DB.Exec(context.Background(), `DELETE FROM issue_comments`)
		database.DB.Exec(context.Background(), `DELETE FROM issue_label_links`)
		database.DB.Exec(context.Background(), `DELETE FROM issue_assignees`)
		database.DB.Exec(context.Background(), `DELETE FROM issues`)
		database.DB.Exec(context.Background(), `DELETE FROM issue_labels`)
		database.DB.Exec(context.Background(), `DELETE FROM contributors`)
		database.DB.Exec(context.Background(), `DELETE FROM repositories`)
		database.DB.Exec(context.Background(), `DELETE FROM "user"`)
	}
}

func runGit(args ...string) {
	cmd := exec.Command("git", args...)
	cmd.Run()
}

func startAuthServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie := r.Header.Get("Cookie")
		if cookie == "" || cookie != "session=test-session" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		json.NewEncoder(w).Encode(map[string]any{
			"session": map[string]any{"id": "sess1"},
			"user": map[string]any{
				"id":    testUser.ID,
				"name":  testUser.Username,
				"image": nil,
			},
		})
	}))
}

func req(t *testing.T, method, path, body string, auth bool) *httptest.ResponseRecorder {
	t.Helper()

	var reqBody *bytes.Buffer
	if body != "" {
		reqBody = bytes.NewBufferString(body)
	} else {
		reqBody = bytes.NewBufferString("")
	}

	r := httptest.NewRequest(method, path, reqBody)
	r.Header.Set("Content-Type", "application/json")

	if auth {
		r.Header.Set("Cookie", "session=test-session")
	}

	w := httptest.NewRecorder()
	mux.ServeHTTP(w, r)
	return w
}

func parseJSON(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var result map[string]any
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return result
}

func createTestPR(t *testing.T) int {
	t.Helper()
	w := req(t, "POST", "/api/repos/testowner/testrepo/pulls", fmt.Sprintf(
		`{"title":"Test PR","description":"A test pull request","sourceBranch":"feature-branch","targetBranch":"main"}`,
	), true)
	if w.Code != http.StatusCreated {
		t.Fatalf("create PR: status %d, body: %s", w.Code, w.Body.String())
	}
	result := parseJSON(t, w)
	return int(result["number"].(float64))
}
