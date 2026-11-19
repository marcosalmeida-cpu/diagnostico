'use strict';
// Inspeção pontual de schemas públicos. Não registra dados pessoais ou credenciais.
const tests=[
 ['dca24', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio=2024&no_anexo=DCA-Anexo%20I-C&id_ente=3106200'],
 ['dca25', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca?an_exercicio=2025&no_anexo=DCA-Anexo%20I-C&id_ente=3106200'],
 ['rgf25q3', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rgf?an_exercicio=2025&in_periodicidade=Q&nr_periodo=3&co_tipo_demonstrativo=RGF&co_poder=E&no_anexo=RGF-Anexo%2002&id_ente=3106200'],
 ['rgf24q3', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rgf?an_exercicio=2024&in_periodicidade=Q&nr_periodo=3&co_tipo_demonstrativo=RGF&co_poder=E&no_anexo=RGF-Anexo%2002&id_ente=3106200'],
 ['rgf25caixa', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rgf?an_exercicio=2025&in_periodicidade=Q&nr_periodo=3&co_tipo_demonstrativo=RGF&co_poder=E&no_anexo=RGF-Anexo%2005&id_ente=3106200'],
 ['rreo25', 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2007&id_ente=3106200'],
 ['pib5938', 'https://apisidra.ibge.gov.br/values/t/5938/n6/3106200/v/38/p/last%201'],
 ['pib5964', 'https://apisidra.ibge.gov.br/values/t/5964/n6/3106200/v/38/p/last%201'],
 ['pibPesquisa', 'https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/47001/resultados/3106200'],
 ['pibPesquisa38', 'https://servicodados.ibge.gov.br/api/v1/pesquisas/38/indicadores/47001/resultados/3106200'],
 ['mds-observatorio', 'https://paineis.mds.gov.br/public/extensions/observatorio-do-cadastro-unico/index.html']
];
async function run([name,url]){
 try {
  const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(18000)});
  const type=r.headers.get('content-type')||'';
  if(!r.ok)return {name,status:r.status,type};
  if(!type.includes('json'))return{name,status:r.status,type};
  const j=await r.json();
  const rows=Array.isArray(j)?j:(Array.isArray(j.items)?j.items:[]);
  const samples=rows.filter(x=>/dca/.test(name)?/Receitas|RO1[.]|RO2[.]|TotalReceita/i.test(String(x.cod_conta)+' '+String(x.conta)):true).slice(0,6).map(x=>Object.fromEntries(Object.entries(x).filter(([k])=>['cod_conta','conta','coluna','rotulo','exercicio','cod_ibge','valor','D1C','D2C','D3C','V','instituicao','periodo','demonstrativo','anexo'].includes(k))));
  let detail=null;
  if(name.startsWith('dca')) detail=rows.filter(x=>x.coluna==='Receitas Brutas Realizadas'&&/^RO[12][.]/.test(String(x.cod_conta))).map(x=>[x.cod_conta,x.conta,x.valor]).filter(x=>/^RO1[.][1-9][.]0[.]|^RO2[.][1-9][.]0[.]/.test(x[0])).slice(0,40);
  if(name.startsWith('rgf')||name.startsWith('rreo'))detail={
    accounts:[...new Set(rows.map(x=>x.cod_conta))].filter(x=>name.includes('caixa')?/Disponibilidade|Restos|Total/.test(x):name==='rreo25'?/Saldo|Restos|Total/i.test(x):/Divida|Deduc|RCL|Total/i.test(x)).slice(0,30),
    totals:rows.filter(x=>name.includes('caixa')?/^TOTAL [(]III[)]/.test(x.conta):name==='rreo25'?/^TOTAL [(]III[)]/.test(x.conta):/DividaConsolidada|ReceitaCorrenteLiquida/i.test(x.cod_conta)).slice(0,20).map(x=>({cod_conta:x.cod_conta,conta:x.conta,coluna:x.coluna,valor:x.valor}))
  };
  if(name.startsWith('pibPesquisa'))detail=JSON.stringify(j).slice(0,1600);
  return{name,status:r.status,type,count:rows.length,total:j.count??null,hasMore:j.hasMore??null,keys:rows[0]?Object.keys(rows[0]):Object.keys(j).slice(0,10),samples,detail};
 }catch(e){return{name,error:String(e.message).slice(0,140)};}
}
Promise.all(tests.map(run)).then(results=>results.forEach(x=>console.log('PUBLIC_API_PROBE',JSON.stringify(x))));
