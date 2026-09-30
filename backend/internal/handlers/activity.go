package handlers

import (
	"backend/internal/database"
	"backend/internal/gitrepo"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

// maxActivityRepos bounds the git history fan-out per request; each repo walk
// is capped separately, so the worst case stays cheap.
const maxActivityRepos = 30

// maxPushesPerRepo bounds the commits read from a single repository.
const maxPushesPerRepo = 10

// ActivityHandler serves the home-page network feed: the viewer's own plus
// relevant activity on repositories they own, collaborate on, or access via
// organization membership, newest first with server-side pagination.
//
//	GET /api/activity?page=1&limit=8
//
// Authentication is required; anonymous requests get 401. Only repositories
// the viewer participates in contribute events, so private repositories never
// leak to outsiders. Pushes come from git history (any author on those repos);
// issue/PR events come from the database.
//
//	@Summary		Get activity feed
//	@Description	Returns the signed-in user's network activity feed (repo creations, forks, issues, pull requests, approvals, pushes), newest first with pagination
//	@Tags			Activity
//	@Produce		json
//	@Param			page	query		int	false	"Page number (defaults to 1)"
//	@Param			limit	query		int	false	"Items per page (defaults to 8, max 50)"
//	@Success		200		{object}	map[string]interface{}
//	@Failure		400		{object}	map[string]interface{}
//	@Failure		401		{object}	map[string]interface{}
//	@Failure		500		{object}	map[string]interface{}
//	@Router			/activity [get]
func ActivityHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	// The feed is scoped to the session cookie: forbid any caching so one
	// user's response is never served to another (e.g. after switching users).
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Add("Vary", "Cookie")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	viewer, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "authentication_required", "authentication required")
		return
	}

	page := 1
	if raw := r.URL.Query().Get("page"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_page", "invalid page")
			return
		}
		page = parsed
	}

	limit := 8
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 50 {
			writeErrorCoded(w, http.StatusBadRequest, "invalid_limit", "invalid limit")
			return
		}
		limit = parsed
	}

	repos, err := database.ListActivityRepos(viewer.ID, maxActivityRepos)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	items := []database.ActivityItem{}

	if dbItems, err := database.ListRepoActivityEvents(repos); err == nil {
		items = append(items, dbItems...)
	}

	if len(repos) > 0 {
		scopeIDs := make([]int64, 0, len(repos))
		for _, repo := range repos {
			scopeIDs = append(scopeIDs, repo.ID)
		}

		if authored, err := database.ListAuthoredActivityElsewhere(viewer.ID, scopeIDs); err == nil {
			items = append(items, authored...)
		}
	}

	if pushes, err := collectPushActivity(repos); err == nil {
		items = append(items, pushes...)
	}

	// Sort newest first. IDs are unique across sources, so the type/ID
	// tie-break makes the order total and therefore stable across requests;
	// without it, items sharing a timestamp (second precision) shuffle
	// between pages and appear duplicated or go missing.
	sort.Slice(items, func(i, j int) bool {
		ti := parseActivityTime(items[i].CreatedAt)
		tj := parseActivityTime(items[j].CreatedAt)
		if !ti.Equal(tj) {
			return ti.After(tj)
		}
		if items[i].Type != items[j].Type {
			return items[i].Type < items[j].Type
		}
		return items[i].ID < items[j].ID
	})

	total := len(items)
	totalPages := 1
	if total > 0 {
		totalPages = (total + limit - 1) / limit
	}
	if page > totalPages {
		page = totalPages
	}

	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	paged := items[start:end]
	if paged == nil {
		paged = []database.ActivityItem{}
	}

	writeSuccess(w, map[string]any{
		"items":      paged,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": totalPages,
	})
}

// collectPushActivity walks the git history of each in-scope repository and
// converts recent commits to push feed entries, resolving commit authors to
// registered users by email (falling back to the git author name).
func collectPushActivity(repos []database.ActivityRepoScope) ([]database.ActivityItem, error) {
	type pendingPush struct {
		repo database.ActivityRepoScope
		push gitrepo.RecentPush
	}

	var pending []pendingPush
	emails := []string{}

	for _, repo := range repos {
		pushes, err := gitrepo.RecentPushes(repo.Owner, repo.Name, maxPushesPerRepo)
		if err != nil || len(pushes) == 0 {
			continue
		}

		for _, push := range pushes {
			pending = append(pending, pendingPush{repo: repo, push: push})
			if email := strings.TrimSpace(push.AuthorEmail); email != "" {
				emails = append(emails, email)
			}
		}
	}

	if len(pending) == 0 {
		return []database.ActivityItem{}, nil
	}

	usernames, err := database.ResolveUsernamesByEmails(emails)
	if err != nil {
		usernames = map[string]string{}
	}

	names := make([]string, 0, len(usernames))
	for _, username := range usernames {
		names = append(names, username)
	}

	actors, err := database.ResolveActivityActorsByName(names)
	if err != nil {
		actors = map[string]database.ActivityActor{}
	}

	items := make([]database.ActivityItem, 0, len(pending))

	for _, p := range pending {
		email := strings.ToLower(strings.TrimSpace(p.push.AuthorEmail))
		username := usernames[email]

		actor := database.ActivityActor{Username: p.push.AuthorName}
		if username != "" {
			if resolved, ok := actors[strings.ToLower(username)]; ok {
				actor = resolved
			} else {
				actor = database.ActivityActor{Username: username}
			}
		}

		items = append(items, database.ActivityItem{
			ID:        "push-" + p.push.Hash,
			Type:      database.ActivityPush,
			Actor:     actor,
			Repo:      database.ActivityRepo{Owner: p.repo.Owner, Name: p.repo.Name},
			Sha:       p.push.Hash,
			Message:   p.push.Message,
			CreatedAt: p.push.Date.Format(time.RFC3339),
		})
	}

	return items, nil
}

func parseActivityTime(raw string) time.Time {
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return t
	}
	return time.Time{}
}
