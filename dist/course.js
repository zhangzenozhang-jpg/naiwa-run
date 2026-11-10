export const ZONE_LENGTH = 600;
export const MAPS = [
 {id:'town',name:'晴日小镇',short:'小镇',icon:'⌂',tag:'屋檐下的第一阵风',sky:'#b8dfe4',ground:'#8eaf69',accent:'#e6b861',surface:'stone'},
 {id:'forest',name:'蘑菇森林',short:'森林',icon:'♠',tag:'穿过树冠与蘑菇小径',sky:'#b7daca',ground:'#71944d',accent:'#85ac55',surface:'earth'},
 {id:'river',name:'瀑布木桥',short:'木桥',icon:'≈',tag:'沿着水声，跑进溪谷',sky:'#b8dfe6',ground:'#63aeb3',accent:'#68b6c5',surface:'wood'},
 {id:'bamboo',name:'竹影溪径',short:'竹林',icon:'竹',tag:'风铃、竹海与石灯笼',sky:'#c4dfce',ground:'#779c71',accent:'#6fa98b',surface:'paving'},
 {id:'canyon',name:'落日峡谷',short:'峡谷',icon:'△',tag:'越过红岩与淘金营地',sky:'#efc7a1',ground:'#c58b57',accent:'#d88c5f',surface:'sand'},
 {id:'snow',name:'松雪山村',short:'雪村',icon:'❄',tag:'踏着雪，奔向暖灯小屋',sky:'#c9dfeb',ground:'#dce7e6',accent:'#92b8ce',surface:'snow'}
];
export function zoneAt(distance,startMap=0){return MAPS[((Math.floor(Math.max(0,distance)/ZONE_LENGTH)+startMap)%MAPS.length+MAPS.length)%MAPS.length]}
// Continuous progression, with diminishing acceleration to retain playable reaction windows.
export function runningSpeed(distance){return 16+26*(1-Math.exp(-Math.max(0,distance)/2400))}
export const FIRST_SKILL_DISTANCE=250*5;
export const SKILL_DISTANCE_INTERVAL=300*5;
