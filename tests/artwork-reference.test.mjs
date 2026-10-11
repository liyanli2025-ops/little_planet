import test from 'node:test';import assert from 'node:assert/strict';
import {createArtworkReferences} from '../backend/artwork-reference.mjs';
const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
test('searches arbitrary semantic brands, verifies references and caches accepted results',async()=>{
 let searches=0,reviews=0;
 const source=createArtworkReferences({fetcher:async(url)=>{const u=new URL(url);if(u.hostname==='commons.wikimedia.org'){searches++;assert.match(u.searchParams.get('gsrsearch'),/New Unknown Brand/);return Response.json({query:{pages:{1:{imageinfo:[{thumburl:'https://upload.wikimedia.org/example.png',descriptionurl:'https://commons.wikimedia.org/wiki/File:Example.png'}]}}}});}return new Response(png);},reviewer:{inspect:async()=>{reviews++;return {pass:true};}}});
 const brief={brand:'New Unknown Brand',description:'A connected emblem'};
 const result=await source.find(brief);assert.match(result.image,/^data:image\/png;base64,/);assert.equal(result.brand,brief.brand);assert.deepEqual(await source.find(brief),result);assert.equal(searches,1);assert.equal(reviews,1);
});
test('does not download arbitrary hosts, treat outages as evidence, or accept rejected references',async()=>{
 for(const address of ['https://127.0.0.1/secret','https://upload.wikimedia.org.evil.example/image','https://upload.wikimedia.org/a']){
  let downloads=0;
  const source=createArtworkReferences({fetcher:async(url)=>{if(new URL(url).hostname==='commons.wikimedia.org')return Response.json({query:{pages:{1:{imageinfo:[{thumburl:address}]}}}});downloads++;return new Response(png);},reviewer:{inspect:async()=>({pass:false})}});
  assert.equal(await source.find({brand:'Example',description:'A logo'}),null);assert.equal(downloads,address==='https://upload.wikimedia.org/a'?1:0);
 }
 const failed=createArtworkReferences({fetcher:async()=>new Response('',{status:403}),reviewer:{inspect:async()=>{throw Error('not reached');}}});assert.equal(await failed.find({brand:'Example'}),null);
});
