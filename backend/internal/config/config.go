package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	ReposPath   string
	DatabaseURL string
}

var App Config

func Load() error {
	envPath := ".env"

	// Prefer the .env file relative to the backend project root so the
	// server works regardless of the current working directory.
	if _, file, _, ok := runtime.Caller(0); ok {
		root := filepath.Join(filepath.Dir(file), "..", "..")
		rootEnv := filepath.Join(root, ".env")

		if _, err := os.Stat(rootEnv); err == nil {
			envPath = rootEnv
		}
	}

	if err := godotenv.Load(envPath); err != nil {
		log.Printf("warning: could not load %s (%v); falling back to environment variables", envPath, err)
	}

	App = Config{
		Port:        os.Getenv("PORT"),
		ReposPath:   os.Getenv("REPOS_PATH"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if App.Port == "" {
		App.Port = "3200"
	}

	return nil
}
