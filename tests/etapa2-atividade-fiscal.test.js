'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseFiscalPulse,variation}=require('../api/atividade-fiscal');
const row=(cod_conta,coluna,valor)=>({cod_conta,coluna,valor,rotulo:'Padrão'});
test('RREO recupera somente contas agregadas do mesmo bimestre',()=>{
 const rows=[
  row('ReceitasExcetoIntraOrcamentarias','Até o Bimestre (c)',1000),
  row('ReceitaTributaria','Até o Bimestre (c)',400),
  row('TotalDespesas','DESPESAS LIQUIDADAS ATÉ O BIMESTRE (h)',700),
  row('ReceitaTributaria','No Bimestre (b)',100)
 ];
 assert.deepEqual(parseFiscalPulse(rows,2026,4),{year:2026,period:4,revenue:1000,taxes:400,expenses:700});
});
test('dados incompletos nao sao zeros e nao ha divisao por zero',()=>{
 assert.equal(parseFiscalPulse([row('ReceitasExcetoIntraOrcamentarias','Até o Bimestre (c)',100)],2026,4),null);
 assert.equal(parseFiscalPulse([row('ReceitaTributaria','Até o Bimestre (c)',101),row('ReceitasExcetoIntraOrcamentarias','Até o Bimestre (c)',100)],2026,4),null);
 assert.ok(Math.abs(variation(120,100)-20)<1e-10);
 assert.equal(variation(120,0),null);
});
