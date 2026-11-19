'use strict';
const urls=[
['ibge-age','https://servicodados.ibge.gov.br/api/v3/agregados/10056/periodos/2022/variaveis/3795?localidades=N6%5B3106200%5D&classificacao=58%5B99749,47813,31615,2792,100052%5D%7C2%5B6794%5D%7C86%5B95251%5D'],
['ibge-age2','https://apisidra.ibge.gov.br/values/t/10056/n6/3106200/v/3795/p/2022/c58/99749,47813,31615,2792,100052/c2/6794/c86/95251'],
['inep-zip','https://download.inep.gov.br/dados_abertos/microdados_censo_escolar_2025_.zip']
];
(async()=>{
 for(const [name,url] of urls){
 try{
 const r=await fetch(url,{method:name==='inep-zip'?'HEAD':'GET',signal:AbortSignal.timeout(23000),headers:{accept:'application/json,*/*'}});
 const h=Object.fromEntries([...r.headers.entries()].filter(([k])=>/content-length|content-type|last-modified|etag/.test(k)));
 let body=null;if(name!=='inep-zip'){const s=await r.text();body=s.slice(0,1600);}
 console.log('EDU3_PROBE',JSON.stringify({name,status:r.status,url:r.url,headers:h,body}));
 }catch(e){console.log('EDU3_PROBE',JSON.stringify({name,error:e.message}));}
 }
})();
