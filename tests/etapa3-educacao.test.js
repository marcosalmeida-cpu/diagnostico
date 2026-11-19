'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseFrequency}=require('../lib/educacao-ibge');
const example={
 id:'3795',variavel:'Taxa de frequência escolar bruta',unidade:'%',resultados:[
 ['99749',50.95],['47813',93.71],['31615',98.67],['2792',85.66],['100052',29.56]
 ].map(([age,value])=>({
 classificacoes:[{id:'58',categoria:{[age]:'idade'}},{id:'2',categoria:{6794:'Total'}},{id:'86',categoria:{95251:'Total'}}],
 series:[{localidade:{id:'3106200'},serie:{2022:String(value)}}]
 }))};
test('frequência 2022 guarda município, sexo e cor total, sem duplicidade',()=>{
 const p=parseFrequency([example],'3106200');
 assert.equal(p.rates['99749'],50.95);
 assert.equal(p.rates['2792'],85.66);
 assert.equal(parseFrequency([example],'3550308'),null);
});
test('recusa taxa fora de 0 a 100 e categoria duplicada',()=>{
 const bad=structuredClone(example);bad.resultados[0].series[0].serie['2022']='101';
 assert.equal(parseFrequency([bad],'3106200'),null);
 const bad2=structuredClone(example);bad2.resultados.push(structuredClone(bad2.resultados[0]));
 assert.equal(parseFrequency([bad2],'3106200'),null);
});
