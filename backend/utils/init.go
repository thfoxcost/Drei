package utils

import (
	"fmt"
	"os"
	"os/exec"
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
	// Initialize bare repository
	cmd := exec.Command("git", "init", "--bare")
	cmd.Dir = repoPath
	if err := cmd.Run(); err != nil {
		return err
	}

	// Enable HTTP push
	cmd = exec.Command("git", "config", "http.receivepack", "true")
	cmd.Dir = repoPath
	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}
