package database

import (
	"context"
	"strings"
)

// GetAllUsers returns every registered user ordered by username, used to
// populate global filters such as the author and assignee dropdowns.
func GetAllUsers() ([]Contributor, error) {
	rows, err := DB.Query(
		context.Background(),
		`
		SELECT id, COALESCE(name, ''), image
		FROM "user"
		ORDER BY name
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []Contributor{}

	for rows.Next() {
		var user Contributor

		if err := rows.Scan(&user.ID, &user.Username, &user.Avatar); err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	return users, rows.Err()
}

// ResolveUsernamesByEmails returns a map from lowercased email address to the
// registered username for every user whose email matches one of the given
// addresses (case-insensitively). Addresses without a matching user are absent
// from the map, so callers can fall back to the git-stored author name.
func ResolveUsernamesByEmails(emails []string) (map[string]string, error) {
	cleaned := make([]string, 0, len(emails))

	for _, email := range emails {
		trimmed := strings.ToLower(strings.TrimSpace(email))

		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}

	if len(cleaned) == 0 {
		return map[string]string{}, nil
	}

	rows, err := DB.Query(
		context.Background(),
		`
		SELECT lower(email), name
		FROM "user"
		WHERE lower(email) = ANY($1::text[])
		`,
		cleaned,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usernames := make(map[string]string, len(cleaned))

	for rows.Next() {
		var email, name string

		if err := rows.Scan(&email, &name); err != nil {
			return nil, err
		}

		usernames[email] = name
	}

	return usernames, rows.Err()
}
