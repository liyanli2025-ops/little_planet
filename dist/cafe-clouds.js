import * as T from './vendor/three.module.js';
// Bounded world-space volumes: soft density, sunlight absorption and drifting detail.
export function createCafeClouds(scene, sky) {
 const geometry=new T.BoxGeometry(2,2,2),clouds=[];
 const fragment=`
 uniform vec3 center,extent,sunDirection,shade,lit;
 uniform float clock,seed;
 varying vec3 world;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float density(vec3 p){
  float shape=max(max(1.-length((p-vec3(-.38,-.13,0.)) / vec3(.48,.57,.65)),1.-length((p-vec3(.08,.10,.04))/vec3(.52,.76,.72))),1.-length((p-vec3(.48,-.18,-.06))/vec3(.38,.48,.56)));
  vec3 q=p*5.+vec3(seed,clock*.013,0.);
  float n=noise(q)*.7+noise(q*2.1)*.3;
  return smoothstep(0.,.24,shape-(n-.28)*.36)*1.5;
 }
 void main(){
  vec3 ro=(cameraPosition-center)/extent,rd=normalize(world-cameraPosition)/extent;
  vec3 safe=sign(rd)*max(abs(rd),vec3(.00001));
  vec3 a=(-vec3(1)-ro)/safe,b=(vec3(1)-ro)/safe;
  vec3 mn=min(a,b),mx=max(a,b);
  float near=max(0.,max(max(mn.x,mn.y),mn.z)),far=min(min(mx.x,mx.y),mx.z);
  if(far<=near)discard;
  float stepSize=(far-near)/28.,alpha=0.;vec3 sum=vec3(0.);
  vec3 ld=normalize(sunDirection/extent);
  for(int i=0;i<28;i++){
   vec3 p=ro+rd*(near+(float(i)+.5)*stepSize);
   float den=density(p),absorb=1.-exp(-den*stepSize*.18);
   float shadow=density(p+ld*.22)*.55+density(p+ld*.48)*.25;
   float lighting=clamp(exp(-shadow*1.8)*.72+(p.y*.5+.5)*.28,0.,1.);
   sum+=(1.-alpha)*absorb*mix(shade,lit,lighting);
   alpha+=(1.-alpha)*absorb;
   if(alpha>.985)break;
  }
  if(alpha<.008)discard;
  gl_FragColor=vec4(sum/max(alpha,.001),alpha);
  #include <colorspace_fragment>
 }`;
 for(let i=0;i<12;i++){
  const extent=new T.Vector3(18+(i%3)*4,9+(i%4)*1.6,12+(i%2)*3),center=new T.Vector3();
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{center:{value:center},extent:{value:extent},sunDirection:sky.direction,shade:{value:new T.Color()},lit:{value:new T.Color()},clock:{value:0},seed:{value:i*13.7}},vertexShader:'varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:fragment});
  const cloud=new T.Mesh(geometry,material);cloud.scale.copy(extent);cloud.name='Soft spatial cloud '+i;scene.add(cloud);clouds.push(cloud);
 }
 return {tick(time,solar,wet){const t=time/1000;
  clouds.forEach((cloud,i)=>{const a=i/12*Math.PI*2+t*.00028,r=170+(i%3)*34,u=cloud.material.uniforms;
   cloud.position.set(Math.cos(a)*r,38+(i%4)*13,Math.sin(a)*r);u.center.value.copy(cloud.position);u.clock.value=t%100000;
   u.shade.value.set(0x39495d).lerp(new T.Color(wet?0x82919c:0xa2b9ca),solar.daylight).lerp(new T.Color(0x925575),solar.twilight*.75);
   u.lit.value.set(0x8c9cac).lerp(new T.Color(wet?0xc6ced2:0xfffbf0),solar.daylight).lerp(new T.Color(0xffb789),solar.twilight*.85);
  });
 }};
}
