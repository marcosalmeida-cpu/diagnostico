'use strict';
const URL='https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo';
const number=v=>v===null||v===undefined||String(v).trim()===''?null:(Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null);
function one(rows,account,column){
 const xs=rows.filter(x=>x.cod_conta===account&&x.coluna===column&&x.rotulo==='Padrão');
 return xs.length===1?number(xs[0].valor):null;
}
function parseFiscalPulse(rows,year,period){
 if(!Array.isArray(rows)||rows.length===0||period<1||period>6)return null;
 const revenue=one(rows,'ReceitasExcetoIntraOrcamentarias','Até o Bimestre (c)');
 const taxes=one(rows,'ReceitaTributaria','Até o Bimestre (c)');
 const expenses=one(rows,'TotalDespesas','DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)');
 return revenue!==null&&taxes!==null&&taxes<=revenue?{year,period,revenue,taxes,expenses}:null;
}
async function read(code,year,period){
 const url=new URL(URL);
 for(const [k,v] of Object.entries({an_exercicio:year,nr_periodo:period,co_tipo_demonstrativo:'RREO',no_anexo:'RREO-Anexo 01',id_ente:code}))url.searchParams.set(k,String(v));
 const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(12500)});
 if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))return null;
 const v=await r.json();
 if(!Array.isArray(v.items)||v.hasMore===true||(Number.isInteger(v.count)&&v.count!==v.items.length)||v.items.length>1200)return null;
 return parseFiscalPulse(v.items.filter(x=>String(x.cod_ibge)===code&&Number(x.exercicio)===year&&Number(x.periodo)===period&&x.anexo==='RREO-Anexo 01'),year,period);
}
const variation=(now,prev)=>Number.isFinite(now)&&Number.isFinite(prev)&&prev>0?100*(now/prev-1):null;
async function getFiscalPulse(code,date=new Date()){
 if(!/^[0-9]{7}$/.test(String(code)))return null;
 const year=date.getUTCFullYear(),period=Math.floor(date.getUTCMonth()/2);
 const attempts=[];
 for(let p=Math.min(6,period);p>=1&&attempts.length<3;p--)attempts.push([year,p]);
 if(attempts.length<3)attempts.push([year-1,6]);
 for(const [y,p] of attempts){
  let a=null,b=null;
  try{a=await read(code,y,p)}catch(_){}
  if(!a)continue;
  try{b=await read(code,y-1,p)}catch(_){}
  return {...a,comparableYear:b?.year??null,revenueVariation:variation(a.revenue,b?.revenue),taxesVariation:variation(a.taxes,b?.taxes)};
 }
 return null;
}
module.exports={getFiscalPulse,parseFiscalPulse,variation};