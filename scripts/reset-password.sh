#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$#" -ne 1 ]; then echo "Usage: bash scripts/reset-password.sh USERNAME"; exit 1; fi
read -r -s -p "New password (10–128 characters): " password
printf '\n'
read -r -s -p "Repeat new password: " repeat
printf '\n'
if [ "$password" != "$repeat" ]; then echo "Passwords do not match"; exit 1; fi
printf '%s' "$password" | docker compose exec -T planet node backend/admin.mjs reset-password "$1"
unset password repeat
