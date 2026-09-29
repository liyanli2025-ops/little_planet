import * as T from './vendor/three.module.js';

// Window glass receives a live render of the same planet; precipitation remains local to its UVs.
export function createHomeWindows(){
 const panes=[];let elapsed=0,night=false,mode='sun',textures=null;
 const fallback=new T.DataTexture(new Uint8Array([164,184,161,255]),1,1);fallback.needsUpdate=true;
 const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
 const fragmentShader=`
 uniform sampler2D yard;uniform float clock,wet,snowy,mist,dark,aspect,live;varying vec2 vUv;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec2 q=vUv;float ratio=aspect/1.6;if(ratio<1.)q.x=(q.x-.5)*ratio+.5;else q.y=(q.y-.5)/ratio+.5;
  vec3 color=texture2D(yard,q).rgb;
  if(live<.5)color=mix(vec3(.56,.65,.49),vec3(.72,.83,.86),smoothstep(.1,1.,q.y))*(1.-dark*.82);
  color=mix(color,vec3(.64,.70,.69)*(1.-dark*.8),mist);
  float rain=0.;for(int i=0;i<2;i++){float layer=float(i);vec2 uv=vUv*vec2(35.+layer*21.,9.+layer*6.);uv.x+=uv.y*.035;uv.y+=clock*(2.4+layer)+hash(vec2(floor(uv.x),layer+9.))*11.;vec2 cell=floor(uv),f=fract(uv);float h=hash(vec2(cell.x,layer+1.));rain+=smoothstep(.06,0.,abs(f.x-(.15+h*.65)))*smoothstep(.36,0.,abs(f.y-.5))*step(.25,h);}
  color=mix(color,vec3(.78,.88,.91),rain*wet*.25);
  float flakes=0.;for(int i=0;i<2;i++){float l=float(i);vec2 uv=vUv*vec2(20.+l*10.,13.+l*7.);uv.y+=clock*(.35+l*.20);uv.x+=sin(clock*.5+floor(uv.y))*.15;vec2 c=floor(uv),f=fract(uv)-.5;flakes+=smoothstep(.075,.01,length(f))*step(.72,hash(c+l));}
  color=mix(color,vec3(.95,.98,1.),flakes*snowy*.9);
  // Subtle glass reflections leave the actual yard readable.
  float reflection=smoothstep(.014,0.,abs(vUv.x-vUv.y*.17-.86));color+=reflection*.026;
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
 function material(aspect,side=0){const m=new T.ShaderMaterial({uniforms:{yard:{value:textures?.[side]||fallback},clock:{value:elapsed},wet:{value:mode==='rain'?1:0},snowy:{value:mode==='snow'?1:0},mist:{value:mode==='fog'?.32:mode==='haze'?.16:0},dark:{value:+night},aspect:{value:aspect},live:{value:textures?1:0}},vertexShader,fragmentShader});m.userData.windowSide=side;panes.push(m);return m}
 function set(n,w){night=n;mode=w;for(const m of panes){m.uniforms.wet.value=+(w==='rain');m.uniforms.snowy.value=+(w==='snow');m.uniforms.mist.value=w==='fog'?.32:w==='haze'?.16:0;m.uniforms.dark.value=+n}}
 return {material,set,tick(dt){elapsed+=dt;for(const m of panes)m.uniforms.clock.value=elapsed},connect(maps){textures=maps;for(const m of panes){m.uniforms.yard.value=maps[m.userData.windowSide];m.uniforms.live.value=1}},state(){return {source:textures?'planet':'preview',night,weather:mode,panes:panes.length,elapsed}},dispose(){panes.forEach(m=>m.dispose());fallback.dispose()}};
}
