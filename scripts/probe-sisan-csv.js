'use strict';
const root='https://paineis.mds.gov.br/public/extensions/painel_adesoes_sisan/';
const files=['dados_com_totais.csv','dados_situacao_pobreza_com_totais.csv','dados_insan_grave_com_totais.csv','pop_brasil_reg_est_mun_com_totais.csv'];
(async()=>{
 for(const x of files){try{const r=await fetch(root+x,{redirect:'follow',signal:AbortSignal.timeout(14000)});const t=await r.text();console.log('SISAN_CSV',JSON.stringify({name:x,status:r.status,type:r.headers.get('content-type'),url:r.url,length:t.length,head:t.slice(0,1600)}));}catch(e){console.log('SISAN_CSV',JSON.stringify({name:x,error:e.message}))}}
})();
