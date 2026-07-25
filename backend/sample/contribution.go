package sample

import (
	"encoding/json"
	"net/http"
	"os"
)

func Contribution(w http.ResponseWriter, r *http.Request) {
	// CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	data, err := os.ReadFile("./data/contribution.json")
	if err != nil {
		http.Error(w, "failed to read contribution data", http.StatusInternalServerError)
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
