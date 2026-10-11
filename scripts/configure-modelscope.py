#!/usr/bin/env python3
"""Store the token in the ignored server .env, with hidden input and no secret output."""
from pathlib import Path
import getpass
import os
import subprocess

root = Path(__file__).resolve().parent.parent
token = getpass.getpass('ModelScope token (hidden input): ').strip()
if not token or any(c.isspace() for c in token):
    raise SystemExit('Invalid token. Configuration unchanged.')
envfile = root / '.env'
lines = envfile.read_text().splitlines() if envfile.exists() else []
lines = [line for line in lines if not line.startswith(('MODELSCOPE_TOKEN=', 'MODELSCOPE_IMAGE_MODEL='))]
lines += ['MODELSCOPE_TOKEN=' + token, 'MODELSCOPE_IMAGE_MODEL=Qwen/Qwen-Image-Edit']
envfile.write_text('\n'.join(lines) + '\n')
os.chmod(envfile, 0o600)
subprocess.run(['sudo', 'docker', 'compose', 'up', '-d', '--no-build', 'planet'], cwd=root, check=True)
print('ModelScope configured. Token was not printed.')
