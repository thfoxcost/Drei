package main

import (
	"backend/apis"
	"backend/config"
	"backend/data"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
)

func createRepo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	fmt.Println("Request Method:", r.Method)

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

	createRepoFiles()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository created successfully",
	})
}

func createRepoFiles() {
	userPath := filepath.Join(config.App.ReposPath, data.Current.Username)
	repoPath := filepath.Join(userPath, data.Current.Reponame+".git")

	utils.CreateReposDIR(config.App.ReposPath)

	utils.CreateUserDIR(userPath)

	utils.Init(repoPath)
}

func main() {
	if err := config.Load(); err != nil {
		panic(err)
	}

	http.HandleFunc("/api/repos", createRepo)
	http.HandleFunc("/git/", apis.GitHandler)

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	if err := http.ListenAndServe(":"+config.App.Port, nil); err != nil {
		panic(err)
	}
}
