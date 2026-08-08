package gitrepo

func CalcRepoSize(owner, repo, branch string) (int64, error) {

	files, err := GetFiles(owner, repo, branch)
	if err != nil {
		return 0, err
	}

	var Reposize int64

	for _, file := range files {
		Reposize += file.Size
	}

	return Reposize, nil
}
