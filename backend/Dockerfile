# Drei backend — Go API + git-over-HTTP (git-http-backend CGI passthrough).
#
# Build (context must be the backend/ directory):
#   docker build -t drei-backend ./backend
# Run:
#   docker run -p 3200:3200 \
#     -e DATABASE_URL=postgres://user:password@postgres:5432/pg \
#     -e CLIENT_URL=http://localhost:3000 \
#     -v drei-repos:/data/repos \
#     drei-backend
# (The DATABASE_URL above uses local development default credentials —
# change user/password in production.)
#
# Runtime env (see backend/.env.example):
#   PORT (default 3200), REPOS_PATH (default /data/repos),
#   DATABASE_URL (required), CLIENT_URL, APP_ENV,
#   GIT_HTTP_BACKEND (default /usr/lib/git-core/git-http-backend)

FROM golang:1.26-bookworm AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /app/server ./cmd/server


FROM debian:bookworm-slim AS runner

# git provides both the `git` CLI (repo init/clone/config) and the
# git-http-backend binary (git push/clone over HTTP via CGI).
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --system --create-home --uid 1001 drei \
    && mkdir -p /data/repos /app \
    && chown -R drei:drei /data/repos /app

COPY --from=builder --chown=drei:drei /app/server /app/server

ENV PORT=3200 \
    REPOS_PATH=/data/repos \
    GIT_HTTP_BACKEND=/usr/lib/git-core/git-http-backend \
    APP_ENV=production

VOLUME /data/repos
EXPOSE 3200
USER drei
WORKDIR /app
CMD ["/app/server"]
