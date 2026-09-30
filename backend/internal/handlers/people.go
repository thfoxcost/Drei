package handlers

import (
	"backend/internal/database"
	"net/http"
)

// PeopleHandler lists every registered user with presence, organization
// memberships, and their most relevant public repository for the People
// directory.
//
//	GET /api/people
//
// Presence comes from client heartbeats (POST /api/presence/heartbeat,
// throttled server-side): online means seen within the last few minutes,
// and last-active is the newest heartbeat or session touch. The endpoint
// requires authentication because rows contain email addresses.
//
//	@Summary		List people
//	@Description	Returns every registered user with online presence, organization memberships, and top public repository
//	@Tags			Users
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/people [get]
func PeopleHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	if _, err := authenticate(r); err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	people, err := database.ListPeople()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if people == nil {
		people = []database.Person{}
	}

	writeSuccess(w, map[string]any{"people": people})
}

// PresenceHeartbeatHandler refreshes the caller's online heartbeat. The
// client calls it about once a minute while a tab is visible; the write
// itself is throttled server-side (see database.TouchPresence).
//
//	POST /api/presence/heartbeat
//
//	@Summary		Refresh online presence
//	@Description	Updates the authenticated user's last-seen timestamp used by the People directory
//	@Tags			Users
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		401	{object}	map[string]interface{}
//	@Failure		405	{object}	map[string]interface{}
//	@Failure		500	{object}	map[string]interface{}
//	@Security		SessionAuth
//	@Router			/presence/heartbeat [post]
func PresenceHeartbeatHandler(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "POST")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodPost {
		writeErrorCoded(w, http.StatusMethodNotAllowed, "method_not_allowed", "method not allowed")
		return
	}

	user, err := authenticate(r)
	if err != nil {
		writeErrorCoded(w, http.StatusUnauthorized, "not_authenticated", "not authenticated")
		return
	}

	if err := database.TouchPresence(user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]any{"success": true})
}
