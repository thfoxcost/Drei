package handlers

import (
	"backend/internal/config"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

const maxPullImageSize = 5 * 1024 * 1024

// PullImageHandler accepts a single image upload intended for a pull request
// comment, stores it under
// <REPOS_PATH>/pr-images/<owner>/<repo>/<random>.<ext> and returns the
// public URL to embed in Markdown. Uploaded files are served by the static
// handler mounted at /uploads/pr-images/.
//
//	POST /api/repos/{owner}/{repo}/pulls/images
func PullImageHandler(w http.ResponseWriter, r *http.Request) {
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

	r.Body = http.MaxBytesReader(w, r.Body, maxPullImageSize+(1<<20))

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

	if len(data) > maxPullImageSize {
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

	dir := filepath.Join(config.App.ReposPath, "pr-images", info.Owner, info.Name)
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
		"url":     fmt.Sprintf("http://localhost:3200/uploads/pr-images/%s/%s/%s%s", info.Owner, info.Name, name, ext),
	})
}
