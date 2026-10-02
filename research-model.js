'use strict';
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.ResearchModel=m;})(globalThis,()=>{
const FIELDS={energy:{name:'전력 · 기반',color:'#c3b57e'},industry:{name:'채굴 · 정제',color:'#8cb7a0'},logistics:{name:'탐사 · 물류',color:'#83aec1'},defense:{name:'군수 · 방어',color:'#b696b9'}};
const TECHS=[];
function branch(field,items){items.forEach((t,i)=>TECHS.push({id:field+'-'+i,field,name:t[0],major:i===0||i===4,col:i===0?0:i===4?2:1,row:i===0||i===4?1:i-1,prereqs:i===0?[]:i===4?[field+'-1',field+'-2']:[field+'-0'],work:[36,48,60,54,120][i],cost:{iron:[60,40,60,45,140][i],copper:[30,25,35,30,80][i],gold:i===4?3:0},effect:t[1],key:t[2],value:t[3],description:t[4]}));}
branch('energy',[
['분산 발전 설계','태양광·풍력 시설 해금','renewables',true,'본부 밖에도 독립 발전설비를 설치할 수 있는 기반 기술입니다.'],
['발전 제어 I','발전 출력 +10%','powerOutput',.10,'같은 발전설비로 공급 가능한 전력을 늘립니다.'],
['고밀도 셀 I','배터리 용량 +15%','batteryCapacity',.15,'동일한 팩 수로 더 긴 공급 간격을 견딜 수 있습니다.'],
['송전 최적화 I','송전 손실 계수 −10%','transmissionLoss',-.10,'손실률 자체에서 10%p를 빼는 것이 아니라 손실 계수를 0.9배로 만듭니다.'],
['배터리 교환소','배터리 정기 보급 기능 해금','batteryDepot',true,'원격 노드에 충전 팩을 보내고 빈 팩을 회수하는 설비를 해금합니다.']
]);
branch('industry',[
['현장 정제 설계','현장 정제시설 해금','fieldRefinery',true,'원광을 현장에서 정제해 운송량과 물류 부담을 줄일 수 있게 합니다.'],
['선별 공정 I','채굴 처리량 +10%','miningRate',.10,'채굴 설비의 원광 처리량을 높입니다. 매장량은 늘어나지 않습니다.'],
['회수 공정 I','정제 회수율 +5%p · 최대 100%','recoveryPoints',.05,'회수율 90%를 95%로 개선합니다. 원광 순도와 별개입니다.'],
['저전력 구동 I','가공 전력 수요 −8%','processingPower',-.08,'같은 생산량에 필요한 전력을 줄이는 개선입니다.'],
['정밀 제조소','전자부품 제조시설 해금','electronicsPlant',true,'정제재를 사용해 관제·군수용 전장품을 제조하는 시설을 해금합니다.']
]);
branch('logistics',[
['항로 관제','정기항로 자동 운항 해금','routeControl',true,'거점 사이의 반복 운항과 적재 정책을 사용할 수 있게 합니다.'],
['적재 최적화 I','수송선 화물 용량 +10%','cargoCapacity',.10,'같은 선박으로 운반하는 양을 늘립니다. 속도는 바뀌지 않습니다.'],
['광역 탐지 I','탐사 범위 +12%','scanRadius',.12,'조사 가능한 센서 반경을 넓힙니다. 미발견 자원은 즉시 공개되지 않습니다.'],
['항행 효율 I','항해 연료 소비 −8%','fuelUsage',-.08,'같은 거리와 편성에 필요한 연료를 줄입니다. 귀환 연료 예약은 유지합니다.'],
['심해 중계소','장거리 탐사 중계시설 해금','deepRelay',true,'더 먼 해역의 탐사와 통신을 지원하는 거점을 해금합니다.']
]);
branch('defense',[
['군수 기반','방어포대·기본 전투함 해금','militaryWorks',true,'기지 방어와 호위 전력을 생산하기 위한 기반 기술입니다.'],
['장갑 설계 I','함선 내구 +10%','hullStrength',.10,'동일한 함종의 내구를 개선합니다. 전투 승리를 보장하지는 않습니다.'],
['화력 통제 I','기본 무장 피해 +8%','weaponDamage',.08,'무장별 기초 피해량에 적용되는 보너스입니다.'],
['정비 규격 I','수리 재료 소모 −10%','repairCost',-.10,'손상된 함선을 복구하는 자원 비용을 줄입니다.'],
['특수 임무 조선소','특수 임무함·아티팩트 적재 해금','specialShipyard',true,'일반 화물과 별도의 임무 적재 기능을 가진 함선을 해금합니다.']
]);

Object.assign(FIELDS,{computing:{name:'연산 · 자동화',color:'#a7add0'},construction:{name:'건설 · 거점',color:'#b8a17c'},trade:{name:'교역 · 외교',color:'#bca889'},anomaly:{name:'심해 · 유물',color:'#99b5bd'}});
const majorNames={
energy:['분산 발전 설계','배터리 교환소','해상 변전소','지열 발전소','고압 송전선','해류 발전기','수소 저장소','비상 전력 제어실','광역 전력 관제소','에너지 자립 프로토콜'],
industry:['현장 정제 설계','정밀 제조소','복합 선별장','합금 제련소','가스 정제소','촉매 제조소','모듈 조립 공장','심층 채굴 플랫폼','폐자원 재처리장','통합 제조 단지'],
logistics:['항로 관제','심해 중계소','자동 하역장','장거리 항법실','해상 보급소','다중 경유 운항','위험 해역 우회 제어','원격 구조 기지','대형 물류 허브','전역 운송 관제'],
defense:['군수 기반','특수 임무 조선소','함선 개장소','어뢰 방어망','전자전 장비소','무인 초계기지','중형 함선 조선소','원정 보급 지휘소','기동 방어 전대','전략 함대 사령부'],
computing:['연산코어 제작소','병렬 작업 제어','조건부 명령 편집기','원격 작업 스케줄러','장애 복구 제어','예측 부하 관제','분산 연산 중계','작전 시뮬레이터','자율 운영 정책실','통합 관제 커널'],
construction:['해상 기초 공법','모듈식 거점','수중 저장고','부유식 확장 도크','원격 건설함','내압 구조물','현장 수리소','재난 차단 구획','이동식 전진기지','자립 해상 도시'],
trade:['교역 통신소','거래 계약실','정기 교역 항로','광역 시세 수신기','중립항 접근권','장기 공급 계약','전문가 교류소','공동 탐사 협약','희귀 자원 경매소','해상 교역 연합'],
anomaly:['심해 관측소','시료 분석실','유물 보관실','이상 신호 해독기','고압 탐사 장비','봉인 화물 운송','유적 조사 기지','고대 기록 복원실','심해 신호 중계','신호 발신지 접촉']
};
const improvement={energy:['공급 효율','powerEfficiency'],industry:['공정 효율','processEfficiency'],logistics:['하역 속도','loadingSpeed'],defense:['정비 속도','maintenanceSpeed'],computing:['연산 처리량','computeRate'],construction:['건설 속도','buildSpeed'],trade:['계약 보상','tradeReward'],anomaly:['시료 분석 속도','analysisSpeed']};
for(const [field,names]of Object.entries(majorNames)){
 let previous=null;
 names.forEach((name,i)=>{
 let tech=TECHS.find(t=>t.field===field&&t.major&&t.name===name);
 if(!tech){const id=field+'-major-'+i;tech={id,field,name,major:true,col:i+(TECHS.some(t=>t.id===field+'-0')?1:0),row:1,prereqs:previous?[previous]:[],work:60+i*45,cost:{iron:80+i*35,copper:40+i*20,gold:Math.floor(i/2)},effect:name+' 해금',key:id,value:true,description:name+'의 건설 또는 운영 기능을 사용할 수 있게 하는 주요 연구입니다. 해역 연동 전에는 해금 기록으로 확인합니다.'};TECHS.push(tech);
 const minor=improvement[field];TECHS.push({id:id+'-tuning',field,name:name+' · 운용 개선',major:false,col:i+(TECHS.some(t=>t.id===field+'-0')?1:0),row:2,prereqs:[id],work:40+i*20,cost:{iron:35+i*10,copper:20+i*5,gold:0},effect:minor[0]+' +2%',key:minor[1]+'-'+i,value:.02,description:name+'의 관련 운용에 적용할 '+minor[0]+' 개선 연구입니다. 경제 적용 범위와 중첩 규칙은 후속 밸런싱 대상입니다.'});
 }previous=tech.id;
 });
}


// All research lives on one graph. A prerequisite group means choose ANY one;
// distinct groups and prereqs are joined with AND.
const minorNames={
energy:['발전 제어 I','고밀도 셀 I','송전 최적화 I','절연 소재','부하 예측','열 회수','출력 평준화','변환 손실 제어','전력 수요 예측','냉각 최적화','자가 진단'],
industry:['선별 공정 I','회수 공정 I','저전력 구동 I','입도 분석','용탕 제어','촉매 활성화','불순물 분리','공정 동기화','잔류물 회수','정밀 공차','마모 예측'],
logistics:['적재 최적화 I','광역 탐지 I','항행 효율 I','해류 예측','하역 동기화','화물 규격화','항로 압축','선회 최적화','보급 수요 예측','접안 보정','센서 잡음 제거'],
defense:['장갑 설계 I','화력 통제 I','정비 규격 I','피해 통제','진동 감쇠','표적 추적','탄도 보정','통신 교란','열 흔적 억제','전대 동기화','예비 부품 규격'],
computing:['작업 분할','병렬 동기화','오류 검출','신호 보정','캐시 최적화','명령 압축','분산 합의','예외 처리','우선순위 예측','실행 추적'],
construction:['하중 분산','구조 보강','부식 억제','방수 접합','모듈 규격화','지반 분석','응력 해석','부력 제어','피로 수명 예측','시공 오차 보정'],
trade:['수요 분석','계약 표준화','신용 평가','위험 분산','물품 감정','언어 해독','협상 모형','보험 산정','공급 예측','정보 검증'],
anomaly:['시료 보존','분광 분석','신호 분리','패턴 대조','내압 검증','기록 분류','문맥 복원','위상 보정','오염 격리','잔향 분석']
};
const get=id=>TECHS.find(t=>t.id===id);
const dependencies=t=>[...t.prereqs,...(t.prereqGroups||[]).flat()];
const eligible=(t,done)=>t.prereqs.every(id=>done.includes(id))&&(t.prereqGroups||[]).every(g=>g.some(id=>done.includes(id)));
for(const field of Object.keys(FIELDS)){
 TECHS.filter(t=>t.field===field&&!t.major).forEach((t,i)=>{t.name=minorNames[field][i];t.description=t.name+'에 관한 개선 연구입니다. 메이저의 부속 항목이 아니며 지도에 표시된 선행 조건만 충족하면 직접 연구할 수 있습니다.';});
}
// Authored category-specific branches, not a shared rank/row template.
// a = major, b = minor. A repeated prefix denotes an intentional branch.
const treeDesigns={
energy:{title:'분산 전원에서 광역 관제로',shape:'주축 · 측면 분기',paths:[
'a0 b0 a2 b2 a4 a8','b0 b1 a1 b6','a2 b3 b4','a0 a5 b5 a3','a5 a6 b7 a7 b8','b8 b9','b8 b10'],gate:'any'},
industry:{title:'서로 다른 원료, 병렬 공정',shape:'병렬 공정 · 합류',paths:[
'b0 a0 b1 a1 b9','b0 a2 b3 a3 b4 a6','b3 b6 a8 b8','a4 b5 a5 b7 a7','a4 b2 b10'],gate:'all'},
logistics:{title:'항로를 따라 뻗는 운영 기술',shape:'항로 주축 · 지선',paths:[
'a0 b0 a2 b4 a5 b6 a6','a0 b2 a3 b3','a3 a4 b8','a5 a8 b9','b1 a1 b10','a1 a7 b5 b7'],gate:'any'},
defense:{title:'방호 · 화력 · 원정의 세 계통',shape:'삼지 확장',paths:[
'a0 b0 a2 b4 a6','a0 b1 b5 b6 a4 b7','a0 b2 b3 a3','a3 a5 a8 b8','b2 b10 a1 a7 b9'],gate:'all'},
computing:{title:'작은 명령에서 자율 운영으로',shape:'비대칭 연쇄',paths:[
'b0 a0 b1 a1 b4 a5','a1 a2 b7 a7','b2 b3 a3 b9 a4 b8 a8','a3 a6 b5 b6'],gate:'any'},
construction:{title:'구조물에서 독립 거점까지',shape:'층별 확장 · 측면 기술',paths:[
'b0 a0 b1 a1 b4 a3','a0 b2 b3 a2','a1 a4 b9 a6','b5 a5 b6 a7','a5 b7 a8 b8'],gate:'all'},
trade:{title:'계약 · 신용 · 정보의 연결',shape:'작은 계통들의 군집',paths:[
'a0 b0 a1 b1 a2','a1 a5 b8','b2 b3 a4 a7','a4 b6 a6','a3 b9 b4 a8','a3 b5 b7'],gate:'any'},
anomaly:{title:'관측에서 해독으로 이어지는 단서',shape:'깊이 확장 · 우회 탐구',paths:[
'a0 b0 a1 b1 a2 b8 a5','a0 a3 b2 b3 a7 b6','a3 b5 b9','b4 a4 a6 b7 a8'],gate:'all'}
};
function buildTree(field,index){
 const ts=TECHS.filter(t=>t.field===field),a=ts.filter(t=>t.major),b=ts.filter(t=>!t.major),design=treeDesigns[field];
 const ref=key=>(key[0]==='a'?a:b)[Number(key.slice(1))],children=new Map(ts.map(t=>[t.id,[]]));
 ts.forEach(t=>{t.prereqs=[];t.prereqGroups=[];});
 for(const path of design.paths){const nodes=path.split(' ').map(ref);nodes.forEach((t,i)=>{if(i){const parent=nodes[i-1];if(t.prereqs.length&&t.prereqs[0]!==parent.id)throw Error('Conflicting tree parent');t.prereqs=[parent.id];if(!children.get(parent.id).includes(t.id))children.get(parent.id).push(t.id);}});}
 const tips=[];let cursor=96;
 function place(t,x,depth){t.x=x;t.col=depth;const list=children.get(t.id);
 if(!list.length){t.y=cursor;cursor+=92;tips.push(t);}else{list.forEach((id,j)=>place(get(id),x+210+(list.length>1?j*12+index*3:0),depth+1));t.y=(get(list[0]).y+get(list[list.length-1]).y)/2;}
 t.row=t.y/92;
 }
 const roots=ts.filter(t=>t!==a[9]&&!t.prereqs.length);
 roots.forEach((root,i)=>{place(root,36+(i%2)*34,0);cursor+=60;});
 // Adjacent leaf branches converge outside the occupied tree, with separate ports.
 let pair=[tips[0],tips[1]],score=-1;
 for(let i=0;i<tips.length-1;i++){const value=Math.min(tips[i].col,tips[i+1].col)*100-Math.abs(tips[i].col-tips[i+1].col);if(value>score){score=value;pair=[tips[i],tips[i+1]];}}
 const goal=a[9];goal.x=Math.max(...ts.filter(t=>t!==goal).map(t=>t.x))+240;goal.y=(pair[0].y+pair[1].y)/2;goal.col=Math.max(...pair.map(t=>t.col))+1;goal.row=goal.y/92;
 if(design.gate==='any')goal.prereqGroups=[pair.map(t=>t.id)];else goal.prereqs=pair.map(t=>t.id);
 const width=goal.x+230,height=cursor+20;
 return{...design,width,height,roots:roots.map(t=>t.id),goal:goal.id};
}
const LAYOUTS=Object.fromEntries(Object.keys(FIELDS).map((field,i)=>[field,buildTree(field,i)]));
function connections(field){
 const ts=TECHS.filter(t=>t.field===field),layout=LAYOUTS[field],result=[];
 for(const t of ts){const deps=dependencies(t);deps.forEach((id,i)=>{const from=get(id),x=from.x+164,y=from.y+23,tx=t.x,ty=t.y+23;
 const merge=t.id===layout.goal,ey=ty+(i===0?-7:7),turn=tx-30-i*10;
 const d=merge?'M'+x+','+y+'H'+turn+'V'+ey+'H'+tx:'M'+x+','+y+'C'+(x+22)+','+y+' '+(tx-24)+','+ty+' '+tx+','+ty;
 result.push({from:id,to:t.id,d,alternative:(t.prereqGroups||[]).some(g=>g.includes(id))});
 });}return result;
}
function plan(lab,goal,choices={}){
 const ids=new Set(),edges=[],groups=[],cost={iron:0,copper:0,gold:0};let work=0;
 function visit(id){if(ids.has(id))return;ids.add(id);const t=get(id);if(!t||lab.completed.includes(id))return;
 const p=lab.projects[id];work+=Math.max(0,t.work-(p?.progress||0));if(!p)for(const k of Object.keys(cost))cost[k]+=t.cost[k]||0;
 // Already-paid projects retain their eligibility when migrating an older save.
 if(p)return;
 for(const from of t.prereqs){edges.push({from,to:id});visit(from);}
 (t.prereqGroups||[]).forEach((options,i)=>{const key=id+':'+i,chosen=options.find(x=>lab.completed.includes(x))||(options.includes(choices[key])?choices[key]:options[0]);groups.push({key,target:id,options,chosen});edges.push({from:chosen,to:id});visit(chosen);});
 }
 if(get(goal))visit(goal);return{ids:[...ids],edges,groups,cost,work};
}
class Lab{
constructor(){this.totalCores=8;this.budget={iron:1800,copper:1000,gold:24};this.projects={};this.completed=[];this.legacyProjects=[];}
used(){return Object.values(this.projects).filter(p=>p.status==='running').reduce((sum,p)=>sum+p.cores,0);}
status(id){return this.completed.includes(id)?'complete':this.projects[id]?.status||(get(id)&&eligible(get(id),this.completed)?'available':'locked');}
start(id,cores=1){const t=get(id);if(!t||!Number.isInteger(cores)||cores<1||cores>8)return{ok:false,error:'연산 투자량은 1–8코어입니다.'};const status=this.status(id);if(status==='complete'||status==='running')return{ok:false,error:'이미 완료되었거나 진행 중입니다.'};if(status==='locked')return{ok:false,error:'선행 연구가 필요합니다.'};if(this.used()+cores>this.totalCores)return{ok:false,error:'가용 연산코어가 부족합니다.'};if(!this.projects[id]){if(Object.entries(t.cost).some(([k,v])=>this.budget[k]<v))return{ok:false,error:'연구 예산이 부족합니다.'};for(const [k,v]of Object.entries(t.cost))this.budget[k]-=v;this.projects[id]={progress:0,cores,status:'paused'};}Object.assign(this.projects[id],{cores,status:'running'});return{ok:true};}
pause(id){const p=this.projects[id];if(p?.status==='running')p.status='paused';}
allocate(id,cores){const p=this.projects[id];if(!p||!Number.isInteger(cores)||cores<1||cores>8)return{ok:false,error:'올바른 코어 수를 지정하세요.'};if(p.status==='running'&&this.used()-p.cores+cores>8)return{ok:false,error:'가용 코어가 부족합니다.'};p.cores=cores;return{ok:true};}
tick(seconds){const done=[];if(!Number.isFinite(seconds)||seconds<=0)return done;for(const [id,p]of Object.entries(this.projects)){if(p.status!=='running')continue;const t=get(id);p.progress=Math.min(t.work,p.progress+seconds*p.cores);if(p.progress>=t.work){p.status='complete';if(!this.completed.includes(id))this.completed.push(id);done.push(id);}}return done;}
bonuses(){return this.completed.map(id=>get(id));}
save(){return JSON.stringify({version:3,legacyProjects:this.legacyProjects,budget:this.budget,projects:this.projects,completed:this.completed});}
static load(raw){const d=JSON.parse(raw);if(![1,2,3].includes(d.version)||!d.budget||!d.projects||!Array.isArray(d.completed))throw Error('저장 형식 오류');const lab=new Lab();for(const k of ['iron','copper','gold']){if(!Number.isFinite(d.budget[k])||d.budget[k]<0)throw Error('예산 오류');lab.budget[k]=d.budget[k];}
if(new Set(d.completed).size!==d.completed.length||d.completed.some(id=>!get(id)))throw Error('완료 기록 오류');
lab.completed=[...d.completed];
const legacy=d.version<3?Object.keys(d.projects):(d.legacyProjects||[]);if(!Array.isArray(legacy)||new Set(legacy).size!==legacy.length||legacy.some(id=>!get(id)||!Object.hasOwn(d.projects,id)))throw Error('이전 연구 기록 오류');lab.legacyProjects=[...legacy];
for(const [id,p]of Object.entries(d.projects)){const t=get(id);if(!t||!Number.isFinite(p.progress)||p.progress<0||p.progress>t.work||!Number.isInteger(p.cores)||p.cores<1||p.cores>8||!['running','paused','complete'].includes(p.status))throw Error('진행 기록 오류');if(!legacy.includes(id)&&!eligible(t,lab.completed))throw Error('선행 연구 오류');const complete=lab.completed.includes(id);if(complete!==(p.progress===t.work)||complete!==(p.status==='complete'))throw Error('진행 불일치');lab.projects[id]={progress:p.progress,cores:p.cores,status:complete?'complete':'paused'};}
if(lab.completed.some(id=>!lab.projects[id]))throw Error('완료 자료 없음');return lab;}
}
return{FIELDS,TECHS,get,dependencies,eligible,plan,Lab,LAYOUTS,connections};
});
