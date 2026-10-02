import importlib.util
from pathlib import Path, PurePosixPath
import os
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('updater',Path(__file__).resolve().parents[1]/'scripts/update.py')
u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)

class UpdateTests(unittest.TestCase):
 def test_space_accounts_for_backup_and_package(self):
  self.assertEqual(u.required_space(100,50),3*1024**3+200)
 def test_retention_only_known_backups(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d)
   for i in range(10):
    p=root/f'planet-20261002T120000Z-{i}.sqlite';p.touch();os.utime(p,(i+1,i+1))
   keep=root/'personal.sqlite';keep.touch()
   partial=root/'planet-20261002T120000Z-99.sqlite.partial';partial.touch()
   self.assertEqual(len(u.obsolete_backups(root)),3)
   self.assertNotIn(keep,u.obsolete_backups(root));self.assertNotIn(partial,u.obsolete_backups(root))
 def scenario(self,fail_at=None,free=10*1024**3,check=False):
  old=Path.cwd();calls=[]
  with tempfile.TemporaryDirectory() as d:
   repo=Path(d);(repo/'.git').mkdir();(repo/'scripts').mkdir();(repo/'backups').mkdir()
   (repo/'scripts/backup.sh').write_text('temporary="/tmp/planet-test.sqlite"')
   def command(args,capture=False):
    calls.append(args)
    if fail_at and fail_at(args):raise u.subprocess.CalledProcessError(1,args)
    if args[:2]==['git','status']:return ''
    if args[:2]==['git','rev-parse']:return 'a'*40
    if 'stat' in args:return '120000000'
    if 'node' in args:return '50000000'
    if 'ps' in args:return 'container'
    if 'inspect' in args:return 'healthy' if 'Health' in args[-2] else 'sha256:old'
    if args[:3]==['sudo','sh',str(args[-1])]:self.assertIn('/data/planet-backup-',Path(args[-1]).read_text())
    return ''
   try:
    with patch.object(u.os,'geteuid',return_value=1000,create=True),patch.object(u.shutil,'disk_usage',return_value=type('Usage',(),{'free':free})()):
     if fail_at or free<1024**3:
      with self.assertRaises((RuntimeError,u.subprocess.CalledProcessError)):u.deploy(repo,PurePosixPath('/root/echoo-test.bundle'),check,command,lambda _:None)
     else:u.deploy(repo,None if check else PurePosixPath('/root/echoo-test.bundle'),check,command,lambda _:None)
   finally:os.chdir(old)
  return calls
 def test_low_space_stops_before_copy_or_backup(self):
  calls=self.scenario(free=1);self.assertFalse(any('install' in c or 'merge' in c or 'sh' in c for c in calls))
 def test_failed_backup_never_merges_or_cleans(self):
  calls=self.scenario(fail_at=lambda c:c[:2]==['sudo','sh']);self.assertFalse(any('merge' in c or 'prune' in c or 'rm' in c for c in calls))
 def test_build_failure_preserves_bundle(self):
  calls=self.scenario(fail_at=lambda c:'build' in c);self.assertFalse(any('rm' in c or 'prune' in c for c in calls))
 def test_success_checks_health_before_cleanup_and_never_prunes_volumes(self):
  calls=self.scenario();health=next(i for i,c in enumerate(calls) if any('State.Health' in x for x in c));cleanup=next(i for i,c in enumerate(calls) if 'prune' in c);self.assertLess(health,cleanup);self.assertFalse(any('--volumes' in c for c in calls));self.assertIn(['sudo','rm','--','/root/echoo-test.bundle'],calls)
 def test_preflight_no_package_or_mutations(self):
  calls=self.scenario(check=True);self.assertFalse(any('install' in c or 'fetch' in c or 'sh' in c or 'rm' in c for c in calls))

if __name__=='__main__':unittest.main()
