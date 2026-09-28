package database

import (
	"context"
	"time"
)

// PersonOrg is a single organization membership shown in the People table.
// Avatar is the stored avatar path (served under /uploads/orgs/) and may be
// null when the organization has no custom avatar.
type PersonOrg struct {
	ID     int64   `json:"id"`
	Name   string  `json:"name"`
	Slug   string  `json:"slug"`
	Avatar *string `json:"avatar"`
}

// PersonTopRepo is the person's most recently created public repository they
// own or contribute to. Null when they participate in no public repository.
type PersonTopRepo struct {
	Owner string `json:"owner"`
	Name  string `json:"name"`
}

// Person is one row of the People directory: the better-auth account identity
// plus presence derived from the session table, organization memberships, and
// the most relevant public repository.
type Person struct {
	ID            string         `json:"id"`
	Username      string         `json:"username"`
	Avatar        *string        `json:"avatar"`
	Email         string         `json:"email"`
	Profession    *string        `json:"profession"`
	Online        bool           `json:"online"`
	LastActive    *time.Time     `json:"lastActive"`
	JoinedAt      time.Time      `json:"joinedAt"`
	Country       *string        `json:"country"`
	Organizations []PersonOrg    `json:"organizations"`
	TopRepo       *PersonTopRepo `json:"topRepo"`
}

// ListPeople returns every registered user ordered by username with presence
// (a session whose expiry lies in the future counts as online), organization
// memberships, and the most recently created public repository they own or
// contribute to. Memberships and repositories are fetched in two batched
// queries so the cost stays constant regardless of user count.
// onlineWindow is how recent last_seen must be for a user to count as
// online. Heartbeats arrive ~every minute while a tab is open, so three
// minutes tolerates one missed beat without showing ghosts for long.
const onlineWindow = "3 minutes"

func ListPeople() ([]Person, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT
			u.id,
			COALESCE(u.name, ''),
			u.image,
			COALESCE(u.email, ''),
			u.profession,
			u."createdAt",
			u.country,
			COALESCE(u.last_seen > NOW() - INTERVAL '`+onlineWindow+`', FALSE),
			(SELECT MAX(seen) FROM (
				SELECT u.last_seen AS seen
				UNION ALL
				SELECT s."updatedAt" FROM session s WHERE s."userId" = u.id
			) t)
		FROM "user" u
		ORDER BY u.name
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	people := []Person{}
	indexByID := map[string]int{}

	for rows.Next() {
		var p Person

		if err := rows.Scan(
			&p.ID,
			&p.Username,
			&p.Avatar,
			&p.Email,
			&p.Profession,
			&p.JoinedAt,
			&p.Country,
			&p.Online,
			&p.LastActive,
		); err != nil {
			return nil, err
		}

		p.Organizations = []PersonOrg{}
		indexByID[p.ID] = len(people)
		people = append(people, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(people) == 0 {
		return people, nil
	}

	if err := attachPersonOrgs(people, indexByID); err != nil {
		return nil, err
	}

	if err := attachPersonTopRepos(people, indexByID); err != nil {
		return nil, err
	}

	return people, nil
}

// TouchPresence refreshes the user's heartbeat timestamp, throttled to one
// write per minute so open tabs don't hammer the database.
func TouchPresence(userID string) error {
	_, err := DB.Exec(
		context.Background(),
		`
		UPDATE "user"
		SET last_seen = NOW()
		WHERE id = $1
		  AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '1 minute')
		`,
		userID,
	)

	return err
}

// attachPersonOrgs fills Organizations for every person in a single query.
func attachPersonOrgs(people []Person, indexByID map[string]int) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT om.user_id, o.id, o.name, o.slug, o.avatar
		FROM organization_members om
		JOIN organizations o ON o.id = om.organization_id
		ORDER BY o.name
		`,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		var org PersonOrg

		if err := rows.Scan(&userID, &org.ID, &org.Name, &org.Slug, &org.Avatar); err != nil {
			return err
		}

		if i, ok := indexByID[userID]; ok {
			people[i].Organizations = append(people[i].Organizations, org)
		}
	}

	return rows.Err()
}

// attachPersonTopRepos fills TopRepo for every person in a single query: the
// most recently created public repository they own (by id or name match) or
// contribute to. Users without a public repository keep a null TopRepo.
func attachPersonTopRepos(people []Person, indexByID map[string]int) error {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT DISTINCT ON (u.id) u.id, r.owner, r.name
		FROM "user" u
		LEFT JOIN repositories r ON r.visibility = TRUE
			AND (
				r.owner_id = u.id
				OR lower(r.owner) = lower(u.name)
				OR EXISTS (
					SELECT 1 FROM contributors c
					WHERE c.repo_id = r.id
					  AND (c.user_id = u.id OR lower(c.username) = lower(u.name))
				)
			)
		ORDER BY u.id, r.created_at DESC NULLS LAST
		`,
	)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID string
		var owner, name *string

		if err := rows.Scan(&userID, &owner, &name); err != nil {
			return err
		}

		if i, ok := indexByID[userID]; ok && owner != nil && name != nil {
			people[i].TopRepo = &PersonTopRepo{Owner: *owner, Name: *name}
		}
	}

	return rows.Err()
}
