'use strict';
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.TradeModel=m;})(globalThis,()=>{
const PERIOD=6*60*60*1000;
const NAMES={iron:'철재',copper:'구리',fuel:'정제연료',gold:'금',electronics:'전장품',parts:'정비부품',battery:'배터리 팩',data:'연구 데이터',alloy:'합금',sensor:'센서 모듈',artifact:'유물 시료',supplies:'보급품'};
const groups=[
['현장 자재',[['iron',160,{copper:55}],['copper',90,{iron:130,fuel:20}],['alloy',35,{iron:100,copper:35}],['parts',45,{copper:60}]]],
['전력 물자',[['battery',6,{copper:80,fuel:30}],['fuel',120,{iron:100}],['electronics',24,{gold:2,iron:50}],['copper',110,{fuel:70}]]],
['회수 장비',[['sensor',2,{electronics:16}],['parts',70,{iron:150}],['battery',8,{electronics:20}],['alloy',50,{copper:95}]]],
['연구 화물',[['data',12,{gold:3}],['artifact',1,{data:8,copper:40}],['electronics',40,{fuel:80}],['sensor',3,{gold:4}]]],
['희소 물자',[['gold',4,{copper:120,fuel:40}],['artifact',2,{electronics:35}],['data',18,{parts:40}],['sensor',5,{alloy:40}]]],
['원정 보급',[['supplies',90,{iron:100,fuel:30}],['fuel',180,{parts:45}],['parts',80,{copper:90}],['electronics',30,{battery:5}]]]
];
const CATALOG=groups.flatMap(([category,rows],slot)=>rows.map(([item,qty,cost],i)=>({id:slot+'-'+i,category,item,name:NAMES[item],qty,cost,symbol:['▥','ϟ','⚙','⌬','◇','▣'][slot]})));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function offers(epoch){return groups.map((_,slot)=>{const index=(epoch%2)*2+hash(epoch+':'+slot)%2,item=CATALOG[slot*4+index];return{id:epoch+':'+slot,itemId:item.id,stock:1+hash('stock:'+epoch+':'+slot)%2};});}
class Market{
constructor(now=Date.now()){this.epoch=Math.floor(now/PERIOD);this.slots=offers(this.epoch);this.holdings={iron:1800,copper:900,fuel:650,gold:20,electronics:100,parts:100,battery:15,data:30,alloy:80,artifact:0,supplies:0,sensor:0};this.receipts=[];this.revision=0;}
refresh(now=Date.now()){const epoch=Math.floor(now/PERIOD);if(epoch<=this.epoch)return false;this.epoch=epoch;this.slots=offers(epoch);this.revision++;return true;}
remaining(now=Date.now()){return Math.max(0,(this.epoch+1)*PERIOD-now);}
exchange(offerId,now=Date.now()){this.refresh(now);const s=this.slots.find(s=>s.id===offerId);if(!s)return{ok:false,error:'교역 회차가 바뀌었습니다. 새 물품을 확인하세요.'};if(s.stock<=0)return{ok:false,error:'SOLD OUT · 재고가 없습니다.'};const t=CATALOG.find(t=>t.id===s.itemId);if(Object.entries(t.cost).some(([k,v])=>(this.holdings[k]||0)<v))return{ok:false,error:'교환재화가 부족합니다.'};for(const [k,v]of Object.entries(t.cost))this.holdings[k]-=v;this.holdings[t.item]=(this.holdings[t.item]||0)+t.qty;s.stock--;this.revision++;this.receipts.unshift({offerId,item:t.item,qty:t.qty,cost:{...t.cost},at:now});this.receipts=this.receipts.slice(0,30);return{ok:true,item:t};}
save(){return JSON.stringify({version:1,epoch:this.epoch,slots:this.slots,holdings:this.holdings,receipts:this.receipts,revision:this.revision});}
static load(raw,now=Date.now()){const d=JSON.parse(raw);if(d.version!==1||!Number.isSafeInteger(d.epoch)||d.epoch<0||!Array.isArray(d.slots)||d.slots.length!==6||!d.holdings)throw Error('저장 형식 오류');const m=new Market(now),base=offers(d.epoch);
d.slots.forEach((s,i)=>{if(s.id!==base[i].id||s.itemId!==base[i].itemId||!Number.isInteger(s.stock)||s.stock<0||s.stock>base[i].stock)throw Error('재고 오류');});
for(const k of Object.keys(NAMES))if(!Number.isSafeInteger(d.holdings[k])||d.holdings[k]<0)throw Error('재화 오류');
m.epoch=d.epoch;m.slots=d.slots.map(s=>({...s}));m.holdings={...d.holdings};m.revision=Number.isSafeInteger(d.revision)?d.revision:0;
m.receipts=(Array.isArray(d.receipts)?d.receipts:[]).filter(r=>NAMES[r.item]&&Number.isFinite(r.at)&&Number.isSafeInteger(r.qty)&&r.qty>0).slice(0,30).map(r=>({...r,cost:typeof r.cost==='object'&&r.cost?r.cost:{}}));m.refresh(now);return m;}
}
return{PERIOD,NAMES,CATALOG,Market,offers};
});
