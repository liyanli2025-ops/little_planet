#!/usr/bin/env python3
"""Configure the selected BigModel free model locally; never print the API key."""
import getpass
import os
from pathlib import Path
import re
import sys
import tempfile
from datetime import datetime, timezone

VALUES = {
    'AI_DESIGN_ENABLED': 'true',
    'AI_BASE_URL': 'https://open.bigmodel.cn/api/paas/v4',
    'AI_MODEL': 'glm-4.7-flash',
    'AI_DESIGN_DAILY_LIMIT': '5',
    'AI_DESIGN_GLOBAL_DAILY_LIMIT': '50',
}

def replace_settings(content, key):
    # BigModel keys use a printable token. Reject dotenv syntax rather than interpreting it.
    if not re.fullmatch(r'[A-Za-z0-9._~+/=-]{10,512}', key):
        raise ValueError('密钥格式不正确，请复制完整密钥，不要包含空格或引号。')
    values = {**VALUES, 'AI_API_KEY': key}
    output = []
    for line in content.splitlines():
        match = re.match(r'^\s*(?:export\s+)?([A-Z_]+)\s*=', line)
        if not match or match.group(1) not in values:
            output.append(line)
    output.extend(f'{name}={value}' for name, value in values.items())
    return '\n'.join(output) + '\n'

def main():
    root = Path(__file__).resolve().parent.parent
    target = root / '.env'
    if not target.is_file():
        raise ValueError('没有找到现有 .env，请先完成网站的基础配置。')
    if 'AI_API_KEY:' not in (root / 'compose.yaml').read_text(encoding='utf-8'):
        raise ValueError('请先上传并安装最新更新包。')
    if not sys.stdin.isatty():
        raise ValueError('请直接在服务器终端运行，不要通过管道传入密钥。')
    content = target.read_text(encoding='utf-8')
    key = getpass.getpass('粘贴智谱 API Key 后按回车（输入不会显示）：').strip()
    next_content = replace_settings(content, key)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup = root / ('.env.ai-before-' + stamp)
    fd = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as handle:
        handle.write(content)
    fd, temporary = tempfile.mkstemp(prefix='.env.ai-', dir=root)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as handle:
            handle.write(next_content)
        os.chmod(temporary, 0o600)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print('已配置 glm-4.7-flash，原有配置已备份，密钥未显示。')
    print('接下来执行：sudo docker compose up -d --build')

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, EOFError, KeyboardInterrupt) as error:
        print(str(error) if isinstance(error, ValueError) else '配置未完成，请检查文件权限后重试。', file=sys.stderr)
        sys.exit(1)
