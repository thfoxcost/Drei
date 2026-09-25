package gitrepo

import (
	"backend/internal/config"
	"backend/internal/database"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/plumbing/object"
)

// maxInsightCommits bounds full-history walks so large repositories don't
// time out insight requests. The most recent commits are used.
const maxInsightCommits = 5000

// PulseStats summarizes recent activity on a single branch.
type PulseStats struct {
	Authors       int    `json:"authors"`
	Commits       int    `json:"commits"`
	FilesChanged  int    `json:"filesChanged"`
	Additions     int    `json:"additions"`
	Deletions     int    `json:"deletions"`
	DefaultBranch string `json:"defaultBranch"`
	Start         string `json:"start"`
	End           string `json:"end"`
}

// ContributorDaily is one day bucket in a contributor sparkline.
type ContributorDaily struct {
	Date    string `json:"date"`
	Commits int    `json:"commits"`
}

// InsightContributor aggregates one author's activity.
type InsightContributor struct {
	Username  string             `json:"username"`
	Avatar    *string            `json:"avatar"`
	Initials  string             `json:"initials"`
	Commits   int                `json:"commits"`
	Additions int                `json:"additions"`
	Deletions int                `json:"deletions"`
	Rank      int                `json:"rank"`
	Daily     []ContributorDaily `json:"daily"`
}

// ContributorsInsight is the payload for the contributors page: per-author
// stats plus overall daily commits for the header chart.
type ContributorsInsight struct {
	Contributors []InsightContributor `json:"contributors"`
	Daily        []ContributorDaily   `json:"daily"`
}

// CodeFrequencyWeek is one week bucket of line changes.
type CodeFrequencyWeek struct {
	Week      string `json:"week"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
}

func initialsFor(name string) string {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return "??"
	}
	parts := strings.Fields(trimmed)
	if len(parts) == 1 {
		runes := []rune(parts[0])
		if len(runes) == 1 {
			return strings.ToUpper(string(runes[0]))
		}
		return strings.ToUpper(string(runes[:2]))
	}
	first := []rune(parts[0])[0]
	last := []rune(parts[len(parts)-1])[0]
	return strings.ToUpper(string([]rune{first, last}))
}

func openInsightRepo(owner, repo string) (*git.Repository, error) {
	repoPath := filepath.Join(config.App.ReposPath, owner, repo+".git")
	return git.PlainOpen(repoPath)
}

// GetPulse walks the branch history within the last <days> days and sums
// file changes. Only the window is diffed, so this stays cheap.
func GetPulse(owner, repo, branch string, days int) (*PulseStats, error) {
	if days <= 0 {
		days = 7
	}
	if days > 90 {
		days = 90
	}

	r, err := openInsightRepo(owner, repo)
	if err != nil {
		return nil, err
	}

	head, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, err
	}

	iter, err := r.Log(&git.LogOptions{From: head.Hash})
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	start := now.AddDate(0, 0, -days)
	cutoff := start

	type seenCommit struct {
		name  string
		email string
	}

	var raw []seenCommit
	commitsByHash := map[string]*object.Commit{}

	_ = iter.ForEach(func(c *object.Commit) error {
		when := c.Author.When.UTC()
		if when.Before(cutoff) {
			return nil
		}
		raw = append(raw, seenCommit{name: c.Author.Name, email: c.Author.Email})
		commitsByHash[c.Hash.String()] = c
		return nil
	})

	emails := make([]string, 0, len(raw))
	for _, c := range raw {
		emails = append(emails, c.email)
	}
	usernames, _ := database.ResolveUsernamesByEmails(emails)
	if usernames == nil {
		usernames = map[string]string{}
	}

	authors := map[string]bool{}
	additions := 0
	deletions := 0
	uniqueFiles := map[string]bool{}

	for hash, commit := range commitsByHash {
		_ = hash
		authorKey := strings.ToLower(strings.TrimSpace(commit.Author.Email))
		if u := usernames[authorKey]; u != "" {
			authors[strings.ToLower(u)] = true
		} else {
			authors["name:"+strings.ToLower(strings.TrimSpace(commit.Author.Name))] = true
		}

		changed, add, del, files := computeCommitStats(r, commit)
		_ = changed
		additions += add
		deletions += del
		for _, f := range files {
			uniqueFiles[f.Path] = true
		}
	}

	defaultBranch := branch
	if defaultBranch == "" {
		if head, err := r.Head(); err == nil && head.Name().IsBranch() {
			defaultBranch = head.Name().Short()
		} else {
			defaultBranch = "main"
		}
	}

	return &PulseStats{
		Authors:       len(authors),
		Commits:       len(commitsByHash),
		FilesChanged:  len(uniqueFiles),
		Additions:     additions,
		Deletions:     deletions,
		DefaultBranch: defaultBranch,
		Start:         start.Format("2006-01-02"),
		End:           now.Format("2006-01-02"),
	}, nil
}

// GetContributorsInsight aggregates per-author commits/additions/deletions
// plus daily buckets for sparklines. Only the most recent
// maxInsightCommits commits are scanned.
func GetContributorsInsight(owner, repo, branch string) (*ContributorsInsight, error) {
	r, err := openInsightRepo(owner, repo)
	if err != nil {
		return nil, err
	}

	head, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, err
	}

	iter, err := r.Log(&git.LogOptions{From: head.Hash})
	if err != nil {
		return nil, err
	}

	type agg struct {
		username  string
		email     string
		commits   int
		additions int
		deletions int
		byDay     map[string]int
	}

	now := time.Now().UTC().Truncate(24 * time.Hour)
	windowDays := 30
	windowStart := now.AddDate(0, 0, -(windowDays - 1))

	byKey := map[string]*agg{}
	order := []string{}
	overall := map[string]int{}
	scanned := 0

	// First pass collects author identity without diffing so we can resolve
	// usernames in one DB round trip.
	type entry struct {
		hash  string
		name  string
		email string
		when  time.Time
		c     *object.Commit
	}
	var entries []entry

	_ = iter.ForEach(func(c *object.Commit) error {
		if scanned >= maxInsightCommits {
			return nil
		}
		scanned++
		entries = append(entries, entry{
			hash:  c.Hash.String(),
			name:  c.Author.Name,
			email: c.Author.Email,
			when:  c.Author.When.UTC(),
			c:     c,
		})
		return nil
	})

	emails := make([]string, 0, len(entries))
	for _, e := range entries {
		emails = append(emails, e.email)
	}
	usernames, _ := database.ResolveUsernamesByEmails(emails)
	if usernames == nil {
		usernames = map[string]string{}
	}

	for _, e := range entries {
		username := resolveAuthorName(e.name, e.email, usernames)
		key := normalizeKey(username)
		a, ok := byKey[key]
		if !ok {
			a = &agg{username: username, email: e.email, byDay: map[string]int{}}
			byKey[key] = a
			order = append(order, key)
		}
		a.commits++

		_, add, del, _ := computeCommitStats(r, e.c)
		a.additions += add
		a.deletions += del

		day := e.when.Truncate(24 * time.Hour)
		if !day.Before(windowStart) && !day.After(now) {
			k := day.Format("2006-01-02")
			a.byDay[k]++
			overall[k]++
		}
	}

	contributors := make([]InsightContributor, 0, len(byKey))
	for _, key := range order {
		a := byKey[key]
		daily := make([]ContributorDaily, 0, windowDays)
		for d := windowStart; !d.After(now); d = d.Add(24 * time.Hour) {
			k := d.Format("2006-01-02")
			daily = append(daily, ContributorDaily{Date: k, Commits: a.byDay[k]})
		}

		var avatar *string
		if user, err := database.GetUserByUsername(a.username); err == nil && user != nil {
			avatar = user.Avatar
		}

		contributors = append(contributors, InsightContributor{
			Username:  a.username,
			Avatar:    avatar,
			Initials:  initialsFor(a.username),
			Commits:   a.commits,
			Additions: a.additions,
			Deletions: a.deletions,
			Daily:     daily,
		})
	}

	sort.Slice(contributors, func(i, j int) bool {
		return contributors[i].Commits > contributors[j].Commits
	})
	// Keep the response bounded; the UI renders a card grid.
	if len(contributors) > 12 {
		contributors = contributors[:12]
	}
	for i := range contributors {
		contributors[i].Rank = i + 1
	}

	overallDaily := make([]ContributorDaily, 0, windowDays)
	for d := windowStart; !d.After(now); d = d.Add(24 * time.Hour) {
		k := d.Format("2006-01-02")
		overallDaily = append(overallDaily, ContributorDaily{Date: k, Commits: overall[k]})
	}

	if contributors == nil {
		contributors = []InsightContributor{}
	}

	return &ContributorsInsight{Contributors: contributors, Daily: overallDaily}, nil
}

// GetCodeFrequency buckets additions/deletions by ISO week (Monday start).
func GetCodeFrequency(owner, repo, branch string) ([]CodeFrequencyWeek, error) {
	r, err := openInsightRepo(owner, repo)
	if err != nil {
		return nil, err
	}

	head, err := ResolveBranch(r, branch)
	if err != nil {
		return nil, err
	}

	iter, err := r.Log(&git.LogOptions{From: head.Hash})
	if err != nil {
		return nil, err
	}

	byWeek := map[string]*CodeFrequencyWeek{}
	scanned := 0

	_ = iter.ForEach(func(c *object.Commit) error {
		if scanned >= maxInsightCommits {
			return nil
		}
		scanned++

		when := c.Author.When.UTC()
		// Monday of this week.
		weekday := int(when.Weekday())
		// Convert Sunday(0)..Saturday(6) to Monday-offset 0..6.
		offset := (weekday + 6) % 7
		monday := time.Date(when.Year(), when.Month(), when.Day(), 0, 0, 0, 0, time.UTC).AddDate(0, 0, -offset)
		key := monday.Format("2006-01-02")

		w, ok := byWeek[key]
		if !ok {
			w = &CodeFrequencyWeek{Week: monday.Format("Jan 2")}
			byWeek[key] = w
		}

		_, add, del, _ := computeCommitStats(r, c)
		w.Additions += add
		w.Deletions += del
		return nil
	})

	keys := make([]string, 0, len(byWeek))
	for k := range byWeek {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	weeks := make([]CodeFrequencyWeek, 0, len(keys))
	for _, k := range keys {
		weeks = append(weeks, *byWeek[k])
	}

	// Keep the chart readable; return the most recent 52 weeks.
	if len(weeks) > 52 {
		weeks = weeks[len(weeks)-52:]
	}
	if weeks == nil {
		weeks = []CodeFrequencyWeek{}
	}

	return weeks, nil
}
