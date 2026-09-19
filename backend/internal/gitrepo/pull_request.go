package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// BranchCompare holds the result of comparing two branches for a pull request.
type BranchCompare struct {
	Ahead     int          `json:"ahead"`
	Behind    int          `json:"behind"`
	MergeBase string       `json:"mergeBase"`
	Files     []FileChange `json:"files"`
	Diffs     []FileDiff   `json:"diffs"`
	Mergeable bool         `json:"mergeable"`
	Conflicts []string     `json:"conflicts,omitempty"`
	Remerge   bool         `json:"remerge,omitempty"`
}

// OpenRepo opens the bare repository for the given owner/repo and returns the
// go-git Repository handle.
func OpenRepo(owner, repo string) (*git.Repository, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")
	return git.PlainOpen(repoPath)
}

// bareRepoPath returns the filesystem path to the bare repository.
func bareRepoPath(owner, repo string) string {
	return filepath.Join(config.App.ReposPath, owner, repo+".git")
}

// VerifyBranchExists checks that the given branch exists in the repository.
func VerifyBranchExists(owner, repo, branch string) error {
	r, err := OpenRepo(owner, repo)
	if err != nil {
		return fmt.Errorf("open repo: %w", err)
	}

	_, err = ResolveBranch(r, branch)
	if err != nil {
		return fmt.Errorf("branch %q not found", branch)
	}

	return nil
}

// CompareBranches computes the diff between baseBranch and headBranch for a
// pull request view: commits ahead/behind, file changes, line-level diffs,
// and mergeability via an actual Git 3-way merge in a temporary clone.
func CompareBranches(owner, repo, baseBranch, headBranch string) (*BranchCompare, error) {
	r, err := OpenRepo(owner, repo)
	if err != nil {
		return nil, fmt.Errorf("open repo: %w", err)
	}

	baseCommit, err := ResolveBranch(r, baseBranch)
	if err != nil {
		return nil, fmt.Errorf("resolve base branch %q: %w", baseBranch, err)
	}

	headCommit, err := ResolveBranch(r, headBranch)
	if err != nil {
		return nil, fmt.Errorf("resolve head branch %q: %w", headBranch, err)
	}

	// Find the merge base.
	mergeBases, err := headCommit.MergeBase(baseCommit)
	if err != nil {
		return nil, fmt.Errorf("find merge base: %w", err)
	}

	if len(mergeBases) == 0 {
		return nil, fmt.Errorf("no common ancestor between %q and %q", baseBranch, headBranch)
	}

	mergeBase := mergeBases[0]

	// Count commits ahead (on head, not in base).
	ahead, err := countCommitsUntil(r, headCommit, mergeBase.Hash)
	if err != nil {
		return nil, fmt.Errorf("count commits ahead: %w", err)
	}

	// Count commits behind (on base, not in head).
	behind, err := countCommitsUntil(r, baseCommit, mergeBase.Hash)
	if err != nil {
		return nil, fmt.Errorf("count commits behind: %w", err)
	}

	// When ahead=0 and behind=0 the branch was likely already merged (or
	// reverted). Look for a merge commit on the base that brought in the
	// head branch and show those changes so the user can re-merge.
	if ahead == 0 && behind == 0 {
		mergeHash, err := FindMergeCommit(r, baseCommit, headCommit)
		if err == nil {
			result, err := CompareWithMergeCommit(owner, repo, mergeHash.String())
			if err == nil {
				result.Remerge = true
				return result, nil
			}
		}
	}

	// Compute file changes and diffs between merge-base and head branch.
	mergeBaseTree, err := mergeBase.Tree()
	if err != nil {
		return nil, fmt.Errorf("merge base tree: %w", err)
	}

	headTree, err := headCommit.Tree()
	if err != nil {
		return nil, fmt.Errorf("head tree: %w", err)
	}

	changes, err := object.DiffTree(mergeBaseTree, headTree)
	if err != nil {
		return nil, fmt.Errorf("diff trees: %w", err)
	}

	files := fileChangesFromDiff(changes)

	// Compute line-level diffs.
	patch, err := changes.Patch()
	if err != nil {
		return nil, fmt.Errorf("compute patch: %w", err)
	}

	diffs := make([]FileDiff, 0, len(patch.FilePatches()))

	for _, fp := range patch.FilePatches() {
		from, to := fp.Files()

		path := ""
		if to != nil {
			path = to.Path()
		} else if from != nil {
			path = from.Path()
		}

		action := "changed"
		for _, fc := range files {
			if fc.Path == path {
				action = fc.Action
				break
			}
		}

		lines, additions, deletions := chunksToDiffLines(fp.Chunks())
		hunks := groupHunks(lines)

		diffs = append(diffs, FileDiff{
			Path:      path,
			Action:    action,
			Additions: additions,
			Deletions: deletions,
			Hunks:     hunks,
		})
	}

	// Check mergeability via an actual Git 3-way merge in a temporary clone.
	mergeable, conflicts, err := CheckMergeability(owner, repo, baseBranch, headBranch)
	if err != nil {
		return nil, fmt.Errorf("check mergeability: %w", err)
	}

	return &BranchCompare{
		Ahead:     ahead,
		Behind:    behind,
		MergeBase: mergeBase.Hash.String(),
		Files:     files,
		Diffs:     diffs,
		Mergeable: mergeable,
		Conflicts: conflicts,
	}, nil
}

// CompareWithMergeCommit computes the file diff for a merged PR by diffing
// the merge commit against its first parent (the target branch state before
// merge). This is used when the source branch has been deleted after merge.
func CompareWithMergeCommit(owner, repo, mergeCommitHash string) (*BranchCompare, error) {
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

	firstParentTree, err := firstParent.Tree()
	if err != nil {
		return nil, fmt.Errorf("first parent tree: %w", err)
	}

	mergeTree, err := mergeCommit.Tree()
	if err != nil {
		return nil, fmt.Errorf("merge commit tree: %w", err)
	}

	changes, err := object.DiffTree(firstParentTree, mergeTree)
	if err != nil {
		return nil, fmt.Errorf("diff trees: %w", err)
	}

	files := fileChangesFromDiff(changes)

	patch, err := changes.Patch()
	if err != nil {
		return nil, fmt.Errorf("compute patch: %w", err)
	}

	diffs := make([]FileDiff, 0, len(patch.FilePatches()))

	for _, fp := range patch.FilePatches() {
		from, to := fp.Files()

		path := ""
		if to != nil {
			path = to.Path()
		} else if from != nil {
			path = from.Path()
		}

		action := "changed"
		for _, fc := range files {
			if fc.Path == path {
				action = fc.Action
				break
			}
		}

		lines, additions, deletions := chunksToDiffLines(fp.Chunks())
		hunks := groupHunks(lines)

		diffs = append(diffs, FileDiff{
			Path:      path,
			Action:    action,
			Additions: additions,
			Deletions: deletions,
			Hunks:     hunks,
		})
	}

	return &BranchCompare{
		Ahead:     0,
		Behind:    0,
		MergeBase: firstParent.Hash.String(),
		Files:     files,
		Diffs:     diffs,
		Mergeable: false,
	}, nil
}

// FindMergeCommit walks the base branch looking for a merge commit whose
// second parent is the head branch commit. Returns the merge commit hash.
func FindMergeCommit(r *git.Repository, baseCommit, headCommit *object.Commit) (plumbing.Hash, error) {
	iter, err := r.Log(&git.LogOptions{From: baseCommit.Hash})
	if err != nil {
		return plumbing.ZeroHash, err
	}

	var found plumbing.Hash
	err = iter.ForEach(func(c *object.Commit) error {
		if c.NumParents() < 2 {
			return nil
		}
		parents := c.Parents()
		parents.Next()
		second, err := parents.Next()
		if err != nil || second == nil {
			return nil
		}
		if second.Hash == headCommit.Hash {
			found = c.Hash
			return fmt.Errorf("found")
		}
		return nil
	})
	if err != nil && err.Error() != "found" {
		return plumbing.ZeroHash, err
	}
	if found == plumbing.ZeroHash {
		return plumbing.ZeroHash, fmt.Errorf("no merge commit found")
	}
	return found, nil
}

// AutoFindMergeCommit opens the repo and finds a merge commit on the base
// branch that brought in the head branch. Used as a fallback when
// CommitsBetweenBranches returns 0 results (already merged).
func AutoFindMergeCommit(owner, repo, baseBranch, headBranch string) (string, error) {
	r, err := OpenRepo(owner, repo)
	if err != nil {
		return "", err
	}

	baseCommit, err := ResolveBranch(r, baseBranch)
	if err != nil {
		return "", err
	}

	headCommit, err := ResolveBranch(r, headBranch)
	if err != nil {
		return "", err
	}

	hash, err := FindMergeCommit(r, baseCommit, headCommit)
	if err != nil {
		return "", err
	}

	return hash.String(), nil
}

// countCommitsUntil walks from commit backwards and counts how many commits
// are reachable before reaching (but not including) stopHash.
func countCommitsUntil(r *git.Repository, commit *object.Commit, stopHash plumbing.Hash) (int, error) {
	count := 0

	iter, err := r.Log(&git.LogOptions{From: commit.Hash})
	if err != nil {
		return 0, err
	}

	err = iter.ForEach(func(c *object.Commit) error {
		if c.Hash == stopHash {
			return fmt.Errorf("stop")
		}

		count++
		return nil
	})

	// The "stop" sentinel is not a real error.
	if err != nil && err.Error() != "stop" {
		return 0, err
	}

	return count, nil
}

// CheckMergeability clones the bare repo to a temporary directory, checks out
// the target branch, and attempts a no-commit merge of the source branch. Git
// itself is the authority on whether the merge is clean.
func CheckMergeability(owner, repo, targetBranch, sourceBranch string) (bool, []string, error) {
	tmpDir, err := os.MkdirTemp("", "drei-merge-check-*")
	if err != nil {
		return false, nil, fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	// Clone the bare repo to a temporary normal working repository.
	cloneCmd := exec.Command("git", "clone", bareRepoPath(owner, repo), tmpDir)
	if out, err := cloneCmd.CombinedOutput(); err != nil {
		return false, nil, fmt.Errorf("git clone: %w: %s", err, strings.TrimSpace(string(out)))
	}

	// Checkout the target branch.
	checkoutCmd := exec.Command("git", "-C", tmpDir, "checkout", targetBranch)
	if out, err := checkoutCmd.CombinedOutput(); err != nil {
		return false, nil, fmt.Errorf("git checkout %s: %w: %s", targetBranch, err, strings.TrimSpace(string(out)))
	}

	// Attempt a no-commit merge of the source branch. In the temp clone the
	// branch exists as a remote tracking ref, so we merge origin/<source>.
	mergeCmd := exec.Command("git", "-C", tmpDir, "merge", "--no-commit", "--no-ff", "origin/"+sourceBranch)
	mergeErr := mergeCmd.Run()

	if mergeErr == nil {
		// Clean merge — abort it, we only wanted to check.
		resetCmd := exec.Command("git", "-C", tmpDir, "merge", "--abort")
		_ = resetCmd.Run()

		return true, nil, nil
	}

	// Merge failed — collect conflicting files.
	diffCmd := exec.Command("git", "-C", tmpDir, "diff", "--name-only", "--diff-filter=U")
	out, _ := diffCmd.Output()

	var conflicts []string

	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			conflicts = append(conflicts, line)
		}
	}

	// Abort the failed merge.
	abortCmd := exec.Command("git", "-C", tmpDir, "merge", "--abort")
	_ = abortCmd.Run()

	return false, conflicts, nil
}

// MergeBranches performs the actual Git merge of sourceBranch into targetBranch
// in a temporary working clone. On success it updates the target branch ref in
// the bare repository and returns the merge commit hash. On conflict it aborts
// the merge and returns an error listing the conflicting files.
func MergeBranches(owner, repo, sourceBranch, targetBranch, authorName string, prNumber int) (string, error) {
	tmpDir, err := os.MkdirTemp("", "drei-merge-*")
	if err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	// Record the current target branch hash before the merge. This is used
	// later with git update-ref to ensure the target hasn't moved while the
	// merge was being prepared.
	revCmd := exec.Command("git", "--git-dir="+bareRepoPath(owner, repo), "rev-parse", "refs/heads/"+targetBranch)
	revOut, err := revCmd.Output()
	if err != nil {
		return "", fmt.Errorf("resolve target branch %q: %w", targetBranch, err)
	}

	expectedTargetHash := strings.TrimSpace(string(revOut))

	// Clone the bare repo to a temporary normal working repository.
	cloneCmd := exec.Command("git", "clone", bareRepoPath(owner, repo), tmpDir)
	if out, err := cloneCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git clone: %w: %s", err, strings.TrimSpace(string(out)))
	}

	// Checkout the target branch.
	checkoutCmd := exec.Command("git", "-C", tmpDir, "checkout", targetBranch)
	if out, err := checkoutCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git checkout %s: %w: %s", targetBranch, err, strings.TrimSpace(string(out)))
	}

	// Build the merge commit message.
	mergeMsg := fmt.Sprintf("Merge pull request #%d from %s/%s", prNumber, owner, sourceBranch)

	// Perform the merge with --no-ff to always create a merge commit. In the
	// temp clone branches are remote tracking refs, so merge origin/<source>.
	mergeCmd := exec.Command("git", "-C", tmpDir, "merge", "--no-ff", "-m", mergeMsg, "origin/"+sourceBranch)
	if out, err := mergeCmd.CombinedOutput(); err != nil {
		// Check for conflicting files.
		diffCmd := exec.Command("git", "-C", tmpDir, "diff", "--name-only", "--diff-filter=U")
		diffOut, _ := diffCmd.Output()

		var conflicts []string

		for _, line := range strings.Split(strings.TrimSpace(string(diffOut)), "\n") {
			line = strings.TrimSpace(line)
			if line != "" {
				conflicts = append(conflicts, line)
			}
		}

		// Abort the failed merge.
		abortCmd := exec.Command("git", "-C", tmpDir, "merge", "--abort")
		_ = abortCmd.Run()

		if len(conflicts) > 0 {
			return "", fmt.Errorf("merge conflicts in: %s", strings.Join(conflicts, ", "))
		}

		return "", fmt.Errorf("git merge: %w: %s", err, strings.TrimSpace(string(out)))
	}

	// Extract the merge commit hash.
	hashCmd := exec.Command("git", "-C", tmpDir, "rev-parse", "HEAD")
	hashOut, err := hashCmd.Output()
	if err != nil {
		return "", fmt.Errorf("get merge commit hash: %w", err)
	}

	mergeCommitHash := strings.TrimSpace(string(hashOut))

	// Push the merge result to a temporary ref on the bare repository. This
	// ensures the merge commit objects exist in the bare repo's object store
	// before we update the target branch ref. We use a temp ref so the push
	// doesn't move the target branch directly — the CAS update-ref below
	// handles the safe ref update.
	pushRef := fmt.Sprintf("refs/drei-tmp/%s", mergeCommitHash[:12])
	pushCmd := exec.Command("git", "-C", tmpDir, "push",
		bareRepoPath(owner, repo),
		"HEAD:"+pushRef,
	)
	if out, err := pushCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("push merge objects: %w: %s", err, strings.TrimSpace(string(out)))
	}

	// Update the target branch ref in the bare repository. The three-argument
	// form ensures the ref is only updated if it still points to the commit we
	// originally resolved. If someone pushed to the target branch while the
	// merge was in progress, this fails safely instead of overwriting.
	updateRefCmd := exec.Command(
		"git",
		"--git-dir="+bareRepoPath(owner, repo),
		"update-ref",
		"refs/heads/"+targetBranch,
		mergeCommitHash,
		expectedTargetHash,
	)

	if out, err := updateRefCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("update bare repo ref: %w: %s", err, strings.TrimSpace(string(out)))
	}

	// Clean up the temporary ref.
	deleteRefCmd := exec.Command("git", "--git-dir="+bareRepoPath(owner, repo),
		"update-ref", "-d", pushRef)
	_ = deleteRefCmd.Run()

	return mergeCommitHash, nil
}

// RevertMerge reverts a merge commit by using git revert -m 1 on the target
// branch. It returns the new revert commit hash.
func RevertMerge(owner, repo, targetBranch, mergeCommitHash, authorName string) (string, error) {
	tmpDir, err := os.MkdirTemp("", "drei-revert-*")
	if err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	revCmd := exec.Command("git", "--git-dir="+bareRepoPath(owner, repo), "rev-parse", "refs/heads/"+targetBranch)
	revOut, err := revCmd.Output()
	if err != nil {
		return "", fmt.Errorf("resolve target branch %q: %w", targetBranch, err)
	}

	expectedTargetHash := strings.TrimSpace(string(revOut))

	cloneCmd := exec.Command("git", "clone", bareRepoPath(owner, repo), tmpDir)
	if out, err := cloneCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git clone: %w: %s", err, strings.TrimSpace(string(out)))
	}

	checkoutCmd := exec.Command("git", "-C", tmpDir, "checkout", targetBranch)
	if out, err := checkoutCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git checkout %s: %w: %s", targetBranch, err, strings.TrimSpace(string(out)))
	}

	// -m 1 tells git to keep the first parent's (target) history.
	revertCmd := exec.Command("git", "-C", tmpDir, "revert", "-m", "1", "--no-edit", mergeCommitHash)
	if out, err := revertCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("git revert: %w: %s", err, strings.TrimSpace(string(out)))
	}

	hashCmd := exec.Command("git", "-C", tmpDir, "rev-parse", "HEAD")
	hashOut, err := hashCmd.Output()
	if err != nil {
		return "", fmt.Errorf("get revert commit hash: %w", err)
	}

	revertHash := strings.TrimSpace(string(hashOut))

	pushRef := fmt.Sprintf("refs/drei-tmp/%s", revertHash[:12])
	pushCmd := exec.Command("git", "-C", tmpDir, "push",
		bareRepoPath(owner, repo),
		"HEAD:"+pushRef,
	)
	if out, err := pushCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("push revert objects: %w: %s", err, strings.TrimSpace(string(out)))
	}

	updateRefCmd := exec.Command(
		"git",
		"--git-dir="+bareRepoPath(owner, repo),
		"update-ref",
		"refs/heads/"+targetBranch,
		revertHash,
		expectedTargetHash,
	)

	if out, err := updateRefCmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("update bare repo ref: %w: %s", err, strings.TrimSpace(string(out)))
	}

	deleteRefCmd := exec.Command("git", "--git-dir="+bareRepoPath(owner, repo),
		"update-ref", "-d", pushRef)
	_ = deleteRefCmd.Run()

	return revertHash, nil
}
