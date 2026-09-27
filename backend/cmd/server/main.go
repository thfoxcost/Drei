package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/sysinfo"
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

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

// uploadFileServer serves files from dir but refuses directory requests, so a
// stored image cannot be discovered by walking the upload tree.
//
// The caller wraps this in http.StripPrefix, which leaves the path empty for a
// request to the mount point itself, so an empty path counts as a directory
// request too.
func uploadFileServer(dir string) http.Handler {
	files := http.FileServer(http.Dir(dir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "" || strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}

		files.ServeHTTP(w, r)
	})
}

// handle registers handler on the default mux behind the route-parameter
// validation and repository-view wrappers.
//
// Both wrappers are applied per handler rather than to the whole mux because
// net/http only populates r.PathValue once the mux has matched a pattern, so a
// middleware in front of the mux would always see empty values.
//
// Order matters: PathValidation rejects hostile parameters before
// RepositoryView spends a database query on them.
func handle(pattern string, handler http.HandlerFunc) {
	http.Handle(pattern, handlers.PathValidation(handlers.RepositoryView(handler)))
}

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

	// Sample host and process metrics in the background so that /api/status
	// handlers only ever read the latest snapshot. The context is never
	// cancelled: the sampler holds nothing that must outlive the process, and
	// trapping signals here would stop SIGTERM from terminating the server.
	go sysinfo.Run(context.Background(), sysinfo.DefaultInterval)

	handle("/api/users/{username}/contributions", handlers.UserContributionsHandler)
	handle("/api/activity", handlers.ActivityHandler)
	handle("/api/users", handlers.UsersHandler)
	handle("/api/users/{owner}/repos", handlers.GetRepos)
	handle("/api/issues", handlers.AllIssuesHandler)
	handle("/api/pulls", handlers.AllPullsHandler)
	handle("/api/status", handlers.Status)
	handle("/api/profile", handlers.ProfileHandler)
	handle("/api/user/account/password", handlers.AccountPasswordHandler)
	handle("/api/user/account", handlers.AccountHandler)
	handle("/api/user/appearance", handlers.AppearanceHandler)
	handle("/api/repos", handlers.CreateRepo)
	handle("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	handle("/api/repos/{owner}/{repo}/branches/{branch...}", handlers.BranchHandler)
	handle("/api/repos/{owner}/{repo}/tags/{tag...}", handlers.TagHandler)
	handle("/api/repos/{owner}/{repo}/tags", handlers.TagsHandler)
	handle("/api/repos/{owner}/{repo}/commits/{hash}", handlers.CommitHandler)
	handle("/api/repos/{owner}/{repo}/insights/pulse", handlers.PulseHandler)
	handle("/api/repos/{owner}/{repo}/insights/contributors", handlers.ContributorsInsightHandler)
	handle("/api/repos/{owner}/{repo}/insights/code-frequency", handlers.CodeFrequencyHandler)
	handle("/api/repos/{owner}/{repo}/forks", handlers.ForksHandler)
	handle("/api/repos/{owner}/{repo}/fork", handlers.ForkHandler)
	handle("/api/repos/{owner}/{repo}/blob/{branch}/{path...}", handlers.BlobHandler)
	handle("/api/repos/{owner}/{repo}/raw/{branch}/{path...}", handlers.RawHandler)
	handle("/api/repos/{owner}/{repo}/archive", handlers.ArchiveHandler)
	handle("/api/repos/{owner}/{repo}/backup/status", handlers.BackupStatusHandler)
	handle("/api/repos/{owner}/{repo}/backup/run", handlers.BackupRunHandler)
	handle("/api/repos/{owner}/{repo}/backup", handlers.BackupToggleHandler)
	handle("/api/repos/{owner}/{repo}/download", handlers.DownloadHandler)
	handle("/api/repos/{owner}/{repo}/visibility", handlers.VisibilityHandler)
	handle("/api/repos/{owner}/{repo}/logo", handlers.LogoHandler)
	handle("/api/repos/{owner}/{repo}/collaborators", handlers.CollaboratorsHandler)
	handle("/api/repos/{owner}/{repo}/issues", handlers.IssuesHandler)
	handle("/api/repos/{owner}/{repo}/issues/images", handlers.IssueImageHandler)
	handle("/api/repos/{owner}/{repo}/issues/{number}", handlers.IssueHandler)
	handle("/api/repos/{owner}/{repo}/issues/{number}/state", handlers.IssueStateHandler)
	handle("/api/repos/{owner}/{repo}/issues/{number}/assignee", handlers.IssueAssigneeHandler)
	handle("/api/repos/{owner}/{repo}/issues/{number}/comments", handlers.IssueCommentsHandler)
	handle("/api/repos/{owner}/{repo}/issues/{number}/comments/{commentId}", handlers.IssueCommentHandler)
	handle("/api/repos/{owner}/{repo}/labels", handlers.IssueLabelsHandler)
	handle("/api/repos/{owner}/{repo}/labels/{labelId}", handlers.IssueLabelHandler)
	handle("/api/repos/{owner}/{repo}/pulls/duplicate", handlers.PullDuplicateHandler)
	handle("/api/repos/{owner}/{repo}/pulls/compare/commits", handlers.PullCompareCommitsHandler)
	handle("/api/repos/{owner}/{repo}/pulls/compare", handlers.PullCompareHandler)
	handle("/api/repos/{owner}/{repo}/pulls", handlers.PullsHandler)
	handle("/api/repos/{owner}/{repo}/pulls/images", handlers.PullImageHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}", handlers.PullHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/close", handlers.PullCloseHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/reopen", handlers.PullReopenHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/merge", handlers.PullMergeHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/revert", handlers.PullRevertHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/mergeability", handlers.PullMergeabilityHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/source-branch", handlers.PullDeleteSourceBranchHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/comments", handlers.PullCommentsHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/comments/{commentId}", handlers.PullCommentHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/reviews", handlers.PullReviewsHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/reviews/{reviewId}", handlers.PullReviewHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/events", handlers.PullEventsHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/assignee", handlers.PRAssigneeHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/reviewers", handlers.PRReviewerHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/labels", handlers.PRLabelHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/files", handlers.PullFilesHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/viewed", handlers.PullViewedFilesHandler)
	handle("/api/repos/{owner}/{repo}/pulls/{number}/notifications", handlers.PRNotificationsHandler)
	handle("/api/orgs", handlers.OrganizationsHandler)
	handle("/api/orgs/{slug}", handlers.GetOrganizationHandler)
	handle("/api/orgs/{slug}/repos", handlers.OrganizationReposHandler)
	handle("/api/orgs/{slug}/languages", handlers.GetOrganizationLanguagesHandler)
	handle("/api/orgs/{slug}/members", handlers.GetOrganizationMembersHandler)
	handle("/api/orgs/{slug}/join", handlers.JoinOrganizationHandler)
	handle("/api/orgs/{slug}/leave", handlers.LeaveOrganizationHandler)
	handle("/api/orgs/{slug}/avatar", handlers.OrganizationAvatarHandler)
	handle("/api/notifications", handlers.NotificationsHandler)
	handle("/api/notifications/{id}", handlers.NotificationItemHandler)
	handle("/api/notifications/test", handlers.NotificationTestHandler)
	handle("/api/notifications/send", handlers.NotificationSendHandler)
	handle("/git/", handlers.GitHandler)

	// Uploaded images are served from disk. http.FileServer renders a
	// directory index for any path ending in "/", which published every issue
	// and pull request image belonging to a private repository to anyone who
	// requested the directory. uploadFileServer serves exact file paths only.
	//
	// The remaining protection for a private repository's images is the random
	// component of the stored filename, which is unguessable but not
	// access-controlled. Gating these on repository visibility would require
	// resolving the <owner>/<repo> path segment against the database on every
	// image request; that is left as a follow-up.
	logosDir := filepath.Join(config.App.ReposPath, "logos")
	http.Handle("/uploads/", http.StripPrefix("/uploads/", uploadFileServer(logosDir)))

	// Serve uploaded issue images from <REPOS_PATH>/issue-images under
	// /uploads/issue-images/. This pattern is more specific than /uploads/ so it
	// takes precedence over the logo file server.
	issueImagesDir := filepath.Join(config.App.ReposPath, "issue-images")
	http.Handle("/uploads/issue-images/", http.StripPrefix("/uploads/issue-images/", uploadFileServer(issueImagesDir)))

	// Serve uploaded PR images from <REPOS_PATH>/pr-images under
	// /uploads/pr-images/.
	prImagesDir := filepath.Join(config.App.ReposPath, "pr-images")
	http.Handle("/uploads/pr-images/", http.StripPrefix("/uploads/pr-images/", uploadFileServer(prImagesDir)))

	// Serve uploaded organization avatars from <REPOS_PATH>/orgs under /uploads/orgs/.
	orgAvatarsDir := filepath.Join(config.App.ReposPath, "orgs")
	http.Handle("/uploads/orgs/", http.StripPrefix("/uploads/orgs/", uploadFileServer(orgAvatarsDir)))

	// Swagger UI
	http.Handle("/swagger/", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	fmt.Printf("[OK] Server listening on %s:%s\n", config.App.BindAddr, config.App.Port)

	// handlers.GitHandler trusts the proxyUserHeader to mean "the reverse
	// proxy already authenticated this request". That is only sound while the
	// listener is unreachable from off-host, because a directly reachable
	// server would let any client set the header itself.
	if ip := net.ParseIP(config.App.BindAddr); ip == nil || !ip.IsLoopback() {
		log.Printf(
			"[WARN] BIND_ADDR=%s is not a loopback address. The /git/ handler trusts "+
				"the %s header, which a remote client can forge once this port is reachable. "+
				"Put the server behind a reverse proxy and keep it on 127.0.0.1, or remove that trust.",
			config.App.BindAddr, "X-Drei-Git-User",
		)
	}

	if err := serve(); err != nil {
		log.Fatal(err)
	}
}

// serve runs the HTTP listener until the process is asked to stop, then drains
// in-flight requests before returning.
//
// Read/Write timeouts are intentionally left unset. Git's smart HTTP protocol
// streams multi-megabyte packfiles in both directions, and any whole-request
// deadline would abort large clones and pushes part-way through. The header
// phase - the actual Slowloris surface - is bounded by ReadHeaderTimeout, and
// the listener is bound to loopback so nothing untrusted reaches this server
// directly.
func serve() error {
	srv := &http.Server{
		Addr:              net.JoinHostPort(config.App.BindAddr, config.App.Port),
		Handler:           http.DefaultServeMux,
		ReadHeaderTimeout: 15 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    1 << 20,
		ErrorLog:          log.Default(),
	}

	// Stop accepting new connections on SIGINT/SIGTERM and let active
	// requests finish. signal.NotifyContext suppresses the default
	// terminate behaviour, so the exit path is entirely under our control.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errc := make(chan error, 1)

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errc <- err

			return
		}

		errc <- nil
	}()

	select {
	case err := <-errc:
		return err
	case <-ctx.Done():
		stop()

		log.Println("[OK] Shutting down, draining in-flight requests")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("graceful shutdown: %w", err)
		}

		// Shutdown already reported the listener error via errc if there was
		// one; wait for it so the goroutine does not outlive serve.
		<-errc

		return nil
	}
}
