package handlers

import "net/http"

// maxNamespaceLen bounds owner/repository path segments on read paths. It is
// deliberately looser than the 30-character cap that gitrepo.ValidRepoName
// enforces on creation, so repositories created before that cap existed stay
// readable.
const maxNamespaceLen = 100

// ValidNamespace reports whether s is safe to use as a single path segment
// under REPOS_PATH. It rejects anything that could escape the directory:
// path separators (on any platform, so a name crafted on Linux cannot become
// a traversal elsewhere), "." and "..", NUL bytes, and leading dots or dashes
// which git and the filesystem both treat specially.
func ValidNamespace(s string) bool {
	if s == "" || len(s) > maxNamespaceLen {
		return false
	}

	if s == "." || s == ".." {
		return false
	}

	if s[0] == '.' || s[0] == '-' {
		return false
	}

	for i := 0; i < len(s); i++ {
		switch c := s[i]; c {
		case '/', '\\', 0:
			return false
		}
	}

	return true
}

// ValidRepoFilePath reports whether a path inside a repository is free of
// parent-directory segments. go-git resolves the path against a commit tree so
// it cannot escape the repository on its own; this is a cheap second gate so a
// traversal attempt is rejected with a 400 instead of being reported as a
// missing file. Every ".." segment is rejected, including ones that would
// resolve back inside the repository: this is an allowlist, not a resolver.
func ValidRepoFilePath(p string) bool {
	if p == "" {
		return false
	}

	start := 0

	for i := 0; i <= len(p); i++ {
		if i < len(p) && p[i] != '/' {
			continue
		}

		segment := p[start:i]
		if segment == ".." {
			return false
		}

		start = i + 1
	}

	return true
}

// PathValidation rejects requests whose {owner}, {repo} or {path} route
// parameters could escape REPOS_PATH.
//
// It is meant to wrap each handler at mux-registration time rather than wrap
// the mux itself: net/http only populates r.PathValue after the mux has
// matched a pattern, so a middleware placed in front of the mux would always
// observe empty values.
func PathValidation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// A route that does not declare a given wildcard yields "", so this
		// only inspects the parameters the matched pattern actually has.
		for _, key := range []string{"owner", "repo"} {
			value := r.PathValue(key)
			if value == "" {
				continue
			}

			if !ValidNamespace(value) {
				writeError(w, http.StatusBadRequest, "invalid "+key+" parameter")
				return
			}
		}

		if path := r.PathValue("path"); path != "" && !ValidRepoFilePath(path) {
			writeError(w, http.StatusBadRequest, "invalid path parameter")
			return
		}

		next.ServeHTTP(w, r)
	})
}
