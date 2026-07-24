package utils

import (
	"path/filepath"
	"strconv"

	"backend/config"

	"github.com/go-git/go-git/v6"
)

type RepoInfo struct {
	ID          string
	Name        string
	Email       string
	Description string
	Visibility  bool
	Created     string
}

func GetRepoMetadata(owner, repo string) (*RepoInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	cfg, err := r.Config()
	if err != nil {
		return nil, err
	}

	section := cfg.Raw.Section("Drei")

	visibility, err := strconv.ParseBool(section.Option("visibility"))
	if err != nil {
		visibility = false
	}

	return &RepoInfo{
		ID:          section.Option("id"),
		Name:        section.Option("name"),
		Email:       section.Option("email"),
		Description: section.Option("description"),
		Visibility:  visibility,
		Created:     section.Option("created"),
	}, nil
}
