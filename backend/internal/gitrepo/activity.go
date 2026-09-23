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

// DefaultActivityWeeks is the default window for bounded activity queries.
const DefaultActivityWeeks = 16

// GetCommitActivityWindow returns per-week commit counts for the last
// <weeks> weeks (oldest first). Unlike GetCommitActivity the output is
// bounded, making it cheap enough to fan out across repository lists for
// sparklines. Repositories without reachable commits yield all zeros.
func GetCommitActivityWindow(owner, repo, branch string, weeks int) ([]int, error) {
	if weeks <= 0 {
		weeks = DefaultActivityWeeks
	}

	zeros := make([]int, weeks)

	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return zeros, nil
	}

	commit, err := ResolveBranch(r, branch)
	if err != nil {
		return zeros, nil
	}

	commitIter, err := r.Log(&git.LogOptions{
		From: commit.Hash,
	})
	if err != nil {
		return zeros, nil
	}

	now := time.Now().UTC()
	week := 7 * 24 * time.Hour

	err = commitIter.ForEach(func(commit *object.Commit) error {
		age := now.Sub(commit.Author.When.UTC())
		if age < 0 {
			age = 0
		}
		index := weeks - 1 - int(age/week)
		if index >= 0 && index < weeks {
			zeros[index]++
		}
		return nil
	})
	if err != nil {
		return zeros, nil
	}

	return zeros, nil
}

// GetCommitActivity walks the repository history and returns the number of
// commits per day. Every day from the first commit through today is
// represented, including days with zero commits.
func GetCommitActivity(owner, repo, branch string) ([]CommitDay, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	commit, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, err
	}

	commitIter, err := r.Log(&git.LogOptions{
		From: commit.Hash,
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
