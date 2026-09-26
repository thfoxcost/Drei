// Package storage measures how much disk space a single account occupies.
//
// Unlike the host-wide metrics in the sysinfo package, this is per-user, so it
// cannot live in a background snapshot: the answer depends on who is asking.
// Measurements are therefore computed on demand and cached per account, since
// summing a tree of bare repositories means walking every object file and is far
// too expensive to repeat on each status poll.
package storage

import (
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"backend/internal/config"
	"backend/internal/database"
)

// freshFor is how long a measurement is served without re-walking the disk.
// Stale entries are still returned (and refreshed in the background) so a poll
// never blocks on directory traversal.
const freshFor = 10 * time.Minute

// maxEntries bounds the cache so a large instance cannot grow it without limit.
const maxEntries = 512

// uploadDirs are the per-owner directories holding files users uploaded.
// Each is walked under REPOS_PATH for every owner being measured.
var uploadDirs = []string{
	"logos",
	"issue-images",
	"pr-images",
	"backups",
}

// avatarDir holds organization avatars as flat "<slug>.<ext>" files.
const avatarDir = "orgs"

// Usage is one account's storage footprint.
type Usage struct {
	Bytes      int64     `json:"bytes"`
	ComputedAt time.Time `json:"computedAt"`
}

type entry struct {
	usage      Usage
	refreshing atomic.Bool
}

var (
	mu    sync.Mutex
	cache = make(map[string]*entry)
)

// ForUser returns the disk space used by the given user's own repositories,
// the repositories of the organizations they belong to, and the files they
// have uploaded.
//
// The first call for an account measures on the calling goroutine because
// there is nothing to serve yet. Later calls are answered from the cache; once
// a measurement goes stale it is still returned immediately while a background
// goroutine recomputes it, so a status poll does not wait on the filesystem.
func ForUser(ctx context.Context, userID, username string) (Usage, error) {
	key := userID
	if key == "" {
		key = strings.ToLower(username)
	}

	if usage, ok := lookup(key, freshFor); ok {
		return usage, nil
	}

	// Something is cached but it has expired: serve it now and refresh behind
	// the caller's back.
	if usage, ok := lookup(key, 0); ok {
		if item := claim(key); item != nil {
			go refresh(key, userID, username)
		}

		return usage, nil
	}

	usage, err := measure(ctx, userID, username)
	if err != nil {
		return Usage{}, err
	}

	store(key, usage)

	return usage, nil
}

// lookup returns a cached measurement no older than maxAge. A maxAge of zero
// matches any age.
func lookup(key string, maxAge time.Duration) (Usage, bool) {
	mu.Lock()
	defer mu.Unlock()

	item, ok := cache[key]
	if !ok {
		return Usage{}, false
	}

	if maxAge > 0 && time.Since(item.usage.ComputedAt) > maxAge {
		return Usage{}, false
	}

	return item.usage, true
}

// claim marks an entry as being refreshed and reports whether this caller won
// the race, so concurrent stale hits trigger a single walk.
func claim(key string) *entry {
	mu.Lock()
	defer mu.Unlock()

	item, ok := cache[key]
	if !ok {
		return nil
	}

	if !item.refreshing.CompareAndSwap(false, true) {
		return nil
	}

	return item
}

func store(key string, usage Usage) {
	mu.Lock()
	defer mu.Unlock()

	if len(cache) >= maxEntries {
		evictOldest()
	}

	cache[key] = &entry{usage: usage}
}

// evictOldest drops the stalest quarter of the cache. Callers hold mu.
func evictOldest() {
	type aged struct {
		key string
		at  time.Time
	}

	all := make([]aged, 0, len(cache))
	for key, item := range cache {
		all = append(all, aged{key, item.usage.ComputedAt})
	}

	// Selection by age needs no ordering guarantee beyond correctness, so a
	// single pass is enough: keep the newest three quarters.
	cutoff := time.Now().Add(-freshFor)
	dropped := 0

	for _, candidate := range all {
		if dropped >= len(cache)/4 {
			break
		}

		if candidate.at.Before(cutoff) {
			delete(cache, candidate.key)
			dropped++
		}
	}

	// If nothing was old enough to drop, clear the map rather than let it grow
	// without bound.
	if dropped == 0 {
		clear(cache)
	}
}

func refresh(key, userID, username string) {
	usage, err := measure(context.Background(), userID, username)

	mu.Lock()
	defer mu.Unlock()

	item, ok := cache[key]
	if !ok {
		return
	}

	item.refreshing.Store(false)

	if err != nil {
		// Keep serving the previous measurement; a transient filesystem
		// error should not blank out the widget.
		return
	}

	item.usage = usage
}

// measure walks everything belonging to the account and sums the size of every
// regular file it finds.
func measure(ctx context.Context, userID, username string) (Usage, error) {
	owners := []string{username}

	orgs, err := database.GetUserOrganizations(userID)
	if err != nil {
		return Usage{}, err
	}

	for _, org := range orgs {
		owners = append(owners, org.Slug)
	}

	var total int64

	// Bare repositories live in REPOS_PATH/<owner>/<repo>.git.
	for _, dir := range resolveOwners(config.App.ReposPath, owners) {
		size, err := dirSize(ctx, dir)
		if err != nil {
			return Usage{}, err
		}

		total += size
	}

	// Uploaded files live in REPOS_PATH/<kind>/<owner>/.
	for _, kind := range uploadDirs {
		for _, dir := range resolveOwners(filepath.Join(config.App.ReposPath, kind), owners) {
			size, err := dirSize(ctx, dir)
			if err != nil {
				return Usage{}, err
			}

			total += size
		}
	}

	// Organization avatars are flat files named after the slug.
	total += avatarBytes(orgs)

	return Usage{Bytes: total, ComputedAt: time.Now()}, nil
}

// resolveOwners returns the child directories of parent whose names match one
// of the owners, ignoring case.
//
// Owner names are matched case-insensitively everywhere else in the codebase,
// but the filesystem is case-sensitive, so an account whose name was stored
// with different capitalisation at some point ends up with two directories.
func resolveOwners(parent string, owners []string) []string {
	entries, err := os.ReadDir(parent)
	if err != nil {
		return nil
	}

	var found []string

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		for _, owner := range owners {
			if strings.EqualFold(entry.Name(), owner) {
				found = append(found, filepath.Join(parent, entry.Name()))
				break
			}
		}
	}

	return found
}

// avatarBytes sums the organization avatars belonging to the given
// organizations. Avatars are stored as "<slug>.<ext>" with no directory per
// organization, so they are matched by name prefix.
func avatarBytes(orgs []database.OrganizationListItem) int64 {
	dir := filepath.Join(config.App.ReposPath, avatarDir)

	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}

	var total int64

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		base := strings.TrimSuffix(name, filepath.Ext(name))

		for _, org := range orgs {
			if !strings.EqualFold(base, org.Slug) {
				continue
			}

			info, err := entry.Info()
			if err != nil || !info.Mode().IsRegular() {
				continue
			}

			total += info.Size()

			break
		}
	}

	return total
}

// dirSize sums the size of every regular file under root. Symlinks are skipped
// so that a link out of the tree cannot inflate the total or send the walk
// somewhere unexpected.
func dirSize(ctx context.Context, root string) (int64, error) {
	var total int64

	err := filepath.WalkDir(root, func(_ string, entry fs.DirEntry, err error) error {
		if ctxErr := ctx.Err(); ctxErr != nil {
			return ctxErr
		}

		if err != nil {
			// One unreadable entry should not fail the whole measurement.
			if entry != nil && entry.IsDir() {
				return fs.SkipDir
			}

			return nil
		}

		if entry.IsDir() || !entry.Type().IsRegular() {
			return nil
		}

		info, err := entry.Info()
		if err != nil {
			return nil
		}

		total += info.Size()

		return nil
	})

	if err != nil {
		return total, err
	}

	return total, nil
}
