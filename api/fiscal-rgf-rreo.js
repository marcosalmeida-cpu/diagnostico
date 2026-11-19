'use strict';
// SICONFI oficial: RGF Anexos 02 e 05; RREO Anexo 07.
// Uma fonte indisponivel nunca e interpretada como saldo zero.
// Colunas e contas verificadas com respostas reais para BH/MG, 2025.
const BASE='https://apidatalake.tesouro.gov.br/ords/siconfi/tt/';
const num=x=>{
 if(x===null||x===undefined||String(x).trim()==='')return null;
 const n=Number(x);return Number.isFinite(n)?n:null;
};
async function getRows(kind,code,year,annex,period,frequency='Q'){
 const u=new URL(BASE+kind);
 const params={an_exercicio:year,nr_periodo:period,no_anexo:annex,id_ente:code,co_tipo_demonstrativo:kind.toUpperCase()};
 if(kind==='rgf'){params.co_poder='E';params.in_periodicidade=frequency;}
 for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
 const r=await fetch(u,{headers:{accept:'application/json'},signal:AbortSignal.timeout(14500)});
 if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))return [];
 const j=await r.json();
 if(!Array.isArray(j?.items)||j?.hasMore===true||j.items.length>5000||j.count>j.items.length)return [];
 return j.items.filter(x=>String(x.cod_ibge)===code&&Number(x.exercicio)===year&&x.anexo===annex&&Number(x.periodo)===period&&x.rotulo==='Padrão');
}
function select(rows,account,column,conta){
 const values=rows.filter(x=>x.cod_conta===account&&x.coluna===column&&(!conta||x.conta===conta)).map(x=>num(x.valor));
 return values.length===1?values[0]:null;
}
function parseDebt(rows,period=3,frequency='Q'){
 const column=frequency==='Q'?'Até o '+period+'º Quadrimestre':'Até o '+period+'º Semestre';
 return {debt:select(rows,'DividaConsolidada',column),debtNet:select(rows,'DividaConsolidadaLiquida',column),rcl:select(rows,'RGF2ReceitaCorrenteLiquida',column)};
}
function parseCash(rows){
 const conta='TOTAL (IV) = (I + II + III)';
 return {cash:select(rows,'DisponibilidadeDeCaixaBruta','DISPONIBILIDADE DE CAIXA BRUTA (a)',conta),
 cashNet:select(rows,'DisponibilidadeDeCaixaLiquida','DISPONIBILIDADE DE CAIXA LÍQUIDA (ANTES DA INSCRIÇÃO EM RESTOS A PAGAR NÃO PROCESSADOS DO EXERCÍCIO) (g) = (a – (b + c + d + e) - f)',conta)};
}
function parseRestos(rows){
 const conta='TOTAL (III) = (I + II)';
 return {restos:select(rows,'SaldoTotal','Saldo Total L = (e + k)',conta),
 processed:select(rows,'RestosAPagarProcessadosENaoProcessadosLiquidadosAPagar','Saldo e = (a+ b) - (c + d)',conta),
 unprocessed:select(rows,'RestosAPagarNaoProcessadosAPagar','Saldo k = (f + g) - (i + j)',conta)};
}
async function getFiscalBalances(code,year){
 if(!/^\\d{7}$/.test(String(code))||!Number.isInteger(year)||year<2020)return null;
 const variants=[['Q',3],['S',2]];
 let debt=null,cash=null,frequency=null,period=null;
 for(const [freq,p] of variants){
  const [r2,r5]=await Promise.allSettled([
   getRows('rgf',code,year,'RGF-Anexo 02',p,freq),
   getRows('rgf',code,year,'RGF-Anexo 05',p,freq)
  ]);
  const a=r2.status==='fulfilled'?parseDebt(r2.value,p,freq):null;
  const b=r5.status==='fulfilled'?parseCash(r5.value):null;
  if(a?.debt!==null&&a?.debt!==undefined||b?.cash!==null&&b?.cash!==undefined){
   debt=a;cash=b;frequency=freq;period=p;break;
  }
 }
 let restos=null;
 try {restos=parseRestos(await getRows('rreo',code,year,'RREO-Anexo 07',6));}catch(_){}
 if(!debt&&!cash&&!restos?.restos)return null;
 return {year,frequency,period,...debt,...cash,...restos};
}
module.exports={getFiscalBalances,parseDebt,parseCash,parseRestos,select};
