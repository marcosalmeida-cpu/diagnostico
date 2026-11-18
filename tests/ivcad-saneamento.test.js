'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {getByMunicipio:ivcad,SOURCE}=require('../data/ivcad2026pe');
const {extractSaneamento}=require('../api/diagnostico');

test('IVCAD 2026 PE: dados oficiais de Recife, Caruaru e Petrolina sem contaminação de outras UFs',()=>{
 assert.equal(SOURCE.year,'2026');
 assert.equal(SOURCE.sha256,'cbe89ca8965dbf3c04054a1e503d98011aa9c0d4813026b351e205d994b603cd');
 const recife=ivcad('2611606');
 assert.equal(recife.familias,304844);
 assert.equal(recife.pessoas,630163);
 assert.ok(Math.abs(recife.geral-0.2657019417769235)<1e-13);
 assert.ok(Math.abs(recife.geral-([recife.nc,recife.dpi,recife.dca,recife.tqa,recife.dr,recife.ch].reduce((a,b)=>a+b,0)/6))<0.0001);
 assert.equal(ivcad('2604106').familias,110215);
 assert.equal(ivcad('2611101').pessoas,243471);
 assert.equal(ivcad('3106200'),null);
 assert.equal(ivcad('3550308'),null);
 assert.equal(ivcad('0000000'),null);
 assert.equal(ivcad('__proto__'),null);
});
function fixture(code,classification,values){
 return [{id:381,resultados:Object.entries(values).map(([category,value])=>({
  classificacoes:[{id:classification,categoria:{[category]:'cat'}}],
  series:[{localidade:{id:code},serie:{2022:String(value)}}]
 }))}];
}
const city='3154606';
const water={
 72129:113092,72144:110700,72145:856,72153:1536
};
const sewer={
 46292:113092,46290:98719,72110:98416,72111:303,72112:2966,
 72113:4974,92858:204,72114:5638,72115:582,92861:9
};
test('Censo 2022 - água e esgoto: totais e categorias exclusivas conciliados',()=>{
 const waterDoc=fixture(city,1821,water),sewerDoc=fixture(city,11558,sewer);
 const result=extractSaneamento(waterDoc,sewerDoc,city);
 assert.equal(result.total,113092);
 assert.equal(result.water.comLigacao,111556);
 assert.equal(result.water.semLigacao,1536);
 assert.equal(result.sewer.redeOuFossaLigada,98719);
 assert.equal(result.sewer.redePluvial,98416);
 assert.equal(result.sewer.fossaRudimentar,4974);
 assert.equal(result.water.total,result.sewer.total);
});
test('Censo 2022 - inconsistências de município, somas e categorias são recusadas',()=>{
 const okWater=fixture(city,1821,water),okSewer=fixture(city,11558,sewer);
 assert.equal(extractSaneamento(okWater,okSewer,'3106200').total,null);
 assert.equal(extractSaneamento(okWater,fixture(city,11558,{...sewer,46292:113093}),city).sewer,null);
 assert.equal(extractSaneamento(fixture(city,1821,{...water,72153:-1}),okSewer,city).water,null);
 assert.equal(extractSaneamento(null,null,city).total,null);
 assert.equal(extractSaneamento(okWater,null,city).sewer,null);
});
