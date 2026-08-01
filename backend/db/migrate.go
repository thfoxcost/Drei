package db

import (
	"context"
)

func Migrate() error {
	_, err := DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS repositories (
			id BIGSERIAL PRIMARY KEY,
			owner_id TEXT NOT NULL,
			owner TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			visibility BOOLEAN NOT NULL,
			path TEXT NOT NULL,
			default_branch TEXT NOT NULL DEFAULT 'main',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			UNIQUE(owner_id, name)
		);
	`)

	return err
}
