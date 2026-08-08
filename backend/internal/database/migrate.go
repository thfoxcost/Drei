package database

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
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS contributors (
			id BIGSERIAL PRIMARY KEY,
			repo_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL DEFAULT '',
			username TEXT NOT NULL,
			avatar TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	// Case-insensitive uniqueness per repository so the same user can never be
	// stored twice (e.g. "thefoxcost" and "TheFoxCost").
	_, err = DB.Exec(context.Background(), `
		CREATE UNIQUE INDEX IF NOT EXISTS contributors_repo_username_key
		ON contributors (repo_id, lower(username));
	`)
	if err != nil {
		return err
	}

	// Backwards compatibility: migrate the old repositories.contributors TEXT[]
	// column into the contributors table, then remove it.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE repositories
		ADD COLUMN IF NOT EXISTS contributors TEXT[] NOT NULL DEFAULT '{}';
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		INSERT INTO contributors (repo_id, username)
		SELECT r.id, c
		FROM repositories r
		CROSS JOIN LATERAL unnest(r.contributors) AS c
		ON CONFLICT DO NOTHING;
	`)
	if err != nil {
		return err
	}

	// Backfill the owner as the first contributor for any repo missing it.
	_, err = DB.Exec(context.Background(), `
		INSERT INTO contributors (repo_id, user_id, username)
		SELECT r.id, r.owner_id, r.owner
		FROM repositories r
		WHERE NOT EXISTS (
			SELECT 1
			FROM contributors cr
			WHERE cr.repo_id = r.id AND lower(cr.username) = lower(r.owner)
		)
		ON CONFLICT DO NOTHING;
	`)
	if err != nil {
		return err
	}

	// Backfill user_id and avatar for stored contributors that match a user so
	// the contributors table only holds complete user records.
	_, err = DB.Exec(context.Background(), `
		UPDATE contributors c
		SET user_id = u.id,
		    avatar = u.image
		FROM "user" u
		WHERE lower(u.name) = lower(c.username)
		  AND (c.user_id = '' OR c.avatar IS NULL);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		ALTER TABLE repositories
		DROP COLUMN IF EXISTS contributors;
	`)
	if err != nil {
		return err
	}

	// Project settings: custom logo path, website URL, and archived flag.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE repositories
		ADD COLUMN IF NOT EXISTS logo TEXT,
		ADD COLUMN IF NOT EXISTS website TEXT,
		ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
		ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
	`)
	if err != nil {
		return err
	}

	return nil
}
