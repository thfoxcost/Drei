package backend

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

	data, err := os.ReadFile("./sample/contri.json")
	if err != nil {
		return resp, err
	}

	if err := json.Unmarshal(data, &resp); err != nil {
		return resp, err
	}

	return resp, nil
}

func ContributionAPI(w http.ResponseWriter, r *http.Request) {
	log.Printf("[REQUEST] %s %s", r.Method, r.URL.Path)

	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	resp, err := LoadContributions()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
