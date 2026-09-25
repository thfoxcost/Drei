package test

import (
	"backend/internal/gitrepo"
	"backend/internal/handlers"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func mustGit(t *testing.T, dir string, args ...string) string {
	t.Helper()
	cmd := exec.Command("git", args...)
	if dir != "" {
		cmd.Dir = dir
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git %v: %v: %s", args, err, strings.TrimSpace(string(out)))
	}
	return strings.TrimSpace(string(out))
}

// withPushedTags clones the shared test repo, creates the given tags, and
// pushes them to the bare repo — the same path real user pushes take through
// /git/. It returns a cleanup func that deletes the tags again.
// lightweight maps tag -> branch to tag; annotated maps tag -> "branch:message".
func withPushedTags(t *testing.T, lightweight map[string]string, annotated map[string]string) func() {
	t.Helper()

	clone := t.TempDir() + "/tagclone"
	mustGit(t, "", "clone", testRepoDir, clone)
	mustGit(t, clone, "config", "user.email", "test@example.com")
	mustGit(t, clone, "config", "user.name", "testuser")

	var created []string

	for tag, branch := range lightweight {
		mustGit(t, clone, "checkout", branch)
		mustGit(t, clone, "tag", tag)
		created = append(created, "refs/tags/"+tag)
	}
	for tag, spec := range annotated {
		parts := strings.SplitN(spec, ":", 2)
		mustGit(t, clone, "checkout", parts[0])
		mustGit(t, clone, "tag", "-a", tag, "-m", parts[1])
		created = append(created, "refs/tags/"+tag)
	}

	mustGit(t, clone, "push", "origin", "--tags")

	return func() {
		for _, ref := range created {
			tag := strings.TrimPrefix(ref, "refs/tags/")
			c := exec.Command("git", "push", "--delete", "origin", tag)
			c.Dir = clone
			c.Run()
		}
		os.RemoveAll(filepath.Dir(clone))
	}
}

func tagMux() *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("/api/repos/{owner}/{repo}", handlers.RepoHandler)
	m.HandleFunc("/api/repos/{owner}/{repo}/tags", handlers.TagsHandler)
	m.HandleFunc("/api/repos/{owner}/{repo}/tags/{tag...}", handlers.TagHandler)
	m.HandleFunc("/api/repos/{owner}/{repo}/blob/{branch}/{path...}", handlers.BlobHandler)
	m.HandleFunc("/api/repos/{owner}/{repo}/download", handlers.DownloadHandler)
	return m
}

func tagReq(t *testing.T, m *http.ServeMux, method, path string) *httptest.ResponseRecorder {
	t.Helper()
	r := httptest.NewRequest(method, path, nil)
	w := httptest.NewRecorder()
	m.ServeHTTP(w, r)
	return w
}

func decodeTags(t *testing.T, w *httptest.ResponseRecorder) []map[string]any {
	t.Helper()
	var tags []map[string]any
	if err := json.NewDecoder(w.Body).Decode(&tags); err != nil {
		t.Fatalf("decode tags: %v\nbody: %s", err, w.Body.String())
	}
	return tags
}

func TestGetTagInfos_LightweightAndAnnotated(t *testing.T) {
	cleanup := withPushedTags(t,
		map[string]string{"v1-light": "main"},
		map[string]string{"v1-annot": "main:Release 1"},
	)
	defer cleanup()

	infos, err := gitrepo.GetTagInfos("testowner", "testrepo")
	if err != nil {
		t.Fatalf("GetTagInfos: %v", err)
	}

	byName := map[string]gitrepo.TagInfo{}
	for _, info := range infos {
		byName[info.Name] = info
	}

	light, ok := byName["v1-light"]
	if !ok {
		t.Fatalf("lightweight tag missing in %v", infos)
	}
	if light.Type != gitrepo.TagTypeLightweight {
		t.Errorf("v1-light type = %q, want lightweight", light.Type)
	}
	if light.Commit == "" || light.ShortSHA == "" || light.CommitMessage == "" {
		t.Errorf("v1-light missing commit fields: %+v", light)
	}
	if light.Target != light.Commit {
		t.Errorf("lightweight target = %q, want commit %q", light.Target, light.Commit)
	}

	annot, ok := byName["v1-annot"]
	if !ok {
		t.Fatalf("annotated tag missing in %v", infos)
	}
	if annot.Type != gitrepo.TagTypeAnnotated {
		t.Errorf("v1-annot type = %q, want annotated", annot.Type)
	}
	if annot.Message != "Release 1" {
		t.Errorf("v1-annot message = %q, want %q", annot.Message, "Release 1")
	}
	if annot.TaggerName != "testuser" || annot.TaggerEmail != "test@example.com" {
		t.Errorf("v1-annot tagger = %q <%q>", annot.TaggerName, annot.TaggerEmail)
	}
	if annot.TaggerDate == "" {
		t.Error("v1-annot missing tagger date")
	}
	if annot.Target == annot.Commit {
		t.Error("annotated target should be the tag object, not the commit")
	}
	if annot.Commit == "" {
		t.Error("v1-annot missing peeled commit")
	}
}

func TestGetTagInfos_MultipleTagsSameCommit(t *testing.T) {
	cleanup := withPushedTags(t,
		map[string]string{"same-a": "main", "same-b": "main"},
		nil,
	)
	defer cleanup()

	infos, err := gitrepo.GetTagInfos("testowner", "testrepo")
	if err != nil {
		t.Fatalf("GetTagInfos: %v", err)
	}

	var a, b *gitrepo.TagInfo
	for i := range infos {
		if infos[i].Name == "same-a" {
			a = &infos[i]
		}
		if infos[i].Name == "same-b" {
			b = &infos[i]
		}
	}
	if a == nil || b == nil {
		t.Fatalf("same-commit tags missing in %v", infos)
	}
	if a.Commit != b.Commit {
		t.Errorf("same-commit tags resolve differently: %q vs %q", a.Commit, b.Commit)
	}
}

func TestTagsEndpoints_ListGetNotFound(t *testing.T) {
	cleanup := withPushedTags(t,
		map[string]string{"ep-light": "main"},
		map[string]string{"ep-annot": "feature-branch:EP release"},
	)
	defer cleanup()

	m := tagMux()

	w := tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags")
	if w.Code != http.StatusOK {
		t.Fatalf("list tags: status %d, body %s", w.Code, w.Body.String())
	}
	tags := decodeTags(t, w)
	if len(tags) < 2 {
		t.Fatalf("expected >= 2 tags, got %v", tags)
	}
	names := map[string]bool{}
	for _, tag := range tags {
		name, _ := tag["name"].(string)
		names[name] = true
		if _, ok := tag["commit"]; !ok {
			t.Errorf("tag %q missing commit field", name)
		}
		if _, ok := tag["type"]; !ok {
			t.Errorf("tag %q missing type field", name)
		}
	}
	if !names["ep-light"] || !names["ep-annot"] {
		t.Errorf("expected ep-light and ep-annot in %v", names)
	}

	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags/ep-annot")
	if w.Code != http.StatusOK {
		t.Fatalf("get tag: status %d, body %s", w.Code, w.Body.String())
	}
	var single map[string]any
	if err := json.NewDecoder(w.Body).Decode(&single); err != nil {
		t.Fatalf("decode tag: %v", err)
	}
	if single["name"] != "ep-annot" || single["type"] != "annotated" {
		t.Errorf("unexpected tag payload: %v", single)
	}

	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags/does-not-exist")
	if w.Code != http.StatusNotFound {
		t.Errorf("missing tag: status %d, want 404", w.Code)
	}
}

func TestTags_NewlyPushedAndDeleted(t *testing.T) {
	m := tagMux()

	// No "fresh-tag" before pushing.
	w := tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags/fresh-tag")
	if w.Code != http.StatusNotFound {
		t.Fatalf("fresh-tag unexpectedly exists: %d", w.Code)
	}

	cleanup := withPushedTags(t, map[string]string{"fresh-tag": "main"}, nil)

	// Newly pushed tag is visible immediately with no fetch/cache step.
	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags/fresh-tag")
	if w.Code != http.StatusOK {
		t.Fatalf("fresh-tag not visible after push: %d %s", w.Code, w.Body.String())
	}

	cleanup()

	// Deleted tag disappears immediately.
	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags/fresh-tag")
	if w.Code != http.StatusNotFound {
		t.Errorf("deleted tag still visible: %d %s", w.Code, w.Body.String())
	}

	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/tags")
	for _, tag := range decodeTags(t, w) {
		if tag["name"] == "fresh-tag" {
			t.Error("deleted tag still listed")
		}
	}
}

func TestResolveRef_BranchTagCollision(t *testing.T) {
	clone := t.TempDir() + "/collide"
	mustGit(t, "", "clone", testRepoDir, clone)
	mustGit(t, clone, "config", "user.email", "test@example.com")
	mustGit(t, clone, "config", "user.name", "testuser")

	// Branch "collide" on feature-branch, tag "collide" on main: different commits.
	mustGit(t, clone, "checkout", "-b", "collide", "origin/feature-branch")
	mustGit(t, clone, "push", "origin", "collide")
	mustGit(t, clone, "checkout", "main")
	mustGit(t, clone, "tag", "collide")
	mustGit(t, clone, "push", "origin", "--tags")
	defer func() {
		c := exec.Command("git", "push", "--delete", "origin", "collide")
		c.Dir = clone
		c.Run()
		d := exec.Command("git", "--git-dir="+testRepoDir, "branch", "-D", "collide")
		d.Run()
	}()

	r, err := gitrepo.OpenRepo("testowner", "testrepo")
	if err != nil {
		t.Fatalf("open repo: %v", err)
	}

	// Generic resolution prefers the branch on collision.
	commit, resolved, err := gitrepo.ResolveRef(r, "collide")
	if err != nil {
		t.Fatalf("ResolveRef: %v", err)
	}
	if resolved.Kind != gitrepo.RefKindBranch {
		t.Errorf("generic ResolveRef kind = %q, want branch", resolved.Kind)
	}
	branchCommit, err := gitrepo.ResolveBranchOnly(r, "collide")
	if err != nil {
		t.Fatalf("ResolveBranchOnly: %v", err)
	}
	if commit.Hash != branchCommit.Hash {
		t.Error("generic resolution did not return the branch commit")
	}

	// Explicit tag resolution returns the tag's (different) commit.
	_, tagCommit, _, err := gitrepo.ResolveTagCommit(r, "collide")
	if err != nil {
		t.Fatalf("ResolveTagCommit: %v", err)
	}
	if tagCommit.Hash == branchCommit.Hash {
		t.Error("tag and branch unexpectedly point at the same commit")
	}
}

func TestGetRepo_AcceptsTagRef(t *testing.T) {
	cleanup := withPushedTags(t, map[string]string{"repo-tag": "main"}, nil)
	defer cleanup()

	m := tagMux()

	// ?ref= works for tags.
	w := tagReq(t, m, "GET", "/api/repos/testowner/testrepo?ref=repo-tag")
	if w.Code != http.StatusOK {
		t.Fatalf("GetRepo ?ref=tag: status %d, body %s", w.Code, w.Body.String())
	}

	// Legacy ?branch= still works.
	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo?branch=main")
	if w.Code != http.StatusOK {
		t.Fatalf("GetRepo ?branch=main: status %d, body %s", w.Code, w.Body.String())
	}

	// ref takes precedence over branch: tag on main vs feature-branch files.
	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo?ref=repo-tag&branch=feature-branch")
	if w.Code != http.StatusOK {
		t.Fatalf("GetRepo ref precedence: status %d", w.Code)
	}
	var payload map[string]any
	if err := json.NewDecoder(w.Body).Decode(&payload); err != nil {
		t.Fatalf("decode repo: %v", err)
	}
	files, _ := payload["files"].([]any)
	found := false
	for _, f := range files {
		if fm, ok := f.(map[string]any); ok && fm["name"] == "README.md" {
			found = true
		}
	}
	// repo-tag points at main which has README.md; feature-branch also has it,
	// so instead assert the commits match the tag: compare against ?ref=main.
	w2 := tagReq(t, m, "GET", "/api/repos/testowner/testrepo?ref=repo-tag")
	var tagPayload, mainPayload map[string]any
	json.NewDecoder(w2.Body).Decode(&tagPayload)
	w3 := tagReq(t, m, "GET", "/api/repos/testowner/testrepo?ref=main")
	json.NewDecoder(w3.Body).Decode(&mainPayload)
	if !found {
		t.Error("README.md missing at tag ref")
	}
	tagLast, _ := tagPayload["lastCommit"].(map[string]any)
	mainLast, _ := mainPayload["lastCommit"].(map[string]any)
	if tagLast["hash"] != mainLast["hash"] {
		t.Errorf("tag lastCommit %v != main lastCommit %v", tagLast["hash"], mainLast["hash"])
	}
}

func TestBlobAndDownload_AtTag(t *testing.T) {
	cleanup := withPushedTags(t, map[string]string{"blob-tag": "main"}, nil)
	defer cleanup()

	m := tagMux()

	w := tagReq(t, m, "GET", "/api/repos/testowner/testrepo/blob/blob-tag/README.md")
	if w.Code != http.StatusOK {
		t.Fatalf("blob at tag: status %d, body %s", w.Code, w.Body.String())
	}

	w = tagReq(t, m, "GET", "/api/repos/testowner/testrepo/download?ref=blob-tag&format=zip")
	if w.Code != http.StatusOK {
		t.Fatalf("download at tag: status %d, body %s", w.Code, w.Body.String())
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/zip" {
		t.Errorf("download content-type = %q", ct)
	}
}

func TestGetCommitDetail_ResolvesTag(t *testing.T) {
	cleanup := withPushedTags(t,
		nil,
		map[string]string{"detail-tag": "main:Detail release"},
	)
	defer cleanup()

	info, err := gitrepo.GetTag("testowner", "testrepo", "detail-tag")
	if err != nil {
		t.Fatalf("GetTag: %v", err)
	}
	detail, err := gitrepo.GetCommitDetail("testowner", "testrepo", "detail-tag")
	if err != nil {
		t.Fatalf("GetCommitDetail(tag): %v", err)
	}
	if detail.FullHash != info.Commit {
		t.Errorf("commit detail hash = %q, want tag commit %q", detail.FullHash, info.Commit)
	}
}
