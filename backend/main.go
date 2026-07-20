package main

import (
	"backend/data"
	"backend/utils"
	"encoding/json"
	"fmt"
	"net/http"
)

const (
	Reset  = "\033[0m"
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Blue   = "\033[34m"
	Cyan   = "\033[36m"
	White  = "\033[37m"
	Bold   = "\033[1m"
)

type Config struct {
	path       string
	username   string
	reponame   string
	decription string
	isPublic   bool
}

var AppConfig = Config{
	path: "../repos",
}

func createRepo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	println("Request Method:", r.Method)

	err := data.ParseRequest(r)
	if err != nil {
		println("ParseRequest Error:", err.Error())

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
		"message": "Repository received",
	})

}

func createRepoFiles() {
	userPath := AppConfig.path + "/" + data.Current.Username
	repoPath := userPath + "/" + data.Current.Reponame + ".git"

	fmt.Println("\033[36m[INFO]\033[0m Creating repository...")
	fmt.Println("\033[34m├── User:\033[0m", data.Current.Username)
	fmt.Println("\033[34m├── Repo:\033[0m", data.Current.Reponame)
	fmt.Println("\033[34m├── Public:\033[0m", data.Current.Visibility)
	fmt.Println("\033[34m├── User Path:\033[0m", userPath)
	fmt.Println("\033[34m└── Repo Path:\033[0m", repoPath)

	utils.CreateReposDIR(AppConfig.path)
	fmt.Println("\033[32m[OK]\033[0m Repositories directory ready")

	utils.CreateUserDIR(userPath)
	fmt.Println("\033[32m[OK]\033[0m User directory ready")

	utils.Init(repoPath)
	fmt.Println("\033[32m[OK]\033[0m Git repository initialized")
}
func main() {
	// POST http://localhost:3200/api/repos
	http.HandleFunc("/api/repos", createRepo)
	http.ListenAndServe(":3200", nil)

}
