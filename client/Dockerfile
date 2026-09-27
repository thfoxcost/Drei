# Drei client — TanStack Start (React 19) app, built with Bun and served
# in production by a minimal Bun server (see ./server.js).
#
# Build (context must be the client/ directory):
#   docker build -t drei-client \
#     --build-arg VITE_BACKEND_URL=http://localhost:3200 \
#     --build-arg DB_HOST=postgres://user:password@postgres:5432/pg \
#     ./client
# Run:
#   docker run -p 3000:3000 \
#     -e BETTER_AUTH_URL=http://localhost:3000 \
#     -e BETTER_AUTH_SECRET=... \
#     -e DB_HOST=postgres://user:password@postgres:5432/pg \
#     drei-client
#
# Notes:
# - VITE_BACKEND_URL is baked into the client bundle at build time.
# - DB_HOST is needed at build time (pg Pool is created at module scope
#   in src/lib/auth.ts) and again at runtime by better-auth.
# - BETTER_AUTH_URL / BETTER_AUTH_SECRET are runtime-only.

FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG VITE_BACKEND_URL=http://localhost:3200
ARG DB_HOST=postgres://user:password@postgres:5432/pg
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL} \
    DB_HOST=${DB_HOST}

RUN bun run build


FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Minimal production server (see ./server.js): serves pre-built static
# assets from ./dist/client, falls back to TanStack Start SSR handler.
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --chown=bun:bun ./server.js ./server.js

EXPOSE 3000
USER bun
CMD ["bun", "server.js"]
