package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"net/http"
	"sort"
	"strconv"
	"time"
)

// ContributionDay is the activity of a single calendar day. Value is the
// total; the breakdown fields let the frontend render rich tooltips.
type ContributionDay struct {
	Date         string `json:"date"`
	Value        int    `json:"value"`
	Commits      int    `json:"commits"`
	Issues       int    `json:"issues"`
	PullRequests int    `json:"pullRequests"`
}

// UserContributionsHandler aggregates a user's yearly activity across every
// repository they participate in, GitHub-profile style.
//
//	GET /api/users/{username}/contributions?year=2026
//
// Commits are attributed by author email (falling back to author name),
// issues and pull requests count openings. Only non-zero days are returned;
// the heatmap renders missing days as empty cells. Private repositories
// contribute only when the viewer owns them or collaborates on them.
//
//	@Summary		Get user contributions
//	@Description	Returns per-day activity (commits, opened issues, opened pull requests) for a user and calendar year
//	@Tags			Users
//	@Produce		json
//	@Param			username	path		string	true	"Username"
//	@Param			year		query		int		false	"Calendar year (defaults to current year)"
//	@Success		200			{object}	map[string]interface{}
//	@Failure		400			{object}	map[string]interface{}
//	@Failure		404			{object}	map[string]interface{}
//	@Failure		500			{object}	map[string]interface{}
//	@Router			/users/{username}/contributions [get]
func UserContributionsHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	username := r.PathValue("username")
	if username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	year := time.Now().UTC().Year()
	if raw := r.URL.Query().Get("year"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1970 || parsed > 2100 {
			writeError(w, http.StatusBadRequest, "invalid year")
			return
		}
		year = parsed
	}

	ident, err := database.GetContributionIdentity(username)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	start := time.Date(year, time.January, 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(1, 0, 0)

	// The viewer decides which private repositories count. Anonymous viewers
	// and unrelated users only see activity from public repositories.
	viewer, _ := authenticate(r)

	commitsByDay := map[string]int{}
	issuesByDay := map[string]int{}
	pullsByDay := map[string]int{}

	if repos, err := database.ListContributionRepos(ident.ID, ident.Username); err == nil {
		for _, repo := range repos {
			if !repo.Visibility {
				allowed := viewer != nil && viewer.ID == ident.ID
				if !allowed && viewer != nil {
					if contributor, err := database.IsRepoContributor(repo.Owner, repo.Name, viewer.ID, viewer.Name); err == nil && contributor {
						allowed = true
					}
				}
				if !allowed {
					continue
				}
			}

			if days, err := gitrepo.CountUserCommitsByDay(repo.Owner, repo.Name, ident.Username, ident.Email, start, end); err == nil {
				for day, n := range days {
					commitsByDay[day] += n
				}
			}
		}
	}

	if days, err := database.CountIssuesOpenedByDay(ident.ID, start, end); err == nil {
		for day, n := range days {
			issuesByDay[day] += n
		}
	}

	if days, err := database.CountPullRequestsOpenedByDay(ident.ID, start, end); err == nil {
		for day, n := range days {
			pullsByDay[day] += n
		}
	}

	union := map[string]struct{}{}
	for day := range commitsByDay {
		union[day] = struct{}{}
	}
	for day := range issuesByDay {
		union[day] = struct{}{}
	}
	for day := range pullsByDay {
		union[day] = struct{}{}
	}

	contributions := make([]ContributionDay, 0, len(union))
	total := 0
	commitTotal := 0
	issueTotal := 0
	pullTotal := 0

	for day := range union {
		entry := ContributionDay{
			Date:         day,
			Commits:      commitsByDay[day],
			Issues:       issuesByDay[day],
			PullRequests: pullsByDay[day],
		}
		entry.Value = entry.Commits + entry.Issues + entry.PullRequests

		contributions = append(contributions, entry)
		total += entry.Value
		commitTotal += entry.Commits
		issueTotal += entry.Issues
		pullTotal += entry.PullRequests
	}

	sort.Slice(contributions, func(i, j int) bool {
		return contributions[i].Date < contributions[j].Date
	})

	writeSuccess(w, map[string]any{
		"username":      ident.Username,
		"year":          year,
		"total":         total,
		"breakdown":     map[string]any{"commits": commitTotal, "issues": issueTotal, "pullRequests": pullTotal},
		"contributions": contributions,
	})
}
