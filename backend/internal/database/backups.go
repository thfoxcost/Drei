package database

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

// BackupInfo describes the single retained snapshot of a repository.
// Retention is 1: at most one row exists per repository.
type BackupInfo struct {
	ID         int64
	RepoID     int64
	FilePath   string
	CommitHash string
	SizeBytes  int64
	CreatedAt  time.Time
}

// SetBackupEnabled flips the per-repository backup opt-in flag.
func SetBackupEnabled(owner, name string, enabled bool) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repositories
		SET backup_enabled = $3, updated_at = NOW()
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
		enabled,
	)

	return err
}

// IsBackupEnabled reports whether backups are enabled for a repository.
func IsBackupEnabled(owner, name string) (bool, error) {
	var enabled bool

	err := DB.QueryRow(
		context.Background(),
		`SELECT backup_enabled FROM repositories
		WHERE lower(owner) = lower($1) AND lower(name) = lower($2)`,
		owner,
		name,
	).Scan(&enabled)

	return enabled, err
}

// UpsertBackup records the snapshot after its file has been atomically
// installed on disk. Callers must only invoke this once the verified bundle
// has replaced the previous backup.
func UpsertBackup(repoID int64, filePath, commitHash string, sizeBytes int64) (*BackupInfo, error) {
	var info BackupInfo

	err := DB.QueryRow(
		context.Background(),
		`INSERT INTO repository_backups (repo_id, file_path, commit_hash, size_bytes)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (repo_id) DO UPDATE SET
			file_path = EXCLUDED.file_path,
			commit_hash = EXCLUDED.commit_hash,
			size_bytes = EXCLUDED.size_bytes,
			created_at = NOW()
		RETURNING id, repo_id, file_path, commit_hash, size_bytes, created_at`,
		repoID,
		filePath,
		commitHash,
		sizeBytes,
	).Scan(
		&info.ID,
		&info.RepoID,
		&info.FilePath,
		&info.CommitHash,
		&info.SizeBytes,
		&info.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &info, nil
}

// UpdateBackupPath points the retained snapshot at a new file location after
// a repository rename. It is a no-op when the repository has no backup row.
func UpdateBackupPath(repoID int64, filePath string) error {
	_, err := DB.Exec(
		context.Background(),
		`UPDATE repository_backups
		SET file_path = $2
		WHERE repo_id = $1`,
		repoID,
		filePath,
	)

	return err
}

// GetLatestBackup returns the retained snapshot for a repository, or
// (nil, nil) when no backup exists yet.
func GetLatestBackup(repoID int64) (*BackupInfo, error) {
	var info BackupInfo

	err := DB.QueryRow(
		context.Background(),
		`SELECT id, repo_id, file_path, commit_hash, size_bytes, created_at
		FROM repository_backups
		WHERE repo_id = $1`,
		repoID,
	).Scan(
		&info.ID,
		&info.RepoID,
		&info.FilePath,
		&info.CommitHash,
		&info.SizeBytes,
		&info.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &info, nil
}
