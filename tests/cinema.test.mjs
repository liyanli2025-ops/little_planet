import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {cinemaProgram,cinemaFilms,cinemaSeats} from '../dist/cinema-catalog.js';
import {cafeRouteWalkable} from '../dist/cafe-navigation.js';
import {cinemaStream} from '../backend/cinema-stream.mjs';

test('cinema follows Beijing evenings, midnight continuity and daily reset',()=>{
 const at=s=>cinemaProgram(Date.parse(s));
 assert.equal(at('2026-10-06T09:59:59Z').open,false);
 assert.deepEqual(at('2026-10-06T10:00:00Z'),{open:true,film:cinemaFilms[0],offset:0,intermission:false});
 assert.equal(at('2026-10-06T10:02:30Z').intermission,true);
 assert.equal(at('2026-10-06T10:02:50Z').film.id,'bunny');
 assert.equal(at('2026-10-06T21:59:59Z').open,true);
 assert.equal(at('2026-10-06T22:00:00Z').open,false);
 assert.equal(at('2026-10-07T10:00:00Z').offset,0);
 const total=cinemaFilms.reduce((n,f)=>n+f.duration+20,0);
 for(const elapsed of [60,300,3600,21601]){
  const time=Date.parse('2026-10-06T10:00:00Z')+elapsed*1000;
  assert.deepEqual(cinemaProgram(time+total*1000),cinemaProgram(time));
  const p=cinemaProgram(time);assert.ok(p.offset>=0&&p.offset<p.film.duration);
  if(elapsed===21601)assert.equal(p.offset,elapsed%total-cinemaFilms[0].duration-20);
 }
});
test('every cinema seat and its standing approach are on connected dry sand',()=>{
 for(const s of cinemaSeats){assert.ok(cafeRouteWalkable(s.x,s.z),s.id);assert.ok(cafeRouteWalkable(s.approachX,s.approachZ),s.id);assert.ok(Number.isFinite(s.avatarY))}
 // Check the front stairs -> side beach connection with the same routing grid.
 const queue=[[0,32]],visited=new Set(['0,32']);
 for(let i=0;i<queue.length&&i<7000;i++){const [x,z]=queue[i];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=a+','+b;if(!visited.has(k)&&cafeRouteWalkable(a*.3,b*.3)){visited.add(k);queue.push([a,b])}}}
 for(const s of cinemaSeats)assert.ok(queue.some(([x,z])=>Math.hypot(x*.3-s.approachX,z*.3-s.approachZ)<.38),s.id);
});
test('film relay accepts fixed IDs and single byte ranges, streams bytes without changing them',async()=>{
 const calls=[];const server=createServer(async(req,res)=>{try{await cinemaStream(req,res,req.url.slice(1),{fetcher:async(url,options)=>{calls.push({url,options});return new Response(new Uint8Array([11,22,33]),{status:206,headers:{'content-type':'video/mp4','content-range':'bytes 3-5/100','content-length':'3','accept-ranges':'bytes'}})}})}catch(e){if(!res.headersSent){res.writeHead(e.status||500);res.end()}else res.destroy()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 try{
  let r=await fetch(url+'/llamigos',{headers:{Range:'bytes=3-5'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 3-5/100');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[11,22,33]);assert.equal(calls[0].url,cinemaFilms[0].source);assert.equal(calls[0].options.headers.Range,'bytes=3-5');
  r=await fetch(url+'/llamigos',{method:'HEAD'});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,0);assert.equal(calls[1].options.method,'HEAD');
  const count=calls.length;
  for(const range of ['bytes=-','bytes=0-1,3-4','nonsense'])assert.equal((await fetch(url+'/llamigos',{headers:{Range:range}})).status,416);
  assert.equal((await fetch(url+'/https://example.com/evil')).status,404);assert.equal(calls.length,count);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
});
