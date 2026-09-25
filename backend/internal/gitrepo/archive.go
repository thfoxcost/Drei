package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"strings"
)

// resolveArchiveRef maps a user-supplied ref (branch, tag, or commit SHA;
// empty means HEAD) to a git rev accepted by archive commands. Branches win
// on branch/tag name collisions, matching ResolveRef.
func resolveArchiveRef(repoPath, ref string) (string, error) {
	if ref == "" {
		return "HEAD", nil
	}

	if !validBranchName(ref) {
		return "", fmt.Errorf("invalid ref name %q", ref)
	}

	for _, candidate := range []string{"refs/heads/" + ref, "refs/tags/" + ref} {
		cmd := exec.Command("git", "--git-dir="+repoPath, "rev-parse", "--verify", "--quiet", candidate)
		if err := cmd.Run(); err == nil {
			return candidate, nil
		}
	}

	// Raw commit SHA fallback.
	cmd := exec.Command("git", "--git-dir="+repoPath, "rev-parse", "--verify", "--quiet", ref+"^{commit}")
	if err := cmd.Run(); err == nil {
		return ref, nil
	}

	return "", fmt.Errorf("unable to resolve %q: no such branch, tag, or commit", ref)
}

// VerifyArchiveSource checks that the repository HEAD (or the given ref:
// branch, tag, or commit SHA) resolves to a commit that can be archived. It
// returns an error when the repository is empty or the ref does not exist.
func VerifyArchiveSource(owner, repo, ref string) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	resolved, err := resolveArchiveRef(repoPath, ref)
	if err != nil {
		return err
	}

	cmd := exec.Command("git", "--git-dir="+repoPath, "rev-parse", "--verify", "--quiet", resolved)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("unable to resolve %s: %s", resolved, strings.TrimSpace(string(out)))
	}

	return nil
}

// WriteArchive streams a git archive of the repository to w. format must be a
// value accepted by "git archive --format" such as "zip" or "tar.gz". An empty
// ref archives HEAD, which is the default branch.
func WriteArchive(owner, repo, ref, format string, w io.Writer) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	tree, err := resolveArchiveRef(repoPath, ref)
	if err != nil {
		return err
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
