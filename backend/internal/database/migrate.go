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

	// Repository issues. Issue numbers are unique per repository, never
	// globally. author_id / assignee_id / closed_by reference the better-auth
	// "user" table by id.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS issues (
			id BIGSERIAL PRIMARY KEY,
			repo_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
			number INTEGER NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			state TEXT NOT NULL DEFAULT 'open',
			author_id TEXT NOT NULL,
			assignee_id TEXT,
			due_date TIMESTAMPTZ,
			closed_at TIMESTAMPTZ,
			closed_by TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			UNIQUE(repo_id, number)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS issues_repo_state_idx
		ON issues (repo_id, state);
	`)
	if err != nil {
		return err
	}

	// Issues can be closed with a reason explaining why (completed, not
	// planned, duplicated). The value is only meaningful while the issue is
	// closed; reopening clears it.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE issues
		ADD COLUMN IF NOT EXISTS close_reason TEXT;
	`)
	if err != nil {
		return err
	}

	// Issues can have multiple assignees. The join table is the source of
	// truth; user_id references the better-auth "user" table by id.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS issue_assignees (
			issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			PRIMARY KEY (issue_id, user_id)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS issue_assignees_issue_id_idx
		ON issue_assignees (issue_id);
	`)
	if err != nil {
		return err
	}

	// Backwards compatibility: move the old single issues.assignee_id value
	// into the join table, then drop the column. The backfill is guarded so it
	// only runs on databases that still have the old column (the migration is
	// re-run on every startup).
	_, err = DB.Exec(context.Background(), `
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM information_schema.columns
				WHERE table_schema = 'public'
				  AND table_name = 'issues'
				  AND column_name = 'assignee_id'
			) THEN
				INSERT INTO issue_assignees (issue_id, user_id)
				SELECT i.id, i.assignee_id
				FROM issues i
				WHERE i.assignee_id IS NOT NULL
				ON CONFLICT DO NOTHING;
			END IF;
		END $$;
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		ALTER TABLE issues
		DROP COLUMN IF EXISTS assignee_id;
	`)
	if err != nil {
		return err
	}

	// Issue labels are scoped to a repository so the same label name can exist
	// independently on different repositories.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS issue_labels (
			id BIGSERIAL PRIMARY KEY,
			repo_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			color TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			UNIQUE(repo_id, name)
		);
	`)
	if err != nil {
		return err
	}

	// Many-to-many link between issues and their labels.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS issue_label_links (
			issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
			label_id BIGINT NOT NULL REFERENCES issue_labels(id) ON DELETE CASCADE,

			PRIMARY KEY (issue_id, label_id)
		);
	`)
	if err != nil {
		return err
	}

	// Issue comments. created_by references the better-auth "user" table.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS issue_comments (
			id BIGSERIAL PRIMARY KEY,
			issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
			body TEXT NOT NULL,
			created_by TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS issue_comments_issue_id_idx
		ON issue_comments (issue_id);
	`)
	if err != nil {
		return err
	}

	return nil
}
