package gitrepo

import (
	"fmt"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// RefKind describes what kind of Git ref a generic ref string resolved to.
type RefKind string

const (
	RefKindHead   RefKind = "head"
	RefKindBranch RefKind = "branch"
	RefKindTag    RefKind = "tag"
	RefKindCommit RefKind = "commit"
)

// ResolvedRef describes how a user-supplied ref string was interpreted.
//
// Name is the branch/tag name or commit hash (empty for HEAD). CommitHash is
// always the peeled commit SHA the ref points at.
type ResolvedRef struct {
	Kind       RefKind `json:"kind"`
	Name       string  `json:"name"`
	CommitHash string  `json:"commitHash"`
}

// ResolveBranchOnly resolves refs/heads/<branch> (or HEAD when branch is
// empty) to its commit. Tags and raw SHAs are never resolved here so explicit
// branch routes stay unambiguous when a branch and tag share a name.
func ResolveBranchOnly(r *git.Repository, branch string) (*object.Commit, error) {
	if branch == "" {
		head, err := r.Head()
		if err != nil {
			return nil, err
		}
		return r.CommitObject(head.Hash())
	}

	ref, err := r.Reference(plumbing.NewBranchReferenceName(branch), true)
	if err != nil {
		return nil, err
	}

	return r.CommitObject(ref.Hash())
}

// ResolveTagCommit resolves refs/tags/<tag> to its peeled commit, dereferencing
// annotated tag objects. It returns the tag object hash (TargetSHA), the peeled
// commit, and whether the tag is annotated.
func ResolveTagCommit(r *git.Repository, tag string) (targetSHA string, commit *object.Commit, annotated bool, err error) {
	ref, err := r.Reference(plumbing.NewTagReferenceName(tag), true)
	if err != nil {
		return "", nil, false, err
	}

	targetSHA = ref.Hash().String()

	tagObj, err := r.TagObject(ref.Hash())
	if err != nil {
		// Lightweight tag: ref points directly at the commit.
		commit, err := r.CommitObject(ref.Hash())
		if err != nil {
			return targetSHA, nil, false, err
		}
		return targetSHA, commit, false, nil
	}

	// Annotated tag: peel to the target object, which is a commit in practice.
	// Tags pointing at non-commit objects (blobs/trees) have no browsable
	// commit; surface that explicitly instead of failing with a generic error.
	commit, err = r.CommitObject(tagObj.Target)
	if err != nil {
		return targetSHA, nil, true, fmt.Errorf("tag %q points at non-commit object %s", tag, tagObj.Target.String())
	}

	return targetSHA, commit, true, nil
}

// ResolveRef resolves a generic ref string to its commit.
//
// Resolution order (documented for branch/tag collisions):
//
//  1. "" resolves to HEAD (the default branch).
//  2. refs/heads/<ref> (branch wins on collision).
//  3. refs/tags/<ref> (peeled to the target commit).
//  4. Full or short commit SHA.
//
// Explicit /branch/:name and /tag/:name routes must use ResolveBranchOnly /
// ResolveTagCommit instead so collisions stay unambiguous.
func ResolveRef(r *git.Repository, ref string) (*object.Commit, ResolvedRef, error) {
	if ref == "" {
		head, err := r.Head()
		if err != nil {
			return nil, ResolvedRef{}, err
		}
		commit, err := r.CommitObject(head.Hash())
		if err != nil {
			return nil, ResolvedRef{}, err
		}
		return commit, ResolvedRef{Kind: RefKindHead, Name: "", CommitHash: commit.Hash.String()}, nil
	}

	// Branches win on branch/tag name collisions.
	if branchRef, err := r.Reference(plumbing.NewBranchReferenceName(ref), true); err == nil {
		commit, err := r.CommitObject(branchRef.Hash())
		if err != nil {
			return nil, ResolvedRef{}, err
		}
		return commit, ResolvedRef{Kind: RefKindBranch, Name: ref, CommitHash: commit.Hash.String()}, nil
	}

	// Then tags (with annotated-tag peeling).
	if _, commit, _, err := ResolveTagCommit(r, ref); err == nil {
		return commit, ResolvedRef{Kind: RefKindTag, Name: ref, CommitHash: commit.Hash.String()}, nil
	}

	// Finally raw commit SHAs (full or short).
	if hash, err := r.ResolveRevision(plumbing.Revision(ref)); err == nil {
		if commit, err := r.CommitObject(*hash); err == nil {
			return commit, ResolvedRef{Kind: RefKindCommit, Name: ref, CommitHash: commit.Hash.String()}, nil
		}
	}

	return nil, ResolvedRef{}, fmt.Errorf("ref %q not found", ref)
}
