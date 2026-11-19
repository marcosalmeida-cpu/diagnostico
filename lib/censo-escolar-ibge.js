'use strict';
// IBGE Pesquisa 13 - Censo Escolar - Sinopse. Fonte original: INEP.
// Refere-se a matrículas em escolas localizadas no município, não moradores.
const ROOT='https://servicodados.ibge.gov.br/api/v1/pesquisas/13/indicadores/';
const FIELDS=Object.freeze({
 infantil:'77881',creche:'77882',pre_escola:'5903',fundamental:'5908',medio:'5913'
});
const IDS=Object.values(FIELDS);
function count(v){
 if(v===null||v===undefined||String(v).trim()==='')return null;
 const s=String(v).trim();
 if(!/^\d+$/.test(s))return null;
 const n=Number(s);
 return Number.isSafeInteger(n)&&n>=0?n:null;
}
function parseSchoolResults(payload,code){
 if(!/^\d{7}$/.test(String(code))||!Array.isArray(payload))return null;
 const byId=new Map(),code6=String(code).slice(0,6);
 for(const row of payload){
  if(!IDS.includes(String(row.id))||byId.has(String(row.id)))return null;
  if(!Array.isArray(row.res)||row.res.length!==1||String(row.res[0].localidade)!==code6)return null;
  const serie=row.res[0].res;
  if(!serie||typeof serie!=='object')return null;
  byId.set(String(row.id),{current:count(serie['2025']),previous:count(serie['2024'])});
 }
 if(!byId.size)return null;
 const results={};
 for(const [key,id] of Object.entries(FIELDS))results[key]=byId.get(id)??{current:null,previous:null};
 const infant=results.infantil.current,creche=results.creche.current,pre=results.pre_escola.current;
 if(infant!==null&&creche!==null&&pre!==null&&creche+pre!==infant)return null;
 return {year:2025,previousYear:2024,fields:results};
}
function percentVariation(p){
 return Number.isFinite(p?.current)&&Number.isFinite(p?.previous)&&p.previous>0?
   Number(((p.current/p.previous-1)*100).toFixed(2)):null;
}
async function getSchoolCensus(code){
 if(!/^\d{7}$/.test(String(code)))return null;
 const url=ROOT+IDS.join('|')+'/resultados/'+String(code).slice(0,6);
 try{
  const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(16500)});
  if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))return null;
  return parseSchoolResults(await r.json(),code);
 }catch(_){return null;}
}
module.exports={FIELDS,getSchoolCensus,parseSchoolResults,percentVariation};
