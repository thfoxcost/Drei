package handlers

import (
	"log"
	"net/http"

	"backend/internal/storage"
	"backend/internal/sysinfo"
)

// Status godoc
//
//	@Summary		Get system status
//	@Description	Reports the state of every service the deployment depends on.
//	                    Detailed host metrics and the caller's own storage usage
//	                    are included only for authenticated callers; anonymous
//	                    callers receive the service list alone.
//	@Tags			System
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}
//	@Failure		405	{object}	map[string]interface{}
//	@Router			/status [get]
func Status(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r, "GET")

	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	snapshot := sysinfo.Current()
	if snapshot == nil {
		writeError(w, http.StatusServiceUnavailable, "system metrics are still starting up")
		return
	}

	payload := map[string]any{
		"services":         snapshot.Services,
		"metricsAvailable": false,
	}

	// Host metrics describe the machine Drei runs on, so they are reserved for
	// signed-in users. Session validation is optional here: a failure only
	// means the metrics are withheld, not that the request is rejected.
	user, err := authenticate(r)
	if err != nil {
		writeSuccess(w, payload)
		return
	}

	payload["metricsAvailable"] = true
	payload["system"] = snapshot.System

	// The client server reports its own memory usage, so it only appears when
	// the probe managed to read it.
	if snapshot.Client != nil {
		payload["client"] = snapshot.Client
	}

	// Storage is per-account, so it can only be measured once we know who is
	// asking. It is cached per account, so this stays cheap to poll.
	if usage, err := storage.ForUser(r.Context(), user.ID, user.Name); err == nil {
		payload["storage"] = usage
	} else {
		log.Printf("storage measurement failed for %s: %v", user.Name, err)
	}

	writeSuccess(w, payload)
}
