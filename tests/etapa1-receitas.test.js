'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {revenueCategories}=require('../api/orcamento-publico');
const row=(cod_conta,valor)=>({cod_conta,coluna:'Receitas Brutas Realizadas',valor});
test('tributos e transferências brutas usam apenas rubricas agregadas',()=>{
 const result=revenueCategories([
  row('RO1.1.0.0.00.0.0','150'),row('RO1.1.1.0.00.0','90'),
  row('RO1.7.0.0.00.0','200'),row('RO2.4.0.0.00.0','50')
 ]);
 assert.equal(result.taxes,150);assert.equal(result.transfers,250);
});
test('rubricas vazias ou ausentes não geram falsos zeros',()=>{
 const result=revenueCategories([row('RO1.1.0.0.00.0',''),row('RO1.7.0.0.00.0','200')]);
 assert.equal(result.taxes,null);assert.equal(result.transfers,null);
});
