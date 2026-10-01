package test

import (
	"backend/internal/database"
	"backend/internal/discord"
	"backend/internal/handlers"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const (
	ownerCookie = "session=test-session"
	otherCookie = "session=test-session-2"
	testHookURL = "https://discord.com/api/webhooks/123456/test-token-value"
)

type discordCall struct {
	event string
	embed discord.Embed
}

// captureDiscord replaces the async sender with a synchronous recorder for
// the duration of a test and returns the recorded calls.
func captureDiscord(t *testing.T) *[]discordCall {
	t.Helper()

	calls := &[]discordCall{}
	previous := handlers.RepoDiscordSend
	handlers.RepoDiscordSend = func(encodedURL, event string, embed discord.Embed) {
		*calls = append(*calls, discordCall{event: event, embed: embed})
	}
	t.Cleanup(func() { handlers.RepoDiscordSend = previous })

	return calls
}

// callHandler invokes a handler directly with route path values set,
// bypassing the shared mux.
func callHandler(h http.HandlerFunc, method string, params map[string]string, body, cookie string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "/test", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")

	if cookie != "" {
		r.Header.Set("Cookie", cookie)
	}

	for k, v := range params {
		r.SetPathValue(k, v)
	}

	w := httptest.NewRecorder()
	h(w, r)

	return w
}

func repoParams(extra map[string]string) map[string]string {
	params := map[string]string{"owner": "testowner", "repo": "testrepo"}
	for k, v := range extra {
		params[k] = v
	}

	return params
}

// setRepoDiscord writes a config row directly, bypassing URL validation so
// tests can point delivery at local httptest servers.
func setRepoDiscord(t *testing.T, encodedURL string, pr, issue bool) {
	t.Helper()

	_, err := database.DB.Exec(context.Background(),
		`INSERT INTO repo_discord_configs (repo_id, encoded_url, pr_notifications, issue_notifications)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (repo_id) DO UPDATE SET
			encoded_url = EXCLUDED.encoded_url,
			pr_notifications = EXCLUDED.pr_notifications,
			issue_notifications = EXCLUDED.issue_notifications,
			updated_at = NOW()`,
		testRepoID, encodedURL, pr, issue,
	)
	if err != nil {
		t.Fatalf("set repo discord config: %v", err)
	}
}

func clearRepoDiscord(t *testing.T) {
	t.Helper()

	if err := database.DeleteRepoDiscordConfig(testRepoID); err != nil {
		t.Fatalf("clear repo discord config: %v", err)
	}
}

func createPR(t *testing.T, cookie string) int {
	t.Helper()

	w := callHandler(handlers.PullsHandler, http.MethodPost, repoParams(nil),
		`{"title":"Notify PR","description":"notify body","sourceBranch":"feature-branch","targetBranch":"main"}`, cookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("create PR: status %d, body: %s", w.Code, w.Body.String())
	}

	var result map[string]any
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode PR: %v", err)
	}

	return int(result["number"].(float64))
}

func createIssue(t *testing.T, cookie string) int {
	t.Helper()

	w := callHandler(handlers.IssuesHandler, http.MethodPost, repoParams(nil),
		`{"title":"Notify issue","description":"notify issue body"}`, cookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("create issue: status %d, body: %s", w.Code, w.Body.String())
	}

	var result map[string]any
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("decode issue: %v", err)
	}

	return int(result["number"].(float64))
}

func eventsOf(calls []discordCall, event string) []discordCall {
	var out []discordCall
	for _, c := range calls {
		if c.event == event {
			out = append(out, c)
		}
	}

	return out
}

func TestDiscordValidateWebhookURL(t *testing.T) {
	normalized, err := discord.NormalizeWebhookURL("https://discord.com/api/webhooks/123/abc")
	if err != nil {
		t.Fatalf("valid URL rejected: %v", err)
	}

	if !strings.HasPrefix(normalized, "https://discord.com/api/webhooks/") {
		t.Fatalf("unexpected normalized URL: %s", normalized)
	}

	for _, raw := range []string{
		"",
		"not a url",
		"ftp://discord.com/api/webhooks/123/abc",
		"http://discord.com/api/webhooks/123/abc",
		"https://evil.example.com/api/webhooks/123/abc",
		"https://discord.com/something-else",
		"https://discord.com.evil.example.com/api/webhooks/123/abc",
	} {
		if _, err := discord.NormalizeWebhookURL(raw); err == nil {
			t.Fatalf("invalid URL accepted: %q", raw)
		}
	}
}

func TestDiscordMaskedURL(t *testing.T) {
	full := discord.EncodeWebhookURL("https://discord.com/api/webhooks/123/secret-token")
	masked := discord.MaskedURL(full)

	if masked == full || strings.Contains(masked, "secret-token") {
		t.Fatalf("masked URL leaks the webhook URL: %s", masked)
	}
}

func TestDiscordSend(t *testing.T) {
	var got map[string]any

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		json.Unmarshal(body, &got)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	err := discord.Send(context.Background(), server.URL, discord.Embed{
		Title:       "PR #1 opened",
		Description: "body",
		URL:         "http://localhost:3000/o/r/pulls/1",
	})
	if err != nil {
		t.Fatalf("send: %v", err)
	}

	embeds, ok := got["embeds"].([]any)
	if !ok || len(embeds) != 1 {
		t.Fatalf("unexpected payload: %v", got)
	}

	embed, _ := embeds[0].(map[string]any)
	if embed["title"] != "PR #1 opened" || embed["url"] != "http://localhost:3000/o/r/pulls/1" {
		t.Fatalf("unexpected embed: %v", embed)
	}

	if _, ok := embed["color"]; !ok {
		t.Fatalf("embed missing color: %v", embed)
	}
}

func TestDiscordSendFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	if err := discord.Send(context.Background(), server.URL, discord.Embed{Title: "x"}); err == nil {
		t.Fatal("expected error for non-2xx response")
	}
}

func TestDiscordSendTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(300 * time.Millisecond)
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	start := time.Now()
	err := discord.Send(ctx, server.URL, discord.Embed{Title: "x"})
	elapsed := time.Since(start)

	if err == nil {
		t.Fatal("expected timeout error")
	}

	if elapsed > 5*time.Second {
		t.Fatalf("delivery did not respect the timeout: %v", elapsed)
	}
}

func TestDiscordSendAsyncNeverBlocks(t *testing.T) {
	start := time.Now()
	// Unroutable address: delivery fails in the background while the caller
	// continues immediately.
	discord.SendAsync(discord.EncodeWebhookURL("https://discord.com/api/webhooks/1/x"), discord.Embed{Title: "x"})

	if elapsed := time.Since(start); elapsed > 2*time.Second {
		t.Fatalf("SendAsync blocked the caller: %v", elapsed)
	}
}

func TestRepoDiscordConfigAPI(t *testing.T) {
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	// Unauthenticated read is rejected.
	w := callHandler(handlers.RepoDiscordHandler, http.MethodGet, repoParams(nil), "", "")
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("unauthenticated GET: status %d", w.Code)
	}

	// Unknown repository is a 404.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodGet,
		map[string]string{"owner": "testowner", "repo": "nosuchrepo"}, "", ownerCookie)
	if w.Code != http.StatusNotFound {
		t.Fatalf("unknown repo GET: status %d", w.Code)
	}

	// Non-owner cannot configure.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodPut, repoParams(nil),
		fmt.Sprintf(`{"url":%q,"pr_notifications":true}`, testHookURL), otherCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("non-owner PUT: status %d, body: %s", w.Code, w.Body.String())
	}

	// Invalid webhook URLs are rejected.
	for _, raw := range []string{"", "https://evil.example.com/hook", "ftp://discord.com/api/webhooks/1/x"} {
		w = callHandler(handlers.RepoDiscordHandler, http.MethodPut, repoParams(nil),
			fmt.Sprintf(`{"url":%q}`, raw), ownerCookie)
		if w.Code != http.StatusBadRequest {
			t.Fatalf("invalid URL %q: status %d", raw, w.Code)
		}
	}

	// Creating without a URL is rejected.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodPut, repoParams(nil),
		`{"pr_notifications":true}`, ownerCookie)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("missing URL PUT: status %d", w.Code)
	}

	// Owner creates the configuration; toggles default to OFF.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodPut, repoParams(nil),
		fmt.Sprintf(`{"url":%q}`, testHookURL), ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("create PUT: status %d, body: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	if strings.Contains(body, "test-token-value") {
		t.Fatalf("response leaks the full webhook URL: %s", body)
	}

	var created map[string]any
	if err := json.Unmarshal([]byte(body), &created); err != nil {
		t.Fatalf("decode created config: %v", err)
	}

	if created["configured"] != true || created["pr_notifications"] != false || created["issue_notifications"] != false {
		t.Fatalf("unexpected created config: %v", created)
	}

	if masked, _ := created["masked_url"].(string); masked == "" || masked == "<nil>" {
		t.Fatalf("expected a masked URL, got: %v", created["masked_url"])
	}

	// Toggles update without resending the URL.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodPut, repoParams(nil),
		`{"pr_notifications":true,"issue_notifications":true}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("toggle PUT: status %d, body: %s", w.Code, w.Body.String())
	}

	var updated map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode updated config: %v", err)
	}

	if updated["pr_notifications"] != true || updated["issue_notifications"] != true {
		t.Fatalf("toggles not updated: %v", updated)
	}

	// Read back is masked and never contains the full URL.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodGet, repoParams(nil), "", ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("GET: status %d", w.Code)
	}

	if strings.Contains(w.Body.String(), "test-token-value") {
		t.Fatalf("GET leaks the full webhook URL: %s", w.Body.String())
	}

	// Delete removes the configuration.
	w = callHandler(handlers.RepoDiscordHandler, http.MethodDelete, repoParams(nil), "", ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("DELETE: status %d", w.Code)
	}

	w = callHandler(handlers.RepoDiscordHandler, http.MethodGet, repoParams(nil), "", ownerCookie)
	var after map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &after); err != nil {
		t.Fatalf("decode config after delete: %v", err)
	}

	if after["configured"] != false {
		t.Fatalf("expected unconfigured after delete: %v", after)
	}
}

func TestRepoDiscordPROpened(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	// Toggle OFF: nothing is sent.
	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), false, false)
	createPR(t, ownerCookie)

	if len(*calls) != 0 {
		t.Fatalf("expected no notification with PR toggle OFF, got %+v", *calls)
	}

	// Toggle ON: PR opened notifies.
	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), true, false)
	createPR(t, ownerCookie)

	opened := eventsOf(*calls, "pr_opened")
	if len(opened) != 1 {
		t.Fatalf("expected one pr_opened notification, got %+v", *calls)
	}

	if !strings.Contains(opened[0].embed.Title, "opened in testowner/testrepo") {
		t.Fatalf("unexpected embed title: %s", opened[0].embed.Title)
	}

	if !strings.Contains(opened[0].embed.URL, "/testowner/testrepo/pulls/") {
		t.Fatalf("embed missing PR link: %s", opened[0].embed.URL)
	}
}

func TestRepoDiscordPRComment(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	addContributor(t, testUser2.ID, testUser2.Username)

	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), true, false)
	number := createPR(t, ownerCookie)
	params := repoParams(map[string]string{"number": fmt.Sprint(number)})
	*calls = nil // drop the pr_opened fixture notification

	// Author commenting on their own PR: suppressed.
	w := callHandler(handlers.PullCommentsHandler, http.MethodPost, params,
		`{"body":"my own comment"}`, ownerCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("author comment: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(eventsOf(*calls, "pr_comment")) != 0 {
		t.Fatalf("author self-comment must not notify, got %+v", *calls)
	}

	// Another contributor commenting: notified.
	w = callHandler(handlers.PullCommentsHandler, http.MethodPost, params,
		`{"body":"looks good to me"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("other comment: status %d, body: %s", w.Code, w.Body.String())
	}

	comments := eventsOf(*calls, "pr_comment")
	if len(comments) != 1 {
		t.Fatalf("expected one pr_comment notification, got %+v", *calls)
	}

	if !strings.Contains(comments[0].embed.Description, "looks good to me") {
		t.Fatalf("embed missing comment body: %s", comments[0].embed.Description)
	}
}

func TestRepoDiscordPRReview(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	addContributor(t, testUser2.ID, testUser2.Username)

	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), true, false)
	number := createPR(t, ownerCookie)
	params := repoParams(map[string]string{"number": fmt.Sprint(number)})
	*calls = nil // drop the pr_opened fixture notification

	// Plain comment reviews do not notify.
	w := callHandler(handlers.PullReviewsHandler, http.MethodPost, params,
		`{"state":"comment","body":"just a note"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("comment review: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(*calls) != 0 {
		t.Fatalf("comment-state review must not notify, got %+v", *calls)
	}

	// Approval by another contributor notifies.
	w = callHandler(handlers.PullReviewsHandler, http.MethodPost, params,
		`{"state":"approved","body":"ship it"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("approve: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(eventsOf(*calls, "pr_approved")) != 1 {
		t.Fatalf("expected one pr_approved notification, got %+v", *calls)
	}

	// Changes requested by another contributor notifies.
	w = callHandler(handlers.PullReviewsHandler, http.MethodPost, params,
		`{"state":"changes_requested","body":"fix the tests"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("request changes: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(eventsOf(*calls, "pr_changes_requested")) != 1 {
		t.Fatalf("expected one pr_changes_requested notification, got %+v", *calls)
	}

	// The author cannot approve their own PR, and nothing notifies.
	before := len(*calls)
	w = callHandler(handlers.PullReviewsHandler, http.MethodPost, params,
		`{"state":"approved","body":"self approval"}`, ownerCookie)
	if w.Code != http.StatusForbidden {
		t.Fatalf("self approval: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(*calls) != before {
		t.Fatalf("self approval must not notify, got %+v", *calls)
	}
}

func TestRepoDiscordIssueOpened(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	// Toggle OFF: nothing is sent.
	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), false, false)
	createIssue(t, ownerCookie)

	if len(*calls) != 0 {
		t.Fatalf("expected no notification with issue toggle OFF, got %+v", *calls)
	}

	// Toggle ON: issue opened notifies.
	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), false, true)
	createIssue(t, ownerCookie)

	opened := eventsOf(*calls, "issue_opened")
	if len(opened) != 1 {
		t.Fatalf("expected one issue_opened notification, got %+v", *calls)
	}

	if !strings.Contains(opened[0].embed.Title, "opened in testowner/testrepo") {
		t.Fatalf("unexpected embed title: %s", opened[0].embed.Title)
	}

	if !strings.Contains(opened[0].embed.URL, "/testowner/testrepo/issues/") {
		t.Fatalf("embed missing issue link: %s", opened[0].embed.URL)
	}
}

func TestRepoDiscordIssueComment(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	addContributor(t, testUser2.ID, testUser2.Username)

	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), false, true)
	number := createIssue(t, ownerCookie)
	params := repoParams(map[string]string{"number": fmt.Sprint(number)})
	*calls = nil // drop the issue_opened fixture notification

	// Author commenting on their own issue: suppressed.
	w := callHandler(handlers.IssueCommentsHandler, http.MethodPost, params,
		`{"body":"my own note"}`, ownerCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("author comment: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(eventsOf(*calls, "issue_comment")) != 0 {
		t.Fatalf("author self-comment must not notify, got %+v", *calls)
	}

	// Another contributor commenting: notified.
	w = callHandler(handlers.IssueCommentsHandler, http.MethodPost, params,
		`{"body":"reproduced here"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("other comment: status %d, body: %s", w.Code, w.Body.String())
	}

	comments := eventsOf(*calls, "issue_comment")
	if len(comments) != 1 {
		t.Fatalf("expected one issue_comment notification, got %+v", *calls)
	}

	if !strings.Contains(comments[0].embed.Description, "reproduced here") {
		t.Fatalf("embed missing comment body: %s", comments[0].embed.Description)
	}
}

func TestRepoDiscordContributorAdded(t *testing.T) {
	calls := captureDiscord(t)
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	// Contributor notifications ignore both toggles.
	setRepoDiscord(t, discord.EncodeWebhookURL(testHookURL), false, false)

	// Start from a clean slate: earlier tests may have added this user.
	w := callHandler(handlers.CollaboratorsHandler, http.MethodDelete, repoParams(nil),
		`{"username":"testuser2"}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("remove contributor: status %d, body: %s", w.Code, w.Body.String())
	}

	*calls = nil

	w = callHandler(handlers.CollaboratorsHandler, http.MethodPost, repoParams(nil),
		`{"id":"test-user-2-id","username":"testuser2"}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("add contributor: status %d, body: %s", w.Code, w.Body.String())
	}

	added := eventsOf(*calls, "contributor_added")
	if len(added) != 1 {
		t.Fatalf("expected one contributor_added notification, got %+v", *calls)
	}

	if !strings.Contains(added[0].embed.Title, "testuser2") || !strings.Contains(added[0].embed.Title, "testowner/testrepo") {
		t.Fatalf("embed missing contributor info: %s", added[0].embed.Title)
	}

	// Re-adding the same contributor is a no-op and must not notify again.
	w = callHandler(handlers.CollaboratorsHandler, http.MethodPost, repoParams(nil),
		`{"id":"test-user-2-id","username":"testuser2"}`, ownerCookie)
	if w.Code != http.StatusOK {
		t.Fatalf("duplicate add: status %d, body: %s", w.Code, w.Body.String())
	}

	if len(eventsOf(*calls, "contributor_added")) != 1 {
		t.Fatalf("duplicate add must not notify again, got %+v", *calls)
	}
}

func TestRepoDiscordDeliveryFailureKeepsRequestGreen(t *testing.T) {
	clearRepoDiscord(t)
	defer clearRepoDiscord(t)

	addContributor(t, testUser2.ID, testUser2.Username)

	// Garbage stored URL: the async delivery fails in the background while
	// the triggering request still succeeds.
	setRepoDiscord(t, "!!!not-base64!!!", true, false)
	number := createPR(t, ownerCookie)

	w := callHandler(handlers.PullCommentsHandler, http.MethodPost,
		repoParams(map[string]string{"number": fmt.Sprint(number)}),
		`{"body":"comment despite broken webhook"}`, otherCookie)
	if w.Code != http.StatusCreated {
		t.Fatalf("comment with broken webhook: status %d, body: %s", w.Code, w.Body.String())
	}
}
