'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {gdpInfo,sectorInfo,unemploymentInfo,parseIvcadResponses}=require('../api/dados-dinamicos');
const city='3154606';
test('PIB municipal: corrige unidade Mil Reais e crescimento NOMINAL entre anos contíguos',()=>{
 const rows=[{id:37,resultados:[{classificacoes:[],series:[{localidade:{id:city},serie:{2022:'5754239',2023:'6336695'}}]}]}];
 const x=gdpInfo(rows,city);
 assert.deepEqual(x,{year:'2023',pib:6336695000,growth:(6336695/5754239-1)*100});
 assert.equal(gdpInfo(rows,'2611606'),null);
 assert.equal(gdpInfo([{id:37,resultados:[{classificacoes:[],series:[{localidade:{id:city},serie:{2023:'...'}}]}]}],city),null);
});
test('CEMPRE: setores percentuais são pessoal assalariado em UNIDADES LOCAIS e não ofertas abertas',()=>{
 const keys={'117897':1000,'117363':370,'116910':280,'117774':230,'117329':120};
 const rows=[{id:708,resultados:Object.entries(keys).map(([id,val])=>({
  classificacoes:[{id:12762,categoria:{[id]:'grupo'}}],
  series:[{localidade:{id:city},serie:{2024:String(val)}}]
 }))}];
 const x=sectorInfo(rows,city);
 assert.equal(x.year,'2024');assert.equal(x.total,1000);assert.equal(x.top.length,4);
 assert.equal(x.top[0].share,37);
 assert.equal(x.covered,1);
 assert.equal(sectorInfo(rows,'3550308'),null);
 assert.equal(sectorInfo([{id:708,resultados:[...rows[0].resultados,{...rows[0].resultados[0]}]}],city),null);
});
test('PNAD: faixa etária traz contexto da UF, nunca atribuição municipal',()=>{
 const uf='31',r={'95253':4,'114535':17.6,'100052':8.2,'108875':3.7,'99127':2.8,'3302':1.8};
 const rows=[{id:4099,resultados:Object.entries(r).map(([id,val])=>({
  classificacoes:[{id:58,categoria:{[id]:'faixa'}}],
  series:[{localidade:{id:uf},serie:{202603:String(val)}}]
 }))}];
 const parsed=unemploymentInfo(rows,uf);
 assert.equal(parsed.period,'202603');assert.equal(parsed.rate,4);assert.equal(parsed.age['18_24'],8.2);
 assert.equal(unemploymentInfo(rows,'26'),null);
});
