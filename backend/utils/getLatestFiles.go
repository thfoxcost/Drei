package utils

import (
	"backend/config"
	"encoding/base64"
	"errors"
	"io"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
)

var errStop = errors.New("stop iteration")

type CommitInfo2 struct {
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
	Type       bool       `json:"type"` // true = file, false = folder
	IsNested   bool       `json:"isNested"`
	Content    string     `json:"content,omitempty"`
	LastCommit CommitInfo `json:"lastCommit"`
}

func GetFiles(owner, repo string) ([]FileInfo, error) {
	repoPath := filepath.Join(
		config.App.ReposPath,
		owner,
		repo+".git",
	)

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

	rootTree, err := headCommit.Tree()
	if err != nil {
		return nil, err
	}

	// Cache last-commit lookups so we don't walk the entire Git
	// history repeatedly for the same path.
	lastCommitCache := make(map[string]CommitInfo)

	getLastCommit := func(filePath string, isFile bool) (CommitInfo, error) {
		if cached, ok := lastCommitCache[filePath]; ok {
			return cached, nil
		}

		iter, err := r.Log(&git.LogOptions{
			From: head.Hash(),
		})
		if err != nil {
			return CommitInfo{}, err
		}
		defer iter.Close()

		var result CommitInfo

		err = iter.ForEach(func(commit *object.Commit) error {
			changed := false

			// First commit in history.
			if commit.NumParents() == 0 {
				commitTree, err := commit.Tree()
				if err != nil {
					return err
				}

				if isFile {
					file, err := commitTree.File(filePath)
					if err == nil && file != nil {
						changed = true
					}
				} else {
					// Check whether the directory existed.
					_, err := commitTree.Tree(filePath)
					if err == nil {
						changed = true
					}
				}
			} else {
				parent, err := commit.Parent(0)
				if err != nil {
					return err
				}

				patch, err := parent.Patch(commit)
				if err != nil {
					return err
				}

				for _, fp := range patch.FilePatches() {
					from, to := fp.Files()

					var fromPath string
					var toPath string

					if from != nil {
						fromPath = from.Path()
					}

					if to != nil {
						toPath = to.Path()
					}

					if isFile {
						// File itself changed.
						if fromPath == filePath || toPath == filePath {
							changed = true
							break
						}
					} else {
						// Folder changed when anything inside it changed.
						prefix := filePath + "/"

						if fromPath == filePath ||
							toPath == filePath ||
							strings.HasPrefix(fromPath, prefix) ||
							strings.HasPrefix(toPath, prefix) {
							changed = true
							break
						}
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

				return errStop
			}

			return nil
		})

		if err != nil && !errors.Is(err, errStop) {
			return CommitInfo{}, err
		}

		lastCommitCache[filePath] = result

		return result, nil
	}

	var files []FileInfo

	// Walk the entire Git tree recursively.
	// This includes both files and folders.
	walker := object.NewTreeWalker(
		rootTree,
		true,
		make(map[plumbing.Hash]bool),
	)
	defer walker.Close()

	for {
		fullPath, entry, err := walker.Next()

		if errors.Is(err, io.EOF) {
			break
		}

		if err != nil {
			return nil, err
		}

		isFile := entry.Mode.IsFile()

		// A file/folder is nested if its path contains "/".
		//
		// hello.rb           -> false
		// err                -> false
		// err/err.rb         -> true
		// src/main.go        -> true
		// src/utils/test.go  -> true
		isNested := strings.Contains(fullPath, "/")

		item := FileInfo{
			Name:     entry.Name,
			Path:     fullPath,
			Hash:     entry.Hash.String(),
			Type:     isFile,
			IsNested: isNested,
		}

		// Only files have content and size.
		if isFile {
			currentTree := walker.Tree()

			file, err := currentTree.TreeEntryFile(&entry)
			if err != nil {
				return nil, err
			}

			content, err := file.Contents()
			if err != nil {
				return nil, err
			}

			item.Size = file.Size
			item.Content = base64.StdEncoding.EncodeToString([]byte(content))
		}

		lastCommit, err := getLastCommit(fullPath, isFile)
		if err != nil {
			return nil, err
		}

		item.LastCommit = lastCommit

		files = append(files, item)
	}

	return files, nil
}