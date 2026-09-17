package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	_ "backend/docs"

	httpSwagger "github.com/swaggo/http-swagger"
)

//	@title						Drei API
//	@version					1.0.0
//	@description				API for Drei, a self-hosted Git repository platform
//	@host						localhost:3200
//	@BasePath					/api
//	@securityDefinitions.apikey	SessionAuth
//	@in							cookie
//	@name						better-auth.session_token
//	@description				Better-auth session cookie for authenticated requests

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
	http.HandleFunc("/api/profile", handlers.ProfileHandler)
	http.HandleFunc("/api/user/account/password", handlers.AccountPasswordHandler)
	http.HandleFunc("/api/user/account", handlers.AccountHandler)
	http.HandleFunc("/api/user/appearance", handlers.AppearanceHandler)
	http.HandleFunc("/api/repos", handlers.CreateRepo)
	http.HandleFunc("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/commits/{hash}", handlers.CommitHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/forks", handlers.ForksHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/fork", handlers.ForkHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/blob/{branch}/{path...}", handlers.BlobHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/raw/{branch}/{path...}", handlers.RawHandler)
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
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/duplicate", handlers.PullDuplicateHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/compare", handlers.PullCompareHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls", handlers.PullsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/images", handlers.PullImageHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}", handlers.PullHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/close", handlers.PullCloseHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/reopen", handlers.PullReopenHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/merge", handlers.PullMergeHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/comments", handlers.PullCommentsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/comments/{commentId}", handlers.PullCommentHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/events", handlers.PullEventsHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/assignee", handlers.PRAssigneeHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/reviewers", handlers.PRReviewerHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/labels", handlers.PRLabelHandler)
	http.HandleFunc("/api/repos/{owner}/{repo}/pulls/{number}/notifications", handlers.PRNotificationsHandler)
	http.HandleFunc("/api/notifications", handlers.NotificationsHandler)
	http.HandleFunc("/api/notifications/{id}", handlers.NotificationItemHandler)
	http.HandleFunc("/api/notifications/test", handlers.NotificationTestHandler)
	http.HandleFunc("/api/notifications/send", handlers.NotificationSendHandler)
	http.HandleFunc("/git/", handlers.GitHandler)

	// Serve uploaded repo logos from <REPOS_PATH>/logos under /uploads/.
	logosDir := filepath.Join(config.App.ReposPath, "logos")
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(logosDir))))

	// Serve uploaded issue images from <REPOS_PATH>/issue-images under
	// /uploads/issue-images/. This pattern is more specific than /uploads/ so it
	// takes precedence over the logo file server.
	issueImagesDir := filepath.Join(config.App.ReposPath, "issue-images")
	http.Handle("/uploads/issue-images/", http.StripPrefix("/uploads/issue-images/", http.FileServer(http.Dir(issueImagesDir))))

	// Serve uploaded PR images from <REPOS_PATH>/pr-images under
	// /uploads/pr-images/.
	prImagesDir := filepath.Join(config.App.ReposPath, "pr-images")
	http.Handle("/uploads/pr-images/", http.StripPrefix("/uploads/pr-images/", http.FileServer(http.Dir(prImagesDir))))

	// Swagger UI
	http.Handle("/swagger/", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	fmt.Printf("[OK] Server listening on :%s\n", config.App.Port)

	log.Fatal(http.ListenAndServe(":"+config.App.Port, nil))
}
