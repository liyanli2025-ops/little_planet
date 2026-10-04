import {createCafeChat} from './cafe-chat.mjs';
import {createCafe} from './cafe.mjs';
import {studioLayout} from '../dist/studio-layout.js';
import {createStudio} from './studio.mjs';
import {createPhotos} from './photos.mjs';
import {createSocial} from './social.mjs';
import {homeLayouts} from '../dist/home-layout.js';
import {residentPresence} from './resident.mjs';
import {createDesignService} from './design.mjs';
import {createPresence} from './presence.mjs';
import {createTravelService} from './travel.mjs';

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {AppError,fail,hash} from './store.mjs';
import {openAccounts} from './accounts.mjs';
const derive=promisify(scrypt);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const PORT=Number(process.env.PORT||8080),HOST=process.env.HOST||'127.0.0.1';
const ORIGIN=process.env.PUBLIC_ORIGIN||'http://127.0.0.1:'+PORT;
const originURL=new URL(ORIGIN);
if(!['http:','https:'].includes(originURL.protocol)||originURL.origin!==ORIGIN)throw Error('PUBLIC_ORIGIN 必须为完整来源（不带路径或结尾斜线）');
const secure=originURL.protocol==='https:';


const filename=process.env.DATABASE_PATH||path.resolve('data/planet.sqlite');
const hub=openAccounts(filename),db=hub.db;
async function environmentFor(u){const result=await hub.space(u.space).weatherService.get(u.slot,!!hub.partner(u));fail(hub.account(u.id).space===u.space,'配对状态已更新，请刷新后重试',409);return result}
const travelService=createTravelService(db),photos=createPhotos(db);
const designService=createDesignService(db,{partner:id=>hub.partner(hub.account(id)),garment:id=>{const u=hub.account(id);return hub.space(u.space).store.read().state.worlds[u.slot].life.outfit||'plain'},onGift(sender,recipient,id,label,created){const u=hub.account(sender),peer=hub.partner(u);fail(peer?.id===recipient,'配对关系已变化',409);const store=hub.space(u.space).store,row=store.read();fail(row.state.events.length<5000,'手账已满，请先整理',409);row.state.events.unshift({id,title:(u.nickname||u.username)+'送来了一套装扮',body:label,actor:u.slot,world:1-u.slot,target:1-u.slot,shared:true,pending:false,kind:'life',created,weather:row.state.worlds[1-u.slot].weather||'',steps:[],comments:[]});store.db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state))}});
const studio=createStudio(db,{design:designService,theme:id=>{const u=hub.account(id);return hub.space(u.space).store.read().state.worlds[u.slot].theme},partner:id=>hub.partner(hub.account(id))});
setInterval(()=>void studio.tick(),10000).unref();
const presence=createPresence(),social=createSocial();
const cafe=createCafe(db,{partner:u=>hub.partner(u),profile:u=>{const {wearables,...appearance}=designService.current(u.id).design.outfit;return {outfit:hub.space(u.space).store.read().state.worlds[u.slot].life?.outfit||'plain',appearance}},deliver(u,item,id){const target=hub.space(u.space).store,row=target.read(),fridge=row.state.worlds[u.slot].fridge;const found=fridge.find(f=>f.food===item.id&&!f.event&&f.qty<999);if(found)found.qty++;else{fail(fridge.length<190,'冰箱满了，先整理一下再带走',409);fridge.push({id,food:item.id,qty:1})}target.db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state))}});
const cafeChat=createCafeChat({cafe});
const ttl=7*86400000;
const rates=new Map();
function rate(req,kind,max=20){
 const key=kind+':'+req.socket.remoteAddress,now=Date.now();
 let r=rates.get(key);if(!r||r.until<now){r={until:now+600000,n:0};rates.set(key,r)}
 fail(++r.n<=max,'尝试次数较多，请十分钟后再试',429);
}
hub.expireMeals();
setInterval(()=>{try{hub.expireMeals()}catch(e){console.error('Table cleanup failed:',e.message)}},60000).unref();
setInterval(()=>{for(const [k,r]of rates)if(r.until<Date.now())rates.delete(k);db.prepare('DELETE FROM account_sessions WHERE expires<?').run(Date.now());},60000).unref();
function session(req){
 const m=(req.headers.cookie||'').match(/(?:^|;\s*)planet_session=([a-f0-9]{64})(?:;|$)/);
 return m?db.prepare('SELECT s.*,u.id,u.username,u.nickname,u.space,u.slot,u.avatar FROM account_sessions s JOIN accounts u ON u.id=s.account WHERE s.token=? AND s.expires>?').get(hash(m[1]),Date.now()):null;
}
function issue(account,res){
 const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
 db.prepare('DELETE FROM account_sessions WHERE expires<?').run(Date.now());
 db.prepare('INSERT INTO account_sessions(token,account,csrf,expires) VALUES(?,?,?,?)').run(hash(token),account,csrf,Date.now()+ttl);
 // Bound sessions per account to protect a tiny server.
 db.prepare('DELETE FROM account_sessions WHERE account=? AND token NOT IN (SELECT token FROM account_sessions WHERE account=? ORDER BY expires DESC LIMIT 10)').run(account,account);
 res.setHeader('Set-Cookie','planet_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800'+(secure?'; Secure':''));
 return {csrf};
}
function requireUser(req){const u=session(req);fail(u,'请重新登录',401);return u}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function body(req){
 fail((req.headers['content-type']||'').startsWith('application/json'),'请使用 JSON 请求',415);
 let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>8*1024*1024)throw new AppError(413,'存档太大，请先导出整理');chunks.push(c)}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new AppError(400,'JSON 格式不正确')}
}
function credentials(b){
 fail(b&&typeof b.username==='string'&&/^[a-zA-Z0-9_-]{3,24}$/.test(b.username),'账号名使用 3–24 位字母、数字、下划线或短横线');
 fail(typeof b.password==='string'&&b.password.length>=10&&b.password.length<=128,'密码需要 10–128 个字符');
 return b.username.toLowerCase();
}
let hashes=0;
async function passwordHash(password,salt){
 fail(hashes<2,'服务器正忙，请稍后重试',429);hashes++;
 try{return await derive(password,salt,64,{N:16384,r:8,p:1,maxmem:32*1024*1024})}finally{hashes--}
}

function registrationInfo(){return {first:db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n===0,full:false,availableActors:[0,1],canManage:false}}
function identity(u){const p=hub.partner(u),avatars=[0,1];avatars[u.slot]=u.avatar;if(p)avatars[1-u.slot]=p.avatar;return {authenticated:true,secure,accountId:u.id,legacyActor:db.prepare('SELECT slot FROM users WHERE username=?').get(u.username)?.slot,space:u.space,actor:u.slot,username:u.username,nickname:u.nickname||u.username,displayNames:hub.displayNames(u),partnerNickname:p?.nickname||p?.username||null,csrf:u.csrf,partner:p?.username||null,paired:!!p,avatars,invitationExpires:db.prepare('SELECT expires FROM account_invites WHERE account=?').get(u.id)?.expires||null,registration:registrationInfo()}}
async function api(req,res,p){
 const current=session(req),services=current?hub.space(current.space):null,store=services?.store,mediaService=services?.mediaService,musicService=services?.musicService,weatherService=services?.weatherService;
 if(p!=='/api/presence'&&p!=='/api/cafe')store?.expireMeals();
 if(req.method==='GET'&&p==='/api/health')return json(res,200,{ok:true});
 if(req.method==='GET'&&p==='/api/session'){
  const u=session(req);return json(res,200,u?identity(u):{authenticated:false,secure,registration:registrationInfo()});
 }
 if(!current&&!['/api/login','/api/register'].includes(p))requireUser(req);
 if(req.method==='GET'&&p==='/api/environment'){
  const u=requireUser(req);rate(req,'weather',120);return json(res,200,await environmentFor(u));
 }
 if(req.method==='GET'&&p==='/api/cities'){
  requireUser(req);rate(req,'cities',40);return json(res,200,{cities:await weatherService.search(new URL(req.url,'http://local').searchParams.get('q'))});
 }
 if(req.method==='GET'&&p==='/api/fm'){const u=requireUser(req);rate(req,'fm-read',200);return json(res,200,await musicService.list(u.slot,new URL(req.url,'http://local').searchParams.get('mode')||'discover'));}
 if(req.method==='GET'&&p==='/api/fm/track'){const u=requireUser(req);rate(req,'fm-track',200);return json(res,200,await musicService.track(u.slot,new URL(req.url,'http://local').searchParams.get('id')||''));}
 if(req.method==='GET'&&p==='/api/photos'){const u=requireUser(req);return json(res,200,{photos:photos.list(u.id,hub.partner(u)?.id)})}
 if(req.method==='GET'&&/^\/api\/photos\/[a-f0-9-]{36}$/.test(p)){const u=requireUser(req),image=photos.read(u.id,hub.partner(u)?.id,p.split('/').pop());res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});res.end(image);return}
 if(req.method==='GET'&&p==='/api/travel'){const u=requireUser(req),peer=hub.partner(u);const worlds=[null,null];worlds[u.slot]={away:!!travelService.active(u.id)};if(peer)worlds[1-u.slot]={away:!!travelService.active(peer.id)};return json(res,200,{...travelService.view(u.id),worlds})}
 if(req.method==='GET'&&p==='/api/studio'){const u=requireUser(req);return json(res,200,studio.list(u.id))}
 if(req.method==='GET'&&/^\/api\/studio\/jobs\/[a-f0-9-]{36}$/.test(p)){const u=requireUser(req);return json(res,200,studio.get(u.id,p.split('/').pop()))}
 if(req.method==='GET'&&/^\/api\/studio\/assets\/[a-f0-9-]{36}$/.test(p)){const u=requireUser(req),model=studio.asset(u.id,p.split('/').pop());res.writeHead(200,{'Content-Type':'model/gltf-binary','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});return res.end(model)}
 if(req.method==='GET'&&p==='/api/design'){const u=requireUser(req),peer=hub.partner(u),worlds=[null,null];worlds[u.slot]=designService.current(u.id);if(peer)worlds[1-u.slot]=designService.current(peer.id);return json(res,200,{...designService.view(u.id),worlds})}
 if(req.method==='GET'&&p==='/api/media')return json(res,200,mediaService.view(requireUser(req).slot));
 if(req.method==='GET'&&p==='/api/account/history'){const u=requireUser(req);return json(res,200,{archives:hub.archives(u.id)})}
 if(req.method==='GET'&&p==='/api/state')return json(res,200,{...store.get(requireUser(req).slot),space:current.space,displayNames:hub.displayNames(current)});
 fail(req.method==='POST','接口不存在',404);
 fail(req.headers.origin===ORIGIN,'请求来源不匹配，请检查 PUBLIC_ORIGIN',403);
 const b=await body(req);
 if(p==='/api/register'||p==='/api/login'){
  rate(req,'auth',20);
  const username=credentials(b);
  if(p==='/api/register'){

   fail(b.actor===0||b.actor===1,'请选择自己的熊');
   const salt=randomBytes(24).toString('hex'),password=(await passwordHash(b.password,salt)).toString('hex');
   const u=hub.register(username,salt,password,b.actor,b.nickname),auth=issue(u.id,res);
   return json(res,201,{...identity(u),...auth,...hub.space(u.space).store.get(u.slot)});
  }
  const user=db.prepare('SELECT * FROM accounts WHERE username=?').get(username);
  const computed=await passwordHash(b.password,user?.salt||'invalid-user-salt');
  fail(user&&timingSafeEqual(computed,Buffer.from(user.password,'hex')),'账号或密码不正确',401);
  const auth=issue(user.id,res);
  return json(res,200,{...identity(user),...auth,...hub.space(user.space).store.get(user.slot)});
 }
 const u=requireUser(req);
 fail(current?.space===u.space,'配对状态已更新，请刷新后重试',409);
 fail(req.headers['x-csrf-token']===u.csrf,'会话验证失败，请刷新页面',403);
 fail(String(u.space)===req.headers['x-planet-space'],'账号或配对状态已更新，请刷新页面后重试',409);

 if(p==='/api/cafe/chat'){fail(!travelService.active(u.id),'小熊正在旅行',409);return json(res,200,await cafeChat.send(u,b))}
 if(p==='/api/cafe'){fail(b&&typeof b==='object','操作无效');fail(!travelService.active(u.id)||b.action==='leave','小熊正在旅行，回来后再来咖啡馆',409);if(b.action==='join')presence.update(u,{hidden:true});return json(res,200,cafe.update(u,b))}
 if(p==='/api/studio'){rate(req,'studio',30);return json(res,200,await studio.start(u.id,b))}
 if(p==='/api/design'){fail(b&&['generate','accept','rollback','gift','wearGift','previewItem','wardrobePreview'].includes(b.action),'设计操作不存在');return json(res,200,await designService[b.action](u.id,b))}
 if(p==='/api/presence'){fail(b&&typeof b==='object','位置不正确');const peer=hub.partner(u);fail(b.hidden===true||b.world===u.slot||peer,'请先配对再访问对方',403);presence.update(u,travelService.active(u.id)||cafe.has(u.id)?{hidden:true}:b);let live=null,resident=null;if(peer&&!travelService.active(peer.id)&&!cafe.has(peer.id)){live=presence.peer(u,peer);if(!live){const owner=hub.account(peer.id),environment=JSON.parse(store.db.prepare('SELECT value FROM settings WHERE key=?').get('environment:'+owner.slot)?.value||'{}');resident=residentPresence(owner,environment,store.read().state.worlds[owner.slot].life.outfit)}}return json(res,200,{peer:live,resident,social:social.peek(u)})}
 if(p==='/api/photos'){rate(req,'photos',120);if(b.action==='save')return json(res,200,{photo:photos.save(u.id,b)});if(b.action==='share'&&b.shared)fail(hub.partner(u),'请先连接对方',403);return json(res,200,photos.change(u.id,b))}
 if(p==='/api/travel'){rate(req,'travel',40);fail(['depart','collect'].includes(b.action),'旅行操作不存在');return json(res,200,b.action==='depart'?travelService.depart(u.id,u.avatar):travelService.collect(u.id))}
 if(p==='/api/account/profile'){rate(req,'profile',30);hub.profile(u.id,b.nickname);return json(res,200,identity({...u,...hub.account(u.id)}))}
 if(p==='/api/environment'){
  rate(req,'location',30);weatherService.configure(u.slot,b);return json(res,200,await environmentFor(u));
 }
 if(p==='/api/fm'){rate(req,'fm-write',150);if(b.action==='add'){rate(req,'fm-add',20);return json(res,200,await musicService.add(u.slot,b));}return json(res,200,musicService.mutate(u.slot,b));}
 if(p==='/api/media'){rate(req,'media',150);return json(res,200,mediaService.mutate(u.slot,b))}
 if(p==='/api/weread'){
  rate(req,b.action==='progress'?'weread-progress':'weread',b.action==='progress'?120:25);fail(secure||['127.0.0.1','localhost','[::1]'].includes(originURL.hostname),'请通过 HTTPS 绑定微信读书',403);
  if(b.action==='info')return json(res,200,await mediaService.info(u.slot,b.id));
  if(b.action==='progress')return json(res,200,await mediaService.progress(u.slot,b.id,b.automatic===true));
  if(b.action==='disconnect')return json(res,200,mediaService.disconnect(u.slot));
  fail(['bind','sync'].includes(b.action),'操作不存在');
  return json(res,200,await mediaService.sync(u.slot,b.action==='bind'?b.key:undefined,b.action==='sync'&&b.automatic===true));
 }
 if(p==='/api/life'){fail(!travelService.active(u.id),'小熊正在旅行，回来后再互动吧',409);rate(req,'life',200);let command=null;const result=store.life(u.slot,b,hub.displayNames(u),()=>{if(b.type==='outfit')designService.baseOutfit(u.id,b.outfit);if(b.type==='social'){const peer=hub.partner(u);fail(peer&&!travelService.active(peer.id),'对方正在旅行或尚未配对',409);const own=presence.peer(u,u);let other=presence.peer(u,peer);if(!other){const owner=hub.account(peer.id),environment=JSON.parse(store.db.prepare('SELECT value FROM settings WHERE key=?').get('environment:'+owner.slot)?.value||'{}');other=residentPresence(owner,environment)}fail(own&&b.world===own.world,'位置已变化，请重试',409);const owner=own.world===u.slot?u:hub.account(peer.id),design=designService.current(owner.id).design.home,theme=design.layout==='original'?store.read().state.worlds[own.world].theme:design.layout==='study'?1:0;command=social.prepare(u,peer,b.kind,own,other,studioLayout(homeLayouts[theme===1?1:0],design.objects||[]));}});if(command)social.publish(u,command);return json(res,200,result)}
 if(p==='/api/state'){rate(req,'save',400);return json(res,200,store.save(u.slot,b))}
 if(p==='/api/invite'){rate(req,'invite',30);return json(res,200,hub.invite(u.id))}
 if(p==='/api/pair/preview'){rate(req,'pair-preview',30);return json(res,200,hub.preview(u.id,b.code))}
 if(p==='/api/pair'){rate(req,'pair',20);const next=hub.accept(u.id,b.code,b.partnerId);return json(res,200,{ok:true,...identity(next)})}
 if(p==='/api/unpair'){const next=hub.unlink(u.id);return json(res,200,{ok:true,...identity(next)})}
 if(p==='/api/logout'){
  presence.remove(u.id);
  db.prepare('DELETE FROM account_sessions WHERE token=?').run(u.token);
  res.setHeader('Set-Cookie','planet_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(secure?'; Secure':''));
  return json(res,200,{ok:true});
 }
 throw new AppError(404,'接口不存在');
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain; charset=utf-8'};
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','same-origin');
 res.setHeader('X-Frame-Options','DENY');
 try{
  const p=new URL(req.url,'http://local').pathname;
  if(p.startsWith('/api/'))return await api(req,res,p);
  if(p==='/runtime.js'){res.writeHead(200,{'Content-Type':types['.js'],'Cache-Control':'no-store'});return res.end('window.PLANET_RUNTIME={mode:"cloud"};')}
  fail(req.method==='GET'||req.method==='HEAD','方法不支持',405);
  const rel=decodeURIComponent(p==='/'?'/index.html':p);
  const f=path.resolve(ROOT,'.'+rel);
  fail(f.startsWith(ROOT+path.sep)&&!rel.split('/').some(s=>s.startsWith('.')),'文件不存在',404);
  let stat;try{stat=fs.statSync(f)}catch{throw new AppError(404,'文件不存在')}
  fail(stat.isFile(),'文件不存在',404);
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(f).on('error',()=>res.destroy()).pipe(res);
 }catch(e){
  if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'服务器暂时无法处理，请稍后重试'});
  else res.destroy();
  if(!e.status)console.error(e);
 }
});
server.requestTimeout=20000;server.headersTimeout=15000;server.keepAliveTimeout=5000;
server.listen(PORT,HOST,()=>console.log('Echoo listening on '+HOST+':'+PORT+'; public origin '+ORIGIN));
function shutdown(){server.close(()=>{db.close();process.exit(0)});setTimeout(()=>process.exit(1),8000).unref()}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
