'use strict';
(function(){
 const $=s=>document.querySelector(s);
 const panel=$('#habilitacoes'),cards=$('#registryCards');
 let abort=null,active='';
 function txt(tag,value,klass){const el=document.createElement(tag);el.textContent=String(value||'');if(klass)el.className=klass;return el;}
 function date(v){if(!v)return 'Não informada';if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const [y,m,d]=v.split('-');return d+'/'+m+'/'+y;}return v;}
 function line(el,label,value){const row=txt('div','','registry-row');row.append(txt('span',label),txt('strong',value||'Não informado'));el.append(row);}
 function card(title,o,registration=false){
  const c=txt('article','','registry-card');c.append(txt('h3',title),txt('b',o.status||'Não informado','registry-status'));
  if(o.numero)line(c,'Nº de inscrição/registro',o.numero);
  if(o.inicio)line(c,'Início',date(o.inicio));
  line(c,'Validade informada',date(o.validade));
  if(o.condicaoData==='vencido')c.append(txt('p','Data expirada na planilha; conferir renovação.','registry-warning'));
  else if(o.condicaoData==='data_futura')c.append(txt('p','Data futura informada, sujeita à conferência.','registry-note'));
  else if(o.condicaoData==='informacao_textual')c.append(txt('p','Prazo textual; vigência não calculável.','registry-note'));
  if(registration)c.append(txt('p','Situação geral do CMDCA; não comprova separadamente o registro sem documento específico.','registry-note'));
  return c;
 }
 async function consult(e){
  const field=$('#citySearch')?.value||'';
  const match=field.match(/^(.+)\s+\/\s+([A-Za-z]{2})$/);
  if(!match||!e.detail?.ibge)return;
  if(abort)abort.abort();abort=new AbortController();
  const ctl=abort,nome=match[1].trim(),uf=match[2].toUpperCase();
  const code=String(e.detail.ibge);active=code;
  panel.hidden=false;$('#registryTerritory').textContent='Verificando '+nome+'/'+uf+' na base institucional...';
  $('#registryMode').textContent='Consultando modalidade';
  cards.replaceChildren(txt('p','Consultando CMDCA, CMAS e CMDPI...','registry-empty'));
  try{
   const res=await fetch('/api/municipios?cadastros=1&municipio='+encodeURIComponent(nome)+'&uf='+encodeURIComponent(uf),{signal:ctl.signal,cache:'no-store'});
   const v=await res.json();if(!res.ok)throw Error(v.error||'A base institucional está indisponível.');
   if(ctl.signal.aborted||active!==code)return;
   $('#registryTerritory').textContent=nome+'/'+uf+' · consulta dos registros institucionais';
   cards.replaceChildren();
   if(!v.found){
    $('#registryMode').textContent='Modalidade não encontrada';
    cards.append(txt('p',v.message||'Município não consta desta planilha, sem confirmação sobre registros.','registry-empty'));
   }else{
    const a=v.record;$('#registryMode').textContent='Modalidade: '+a.modalidade;
    cards.append(card('CMDCA · Inscrição da Aprendizagem',a.cmdcaInscricao),card('CMDCA · Registro da Entidade',a.cmdcaRegistro,true),card('CMAS · Inscrição',a.cmas),card('CMDPI · Registro',a.cmdpi));
   }
   const f=v.source,day=f?.updatedAt?new Date(f.updatedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'não informada';
   $('#registrySourceDate').textContent='SharePoint · aba '+(f?.sheet||'Socioaprendizagem')+' · atualizado em '+day+' · retrato da planilha (não é sincronização em tempo real).';
   if(f?.url)$('#registrySourceLink').href=f.url;
  }catch(err){
   if(ctl.signal.aborted||active!==code)return;
   $('#registryMode').textContent='Sem verificação';
   $('#registryTerritory').textContent=nome+'/'+uf;
   cards.replaceChildren(txt('p',String(err.message||'Consulta indisponível'),'registry-empty'));
   $('#registrySourceDate').textContent='Nenhum registro foi presumido nesta consulta.';
  }
 }
 $('#citySearch').addEventListener('input',()=>{if(abort)abort.abort();active='';panel.hidden=true;});
 document.addEventListener('diagnostico:municipio',consult);
})();
