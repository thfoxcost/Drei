// Package discord delivers repository webhook notifications to Discord.
//
// It is intentionally separate from the personal webhook code in
// internal/handlers/notifications.go: repository webhooks belong to a
// repository (not a user) and carry their own validation, timeout and
// masking rules. Failures are reported as errors and logged without ever
// including the webhook URL.
package discord

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SendTimeout bounds a single Discord delivery attempt. Delivery runs
// asynchronously from the triggering request, so a slow Discord must never
// hold the API response open.
const SendTimeout = 8 * time.Second

// EmbedColor is the shared accent color of every repository notification.
const EmbedColor = 5814783

// discordHosts are the only hosts accepted when a webhook URL is saved.
// Restricting to Discord prevents the stored URL from being abused for SSRF.
var discordHosts = map[string]bool{
	"discord.com":        true,
	"discordapp.com":     true,
	"ptb.discord.com":    true,
	"canary.discord.com": true,
}

// Embed is a single Discord rich-embed message.
type Embed struct {
	Title       string
	Description string
	URL         string
}

// NormalizeWebhookURL validates a user-supplied webhook URL and returns its
// canonical https form. Only Discord webhook URLs are accepted.
func NormalizeWebhookURL(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", errors.New("webhook URL is required")
	}

	if !strings.Contains(trimmed, "://") {
		trimmed = "https://" + trimmed
	}

	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Host == "" {
		return "", errors.New("invalid webhook URL")
	}

	if !strings.EqualFold(parsed.Scheme, "https") {
		return "", errors.New("webhook URL must use https")
	}

	if !discordHosts[strings.ToLower(parsed.Hostname())] {
		return "", errors.New("webhook URL must be a Discord webhook URL")
	}

	if !strings.HasPrefix(parsed.Path, "/api/webhooks/") {
		return "", errors.New("webhook URL must be a Discord webhook URL")
	}

	parsed.Scheme = "https"

	return parsed.String(), nil
}

// EncodeWebhookURL stores a normalized URL the same way the personal
// webhooks table does: Base64 of the URL without the scheme.
func EncodeWebhookURL(normalized string) string {
	bare := normalized
	for strings.HasPrefix(bare, "https://") || strings.HasPrefix(bare, "http://") {
		bare = strings.TrimPrefix(bare, "https://")
		bare = strings.TrimPrefix(bare, "http://")
	}

	return base64.StdEncoding.EncodeToString([]byte(bare))
}

// DecodeWebhookURL reverses EncodeWebhookURL and re-validates the result so
// a tampered or stale stored value can never be delivered to a non-Discord
// host.
func DecodeWebhookURL(encoded string) (string, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(encoded))
	if err != nil {
		return "", errors.New("stored webhook URL is invalid")
	}

	return NormalizeWebhookURL(string(raw))
}

// MaskedURL returns a display-safe representation of a stored webhook URL.
// It never contains enough of the value to reconstruct it.
func MaskedURL(encoded string) string {
	trimmed := strings.TrimSpace(encoded)
	if len(trimmed) <= 8 {
		return "***"
	}

	return "***" + trimmed[len(trimmed)-6:]
}

// Truncate shortens s to at most n runes, appending an ellipsis when it was
// longer, so notification bodies stay compact.
func Truncate(s string, n int) string {
	runes := []rune(strings.TrimSpace(s))
	if len(runes) <= n {
		return string(runes)
	}

	return string(runes[:n]) + "…"
}

// Send delivers a single embed to a normalized Discord webhook URL. The
// caller supplies the context (including timeout); the URL never appears in
// returned errors.
func Send(ctx context.Context, webhookURL string, embed Embed) error {
	fields := map[string]any{
		"title":       embed.Title,
		"description": embed.Description,
		"color":       EmbedColor,
	}

	if strings.TrimSpace(embed.URL) != "" {
		fields["url"] = embed.URL
	}

	payload := map[string]any{
		"embeds": []map[string]any{fields},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to encode Discord notification: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to build Discord request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: SendTimeout}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Discord delivery failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("Discord delivery failed with status %d", resp.StatusCode)
	}

	return nil
}

// SendAsync decodes the stored webhook URL and delivers the embed in the
// background. It never blocks the caller, never retries, and never logs the
// webhook URL.
func SendAsync(encodedURL string, embed Embed) {
	go func() {
		webhookURL, err := DecodeWebhookURL(encodedURL)
		if err != nil {
			log.Printf("[discord] skipping notification: %v", err)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), SendTimeout)
		defer cancel()

		if err := Send(ctx, webhookURL, embed); err != nil {
			log.Printf("[discord] delivery failed: %v", err)
		}
	}()
}
