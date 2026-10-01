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
</div>

<br>

<p align="center">
  <a href="https://drei.sh">Website</a>
  &nbsp;•&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;•&nbsp;
  <a href="#features">Features</a>
  &nbsp;•&nbsp;
  <a href="#license">License</a>
</p>

---

Drei (pronounced approximately **"dry"**, from the German word for **"three"**) is a free and open-source Git hosting platform designed to be **lightweight, fast, and easy to self-host**.

Run Drei on your own server or network and keep full control over your repositories, accounts, and data without relying on a third-party Git hosting provider.

Learn more at **[drei.sh](https://drei.sh)**.

<details>
<summary><strong>Preview</strong></summary>

<br>

<p align="center">
  <img src="assets/screenshots/home.png" alt="Drei home page" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/empty.png" alt="Empty repository" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/repo.png" alt="Repository page" width="900">
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

* **Git Repository Hosting** — Create, manage, and browse Git repositories.
* **Git Push & Clone** — Push to and clone repositories over HTTP.
* **Authentication** — User authentication and account management.
* **Repository Browsing** — Explore files, commits, branches, and repository information.
* **Self-Hosted** — Run Drei on your own infrastructure and keep control of your data.
* **Lightweight** — Built with a simple and efficient architecture focused on performance and low resource usage.

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

### Production with Docker Compose

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
docker compose up --build
```

Change the default `user`/`password` PostgreSQL credentials in
`docker-compose.yml` before exposing a deployment, and serve it behind
HTTPS (Caddy, Nginx, or similar).

## License

Drei is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See the [LICENSE](./LICENSE) file for the complete license text.

## Acknowledgements

### Stack

Drei would not have been possible without the following open-source projects and technologies.

#### Frontend

* **React** — A JavaScript library for building user interfaces.
* **TanStack** — A collection of open-source tools for building modern, type-safe web applications.
* **shadcn/ui** — Accessible and customizable UI components built for React.
* **Vite** — A fast and modern frontend build tool and development server.
* **TypeScript** — A strongly typed programming language built on JavaScript.
* **Lucide** — An open-source icon library used throughout the interface.
* **And other dependencies** listed in `client/package.json`.

#### Backend

* **Go** — A fast, simple, and efficient programming language used to build the Drei backend.
* **net/http** — Go's standard HTTP package used for Drei's HTTP server and API.
* **go-git** — A pure Go implementation of Git used for repository operations.
* **Air** — A live-reloading development tool for Go applications.
* **Better Auth** — A framework-agnostic authentication and authorization framework for TypeScript.
* **And other dependencies** listed in `server/package.json` and `go.mod`.

#### Documentation

* **Coming soon** — Drei's documentation stack is currently being evaluated and will be documented once a stable setup is finalized.

#### Project

* **Bun** — A fast all-in-one JavaScript and TypeScript runtime, package manager, bundler, and toolkit.
* **Python** — Used for custom scripts and manual repository maintenance.
* **Git** — The distributed version control system at the core of Drei.

#### Infrastructure

* **Coming soon** — Deployment and infrastructure technologies will be documented once the production setup is finalized.

## Inspiration

Drei would not have been possible without the projects and communities that have shaped the modern Git hosting ecosystem.

### Gitea

**Gitea** is a lightweight, self-hosted Git service focused on simplicity, performance, and ease of deployment.

Gitea was one of the main inspirations behind Drei's goal of providing a **simple, lightweight, and self-hosted alternative for Git repository hosting**. Its approach to repository management and self-hosting helped shape many of the ideas behind Drei.

### GitLab

**GitLab** is a comprehensive DevOps platform built around Git.

Drei takes inspiration from GitLab's approach to repository management, source browsing, and developer workflows. While Drei is intentionally much smaller in scope, GitLab demonstrated how Git hosting can evolve into a complete development platform.

### GitHub

**GitHub** has also influenced Drei's user experience, particularly its familiar approach to repository browsing, project organization, and collaboration.

Drei builds upon these ideas while pursuing its own goal: **a lightweight, fast, and self-hostable Git platform that gives users full control over their infrastructure and code.**

---

<p align="center">
  Made with ❤️ and open source.
</p>
