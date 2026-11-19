'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parsePibPerCapita}=require('../api/dados-dinamicos');
test('PIB per capita oficial IBGE retorna valor do municipio e ano mais recente',()=>{
 const rows=[{id:47001,res:[{localidade:'310620',res:{'2022':'49828.85','2023':'56227.29'}}]}];
 assert.deepEqual(parsePibPerCapita(rows,'3106200'),{year:'2023',value:56227.29});
 assert.equal(parsePibPerCapita(rows,'3550308'),null);
});
test('PIB per capita distingue indisponibilidade de zero e dados inconsistentes',()=>{
 const make=res=>[{id:47001,res:[{localidade:'310620',res}]}];
 assert.equal(parsePibPerCapita(make({'2023':''}),'3106200'),null);
 assert.equal(parsePibPerCapita(make({'2023':'0'}),'3106200'),null);
 assert.equal(parsePibPerCapita([{id:47001,res:[] }],'3106200'),null);
});
