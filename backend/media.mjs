import {randomUUID} from 'node:crypto';
import {fail,hash} from './store.mjs';
import {applyMedia,visibleMedia,mediaLink,coverLink} from '../dist/media-state.js';
export function createMediaService(store,{fetcher=fetch}={}){
 const db=store.db;
 db.exec(`CREATE TABLE IF NOT EXISTS media_items(id TEXT PRIMARY KEY, value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS weread_bindings(slot INTEGER PRIMARY KEY REFERENCES users(slot), credential TEXT NOT NULL, synced INTEGER NOT NULL);`);
 const all=()=>db.prepare('SELECT value FROM media_items ORDER BY rowid').all().map(r=>JSON.parse(r.value));
 const put=items=>{db.exec('DELETE FROM media_items');const q=db.prepare('INSERT INTO media_items VALUES(?,?)');for(const x of items)q.run(x.id,JSON.stringify(x))};
 const status=slot=>{const r=db.prepare('SELECT synced FROM weread_bindings WHERE slot=?').get(slot);return {connected:!!r,synced:r?.synced||null}};
 const view=slot=>({items:visibleMedia(all(),slot,store.get(slot).paired),binding:status(slot)});
 function mutate(slot,b){return store.transaction(()=>{
  fail(b&&typeof b.command==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(b.command),'互动请求不正确');
  const digest=hash(JSON.stringify(b)),receipt=db.prepare('SELECT digest FROM receipts WHERE slot=? AND command=?').get(slot,b.command);
  if(receipt){fail(receipt.digest===digest,'重复请求内容不同',409);return {...store.get(slot),...view(slot)}}
  const row=store.read();fail(b.revision===row.revision,'存档刚更新，请重新打开书架再试',409);
  const items=all(),event=applyMedia(items,slot,!!row.paired,b,Date.now(),randomUUID);
  if(event){fail(row.state.events.length<5000,'手账已满，请先整理');row.state.events.unshift(event)}
  put(items);db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state));
  db.prepare('INSERT INTO receipts VALUES(?,?,?,?)').run(slot,b.command,digest,Date.now());
  return {...store.get(slot),...view(slot)};
 })}
 async function gateway(key,api_name,params={}){
  fail(typeof key==='string'&&/^wrk-[A-Za-z0-9_-]{8,500}$/.test(key),'请粘贴微信读书提供的完整 API Key');
  let r,data;try{
   r=await fetcher('https://i.weread.qq.com/api/agent/gateway',{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({api_name,skill_version:'1.0.4',...params})});
   fail(r.ok,'微信读书未能验证授权，请检查 API Key 或稍后重试',502);
   let size=0,chunks=[];for await(const chunk of r.body){size+=chunk.length;fail(size<=4*1024*1024,'书架数据过大，请稍后再试',502);chunks.push(chunk)}data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }catch(e){if(e.status)throw e;fail(false,'暂时连接不到微信读书，请稍后重试',502)}
  fail(!data.upgrade_info,'微信读书接口需要升级，请更新阿球后再同步',502);
  fail(data.errcode===undefined||data.errcode===0,'微信读书授权失效或请求失败，请重新获取 API Key',502);
  return data;
 }
 async function shelf(key){
  const data=await gateway(key,'/shelf/sync');
  fail(Array.isArray(data.books),'微信读书返回格式有变化，暂时无法同步',502);
  const books=data.books.map(x=>({sourceId:'book:'+String(x.bookId),title:x.title,author:x.author,cover:coverLink(x.cover),url:mediaLink(x.deepLink,'book',true),readUpdateTime:Number.isSafeInteger(x.readUpdateTime)&&x.readUpdateTime>0&&x.readUpdateTime<100000000000?x.readUpdateTime*1000:0,finished:x.finishReading===1,format:'电子书'}));
  fail(data.albums===undefined||Array.isArray(data.albums),'微信读书返回格式有变化',502);
  for(const a of data.albums||[]){const x=a.albumInfo;if(x)books.push({sourceId:'album:'+String(x.albumId),title:x.name,author:x.authorName,cover:coverLink(x.cover),url:mediaLink(a.deepLink||x.deepLink,'book',true),format:'有声书'})}
  if(data.mp&&Object.keys(data.mp).length)books.push({sourceId:'articles',title:'文章收藏',author:'微信读书',url:'https://weread.qq.com/',format:'收藏入口'});
  fail(books.length<=1400,'书架超过 1400 条，暂时无法完整同步',502);
  return books.filter(x=>x.title&&x.sourceId&&!x.sourceId.endsWith(':undefined')).map(x=>({...x,title:String(x.title).slice(0,120),author:String(x.author||'').slice(0,120)}));
 }
 const flights=new Set(),generations=[0,0];
 async function sync(slot,key,automatic=false){
  if(automatic&&status(slot).connected&&Date.now()-status(slot).synced<60000)return {...store.get(slot),...view(slot),cached:true};
  fail(!flights.has(slot),'正在同步，请稍等',409);flights.add(slot);
  const generation=generations[slot];
  const old=db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential;
  try{
   const credential=key??old;fail(credential,'请先绑定微信读书');const books=await shelf(credential);
   return store.transaction(()=>{
    fail(generations[slot]===generation&&db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential===old,'授权刚刚变更，请重新操作',409);
    const now=Date.now(),items=all(),current=items.filter(x=>x.owner===slot&&x.source==='weread'),byId=new Map(current.map(x=>[x.sourceId,x]));
    for(const x of books){const found=byId.get(x.sourceId);if(found)Object.assign(found,x);else items.push({...x,id:randomUUID(),kind:'book',owner:slot,addedBy:slot,source:'weread',shared:false,message:'',created:now,received:false})}
    fail(items.filter(x=>x.owner===slot).length<=1500,'书架已满，请先整理');put(items);
    db.prepare('INSERT INTO weread_bindings VALUES(?,?,?) ON CONFLICT(slot) DO UPDATE SET credential=excluded.credential,synced=excluded.synced').run(slot,credential,now);
    db.exec('UPDATE saves SET revision=revision+1 WHERE id=1');return {...store.get(slot),...view(slot),imported:books.length};
   });
  }finally{flights.delete(slot)}
 }
 function disconnect(slot){generations[slot]++;db.prepare('DELETE FROM weread_bindings WHERE slot=?').run(slot);return {...store.get(slot),...view(slot)}}

 const infoFlights=new Map();
 async function info(slot,id){
  const item=all().find(x=>x.id===id&&x.owner===slot&&x.kind==='book');fail(item?.source==='weread'&&item.sourceId?.startsWith('book:'),'这本书没有连接微信读书',400);
  if(item.infoSynced&&Date.now()-item.infoSynced<86400000)return {...store.get(slot),...view(slot)};
  const flightKey=slot+':'+id;if(infoFlights.has(flightKey))return infoFlights.get(flightKey);
  const credential=db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential,generation=generations[slot];fail(credential,'请先连接微信读书');
  const task=(async()=>{const data=await gateway(credential,'/book/info',{bookId:item.sourceId.slice(5)});fail(String(data.bookId)===item.sourceId.slice(5),'这本书的信息暂时无法获取',502);
   return store.transaction(()=>{fail(generation===generations[slot]&&db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential===credential,'连接已变更，请重试',409);const items=all(),current=items.find(x=>x.id===id&&x.owner===slot);fail(current&&current.sourceId===item.sourceId,'这本书已移走',409);if(typeof data.intro==='string')current.intro=data.intro.slice(0,10000);const cover=coverLink(data.cover),url=mediaLink(data.deepLink,'book',true);if(cover)current.cover=cover;if(url)current.url=url;current.infoSynced=Date.now();put(items);db.exec('UPDATE saves SET revision=revision+1 WHERE id=1');return {...store.get(slot),...view(slot)}});
  })().finally(()=>infoFlights.delete(flightKey));infoFlights.set(flightKey,task);return task;
 }
 async function progress(slot,id,automatic=false){
  fail(!flights.has(slot),'正在同步，请稍等',409);
  const item=all().find(x=>x.id===id&&x.owner===slot&&x.kind==='book');
  fail(item?.source==='weread'&&item.sourceId?.startsWith('book:'),'只有从微信读书同步的电子书可以读取进度',400);
  if(automatic&&item.progress&&Date.now()-item.progress.synced<60000)return {...store.get(slot),...view(slot),cached:true};
  const credential=db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential;
  fail(credential,'请先绑定微信读书');const generation=generations[slot];flights.add(slot);
  try{
   const bookId=item.sourceId.slice(5),[data,catalog]=await Promise.all([gateway(credential,'/book/getprogress',{bookId}),gateway(credential,'/book/chapterinfo',{bookId}).catch(()=>null)]);
   const b=data.book;fail(b&&Number.isInteger(b.progress)&&b.progress>=0&&b.progress<=100,'微信读书暂未返回有效阅读进度，已保留上次结果',502);
   const chapter=Array.isArray(catalog?.chapters)?catalog.chapters.find(c=>String(c.chapterUid)===String(b.chapterUid)):null;
   const unix=v=>Number.isSafeInteger(v)&&v>0&&v<100000000000?v*1000:null;
   const reading={percent:b.progress,chapterUid:b.chapterUid==null?'':String(b.chapterUid).slice(0,80),chapter:typeof chapter?.title==='string'?chapter.title.slice(0,160):'',updated:unix(b.updateTime),synced:Date.now()};
   return store.transaction(()=>{
    fail(generation===generations[slot]&&db.prepare('SELECT credential FROM weread_bindings WHERE slot=?').get(slot)?.credential===credential,'授权刚刚变更，请重新操作',409);
    const items=all(),current=items.find(x=>x.id===id&&x.owner===slot);fail(current&&current.sourceId===item.sourceId,'这本书已被移走，请重新打开书架',409);
    const row=store.read(),previous=current.readingLog;
    const changed=!previous||previous.percent!==reading.percent||(previous.chapterUid&&reading.chapterUid&&previous.chapterUid!==reading.chapterUid);
    let journalAdded=false;
    if(changed){
     fail(row.state.events.length<5000,'手账已满，请先整理后再同步',409);
     const name=slot===0?'小禾':'阿远';
     let title,body;
     if(!previous){title=name+'为《'+current.title+'》留下阅读起点';body='首次记录微信读书进度：已读 '+reading.percent+'%。这是同步时的已有进度。';}
     else if(reading.percent===100&&previous.percent<100){title=name+'读完了《'+current.title+'》';body='微信读书进度从 '+previous.percent+'% 更新到 100%，为这本书留下一枚读完的书签。';}
     else{title=name+'的《'+current.title+'》读到 '+reading.percent+'%';body=previous.percent===reading.percent?'阅读章节有了变化，当前进度为 '+reading.percent+'%。':'与上次记录相比，进度从 '+previous.percent+'% 更新到 '+reading.percent+'%。';}
     if(reading.chapter)body+=' 读到：'+reading.chapter+'。';
     if(reading.updated)body+=' 微信读书最后阅读时间：'+new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(reading.updated))+'（北京时间）。';
     body+=' 本条按同步时间收进手账。';
     row.state.events.unshift({id:randomUUID(),actor:slot,world:slot,target:slot,title,body,shared:!!(row.paired&&current.shared&&current.shareProgress),pending:false,kind:'life',created:reading.synced,weather:'微信读书同步',steps:[],comments:[]});
     current.readingLog={percent:reading.percent,chapterUid:reading.chapterUid};journalAdded=true;
    }
    current.progress=reading;current.finished=b.progress===100;put(items);
    db.prepare('UPDATE saves SET revision=revision+1,state=? WHERE id=1').run(JSON.stringify(row.state));return {...store.get(slot),...view(slot),journalAdded};
   });
  }finally{flights.delete(slot)}
 }
 return {view,mutate,sync,disconnect,progress,info};
}
