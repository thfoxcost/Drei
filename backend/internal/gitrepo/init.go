package gitrepo

import (
	"backend/internal/config"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func CreateReposDIR(path string) {
	err := os.Mkdir(path, 0755)
	if err != nil {
		fmt.Println(err)
	}
}

func CreateUserDIR(userPath string) {

	err := os.Mkdir(userPath, 0755)
	if err != nil {
		fmt.Printf("[\033[33mWARN\033[0m] %v\n", err)
		return
	} else {
		fmt.Println("\033[32m[OK]\033[0m User directory created")
	}
}

// exportMarker is the per-repository file git-http-backend checks before it
// will serve a directory. A repository is servable when either
// GIT_HTTP_EXPORT_ALL is set for the CGI invocation or this file exists.
//
// We deliberately never set GIT_HTTP_EXPORT_ALL: it is a blanket, static
// bypass of git's own checks. The marker is the narrow alternative.
const exportMarker = "git-daemon-export-ok"

// markExportable drops the export marker into a freshly initialised bare
// repository.
//
// This is NOT an authorization control. Every request that reaches
// git-http-backend has already passed the handler's session/proxy check, so
// the marker only tells the backend "this directory may be served" and grants
// nothing on its own. Do not treat its presence as meaning a repository is
// public.
func markExportable(repoPath string) error {
	return os.WriteFile(filepath.Join(repoPath, exportMarker), nil, 0644)
}

func Init(repoPath string) error {
	cmd := exec.Command(
		"git",
		"init",
		"--bare",
		"--initial-branch=main",
		repoPath,
	)

	if err := cmd.Run(); err != nil {
		return err
	}

	cmd = exec.Command(
		"git",
		"--git-dir="+repoPath,
		"config",
		"http.receivepack",
		"true",
	)

	if err := cmd.Run(); err != nil {
		return err
	}

	return markExportable(repoPath)
}

// ValidRepoName reports whether name is acceptable as a repository name for
// creation and renaming. It is stricter than the read-path validation in the
// handlers package: it caps the length and restricts the character set, so it
// must only be used on paths that create or move a directory, never when
// resolving an existing repository.
func ValidRepoName(name string) bool {
	if name == "" || len(name) > 30 ||
		strings.HasPrefix(name, "-") || strings.HasPrefix(name, ".") ||
		strings.HasSuffix(name, ".") {
		return false
	}

	for _, r := range name {
		if !(r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' ||
			r == '.' || r == '-' || r == '_') {
			return false
		}
	}

	return true
}

// RenameRepository renames the bare repository directory on disk.
func RenameRepository(owner, oldName, newName string) error {
	if !ValidRepoName(newName) {
		return fmt.Errorf("invalid repository name %q", newName)
	}

	oldPath := filepath.Join(config.App.ReposPath, owner, oldName+".git")
	newPath := filepath.Join(config.App.ReposPath, owner, newName+".git")

	if _, err := os.Stat(newPath); err == nil {
		return fmt.Errorf("repository %q already exists", newName)
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		return err
	}

	// Keep the retained backup in sync with the repository name. The backup
	// row follows automatically via ON DELETE CASCADE / repo_id lookups.
	return RenameBackup(owner, oldName, newName)
}

// RemoveRepository removes the bare repository directory and any stored logo
// file from disk. Removing a non-existent repository is not an error. The logo
// argument is a path relative to the logos directory.
func RemoveRepository(owner, name, logo string) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, name+".git")

	if err := os.RemoveAll(repoPath); err != nil {
		return err
	}

	// The backup metadata row is removed via ON DELETE CASCADE; delete the
	// bundle file from disk here.
	if err := RemoveBackup(owner, name); err != nil {
		return err
	}

	if logo != "" {
		if err := os.RemoveAll(filepath.Join(config.App.ReposPath, "logos", logo)); err != nil && !os.IsNotExist(err) {
			return err
		}
	}

	return nil
}

// RenameLogo renames a repository's stored logo file so it matches the new
// repository name. It is a no-op when there is no logo to rename.
func RenameLogo(owner, oldName, newName, logo string) error {
	if logo == "" {
		return nil
	}

	oldPath := filepath.Join(config.App.ReposPath, "logos", logo)
	newPath := filepath.Join(config.App.ReposPath, "logos", owner, newName+filepath.Ext(logo))

	return os.Rename(oldPath, newPath)
}

// ForkBareRepo creates a bare clone of the source repository at the
// destination path. This is a real Git fork — all objects, refs, and history
// are copied. After cloning, the http.receivepack config is enabled so the
// fork can receive pushes.
func ForkBareRepo(sourcePath, destPath string) error {
	cmd := exec.Command(
		"git",
		"clone",
		"--bare",
		sourcePath,
		destPath,
	)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git clone --bare failed: %w", err)
	}

	// Enable http.receivepack on the fork so it can receive pushes, and mark
	// it servable by git-http-backend.
	cmd = exec.Command(
		"git",
		"--git-dir="+destPath,
		"config",
		"http.receivepack",
		"true",
	)

	if err := cmd.Run(); err != nil {
		return err
	}

	return markExportable(destPath)
}

// EnsureExportable creates the export marker for an existing repository if it
// is missing.
//
// It is used to backfill repositories that were created before the marker
// existed: the marker is derived state, so recreating it on demand is safe and
// avoids a one-off migration over REPOS_PATH. The caller must have already
// authorized the request - this function is not an access check.
func EnsureExportable(owner, name string) error {
	repoPath := filepath.Join(config.App.ReposPath, owner, name+".git")

	if _, err := os.Stat(filepath.Join(repoPath, exportMarker)); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}

	return markExportable(repoPath)
}
