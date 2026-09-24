/* Minimal dependency-free SVG chart helpers for the EIA-861 2024 site */
(function(){
const NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s);
const fmt={
  int:v=>Math.round(v).toLocaleString('en-US'),
  m:v=>(v/1e6).toFixed(1)+'M',
  twh:v=>(v/1e6).toFixed(1)+' TWh',   // MWh -> TWh
  bn:v=>'$'+(v/1e6).toFixed(1)+'B',   // $000 -> $B
  c:v=>v==null?'—':v.toFixed(1)+'¢',
  pct:v=>(v*100).toFixed(1)+'%'
};
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}

/* tooltip */
let tip;
function showTip(ev,title,rows){
  if(!tip){tip=document.createElement('div');tip.className='tip';document.body.appendChild(tip)}
  tip.innerHTML='<b>'+title+'</b>'+rows.map(r=>'<div class="r"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>').join('');
  const w=tip.offsetWidth,h=tip.offsetHeight;let x=ev.clientX+14,y=ev.clientY+14;
  if(x+w>innerWidth-8)x=ev.clientX-w-14; if(y+h>innerHeight-8)y=ev.clientY-h-14;
  tip.style.left=x+'px';tip.style.top=y+'px';tip.style.opacity=1;
}
function hideTip(){if(tip)tip.style.opacity=0}
function bindTip(node,title,rows){node.addEventListener('mousemove',e=>showTip(e,title,rows));node.addEventListener('mouseleave',hideTip)}
function nice(max,n=5){const s=Math.pow(10,Math.floor(Math.log10(max/n)));const m=[1,2,2.5,5,10].find(k=>k*s*n>=max);return m*s}
/* rounded-end bar path (4px radius on the data end only) */
function hbarPath(x,y,w,h,r=4){r=Math.min(r,w,h/2);return `M${x},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h-r}Q${x+w},${y+h} ${x+w-r},${y+h}H${x}Z`}
function vbarPath(x,y,w,h,r=4){r=Math.min(r,h,w/2);return `M${x},${y+h}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h}Z`}

/* Horizontal bar chart. rows:[{label,value,sub?,tip:[[k,v]]}] */
function hbar(target,rows,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  const W=o.width||560,lw=o.labelW||170,rh=o.rowH||24,gap=o.gap||8,pad=60;
  const H=rows.length*(rh+gap)+22;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.aria||''},box);
  const max=o.max||Math.max(...rows.map(r=>r.value)); const step=nice(max,4); const top=Math.ceil(max/step)*step;
  const x=v=>lw+(W-lw-pad)*v/top;
  const g=el('g',{class:'gr'},svg);
  for(let t=0;t<=top+1e-9;t+=step){el('line',{x1:x(t),x2:x(t),y1:0,y2:H-20},g);const tx=el('text',{x:x(t),y:H-6,'text-anchor':'middle'},g);tx.textContent=(o.axis||(v=>v))(t)}
  rows.forEach((r,i)=>{
    const y=i*(rh+gap);
    const lab=el('text',{x:lw-10,y:y+rh/2+4,'text-anchor':'end'},svg);lab.textContent=r.label.length>26?r.label.slice(0,25)+'…':r.label;
    const p=el('path',{d:hbarPath(lw,y,Math.max(1,x(r.value)-lw),rh),fill:r.color||css('--accent')},svg);
    const vt=el('text',{x:x(r.value)+6,y:y+rh/2+4,class:'lbl'},svg);vt.textContent=(o.val||fmt.int)(r.value);
    const hit=el('rect',{x:0,y:y-gap/2,width:W,height:rh+gap,fill:'transparent'},svg);
    bindTip(hit,r.full||r.label,r.tip||[['Value',(o.val||fmt.int)(r.value)]]);
    hit.addEventListener('mouseenter',()=>p.style.opacity=.8);hit.addEventListener('mouseleave',()=>p.style.opacity=1);
  });
  if(o.ref!=null){const rx=x(o.ref);el('line',{x1:rx,x2:rx,y1:-4,y2:H-20,stroke:css('--ref'),'stroke-dasharray':'3 3','stroke-width':1.5},svg);const t=el('text',{x:rx+4,y:-8,class:'lbl'},svg);t.textContent=o.refLabel||''}
}

/* Vertical bar chart, sorted. rows:[{label,value,tip}] */
function vbar(target,rows,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  const W=o.width||1100,H=o.height||300,ml=36,mb=34,mt=16;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':o.aria||''},box);
  const max=Math.max(...rows.map(r=>r.value));const step=nice(max,5);const top=Math.ceil(max/step)*step;
  const y=v=>mt+(H-mt-mb)*(1-v/top);const bw=(W-ml)/rows.length;
  const g=el('g',{class:'gr'},svg);
  for(let t=0;t<=top+1e-9;t+=step){el('line',{x1:ml,x2:W,y1:y(t),y2:y(t)},g);const tx=el('text',{x:ml-6,y:y(t)+4,'text-anchor':'end'},g);tx.textContent=(o.axis||(v=>v))(t)}
  rows.forEach((r,i)=>{
    const x0=ml+i*bw+1;const w=bw-2;
    const p=el('path',{d:vbarPath(x0,y(r.value),w,y(0)-y(r.value)),fill:r.color||css('--accent')},svg);
    const t=el('text',{x:x0+w/2,y:H-mb+14,'text-anchor':'middle'},svg);t.textContent=r.label;t.style.fontSize='10px';
    if(r.hl){const vt=el('text',{x:x0+w/2,y:y(r.value)-5,'text-anchor':'middle',class:'lbl'},svg);vt.textContent=(o.val||fmt.c)(r.value)}
    const hit=el('rect',{x:ml+i*bw,y:0,width:bw,height:H,fill:'transparent'},svg);
    bindTip(hit,r.full||r.label,r.tip);
    hit.addEventListener('mouseenter',()=>p.style.opacity=.75);hit.addEventListener('mouseleave',()=>p.style.opacity=1);
  });
  if(o.ref!=null){const ry=y(o.ref);el('line',{x1:ml,x2:W,y1:ry,y2:ry,stroke:css('--ref'),'stroke-dasharray':'4 3','stroke-width':1.5,'pointer-events':'none'},svg);const t=el('text',{x:ml+6,y:ry-6,class:'lbl'},svg);t.textContent=o.refLabel}
}

/* 100% stacked horizontal bars. cats:[{name,color}], rows:[{label,vals:[..]}] */
function stack100(target,cats,rows,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  const lg=document.createElement('div');lg.className='legend';lg.innerHTML=cats.map(c=>`<span><i style="background:${c.color}"></i>${c.name}</span>`).join('');box.appendChild(lg);
  const W=o.width||560,lw=o.labelW||90,rh=30,gap=14,H=rows.length*(rh+gap);
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img'},box);
  rows.forEach((r,i)=>{
    const y=i*(rh+gap);const tot=r.vals.reduce((a,b)=>a+b,0);let x=lw;
    const t=el('text',{x:0,y:y+rh/2+4},svg);t.textContent=r.label;
    r.vals.forEach((v,j)=>{
      const w=(W-lw)*v/tot;const seg=el('rect',{x:x,y:y,width:Math.max(0,w-2),height:rh,rx:j===r.vals.length-1?4:0,fill:cats[j].color},svg);
      if(w>44){const tt=el('text',{x:x+6,y:y+rh/2+4},svg);tt.textContent=(v/tot*100).toFixed(0)+'%';tt.style.fill='#fff';tt.style.fontWeight=600}
      bindTip(seg,r.label+' · '+cats[j].name,[['Share',(v/tot*100).toFixed(1)+'%'],['Amount',(r.fmt||fmt.int)(v)]]);
      x+=w;
    });
  });
}

/* Scatter. pts:[{x,y,label,hl,tip}] */
function scatter(target,pts,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  const W=o.width||560,H=o.height||340,ml=44,mb=40,mt=10,mr=14;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img'},box);
  const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
  const x0=o.xmin??0,x1=o.xmax??Math.max(...xs)*1.05,y0=o.ymin??0,y1=o.ymax??Math.max(...ys)*1.08;
  const X=v=>ml+(W-ml-mr)*(v-x0)/(x1-x0),Y=v=>mt+(H-mt-mb)*(1-(v-y0)/(y1-y0));
  const g=el('g',{class:'gr'},svg);
  const sx=nice(x1-x0,5),sy=nice(y1-y0,5);
  for(let t=Math.ceil(x0/sx)*sx;t<=x1;t+=sx){el('line',{x1:X(t),x2:X(t),y1:mt,y2:H-mb},g);const tx=el('text',{x:X(t),y:H-mb+14,'text-anchor':'middle'},g);tx.textContent=(o.xaxis||(v=>v))(t)}
  for(let t=Math.ceil(y0/sy)*sy;t<=y1;t+=sy){el('line',{x1:ml,x2:W-mr,y1:Y(t),y2:Y(t)},g);const tx=el('text',{x:ml-6,y:Y(t)+4,'text-anchor':'end'},g);tx.textContent=(o.yaxis||(v=>v))(t)}
  const xl=el('text',{x:(W+ml)/2,y:H-4,'text-anchor':'middle'},svg);xl.textContent=o.xlabel||'';
  const yl=el('text',{x:-(H-mb)/2,y:11,transform:'rotate(-90)','text-anchor':'middle'},svg);yl.textContent=o.ylabel||'';
  pts.forEach(p=>{
    const c=el('circle',{cx:X(p.x),cy:Y(p.y),r:5,fill:css('--accent'),stroke:css('--surface'),'stroke-width':2,'fill-opacity':.85},svg);
    if(p.hl){const t=el('text',{x:X(p.x)+8,y:Y(p.y)+4,class:'lbl'},svg);t.textContent=p.label}
    const hit=el('circle',{cx:X(p.x),cy:Y(p.y),r:11,fill:'transparent'},svg);
    bindTip(hit,p.full||p.label,p.tip);
    hit.addEventListener('mouseenter',()=>c.setAttribute('r',7));hit.addEventListener('mouseleave',()=>c.setAttribute('r',5));
  });
}

/* Tile-grid choropleth */
const LAYOUT=[['AK',0,0],['ME',0,11],['VT',1,10],['NH',1,11],
['WA',2,1],['ID',2,2],['MT',2,3],['ND',2,4],['MN',2,5],['IL',2,6],['WI',2,7],['MI',2,8],['NY',2,9],['RI',2,10],['MA',2,11],
['OR',3,1],['NV',3,2],['WY',3,3],['SD',3,4],['IA',3,5],['IN',3,6],['OH',3,7],['PA',3,8],['NJ',3,9],['CT',3,10],
['CA',4,1],['UT',4,2],['CO',4,3],['NE',4,4],['MO',4,5],['KY',4,6],['WV',4,7],['VA',4,8],['MD',4,9],['DE',4,10],
['AZ',5,2],['NM',5,3],['KS',5,4],['AR',5,5],['TN',5,6],['NC',5,7],['SC',5,8],['DC',5,9],
['OK',6,4],['LA',6,5],['MS',6,6],['AL',6,7],['GA',6,8],['HI',7,0],['TX',7,4],['FL',7,9]];
function tilemap(target,states,key,breaks,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  const by=Object.fromEntries(states.map(s=>[s.st,s]));
  const grid=document.createElement('div');grid.className='tilemap';box.appendChild(grid);
  const cells=Array(8*12).fill(null);LAYOUT.forEach(([st,r,c])=>cells[r*12+c]=st);
  cells.forEach(st=>{const d=document.createElement('div');
    if(!st){d.className='tile empty';grid.appendChild(d);return}
    const s=by[st],v=s[key];let b=breaks.findIndex(t=>v<t);if(b<0)b=breaks.length;
    d.className='tile b'+b;d.innerHTML=st+'<small>'+(o.val||fmt.c)(v)+'</small>';
    d.addEventListener('mousemove',e=>showTip(e,s.name,o.tip(s)));d.addEventListener('mouseleave',hideTip);
    grid.appendChild(d)});
  const lab=['<'+breaks[0]].concat(breaks.slice(1).map((b,i)=>breaks[i]+'–'+b)).concat([breaks[breaks.length-1]+'+']);
  const r=document.createElement('div');r.className='ramp';
  r.innerHTML=(o.unit||'')+' <span style="display:flex;gap:2px">'+lab.map((l,i)=>`<span style="text-align:center;min-width:34px;flex:1"><span class="tile b${i}" style="aspect-ratio:auto;height:8px;display:block;border-radius:3px"></span>${l}</span>`).join('')+'</span>';
  box.appendChild(r);
}

/* Sortable table */
function table(target,cols,rows,o={}){
  const box=typeof target==='string'?$(target):target;box.innerHTML='';
  let sk=o.sort||cols[0].k,dir=o.dir||-1,q='';
  const inp=document.createElement('input');inp.className='search';inp.placeholder=o.placeholder||'Filter…';box.appendChild(inp);
  const wrap=document.createElement('div');wrap.className='tbl-wrap';box.appendChild(wrap);
  function draw(){
    const rs=rows.filter(r=>!q||cols.some(c=>String(r[c.k]).toLowerCase().includes(q))).sort((a,b)=>{const x=a[sk],y=b[sk];return (typeof x==='string'?x.localeCompare(y):(x??-1)-(y??-1))*dir});
    wrap.innerHTML='<table><thead><tr>'+cols.map(c=>`<th data-k="${c.k}" class="${c.k===sk?'sorted':''}">${c.h}${c.k===sk?(dir>0?' ▲':' ▼'):''}</th>`).join('')+'</tr></thead><tbody>'+
      rs.map(r=>'<tr>'+cols.map(c=>'<td>'+(c.f?c.f(r[c.k]):r[c.k])+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
    wrap.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.k;if(k===sk)dir*=-1;else{sk=k;dir=-1}draw()});
  }
  inp.oninput=()=>{q=inp.value.toLowerCase();draw()};draw();
}

/* Theme toggle: re-render on change so SVG colors follow tokens */
function initTheme(render){
  const btn=document.querySelector('.theme-btn');
  let t=null;try{t=localStorage.getItem('theme')}catch(e){}
  if(t)document.documentElement.dataset.theme=t;
  const cur=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  const lab=()=>{if(btn)btn.textContent=cur()==='dark'?'☀ Light':'☾ Dark'};lab();
  if(btn)btn.onclick=()=>{const n=cur()==='dark'?'light':'dark';document.documentElement.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){};lab();render()};
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{lab();render()});
  render();
}
window.Viz={hbar,vbar,stack100,scatter,tilemap,table,fmt,css,initTheme};
})();
