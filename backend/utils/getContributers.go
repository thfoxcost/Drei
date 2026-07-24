package utils

func GetContributors(owner, repo string) ([]string, error) {
	commits, _, err := GetCommits(owner, repo)
	if err != nil {
		return nil, err
	}

	var contributors []string

	for _, commit := range commits {
		author := commit.Author
		contributors = append(contributors, author)
	}

	return contributors, nil
}
