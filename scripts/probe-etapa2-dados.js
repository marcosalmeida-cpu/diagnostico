'use strict';
const tests=[
 ['mirror-ips','https://raw.githubusercontent.com/ernandes-sobreira/IPS-BRASIL/main/conhece_brasil_v1.json'],
 ['rreo-2026','https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=3106200'],
 ['transferegov-parcerias','https://api-publica.transferegov.gestao.gov.br/parcerias/openapi.json'],
 ['transferegov-especiais','https://api-publica.transferegov.gestao.gov.br/especiais/openapi.json'],
 ['transferegov-discricionarias','https://api-publica.transferegov.gestao.gov.br/discricionarias/openapi.json']
];
async function run([name,url]){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{accept:'application/json'}});
  if(!r.ok){console.log('ETAPA2_DADOS',JSON.stringify({name,status:r.status}));return}
  const text=await r.text();
  const obj=JSON.parse(text);
  let out={name,status:r.status,bytes:text.length,keys:Object.keys(obj).slice(0,24)};
  if(name==='mirror-ips'){
   out.array=Array.isArray(obj);out.head=(Array.isArray(obj)?obj[0]:Object.values(obj)[0])&&Object.keys(Array.isArray(obj)?obj[0]:Object.values(obj)[0]).slice(0,35);
   out.preview=JSON.stringify(obj).slice(0,1300);
   const records=Array.isArray(obj)?obj:(Array.isArray(obj.municipios)?obj.municipios:[]);
   out.items=records.length;
   out.bh=records.find(x=>JSON.stringify(x).includes('3106200'))||null;
   if(out.bh)out.bh=JSON.stringify(out.bh).slice(0,2000);
  }
  if(name==='rreo-2026'){
   out.count=obj.count;out.total=obj.items?.length;
   out.codes=[...new Set((obj.items||[]).filter(x=>/Receitas Realizadas|RECEITAS REALIZADAS|Até o Bimestre/i.test(x.coluna||'')).map(x=>x.cod_conta))].slice(0,70);
   out.columns=[...new Set((obj.items||[]).map(x=>x.coluna))];
   out.sample=(obj.items||[]).filter(x=>/ReceitasTributarias|ImpostosTaxas|ReceitasCorrentes|ReceitasExcetoIntra/i.test(x.cod_conta||'')).slice(0,18).map(x=>({col:x.coluna,cod:x.cod_conta,conta:x.conta,valor:x.valor}));
  }
  if(name.startsWith('transferegov')){out.paths=Object.keys(obj.paths||{}).slice(0,50);out.servers=obj.servers;out.title=obj.info?.title;}
  console.log('ETAPA2_DADOS',JSON.stringify(out).slice(0,9800));
 }catch(e){console.log('ETAPA2_DADOS',JSON.stringify({name,error:String(e.message)}))}
}
Promise.all(tests.map(run));
