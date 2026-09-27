#!/usr/bin/env bash
# Stop the Drei prod frontend + backend containers.
# Keeps Postgres running and never touches volumes (repos + DB are safe).
set -euo pipefail

cd "$(dirname "$0")"

# NOTE: stops by container name, not compose service name — the backend/client
# services only exist in the prod compose file, so `docker compose stop`
# fails with "no such service" on branches where they're absent.
sudo docker stop drei-backend drei-client

echo "--- remaining drei containers ---"
sudo docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i drei || true
