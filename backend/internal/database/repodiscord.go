package database

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

// RepoDiscordConfig is the repository-owned Discord webhook configuration.
// EncodedURL holds the Base64-encoded webhook URL (same convention as the
// personal webhooks table) and must never be serialized to API responses;
// callers expose only a masked representation. Both notification toggles
// default to FALSE.
type RepoDiscordConfig struct {
	RepoID             int64  `json:"repo_id"`
	EncodedURL         string `json:"-"`
	PRNotifications    bool   `json:"pr_notifications"`
	IssueNotifications bool   `json:"issue_notifications"`
	CreatedAt          string `json:"created_at"`
	UpdatedAt          string `json:"updated_at"`
}

func scanRepoDiscordConfig(row pgx.Row) (*RepoDiscordConfig, error) {
	var cfg RepoDiscordConfig
	var createdAt, updatedAt time.Time

	err := row.Scan(
		&cfg.RepoID,
		&cfg.EncodedURL,
		&cfg.PRNotifications,
		&cfg.IssueNotifications,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	cfg.CreatedAt = createdAt.Format(time.RFC3339)
	cfg.UpdatedAt = updatedAt.Format(time.RFC3339)

	return &cfg, nil
}

// GetRepoDiscordConfig returns the Discord configuration of a repository, or
// nil when the repository has none configured.
func GetRepoDiscordConfig(repoID int64) (*RepoDiscordConfig, error) {
	return scanRepoDiscordConfig(DB.QueryRow(
		context.Background(),
		`SELECT repo_id, encoded_url, pr_notifications, issue_notifications, created_at, updated_at
		 FROM repo_discord_configs
		 WHERE repo_id = $1`,
		repoID,
	))
}

// UpsertRepoDiscordConfig creates or updates the Discord configuration of a
// repository. Nil arguments keep the existing value; a nil encodedURL on a
// repository without configuration is an error.
func UpsertRepoDiscordConfig(repoID int64, encodedURL *string, prNotifications, issueNotifications *bool) (*RepoDiscordConfig, error) {
	existing, err := GetRepoDiscordConfig(repoID)
	if err != nil {
		return nil, err
	}

	url := ""
	pr := false
	issue := false

	if existing != nil {
		url = existing.EncodedURL
		pr = existing.PRNotifications
		issue = existing.IssueNotifications
	}

	if encodedURL != nil {
		url = *encodedURL
	}

	if prNotifications != nil {
		pr = *prNotifications
	}

	if issueNotifications != nil {
		issue = *issueNotifications
	}

	if url == "" {
		return nil, errors.New("webhook URL is required")
	}

	return scanRepoDiscordConfig(DB.QueryRow(
		context.Background(),
		`INSERT INTO repo_discord_configs (repo_id, encoded_url, pr_notifications, issue_notifications)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (repo_id) DO UPDATE SET
			encoded_url = EXCLUDED.encoded_url,
			pr_notifications = EXCLUDED.pr_notifications,
			issue_notifications = EXCLUDED.issue_notifications,
			updated_at = NOW()
		 RETURNING repo_id, encoded_url, pr_notifications, issue_notifications, created_at, updated_at`,
		repoID,
		url,
		pr,
		issue,
	))
}

// DeleteRepoDiscordConfig removes the Discord configuration of a repository.
// Deleting a configuration that does not exist is a no-op.
func DeleteRepoDiscordConfig(repoID int64) error {
	_, err := DB.Exec(
		context.Background(),
		`DELETE FROM repo_discord_configs WHERE repo_id = $1`,
		repoID,
	)

	return err
}
