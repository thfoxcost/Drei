package utils

import (
	"strings"
)

// normalizeKey returns a canonical key used to compare contributor names
// case-insensitively so that e.g. "JohnDoe" and "johndoe" are treated as one.
func normalizeKey(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

// GetCommitAuthors returns the unique author names present in the git history.
func GetCommitAuthors(owner, repo string) ([]string, error) {
	commits, _, err := GetCommits(owner, repo)
	if err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var authors []string

	for _, commit := range commits {
		author := strings.TrimSpace(commit.Author)

		if author == "" {
			continue
		}

		key := normalizeKey(author)

		if seen[key] {
			continue
		}

		seen[key] = true
		authors = append(authors, author)
	}

	return authors, nil
}
