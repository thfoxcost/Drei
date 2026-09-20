package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// ResolveBranch returns the commit the given branch points at. An empty branch
// resolves to the repository HEAD, which is the default branch.
func ResolveBranch(r *git.Repository, branch string) (*object.Commit, error) {
	var hash plumbing.Hash

	if branch == "" {
		head, err := r.Head()
		if err != nil {
			return nil, err
		}
		hash = head.Hash()
	} else {
		resolved, err := r.ResolveRevision(plumbing.Revision("refs/heads/" + branch))
		if err != nil {
			return nil, err
		}
		hash = *resolved
	}

	return r.CommitObject(hash)
}

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

func GetBranchDates(owner, repo string) (map[string]string, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	dates := make(map[string]string)

	iter, err := r.Branches()
	if err != nil {
		return nil, err
	}

	err = iter.ForEach(func(ref *plumbing.Reference) error {
		commit, err := r.CommitObject(ref.Hash())
		if err != nil {
			return nil
		}
		dates[ref.Name().Short()] = commit.Committer.When.UTC().Format("2006-01-02T15:04:05Z")
		return nil
	})
	if err != nil {
		return nil, err
	}

	return dates, nil
}

func DefaultBranch(owner, repo string) (string, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", err
	}

	head, err := r.Head()
	if err != nil {
		return "", err
	}

	return head.Name().Short(), nil
}

func validBranchName(name string) bool {
	if name == "" ||
		strings.HasPrefix(name, "-") ||
		strings.Contains(name, "..") ||
		strings.HasSuffix(name, "/") ||
		strings.HasSuffix(name, ".") ||
		strings.ContainsAny(name, " ~^:?*[\\") {
		return false
	}

	return true
}

// SetDefaultBranch repoints the repository HEAD at an existing branch.
func SetDefaultBranch(owner, repo, branch string) error {
	if !validBranchName(branch) {
		return fmt.Errorf("invalid branch name %q", branch)
	}

	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	verify := exec.Command("git", "--git-dir="+repoPath, "rev-parse", "--verify", "--quiet", "refs/heads/"+branch)
	if err := verify.Run(); err != nil {
		return fmt.Errorf("branch %q does not exist", branch)
	}

	cmd := exec.Command("git", "--git-dir="+repoPath, "symbolic-ref", "HEAD", "refs/heads/"+branch)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git symbolic-ref: %w: %s", err, strings.TrimSpace(string(out)))
	}

	return nil
}

// RenameDefaultBranch renames the branch HEAD currently points to.
func RenameDefaultBranch(owner, repo, newName string) error {
	if !validBranchName(newName) {
		return fmt.Errorf("invalid branch name %q", newName)
	}

	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	cmd := exec.Command("git", "--git-dir="+repoPath, "branch", "-m", newName)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git branch -m: %w: %s", err, strings.TrimSpace(string(out)))
	}

	return nil
}

// DeleteBranch deletes a local branch from the bare repository. It refuses to
// delete the default branch (HEAD). If the branch does not exist, it returns
// nil (idempotent).
func DeleteBranch(owner, repo, branch string) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("open repo: %w", err)
	}

	head, err := r.Head()
	if err != nil {
		return fmt.Errorf("read HEAD: %w", err)
	}

	if head.Name().Short() == branch {
		return fmt.Errorf("cannot delete the default branch")
	}

	cmd := exec.Command("git", "--git-dir="+repoPath, "branch", "-d", branch)
	if out, err := cmd.CombinedOutput(); err != nil {
		msg := strings.TrimSpace(string(out))
		if strings.Contains(msg, "not found") {
			return nil
		}
		return fmt.Errorf("git branch -d: %w: %s", err, msg)
	}

	return nil
}
