#!/usr/bin/env python3
"""Offline deployment: python3 scripts/update.py /root/echoo-update.bundle."""
import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time


def run(args, capture=False):
    result = subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE if capture else None)
    return result.stdout.strip() if capture else ''


def required_space(bundle_size, database_size):
    return 3 * 1024**3 + bundle_size + 2 * database_size


def obsolete_backups(directory, keep=7):
    files = [p for p in directory.glob('planet-*.sqlite')
             if not p.is_symlink() and re.fullmatch(r'planet-\d{8}T\d{6}Z-\d+\.sqlite', p.name)]
    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)[keep:]


def deploy(repo, bundle, check=False, command=run, sleep=time.sleep):
    repo = Path(repo).resolve()
    os.chdir(repo)
    if os.geteuid() == 0:
        raise RuntimeError('请用 ubuntu 用户运行 python3，不要在 python3 前加 sudo。')
    if bundle is not None and (not bundle.is_absolute() or not re.fullmatch(r'echoo-[A-Za-z0-9_-]+\.bundle', bundle.name)):
        raise RuntimeError('请提供 echoo-开头的更新包绝对路径。')
    if command(['git', 'status', '--porcelain', '--untracked-files=no'], True):
        raise RuntimeError('项目有本地修改，已停止更新；不会覆盖这些修改。')
    size = int(command(['sudo', 'stat', '-c', '%s', '--', str(bundle)], True)) if bundle else 128 * 1024**2
    database_size = int(command(['sudo','docker','compose','exec','-T','planet','node','-e',
        "const fs=require('fs');const p=process.env.DATABASE_PATH||'/data/planet.sqlite';console.log(fs.statSync(p).size+(fs.existsSync(p+'-wal')?fs.statSync(p+'-wal').size:0))"], True))
    free = shutil.disk_usage(repo).free
    required = required_space(size, database_size)
    print(f'可用空间 {free/1024**3:.2f} GB；本次至少需要 {required/1024**3:.2f} GB', flush=True)
    if free < required:
        raise RuntimeError('空间不足，已停止；请先清理旧更新包或未使用镜像，再执行。')
    if check:
        print('空间和工作目录预检通过（未提供包时按128 MB预估）；尚未校验包内容，也未部署。')
        return
    # Copy only for the duration of deployment, never accumulate /home/ubuntu copies.
    with tempfile.TemporaryDirectory(prefix='echoo-update-', dir=repo/'.git') as staging:
        local = Path(staging)/'update.bundle'
        command(['sudo','install','-m','0644','--',str(bundle),str(local)])
        command(['git','bundle','verify',str(local)])
        command(['git','fetch',str(local),'refs/heads/main'])
        target = command(['git','rev-parse','FETCH_HEAD'], True)
        command(['git','merge-base','--is-ancestor','HEAD',target])
        container = command(['sudo','docker','compose','ps','-q','planet'],True)
        previous_image = command(['sudo','docker','inspect','--format','{{.Image}}',container],True)
        # Bootstrap the /data fix even when the installed backup script predates it.
        backup = (repo/'scripts/backup.sh').read_text().replace('temporary="/tmp/planet-', 'temporary="/data/planet-backup-')
        with tempfile.NamedTemporaryFile(mode='w',prefix='.backup-update-',suffix='.sh',dir=repo/'scripts',delete=False) as f:
            f.write(backup)
            backup_file = Path(f.name)
        try:
            command(['sudo','sh',str(backup_file)])
        finally:
            backup_file.unlink(missing_ok=True)
        command(['git','merge','--ff-only',target])
        command(['sudo','docker','compose','build','planet'])
        command(['sudo','docker','compose','up','-d','--no-build','planet'])
        healthy = False
        for _ in range(60):
            container = command(['sudo','docker','compose','ps','-q','planet'],True)
            if container:
                status = command(['sudo','docker','inspect','--format','{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}',container],True)
                if status == 'healthy':
                    healthy = True
                    break
                if status in ('unhealthy','exited','dead'):
                    break
            sleep(2)
        if not healthy:
            raise RuntimeError('服务未通过健康检查。备份、更新包、旧镜像已保留；请查看 docker compose logs --tail=80 planet。')
        current_image = command(['sudo','docker','inspect','--format','{{.Image}}',container],True)
        # Non-force removal protects any image used by another container.
        images = command(['sudo','docker','image','ls','--filter','label=io.echoo.managed=true','-q','--no-trunc'],True).splitlines()
        for image in set(images)-{previous_image,current_image}:
            try:
                command(['sudo','docker','image','rm',image])
            except subprocess.CalledProcessError:
                print('镜像正在使用，保留：'+image)
        # These are disposable build caches, not volumes or application records.
        try:
            command(['sudo','docker','builder','prune','-f','--filter','until=168h'])
        except subprocess.CalledProcessError:
            print('服务已健康，构建缓存清理失败，可稍后重试。')
        for old in obsolete_backups(repo/'backups'):
            command(['sudo','rm','--',str(old)])
        # Consume only the submitted bundle, never sweep arbitrary directories.
        if str(bundle.parent) in ('/root','/home/ubuntu'):
            command(['sudo','rm','--',str(bundle)])
        print('更新成功：'+target[:7]+'；保留最近7份备份及上一版镜像，已清理本次更新包。')
        command(['sudo','docker','compose','ps'])


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('bundle',type=Path,nargs='?')
    parser.add_argument('--repo',type=Path,default=Path('/home/ubuntu/little-planet'))
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    if not args.bundle and not args.check:
        parser.error('请指定更新包路径，或用 --check 在上传前检查空间。')
    import fcntl
    lockpath=args.repo.resolve()/'.git/echoo-update.lock'
    with lockpath.open('a') as lock:
        try:
            fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
            deploy(args.repo,args.bundle,args.check)
        except (OSError,RuntimeError,subprocess.CalledProcessError) as e:
            print('更新停止：'+str(e),flush=True)
            raise SystemExit(1)


if __name__=='__main__':
    main()
