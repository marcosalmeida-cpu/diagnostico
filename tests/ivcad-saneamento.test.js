'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseIvcadResponses,getIvcad}=require('../api/dados-dinamicos');
const {extractSaneamento}=require('../api/diagnostico');
const fields=[
 ['geral','IVCAD - indice geral',0.2657019417769235],
 ['nc','IVCAD - necessidade de cuidados',0.358036180332333],
 ['dpi','IVCAD - desenvolvimento na primeira infancia',0.06799294128316899],
 ['dca','IVCAD - desenvolvimento de criancas e adolescentes',0.0329527705841454],
 ['tqa','IVCAD - trabalho e qualificacao de adultos',0.6041322715867529],
 ['dr','IVCAD - disponibilidade de recursos',0.3807386712885055],
 ['ch','IVCAD - condicoes habitacionais',0.1503000685214341]
];
const values=fields.map(([key,indicador,valor])=>({
 fonte:'seplag_ivcad',indicador,cd:'2611606',ano:2026,truncado:false,
 observacoes:[{cd_municipio_ibge:'2611606',ano:2026,unidade:'Indice (0 a 1)',fonte_original:'MDS/CONDEPE - IVCAD',valor}]
}));
test('IVCAD PE por API pública exige 7 dimensões, ano, IBGE e média coerentes',()=>{
 const d=parseIvcadResponses(values,'2611606');
 assert.ok(d);
 assert.equal(d.year,2026);
 assert.ok(Math.abs(d.geral-0.2657019417769235)<1e-12);
 assert.equal(parseIvcadResponses(values,'3154606'),null);
 assert.equal(parseIvcadResponses(values.slice(0,6),'2611606'),null);
 const invalid=JSON.parse(JSON.stringify(values));invalid[2].observacoes[0].valor=9;
 assert.equal(parseIvcadResponses(invalid,'2611606'),null);
 const mismatch=JSON.parse(JSON.stringify(values));mismatch[0].observacoes[0].valor=0.8;
 assert.equal(parseIvcadResponses(mismatch,'2611606'),null);
});
test('IVCAD nunca emite índice de PE para município de outra UF',async()=>{
 assert.equal(await getIvcad('3154606','MG'),null);
 assert.equal(await getIvcad('3550308','SP'),null);
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
