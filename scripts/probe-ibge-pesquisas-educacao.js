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

(async()=>{
 const u='https://servicodados.ibge.gov.br/api/v1/pesquisas/13/indicadores';
 try{
  const r=await fetch(u,{signal:AbortSignal.timeout(16000)}),j=await r.json(),leaf=[];
  const walk=(xs,parent='')=>{for(const v of xs){if(/matr[ií]cula|escola|docente|estabelecimento|profission|especial|EJA|jovens|adultos/i.test(v.indicador||'')||['5902','5913','5908'].includes(String(v.id)))leaf.push({id:v.id,name:v.indicador,position:v.posicao,children:v.children?.length,unit:v.unidade?.id,parent});
   if(v.children?.length)walk(v.children,v.indicador);
  }};
  walk(j);
  console.log('EDU3_INEP_INDICATORS',JSON.stringify(leaf).slice(0,15500));
  const ids=[77881,77882,5903,5908,5913,5902,5909,5915,5925,60045];
  const url='https://servicodados.ibge.gov.br/api/v1/pesquisas/13/indicadores/'+ids.join('|')+'/resultados/310620';
  const rr=await fetch(url,{signal:AbortSignal.timeout(17000)}),data=await rr.json();
  console.log('EDU3_INEP_VALUES',JSON.stringify({status:rr.status,url,items:data.map(x=>({id:x.id,res:x.res?.[0]?.res}))}).slice(0,8500));
 }catch(e){console.log('EDU3_INEP_ERROR',e.message)}
})();
