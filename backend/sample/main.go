package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"time"
)

type Contribution struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
	Level int    `json:"level"`
}

type Response struct {
	Contributions []Contribution `json:"contributions"`
}

func level(count int) int {
	switch {
	case count == 0:
		return 0
	case count <= 3:
		return 1
	case count <= 7:
		return 2
	case count <= 12:
		return 3
	default:
		return 4
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	var res Response

	for i := 0; i < 600; i++ {
		d := start.AddDate(0, 0, i)

		// Every day has contributions (1–20)
		count := rand.Intn(20) + 1

		res.Contributions = append(res.Contributions, Contribution{
			Date:  d.Format("2006-01-02"),
			Count: count,
			Level: level(count),
		})
	}

	data, _ := json.MarshalIndent(res, "", "  ")

	os.WriteFile("contri.json", data, 0644)

	fmt.Println("Generated 365 days of contributions!")
}
