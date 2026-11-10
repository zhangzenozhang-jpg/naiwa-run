import {laughEnvelope} from './laugh-envelope.js';
export const LAUGH_DURATION = 14.113469;
export const smooth = (a,b,t) => {const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
const keys = [
 // time, body lean, head pitch, arms (belly=0, chest=1, head=2), hand separation, mouth
 [0,0,0,0,.60,0], [.32,0,0,0,.60,0], [.65,-.10,-.22,0,.60,1],
 [1.9,-.06,-.17,0,.60,.95], [2.35,-.13,-.23,1,.48,1],
 [3.2,.22,.11,0,.75,.82], [4.1,.03,-.04,0,.63,.9],
 [4.95,-.13,-.16,0,.64,1], [5.5,.03,-.03,0,.64,.9],
 [6.05,.08,.02,2,.33,.94], [6.65,.04,-.05,2,.33,1],
 [7.15,.04,.02,0,.25,.92], [8.6,.32,.09,0,.24,.87],
 [9.35,.20,.05,0,.25,.87], [10.0,-.20,-.22,0,.25,1],
 [10.75,-.08,-.11,0,.25,.84], [11.15,0,0,0,.28,.12],
 [11.55,.08,.02,0,.28,.65], [11.85,-.15,-.18,0,.56,1],
 [12.2,-.13,-.12,1,.7,1], [12.8,0,0,0,.5,.8], [14.12,0,0,0,.5,.8]
];
export function laughPose(seconds,run=false){
 const t=Math.max(0,Math.min(LAUGH_DURATION,seconds));
 let i=1;while(i<keys.length-1&&keys[i][0]<t)i++;
 const a=keys[i-1],b=keys[i],f=smooth(a[0],b[0],t);
 const v=a.map((x,j)=>x+(b[j]-x)*f);
 const envelope=laughEnvelope[Math.min(laughEnvelope.length-1,Math.floor(t*30))]||0;
 const active=smooth(.35,.65,t)*(1-smooth(10.7,11.15,t)+smooth(11.2,11.65,t));
 const pulse=Math.sin(t*24)*(.35+envelope*.65)*active;
 const fall=run?0:smooth(11.85,12.8,t);
 return {lean:v[1]+pulse*.026,head:v[2]+pulse*.015,arms:v[3],separation:v[4],
  mouth:Math.max(0,v[5]*(.83+envelope*.17)+pulse*.035),squint:active*(1-smooth(12.45,12.9,t)),
  shake:pulse,fall,hop:Math.sin(smooth(.30,.62,t)*Math.PI)*.12,
  yaw:(1-smooth(.3,.7,t))*.30,stage:t<.4?'准备':t<2.15?'仰头大笑':t<5.7?'捧腹颤动':t<7?'笑到抱头':t<9.6?'弯腰捧腹':t<11.8?'笑得停不下来':'笑倒了'};
}
