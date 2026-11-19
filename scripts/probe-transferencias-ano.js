'use strict';
const requests=[
 ['BH-2026','https://api-publica.transferegov.gestao.gov.br/discricionarias/propostas?cod_munic_ibge=3106200&ano_prop=2026&pagina=1&tamanho_da_pagina=3'],
 ['BH-2025','https://api-publica.transferegov.gestao.gov.br/discricionarias/propostas?cod_munic_ibge=3106200&ano_prop=2025&pagina=1&tamanho_da_pagina=3'],
 ['SP-2026','https://api-publica.transferegov.gestao.gov.br/discricionarias/propostas?cod_munic_ibge=3550308&ano_prop=2026&pagina=1&tamanho_da_pagina=3'],
 ['BH-parcerias','https://api-publica.transferegov.gestao.gov.br/parcerias/proposta?cd_ibge_recebedor=3106200&pagina=1&tamanho_da_pagina=3']
];
Promise.all(requests.map(async ([name,url])=>{
 try{
  const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(16000)});
  const j=await r.json();
  const data=j.data||[];
  console.log('TRANSFEREGOV_CIDADE',JSON.stringify({name,status:r.status,total:j.total_items,pages:j.total_pages,pageSize:j.page_size,count:data.length,sample:data.slice(0,3).map(x=>({ibge:x.cod_munic_ibge||x.cd_ibge_recebedor,year:x.ano_prop||x.ano_proposta,valor:x.vl_global_prop||x.nr_vlr_total,situation:x.sit_proposta||x.situacao_proposta,code:x.id_proposta}))}));
 }catch(e){console.log('TRANSFEREGOV_CIDADE',JSON.stringify({name,error:e.message}))}
}));
