#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)-$$"
temporary="/tmp/planet-$stamp.sqlite"
destination="backups/planet-$stamp.sqlite"
partial="$destination.partial"
if [ -e "$destination" ] || [ -e "$partial" ]; then
  echo "Backup filename already exists; try again." >&2
  exit 1
fi
cleanup() {
  rm -f -- "$partial"
  docker compose exec -T planet rm -f -- "$temporary" "$temporary-wal" "$temporary-shm" >/dev/null 2>&1 || :
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
docker compose exec -T planet node backend/admin.mjs backup "$temporary"
# docker cp cannot read tmpfs mounts. Read from inside the running container.
# No TTY: stdout must remain an unchanged binary SQLite stream.
docker compose exec -T planet cat -- "$temporary" > "$partial"
python3 - "$partial" <<'PY'
import sqlite3
import sys
from pathlib import Path
file = Path(sys.argv[1]).resolve()
with sqlite3.connect(file.as_uri() + "?mode=ro&immutable=1", uri=True) as db:
    if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
        raise RuntimeError("Exported backup failed integrity check")
    for table in ("users", "sessions", "invitations", "saves", "receipts"):
        db.execute("SELECT * FROM " + table + " LIMIT 1").fetchall()
    version = db.execute("PRAGMA user_version").fetchone()[0]
    if version not in (1, 2):
        raise RuntimeError("Unsupported backup schema")
    if version == 2:
        db.execute("SELECT * FROM settings LIMIT 1").fetchall()
print("Exported backup verified.")
PY
chmod 600 "$partial"
mv -- "$partial" "$destination"
printf 'Backup saved: %s\nCopy it off this server as well.\n' "$destination"
