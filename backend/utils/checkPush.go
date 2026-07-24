package utils

import (
	"backend/config"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
)

func CheckPush(owner, repo string) (bool, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	gitRepo, err := git.PlainOpen(repoPath)
	if err != nil {
		return false, err
	}

	_, err = gitRepo.Head()
	if err == plumbing.ErrReferenceNotFound {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return true, nil
}
