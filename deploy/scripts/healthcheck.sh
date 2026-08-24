#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$HOME/apps/job-hunter-os}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/deploy/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.vps.yml}"
HEALTH_URL="${HEALTH_URL:-https://jobhunter.jardsonflorentino.com.br/api/health}"

cd "$PROJECT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps --status running postgres backend frontend
curl --fail --silent --show-error --max-time 15 "$HEALTH_URL"
printf '\n[healthcheck] PASS\n'