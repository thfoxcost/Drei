package gitrepo

import (
	"backend/internal/config"
	"backend/internal/database"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/format/diff"
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

// CommitsBetweenBranches returns the commits on headBranch that are not
// reachable from baseBranch (i.e., the commits a PR would contain). Commits
// are returned newest first.
func CommitsBetweenBranches(owner, repo, baseBranch, headBranch string) ([]CommitInfo, error) {
	r, err := OpenRepo(owner, repo)
	if err != nil {
		return nil, fmt.Errorf("open repo: %w", err)
	}

	headCommit, err := ResolveBranch(r, headBranch)
	if err != nil {
		return nil, fmt.Errorf("resolve head branch %q: %w", headBranch, err)
	}

	baseCommit, err := ResolveBranch(r, baseBranch)
	if err != nil {
		return nil, fmt.Errorf("resolve base branch %q: %w", baseBranch, err)
	}

	mergeBases, err := headCommit.MergeBase(baseCommit)
	if err != nil {
		return nil, fmt.Errorf("find merge base: %w", err)
	}

	if len(mergeBases) == 0 {
		return nil, fmt.Errorf("no common ancestor between %q and %q", baseBranch, headBranch)
	}

	stopHash := mergeBases[0].Hash

	var raw []rawCommit

	iter, err := r.Log(&git.LogOptions{From: headCommit.Hash})
	if err != nil {
		return nil, err
	}

	err = iter.ForEach(func(c *object.Commit) error {
		if c.Hash == stopHash {
			return fmt.Errorf("stop")
		}

		raw = append(raw, rawCommit{
			hash:    c.Hash.String(),
			message: c.Message,
			name:    c.Author.Name,
			email:   c.Author.Email,
			when:    c.Author.When,
		})

		return nil
	})

	if err != nil && err.Error() != "stop" {
		return nil, err
	}

	usernames, err := database.ResolveUsernamesByEmails(authorEmails(raw))
	if err != nil {
		return nil, err
	}

	commits := make([]CommitInfo, 0, len(raw))

	for _, c := range raw {
		commits = append(commits, CommitInfo{
			Hash:    c.hash,
			Message: c.message,
			Author:  resolveAuthorName(c.name, c.email, usernames),
			Date:    c.when.Format(time.RFC3339),
		})
	}

	return commits, nil
}

// CommitsFromMergeCommit returns the PR commits from a merge commit by
// walking from the second parent (source branch tip) back to the merge base
// of the two parents. This correctly isolates only the source-branch commits
// without leaking commits from the base branch's history.
func CommitsFromMergeCommit(owner, repo, mergeCommitHash string) ([]CommitInfo, error) {
	r, err := OpenRepo(owner, repo)
	if err != nil {
		return nil, fmt.Errorf("open repo: %w", err)
	}

	hash := plumbing.NewHash(mergeCommitHash)
	mergeCommit, err := r.CommitObject(hash)
	if err != nil {
		return nil, fmt.Errorf("resolve merge commit: %w", err)
	}

	parents := mergeCommit.Parents()

	firstParent, err := parents.Next()
	if err != nil || firstParent == nil {
		return nil, fmt.Errorf("merge commit has no first parent")
	}

	secondParent, err := parents.Next()
	if err != nil || secondParent == nil {
		return nil, fmt.Errorf("merge commit has no second parent")
	}

	// Find the merge base of the two parents. Using the merge base as the
	// stop point ensures we only collect commits on the source branch that
	// are not already in the base branch. Using firstParent as the stop
	// would be wrong because firstParent is not an ancestor of
	// secondParent — they diverge at the merge base, so the walk would
	// never hit firstParent and would leak the entire base branch history.
	mergeBases, err := secondParent.MergeBase(firstParent)
	if err != nil || len(mergeBases) == 0 {
		return nil, fmt.Errorf("find merge base between merge commit parents")
	}

	stopHash := mergeBases[0].Hash

	var raw []rawCommit

	iter, err := r.Log(&git.LogOptions{From: secondParent.Hash})
	if err != nil {
		return nil, err
	}

	err = iter.ForEach(func(c *object.Commit) error {
		if c.Hash == stopHash {
			return fmt.Errorf("stop")
		}

		raw = append(raw, rawCommit{
			hash:    c.Hash.String(),
			message: c.Message,
			name:    c.Author.Name,
			email:   c.Author.Email,
			when:    c.Author.When,
		})

		return nil
	})

	if err != nil && err.Error() != "stop" {
		return nil, err
	}

	usernames, err := database.ResolveUsernamesByEmails(authorEmails(raw))
	if err != nil {
		return nil, err
	}

	commits := make([]CommitInfo, 0, len(raw))

	for _, c := range raw {
		commits = append(commits, CommitInfo{
			Hash:    c.hash,
			Message: c.message,
			Author:  resolveAuthorName(c.name, c.email, usernames),
			Date:    c.when.Format(time.RFC3339),
		})
	}

	return commits, nil
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
	Diffs        []FileDiff   `json:"diffs"`
}

// FileChange represents a single file that was added, modified, or removed in
// a commit. The Action field uses the frontend's terminology: "added",
// "changed", or "removed".
type FileChange struct {
	Path   string `json:"path"`
	Action string `json:"action"`
}

// DiffLine represents a single line in a unified diff hunk. OldLine is set for
// removed and unchanged lines; NewLine is set for added and unchanged lines.
type DiffLine struct {
	Type    string `json:"type"`
	OldLine *int   `json:"oldLine"`
	NewLine *int   `json:"newLine"`
	Content string `json:"content"`
}

// DiffHunk represents a contiguous group of changes with surrounding context
// lines, matching the unified diff @@ header format.
type DiffHunk struct {
	Header string     `json:"header"`
	Lines  []DiffLine `json:"lines"`
}

// FileDiff represents the complete diff for a single file in a commit,
// including per-file metadata and line-level hunks.
type FileDiff struct {
	Path      string     `json:"path"`
	Action    string     `json:"action"`
	Additions int        `json:"additions"`
	Deletions int        `json:"deletions"`
	Hunks     []DiffHunk `json:"hunks"`
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

	diffs := computeFileDiffs(r, commit)

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
		Diffs:        diffs,
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
		parentTree = &object.Tree{}
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

// computeFileDiffs builds per-file line-level diffs for a commit by diffing
// its tree against the first parent's tree (or an empty tree for root commits).
func computeFileDiffs(r *git.Repository, commit *object.Commit) []FileDiff {
	commitTree, err := commit.Tree()
	if err != nil {
		return nil
	}

	var parentTree *object.Tree

	if commit.NumParents() > 0 {
		parent, err := commit.Parent(0)
		if err == nil {
			parentTree, _ = parent.Tree()
		}
	}

	if parentTree == nil {
		parentTree = &object.Tree{}
	}

	changes, err := object.DiffTree(parentTree, commitTree)
	if err != nil {
		return nil
	}

	fileChanges := fileChangesFromDiff(changes)

	actionMap := make(map[string]string, len(fileChanges))
	for _, fc := range fileChanges {
		actionMap[fc.Path] = fc.Action
	}

	patch, err := changes.Patch()
	if err != nil {
		return nil
	}

	result := make([]FileDiff, 0, len(patch.FilePatches()))

	for _, fp := range patch.FilePatches() {
		from, to := fp.Files()

		path := ""
		if to != nil {
			path = to.Path()
		} else if from != nil {
			path = from.Path()
		}

		action := actionMap[path]
		if action == "" {
			action = "changed"
		}

		lines, additions, deletions := chunksToDiffLines(fp.Chunks())
		hunks := groupHunks(lines)
		if hunks == nil {
			hunks = []DiffHunk{}
		}

		result = append(result, FileDiff{
			Path:      path,
			Action:    action,
			Additions: additions,
			Deletions: deletions,
			Hunks:     hunks,
		})
	}

	return result
}

// chunksToDiffLines converts go-git diff chunks into DiffLines with sequential
// line numbers. Added lines get only a new-line number, removed lines get only
// an old-line number, and unchanged lines get both.
func chunksToDiffLines(chunks []diff.Chunk) ([]DiffLine, int, int) {
	var lines []DiffLine
	oldLine := 1
	newLine := 1
	additions := 0
	deletions := 0

	for _, chunk := range chunks {
		content := strings.TrimRight(chunk.Content(), "\n")
		if content == "" {
			continue
		}

		chunkLines := strings.Split(content, "\n")

		for _, line := range chunkLines {
			switch chunk.Type() {
			case diff.Equal:
				ol := oldLine
				nl := newLine

				lines = append(lines, DiffLine{
					Type:    "unchanged",
					OldLine: &ol,
					NewLine: &nl,
					Content: line,
				})

				oldLine++
				newLine++
			case diff.Add:
				nl := newLine
				additions++

				lines = append(lines, DiffLine{
					Type:    "added",
					NewLine: &nl,
					Content: line,
				})

				newLine++
			case diff.Delete:
				ol := oldLine
				deletions++

				lines = append(lines, DiffLine{
					Type:    "removed",
					OldLine: &ol,
					Content: line,
				})

				oldLine++
			}
		}
	}

	return lines, additions, deletions
}

// contextLines is the number of unchanged lines shown around each change in a
// unified diff hunk.
const contextLines = 3

// groupHunks splits a flat list of DiffLines into hunks. Two changes belong to
// the same hunk if the gap of unchanged lines between them is at most
// 2*contextLines. Each hunk is extended by contextLines of surrounding context
// on both sides.
func groupHunks(lines []DiffLine) []DiffHunk {
	if len(lines) == 0 {
		return nil
	}

	var changeIdxs []int
	for i, l := range lines {
		if l.Type != "unchanged" {
			changeIdxs = append(changeIdxs, i)
		}
	}

	if len(changeIdxs) == 0 {
		return nil
	}

	type span struct {
		start, end int
	}

	var spans []span
	cur := span{start: changeIdxs[0], end: changeIdxs[0]}

	for i := 1; i < len(changeIdxs); i++ {
		if changeIdxs[i]-cur.end <= contextLines*2 {
			cur.end = changeIdxs[i]
		} else {
			spans = append(spans, cur)
			cur = span{start: changeIdxs[i], end: changeIdxs[i]}
		}
	}

	spans = append(spans, cur)

	hunks := make([]DiffHunk, 0, len(spans))

	for _, s := range spans {
		lo := s.start - contextLines
		if lo < 0 {
			lo = 0
		}

		hi := s.end + contextLines
		if hi >= len(lines) {
			hi = len(lines) - 1
		}

		hunkLines := lines[lo : hi+1]

		oldStart := -1
		newStart := -1
		oldCount := 0
		newCount := 0

		for _, l := range hunkLines {
			if l.OldLine != nil {
				if oldStart == -1 || *l.OldLine < oldStart {
					oldStart = *l.OldLine
				}

				oldCount++
			}

			if l.NewLine != nil {
				if newStart == -1 || *l.NewLine < newStart {
					newStart = *l.NewLine
				}

				newCount++
			}
		}

		if oldStart == -1 {
			oldStart = 0
		}

		if newStart == -1 {
			newStart = 0
		}

		header := fmt.Sprintf("@@ -%d,%d +%d,%d @@", oldStart, oldCount, newStart, newCount)

		hunks = append(hunks, DiffHunk{
			Header: header,
			Lines:  hunkLines,
		})
	}

	return hunks
}
