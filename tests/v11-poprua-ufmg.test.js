'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {byMunicipio,provenance}=require('../lib/poprua-ufmg');
test('UFMG/OBPopRua: fonte nacional com 3.870 municípios históricos e 2.962 em 2021',()=>{
 const p=provenance();
 assert.equal(p.observedMunicipalities,3870);
 assert.equal(p.municipalities2021,2962);
 assert.match(p.source,/UFMG/);
 assert.match(p.caveat,/NÃO população total/);
});
test('UFMG/OBPopRua: valores municipais confirmados sem inventar 2026 ou zero',()=>{
 const bh=byMunicipio('3106200',2021),neves=byMunicipio('3154606',2021);
 assert.equal(bh.value,9147);assert.equal(neves.value,107);
 assert.equal(bh.year,2021);
 assert.equal(byMunicipio('3106200',2026),null);
 assert.equal(byMunicipio('1504752',2021),null);
 assert.equal(byMunicipio('4220000',2021),null);
 assert.equal(byMunicipio('5006275',2021),null);
 assert.equal(byMunicipio('9999999',2021),null);
});
