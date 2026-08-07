# Drei Backend

Go HTTP server powering the Drei self-hosted Git platform. Module `backend`, Go 1.26, listens on port 3200.

## Folder structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go               # Environment configuration
│   ├── database/
│   │   ├── connect.go              # Postgres connection pool (pgx)
│   │   ├── migrate.go              # Schema migrations
│   │   ├── repos.go                # Repository model + create/read queries
│   │   ├── metadata.go             # Repository metadata model + query
│   │   └── contributors.go         # Contributor model + queries
│   ├── gitrepo/
│   │   ├── init.go                 # Bare repo creation (git init --bare)
│   │   ├── repo.go                 # Assembles full repo metadata (GetRepo)
│   │   ├── branches.go             # List branches + default branch
│   │   ├── tags.go                 # List tags
│   │   ├── commits.go              # Commit history (CommitInfo, GetCommits)
│   │   ├── contributors.go         # Unique commit authors
│   │   ├── languages.go            # Language breakdown by bytes
│   │   ├── files.go                # Recursive file tree with last-commit info
│   │   ├── check.go                # Has-commits check
│   │   └── size.go                 # Total repo size
│   └── handlers/
│       ├── repos.go                # POST /api/repos, GET /api/repos/{owner}/{repo}
│       ├── users.go                # GET /api/users/{owner}/repos
│       ├── status.go               # GET /api/status (demo)
│       ├── contribution.go         # GET /api/contribution (demo)
│       └── git.go                  # /git/ CGI passthrough to git-http-backend
├── data/
│   ├── status.json                 # Static payload for the /api/status demo
│   └── contribution.json           # Static payload for the /api/contribution demo
├── .air.toml                       # air hot-reload configuration
├── .env                            # Local environment (gitignored)
├── .gitignore
├── go.mod
└── go.sum
```

## Entry point

`cmd/server/main.go` is the single entry point. It loads configuration, connects to
Postgres, applies migrations, and wires up the routes on the default mux before
listening on the port from `PORT`.

Run it with:

```sh
go run ./cmd/server
```

or use `air` for hot reload (builds to `tmp/main`).

## Package responsibilities

### `internal/config`

Loads the `.env` file and exposes the parsed values through the package-level
`config.App` variable. `config.App.Port`, `config.App.ReposPath`, and
`config.App.DatabaseURL` are used throughout the codebase.

### `internal/database`

All Postgres access lives here (pgx connection pool + queries).

- `database.DB` is the shared pool, created in `connect.go`.
- Models live next to their queries: `repos.go`, `metadata.go`, and
  `contributors.go` each define a struct and the functions that read/write it.
- `migrate.go` is responsible for the `repositories` and `contributors` tables.

### `internal/gitrepo`

Everything that touches the on-disk bare git repositories, read through go-git v6.
This is the "service" layer that turns a repo path into structured data
(languages, branches, commits, files, contributors). `repo.go` coordinates the
rest via `gitrepo.GetRepo(owner, repo)`, which returns the JSON shape served by
`GET /api/repos/{owner}/{repo}`.

### `internal/handlers`

The HTTP layer. One file per route group:

- `repos.go` — create a repo (bare git init + DB row + first contributor) and
  fetch full repo metadata. Also parses the create-repo request body.
- `users.go` — list a user's repositories.
- `status.go` / `contribution.go` — demo endpoints serving static JSON from `data/`.
- `git.go` — the `/git/` route, a CGI passthrough to the system
  `git-http-backend`, so clients can push/clone over HTTP.

There is no dedicated middleware package; CORS headers are set inline per handler.

### `data`

Static JSON files served by the demo endpoints. Not Go source code.

## Configuration

All configuration comes from environment variables (loaded via `godotenv` from
`.env`):

| Variable | Description |
| --- | --- |
| `PORT` | HTTP listen port (e.g. `3200`) |
| `REPOS_PATH` | Root directory where bare repos are stored |
| `DATABASE_URL` | Postgres connection string |
| `GIT_HTTP_BACKEND` | Path to `git-http-backend` (read directly by the `/git/` handler) |

## API surface

| Method | Route | Handler |
| --- | --- | --- |
| `POST` | `/api/repos` | `handlers.CreateRepo` |
| `GET` | `/api/repos/{owner}/{repo}` | `handlers.RepoHandler` |
| `GET` | `/api/users/{owner}/repos` | `handlers.GetRepos` |
| `GET` | `/api/status` | `handlers.Status` |
| `GET` | `/api/contribution` | `handlers.Contribution` |
| `*` | `/git/` | `handlers.GitHandler` |

## Build and test

```sh
go build ./...    # compile everything
go test ./...     # run tests (none exist yet)
go vet ./...      # static checks
gofmt -l cmd internal   # formatting check
```
