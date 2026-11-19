'use strict';
// Dados públicos oficiais Transferegov; sede/município de cadastro não equivale ao
// local de execução nem ao pagamento de recursos.
const ROOT='https://api-publica.transferegov.gestao.gov.br';
const CODE=/^[0-9]{7}$/;
function parsePage(data,code,{year=null,field}){
 if(!CODE.test(String(code))||!data||!Number.isSafeInteger(data.total_items)||data.total_items<0||!Array.isArray(data.data)||data.data.length>30)return null;
 if(data.total_items<data.data.length||!Number.isInteger(data.page_number)||data.page_number!==1||!Number.isInteger(data.page_size)||data.page_size<0)return null;
 if(data.total_items>0&&data.data.length===0)return null;
 for(const row of data.data){
  if(String(row[field])!==String(code))return null;
  if(year!==null&&Number(row.ano_prop??row.ano_proposta)!==year)return null;
 }
 return data.total_items;
}
async function query(path,params){
 const u=new URL(ROOT+path);
 for(const [k,v]of Object.entries(params))u.searchParams.set(k,String(v));
 const r=await fetch(u,{headers:{accept:'application/json'},signal:AbortSignal.timeout(14500)});
 if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))return null;
 const obj=await r.json();return obj;
}
async function getFederalProposals(code,year=new Date().getUTCFullYear()){
 if(!CODE.test(String(code))||!Number.isInteger(year)||year<2020)return null;
 const [a,b]=await Promise.allSettled([
  query('/discricionarias/propostas',{cod_munic_ibge:code,ano_prop:year,pagina:1,tamanho_da_pagina:3}),
  query('/parcerias/proposta',{cd_ibge_recebedor:code,pagina:1,tamanho_da_pagina:3})
 ]);
 const annual=a.status==='fulfilled'?parsePage(a.value,code,{year,field:'cod_munic_ibge'}):null;
 const partnershipHistory=b.status==='fulfilled'?parsePage(b.value,code,{field:'cd_ibge_recebedor'}):null;
 return annual===null&&partnershipHistory===null?null:{year,annual,partnershipHistory};
}
module.exports={getFederalProposals,parsePage};
