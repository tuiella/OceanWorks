'use strict';
/* Pure graph model: no DOM, game state, clocks, or code evaluation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ProductionModel=api;})(globalThis,()=>{
let serial=0;const id=prefix=>prefix+'-'+(++serial);
const TYPES={
 coordinate:{name:'좌표',color:'#c6b477'},resource:{name:'자원 노드',color:'#b9a879'},network:{name:'네트워크',color:'#83b9a5'},facility:{name:'시설',color:'#b391bc'},calc:{name:'계산',color:'#88aaca'},plan:{name:'계획',color:'#c0ad76'},fleet:{name:'함대',color:'#88aab8'}
};
const RESOURCES={iron:{name:'철광층',rate:60,purity:.5},copper:{name:'구리광층',rate:50,purity:.8},gas:{name:'가스 분출구',rate:30,purity:.65},quartz:{name:'석영 광층',rate:35,purity:.72}};
const SHIPS={guard:{name:'경비정',power:12,stock:12},cruiser:{name:'순양함',power:65,stock:4},cargo:{name:'수송선',power:2,stock:8},survey:{name:'탐사선',power:1,stock:3},miner:{name:'채굴모함',power:4,stock:2},support:{name:'지원선',power:3,stock:2}};
const port=(kind)=>({id:id('port'),kind});
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Math.max(0,Number(v)):fallback;
function createNode(type,x,y,subtype){
 if(!TYPES[type])throw Error('알 수 없는 노드 종류');
 let n={id:id('node'),type,subtype:subtype||({coordinate:'position',resource:'iron',network:'processing',facility:'storage',calc:'ratio',plan:'research',fleet:'fleet'}[type]),x,y,inputs:[],outputs:[],rate:60,purity:.5,efficiency:.9,factor:1,powerDemand:10,capacity:600,stock:0,color:TYPES[type].color,errors:[],warnings:[],flow:0,revision:0};
 if(type==='coordinate'){n.title='좌표';n.inputs=[];n.outputs=[{...port('plan'),coordinate:''}];}
 if(type==='resource'){const r=RESOURCES[n.subtype]||RESOURCES.iron;Object.assign(n,r,{rate:r.rate,title:r.name});n.inputs=[port('power')];n.outputs=[port('material')];}
 if(type==='network'){n.title='네트워크';n.rate=180;n.inputs=n.subtype==='power'?[]:[port('power'),port('material')];n.outputs=[port(n.subtype==='power'?'power':'material')];}
 if(type==='facility'){n.title='본부 시설';n.inputs=n.subtype==='storage'?[port('material')]:[port('power'),port('material')];n.outputs=[port('material')];n.rate=120;}
 if(type==='calc'){n.title='입출력 계산';n.inputs=[port('material')];n.outputs=[port('material')];}
 if(type==='plan'){n.title='작전 계획';n.inputs=[port('plan')];n.outputs=[port('plan')];n.research='회수율 개선';n.target='[450,220]';n.radius=120;n.priority='보통';if(n.subtype==='exploration')n.outputs=[];}
 if(type==='fleet'){n.title='함대 편성';n.inputs=[port('plan')];n.outputs=[port('plan')];n.autoFill=true;n.ships=[{type:'guard',count:2,manual:0},{type:'cargo',count:1,manual:0}];n.location='[270,510]';n.destination='[450,220]';n.status='대기중';n.travel=0;}
 return n;
}
function color(n){if(n.type==='resource')return {iron:'#bca382',copper:'#d19a74',gas:'#84bbaa',quartz:'#aaa4cd'}[n.subtype]||TYPES.resource.color;
 if(n.type==='network')return {power:'#c9bd78',production:'#80b5a5',processing:'#a98abb'}[n.subtype];
 if(n.type==='facility')return {lab:'#90a8cb',producer:'#b79bca',storage:'#9dab8b'}[n.subtype];
 if(n.type==='plan')return n.subtype==='research'?'#b39bc6':'#83b6ac';return TYPES[n.type].color;}
class Board{
 constructor(kind){this.kind=kind;this.nodes=[];this.edges=[];this.groups=[];this.lineMode='curve';this.view={x:40,y:35,scale:.82};this.selected=null;this.selectedEdge=null;this.revision=0;}
 node(id){return this.nodes.find(n=>n.id===id);}
 endpoint(nodeId,portId,side){return this.node(nodeId)?.[side]?.find(p=>p.id===portId);}
 edgeAt(nodeId,portId){return this.edges.find(e=>e.from===nodeId&&e.out===portId||e.to===nodeId&&e.in===portId);}
 add(type,x,y,subtype){const n=createNode(type,x,y,subtype);this.nodes.push(n);this.recompute();return n;}
 addPort(nodeId,side){const n=this.node(nodeId);if(!n||!['inputs','outputs'].includes(side))return;if(n.type==='coordinate'){if(side==='outputs')n.outputs.push({...port('plan'),coordinate:''});this.recompute();return;}if(n.type==='plan'&&n.subtype==='exploration'&&side==='outputs')return;if(side==='outputs'&&n.type!=='calc'&&n.outputs.length)return;const needsPower=n.type==='resource'||n.type==='network'&&n.subtype!=='power'||n.type==='facility'&&n.subtype!=='storage';const kind=n.type==='calc'?(n.inputs[0]?.kind||'material'):n.type==='coordinate'||n.type==='plan'||n.type==='fleet'?'plan':side==='inputs'&&needsPower&&!n.inputs.some(p=>p.kind==='power')?'power':side==='outputs'&&n.type==='network'&&n.subtype==='power'?'power':'material';n[side].push(port(kind));this.recompute();}
 removePort(nodeId,portId,side){const n=this.node(nodeId);if(!n||this.edgeAt(nodeId,portId))return false;n[side]=n[side].filter(p=>p.id!==portId);this.recompute();return true;}
 connect(from,out,to,input,toSide){
 if(from===to)return {ok:false,error:'자기 자신에는 연결할 수 없습니다.'};
 const a=this.node(from),b=this.node(to);if(!a||!b)return{ok:false,error:'노드 없음'};
 if(b.type==='coordinate'&&a.type==='fleet')return this.connect(to,input,from,out,'outputs');
 toSide=toSide||(b.outputs.some(p=>p.id===input)?'outputs':'inputs');
 if(toSide==='outputs'&&!(a.type==='coordinate'&&b.type==='fleet'))return{ok:false,error:'좌표 출력과 함대 출력만 연결할 수 있습니다.'};
 if(!this.endpoint(from,out,'outputs')||!this.endpoint(to,input,toSide))return {ok:false,error:'연결점을 확인하세요.'};
 if(this.edgeAt(from,out)||this.edgeAt(to,input))return {ok:false,error:'연결점 하나에는 선 하나만 연결할 수 있습니다.'};
 if(b.type==='calc'){const kind=this.endpoint(from,out,'outputs').kind;b.inputs.forEach(p=>p.kind=kind);b.outputs.forEach(p=>p.kind=kind);}
 const e={id:id('edge'),from,out,to,in:input,toSide,amount:0,share:0,efficiency:1,error:'',bend:null};this.edges.push(e);this.recompute();return {ok:true,edge:e};}
 normalizePlanning(){
 if(this.kind!=='planning')return;
 for(const n of this.nodes)if(n.type==='coordinate'){
 const oldInputs=n.inputs||[];n.outputs=n.outputs||[];
 for(const p of oldInputs)if(!n.outputs.some(v=>v.id===p.id))n.outputs.push({...p,coordinate:n.coordinate||''});
 for(const p of n.outputs)if(p.coordinate==null)p.coordinate=n.coordinate||'';if(n.coordinate&&n.outputs[0]&&!n.outputs[0].coordinate)n.outputs[0].coordinate=n.coordinate;
 n.inputs=[];delete n.coordinate;delete n.role;
 }
 for(const e of this.edges){const target=this.node(e.to);if(target?.type==='coordinate'){const from=e.from,out=e.out;e.from=e.to;e.out=e.in;e.to=from;e.in=out;e.toSide='outputs';}}
 for(const n of this.nodes)if(n.type==='plan'&&n.subtype==='exploration'){n.outputs=[];this.edges=this.edges.filter(e=>e.from!==n.id);}
 }

 removeEdge(edgeId){this.edges=this.edges.filter(e=>e.id!==edgeId);if(this.selectedEdge===edgeId)this.selectedEdge=null;this.recompute();}
 removeNode(nodeId){this.nodes=this.nodes.filter(n=>n.id!==nodeId);this.edges=this.edges.filter(e=>e.from!==nodeId&&e.to!==nodeId);if(this.selected===nodeId)this.selected=null;this.recompute();}
 subtype(nodeId,value){const n=this.node(nodeId);if(!n)return;n.subtype=value;
 if(n.type==='plan'&&value==='research'&&!n.outputs.length)n.outputs=[port('plan')];
 if(n.type==='network'){n.outputs.forEach(p=>p.kind=value==='power'?'power':'material');if(value!=='power'&&!n.inputs.length)n.inputs=[port('power'),port('material')];}
 if(n.type==='facility'&&value!=='storage'&&!n.inputs.some(p=>p.kind==='power'))n.inputs.unshift(port('power'));
 n.color=color(n);this.recompute();}
 recompute(){
 this.normalizePlanning();this.revision++;
 // Calculation nodes inherit the connected stream type; no manual port settings.
 for(let pass=0;pass<this.nodes.length;pass++){let changed=false;for(const node of this.nodes.filter(n=>n.type==='calc')){const edge=this.edges.find(e=>e.to===node.id),kind=edge&&this.endpoint(edge.from,edge.out,'outputs')?.kind;if(kind)for(const p of [...node.inputs,...node.outputs])if(p.kind!==kind){p.kind=kind;changed=true;}}if(!changed)break;}
 const incoming=new Map(),outgoing=new Map();
 this.nodes.forEach(n=>{n.errors=[];n.warnings=[];n.flow=0;n.planned=0;n.inputAmount=0;n.power=0;n.effectivePurity=n.purity;n.color=color(n);incoming.set(n.id,[]);outgoing.set(n.id,[]);});
 this.edges.forEach(e=>{e.error='';e.amount=0;e.share=0;e.efficiency=1;e.purity=1;e.updated=this.revision;
 const a=this.endpoint(e.from,e.out,'outputs'),b=this.endpoint(e.to,e.in,e.toSide||'inputs');
 if(!a||!b){e.error='연결점 없음';return;}e.kind=a.kind;
 incoming.get(e.to).push(e);outgoing.get(e.from).push(e);
 if(a.kind!==b.kind){e.error='부적절한 연결: '+a.kind+' → '+b.kind;this.node(e.from).errors.push('연결 타입 불일치');this.node(e.to).errors.push('연결 타입 불일치');}
 if(this.node(e.to).type==='facility'&&this.node(e.to).subtype==='storage'&&num(this.node(e.to).stock)>=num(this.node(e.to).capacity)){e.error=e.error||'정기선 멈춤 · 창고 가득 참';this.node(e.from).errors.push('배출 정지 · 목적 창고 만재');this.node(e.to).errors.push('창고 가득 참');}
 });
 // DFS marks only the actual cycle and excludes it from deterministic flow evaluation.
 const visiting=new Set(),done=new Set(),stack=[];
 const cycleVisit=n=>{if(done.has(n.id))return;if(visiting.has(n.id)){const first=stack.indexOf(n.id);stack.slice(first).forEach(key=>this.node(key).errors.push('순환 연결'));return;}visiting.add(n.id);stack.push(n.id);for(const e of outgoing.get(n.id)||[])if(!e.error)cycleVisit(this.node(e.to));stack.pop();visiting.delete(n.id);done.add(n.id);};
 this.nodes.forEach(cycleVisit);this.edges.forEach(e=>{if(this.node(e.from)?.errors.includes('순환 연결')&&this.node(e.to)?.errors.includes('순환 연결'))e.error='순환 연결 · 계산 불가';});
 const computed=new Set(),active=new Set();
 const calculate=n=>{if(computed.has(n.id)||active.has(n.id))return;active.add(n.id);
 const inc=incoming.get(n.id),outs=outgoing.get(n.id), validIn=inc.filter(e=>!e.error);
 validIn.forEach(e=>calculate(this.node(e.from)));
 n.inputAmount=validIn.filter(e=>e.kind==='material').reduce((s,e)=>s+e.amount,0);
 n.power=validIn.filter(e=>e.kind==='power').reduce((s,e)=>s+e.amount,0);
 const mixed=validIn.filter(e=>e.kind==='material').reduce((s,e)=>s+e.amount*e.purity,0);
 const purity=n.inputAmount?mixed/n.inputAmount:0;
 const needsPower=n.type==='resource'||n.type==='network'&&n.subtype!=='power'||n.type==='facility'&&n.subtype!=='storage';
 if(n.inputs.length&&!inc.length)n.warnings.push('입력 연결없음');
 if(needsPower&&!validIn.some(e=>e.kind==='power'))n.warnings.push('전력 연결 없음');
 else if(needsPower&&n.power<num(n.powerDemand))n.warnings.push('전력 부족');
 const relevantKind=n.type==='calc'?(n.outputs[0]?.kind||n.inputs[0]?.kind||'material'):n.type==='network'&&n.subtype==='power'?'power':n.type==='coordinate'||n.type==='plan'||n.type==='fleet'?'plan':'material';
 if(!(n.type==='plan'&&n.subtype==='exploration')&&!outs.some(e=>e.kind===relevantKind))n.warnings.push(relevantKind==='material'?'출력물 배출점 없음':'출력 연결 없음');
 let amount=0;
 if(n.type==='resource'){amount=num(n.rate);n.effectivePurity=Math.min(1,num(n.purity));}
 if(n.type==='network'&&n.subtype==='power'){amount=num(n.rate);n.effectivePurity=1;}
 if(n.type==='network'&&n.subtype==='production'){amount=Math.min(num(n.rate),n.inputAmount);n.effectivePurity=purity;}
 if(n.type==='network'&&n.subtype==='processing'){amount=Math.min(num(n.rate),n.inputAmount)*purity*Math.min(1,num(n.efficiency));n.effectivePurity=1;}
 if(n.type==='facility'){amount=n.subtype==='storage'?Math.min(n.inputAmount,Math.max(0,num(n.capacity)-num(n.stock))):Math.min(num(n.rate),n.inputAmount)*(n.subtype==='producer'?.8:1);n.effectivePurity=n.subtype==='storage'?purity:1;}
 if(n.type==='calc'){amount=(relevantKind==='power'?n.power:n.inputAmount)*num(n.factor);n.effectivePurity=relevantKind==='power'?1:purity;}
 if(n.type==='coordinate'||n.type==='plan'||n.type==='fleet'){amount=1;n.effectivePurity=1;}
 if(needsPower)amount*=num(n.powerDemand)?Math.min(1,n.power/num(n.powerDemand)):1;
 if(n.errors.includes('순환 연결'))amount=0;
 n.planned=amount;
 // Connected outputs have equal reserved shares. Full destinations stop their own share.
 const compatible=outs.filter(e=>this.endpoint(e.from,e.out,'outputs')?.kind===this.endpoint(e.to,e.in,e.toSide||'inputs')?.kind&&e.kind===relevantKind);
 compatible.forEach(e=>{e.share=100/compatible.length;e.amount=e.error?0:amount/compatible.length;e.purity=n.effectivePurity;});
 n.flow=outs.reduce((s,e)=>s+e.amount,0);n.warnings=[...new Set(n.warnings)];n.errors=[...new Set(n.errors)];
 active.delete(n.id);computed.add(n.id);
 };
 this.nodes.forEach(calculate);this.allocateFleets();this.resolveCoordinates();
 return this;
 }
 allocateFleets(){const pool=Object.fromEntries(Object.entries(SHIPS).map(([k,v])=>[k,v.stock]));this.nodes.filter(n=>n.type==='fleet').forEach(n=>{let total=0,ready=true,count=0;n.ships.forEach(row=>{const s=SHIPS[row.type];if(!s)return;row.count=Math.floor(num(row.count));const want=n.autoFill?row.count:Math.min(row.count,Math.floor(num(row.manual)));row.allocated=Math.min(pool[row.type],want);pool[row.type]-=row.allocated;total+=row.allocated*s.power;count+=row.count;if(row.allocated<row.count)ready=false;});n.combat=total;n.ready=ready&&count>0;

 });return pool;}
 resolveCoordinates(){
 const valid=this.edges.filter(e=>!e.error),ok=v=>/^\[\d{1,4},\d{1,4}\]$/.test(v)&&v.slice(1,-1).split(',').every((x,i)=>+x<=(i?1520:2000));
 for(const n of this.nodes.filter(n=>n.type==='coordinate')){n.warnings=[];for(const p of n.outputs)if(!ok(p.coordinate||''))n.warnings.push('검색으로 좌표를 지정하세요.');}
 for(const n of this.nodes.filter(n=>n.type==='plan'||n.type==='fleet')){
 n.originCoordinates=[];n.route=[];n.coordinateBindings=[];
 for(const e of valid.filter(e=>e.to===n.id)){const source=this.node(e.from);if(source?.type!=='coordinate')continue;const p=source.outputs.find(p=>p.id===e.out);if(!ok(p?.coordinate||''))continue;
 const destination=e.toSide==='outputs';n.coordinateBindings.push({nodeId:source.id,portId:p.id,coordinate:p.coordinate,destination});
 (destination?n.route:n.originCoordinates).push(p.coordinate);
 }
 n.destination=n.route.at(-1)||'목적지 없음';if(n.type==='plan')n.target=n.originCoordinates[0]||'좌표 미지정';
 }
 }

 dispatch(nodeId){const n=this.node(nodeId);if(!n||n.type!=='fleet')return{ok:false,error:'함대 노드가 아닙니다.'};this.recompute();if(!n.ready)return{ok:false,error:'편성이 완료되지 않았습니다.'};if(n.status==='이동중')return{ok:false,error:'이미 이동 중입니다.'};if(!/^\[\d{1,4},\d{1,4}\]$/.test(n.destination))return{ok:false,error:'목적지를 [450,220] 형식으로 입력하세요.'};const xy=n.destination.slice(1,-1).split(',').map(Number);if(xy[0]>2000||xy[1]>1520)return{ok:false,error:'목적지는 X 0–2000, Y 0–1520 범위입니다.'};if(n.location===n.destination)return{ok:false,error:'현재 위치와 목적지가 같습니다.'};n.status='이동중';n.travel=0;n.travelTarget=n.destination;return{ok:true};}
 tick(dt=1){let changed=false;for(const n of this.nodes){if(n.type==='fleet'&&n.status==='이동중'){n.travel=Math.min(8,n.travel+dt);if(n.travel>=8){n.location=n.travelTarget;n.status='이동완료';}changed=true;}}return changed;}
}
return {Board,TYPES,RESOURCES,SHIPS,color,createNode};
});
