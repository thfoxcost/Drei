package utils

import (
	"backend/config"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
)

func GetBranches(owner, repo string) ([]string, string, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, "", err
	}

	head, err := r.Head()
	if err != nil {
		return nil, "", err
	}

	defaultBranch := head.Name().Short()

	var branches []string

	iter, err := r.Branches()
	if err != nil {
		return nil, "", err
	}

	err = iter.ForEach(func(ref *plumbing.Reference) error {
		branches = append(branches, ref.Name().Short())
		return nil
	})
	if err != nil {
		return nil, "", err
	}

	return branches, defaultBranch, nil
}
