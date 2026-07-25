package utils

import (
	"backend/config"
	"encoding/base64"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

type CommitInfo struct {
	Hash    string `json:"hash"`
	Message string `json:"message"`
	Author  string `json:"author"`
	Date    string `json:"date"`
}

type FileInfo struct {
	Name       string     `json:"name"`
	Path       string     `json:"path"`
	Size       int64      `json:"size"`
	Hash       string     `json:"hash"`
	Type       bool       `json:"type"`
	Content    string     `json:"content,omitempty"`
	LastCommit CommitInfo `json:"lastCommit"`
}

func GetFiles(owner, repo string) ([]FileInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	head, err := r.Head()
	if err != nil {
		return nil, err
	}

	headCommit, err := r.CommitObject(head.Hash())
	if err != nil {
		return nil, err
	}

	tree, err := headCommit.Tree()
	if err != nil {
		return nil, err
	}

	getLastCommit := func(path string) (CommitInfo, error) {
		iter, err := r.Log(&git.LogOptions{
			From: head.Hash(),
		})
		if err != nil {
			return CommitInfo{}, err
		}

		var result CommitInfo

		err = iter.ForEach(func(commit *object.Commit) error {

			changed := false

			// First commit (no parent)
			if commit.NumParents() == 0 {

				tree, err := commit.Tree()
				if err != nil {
					return nil
				}

				file, err := tree.File(path)
				if err == nil && file != nil {
					changed = true
				}

			} else {

				parent, err := commit.Parent(0)
				if err != nil {
					return nil
				}

				patch, err := parent.Patch(commit)
				if err != nil {
					return nil
				}

				for _, fp := range patch.FilePatches() {
					from, to := fp.Files()

					if (from != nil && from.Path() == path) ||
						(to != nil && to.Path() == path) {

						changed = true
						break
					}
				}
			}

			if changed {
				result = CommitInfo{
					Hash:    commit.Hash.String(),
					Message: commit.Message,
					Author:  commit.Author.Name,
					Date:    commit.Author.When.String(),
				}

				return object.ErrStop
			}

			return nil
		})

		if err != nil && err != object.ErrStop {
			return CommitInfo{}, err
		}

		return result, nil
	}

	var files []FileInfo

	err = tree.Files().ForEach(func(file *object.File) error {

		content, err := file.Contents()
		if err != nil {
			return err
		}

		lastCommit, err := getLastCommit(file.Name)
		if err != nil {
			return err
		}

		files = append(files, FileInfo{
			Name:       filepath.Base(file.Name),
			Path:       file.Name,
			Size:       file.Size,
			Hash:       file.Hash.String(),
			Type:       file.Mode.IsFile(),
			Content:    base64.StdEncoding.EncodeToString([]byte(content)),
			LastCommit: lastCommit,
		})

		return nil
	})

	if err != nil {
		return nil, err
	}

	return files, nil
}
