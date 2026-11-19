'use strict';
const urls=[
 'https://mapaosc.ipea.gov.br/api/api/',
 'https://mapaosc.ipea.gov.br/api/api/lista_osc/municipio/3106200/1',
 'https://mapaosc.ipea.gov.br/api/api/osc/511766',
 'https://mapaosc.ipea.gov.br/api/api/geo/oscs/municipio/3106200',
 'https://api.mapaosc.ipea.gov.br/api/lista_osc/municipio/3106200/1',
 'https://mapaosc.ipea.gov.br/api/swagger.json',
 'https://mapaosc.ipea.gov.br/api/docs/api-docs.json'
];
async function run(url){
 try{const r=await fetch(url,{redirect:'follow',headers:{accept:'application/json, */*'},signal:AbortSignal.timeout(15000)}),s=await r.text();let j=null;try{j=JSON.parse(s)}catch(_){};console.log('IPEA_ROUTE',JSON.stringify({url,status:r.status,type:r.headers.get('content-type'),len:s.length,keys:j&&Object.keys(j).slice(0,17),head:s.slice(0,350).replace(/\s+/g,' ')}));}catch(e){console.log('IPEA_ROUTE',JSON.stringify({url,error:e.message}))}
}
Promise.all(urls.map(run));
