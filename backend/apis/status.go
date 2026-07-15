// TODO: Make websocket that makes this

package backend

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type Service struct {
	Name    string `json:"name"`
	Status  string `json:"status"`
	Latency int    `json:"latency"`
}

type Memory struct {
	Used  int    `json:"used"`
	Total int    `json:"total"`
	Unit  string `json:"unit"`
}

type Disk struct {
	Used  int    `json:"used"`
	Total int    `json:"total"`
	Unit  string `json:"unit"`
}

type System struct {
	Uptime         string `json:"uptime"`
	Version        string `json:"version"`
	Environment    string `json:"environment"`
	CPU            int    `json:"cpu"`
	Memory         Memory `json:"memory"`
	Disk           Disk   `json:"disk"`
	Requests       int    `json:"requests"`
	AverageLatency int    `json:"averageLatency"`
	LastDeploy     string `json:"lastDeploy"`
	LastUpdated    string `json:"lastUpdated"`
}

type StatusResponse struct {
	Services []Service `json:"services"`
	System   System    `json:"system"`
}

func loadStatus() (StatusResponse, error) {
	var resp StatusResponse

	data, err := os.ReadFile("sample/health.json")
	if err != nil {
		return resp, err
	}

	err = json.Unmarshal(data, &resp)
	if err != nil {
		return resp, err
	}

	return resp, nil
}

func Status(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	resp, err := loadStatus()
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
