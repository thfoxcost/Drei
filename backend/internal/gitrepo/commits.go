package gitrepo

import (
	"backend/internal/config"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

type CommitInfo struct {
	Hash    string `json:"hash"`
	Message string `json:"message"`
	Author  string `json:"author"`
	Date    string `json:"date"`
}

func GetCommits(owner, repo, branch string) ([]CommitInfo, *object.Commit, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, nil, err
	}

	commit, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, nil, err
	}

	lastCommit := commit

	commitIter, err := r.Log(&git.LogOptions{
		From: commit.Hash,
	})
	if err != nil {
		return nil, nil, err
	}

	var commits []CommitInfo

	err = commitIter.ForEach(func(commit *object.Commit) error {
		commits = append(commits, CommitInfo{
			Hash:    commit.Hash.String(),
			Message: commit.Message,
			Author:  commit.Author.Name,
			Date:    commit.Author.When.String(),
		})

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return commits, lastCommit, nil
}
