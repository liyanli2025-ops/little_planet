const paths=new Map(),pending=new Map();
export const brandMarkReady=slug=>paths.has(slug);
export function loadBrandMark(slug){
 if(!/^[a-z0-9-]+$/.test(slug))return Promise.reject(Error('Invalid brand mark'));
 if(paths.has(slug))return Promise.resolve();
 if(!pending.has(slug))pending.set(slug,fetch('/assets/brand-marks/'+slug+'.json').then(r=>{if(!r.ok)throw Error('Brand mark unavailable');return r.json();}).then(d=>{paths.set(slug,new Path2D(d.path));}).catch(e=>{pending.delete(slug);throw e;}));
 return pending.get(slug);
}
export function drawBrandMark(ctx,slug,color,size){const path=paths.get(slug);if(!path)return;ctx.save();ctx.translate(size*.08,size*.08);ctx.scale(size*.84/24,size*.84/24);ctx.fillStyle=color;ctx.fill(path);ctx.restore();}
