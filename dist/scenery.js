import * as T from './vendor/three.module.min.js';
import {MAPS,ZONE_LENGTH,zoneAt} from './course.js';
import {batch,shop,park} from './town.js';

const BOX=new T.BoxGeometry(1,1,1),BALL=new T.SphereGeometry(1,14,10),CYL=new T.CylinderGeometry(1,1,1,10),CONE=new T.ConeGeometry(1,1,12),ROCK=new T.IcosahedronGeometry(1,1);
let flowingWater=null;
const materials=new Map(),textures=new Map(),UP=new T.Vector3(0,1,0);
function material(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c)}
function mesh(g,geo,c,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,typeof c==='string'?material(c):c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;g.add(m);return m}
const box=(g,x,y,z,w,h,d,c)=>mesh(g,BOX,c,x,y,z,w,h,d);
const ball=(g,x,y,z,w,h,d,c)=>mesh(g,BALL,c,x,y,z,w,h,d);
const cyl=(g,x,y,z,r,h,c)=>mesh(g,CYL,c,x,y,z,r,h,r);
const cone=(g,x,y,z,r,h,c)=>mesh(g,CONE,c,x,y,z,r,h,r);
const rock=(g,x,y,z,w,h,d,c)=>mesh(g,ROCK,c,x,y,z,w,h,d);
const mod=(n,d)=>(n%d+d)%d;
const LEAF=new T.BufferGeometry();LEAF.setAttribute('position',new T.Float32BufferAttribute([-.85,0,0,0,.07,.16,.85,0,0,0,.07,-.16],3));LEAF.setIndex([0,1,2,2,3,0]);LEAF.computeVertexNormals();
function bambooLeaf(g,x,y,z,angle,tilt,s,c){const m=material(c);m.side=T.DoubleSide;const leaf=mesh(g,LEAF,m,x,y,z,s,s,s);leaf.rotation.y=angle;leaf.rotation.z=tilt;return leaf}
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function rod(g,a,b,r,c){const A=new T.Vector3(...a),D=new T.Vector3(...b).sub(A),m=cyl(g,0,0,0,r,D.length(),c);m.position.copy(A.addScaledVector(D,.5));m.quaternion.setFromUnitVectors(UP,D.normalize());return m}
function sign(g,title,x,y,z,w=4,h=.8,c='#496f53'){
 const key='sign'+title+c;let mat=materials.get(key);if(!mat){const a=document.createElement('canvas');a.width=512;a.height=128;const ctx=a.getContext('2d');ctx.fillStyle=c;ctx.fillRect(0,0,512,128);ctx.strokeStyle='#f8ecc1';ctx.lineWidth=3;ctx.strokeRect(9,9,494,110);ctx.fillStyle='#fff2d2';ctx.font='bold 51px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(title,256,66);const tex=new T.CanvasTexture(a);tex.colorSpace=T.SRGBColorSpace;mat=new T.MeshStandardMaterial({map:tex,roughness:.8});materials.set(key,mat)}return mesh(g,new T.PlaneGeometry(w,h),mat,x,y,z,1,1,1);
}
function surface(kind){
 if(textures.has(kind))return textures.get(kind);const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),rand=seeded(3857),colors={stone:'#999e8d',earth:'#b89f68',wood:'#a4794b',paving:'#96a38d',sand:'#cba16c',snow:'#e2e7df',water:'#65adb3'};
 ctx.fillStyle=colors[kind];ctx.fillRect(0,0,512,512);
 for(let i=0;i<5500;i++){const v=rand();ctx.fillStyle=v>.5?'#fff5d91b':'#263c2b12';ctx.fillRect(rand()*512,rand()*512,1+rand()*3,1+rand()*4)}
 if(kind==='water'){for(let i=0;i<38;i++){const y=rand()*512,x=rand()*512;ctx.strokeStyle=i%3?'#ddf3e344':'#d5e9ca24';ctx.lineWidth=1+rand()*3;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+18,y-3,x+38,y+4,x+55,y);ctx.stroke()}}else if(kind==='wood'){
  for(let i=0;i<8;i++){const y=i*64;ctx.fillStyle=i%2?'#e9c78a1c':'#47302013';ctx.fillRect(0,y,512,63);ctx.fillStyle='#463c31';ctx.fillRect(0,y,512,3);ctx.fillStyle='#e3c18b';ctx.fillRect(0,y+4,512,2);for(let j=0;j<6;j++){ctx.strokeStyle='#614a3338';ctx.lineWidth=1+rand();ctx.beginPath();const yy=y+rand()*57+5;ctx.moveTo(0,yy);ctx.bezierCurveTo(140,yy+rand()*12,330,yy-rand()*12,512,yy+3);ctx.stroke()}for(const x of [18,493]){ctx.fillStyle='#594f40';ctx.beginPath();ctx.arc(x,y+16,3,0,7);ctx.fill();ctx.beginPath();ctx.arc(x,y+48,3,0,7);ctx.fill()}}
 }else if(kind==='stone'||kind==='paving'){
  for(let row=0;row<8;row++)for(let col=-1;col<6;col++){const x=col*103+(row%2)*51,y=row*64;ctx.fillStyle=(row+col)%3?'#e7e6c31c':'#51695519';ctx.fillRect(x+3,y+3,98,59);ctx.strokeStyle='#425c4a40';ctx.lineWidth=2;ctx.strokeRect(x,y,103,64);ctx.strokeStyle='#eff0cf48';ctx.beginPath();ctx.moveTo(x+4,y+59);ctx.lineTo(x+4,y+4);ctx.lineTo(x+98,y+4);ctx.stroke()}
 }else{
  for(let i=0;i<130;i++){const x=rand()*512,y=rand()*512;ctx.fillStyle=kind==='snow'?'#90b2ba30':kind==='sand'?'#9c73452b':'#61593832';ctx.beginPath();ctx.ellipse(x,y,1+rand()*4,1+rand()*2,rand()*3,0,7);ctx.fill()}
  ctx.strokeStyle=kind==='snow'?'#a6c3c124':'#e5ca8a32';ctx.lineWidth=12;for(const x of [90,256,422]){ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+15,180,x-15,330,x+3,512);ctx.stroke()}
 }
 const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.repeat.set(kind==='wood'?1:2,kind==='wood'?3:4);
 const mat=new T.MeshStandardMaterial({map:tex,bumpMap:tex,bumpScale:kind==='wood'?.045:.025,roughness:kind==='water'?.30:.94,metalness:kind==='water'?.12:0});if(kind==='water')flowingWater=tex;textures.set(kind,mat);return mat;
}
function bush(g,x,y,z,s=1,c='#527a3b'){ball(g,x,y,z,s,s*.64,s*.85,c);ball(g,x+s*.48,y+.12,z+.2,s*.65,s*.6,s*.65,'#779d4c')}
function tree(g,x,z,s=1,variant=0){
 const q=new T.Group();q.position.set(x,0,z);q.scale.setScalar(s);g.add(q);cyl(q,0,2.6,0,.30,5.2,'#806241');for(let k=0;k<4;k++){const a=k*1.57;rod(q,[0,.3,0],[Math.sin(a)*.8,.02,Math.cos(a)*.8],.17,'#806241')}
 for(let i=0;i<3;i++)rod(q,[0,3.3,0],[Math.sin(i*2.1)*1.25,4.9,Math.cos(i*2.1)],.12,'#806241');
 for(let i=0;i<6;i++){const a=i*2.4+variant;ball(q,Math.sin(a)*1.25,5.1+i%3*.65,Math.cos(a)*1.1,1.75,1.35,1.65,['#4f843c','#74a44a','#96b755'][i%3])}
 for(let i=0;i<3;i++){const b=box(q,.305,1.1+i*1.0,.05,.012,.18,.19,'#b99b64');b.rotation.z=.2}return q;
}
function pine(g,x,z,s=1,snow=false){const q=new T.Group();q.position.set(x,0,z);q.scale.setScalar(s);g.add(q);cyl(q,0,2.1,0,.25,4.2,'#79684f');for(let i=0;i<4;i++){const y=2.7+i*1.22,r=2.35-i*.45;cone(q,0,y,0,r,3.3-i*.25,i%2?'#436e59':'#527f61');if(snow)cone(q,0,y+.36,0,r*.88,2.5-i*.20,'#dfebe5')}return q}
function fern(g,x,z,s=1){for(let i=0;i<5;i++){const a=i*2.4;const m=ball(g,x+Math.sin(a)*s*.25,.28*s,z+Math.cos(a)*s*.25,s*.12,s*.55,s*.08,i%2?'#87ac54':'#587f3e');m.rotation.z=Math.sin(a)*.65;m.rotation.x=Math.cos(a)*.65}}
function mushroom(g,x,z,s=1){cyl(g,x,.3*s,z,.10*s,.6*s,'#efe2ba');ball(g,x,.62*s,z,.43*s,.23*s,.43*s,'#c97549');for(let i=0;i<4;i++){const a=i*2.4;ball(g,x+Math.sin(a)*.23*s,.78*s,z+Math.cos(a)*.23*s,.065*s,.018*s,.065*s,'#fff0ca')}}
function flowers(g,x,z,seed=1){const r=seeded(seed);for(let i=0;i<7;i++){const xx=x+(r()-.5)*2,zz=z+(r()-.5)*2;rod(g,[xx,0,zz],[xx,.38,zz],.018,'#5f8544');for(let k=0;k<4;k++){const a=k*1.57;ball(g,xx+Math.sin(a)*.10,.42,zz+Math.cos(a)*.1,.11,.04,.09,i%3?'#f3d081':'#d6a0b5')}ball(g,xx,.45,zz,.05,.03,.05,'#e8ad58')}}
function fence(g,side,type='wood'){
 const x=side*6.35,col=type==='snow'?'#867f66':type==='bamboo'?'#a1a46a':'#95734c';
 for(let z=-12;z<12;z+=4){cyl(g,x,.68,z,.12,1.4,col);if(type==='snow')ball(g,x,1.42,z,.17,.08,.17,'#eef4e9');if(type==='rope'){for(const y of [.75,1.45]){rod(g,[x,y,z],[x,y-.18,z+2],.045,'#a49467');rod(g,[x,y-.18,z+2],[x,y,z+4],.045,'#a49467')}}else for(const y of [.55,1.05])rod(g,[x,y,z],[x,y,z+4],.065,col)}
}
function lamp(g,x,z){cyl(g,x,2.3,z,.07,4.6,'#465c4b');box(g,x,4.48,z,.38,.55,.38,'#f0d989');for(const a of [-1,1])for(const b of [-1,1])box(g,x+a*.21,4.49,z+b*.21,.045,.7,.045,'#465c4b');cone(g,x,4.93,z,.44,.3,'#465c4b');cyl(g,x,.25,z,.17,.5,'#465c4b')}
function cabin(g,x,z,snow=false){
 const q=new T.Group();q.position.set(x,0,z);q.rotation.y=x>0?-Math.PI/2:Math.PI/2;g.add(q);
 box(q,0,.25,0,5.9,.5,5,'#7d8772');for(let i=0;i<11;i++){const y=.65+i*.32;box(q,0,y,0,5.6,.29,4.8,i%2?'#ae8961':'#97734f');for(const xx of [-2.85,2.85])cyl(q,xx,y,2.4,.17,.18,'#d2b282').rotation.x=Math.PI/2}
 for(const side of [-1,1]){const r=box(q,side*1.6,4.8,0,3.8,.18,5.7,'#5b7765');r.rotation.z=-side*.52;if(snow){const cap=box(q,side*1.6,4.98,0,3.85,.26,5.8,'#e8efe5');cap.rotation.z=-side*.52;for(let k=0;k<7;k++)cone(q,side*3.0,3.75,-2.5+k*.8,.065,.6,'#cce2de').rotation.z=Math.PI}}
 box(q,0,1.4,2.44,1.25,2.3,.12,'#53695a');ball(q,.42,1.3,2.54,.06,.06,.04,'#e6bf6a');for(const xx of [-1.7,1.7]){box(q,xx,2.1,2.44,1.12,1.32,.1,'#ead796');box(q,xx,2.1,2.52,.07,1.45,.07,'#5c6b55');box(q,xx,2.1,2.52,1.25,.07,.07,'#5c6b55');box(q,xx,1.37,2.5,1.35,.15,.3,'#706c4d')}
 box(q,1.45,5.3,-1,.6,1.8,.65,'#9c8e7a');box(q,1.45,6.23,-1,.76,.16,.8,'#dfe8db');box(q,0,.12,2.9,2.1,.24,1,'#b4b59c');sign(q,snow?'山间热可可':'森林驿站',0,3.55,2.54,3.8,.65);
}
function stoneLamp(g,x,z){box(g,x,.1,z,.85,.2,.85,'#8b9b87');cyl(g,x,.67,z,.2,1.2,'#9ca78e');box(g,x,1.5,z,.62,.55,.62,'#bfccb0');box(g,x,1.5,z+.32,.3,.3,.01,'#f5de99');cone(g,x,1.95,z,.7,.45,'#798c76');ball(g,x,2.22,z,.12,.15,.12,'#a7b695')}
function bamboo(g,x,z,s=1){const q=new T.Group();q.position.set(x,0,z);q.scale.setScalar(s);g.add(q);for(let i=0;i<4;i++){const xx=(i%2)*.65,zz=Math.floor(i/2)*.55,h=6.5+i*.7;const stem=cyl(q,xx,h/2,zz,.13,h,i%2?'#628748':'#83a15b');stem.rotation.z=(i-1.5)*.018;for(let j=1;j<h;j++){cyl(q,xx,j,zz,.145,.07,'#bdc87b');if(j>3&&j%2){const side=j%4===1?1:-1;rod(q,[xx,j,zz],[xx+side*1.1,j+.5,zz],.035,'#8ba658');for(let k=0;k<8;k++){const a=k*.8+i;const bx=xx+side*(.6+(k%3)*.32),by=j+.4+(k%2)*.16;bambooLeaf(q,bx,by,zz+Math.sin(a)*.6,a,side*.25,.65+(k%3)*.12,k%2?'#58894b':'#8eae60')}}}}
}
function lantern(g,x,y,z){rod(g,[x,y+1,z],[x,y+.2,z],.022,'#887e4f');ball(g,x,y,z,.28,.40,.28,'#da9d62');cyl(g,x,y+.35,z,.18,.08,'#765f43');cyl(g,x,y-.35,z,.18,.08,'#765f43');rod(g,[x,y-.4,z],[x,y-.8,z],.018,'#d9bb73')}
function lotus(g,x,z){const leaf=cyl(g,x,-.55,z,.65,.035,'#71984e');leaf.scale.z=.7;for(let i=0;i<6;i++){const a=i*1.04;const m=ball(g,x+Math.sin(a)*.13,-.4,z+Math.cos(a)*.13,.10,.18,.08,'#edc6c0');m.rotation.z=Math.sin(a)*.4}}
function water(g,x,z,w=10,d=24){const m=box(g,x,-.74,z,w,.12,d,surface('water'));m.castShadow=false;for(let i=0;i<7;i++){const xx=x+Math.sin(i*8.7)*w*.35,zz=z-10+i*3.1;const line=box(g,xx,-.668,zz,1+(i%3)*.4,.012,.045,'#bbe2d6');line.castShadow=false}}
function waterfall(g,side){const x=side*20;for(let i=0;i<5;i++)rock(g,x+side*(i%2)*3,4+i*1.3,-7+i*2,3.7,5.5,3.6,i%2?'#7c9990':'#8ea89b');box(g,x,5.2,1,3.5,11,.22,'#93d2d4');for(let i=0;i<8;i++)box(g,x-1.55+i*.43,5.2+(i%3)*.3,1.13,.08,9.7,.015,i%2?'#deeee0':'#c0e5dd');for(let i=0;i<6;i++)ball(g,x+(i-2.5)*.65,-.24,1.3,.7,.32,.7,'#d8ebe0')}
function cactus(g,x,z,s=1){cyl(g,x,1.25*s,z,.24*s,2.5*s,'#72855c');ball(g,x,2.5*s,z,.24*s,.26*s,.24*s,'#72855c');for(const side of [-1,1]){rod(g,[x,.9*s,z],[x+side*.65*s,1.2*s,z],.14*s,'#72855c');cyl(g,x+side*.65*s,1.5*s,z,.14*s,.7*s,'#72855c');ball(g,x+side*.65*s,1.85*s,z,.14*s,.16*s,.14*s,'#72855c')}}
function cart(g,x,z){box(g,x,.9,z,1.7,1.1,2.3,'#786853');for(const side of [-1,1]){box(g,x+side*.87,.9,z,.08,1.2,2.4,'#a08c68');for(const zz of [-.8,.8])cyl(g,x+side*.93,.35,z+zz,.3,.12,'#4d5d51').rotation.z=Math.PI/2}for(let i=0;i<6;i++)rock(g,x+Math.sin(i*2)*.55,1.5,z+Math.cos(i*2)*.7,.4,.35,.4,i%2?'#dbaf65':'#a38253')}
function portal(zone){const g=new T.Group(),color=zone.id==='canyon'?'#937453':'#6c865b';for(const side of [-1,1]){cyl(g,side*6.8,4,0,.26,8,color);box(g,side*6.8,.22,0,.9,.44,.9,'#a2a78b')}rod(g,[-7.2,8.0,0],[7.2,8.0,0],.23,color);sign(g,zone.name,0,7.55,.28,5.8,.95,zone.id==='canyon'?'#aa774e':'#567650');for(const side of [-1,1]){rod(g,[side*6.8,6.1,0],[side*4.8,8,0],.12,color);if(zone.id==='bamboo')lantern(g,side*4.8,6.7,0)}return batch(g)}

function makeChunk(zone,variant){
 const g=new T.Group(),r=seeded(175+variant*129+MAPS.indexOf(zone)*902),snow=zone.id==='snow';
 if(zone.id==='bamboo'){box(g,0,-.36,0,14.2,.5,24,zone.ground);for(const side of [-1,1])box(g,side*40.8,-.36,0,58.4,.5,24,zone.ground)}else box(g,0,zone.id==='river'?-1.1:-.36,0,140,.5,24,zone.ground);
 const road=box(g,0,-.12,0,11.3,.28,24,surface(zone.surface));road.castShadow=false;
 for(const side of [-1,1]){
  const x=side*6;
  if(['forest','bamboo','canyon'].includes(zone.id))for(let i=0;i<18;i++){const zz=-11.5+i*1.3,xx=side*(6.7+r()*.7);for(let k=0;k<3;k++){const blade=cone(g,xx+(k-1)*.10,.16+r()*.08,zz,.045,.38+r()*.12,zone.id==='canyon'?'#a99e62':i%2?'#8da95b':'#688b42');blade.rotation.z=(k-1)*.28}if(i%4===0)rock(g,side*6.1,.08,zz,.20,.13,.24,zone.id==='canyon'?'#d6b782':'#a6b293')}
  if(zone.id==='town'){
   box(g,side*6.95,.02,0,2.6,.25,24,surface('paving'));for(let i=0;i<16;i++)box(g,side*5.7,.16,-11.3+i*1.5,.24,.3,1.42,i%2?'#e5d6b0':'#b8b794');
   if(variant===2&&side===1)park(g,side,variant);else shop(g,variant*2+(side===1?1:0),side);
   lamp(g,side*6.5,8);tree(g,side*8.3,-8,.85,variant);flowers(g,side*7.8,8,variant+4);
   box(g,side*7.8,.25,-8,2.6,.5,2.6,'#b6b68f');bush(g,side*7.8,.8,-8,.9);if(variant===1)sign(g,'慢慢跑  ·  看风景',side*7.4,1.5,7,2,.65);
  }else if(zone.id==='forest'){
   fence(g,side);for(let i=0;i<4;i++){const zz=-10+i*6;if(!(variant===1&&side===-1&&(i===1||i===2)))tree(g,side*(9+r()*3),zz,.95+r()*.35,variant+i);pine(g,side*(16+r()*5),zz+2,1+r()*.45)}
   for(let i=0;i<8;i++){const zz=-11+i*3;fern(g,side*(7+r()*1.2),zz,.7+r()*.3);if(i%2===0)mushroom(g,side*7.7,zz,1+r()*.7)}
  }else if(zone.id==='river'){
   water(g,side*19,0,26);fence(g,side,'rope');for(let z=-10;z<=10;z+=4){box(g,side*5.9,-.35,z,.4,.6,.4,'#886b4c');rod(g,[side*6,-3,z],[side*6,0,z],.22,'#7d6c50')}
   for(let i=0;i<4;i++){const zz=-9+i*6;rock(g,side*(26+r()*4),1.0,zz,3.6,2.7,3.2,'#8aaca0');tree(g,side*31,zz,1.25,i);lotus(g,side*(9+i%2*3),zz)}
   if(variant===1&&side===1)waterfall(g,side);if(variant===2&&side===-1){const boat=new T.Group();g.add(boat);boat.position.set(-13,-.45,-2);ball(boat,0,0,0,1,.28,2.5,'#a78252');box(boat,0,.12,0,1.4,.12,3.3,'#cfb07a');rod(boat,[0,0,0],[0,4.7,0],.045,'#846d48');mesh(boat,new T.PlaneGeometry(1.5,2.5),material('#f4dfad'),.75,2.9,0,1,1,1)}
  }else if(zone.id==='bamboo'){
   fence(g,side,'bamboo');water(g,side*9.3,0,4.2);for(let i=0;i<5;i++)bamboo(g,side*(12.2+r()*3),-10+i*5,.85+r()*.4);
   for(const zz of [-7,7]){stoneLamp(g,side*7.2,zz);rock(g,side*10.9,.2,zz+1,1,.65,.8,'#81967b');lotus(g,side*9.2,zz)}
   for(let i=0;i<4;i++)fern(g,side*6.9,-10+i*6,1);
   if(variant===1){rod(g,[side*6.8,5,-8],[side*6.8,5,8],.04,'#b0ac7e');for(let k=0;k<4;k++)lantern(g,side*6.8,4.2,-7+k*5)}
  }else if(zone.id==='canyon'){
   for(let i=0;i<3;i++){const xx=side*(15+r()*4),zz=-8+i*8,h=9+r()*6;rock(g,xx,h*.46,zz,4.3,h*.64,4.8,i%2?'#be875b':'#a87552');for(let j=1;j<5;j++)box(g,xx-side*2.3,h*j/5,zz,3,.22,7,'#d6ac75')}
   for(let i=0;i<5;i++){rock(g,side*(7+r()*3),.22,-10+i*5,.55,.4,.6,'#bf9d6c');if(i%2)cactus(g,side*(8.7+r()*2),-10+i*5,.8+r()*.3)}
   for(const dx of [-.55,.55])box(g,side*9.0+dx,.04,0,.08,.08,24,'#7c8071');for(let z=-11;z<12;z+=1.5)box(g,side*9,.0,z,1.5,.06,.2,'#a18053');
   if(variant===1)cart(g,side*9,-2);if(variant===2&&side===1){for(const xx of [12,18])rod(g,[xx,0,-2],[xx,6,-2],.3,'#8c6b45');rod(g,[11.5,6,-2],[18.5,6,-2],.28,'#8c6b45');box(g,15,2.7,-3,5.2,5.4,.4,'#534d3c');sign(g,'旧矿洞',15,5.6,-1.65,3,.7,'#876747')}
  }else if(snow){
   fence(g,side,'snow');for(let i=0;i<4;i++){const zz=-10+i*6;if(!(variant===1&&side===1&&(i===1||i===2)))pine(g,side*(9.5+r()*2),zz,1+r()*.4,true);ball(g,side*7.6,.12,zz,1.5,.45,1.2,'#e9f0e8');rock(g,side*8,.05,zz+1,1,.4,.9,'#bbcdd0')}
   if(variant===1&&side===1)cabin(g,12.5,0,true);if(variant===2&&side===-1){ball(g,-8.5,.6,0,.65,.65,.65,'#f3f3e7');ball(g,-8.5,1.45,0,.43,.45,.43,'#f3f3e7');cyl(g,-8.5,1.9,0,.47,.08,'#546b61');cyl(g,-8.5,2.1,0,.3,.4,'#546b61');cone(g,-8.5,1.42,.47,.08,.4,'#d98f53').rotation.x=Math.PI/2;for(const xx of [-.15,.15])ball(g,-8.5+xx,1.55,.4,.04,.04,.03,'#4b665a');rod(g,[-9,1,0],[-9.8,1.4,0],.04,'#826e52');rod(g,[-8,1,0],[-7.3,1.5,0],.04,'#826e52')}
   lamp(g,side*6.9,9);
  }
 }
 if(zone.id==='forest'&&variant===1){cabin(g,-12.5,0);for(let i=0;i<5;i++){const log=cyl(g,-8.7+(i%2)*.4,.22+Math.floor(i/2)*.3,-6,.17,2.4,'#9d7d50');log.rotation.x=Math.PI/2;const end=cyl(g,log.position.x,log.position.y,-4.79,.14,.02,'#d5b77f');end.rotation.x=Math.PI/2}}
 // Lane guides stay quiet so coins and obstacles remain the brightest objects.
 if(zone.id!=='river')for(const x of [-1.7,1.7])for(let z=-9;z<12;z+=6)box(g,x,.028,z,.055,.012,2.3,zone.id==='snow'?'#adc3bf':'#e6ddba');
 if(zone.id==='town'&&variant===0)for(let i=-3;i<=3;i++)box(g,i*1.45,.034,9,1,.012,2,'#ece4c6');
 return batch(g);
}

function horizon(zone){const g=new T.Group(),r=seeded(189+MAPS.indexOf(zone)*8);for(let i=0;i<12;i++){const x=(i-5.5)*21,z=-128-r()*40;if(zone.id==='canyon'){rock(g,x,8+r()*8,z,19,20+r()*12,14,i%2?'#d6ac83':'#c99a71')}else if(zone.id==='snow'){cone(g,x,12,z,22,39+i%3*6,i%2?'#a6c7ce':'#b8d4d6');cone(g,x,25,z,10,18,'#e4ece8')}else{ball(g,x,3,z,24,11+r()*12,17,i%2?'#9db999':'#b0c9a3')}}
 if(zone.id==='town'){const q=new T.Group();q.position.set(19,0,-102);g.add(q);box(q,0,9,0,5,18,5,'#ddcca5');cone(q,0,20,0,4.3,5,'#6e9380');const clock=cyl(q,0,15,2.56,1.6,.1,'#f3e7b9');clock.rotation.x=Math.PI/2;box(q,0,15.5,2.63,.1,1,.03,'#5f7154');box(q,.35,15,2.63,.8,.1,.03,'#5f7154')}
 return batch(g);
}

export function createCourse(parent){
 const root=new T.Group();root.name='SixMapCourse';parent.add(root);const length=24,count=10,templates=new Map(),portals=new Map(),horizons=new Map();
 // A template is shared by all copies. Only the current and upcoming zones are built.
 function getTemplate(zone,variant){const key=zone.id+variant;if(!templates.has(key))templates.set(key,makeChunk(zone,variant));return templates.get(key)}
 function getPortal(zone){if(!portals.has(zone.id))portals.set(zone.id,portal(zone));return portals.get(zone.id)}
 const pools=new Map(),transform=new T.Matrix4();
 function getPool(key,source){if(!pools.has(key)){const meshes=source.children.map(o=>{const m=new T.InstancedMesh(o.geometry,o.material,count);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.castShadow=m.receiveShadow=true;m.boundingSphere=new T.Sphere(new T.Vector3(0,6,-90),175);root.add(m);return m});pools.set(key,{meshes,used:0})}return pools.get(key)}
 function place(key,source,z){const pool=getPool(key,source);transform.makeTranslation(0,0,z);for(const m of pool.meshes)m.setMatrixAt(pool.used,transform);pool.used++}
 let horizonRoot=null,lastZone='';
 const motesCount=100,positions=new Float32Array(motesCount*3),geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const moteMat=new T.PointsMaterial({color:'#f7e5ad',size:.07,transparent:true,opacity:.7,depthWrite:false});const motes=new T.Points(geo,moteMat);motes.frustumCulled=false;root.add(motes);
 return {root,update(distance,time,route,startMap=0){
  const base=Math.floor(distance/length),zone=zoneAt(distance,startMap);
  for(const pool of pools.values())pool.used=0;
  for(let k=-1;k<count-1;k++){const index=base+k,localZone=zoneAt(index*length+12,startMap),variant=mod(index,3),z=distance-(index*length+12);place(localZone.id+variant,getTemplate(localZone,variant),z);if(index>0&&mod(index,ZONE_LENGTH/length)===0)place('entry'+localZone.id,getPortal(localZone),z+11.7)}
  for(const pool of pools.values())for(const m of pool.meshes){m.count=pool.used;m.visible=pool.used>0;if(pool.used)m.instanceMatrix.needsUpdate=true}
  if(lastZone!==zone.id){if(horizonRoot)root.remove(horizonRoot);if(!horizons.has(zone.id))horizons.set(zone.id,horizon(zone));horizonRoot=horizons.get(zone.id);root.add(horizonRoot);lastZone=zone.id;moteMat.color.set(zone.id==='snow'?'#ffffff':zone.id==='bamboo'?'#d8ed9a':zone.id==='canyon'?'#f5d6a4':'#fff0b2');moteMat.size=zone.id==='snow'?.09:.055;}
  horizonRoot.position.x=Math.sin(distance*.0005)*2;
  if(flowingWater)flowingWater.offset.y=time*.018;
  const snow=zone.id==='snow';motes.visible=zone.id!=='town';for(let i=0;i<motesCount;i++){positions[i*3]=Math.sin(i*37.3)*22+Math.sin(time*.3+i)*.4;positions[i*3+1]=mod(i*.731-time*(snow?.75:.15),12)+.3;positions[i*3+2]=-mod(i*3.97-distance*.12,85)}geo.attributes.position.needsUpdate=true;
 },get templateCount(){return templates.size}};
}
