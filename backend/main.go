package main

import (
	backend "backend/apis"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/contribution", backend.ContributionAPI)
	mux.HandleFunc("/api/health", backend.Status)

	log.Println("🚀 Server started")
	log.Println("http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", mux))
}
