package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/gitrepo"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

type CreateRepoRequest struct {
	UserId        string `json:"userid"`
	Useremail     string `json:"useremail"`
	Username      string `json:"username"`
	Reponame      string `json:"reponame"`
	Description   string `json:"description"`
	Visibility    bool   `json:"visibility"`
	DefaultBranch string `json:"defaultbranch"`
	Avatar        string `json:"avatar"`
}

var current CreateRepoRequest

func parseRequest(r *http.Request) error {
	var req CreateRepoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return err
	}

	current = req
	return nil
}

func repoExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func createRepoFiles(userPath, repoPath string) error {
	gitrepo.CreateReposDIR(config.App.ReposPath)
	gitrepo.CreateUserDIR(userPath)

	if err := gitrepo.Init(repoPath); err != nil {
		return err
	}

	fmt.Println("[OK] Repository created:", repoPath)

	return nil
}

func CreateRepo(w http.ResponseWriter, r *http.Request) {
	// CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := parseRequest(r); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	userPath := filepath.Join(config.App.ReposPath, current.Username)
	repoPath := filepath.Join(userPath, current.Reponame+".git")

	if repoExists(repoPath) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"message": "Repository already exists",
		})
		return
	}

	if err := createRepoFiles(userPath, repoPath); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// store the repo in the pg DB
	repoID, err := database.CreateRepository(database.Repository{
		OwnerID:       current.UserId,
		Owner:         current.Username,
		Name:          current.Reponame,
		Description:   current.Description,
		Visibility:    current.Visibility,
		Path:          repoPath,
		DefaultBranch: "main",
	})
	if err != nil {
		// Remove the repository from disk if the database insert failed.
		_ = os.RemoveAll(repoPath)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Add the repository creator as the first contributor.
	var avatar *string

	if current.Avatar != "" {
		avatar = &current.Avatar
	}

	if err := database.CreateContributor(repoID, database.Contributor{
		ID:       current.UserId,
		Username: current.Username,
		Avatar:   avatar,
	}); err != nil {
		// Remove the repository from disk if the contributor insert failed.
		_ = os.RemoveAll(repoPath)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository created successfully",
	})
}

func RepoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	repository, err := gitrepo.GetRepo(owner, repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(repository); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
