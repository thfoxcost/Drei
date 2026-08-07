package handlers

import (
	"fmt"
	"net/http"
	"net/http/cgi"
	"os"
	"strings"
)

func GitHandler(w http.ResponseWriter, r *http.Request) {
	// Remove the /git prefix
	r.URL.Path = strings.TrimPrefix(r.URL.Path, "/git")

	gitBackend := os.Getenv("GIT_HTTP_BACKEND")
	reposPath := os.Getenv("REPOS_PATH")

	fmt.Println("Method:", r.Method)
	fmt.Println("Path:", r.URL.Path)
	fmt.Println("Query:", r.URL.RawQuery)

	handler := &cgi.Handler{
		Path: gitBackend,
		Env: []string{
			"GIT_PROJECT_ROOT=" + reposPath,
			"GIT_HTTP_EXPORT_ALL=",
			"PATH_INFO=" + r.URL.Path,
			"REQUEST_METHOD=" + r.Method,
			"QUERY_STRING=" + r.URL.RawQuery,
		},
	}

	handler.ServeHTTP(w, r)
}
