import {test} from 'node:test';import assert from 'node:assert/strict';import {recapEvents,recapKind} from '../dist/recap-data.js';
const event=(id,over={})=>({id,actor:0,world:0,created:200,title:'读书',shared:false,pending:false,...over});
test('away recap respects planet, time, privacy, pending gifts and chronological order',()=>{const events=[event('self'),event('partner',{actor:1,shared:true,created:150}),event('private',{actor:1}),event('gift',{actor:1,shared:true,pending:true}),event('other',{world:1,shared:true}),event('old',{created:100}),event('future',{created:400}),event('partner',{actor:1,shared:true,created:150})];assert.deepEqual(recapEvents(events,0,100,300).map(e=>e.id),['partner']);assert.deepEqual(recapEvents(events,0,0),[])});
test('recap projection carries no private body and does not change saves',()=>{const events=[event('one',{actor:1,shared:true,body:'private text',comments:['secret']})],before=JSON.stringify(events);const r=recapEvents(events,0,100,300);assert(!('body' in r[0]));assert(!('comments' in r[0]));assert.equal(JSON.stringify(events),before)});
test('known activity kinds select corresponding vignettes',()=>{for(const [title,kind] of [['在小屋休息了一会儿','sleep'],['做了一顿饭','cook'],['在沙发上练习单词','read'],['种下了玫瑰','garden'],['吃了一份饭','eat'],['听音乐','music'],['洗净双手','wash'],['散步一圈','walk'],['换装','moment']])assert.equal(recapKind(title),kind)});

test('no visitors means no recap, including own and system changes',()=>{
 assert.deepEqual(recapEvents([event('self'),event('system',{actor:null}),event('their-home',{actor:1,world:1,shared:true})],0,100,300),[]);
});
test('both residents see only their visitor, including targeted interactions',()=>{
 const events=[event('visit',{actor:1,shared:true,title:'来到了你的星球'}),event('water',{actor:1,target:0}),event('return-visit',{actor:0,world:1,target:1})];
 assert.deepEqual(recapEvents(events,0,100,300).map(e=>e.id),['visit','water']);
 assert.deepEqual(recapEvents(events,1,100,300).map(e=>e.id),['return-visit']);
});
