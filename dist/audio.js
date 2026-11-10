import {LAUGH_DURATION} from './motion.js';
export class GameAudio {
 constructor(on=true,onError=()=>{}){this.on=on;this.onError=onError;this.ctx=null;this.buffer=null;this.source=null;this.started=0;this.limit=0;this.stoppedTime=-1;this.request=0;this.musicBeat=0;this.nextBeat=0;this.nextStep=0;this.raw=fetch('./assets/naiwa-laugh.wav').then(r=>{if(!r.ok)throw Error('笑声音轨未加载');return r.arrayBuffer();});this.raw.catch(()=>{});}
 async unlock(){
  if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('浏览器不支持声音');this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.on?1:0;this.master.connect(this.ctx.destination);this.music=this.ctx.createGain();this.music.gain.value=.14;this.music.connect(this.master);this.fx=this.ctx.createGain();this.fx.gain.value=.55;this.fx.connect(this.master);this.voice=this.ctx.createGain();this.voice.gain.value=.9;this.voice.connect(this.master);this.ready=this.raw.then(b=>this.ctx.decodeAudioData(b)).then(b=>this.buffer=b);this.ready.catch(()=>this.onError('笑声音轨加载失败，请刷新后重试'));this.nextBeat=this.ctx.currentTime+.1;}
  if(this.ctx.state==='suspended')await this.ctx.resume();return this.ready;
 }
 setEnabled(enabled){this.on=enabled;if(this.master)this.master.gain.setTargetAtTime(enabled?1:0,this.ctx.currentTime,.025);}
 async laugh(kind='studio'){
  const request=++this.request;await this.unlock();if(request!==this.request)return false;this.clearSource();this.kind=kind;this.limit=kind==='run'?6:LAUGH_DURATION;this.source=this.ctx.createBufferSource();this.source.buffer=this.buffer;this.source.connect(this.voice);this.started=this.ctx.currentTime;this.stoppedTime=-1;this.source.start(0,0,this.limit);const playing=this.source;this.source.onended=()=>{if(this.source===playing){this.stoppedTime=this.limit;this.source.disconnect();this.source=null;}};return true;
 }
 get time(){return this.source?Math.min(this.limit,this.ctx.currentTime-this.started):this.stoppedTime;}
 stopLaugh(){this.request++;this.clearSource();}
 clearSource(){if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();}this.source=null;this.stoppedTime=-1;this.kind=null;}
 tone(freq=600,duration=.1,type='sine',volume=.1,bus){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.68),t+duration);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus||this.fx);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
 suspend(){this.ctx?.suspend();}
 resume(){if(this.ctx)this.ctx.resume().catch(()=>{});}
 update(state){if(!this.ctx||this.ctx.state!=='running')return;const now=this.ctx.currentTime;this.music.gain.setTargetAtTime(this.source?.035:.12,now,.12);
  if(state.mode==='running'&&now>this.nextBeat){const tune=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,84];const k=this.musicBeat++%32;if(k%2===0)this.tone(440*2**((tune[k/2]-69)/12),.24,'triangle',.16,this.music);if(k%4===0)this.tone([130.81,146.83,123.47,130.81][Math.floor(k/8)],.25,'sine',.22,this.music);this.nextBeat=now+.22;}
  if(state.mode==='running'&&state.y<state.ground+.05&&state.slide<=0&&now>this.nextStep){this.tone(95,.055,'triangle',.06);this.nextStep=now+(state.power()?.14:.22);}
 }
}
