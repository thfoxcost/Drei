package gitrepo

import (
	"backend/internal/config"
	"backend/internal/database"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

type CommitInfo struct {
	Hash    string `json:"hash"`
	Message string `json:"message"`
	Author  string `json:"author"`
	Date    string `json:"date"`
}

// resolveAuthorName returns the registered Drei username for the commit
// author's email address when one exists, falling back to the name stored in
// the git commit. Git author names are free-form and often stale (e.g. from
// an old git config), while the email is what identifies the account.
func resolveAuthorName(name, email string, usernames map[string]string) string {
	if username := usernames[strings.ToLower(strings.TrimSpace(email))]; username != "" {
		return username
	}

	return name
}

// authorEmails returns the unique, non-empty author emails across the commits.
func authorEmails(commits []rawCommit) []string {
	seen := make(map[string]bool)
	var emails []string

	for _, c := range commits {
		email := strings.TrimSpace(c.email)

		if email == "" || seen[strings.ToLower(email)] {
			continue
		}

		seen[strings.ToLower(email)] = true
		emails = append(emails, email)
	}

	return emails
}

// rawCommit is the commit data collected before author resolution.
type rawCommit struct {
	hash    string
	message string
	name    string
	email   string
	when    time.Time
}

// GetCommits walks the repository history and returns the commits reachable
// from the given branch, newest first, plus the head commit. Commit authors
// are resolved against registered Drei users by email so a stale git author
// name is replaced with the account username when possible.
func GetCommits(owner, repo, branch string) ([]CommitInfo, CommitInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commit, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commitIter, err := r.Log(&git.LogOptions{
		From: commit.Hash,
	})
	if err != nil {
		return nil, CommitInfo{}, err
	}

	var raw []rawCommit

	err = commitIter.ForEach(func(c *object.Commit) error {
		raw = append(raw, rawCommit{
			hash:    c.Hash.String(),
			message: c.Message,
			name:    c.Author.Name,
			email:   c.Author.Email,
			when:    c.Author.When,
		})

		return nil
	})
	if err != nil {
		return nil, CommitInfo{}, err
	}

	usernames, err := database.ResolveUsernamesByEmails(authorEmails(raw))
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commits := make([]CommitInfo, 0, len(raw))

	for _, c := range raw {
		commits = append(commits, CommitInfo{
			Hash:    c.hash,
			Message: c.message,
			Author:  resolveAuthorName(c.name, c.email, usernames),
			Date:    c.when.String(),
		})
	}

	var lastCommit CommitInfo

	if len(raw) > 0 {
		last := raw[0]

		lastCommit = CommitInfo{
			Hash:    last.hash,
			Message: last.message,
			Author:  resolveAuthorName(last.name, last.email, usernames),
			Date:    last.when.Format(time.RFC3339),
		}
	}

	return commits, lastCommit, nil
}
