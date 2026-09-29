import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {openStore} from '../backend/store.mjs';
import {calendarMonth,calendarEntries,validCalendarDate} from '../dist/calendar-state.js';
import {residentPresence,residentHour} from '../backend/resident.mjs';

test('calendar validates actual dates and computes Monday-first leap months',()=>{
 assert.equal(validCalendarDate('2028-02-29'),true);for(const s of ['2026-02-29','2026-04-31','2026-13-01','bad','0099-01-01'])assert.equal(validCalendarDate(s),false);
 assert.deepEqual(calendarMonth('2028-02-01'),{year:2028,month:2,offset:1,days:29});
 const notes=[{id:'a',actor:0,shared:false,kind:'calendar',date:'2026-09-29',created:1},{id:'b',actor:1,shared:false,kind:'calendar',date:'2026-09-29',created:2},{id:'c',actor:1,shared:true,kind:'anniversary',date:'2020-09-29',repeat:true,created:3}];
 assert.deepEqual(calendarEntries(notes,'2026-09-29',0,true).map(n=>n.id),['a','c']);assert.deepEqual(calendarEntries(notes,'2026-09-29',0,false).map(n=>n.id),['a']);
});
test('calendar privacy is enforced by server; partner cannot edit or delete; unshare and delete persist',()=>{
 const s=openStore(':memory:');for(const slot of [0,1])s.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(slot,'user'+slot,'s','p',1);s.accept(1,s.invite(0).code);
 const commit=(actor,fn)=>{const v=s.get(actor);fn(v.state);return s.save(actor,{revision:v.revision,state:v.state,command:randomUUID()})};
 const note={id:randomUUID(),actor:0,world:0,title:'去公园',body:'带相机',date:'2026-10-01',kind:'calendar',shared:false,repeat:false,created:1,weather:'',comments:[]};
 commit(0,v=>v.notes.push(note));assert.equal(s.get(1).state.notes.length,0);commit(0,v=>v.notes[0].shared=true);assert.equal(s.get(1).state.notes[0].title,'去公园');
 assert.throws(()=>commit(1,v=>v.notes[0].body='changed'),/不能改写/);assert.throws(()=>commit(1,v=>v.notes=[]),/不能删除/);assert.throws(()=>commit(0,v=>v.notes[0].date='2026-02-30'),/日期/);
 commit(0,v=>{v.notes[0].date='2026-10-02';v.notes[0].shared=false});assert.equal(s.get(1).state.notes.length,0);assert.equal(s.get(0).state.notes[0].date,'2026-10-02');commit(0,v=>v.notes=[]);assert.equal(s.get(0).state.notes.length,0);s.db.close();
});
test('offline resident returns to owner world and sleeps using owner timezone boundaries',()=>{
 const owner={slot:1,avatar:0};for(const [time,sleeping]of [['2026-09-29T13:59:00Z',false],['2026-09-29T14:00:00Z',true],['2026-09-29T21:59:00Z',true],['2026-09-29T22:00:00Z',false]]){const r=residentPresence(owner,{timezone:'Asia/Shanghai'},'cream',Date.parse(time));assert.equal(r.sleeping,sleeping);assert.equal(r.world,1);assert.equal(r.identity,0);assert.equal(r.room,sleeping);assert.equal(r.floor,sleeping?1:0)}
 const now=Date.parse('2026-09-29T14:00:00Z');assert.equal(residentHour({timezone:'America/Los_Angeles'},now),7);assert.equal(residentHour({timezone:'invalid'},now),22);
});
