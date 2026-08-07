package handlers

import (
	"encoding/json"
	"net/http"
	"os"
)

func Status(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	data, err := os.ReadFile("./data/status.json")
	if err != nil {
		http.Error(w, "failed to read status data", http.StatusInternalServerError)
		return
	}

	var v any
	if err := json.Unmarshal(data, &v); err != nil {
		http.Error(w, "invalid json", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
