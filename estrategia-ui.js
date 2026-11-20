'use strict';
/* Camada de apresentação: usa exclusivamente indicadores retornados pela API
   para o município consultado. Não cria estimativas nem deduz demanda de nulos. */
(function(){
const catalog=window.RC_STRATEGY_CATALOG;
if(!catalog)return;
let diagnostic=null;
let fundingExpanded=false,projectsExpanded=false;
const fmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
const el=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==null&&txt!==undefined)x.textContent=String(txt);if(cls)x.className=cls;return x;};
const link=(href,title)=>{const x=el('a',title,'strategy-link');x.href=href;x.target='_blank';x.rel='noopener noreferrer';return x;};
function evidenceSummary(found){
 const out=el('div',null,'strategy-evidence');
 if(!diagnostic){out.append(el('p','Selecione um município para relacionar esta causa com dados territoriais.','strategy-muted'));return out;}
 if(found.length===0){out.append(el('p','Sem indicador municipal numérico validado para esta causa. A pertinência é hipótese de prospecção, não demanda comprovada.','strategy-warning'));return out;}
 out.append(el('small','EVIDÊNCIAS MUNICIPAIS CONSULTADAS'));
 for(const item of found.slice(0,3)){
   const p=el('p');
   const v=fmt.format(item.value)+' '+item.unit+' · '+(item.period||'competência não informada');
   p.append(el('strong',item.label+': '),document.createTextNode(v));out.append(p);
 }
 return out;
}
function populateCauseSelect(id) {
 const select=$(id);if(!select)return;
 select.replaceChildren(new Option('Todas as causas','todas'));
 for(const c of catalog.causes)select.add(new Option(c.name,c.id));
}
function selectedList(all,id){
 const cause=$(id)?.value||'todas';
 if(cause==='todas')return all;
 return all.filter(v=>v.causes.includes(cause));
}
function fundingCard(s){
 const card=el('article',null,'strategy-card');
 const top=el('div',null,'strategy-card-top');
 top.append(el('span','CANAL POTENCIAL · NÃO É EDITAL ABERTO','strategy-eyebrow'),el('span',s.verified.length?'Com evidência contextual':'A validar','strategy-status'));
 card.append(top,el('h3',s.name),el('p',s.audience,'strategy-audience'));
 const main=el('p',s.mechanism,'strategy-body');card.append(main);
 card.append(evidenceSummary(s.verified));
 const note=el('p',null,'strategy-caveat');note.append(el('strong','Condição de acesso: '),document.createTextNode(s.qualification));card.append(note);
 card.append(link(s.url,'Consultar fonte e requisitos ↗'));return card;
}
function projectCard(p){
 const card=el('article',null,'strategy-card strategy-project');
 card.append(el('span',p.status,'strategy-eyebrow'),el('h3',p.name),el('p',p.audience,'strategy-audience'),el('p',p.description,'strategy-body'));
 card.append(evidenceSummary(p.verified));
 const fundingNames=p.funds.map(id=>catalog.sources.find(s=>s.id===id)?.name).filter(Boolean);
 const fund=el('p',null,'strategy-caveat');fund.append(el('strong','Fontes a prospectar: '),document.createTextNode(fundingNames.join(' · ')));card.append(fund);
 const note=el('p',null,'strategy-caveat');note.append(el('strong','Condição técnica: '),document.createTextNode(p.caution));card.append(note);return card;
}
function drawFunding(){
 const all=catalog.match(diagnostic,selectedList(catalog.sources,'fundingCause'));
 const visible=fundingExpanded?all:all.slice(0,6);
 const host=$('fundingCards');if(!host)return;host.replaceChildren(...visible.map(fundingCard));
 const more=$('fundingMore');more.hidden=all.length<=6;more.textContent=fundingExpanded?'Exibir menos':'Exibir todas as '+all.length+' fontes';
 $('fundingCaption').textContent=diagnostic?'Articulação proposta para '+diagnostic.municipio.nome+' / '+diagnostic.municipio.uf+'. Verificar programas e editais com cada concedente.':'Fontes prováveis por público e causa; selecione um município para vincular evidências numéricas.';
}
function drawProjects(){
 const all=catalog.match(diagnostic,selectedList(catalog.projects,'projectCause'));
 const visible=projectsExpanded?all:all.slice(0,6);
 const host=$('projectCards');if(!host)return;host.replaceChildren(...visible.map(projectCard));
 const more=$('projectMore');more.hidden=all.length<=6;more.textContent=projectsExpanded?'Exibir menos':'Exibir todos os '+all.length+' projetos';
 $('projectsCaption').textContent=diagnostic?'Compatibilidade metodológica preliminar para '+diagnostic.municipio.nome+' / '+diagnostic.municipio.uf+'. Avaliar diagnóstico, parceiros e condições de execução.':'Programas e metodologias da Rede Cidadã; presença no catálogo não confirma execução ou financiamento no município.';
}
function drawPrison(){
 const links=$('prisonSources');if(!links)return;
 links.replaceChildren();
 for(const s of catalog.prisonSources){
  const entry=el('article',null,'strategy-source');
  entry.append(el('b',s.name),el('p',s.detail),el('small',s.state),link(s.url,'Consultar base oficial ↗'));links.append(entry);
 }
}
function drawReadiness(){
 const host=$('causeReadiness');if(!host)return;host.replaceChildren();
 for(const c of catalog.causes){
   const got=catalog.evidence(diagnostic,c.ids);
   const block=el('div',null,'strategy-cause');
   block.append(el('b',c.name),el('strong',got.length?got.length+' indicador(es) com valor':'A validar'));
   if(got.length)block.append(el('small',got.slice(0,2).map(x=>x.label).join(' · ')));
   else block.append(el('small','Sem valores municipais homologados para esta causa'));
   host.append(block);
 }
}
function render(data) {
 diagnostic=data||null;drawReadiness();drawPrison();drawFunding();drawProjects();
}
document.addEventListener('DOMContentLoaded',()=>{
 for(const id of ['fundingCause','projectCause'])populateCauseSelect(id);
 $('fundingCause')?.addEventListener('change',()=>{fundingExpanded=false;drawFunding();});
 $('projectCause')?.addEventListener('change',()=>{projectsExpanded=false;drawProjects();});
 $('fundingMore')?.addEventListener('click',()=>{fundingExpanded=!fundingExpanded;drawFunding();});
 $('projectMore')?.addEventListener('click',()=>{projectsExpanded=!projectsExpanded;drawProjects();});
 render(null);
});
window.RC_STRATEGY_RENDER=render;
})();
