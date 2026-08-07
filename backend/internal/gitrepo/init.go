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

	return cmd.Run()
}

func validRepoName(name string) bool {
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
	if !validRepoName(newName) {
		return fmt.Errorf("invalid repository name %q", newName)
	}

	oldPath := filepath.Join(config.App.ReposPath, owner, oldName+".git")
	newPath := filepath.Join(config.App.ReposPath, owner, newName+".git")

	if _, err := os.Stat(newPath); err == nil {
		return fmt.Errorf("repository %q already exists", newName)
	}

	return os.Rename(oldPath, newPath)
}
