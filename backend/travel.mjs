import {randomInt,randomUUID} from 'node:crypto';
import {fail} from './store.mjs';
const stops=['paris','kyoto','cairo','venice'];
export function createTravelService(db,clock=Date.now,random=randomInt){
 db.exec(`CREATE TABLE IF NOT EXISTS account_trips(id TEXT PRIMARY KEY,account INTEGER NOT NULL,avatar INTEGER NOT NULL,departed INTEGER NOT NULL,returns INTEGER NOT NULL,photos TEXT NOT NULL,seen TEXT NOT NULL DEFAULT '[]');CREATE INDEX IF NOT EXISTS trips_owner ON account_trips(account,departed);`);
 const rows=id=>db.prepare('SELECT * FROM account_trips WHERE account=? ORDER BY departed DESC').all(id);
 const active=id=>rows(id).find(t=>t.returns>clock());
 function view(id){const now=clock(),trips=rows(id),trip=trips.find(t=>t.returns>now);const photos=trips.flatMap(t=>{const seen=new Set(JSON.parse(t.seen));return JSON.parse(t.photos).filter(p=>p.at<=now).map(p=>({...p,trip:t.id,avatar:t.avatar,seen:seen.has(p.id)}))}).sort((a,b)=>a.at-b.at);return {away:!!trip,departed:trip?.departed||null,photos,unread:photos.filter(p=>!p.seen).length,totalTrips:trips.length,serverTime:now}}
 function depart(id,avatar){db.exec('BEGIN IMMEDIATE');try{fail(!active(id),'已经在旅行中了',409);const now=clock(),duration=random(4*3600000,24*3600000+1),route=[...stops];for(let i=route.length-1;i>0;i--){const j=random(0,i+1);[route[i],route[j]]=[route[j],route[i]]}const trip=randomUUID(),photos=route.slice(0,3).map((destination,i)=>({id:randomUUID(),destination,at:now+Math.floor(duration*(.12+i*.25+random(0,100)/1000))}));db.prepare('INSERT INTO account_trips(id,account,avatar,departed,returns,photos) VALUES(?,?,?,?,?,?)').run(trip,id,avatar,now,now+duration,JSON.stringify(photos));db.exec('COMMIT');return view(id)}catch(e){db.exec('ROLLBACK');throw e}}
 function collect(id){const now=clock();db.exec('BEGIN IMMEDIATE');try{for(const t of rows(id)){const seen=new Set(JSON.parse(t.seen));for(const p of JSON.parse(t.photos))if(p.at<=now)seen.add(p.id);db.prepare('UPDATE account_trips SET seen=? WHERE id=? AND account=?').run(JSON.stringify([...seen]),t.id,id)}db.exec('COMMIT');return view(id)}catch(e){db.exec('ROLLBACK');throw e}}
 return {view,active,depart,collect};
}
