'use strict';
const base='https://ipsbrasil.org.br';
const tests=[
 ['ips-score',base+'/explore/scorecard/3106200'],
 ['ips-data',base+'/explore/data'],
 ['serpro-js','https://dd-publico.serpro.gov.br/extensions/municipalista/municipalista.js'],
 ['ibge-subdistrict-geo','https://servicodados.ibge.gov.br/api/v4/malhas/municipios/3106200?formato=application/vnd.geo%2Bjson&intrarregiao=subdistritos'],
 ['ibge-district-geo','https://servicodados.ibge.gov.br/api/v4/malhas/municipios/3106200?formato=application/vnd.geo%2Bjson&intrarregiao=distritos'],
 ['ibge-rreo','https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo?an_exercicio=2026&nr_periodo=4&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2001&id_ente=3106200']
];
function strip(s){return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').replace(/\s+/g,' ').trim()}
async function run([name,url]){
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{accept:'text/html,application/json'}});
  const body=await r.text(),typ=r.headers.get('content-type');
  let info={status:r.status,type:typ,len:body.length,url:r.url};
  if(name==='ips-score'){
   const plain=strip(body);
   info.bh=plain.slice(plain.indexOf('Belo Horizonte')-200,plain.indexOf('Belo Horizonte')+2400);
   info.ips=plain.slice(plain.indexOf('Necessidades Humanas Básicas')-500,plain.indexOf('Necessidades Humanas Básicas')+1600);
   info.spans=[...body.matchAll(/.{0,120}(?:64,10|\d{2},\d{2}\s*\/\s*100|Índice de Progresso Social).{0,160}/gi)].slice(0,10).map(x=>x[0].slice(0,330));
  }
  if(name==='ips-data'){
   info.download=body.match(/.{0,550}(?:open_download_modal|\.csv|\.xlsx|phx-value-year|download\b).{0,550}/gi)?.slice(0,13);
  }
  if(name==='serpro-js'){
   info.head=body.slice(0,2000);info.qlik=body.match(/.{0,100}(?:openApp|appId|app_id|\.getObject|\.getList|table|indicador|municipio|dados|openDoc).{0,150}/gi)?.slice(0,60);
  }
  if(name.startsWith('ibge-')){
   try{const g=JSON.parse(body);info.features=g.features?.length;info.gtype=g.type;info.first=g.features?.[0]?.properties;info.short=body.slice(0,300)}catch(_){info.short=body.slice(0,300)}
  }
  console.log('ETAPA2_DETALHE',JSON.stringify({name,...info}).slice(0,9500));
 }catch(e){console.log('ETAPA2_DETALHE',JSON.stringify({name,error:String(e.message)}))}
}
Promise.all(tests.map(run));
