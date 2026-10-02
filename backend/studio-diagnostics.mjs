import {DatabaseSync} from 'node:sqlite';
const db=new DatabaseSync(process.env.DATABASE_PATH||'/data/planet.sqlite',{readOnly:true});
try{if(!db.prepare("SELECT name FROM sqlite_master WHERE name='studio_diagnostics'").get()){console.log('尚未安装设计诊断更新');}else{const rows=db.prepare('SELECT created,attempt,data FROM studio_diagnostics ORDER BY created DESC,rowid DESC LIMIT 6').all();if(!rows.length)console.log('暂无设计回复校验失败记录');for(const r of rows)console.log(new Date(r.created).toISOString(),'第'+(r.attempt+1)+'次',r.data)}}finally{db.close()}
