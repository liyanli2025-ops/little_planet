import {fail} from './store.mjs';
const TTL=15*60*1000;
export function validLocation(v){
 fail(v&&typeof v.label==='string'&&v.label.trim().length>0&&v.label.length<=80,'请选择城市或使用定位');
 fail(Number.isFinite(v.latitude)&&Math.abs(v.latitude)<=90&&Number.isFinite(v.longitude)&&Math.abs(v.longitude)<=180,'位置坐标不正确');
 // Weather needs only an approximate area, never retain GPS precision.
 return {label:v.label.trim(),latitude:Math.round(v.latitude*10)/10,longitude:Math.round(v.longitude*10)/10};
}
export function normalizeWeather(v,now=Date.now()){
 const c=v?.current;
 fail(c&&Number.isFinite(c.temperature_2m)&&Number.isInteger(c.weather_code)&&Number.isFinite(c.time)&&[0,1].includes(c.is_day),'天气服务返回的数据不完整',502);
 try{new Intl.DateTimeFormat('en',{timeZone:v.timezone}).format()}catch{fail(false,'天气时区无效',502)}
 fail(typeof v.timezone==='string','天气时区无效',502);
 return {temperature:c.temperature_2m,code:c.weather_code,isDay:!!c.is_day,observedAt:c.time*1000,fetchedAt:now,timezone:v.timezone,
  solar:(v.daily?.sunrise||[]).map((rise,i)=>({rise:rise*1000,set:v.daily.sunset?.[i]*1000})).filter(x=>Number.isFinite(x.rise)&&Number.isFinite(x.set))};
}
export function createWeatherService(db,request=fetch,clock=Date.now){
 const busy=new Map(),retry=new Map();
 const read=(slot)=>JSON.parse(db.prepare('SELECT value FROM settings WHERE key=?').get('environment:'+slot)?.value||'{"mode":"auto","location":null,"snapshot":null}');
 const write=(slot,v)=>db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('environment:'+slot,JSON.stringify(v));
 async function remote(url){
  const r=await request(url,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
  fail(r.ok,'天气服务暂时不可用，请稍后重试',502);return r.json();
 }
 async function search(q){
  fail(typeof q==='string'&&q.trim().length>=2&&q.trim().length<=60,'请输入至少两个字的城市名');
  const u=new URL('https://geocoding-api.open-meteo.com/v1/search');u.search=new URLSearchParams({name:q.trim(),count:'8',language:'zh',format:'json'});
  const data=await remote(u);
  return (data.results||[]).map(c=>validLocation({label:[c.name,c.admin1,c.country].filter(Boolean).join(' · ').slice(0,80),latitude:c.latitude,longitude:c.longitude}));
 }
 function configure(slot,b){
  fail(b&&['auto','manual'].includes(b.mode),'请选择真实天气或手动天气');
  const old=read(slot),location=b.location===undefined?old.location:validLocation(b.location);
  const same=JSON.stringify(location)===JSON.stringify(old.location);
  const next={mode:b.mode,location,snapshot:same?old.snapshot:null};write(slot,next);retry.delete(slot);return next;
 }
 async function refresh(slot){
  const c=read(slot),now=clock();
  if(c.mode!=='auto'||!c.location||now-(c.snapshot?.fetchedAt||0)<TTL||(retry.get(slot)||0)>now)return;
  if(busy.has(slot))return busy.get(slot);
  const job=(async()=>{
   try{
    const u=new URL('https://api.open-meteo.com/v1/forecast');u.search=new URLSearchParams({latitude:String(c.location.latitude),longitude:String(c.location.longitude),current:'temperature_2m,weather_code,is_day',daily:'sunrise,sunset',timezone:'auto',forecast_days:'2',timeformat:'unixtime'});
    const snapshot=normalizeWeather(await remote(u),clock()),latest=read(slot);
    if(JSON.stringify(latest.location)===JSON.stringify(c.location)){write(slot,{...latest,snapshot});retry.delete(slot)}
   }catch{retry.set(slot,clock()+60000)}
  })();busy.set(slot,job);try{await job}finally{busy.delete(slot)}
 }
 async function get(slot,paired){
  const slots=paired?[0,1]:[slot];await Promise.all(slots.map(refresh));
  const worlds=[null,null];
  for(const i of slots){const c=read(i);worlds[i]={mode:c.mode,location:c.location?{label:c.location.label}:null,snapshot:c.snapshot,stale:!!c.snapshot&&clock()-c.snapshot.fetchedAt>=TTL,unavailable:c.mode==='auto'&&!!c.location&&!c.snapshot}}
  return {worlds,source:'Open-Meteo'};
 }
 return {search,configure,get};
}
