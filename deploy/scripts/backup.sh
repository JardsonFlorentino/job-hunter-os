#!/usr/bin/env sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-$HOME/apps/job-hunter-os}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/deploy/.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_DIR/docker-compose.vps.yml}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/job-hunter-os}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/jobhunter-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
TEMP_SQL="$(mktemp "$BACKUP_DIR/.jobhunter-$STAMP.XXXXXX.sql")"
cleanup() { rm -f "$TEMP_SQL"; }
trap cleanup EXIT INT TERM
cd "$PROJECT_DIR"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres sh -lc 'pg_dump --clean --if-exists --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$TEMP_SQL"
test -s "$TEMP_SQL"
gzip -9 < "$TEMP_SQL" > "$TARGET"
chmod 600 "$TARGET"
test -s "$TARGET"
printf '[backup] criado: %s\n' "$TARGET"