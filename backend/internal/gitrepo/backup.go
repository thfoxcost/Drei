package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// BackupFilePath returns the path of the single retained backup bundle for a
// repository. Retention is 1: exactly one .bundle file exists per repo.
func BackupFilePath(owner, repo string) string {
	return filepath.Join(config.App.ReposPath, "backups", owner, repo+".bundle")
}

// HeadHash resolves the current HEAD commit of the bare repository. It
// returns an error for empty repositories (no commits yet).
func HeadHash(owner, repo string) (string, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	out, err := exec.Command(
		"git",
		"--git-dir="+repoPath,
		"rev-parse",
		"HEAD",
	).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("unable to resolve HEAD: %s", strings.TrimSpace(string(out)))
	}

	return strings.TrimSpace(string(out)), nil
}

// RunBackup creates a new backup bundle for the repository and atomically
// installs it as the retained backup.
//
// The existing backup is never touched until the replacement is fully built
// and verified, because with retention 1 it is the only backup available:
//  1. the new bundle is created in a temporary file next to the final path
//     (same directory, so the final rename stays on one filesystem),
//  2. the temporary bundle is verified with `git bundle verify`,
//  3. the verified bundle atomically replaces the previous backup via rename,
//  4. only then may the caller update the metadata/database (the returned
//     hash, size and path are meant for that upsert).
//
// On any failure the previous backup is left untouched and the temporary
// file is removed.
func RunBackup(owner, repo string) (hash string, size int64, path string, err error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")
	finalPath := BackupFilePath(owner, repo)

	if _, err := os.Stat(repoPath); err != nil {
		return "", 0, "", fmt.Errorf("repository not found")
	}

	if err := os.MkdirAll(filepath.Dir(finalPath), 0o755); err != nil {
		return "", 0, "", fmt.Errorf("create backup directory: %w", err)
	}

	tmp, err := os.CreateTemp(filepath.Dir(finalPath), repo+".*.tmp")
	if err != nil {
		return "", 0, "", fmt.Errorf("create temporary bundle: %w", err)
	}

	tmpPath := tmp.Name()
	_ = tmp.Close()

	// git bundle create refuses to overwrite an existing file, so remove the
	// placeholder; the deferred cleanup below still covers failure paths.
	_ = os.Remove(tmpPath)

	// From here on the temp file must be cleaned up unless it has been
	// renamed into place.
	installed := false
	defer func() {
		if !installed {
			_ = os.Remove(tmpPath)
		}
	}()

	// 1. Create the new bundle in the temporary file.
	var stderr strings.Builder

	create := exec.Command(
		"git",
		"--git-dir="+repoPath,
		"bundle",
		"create",
		tmpPath,
		"--all",
	)
	create.Stderr = &stderr

	if err := create.Run(); err != nil {
		return "", 0, "", fmt.Errorf("git bundle create: %w: %s", err, strings.TrimSpace(stderr.String()))
	}

	// 2. Verify the temporary bundle before it may replace anything.
	// `git bundle verify` resolves prerequisites against a repository, so it
	// must run with the repository context set; without --git-dir it fails
	// with "need a repository to verify a bundle".
	stderr.Reset()

	verify := exec.Command(
		"git",
		"--git-dir="+repoPath,
		"bundle",
		"verify",
		tmpPath,
	)
	verify.Stderr = &stderr

	if err := verify.Run(); err != nil {
		return "", 0, "", fmt.Errorf("backup verification failed: %w: %s", err, strings.TrimSpace(stderr.String()))
	}

	// Capture HEAD after the bundle was built so the stored hash matches the
	// snapshot as closely as possible.
	hash, err = HeadHash(owner, repo)
	if err != nil {
		return "", 0, "", err
	}

	// 3. Atomically replace the previous backup with the verified bundle.
	if err := os.Rename(tmpPath, finalPath); err != nil {
		return "", 0, "", fmt.Errorf("install backup: %w", err)
	}

	installed = true

	stat, err := os.Stat(finalPath)
	if err != nil {
		return "", 0, "", fmt.Errorf("stat backup: %w", err)
	}

	// 4. The caller persists hash/size/path to the database.
	return hash, stat.Size(), finalPath, nil
}

// RemoveBackup deletes a repository's backup bundle. Removing a non-existent
// backup is not an error.
func RemoveBackup(owner, repo string) error {
	err := os.Remove(BackupFilePath(owner, repo))
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}

// RenameBackup moves a repository's backup bundle alongside a repository
// rename. It is a no-op when there is no backup to move.
func RenameBackup(owner, oldName, newName string) error {
	oldPath := BackupFilePath(owner, oldName)
	newPath := BackupFilePath(owner, newName)

	if _, err := os.Stat(oldPath); os.IsNotExist(err) {
		return nil
	}

	return os.Rename(oldPath, newPath)
}
