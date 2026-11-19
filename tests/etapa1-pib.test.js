'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parsePibPerCapita}=require('../api/dados-dinamicos');
test('PIB per capita mantém município, variável e exercício',()=>{
 const rows=[{D1C:'Município (Código)',D2C:'Variável (Código)',D3C:'Ano (Código)',V:'Valor'},{D1C:'3106200',D2C:'38',D3C:'2023',V:'38450.23'}];
 assert.deepEqual(parsePibPerCapita(rows,'3106200'),{year:'2023',value:38450.23});
 assert.equal(parsePibPerCapita(rows,'3550308'),null);
});
test('PIB per capita não confunde vazio com zero nem duplica competências',()=>{
 const h={D1C:'Município (Código)'};
 assert.equal(parsePibPerCapita([h,{D1C:'3106200',D2C:'38',D3C:'2023',V:''}],'3106200'),null);
 const row={D1C:'3106200',D2C:'38',D3C:'2023',V:'38450.23'};
 assert.equal(parsePibPerCapita([h,row,{...row}],'3106200'),null);
});
