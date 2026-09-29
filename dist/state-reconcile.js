// Merge independently changed fields and diary entries; inventory arrays stay atomic;
// the two world slots are fixed identities and can safely be merged by index.
export function reconcileState(before,local,remote){
 const conflicts=[];
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 function merge(a,b,c,path){
  if(equal(b,a))return c;
  if(equal(c,a)||equal(b,c))return b;
  if(['events','notes'].includes(path)&&[a,b,c].every(x=>Array.isArray(x)&&x.every(v=>v&&typeof v.id==='string')&&new Set(x.map(v=>v.id)).size===x.length)){
   const maps=[a,b,c].map(x=>new Map(x.map(v=>[v.id,v]))),ids=new Set([...c,...b].map(v=>v.id));
   return [...ids].map(id=>merge(...maps.map(m=>m.get(id)),path+'.'+id)).filter(v=>v!==undefined).sort((x,y)=>(y.created||0)-(x.created||0));
  }
  if(path==='worlds'&&[a,b,c].every(x=>Array.isArray(x)&&x.length===2))return b.map((_,i)=>merge(a[i],b[i],c[i],path+'.'+i));
  if(object(a)&&object(b)&&object(c)){
   const result={};
   for(const key of new Set([...Object.keys(a),...Object.keys(b),...Object.keys(c)])){
    const value=merge(a[key],b[key],c[key],path?path+'.'+key:key);
    if(value!==undefined)Object.defineProperty(result,key,{value,enumerable:true,writable:true,configurable:true});
   }
   return result;
  }
  conflicts.push(path);return b;
 }
 return {state:merge(before,local,remote,''),conflicts};
}
