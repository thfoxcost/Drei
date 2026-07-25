package home

import (
	"backend/config"
	"backend/utils"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v6"
)

type RepoInfo struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Language    string   `json:"language"`
	LastUpdated string   `json:"lastUpdated"`

	// dummy for now
	Stars   int    `json:"stars"`
	Forks   int    `json:"forks"`
	License string `json:"license"`
}

func GetRepos(w http.ResponseWriter, r *http.Request) {

	w.Header().Set(
		"Access-Control-Allow-Origin",
		"http://localhost:3000",
	)

	w.Header().Set(
		"Access-Control-Allow-Methods",
		"GET, OPTIONS",
	)

	w.Header().Set(
		"Access-Control-Allow-Headers",
		"Content-Type",
	)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	owner := r.PathValue("owner")

	path := filepath.Join(
		config.App.ReposPath,
		owner,
	)

	entries, err := os.ReadDir(path)

	if err != nil {

		if os.IsNotExist(err) {
			json.NewEncoder(w).Encode([]RepoInfo{})
			return
		}

		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)

		return
	}

	repos := make([]RepoInfo, 0)

	for _, entry := range entries {

		if !entry.IsDir() {
			continue
		}

		// remove .git
		repoName := strings.TrimSuffix(
			entry.Name(),
			".git",
		)

		repoPath := filepath.Join(
			path,
			entry.Name(),
		)

		repo, err := git.PlainOpen(repoPath)

		if err != nil {
			continue
		}

		// no commits = don't show
		head, err := repo.Head()

		if err != nil {
			continue
		}

		info := RepoInfo{

			// always real repo name
			Name: repoName,

			Description: "",

			Tags: []string{},

			Language: "Unknown",

			LastUpdated: "Unknown",

			// dummy
			Stars:   123,
			Forks:   20,
			License: "MIT License",
		}

		// Get metadata
		meta, err := utils.GetRepoMetadata(
			owner,
			repoName,
		)

		if err == nil {

			info.Description = meta.Description

		}

		// branch fallback
		branchName := "main"

		if head.Name().IsBranch() {

			branchName = head.Name().Short()

		}

		// latest commit
		commit, err := repo.CommitObject(
			head.Hash(),
		)

		if err == nil {

			info.LastUpdated =
				commit.Author.When.Format(
					"06-01-02 15:04",
				)

		}

		// languages
		langs, err := utils.GetLang(
			owner,
			repoName,
		)

		if err == nil && len(langs) > 0 {

			// main language
			info.Language =
				langs[0].Name

			// max 4 tags
			for i, lang := range langs {

				if i >= 4 {
					break
				}

				info.Tags = append(
					info.Tags,
					lang.Name,
				)

			}

		}

		// fallback if no language
		if info.Language == "" {

			info.Language = "Unknown"

		}

		// fallback tags
		if len(info.Tags) == 0 {

			info.Tags = []string{
				branchName,
				info.Language,
			}

		}

		repos = append(
			repos,
			info,
		)

	}

	json.NewEncoder(w).Encode(repos)

}
