'use strict';
// CGU: consulta agregada municipal; exige chave privada de API da instituição.
// Não acessa CPF/NIS, não expõe credenciais para o navegador e não infere BPC/PBF.
const ROOT='https://api.portaldatransparencia.gov.br/api-de-dados/';
const ENTRIES=[['bolsa','novo-bolsa-familia-por-municipio'],['bpc','bpc-por-municipio']];
function periodMonths(){
 const now=new Date();const out=[];
 for(let i=2;i<=5;i++){const dt=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-i,1));
  out.push(String(dt.getUTCFullYear())+String(dt.getUTCMonth()+1).padStart(2,'0'))}
 return out;
}
function parseRows(rows,code){
 if(!Array.isArray(rows)||!rows.length||rows.length>250)return null;
 let amount=0,beneficiaries=0;
 for(const r of rows){
  const ibge=String(r.municipio?.codigoIBGE??r.municipio?.codigoIbge??r.municipio?.codigoIBGE7??'');
  if(ibge!==code)return null;
  const n=Number(r.quantidadeBeneficiados),v=Number(r.valor);
  if(!Number.isSafeInteger(n)||n<0||!Number.isFinite(v)||v<0)return null;
  amount+=v;beneficiaries+=n;
 }
 return {amount,beneficiaries};
}
async function query(code,endpoint,month,key){
 const u=new URL(ROOT+endpoint);
 u.searchParams.set('codigoIbge',code);u.searchParams.set('mesAno',month);u.searchParams.set('pagina','1');
 const r=await fetch(u.toString(),{headers:{'chave-api-dados':key,accept:'application/json'},signal:AbortSignal.timeout(9000)});
 if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))return null;
 const rows=await r.json();return parseRows(rows,code);
}
async function getBenefits(code){
 if(!/^\d{7}$/.test(code)||!process.env.CGU_API_KEY)return {configured:false,bolsa:null,bpc:null};
 const output={configured:true,bolsa:null,bpc:null};
 for(const [key,endpoint] of ENTRIES){
  for(const month of periodMonths()){
   try{const data=await query(code,endpoint,month,process.env.CGU_API_KEY);
    if(data){output[key]={...data,period:month.slice(0,4)+'-'+month.slice(4,6)};break;}
   }catch(_){break;}
  }
 }
 return output;
}
module.exports={getBenefits,parseRows,periodMonths};
