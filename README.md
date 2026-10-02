<p align="center">
  <img src="assets/logo-dark.svg" alt="Drei Logo" width="180">
</p>

<p align="center">
  <strong>A lightweight, self-hosted Git platform.</strong>
</p>

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-Go-00ADD8.svg?logo=go&variant=branded&size=sm&mode=dark">
    <img alt="Go" src="https://www.shieldcn.dev/badge/-Go-00ADD8.svg?logo=go&variant=branded&size=sm&mode=light">
  </picture>
  &nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm&mode=dark">
    <img alt="TypeScript" src="https://www.shieldcn.dev/badge/-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm&mode=light">
  </picture>
  &nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-Git-F05032.svg?logo=git&variant=branded&size=sm&mode=dark">
    <img alt="Git" src="https://www.shieldcn.dev/badge/-Git-F05032.svg?logo=git&variant=branded&size=sm&mode=light">
  </picture>
  &nbsp;&nbsp;
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-React-61DAFB.svg?logo=react&variant=branded&size=sm&mode=dark">
    <img alt="React" src="https://www.shieldcn.dev/badge/-React-61DAFB.svg?logo=react&variant=branded&size=sm&mode=light">
  </picture>
  &nbsp;&nbsp;
  <img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg">
</div>

<br>

---

Drei (pronounced approximately **"dry"**, from the German word for **"three"**) is a free and open-source Git hosting platform designed to be **lightweight, fast, and easy to self-host**.

Run Drei on your own server or network and keep full control over your repositories, accounts, and data without relying on a third-party Git hosting provider.

Learn more at **[drei.sh](https://drei.sh)**.

## Contents

- [Preview](#preview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Inspiration](#inspiration)

<details>
<summary><strong>Preview</strong></summary>

<br>

<p align="center">
  <img src="assets/screenshots/home.png" alt="Drei home page" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/repo.png" alt="Repository page" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/home-dark.png" alt="Drei home page in dark mode" width="900">
</p>

</details>

<br>

**Documentation:**

[Deutsch](./docs/README.de.md) ·
[العربية](./docs/README.ar.md) ·
[English](./docs/README.md) ·
[Français](./docs/README.fr.md)

> Translations are currently maintained for the languages I know.

## Features

### Git hosting

- **Repository creation** with descriptions, avatars, and a project website link
- **Clone, fetch, and push over HTTP** via a `git-http-backend` CGI passthrough
- **Authenticated pushes** — pushing requires a signed-in session with contributor or organization rights; private repositories are never readable anonymously
- **Read-only archived repositories** — archived repos reject pushes while staying clonable
- **Public and private visibility** per repository
- **Forking**, with fork tracking and contributor lists
- **Renaming** that keeps ownership consistent across the database and disk

### Browsing code

- **File tree** with lazy directory loading and syntax-highlighted contents
- **Blob view** for any file at any commit, tag, or branch
- **Commit history** with per-commit detail, diffs, and changed files
- **Branches and tags** with a ref switcher and deletion (default branch protected)
- **Compare** any two refs, with commit- and file-level diffs
- **README rendering** with highlighted code blocks and copy buttons
- **File search** inside a repository
- **Raw file download** and **full repository archive**
- **RSS feed** and **`llms.txt`** export for any repository

### Issues

- Create, view, and filter issues by state, author, assignee, label, and sort order
- **Comments** threaded per issue, with image uploads
- **Labels** with colors, created and managed per repository
- **Assignees** and state transitions (open/closed)

### Pull requests

- Open pull requests across branches with titles, descriptions, and labels
- **Reviewers and reviews**
- **Threaded comments** on the conversation and on the diff
- **Merge, revert, close, and reopen** — with mergeability checks before merging
- **Changed-files view** with per-file diffs and viewed-file tracking
- **Duplicate detection** and source-branch cleanup after merge

### Organizations

- Create organizations with avatars, descriptions, purposes, and tags
- **Roles**: owner, admin, and member, with role-gated administration
- **Members management**, pinned organizations, and organization-owned repositories
- Member and repository listings per organization, with language breakdowns

### Insights and activity

- **Insights**: repository pulse, contributor leaderboards, and code-frequency analytics
- **Global activity feed** across the repositories you can see
- **Contribution heatmap** per user, with a selectable year
- **People directory** with user and repository views, presence, and profession

### Integrations and extras

- **Discord webhooks** per repository for issue and pull request activity, with per-event toggles
- **Repository backups** as verified `git bundle` snapshots, with retention and manual runs
- **In-app to-do list** with reminders surfaced in the header
- **Notifications** for repository events
- **QR code** for cloning a repository from mobile

### Interface

- **Dark and light themes**, with appearance settings and system sync
- **Internationalization** — English and German
- **Command palette** (⌘K) for fast navigation
- **Dashboard widgets**: contribution heatmap, clock, weather, and a live system health panel (frontend, backend, database, storage, CPU, memory, uptime)
- **Avatars and profile customization** with bio, location, and quote

### Self-hosting

- **Docker Compose** stack: client, backend, and PostgreSQL
- **Swagger/OpenAPI** documentation, served outside production only
- **Lightweight footprint** — Go standard library HTTP, go-git, and Bun

## Getting Started

Prerequisites: **Go 1.26+**, **Bun**, **Docker** (for PostgreSQL), and **Git**.

### 1. Clone and start PostgreSQL

```bash
git clone https://github.com/thfoxcost/Drei.git
cd Drei

# Required by docker compose (also used for local development below).
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"

docker compose up -d postgres
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`: set `REPOS_PATH` to an absolute directory for your bare
repositories, and confirm `GIT_HTTP_BACKEND` matches your system
(`git --exec-path` shows the directory containing `git-http-backend`;
on Debian/Ubuntu it is `/usr/lib/git-core/git-http-backend`).

### 3. Configure the client

Create `client/.env` (gitignored, never commit it):

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<same value as exported above>
DB_HOST=postgres://user:password@localhost:5432/pg
```

### 4. Run the dev servers

```bash
# Terminal 1 — backend (http://localhost:3200)
cd backend && air        # or: go run ./cmd/server

# Terminal 2 — client (http://localhost:3000)
cd client && bun install && bun run dev
```

Open **http://localhost:3000**, create an account, and create your first repository.

### 5. Push over HTTP

Git push requires your login session. Tell git to send the session cookie
(find `better-auth.session_token` in your browser's devtools → Application →
Cookies → `localhost`):

```bash
git config --global http.extraHeader "Cookie: better-auth.session_token=<paste-token-here>"
```

Then `git clone` / `git push` against
`http://localhost:3200/git/<username>/<repo>.git` as usual.

## Deployment

The compose stack runs three services: `client` (the web UI, port 3000),
`backend` (REST API **and** git-over-HTTP, port 3200), and `postgres`.

### First deploy

```bash
git clone https://github.com/thfoxcost/Drei.git
cd Drei

# 1. Generate a secret and keep it. Rotating it signs every user out.
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
echo "$BETTER_AUTH_SECRET"        # store it in your password manager

# 2. Optional: point the stack at your own PostgreSQL credentials and the
#    origin users will actually visit (see "Configuration" below).
export ALLOWED_ORIGINS="https://git.example.com"

# 3. Build and start.
docker compose up -d --build
docker compose ps                 # all three services should be Up/healthy
```

The client is served on **http://localhost:3000** and the API on
**http://localhost:3200**. Create your first account there.

### Configuration

Most settings are plain environment variables. The ones you will want to
change:

| Variable | Service | Default | Purpose |
| --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | client | *(required)* | Signs session cookies. Compose refuses to start without it. |
| `BETTER_AUTH_URL` | client | `http://localhost:3000` | Must match the address users visit. |
| `ALLOWED_ORIGINS` | backend | `http://localhost:3000` | Comma-separated CORS allowlist for credentialed requests. |
| `APP_ENV` | backend | `production` | Any other value also serves the Swagger UI at `/swagger/`. |
| `DATABASE_URL` / `DB_HOST` | backend / client | dev defaults | PostgreSQL connection strings. |
| `VITE_BACKEND_URL` | client (build arg) | `http://localhost:3200` | Baked into the browser bundle at build time. |

> **Important:** `CLIENT_URL` is the *internal* Docker address
> (`http://client:3000`) that the backend uses to validate sessions — it is
> never seen by a browser. Because browsers send the origin they actually
> typed, always set `ALLOWED_ORIGINS` to your public address. The backend
> logs a warning at startup when its allowlist contains only an internal
> address, and blocked origins surface as a UI that loads but shows no data.

### Persistent data

Two named volumes hold everything that matters:

- `postgres_data` — accounts, sessions, repositories, issues, pull requests.
- `repos_data` — the bare repositories, uploads (logos, avatars, issue
  images) and repository backups. Mounted at `/data/repos` in the backend.

Neither survives `docker compose down -v`, so avoid `-v` unless you intend
to wipe the instance.

### Backups

```bash
# Database
docker compose exec -T postgres pg_dump -U user -d pg > drei-$(date +%F).sql

# Repositories, uploads and backups
docker run --rm -v drei_repos_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/repos-$(date +%F).tar.gz -C /data .
```

Repositories can also be snapshotted from the UI (repo → Settings →
Backup), which writes a verified `git bundle` per repository.

### Upgrading

```bash
git pull
docker compose up -d --build
```

Schema changes are applied automatically on backend start.

### Behind a reverse proxy

Terminate TLS in front of the stack and route **both** services — the UI on
`/` and everything under `/git/` plus `/api/` to the backend. Git
over-HTTP is served by the backend, not the client.

> **Note:** the client bundle currently talks to the backend on
> `http://localhost:3200` in several places, so a remote deployment needs
> either same-origin routing with those URLs adjusted or an SSH tunnel
> (`ssh -L 3000:localhost:3000 -L 3200:localhost:3200 user@host`). This is
> a known limitation, tracked for cleanup.

### Security checklist

- [ ] `BETTER_AUTH_SECRET` generated, stored, and unique to this instance.
- [ ] PostgreSQL `user`/`password` changed from the defaults.
- [ ] `ALLOWED_ORIGINS` set to your real origin (not left at localhost).
- [ ] Served over HTTPS — session cookies travel in every API request.
- [ ] Postgres port `5432` not exposed to the public internet.
- [ ] `APP_ENV=production` so `/swagger/` is not served.

Git pushes require an authenticated session: the backend verifies the
better-auth cookie and requires contributor (or organization member) rights
before handing a `receive-pack` request to `git-http-backend`. Private
repositories are unreadable without the same permission, and archived
repositories reject pushes outright.

## Roadmap

Things that are stubbed or not built yet:

- Repository **Actions**, **Security**, and **Tags** settings pages
- Organization **teams**
- Deployment documentation in languages other than English

## License

Drei is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See the [LICENSE](./LICENSE) file for the complete license text.

## Acknowledgements

Drei stands on the shoulders of a lot of excellent open-source work.

### Frontend

- **React** — the UI library everything is built from
- **TanStack Start & Router** — full-stack React framework and type-safe routing
- **TypeScript** — typed end to end, client and server
- **Vite** — dev server and build tooling
- **Tailwind CSS** — utility-first styling
- **shadcn/ui & Radix UI** — accessible, unstyled component primitives
- **i18next & react-i18next** — localization (English, German)
- **Recharts** — charts for insights and activity
- **Lucide & React Icons** — iconography
- **Bun** — runtime, package manager, and bundler

*Full list in [`client/package.json`](./client/package.json).*

### Backend

- **Go** — the language the backend is written in
- **net/http** — the standard library HTTP server and router
- **go-git** — pure-Go Git implementation for repository operations
- **pgx** — PostgreSQL driver
- **gopsutil** — host and process metrics for the system panel
- **swaggo** — generated Swagger/OpenAPI documentation
- **Git** — served over HTTP via `git-http-backend`

*Full list in [`backend/go.mod`](./backend/go.mod).*

### Infrastructure

- **PostgreSQL** — metadata, accounts, and sessions
- **Docker & Docker Compose** — the deployment stack
- **Git** — the version control system at the core of Drei

### Tooling

- **Biome** — linting and formatting
- **Vitest** — unit testing
- **Air** — live reload for the Go backend
- **Python** — repository maintenance scripts

## Inspiration

Drei exists because the self-hosted Git landscape deserved better. Three
projects shaped it:

- **[Gitea](https://about.gitea.com/)** — proved that self-hosted Git hosting
  can be small, fast, and genuinely easy to run. Drei's ambition is the same
  class of software.
- **[GitLab](https://about.gitlab.com/)** — showed what a Git platform can grow
  into, and where to draw the line. Drei deliberately stays much smaller.
- **[GitHub](https://github.com/)** — set the bar for how repository browsing
  should feel. Familiarity is a feature.

Drei takes the best of those ideas and goes its own way: **a lightweight, fast,
self-hostable Git platform that gives you full control over your infrastructure
and your code.**

---

<p align="center">
  Made with ❤️ and open source.
</p>
