package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const maxLogoSize = 2 * 1024 * 1024

// LogoHandler accepts a single image upload for a repository logo, stores it
// under <REPOS_PATH>/logos/<owner>/<repo>.<ext> and persists the relative path
// on the repositories row. It returns the public URL for the stored logo.
func LogoHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	// Cap the request body at the max logo size plus room for the multipart
	// overhead, then validate the file contents below.
	r.Body = http.MaxBytesReader(w, r.Body, maxLogoSize+(1<<20))

	file, _, err := r.FormFile("logo")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing logo file")
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

	if len(data) > maxLogoSize {
		writeError(w, http.StatusBadRequest, "image is too large. Maximum size is 2 MB")
		return
	}

	ext, ok := imageExtension(data)
	if !ok {
		writeError(w, http.StatusBadRequest, "unsupported file type. Please upload a PNG, JPG, WebP, or GIF image")
		return
	}

	logosDir := filepath.Join(config.App.ReposPath, "logos", owner)
	if err := os.MkdirAll(logosDir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	target := filepath.Join(logosDir, repo+ext)
	if err := os.WriteFile(target, data, 0644); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	logo := fmt.Sprintf("%s/%s%s", owner, repo, ext)

	if err := database.UpdateRepositoryLogo(owner, repo, logo); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{
		"success": true,
		"logo":    "http://localhost:3200/uploads/" + logo,
	})
}

// imageExtension detects the uploaded image MIME type and maps it to a file
// extension. It only accepts raster image formats.
func imageExtension(data []byte) (string, bool) {
	mime := http.DetectContentType(data)

	switch {
	case strings.HasPrefix(mime, "image/png"):
		return ".png", true
	case strings.HasPrefix(mime, "image/jpeg"):
		return ".jpg", true
	case strings.HasPrefix(mime, "image/webp"):
		return ".webp", true
	case strings.HasPrefix(mime, "image/gif"):
		return ".gif", true
	default:
		return "", false
	}
}
