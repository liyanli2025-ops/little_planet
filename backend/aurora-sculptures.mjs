import {fail} from './store.mjs';
export const sculptureTTL=72*60*60*1000;
export function createSculptures(db,{now=Date.now}={}){
 db.exec(`CREATE TABLE IF NOT EXISTS aurora_sculptures(id TEXT PRIMARY KEY,owner INTEGER NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,data TEXT NOT NULL); CREATE INDEX IF NOT EXISTS aurora_sculptures_expiry ON aurora_sculptures(expires);`);
 const prune=()=>db.prepare('DELETE FROM aurora_sculptures WHERE expires<=?').run(now());
 return {list(){prune();return db.prepare('SELECT id,created,expires,data FROM aurora_sculptures ORDER BY created').all().map(r=>({...JSON.parse(r.data),id:r.id,created:r.created,expires:r.expires}));},save(u,b,guest,guests=[]){
  prune();fail(guest?.room==='outside'&&guest.position,'请先来到雪地',409);
  fail(['snowman','duck'].includes(b.kind)&&typeof b.id==='string'&&/^[a-zA-Z0-9-]{8,64}$/.test(b.id),'作品无效');
  const old=db.prepare('SELECT owner FROM aurora_sculptures WHERE id=?').get(b.id);if(old){fail(old.owner===u.id,'作品无效');return this.list();}
  fail(Number.isFinite(b.x)&&Number.isFinite(b.z)&&Math.hypot(b.x-3.3,b.z-.1)<1.55,'请在工具篮旁的雪地制作');
  fail(Math.hypot(guest.position[0]-b.x,guest.position[2]-b.z)<1.6,'请走近再放下');
  fail(Number.isFinite(b.radius)&&b.radius>=(b.kind==='duck'?.08:.18)&&b.radius<=(b.kind==='duck'?.14:.38),'雪球大小无效');
  fail([{x:-1,z:-.4,r:2.45},{x:1.5,z:2.7,r:.48},{x:2.75,z:2.7,r:.48},{x:2.15,z:3.35,r:.32},{x:2.9,z:1.25,r:.29}].every(o=>Math.hypot(o.x-b.x,o.z-b.z)>o.r+b.radius+.06),'这里靠近设施，换一小块雪地吧',409);
  fail(guests.filter(g=>g.id!==u.id&&g.room==='outside'&&g.position).every(g=>Math.hypot(g.position[0]-b.x,g.position[2]-b.z)>b.radius+.3),'这里有人，换一小块雪地吧',409);
  const items=this.list();fail(items.length<250&&db.prepare('SELECT count(*) AS n FROM aurora_sculptures WHERE owner=?').get(u.id).n<25,'先欣赏一下已有作品吧',429);
  fail(items.every(o=>Math.hypot(o.x-b.x,o.z-b.z)>o.radius+b.radius+.08),'这里已有作品，换一小块雪地吧',409);
  const data={kind:b.kind,x:b.x,z:b.z,radius:b.radius,yaw:Number.isFinite(b.yaw)?b.yaw:0};const created=now();
  db.prepare('INSERT INTO aurora_sculptures VALUES(?,?,?,?,?)').run(b.id,u.id,created,created+sculptureTTL,JSON.stringify(data));return this.list();
 }};
}
