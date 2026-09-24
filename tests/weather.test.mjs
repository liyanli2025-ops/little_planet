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
 const request=async()=>{calls++;if(offline)throw Error('offline');await new Promise(r=>setTimeout(r,5));return {ok:true,json:async()=>sample}};
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
 service.configure(0,{mode:'manual'});await service.get(0,false);assert.equal(calls,4);db.close();
});
test('in-flight weather for an old city cannot overwrite the new city',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
 let resolve;const service=createWeatherService(db,()=>new Promise(r=>resolve=r));
 service.configure(0,{mode:'auto',location:{label:'上海',latitude:31.2,longitude:121.5}});
 const old=service.get(0,false);
 service.configure(0,{mode:'auto',location:{label:'北京',latitude:39.9,longitude:116.4}});
 resolve({ok:true,json:async()=>sample});const result=await old;
 assert.equal(result.worlds[0].location.label,'北京');assert.equal(result.worlds[0].snapshot,null);db.close();
});
