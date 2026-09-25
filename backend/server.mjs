
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {openStore,AppError,fail,hash} from './store.mjs';
import {createMediaService} from './media.mjs';
import {createWeatherService} from './weather.mjs';
const derive=promisify(scrypt);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const PORT=Number(process.env.PORT||8080),HOST=process.env.HOST||'127.0.0.1';
const ORIGIN=process.env.PUBLIC_ORIGIN||'http://127.0.0.1:'+PORT;
const originURL=new URL(ORIGIN);
if(!['http:','https:'].includes(originURL.protocol)||originURL.origin!==ORIGIN)throw Error('PUBLIC_ORIGIN 必须为完整来源（不带路径或结尾斜线）');
const secure=originURL.protocol==='https:';
const REGISTRATION_CODE=process.env.REGISTRATION_CODE||'';

const filename=process.env.DATABASE_PATH||path.resolve('data/planet.sqlite');
const store=openStore(filename),db=store.db;
const weatherService=createWeatherService(db);
const mediaService=createMediaService(store);
async function environmentFor(slot){
 const result=await weatherService.get(slot,store.get(slot).paired);
 // Pairing can change while an upstream forecast is in flight.
 if(!store.get(slot).paired)result.worlds[1-slot]=null;
 return result;
}
const ttl=7*86400000;
const rates=new Map();
function rate(req,kind,max=20){
 const key=kind+':'+req.socket.remoteAddress,now=Date.now();
 let r=rates.get(key);if(!r||r.until<now){r={until:now+600000,n:0};rates.set(key,r)}
 fail(++r.n<=max,'尝试次数较多，请十分钟后再试',429);
}
setInterval(()=>{for(const [k,r]of rates)if(r.until<Date.now())rates.delete(k);db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());},60000).unref();
function session(req){
 const m=(req.headers.cookie||'').match(/(?:^|;\s*)planet_session=([a-f0-9]{64})(?:;|$)/);
 return m?db.prepare('SELECT s.*,u.username FROM sessions s JOIN users u USING(slot) WHERE s.token=? AND s.expires>?').get(hash(m[1]),Date.now()):null;
}
function issue(slot,res){
 const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
 db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
 db.prepare('INSERT INTO sessions(token,slot,csrf,expires) VALUES(?,?,?,?)').run(hash(token),slot,csrf,Date.now()+ttl);
 // Bound sessions per account to protect a tiny server.
 db.prepare('DELETE FROM sessions WHERE slot=? AND token NOT IN (SELECT token FROM sessions WHERE slot=? ORDER BY expires DESC LIMIT 10)').run(slot,slot);
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

function registrationInfo(user){
 const users=db.prepare('SELECT slot FROM users ORDER BY created,slot').all();
 return {first:users.length===0,full:users.length===2,availableActors:[0,1].filter(i=>!users.some(u=>u.slot===i)),canManage:!!user&&users[0]?.slot===user.slot,
  legacy:users.length>0&&!db.prepare("SELECT value FROM settings WHERE key='join_code'").get()};
}
function chosenCode(code){
 fail(typeof code==='string'&&/^[a-zA-Z0-9]{6,24}$/.test(code),'加入口令请使用 6–24 位字母或数字');
}
function readJoinCode(){return db.prepare("SELECT value FROM settings WHERE key='join_code'").get()?.value||null}
async function encodedCode(code){
 chosenCode(code);
 const salt=randomBytes(24).toString('hex'),digest=(await passwordHash(code,salt)).toString('hex');
 return JSON.stringify({salt,digest});
}
async function matchesCode(code,encoded){
 if(typeof code!=='string'||code.length>128)return false;
 if(!encoded)return !!REGISTRATION_CODE&&timingSafeEqual(Buffer.from(hash(code)),Buffer.from(hash(REGISTRATION_CODE)));
 const stored=JSON.parse(encoded),computed=await passwordHash(code,stored.salt);
 return timingSafeEqual(computed,Buffer.from(stored.digest,'hex'));
}

async function api(req,res,p){
 if(req.method==='GET'&&p==='/api/health')return json(res,200,{ok:true});
 if(req.method==='GET'&&p==='/api/session'){
  const u=session(req);
  return json(res,200,{authenticated:!!u,secure,actor:u?.slot,username:u?.username,csrf:u?.csrf,paired:u?store.get(u.slot).paired:false,registration:registrationInfo(u)});
 }
 if(req.method==='GET'&&p==='/api/environment'){
  const u=requireUser(req);rate(req,'weather',120);return json(res,200,await environmentFor(u.slot));
 }
 if(req.method==='GET'&&p==='/api/cities'){
  requireUser(req);rate(req,'cities',40);return json(res,200,{cities:await weatherService.search(new URL(req.url,'http://local').searchParams.get('q'))});
 }
 if(req.method==='GET'&&p==='/api/media')return json(res,200,mediaService.view(requireUser(req).slot));
 if(req.method==='GET'&&p==='/api/state')return json(res,200,store.get(requireUser(req).slot));
 fail(req.method==='POST','接口不存在',404);
 fail(req.headers.origin===ORIGIN,'请求来源不匹配，请检查 PUBLIC_ORIGIN',403);
 const b=await body(req);
 if(p==='/api/register'||p==='/api/login'){
  rate(req,'auth',20);
  const username=credentials(b);
  if(p==='/api/register'){

   const info=registrationInfo(),first=info.first,joinCode=readJoinCode();
   fail(!info.full,'两位住户都已注册，请直接登录',409);
   fail(b.setup===first,first?'第一位住户请直接设置加入口令，刷新页面后再试。':'第一位住户已经注册，请刷新页面并输入对方设置的加入口令。',409);
   if(first)chosenCode(b.code);
   else fail(await matchesCode(b.code,joinCode),'加入口令不正确，请向第一位住户确认',403);
   fail(b.actor===0||b.actor===1,'请选择自己的熊');
   fail(!db.prepare('SELECT slot FROM users WHERE slot=? OR username=?').get(b.actor,username),'这个账号名或角色已被使用',409);
   const encoded=first?await encodedCode(b.code):null;
   const salt=randomBytes(24).toString('hex'),password=(await passwordHash(b.password,salt)).toString('hex');
   store.transaction(()=>{
    // Both account creation and the first chosen code commit together. Concurrent setup cannot replace either.
    fail(registrationInfo().first===first,'注册状态已变化，请刷新页面后再试',409);
    fail(first||readJoinCode()===joinCode,'加入口令刚刚更新，请向第一位住户确认后重试',409);
    fail(!db.prepare('SELECT slot FROM users WHERE slot=? OR username=?').get(b.actor,username),'这个账号名或角色已被使用',409);
    db.prepare('INSERT INTO users(slot,username,salt,password,created) VALUES(?,?,?,?,?)').run(b.actor,username,salt,password,Date.now());
    if(first)db.prepare("INSERT INTO settings(key,value) VALUES('join_code',?)").run(encoded);
   });
   const auth=issue(b.actor,res);
   return json(res,201,{authenticated:true,actor:b.actor,username,secure,registration:registrationInfo({slot:b.actor}),...auth,...store.get(b.actor)});
  }
  const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
  const computed=await passwordHash(b.password,user?.salt||'invalid-user-salt');
  fail(user&&timingSafeEqual(computed,Buffer.from(user.password,'hex')),'账号或密码不正确',401);
  const auth=issue(user.slot,res);
  return json(res,200,{authenticated:true,actor:user.slot,username,secure,registration:registrationInfo(user),...auth,...store.get(user.slot)});
 }
 const u=requireUser(req);
 fail(req.headers['x-csrf-token']===u.csrf,'会话验证失败，请刷新页面',403);

 if(p==='/api/environment'){
  rate(req,'location',30);weatherService.configure(u.slot,b);return json(res,200,await environmentFor(u.slot));
 }
 if(p==='/api/join-code'){
  rate(req,'join-code',20);
  fail(registrationInfo(u).canManage,'只有第一位住户可以修改加入口令',403);
  fail(!registrationInfo().full,'两位住户都已注册，无需再设置加入口令',409);
  const encoded=await encodedCode(b?.code);
  store.transaction(()=>{
   fail(!registrationInfo().full,'两位住户都已注册，无需再设置加入口令',409);
   db.prepare("INSERT INTO settings(key,value) VALUES('join_code',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(encoded);
  });
  return json(res,200,{ok:true});
 }
 if(p==='/api/media'){rate(req,'media',150);return json(res,200,mediaService.mutate(u.slot,b))}
 if(p==='/api/weread'){
  rate(req,b.action==='progress'?'weread-progress':'weread',b.action==='progress'?120:25);fail(secure||['127.0.0.1','localhost','[::1]'].includes(originURL.hostname),'请通过 HTTPS 绑定微信读书',403);
  if(b.action==='progress')return json(res,200,await mediaService.progress(u.slot,b.id,b.automatic===true));
  if(b.action==='disconnect')return json(res,200,mediaService.disconnect(u.slot));
  fail(['bind','sync'].includes(b.action),'操作不存在');
  return json(res,200,await mediaService.sync(u.slot,b.action==='bind'?b.key:undefined,b.action==='sync'&&b.automatic===true));
 }
 if(p==='/api/life'){rate(req,'life',200);return json(res,200,store.life(u.slot,b))}
 if(p==='/api/state'){rate(req,'save',400);return json(res,200,store.save(u.slot,b))}
 if(p==='/api/invite'){rate(req,'invite',30);return json(res,200,store.invite(u.slot))}
 if(p==='/api/pair'){rate(req,'pair',20);return json(res,200,store.accept(u.slot,b.code))}
 if(p==='/api/unpair'){store.unlink();return json(res,200,store.get(u.slot))}
 if(p==='/api/logout'){
  db.prepare('DELETE FROM sessions WHERE token=?').run(u.token);
  res.setHeader('Set-Cookie','planet_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(secure?'; Secure':''));
  return json(res,200,{ok:true});
 }
 throw new AppError(404,'接口不存在');
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain; charset=utf-8'};
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
