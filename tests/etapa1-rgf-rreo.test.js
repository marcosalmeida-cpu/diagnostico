'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseDebt,parseCash,parseRestos,select}=require('../api/fiscal-rgf-rreo');
const row=(cod_conta,coluna,conta,valor)=>({cod_conta,coluna,conta,valor});
test('RGF ano fechado seleciona 3o quadrimestre e DCL permite valores negativos',()=>{
 const rows=[
 row('DividaConsolidada','SALDO DO EXERCÍCIO ANTERIOR','DÍVIDA CONSOLIDADA - DC (I)',100),
 row('DividaConsolidada','Até o 3º Quadrimestre','DÍVIDA CONSOLIDADA - DC (I)',200),
 row('DividaConsolidadaLiquida','Até o 3º Quadrimestre','DÍVIDA CONSOLIDADA LÍQUIDA',-5)
 ];
 assert.deepEqual(parseDebt(rows),{debt:200,debtNet:-5,rcl:null});
});
test('RGF caixa soma apenas linha TOTAL IV e nunca sublinhas',()=>{
 const conta='TOTAL (IV) = (I + II + III)';
 assert.deepEqual(parseCash([
 row('DisponibilidadeDeCaixaBruta','DISPONIBILIDADE DE CAIXA BRUTA (a)','TOTAL DOS RECURSOS NÃO VINCULADOS (I)',100),
 row('DisponibilidadeDeCaixaBruta','DISPONIBILIDADE DE CAIXA BRUTA (a)',conta,500),
 row('DisponibilidadeDeCaixaLiquida','caixa liquida',conta,350)
 ]),{cash:500,cashNet:350});
});
test('RREO seleciona saldo final, não total pago',()=>{
 const conta='TOTAL (III) = (I + II)';
 assert.deepEqual(parseRestos([
 row('SaldoTotal','Saldo Total L = (e + k)',conta,35),
 row('RestosAPagarProcessadosENaoProcessadosLiquidadosAPagar','Saldo e = (a+ b) - (c + d)',conta,3),
 row('RestosAPagarNaoProcessadosAPagar','Saldo k = (f + g) - (i + j)',conta,32)
 ]),{restos:35,processed:3,unprocessed:32});
 assert.equal(select([row('SaldoTotal','Saldo Total L = (e + k)',conta,'')],'SaldoTotal','Saldo Total L = (e + k)',conta),null);
});
