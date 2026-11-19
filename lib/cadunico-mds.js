'use strict';
// MDS / MI Social: totais oficiais agregados do Cadastro Único por município.
// Nomes de campos conferidos na descrição do dataset nacional "Cadastro Único -
// Famílias/Pessoas por faixas de renda per capita" do catálogo de dados abertos.
// A consulta é estritamente pública e municipal, SEM CPF/NIS ou registros pessoais.
// MDS atualmente pode redirecionar para página de aviso: nesse caso todos os
// valores permanecem null e NÃO são substituídos por zero.
const ENDPOINT='https://aplicacoes.mds.gov.br/sagi/servicos/misocial';
const FIELDS=Object.freeze({
 families:'cadunico_tot_fam_i',
 people:'cadunico_tot_pes_i',
 lowerIncome:'cadunico_tot_fam_rpc_ate_meio_sm_i',
 lowerIncomePeople:'cadunico_tot_pes_rpc_ate_meio_sm_i',
 poverty:'cadunico_tot_fam_pob_i',
 povertyPeople:'cadunico_tot_pes_pob_i',
 extremePovertyFamilies:'cadunico_tot_fam_ext_pob_i',
 extremePovertyPeople:'cadunico_tot_pes_ext_pob_i',
 povertyAndExtremeFamilies:'cadunico_tot_fam_pob_e_ext_pob_i',
 povertyAndExtremePeople:'cadunico_tot_pes_pob_e_ext_pob_i'
});
const INTEGER=/^(?:0|[1-9]\d*)$/;
function scalar(x){
 if(typeof x!=='string'&&typeof x!=='number')return null;
 const s=String(x).trim();
 if(!INTEGER.test(s))return null;
 const n=Number(s);return Number.isSafeInteger(n)&&n>=0?n:null;
}
const validMonth=x=>/^20\d{2}(0[1-9]|1[0-2])$/.test(String(x));
function parseCadunicoResponse(payload,code){
 if(!/^\d{7}$/.test(String(code))||!payload||payload.responseHeader?.partialResults===true||payload.responseHeader?.status!==0)return null;
 const response=payload.response;
 if(!response||!Number.isSafeInteger(response.numFound)||response.numFound<1||!Array.isArray(response.docs)||
    response.docs.length<1||response.docs.length>72||response.numFound<response.docs.length||
    (response.start!==undefined&&response.start!==0))return null;
 const code6=String(code).slice(0,6),seen=new Set(),items=[];
 for(const doc of response.docs){
  if(!doc||String(doc.codigo_ibge)!==code6||!validMonth(doc.anomes_s)||seen.has(String(doc.anomes_s)))return null;
  seen.add(String(doc.anomes_s));
  const out={period:String(doc.anomes_s)};
  for(const [key,field] of Object.entries(FIELDS))out[key]=scalar(doc[field]);
  // A contagem municipal de famílias é necessária para validar denominadores;
  // 0 é legítimo, mas pode haver lacunas nas demais faixas/colunas.
  if(out.families===null)return null;
  if(out.people!==null&&out.people<out.families)return null;
  for(const k of ['lowerIncome','poverty','extremePovertyFamilies','povertyAndExtremeFamilies'])
    if(out[k]!==null&&out[k]>out.families)return null;
  for(const k of ['lowerIncomePeople','povertyPeople','extremePovertyPeople','povertyAndExtremePeople'])
    if(out[k]!==null&&out.people!==null&&out[k]>out.people)return null;
  if(out.poverty!==null&&out.extremePovertyFamilies!==null&&out.povertyAndExtremeFamilies!==null&&
     out.poverty+out.extremePovertyFamilies!==out.povertyAndExtremeFamilies)return null;
  if(out.povertyPeople!==null&&out.extremePovertyPeople!==null&&out.povertyAndExtremePeople!==null&&
     out.povertyPeople+out.extremePovertyPeople!==out.povertyAndExtremePeople)return null;
  if(out.poverty!==null&&out.extremePovertyFamilies!==null&&out.poverty+out.extremePovertyFamilies>out.families)return null;
  items.push(out);
 }
 items.sort((a,b)=>b.period.localeCompare(a.period));
 const result=items[0];
 // O conjunto de dados não publica aqui campos validados de atualização cadastral.
 result.updated=null;result.updateRate=null;
 return result;
}
async function getCadunico(code){
 if(!/^\d{7}$/.test(String(code)))return null;
 const year=new Date().getUTCFullYear();
 const u=new URL(ENDPOINT);
 u.searchParams.set('q','*:*');
 u.searchParams.set('wt','json');u.searchParams.set('rows','72');
 u.searchParams.set('sort','anomes_s desc,codigo_ibge asc');
 u.searchParams.set('fl',['codigo_ibge','anomes_s',...Object.values(FIELDS)].join(','));
 u.searchParams.append('fq','codigo_ibge:'+String(code).slice(0,6));
 u.searchParams.append('fq','anomes_s:['+(year-3)+'01 TO '+year+'12]');
 u.searchParams.append('fq',FIELDS.families+':[0 TO *]');
 try{
  const response=await fetch(u,{redirect:'manual',headers:{accept:'application/json'},signal:AbortSignal.timeout(13000)});
  if(!response.ok||response.status>=300||!String(response.headers.get('content-type')||'').includes('json'))return null;
  const raw=await response.text();
  if(raw.length>360000||!raw.trimStart().startsWith('{'))return null;
  return parseCadunicoResponse(JSON.parse(raw),code);
 }catch(_){return null;}
}
module.exports={getCadunico,parseCadunicoResponse,FIELDS};
