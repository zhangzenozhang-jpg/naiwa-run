export const POWERUPS={niulai:{name:'牛来',charges:1},naigema:{name:'奶格玛',duration:5}};
export const ZONES=['晴日小镇','蘑菇森林','瀑布木桥','竹影溪径','落日峡谷','松雪山村','海湾栈道','灯笼夜市'];
export const UPGRADES=[
 {id:'magnet',icon:'∪',name:'随身磁场',desc:'永久吸取身边两条跑道上的金币。'},
 {id:'dash',icon:'ϟ',name:'笑到加速',desc:'主动冲刺冷却缩短，持续时间更长。'},
 {id:'glide',icon:'♧',name:'风的朋友',desc:'滑翔燃料增加，空中停留更久。'},
 {id:'double',icon:'✦',name:'金币翻倍',desc:'之后捡到的每颗金币计为两颗。'},
 {id:'heal',icon:'♥',name:'再爱奶蛙一次',desc:'回复一颗心，最多三颗心。'},
 {id:'fever',icon:'☺',name:'笑点很低',desc:'收集和完美闪避获得更多大笑能量。'},
 {id:'stars',icon:'✧',name:'小镇的礼物',desc:'立即收下 40 颗金币。'},
 {id:'boost',icon:'☺',name:'现在就开笑',desc:'立刻进入 6 秒大笑无敌冲刺。'}
];
export class RunEngine{
 constructor(random=Math.random){this.random=random;this.reset();this.mode='menu'}
 reset(startMap=0){Object.assign(this,{startMap,mode:'running',distance:0,time:0,lane:0,x:0,y:0,vy:0,jumps:0,slide:0,gliding:false,glideFuel:2.6,ground:0,lives:3,coins:0,energy:0,fever:0,laughForm:'',dash:0,dashCooldown:0,invincible:0,magnet:0,combo:0,bestCombo:0,avoids:0,rings:0,roofRuns:0,nextRow:10,rowCount:1,nextUpgrade:1250,nextPower:55,powerIndex:0,niulai:0,naigema:0,zone:startMap,baseSpeed:16,speed:16,nextFork:180,nextEvent:350,eventTime:0,event:'',route:'town',routeTime:0,upgradeCount:0,upgrades:new Set(),objects:[],events:[],counter:0});this.emit('start','左右换道 · 上滑或空格跳跃');this.makeRow(48,0)}
 emit(type,text,data){this.events.push({type,text,data})}
 takeEvents(){const e=this.events;this.events=[];return e}
 add(type,l,at,extra={}){const o={id:++this.counter,type,l,at,done:false,...extra};this.objects.push(o);return o}
 stars(l,at,count=5,y=.8,step=2.8){for(let i=0;i<count;i++)this.add('star',l,at+i*step,{y})}
 makeRow(at,forced){const n=forced??Math.floor(this.random()*8),l=Math.floor(this.random()*3)-1,safe=l===0?1:0;switch(n){
 case 0:this.add('hurdle',l,at);this.add('crate',-safe||-1,at);this.stars(safe,at-3);break;
 case 1:for(const x of [-1,0,1])this.add('gate',x,at);this.stars(l,at+4);break;
 case 2:this.add('pit',l,at,{length:5});this.add('hurdle',safe,at+10);this.stars(l,at+1,5,2.2);break;
 case 3:this.add('ramp',l,at,{length:9,height:2.3});this.add('roof',l,at+9,{length:21,height:2.3});this.stars(l,at+12,6,3.1);this.add('ring',l,at+34,{y:3.5});this.add('pit',l,at+32,{length:5});break;
 case 4:this.add('spring',l,at);for(let i=0;i<4;i++)this.add('ring',l,at+5+i*5,{y:4.5});this.stars(safe,at);break;
 case 5:this.add('car',l,at,{moving:true});this.add('hurdle',safe,at+12);this.stars(-l||-1,at);break;
 case 6:for(let i=0;i<3;i++){this.add('hurdle',l,at+i*12);this.stars(l,at+i*12+2,2,2.2)}break;
 case 7:this.add('swing',0,at);this.add('gate',l,at+17);this.stars(safe,at);break}
 if(this.random()<.45)this.add('magnet',safe,at+25,{y:1});
 }
 input(action){if(this.mode!=='running')return false;if(action==='left')this.lane=Math.max(-1,this.lane-1);if(action==='right')this.lane=Math.min(1,this.lane+1);if(action==='jump'){
 if(this.naigema>0||this.jumps>=1)return false;this.vy=9.7;this.jumps++;this.slide=0;this.gliding=false;this.emit('jump','');
 }if(action==='slide'){this.gliding=false;if(this.y>this.ground+.15){this.vy=-18;this.emit('dive','快速下落')}else this.slide=.83}
 if(action==='glide'){if(this.y>this.ground+.2&&this.glideFuel>0){this.gliding=!this.gliding;this.emit('glide',this.gliding?'荷叶滑翔！':'收起荷叶')}}
 if(action==='dash'){if(this.dashCooldown>0)return false;this.dash=this.upgrades.has('dash')?1.8:1.25;this.dashCooldown=this.upgrades.has('dash')?5:8;this.emit('dash','冲过去！')}
 return true}
 chooseUpgrade(id){if(this.mode!=='upgrade')return;const item=UPGRADES.find(x=>x.id===id);if(!item||!this.choices.some(x=>x.id===id))return;if(id==='heal'){this.lives=Math.min(3,this.lives+1)}else if(id==='stars')this.coins+=40;else if(id==='boost'){this.beginLaugh()}else this.upgrades.add(id);if(id==='glide')this.glideFuel=4.6;this.upgradeCount++;this.mode='running';this.emit('upgradeChosen',item.name)}
 pause(){if(this.mode==='running')this.mode='paused';else if(this.mode==='paused')this.mode='running'}
 power(){return this.dash>0||this.fever>0||this.naigema>0}
 speedMultiplier(){return Math.max(this.naigema>0?3.4:1,this.fever>0?2.9:1,this.dash>0?1.45:1)}
 activeForm(){return this.naigema>0?'naigema':''}
 transform(type){const p=POWERUPS[type];if(!p)return;this[type]=p.charges||p.duration;if(type==='naigema'){this.slide=0;this.gliding=false;this.vy=0;this.y=this.ground;}if(this.fever>0&&type!=='niulai')this.laughForm=this.activeForm();this.emit('transform',type==='niulai'?'牛来！替你抵挡一次伤害':p.name+'！'+p.duration+' 秒'+'自动冲刺 · 吸取金币',{type});}
 beginLaugh(){this.energy=0;this.fever=6;this.laughForm=this.activeForm();this.emit('fever','大笑！6 秒无敌冲刺')}
 gain(amount){if(this.fever>0)return;this.energy+=amount*(this.upgrades.has('fever')?1.4:1);if(this.energy>=100)this.beginLaugh()}
 hit(o){if(this.power()||this.invincible>0)return;if(this.niulai>0){this.niulai=0;this.invincible=1;this.emit('cowBreak','牛来替你挡住了！骑乘结束');return}this.lives--;this.combo=0;this.invincible=1.8;const tips={pit:'路面缺口要跳过去，提前起跳或换道。',car:'迎面车辆要换道躲开。',gate:'横梁要滑铲通过，空中按下可快速落地。',hurdle:'栏杆需要跳跃，提前起跳，也可以换道绕开。',swing:'摆锤会左右移动，提前换道。',crate:'木箱需要换道，避开正面碰撞。',roof:'先走绿色跳台，再登上车顶。'};this.reason=tips[o.type]||'留意前方障碍，给奶蛙一点反应时间。';this.emit('hit',this.lives?'哎哟！'+this.reason:'奶蛙摔了个跟头');if(!this.lives){this.mode='over';this.emit('over',this.reason)}}
 tick(dt){if(this.mode!=='running')return;dt=Math.min(dt,.05);this.time+=dt;this.baseSpeed=16+7*Math.log1p(this.distance/400);const speed=this.baseSpeed*this.speedMultiplier();const previousDistance=this.distance;this.speed=speed;this.distance+=speed*dt;this.x+=(this.lane*3.4-this.x)*Math.min(1,dt*13);
 if(this.naigema>0&&this.naigema<=dt)this.invincible=Math.max(this.invincible,.85);
 for(const key of ['slide','fever','dash','dashCooldown','invincible','magnet','routeTime','eventTime','naigema'])this[key]=Math.max(0,this[key]-dt);
 if(this.fever<=0)this.laughForm='';
 const zone=(Math.floor(this.distance/600)+this.startMap)%ZONES.length;if(zone!==this.zone){this.zone=zone;this.emit('zone','进入 '+ZONES[zone]);}
 if(this.distance>=this.nextPower){const type=['niulai','naigema'][this.powerIndex++%2];this.add(type,Math.floor(this.random()*3)-1,this.distance+Math.max(80,speed*3.2),{y:1.2});this.nextPower=this.distance+220;}
 if(this.routeTime===0&&this.route!=='town'){this.route='town';this.emit('routeEnd','回到小镇主路')}
 if(this.eventTime===0&&this.event){this.event='';this.emit('eventEnd','天气恢复晴朗')}
 let ground=0;for(const o of this.objects){const d=this.distance-o.at;if(Math.abs(o.l*3.4-this.x)>.95)continue;if(o.type==='ramp'&&d>=0&&d<=o.length)ground=Math.max(ground,d/o.length*o.height);if(o.type==='roof'&&d>=0&&d<=o.length&&this.y>=o.height-.4)ground=Math.max(ground,o.height)}
 if(ground>this.ground+.01&&this.y<=this.ground+.15&&this.vy<=0)this.y=ground;
 this.ground=ground;
 if(this.gliding&&this.y>ground+.1&&this.glideFuel>0){this.glideFuel=Math.max(0,this.glideFuel-dt);this.vy=Math.max(-1.4,this.vy-7*dt);if(this.glideFuel===0)this.gliding=false}else this.vy-=24*dt;
 this.y+=this.vy*dt;if(this.y<=ground){this.y=ground;this.vy=0;this.jumps=0;this.gliding=false;this.glideFuel=this.upgrades.has('glide')?4.6:2.6}
 if(this.distance>=this.nextRow){const sequence=[0,3,4,1,2,5,6,7];this.makeRow(this.distance+Math.max(85,speed*4),this.rowCount<sequence.length?sequence[this.rowCount++]:undefined);this.nextRow=this.distance+Math.max(48,this.baseSpeed*2.2)}
 if(this.distance>=this.nextFork){this.add('fork',0,this.distance+65);this.nextFork+=430}
 if(this.distance>=this.nextEvent){this.event=this.random()<.5?'gold':'rain';this.eventTime=12;this.nextEvent+=360;this.emit('event',this.event==='gold'?'随机事件 · 金币雨！收集奖励翻倍':'随机事件 · 雨中慢跑！路边灯亮了')}
 for(const o of this.objects){if(o.done)continue;if(o.moving)o.at-=dt*5;const dz=o.at-this.distance;let ox=o.l*3.4;if(o.type==='swing')ox=Math.sin(this.time*2.1)*3.5;const aligned=Math.abs(ox-this.x)<1.12;
 if(POWERUPS[o.type]){if(dz<2.1&&o.at>=previousDistance-2.5&&aligned&&Math.abs(this.y+.9-(o.y||1))<2){o.done=true;this.transform(o.type);}continue;}
 if(['star','ring','magnet'].includes(o.type)){
 const isStar=o.type==='star';const auto=isStar&&(this.magnet>0||this.upgrades.has('magnet')||this.power());if(dz<(auto&&this.naigema>0?20:2.1)&&o.at>=previousDistance-2.5&&(aligned||auto)&&((Math.abs(this.y+.9-(o.y||1))<(o.type==='ring'?1.7:1.8))||auto)){
 o.done=true;if(isStar){const amount=(this.upgrades.has('double')?2:1)*(this.event==='gold'||this.route==='gold'?2:1);this.coins+=amount;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.gain(3);this.emit('star','',o)}else if(o.type==='ring'){this.rings++;this.coins+=8;this.gain(14);this.emit('ring','空中圆环 +8',o)}else{this.magnet=10;this.emit('pickup','磁铁开启 · 自动收集 10 秒',o)}
 }continue}
 if(o.type==='fork'&&dz<0){o.done=true;this.route=this.lane===-1?'gold':this.lane===1?'garden':'town';this.routeTime=14;if(this.route==='garden')this.magnet=10;this.emit('route',this.route==='gold'?'左岔路 · 金色街区！金币翻倍':this.route==='garden'?'右岔路 · 荷叶花园！磁铁开启':'直行 · 小镇主路');continue}
 if(o.type==='ramp'){if(!o.visited&&aligned&&dz<0&&dz>-o.length){o.visited=true;this.roofRuns++;this.emit('ramp','登上车顶！尽头跳跃接圆环')}continue}
 if(o.type==='roof'){if(!o.hit&&aligned&&dz<1&&dz>-o.length&&this.y<o.height-.45){o.hit=true;this.hit(o)}continue}
 if(o.type==='spring'&&aligned&&dz<1.3&&dz>-1.5&&this.y<.65){o.done=true;this.vy=15.4;this.jumps=1;this.emit('spring','弹簧跳台！空中点 ♧ 展开荷叶');continue}
 const inRange=dz<1.3&&o.at>previousDistance-(o.type==='pit'?o.length:1.6);
 if(inRange&&aligned){const avoided=o.type==='hurdle'?this.y>1.15:o.type==='gate'?this.slide>0&&this.y<.3:o.type==='crate'?this.y>2.25:o.type==='car'?this.y>2.2:o.type==='pit'?this.y>.5:o.type==='swing'?this.y>2.2:false;
 if(this.power()){if(o.type!=='pit'){o.done=true;this.emit('smash','',o);this.coins+=2}}
 else if(!avoided&&o.type!=='spring'){o.done=true;this.hit(o)}
 }
 if(dz<-1.8&&!o.scored&&o.type!=='pit'&&o.type!=='spring'){o.scored=true;this.avoids++;if(aligned){this.gain(7);this.emit('avoid','漂亮！')}}
 if(this.mode==='over')break;
 }
 this.objects=this.objects.filter(o=>o.at-this.distance>-(o.length||0)-15&&!o.done);
 if(this.mode==='running'&&!this.power()&&this.distance>=this.nextUpgrade&&this.y<=this.ground+.01){this.nextUpgrade+=1500;this.mode='upgrade';const pool=UPGRADES.filter(u=>['heal','stars','boost'].includes(u.id)||!this.upgrades.has(u.id));for(let i=pool.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}this.choices=pool.slice(0,3);this.emit('upgrade','选一个能力，接着跑！')}
 }
}
