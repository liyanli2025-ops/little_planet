
import {DatabaseSync,backup} from 'node:sqlite';
import {randomBytes,scryptSync} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const filename=process.env.DATABASE_PATH||path.resolve('data/planet.sqlite');
const [command,arg]=process.argv.slice(2);
if(!fs.existsSync(filename))throw Error('Database does not exist');
if(command==='backup'){
 if(!arg||fs.existsSync(arg))throw Error('Use a new backup filename');
 const db=new DatabaseSync(filename);
 await backup(db,arg);db.close();
 const check=new DatabaseSync(arg,{readOnly:true});
 if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup integrity check failed');
 check.close();fs.chmodSync(arg,0o600);console.log('Backup verified: '+arg);
}else if(command==='reset-password'){
 if(!arg)throw Error('Usage: reset-password USERNAME');
 let input='';for await(const c of process.stdin)input+=c;
 const password=input.replace(/\r?\n$/, '');
 if(password.length<10||password.length>128)throw Error('Password must contain 10–128 characters');
 const db=new DatabaseSync(filename),user=db.prepare('SELECT slot FROM users WHERE username=?').get(arg.toLowerCase());
 if(!user)throw Error('User not found');
 const salt=randomBytes(24).toString('hex'),digest=scryptSync(password,salt,64).toString('hex');
 db.exec('BEGIN IMMEDIATE');
 try{
  db.prepare('UPDATE users SET salt=?,password=? WHERE slot=?').run(salt,digest,user.slot);
  db.prepare('DELETE FROM sessions WHERE slot=?').run(user.slot);
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e}
 db.close();console.log('Password reset; existing sessions revoked.');
}else throw Error('Commands: backup OUTPUT.sqlite | reset-password USERNAME (password from stdin)');
