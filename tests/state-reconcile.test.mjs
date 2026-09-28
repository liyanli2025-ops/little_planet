import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileState} from '../dist/state-reconcile.js';
const clone=x=>structuredClone(x);
const seed=()=>({worlds:[{weather:'sun',fridge:[{id:'milk',qty:2}]},{weather:'rain',fridge:[]}],journal:[],settings:{music:true}});
test('weather changes during a server journal action survive without losing the new entry',()=>{const b=seed(),l=clone(b),r=clone(b);l.worlds[0].weather='cloudy';r.journal.push({id:'reading'});const m=reconcileState(b,l,r);assert.deepEqual(m.conflicts,[]);assert.equal(m.state.worlds[0].weather,'cloudy');assert.equal(m.state.journal[0].id,'reading');assert.deepEqual(b,seed())});
test('independent changes within a world preserve both local stock and remote weather',()=>{const b=seed(),l=clone(b),r=clone(b);l.worlds[0].fridge[0].qty=1;r.worlds[0].weather='fog';const m=reconcileState(b,l,r);assert.deepEqual(m.conflicts,[]);assert.equal(m.state.worlds[0].fridge[0].qty,1);assert.equal(m.state.worlds[0].weather,'fog')});
test('same stock edited in both places remains a conflict instead of guessing quantities',()=>{const b=seed(),l=clone(b),r=clone(b);l.worlds[0].fridge[0].qty=1;r.worlds[0].fridge[0].qty=3;assert.deepEqual(reconcileState(b,l,r).conflicts,['worlds.0.fridge'])});
test('identical changes merge; independent deletion survives',()=>{const b=seed(),l=clone(b),r=clone(b);l.worlds[0].weather=r.worlds[0].weather='fog';delete l.settings.music;r.journal.push({id:'x'});const m=reconcileState(b,l,r);assert.deepEqual(m.conflicts,[]);assert.equal('music' in m.state.settings,false);assert.equal(m.state.journal.length,1)});
