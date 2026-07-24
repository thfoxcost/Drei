package utils

import (
	"fmt"
)

type RepoResponse struct {
	Owner         string       `json:"owner"`
	Email         string       `json:"email"`
	Description   string       `json:"description"`
	Visibility    bool         `json:"visibility"`
	HasCommits    bool         `json:"hasCommits"`
	Created       string       `json:"created"`
	Langs         []string     `json:"langs"`
	Branches      []string     `json:"branches"`
	DefaultBranch string       `json:"defaultBranch"`
	Tags          []string     `json:"tags"`
	CloneURL      string       `json:"cloneUrl"`
	Commits       []CommitInfo `json:"commits"`
	LastCommit    CommitInfo   `json:"lastCommit"`
	Files         []FileInfo   `json:"files"`
	Size          int64        `json:"size"`
	Contributors  []string     `json:"contributors"`
}

func GetRepo(owner, repo string) (*RepoResponse, error) {

	cloneURL := fmt.Sprintf("https://localhost:3200/git/%s/%s.git", owner, repo)

	info, err := GetRepoMetadata(owner, repo)
	if err != nil {
		return nil, err
	}

	hasCommits, err := CheckPush(owner, repo)
	if err != nil {
		return nil, err
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

	lastCommitInfo := CommitInfo{
		Hash:    lastCommit.Hash.String(),
		Message: lastCommit.Message,
		Author:  lastCommit.Author.Name,
		Date:    lastCommit.Author.When.String(),
	}

	files, err := GetFiles(owner, repo)

	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	Reposize, err := CalcRepoSize(owner, repo)
	if err != nil {
		return nil, err
	}

	contributors, err := GetContributors(owner, repo)
	if err != nil {
		return nil, err
	}

	return &RepoResponse{
		Owner:         info.Name,
		Email:         info.Email,
		Description:   info.Description,
		Visibility:    info.Visibility,
		HasCommits:    hasCommits,
		Created:       info.Created,
		Langs:         langs,
		Branches:      branches,
		DefaultBranch: defaultBranch,
		Tags:          tags,
		CloneURL:      cloneURL,
		Commits:       commits,
		LastCommit:    lastCommitInfo,
		Files:         files,
		Size:          Reposize,
		Contributors:  contributors,
	}, nil
}
