'use strict';
/* Docking uses one live DOM instance per pane. Moving a tab never clones game state. */
(()=>{
const paneNames={sea:'해역',production:'생산 관리',research:'연구',trade:'무역',hierarchy:'대상 목록',inspector:'대상 속성',console:'운영 콘솔',...panels};
paneNames.nodeinfo='노드 상세 정보';paneNames.research='연구';paneNames.planning='계획';const icons={sea:'⌖',production:'⌁',planning:'◇',research:'▦',trade:'⇄',console:'›_'};
const panes=new Map();let seq=0,z=30,drag=null,resize=null,clickBlocked=false;
const uid=()=> 'dock-'+(++seq), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const group=(tabs,active=tabs[0])=>({id:uid(),kind:'tabs',tabs:[...tabs],active});
const split=(axis,ratio,a,b)=>({id:uid(),kind:'split',axis,ratio,a,b});
const originalMain=$('main'), center=$('.center'), logpane=$('.logpanel'), hierarchy=$('.hierarchy'), inspector=$('.inspector');
function register(id,el){const wrap=document.createElement('div');wrap.className='workspace-pane '+(id==='sea'?'sea-pane':'');wrap.dataset.pane=id;wrap.id='pane-'+id;wrap.append(el);panes.set(id,wrap);}
register('hierarchy',hierarchy);register('inspector',inspector);register('console',logpane);
const sea=document.createElement('div');sea.style.cssText='display:flex;flex-direction:column;height:100%;min-height:0';while(center.firstChild)sea.append(center.firstChild);register('sea',sea);
sea.querySelector('.tooloptions').append(sea.querySelector('.headright'));
originalMain.id='workspace';originalMain.className='';originalMain.innerHTML='<div id="dockRoot"></div>';
$('#floatingLayer').innerHTML='';
const parking=document.createElement('div');parking.id='paneParking';parking.hidden=true;document.body.append(parking);
const preview=document.createElement('div');preview.id='dockPreview';preview.hidden=true;preview.innerHTML='<span></span>';document.body.append(preview);
const hint=document.createElement('div');hint.id='dragHint';hint.hidden=true;hint.textContent='가장자리: 분할 도킹 · 탭 영역: 탭 합치기 · 빈 곳: 독립 창';document.body.append(hint);
document.querySelector('.version b').textContent='02';
const selectPreset=document.createElement('select');selectPreset.id='preset';selectPreset.setAttribute('aria-label','기본 배치 선택');
['기본','필수','자원','전투','교역','연구','계획','해역'].forEach(name=>selectPreset.add(new Option(name,name)));document.querySelector('header nav').prepend(selectPreset);
const layoutLabel=document.createElement('span');layoutLabel.className='layout-name';layoutLabel.textContent='배치';selectPreset.before(layoutLabel);
let tree, floats=[],preset='기본';
function presetTree(name){
 if(name==='해역')return split('row',.79,split('column',.83,group(['sea','planning','production','research','trade']),group(['console','missions'])),group(['seastatus','facilities','inspector']));
 if(name==='연구')return split('column',.86,group(['research','production','planning','sea']),group(['console','notes']));
 if(name==='계획')return split('row',.76,split('column',.84,group(['planning','sea','research','production']),group(['console','notes'])),group(['missions','fleet','cores']));
 const docs=group(['sea','production','planning','research','trade'],name==='자원'?'production':name==='교역'?'trade':'sea');
 if(name==='필수')return split('column',.79,docs,group(['console','missions']));
 const left=group(name==='자원'?['resources','hierarchy']:name==='전투'?['fleet','hierarchy']:name==='교역'?['people','resources','hierarchy']:['hierarchy']);
 const right=group(name==='자원'?['power','inspector','cores']:name==='전투'?['inspector','cores','missions']:name==='교역'?['resources','inspector']:['inspector','missions']);
 return split('row',.17,left,split('row',.76,split('column',.77,docs,group(['console','notes'])),right));
}
function ensurePane(id){
 if(panes.has(id))return panes.get(id);
 const wrapper=document.createElement('div');wrapper.className='workspace-pane';wrapper.id='pane-'+id;wrapper.dataset.pane=id;
 if(['production','planning','research','trade','nodeinfo'].includes(id))wrapper.innerHTML='<div class="feature-page"><h1>'+paneNames[id]+'</h1></div>';
 else wrapper.innerHTML='<div id="window-'+id+'" style="height:100%"><div class="windowbody">'+panelHTML(id)+'</div></div>';
 panes.set(id,wrapper);return wrapper;
}
function visit(n,fn){if(!n)return;fn(n);if(n.kind==='split'){visit(n.a,fn);visit(n.b,fn);}}
function findGroup(id){let found;visit(tree,n=>{if(n.id===id)found=n;});floats.forEach(f=>{if(f.group.id===id)found=f.group;});return found;}
function owner(id){let found;visit(tree,n=>{if(n.kind==='tabs'&&n.tabs.includes(id))found=n;});floats.forEach(f=>{if(f.group.tabs.includes(id))found=f.group;});return found;}
function removePane(n,id){if(!n)return null;if(n.kind==='tabs'){n.tabs=n.tabs.filter(t=>t!==id);if(!n.tabs.includes(n.active))n.active=n.tabs[0];return n.tabs.length?n:null;}n.a=removePane(n.a,id);n.b=removePane(n.b,id);return n.a&&n.b?n:n.a||n.b;}
function remove(id){tree=removePane(tree,id);floats=floats.filter(f=>{f.group=removePane(f.group,id);return !!f.group;});}
function replace(n,id,next){if(!n)return n;if(n.id===id)return next;if(n.kind==='split'){n.a=replace(n.a,id,next);n.b=replace(n.b,id,next);}return n;}
function build(n){if(n.kind==='split'){let el=document.createElement('div');el.className='dock-split '+n.axis;el.dataset.split=n.id;const a=document.createElement('div'),b=document.createElement('div'),handle=document.createElement('div');a.className=b.className='dock-child';a.style.flex=n.ratio+' 1 0';b.style.flex=(1-n.ratio)+' 1 0';handle.className='splitter';handle.dataset.splitter=n.id;handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label','패널 경계 크기 조절');handle.setAttribute('aria-orientation',n.axis==='row'?'vertical':'horizontal');handle.setAttribute('aria-valuenow',Math.round(n.ratio*100));a.append(build(n.a));b.append(build(n.b));el.append(a,handle,b);return el;}
 const el=document.createElement('section');el.className='dock-group';el.dataset.group=n.id;let tabs=document.createElement('div');tabs.className='dock-tabs';tabs.setAttribute('role','tablist');n.tabs.forEach(id=>{const t=document.createElement('button');t.className='dock-tab'+(n.active===id?' active':'');t.dataset.tab=id;t.dataset.group=n.id;t.setAttribute('role','tab');t.setAttribute('aria-selected',n.active===id);t.title='클릭: 전환 / 드래그: 분리·도킹';t.innerHTML='<span class="tab-icon">'+(icons[id]||'▤')+'</span><span>'+paneNames[id]+'</span><span class="close" data-close-pane="'+id+'" aria-label="닫기">×</span>';tabs.append(t);});const body=document.createElement('div');body.className='dock-content';body.append(ensurePane(n.active));el.append(tabs,body);return el;
}
function render(){
 // Detach every content pane first to preserve hidden panels and their input state.
 panes.forEach(p=>parking.append(p));$('#dockRoot').innerHTML='';$('#floatingLayer').innerHTML='';
 if(tree)$('#dockRoot').append(build(tree));else $('#dockRoot').innerHTML='<div class="emptydock">탭을 여기로 드래그해 작업영역을 구성하세요.<button id="emptyReset">기본 배치 복원</button></div>';
 floats.forEach(f=>{let el=document.createElement('div');el.className='dock-float';el.dataset.float=f.id;el.style.cssText='left:'+f.x+'px;top:'+f.y+'px;width:'+f.w+'px;height:'+f.h+'px;z-index:'+f.z;el.append(build(f.group));['n','s','e','w','ne','nw','se','sw'].forEach(edge=>{let h=document.createElement('div');h.className='resize-edge '+edge;h.dataset.resize=f.id;h.dataset.edge=edge;el.append(h);});$('#floatingLayer').append(el);});
 document.dispatchEvent(new CustomEvent('workspace-render'));
}
function activate(id){if(!paneNames[id])return;let o=owner(id);if(o){o.active=id;let f=floats.find(f=>f.group===o);if(f)f.z=++z;}else{floats.push({id:uid(),group:group([id]),x:clamp(260+floats.length*22,10,innerWidth-280),y:140,w:Math.min(id==='scan'?1180:id==='admin'?840:650,innerWidth-30),h:Math.min(id==='scan'?820:id==='admin'?780:460,innerHeight-170),z:++z});}render();$('#panelPicker').hidden=true;}

// Reveal another workspace without closing the originating floating pane.
// If a floating window obscures the requested docked pane, lift the requested pane to the front.
function reveal(id){
 activate(id);
 const own=owner(id);if(!own)return;
 const existing=floats.find(f=>f.group===own);if(existing)return;
 const rect=panes.get(id).getBoundingClientRect();
 if(!floats.some(f=>f.x<rect.right&&f.x+f.w>rect.left&&f.y<rect.bottom&&f.y+f.h>rect.top))return;
 remove(id);
 floats.push({id:uid(),group:group([id]),x:Math.max(10,Math.min(90,innerWidth-300)),y:100,w:Math.min(1100,innerWidth-30),h:Math.min(780,innerHeight-130),z:++z});
 render();
}

openPanel=activate;
function applyPreset(name){if(!['기본','필수','자원','전투','교역','연구','계획','해역'].includes(name))return;preset=name;floats=[];tree=presetTree(name);selectPreset.value=name;render();}
function dropTarget(x,y,ownFloat){
 const root=$('#workspace').getBoundingClientRect(), edge=30;
 if(x>=root.left&&x<=root.right&&y>=root.top&&y<=root.bottom){
 let side=x<root.left+edge?'left':x>root.right-edge?'right':y<root.top+edge?'top':y>root.bottom-edge?'bottom':null;
 if(side&&tree)return {root:true,side,rect:root};
 if(!tree)return {root:true,side:'center',rect:root};
 }
 const els=document.elementsFromPoint(x,y);let target;
 for(const e of els){const g=e.closest('.dock-group');if(g&&!g.closest('[data-float="'+ownFloat+'"]')){target=g;break;}}
 if(!target)return null;const r=target.getBoundingClientRect();let side='center';
 // A tab header is always a merge target.
 if(y>r.top+35){const nx=(x-r.left)/r.width,ny=(y-r.top)/r.height;if(nx<.22)side='left';else if(nx>.78)side='right';else if(ny<.24)side='top';else if(ny>.76)side='bottom';}
 return {id:target.dataset.group,side,rect:r};
}
function showPreview(t){preview.hidden=!t;if(!t)return;let {left:x,top:y,width:w,height:h}=t.rect;const side=t.side;if(side==='left')w*=.5;if(side==='right'){x+=w*.5;w*=.5;}if(side==='top')h*=.5;if(side==='bottom'){y+=h*.5;h*=.5;}Object.assign(preview.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});preview.firstChild.textContent=side==='center'?'탭으로 합치기':({left:'왼쪽',right:'오른쪽',top:'위쪽',bottom:'아래쪽'}[side])+'에 도킹';}
function dockPane(id,t){
 remove(id);const fresh=group([id]);
 if(t.root){if(!tree)tree=fresh;else if(t.side==='center'){let first;visit(tree,n=>{if(!first&&n.kind==='tabs')first=n;});first.tabs.push(id);first.active=id;}
 else tree=split(['left','right'].includes(t.side)?'row':'column',.5,...(['left','top'].includes(t.side)?[fresh,tree]:[tree,fresh]));}
 else{const dest=findGroup(t.id);if(!dest){activate(id);return;}
 if(t.side==='center'){dest.tabs.push(id);dest.active=id;}else{const f=floats.find(f=>f.group===dest);if(f){dest.tabs.push(id);dest.active=id;}else tree=replace(tree,t.id,split(['left','right'].includes(t.side)?'row':'column',.5,...(['left','top'].includes(t.side)?[fresh,dest]:[dest,fresh])));}}
 render();
}
document.addEventListener('pointerdown',e=>{
 const h=e.target.closest('[data-splitter]');if(h){const n=findGroup(h.dataset.splitter),r=h.parentElement.getBoundingClientRect();resize={kind:'split',n,r,handle:h,pointerId:e.pointerId};h.setPointerCapture(e.pointerId);e.preventDefault();return;}
 const edge=e.target.closest('[data-resize]');if(edge){const f=floats.find(f=>f.id===edge.dataset.resize);resize={kind:'float',f,start:{...f},x:e.clientX,y:e.clientY,edge:edge.dataset.edge,handle:edge,pointerId:e.pointerId};edge.setPointerCapture(e.pointerId);e.preventDefault();return;}
 const tab=e.target.closest('[data-tab]');if(tab&&!e.target.closest('[data-close-pane]')){drag={pane:tab.dataset.tab,x:e.clientX,y:e.clientY,started:false};}
 const f=e.target.closest('.dock-float');if(f){const item=floats.find(v=>v.id===f.dataset.float);if(item){item.z=++z;f.style.zIndex=z;}}
});
document.addEventListener('pointermove',e=>{
 if(resize){e.preventDefault();if(resize.kind==='split'){const {n,r}=resize;const size=n.axis==='row'?r.width:r.height;const min=Math.min(.3,(n.axis==='row'?155:85)/size);n.ratio=clamp(n.axis==='row'?(e.clientX-r.left)/r.width:(e.clientY-r.top)/r.height,min,1-min);const el=document.querySelector('[data-split="'+n.id+'"]');el.children[0].style.flex=n.ratio+' 1 0';el.children[2].style.flex=(1-n.ratio)+' 1 0';el.children[1].setAttribute('aria-valuenow',Math.round(n.ratio*100));}
 else{const {f,start:s,edge}=resize,dx=e.clientX-resize.x,dy=e.clientY-resize.y;if(edge.includes('e'))f.w=clamp(s.w+dx,250,innerWidth-s.x);if(edge.includes('s'))f.h=clamp(s.h+dy,160,innerHeight-s.y);if(edge.includes('w')){f.x=clamp(s.x+dx,0,s.x+s.w-250);f.w=s.x+s.w-f.x;}if(edge.includes('n')){f.y=clamp(s.y+dy,54,s.y+s.h-160);f.h=s.y+s.h-f.y;}const el=document.querySelector('[data-float="'+f.id+'"]');Object.assign(el.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});}return;}
 if(!drag)return;if(!drag.started&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
 if(!drag.started){const id=drag.pane;remove(id);drag.f={id:uid(),group:group([id]),x:e.clientX-100,y:e.clientY-16,w:Math.min(640,innerWidth-30),h:Math.min(450,innerHeight-150),z:++z};floats.push(drag.f);drag.started=true;render();hint.hidden=false;clickBlocked=true;}
 e.preventDefault();const f=drag.f;f.x=clamp(e.clientX-100,0,innerWidth-120);f.y=clamp(e.clientY-16,54,innerHeight-45);const el=document.querySelector('[data-float="'+f.id+'"]');el.style.left=f.x+'px';el.style.top=f.y+'px';el.style.pointerEvents='none';drag.target=dropTarget(e.clientX,e.clientY,f.id);showPreview(drag.target);
},true);
function finish(cancel=false){const activeResize=resize;resize=null;if(activeResize?.handle.hasPointerCapture(activeResize.pointerId))activeResize.handle.releasePointerCapture(activeResize.pointerId);if(drag?.started){let d=drag;drag=null;if(!cancel&&d.target)dockPane(d.pane,d.target);else render();preview.hidden=true;hint.hidden=true;setTimeout(()=>clickBlocked=false,0);}else drag=null;}
document.addEventListener('pointerup',()=>finish(),true);document.addEventListener('pointercancel',()=>finish(true),true);document.addEventListener('lostpointercapture',e=>{if(resize?.pointerId===e.pointerId)finish(true);});window.addEventListener('blur',()=>finish(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){finish(true);}const h=e.target.closest?.('[data-splitter]');if(h&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();let n=findGroup(h.dataset.splitter);n.ratio=clamp(n.ratio+(['ArrowRight','ArrowDown'].includes(e.key)?.03:-.03),.15,.85);render();}});
document.addEventListener('click',e=>{if(clickBlocked)return;const close=e.target.closest('[data-close-pane]');if(close){remove(close.dataset.closePane);render();return;}const tab=e.target.closest('[data-tab]');if(tab){let o=owner(tab.dataset.tab);o.active=tab.dataset.tab;render();}if(e.target.id==='emptyReset')applyPreset('기본');});
selectPreset.onchange=()=>applyPreset(selectPreset.value);
panes.get('hierarchy').querySelector('#collapseLeft').onclick=()=>{};
function snapshot(){return {version:2,tree,floats,preset,note:state.note};}
function validate(data){
 if(!data||data.version!==2||!Array.isArray(data.floats)||data.floats.length>20)throw Error('format');
 let seen=new Set(),count=0;const read=n=>{if(!n)return null;if(++count>70)throw Error('size');if(n.kind==='tabs'){if(!Array.isArray(n.tabs)||!n.tabs.length)throw Error('tabs');for(const id of n.tabs){if(!paneNames[id]||seen.has(id))throw Error('duplicate');seen.add(id);}return group(n.tabs,n.tabs.includes(n.active)?n.active:n.tabs[0]);}if(n.kind==='split'&&['row','column'].includes(n.axis)&&Number.isFinite(n.ratio)){const a=read(n.a),b=read(n.b);if(!a||!b)throw Error('split');return split(n.axis,clamp(n.ratio,.1,.9),a,b);}throw Error('node');};
 const root=read(data.tree),fs=data.floats.map(f=>{if(![f.x,f.y,f.w,f.h].every(Number.isFinite))throw Error('bounds');const g=read(f.group);if(g?.kind!=='tabs')throw Error('float');return {id:uid(),group:g,x:clamp(f.x,0,innerWidth-120),y:clamp(f.y,54,innerHeight-45),w:clamp(f.w,250,innerWidth-10),h:clamp(f.h,160,innerHeight-60),z:++z};});return {tree:root,floats:fs,note:typeof data.note==='string'?data.note:undefined,preset:data.preset};
}
$('#saveLayout').onclick=()=>{try{localStorage.setItem('pelagic-layout-v2',JSON.stringify(snapshot()));toast('도킹·탭·창 크기·메모를 저장했습니다.');}catch{toast('이 환경에서 배치 저장을 사용할 수 없습니다.');}};
$('#restoreLayout').onclick=()=>{try{const raw=localStorage.getItem('pelagic-layout-v2');if(!raw){toast('저장된 v2 배치가 없습니다.');return;}const d=validate(JSON.parse(raw));tree=d.tree;floats=d.floats;state.note=d.note;const note=panes.get('notes')?.querySelector('textarea');if(note)note.value=state.note||'';preset=d.preset;render();toast('저장한 작업영역을 복원했습니다.');}catch{toast('배치 형식이 올바르지 않아 현재 작업영역을 유지합니다.');}};
$('#panelPicker').innerHTML=Object.entries(paneNames).map(([k,v])=>'<button data-panel="'+k+'">＋ '+v+'</button>').join('');
window.Workspace={activate,reveal,applyPreset,panes,ensurePane,render,snapshot,dockPane,groupOwner:owner,paneNames};
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{floats.forEach(f=>{f.w=clamp(f.w,250,innerWidth-10);f.h=clamp(f.h,160,innerHeight-60);f.x=clamp(f.x,0,innerWidth-f.w);f.y=clamp(f.y,54,innerHeight-f.h);});render();},100);});
applyPreset('기본');
})();
