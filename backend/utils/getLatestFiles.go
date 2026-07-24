// this is the latest files from the latest commit
// later on we can use another commit hash to get the files tree of that commit

package utils

import (
	"backend/config"
	"encoding/base64"
	"path/filepath"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

type FileInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Size    int64  `json:"size"`
	Hash    string `json:"hash"`
	Type    bool   `json:"type"`
	Content string `json:"content,omitempty"`
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

	commit, err := r.CommitObject(head.Hash())
	if err != nil {
		return nil, err
	}

	tree, err := commit.Tree()
	if err != nil {
		return nil, err
	}

	var files []FileInfo

	err = tree.Files().ForEach(func(file *object.File) error {

		content, err := file.Contents()
		if err != nil {
			return err
		}

		files = append(files, FileInfo{
			Name:    filepath.Base(file.Name),
			Path:    file.Name,
			Size:    file.Size,
			Hash:    file.Hash.String(),
			Type:    file.Mode.IsFile(),
			Content: base64.StdEncoding.EncodeToString([]byte(content)),
		})

		return nil
	})

	if err != nil {
		return nil, err
	}

	return files, nil
}
