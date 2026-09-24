#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
temporary="/tmp/planet-$stamp.sqlite"
destination="backups/planet-$stamp.sqlite"
docker compose exec -T planet node backend/admin.mjs backup "$temporary"
docker compose cp "planet:$temporary" "$destination"
chmod 600 "$destination"
docker compose exec -T planet rm -- "$temporary"
printf 'Backup saved: %s\nCopy it off this server as well.\n' "$destination"
