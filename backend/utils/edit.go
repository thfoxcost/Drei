package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func Edit(repoPath string, description string, visibility bool, useremail string, username string, userid string) {

	date := string(time.Now().Format("2006-01-02"))
	filePath := filepath.Join(repoPath, "config")

	repoData := fmt.Sprintf(`
[Drei]
id = %s
name = %s
email = %s
description = %s
visibility = %v
created = %s
`,
		userid,
		username,
		useremail,
		description,
		visibility,
		date,
	)

	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	_, err = file.WriteString(repoData)
	if err != nil {
		panic(err)
	}
}
