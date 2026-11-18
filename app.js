'use strict';
// A versão premium é padrão. A ultracompacta é comparável sem mudar de domínio ou dados.
const navStyle = new URLSearchParams(window.location.search).get('barra') === 'ultra' ? 'ultra' : 'premium';
document.documentElement.dataset.navStyle=navStyle;
const qs = s=>document.querySelector(s);
const state={selected:null,data:null,analysis:null,searchController:null,activeKind:'themes',activeId:'demografia',expanded:false};
const TAXONOMY=window.DIAGNOSTICO_TAXONOMY;
const nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
const curr=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const idToLabel={'verificado':'Verificado','nao_integrado':'Não integrado','indisponivel':'Indisponível','parcial':'Parcial'};

const SVGNS='http://www.w3.org/2000/svg';
function createText(tag,text,cls){
 const node=document.createElement(tag);node.textContent=String(text);if(cls)node.className=cls;return node;
}
function createTab(item,kind){
 const button=document.createElement('button');
 button.type='button';button.className='dashboard-tab';
 button.dataset.group=item.id;button.dataset.kind=kind;
 button.setAttribute('aria-label',(kind==='themes'?'Eixo temático: ':'Público: ')+(item.name==='MSE'?'MSE — Medida Socioeducativa':item.name));
 if(item.name==='MSE')button.title='MSE — Medida Socioeducativa';
 button.setAttribute('aria-controls','activePanel');
 const svg=document.createElementNS(SVGNS,'svg');
 svg.setAttribute('class','tab-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('viewBox','0 0 24 24');
 const use=document.createElementNS(SVGNS,'use');use.setAttribute('href','#'+item.icon);svg.append(use);
 const name=createText('span',item.name,'tab-name');const pill=createText('small','—','tab-count');
 button.append(svg,name,pill);
 button.addEventListener('click',()=>{
  state.activeKind=kind;state.activeId=item.id;state.expanded=false;
  drawPanel(state.data);
  const panel=qs('#activePanel');
  if(panel && panel.getBoundingClientRect().top<0)panel.scrollIntoView({behavior:'smooth',block:'start'});
 });
 return button;
}
function initTabs(){
 qs('#switchThemes').addEventListener('click',()=>switchMode('themes'));
 qs('#switchAudiences').addEventListener('click',()=>switchMode('audiences'));
 updateTabStates();
}
function switchMode(kind){
 if(!['themes','audiences'].includes(kind)||state.activeKind===kind)return;
 state.activeKind=kind;
 state.activeId=kind==='themes'?'demografia':'juventude';
 state.expanded=false;
 qs('#activeTabs').dataset.kind='';
 drawPanel(state.data);
}
function updateTabStates(){
 const host=qs('#activeTabs');
 const kind=state.activeKind;
 const items=TAXONOMY[kind];
 if(host.dataset.kind!==kind){
  host.replaceChildren(...items.map(item=>createTab(item,kind)));
  host.dataset.kind=kind;
 }
 for(const [i,button] of [...host.children].entries()){
  const active=items[i].id===state.activeId;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
  const values=state.data?items[i].ids.map(id=>state.data.indicators.find(v=>v.id===id)).filter(Boolean):[];
  const count=values.filter(v=>v.status==='verificado'&&v.value!==null).length;
  button.querySelector('.tab-count').textContent=!state.data?'—':items[i].ids.length===0?'Pendente':count+'/'+values.length;
 }
 for(const [selector,enabled] of [['#switchThemes',kind==='themes'],['#switchAudiences',kind==='audiences']]){
  const button=qs(selector);
  button.classList.toggle('is-active',enabled);button.setAttribute('aria-pressed',String(enabled));
 }
 qs('#navCaption').textContent=kind==='themes'?'6 eixos':'6 públicos';
}
function appendIndicatorLine(container,item,context=false){
 const line=document.createElement('div');
 line.className='indicator-line '+(item?.status==='verificado'&&!context?'':'unavailable');
 const left=document.createElement('div');
 left.append(createText('b',item.label));
 const source=state.data?.sources?.[item.source]?.name||'Fonte não cadastrada';
 left.append(createText('small',source+' · '+(item.period||'Sem competência publicada')));
 const value=createText('strong',item.status==='verificado'?fmt(item):'Indisponível');
 if(context){line.classList.add('context-line');value.title='Contexto territorial — não representa contagem desse público';}
 line.append(left,value);container.append(line);
}
function drawPanel(d){
 const group=(TAXONOMY[state.activeKind]||[]).find(g=>g.id===state.activeId)||TAXONOMY.themes[0];
 if(!group)return;
 updateTabStates();
 qs('#groupKind').textContent=state.activeKind==='themes'?'EIXO TEMÁTICO':'PÚBLICO PRIORITÁRIO';
 qs('#groupTitle').textContent=group.name;
 qs('#groupDescription').textContent=group.description;
 const all=group.ids.map(id=>d?.indicators?.find(v=>v.id===id)).filter(Boolean);
 const verified=all.filter(ind=>ind.status==='verificado'&&ind.value!==null);
 const total=all.length; // denominador apenas dos indicadores servidos para a UF selecionada
 const label=!d?'Aguardando consulta':total===0?'Em implantação':verified.length===total?'Validado neste recorte':verified.length?'Parcial':'Indisponível';
 qs('#groupStatus').textContent=label;
 qs('#indicatorCount').textContent=(d?verified.length:0)+' verificados';
 qs('#groupDataCaption').textContent=d?verified.length+' de '+total+' indicadores deste recorte com valor verificado':'Consulta municipal ainda não realizada';
 const featured=qs('#featuredMetrics');featured.replaceChildren();
 if(verified.length){
  for(const item of verified.slice(0,4)){
   const card=document.createElement('article');card.className='metric-card';
   card.append(createText('span',item.label,'metric-label'));
   card.append(createText('strong',fmt(item),'metric-value'));
   card.append(createText('small',(d.sources[item.source]?.name||'Fonte oficial')+' · '+item.period,'metric-source'));
   featured.append(card);
  }
 }else{
  const placeholder=document.createElement('div');placeholder.className='metrics-placeholder';
  placeholder.append(createText('strong',!d?'Escolha um município':'Aguardando dados validados para este recorte'));
  placeholder.append(createText('p',!d?'Faça a consulta na capa para carregar os indicadores oficiais.':'A ausência de dados neste painel não significa ausência de demandas sociais ou valor zero.'));
  featured.append(placeholder);
 }
 const list=qs('#indicatorList');list.replaceChildren();
 const view=state.expanded?all:all.slice(0,6);
 for(const item of view)appendIndicatorLine(list,item);
 if(!all.length)list.append(createText('div','Não há indicadores diretos integrados neste recorte. Consulte as bases em validação ao lado.','empty'));
 const context=(group.contextIds||[]).map(id=>d?.indicators.find(x=>x.id===id)).filter(x=>x&&x.status==='verificado');
 if(context.length){
  list.append(createText('p',state.activeKind==='themes'?'Contexto transversal do território — não mede este eixo diretamente':'Contexto geral do município — não mede diretamente este público','context-heading'));
  for(const item of context)appendIndicatorLine(list,item,true);
 }
 const show=qs('#showAllBtn');show.hidden=all.length<=6;
 show.textContent=state.expanded?'Recolher indicadores':'Ver todos ('+all.length+')';
 const gaps=qs('#groupGaps');gaps.replaceChildren();
 gaps.append(createText('h4','Fontes em validação'));
 for(const entry of group.pending||[]){
  const link=document.createElement('a');link.href=entry.url;link.target='_blank';link.rel='noopener noreferrer';
  link.append(createText('strong',entry.label));link.append(createText('small',entry.source));
  gaps.append(link);
 }
 if(!group.pending?.length)gaps.append(createText('p','Nenhuma fonte adicional listada para este recorte.','panel-help'));
 if(d){
  qs('#qualityTag').textContent=d.quality.verified+' / '+d.quality.total+' demonstrativos';
  qs('#coverage').textContent=d.quality.coveragePercent+'%';
  qs('#coverageBar').style.width=d.quality.coveragePercent+'%';
 }else{
  qs('#qualityTag').textContent='Aguardando';qs('#coverage').textContent='—';qs('#coverageBar').style.width='0';
 }
}

function status(text,problem=false){const e=qs('#globalNotice');e.querySelector('span:last-child').textContent=text;e.style.background=problem?'#fff4e6':'#e9f2ff';}
function fmt(ind){if(!ind||ind.value===null)return '—';if(ind.unit==='R(ind.unit==='pessoas'?'':ind.unit==='km²'?' km²':ind.unit==='hab./km²'?' hab./km²':ind.unit==='%'?'%':ind.unit==='postos potenciais'?' postos potenciais':'');}
function enableReady(on){qs('#analysisBtn').disabled=!on;qs('#pdfTop').disabled=!on;qs('#pdfBottom').disabled=!on;}
function select(m){
  state.selected=m;state.data=null;state.analysis=null;
  drawPanel(null);
  qs('#citySearch').value=m.nome+' / '+m.uf;
  qs('#suggestions').hidden=true;
  qs('#loadBtn').disabled=false;
  qs('#territoryCaption').textContent='Território selecionado: '+m.nome+' / '+m.uf+' · Código IBGE '+m.codigoIBGE+'. Clique em Gerar diagnóstico.';
  enableReady(false);
}
let searchTimer;
qs('#citySearch').addEventListener('input',e=>{
  state.selected=null;state.data=null;qs('#loadBtn').disabled=true;enableReady(false);drawPanel(null);
  const q=e.target.value.trim();clearTimeout(searchTimer);
  if(q.length<2){qs('#suggestions').hidden=true;return;}
  searchTimer=setTimeout(async()=>{
    if(state.searchController)state.searchController.abort();
    state.searchController=new AbortController();
    const host=qs('#suggestions');host.hidden=false;host.replaceChildren();
    const loading=document.createElement('div');loading.className='empty';loading.textContent='Consultando municípios do IBGE...';host.append(loading);
    try{
      const r=await fetch('/api/municipios?q='+encodeURIComponent(q),{signal:state.searchController.signal});
      if(!r.ok)throw new Error('A fonte de municípios não respondeu.');
      const d=await r.json();host.replaceChildren();
      if(!(d.items||[]).length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Nenhum município correspondente.';host.append(empty);return;}
      for(const m of d.items){
        const button=document.createElement('button');button.type='button';
        const label=document.createElement('strong');label.textContent=m.nome+' / '+m.uf;
        const sub=document.createElement('small');sub.textContent='Código IBGE: '+m.codigoIBGE;
        button.append(label,sub);button.onclick=()=>select(m);host.append(button);
      }
    }catch(err){if(err.name!=='AbortError'){host.replaceChildren();const p=document.createElement('div');p.className='empty';p.textContent='Consulta indisponível. Use uma das consultas rápidas ou tente novamente.';host.append(p);}}
  },350);
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-box'))qs('#suggestions').hidden=true;});
document.querySelectorAll('.sample-city').forEach(el=>el.addEventListener('click',()=>select({codigoIBGE:el.dataset.ibge,nome:el.dataset.city,uf:el.dataset.uf})));
qs('#loadBtn').onclick=async()=>{
 if(!state.selected)return;
 const button=qs('#loadBtn');button.disabled=true;button.textContent='Consultando fontes...';
 status('Buscando indicadores oficiais para '+state.selected.nome+' e verificando a qualidade das respostas.');
 try{
  const r=await fetch('/api/diagnostico?ibge='+encodeURIComponent(state.selected.codigoIBGE),{cache:'no-store'});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível validar as fontes.');
  if(d.municipio.codigoIBGE!==state.selected.codigoIBGE)throw new Error('O município retornado não corresponde à seleção.');
  state.data=d;state.analysis=null;render(d);enableReady(true);
  status('Consulta concluída. '+d.quality.verified+' de '+d.quality.total+' indicadores demonstrativos verificados. Consulte as lacunas antes de decidir.');
  document.getElementById('indicadores').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }catch(err){status(err.message,true)}
 finally{button.disabled=false;button.textContent='Consultar território ↗';}
};
function set(id,value){qs(id).textContent=value;}
function render(d){
 set('#territoryCaption',d.municipio.nome+' / '+d.municipio.uf+' · Código IBGE '+d.municipio.codigoIBGE+' · fontes e competências oficiais.');
 set('#lastUpdated','CONSULTA: '+new Date(d.generatedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}));
 drawPanel(d);
 const modules=qs('#moduleList');modules.replaceChildren();
 for(const mod of d.modules){
  const card=document.createElement('article');card.className='module';
  const header=document.createElement('div');header.className='module-top';
  const title=createText('b',mod.name);
  const tag=createText('span',idToLabel[mod.status]||mod.status,'pill '+(mod.status==='verificado'?'ok':(mod.status==='nao_integrado'||mod.status==='parcial')?'pending':'bad'));
  header.append(title,tag);
  const desc=createText('small',mod.reason||(mod.status==='verificado'?'Consulta estruturada com valores rastreáveis.':'Sem dados validados.'));
  card.append(header,desc);
  const url=d.sources?.[mod.source]?.url;
  if(url&&/^https:\/\//.test(url)){const anchor=document.createElement('a');anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='Consultar fonte oficial ↗';card.append(anchor);}
  modules.append(card);
 }
 qs('#analysisTitle').textContent='Leitura social fundamentada';
 qs('#analysisMode').textContent='Análise ainda não solicitada';
 const body=qs('#analysisBody');body.replaceChildren();
 body.append(createText('p','Clique em Gerar análise social para relacionar os indicadores verificados e identificar os próximos passos, sem preencher lacunas.'));
}
qs('#showAllBtn').onclick=()=>{state.expanded=!state.expanded;drawPanel(state.data);};
initTabs();
drawPanel(null);
qs('#analysisBtn').onclick=async()=>{
 if(!state.data)return;
 const b=qs('#analysisBtn');b.disabled=true;b.textContent='Gerando análise...';
 try{
  const r=await fetch('/api/analise',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ibge:state.data.municipio.codigoIBGE})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Erro de análise');
  if(d.municipio.codigoIBGE!==state.data.municipio.codigoIBGE)throw new Error('Município divergente.');
  state.analysis=d.analysis;
  qs('#analysisTitle').textContent=d.analysis.title;
  qs('#analysisMode').textContent=d.analysis.mode==='ia'?'Gerada por IA · revisar tecnicamente':'Regras auditáveis · IA generativa não configurada';
  const area=qs('#analysisBody');area.replaceChildren();
  for(const text of d.analysis.paragraphs){const p=document.createElement('p');p.textContent=text;area.append(p);}
  for(const text of d.analysis.limitations){const p=document.createElement('p');p.style.fontSize='10px';p.style.color='#788aa0';p.textContent='Limitação: '+text;area.append(p);}
  status('Leitura social concluída. As interpretações exigem revisão humana antes de subsidiar uma proposta.');
 }catch(err){status(err.message,true)}
 finally{b.disabled=false;b.textContent='✧ Gerar análise social';}
};
async function downloadPdf(){
 if(!state.data)return;
 const buttons=[qs('#pdfTop'),qs('#pdfBottom')];buttons.forEach(x=>x.disabled=true);
 status('Gerando PDF institucional a partir de nova consulta oficial. Não serão utilizados números manipulados no navegador.');
 try{
  const r=await fetch('/api/relatorio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ibge:state.data.municipio.codigoIBGE})});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Não foi possível produzir o relatório.')}
  if(!(r.headers.get('content-type')||'').includes('application/pdf'))throw new Error('O servidor não retornou um PDF.');
  const blob=await r.blob();if(blob.size<1000)throw new Error('O arquivo PDF está incompleto.');
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download='Rede-Cidada_Diagnostico_'+state.data.municipio.codigoIBGE+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  status('Relatório gerado com indicadores, fontes, lacunas e análise técnica preliminar.');
 }catch(e){status(e.message,true)}
 finally{buttons.forEach(x=>x.disabled=false)}
}
qs('#pdfTop').onclick=downloadPdf;qs('#pdfBottom').onclick=downloadPdf;
const sections=document.querySelectorAll('main section[id]');
const nav=document.querySelectorAll('.side-nav a');
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(items=>{for(const it of items)if(it.isIntersecting)nav.forEach(a=>{const active=a.getAttribute('href')==='#'+it.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});},{rootMargin:'-20% 0px -64% 0px'});
 sections.forEach(s=>observer.observe(s));
}
)return curr.format(ind.value);if(ind.unit==='índice (0–1)')return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(ind.value);return nf.format(ind.value)+(ind.unit==='pessoas'?'':ind.unit==='km²'?' km²':ind.unit==='hab./km²'?' hab./km²':ind.unit==='%'?'%':ind.unit==='postos potenciais'?' postos potenciais':'');}
function enableReady(on){qs('#analysisBtn').disabled=!on;qs('#pdfTop').disabled=!on;qs('#pdfBottom').disabled=!on;}
function select(m){
  state.selected=m;state.data=null;state.analysis=null;
  drawPanel(null);
  qs('#citySearch').value=m.nome+' / '+m.uf;
  qs('#suggestions').hidden=true;
  qs('#loadBtn').disabled=false;
  qs('#territoryCaption').textContent='Território selecionado: '+m.nome+' / '+m.uf+' · Código IBGE '+m.codigoIBGE+'. Clique em Gerar diagnóstico.';
  enableReady(false);
}
let searchTimer;
qs('#citySearch').addEventListener('input',e=>{
  state.selected=null;state.data=null;qs('#loadBtn').disabled=true;enableReady(false);drawPanel(null);
  const q=e.target.value.trim();clearTimeout(searchTimer);
  if(q.length<2){qs('#suggestions').hidden=true;return;}
  searchTimer=setTimeout(async()=>{
    if(state.searchController)state.searchController.abort();
    state.searchController=new AbortController();
    const host=qs('#suggestions');host.hidden=false;host.replaceChildren();
    const loading=document.createElement('div');loading.className='empty';loading.textContent='Consultando municípios do IBGE...';host.append(loading);
    try{
      const r=await fetch('/api/municipios?q='+encodeURIComponent(q),{signal:state.searchController.signal});
      if(!r.ok)throw new Error('A fonte de municípios não respondeu.');
      const d=await r.json();host.replaceChildren();
      if(!(d.items||[]).length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Nenhum município correspondente.';host.append(empty);return;}
      for(const m of d.items){
        const button=document.createElement('button');button.type='button';
        const label=document.createElement('strong');label.textContent=m.nome+' / '+m.uf;
        const sub=document.createElement('small');sub.textContent='Código IBGE: '+m.codigoIBGE;
        button.append(label,sub);button.onclick=()=>select(m);host.append(button);
      }
    }catch(err){if(err.name!=='AbortError'){host.replaceChildren();const p=document.createElement('div');p.className='empty';p.textContent='Consulta indisponível. Use uma das consultas rápidas ou tente novamente.';host.append(p);}}
  },350);
});
document.addEventListener('click',e=>{if(!e.target.closest('.search-box'))qs('#suggestions').hidden=true;});
document.querySelectorAll('.sample-city').forEach(el=>el.addEventListener('click',()=>select({codigoIBGE:el.dataset.ibge,nome:el.dataset.city,uf:el.dataset.uf})));
qs('#loadBtn').onclick=async()=>{
 if(!state.selected)return;
 const button=qs('#loadBtn');button.disabled=true;button.textContent='Consultando fontes...';
 status('Buscando indicadores oficiais para '+state.selected.nome+' e verificando a qualidade das respostas.');
 try{
  const r=await fetch('/api/diagnostico?ibge='+encodeURIComponent(state.selected.codigoIBGE),{cache:'no-store'});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível validar as fontes.');
  if(d.municipio.codigoIBGE!==state.selected.codigoIBGE)throw new Error('O município retornado não corresponde à seleção.');
  state.data=d;state.analysis=null;render(d);enableReady(true);
  status('Consulta concluída. '+d.quality.verified+' de '+d.quality.total+' indicadores demonstrativos verificados. Consulte as lacunas antes de decidir.');
  document.getElementById('indicadores').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }catch(err){status(err.message,true)}
 finally{button.disabled=false;button.textContent='Consultar território ↗';}
};
function set(id,value){qs(id).textContent=value;}
function render(d){
 set('#territoryCaption',d.municipio.nome+' / '+d.municipio.uf+' · Código IBGE '+d.municipio.codigoIBGE+' · fontes e competências oficiais.');
 set('#lastUpdated','CONSULTA: '+new Date(d.generatedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}));
 drawPanel(d);
 const modules=qs('#moduleList');modules.replaceChildren();
 for(const mod of d.modules){
  const card=document.createElement('article');card.className='module';
  const header=document.createElement('div');header.className='module-top';
  const title=createText('b',mod.name);
  const tag=createText('span',idToLabel[mod.status]||mod.status,'pill '+(mod.status==='verificado'?'ok':(mod.status==='nao_integrado'||mod.status==='parcial')?'pending':'bad'));
  header.append(title,tag);
  const desc=createText('small',mod.reason||(mod.status==='verificado'?'Consulta estruturada com valores rastreáveis.':'Sem dados validados.'));
  card.append(header,desc);
  const url=d.sources?.[mod.source]?.url;
  if(url&&/^https:\/\//.test(url)){const anchor=document.createElement('a');anchor.href=url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='Consultar fonte oficial ↗';card.append(anchor);}
  modules.append(card);
 }
 qs('#analysisTitle').textContent='Leitura social fundamentada';
 qs('#analysisMode').textContent='Análise ainda não solicitada';
 const body=qs('#analysisBody');body.replaceChildren();
 body.append(createText('p','Clique em Gerar análise social para relacionar os indicadores verificados e identificar os próximos passos, sem preencher lacunas.'));
}
qs('#showAllBtn').onclick=()=>{state.expanded=!state.expanded;drawPanel(state.data);};
initTabs();
drawPanel(null);
qs('#analysisBtn').onclick=async()=>{
 if(!state.data)return;
 const b=qs('#analysisBtn');b.disabled=true;b.textContent='Gerando análise...';
 try{
  const r=await fetch('/api/analise',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ibge:state.data.municipio.codigoIBGE})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Erro de análise');
  if(d.municipio.codigoIBGE!==state.data.municipio.codigoIBGE)throw new Error('Município divergente.');
  state.analysis=d.analysis;
  qs('#analysisTitle').textContent=d.analysis.title;
  qs('#analysisMode').textContent=d.analysis.mode==='ia'?'Gerada por IA · revisar tecnicamente':'Regras auditáveis · IA generativa não configurada';
  const area=qs('#analysisBody');area.replaceChildren();
  for(const text of d.analysis.paragraphs){const p=document.createElement('p');p.textContent=text;area.append(p);}
  for(const text of d.analysis.limitations){const p=document.createElement('p');p.style.fontSize='10px';p.style.color='#788aa0';p.textContent='Limitação: '+text;area.append(p);}
  status('Leitura social concluída. As interpretações exigem revisão humana antes de subsidiar uma proposta.');
 }catch(err){status(err.message,true)}
 finally{b.disabled=false;b.textContent='✧ Gerar análise social';}
};
async function downloadPdf(){
 if(!state.data)return;
 const buttons=[qs('#pdfTop'),qs('#pdfBottom')];buttons.forEach(x=>x.disabled=true);
 status('Gerando PDF institucional a partir de nova consulta oficial. Não serão utilizados números manipulados no navegador.');
 try{
  const r=await fetch('/api/relatorio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ibge:state.data.municipio.codigoIBGE})});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Não foi possível produzir o relatório.')}
  if(!(r.headers.get('content-type')||'').includes('application/pdf'))throw new Error('O servidor não retornou um PDF.');
  const blob=await r.blob();if(blob.size<1000)throw new Error('O arquivo PDF está incompleto.');
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download='Rede-Cidada_Diagnostico_'+state.data.municipio.codigoIBGE+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  status('Relatório gerado com indicadores, fontes, lacunas e análise técnica preliminar.');
 }catch(e){status(e.message,true)}
 finally{buttons.forEach(x=>x.disabled=false)}
}
qs('#pdfTop').onclick=downloadPdf;qs('#pdfBottom').onclick=downloadPdf;
const sections=document.querySelectorAll('main section[id]');
const nav=document.querySelectorAll('.side-nav a');
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(items=>{for(const it of items)if(it.isIntersecting)nav.forEach(a=>{const active=a.getAttribute('href')==='#'+it.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});},{rootMargin:'-20% 0px -64% 0px'});
 sections.forEach(s=>observer.observe(s));
}
