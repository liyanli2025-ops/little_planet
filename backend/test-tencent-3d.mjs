// Operator-only live probe. No credentials or signed URLs are printed.
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import {createTencent3D,inspectGLB} from './tencent-3d.mjs';
const cmd=process.argv[2]||'status';
if(!['status','generate','export'].includes(cmd)){console.error('用法：node backend/test-tencent-3d.mjs status|generate|export');process.exit(1)}
if(!process.env.TENCENT_3D_API_KEY?.trim()){console.error('容器没有读取到 TENCENT_3D_API_KEY；需要更新 compose 配置并重建容器。');process.exit(1)}
const db=new DatabaseSync(process.env.DATABASE_PATH||'/data/planet.sqlite');db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS tencent_3d_probe(id INTEGER PRIMARY KEY CHECK(id=1),status TEXT NOT NULL,job TEXT,model BLOB)');
const client=createTencent3D();
try{
 let row=db.prepare('SELECT * FROM tencent_3d_probe WHERE id=1').get();
 if(cmd==='export'){if(!row?.model)throw new Error('模型尚未下载完成');writeFileSync('/tmp/echoo-tencent-sofa.glb',row.model,{mode:0o600});console.log('已导出 /tmp/echoo-tencent-sofa.glb');process.exitCode=0}
 else if(!row&&cmd==='status'){console.log('已读取腾讯 Key（未显示）。尚未提交任务；此检查未调用生成接口。')}
 else{
  if(!row){db.prepare("INSERT INTO tencent_3d_probe(id,status) VALUES(1,'submitting')").run();console.log('提交一次真实生成：HY-3D-3.1，2万面。按腾讯额度计费。');const job=await client.submit('单独一张奶油色双人沙发，圆润厚实的靠背，矮胡桃木腿，两个鼠尾草绿抱枕，温馨柔和的风格。只有沙发，没有房间、地板、人物和文字。');db.prepare("UPDATE tencent_3d_probe SET status='queued',job=? WHERE id=1").run(job.id);row=db.prepare('SELECT * FROM tencent_3d_probe WHERE id=1').get()}
  if(row.model)console.log('真实模型已保存：',JSON.stringify(inspectGLB(row.model)));
  else if(!row.job)throw new Error('上一次提交未获确认。为避免重复扣费，已停止自动重提；请核查腾讯控制台任务记录。');
  else{
   console.log('任务编号：'+row.job+'。后续执行同一命令只查询，不再次生成。');
   const d=await client.query(row.job);db.prepare('UPDATE tencent_3d_probe SET status=? WHERE id=1').run(d.status);
   if(d.status==='completed'){const file=d.data?.find(x=>x.type==='glb');if(!file)throw new Error('结果没有 GLB 文件');const model=await client.download(file.url);db.prepare('UPDATE tencent_3d_probe SET model=? WHERE id=1').run(model);console.log('真实模型已保存：'+JSON.stringify(inspectGLB(model))+'。尚未放入小屋。')}
   else if(d.status==='failed')throw new Error('腾讯生成失败，请用任务编号查询原因；不会自动重复生成');
   else console.log('状态：'+(d.status==='queued'?'排队中':'生成中')+'。约一分钟后再次运行同一命令查询。');
  }
 }
}catch(e){console.error(e.message);process.exitCode=1}finally{db.close()}
