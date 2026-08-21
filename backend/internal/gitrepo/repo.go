package gitrepo

import (
	"backend/internal/database"
	"fmt"
	"time"
)

type RepoResponse struct {
	Name              string                 `json:"name"`
	Owner             string                 `json:"owner"`
	OwnerID           string                 `json:"ownerId"`
	Description       string                 `json:"description"`
	Visibility        bool                   `json:"visibility"`
	Logo              string                 `json:"logo"`
	Website           string                 `json:"website"`
	Archived          bool                   `json:"archived"`
	ArchivedAt        string                 `json:"archivedAt"`
	HasCommits        bool                   `json:"hasCommits"`
	Created           string                 `json:"created"`
	Langs             []Language             `json:"langs"`
	Branches          []string               `json:"branches"`
	DefaultBranch     string                 `json:"defaultBranch"`
	Tags              []string               `json:"tags"`
	CloneURL          string                 `json:"cloneUrl"`
	Commits           []CommitInfo           `json:"commits"`
	CommitActivity    []CommitDay            `json:"commitActivity"`
	LastCommit        CommitInfo             `json:"lastCommit"`
	Files             []FileInfo             `json:"files"`
	Size              int64                  `json:"size"`
	Contributors      []database.Contributor `json:"contributors"`
	IssueCount        int                    `json:"issueCount"`
	IsFork            bool                   `json:"isFork"`
	ForkedFromOwner   string                 `json:"forkedFromOwner"`
	ForkedFromName    string                 `json:"forkedFromName"`
}

// logoURL builds the public URL for a stored logo path. The stored value is
// relative to the logos directory; empty logos produce an empty URL.
func logoURL(logo string) string {
	if logo == "" {
		return ""
	}

	return fmt.Sprintf("http://localhost:3200/uploads/%s", logo)
}

// archivedAtString formats the archived timestamp for the API response,
// returning an empty string when the repository has never been archived.
func archivedAtString(archivedAt *time.Time) string {
	if archivedAt == nil {
		return ""
	}
	return archivedAt.Format(time.RFC3339)
}

func GetRepo(owner, repo, branch string) (*RepoResponse, error) {
	cloneURL := fmt.Sprintf("http://localhost:3200/git/%s/%s.git", owner, repo)

	info, err := database.GetRepository(owner, repo)
	if err != nil {
		return nil, err
	}

	openIssues, closedIssues, err := database.CountIssues(info.ID, database.IssueFilter{})
	if err != nil {
		return nil, err
	}

	issueCount := openIssues + closedIssues

	hasCommits, err := CheckPush(owner, repo)
	if err != nil {
		return nil, err
	}

	// Empty repository
	if !hasCommits {
		contributors, err := database.GetContributors(info.ID)
		if err != nil {
			return nil, err
		}

		return &RepoResponse{
			Name:            info.Name,
			Owner:           info.Owner,
			OwnerID:         info.OwnerID,
			Description:     info.Description,
			Visibility:      info.Visibility,
			Logo:            logoURL(info.Logo),
			Website:         info.Website,
			Archived:        info.Archived,
			ArchivedAt:      archivedAtString(info.ArchivedAt),
			HasCommits:      false,
			Created:         info.CreatedAt.Format(time.RFC3339),
			DefaultBranch:   "main",
			CloneURL:        cloneURL,
			Langs:           []Language{},
			Branches:        []string{},
			Tags:            []string{},
			Commits:         []CommitInfo{},
			CommitActivity:  []CommitDay{},
			LastCommit:      CommitInfo{},
			Files:           []FileInfo{},
			Size:            0,
			Contributors:    contributors,
			IssueCount:      issueCount,
			IsFork:          info.ForkedFromID != nil,
			ForkedFromOwner: info.ForkedFromOwner,
			ForkedFromName:  info.ForkedFromName,
		}, nil
	}

	langs, err := GetLang(owner, repo, branch)
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

	commits, lastCommit, err := GetCommits(owner, repo, branch)
	if err != nil {
		return nil, err
	}

	commitActivity, err := GetCommitActivity(owner, repo, branch)
	if err != nil {
		return nil, err
	}

	files, err := GetFiles(owner, repo, branch)
	if err != nil {
		return nil, err
	}

	repoSize, err := CalcRepoSize(owner, repo, branch)
	if err != nil {
		return nil, err
	}

	commitAuthors, err := GetCommitAuthors(owner, repo, branch)
	if err != nil {
		return nil, err
	}

	// When someone contributes, add any newly discovered registered users to
	// the contributors table. Already-stored contributors are never changed,
	// and the API response below is read straight from the database.
	if err := database.SyncContributors(info.ID, commitAuthors); err != nil {
		return nil, err
	}

	contributors, err := database.GetContributors(info.ID)
	if err != nil {
		return nil, err
	}

	return &RepoResponse{
		Name:            info.Name,
		Owner:           info.Owner,
		OwnerID:         info.OwnerID,
		Description:     info.Description,
		Visibility:      info.Visibility,
		Logo:            logoURL(info.Logo),
		Website:         info.Website,
		Archived:        info.Archived,
		ArchivedAt:      archivedAtString(info.ArchivedAt),
		HasCommits:      true,
		Created:         info.CreatedAt.Format(time.RFC3339),
		Langs:           langs,
		Branches:        branches,
		DefaultBranch:   defaultBranch,
		Tags:            tags,
		CloneURL:        cloneURL,
		Commits:         commits,
		CommitActivity:  commitActivity,
		LastCommit:      lastCommit,
		Files:           files,
		Size:            repoSize,
		Contributors:    contributors,
		IssueCount:      issueCount,
		IsFork:          info.ForkedFromID != nil,
		ForkedFromOwner: info.ForkedFromOwner,
		ForkedFromName:  info.ForkedFromName,
	}, nil
}
