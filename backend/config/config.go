package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	ReposPath      string
	GitBackendPath string
	DbHost		 string
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
		DbHost: os.Getenv("DB_HOST")
	}

	return nil
}
