package main

import (
	"backend/apis"
	"backend/config"
	"backend/data"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

func RepoExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
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

	fmt.Println("Request Method:", r.Method)

	// Parse request
	if err := data.ParseRequest(r); err != nil {
		fmt.Println("ParseRequest Error:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Build paths
	userPath := filepath.Join(config.App.ReposPath, data.Current.Username)
	repoPath := filepath.Join(userPath, data.Current.Reponame+".git")

	// Check if repository already exists
	if RepoExists(repoPath) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"message": "Repository already exists",
		})
		return
	}

	// Create repository
	if err := createRepoFiles(userPath, repoPath); err != nil {
		fmt.Println("CreateRepo Error:", err)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)

		json.NewEncoder(w).Encode(map[string]any{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	// Success
	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository created successfully",
	})
}

func createRepoFiles(userPath, repoPath string) error {
	// Create directories
	utils.CreateReposDIR(config.App.ReposPath)
	utils.CreateUserDIR(userPath)

	// Initialize bare repository
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

func main() {
	if err := config.Load(); err != nil {
		panic(err)
	}

	http.HandleFunc("/api/repos", createRepo)
	http.HandleFunc("/git/", apis.GitHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}", utils.CheckPush)

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	if err := http.ListenAndServe(":"+config.App.Port, nil); err != nil {
		panic(err)
	}
}
