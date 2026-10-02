'use strict';
(()=>{
const M=ResearchModel,pane=Workspace.ensurePane('research'),storageKey='pelagic-research-v1';
let lab=new M.Lab(),selected='energy-0',filter='energy',draft=2,view='tree',query='',goal=null,choices={},zoom=1;
try{const raw=localStorage.getItem(storageKey);if(raw)lab=M.Lab.load(raw);}catch{toast('연구 저장을 읽지 못했습니다. 원본은 유지하며 새 시험 상태로 열었습니다.');}
try{const saved=JSON.parse(localStorage.getItem('pelagic-research-plan-v2'));if(saved&&M.get(saved.goal)){goal=saved.goal;selected=goal;filter=M.get(goal).field;choices=saved.choices||{};}}catch{}
function savePlan(){try{localStorage.setItem('pelagic-research-plan-v2',JSON.stringify({goal,choices}));}catch{toast('연구 경로를 저장하지 못했습니다.');}}
const names={iron:'철재',copper:'구리',gold:'금'},states={locked:'잠김',available:'연구 가능',running:'진행 중',paused:'보류',complete:'완료'};
const fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:1});
const cost=t=>Object.entries(t.cost).filter(([,v])=>v).map(([k,v])=>names[k]+' '+v).join(' · ')||'없음';
function save(){try{localStorage.setItem(storageKey,lab.save());return true;}catch{toast('연구 저장 공간이 부족하거나 사용할 수 없습니다.');return false;}}
function button(t,route){
const st=lab.status(t.id),p=lab.projects[t.id],pct=p?Math.round(p.progress/t.work*100):0;
return '<button class="rt-tech '+(t.major?'major ':'minor ')+st+(selected===t.id?' chosen':'')+(route?.ids.includes(t.id)?' on-route':'')+(goal===t.id?' goal':'')+'" data-tech-id="'+t.id+'" style="left:'+t.x+'px;top:'+t.y+'px" aria-label="'+t.name+' '+states[st]+'" title="'+t.name+' / '+(t.major?'메이저':'마이너')+' / '+states[st]+' / '+t.effect+' / '+cost(t)+'"><strong>'+t.name+'</strong><small>'+(t.major?'해금':'개선')+' · '+fmt(t.work)+' RP'+(st==='complete'?' · 완료':st==='running'?' · 진행':st==='paused'?' · 보류':'')+'</small>'+(p?'<span class="rt-progress"><i style="width:'+pct+'%"></i></span>':'')+'</button>';
}
function tree(){
if(query){const matches=M.TECHS.filter(t=>(filter==='all'||t.field===filter)&&(t.name+t.effect).includes(query));return '<div class="rt-ledger"><h2>검색 결과 · '+matches.length+'</h2>'+matches.map(t=>'<button data-tech-id="'+t.id+'"><strong>'+t.name+'</strong><span>'+t.effect+' · '+states[lab.status(t.id)]+'</span></button>').join('')+'</div>';}
const route=goal?M.plan(lab,goal,choices):null;
return Object.entries(M.FIELDS).filter(([id])=>filter==='all'||filter===id).map(([id,f])=>{
const ts=M.TECHS.filter(t=>t.field===id),layout=M.LAYOUTS[id];
const wires=M.connections(id).map(e=>{
const chosen=route?.edges.some(p=>p.from===e.from&&p.to===e.to);
return '<path data-from="'+e.from+'" data-to="'+e.to+'" class="'+(lab.completed.includes(e.from)?'met ':'')+(e.alternative?'alternative ':'')+(chosen?'route':'')+'" marker-end="url(#rt-arrow-'+id+')" d="'+e.d+'"><title>'+M.get(e.from).name+' → '+M.get(e.to).name+(e.alternative?' (택일)':' (필수)')+'</title></path>';
}).join('');
return '<section class="rt-branch" style="width:'+layout.width+'px;height:'+layout.height+'px;zoom:'+zoom+';--rt-color:'+f.color+'"><header class="rt-map-heading"><span>'+layout.shape+'</span><h3>'+layout.title+'</h3><small>메이저 10 / 마이너 '+ts.filter(t=>!t.major).length+' · 왼쪽에서 오른쪽으로 연구</small></header><svg class="rt-wires" width="'+layout.width+'" height="'+layout.height+'" aria-hidden="true"><defs><marker id="rt-arrow-'+id+'" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#82938c" stroke="none"/></marker></defs>'+wires+'</svg>'+ts.map(t=>button(t,route)).join('')+'<span class="rt-gate" style="left:'+(M.get(layout.goal).x-60)+'px;top:'+(M.get(layout.goal).y-5)+'px">'+(layout.gate==='any'?'택일':'모두')+'</span></section>';
}).join('');
}
function highlight(id){
const branch=pane.querySelector('.rt-branch');if(!branch)return;
if(!id){branch.classList.remove('tracing');return;}
const relevant=new Set();function visit(key){if(relevant.has(key))return;relevant.add(key);M.dependencies(M.get(key)).forEach(visit);}visit(id);
branch.classList.add('tracing');
branch.querySelectorAll('.rt-tech').forEach(el=>el.classList.toggle('trace',relevant.has(el.dataset.techId)));
branch.querySelectorAll('path[data-from]').forEach(el=>el.classList.toggle('trace',relevant.has(el.dataset.from)&&relevant.has(el.dataset.to)));
}
function planner(){
if(!goal)return '<section class="rt-plan"><h4>나의 연구 경로</h4><p>목표 메이저를 선택한 뒤 ‘목표로 지정’을 누르세요. 마이너도 지도에서 직접 연구할 수 있습니다.</p></section>';
const plan=M.plan(lab,goal,choices);
return '<section class="rt-plan"><h4>목표 / '+M.get(goal).name+'</h4><button data-research-action="show-goal">지도에서 목표 보기</button> <button data-research-action="clear-goal">해제</button><p>남은 '+fmt(plan.work)+' RP · 추가 비용 '+cost({cost:plan.cost})+'</p><small>중복 선행은 한 번만 계산 · 지불한 비용 제외 · 기본 경로는 최적 경로가 아닙니다. 택일 조건에서 원하는 기술을 선택하세요.</small>'+plan.groups.map(g=>'<label class="rt-route-choice">'+M.get(g.target).name+' / 하나 필요<select aria-label="'+M.get(g.target).name+' 경로 선택" data-route-choice="'+g.key+'">'+g.options.map(id=>'<option value="'+id+'" '+(id===g.chosen?'selected':'')+'>'+M.get(id).name+(lab.completed.includes(id)?' · 완료':'')+'</option>').join('')+'</select></label>').join('')+'<p class="rt-route-note">계획만 표시합니다. 연구는 선택한 항목에서 직접 시작합니다.</p></section>';
}
function details(){
const t=M.get(selected),p=lab.projects[t.id],st=lab.status(t.id),cores=p?.cores||draft,remaining=Math.max(0,t.work-(p?.progress||0));
const link=id=>'<button data-tech-id="'+id+'" class="rt-prereq">'+(lab.completed.includes(id)?'✓ ':'○ ')+M.get(id).name+'</button>';
const prereq=(t.prereqs.length?'<small>아래 항목 모두 필요</small>'+t.prereqs.map(link).join(''):'')+(t.prereqGroups||[]).map(g=>'<div class="rt-or"><small>이 묶음에서 하나만 필요 (OR)</small>'+g.map(link).join('')+'</div>').join('')||'없음 · 독립 기반 연구';
return '<div class="rt-detail-head"><span>'+M.FIELDS[t.field].name+' / '+(t.major?'MAJOR':'MINOR')+'</span><h2>'+t.name+'</h2><b>'+states[st]+'</b></div>'+(t.major?'<button class="rt-goal-button" data-research-action="goal">'+(goal===t.id?'현재 목표 연구':'목표로 지정')+'</button>':'')+'<p>'+t.description+'</p><section><h4>연구 효과</h4><div class="rt-bonus">'+t.effect+'</div><small>완료 시 연구 기록에 적용됩니다. 실제 해역·시설 효과 연결은 후속 단계입니다.</small></section><section><h4>선행 조건</h4>'+prereq+'</section><section><h4>연구 비용</h4><p>'+cost(t)+'</p><small>'+(p?'지불 완료 · 재개 시 추가 비용 없음':'연구 시작 시 1회 지불 · 보류해도 환불하지 않음')+'</small></section><section><h4>연산 투자</h4><label>배정 코어 <input id="rtCoreInput" aria-label="연구 배정 코어" type="number" min="1" max="8" value="'+cores+'" '+(st==='complete'?'disabled':'')+'></label><dl><dt>필요 연구량</dt><dd>'+t.work+' RP</dd><dt>누적 / 남은 연구량</dt><dd>'+fmt(p?.progress||0)+' / '+fmt(remaining)+' RP</dd><dt>연산 처리 속도</dt><dd>'+cores+' RP / 게임초</dd><dt>예상 남은 시간</dt><dd>'+fmt(remaining/cores)+' 게임초'+(st==='paused'?' · 재개 기준':'')+'</dd></dl><small>연구량은 고정이며, 투자한 연산에 비례해 시간이 줄어듭니다. 1코어 = 1 RP/게임초. 해역 코어와 별도의 시험 예산입니다.</small></section><div class="rt-detail-actions">'+(st==='running'?'<button data-research-action="pause">보류 · 코어 반환</button><button data-research-action="allocate">투자 변경</button>':st==='complete'?'<span>✓ 연구 완료 · 효과 기록됨</span>':'<button data-research-action="start" '+(st==='locked'?'disabled':'')+'>'+(st==='paused'?'연구 재개':'연구 시작')+'</button>')+'</div>';
}
function render(){
const left=pane.querySelector('.rt-canvas')?.scrollLeft||0,top=pane.querySelector('.rt-canvas')?.scrollTop||0,detailTop=pane.querySelector('.rt-details')?.scrollTop||0;
pane.innerHTML='<div class="research-app"><div class="rt-top"><b>RESEARCH ARCHIVE / 연구</b><span>연산 '+lab.used()+' / 8</span><span>'+Object.entries(lab.budget).map(([k,v])=>names[k]+' '+fmt(v)).join(' · ')+'</span><button data-research-action="save">연구 저장</button><button data-research-action="reload">불러오기</button></div><div class="rt-nav"><button data-research-view="tree" aria-pressed="'+(view==='tree')+'">연구 트리</button><button data-research-view="bonuses" aria-pressed="'+(view==='bonuses')+'">완료 효과 '+lab.completed.length+'</button><div class="rt-chips" role="group" aria-label="연구 분야">'+Object.entries(M.FIELDS).map(([id,f])=>'<button data-research-category="'+id+'" aria-pressed="'+(filter===id)+'">'+f.name+' <small>10</small></button>').join('')+'</div><input id="rtSearch" aria-label="연구 검색" placeholder="연구명·효과 검색" value="'+esc(query)+'"><button data-research-action="fit">전체 보기</button><button data-research-action="zoom-out" aria-label="연구 지도 축소">−</button><button data-research-action="reset-view">100%</button><button data-research-action="zoom-in" aria-label="연구 지도 확대">+</button><span>실선 필수 · 점선 택일 / 연구를 가리켜 선행 경로 확인</span></div><div class="rt-body"><div class="rt-canvas" tabindex="0" aria-label="연구 트리 · 스크롤 또는 빈 공간 드래그">'+(view==='tree'?tree():'<div class="rt-ledger"><h2>완료된 연구 효과</h2><p>이 목록은 연구 시험 상태입니다. 아직 해역·생산 수치에는 반영되지 않습니다.</p>'+(lab.bonuses().map(t=>'<button data-tech-id="'+t.id+'"><strong>'+t.name+'</strong><span>'+t.effect+'</span></button>').join('')||'<p>완료한 연구가 없습니다.</p>')+'</div>')+'</div><aside class="rt-details">'+(goal?planner():'')+details()+(!goal?planner():'')+'</aside></div><div class="rt-foot">연구 시험판 · 자동 저장 · 재접속 시 진행 연구는 보류 · 종료 중 시간 미반영 · 해역 일시정지/배속 따름</div></div>';
pane.querySelector('.rt-canvas').scrollTo(left,top);pane.querySelector('.rt-details').scrollTop=detailTop;
}
function act(a){
const cores=Number(pane.querySelector('#rtCoreInput').value);let result;
if(a==='goal'){goal=selected;choices={};savePlan();render();return;}
if(a==='clear-goal'){goal=null;choices={};savePlan();render();return;}
if(a==='show-goal'){selected=goal;filter=M.get(goal).field;query='';view='tree';render();pane.querySelector('[data-tech-id="'+goal+'"].rt-tech')?.scrollIntoView({block:'center',inline:'center'});return;}
if(['fit','zoom-in','zoom-out','reset-view'].includes(a)){const c=pane.querySelector('.rt-canvas'),layout=M.LAYOUTS[filter];zoom=a==='fit'?Math.max(.4,Math.min(1,(c.clientWidth-40)/layout.width,(c.clientHeight-30)/layout.height)):a==='reset-view'?1:Math.max(.4,Math.min(1.6,zoom+(a==='zoom-in'?.1:-.1)));render();pane.querySelector('.rt-canvas').scrollTo(0,0);return;}
if(a==='start')result=lab.start(selected,cores);
if(a==='pause')lab.pause(selected);
if(a==='allocate')result=lab.allocate(selected,cores);
if(a==='save'){if(save())toast('연구 상태를 저장했습니다.');return;}
if(a==='reload'){try{lab=M.Lab.load(localStorage.getItem(storageKey));toast('연구 복원 · 진행 중 항목은 보류됩니다.');}catch{toast('유효한 저장이 없습니다. 현재 상태를 유지합니다.');}render();return;}
if(result&&!result.ok){toast(result.error);return;}save();render();
}
pane.addEventListener('click',e=>{const chip=e.target.closest('[data-research-category]');if(chip){filter=chip.dataset.researchCategory;selected=M.TECHS.find(t=>t.field===filter).id;query='';zoom=1;render();return;}const t=e.target.closest('[data-tech-id]');if(t){selected=t.dataset.techId;draft=lab.projects[selected]?.cores||2;render();highlight(selected);return;}const v=e.target.closest('[data-research-view]');if(v){view=v.dataset.researchView;render();return;}const a=e.target.closest('[data-research-action]');if(a)act(a.dataset.researchAction);});
pane.addEventListener('change',e=>{if(e.target.matches('[data-route-choice]')){choices[e.target.dataset.routeChoice]=e.target.value;savePlan();render();return;}if(e.target.id==='rtCategory'){filter=e.target.value;render();}if(e.target.id==='rtSearch'){query=e.target.value.trim().slice(0,100);render();}if(e.target.id==='rtCoreInput'){draft=Math.max(1,Math.min(8,Math.floor(Number(e.target.value)||1)));e.target.value=draft;const p=lab.projects[selected];if(!p||p.status!=='running'){if(p)p.cores=draft;render();}else{const remain=M.get(selected).work-p.progress;const dd=pane.querySelectorAll('.rt-details dd');dd[2].textContent=draft+' RP / 게임초';dd[3].textContent=fmt(remain/draft)+' 게임초 · 투자 변경 시 적용';}}});
pane.addEventListener('pointerover',e=>{const node=e.target.closest('.rt-tech');if(node)highlight(node.dataset.techId);});
pane.addEventListener('pointerout',e=>{if(e.target.closest('.rt-tech')&&!e.relatedTarget?.closest?.('.rt-tech'))highlight(null);});
pane.addEventListener('focusin',e=>{if(e.target.matches('.rt-tech'))highlight(e.target.dataset.techId);});
pane.addEventListener('focusout',e=>{if(e.target.matches('.rt-tech'))highlight(null);});
pane.addEventListener('wheel',e=>{const c=e.target.closest('.rt-canvas'),branch=c?.querySelector('.rt-branch');if(!branch)return;e.preventDefault();const rect=branch.getBoundingClientRect(),x=(e.clientX-rect.left)/zoom,y=(e.clientY-rect.top)/zoom;zoom=Math.max(.4,Math.min(1.6,zoom*Math.exp(-e.deltaY*.001)));render();const next=pane.querySelector('.rt-canvas'),r=next.querySelector('.rt-branch').getBoundingClientRect();next.scrollLeft+=r.left+x*zoom-e.clientX;next.scrollTop+=r.top+y*zoom-e.clientY;},{passive:false});
let drag=null;
pane.addEventListener('pointerdown',e=>{const c=e.target.closest('.rt-canvas');if(!c||e.target.closest('button,input,select')||e.button!==0)return;drag={c,x:e.clientX,y:e.clientY,left:c.scrollLeft,top:c.scrollTop};e.preventDefault();});
document.addEventListener('pointermove',e=>{if(drag){drag.c.scrollLeft=drag.left-(e.clientX-drag.x);drag.c.scrollTop=drag.top-(e.clientY-drag.y);}});
document.addEventListener('pointerup',()=>drag=null);document.addEventListener('pointercancel',()=>drag=null);
setInterval(()=>{if(state.paused||!Object.values(lab.projects).some(p=>p.status==='running'))return;const done=lab.tick(state.speed);save();done.forEach(id=>{log('연구 완료 / '+M.get(id).name+' / '+M.get(id).effect,'RESEARCH');toast('연구 완료: '+M.get(id).name);});if(!pane.contains(document.activeElement)||!document.activeElement.matches('input,select,button'))render();},1000);
window.ResearchUI={get lab(){return lab;},render,select(id){if(M.get(id)){selected=id;render();}},get selected(){return selected;},get goal(){return goal;},get plan(){return goal?M.plan(lab,goal,choices):null;}};
render();Workspace.applyPreset('연구');document.querySelector('.version b').textContent='10';requestAnimationFrame(()=>act('reset-view'));
})();
