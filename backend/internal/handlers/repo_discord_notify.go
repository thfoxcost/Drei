package handlers

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/discord"
	"fmt"
)

// RepoDiscordSend delivers a repository Discord notification. It defaults to
// asynchronous delivery and is a variable (rather than a direct call) so
// tests can observe notification decisions deterministically.
var RepoDiscordSend = func(encodedURL, event string, embed discord.Embed) {
	discord.SendAsync(encodedURL, embed)
}

// repoDiscordPage builds the client URL of a PR or issue page.
func repoDiscordPage(owner, repo, kind string, number int) string {
	return fmt.Sprintf("%s/%s/%s/%s/%d", config.App.ClientURL, owner, repo, kind, number)
}

// fireRepoDiscord loads the repository Discord configuration once and, when
// the gate enables notifications for it, dispatches the embed. A missing
// configuration, a disabled gate, or a database error all silently produce
// no notification — Discord must never break the triggering operation.
func fireRepoDiscord(repoID int64, event string, gate func(*database.RepoDiscordConfig) bool, embed discord.Embed) {
	cfg, err := database.GetRepoDiscordConfig(repoID)
	if err != nil || cfg == nil || !gate(cfg) {
		return
	}

	RepoDiscordSend(cfg.EncodedURL, event, embed)
}

// notifyRepoPROpened notifies the repository channel about a newly opened
// pull request when PR notifications are enabled. The author opening their
// own PR still notifies — there is no self to skip for an opening event.
func notifyRepoPROpened(info *database.RepoInfo, actor *AuthUser, pull *database.PullRequest) {
	fireRepoDiscord(info.ID, "pr_opened", func(cfg *database.RepoDiscordConfig) bool {
		return cfg.PRNotifications
	}, discord.Embed{
		Title:       fmt.Sprintf("PR #%d opened in %s/%s", pull.Number, info.Owner, info.Name),
		Description: fmt.Sprintf("**%s** opened \"%s\"\n%s → %s", actor.Name, pull.Title, pull.SourceBranch, pull.TargetBranch),
		URL:         repoDiscordPage(info.Owner, info.Name, "pulls", pull.Number),
	})
}

// notifyRepoPRComment notifies about a new PR comment, suppressing the
// entire notification when the commenter is the PR author.
func notifyRepoPRComment(info *database.RepoInfo, actor *AuthUser, pull *database.PullRequest, body string) {
	if actor.ID == pull.Author.ID {
		return
	}

	fireRepoDiscord(info.ID, "pr_comment", func(cfg *database.RepoDiscordConfig) bool {
		return cfg.PRNotifications
	}, discord.Embed{
		Title:       fmt.Sprintf("New comment on PR #%d in %s/%s", pull.Number, info.Owner, info.Name),
		Description: fmt.Sprintf("**%s** commented on \"%s\":\n%s", actor.Name, pull.Title, discord.Truncate(body, 500)),
		URL:         repoDiscordPage(info.Owner, info.Name, "pulls", pull.Number),
	})
}

// notifyRepoPRReview notifies about a PR approval or changes-requested
// review, suppressing the notification when the reviewer is the PR author.
// (The reviews endpoint already rejects self-approvals, so the skip is
// defense in depth.)
func notifyRepoPRReview(info *database.RepoInfo, actor *AuthUser, pull *database.PullRequest, review database.PullRequestReview) {
	if actor.ID == pull.Author.ID {
		return
	}

	event := "pr_approved"
	verb := "approved"
	if review.State == "changes_requested" {
		event = "pr_changes_requested"
		verb = "requested changes on"
	}

	description := fmt.Sprintf("**%s** %s PR #%d \"%s\"", actor.Name, verb, pull.Number, pull.Title)
	if body := discord.Truncate(review.Body, 500); body != "" {
		description += "\n" + body
	}

	fireRepoDiscord(info.ID, event, func(cfg *database.RepoDiscordConfig) bool {
		return cfg.PRNotifications
	}, discord.Embed{
		Title:       fmt.Sprintf("PR #%d %s in %s/%s", pull.Number, verb, info.Owner, info.Name),
		Description: description,
		URL:         repoDiscordPage(info.Owner, info.Name, "pulls", pull.Number),
	})
}

// notifyRepoIssueOpened notifies the repository channel about a newly opened
// issue when issue notifications are enabled.
func notifyRepoIssueOpened(info *database.RepoInfo, actor *AuthUser, issue *database.Issue) {
	description := fmt.Sprintf("**%s** opened \"%s\"", actor.Name, issue.Title)
	if body := discord.Truncate(issue.Description, 500); body != "" {
		description += "\n" + body
	}

	fireRepoDiscord(info.ID, "issue_opened", func(cfg *database.RepoDiscordConfig) bool {
		return cfg.IssueNotifications
	}, discord.Embed{
		Title:       fmt.Sprintf("Issue #%d opened in %s/%s", issue.Number, info.Owner, info.Name),
		Description: description,
		URL:         repoDiscordPage(info.Owner, info.Name, "issues", issue.Number),
	})
}

// notifyRepoIssueComment notifies about a new issue comment, suppressing the
// entire notification when the commenter is the issue author.
func notifyRepoIssueComment(info *database.RepoInfo, actor *AuthUser, issue *database.Issue, body string) {
	if actor.ID == issue.Author.ID {
		return
	}

	fireRepoDiscord(info.ID, "issue_comment", func(cfg *database.RepoDiscordConfig) bool {
		return cfg.IssueNotifications
	}, discord.Embed{
		Title:       fmt.Sprintf("New comment on issue #%d in %s/%s", issue.Number, info.Owner, info.Name),
		Description: fmt.Sprintf("**%s** commented on \"%s\":\n%s", actor.Name, issue.Title, discord.Truncate(body, 500)),
		URL:         repoDiscordPage(info.Owner, info.Name, "issues", issue.Number),
	})
}

// notifyRepoContributorAdded notifies the repository channel that a user
// joined as contributor. It never consults the PR/issue toggles and never
// fires for the repository owner or for a user adding themselves.
func notifyRepoContributorAdded(info *database.RepoInfo, adder *AuthUser, added database.Contributor) {
	if adder.ID == added.ID || added.ID == "" {
		return
	}

	fireRepoDiscord(info.ID, "contributor_added", func(cfg *database.RepoDiscordConfig) bool {
		return true
	}, discord.Embed{
		Title:       fmt.Sprintf("%s joined %s/%s as contributor", added.Username, info.Owner, info.Name),
		Description: fmt.Sprintf("Added by **%s**", adder.Name),
		URL:         fmt.Sprintf("%s/%s/%s", config.App.ClientURL, info.Owner, info.Name),
	})
}
