package handlers

import (
	"backend/internal/config"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

// errNotAuthenticated is returned by authenticate when the request does not
// carry a valid better-auth session.
var errNotAuthenticated = errors.New("not authenticated")

// AuthUser is the signed-in user resolved from the better-auth session cookie.
type AuthUser struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Image *string `json:"image"`
}

// authHTTPClient is shared by every session lookup performed by the backend.
var authHTTPClient = &http.Client{Timeout: 5 * time.Second}

// authenticate resolves the signed-in user from the request's better-auth
// session cookie by forwarding the cookie to the client server's get-session
// endpoint. Auth stays in the client (see project architecture); the Go
// backend never trusts user ids supplied in the request body.
func authenticate(r *http.Request) (*AuthUser, error) {
	cookie := r.Header.Get("Cookie")

	if cookie == "" {
		return nil, errNotAuthenticated
	}

	req, err := http.NewRequest(
		http.MethodGet,
		config.App.ClientURL+"/api/auth/get-session",
		nil,
	)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Cookie", cookie)

	resp, err := authHTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("session lookup failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("session lookup returned status %d", resp.StatusCode)
	}

	var result struct {
		Session *json.RawMessage `json:"session"`
		User    *AuthUser        `json:"user"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.Session == nil || result.User == nil || result.User.ID == "" {
		return nil, errNotAuthenticated
	}

	return result.User, nil
}
