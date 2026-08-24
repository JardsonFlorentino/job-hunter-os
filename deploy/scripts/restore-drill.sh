#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  printf 'Uso: %s /caminho/backup.sql.gz\n' "$0" >&2
  exit 2
fi
BACKUP_FILE="$1"
test -f "$BACKUP_FILE"
test -s "$BACKUP_FILE"

CONTAINER="jobhunter-restore-drill-$$"
DRILL_PASSWORD="$(openssl rand -hex 24)"
cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT INT TERM

docker run -d --rm --name "$CONTAINER" -e POSTGRES_USER=drill -e POSTGRES_PASSWORD="$DRILL_PASSWORD" -e POSTGRES_DB=jobhunter_restore postgres:15-alpine >/dev/null
attempt=0
until docker exec "$CONTAINER" pg_isready -U drill -d jobhunter_restore >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 30 ] || { printf '[restore-drill] PostgreSQL temporário não iniciou.\n' >&2; exit 1; }
  sleep 1
done

gzip -dc "$BACKUP_FILE" | docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U drill -d jobhunter_restore >/dev/null
TABLE_COUNT="$(docker exec "$CONTAINER" psql -At -U drill -d jobhunter_restore -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")"
[ "$TABLE_COUNT" -gt 0 ]
printf '[restore-drill] PASS: %s tabelas restauradas em container temporário isolado.\n' "$TABLE_COUNT"