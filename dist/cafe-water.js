import * as T from './vendor/three.module.js';
import {Ocean} from './vendor/water-threejs/Ocean.js';
import {waterEdge,waterSurface,waterRadius} from './cafe-water-surface.js';
// WaterThreeJS MIT: see vendor/water-threejs/LICENSE. Adapted to Echoo's
// spherical overview, level detail sea, r170 renderer and one tone-map pass.
export function createCafeWater(scene,renderer,camera,horizon,sky){
 const light=matchMedia('(pointer:coarse)').matches||innerWidth<700;
 const ocean=new Ocean(new T.Vector3(0,1,0),new T.Vector2(1,1)),u=ocean.uniforms;
 const segments=light?128:192,rings=light?80:112,positions=[],indices=[],bottom=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,r=waterRadius(a,j/rings),y=waterSurface(a,r),edgeR=Math.sin(waterEdge(a))*17.8;
  positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
  bottom.push(Math.cos(a)*r,y-(.12+Math.max(0,r-edgeR)*.6),Math.sin(a)*r);
  if(j<rings&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1)}
 }
 const geometry=values=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));g.setIndex(indices);g.computeVertexNormals();return g};
 ocean.mesh.geometry.dispose();ocean.mesh.geometry=geometry(positions);ocean.mesh.name='WaterThreeJS coastal ocean';horizon.add(ocean.mesh);
 const floor=new T.Mesh(geometry(bottom),new T.MeshStandardMaterial({color:0xc8b990,roughness:1,side:T.DoubleSide}));floor.name='Submerged coastal sand';horizon.add(floor);
 const m=ocean.mesh.material;
 m.vertexShader=m.vertexShader.replace('worldPos.y = uSurfaceY;','')
 .replace('vec3 displaced = worldPos + w.displacement;',`float a=atan(worldPos.z,worldPos.x);float edge=1.04-.24*cos(a-1.55)+.09*sin(2.*a+.3)-.16*cos(3.*(a-1.35));
 float offshore=length(worldPos.xz)-sin(edge)*17.8;float fade=smoothstep(-.08,2.0,offshore);
 vec3 displaced=worldPos+w.displacement*fade;`)
 .replace('vNormal   = w.normal;','vNormal=normalize(mat3(modelMatrix)*normal+(w.normal-vec3(0.,1.,0.))*fade*.55);')
 .replace('vHeight   = w.height;','vHeight=w.height*fade;');
 Object.assign(u,{cafeGlobe:{value:0},cafeTop:sky.top,cafeEdge:sky.edge,cafeLight:sky.light,cafeWarm:sky.warm});
 const atmosphere=`uniform vec3 cafeTop,cafeEdge;uniform float cafeLight,cafeWarm,cafeGlobe;
 vec3 cafeAtmosphere(vec3 d,vec3 sun){return mix(cafeEdge,cafeTop,smoothstep(0.,.75,max(0.,d.y)))+vec3(.32,.15,.055)*pow(max(0.,dot(d,sun)),22.)*cafeLight*(.3+cafeWarm);}
 `;
 m.fragmentShader=m.fragmentShader.replace('void main(){',atmosphere+'void main(){').replaceAll('atmosphere(Rsky, sunDir)','cafeAtmosphere(Rsky, sunDir)').replaceAll('atmosphere(refr, sunDir)','cafeAtmosphere(refr, sunDir)').replaceAll('atmosphere(horizonDir, sunDir)','cafeAtmosphere(horizonDir, sunDir)')
 .replace('gl_FragColor = vec4(color, 1.0);',`color*=.16+.84*cafeLight;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>`);
 m.fragmentShader=m.fragmentShader.replace('N = normalize(vec3(N.x + dsum.x, N.y, N.z + dsum.y));', 'if(cafeGlobe>.5){vec3 q=vWorldPos*2.8+vec3(uTime*.13,uTime*.09,-uTime*.11);vec3 xy=noised(q.xy),yz=noised(q.yz),zx=noised(q.zx);vec3 g=vec3(xy.y+zx.z,xy.z+yz.y,yz.z+zx.y);N=normalize(N+(g-N*dot(g,N))*.075);}else N=normalize(vec3(N.x+dsum.x,N.y,N.z+dsum.y));')
 .replace('vec3 Ns = N.y >= 0.0 ? N : -N;', 'if(cafeGlobe<.5)N=normalize(mix(N,vec3(0.,1.,0.),smoothstep(18.,110.,dist)*.92));vec3 Ns = N.y >= 0.0 ? N : -N;')
 .replace('(breakE + crestE * 0.7 + shoreFoam + contact)','(breakE*.12 + crestE*.12 + shoreFoam*1.2 + contact)')
 .replace('shoreFoam = shore * smoothstep(0.15, 0.55, sTex);',`float coastAngle=atan(vWorldPos.z,vWorldPos.x);float coastEdge=1.04-.24*cos(coastAngle-1.55)+.09*sin(2.*coastAngle+.3)-.16*cos(3.*(coastAngle-1.35));float coastDistance=length(vWorldPos.xz)-sin(coastEdge)*17.8;shoreFoam=shore*smoothstep(.15,.55,sTex)*(cafeGlobe>.5?1.:1.-smoothstep(.4,2.2,coastDistance));`)
 .replace('color += vec3(1.0, 0.94, 0.82) * D','color += vec3(.45, .42, .37) * min(D, 18.0)')
 .replace('breakE + shoreFoam + contact','breakE*.08 + shoreFoam + contact')
 .replace('float thickness = max(sceneEye - waterEye, 0.0);',`float thickness=max(sceneEye-waterEye,0.);if(cafeGlobe<.5){float a=atan(vWorldPos.z,vWorldPos.x);float e=1.04-.24*cos(a-1.55)+.09*sin(2.*a+.3)-.16*cos(3.*(a-1.35));float depth=.12+max(0.,length(vWorldPos.xz)-sin(e)*17.8)*.6;thickness=depth/max(.18,abs(V.y));}if(cafeGlobe>.5){vec3 q=normalize(vWorldPos-vec3(0.,-18.25,0.));float a=atan(q.z,q.x);float e=1.04-.24*cos(a-1.55)+.09*sin(2.*a+.3)-.16*cos(3.*(a-1.35));thickness=.18+max(0.,acos(clamp(q.y,-1.,1.))-e)*42.;}`)
 .replace('vec3 sceneCol = texture2D(uRefractionTex, rUV).rgb;','vec3 sceneCol=texture2D(uRefractionTex,rUV).rgb;if(cafeGlobe<.5){float sampledDepth=sceneEye-waterEye;float validObject=1.-smoothstep(thickness*.65,thickness*.95,sampledDepth);if(sampledDepth<0.)validObject=0.;sceneCol=mix(vec3(.46,.43,.28)*(.3+.7*sunElev),sceneCol,validObject);}if(cafeGlobe>.5)sceneCol=vec3(.46,.43,.28)*(.3+.7*sunElev);');
 m.toneMapped=true;m.side=T.FrontSide;
 u.uWaveCount.value=light?10:16;u.uBaseFreq.value=2*Math.PI/18;u.uAmplitude.value=.12;u.uChoppy.value=.45;u.uSpeed.value=.55;
 u.uDetailStrength.value=.065;u.uDetailScale.value=.3;u.uSunGlitter.value=.12;u.uRoughness.value=.14;
 u.uShoreFoamWidth.value=.65;u.uFoamCoverage.value=.85;u.uFoamThreshold.value=-.8;u.uCrestFoamStart.value=.8;u.uCloudShadow.value=0;
 u.uSSRStrength.value=0;u.uClarity.value=1.5;u.uRefractStrength.value=.012;
 u.uDeepColor.value.set(0x126178);u.uShallowColor.value.set(0x66c5b2);u.uDepthFalloff.value=.22;
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.texture.colorSpace=T.LinearSRGBColorSpace;
 u.uRefractionTex.value=target.texture;u.uDepthTex.value=target.depthTexture;
 const size=new T.Vector2();let width=0,height=0;
 // The original water sphere remains the inexpensive, round globe view.
 const spheres=[];scene.traverse(o=>{if(o.geometry?.type==='SphereGeometry'&&o.geometry.parameters.radius===17.8)spheres.push(o)});
 const globeMaterial=m.clone();globeMaterial.uniforms=u;
 const body=globeMaterial.vertexShader.indexOf('void main(){');globeMaterial.vertexShader=globeMaterial.vertexShader.slice(0,body)+`void main(){
 vec3 p=(modelMatrix*vec4(position,1.)).xyz;vec3 radial=normalize(p-vec3(0.,-18.25,0.));WaveSample w=sampleOcean(p.xz);
 vec3 slope=w.normal-vec3(0.,1.,0.);slope-=radial*dot(slope,radial);float coast=atan(radial.z,radial.x);float edge=1.04-.24*cos(coast-1.55)+.09*sin(2.*coast+.3)-.16*cos(3.*(coast-1.35));float offshore=acos(clamp(radial.y,-1.,1.))-edge;float ripple=w.height*.06*smoothstep(0.,.15,offshore);p+=radial*ripple;vWorldPos=p;vNormal=radial;vFold=w.fold;vHeight=ripple;vec4 vp=viewMatrix*vec4(p,1.);vViewZ=vp.z;gl_Position=projectionMatrix*vp;}`;
 for(const sphere of spheres){sphere.geometry.dispose();sphere.geometry=new T.SphereGeometry(17.8,128,80);sphere.material=globeMaterial;sphere.castShadow=false;sphere.receiveShadow=false;}

 function render(time){const detail=horizon.visible;u.cafeGlobe.value=detail?0:1;spheres.forEach(o=>o.visible=false);
  renderer.getDrawingBufferSize(size);const w=Math.max(1,Math.round(size.x*(light?.7:1))),h=Math.max(1,Math.round(size.y*(light?.7:1)));
  if(w!==width||h!==height){width=w;height=h;target.setSize(w,h)}
  u.uResolution.value.copy(size);u.uTime.value=(time/1000)%100000;u.uNear.value=camera.near;u.uFar.value=camera.far;u.uSunDir.value.copy(sky.direction.value);u.uProjMatrix.value.copy(camera.projectionMatrix);
  const previous=renderer.getRenderTarget(),tone=renderer.toneMapping,shadows=renderer.shadowMap.autoUpdate;
  try{ocean.mesh.visible=false;if(detail){renderer.toneMapping=T.NoToneMapping;renderer.setRenderTarget(target);renderer.render(scene,camera);}
   ocean.mesh.visible=true;spheres.forEach(o=>o.visible=!detail);renderer.toneMapping=tone;renderer.setRenderTarget(previous);renderer.shadowMap.autoUpdate=false;renderer.render(scene,camera);
  }finally{ocean.mesh.visible=true;renderer.toneMapping=tone;renderer.shadowMap.autoUpdate=shadows;renderer.setRenderTarget(previous)}
 }
 return {render,pickables:[ocean.mesh,...spheres],state:()=>({quality:light?'light':'full',triangles:indices.length/3,detail:horizon.visible}),dispose(){target.dispose()}};
}
