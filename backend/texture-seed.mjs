import {deflateSync} from 'node:zlib';
// Plain, lossless reference canvas for image editing; no external seed image dependency.
export function textureSeed(color='#ffffff'){
 if(!/^#[a-fA-F0-9]{6}$/.test(color))throw Error('Invalid seed color');
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),size=512,raw=Buffer.alloc(size*(1+size*3));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let c=0;c<3;c++)raw[y*(1+size*3)+1+x*3+c]=rgb[c];
 const crc=b=>{let n=0xffffffff;for(const v of b){n^=v;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
 const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,sum]);};
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
 return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64');
}
