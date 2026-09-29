import * as T from './vendor/three.module.js';

// A restrained depth-based contact pass makes furniture sit on rugs and floors without painted shadows.
export function createInteriorFinish(renderer){
 const target=new T.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
 target.samples=Math.min(4,renderer.capabilities.maxSamples||0);
 let lastStats={calls:0,triangles:0};
 const uniforms={colorMap:{value:target.texture},depthMap:{value:target.depthTexture},size:{value:new T.Vector2(1,1)},inverseProjection:{value:new T.Matrix4()},strength:{value:.30}};
 const material=new T.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,transparent:true,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 varying vec2 vUv;uniform sampler2D colorMap,depthMap;uniform vec2 size;uniform mat4 inverseProjection;uniform float strength;
 vec3 positionAt(vec2 uv,float depth){vec4 p=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);return p.xyz/p.w;}
 void main(){vec4 original=texture2D(colorMap,vUv);float d=texture2D(depthMap,vUv).r;if(d>.99999||original.a<.01){gl_FragColor=original;return;}
 vec3 p=positionAt(vUv,d);vec3 normal=normalize(cross(dFdx(p),dFdy(p)));if(dot(normal,-p)<0.)normal=-normal;
 float pixels=clamp(size.y*.20/max(1.,-p.z),3.,30.);float sum=0.,weight=0.;
 for(int i=0;i<16;i++){float fi=float(i)+.5;float angle=fi*2.399963;float radius=sqrt(fi/16.);vec2 uv=vUv+vec2(cos(angle),sin(angle))*pixels*radius/size;float nd=texture2D(depthMap,uv).r;if(nd<.99999){vec3 delta=positionAt(uv,nd)-p;float len=length(delta);float range=1.-smoothstep(.15,.8,len);float hit=smoothstep(.10,.65,dot(normal,delta/max(len,.001)));sum+=hit*range;weight+=1.;}}
 vec3 col=original.rgb*(1.-strength*sum/max(1.,weight));gl_FragColor=vec4(col,original.a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2),material);scene.add(quad);const size=new T.Vector2();
 return {render(world,view){renderer.getDrawingBufferSize(size);if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);uniforms.size.value.copy(size)}uniforms.inverseProjection.value.copy(view.projectionMatrixInverse);const previous=renderer.getRenderTarget();try{renderer.setRenderTarget(target);renderer.clear();renderer.render(world,view);lastStats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}}finally{renderer.setRenderTarget(previous)}renderer.render(scene,camera)},stats(){return lastStats},dispose(){target.dispose();target.depthTexture.dispose();material.dispose();quad.geometry.dispose()}};
}
