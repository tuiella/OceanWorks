/* Original procedural HUD artwork; reference videos are not embedded or altered. */
(()=>{
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={iron:'철',copper:'구리',gas:'천연가스',quartz:'석영',silver:'은',gold:'금'},fmt=(v,d=0)=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:d});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const categories=['구조재','연료','전도체','전지금속','결정소재'];
const reserveRanges={iron:[40000,160000],aluminum:[30000,120000],manganese:[10000,40000],titanium:[8000,32000],chromium:[6000,24000],tungsten:[2000,8000],oil:[20000,80000],gas:[10000,40000],methaneHydrate:[30000,120000],copper:[20000,80000],silver:[4000,16000],graphite:[10000,40000],gold:[2000,8000],nickel:[12000,48000],cobalt:[4000,16000],lithium:[8000,32000],vanadium:[10000,40000],quartz:[20000,80000],fluorite:[10000,40000],mica:[6000,24000],corundum:[2000,8000],zircon:[4000,16000]};
const resourceInfo={iron:[0,'Fe',65,10,.049177],aluminum:[0,'Al',35],manganese:[0,'Mn',50],titanium:[0,'Ti',10],chromium:[0,'Cr',40],tungsten:[0,'W',.8],oil:[1,'Oil',100],gas:[1,'CH₄',100,15,.102759],methaneHydrate:[1,'CH₄·H₂O',13.4],copper:[2,'Cu',.8,20,.035738],silver:[2,'Ag',.015],graphite:[2,'C',15],gold:[2,'Au',.0004],nickel:[3,'Ni',2],cobalt:[3,'Co',.4],lithium:[3,'Li',1.2],vanadium:[3,'V',.8],quartz:[4,'SiO₂',100,8,.077069],fluorite:[4,'CaF₂',90],mica:[4,'Mica',30],corundum:[4,'Al₂O₃',15],zircon:[4,'ZrSiO₄',5]};
function resultData(j){
 const r=j.result,info=resourceInfo[j.resource]||resourceInfo.iron;
 const p=clamp(Number.isFinite(r.internalPurity)?r.internalPurity:(+r.grade||0)/100,0,1);
 const effect=p/.8+6.25*Math.max(0,p-.8)**2;
 const density=r.valueDensity??info[3]??1,correction=r.depositCorrection??info[4]??1,k=r.displayPurityCoefficient??info[2];
 const calculated=Math.round(r.reserve*density*correction*effect),value=Number.isFinite(r.value)?r.value:calculated;
 return {p,info,value,calculated,density,correction,effect,per1000:1000*density*correction*effect,minGrade:.4*k,maxGrade:k,grade:p*k,category:categories[info[0]]};
}
function valueFormula(j){const d=resultData(j);return '매장량 × 가치밀도 × 매장보정 × 순도효과<br>'+fmt(j.result.reserve)+' × '+fmt(d.density,6)+' × '+fmt(d.correction,6)+' × '+fmt(d.effect,6)+' ≈ '+fmt(d.calculated)+' V<br><span>순도효과 = p ÷ 0.8 + 6.25 × max(0, p − 0.8)²<br>내부순도 p = '+fmt(d.p,6)+' · 최종 정수 반올림</span>'+(d.value!==d.calculated?'<br>저장된 결과 가치: '+fmt(d.value)+' V':'');}
function identifier(j){const d=resultData(j);return j.result.x+','+j.result.y+'·'+d.info[1]+'·'+Math.floor(d.value/1000)+'kV';}
function initializeResult(j){
 const random=rng(seed(j,'resource-result-v22')),normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-10)))*Math.cos(2*Math.PI*random());
 const [min,max]=reserveRanges[j.resource]||reserveRanges.iron,[mu,sigma]=({iron:[.8,.1],copper:[.74,.1],gas:[.94,.03],quartz:[.94,.03]})[j.resource]||[.8,.1];
 let p,t;do{p=mu+sigma*normal();}while(p<.4||p>1);
 do{t=(min+max)/2+(max-min)/6*normal();}while(t<min||t>max);
 const info=resourceInfo[j.resource]||resourceInfo.iron;
 Object.assign(j.result,{internalPurity:p,reserve:Math.round(t),displayPurityCoefficient:info[2],valueDensity:info[3]??1,depositCorrection:info[4]??1});
 const d=resultData(j);j.result.grade=d.grade;j.result.value=d.value;
}
// Gradient Perlin noise; the threshold is solved after contrast shaping so mean brightness equals p.
function heatModel(j,p){
 const random=rng(seed(j,'perlin-purity-v22')),grad=Array.from({length:64},()=>random()*Math.PI*2);
 const fade=t=>t*t*t*(t*(t*6-15)+10),mix=(a,b,t)=>a+(b-a)*t;
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const dot=(dx,dy)=>{const a=grad[((iy+dy)*8+ix+dx)%64];return Math.cos(a)*(fx-dx)+Math.sin(a)*(fy-dy);};
  return mix(mix(dot(0,0),dot(1,0),fade(fx)),mix(dot(0,1),dot(1,1),fade(fx)),fade(fy));};
 const field=Array.from({length:200},(_,i)=>noise((i%20)/4+.17,Math.floor(i/20)/4+.31));
 if(p<=0||p>=1)return field.map(()=>clamp(p,0,1));
 const light=(n,t)=>1/(1+Math.exp(-28*(n-t)));let lo=-3,hi=3;
 for(let k=0;k<60;k++){const t=(lo+hi)/2,avg=field.reduce((s,n)=>s+light(n,t),0)/200;if(avg>p)lo=t;else hi=t;}
 return field.map(n=>light(n,(lo+hi)/2));
}
function seed(j,key){let h=2166136261;for(const c of j.id+key)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function rng(n){return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}

/* Game-domain data: stable by job id, independent of animation frames. */
const geologyCatalog=[
 {type:'화성암',name:'현무암',strong:.72},{type:'화성암',name:'반려암',strong:.82},
 {type:'화성암',name:'감람암',strong:.78},{type:'퇴적암',name:'처트',strong:.67},
 {type:'퇴적암',name:'이암',strong:.18},{type:'퇴적암',name:'셰일',strong:.26},
 {type:'퇴적암',name:'석회암',strong:.42},{type:'변성암',name:'사문암',strong:.48},
 {type:'변성암',name:'대리암',strong:.58},{type:'변성암',name:'편마암',strong:.75}
];
const rockColors=['#b5dafe','#6494c0','#346fa4'];
function transitionStrength(previous,roll,direction){
 if(roll<.5)return previous;
 const step=roll<.9?1:2;
 const candidates=[1,2,3].filter(n=>Math.abs(n-previous)===step);
 // A two-step jump cannot exist from the middle state: distribute it to the two neighbours.
 const options=candidates.length?candidates:[1,3];
 return options[Math.min(options.length-1,Math.floor(direction*options.length))];
}
function rockModel(j){
 const random=rng(seed(j,'rock-geology-v21')),geology=geologyCatalog[Math.floor(random()*geologyCatalog.length)];
 const first=random(),weak=(1-geology.strong)*.45,cells=[first<geology.strong?3:first<geology.strong+weak?1:2];
 for(let i=1;i<16;i++)cells.push(transitionStrength(cells[i-1],random(),random()));
 return {geology,cells,score:cells.reduce((a,b)=>a+b,0),counts:[1,2,3].map(n=>cells.filter(v=>v===n).length)};
}
const signalCache=new WeakMap(),jobModels=new Map();
// Unequal carrier frequencies with overlapping envelopes; semantic category order stays intact.
const carriers=[.84,.68,.51,.355,.215];
function carrierRadius(category){return carriers[category];}
function trailWindow(age,timing){if(!timing||typeof timing!=='object')timing={draw:.15,hold:.20,erase:.25};return {start:clamp((age-(timing.draw+timing.hold))/timing.erase,0,1),end:clamp(age/timing.draw,0,1)};}
function flashAlpha(age){return age<.18?1:Math.max(0,1-(age-.18)/.85);}
const scanSpeed=Math.PI*2/10.5;
function traceCandidate(birth,random){
 const duration=.35+random()*1.6,segments=[];let a=birth/1000*scanSpeed,r=.16+random()*.75;
 const count=1+Math.floor(random()*4),weights=Array.from({length:count},()=>.3+random()),sum=weights.reduce((s,v)=>s+v,0);
 weights.forEach((weight,i)=>{
  const end=a+duration*scanSpeed*weight/sum;segments.push({kind:'arc',a,b:end,r,length:(end-a)*r});a=end;
  if(i<count-1){const next=clamp(r+(random()>.5?1:-1)*(.025+random()*.12),.14,.94);if(next!==r)segments.push({kind:'radial',a,r,end:next,length:Math.abs(next-r)});r=next;}
 });
 const samples=[];
 for(const s of segments){const n=Math.max(1,Math.ceil(s.length/.006));for(let k=0;k<=n;k++){const f=k/n,angle=s.kind==='arc'?s.a+(s.b-s.a)*f:s.a,radius=s.kind==='arc'?s.r:s.r+(s.end-s.r)*f;samples.push([Math.cos(angle)*radius,Math.sin(angle)*radius]);}}
 return {birth,duration,hold:.15+random()*.55,erase:.3+random()*.7,segments,samples,cap:Math.floor(random()*3),length:segments.reduce((sum,s)=>sum+s.length,0)};
}
function tracesOverlap(a,b){return a.samples.some(p=>b.samples.some(q=>(p[0]-q[0])**2+(p[1]-q[1])**2<.022**2));}
function updateTraces(v,time){
 if(!v.traces){v.traces=[];v.traceNext=time;v.traceRandom=rng(v.seed^71239);}
 v.traces=v.traces.filter(t=>time<t.birth+(t.duration+t.hold+t.erase)*1000);
 if(time-v.traceNext>250)v.traceNext=time; // No catch-up burst after an inactive tab.
 if(time>=v.traceNext){
  const candidate=traceCandidate(time,v.traceRandom);
  if(!v.traces.some(t=>tracesOverlap(t,candidate)))v.traces.push(candidate);
  v.traceNext=time+(65+v.traceRandom()*210)/1.5;
 }return v.traces;
}
function signalModel(j){
 if(signalCache.has(j))return signalCache.get(j);
 const random=rng(seed(j,'frequency-v23')),tau=Math.PI*2,grade=resultData(j).p;
 const index=resultData(j).info[0],frequency=carriers[index],band=[frequency-.16,frequency+.16];
 // User-confirmed normalization: the completed reserve within its resource's min/max range.
 const [minimum,maximum]=reserveRanges[j.resource]||reserveRanges.iron;
 const reserveRatio=clamp((+j.result.reserve-minimum)/(maximum-minimum),0,1);
 const center=random()*tau,phase=random()*tau,spread=reserveRatio*tau,returns=[],arcs=[];
 const sectors=[{start:center,span:spread}];
 const count=reserveRatio===0?0:Math.round(35+Math.min(reserveRatio/.8,1)*280+Math.max(0,(reserveRatio-.8)/.2)*100);
 for(let i=0;i<count;i++){
  const sector=sectors[0],u=(i+random()*.75)/(count- .25),offset=u*sector.span,angle=(sector.start+offset)%tau;
  const f=frequency+.009*Math.sin(angle*13+phase);
  const taper=reserveRatio===1?1:Math.pow(Math.max(0,Math.sin(Math.PI*u)),.7);
  const envelope=.5+.5*Math.sin(angle*7+phase),length=.007+taper*(.035+envelope*.105+random()*.055+(i%23===0?.13:0));
  returns.push({angle,frequency:f,length,target:true,cluster:true,power:1,category:index,kind:i%9===0?'arc':'ray',arcLength:Math.min(sector.span-offset,.009+random()*.065),width:i%13===0?1.8:.65+random()*.5});
 }
 // Broken carrier ribbons, sparse calibration marks and clustered returns share one flow field.
 for(let category=0;category<5;category++){
  const origin=(center+category*.91)%tau;
  for(let lane=0;lane<4;lane++){
   const start=origin+lane*.22+random()*.2,span=.4+random()*1.9;
   arcs.push({category,start,span,offset:(lane-1)*.025,width:lane===1?.95:.5});
  }
  for(let group=0;group<3;group++){
   const anchor=origin+group*1.95+.25*Math.sin(category+phase);
   for(let k=0;k<30;k++){
    const angle=(anchor+(k/30-.5)*(group===1?.18:.6+group*.16)+tau)%tau;
    const f=carrierRadius(category,angle,phase)+(group-1)*.034;
    const length=.025+.13*(.5+.5*Math.sin(k*.31+phase));
    returns.push({angle,frequency:f,baseFrequency:f,length,baseLength:length,target:false,category,group:category*3+group,power:random(),present:random()>.15,cycle:null,kind:k%7===0?'dot':k%4===0?'arc':'ray',arcLength:.07+random()*.35,width:.55+random()*.6});
   }
  }
 }
 const heat=heatModel(j,grade),peak=1;
 const model={returns,arcs,sectors,phase,index,heat,peak,frequency,band,grade,center,reserveRatio,spread};
 signalCache.set(j,model);return model;
}
function purity(j){
 const m=signalModel(j),d=resultData(j),label='내부순도 '+fmt(d.p,4)+' · 평균 밝기 '+fmt(d.p*100,2)+'%';
 return '<div class="mr-purity-wrap" tabindex="0" aria-label="'+label+'"><div class="mr-heatmap" role="img" aria-label="'+label+'">'+m.heat.map(n=>'<i data-density="'+n+'" style="--density:'+n+'"></i>').join('')+'</div><span class="mr-purity-tooltip" role="tooltip">'+label+'</span></div><b class="mr-meter-value mr-info-hover" tabindex="0">'+d.info[1]+' 함량 '+fmt(d.grade,6)+'<small>%</small><span class="mr-purity-tooltip" role="tooltip">함량 범위<br>최소 '+fmt(d.minGrade,6)+'% ~ 최대 '+fmt(d.maxGrade,6)+'%</span></b>';
}
function hardness(j){
 const m=rockModel(j);
 return '<div class="mr-rock-strength" role="img" aria-label="암반 강도 '+m.score+'포인트">'+m.cells.map((n,i)=>'<i data-strength="'+n+'" style="--rock-color:'+rockColors[n-1]+'" title="'+(i+1)+'구간 · '+['약함','중간','강함'][n-1]+' '+n+'p"></i>').join('')+'</div><div class="mr-rock-score"><span class="mr-rock-legend">'+m.counts.map((n,i)=>'<small><i style="background:'+rockColors[i]+'"></i>'+['약','중','강'][i]+' '+n+'</small>').join('')+'</span><b>'+m.score+'<small>p</small></b></div>';
}

function samples(j,key,count=28){const v=+j.result[key],random=rng(seed(j,key));return Array.from({length:count},(_,i)=>i===count-1?v:Math.max(0,v*(.65+random()*.65)+Math.sin(i*.65)*v*.1));}
function graph(j,key){const r=j.result,w=320,h=136,left=34,right=308,top=12,bottom=108;let art='',low=0,high=1,xLabel='관측 표본',unit='',values=[];
 const poly=(a,color='#78d6e4',cls='mr-trace')=>'<polyline class="'+cls+'" pathLength="100" points="'+a.map(p=>p.map(v=>v.toFixed(2)).join(',')).join(' ')+'" fill="none" stroke="'+color+'"/>';
 if(key==='depth'){
  const random=rng(seed(j,key));values=Array.from({length:45},(_,i)=>r.depth*(.83+.13*Math.sin(i*.18)+random()*.06));values[22]=r.depth;low=Math.floor(Math.min(...values)*.9/100)*100;high=Math.ceil(Math.max(...values)*1.08/100)*100;unit='m';xLabel='해저 횡단 / 중앙 관측점';
  for(let k=4;k>=0;k--)art+=poly(values.map((v,i)=>[left+i/44*(right-left),top+(v-low)/(high-low)*(bottom-top)-k*4*Math.sin(i*.22)]),k?'#417386':'#c88580');
  const y=top+(r.depth-low)/(high-low)*(bottom-top);art+='<path d="M171 10V112" stroke="#d98582" stroke-dasharray="3 4"/><circle cx="171" cy="'+y+'" r="3" fill="#ecad93"/>';
 }else if(key==='wave'){
  unit='m';high=Math.max(.1,+r.wave/2);low=-high;xLabel='파고 '+r.wave+' m';
  for(let k=0;k<7;k++){const a=Array.from({length:100},(_,i)=>[left+i/99*(right-left),60-Math.sin(i*.14+k*.19)*46*(1-k*.06)]);art+=poly(a,k===0?'#c5f5f9':'#4f91b7');}
 }else if(key==='tide'){
  high=Math.max(.5,+r.tide*1.25);unit='m';xLabel='관측 지점';
  const random=rng(seed(j,'tidal-ranges'));
  for(let i=0;i<7;i++){const lower=+r.tide*(.015+random()*.12),range=+r.tide*(.65+random()*.35),upper=lower+range,x=left+18+i*39,y1=bottom-upper/high*(bottom-top),y2=bottom-lower/high*(bottom-top);
   art+='<g class="mr-tidal-range" data-low="'+lower.toFixed(2)+'" data-high="'+upper.toFixed(2)+'"><path d="M'+x+' '+y1+'V'+y2+'M'+(x-9)+' '+y1+'H'+(x+9)+'M'+(x-9)+' '+y2+'H'+(x+9)+'" stroke="#a4d9e6" fill="none"/><rect x="'+(x-4)+'" y="'+y1+'" width="8" height="'+(y2-y1)+'" fill="#73b9cf44"/><text x="'+x+'" y="122" text-anchor="middle">'+(i+1)+'</text></g>';
  }xLabel='';
 }else if(key==='temperature'){
  const t=+r.temperature,seabed=Math.max(1.5,t-(2+Math.log1p(r.depth/160)*2));low=Math.floor(seabed-1);high=t+2;unit='°C';xLabel='';
  values=Array.from({length:40},(_,i)=>t-(t-seabed)*(1-Math.exp(-i/12))/(1-Math.exp(-39/12)));
  art=poly(values.map((v,i)=>[left+i/39*(right-left),bottom-(v-low)/(high-low)*(bottom-top)]),'#e5b690');
  for(let i=0;i<3;i++)art+='<text class="mr-depth-tick" x="'+(left+i/2*(right-left))+'" y="130" text-anchor="'+(i===0?'start':i===2?'end':'middle')+'">'+fmt(r.depth*i/2)+' m</text>';
 }else if(key==='seismic'){
  low=-1;high=1;unit='진폭';xLabel='반사 신호 / 깊이 구간';values=Array.from({length:150},(_,i)=>Math.sin(i*1.8)*(.1+.8*Math.exp(-(((i-43)/9)**2))+.6*Math.exp(-(((i-109)/13)**2))));art=poly(values.map((v,i)=>[left+i/149*(right-left),60-v*37]),'#84c9cb');
 }else{
  values=samples(j,key,key==='wind'?85:28);high=Math.max(1,Math.max(...values)*1.12);unit=key==='rain'?'mm/h':'m/s';const xy=(v,i)=>[left+i/(values.length-1)*(right-left),bottom-v/high*(bottom-top)];
  if(key==='rain')art=values.map((v,i)=>{const [x,y]=xy(v,i);return '<rect class="mr-bar" style="--i:'+i+'" x="'+x+'" y="'+y+'" width="6" height="'+(bottom-y)+'" fill="'+(i===values.length-1?'#e9b488':'#64b9bd')+'"/>';}).join('');
  else if(key==='wind')art=values.map((v,i)=>{const [x,y]=xy(v,i);return '<circle cx="'+x+'" cy="'+y+'" r="'+(i===values.length-1?3.5:1.7)+'" fill="#eeb58d" opacity="'+(.35+i/130)+'"/>';}).join('');
  else{for(let band=0;band<3;band++)art+=poly(values.map((v,i)=>xy(v*(.9+band*.1),i)),['#5f9cc5','#9cd9cb','#e5c995'][band]);}
  if(key==='rain'){const averages=values.map((_,i)=>{const a=values.slice(Math.max(0,i-2),Math.min(values.length,i+3));return a.reduce((s,v)=>s+v,0)/a.length;});art+=poly(averages.map((v,i)=>xy(v,i)),'#f3c191','mr-trace mr-rain-average');}
  const [x,y]=xy(values.at(-1),values.length-1);art+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="#f5d2ae"/>';
 }
 let grid='';for(let i=0;i<4;i++){const y=top+i/3*(bottom-top);grid+='<path d="M'+left+' '+y+'H'+right+'"/>';grid+='<text x="2" y="'+(y+3)+'">'+fmt(key==='depth'?low+(high-low)*i/3:high-(high-low)*i/3,1)+'</text>';}
 return '<svg class="mr-plot" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+E(key)+' '+E(unit)+' 그래프"><g class="mr-axis">'+grid+'<text x="'+left+'" y="130">'+E(xLabel)+'</text><text x="310" y="9" text-anchor="end">'+unit+'</text></g>'+art+'</svg>';
}
function tile(j,key,label,unit,at,index){return '<article class="mr-card mr-metric mr-locked" data-reveal-at="'+at+'" style="--order:'+index+'"><small>'+label+'</small><div class="mr-data"><strong>'+fmt(j.result[key],['depth','wind','rain'].includes(key)?0:1)+'</strong><span>'+unit+'</span></div><div class="mr-chart-data">'+graph(j,key)+'</div><span class="mr-unread">미조사</span></article>';}
function report(j){
 const r=j.result,rock=rockModel(j),data=resultData(j);signalModel(j);jobModels.set(j.id,j);
 return '<div class="mr-report" data-report-job="'+E(j.id)+'"><div class="mr-primary">'+
 '<section class="mr-card mr-resource mr-locked" data-reveal-at="65" style="--order:0"><h2>자원</h2><div class="mr-resource-body">'+
 '<div class="mr-hologram mr-chart-data"><canvas data-holo="resource" data-job="'+E(j.id)+'" data-seed="'+seed(j,'resource')+'" data-grade="'+r.grade+'" aria-label="시계 방향으로 갱신되는 자원 반사 신호, 반지름은 주파수"></canvas></div>'+
 '<div class="mr-resource-data"><svg class="mr-leader" viewBox="0 0 300 55" aria-hidden="true"><circle cx="10" cy="43" r="4"/><path pathLength="100" d="M10 43L48 10H285M52 15H184M285 2V20M202 10l7 -5h23l-7 5m8 0 7 -5h23l-7 5"/><path class="mr-leader-heavy" d="M71 10H123"/><path d="M277 10h15"/></svg>'+
 '<div class="mr-identifier mr-data" data-reveal-at="100">'+identifier(j)+'</div><dl><div class="mr-resource-field mr-info-hover" data-radar-focus="type" tabindex="0" aria-label="유형의 주파수 대역 강조"><dt>유형</dt><dd class="mr-data">'+data.category+' · '+(names[j.resource]||j.resource)+'<span class="mr-purity-tooltip mr-data" role="tooltip" data-reveal-at="100">1,000톤당 가치: <strong>'+fmt(data.per1000,2)+' V</strong><br>자원 유형: '+data.category+'<br>가치밀도: '+fmt(data.density,6)+'<br>현재 순도·매장보정 적용 · 매장량 무관</span></dd></div>'+
 '<div class="mr-resource-field mr-reserve-wrap" data-radar-focus="reserve" tabindex="0" data-reveal-at="100" aria-label="매장비율 '+fmt(signalModel(j).reserveRatio*100,2)+'퍼센트"><dt>매장량</dt><dd class="mr-data">'+fmt(r.reserve)+' <small>t</small><span class="mr-purity-tooltip" role="tooltip">매장비율 '+fmt(signalModel(j).reserveRatio*100,2)+'%</span></dd></div>'+
 '<div class="mr-resource-field mr-info-hover mr-value-field" tabindex="0" data-reveal-at="100"><dt>자원 가치</dt><dd class="mr-data">'+fmt(data.value)+'<span class="mr-purity-tooltip mr-formula" role="tooltip">'+valueFormula(j)+'</span></dd></div><div class="mr-resource-field" data-reveal-at="100"><dt>순도</dt><dd class="mr-data mr-grade">'+purity(j)+'</dd></div></dl></div></div><span class="mr-unread">자원 신호 분석 중</span></section>'+
 '<section class="mr-card mr-rock mr-locked" data-reveal-at="40" style="--order:1"><h2>암반</h2><div class="mr-hologram mr-chart-data"><canvas data-holo="rock" data-seed="'+seed(j,'rock')+'" data-grade="'+r.hardness+'" aria-label="회전하는 해저 지형"></canvas></div>'+
 '<dl><dt>유형</dt><dd class="mr-data">'+(rock.score>34?'암반 능선':'해저평원')+'</dd><dt>지질</dt><dd class="mr-data">'+rock.geology.type+' · '+rock.geology.name+'</dd><dt>암반 강도</dt><dd class="mr-data">'+hardness(j)+'</dd></dl><span class="mr-unread">지질 분석 중</span></section></div>'+
 '<div class="mr-environment">'+tile(j,'depth','수심','m',20,2)+tile(j,'current','해류 속도','m/s',20,3)+tile(j,'wave','파고','m',20,4)+tile(j,'wind','풍속','m/s',20,5)+tile(j,'rain','강수량','mm/h',20,6)+tile(j,'tide','조차','m',20,7)+tile(j,'temperature','깊이별 수온','°C',20,8)+
 '<section class="mr-card mr-metric mr-locked" data-reveal-at="40" style="--order:9"><small>탄성파 탐사</small><div class="mr-data"><strong>2</strong><span>주요 경계층</span></div><div class="mr-chart-data">'+graph(j,'seismic')+'</div><span class="mr-unread">미조사</span></section></div></div>';
}
function progress(j){return '<section class="mr-acquisition" data-acquisition><div class="mr-radar"><div class="mr-radar-grid"></div><div class="mr-sweep"></div><div class="mr-orbit mr-orbit-a"></div><div class="mr-orbit mr-orbit-b"></div><div class="mr-progress-arc"><svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="111" pathLength="100"/></svg></div><div class="mr-progress-number"><strong data-scan-percent>'+Math.floor(j.progress)+'</strong><span>%</span><small>ACQUIRING SIGNAL</small></div><i class="mr-blip one"></i><i class="mr-blip two"></i></div><div class="mr-acquisition-body"><div class="mr-kicker">MINERAL EXPLORER / LIVE ACQUISITION</div><h2>해저 신호를 분석하고 있습니다</h2><div class="mr-telemetry"><span>전력 사용량<b>'+j.power+' <small>kW</small></b></span><span>탐사 속도<b>'+j.speed.toFixed(2)+' <small>%/s</small></b></span><span>강도<b>'+(j.mode==='wide'?'자동':j.strength)+'</b></span><span>범위<b>'+(j.mode==='wide'?'해역 전체':j.radius)+'</b></span></div><div class="mr-linear"><i data-scan-fill></i></div><ol class="mr-stages">'+[[20,'환경'],[40,'암반'],[65,'자원'],[100,'정밀 분석']].map(([at,name])=>'<li data-stage="'+at+'"><i></i>'+name+'</li>').join('')+'</ol><div class="mr-actions"><button data-sc-stop="'+j.id+'">중지</button><button data-sc-start="'+j.id+'" hidden>▶ 탐사 재시작</button><button data-sc-finish="'+j.id+'" class="mr-test">탐사완료 · TEST</button><span data-scan-state></span></div><ul class="mr-live-log" data-scan-log></ul></div></section>';}
function gate(j){return '<section class="mr-completion"><div class="mr-complete-mark">✓</div><div><small>ACQUISITION COMPLETE</small><h2>탐사 분석이 완료되었습니다</h2><p>'+names[j.resource]+' · ['+j.result.x+', '+j.result.y+']　보고서를 열어 상세 결과를 확인하세요.</p></div><button data-sc-report="'+j.id+'">결과보고 <span>↗</span></button></section>';}
function update(host,j){host.querySelectorAll('[data-scan-percent]').forEach(e=>{const text=String(Math.floor(j.progress));if(e.textContent!==text)e.textContent=text;});host.querySelectorAll('[data-acquisition]').forEach(e=>{e.style.setProperty('--scan-progress',j.progress);e.classList.toggle('is-paused',j.status!=='running');e.querySelector('[data-sc-stop]').hidden=j.status!=='running';e.querySelector('[data-sc-start]').hidden=j.status!=='paused';e.querySelector('[data-scan-state]').textContent=j.status==='paused'?'중지 · 진행 보존':'관측 중';});host.querySelectorAll('[data-scan-fill]').forEach(e=>e.style.width=j.progress+'%');host.querySelectorAll('[data-stage]').forEach(e=>e.classList.toggle('is-complete',j.progress>=+e.dataset.stage));host.querySelectorAll('[data-reveal-at]').forEach(e=>e.classList.toggle('mr-locked',j.progress<+e.dataset.revealAt));const log=host.querySelector('[data-scan-log]');if(log&&log.dataset.count!==String(j.log.length)){log.innerHTML=j.log.slice(-3).map(l=>'<li>'+E(l)+'</li>').join('');log.dataset.count=j.log.length;}}
const mounted=new WeakMap(),views=new Set(),boundHosts=new WeakSet();let raf=0,last=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function draw(v,time){const c=v.canvas,rect=c.getBoundingClientRect();if(!rect.width||!rect.height)return;const d=Math.min(devicePixelRatio||1,1.75),width=Math.round(rect.width*d),height=Math.round(rect.height*d);if(c.width!==width||c.height!==height){c.width=width;c.height=height;}const x=c.getContext('2d');if(!x)return;x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,rect.width,rect.height);const w=rect.width,h=rect.height,cx=w/2,cy=h*.5,scale=Math.min(w,h)*.35,t=reduced.matches?0:time*.00012;
 if(v.kind==='resource'){
  const model=v.model;if(!model)return;
  const tau=Math.PI*2,radius=Math.min(w,h)*.46,sweep=(reduced.matches?0:time/10500*tau)%tau;
  const focus=c.closest('.mr-resource')?.dataset.radarFocus||'';
  const point=(a,r)=>[cx+Math.cos(a-Math.PI/2)*radius*r,cy+Math.sin(a-Math.PI/2)*radius*r];
  // Exact concentric circular arcs, with irregular gaps and unequal radii.
  for(const ribbon of model.arcs){
   const selected=focus==='type'&&ribbon.category===model.index;
   x.beginPath();for(let k=0;k<=70;k++){const a=ribbon.start+ribbon.span*k/70,r=carrierRadius(ribbon.category,a,model.phase)+ribbon.offset,p=point(a,r);if(k===0)x.moveTo(...p);else x.lineTo(...p);}
   x.strokeStyle=selected?'#f4b27f':ribbon.category===model.index?'#b5d7dcaa':'#85aeb578';x.lineWidth=selected?1.2:ribbon.width;x.stroke();
   if(ribbon.width>.8){const a=ribbon.start,pt=point(a,carrierRadius(ribbon.category,a,model.phase)+ribbon.offset);x.beginPath();x.arc(...pt,1.5,0,tau);x.stroke();}
  }
  x.setLineDash([2,5]);x.lineWidth=.7;x.strokeStyle='#b6d6dc50';
  x.beginPath();x.arc(cx,cy,radius*model.frequency,0,tau);x.stroke();x.setLineDash([]);
  // Continuous fine carriers mark the exact occupied angles; spikes add texture, not quantity.
  for(const sector of model.sectors){if(!sector.span)continue;x.beginPath();x.arc(cx,cy,radius*model.frequency,sector.start-Math.PI/2,sector.start+sector.span-Math.PI/2);x.strokeStyle=focus==='reserve'?'#f4b27f':'#dcecef';x.lineWidth=1;x.stroke();}
  // Asymmetric outer annotations, not another enclosing ring.
  for(let k=0;k<37;k++){const a=model.center+1.4+k*.026,r=.98;
   x.beginPath();x.moveTo(...point(a,r));x.lineTo(...point(a,r+(k%6===0?.023:.009)));x.strokeStyle='#a9c9ce70';x.lineWidth=k%6===0?1:.5;x.stroke();}
  // Radius is frequency, never depth. Signal positions stay fixed while clockwise sectors refresh.
  let highlighted=0;
  model.returns.forEach((p,i)=>{
   const angle=p.angle-Math.PI/2,age=(sweep-p.angle+tau)%tau;
   const cycle=reduced.matches?0:Math.floor(time/10500-p.angle/tau);
   if(!p.target&&p.cycle!==cycle){
    const random=rng((v.seed^Math.imul(i+1,2654435761)^Math.imul(cycle+1,1597334677))>>>0),action=random();
    // Keep existing geometry, remove it, or add a new return only as this sector is scanned.
    if(action<.25)p.present=false;
    else if(action<.55){p.present=true;p.frequency=p.baseFrequency+.012*Math.sin(cycle*.8+p.group);p.length=p.baseLength*(.85+.3*random());}
    p.cycle=cycle;
   }
   if(!p.target&&!p.present)return;
   // Keep each cluster intact, but show it only on alternating sweeps: half the appearance rate.
   if(!p.target&&((cycle+p.group)%2+2)%2!==0)return;
   const isBand=p.category===model.index;
   const active=focus==='type'?isBand:focus==='reserve'?p.cluster:false;
   if(active)highlighted++;
   const seconds=age/tau*10.5,glow=reduced.matches?0:flashAlpha(seconds);
   const alpha=active||p.target?1:reduced.matches?.5:Math.max(glow,Math.pow(1-age/tau,p.kind==='arc'?.7:1.4)*.72);
   if(alpha<=0)return;
   x.shadowColor=active?'#ffd3a4':'#dcfaff';x.shadowBlur=glow*9;
   x.strokeStyle=active?'#f4b27f':'rgba(239,247,249,'+Math.min(1,alpha)+')';
   x.lineWidth=active?p.width+ .5:p.width;
   const half=p.length/2,lo=Math.max(.06,p.frequency-half),hi=Math.min(1.02,p.frequency+half);
   x.beginPath();
   if(p.kind==='arc'){
    x.arc(cx,cy,radius*p.frequency,p.angle-Math.PI/2,p.angle+p.arcLength-Math.PI/2);x.stroke();
   }else if(p.kind==='dot'){
    const pt=point(p.angle,p.frequency);x.arc(...pt,Math.max(.65,radius*.004*(1+.5*Math.sin(p.angle*6))),0,tau);x.fillStyle=x.strokeStyle;x.fill();
   }else{x.moveTo(...point(p.angle,lo));x.lineTo(...point(p.angle,hi));x.stroke();}
  });
  x.shadowBlur=0;
  c.dataset.highlightCount=String(highlighted);c.dataset.sweep=sweep.toFixed(4);
  // Fixed-in-space circuit traces. Erasure advances along path length, never alpha.
  if(!reduced.matches){
   for(const circuit of updateTraces(v,time)){
    const age=(time-circuit.birth)/1000,cutoff=time/1000*scanSpeed;
    const erased=clamp((age-circuit.duration-circuit.hold)/circuit.erase,0,1)*circuit.length;let distance=0;
    x.strokeStyle='#a1dce2';x.lineWidth=.85;
    for(const s of circuit.segments){
     const start=clamp((erased-distance)/s.length,0,1),end=s.kind==='arc'?clamp((cutoff-s.a)/(s.b-s.a),0,1):(cutoff>=s.a?1:0);distance+=s.length;
     if(start>=end)continue;x.beginPath();
     if(s.kind==='arc'){x.arc(cx,cy,radius*s.r,s.a+(s.b-s.a)*start-Math.PI/2,s.a+(s.b-s.a)*end-Math.PI/2);}
     else{x.moveTo(...point(s.a,s.r+(s.end-s.r)*start));x.lineTo(...point(s.a,s.r+(s.end-s.r)*end));}x.stroke();
    }
    if(age>=circuit.duration&&erased<circuit.length*.95&&circuit.cap){const last=circuit.segments.at(-1);x.beginPath();x.arc(...point(last.b,last.r),1.5,0,tau);if(circuit.cap===1)x.stroke();else{x.fillStyle='#a1dce2';x.fill();}}
   }
  }
  // The invisible needle still drives clockwise refresh and trace birth.
  x.strokeStyle='#6b9da570';x.lineWidth=.6;
  x.beginPath();x.moveTo(cx-4,cy);x.lineTo(cx+4,cy);x.moveTo(cx,cy-4);x.lineTo(cx,cy+4);x.stroke();
 }else{
  const project=(a,b,z)=>{const rx=a*Math.cos(t)-b*Math.sin(t),ry=a*Math.sin(t)+b*Math.cos(t);return[cx+rx*scale,cy+ry*scale*.34-z*scale*.55+scale*.15];};
  for(let row=-12;row<=12;row++){x.beginPath();for(let col=-16;col<=16;col++){const a=col/16,b=row/12,z=.16+.68*Math.exp(-((a-.32)**2+(b+.12)**2)*5)+.36*Math.exp(-((a+.55)**2+(b-.2)**2)*12)+Math.sin(a*6+b*3+v.seed%6)*.045;const p=project(a,b,z);if(col===-16)x.moveTo(...p);else x.lineTo(...p);}x.strokeStyle='rgba(114,190,220,'+(.3+(row+12)/60)+')';x.lineWidth=.8;x.stroke();}
  for(let col=-16;col<=16;col+=2){x.beginPath();for(let row=-12;row<=12;row++){const a=col/16,b=row/12,z=.16+.68*Math.exp(-((a-.32)**2+(b+.12)**2)*5)+.36*Math.exp(-((a+.55)**2+(b-.2)**2)*12)+Math.sin(a*6+b*3+v.seed%6)*.045,p=project(a,b,z);if(row===-12)x.moveTo(...p);else x.lineTo(...p);}x.strokeStyle='#3d7c9b65';x.stroke();}
  for(let k=0;k<3;k++){x.beginPath();x.ellipse(cx,cy+scale*.28,scale*(1.07+k*.16),scale*(.27+k*.045),0,0,Math.PI*2);x.strokeStyle=k?'#5599ae77':'#85d7d5';x.setLineDash(k===2?[12,17]:[]);x.lineDashOffset=-time*.006;x.stroke();}x.setLineDash([]);
 }
}
function frame(t){
 raf=0;
 if(t-last>32){last=t;for(const v of [...views]){
  if(!v.canvas.isConnected){v.observer.disconnect();v.resize.disconnect();views.delete(v);mounted.delete(v.canvas);continue;}
  if(v.visible&&!document.hidden)draw(v,t);
 }}
 if([...views].some(v=>v.visible)&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&views.size)raf=requestAnimationFrame(frame);}
function mount(host){
 if(!host.isConnected)return;
 if(!boundHosts.has(host)){
  boundHosts.add(host);
  const focus=(e,on)=>{const field=e.target.closest('.mr-resource-field[data-radar-focus]');if(!field)return;
   if(!on&&field.contains(e.relatedTarget))return;
   const section=field.closest('.mr-resource');section.dataset.radarFocus=on?field.dataset.radarFocus:'';
   const view=mounted.get(section.querySelector('canvas'));if(view){draw(view,performance.now());wake();}
  };
  host.addEventListener('pointerover',e=>focus(e,true));host.addEventListener('pointerout',e=>focus(e,false));
  host.addEventListener('focusin',e=>focus(e,true));host.addEventListener('focusout',e=>focus(e,false));
 }
 for(const canvas of host.querySelectorAll('[data-holo]')){
  if(mounted.has(canvas))continue;
  const job=jobModels.get(canvas.dataset.job),v={canvas,kind:canvas.dataset.holo,seed:+canvas.dataset.seed,visible:false,model:job?signalModel(job):null};
  v.observer=new IntersectionObserver(es=>{v.visible=es[0].isIntersecting;if(v.visible){draw(v,performance.now());wake();}},{root:host.querySelector('.scanner-app')||null});
  v.resize=new ResizeObserver(()=>{if(v.visible){draw(v,performance.now());wake();}});
  mounted.set(canvas,v);views.add(v);v.observer.observe(canvas);v.resize.observe(canvas);
 }
 wake();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});reduced.addEventListener('change',()=>{for(const v of views)if(v.visible)draw(v,0);if(!reduced.matches)wake();});
function enter(host){const el=host.querySelector('.mr-report');if(el&&!reduced.matches){el.classList.add('mr-enter');setTimeout(()=>{if(el.isConnected)el.classList.remove('mr-enter');},3600);}}
window.MineralReport={report,progress,gate,update,mount,enter,rockModel,signalModel,transitionStrength,geologyCatalog,heatModel,resultData,identifier,reserveRanges,initializeResult,trailWindow,flashAlpha,carrierRadius,traceCandidate,tracesOverlap,updateTraces};
})();
