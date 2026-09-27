# syntax=docker/dockerfile:1

# Production image for the Drei Go backend.
#
# Two stages: a builder that compiles the binary, and a small runtime that
# carries only the binary and the packages the git CGI passthrough shells out
# to.

# ---------------------------------------------------------------------------
FROM golang:1.26-alpine AS build
WORKDIR /src

# go.mod and go.sum first so the module download layer is cached.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO is not needed: the binary talks to Postgres over TCP and shells out to
# git. A static build keeps the runtime image to a plain Alpine with no libc
# coupling.
#
# The repository is built as ./cmd/server, not from ./... , so the stray
# backend/main and backend/server binaries that are committed in the work tree
# are never linked in.
RUN CGO_ENABLED=0 GOOS=linux go build \
      -trimpath \
      -ldflags="-s -w" \
      -o /out/drei-server \
      ./cmd/server

# ---------------------------------------------------------------------------
FROM alpine:3.21 AS runtime

# git-core provides /usr/lib/git-core/git-http-backend, which the /git/ route
# invokes through net/http/cgi. Without it every git clone and push 500s.
# ca-certificates is needed for outbound TLS from the session lookup and
# external services. tzdata is needed so git renders commit dates in local time.
RUN apk add --no-cache \
      git \
      ca-certificates \
      tzdata \
 && addgroup -S drei && adduser -S -G drei drei

WORKDIR /app
COPY --from=build /out/drei-server /app/drei-server

# REPOS_PATH is the only directory the backend writes to: bare repositories,
# uploaded logos, issue and pull request images, organization avatars and the
# bundled backups. It is declared as a volume so the data survives a container
# replacement.
ENV PORT=3200 \
    BIND_ADDR=0.0.0.0 \
    REPOS_PATH=/var/lib/drei/repos \
    GIT_HTTP_BACKEND=/usr/lib/git-core/git-http-backend

RUN mkdir -p "$REPOS_PATH" && chown -R drei:drei /var/lib/drei /app

USER drei
VOLUME ["/var/lib/drei"]
EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/status" >/dev/null || exit 1

ENTRYPOINT ["/app/drei-server"]
