package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"strings"
)

// VerifyArchiveSource checks that the repository HEAD (or the given branch)
// resolves to a commit that can be archived. It returns an error when the
// repository is empty or the branch does not exist.
func VerifyArchiveSource(owner, repo, branch string) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	ref := "HEAD"
	if branch != "" {
		if !validBranchName(branch) {
			return fmt.Errorf("invalid branch name %q", branch)
		}
		ref = "refs/heads/" + branch
	}

	cmd := exec.Command("git", "--git-dir="+repoPath, "rev-parse", "--verify", "--quiet", ref)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("unable to resolve %s: %s", ref, strings.TrimSpace(string(out)))
	}

	return nil
}

// WriteArchive streams a git archive of the repository to w. format must be a
// value accepted by "git archive --format" such as "zip" or "tar.gz". An empty
// branch archives HEAD, which is the default branch.
func WriteArchive(owner, repo, branch, format string, w io.Writer) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	tree := "HEAD"
	if branch != "" {
		if !validBranchName(branch) {
			return fmt.Errorf("invalid branch name %q", branch)
		}
		tree = branch
	}

	cmd := exec.Command(
		"git",
		"--git-dir="+repoPath,
		"archive",
		"--format="+format,
		"--prefix="+repo+"/",
		tree,
	)

	var stderr strings.Builder
	cmd.Stdout = w
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git archive: %w: %s", err, strings.TrimSpace(stderr.String()))
	}

	return nil
}
