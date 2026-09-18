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

	// Fork relationship: stores which repository this repo was forked from.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE repositories
		ADD COLUMN IF NOT EXISTS forked_from_id BIGINT REFERENCES repositories(id) ON DELETE SET NULL;
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

	// Profile fields on the better-auth "user" table.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE "user"
		ADD COLUMN IF NOT EXISTS biography TEXT,
		ADD COLUMN IF NOT EXISTS description TEXT,
		ADD COLUMN IF NOT EXISTS country TEXT,
		ADD COLUMN IF NOT EXISTS quote_person_name TEXT,
		ADD COLUMN IF NOT EXISTS quote_text TEXT,
		ADD COLUMN IF NOT EXISTS quote_person_title TEXT,
		ADD COLUMN IF NOT EXISTS quote_person_image TEXT,
		ADD COLUMN IF NOT EXISTS quote_verified BOOLEAN NOT NULL DEFAULT FALSE;
	`)
	if err != nil {
		return err
	}

	// Webhooks table stores Discord notification webhook configurations.
	// The URL is stored Base64-encoded for safety. repository_id is nullable;
	// when NULL the webhook applies to the user globally.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS webhooks (
			id BIGSERIAL PRIMARY KEY,
			user_id TEXT NOT NULL,
			repository_id BIGINT REFERENCES repositories(id) ON DELETE CASCADE,
			type TEXT NOT NULL DEFAULT 'discord',
			encoded_url TEXT NOT NULL,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS webhooks_user_id_idx
		ON webhooks (user_id);
	`)
	if err != nil {
		return err
	}

	// Pull requests. Numbers are shared with issues per repository — the
	// allocation query in CreateIssue / CreatePullRequest takes the MAX across
	// both tables to prevent collisions.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pull_requests (
			id BIGSERIAL PRIMARY KEY,
			repo_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
			number INTEGER NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			state TEXT NOT NULL DEFAULT 'open',
			author_id TEXT NOT NULL,
			source_branch TEXT NOT NULL,
			target_branch TEXT NOT NULL,
			merge_commit_hash TEXT,
			merged_at TIMESTAMPTZ,
			merged_by TEXT,
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
		CREATE INDEX IF NOT EXISTS pull_requests_repo_state_idx
		ON pull_requests (repo_id, state);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pull_requests_author_id_idx
		ON pull_requests (author_id);
	`)
	if err != nil {
		return err
	}

	// Pull request comments. mirrors issue_comments exactly.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pull_request_comments (
			id BIGSERIAL PRIMARY KEY,
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
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
		CREATE INDEX IF NOT EXISTS pull_request_comments_pull_request_id_idx
		ON pull_request_comments (pull_request_id);
	`)
	if err != nil {
		return err
	}

	// Pull request events — activity timeline entries (opened, closed,
	// merged, comment, reopened). metadata is a flexible JSONB payload.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pull_request_events (
			id BIGSERIAL PRIMARY KEY,
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
			type TEXT NOT NULL,
			actor_id TEXT NOT NULL,
			metadata JSONB,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pull_request_events_pull_request_id_idx
		ON pull_request_events (pull_request_id);
	`)
	if err != nil {
		return err
	}

	// User appearance preferences: theme and language.
	// Defaults ensure existing users get English without a backfill migration.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE "user"
		ADD COLUMN IF NOT EXISTS appearance_theme TEXT NOT NULL DEFAULT 'system',
		ADD COLUMN IF NOT EXISTS appearance_language TEXT NOT NULL DEFAULT 'en';
	`)
	if err != nil {
		return err
	}

	// Pull request assignees — many-to-many between PRs and users.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pr_assignees (
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			PRIMARY KEY (pull_request_id, user_id)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pr_assignees_pull_request_id_idx
		ON pr_assignees (pull_request_id);
	`)
	if err != nil {
		return err
	}

	// Pull request reviewers — many-to-many between PRs and users.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pr_reviewers (
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			PRIMARY KEY (pull_request_id, user_id)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pr_reviewers_pull_request_id_idx
		ON pr_reviewers (pull_request_id);
	`)
	if err != nil {
		return err
	}

	// Pull request labels — reuses the existing issue_labels table for
	// repository-scoped label definitions.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pr_label_links (
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
			label_id BIGINT NOT NULL REFERENCES issue_labels(id) ON DELETE CASCADE,

			PRIMARY KEY (pull_request_id, label_id)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pr_label_links_pull_request_id_idx
		ON pr_label_links (pull_request_id);
	`)
	if err != nil {
		return err
	}

	// Per-user notification preference for a pull request.
	_, err = DB.Exec(context.Background(), `
		ALTER TABLE pull_requests
		ADD COLUMN IF NOT EXISTS notifications BOOLEAN NOT NULL DEFAULT FALSE;
	`)
	if err != nil {
		return err
	}

	// Ensure every PR has at least one comment ("No description" if none exist).
	_, err = DB.Exec(context.Background(), `
		INSERT INTO pull_request_comments (pull_request_id, body, created_by)
		SELECT pr.id, '*No description*', pr.author_id
		FROM pull_requests pr
		WHERE NOT EXISTS (
			SELECT 1 FROM pull_request_comments c WHERE c.pull_request_id = pr.id
		);
	`)
	if err != nil {
		return err
	}

	// Per-user file viewed tracking for pull requests. Records which changed
	// files in a PR the current user has marked as viewed.
	_, err = DB.Exec(context.Background(), `
		CREATE TABLE IF NOT EXISTS pr_viewed_files (
			pull_request_id BIGINT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
			user_id TEXT NOT NULL,
			file_path TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

			PRIMARY KEY (pull_request_id, user_id, file_path)
		);
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(context.Background(), `
		CREATE INDEX IF NOT EXISTS pr_viewed_files_pull_user_idx
		ON pr_viewed_files (pull_request_id, user_id);
	`)
	if err != nil {
		return err
	}

	return nil
}
