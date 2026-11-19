'use strict';
// MI Social/MDS — series municipais agregadas de PBF e BPC (todas as UFs).
// O portal oficial pode redirecionar para aviso de manutenção: resposta HTML => null.
// Não há chamadas que exponham CPF/NIS ou sigilo; apenas município 6 dígitos do IBGE.
const ENDPOINT='https://aplicacoes.mds.gov.br/sagi/servicos/misocial';
const CODE=/^[0-9]{7}$/;
const NUM=/^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const FIELDS=[
 'codigo_ibge','anomes_s','tipo_s',
 'qtd_familias_beneficiarias_bolsa_familia','valor_repassado_bolsa_familia',
 'bpc_ben_i','bpc_pcd_ben_i','bpc_idoso_ben_i'
];
function num(v,integer=true){
 if(v===undefined||v===null)return null;
 const raw=typeof v==='number'?String(v):typeof v==='string'?v.trim():'';
 if(!NUM.test(raw))return null;
 const n=Number(raw);return Number.isFinite(n)&&n>=0&&(!integer||Number.isSafeInteger(n))?n:null;
}
function parseMunicipalBenefits(payload,code){
 if(!CODE.test(String(code))||payload?.responseHeader?.status!==0)return null;
 const response=payload.response;
 if(!response||!Number.isSafeInteger(response.numFound)||response.numFound<0||!Array.isArray(response.docs)||response.docs.length>72)return null;
 const expected=String(code).slice(0,6),seen=new Set(),rows=[];
 for(const row of response.docs){
  if(!row||String(row.codigo_ibge)!==expected||!/^20\d{2}(0[1-9]|1[0-2])$/.test(String(row.anomes_s)))return null;
  const period=String(row.anomes_s),sub=String(row.tipo_s||'mes_mu');
  if(sub!=='mes_mu')return null;
  if(seen.has(period))return null;seen.add(period);
  const pbf=num(row.qtd_familias_beneficiarias_bolsa_familia);
  const money=num(row.valor_repassado_bolsa_familia,false);
  const bpc=num(row.bpc_ben_i),pcd=num(row.bpc_pcd_ben_i),old=num(row.bpc_idoso_ben_i);
  if(bpc!==null&&pcd!==null&&old!==null&&pcd+old!==bpc)return null;
  if(bpc!==null&&(pcd!==null&&pcd>bpc||old!==null&&old>bpc))return null;
  rows.push({period,pbf,money,bpc,pcd,old});
 }
 rows.sort((a,b)=>b.period.localeCompare(a.period));
 const bolsa=rows.find(x=>x.pbf!==null)||null;
 const bpc=rows.find(x=>x.bpc!==null)||null;
 return {bolsa:bolsa?{period:bolsa.period.slice(0,4)+'-'+bolsa.period.slice(4,6),
    beneficiaries:bolsa.pbf,amount:bolsa.money,unit:'famílias beneficiárias'}:null,
  bpc:bpc?{period:bpc.period.slice(0,4)+'-'+bpc.period.slice(4,6),
    beneficiaries:bpc.bpc,disability:bpc.pcd,older:bpc.old,
    unit:'benefícios por município pagador'}:null};
}
async function getMdsBenefits(code){
 if(!CODE.test(String(code)))return null;
 const year=new Date().getUTCFullYear(),min=(year-3)+'01',max=year+'12';
 const u=new URL(ENDPOINT);
 u.searchParams.set('q','*:*');u.searchParams.set('wt','json');
 u.searchParams.set('rows','72');u.searchParams.set('sort','anomes_s desc');
 u.searchParams.set('fl',FIELDS.join(','));
 u.searchParams.append('fq','codigo_ibge:'+String(code).slice(0,6));
 u.searchParams.append('fq','tipo_s:mes_mu');
 u.searchParams.append('fq','anomes_s:['+min+' TO '+max+']');
 try{
  const r=await fetch(u,{redirect:'manual',headers:{accept:'application/json'},signal:AbortSignal.timeout(9000)});
  if(!r.ok||r.status>=300||!String(r.headers.get('content-type')||'').includes('json'))return null;
  const txt=await r.text();
  if(txt.length>400000||!txt.trimStart().startsWith('{'))return null;
  return parseMunicipalBenefits(JSON.parse(txt),code);
 }catch(_){return null}
}
module.exports={getMdsBenefits,parseMunicipalBenefits};
