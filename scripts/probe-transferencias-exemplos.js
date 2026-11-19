'use strict';
const tests=[
 ['propostas-discricionarias','https://api-publica.transferegov.gestao.gov.br/discricionarias/propostas?cod_munic_ibge=3106200&pagina=1&tamanho_da_pagina=3'],
 ['propostas-parcerias','https://api-publica.transferegov.gestao.gov.br/parcerias/proposta?cd_ibge_recebedor=3106200&pagina=1&tamanho_da_pagina=3'],
 ['beneficiarios-especiais','https://api-publica.transferegov.gestao.gov.br/especiais/beneficiarios-especiais?id_ente=3106200&pagina=1&tamanho_da_pagina=3'],
 ['beneficiarios-especiais-uf','https://api-publica.transferegov.gestao.gov.br/especiais/beneficiarios-especiais?uf_beneficiario=MG&pagina=1&tamanho_da_pagina=3']
];
Promise.all(tests.map(async ([name,url])=>{
 try{const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(17000)});
 const txt=await r.text();let body;
 try{body=JSON.parse(txt)}catch(_){body=txt.slice(0,250)}
 const arr=Array.isArray(body)?body:(Array.isArray(body?.data)?body.data:Array.isArray(body?.items)?body.items:Array.isArray(body?.resultados)?body.resultados:[]);
 const info={name,status:r.status,keys:!Array.isArray(body)&&typeof body==='object'?Object.keys(body):null,count:arr.length,record:arr.slice(0,2),top:!Array.isArray(body)&&typeof body==='object'?Object.fromEntries(Object.entries(body).filter(([k])=>!Array.isArray(body[k])&&typeof body[k]!=='object')):null};
 console.log('ETAPA2_API_SAMPLE',JSON.stringify(info).slice(0,6500));
 }catch(e){console.log('ETAPA2_API_SAMPLE',JSON.stringify({name,error:String(e.message)}))}
}));
