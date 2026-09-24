"""Create a fresh deployment configuration without overwriting an existing .env."""
import argparse
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit
p = argparse.ArgumentParser()
p.add_argument("--origin", required=True, help="Browser URL, without trailing slash")
args = p.parse_args()
url = urlsplit(args.origin)
if (url.scheme not in ("http", "https") or not url.hostname or url.username or
    url.password or url.path or url.query or url.fragment or
    any(c not in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.:/[]" for c in args.origin)):
    p.error("Use an http(s) origin such as http://YOUR_SERVER_IP:8081 (no trailing slash)")
target = Path(__file__).resolve().parent.parent / ".env"
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(f"PUBLIC_ORIGIN={args.origin}\nHOST_PORT=8081\nBIND_ADDRESS=0.0.0.0\nREGISTRATION_CODE={secrets.token_hex(24)}\n")
print("Created .env. View its REGISTRATION_CODE privately on your server. Do not upload or send it.")
