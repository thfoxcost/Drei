package database

import "fmt"

// Viewer scopes a cross-repository listing to what one caller may see.
//
// The zero value is an anonymous caller, which sees public repositories only.
// A listing that takes a Viewer must filter on it: before this type existed,
// the global issue and pull request feeds had no visibility predicate at all
// and returned the contents of private repositories to anyone.
type Viewer struct {
	UserID string
}

// Anonymous reports whether the viewer has no authenticated identity.
func (v Viewer) Anonymous() bool { return v.UserID == "" }

// appendRepoVisibility restricts a query that already joins repositories as
// "r" to the repositories this viewer may read.
//
// It is the SQL counterpart of handlers.canViewRepository and deliberately
// mirrors database.IsRepoMember: a repository is visible when it is public, or
// when the viewer owns it, has contributed to it, or belongs to its owning
// organization.
//
// param is the next free placeholder index; the returned value is the one
// after any placeholders this call consumed.
func appendRepoVisibility(query string, param int, args []any, viewer Viewer) (string, []any, int) {
	if viewer.Anonymous() {
		return query + " AND r.visibility = TRUE", args, param
	}

	// One placeholder is repeated because the subquery needs the user id in
	// three independent branches; they are bound as three args to keep the
	// statement valid for pgx regardless of how the branches are planned.
	query += fmt.Sprintf(
		` AND (r.visibility = TRUE OR EXISTS (
			SELECT 1 FROM repositories vr WHERE vr.id = r.id AND vr.owner_id = $%[1]d
			UNION ALL
			SELECT 1 FROM contributors vc
			JOIN "user" vu ON lower(vu.name) = lower(vc.username)
			WHERE vc.repo_id = r.id AND vu.id = $%[1]d
			UNION ALL
			SELECT 1 FROM repositories vr3
			JOIN organization_members vom ON vom.organization_id = vr3.organization_id
			WHERE vr3.id = r.id AND vom.user_id = $%[1]d
		))`,
		param,
	)

	args = append(args, viewer.UserID)

	return query, args, param + 1
}
