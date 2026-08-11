package handlers

import (
	"backend/internal/config"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

const maxIssueImageSize = 5 * 1024 * 1024

// IssueImageHandler accepts a single image upload intended for an issue
// description, stores it under
// <REPOS_PATH>/issue-images/<owner>/<repo>/<random>.<ext> and returns the
// public URL to embed in Markdown. Uploaded files are served by the static
// handler mounted at /uploads/issue-images/.
//
//	POST /api/repos/{owner}/{repo}/issues/images
func IssueImageHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if _, err := authenticate(r); err != nil {
		writeError(w, http.StatusUnauthorized, "you must be signed in to upload images")
		return
	}

	info, ok := resolveRepo(w, r)
	if !ok {
		return
	}

	// Cap the request body at the max image size plus room for the multipart
	// overhead, then validate the file contents below.
	r.Body = http.MaxBytesReader(w, r.Body, maxIssueImageSize+(1<<20))

	file, _, err := r.FormFile("image")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing image file")
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read uploaded file")
		return
	}

	if len(data) == 0 {
		writeError(w, http.StatusBadRequest, "uploaded file is empty")
		return
	}

	if len(data) > maxIssueImageSize {
		writeError(w, http.StatusBadRequest, "image is too large. Maximum size is 5 MB")
		return
	}

	ext, ok := imageExtension(data)
	if !ok {
		writeError(w, http.StatusBadRequest, "unsupported file type. Please upload a PNG, JPG, WebP, or GIF image")
		return
	}

	name, err := randomName()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dir := filepath.Join(config.App.ReposPath, "issue-images", info.Owner, info.Name)
	if err := os.MkdirAll(dir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	target := filepath.Join(dir, name+ext)
	if err := os.WriteFile(target, data, 0644); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"url":     fmt.Sprintf("http://localhost:3200/uploads/issue-images/%s/%s/%s%s", info.Owner, info.Name, name, ext),
	})
}

// randomName returns a random hex string used as an uploaded image filename.
func randomName() (string, error) {
	b := make([]byte, 16)

	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return hex.EncodeToString(b), nil
}
