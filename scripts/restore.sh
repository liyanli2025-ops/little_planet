#!/bin/sh
# Explicit restore only: stops this project's container, validates the backup, then restores.
set -eu
cd "$(dirname "$0")/.."
if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then echo "Usage: sh scripts/restore.sh backups/FILE.sqlite"; exit 1; fi
source_file="$(realpath "$1")"
printf 'Restore %s? This replaces the planet database, including accounts. Type RESTORE: ' "$source_file"
read -r answer
[ "$answer" = "RESTORE" ] || exit 1
# Keep a verified copy of the current database before stopping.
sh scripts/backup.sh
docker compose stop planet
# A one-off container sees only our volume; other services and their data are untouched.
docker compose run --rm -T --no-deps --user 0:0 -v "$source_file:/restore.sqlite:ro" planet node --input-type=module -e '
import fs from "node:fs"; import {DatabaseSync} from "node:sqlite";
const source=new DatabaseSync("/restore.sqlite",{readOnly:true});
if(source.prepare("PRAGMA integrity_check").get().integrity_check!=="ok")throw Error("Invalid backup");
if(source.prepare("PRAGMA user_version").get().user_version!==1)throw Error("Unsupported schema");
for(const table of ["users","sessions","invitations","saves","receipts"])source.prepare("SELECT * FROM "+table+" LIMIT 1").all();
source.close();
const target="/data/planet.sqlite";
fs.copyFileSync("/restore.sqlite",target+".restore");
for(const suffix of ["-wal","-shm"])if(fs.existsSync(target+suffix))fs.unlinkSync(target+suffix);
fs.renameSync(target+".restore",target);fs.chmodSync(target,0o600);
const restored=new DatabaseSync(target);restored.exec("DELETE FROM sessions; DELETE FROM invitations;");restored.close();fs.chownSync(target,1000,1000);
console.log("Restored. All users must log in again.");
'
docker compose up -d planet
