import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarLetters} from '../dist/calendar-state.js';
import {skyTime} from '../dist/sky-state.js';
test('calendar letters arrive at owner midnight, expire next day, and respect sharing',()=>{
 const notes=[{id:'own',actor:0,kind:'calendar',date:'2026-10-01',created:1},{id:'shared',actor:1,shared:true,kind:'calendar',date:'2026-10-01',created:2},{id:'secret',actor:1,kind:'calendar',date:'2026-10-01',created:3}];
 const letters=time=>calendarLetters(notes,skyTime({timezone:'Asia/Shanghai'},Date.parse(time)).date,0,true);
 assert.equal(letters('2026-09-30T15:59:59Z').length,0);
 assert.deepEqual(letters('2026-09-30T16:00:00Z').map(n=>n.id),['own:2026-10-01','shared:2026-10-01']);
 assert.equal(letters('2026-10-01T16:00:00Z').length,0);
 assert.equal(calendarLetters(notes,'2026-10-01',0,false).length,1);
});
test('existing annual anniversaries produce a new dated letter each year, never before their start',()=>{
 const notes=[{id:'ann',actor:0,kind:'anniversary',date:'2020-10-01',repeat:true,title:'相识',created:1}];
 assert.equal(calendarLetters(notes,'2019-10-01',0,true).length,0);
 assert.equal(calendarLetters(notes,'2026-10-01',0,true)[0].id,'ann:2026-10-01');
 assert.equal(calendarLetters(notes,'2027-10-01',0,true)[0].id,'ann:2027-10-01');
 notes[0].repeat=false;assert.equal(calendarLetters(notes,'2026-10-01',0,true).length,0);
});
