// On-demand public reference discovery. No account data or conversations leave
// the server; only the model's canonical brand name is searched.
export function createArtworkReferences({fetcher=fetch,reviewer}={}){
 const cache=new Map();
 async function find(brief){
  const brand=brief?.brand?.trim();if(!brand||brand.length>80||!reviewer)return null;
  if(cache.has(brand))return cache.get(brand);
  const deadline=Date.now()+45000;
  try{
   const api=new URL('https://commons.wikimedia.org/w/api.php');
   for(const [k,v] of Object.entries({action:'query',generator:'search',gsrsearch:`"${brand}" logo`,gsrnamespace:6,gsrlimit:3,prop:'imageinfo',iiprop:'url',iiurlwidth:768,format:'json'}))api.searchParams.set(k,v);
   const r=await fetcher(api,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{'User-Agent':'Echoo-Artwork/1.0 (https://github.com/liyanli2025-ops/little_planet)'}});
   if(!r.ok)return null;
   const data=await r.json();
   for(const page of Object.values(data.query?.pages||{}).slice(0,3)){
    if(Date.now()>=deadline)return null;
    const info=page.imageinfo?.[0],address=info?.thumburl||info?.url;if(!address)continue;
    const u=new URL(address);if(u.protocol!=='https:'||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname)||u.username||u.password)continue;
    const image=await fetcher(u,{signal:AbortSignal.timeout(Math.max(1,Math.min(8000,deadline-Date.now()))),redirect:'error'});if(!image.ok||Number(image.headers.get('content-length'))>2*1024*1024)continue;
    const chunks=[];let size=0;for await(const c of image.body){size+=c.length;if(size>2*1024*1024)throw Error('Reference too large');chunks.push(c);}const bytes=Buffer.concat(chunks);
    const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':null;
    if(!mime)continue; // Never execute an SVG, HTML or a model-supplied URL.
    const verdict=await reviewer.inspect({bytes,mime},`Reference identification only: does this image actually depict the recognizable ${brand} logo? It must match this requested identity: ${brief.subject||brand}. Ignore background colors and captions in this reference; reject unrelated products, a generic animal or an invented symbol. This is a public reference, not the finished textile.`,{timeoutMs:Math.max(1,Math.min(25000,deadline-Date.now()))});
    if(!verdict.pass)continue;
    const result={image:`data:${mime};base64,${bytes.toString('base64')}`,source:info.descriptionurl||page.title,provider:'wikimedia-commons',brand};
    if(cache.size>=20)cache.delete(cache.keys().next().value);cache.set(brand,result);return result;
   }
  }catch{} // A reference outage must not masquerade as a verified reference.
  return null;
 }
 return {find};
}
