package gitrepo

import (
	"backend/internal/config"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
)

// TagType distinguishes annotated tags (tag objects with tagger metadata)
// from lightweight tags (plain refs pointing at a commit).
type TagType string

const (
	TagTypeAnnotated   TagType = "annotated"
	TagTypeLightweight TagType = "lightweight"
)

// TagInfo is the API representation of a single Git tag. Target is the raw
// ref target (the tag object hash for annotated tags, the commit hash for
// lightweight tags); Commit is always the peeled commit SHA. ShortSHA and
// CommitMessage describe the peeled commit for list rendering.
type TagInfo struct {
	Name          string  `json:"name"`
	Target        string  `json:"target"`
	Commit        string  `json:"commit"`
	ShortSHA      string  `json:"shortSha"`
	Type          TagType `json:"type"`
	Message       string  `json:"message,omitempty"`
	TaggerName    string  `json:"taggerName,omitempty"`
	TaggerEmail   string  `json:"taggerEmail,omitempty"`
	TaggerDate    string  `json:"taggerDate,omitempty"`
	CommitMessage string  `json:"commitMessage,omitempty"`
}

func shortHash(hash string) string {
	if len(hash) > 7 {
		return hash[:7]
	}
	return hash
}

func commitSubject(message string) string {
	message = strings.TrimRight(message, "\n")
	if idx := strings.Index(message, "\n"); idx != -1 {
		return message[:idx]
	}
	return message
}

// tagInfoFromRef builds the TagInfo for a single tag reference. Annotated tag
// objects are dereferenced to their target commit; lightweight tags point at
// the commit directly. Tags pointing at non-commit objects keep their metadata
// but leave commit fields empty since there is no browsable commit.
func tagInfoFromRef(r *git.Repository, ref *plumbing.Reference) (TagInfo, error) {
	name := ref.Name().Short()
	target := ref.Hash().String()

	tagObj, err := r.TagObject(ref.Hash())
	if err != nil {
		// Lightweight tag.
		commit, err := r.CommitObject(ref.Hash())
		if err != nil {
			return TagInfo{}, err
		}
		return TagInfo{
			Name:          name,
			Target:        target,
			Commit:        commit.Hash.String(),
			ShortSHA:      shortHash(commit.Hash.String()),
			Type:          TagTypeLightweight,
			CommitMessage: commitSubject(commit.Message),
		}, nil
	}

	// Annotated tag.
	info := TagInfo{
		Name:        name,
		Target:      target,
		Type:        TagTypeAnnotated,
		Message:     strings.TrimRight(tagObj.Message, "\n"),
		TaggerName:  tagObj.Tagger.Name,
		TaggerEmail: tagObj.Tagger.Email,
	}
	if !tagObj.Tagger.When.IsZero() {
		info.TaggerDate = tagObj.Tagger.When.UTC().Format(time.RFC3339)
	}

	if commit, err := r.CommitObject(tagObj.Target); err == nil {
		info.Commit = commit.Hash.String()
		info.ShortSHA = shortHash(commit.Hash.String())
		info.CommitMessage = commitSubject(commit.Message)
	}

	return info, nil
}

// GetTagInfos returns rich metadata for every tag in the repository, sorted by
// name. Git is the source of truth: this reads the bare repository on every
// call so newly pushed, moved, or deleted tags are reflected immediately with
// no cache, fetcher, or database mirror.
func GetTagInfos(owner, repo string) ([]TagInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	iter, err := r.Tags()
	if err != nil {
		return nil, err
	}

	var tags []TagInfo

	err = iter.ForEach(func(ref *plumbing.Reference) error {
		info, err := tagInfoFromRef(r, ref)
		if err != nil {
			// Skip refs that point nowhere useful (e.g. tags on blobs) for
			// the list view rather than failing the whole request.
			return nil
		}
		tags = append(tags, info)
		return nil
	})
	if err != nil {
		return nil, err
	}

	if tags == nil {
		tags = []TagInfo{}
	}

	sort.Slice(tags, func(i, j int) bool { return tags[i].Name < tags[j].Name })

	return tags, nil
}

// GetTag returns the TagInfo for a single tag name.
func GetTag(owner, repo, name string) (*TagInfo, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")

	r, err := git.PlainOpen(repoPath)
	if err != nil {
		return nil, err
	}

	ref, err := r.Reference(plumbing.NewTagReferenceName(name), true)
	if err != nil {
		return nil, err
	}

	info, err := tagInfoFromRef(r, ref)
	if err != nil {
		return nil, err
	}

	return &info, nil
}

// GetTags returns just the tag names, sorted. Kept for backward compatibility;
// new code should prefer GetTagInfos.
func GetTags(owner, repo string) ([]string, error) {
	infos, err := GetTagInfos(owner, repo)
	if err != nil {
		return nil, err
	}

	names := make([]string, 0, len(infos))
	for _, info := range infos {
		names = append(names, info.Name)
	}

	return names, nil
}
