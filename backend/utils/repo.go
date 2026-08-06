package utils

import (
	"backend/db"
	"fmt"
	"time"
)

type RepoResponse struct {
	Name          string           `json:"name"`
	Owner         string           `json:"owner"`
	Description   string           `json:"description"`
	Visibility    bool             `json:"visibility"`
	HasCommits    bool             `json:"hasCommits"`
	Created       string           `json:"created"`
	Langs         []Language       `json:"langs"`
	Branches      []string         `json:"branches"`
	DefaultBranch string           `json:"defaultBranch"`
	Tags          []string         `json:"tags"`
	CloneURL      string           `json:"cloneUrl"`
	Commits       []CommitInfo     `json:"commits"`
	LastCommit    CommitInfo       `json:"lastCommit"`
	Files         []FileInfo       `json:"files"`
	Size          int64            `json:"size"`
	Contributors  []db.Contributor `json:"contributors"`
}

func GetRepo(owner, repo string) (*RepoResponse, error) {
	cloneURL := fmt.Sprintf("https://localhost:3200/git/%s/%s.git", owner, repo)

	info, err := db.GetRepository(owner, repo)
	if err != nil {
		return nil, err
	}

	hasCommits, err := CheckPush(owner, repo)
	if err != nil {
		return nil, err
	}

	// Empty repository
	if !hasCommits {
		contributors, err := db.GetContributors(info.ID)
		if err != nil {
			return nil, err
		}

		return &RepoResponse{
			Name:          info.Name,
			Owner:         info.Owner,
			Description:   info.Description,
			Visibility:    info.Visibility,
			HasCommits:    false,
			Created:       info.CreatedAt.Format(time.RFC3339),
			DefaultBranch: "main",
			CloneURL:      cloneURL,
			Langs:         []Language{},
			Branches:      []string{},
			Tags:          []string{},
			Commits:       []CommitInfo{},
			LastCommit:    CommitInfo{},
			Files:         []FileInfo{},
			Size:          0,
			Contributors:  contributors,
		}, nil
	}

	langs, err := GetLang(owner, repo)
	if err != nil {
		return nil, err
	}

	branches, defaultBranch, err := GetBranches(owner, repo)
	if err != nil {
		return nil, err
	}

	tags, err := GetTags(owner, repo)
	if err != nil {
		return nil, err
	}

	commits, lastCommit, err := GetCommits(owner, repo)
	if err != nil {
		return nil, err
	}

	files, err := GetFiles(owner, repo)
	if err != nil {
		return nil, err
	}

	repoSize, err := CalcRepoSize(owner, repo)
	if err != nil {
		return nil, err
	}

	commitAuthors, err := GetCommitAuthors(owner, repo)
	if err != nil {
		return nil, err
	}

	// Persist commit-derived authors so the database remains the source of
	// truth for contributors, then read the deduplicated list back.
	if err := db.SyncContributors(info.ID, commitAuthors); err != nil {
		return nil, err
	}

	contributors, err := db.GetContributors(info.ID)
	if err != nil {
		return nil, err
	}

	return &RepoResponse{
		Name:          info.Name,
		Owner:         info.Owner,
		Description:   info.Description,
		Visibility:    info.Visibility,
		HasCommits:    true,
		Created:       info.CreatedAt.Format(time.RFC3339),
		Langs:         langs,
		Branches:      branches,
		DefaultBranch: defaultBranch,
		Tags:          tags,
		CloneURL:      cloneURL,
		Commits:       commits,
		LastCommit: CommitInfo{
			Hash:    lastCommit.Hash.String(),
			Message: lastCommit.Message,
			Author:  lastCommit.Author.Name,
			Date:    lastCommit.Author.When.Format(time.RFC3339),
		},
		Files:        files,
		Size:         repoSize,
		Contributors: contributors,
	}, nil
}
