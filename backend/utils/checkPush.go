package utils

import (
	"backend/config"
	"encoding/json"
	"net/http"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
)

type RepoResponse struct {
	HasCommits bool `json:"hasCommits"`
}

func CheckPush(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	owner := r.PathValue("owner")
	repo := r.PathValue("repo")

	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	gitRepo, err := git.PlainOpen(repoPath)
	if err != nil {
		http.Error(w, "Repository not found", http.StatusNotFound)
		return
	}

	hasCommits := true

	_, err = gitRepo.Head()
	if err == plumbing.ErrReferenceNotFound {
		hasCommits = false
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(RepoResponse{
		HasCommits: hasCommits,
	})
}
