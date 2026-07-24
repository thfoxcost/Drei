package utils

type RepoResponse struct {
	Name        string   `json:"name"`
	Email       string   `json:"email"`
	Description string   `json:"description"`
	Visibility  bool     `json:"visibility"`
	HasCommits  bool     `json:"hasCommits"`
	Created     string   `json:"created"`
	Langs       []string `json:"langs"`
}

func GetRepo(owner, repo string) (*RepoResponse, error) {
	info, err := GetRepoMetadata(owner, repo)
	if err != nil {
		return nil, err
	}

	hasCommits, err := CheckPush(owner, repo)
	if err != nil {
		return nil, err
	}

	langs, err := GetLang(owner, repo)
	if err != nil {
		return nil, err
	}

	return &RepoResponse{
		Name:        info.Name,
		Email:       info.Email,
		Description: info.Description,
		Visibility:  info.Visibility,
		HasCommits:  hasCommits,
		Created:     info.Created,
		Langs:       langs,
	}, nil
}
