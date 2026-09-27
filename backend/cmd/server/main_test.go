package main

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestUploadFileServerRejectsDirectoryRequests pins the fix for uploaded images
// being enumerable. http.FileServer renders a directory index for any path
// ending in "/", which published every issue and pull request image belonging
// to a private repository to anyone who requested the directory.
func TestUploadFileServerRejectsDirectoryRequests(t *testing.T) {
	dir := t.TempDir()

	if err := os.MkdirAll(filepath.Join(dir, "alice", "private-repo"), 0o755); err != nil {
		t.Fatal(err)
	}

	const secret = "0123456789abcdef0123456789abcdef.png"

	if err := os.WriteFile(filepath.Join(dir, "alice", "private-repo", secret), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}

	handler := uploadFileServer(dir)

	t.Run("directory request is refused", func(t *testing.T) {
		for _, path := range []string{"/alice/private-repo/", "/"} {
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))

			if rec.Code != http.StatusNotFound {
				t.Errorf("%q: status = %d, want %d", path, rec.Code, http.StatusNotFound)
			}

			if strings.Contains(rec.Body.String(), secret) {
				t.Errorf("%q: the directory index leaked a stored filename", path)
			}
		}
	})

	t.Run("empty path is refused", func(t *testing.T) {
		// What http.StripPrefix leaves behind for a request to the mount point.
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, &http.Request{
			Method: http.MethodGet,
			URL:    &url.URL{Path: ""},
		})

		if rec.Code != http.StatusNotFound {
			t.Errorf("status = %d, want %d", rec.Code, http.StatusNotFound)
		}

		if strings.Contains(rec.Body.String(), secret) {
			t.Error("the empty path served a directory index")
		}
	})

	t.Run("stripped mount point is refused", func(t *testing.T) {
		// http.StripPrefix leaves the path empty for a request to the mount
		// point, which is how the server actually reaches this handler.
		stripped := http.StripPrefix("/uploads/issue-images/", handler)

		rec := httptest.NewRecorder()
		stripped.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/uploads/issue-images/", nil))

		if rec.Code != http.StatusNotFound {
			t.Errorf("status = %d, want %d", rec.Code, http.StatusNotFound)
		}

		if strings.Contains(rec.Body.String(), secret) {
			t.Error("the mount point served a directory index")
		}
	})

	t.Run("exact file path is still served", func(t *testing.T) {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/alice/private-repo/"+secret, nil))

		if rec.Code != http.StatusOK {
			t.Errorf("status = %d, want %d: the client embeds these URLs as <img src>", rec.Code, http.StatusOK)
		}
	})

	t.Run("traversal cannot escape the upload root", func(t *testing.T) {
		outside := filepath.Join(filepath.Dir(dir), "escape-target.txt")

		if err := os.WriteFile(outside, []byte("secret"), 0o644); err != nil {
			t.Fatal(err)
		}

		t.Cleanup(func() { _ = os.Remove(outside) })

		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/../escape-target.txt", nil))

		if rec.Code == http.StatusOK {
			t.Errorf("status = %d, want a non-200: a file outside the upload root was served", rec.Code)
		}
	})
}
