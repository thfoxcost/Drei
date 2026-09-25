package gitrepo

import (
	"backend/internal/config"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// CountUserCommitsByDay walks the history reachable from the repository's
// default branch and counts commits authored by the user inside [start, end).
// Attribution matches the account email first (case-insensitive) and falls
// back to the git author name matching the username, since local git configs
// often predate the account. Repositories without reachable commits yield an
// empty map and no error so one empty repo never fails an aggregation.
func CountUserCommitsByDay(owner, repo, username, email string, start, end time.Time) (map[string]int, error) {
	counts := map[string]int{}

	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return counts, nil
	}

	head, err := ResolveBranch(r, "")
	if err != nil {
		return counts, nil
	}

	commitIter, err := r.Log(&git.LogOptions{From: head.Hash})
	if err != nil {
		return counts, nil
	}

	wantEmail := strings.ToLower(strings.TrimSpace(email))
	wantName := strings.ToLower(strings.TrimSpace(username))

	err = commitIter.ForEach(func(commit *object.Commit) error {
		when := commit.Author.When.UTC()
		if when.Before(start) || !when.Before(end) {
			return nil
		}

		authorEmail := strings.ToLower(strings.TrimSpace(commit.Author.Email))
		authorName := strings.ToLower(strings.TrimSpace(commit.Author.Name))

		matches := wantEmail != "" && authorEmail == wantEmail
		if !matches && wantName != "" && authorName == wantName {
			matches = true
		}

		if matches {
			counts[when.Format("2006-01-02")]++
		}

		return nil
	})
	if err != nil {
		return counts, nil
	}

	return counts, nil
}
