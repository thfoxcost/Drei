# syntax=docker/dockerfile:1

# Production image for the Drei client.
#
# Four stages so the final image carries no build tooling:
#
#   deps     - the native build toolchain plus the full dependency tree, which
#              the Vite build needs because it uses devDependencies (vite,
#              tailwind, @tailwindcss/typography, ...)
#   prod-deps - the production-only dependency tree, installed in a stage that
#              inherits the toolchain so native addons are compiled here and
#              only the finished node_modules is copied forward
#   build    - runs `vite build`, producing dist/client and dist/server
#   runtime  - the build output, server.mjs and prod-deps/node_modules, and
#              nothing else: no compiler, no python, no devDependencies
#
# The runtime stage deliberately does NOT run `vite preview`. That is a
# development server: it has no request timeouts, no graceful shutdown and no
# static cache policy. server.mjs is a plain node:http server instead.

# ---------------------------------------------------------------------------
FROM oven/bun:1.4-alpine AS deps
WORKDIR /app

# Native build toolchain, required by better-sqlite3.
#
# better-sqlite3 is a native addon whose install script is
# `prebuild-install || node-gyp rebuild --release`. It only publishes glibc
# prebuilds, and oven/bun:*-alpine is musl, so prebuild-install always 404s and
# the build always falls through to node-gyp. node-gyp then needs a C/C++
# toolchain plus python3 to drive gyp; oven/bun ships none of them, which is
# what makes `bun install` fail in this stage.
#
# build-base is the Alpine meta-package for that toolchain and covers make,
# g++ and gcc, binutils, and -- the part that is easy to miss -- musl-dev,
# which supplies the libc startup objects and headers every compile needs.
# python3 is separate because gyp is a python program.
#
# This is also why the toolchain cannot live in the runtime stage: it is
# installed here, inherited by prod-deps and build, and the runtime stage
# starts from a clean oven/bun image, so none of it reaches production.
RUN apk add --no-cache build-base python3

# Copied on their own so the dependency layer is cached until the manifests
# actually change.
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# The production tree, installed apart from the full one so the runtime image
# does not carry devDependencies.
#
# It is built in a stage that has the toolchain and only node_modules is copied
# into runtime. The runtime stage must never run `bun install` itself: it is a
# clean oven/bun image, so a native addon would hit exactly the node-gyp
# failure above.
FROM deps AS prod-deps
WORKDIR /prod
COPY package.json bun.lock ./

# shiki is a runtime dependency of the SSR bundle (code blocks are rendered on
# the server), so it lives in dependencies rather than devDependencies.
RUN bun install --frozen-lockfile --production

# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app

COPY . .

# `vite build` evaluates the server module graph, and src/lib/auth.ts
# constructs a pg Pool at module scope, so DB_HOST has to exist during the
# build even though no connection is opened. These are build-time values only;
# BETTER_AUTH_SECRET is a placeholder and must be supplied by the runtime
# environment instead.
ARG DB_HOST=postgres://drei:drei@127.0.0.1:5432/drei
# The public address is not baked in: BETTER_AUTH_URL is read from
# process.env at request time, so the runtime value in docker-compose is the one
# that applies. The default here is the RFC 2606 reserved .invalid domain, which
# cannot resolve; server.mjs refuses to start if it reaches the runtime, so a
# deployment that forgets to set the real address says so instead of rejecting
# every sign-in as an invalid origin. docker-compose passes the real value as a
# build arg so even a build never has to invent one.
ARG BETTER_AUTH_URL=http://drei.invalid
ARG BETTER_AUTH_SECRET=build-time-placeholder-not-a-real-secret
ENV DB_HOST=$DB_HOST \
    BETTER_AUTH_URL=$BETTER_AUTH_URL \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# VITE_ variables are inlined into the client bundle at build time, so they are
# build args rather than runtime environment. Both are empty by default, which
# is the same-origin production topology: API calls are origin-relative and the
# git clone URL falls back to the browser's own origin.
ARG VITE_BACKEND_URL=""
ARG VITE_PUBLIC_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL

# The source tree is mounted from the host, so a developer's local .env (which
# holds real secrets and a localhost database URL) must not leak into the
# image. The ARG/ENV values above are the only configuration the build sees.
RUN rm -f .env .env.local .env.*.local

RUN bun run build

# Fail the build rather than shipping an image whose server cannot start.
RUN test -f dist/server/server.js && test -d dist/client

# ---------------------------------------------------------------------------
# Clean oven/bun image, so the toolchain installed in deps -- python3, make,
# g++, musl-dev and the rest of build-base -- is not in this image. That is the
# whole point of the stage split; do not "fix" a build failure here by adding
# build packages, because the fix belongs in the stage that compiles.
FROM oven/bun:1.4-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# dist/server/server.js still imports packages by bare specifier
# (@tanstack/react-router, react/jsx-runtime, h3-v2, seroval, ...), so the
# production dependency tree has to ship alongside it.
COPY --from=prod-deps /prod/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json server.mjs ./

# node:http and the dist tree are all this needs; run unprivileged.
USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/auth/get-session').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
