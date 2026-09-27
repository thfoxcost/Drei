package handlers

import (
	"backend/internal/config"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidNamespace(t *testing.T) {
	valid := []string{"alice", "testowner", "repo-name", "repo_name", "Repo.Name", "a", strings.Repeat("a", 100)}
	for _, name := range valid {
		if !ValidNamespace(name) {
			t.Errorf("ValidNamespace(%q) = false, want true", name)
		}
	}

	invalid := []string{
		"",
		"..",
		".",
		"../etc",
		"..%2fetc",
		"a/b",
		"a\\b",
		"/abs",
		"a/",
		".hidden",
		"-flag",
		"nul\x00byte",
		strings.Repeat("a", 101),
	}
	for _, name := range invalid {
		if ValidNamespace(name) {
			t.Errorf("ValidNamespace(%q) = true, want false", name)
		}
	}
}

func TestValidRepoFilePath(t *testing.T) {
	valid := []string{"README.md", "src/lib/main.go", "a/b/c.txt", "..hidden", "a..b", "...", "a/..b"}
	for _, p := range valid {
		if !ValidRepoFilePath(p) {
			t.Errorf("ValidRepoFilePath(%q) = false, want true", p)
		}
	}

	// Any ".." segment is rejected, including ones that would resolve back
	// inside the repository: the check is a cheap allowlist, not a resolver.
	invalid := []string{"", "../secrets", "a/../../etc/passwd", "..", "a/..", "a/../b"}
	for _, p := range invalid {
		if ValidRepoFilePath(p) {
			t.Errorf("ValidRepoFilePath(%q) = true, want false", p)
		}
	}
}

// TestPathValidationRejectsTraversal builds a real mux so that r.PathValue is
// populated the way net/http populates it, and asserts the wrapper rejects
// hostile path parameters before the handler runs.
//
// The traversal payloads are percent-encoded on purpose. net/http's ServeMux
// already cleans a literal "../" out of the path and answers with a 307, so
// that case never reaches a handler. Percent-encoded separators are not
// cleaned: the mux splits on the raw "/", matches the wildcard, and only then
// unescapes it, so r.PathValue("owner") arrives as "../../etc". Without this
// wrapper that value flows straight into filepath.Join under REPOS_PATH.
func TestPathValidationRejectsTraversal(t *testing.T) {
	cases := []struct {
		name       string
		pattern    string
		target     string
		wantStatus int
	}{
		{"encoded owner traversal", "/api/repos/{owner}/{repo}", "/api/repos/%2e%2e%2f%2e%2e%2fetc/passwd", http.StatusBadRequest},
		{"encoded repo traversal", "/api/repos/{owner}/{repo}", "/api/repos/alice/%2e%2e%2f%2e%2e%2fetc", http.StatusBadRequest},
		{"encoded bare dotdot owner", "/api/repos/{owner}/{repo}", "/api/repos/%2e%2e/secret", http.StatusBadRequest},
		{"encoded backslash owner", "/api/repos/{owner}/{repo}", "/api/repos/a%5Cb/ok", http.StatusBadRequest},
		{"encoded traversal in file path", "/api/repos/{owner}/{repo}/raw/{branch}/{path...}", "/api/repos/alice/ok/raw/main/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", http.StatusBadRequest},
		{"literal traversal is redirected by the mux", "/api/repos/{owner}/{repo}", "/api/repos/../../etc/passwd", http.StatusTemporaryRedirect},
		{"legitimate request passes", "/api/repos/{owner}/{repo}", "/api/repos/alice/my-repo", http.StatusTeapot},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mux := http.NewServeMux()
			mux.Handle(tc.pattern, PathValidation(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusTeapot)
			})))

			req := httptest.NewRequest(http.MethodGet, tc.target, nil)
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d (body: %s)", rec.Code, tc.wantStatus, rec.Body.String())
			}
		})
	}
}

// TestPathValidationIgnoresUnrelatedRoutes confirms routes without owner/repo
// wildcards are untouched: r.PathValue returns "" for absent wildcards and
// must not be treated as a validation failure.
func TestPathValidationIgnoresUnrelatedRoutes(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle("/api/status", PathValidation(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	})))

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/status", nil))

	if rec.Code != http.StatusTeapot {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusTeapot)
	}
}

func TestSetCORSScopesToAllowedOrigin(t *testing.T) {
	original := config.App.ClientURL
	t.Cleanup(func() { config.App.ClientURL = original })

	config.App.ClientURL = "http://drei.lan"

	t.Run("allowed origin is echoed with credentials", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
		req.Header.Set("Origin", "http://drei.lan")

		setCORS(rec, req, "GET")

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://drei.lan" {
			t.Errorf("Allow-Origin = %q, want %q", got, "http://drei.lan")
		}

		if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "true" {
			t.Errorf("Allow-Credentials = %q, want %q", got, "true")
		}
	})

	t.Run("trailing slash on CLIENT_URL still matches", func(t *testing.T) {
		config.App.ClientURL = "http://drei.lan/"
		defer func() { config.App.ClientURL = "http://drei.lan" }()

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
		req.Header.Set("Origin", "http://drei.lan")

		setCORS(rec, req, "GET")

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://drei.lan" {
			t.Errorf("Allow-Origin = %q, want %q", got, "http://drei.lan")
		}
	})

	hostile := []struct {
		name   string
		origin string
	}{
		{"unrelated origin", "https://evil.example"},
		{"look-alike host suffix", "http://drei.lan.evil.example"},
		{"look-alike host prefix", "http://evilhttp://drei.lan"},
		{"subdomain of allowed host", "http://sub.drei.lan"},
		{"different scheme", "https://drei.lan"},
		{"different port", "http://drei.lan:8080"},
		{"null origin", "null"},
	}

	for _, tc := range hostile {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, "/api/status", nil)
			req.Header.Set("Origin", tc.origin)

			setCORS(rec, req, "GET")

			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
				t.Errorf("Allow-Origin = %q, want empty for origin %q", got, tc.origin)
			}

			if got := rec.Header().Get("Access-Control-Allow-Credentials"); got != "" {
				t.Errorf("Allow-Credentials = %q, want empty", got)
			}

			// Vary must still be set so caches do not serve one origin's
			// response to another.
			if !strings.Contains(rec.Header().Get("Vary"), "Origin") {
				t.Error("Vary must include Origin even when the origin is rejected")
			}
		})
	}

	t.Run("no origin header yields no cors headers", func(t *testing.T) {
		rec := httptest.NewRecorder()
		setCORS(rec, httptest.NewRequest(http.MethodGet, "/api/status", nil), "GET")

		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "" {
			t.Errorf("Allow-Origin = %q, want empty", got)
		}
	})
}
