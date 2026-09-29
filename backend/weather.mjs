import {nearestPlace} from './place.mjs';
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
  if(location&&['设备所在地','定位中','地名待识别'].includes(location.label))location.label=nearestPlace(location.latitude,location.longitude)||'地名待识别';
  const same=JSON.stringify(location)===JSON.stringify(old.location);
  const timezone=b.timezone??old.timezone??old.snapshot?.timezone??'UTC';try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format()}catch{fail(false,'时区无效')}
  const next={mode:b.mode,location,timezone,snapshot:same?old.snapshot:null};write(slot,next);retry.delete(slot);return next;
 }
 const area=c=>c.location?c.location.latitude+','+c.location.longitude:null;
 async function refresh(slot){
  let c=read(slot);const now=clock(),key=area(c);if(!key)return;
  // A saved location continues to update when its owner is offline. Nearby
  // residents with the same rounded coordinates share weather AND air quality.
  const candidates=[c,read(1-slot)].filter(v=>area(v)===key&&v.snapshot);
  const newest=candidates.sort((a,b)=>b.snapshot.fetchedAt-a.snapshot.fetchedAt)[0]?.snapshot;
  if(newest&&newest.fetchedAt>(c.snapshot?.fetchedAt||0)){c={...c,snapshot:newest};write(slot,c)}
  if(now-(c.snapshot?.fetchedAt||0)<TTL||(retry.get(slot)||0)>now)return;
  let job=busy.get(key);
  if(!job){job=(async()=>{
    const u=new URL('https://api.open-meteo.com/v1/forecast');u.search=new URLSearchParams({latitude:String(c.location.latitude),longitude:String(c.location.longitude),current:'temperature_2m,weather_code,is_day',daily:'sunrise,sunset',timezone:'auto',forecast_days:'2',timeformat:'unixtime'});
    const snapshot=normalizeWeather(await remote(u),clock());
    try{const a=new URL('https://air-quality-api.open-meteo.com/v1/air-quality');a.search=new URLSearchParams({latitude:String(c.location.latitude),longitude:String(c.location.longitude),current:'pm2_5,pm10',timeformat:'unixtime'});const v=(await remote(a)).current;if(Number.isFinite(v?.time)&&Number.isFinite(v.pm2_5)&&v.pm2_5>=0&&Number.isFinite(v.pm10)&&v.pm10>=0)snapshot.airQuality={pm25:v.pm2_5,pm10:v.pm10,observedAt:v.time*1000};}catch{/* Optional air quality must not discard weather. */}
    return snapshot;
  })();busy.set(key,job)}
  try{const snapshot=await job,latest=read(slot);if(area(latest)===key){write(slot,{...latest,snapshot});retry.delete(slot)}}
  catch{retry.set(slot,clock()+60000)}finally{if(busy.get(key)===job)busy.delete(key)}
 }
 async function get(slot,paired){
  const slots=paired?[0,1]:[slot];await Promise.all(slots.map(refresh));
  const worlds=[null,null];
  for(const i of slots){const c=read(i);if(c.location?.label==='设备所在地'){c.location.label=nearestPlace(c.location.latitude,c.location.longitude)||'地名待识别';write(i,c)}worlds[i]={timezone:c.snapshot?.timezone||c.timezone||'UTC',mode:c.mode,location:c.location?{label:c.location.label}:null,snapshot:c.snapshot,stale:!!c.snapshot&&clock()-c.snapshot.fetchedAt>=TTL,unavailable:c.mode==='auto'&&!!c.location&&!c.snapshot}}
  return {worlds,source:'Open-Meteo'};
 }
 return {search,configure,get};
}
