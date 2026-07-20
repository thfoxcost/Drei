package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	ReposPath      string
	GitBackendPath string
}

var App Config

func Load() error {
	if err := godotenv.Load(); err != nil {
		return err
	}

	App = Config{
		Port:           os.Getenv("PORT"),
		ReposPath:      os.Getenv("REPOS_PATH"),
		GitBackendPath: os.Getenv("GIT_HTTP_BACKEND"),
	}

	return nil
}
