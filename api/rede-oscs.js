'use strict';
// Mapa das OSCs / Ipea: dados públicos de organização, sem dados de pessoa física.
// Fonte: API pública oficial; endereço é de cadastro, não prova área de atuação territorial.
const ROOT='https://mapaosc.ipea.gov.br/api/api/';
const validCode=x=>/^[0-9]{7}$/.test(String(x));
const str=(x,max=250)=>typeof x==='string'?x.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max):null;
async function getJson(path){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch(ROOT+path,{headers:{accept:'application/json','user-agent':'Mozilla/5.0 (compatible; DiagnosticoTerritorial/1.0)'},signal:AbortSignal.timeout(11000)});
   if(!r.ok){if(r.status>=500||r.status===429)throw Error('HTTP '+r.status);return null;}
   if(!String(r.headers.get('content-type')||'').includes('json'))return null;
   const raw=await r.text();
   if(raw.length>300000)throw Error('Resposta maior que o permitido');
   return JSON.parse(raw);
  }catch(e){last=e;}
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,175*(attempt+1)));
 }
 throw last??Error('Mapa das OSCs temporariamente indisponível');
}
function parseList(payload,code,page){
 if(!validCode(code)||!Number.isSafeInteger(payload?.total)||payload.total<0||!Array.isArray(payload?.lista)||payload.lista.length>60)return null;
 const ids=new Set();
 const items=[];
 for(const row of payload.lista){
  const id=Number(row?.id_osc),name=str(row?.tx_nome_osc,230);
  if(!Number.isSafeInteger(id)||id<1||!name||ids.has(id))return null;
  ids.add(id);
  if(row.cd_municipio&&String(row.cd_municipio)!==String(code))return null;
  const cnpj=String(row.cd_identificador_osc??'').replace(/\D/g,'');
  items.push({id,name,cnpj:cnpj.length>=11&&cnpj.length<=14?cnpj.padStart(14,'0'):null,
    category:str(row.tx_natureza_juridica_osc,110),activity:str(row.tx_nome_atividade_economica,170),
    address:str(row.tx_endereco_osc,300),
    url:'https://mapaosc.ipea.gov.br/detalhar/'+id});
 }
 return {items,total:payload.total,page,hasMore:items.length>=8 && page*10<payload.total,
  source:'Mapa das OSCs / Ipea',sourceUrl:'https://mapaosc.ipea.gov.br/base-dados',
  note:'Organizações cadastradas no município; não representa presença efetiva de projetos nem OSCs com parceria ativa.'};
}
function parseContact(main,head,areas,code,id){
 if(!validCode(code)||String(main?.cd_municipio)!==code||!main||typeof main!=='object')return null;
 const sourceArea=Array.isArray(areas)?areas:[];
 const labels=[...new Set(sourceArea.map(x=>str(x?.dc_area_atuacao?.tx_nome_area_atuacao,120)).filter(Boolean))].slice(0,12);
 const phone=str(main.tx_telefone,80),email=str(main.tx_email,120);
 return {id,name:str(head?.tx_razao_social_osc,220)||str(main.tx_sigla_osc,220),category:str(head?.tx_nome_natureza_juridica_osc,140),
  activity:str(main.tx_nome_classe_atividade_economica,160),
  phone:phone&&/[0-9]{5,}/.test(phone.replace(/\D/g,''))?phone:null,
  email:email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?email:null,
  website:str(main.tx_site,180),
  address:[main.tx_endereco,main.nr_localizacao,main.tx_endereco_complemento,main.tx_bairro,main.tx_nome_municipio,main.tx_sigla_uf].map(x=>str(x,120)).filter(Boolean).join(', '),
  areas:labels,
  active:head?.bo_osc_ativa===true?true:head?.bo_osc_ativa===false?false:null,
  url:'https://mapaosc.ipea.gov.br/detalhar/'+id,source:'Mapa das OSCs / Ipea'};
}
async function listOSCs(code,page){
 return parseList(await getJson('lista_osc/municipio/'+code+'/'+page),code,page);
}
async function getContact(code,id){
 const urls=['osc/dados_gerais/'+id,'osc/cabecalho/'+id,'osc/areas_atuacao/'+id];
 const r=await Promise.allSettled(urls.map(getJson));
 if(r[0].status!=='fulfilled'||r[1].status!=='fulfilled')return null;
 return parseContact(r[0].value,r[1].value,r[2].status==='fulfilled'?r[2].value:[],code,id);
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const code=String(req.query?.ibge||''),id=Number(req.query?.id),page=Number(req.query?.pagina||1);
 if(!validCode(code)||!Number.isInteger(page)||page<1||page>10000)return res.status(400).json({error:'Município ou página inválidos'});
 try{
  const value=Number.isSafeInteger(id)&&id>=1?await getContact(code,id):await listOSCs(code,page);
  if(!value)return res.status(502).json({error:'A consulta ao Ipea não retornou dados municipais verificáveis.'});
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=900');
  return res.status(200).json(value);
 }catch(_){return res.status(502).json({error:'Mapa das OSCs temporariamente indisponível. Consulte a fonte oficial.'})}
};
module.exports.listOSCs=listOSCs;
module.exports.getContact=getContact;
module.exports.parseList=parseList;
module.exports.parseContact=parseContact;
