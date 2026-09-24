(function(){
const D=window.DATA,{fmt,css}=Viz,T=D.total;
const $=s=>document.querySelector(s);
const S=Object.fromEntries(D.sectors.map(s=>[s.name,s]));
const sectorColors=()=>[css('--accent'),css('--accent-2'),css('--s3')];
const pct=(a,b)=>(a/b*100).toFixed(1)+'%';
const byPrice=[...D.states].sort((a,b)=>b.price-a.price);
const hi=byPrice[0],lo=byPrice[byPrice.length-1];

/* text that both pages share */
const facts={
  lede:`In 2024, U.S. utilities sold ${fmt.int(T.sales/1e6)} TWh of electricity on bundled service to ${fmt.m(T.customers)} customers, earning ${fmt.bn(T.rev)}. The average price was ${T.price.toFixed(2)}¢/kWh — but that single number hides a ${(hi.price/lo.price).toFixed(1)}× spread between states and a 2× gap between homes and factories.`
};
if($('#lede'))$('#lede').textContent=facts.lede;

function kpis(target,items){$(target).innerHTML=items.map(k=>`<div class="kpi"><div class="l">${k[0]}</div><div class="v">${k[1]}</div><div class="s">${k[2]}</div></div>`).join('')}
const kpiItems=[
  ['Energy sold',fmt.int(T.sales/1e6)+' TWh','bundled retail, all sectors'],
  ['Revenue',fmt.bn(T.rev),'retail revenue'],
  ['Average price',T.price.toFixed(2)+'¢','per kWh, all sectors'],
  ['Bundled customers',fmt.m(T.customers),pct(T.customers,T.allCustomers)+' of '+fmt.m(T.allCustomers)+' total'],
  ['Reporting entities',fmt.int(T.entities),'utilities & providers']
];

function stateTip(s){return [['All-sector price',fmt.c(s.price)],['Residential',fmt.c(s.res)],['Commercial',fmt.c(s.com)],['Industrial',fmt.c(s.ind)],['Sales',fmt.twh(s.sales)],['Revenue',fmt.bn(s.rev)],['Bundled customers',fmt.int(s.customers)]]}

function renderSector(sel,w){
  const cats=['Residential','Commercial','Industrial'].map((n,i)=>({name:n,color:sectorColors()[i]}));
  const pick=k=>cats.map(c=>S[c.name][k]);
  Viz.stack100(sel,cats,[
    {label:'Customers',vals:pick('customers'),fmt:fmt.int},
    {label:'Energy sold',vals:pick('sales'),fmt:fmt.twh},
    {label:'Revenue',vals:pick('rev'),fmt:fmt.bn}],{width:w||520});
}
function renderSectorPrice(sel,w){
  Viz.hbar(sel,['Residential','Commercial','Transportation','Industrial'].map(n=>({label:n,value:S[n].price,
    tip:[['Price',fmt.c(S[n].price)],['Sales',fmt.twh(S[n].sales)],['Revenue',fmt.bn(S[n].rev)],['Customers',fmt.int(S[n].customers)]]})),
    {width:w||520,labelW:110,rowH:22,val:v=>v.toFixed(1)+'¢',axis:v=>v+'¢',ref:T.price,refLabel:'Avg '+T.price.toFixed(1)+'¢'});
}
function renderMap(sel){Viz.tilemap(sel,D.states,'price',[10,11,12,14,17,22],{tip:stateTip,unit:'¢/kWh'})}

let rankKey='price';
const rankLabels={price:'All sectors',res:'Residential',com:'Commercial',ind:'Industrial'};
function renderRank(){
  const avg=rankKey==='price'?T.price:S[rankLabels[rankKey]].price;
  const rows=[...D.states].filter(s=>s[rankKey]!=null).sort((a,b)=>b[rankKey]-a[rankKey]);
  $('#rankSub').textContent=`${rankLabels[rankKey]} price, ¢/kWh. Dashed line = U.S. ${rankLabels[rankKey].toLowerCase()} average (${avg.toFixed(1)}¢). Highest: ${rows[0].name} ${rows[0][rankKey].toFixed(1)}¢ · Lowest: ${rows.at(-1).name} ${rows.at(-1)[rankKey].toFixed(1)}¢.`;
  Viz.vbar('#rank',rows.map((s,i)=>({label:s.st,full:s.name,value:s[rankKey],hl:i===0||i===rows.length-1,tip:stateTip(s)})),
    {height:300,axis:v=>v+'¢',ref:avg,refLabel:'U.S. avg '+avg.toFixed(1)+'¢'});
}
function renderOwn(sel,w){
  Viz.hbar(sel,D.ownership.map(o=>({label:o.name,value:o.sales/1e6,
    tip:[['Entities',fmt.int(o.n)],['Customers',fmt.int(o.customers)],['Share of sales',pct(o.sales,T.sales)],['Revenue',fmt.bn(o.rev)],['Avg price',fmt.c(o.price)]]})),
    {width:w||560,labelW:150,rowH:20,val:v=>fmt.int(v),axis:v=>fmt.int(v)});
}
function renderTop(sel,w,n){
  Viz.hbar(sel,D.top.slice(0,n||15).map(u=>({label:u.e+' ('+u.st+')',full:u.e,value:u.sales/1e6,
    tip:[['State',u.st],['Ownership',u.own],['Customers',fmt.int(u.customers)],['Share of U.S. sales',pct(u.sales,T.sales)],['Revenue',fmt.bn(u.rev)],['Avg price',fmt.c(u.price)]]})),
    {width:w||560,labelW:210,rowH:18,gap:7,val:v=>v.toFixed(1),axis:v=>fmt.int(v)});
}
function renderScatter(sel,w,h){
  const hl=new Set(['HI','CA','CT','LA']);
  Viz.scatter(sel,D.states.map(s=>({x:s.resUse,y:s.res,label:s.st,full:s.name,hl:hl.has(s.st),
    tip:[['Avg use',fmt.int(s.resUse)+' kWh/mo'],['Residential price',fmt.c(s.res)],['Implied avg bill','$'+fmt.int(s.resUse*s.res/100)+'/mo']]})),
    {width:w||560,height:h||330,xmin:400,xmax:1300,ymin:0,ymax:45,xaxis:v=>fmt.int(v),yaxis:v=>v+'¢',xlabel:'Average residential use, kWh per customer per month',ylabel:'Residential price, ¢/kWh'});
}
function renderHist(sel,w,h){
  const H=D.resHist;
  if($('#histSub'))$('#histSub').textContent=`Number of utilities by average residential price (2¢ bins). Median ${H.median.toFixed(1)}¢ across ${fmt.int(H.n)} utilities; the long right tail is mostly small, remote and island systems.`;
  Viz.vbar(sel,H.counts.map((c,i)=>{const a=H.edges[i];const lab=i===H.counts.length-1?a+'+':String(a);return {label:lab,value:c,hl:false,full:i===H.counts.length-1?`${a}¢ and above`:`${a}–${a+2}¢`,tip:[['Utilities',fmt.int(c)]]}}),
    {width:w||560,height:h||300,axis:v=>fmt.int(v),val:fmt.int});
}
function renderChoice(sel,w,n){
  const rows=[...D.states].sort((a,b)=>a.bundledShare-b.bundledShare).slice(0,n||15);
  Viz.hbar(sel,rows.map(s=>({label:s.name,value:s.bundledShare*100,
    tip:[['Bundled customers',fmt.int(s.customers)],['All customers',fmt.int(s.allCustomers)],['Bundled share',fmt.pct(s.bundledShare)]]})),
    {width:w||1100,labelW:140,rowH:16,gap:6,max:100,val:v=>v.toFixed(0)+'%',axis:v=>v+'%'});
}
function renderTable(){
  Viz.table('#tbl',[
    {k:'name',h:'State'},{k:'price',h:'All ¢',f:fmt.c},{k:'res',h:'Resid. ¢',f:fmt.c},{k:'com',h:'Comm. ¢',f:fmt.c},{k:'ind',h:'Indus. ¢',f:fmt.c},
    {k:'sales',h:'Sales TWh',f:v=>(v/1e6).toFixed(1)},{k:'rev',h:'Revenue $B',f:v=>(v/1e6).toFixed(2)},{k:'customers',h:'Bundled cust.',f:fmt.int},
    {k:'resUse',h:'Res. kWh/mo',f:fmt.int},{k:'bundledShare',h:'Bundled share',f:fmt.pct}],D.states,{sort:'price',placeholder:'Filter states…'});
}

const page=document.body.dataset.page||'dash';
function render(){
  if(page==='dash'){
    kpis('#kpis',kpiItems);renderMap('#map');renderSector('#sectorStack');renderSectorPrice('#sectorPrice');renderRank();
    renderOwn('#own');renderTop('#top');renderScatter('#scatter');renderHist('#hist');renderChoice('#choice');
  } else {
    kpis('#kpis',kpiItems.slice(0,4));renderMap('#map');renderSector('#sectorStack',400);renderScatter('#scatter',420,260);
  }
}
if($('#sectorSeg'))$('#sectorSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;rankKey=b.dataset.k;
  document.querySelectorAll('#sectorSeg button').forEach(x=>x.classList.toggle('on',x===b));renderRank()});
Viz.initTheme(render);
if(page==='dash')renderTable();
})();
