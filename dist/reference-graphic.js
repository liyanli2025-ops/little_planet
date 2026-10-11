// Preserve downloaded contours and aspect ratio; only remove a uniform outer background.
export function referencePixels(data,width,height,accent){
 const corners=[0,(width-1)*4,((height-1)*width)*4,(width*height-1)*4];
 const opaque=corners.every(i=>data[i+3]>245),bg=[0,1,2].map(k=>corners.reduce((n,i)=>n+data[i+k],0)/4);
 const uniform=opaque&&corners.every(i=>bg.every((c,k)=>Math.abs(data[i+k]-c)<12));
 let colored=false;
 for(let i=0;i<data.length;i+=4){if(uniform){const d=Math.sqrt(bg.reduce((n,c,k)=>n+(data[i+k]-c)**2,0));data[i+3]*=Math.max(0,Math.min(1,(d-12)/42));}if(data[i+3]>100&&Math.max(...data.slice(i,i+3))-Math.min(...data.slice(i,i+3))>35)colored=true;}
 if(!colored&&/^#[0-9a-f]{6}$/i.test(accent)){const rgb=[1,3,5].map(i=>parseInt(accent.slice(i,i+2),16));for(let i=0;i<data.length;i+=4)for(let k=0;k<3;k++)data[i+k]=rgb[k];}
 return data;
}
export function prepareReferenceGraphic(image,accent){
 const raw=document.createElement('canvas');const ratio=Math.min(1,1024/Math.max(image.width,image.height));raw.width=Math.max(1,Math.round(image.width*ratio));raw.height=Math.max(1,Math.round(image.height*ratio));const ctx=raw.getContext('2d');ctx.drawImage(image,0,0,raw.width,raw.height);const pixels=ctx.getImageData(0,0,raw.width,raw.height);referencePixels(pixels.data,raw.width,raw.height,accent);ctx.putImageData(pixels,0,0);
 const result=document.createElement('canvas');result.width=result.height=1024;const scale=896/Math.max(raw.width,raw.height);result.getContext('2d').drawImage(raw,(1024-raw.width*scale)/2,(1024-raw.height*scale)/2,raw.width*scale,raw.height*scale);return result;
}
