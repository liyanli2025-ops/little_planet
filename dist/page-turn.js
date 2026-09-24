import * as T from './vendor/three.module.js';
// A deforming sheet: u=0 stays attached to the spine throughout the turn.
export function createTurningPage(parent){
 const geometry=new T.PlaneGeometry(.14,.17,20,4),uv=geometry.attributes.uv;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#faf1d6';ctx.fillRect(0,0,256,256);ctx.fillStyle='#cec5ac';
 for(let row=0;row<6;row++)ctx.fillRect(36,48+row*28,row===5?108:181,3);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sheet=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:.94}));
 sheet.castShadow=true;sheet.receiveShadow=true;parent.add(sheet);sheet.visible=false;
 function pose(progress){const ease=progress*progress*(3-2*progress),theta=-.12+(Math.PI+.24)*ease,bend=Math.sin(Math.PI*progress),pos=geometry.attributes.position;
 for(let i=0;i<pos.count;i++){const u=uv.getX(i),z=(uv.getY(i)-.5)*.17,angle=theta-.24*bend*u;
 pos.setXYZ(i,.14*u*Math.cos(angle),.037+.14*u*Math.sin(angle)+.012*Math.sin(Math.PI*u)*bend,z+.006*bend*u*Math.sin(uv.getY(i)*Math.PI));}
 pos.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
 }
 pose(0);return {sheet,pose};
}

