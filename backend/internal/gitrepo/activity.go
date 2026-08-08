package gitrepo

import (
	"backend/internal/config"
	"path/filepath"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// CommitDay is the number of commits authored on a single calendar day.
type CommitDay struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// GetCommitActivity walks the repository history and returns the number of
// commits per day. Every day from the first commit through today is
// represented, including days with zero commits.
func GetCommitActivity(owner, repo string) ([]CommitDay, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	head, err := r.Head()
	if err != nil {
		return nil, err
	}

	commitIter, err := r.Log(&git.LogOptions{
		From: head.Hash(),
	})
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int)
	var first time.Time

	err = commitIter.ForEach(func(commit *object.Commit) error {
		day := commit.Author.When.UTC().Truncate(24 * time.Hour)
		key := day.Format("2006-01-02")
		counts[key]++
		if first.IsZero() || day.Before(first) {
			first = day
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// No commits reachable from HEAD.
	if first.IsZero() {
		return []CommitDay{}, nil
	}

	var activity []CommitDay
	today := time.Now().UTC().Truncate(24 * time.Hour)
	for day := first; !day.After(today); day = day.Add(24 * time.Hour) {
		key := day.Format("2006-01-02")
		activity = append(activity, CommitDay{
			Date:  key,
			Count: counts[key],
		})
	}

	return activity, nil
}
