package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
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
	http.HandleFunc("/api/repos/{owner}/{repo}/archive", handlers.ArchiveHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/visibility", handlers.VisibilityHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/logo", handlers.LogoHandler)
	http.HandleFunc("/git/", handlers.GitHandler)

	// Serve uploaded repo logos from <REPOS_PATH>/logos under /uploads/.
	logosDir := filepath.Join(config.App.ReposPath, "logos")
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(logosDir))))

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	log.Fatal(http.ListenAndServe(":"+config.App.Port, nil))
}
