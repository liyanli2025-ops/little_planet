const cache=new Map();
export function cafeAssetBytes(url){const key=new URL(url,location.href).href;if(!cache.has(key))cache.set(key,fetch(key).then(r=>{if(!r.ok)throw Error('素材加载失败');return r.arrayBuffer()}).catch(e=>{cache.delete(key);throw e}));return cache.get(key)}
