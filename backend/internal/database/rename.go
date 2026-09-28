package database

import (
	"backend/internal/config"
	"context"
	"log"
	"os"
	"path/filepath"
)

// SyncUsernameReferences rewrites every username-derived value owned by the
// given user id so a rename never leaves stale data behind:
//
//   - repositories.owner (+ the absolute repositories.path) for personal
//     repositories only; organization repositories keep their slug.
//   - contributors.username for rows linked to the user.
//
// Contributor rows that would collide with an existing row for the new name
// (same repo, e.g. the user committed under both names) are dropped in favor
// of the surviving row. Rows already matching (case-insensitively) are left
// untouched.
func SyncUsernameReferences(userID, username string) error {
	_, err := DB.Exec(
		context.Background(),
		`
		DELETE FROM contributors c
		USING contributors n
		WHERE c.user_id = $1 AND n.user_id = $1
		  AND c.repo_id = n.repo_id
		  AND lower(n.username) = lower($2)
		  AND lower(c.username) != lower($2)
		`,
		userID,
		username,
	)
	if err != nil {
		return err
	}

	_, err = DB.Exec(
		context.Background(),
		`
		UPDATE contributors
		SET username = $2
		WHERE user_id = $1 AND lower(username) != lower($2)
		`,
		userID,
		username,
	)
	if err != nil {
		return err
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, name FROM repositories
		WHERE owner_id = $1
		  AND organization_id IS NULL
		  AND lower(owner) != lower($2)
		`,
		userID,
		username,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	type staleRepo struct {
		id   int64
		name string
	}

	stale := []staleRepo{}

	for rows.Next() {
		var r staleRepo

		if err := rows.Scan(&r.id, &r.name); err != nil {
			return err
		}

		stale = append(stale, r)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	for _, r := range stale {
		newPath := filepath.Join(config.App.ReposPath, username, r.name+".git")

		_, err := DB.Exec(
			context.Background(),
			`UPDATE repositories SET owner = $1, path = $2 WHERE id = $3`,
			username,
			newPath,
			r.id,
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// moveNamespaceDir moves a per-owner directory (repositories or logos) from
// the old owner name to the new one, one repository at a time so existing
// content under the new name is never overwritten. Missing sources are fine.
func moveNamespaceDir(kind, oldOwner, newOwner string) {
	if oldOwner == newOwner {
		return
	}

	src := filepath.Join(config.App.ReposPath, kind, oldOwner)
	dst := filepath.Join(config.App.ReposPath, kind, newOwner)

	entries, err := os.ReadDir(src)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("ERROR: failed to read %s namespace dir %q: %v", kind, src, err)
		}

		return
	}

	if err := os.MkdirAll(dst, 0755); err != nil {
		log.Printf("ERROR: failed to create %s namespace dir %q: %v", kind, dst, err)

		return
	}

	for _, entry := range entries {
		from := filepath.Join(src, entry.Name())
		to := filepath.Join(dst, entry.Name())

		if _, err := os.Lstat(to); err == nil {
			log.Printf("ERROR: refusing to overwrite %s %q during rename %q -> %q", kind, to, oldOwner, newOwner)

			continue
		}

		if err := os.Rename(from, to); err != nil {
			log.Printf("ERROR: failed to move %s %q -> %q: %v", kind, from, to, err)
		}
	}

	// Best effort: drop the old directory once it is empty.
	_ = os.Remove(src)
}

// RenameUserNamespace propagates a username change everywhere the name is
// materialized: database references via SyncUsernameReferences plus the
// on-disk namespaces (bare repositories and per-owner logos). Errors are
// logged, never fatal to the caller — the profile update itself already
// succeeded by the time this runs.
func RenameUserNamespace(userID, oldName, newName string) {
	if oldName == newName {
		return
	}

	if err := SyncUsernameReferences(userID, newName); err != nil {
		log.Printf("ERROR: failed to sync username references %q -> %q: %v", oldName, newName, err)
	}

	// Bare repositories live directly under REPOS_PATH/<owner>.
	moveNamespaceDir(".", oldName, newName)
	// Per-owner logo uploads live under REPOS_PATH/logos/<owner>.
	moveNamespaceDir("logos", oldName, newName)
}

// BackfillUsernameReferences repairs rows predating rename propagation (and
// any other drift): for every user, personal repository owners/paths and
// contributor usernames are synced, and mismatched on-disk repository
// directories are moved into place.
func BackfillUsernameReferences() error {
	rows, err := DB.Query(context.Background(), `SELECT id, name FROM "user"`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type account struct {
		id   string
		name string
	}

	accounts := []account{}

	for rows.Next() {
		var a account

		if err := rows.Scan(&a.id, &a.name); err != nil {
			return err
		}

		accounts = append(accounts, a)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	for _, a := range accounts {
		// Capture stale owners before the sync rewrites them so the
		// corresponding on-disk directories can be moved afterwards.
		var stale []string

		ownerRows, err := DB.Query(
			context.Background(),
			`
			SELECT DISTINCT owner FROM repositories
			WHERE owner_id = $1
			  AND organization_id IS NULL
			  AND lower(owner) != lower($2)
			`,
			a.id,
			a.name,
		)
		if err != nil {
			return err
		}

		for ownerRows.Next() {
			var owner string

			if err := ownerRows.Scan(&owner); err != nil {
				ownerRows.Close()

				return err
			}

			stale = append(stale, owner)
		}

		ownerRows.Close()

		if err := ownerRows.Err(); err != nil {
			return err
		}

		if err := SyncUsernameReferences(a.id, a.name); err != nil {
			return err
		}

		for _, oldOwner := range stale {
			moveNamespaceDir(".", oldOwner, a.name)
			moveNamespaceDir("logos", oldOwner, a.name)
		}
	}

	return nil
}
