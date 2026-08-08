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
	"strings"
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

type UpdateRepoRequest struct {
	Name                string `json:"name"`
	Description         string `json:"description"`
	DefaultBranch       string `json:"defaultBranch"`
	RenameDefaultBranch string `json:"renameDefaultBranch"`
	Website             string `json:"website"`
}

func updateRepository(w http.ResponseWriter, r *http.Request, owner, repo string) {
	writeErr := func(status int, msg string) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   msg,
		})
	}

	var req UpdateRepoRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(http.StatusBadRequest, "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)
	req.DefaultBranch = strings.TrimSpace(req.DefaultBranch)
	req.RenameDefaultBranch = strings.TrimSpace(req.RenameDefaultBranch)
	req.Website = strings.TrimSpace(req.Website)

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErr(http.StatusNotFound, "repository not found")
		return
	}

	currentDefault, err := gitrepo.DefaultBranch(owner, repo)
	if err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	// Rename the current default branch first so the rename always applies to
	// the branch HEAD points to when the request arrives.
	if req.RenameDefaultBranch != "" && req.RenameDefaultBranch != currentDefault {
		if err := gitrepo.RenameDefaultBranch(owner, repo, req.RenameDefaultBranch); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		currentDefault = req.RenameDefaultBranch
	}

	// Switch the default branch (HEAD) to an existing branch.
	if req.DefaultBranch != "" && req.DefaultBranch != currentDefault {
		if err := gitrepo.SetDefaultBranch(owner, repo, req.DefaultBranch); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		currentDefault = req.DefaultBranch
	}

	// Rename the repository itself (bare repo directory + database row).
	if req.Name != "" && req.Name != repo {
		if err := gitrepo.RenameRepository(owner, repo, req.Name); err != nil {
			writeErr(http.StatusBadRequest, err.Error())
			return
		}

		newPath := filepath.Join(config.App.ReposPath, owner, req.Name+".git")

		if err := database.UpdateRepositoryName(owner, repo, req.Name, newPath); err != nil {
			writeErr(http.StatusInternalServerError, err.Error())
			return
		}

		// Keep the stored logo in sync so its public URL still works.
		if info.Logo != "" {
			if err := gitrepo.RenameLogo(owner, repo, req.Name, info.Logo); err != nil {
				writeErr(http.StatusInternalServerError, err.Error())
				return
			}

			newLogo := fmt.Sprintf("%s/%s%s", owner, req.Name, filepath.Ext(info.Logo))

			if err := database.UpdateRepositoryLogo(owner, req.Name, newLogo); err != nil {
				writeErr(http.StatusInternalServerError, err.Error())
				return
			}
		}

		repo = req.Name
	}

	if err := database.UpdateRepositoryDescription(owner, repo, req.Description); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.UpdateRepositoryWebsite(owner, repo, req.Website); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.UpdateRepositoryDefaultBranch(owner, repo, currentDefault); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success":       true,
		"name":          req.Name,
		"description":   req.Description,
		"defaultBranch": currentDefault,
	})
}

func deleteRepository(w http.ResponseWriter, r *http.Request, owner, repo string) {
	writeErr := func(status int, msg string) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   msg,
		})
	}

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		writeErr(http.StatusNotFound, "repository not found")
		return
	}

	if err := gitrepo.RemoveRepository(owner, repo, info.Logo); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	if err := database.DeleteRepository(owner, repo); err != nil {
		writeErr(http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository deleted successfully",
	})
}

func RepoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	if r.Method == http.MethodPatch {
		updateRepository(w, r, owner, repo)
		return
	}

	if r.Method == http.MethodDelete {
		deleteRepository(w, r, owner, repo)
		return
	}

	w.Header().Set("Content-Type", "application/json")

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
