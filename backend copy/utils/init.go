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

func Init(repoPath string) {

	// make a folder for the bare repo
	err := os.Mkdir(repoPath, 0755)
	if err != nil {
		return
	}

	cmd := exec.Command("git", "init", "--bare")
	cmd.Dir = repoPath

	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(output))
}
