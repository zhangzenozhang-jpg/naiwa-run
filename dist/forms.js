import {createCharacter} from './form-characters.js';
import * as T from './vendor/three.module.min.js';
const S=new T.SphereGeometry(1,24,18), mats=new Map();S.userData.shared=true;
function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:.62,...extra}));mats.get(key).userData.shared=true;return mats.get(key)}
function ell(g,x,y,z,a,b,c,color){const m=new T.Mesh(S,mat(color));m.position.set(x,y,z);m.scale.set(a,b,c);m.castShadow=m.receiveShadow=true;g.add(m);return m}
function curve(g,points,r,color){const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,10,false),mat(color));g.add(o);o.castShadow=true;return o}
function horn(g,side){const pts=[[side*.55,3.2,.8],[side*.95,3.3,.7],[side*1.3,3.55,.65],[side*1.38,3.95,.67]];for(let i=0;i<3;i++)curve(g,pts.slice(i,i+2),.15-i*.045,['#8a7960','#b4a38c','#ddccb0'][i]);ell(g,side*1.38,3.96,.67,.045,.065,.045,'#e0d2bc')}
function eye(g,x,y,z,scale=1,green=false){ell(g,x,y,z,.23*scale,.27*scale,.12*scale,green?'#9bb955':'#fffae9');ell(g,x,y-.01,z+.1*scale,.13*scale,.18*scale,.055*scale,green?'#233a18':'#604029');ell(g,x,y-.005,z+.15*scale,.075*scale,.13*scale,.026*scale,'#181913');ell(g,x-.035*scale,y+.08*scale,z+.18*scale,.034*scale,.039*scale,.014,'#fffde8')}
function limb(g,x,y,z,side,color){const p=new T.Group();p.position.set(x,y,z);g.add(p);ell(p,0,-.3,0,.18,.48,.19,color);ell(p,0,-.73,.09,.19,.20,.22,'#454238');return p;}
export function createForm(type,{pickup=false}={}){
 if(type==='naigema')return createCharacter(type,{pickup});
 if(type!=='niulai')throw new RangeError('Unknown form: '+type);
 const root=new T.Group(),body=new T.Group();root.add(body);const limbs=[];const yellow='#e8ba2c',cream='#eee0ae';
 if(type==='niulai'){
  ell(body,0,1.6,-.3,.95,.87,1.65,'#dbaa35');ell(body,0,1.48,.4,.82,.8,1.1,'#ebbc4d');ell(body,0,2.65,1.05,.82,.92,.65,'#dfac32');ell(body,0,2.35,1.64,.63,.40,.29,'#ae8771');
  for(const s of [-1,1]){ell(body,s*.29,2.46,1.90,.075,.058,.028,'#513e33');eye(body,s*.32,2.98,1.57,.9);ell(body,s*.32,3.13,1.60,.25,.15,.12,'#d4a131');curve(body,[[s*.10,3.20,1.66],[s*.32,3.23,1.68],[s*.57,3.18,1.58]],.055,'#493925');ell(body,s*.92,2.96,1.04,.37,.17,.20,'#d1a444').rotation.z=s*.25;ell(body,s*.95,2.98,1.2,.22,.09,.035,'#b4866d');horn(body,s);
   for(const z of [-1.22,.68]){const leg=new T.Group();leg.position.set(s*.62,1.25,z);body.add(leg);ell(leg,0,-.38,0,.24,.57,.24,'#c69b3c');ell(leg,0,-.95,.08,.25,.19,.32,'#554a3a');limbs.push(leg);}
  }
  // A warm coat made from small tufts, with a swept fringe and cheek fur.
  for(let i=0;i<24;i++){const a=i*2.399;ell(body,Math.sin(a)*.7,2.7+(i%4)*.21,1.06+Math.cos(a)*.53,.13,.19,.11,i%2?'#d2a12c':'#edc454');}
  curve(body,[[0,1.9,-1.7],[.3,1.7,-2.0],[.5,1.0,-2.1]],.055,'#b99332');ell(body,.5,.95,-2.1,.14,.24,.14,'#8d6b2d');ell(body,0,2.26,-.42,.69,.12,.8,'#745b41');
 }
 const aura=new T.Mesh(new T.TorusGeometry(type==='niulai'?1.6:1.25,.035,8,64),mat('#ffe8a1',{emissive:type==='naigema'?'#4793d3':'#b9a450',emissiveIntensity:.4}));aura.rotation.x=-Math.PI/2;aura.position.y=.06;root.add(aura);
 root.userData.animate=(time,state={})=>{const airborne=state.y>(state.ground||0)+.1;body.position.y=pickup?Math.sin(time*2.7)*.1:state.mode==='running'?Math.abs(Math.sin(time*8))*.06:0;body.rotation.x=type==='naigema'&&!pickup?-.25:0;for(let i=0;i<limbs.length;i++)limbs[i].rotation.x=airborne?-.5:state.mode==='running'?Math.sin(time*11+(i%2)*Math.PI)*.5:0;aura.rotation.z=time*2;};
 if(pickup)root.scale.setScalar(.43);return root;
}
