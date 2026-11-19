'use strict';
// A trilha de auditoria é recebida da mesma resposta municipal que alimenta o painel.
// Não consulta novamente as fontes; não converte falhas/ausências em valor zero.
(()=>{
 const byId=id=>document.getElementById(id);
 const state={audit:null,limit:12};
 const nf=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3});
 const mf=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
 const make=(tag,value,cls)=>{
  const e=document.createElement(tag);
  if(value!==undefined&&value!==null)e.textContent=String(value);
  if(cls)e.className=cls;
  return e;
 };
 const date=x=>x&&!Number.isNaN(Date.parse(x))?new Date(x).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}):'Não informada';
 const pretty=value=>value===null?'Indisponível':Number.isFinite(value)?nf.format(value):'Indisponível';
 function fmt(row){
  if(row.status!=='verificado'||!Number.isFinite(row.value))return 'Indisponível';
  if(row.unit==='R$')return mf.format(row.value);
  if(row.unit==='%')return pretty(row.value)+'%';
  if(row.unit==='pontos (0–100)')return pretty(row.value)+' / 100 pontos';
  return pretty(row.value)+(row.unit?' '+row.unit:'');
 }
 function field(parent,label,value){
  const wrap=make('div',null,'audit-field');wrap.append(make('small',label),make('strong',value??'Não informada'));parent.append(wrap);
 }
 function matched(){
  const a=state.audit;
  if(!a||!Array.isArray(a.indicators))return [];
  const search=byId('auditSearch').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const status=byId('auditStatus').value,source=byId('auditSource').value;
  return a.indicators.filter(row=>{
   if(status!=='todos'&&row.status!==status)return false;
   if(source!=='todos'&&row.sourceId!==source)return false;
   const hay=(row.label+' '+row.id+' '+row.sourceName).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   return !search||hay.includes(search);
  });
 }
 function render(){
  const host=byId('auditRows');host.replaceChildren();
  const all=matched(),shown=all.slice(0,state.limit);
  for(const row of shown){
   const details=make('details',null,'audit-entry');
   const summary=make('summary',null,'audit-entry-summary');
   const head=make('div',null,'audit-entry-title');
   head.append(make('strong',row.label));
   head.append(make('small',(row.period||'Competência não informada')+' · '+row.sourceName));
   const right=make('div',null,'audit-entry-valuation');
   right.append(make('b',fmt(row)));
   right.append(make('span',row.status==='verificado'?'Verificado':'Indisponível','audit-status '+(row.status==='verificado'?'audit-ok':'audit-missing')));
   summary.append(head,right);details.append(summary);
   const content=make('div',null,'audit-entry-details');
   const grid=make('div',null,'audit-field-grid');
   field(grid,'Identificador',row.id);
   field(grid,'Município',row.municipality?.nome+' / '+(row.municipality?.uf||'')+' ('+row.municipality?.codigoIBGE+')');
   field(grid,'Valor',row.status==='verificado'?pretty(row.value):'Indisponível');
   field(grid,'Unidade',row.unit||'Não informada');
   field(grid,'Competência da fonte',row.period||'Não informada');
   field(grid,'Momento da consulta',date(row.consultedAt));
   field(grid,'Última atualização publicada pela fonte',date(row.sourceUpdatedAt));
   field(grid,'Tipo de procedência',row.origin);
   content.append(grid);
   content.append(make('p',row.method,'audit-method'));
   if(row.note)content.append(make('p','Nota metodológica: '+row.note,'audit-method'));
   if(row.limitation)content.append(make('p','Limitação: '+row.limitation,'audit-method audit-warn'));
   if(typeof row.sourceUrl==='string'&&row.sourceUrl.startsWith('https://')){
    const a=make('a','Consultar fonte de origem ↗','audit-link');a.href=row.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';content.append(a);
   }
   details.append(content);host.append(details);
  }
  if(!all.length)host.append(make('p',state.audit?'Nenhum indicador corresponde aos filtros selecionados.':'Faça a consulta municipal para abrir os registros de auditoria.','audit-empty'));
  byId('auditMore').hidden=all.length<=state.limit;
  byId('auditMore').textContent='Exibir mais ('+(all.length-state.limit)+' restantes)';
 }
 function underlying(){
  const host=byId('auditUnderlying');host.replaceChildren();
  const a=state.audit;if(!a)return;
  host.append(make('p',a.explanation,'audit-method'));
  host.append(make('p',a.limits,'audit-method'));
  const heading=make('h4','Fontes empregadas nesta consulta');host.append(heading);
  const ul=make('ul',null,'audit-source-list');
  for(const source of a.sources||[]){
   const item=make('li');
   item.append(make('strong',source.name),make('span',' · '+source.verified+'/'+source.total+' registros com valor'));
   if(source.url?.startsWith('https://')){const a=make('a',' Abrir origem ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';item.append(a);}
   ul.append(item);
  }
  host.append(ul);
  host.append(make('h4','Módulos pendentes ou parcialmente atendidos'));
  const gapList=make('ul',null,'audit-gap-list');
  if(!a.gaps?.length)gapList.append(make('li','Não foram identificados módulos pendentes nesta versão.'));
  else for(const gap of a.gaps){const li=make('li');li.append(make('strong',gap.name+' — '+gap.status),make('p',gap.reason));gapList.append(li);}
  host.append(gapList);
  host.append(make('h4','Alertas automáticos de integridade'));
  const warnList=make('ul',null,'audit-gap-list');
  if(!a.warnings?.length)warnList.append(make('li','Nenhum alerta estrutural encontrado nos indicadores apresentados.'));
  else for(const warn of a.warnings.slice(0,60))warnList.append(make('li',warn.id+' — '+warn.message));
  host.append(warnList);
 }
 function cleanCsv(x){
  const raw=x===null||x===undefined?'':String(x);
  // Evita que textos de fontes externas sejam interpretados como fórmulas em planilhas.
  const safe=/^[=+@\-\t\r]/.test(raw)?'\u0027'+raw:raw;
  return '"'+safe.replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
 }
 function exportCsv(){
  const a=state.audit;if(!a)return;
  const cols=['id','indicador','valor','unidade','status','competencia','codigo_ibge','municipio','uf','fonte','url_fonte','procedencia','data_consulta','ultima_atualizacao_fonte','metodologia','nota','limitacao'];
  const rows=[cols];
  for(const item of a.indicators)rows.push([
   item.id,item.label,item.value,item.unit,item.status,item.period,item.municipality?.codigoIBGE,
   item.municipality?.nome,item.municipality?.uf,item.sourceName,item.sourceUrl,item.origin,
   item.consultedAt,item.sourceUpdatedAt,item.method,item.note,item.limitation
  ]);
  const csv='\ufeff'+rows.map(line=>line.map(cleanCsv).join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob),link=make('a');link.href=url;
  link.download='Rede-Cidada_Auditoria_'+a.municipality.codigoIBGE+'.csv';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 function load(a,code){
  if(!a||!Array.isArray(a.indicators)||a.municipality?.codigoIBGE!==code)return;
  state.audit=a;state.limit=12;
  for(const id of ['auditSearch','auditStatus','auditSource','auditCsv'])byId(id).disabled=false;
  byId('auditSearch').value='';byId('auditStatus').value='todos';
  byId('auditTotal').textContent=nf.format(a.total);
  byId('auditVerified').textContent=nf.format(a.verified);
  byId('auditUnavailable').textContent=nf.format(a.unavailable);
  byId('auditSourceCount').textContent=nf.format(a.sources.length);
  byId('auditContext').textContent=a.municipality.nome+' / '+a.municipality.uf+' · IBGE '+code+' · Consulta: '+date(a.consultedAt)+'. A atualização individual das fontes não é inferida.';
  const sources=byId('auditSource');sources.replaceChildren();
  const all=make('option','Todas as fontes');all.value='todos';sources.append(all);
  for(const source of a.sources){const o=make('option',source.name);o.value=source.id;sources.append(o);}
  render();underlying();
 }
 document.addEventListener('diagnostico:municipio',e=>load(e.detail?.audit,String(e.detail?.ibge||'')));
 for(const id of ['auditSearch','auditStatus','auditSource'])byId(id).addEventListener(id==='auditSearch'?'input':'change',()=>{state.limit=12;render();});
 byId('auditMore').addEventListener('click',()=>{state.limit+=12;render();});
 byId('auditCsv').addEventListener('click',exportCsv);
 render();
})();
