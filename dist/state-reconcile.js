// Merge only independently changed fields. Inventory/diary arrays stay atomic;
// the two world slots are fixed identities and can safely be merged by index.
export function reconcileState(before,local,remote){
 const conflicts=[];
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 function merge(a,b,c,path){
  if(equal(b,a))return c;
  if(equal(c,a)||equal(b,c))return b;
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
