'use strict';
const assert=require('node:assert/strict');
const {getDiagnosis}=require('../api/diagnostico');
async function run(){
 const data=await getDiagnosis('3106200');
 assert.equal(data.municipio.codigoIBGE,'3106200');
 assert(Array.isArray(data.indicators));
 const ids=['orcamento_v5_pib_percapita','orcamento_v5_arrecadacao_propria',
 'orcamento_v5_transferencias_uniao','orcamento_v5_transferencias_estados',
 'orcamento_v5_dependencia_transferencias','orcamento_v5_divida_consolidada',
 'orcamento_v5_endividamento','orcamento_v5_disponibilidade_caixa','orcamento_v5_restos_pagar'];
 const result={};
 for(const id of ids){
  const matches=data.indicators.filter(x=>x.id===id);
  assert.equal(matches.length,1,id+' duplicado ou ausente');
  assert.equal(matches[0].status,'verificado',id+' indisponível para BH');
  assert.equal(typeof matches[0].value,'number');
  result[id]={value:matches[0].value,period:matches[0].period,source:matches[0].source};
 }
 const mds=data.indicators.filter(x=>x.id.startsWith('cadunico_')).map(x=>({id:x.id,status:x.status,period:x.period}));
 console.log('ETAPA1_API_DIAGNOSTICO',JSON.stringify({municipio:data.municipio,verified:data.quality?.verified,check:result,cadunico:mds}));
}
run().catch(e=>{console.error('ETAPA1_API_ERROR',e.stack);process.exitCode=1});
