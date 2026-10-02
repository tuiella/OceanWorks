'use strict';
(()=>{
const W=window.Workspace, O=window.Operations;
const logpane=W.panes.get('console').querySelector('.logpanel');
const hint=document.createElement('div');hint.className='consolehint';hint.textContent='창 이름 + Enter로 창 열기 / 전환   ·   좌표 → 행동 → 명령 → 옵션   ·   Tab 완성 / ↑↓ 선택 / Enter 실행   ·   예: [365,335] 운송 연결 [575,490]';
const bar=document.createElement('form');bar.className='consolebar';bar.innerHTML='<span class="prompt">›_</span><input id="commandInput" aria-label="작전 명령 콘솔" role="combobox" aria-autocomplete="list" aria-controls="completionList" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="창 이름 또는 [좌표] 행동 명령 …"><button type="submit">실행 ↵</button>';
logpane.append(hint,bar);
const popup=document.createElement('div');popup.id='completion';popup.hidden=true;popup.innerHTML='<div class="completiontitle"></div><div id="completionList" role="listbox"></div>';document.body.append(popup);
const input=bar.querySelector('input'), actions={정보:{조회:'대상 속성 확인'},탐사:{시작:'12초 탐사 데모 시작'},출정:{방어:'방어선 명령 등록',공격:'공격 진출 명령 등록',채굴:'채굴선 명령 등록'},운송:{연결:'목적 좌표와 항로 연결'},회수:{귀환:'회수·귀환 명령 등록'},시설:{계획:'시설 개발 속성 열기'}};
let choices=[],choice=0,history=[],historyIndex=0,composition=false;
function parseCoord(t){const m=t?.match(/^\[(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]$/);if(!m)return null;let p={x:Number(m[1]),y:Number(m[2])};return p.x>=0&&p.x<=2000&&p.y>=0&&p.y<=1520?p:null;}
function context(){const caret=input.selectionStart,prefix=input.value.slice(0,caret),parts=prefix.split(/\s+/),current=parts.pop()||'',before=parts.filter(Boolean);return {caret,start:caret-current.length,current,before,index:before.length};}
function suggestions(){const c=context();let rows=[];if(c.index===0||c.index===3&&c.before[1]==='운송'){rows=nodes.map(n=>({word:'['+Math.round(n.x)+','+Math.round(n.y)+']',desc:n.name}));}
else if(c.index===1)rows=Object.entries(actions).map(([word,sub])=>({word,desc:Object.values(sub)[0]}));
else if(c.index===2)rows=Object.entries(actions[c.before[1]]||{}).map(([word,desc])=>({word,desc}));
return rows.filter(r=>!c.current||r.word.toLowerCase().startsWith(c.current.toLowerCase())||r.desc.toLowerCase().includes(c.current.toLowerCase())).slice(0,10);}
function hide(){popup.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
function position(){const r=input.getBoundingClientRect();if(!r.width){hide();return;}popup.style.width=Math.min(500,Math.max(320,r.width))+'px';popup.style.left=Math.max(8,Math.min(innerWidth-popup.offsetWidth-8,r.left))+'px';popup.style.top=Math.max(55,r.top-popup.offsetHeight-8)+'px';}
function paint(reset=true){if(composition||document.activeElement!==input){hide();return;}choices=suggestions();if(reset)choice=0;choice=Math.min(choice,choices.length-1);if(!choices.length){hide();return;}popup.querySelector('.completiontitle').textContent=['1 / 위치 좌표','2 / 행동','3 / 행동 명령','4 / 목적 좌표'][context().index]+' · Tab 완성';popup.querySelector('#completionList').innerHTML=choices.map((c,i)=>'<button type="button" id="suggest-'+i+'" role="option" aria-selected="'+(i===choice)+'" class="'+(i===choice?'chosen':'')+'" data-completion="'+i+'"><span>'+esc(c.word)+'</span><small>'+esc(c.desc)+'</small></button>').join('');popup.hidden=false;input.setAttribute('aria-expanded','true');input.setAttribute('aria-activedescendant','suggest-'+choice);position();popup.querySelector('.chosen')?.scrollIntoView({block:'nearest'});}
function accept(index=choice){if(!choices[index])return;const c=context(),suffix=input.value.slice(c.caret),end=c.caret+(suffix.match(/^\S*/)?.[0].length||0),value=choices[index].word+' ';input.value=input.value.slice(0,c.start)+value+input.value.slice(end).replace(/^\s+/,'');input.focus();input.setSelectionRange(c.start+value.length,c.start+value.length);paint();}
function execute(source){const tokens=source.trim().split(/\s+/);if(!source.trim())return;log(source,'INPUT');history.push(source);historyIndex=history.length;
const windowId=Object.keys(W.paneNames).find(id=>W.paneNames[id].replace(/\s/g,'')===source.trim().replace(/\s/g,''));if(windowId){W.ensurePane(windowId);W.activate(windowId);return true;}
const [loc,action,command,arg,...extra]=tokens,p=parseCoord(loc);
function error(msg){log(msg,'ERROR');toast(msg);return false;}
if(!p)return error('좌표 형식: [365,335] · 범위 X 0–2000, Y 0–1520');
if(!actions[action]?.[command])return error('알 수 없는 행동 또는 명령입니다. 자동완성 목록에서 선택하세요.');
if(extra.length||action!=='운송'&&arg)return error('불필요한 인자가 있습니다.');
const target=O.nearest(p);
if(action==='탐사')return O.startScan(p);
if(!target)return error('해당 좌표 근처에 발견된 대상이 없습니다.');
if(action==='운송'){const q=parseCoord(arg),dest=q&&O.nearest(q);if(!dest)return error('운송 연결에는 발견된 목적 좌표가 필요합니다.');return O.connect(target.id,dest.id);}
const actionKey=action==='정보'?'inspect':action==='시설'?'build':action==='회수'?'return':({방어:'defend',공격:'attack',채굴:'mine'}[command]);
return O.nodeAction(actionKey,target.id);
}
bar.onsubmit=e=>{e.preventDefault();if(composition)return;if(execute(input.value)){input.value='';hide();}};
input.addEventListener('input',()=>paint());input.addEventListener('focus',()=>paint());input.addEventListener('click',()=>paint());
input.addEventListener('compositionstart',()=>composition=true);input.addEventListener('compositionend',()=>{composition=false;paint();});
input.addEventListener('keydown',e=>{if(composition||e.isComposing)return;
 if(e.key==='Tab'&&!popup.hidden&&choices.length){e.preventDefault();accept();return;}
 if(['ArrowUp','ArrowDown'].includes(e.key)){if(!popup.hidden){e.preventDefault();choice=(choice+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length;paint(false);}else if(!input.value||historyIndex<history.length){e.preventDefault();historyIndex=Math.max(0,Math.min(history.length,historyIndex+(e.key==='ArrowUp'?-1:1)));input.value=history[historyIndex]||'';}return;}
 if(e.key==='Escape'){e.preventDefault();hide();}
});
input.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==input)hide();},120));
popup.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-completion]');if(b){e.preventDefault();accept(Number(b.dataset.completion));}});
document.addEventListener('workspace-render',()=>hide());window.addEventListener('resize',position);
window.CommandConsole={execute,suggestions,parseCoord};
log('콘솔 준비 / [좌표] 행동 명령 · Tab 자동완성','SYSTEM');
})();
