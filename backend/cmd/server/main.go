package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"fmt"
	"log"
	"net/http"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatal(err)
	}

	// connect to the database
	if err := database.Connect(config.App.DatabaseURL); err != nil {
		log.Fatal(err)
	}
	defer database.DB.Close()

	if err := database.Migrate(); err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/api/contribution", handlers.Contribution)
	http.HandleFunc("/api/users/{owner}/repos", handlers.GetRepos)
	http.HandleFunc("/api/status", handlers.Status)
	http.HandleFunc("/api/repos", handlers.CreateRepo)
	http.HandleFunc("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	http.HandleFunc("/git/", handlers.GitHandler)

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	log.Fatal(http.ListenAndServe(":"+config.App.Port, nil))
}
