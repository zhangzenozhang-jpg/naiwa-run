import * as T from './vendor/three.module.min.js';
import {laughPose,smooth} from './motion.js';

// Each character owns its deforming meshes; only immutable geometry/materials
// are shared. Removing a pickup must never dispose the active runner's assets.
const sphere=new T.SphereGeometry(1,32,24);
sphere.userData.shared=true;
const materials=new Map();
function material(color,extra={}){
 const key=color+JSON.stringify(extra);
 if(!materials.has(key)){const m=new T.MeshStandardMaterial({color,roughness:.48,...extra});m.userData.shared=true;materials.set(key,m);}
 return materials.get(key);
}
const skin=material('#f4c442'),cream=material('#e2cd9e'),handMat=material('#4b4a3e'),hairMat=material('#292624',{roughness:.29});
function mesh(parent,geometry,mat,name=''){const m=new T.Mesh(geometry,mat);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function ell(parent,p,s,mat=skin,name=''){const m=mesh(parent,sphere,mat,name);m.position.set(...p);m.scale.set(...s);return m;}
function group(parent,name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
function tube(parent,points,r,mat=skin){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,8,false),mat);}
function surface(parent,profile,depth,{patch=false,name='skin'}={}){
 const curve=new T.SplineCurve(profile.map(p=>new T.Vector2(...p)));
 const geo=new T.LatheGeometry(curve.getPoints(52),56);const p=geo.attributes.position,colors=[];
 const yellow=new T.Color('#f4c442'),pale=new T.Color('#f0e4cb');
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setZ(i,z*depth);const oval=patch==='muscle'?(x/.77)**2+((y-2.26)/1.02)**2:(x/.75)**2+((y-1.68)/.53)**2;const k=patch&&z>0?smooth(1.04,.96,oval)*smooth(.18,.38,z):0;const c=yellow.clone().lerp(patch==='muscle'?new T.Color('#e2cd9e'):pale,k);colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
 return mesh(parent,geo,material('#ffffff',{vertexColors:true}),name);
}

// A continuous tapered limb, updated in place through shoulder/elbow/wrist.
function limb(parent,radii,name){
 const n=26,k=16,geo=new T.BufferGeometry(),index=[];geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array((n+1)*(k+1)*3),3));
 for(let i=0;i<n;i++)for(let j=0;j<k;j++){const a=i*(k+1)+j,b=a+k+1;index.push(a,b,a+1,b,b+1,a+1);}
 geo.setIndex(index);const obj=mesh(parent,geo,skin,name),tangent=new T.Vector3(),normal=new T.Vector3(),binormal=new T.Vector3(),up=new T.Vector3(0,0,1);
 let signature='';
 return {obj,update(points){const next=points.flat().map(v=>v.toFixed(3)).join(',');if(signature===next)return;signature=next;
  const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),p=geo.attributes.position;
  for(let i=0;i<=n;i++){const t=i/n,center=c.getPoint(t);c.getTangent(t,tangent);normal.crossVectors(tangent,up).normalize();if(normal.lengthSq()<.01)normal.set(1,0,0);binormal.crossVectors(tangent,normal).normalize();const q=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(q)),r=T.MathUtils.lerp(radii[a],radii[a+1],q-a);
   for(let j=0;j<=k;j++){const angle=j/k*Math.PI*2;const v=normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal,Math.sin(angle)).multiplyScalar(r).add(center);p.setXYZ(i*(k+1)+j,v.x,v.y,v.z);}}
  p.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
 }};
}
function hand(parent,side,pickup){
 const h=group(parent,'hand-'+side);ell(h,[0,0,0],[.15,.20,.10],handMat);
 for(let i=0;i<(pickup?3:4);i++)ell(h,[(i-1.5)*.063,-.14,.025],[.042,.12,.047],handMat);
 const thumb=ell(h,[-side*.14,-.035,.035],[.065,.11,.07],handMat);thumb.rotation.z=side*.45;
 return h;
}

function eyes(parent,sigma,pickup){
 const result=[];const ey=sigma?.25:.13,ex=sigma?.30:.30,ez=sigma?.435:.525;
 for(const side of [-1,1]){
  const eye=group(parent,'eye-'+side,[side*ex,ey,ez]);eye.rotation.y=side*(sigma?.33:.18);
  const opened=group(eye,'open-eye'),closed=group(eye,'closed-eye');
  const sx=sigma?.135:.235,sy=sigma?.16:.20;
  ell(opened,[0,0,0],[sx,sy,.07],material(sigma?'#ccd17c':'#fff9e7',{roughness:.32}));
  ell(opened,[0,-.012,.06],[sigma?.108:.142,sigma?.134:.159,.035],material(sigma?'#91ad4e':'#73502f',{roughness:.23}));
  ell(opened,[0,-.009,.093],[sigma?.064:.101,sigma?.103:.119,.022],material('#100f0b',{roughness:.13}));
  ell(opened,[-.035,.05,.114],[.032,.037,.012],material('#fffef5',{roughness:.15}));
  if(!pickup)ell(opened,[.042,-.062,.114],[.013,.016,.007],material('#fff0d0'));
  ell(closed,[0,0,0],[sx,sy*.8,.07],skin);
  tube(closed,[[-sx*.90,-.01,.048],[0,.048,.078],[sx*.90,-.01,.048]],sigma?.019:.021,material(sigma?'#69572a':'#332920'));
  if(!sigma){
   tube(opened,[[-.225,.05,.045],[-.11,.17,.057],[.06,.18,.058],[.23,.07,.043]],.018,hairMat);
   for(const lid of [opened,closed])for(let j=0;j<3;j++)tube(lid,[[side*(.17+j*.018),.08-j*.015,.045],[side*(.23+j*.025),.14-j*.018,.045]],.012,hairMat);
  }
  const brow=group(parent,'brow-'+side,[side*ex,ey+(sigma?.22:.30),ez-.015]);brow.rotation.z=side*(sigma?-.07:0);
  tube(brow,[[-.16,0,-.01],[0,.045,.027],[.17,.006,-.015]],sigma?.023:.025,material(sigma?'#e0b437':'#42342b'));
  closed.visible=false;result.push({opened,closed,brow});
 }
 return result;
}

// The head has an actual mouth seam. Moving its lower vertices opens a cavity
// rather than drawing a dark oval on top of an unchanging face.
function face(parent,sigma,pickup){
 const profile=sigma?[[0,-.50],[.30,-.46],[.47,-.32],[.53,-.08],[.51,.20],[.47,.44],[.36,.60],[.16,.68],[0,.69]]:[[0,-.74],[.27,-.69],[.45,-.55],[.61,-.35],[.72,-.06],[.74,.22],[.67,.51],[.48,.74],[.24,.86],[0,.89]];
 const seam=sigma?-.08:-.36,depth=sigma?.94:.76;
 const points=new T.SplineCurve(profile.map(p=>new T.Vector2(...p))).getPoints(64);
 let cut=points.findIndex(p=>p.y>=seam);const a=points[cut-1],b=points[cut];const radius=T.MathUtils.lerp(a.x,b.x,(seam-a.y)/(b.y-a.y));points.splice(cut,0,new T.Vector2(radius,seam),new T.Vector2(radius,seam));
 const pos=[],colors=[],rest=[],indices=[],sides=64,metadata=[];const yellow=new T.Color('#f6c747'),blush=new T.Color('#eaae53');
 const lipWeight=phi=>{const angle=Math.atan2(Math.sin(phi),Math.cos(phi));return Math.abs(angle)<.77?Math.cos(angle/.77*Math.PI/2)**.8:0;};
 for(let i=0;i<points.length;i++)for(let j=0;j<=sides;j++){
  const phi=j/sides*Math.PI*2,x=points[i].x*Math.sin(phi),y=points[i].y,z=points[i].x*Math.cos(phi)*depth;
  pos.push(x,y,z);rest.push(x,y,z);metadata.push({upper:i>cut,w:lipWeight(phi)});
  const k=sigma?0:Math.exp(-((Math.abs(x)-.43)**2/.02+(y+.16)**2/.015))*Math.max(0,Math.cos(phi))*.43;
  const c=yellow.clone().lerp(blush,k);colors.push(c.r,c.g,c.b);
 }
 for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){if(i===cut)continue;const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(parent,geo,material('#ffffff',{vertexColors:true,side:T.DoubleSide}),'face-skin');
 const expression=group(parent,'laugh-mouth');
 const cavityGeo=new T.BufferGeometry(),cp=new Float32Array(33*7*3),ci=[];cavityGeo.setAttribute('position',new T.Float32BufferAttribute(cp,3));
 for(let i=0;i<32;i++)for(let j=0;j<6;j++){const a=i*7+j;ci.push(a,a+1,a+7,a+7,a+1,a+8);}cavityGeo.setIndex(ci);
 mesh(expression,cavityGeo,material('#351519',{side:T.DoubleSide,roughness:.84}),'mouth-cavity');
 const teeth=[];for(let i=0;i<7;i++){const x=(i-3)*.075;teeth.push(ell(expression,[x,seam,radius*depth-.015-Math.abs(x)*.045],[.041,.04,.036],material('#fff2d7'),'tooth'));}
 const tongue=ell(expression,[0,seam-.28,radius*depth-.035],[sigma?.18:.16,.05,.06],material('#d77d80'),'tongue');
 const smile=group(parent,'rest-mouth');
 if(sigma)tube(smile,[[-.29,seam+.015,radius*depth-.04],[0,seam-.018,radius*depth+.008],[.29,seam+.033,radius*depth-.04]],.013,material('#6d5025'));
 else{
  tube(smile,[[-.12,seam-.005,radius*depth+.006],[-.045,seam+.018,radius*depth+.019],[0,seam+.005,radius*depth+.023],[.045,seam+.018,radius*depth+.019],[.12,seam-.005,radius*depth+.006]],.021,material('#cc9161'));
  ell(smile,[0,seam-.031,radius*depth+.015],[.10,.028,.026],material('#e6a574'));
  ell(parent,[0,-.21,.558],[.073,.10,.075],skin,'nose');
  for(const side of [-1,1]){ell(parent,[side*.81,-.04,.025],[.15,.20,.10],skin,'ear');ell(parent,[side*.86,-.04,.11],[.072,.11,.025],material('#e8b746'));}
 }
 const eyeRig=eyes(parent,sigma,pickup);let previous=-1;
 return {update(open,squint,blink){
  if(Math.abs(open-previous)>.002){previous=open;const p=geo.attributes.position;
   for(let i=0;i<p.count;i++){let x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2];const m=metadata[i],fade=m.upper?1-smooth(seam,seam+.38,y):smooth(profile[0][1],seam,y);y+=(m.upper?.045:-.39)*open*m.w*fade;p.setXYZ(i,x,y,z);}
   p.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
   const c=cavityGeo.attributes.position;
   for(let i=0;i<=32;i++){const phi=(i/32*2-1)*.77,w=lipWeight(phi);for(let j=0;j<=6;j++){const t=j/6;c.setXYZ(i*7+j,radius*Math.sin(phi),seam+T.MathUtils.lerp(.045,-.39,t)*open*w,radius*depth*Math.cos(phi)-Math.sin(t*Math.PI)*.18+.003);}}
   c.needsUpdate=true;cavityGeo.computeVertexNormals();cavityGeo.computeBoundingSphere();
   teeth.forEach(t=>{t.position.y=seam-.025*open;t.scale.y=.042*open;});tongue.position.y=seam-.335*open;tongue.scale.y=.049*open;
  }
  expression.visible=open>.05;smile.visible=!expression.visible;
  eyeRig.forEach(({opened,closed,brow})=>{const shut=squint>.3||blink;opened.visible=!shut;closed.visible=shut;brow.position.y=(sigma?.47:.43)+squint*.035;});
 }};
}

function bobHair(parent,pickup){
 const geo=new T.BufferGeometry(),p=[],idx=[],around=72,vertical=32;
 function point(phi,t){
  const angle=Math.atan2(Math.sin(phi),Math.cos(phi)),front=Math.abs(angle);
  let bottom=-.70;if(front<1.25){const fringe=.42+.27*Math.exp(-(((angle-.25)/.39)**2));bottom=T.MathUtils.lerp(fringe,-.70,smooth(.82,1.25,front));}
  const y=T.MathUtils.lerp(.99,bottom,t),r=y>.14?.86*Math.sqrt(Math.max(0,1-((y-.14)/.85)**2)):.855-(.14-y)*.028;
  return [r*Math.sin(phi)-.035*(1-t),y,r*.79*Math.cos(phi)-.045];
 }
 for(let i=0;i<=vertical;i++)for(let j=0;j<=around;j++)p.push(...point(j/around*Math.PI*2,i/vertical));
 for(let i=0;i<vertical;i++)for(let j=0;j<around;j++){const a=i*(around+1)+j,b=a+around+1;idx.push(a,a+1,b,b,a+1,b+1);}
 geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(parent,geo,material('#292624',{roughness:.31,side:T.DoubleSide}),'side-part-bob');
 if(!pickup)for(const phi of [-2.6,-2.2,-1.8,-1.42,-1.2,1.25,1.52,1.9,2.3,2.8]){
  const line=[];for(let j=0;j<=10;j++){const v=point(phi+.025*Math.sin(j*.25),.12+j*.083);v[0]*=1.007;v[2]=(v[2]+.045)*1.012-.045;line.push(v);}tube(parent,line,.006,material('#3c3732',{roughness:.36}));
 }
}

export function createCharacter(type,{pickup=false}={}){
 if(type!=='naigema')throw new RangeError('Unknown character: '+type);
 const sigma=type==='naigema',root=new T.Group();root.name=type;
 const actor=group(root,'actor'),torso=group(actor,'torso',[0,1.2,0]);
 const model=group(torso,'body',[0,-1.2,0]);
 if(sigma){
  surface(model,[[0,1.20],[.39,1.25],[.53,1.55],[.63,2.0],[.88,2.55],[1.01,2.83],[.79,3.05],[.42,3.18],[0,3.2]],.58,{patch:'muscle',name:'athletic-torso'});
  for(const s of [-1,1]){
   ell(model,[s*.47,2.73,.48],[.48,.30,.13],cream,'pectoral');
   ell(model,[s*.85,2.94,-.015],[.44,.36,.41],skin,'deltoid');
   const trap=ell(model,[s*.45,3.07,-.05],[.28,.37,.30],skin);trap.rotation.z=s*.7;
   for(let j=0;j<3;j++)ell(model,[s*.22,2.33-j*.28,.44],[.235,.17,.125],cream,'abdominal');
   for(let j=0;j<3;j++){const oblique=ell(model,[s*(.52-j*.04),2.33-j*.25,.28],[.17,.20,.14],skin);oblique.rotation.z=-s*.35;}
   ell(model,[s*.40,2.74,-.36],[.42,.33,.17],skin,'back');
  }
  ell(model,[0,3.16,0],[.33,.37,.32],skin,'neck');
 }else{
  surface(model,[[0,.65],[.41,.69],[.65,.86],[.81,1.18],[.86,1.56],[.76,1.96],[.57,2.25],[.35,2.45],[.20,2.51],[0,2.52]],.79,{patch:true,name:'pear-body'});
  ell(model,[0,2.47,0],[.23,.28,.23],skin,'neck');
 }
 const headY=sigma?3.64:3.17,head=group(model,'head',[0,headY,0]);
 const faceRig=face(head,sigma,pickup);if(!sigma)bobHair(head,pickup);
 const arms=[],hands=[],legs=[],feet=[];
 for(const s of [-1,1]){
  arms.push(limb(model,sigma?[.30,.34,.32,.22,.28,.24,.14]:[.19,.22,.21,.15,.16,.15,.095],'arm-'+s));
  hands.push(hand(model,s,pickup));
  legs.push(limb(actor,sigma?[.28,.35,.30,.18,.23,.19,.13]:[.24,.23,.21,.17,.145],'leg-'+s));
  feet.push(ell(actor,[s*.40,.10,.10],sigma?[.24,.15,.36]:[.19,.12,.26],handMat,'foot-'+s));
 }
 const leaf=group(root,'gliding-leaf',[0,4.7,0]);ell(leaf,[0,0,0],[1.75,.09,1.22],material('#92bf6c'));tube(leaf,[[0,0,0],[0,-.8,0],[.1,-1.1,0]],.034,material('#527749'));leaf.visible=false;
 const aura=mesh(root,new T.TorusGeometry(sigma?1.4:1.15,.025,8,64),material(sigma?'#bedbe8':'#b5d9a7',{emissive:sigma?'#719cbd':'#85aa68',emissiveIntensity:.3}),'form-ring');aura.rotation.x=-Math.PI/2;aura.position.y=.045;
 function animate(time,state={}){
  const display=!state.mode||['viewer','menu'].includes(state.mode),running=state.mode==='running',onCourse=!display;
  const t=onCourse?(state.time??time):time,laughing=!pickup&&Number.isFinite(state.laughTime)&&state.laughTime>=0;
  const pose=laughing?laughPose(state.laughTime,onCourse):null;
  const air=state.y>(state.ground||0)+.1,phase=t*(sigma?17:11),stride=running?Math.sin(phase):0;
  actor.position.set(pose?-1.3*pose.fall:0,pickup?Math.sin(t*2.7)*.1:pose?pose.hop+pose.fall*1.02:0,0);
  actor.rotation.set(pose?-.16*pose.fall:0,pose?pose.yaw:0,pose?-1.48*pose.fall:0);
  torso.rotation.set(pose?pose.lean*(sigma?1.35:1):running?(sigma?.24:.07):0,0,pose?pose.shake*.018:stride*.027);
  torso.position.y=1.2+(pose?pose.shake*.025:running?Math.abs(stride)*.045:Math.sin(t*1.7)*.013);
  torso.scale.set(1+(pose?pose.shake*.012:0),1,1+(pose?pose.shake*.018:0));
  head.rotation.set(pose?pose.head*(sigma?1.3:1):0,0,pose?pose.shake*.018:0);
  const blink=Math.sin(t*.8)>.995;faceRig.update(pose?.mouth||0,pose?.squint||0,blink);
  for(let i=0;i<2;i++){
   const s=i?1:-1,shoulder=sigma?.88:.35,sy=sigma?2.87:2.13;
   let wx=s*(sigma?.50:.89),wy=sigma?2.52:1.11,wz=sigma?.70:.03,ex=s*(sigma?1.28:.89),ey=sigma?2.08:1.72,ez=sigma?.27:.02;
   if(sigma&&!running&&!pose){wx=-s*.48;wz=i?.74:.87;wy=i?2.48:2.36;}
   if(running){wx=s*(sigma?1.14:.79);wy=(sigma?2.04:1.53)+s*stride*.18;wz=.20+s*stride*.47;ez=s*stride*.28;}
   if(air){wx=s*(sigma?1.15:.92);wy=sigma?2.55:2.32;wz=.35;ey=sy-.12;ez=.10;}
   if(state.gliding){wx=s*.42;wy=3.75;wz=.02;ey=3.05;ez=.10;}
   let headLift=0;
   if(pose){const chest=Math.min(1,pose.arms);headLift=Math.max(0,pose.arms-1);wx=s*T.MathUtils.lerp(pose.separation*(sigma?.64:.55),sigma?.46:.68,headLift);wy=T.MathUtils.lerp((sigma?2.02:1.67)+chest*.40,headY+.43,headLift);wz=T.MathUtils.lerp(sigma?.69:.72,.14,headLift);ex=s*T.MathUtils.lerp(sigma?1.30:1.00,sigma?1.22:1.0,headLift);ey=T.MathUtils.lerp(sigma?2.16:1.85,headY+.05,headLift);ez=.30;wy+=pose.shake*.018;}
   arms[i].update([[s*shoulder,sy,0],[s*(shoulder+.15),sy-.27,.03],[ex,ey,ez],[wx,wy,wz]]);
   hands[i].position.set(wx,wy,wz);hands[i].rotation.set(pose?-headLift*.6:running?s*stride*.25:0,pose?-s*.22:0,pose?s*(headLift*.4):s*.06);
   const step=Math.sin(phase+i*Math.PI),lift=running&&!pose?Math.max(0,step)*.30:0,kick=running&&!pose?Math.cos(phase+i*Math.PI)*.41:0;
   let fy=.11+lift,fz=.06+kick;if(air){fy+=.32+(i?.08:0);fz=i?-.24:.3;}if(pose){fy=.11+pose.fall*(.25+Math.max(0,Math.sin(t*12+i))*.25);fz=pose.fall*Math.sin(t*10+i)*.32;}
   const hip=sigma?1.63:.94,knee=sigma?.79:.43;
   legs[i].update([[s*(sigma?.29:.29),hip,0],[s*.43,hip*.84,.015+kick*.18],[s*.43,knee,.03+kick*.5],[s*.43,fy+.07,fz]]);
   feet[i].position.set(s*.43,fy,fz+.06);feet[i].rotation.set(running?-Math.max(0,step)*.21:pose?pose.fall*.25:0,s*.08,0);
  }
  if(state.slide>0&&!pose){actor.rotation.x=-1.28;actor.position.y=.65;torso.rotation.x=0;}
  leaf.visible=!pickup&&!!state.gliding&&!pose;leaf.rotation.z=Math.sin(t*2)*.035;aura.rotation.z=t*2;
  root.userData.pose={laughing,mouth:pose?.mouth||0,squint:pose?.squint||0,arms:pose?.arms||0,fall:pose?.fall||0};
 }
 root.userData.animate=animate;if(pickup)root.scale.setScalar(.40);animate(0);return root;
}
