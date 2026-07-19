package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type CreateRepoRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Visibility  string `json:"visibility"`
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Development only
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func createRepo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateRepoRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Println("========== Repository ==========")
	log.Println("Name:", req.Name)
	log.Println("Description:", req.Description)
	log.Println("Visibility:", req.Visibility)
	log.Println("================================")

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"message": "Repository received!",
	})

	log.Println("Method:", r.Method)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/repos", createRepo)

	log.Println("Server running on :3200")
	log.Fatal(http.ListenAndServe(":3200", enableCORS(mux)))
}
