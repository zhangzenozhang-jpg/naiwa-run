import * as T from './vendor/three.module.min.js';
import {laughPose,smooth} from './motion.js';
const sphere=new T.SphereGeometry(1,32,24);
const yellow=new T.MeshPhysicalMaterial({color:0xf5c83a,roughness:.62,clearcoat:.055});
const olive=new T.MeshPhysicalMaterial({color:0x6b612d,roughness:.65,clearcoat:.04});
const dark=new T.MeshStandardMaterial({color:0x241315,roughness:.82});
const black=new T.MeshPhysicalMaterial({color:0x030704,roughness:.12,clearcoat:1});
const tooth=new T.MeshStandardMaterial({color:0xfff0cd,roughness:.3});
const highlight=new T.MeshBasicMaterial({color:0xfffce8});
const V=(a)=>new T.Vector3(...a);
function mesh(parent,geo,material){const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,x,y,z,sx,sy,sz,material=yellow){const m=mesh(parent,sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
function tube(parent,points,r,material=yellow){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(V)),24,r,10,false),material);}
// Curved, tapered limbs. Positions and normals are updated in place, without per-frame geometries.
function softLimb(parent,radii,material=yellow){
 const segments=28,sides=14,p=[],idx=[];
 for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++)p.push(0,0,0);
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){let a=i*(sides+1)+j,b=a+sides+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);const obj=mesh(parent,geo,material);
 const tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),up=new T.Vector3(0,0,1);
 function update(points){const curve=new T.CatmullRomCurve3(points.map(V));const pos=geo.attributes.position;
  for(let i=0;i<=segments;i++){const t=i/segments,c=curve.getPoint(t);curve.getTangent(t,tangent);normal.crossVectors(tangent,up).normalize();if(normal.lengthSq()<.01)normal.set(1,0,0);binormal.crossVectors(tangent,normal).normalize();const q=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(q)),r=T.MathUtils.lerp(radii[k],radii[k+1],q-k);
   for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,n=i*(sides+1)+j;pos.setXYZ(n,c.x+r*(Math.cos(a)*normal.x+Math.sin(a)*binormal.x),c.y+r*(Math.cos(a)*normal.y+Math.sin(a)*binormal.y),c.z+r*(Math.cos(a)*normal.z+Math.sin(a)*binormal.z));}
  }pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
 }return {obj,update};
}
function irisMaterialGeometry(){const p=[0,0,.006],c=[],idx=[],base=new T.Color(0x80b34d),rim=new T.Color(0x56833e);c.push(base.r,base.g,base.b);const N=96;
 for(let ring=1;ring<=4;ring++)for(let j=0;j<=N;j++){const a=j/N*Math.PI*2,r=.158*ring/4;p.push(Math.sin(a)*r,Math.cos(a)*r,.008*(1-ring/4));const col=base.clone().lerp(rim,ring===4?.9:.13+.22*Math.sin(j*2.4+ring));col.multiplyScalar(.94+Math.sin(j*8.3)*.08);c.push(col.r,col.g,col.b);}
 for(let j=0;j<N;j++)idx.push(0,1+j,2+j);
 for(let k=0;k<3;k++)for(let j=0;j<N;j++){const a=1+k*(N+1)+j,b=a+N+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function createNaiwa(){
 const root=new T.Group(),actor=new T.Group(),torso=new T.Group();root.add(actor);actor.add(torso);torso.position.y=1.2;
 const profile=new T.SplineCurve([[0,1.01],[.44,1.035],[.78,1.20],[1.01,1.53],[1.075,1.91],[1.025,2.23],[.915,2.55],[.77,2.85],[.64,3.12],[.56,3.37],[.55,3.57],[.52,3.77],[.42,3.96],[.24,4.09],[0,4.13]].map(V2=>new T.Vector2(...V2)));
 const points=profile.getPoints(110);const seamY=3.49;let seamAt=points.findIndex(p=>p.y>=seamY);const before=points[seamAt-1],after=points[seamAt];const seamR=T.MathUtils.lerp(before.x,after.x,(seamY-before.y)/(after.y-before.y));points.splice(seamAt,0,new T.Vector2(seamR,seamY),new T.Vector2(seamR,seamY));
 const radial=80,pos=[],col=[],idx=[],rest=[],meta=[];const skinA=new T.Color(0xf5c637),skinB=new T.Color(0xf1d995);
 function centerZ(y){return .19*Math.exp(-(((y-1.94)/.72)**2))+.19*smooth(2.95,3.8,y);}
 function lipWeight(phi){const angle=Math.atan2(Math.sin(phi),Math.cos(phi));return Math.abs(angle)<.82?Math.pow(Math.cos(angle/.82*Math.PI/2),.72):0;}
 points.forEach((p,i)=>{for(let j=0;j<=radial;j++){const phi=j/radial*Math.PI*2,x=p.x*Math.sin(phi),y=p.y,z=p.x*.82*Math.cos(phi)+centerZ(y);rest.push(x,y,z);pos.push(x,y-1.2,z);meta.push({upper:i>seamAt,w:lipWeight(phi)});
  const patch=(x/.82)**2+((y-2.15)/.79)**2;let blend=z>.42?smooth(1.035,.96,patch+Math.sin(x*16+y*23)*.005):0;const color=skinA.clone().lerp(skinB,blend);color.multiplyScalar(1+Math.sin(x*253+y*183+z*217)*.005);col.push(color.r,color.g,color.b);
 }});
 for(let i=0;i<points.length-1;i++)for(let j=0;j<radial;j++){if(i===seamAt)continue;let a=i*(radial+1)+j,b=a+radial+1;idx.push(a,a+1,b,b,a+1,b+1);}
 const bodyGeo=new T.BufferGeometry();bodyGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));bodyGeo.setAttribute('color',new T.Float32BufferAttribute(col,3));bodyGeo.setIndex(idx);bodyGeo.computeVertexNormals();
 const body=mesh(torso,bodyGeo,new T.MeshPhysicalMaterial({vertexColors:true,roughness:.61,clearcoat:.06,side:T.DoubleSide}));body.name='continuous-skin';
 const head=new T.Group();head.position.set(0,3.35-1.2,.16);torso.add(head);
 const eyes=[];
 for(const side of [-1,1]){const eye=new T.Group();eye.position.set(side*.357,.405,.359);eye.rotation.y=side*.56;head.add(eye);ell(eye,0,0,-.042,.166,.178,.055);const iris=mesh(eye,irisMaterialGeometry(),new T.MeshPhysicalMaterial({vertexColors:true,roughness:.32,clearcoat:.8}));iris.name='iris';ell(eye,0,-.004,.018,.079,.091,.018,black);ell(eye,-.025,.041,.036,.018,.014,.004,highlight);ell(eye,.028,-.04,.035,.006,.006,.003,highlight);
  const closed=new T.Group();closed.position.copy(eye.position);closed.rotation.copy(eye.rotation);head.add(closed);tube(closed,[[-.137,-.012,.016],[-.07,.041,.025],[0,.055,.03],[.08,.038,.022],[.135,-.01,.008]],.016,new T.MeshStandardMaterial({color:0x565329,roughness:.8}));tube(closed,[[-.14,.025,-.02],[0,.075,-.005],[.14,.025,-.02]],.014,yellow);closed.visible=false;eyes.push({eye,closed});
 }
 // The mouth opens through a seam in the continuous skin; it is not pasted over the face.
 const mouthParts=new T.Group();head.add(mouthParts);const mouthPositions=[],mouthIndex=[];for(let i=0;i<=40;i++)for(let j=0;j<=8;j++)mouthPositions.push(0,0,0);for(let i=0;i<40;i++)for(let j=0;j<8;j++){const a=i*9+j,b=a+9;mouthIndex.push(a,b,a+1,b,b+1,a+1);}const cavityGeo=new T.BufferGeometry();cavityGeo.setAttribute('position',new T.Float32BufferAttribute(mouthPositions,3));cavityGeo.setIndex(mouthIndex);const cavity=mesh(mouthParts,cavityGeo,new T.MeshBasicMaterial({color:0x260b11,side:T.DoubleSide}));const tongue=ell(mouthParts,0,-.08,.535,.17,.045,.055,new T.MeshStandardMaterial({color:0xb56762,roughness:.7}));
 const upperTeeth=[],lowerTeeth=[];for(let i=-4;i<=4;i++){upperTeeth.push(ell(mouthParts,i*.071,.125,.53-Math.abs(i)*.014,.036,.032,.018,tooth));}
 for(const side of [-1,1])lowerTeeth.push(ell(mouthParts,side*.22,-.04,.52,.024,.053,.022,tooth));
 const smile=tube(head,[[-.245,.145,.568],[-.13,.14,.605],[0,.137,.617],[.13,.14,.605],[.245,.145,.568]],.008,new T.MeshStandardMaterial({color:0x58452a,roughness:.7}));
 const arms=[],hands=[],legs=[],feet=[];
 for(const side of [-1,1]){const arm=softLimb(torso,[.26,.285,.235,.16]);arms.push(arm);const hand=new T.Group();torso.add(hand);ell(hand,0,0,0,.15,.18,.112,olive);
  for(let k=0;k<4;k++){const yy=.115-k*.082;const length=k===3?.19:.27;const end=-side*length;tube(hand,[[side*.02,yy,.025],[-side*.11,yy-.018,.092],[end,yy+.004,.078]],k===3?.039:.046,olive);ell(hand,end,yy+.004,.078,.046,.043,.044,olive);}
  tube(hand,[[side*.04,.11,-.015],[-side*.07,.225,.03],[-side*.16,.218,.075]],.06,olive);ell(hand,-side*.16,.218,.075,.06,.052,.05,olive);hands.push(hand);
  legs.push(softLimb(actor,[.285,.265,.145,.065]));const foot=new T.Group();actor.add(foot);const outline=new T.Shape();outline.moveTo(-.18,-.16);outline.quadraticCurveTo(-.30,.05,-.255,.33);outline.quadraticCurveTo(-.25,.49,-.13,.48);outline.lineTo(-.10,.40);outline.quadraticCurveTo(-.08,.55,.02,.53);outline.quadraticCurveTo(.10,.53,.11,.42);outline.quadraticCurveTo(.17,.52,.24,.45);outline.quadraticCurveTo(.31,.30,.22,.02);outline.quadraticCurveTo(.21,-.20,-.18,-.16);const footMesh=mesh(foot,new T.ExtrudeGeometry(outline,{depth:.045,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.045,bevelThickness:.035,curveSegments:12}),olive);footMesh.rotation.x=Math.PI/2;footMesh.position.y=.025;feet.push(foot);
 }
 // Small rear tail, visible when inspecting the model from the side.
 const tail=tube(torso,[[0,.05,-.65],[0,.0,-.9],[0,.15,-1.04]],.14);tail.scale.set(.8,1,1);
 const leaf=new T.Group();leaf.position.set(0,4.95,0);root.add(leaf);const leafMat=new T.MeshStandardMaterial({color:0x74a657,roughness:.75,side:T.DoubleSide});const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.absarc(0,0,1.8,.1,Math.PI*2-.2,false);leafShape.lineTo(0,0);const leafMesh=mesh(leaf,new T.ShapeGeometry(leafShape,48),leafMat);leafMesh.rotation.x=-Math.PI/2;tube(leaf,[[0,0,0],[0,-.4,0],[.2,-1.2,.15]],.035,new T.MeshStandardMaterial({color:0x436d33}));for(let i=0;i<10;i++){const a=i/10*Math.PI*2;tube(leaf,[[0,.015,0],[Math.sin(a)*1.65,.015,Math.cos(a)*1.65]],.013,new T.MeshStandardMaterial({color:0xb3cb79}));}leaf.visible=false;
 const aura=mesh(root,new T.TorusGeometry(1.45,.04,8,64),new T.MeshBasicMaterial({color:0xffda62}));aura.rotation.x=-Math.PI/2;aura.position.y=.06;aura.visible=false;
 let lastMouth=-1,lastHead=0,lastBelly=0;
 function deform(open,headAngle,belly){if(Math.abs(open-lastMouth)<.004&&Math.abs(headAngle-lastHead)<.002&&Math.abs(belly-lastBelly)<.001)return;lastMouth=open;lastHead=headAngle;lastBelly=belly;
  const p=bodyGeo.attributes.position;
  for(let i=0;i<p.count;i++){let x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];const {upper,w}=meta[i];const fade=upper?1-smooth(3.49,3.95,y):smooth(2.9,3.49,y);y+=(upper?.075:-.51)*open*w*fade;z+=belly*Math.exp(-(((y-2.1)/.7)**2));const h=smooth(3.0,3.49,rest[i*3+1])*headAngle,dy=y-3.35,dz=z-.16;const yy=dy*Math.cos(h)-dz*Math.sin(h),zz=dy*Math.sin(h)+dz*Math.cos(h);p.setXYZ(i,x,yy+3.35-1.2,zz+.16);}
  p.needsUpdate=true;bodyGeo.computeVertexNormals();bodyGeo.computeBoundingSphere();head.rotation.x=headAngle;
 }
 function animate(time,state,display=false){
  const running=state.mode==='running',laughing=Number.isFinite(state.laughTime)&&state.laughTime>=0;
  const pose=laughing?laughPose(state.laughTime,running):null;
  const phase=time*(state.power?.()?16:10.6),stride=running?Math.sin(phase):0,air=state.y>(state.ground||0)+.1;
  actor.position.set(pose?-1.35*pose.fall:0,pose?pose.hop+pose.fall*.96:0,0);actor.rotation.set(pose?-.22*pose.fall:0,pose?pose.yaw:0,pose?-1.48*pose.fall:0);
  torso.rotation.set(pose?pose.lean:air?-.08:running?.10:0,0,pose?Math.sin(time*5)*.016:stride*.025);torso.position.y=1.2+(pose?pose.shake*.018:running?Math.abs(stride)*.045:Math.sin(time*1.8)*.018);torso.scale.set(1+(pose?pose.shake*.012:0),1,1+(pose?pose.shake*.014:0));
  root.scale.y=state.slide>0?.85:1;root.scale.z=1;if(state.slide>0){actor.rotation.x=-1.38;actor.position.y=.60;torso.rotation.x=0;}
  const blink=Math.pow(Math.max(0,Math.sin(time*.78)),40)>.89;eyes.forEach(({eye,closed})=>{eye.visible=!(pose?.squint>.4||blink);closed.visible=!eye.visible;});
  const open=pose?.mouth||0;deform(open,pose?.head||0,pose?pose.shake*.018:Math.sin(time*1.8)*.008);mouthParts.visible=open>.045;smile.visible=open<=.045;
  const cp=cavityGeo.attributes.position;for(let i=0;i<=40;i++){const phi=(i/40*2-1)*.82,w=lipWeight(phi),x=seamR*Math.sin(phi),z=seamR*.82*Math.cos(phi)+centerZ(3.49)-.16;for(let j=0;j<=8;j++){const t=j/8;cp.setXYZ(i*9+j,x,.14+T.MathUtils.lerp(.075,-.51,t)*w*open,z-Math.sin(t*Math.PI)*.22);}}cp.needsUpdate=true;cavityGeo.computeVertexNormals();cavityGeo.computeBoundingSphere(); tongue.position.y=.14-.46*open;tongue.scale.y=.041*open;upperTeeth.forEach((t,i)=>{t.position.y=.14+.027*open;t.scale.y=.026*open;t.position.z=.53-Math.abs(i-4)*.014;});lowerTeeth.forEach(t=>{t.position.y=.14-.43*open;t.scale.y=.042*open;});
  for(let i=0;i<2;i++){const s=i?1:-1,arm=arms[i],hand=hands[i];let wx=s*.53,wy=2.11,wz=1.00,ex=s*1.02,ey=2.40,ez=.42;
   if(pose){const chest=Math.min(1,pose.arms),headLift=Math.max(0,pose.arms-1);wx=s*T.MathUtils.lerp(pose.separation,.34,headLift);wy=T.MathUtils.lerp(2.1+chest*.45,4.05,headLift);wz=T.MathUtils.lerp(1.0,.26,headLift);ex=s*(1.02+headLift*.10);ey=2.39+headLift*.95+chest*.12;ez=.44;hand.rotation.set(headLift*-.8,0,s*headLift*.42);wy+=pose.shake*.018;}
   else if(state.gliding){wx=s*.43;wy=3.8;wz=.2;ex=s*1.12;ey=3.15;ez=.05;hand.rotation.set(0,0,s*.5);}
   else if(air){wx=s*.85;wy=2.65;wz=.45;ex=s*1.12;ey=2.5;ez=.14;hand.rotation.set(0,0,-s*.3);}
   else if(running){wz=.62+s*stride*.40;wy=2.08+s*stride*.15;wx=s*.65;ey=2.32;ez=.08+s*stride*.35;hand.rotation.set(s*stride*.22,0,0);}
   else hand.rotation.set(0,0,0);
   arm.update([[s*.40,2.82-1.2,.02],[s*.80,2.66-1.2,.19],[ex,ey-1.2,ez],[wx,wy-1.2,wz]]);hand.position.set(wx,wy-1.2,wz);hand.rotation.y=-s*.16;
   const step=Math.sin(phase+(i?Math.PI:0)),lift=running?Math.max(0,step)*.34:0,kick=running?Math.cos(phase+(i?Math.PI:0))*.43:0;
   let fx=s*.50,fy=.065+lift,fz=.03+kick,ky=.70,kz=.10+kick*.44;
   if(air){fy=.39+(i?.0:.16);fz=i?-.3:.4;kz=.35;ky=.85;}
   if(pose){fy=.065+pose.fall*(.2+Math.max(0,Math.sin(time*13+i))* .35);fz=pose.fall*Math.sin(time*11+i)*.4;ky=.70-.04*Math.max(0,pose.lean);}
   legs[i].update([[s*.45,1.26,-.01],[s*.51,.98,kz*.35],[s*.53,ky,kz],[fx,fy+.015,fz]]);feet[i].position.set(fx,fy,fz);feet[i].rotation.x=running?-Math.max(0,step)*.24:pose?pose.fall*.25:0;feet[i].rotation.y=s*.12;
  }
  leaf.visible=!!state.gliding;leaf.rotation.z=Math.sin(time*2)*.04;aura.visible=!!state.power?.();aura.rotation.z=time*3;
 }
 root.userData={animate};animate(0,{mode:'viewer',y:0,ground:0,laughTime:-1});return root;
}
