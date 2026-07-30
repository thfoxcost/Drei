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

Drei is designed to provide a simple self-hosting experience while remaining easy to configure and extend.

> **Note:** Installation and deployment instructions are currently being finalized.

For development, clone the repository and install the project dependencies before starting the frontend and backend services.

More detailed installation and deployment documentation will be available as the project matures.

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
