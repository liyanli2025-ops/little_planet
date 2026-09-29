import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createWeatherService,validLocation} from '../backend/weather.mjs';
import {weatherKind,skyTime} from '../dist/sky-state.js';
const sample={timezone:'Asia/Shanghai',current:{time:1790246700,temperature_2m:26.6,weather_code:61,is_day:0},daily:{sunrise:[1790199801,1790286237],sunset:[1790243330,1790329652]}};
test('weather mapping preserves precipitation at night, solar boundaries and other timezones',()=>{
 assert.equal(weatherKind(61).mode,'rain');assert.equal(weatherKind(75).mode,'snow');assert.equal(weatherKind(66).mode,'rain');assert.equal(weatherKind(3).cloudy,true);
 const s={timezone:'Asia/Shanghai',solar:[{rise:Date.parse('2026-09-24T06:00:00+08:00'),set:Date.parse('2026-09-24T18:00:00+08:00')}]};
 assert.equal(skyTime(s,Date.parse('2026-09-24T17:59:00+08:00')).night,false);
 assert.equal(skyTime(s,Date.parse('2026-09-24T18:00:00+08:00')).night,true);
 assert.equal(skyTime({timezone:'America/New_York'},Date.parse('2026-09-24T12:30:00Z')).text,'08:30');
});
test('location validation rounds GPS coordinates and rejects invalid inputs',()=>{
 assert.deepEqual(validLocation({label:'上海',latitude:31.23456,longitude:121.45678}),{label:'上海',latitude:31.2,longitude:121.5});
 for(const latitude of [NaN,Infinity,91,'31'])assert.throws(()=>validLocation({label:'x',latitude,longitude:1}));
});
test('cached weather persists, respects visibility, retains stale data and avoids duplicate requests',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
 let calls=0,now=Date.now(),offline=false;
 const request=async(url)=>{if(String(url).includes("air-quality"))return {ok:true,json:async()=>({})};calls++;if(offline)throw Error('offline');await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>sample}};
 let service=createWeatherService(db,request,()=>now);
 service.configure(0,{mode:'auto',location:{label:'上海',latitude:31.23,longitude:121.47}});
 service.configure(1,{mode:'auto',location:{label:'杭州',latitude:30.3,longitude:120.2}});
 const results=await Promise.all([service.get(0,false),service.get(0,false)]);assert.equal(calls,1);assert.equal(results[0].worlds[1],null);assert.equal(results[0].worlds[0].location.latitude,undefined);
 service=createWeatherService(db,request,()=>now);await service.get(0,false);assert.equal(calls,1);
 const paired=await service.get(0,true);assert.equal(calls,2);assert.equal(paired.worlds[1].location.label,'杭州');
 offline=true;now+=16*60*1000;
 const stale=await service.get(0,false);assert.equal(stale.worlds[0].stale,true);assert.equal(stale.worlds[0].snapshot.temperature,26.6);
 await service.get(0,false);assert.equal(calls,3);
 service.configure(0,{mode:'auto',location:{label:'北京',latitude:39.9,longitude:116.4}});
 const unavailable=await service.get(0,false);assert.equal(unavailable.worlds[0].snapshot,null);assert.equal(unavailable.worlds[0].unavailable,true);
 service.configure(0,{mode:'manual'});await service.get(0,false);assert.equal(calls,5);db.close();
});
test('in-flight weather for an old city cannot overwrite the new city',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
 let resolve;const service=createWeatherService(db,url=>String(url).includes("air-quality")?Promise.resolve({ok:true,json:async()=>({})}):new Promise(r=>resolve=r));
 service.configure(0,{mode:'auto',location:{label:'上海',latitude:31.2,longitude:121.5}});
 const old=service.get(0,false);
 service.configure(0,{mode:'auto',location:{label:'北京',latitude:39.9,longitude:116.4}});
 resolve({ok:true,json:async()=>sample});const result=await old;
 assert.equal(result.worlds[0].location.label,'北京');assert.equal(result.worlds[0].snapshot,null);db.close();
});
import {nearestPlace} from '../backend/place.mjs';
test('approximate place names resolve offline without inventing remote cities',()=>{assert.equal(nearestPlace(30.3,120.2),'杭州');assert.match(nearestPlace(31.2,121.5),/上海/);assert.equal(nearestPlace(39.9,116.4),'北京');assert.equal(nearestPlace(0,-140),null);assert.equal(nearestPlace(NaN,1),null)});
test('legacy device label is replaced with a place name while preserving weather',async()=>{const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT)');const weather=createWeatherService(db,async()=>new Response(JSON.stringify(sample)));weather.configure(0,{mode:'auto',location:{label:'定位中',latitude:30.3,longitude:120.2}});let r=await weather.get(0,false);assert.equal(r.worlds[0].location.label,'杭州');assert.equal(r.worlds[1],null);const old=JSON.parse(db.prepare('SELECT value FROM settings').get().value);old.location.label='设备所在地';db.prepare('UPDATE settings SET value=?').run(JSON.stringify(old));r=await weather.get(0,false);assert.equal(r.worlds[0].location.label,'杭州');assert.equal(r.worlds[0].snapshot.temperature,26.6);db.close()});

import {environmentKind} from '../dist/sky-state.js';
test('weather distinguishes clouds, fog and particulate haze without losing rain',()=>{assert.equal(weatherKind(2).mode,'cloudy');assert.equal(weatherKind(3).mode,'overcast');assert.equal(weatherKind(45).mode,'fog');const airQuality={pm25:90,pm10:100,observedAt:Date.now()};assert.equal(environmentKind({code:0,airQuality}).mode,'haze');assert.equal(environmentKind({code:61,airQuality}).mode,'rain');assert.equal(environmentKind({code:61,airQuality}).mask,true);assert.equal(environmentKind({code:45}).mask,false);assert.equal(environmentKind({code:0,airQuality:{...airQuality,observedAt:0}}).mask,false)});

// Air-quality errors are independent of weather; fresh particle data survives caching.
test('air-quality is optional, cached with weather and never substitutes a failed forecast',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT)');let now=Date.now(),airDown=false,calls=0;
 const service=createWeatherService(db,async url=>{if(String(url).includes('air-quality')){calls++;if(airDown)throw Error('offline');return {ok:true,json:async()=>({current:{time:now/1000,pm2_5:88,pm10:110}})}}return {ok:true,json:async()=>sample}},()=>now);
 service.configure(0,{mode:'auto',location:{label:'北京',latitude:39.9,longitude:116.4}});
 let r=await service.get(0,false);assert.equal(r.worlds[0].snapshot.airQuality.pm25,88);await service.get(0,false);assert.equal(calls,1);
 airDown=true;now+=16*60000;r=await service.get(0,false);assert.equal(r.worlds[0].snapshot.temperature,26.6);assert.equal(r.worlds[0].snapshot.airQuality,undefined);db.close();
});

test('owner timezones persist without weather, and manual skies still fetch temperature',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT)');let offline=true;
 const service=createWeatherService(db,async()=>{if(offline)throw Error('offline');return {ok:true,json:async()=>sample}});
 service.configure(0,{mode:'manual',timezone:'Asia/Shanghai',location:{label:'上海',latitude:31.2,longitude:121.5}});
 service.configure(1,{mode:'auto',timezone:'America/New_York'});
 let result=await service.get(1,true);assert.equal(result.worlds[0].timezone,'Asia/Shanghai');assert.equal(result.worlds[1].timezone,'America/New_York');
 offline=false;service.configure(0,{mode:'manual'});result=await service.get(1,true);assert.equal(result.worlds[0].snapshot.temperature,26.6);assert.equal(result.worlds[0].mode,'manual');assert.equal(result.worlds[1].timezone,'America/New_York');db.close();
});

test('visiting refreshes an offline owner at their saved location and same-area residents share one snapshot',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT)');let now=Date.now(),weatherCalls=0,airCalls=0;
 const service=createWeatherService(db,async url=>{if(String(url).includes('air-quality')){airCalls++;return {ok:true,json:async()=>({current:{time:now/1000,pm2_5:88,pm10:110}})}}weatherCalls++;await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>({...sample,current:{...sample.current,time:now/1000,temperature_2m:weatherCalls+20}})}},()=>now);
 service.configure(0,{mode:'auto',location:{label:'北京',latitude:39.9,longitude:116.4}});
 service.configure(1,{mode:'auto',location:{label:'北京',latitude:39.92,longitude:116.42}});
 let result=await service.get(0,true);assert.equal(weatherCalls,1);assert.equal(airCalls,1);assert.deepEqual(result.worlds[0].snapshot,result.worlds[1].snapshot);
 now+=16*60000;result=await service.get(0,true);assert.equal(weatherCalls,2);assert.equal(airCalls,2);assert.equal(result.worlds[1].snapshot.temperature,22);assert.deepEqual(result.worlds[0].snapshot,result.worlds[1].snapshot);
 // A newly refreshed resident also updates the paired resident's older cache.
 now+=16*60000;await service.get(0,false);result=await service.get(1,true);assert.equal(weatherCalls,3);assert.deepEqual(result.worlds[0].snapshot,result.worlds[1].snapshot);
 service.configure(1,{mode:'auto',location:{label:'上海',latitude:31.2,longitude:121.5}});result=await service.get(0,true);assert.equal(weatherCalls,4);assert.equal(result.worlds[1].location.label,'上海');assert.notEqual(result.worlds[0].snapshot.temperature,result.worlds[1].snapshot.temperature);db.close();
});
