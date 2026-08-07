package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"os/exec"
	"path/filepath"
	"strings"

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
