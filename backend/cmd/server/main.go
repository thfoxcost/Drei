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
	http.HandleFunc("/api/users", handlers.UsersHandler)
	http.HandleFunc("/api/users/{owner}/repos", handlers.GetRepos)
	http.HandleFunc("/api/issues", handlers.AllIssuesHandler)
	http.HandleFunc("/api/status", handlers.Status)
	http.HandleFunc("/api/repos", handlers.CreateRepo)
	http.HandleFunc("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/archive", handlers.ArchiveHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/download", handlers.DownloadHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/visibility", handlers.VisibilityHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/logo", handlers.LogoHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/collaborators", handlers.CollaboratorsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues", handlers.IssuesHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/images", handlers.IssueImageHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/{number}", handlers.IssueHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/{number}/state", handlers.IssueStateHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/{number}/assignee", handlers.IssueAssigneeHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/{number}/comments", handlers.IssueCommentsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/issues/{number}/comments/{commentId}", handlers.IssueCommentHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/labels", handlers.IssueLabelsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/labels/{labelId}", handlers.IssueLabelHandler)
	http.HandleFunc("/git/", handlers.GitHandler)

	// Serve uploaded repo logos from <REPOS_PATH>/logos under /uploads/.
	logosDir := filepath.Join(config.App.ReposPath, "logos")
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(logosDir))))

	// Serve uploaded issue images from <REPOS_PATH>/issue-images under
	// /uploads/issue-images/. This pattern is more specific than /uploads/ so it
	// takes precedence over the logo file server.
	issueImagesDir := filepath.Join(config.App.ReposPath, "issue-images")
	http.Handle("/uploads/issue-images/", http.StripPrefix("/uploads/issue-images/", http.FileServer(http.Dir(issueImagesDir))))

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	log.Fatal(http.ListenAndServe(":"+config.App.Port, nil))
}
