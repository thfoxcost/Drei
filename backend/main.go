package main

import (
	"backend/apis"
	"backend/config"
	"backend/data"
	"backend/db"
	"backend/sample"
	"backend/utils"
	"backend/utils/home"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func RepoExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

func createRepo(w http.ResponseWriter, r *http.Request) {
	// CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := data.ParseRequest(r); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	userPath := filepath.Join(config.App.ReposPath, data.Current.Username)
	repoPath := filepath.Join(userPath, data.Current.Reponame+".git")

	if RepoExists(repoPath) {
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
	if err := db.CreateRepository(db.Repository{
		OwnerID:       data.Current.UserId,
		Owner:         data.Current.Username,
		Name:          data.Current.Reponame,
		Description:   data.Current.Description,
		Visibility:    data.Current.Visibility,
		Path:          repoPath,
		DefaultBranch: "main",
	}); err != nil {
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

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository created successfully",
	})
}

func createRepoFiles(userPath, repoPath string) error {
	utils.CreateReposDIR(config.App.ReposPath)
	utils.CreateUserDIR(userPath)

	if err := utils.Init(repoPath); err != nil {
		return err
	}

	if err := utils.Edit(
		repoPath,
		data.Current.Description,
		data.Current.Visibility,
		data.Current.Useremail,
		data.Current.Username,
		data.Current.UserId,
	); err != nil {
		return err
	}

	fmt.Println("[OK] Repository created:", repoPath)

	return nil
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

	repository, err := utils.GetRepo(owner, repo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(repository); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func main() {
	if err := config.Load(); err != nil {
		log.Fatal(err)
	}

	// connect to the database
	if err := db.Connect(config.App.DatabaseURL); err != nil {
		log.Fatal(err)
	}
	defer db.DB.Close()

	if err := db.Migrate(); err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/api/contribution", sample.Contribution)
	http.HandleFunc("/api/users/{owner}/repos", home.GetRepos)
	http.HandleFunc("/api/status", sample.Status)
	http.HandleFunc("/api/repos", createRepo)
	http.HandleFunc("/api/repos/{owner}/{repo}", RepoHandler)
	http.HandleFunc("/git/", apis.GitHandler)

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	log.Fatal(http.ListenAndServe(":"+config.App.Port, nil))
}
