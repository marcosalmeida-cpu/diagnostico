'use strict';
const tests=[
 ['serpro','https://dd-publico.serpro.gov.br/extensions/municipalista/municipalista.html'],
 ['ips-data','https://ipsbrasil.org.br/explore/data'],
 ['ips-score','https://ipsbrasil.org.br/explore/scorecard/3106200'],
 ['ibge-malha-geo','https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3106200?formato=application/vnd.geo%2Bjson&qualidade=minima'],
 ['ibge-malha-svg','https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3106200?formato=image%2Fsvg%2Bxml&qualidade=minima'],
 ['ibge-distritos','https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3106200/distritos'],
 ['ibge-subdistritos','https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3106200/subdistritos'],
 ['ibge-distrito-malha','https://servicodados.ibge.gov.br/api/v3/malhas/distritos/310620005?formato=application/vnd.geo%2Bjson&qualidade=minima']
];
function shape(g){return {type:g?.type,features:g?.features?.length,coordinates:g?.coordinates?.length,geometry:g?.features?.[0]?.geometry?.type,properties:g?.features?.[0]?.properties}};
async function run([name,url]){
 try{
  const r=await fetch(url,{headers:{accept:'text/html,application/vnd.geo+json,application/json,image/svg+xml'},signal:AbortSignal.timeout(17000)});
  const type=r.headers.get('content-type'),body=await r.text();
  let detail={head:body.slice(0,350).replace(/\s+/g,' '),length:body.length};
  if(type?.includes('json')){
    try{const j=JSON.parse(body);detail={shape:shape(j),count:Array.isArray(j)?j.length:null,samples:Array.isArray(j)?j.slice(0,5).map(x=>({id:x.id,nome:x.nome})):null,length:body.length}}catch(_){}
  }
  if(name==='serpro'||name.startsWith('ips-')){
   const scripts=[...body.matchAll(/<script[^>]*src=["']([^"']+)/gi)].map(m=>m[1]).slice(0,20);
   const urls=[...body.matchAll(/(?:href|src)=["']([^"']+\.(?:xlsx|csv|json|js)(?:\?[^"']*)?)/gi)].map(m=>m[1]).slice(0,20);
   const ipsInline=body.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/);
   detail={...detail,scripts,urls,nextDataSize:ipsInline?.[1]?.length||0,linksToData:body.match(/.{0,65}(?:download|\.csv|\.xlsx|dataLayer|api\/|fetch\().{0,100}/gi)?.slice(0,15)};
  }
  console.log('ETAPA2_PROBE',JSON.stringify({name,status:r.status,url:r.url,type,detail}).slice(0,4900));
 }catch(e){console.log('ETAPA2_PROBE',JSON.stringify({name,error:String(e.message).slice(0,130)}));}
}
Promise.all(tests.map(run));
