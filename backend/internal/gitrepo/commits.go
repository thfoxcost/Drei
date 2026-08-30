package gitrepo

import (
	"backend/internal/config"
	"backend/internal/database"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
	"github.com/go-git/go-git/v6/utils/merkletrie"
)

type CommitInfo struct {
	Hash    string `json:"hash"`
	Message string `json:"message"`
	Author  string `json:"author"`
	Date    string `json:"date"`
}

// resolveAuthorName returns the registered Drei username for the commit
// author's email address when one exists, falling back to the name stored in
// the git commit. Git author names are free-form and often stale (e.g. from
// an old git config), while the email is what identifies the account.
func resolveAuthorName(name, email string, usernames map[string]string) string {
	if username := usernames[strings.ToLower(strings.TrimSpace(email))]; username != "" {
		return username
	}

	return name
}

// authorEmails returns the unique, non-empty author emails across the commits.
func authorEmails(commits []rawCommit) []string {
	seen := make(map[string]bool)
	var emails []string

	for _, c := range commits {
		email := strings.TrimSpace(c.email)

		if email == "" || seen[strings.ToLower(email)] {
			continue
		}

		seen[strings.ToLower(email)] = true
		emails = append(emails, email)
	}

	return emails
}

// rawCommit is the commit data collected before author resolution.
type rawCommit struct {
	hash    string
	message string
	name    string
	email   string
	when    time.Time
}

// GetCommits walks the repository history and returns the commits reachable
// from the given branch, newest first, plus the head commit. Commit authors
// are resolved against registered Drei users by email so a stale git author
// name is replaced with the account username when possible.
func GetCommits(owner, repo, branch string) ([]CommitInfo, CommitInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commit, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commitIter, err := r.Log(&git.LogOptions{
		From: commit.Hash,
	})
	if err != nil {
		return nil, CommitInfo{}, err
	}

	var raw []rawCommit

	err = commitIter.ForEach(func(c *object.Commit) error {
		raw = append(raw, rawCommit{
			hash:    c.Hash.String(),
			message: c.Message,
			name:    c.Author.Name,
			email:   c.Author.Email,
			when:    c.Author.When,
		})

		return nil
	})
	if err != nil {
		return nil, CommitInfo{}, err
	}

	usernames, err := database.ResolveUsernamesByEmails(authorEmails(raw))
	if err != nil {
		return nil, CommitInfo{}, err
	}

	commits := make([]CommitInfo, 0, len(raw))

	for _, c := range raw {
		commits = append(commits, CommitInfo{
			Hash:    c.hash,
			Message: c.message,
			Author:  resolveAuthorName(c.name, c.email, usernames),
			Date:    c.when.String(),
		})
	}

	var lastCommit CommitInfo

	if len(raw) > 0 {
		last := raw[0]

		lastCommit = CommitInfo{
			Hash:    last.hash,
			Message: last.message,
			Author:  resolveAuthorName(last.name, last.email, usernames),
			Date:    last.when.Format(time.RFC3339),
		}
	}

	return commits, lastCommit, nil
}

type CommitDetail struct {
	FullHash     string `json:"fullHash"`
	ShortHash    string `json:"shortHash"`
	Message      string `json:"message"`
	Body         string `json:"body"`
	Branch       string `json:"branch"`
	ParentCount  int    `json:"parentCount"`
	ParentHashes []string `json:"parentHashes"`
	Date         string `json:"date"`
	AuthorName   string `json:"authorName"`
	AuthorAvatar string `json:"authorAvatar"`
	ChangedFiles int `json:"changedFiles"`
	Additions    int `json:"additions"`
	Deletions    int `json:"deletions"`
	Files        []FileChange `json:"files"`
}

// FileChange represents a single file that was added, modified, or removed in
// a commit. The Action field uses the frontend's terminology: "added",
// "changed", or "removed".
type FileChange struct {
	Path   string `json:"path"`
	Action string `json:"action"`
}

// GetCommitDetail returns the detailed metadata for a single commit identified
// by its full or short hash. The author name is resolved against registered
// Drei users by email, and the author avatar is fetched from the user table.
func GetCommitDetail(owner, repo, hash string) (*CommitDetail, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	var commitHash plumbing.Hash

	if plumbing.IsHash(hash) {
		commitHash = plumbing.NewHash(hash)
	} else {
		// Short hash: iterate refs and match prefix.
		var found bool

		iter, err := r.References()
		if err != nil {
			return nil, err
		}

		prefix := strings.ToLower(hash)

		err = iter.ForEach(func(ref *plumbing.Reference) error {
			h := ref.Hash().String()
			if strings.HasPrefix(strings.ToLower(h), prefix) {
				commitHash = ref.Hash()
				found = true
				return nil
			}
			return nil
		})
		if err != nil {
			return nil, err
		}

		if !found {
			return nil, plumbing.ErrObjectNotFound
		}
	}

	commit, err := r.CommitObject(commitHash)
	if err != nil {
		return nil, err
	}

	message := strings.TrimRight(commit.Message, "\n")
	subject := message
	body := ""

	if idx := strings.Index(message, "\n\n"); idx != -1 {
		subject = message[:idx]
		body = strings.TrimSpace(message[idx+2:])
	} else if idx := strings.Index(message, "\n"); idx != -1 {
		subject = message[:idx]
		body = strings.TrimSpace(message[idx+1:])
	}

	parentHashes := make([]string, 0, commit.NumParents())
	for i := 0; i < commit.NumParents(); i++ {
		p, err := commit.Parent(i)
		if err != nil {
			break
		}
		parentHashes = append(parentHashes, p.Hash.String())
	}

	branch := resolveBranchForCommit(r, commitHash)

	authorUsername := ""
	authorAvatar := ""

	usernames, err := database.ResolveUsernamesByEmails([]string{strings.ToLower(commit.Author.Email)})
	if err == nil {
		if username, ok := usernames[strings.ToLower(commit.Author.Email)]; ok {
			authorUsername = username

			user, err := database.GetUserByUsername(username)
			if err == nil && user.Avatar != nil {
				authorAvatar = *user.Avatar
			}
		}
	}

	if authorUsername == "" {
		authorUsername = commit.Author.Name
	}

	changedFiles, additions, deletions, files := computeCommitStats(r, commit)

	return &CommitDetail{
		FullHash:     commit.Hash.String(),
		ShortHash:    commit.Hash.String()[:7],
		Message:      subject,
		Body:         body,
		Branch:       branch,
		ParentCount:  commit.NumParents(),
		ParentHashes: parentHashes,
		Date:         commit.Author.When.Format(time.RFC3339),
		AuthorName:   authorUsername,
		AuthorAvatar: authorAvatar,
		ChangedFiles: changedFiles,
		Additions:    additions,
		Deletions:    deletions,
		Files:        files,
	}, nil
}

// resolveBranchForCommit finds the first local branch that contains the given
// commit, returning the branch name. A commit is considered to belong to a
// branch if it is an ancestor of (or equal to) the branch HEAD. Returns an
// empty string if no branch is found.
func resolveBranchForCommit(r *git.Repository, target plumbing.Hash) string {
	head, err := r.Head()
	if err == nil && head.Hash() == target {
		if head.Name().IsBranch() {
			return head.Name().Short()
		}
	}

	targetObj, err := r.CommitObject(target)
	if err != nil {
		return ""
	}

	iter, err := r.Branches()
	if err != nil {
		return ""
	}

	var branchName string

	_ = iter.ForEach(func(ref *plumbing.Reference) error {
		branchCommit, err := r.CommitObject(ref.Hash())
		if err != nil {
			return nil
		}

		isAncestor, err := targetObj.IsAncestor(branchCommit)
		if err == nil && isAncestor {
			branchName = ref.Name().Short()
		}

		return nil
	})

	return branchName
}

// emptyTreeHash is the SHA-1 of an empty tree, used as the base when computing
// diff stats for root commits that have no parent.
var emptyTreeHash = plumbing.NewHash("4b825dc642cb6eb9a060e54bf899d69f74d2e6e6")

// computeCommitStats returns the number of changed files, total additions,
// total deletions, and per-file changes for a commit by diffing its tree
// against the first parent's tree (or an empty tree for root commits).
func computeCommitStats(r *git.Repository, commit *object.Commit) (int, int, int, []FileChange) {
	commitTree, err := commit.Tree()
	if err != nil {
		return 0, 0, 0, nil
	}

	var parentTree *object.Tree

	if commit.NumParents() > 0 {
		parent, err := commit.Parent(0)
		if err == nil {
			parentTree, _ = parent.Tree()
		}
	}

	if parentTree == nil {
		parentTree, _ = r.TreeObject(emptyTreeHash)
	}

	if parentTree == nil {
		return 0, 0, 0, nil
	}

	changes, err := object.DiffTree(parentTree, commitTree)
	if err != nil {
		return 0, 0, 0, nil
	}

	fileChanges := fileChangesFromDiff(changes)

	patch, err := changes.Patch()
	if err != nil {
		return 0, 0, 0, fileChanges
	}

	stats := patch.Stats()

	additions := 0
	deletions := 0

	for _, s := range stats {
		additions += s.Addition
		deletions += s.Deletion
	}

	return len(stats), additions, deletions, fileChanges
}

// fileChangesFromDiff extracts per-file change information from the diff
// between two trees. Each change is mapped to the frontend's three-status
// model: "added" (insert), "changed" (modify), or "removed" (delete).
func fileChangesFromDiff(changes object.Changes) []FileChange {
	result := make([]FileChange, 0, len(changes))

	for _, c := range changes {
		action, err := c.Action()
		if err != nil {
			continue
		}

		var status string

		switch action {
		case merkletrie.Insert:
			status = "added"
		case merkletrie.Modify:
			status = "changed"
		case merkletrie.Delete:
			status = "removed"
		}

		path := c.To.Name
		if c.From.Name != "" {
			path = c.From.Name
		}

		result = append(result, FileChange{
			Path:   path,
			Action: status,
		})
	}

	return result
}
