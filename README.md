<p align="center">
  <img src="assets/logo-dark.svg" alt="Drei Logo" width="180">
</p>

<div align="center">
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-Go-00ADD8.svg?logo=go&variant=branded&size=sm&mode=dark"><img alt="Go" src="https://www.shieldcn.dev/badge/-Go-00ADD8.svg?logo=go&variant=branded&size=sm&mode=light"></picture>&nbsp;&nbsp;
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm&mode=dark"><img alt="TypeScript" src="https://www.shieldcn.dev/badge/-TypeScript-3178C6.svg?logo=typescript&variant=branded&size=sm&mode=light"></picture>&nbsp;&nbsp;
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-Git-F05032.svg?logo=git&variant=branded&size=sm&mode=dark"><img alt="Git" src="https://www.shieldcn.dev/badge/-Git-F05032.svg?logo=git&variant=branded&size=sm&mode=light"></picture>&nbsp;&nbsp;
<picture><source media="(prefers-color-scheme: dark)" srcset="https://www.shieldcn.dev/badge/-React-61DAFB.svg?logo=react&variant=branded&size=sm&mode=dark"><img alt="React" src="https://www.shieldcn.dev/badge/-React-61DAFB.svg?logo=react&variant=branded&size=sm&mode=light"></picture>
</div>

<details>
<summary>Preview</summary>

<br>

<p align="center">
  <img src="assets/screenshots/home.png" alt="Home" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/empty.png" alt="Empty Repository" width="900">
</p>

<p align="center">
  <img src="assets/screenshots/repo.png" alt="Repository" width="900">
</p>

</details>
<br />

[Deutsch](./docs/README.de.md) | [Arabic](./docs/README.ar.md) | [English](./docs/README.md) | [French](./docs/README.fr.md) (only ones i know)

<hr />
Drei (pronounced "dry," German for "three") is a free, open-source Git hosting platform you can run on your own network — a lightweight, fast, and extensible alternative for teams who want full control over where their code lives.


Learn more at <a href="https://Drei.sh">drei.sh</a>

### Features
<hr />
- Git Repository Hosting — Create and manage Git repositories.
- Git Push & Clone — Push to and clone repositories over HTTP.
- Authentication — User authentication and account management.

### Getting Started
<hr />
Papra is dedicated to providing a simple yet highly configurable self-hosting experience.

For a quick start, simply run the following command:


### License
<hr />
This project is licensed under the GNU AGPLv3 License - see the LICENSE file for details.


## Acknowledgements

### Stack

Drei would not have been possible without the following open-source projects and technologies:

#### Frontend

* **TanStack** — A collection of open-source libraries for building modern, type-safe web applications.
* **shadcn/ui** — Accessible and customizable UI components built with React.
* **Vite** — A fast and modern frontend build tool and development server.
* **TypeScript** — A strongly typed programming language built on top of JavaScript.
* **And other dependencies** listed in `client/package.json`.

#### Backend

* **Go** — A fast, simple, and efficient programming language used to build the DREI backend.
* **net/http** — Go's standard HTTP package, used to build DREI's HTTP server and API.
* **Air** — A live-reloading development tool for Go applications.
* **go-git** — A pure Go implementation of Git used for repository operations.
* **better-auth** — A framework-agnostic authentication and authorization framework for TypeScript.
* **And other dependencies** listed in `server/package.json` and `go.mod`.

#### Documentation

* **Coming soon** — DREI's documentation stack is currently being evaluated and will be added once a stable setup is finalized.

#### Project

* **Bun** — A fast all-in-one JavaScript and TypeScript runtime, package manager, bundler, and test runner.
* **Python** — Used for custom scripts and manual repository maintenance and modification.
* **Git** — The distributed version control system at the core of DREI.

#### Infrastructure

* **Coming soon** — Deployment and infrastructure technologies will be documented once the production infrastructure is finalized.

## Inspiration

This project would not have been possible without the inspiration and work of others. DREI takes inspiration from several projects that have helped shape the modern Git hosting ecosystem.

* **Gitea** — A lightweight, community-driven, self-hosted Git service. Gitea strongly inspired DREI's goal of providing a simple, fast, and easy-to-self-host platform for managing Git repositories, while keeping the experience lightweight and developer-friendly.

* **GitLab** — A complete DevOps platform built around Git. GitLab inspired several aspects of DREI's repository management and developer workflow, particularly its approach to organizing repositories, browsing source code, and integrating Git into a broader development platform.

* **GitHub** — The familiar repository browsing and collaboration experience of GitHub has also influenced DREI's interface and overall developer experience.

DREI builds upon these ideas while aiming to provide its own lightweight and self-hostable approach to Git hosting.
