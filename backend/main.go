package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type Contribution struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
	Level int    `json:"level"`
}

type Response struct {
	Contributions []Contribution `json:"contributions"`
}

func LoadContributions() (Response, error) {
	var resp Response

	log.Println("[INFO] Loading sample/contri.json")

	data, err := os.ReadFile("./sample/contri.json")
	if err != nil {
		return resp, err
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return resp, err
	}

	log.Printf("[INFO] Loaded %d contributions\n", len(resp.Contributions))

	return resp, nil
}

func home(w http.ResponseWriter, r *http.Request) {
	log.Printf("[REQUEST] %s %s\n", r.Method, r.URL.Path)

	// CORS
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	resp, err := LoadContributions()
	if err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("[ERROR] %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("[SUCCESS] JSON sent")
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/contribution", home)

	log.Println("===================================")
	log.Println("🚀 Server started")
	log.Println("🌐 http://localhost:8080")
	log.Println("📦 GET /api/contribution")
	log.Println("===================================")

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
