package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	ReposPath   string
	DatabaseURL string
	ClientURL   string
	Environment string
	// AllowedOrigins is the explicit CORS allowlist for credentialed
	// browser requests. It always contains ClientURL; in non-production
	// environments the local dev client is allowed as well.
	AllowedOrigins []string
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
		ClientURL:   os.Getenv("CLIENT_URL"),
		Environment: os.Getenv("APP_ENV"),
	}

	if App.Port == "" {
		App.Port = "3200"
	}

	if App.ClientURL == "" {
		App.ClientURL = "http://localhost:3000"
	}

	if App.Environment == "" {
		App.Environment = "development"
	}

	// Explicit CORS allowlist: the client URL is always allowed.
	// ALLOWED_ORIGINS (comma-separated) adds deployment-specific origins.
	// Local development origins are allowed outside production so
	// `bun run dev` keeps working without extra configuration.
	App.AllowedOrigins = []string{App.ClientURL}

	if extra := os.Getenv("ALLOWED_ORIGINS"); extra != "" {
		for _, origin := range strings.Split(extra, ",") {
			if origin = strings.TrimSpace(origin); origin != "" {
				App.AllowedOrigins = append(App.AllowedOrigins, origin)
			}
		}
	}

	if App.Environment != "production" {
		App.AllowedOrigins = append(App.AllowedOrigins,
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		)
	}

	// A deployment that only knows its internal client address would end up
	// with an allowlist no browser can ever match, which silently breaks
	// every API call. Treat that as a startup misconfiguration rather than
	// letting it surface as blank pages.
	if len(App.AllowedOrigins) == 1 && !originIsBrowserFacing(App.AllowedOrigins[0]) {
		log.Printf(
			"warning: ALLOWED_ORIGINS is unset and CLIENT_URL (%s) is not browser-reachable; "+
				"set ALLOWED_ORIGINS to the origin users visit (e.g. http://localhost:3000) "+
				"or credentialed API calls will be blocked",
			App.AllowedOrigins[0],
		)
	}

	return nil
}

// originIsBrowserFacing reports whether an origin looks like an address a
// browser would actually send, i.e. a host:port rather than a Docker service
// name such as "http://client:3000".
func originIsBrowserFacing(origin string) bool {
	host := origin
	if idx := strings.Index(host, "://"); idx >= 0 {
		host = host[idx+3:]
	}

	if idx := strings.IndexAny(host, "/?#"); idx >= 0 {
		host = host[:idx]
	}

	// Strip the port; a bare service name without one is still not routable
	// from the browser.
	if idx := strings.LastIndex(host, ":"); idx >= 0 && !strings.Contains(host[idx:], "]") {
		host = host[:idx]
	}

	return host != "" && host != "client"
}
