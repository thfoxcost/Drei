package main

import (
	"backend/utils"
)

type Config struct {
	path       string
	username   string
	reponame   string
	decription string
	isPublic   bool
}

var AppConfig = Config{
	path: "../repos",

	// sample repo data
	username:   "mohamed",
	reponame:   "next",
	decription: "This is a description",
	isPublic:   true,
}

func main() {
	userPath := AppConfig.path + "/" + AppConfig.username + ""
	repoPath := AppConfig.path + "/" + AppConfig.username + "/" + AppConfig.reponame + ".git"

	utils.CreateReposDIR(AppConfig.path)
	utils.CreateUserDIR(userPath)
	utils.Init(repoPath)
}
