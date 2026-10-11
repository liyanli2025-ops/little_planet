const loaded=new Map(),pending=new Map();
export const referenceImageReady=url=>loaded.has(url);
export function loadReferenceImage(url){
 if(loaded.has(url))return Promise.resolve();
 if(!pending.has(url))pending.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{loaded.set(url,image);resolve();};image.onerror=()=>{pending.delete(url);reject(Error('Brand reference image unavailable'));};image.src=url;}));
 return pending.get(url);
}
export function drawReferenceImage(ctx,url,color,size){
 const image=loaded.get(url);if(!image)return true;
 const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d');c.drawImage(image,0,0);const p=c.getImageData(0,0,canvas.width,canvas.height),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 // Convert the official navy-on-white reference into an antialiased color stencil.
 for(let i=0;i<p.data.length;i+=4){const alpha=p.data[i+3]*Math.min(1,(255-p.data[i])/228);for(let k=0;k<3;k++)p.data[i+k]=rgb[k];p.data[i+3]=alpha;}
 c.putImageData(p,0,0);const scale=size*.88/Math.max(image.width,image.height);ctx.drawImage(canvas,(size-image.width*scale)/2,(size-image.height*scale)/2,image.width*scale,image.height*scale);return true;
}
