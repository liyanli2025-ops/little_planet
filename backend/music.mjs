import {randomUUID} from 'node:crypto';
import {fail,hash} from './store.mjs';
const safeURL=(value,host)=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:''}catch{return ''}};
export function createMusicService(store,{fetcher=fetch}={}){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS fm_tracks(id TEXT PRIMARY KEY,value TEXT NOT NULL,updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS fm_hearts(slot INTEGER NOT NULL REFERENCES users(slot),track TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(slot,track));
 CREATE TABLE IF NOT EXISTS fm_gifts(id TEXT PRIMARY KEY,sender INTEGER NOT NULL,recipient INTEGER NOT NULL,track TEXT NOT NULL,message TEXT NOT NULL,created INTEGER NOT NULL);`);
 const saved=id=>{const r=db.prepare('SELECT value,updated FROM fm_tracks WHERE id=?').get(id);return r?{...JSON.parse(r.value),updated:r.updated}:null};
 const publicTrack=t=>{if(!t)return null;const {audio,updated,...rest}=t;return rest};

 function view(slot){return {configured:true,provider:'qq',canConfigure:false,hearts:db.prepare('SELECT track FROM fm_hearts WHERE slot=? ORDER BY created DESC').all(slot).map(x=>x.track),gifts:store.get(slot).paired?db.prepare('SELECT * FROM fm_gifts WHERE recipient=? ORDER BY created DESC LIMIT 100').all(slot).map(x=>({...x,song:publicTrack(saved(x.track))})):[]}}
 const remember=t=>db.prepare('INSERT INTO fm_tracks VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated=excluded.updated').run(t.id,JSON.stringify(t),Date.now());
 async function resolve(mid){
  fail(/^[a-zA-Z0-9]{14}$/.test(mid),'请粘贴 QQ 音乐歌曲详情链接（包含 songmid）');
  const u=new URL('https://u.y.qq.com/cgi-bin/musicu.fcg');u.search=new URLSearchParams({format:'json',data:JSON.stringify({comm:{ct:23,cv:0},data_id:{module:'track_info.UniformRuleCtrlServer',method:'GetTrackInfo',param:{mids:[mid],types:[0]}}})});
  try{const r=await fetcher(u.href,{redirect:'error',signal:AbortSignal.timeout(10000)});fail(r.ok,'QQ 音乐暂时连接不上，请重试',502);let n=0,parts=[];for await(const c of r.body){n+=c.length;fail(n<2000000,'歌曲数据过大',502);parts.push(c)}const d=JSON.parse(Buffer.concat(parts));const x=d.data_id?.data?.tracks?.[0];fail(x&&x.mid===mid,'没有找到这首 QQ 音乐歌曲',404);const album=x.album?.mid;return {id:'qq:'+mid,mid,provider:'qq',title:String(x.title||x.name||'未命名歌曲').slice(0,160),artist:Object.values(x.singer||{}).map(s=>s.name).join(' / ').slice(0,160),cover:/^[a-zA-Z0-9]{14}$/.test(album||'')?'https://y.gtimg.cn/music/photo_new/T002R300x300M000'+album+'.jpg':'',url:'https://y.qq.com/n/ryqq/songDetail/'+mid,duration:Number(x.interval)||0};}catch(e){if(e.status)throw e;fail(false,'QQ 音乐暂时连接不上，请重试',502)}
 }

 let refreshed=0,refreshing=null,discoveryWarning='';
 async function discover(){
  if(Date.now()-refreshed<3600000)return;if(refreshing)return refreshing;
  refreshing=(async()=>{let count=0;const results=await Promise.allSettled([26,27,4].map(async topid=>{const u=new URL('https://u.y.qq.com/cgi-bin/musicu.fcg');u.search=new URLSearchParams({format:'json',data:JSON.stringify({comm:{ct:24,cv:0},top:{module:'musicToplist.ToplistInfoServer',method:'GetDetail',param:{topid,offset:0,num:300}}})});const r=await fetcher(u.href,{redirect:'error',signal:AbortSignal.timeout(12000)});fail(r.ok,'榜单暂不可用',502);let size=0,parts=[];for await(const c of r.body){size+=c.length;fail(size<5000000,'榜单数据过大',502);parts.push(c)}const d=JSON.parse(Buffer.concat(parts));fail(d.top?.code===0&&Array.isArray(d.top?.data?.songInfoList),'榜单暂不可用',502);return d.top.data.songInfoList;}));
   for(const r of results){if(r.status!=='fulfilled')continue;for(const x of r.value){if(x.pay?.pay_play!==0||!/^[a-zA-Z0-9]{14}$/.test(x.mid||''))continue;const album=x.album?.mid;remember({id:'qq:'+x.mid,mid:x.mid,provider:'qq',title:String(x.title||x.name||'未命名歌曲').slice(0,160),artist:Object.values(x.singer||{}).map(a=>a.name).join(' / ').slice(0,160),cover:/^[a-zA-Z0-9]{14}$/.test(album||'')?'https://y.gtimg.cn/music/photo_new/T002R300x300M000'+album+'.jpg':'',url:'https://y.qq.com/n/ryqq/songDetail/'+x.mid,duration:Number(x.interval)||0});count++;}}
   discoveryWarning=count?'':'暂时未能更新 QQ 榜单，先听已保存的歌曲。';refreshed=Date.now()-(count?0:3540000);
  })().finally(()=>refreshing=null);return refreshing;
 }
 async function list(slot,mode='discover'){
  fail(['discover','hearts','gifts'].includes(mode),'频道不存在');const v=view(slot);
  if(mode==='hearts')return {...v,tracks:v.hearts.map(id=>publicTrack(saved(id))).filter(t=>t?.provider==='qq')};
  if(mode==='gifts')return {...v,tracks:v.gifts.map(x=>x.song).filter(t=>t?.provider==='qq')};
  await discover();
  let tracks=db.prepare("SELECT value FROM fm_tracks WHERE id LIKE 'qq:%' ORDER BY updated DESC LIMIT 500").all().map(x=>JSON.parse(x.value));
  if(!tracks.length){const t=await resolve('003IPDsn4ZWb5H');remember(t);tracks=[t]}
  return {...v,tracks:tracks.map(publicTrack),notice:discoveryWarning,source:"QQ 音乐公开榜单"};
 }
 async function track(slot,id){fail(/^qq:[a-zA-Z0-9]{14}$/.test(id),'歌曲编号不正确');const t=saved(id);fail(t,'请先添加这首歌',404);return {track:publicTrack(t)}}
 async function add(slot,b){let mid=String(b.link||'').trim();if(!/^[a-zA-Z0-9]{14}$/.test(mid)){try{const u=new URL(mid);fail(u.protocol==='https:'&&(u.hostname==='y.qq.com'||u.hostname==='i.y.qq.com'),'请使用 QQ 音乐官方歌曲链接');mid=u.searchParams.get('songmid')||u.pathname.match(/songDetail\/([a-zA-Z0-9]{14})/)?.[1]||'';}catch(e){if(e.status)throw e;fail(false,'请粘贴 QQ 音乐歌曲详情链接')}}const t=await resolve(mid);remember(t);return {...store.get(slot),...view(slot),track:t}}
 function mutate(slot,b){return store.transaction(()=>{
  fail(b&&typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'互动请求不正确');const digest=hash(JSON.stringify(b)),receipt=db.prepare('SELECT digest FROM receipts WHERE slot=? AND command=?').get(slot,b.command);if(receipt){fail(receipt.digest===digest,'重复请求内容不同',409);return {...store.get(slot),...view(slot)}};
  const row=store.read();fail(b.revision===row.revision,'存档刚更新，请重试',409);const t=saved(b.id);fail(t,'请重新载入这首歌',404);
  if(b.action==='heart'){fail(typeof b.liked==='boolean','请选择收藏状态');if(b.liked){fail(db.prepare('SELECT COUNT(*) AS n FROM fm_hearts WHERE slot=?').get(slot).n<1500,'红心收藏已满');db.prepare('INSERT OR IGNORE INTO fm_hearts VALUES(?,?,?)').run(slot,t.id,Date.now())}else db.prepare('DELETE FROM fm_hearts WHERE slot=? AND track=?').run(slot,t.id);}
  else if(b.action==='gift'){
   fail(row.paired,'请先配对，再把这首歌留给对方',403);fail(typeof b.message==='string'&&b.message.length<=500,'留言最多 500 字');fail(row.state.events.length<5000,'手账已满，请先整理');fail(db.prepare('SELECT COUNT(*) AS n FROM fm_gifts').get().n<3000,'留歌唱片已满');const now=Date.now();db.prepare('INSERT INTO fm_gifts VALUES(?,?,?,?,?,?)').run(randomUUID(),slot,1-slot,t.id,b.message.trim(),now);
   row.state.events.unshift({id:randomUUID(),actor:slot,world:1-slot,target:1-slot,title:'留了一首《'+t.title.slice(0,120)+'》',body:b.message.trim()||'这首歌，想让你也听见。',shared:true,pending:false,kind:'life',created:now,weather:'阿球 FM · QQ 音乐',steps:[],comments:[]});
  }else fail(false,'操作不存在');
  db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state));db.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run(slot,b.command,digest,Date.now());return {...store.get(slot),...view(slot)};
 })}
 return {view,list,track,add,mutate};
}
