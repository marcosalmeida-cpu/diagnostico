'use strict';
const tests=[
 ['ipea-list-bh','https://mapaosc.ipea.gov.br/api/lista_osc/municipio/3106200/1'],
 ['ipea-list-neves','https://mapaosc.ipea.gov.br/api/lista_osc/municipio/3154606/1'],
 ['ipea-detail','https://mapaosc.ipea.gov.br/api/osc/511766'],
 ['ipea-geo','https://mapaosc.ipea.gov.br/api/geo/oscs/municipio/3106200'],
 ['ipea-areas','https://mapaosc.ipea.gov.br/api/area_atuacao/'],
 ['cadsuas','https://aplicacoes.mds.gov.br/cadsuas/pesquisarConsultaExterna.html'],
 ['mds-mapasocial','https://mapa-social.mds.gov.br/']
];
async function probe([name,url]){
 try {
  const r=await fetch(url,{redirect:'follow',headers:{accept:'application/json,text/html,*/*','user-agent':'Mozilla/5.0 (compatible; DiagnosticoTerritorial/1.0)'},signal:AbortSignal.timeout(18000)});
  const typ=r.headers.get('content-type')||'';
  const body=await r.text();
  let o={name,status:r.status,type:typ,length:body.length,final:r.url};
  if(typ.includes('json')||/^[\s]*[\[{]/.test(body)){
   try{const j=JSON.parse(body);const arr=Array.isArray(j)?j:(j.data||j.results||j.items||null);
    o.keys=Object.keys(j).slice(0,35);o.lengthEntries=arr?.length;
    o.sample=JSON.stringify(Array.isArray(arr)?arr.slice(0,1):j).slice(0,2800);}catch(e){o.head=body.slice(0,200)}
  }else{
    o.formTags=(body.match(/<form[\s\S]*?<\/form>/gi)||[]).slice(0,3).map(x=>x.slice(0,2800));
    o.scriptSrc=[...body.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map(m=>m[1]).slice(0,18);
    o.relevant=body.match(/.{0,100}(?:municipio|pesquisar|endpoint|consultar|tipoEntidade|action=).{0,180}/gi)?.slice(0,35);
  }
  console.log('DIRETORIOS_PROBE',JSON.stringify(o).slice(0,5800));
 }catch(e){console.log('DIRETORIOS_PROBE',JSON.stringify({name,error:String(e.message)}))}
}
Promise.all(tests.map(probe));
