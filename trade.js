'use strict';
(()=>{
const T=TradeModel,pane=Workspace.ensurePane('trade'),KEY='pelagic-trade-v1',LOCK='pelagic-trade-write';
let market=null,busy=false,error='';
const money=o=>Object.entries(o).map(([k,v])=>esc(T.NAMES[k]||k)+' '+Number(v).toLocaleString('ko-KR')).join(' + ');
function read(){const raw=localStorage.getItem(KEY);return raw?T.Market.load(raw):new T.Market();}
function clock(){if(!market)return;const s=Math.ceil(market.remaining()/1000),el=pane.querySelector('#tradeClock');if(el)el.textContent=[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':');}
function render(){
pane.innerHTML='<div class="trade-app"><header class="tr-banner"><div><span class="tr-eyebrow">FREEPORT / BARTER EXCHANGE</span><h1>외해 교환소 <small>DOCK 09</small></h1><p>입항한 화물만 거래합니다. 필요한 물자를 지금 확보하십시오.</p></div><div class="tr-cycle"><span>다음 화물 입항까지</span><b id="tradeClock">--:--:--</b><small>실제 시간 · 6시간마다 전 칸 교체</small></div></header><div class="tr-notice">'+(error?esc(error):'독립 교역 시험 재고 · 실제 기지 경제와 미연동 · 교환 즉시 입고')+'</div>'+
(market?'<div class="tr-wallet"><b>교환재화 / 보유</b>'+Object.entries(market.holdings).filter(([,v])=>v>0).map(([k,v])=>'<span>'+T.NAMES[k]+' <strong>'+v.toLocaleString('ko-KR')+'</strong></span>').join('')+'</div><div class="tr-offers">'+market.slots.map((s,i)=>{const item=T.CATALOG.find(t=>t.id===s.itemId),sold=s.stock===0,afford=Object.entries(item.cost).every(([k,v])=>(market.holdings[k]||0)>=v);return '<article class="tr-offer '+(sold?'sold':'')+'"><div class="tr-tag">LOT 0'+(i+1)+' <span>'+item.category+'</span></div><div class="tr-item-graphic"><span>'+item.symbol+'</span><small>'+item.item.toUpperCase()+' / '+item.qty+' UNITS</small>'+(sold?'<b class="tr-soldstamp">SOLD OUT</b>':'')+'</div><h2>'+item.name+' <em>× '+item.qty+'</em></h2><div class="tr-stock">'+(sold?'재입고 대기':'남은 교환 횟수 '+s.stock+'회')+'</div><div class="tr-price"><span>1회 교환에 필요</span><b>'+money(item.cost)+'</b></div><button data-trade-offer="'+s.id+'" '+(sold||!afford||busy||error?'disabled':'')+'>'+(sold?'SOLD OUT':!afford?'교환재화 부족':busy?'처리 중…':'교환 →')+'</button></article>';}).join('')+'</div><section class="tr-ledger"><h2>입고 전표 <small>최근 8건 / 재고는 새로고침해도 유지됩니다</small></h2>'+(market.receipts.slice(0,8).map(r=>'<div><time>'+new Date(r.at).toLocaleTimeString('ko-KR')+'</time><span>'+T.NAMES[r.item]+' × '+r.qty+'</span><small>지불 '+money(r.cost)+'</small><b>RECEIVED</b></div>').join('')||'<p>아직 교환한 물품이 없습니다.</p>')+'</section>':'')+'<footer>갱신 기준: UTC 00·06·12·18시 (한국 03·09·15·21시) · 개별 품목 재고 1–2회 · 현금 결제 없음</footer></div>';clock();
}
async function transact(id=null){
if(busy)return;busy=true;
if(!navigator.locks){error='이 브라우저에서는 안전한 동시 교환을 지원하지 않습니다. Edge/Chrome에서 이용하세요.';busy=false;render();return;}
try{await navigator.locks.request(LOCK,()=>{let next=read();let result;if(id)result=next.exchange(id);localStorage.setItem(KEY,next.save());market=next;error='';if(result){toast(result.ok?result.item.name+' '+result.item.qty+'개 입고':result.error);if(result.ok)log('교역 입고 / '+result.item.name+' × '+result.item.qty,'TRADE');}});}catch{error='교역 저장을 읽거나 기록하지 못했습니다. 저장된 원본은 유지하며 거래를 중단합니다.';}finally{busy=false;render();}}
pane.addEventListener('click',e=>{const b=e.target.closest('[data-trade-offer]');if(b)transact(b.dataset.tradeOffer);});
window.addEventListener('storage',e=>{if(e.key===KEY){try{market=read();error='';render();}catch{error='다른 창의 저장 상태를 읽을 수 없습니다.';render();}}});
setInterval(()=>{clock();if(market&&Date.now()>=(market.epoch+1)*T.PERIOD)transact();},1000);
window.TradeUI={get market(){return market;},transact,render};
transact();
})();

