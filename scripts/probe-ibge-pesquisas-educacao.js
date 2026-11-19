'use strict';
async function run(){
 const urls=[
 ['pesquisas','https://servicodados.ibge.gov.br/api/v1/pesquisas'],
 ['pesquisas_educacao','https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores'],
 ['ibge_muni_inep','https://servicodados.ibge.gov.br/api/v1/pesquisas/13/indicadores'],
 ['ibge_13_info','https://servicodados.ibge.gov.br/api/v1/pesquisas/13'],
 ['ibge_13_result','https://servicodados.ibge.gov.br/api/v1/pesquisas/13/indicadores/44/resultados/3106200']
 ];
 await Promise.all(urls.map(async ([tag,url])=>{try{
 const r=await fetch(url,{signal:AbortSignal.timeout(17000),headers:{accept:'application/json'}}),s=await r.text();
 const o=JSON.parse(s);
 if(tag==='pesquisas')console.log('EDU3_IBGE_RESEARCH',JSON.stringify({status:r.status,length:o.length,samples:o.filter(x=>/educa|censo escolar|matr|escol/i.test(JSON.stringify(x))).slice(0,40)}).slice(0,11000));
 else console.log('EDU3_IBGE_RESEARCH',JSON.stringify({tag,status:r.status,len:s.length,head:JSON.stringify(o).slice(0,20000)}));
 }catch(e){console.log('EDU3_IBGE_RESEARCH',JSON.stringify({tag,error:e.message}))}}));
}
run();
