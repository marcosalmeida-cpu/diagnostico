'use strict';
// Diretórios públicos independentes da análise estatística, sem modificar o painel.
(()=>{
 const el=id=>document.getElementById(id);
 const state={code:null,ticket:0,
  suas:{page:0,items:[],hasMore:false,type:'',busy:false},
  osc:{page:0,items:[],hasMore:false,busy:false}};
 const make=(tag,txt,cls)=>{const x=document.createElement(tag);if(txt!==null)x.textContent=String(txt);if(cls)x.className=cls;return x;};
 const link=(name,url)=>{const a=make('a',name);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const plain=(v,fallback='Não informado')=>typeof v==='string'&&v.trim()?v.trim():fallback;
 const status=(which,msg)=>{el(which+'Status').textContent=msg;};
 async function readJson(url){
  const r=await fetch(url,{cache:'no-store'});const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||'A fonte não respondeu à consulta.');
  return j;
 }
 function renderCards(which){
  const data=state[which],target=el(which+'List');
  target.replaceChildren();
  const search=which==='osc'?(el('oscFilter').value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase():'';
  let displayed=0;
  for(const entry of data.items){
   const hay=[entry.name,entry.category,entry.activity,entry.cnpj,(entry.areas||[]).join(' ')].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(search&&!hay.includes(search))continue;
   displayed++;
   const card=make('article',null,'directory-entry');
   const top=make('div',null,'directory-entry-top');
   top.append(make('h4',entry.name||'Unidade sem nome'));
   if(entry.category)top.append(make('span',entry.category,'directory-pill'));
   card.append(top);
   if(which==='osc'){
    if(entry.activity)card.append(make('p',entry.activity,'directory-subline'));
    if(entry.cnpj)card.append(make('p','CNPJ: '+entry.cnpj,'directory-subline'));
    if(entry.areas?.length)card.append(make('p','Áreas: '+entry.areas.join(' · '),'directory-subline'));
   }else if(entry.registration)card.append(make('p','Identificador CadSUAS: '+entry.registration,'directory-subline'));
   if(entry.address)card.append(make('p','Endereço: '+entry.address,'directory-address'));
   else card.append(make('p','Endereço não disponível na resposta consultada.','directory-subline'));
   if(entry.phone)card.append(make('p','Telefone institucional: '+entry.phone,'directory-address'));
   if(entry.email)card.append(make('p','E-mail: '+entry.email,'directory-subline'));
   const actions=make('div',null,'directory-entry-actions');
   if(which==='osc'&&!entry.contactChecked){
    const b=make('button','Ver telefone e áreas de atuação','directory-contact-btn');b.type='button';
    b.addEventListener('click',()=>contactOSC(entry.id,b));actions.append(b);
   }
   if(entry.url)actions.append(link('Consultar ficha na fonte ↗',entry.url));
   card.append(actions);target.append(card);
  }
  if(!displayed)target.append(make('p',search?'Nenhuma correspondência nos resultados já carregados.':'A fonte não retornou registros nesta página.','directory-empty'));
  el(which+'More').hidden=!data.hasMore;
 }
 async function contactOSC(id,button){
  if(!state.code)return;
  const ticket=state.ticket,code=state.code;
  button.disabled=true;button.textContent='Consultando contato...';
  try{
   const row=await readJson('/api/rede-oscs?ibge='+encodeURIComponent(code)+'&id='+encodeURIComponent(String(id)));
   if(ticket!==state.ticket)return;
   const entry=state.osc.items.find(x=>x.id===id);if(!entry)return;
   for(const key of ['phone','email','website','areas','activity','address','category'])if(row[key])entry[key]=row[key];
   entry.contactChecked=true;
   renderCards('osc');
   if(!entry.phone)status('osc','Contato telefônico não informado nesta ficha; consulte o perfil no Ipea.');
  }catch(e){button.disabled=false;button.textContent='Tentar obter contato';status('osc',e.message);}
 }
 async function load(which,reset=false){
  if(!state.code)return;
  const data=state[which];
  if(data.busy)return;
  if(reset){data.page=0;data.items=[];data.hasMore=false;renderCards(which);}
  data.busy=true;
  const ticket=state.ticket,code=state.code,page=data.page+1;
  el(which+'More').hidden=true;
  status(which,'Consultando a fonte pública para '+code+'...');
  const params=new URLSearchParams({ibge:code,pagina:String(page)});
  if(which==='suas'&&data.type)params.set('tipo',data.type);
  try{
   const j=await readJson('/api/rede-'+(which==='suas'?'suas':'oscs')+'?'+params.toString());
   if(ticket!==state.ticket)return;
   if(!Array.isArray(j.items)||j.page!==page)throw Error('Resposta inconsistente do diretório.');
   if(reset&&which==='suas'&&Array.isArray(j.types)&&j.types.length){
    const select=el('suasType'),keep=data.type;
    select.replaceChildren();const all=document.createElement('option');all.value='';all.textContent='Todos os equipamentos';select.append(all);
    for(const kind of j.types){if(!/^\d{1,2}$/.test(kind.id)||!kind.name)continue;const option=document.createElement('option');option.value=kind.id;option.textContent=kind.name;select.append(option);}
    select.value=keep;select.disabled=false;
   }
   const previous=new Set(data.items.map(x=>x.id));
   for(const row of j.items)if(row&&Number.isSafeInteger(row.id)&&!previous.has(row.id)){data.items.push(row);previous.add(row.id);}
   data.page=page;data.hasMore=Boolean(j.hasMore);
   renderCards(which);
   const num=new Intl.NumberFormat('pt-BR');
   if(which==='osc')status(which,num.format(j.total??data.items.length)+' organizações no município · '+data.items.length+' carregadas. Endereços representam sedes cadastradas; consulte a ficha para confirmar telefone e situação.');
   else status(which,data.items.length+' equipamentos carregados'+(data.hasMore?' · há outras páginas':'')+'. A consulta é pública e depende da disponibilidade do CadSUAS.');
  }catch(e){if(ticket===state.ticket){status(which,e.message+' Consulte o cadastro de origem pelo link abaixo.');if(data.items.length)renderCards(which);}}
  finally{data.busy=false;}
 }
 function start(code){
  if(!/^[0-9]{7}$/.test(String(code)))return;
  state.code=String(code);state.ticket++;
  state.osc={page:0,items:[],hasMore:false,busy:false};
  state.suas={page:0,items:[],hasMore:false,type:'',busy:false};
  el('oscFilter').value='';el('oscFilter').disabled=false;
  el('suasType').value='';el('suasType').disabled=true;
  ['suas','osc'].forEach(which=>{el(which+'List').replaceChildren();el(which+'More').hidden=true;});
  void load('suas',true);void load('osc',true);
 }
 document.addEventListener('diagnostico:municipio',e=>start(e.detail?.ibge));
 el('suasType').addEventListener('change',()=>{state.suas.type=el('suasType').value;void load('suas',true);});
 el('oscFilter').addEventListener('input',()=>renderCards('osc'));
 el('suasMore').addEventListener('click',()=>load('suas'));
 el('oscMore').addEventListener('click',()=>load('osc'));
})();
