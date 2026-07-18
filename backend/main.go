package main

import (
	backend "backend/apis"
	"log"
	"net/http"
)

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Change this to your frontend URL
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/contribution", backend.ContributionAPI)
	mux.HandleFunc("/api/health", backend.Status)

	log.Println("🚀 Server started")
	log.Println("http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", cors(mux)))
}
