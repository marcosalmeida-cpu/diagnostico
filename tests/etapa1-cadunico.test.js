'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseCadunicoResponse,FIELDS}=require('../lib/cadunico-mds');
function response(docs){
 return {responseHeader:{status:0},response:{numFound:docs.length,docs}};
}
const doc=(date,overrides={})=>({id:'310620_'+date,codigo_ibge:'310620',anomes_s:date,
 [FIELDS.families]:100,[FIELDS.people]:220,[FIELDS.lowerIncome]:80,
 [FIELDS.poverty]:42,[FIELDS.updated]:70,[FIELDS.updateRate]:70,...overrides});
test('MDS agrega exclusivamente municipio e competencia mais recente',()=>{
 const value=parseCadunicoResponse(response([doc('202501'),doc('202508')]),'3106200');
 assert.deepEqual(value,{period:'202508',families:100,people:220,lowerIncome:80,poverty:42,updated:70,updateRate:70});
});
test('nao misturar municipio ou assumir zero em resposta incompleta',()=>{
 assert.equal(parseCadunicoResponse(response([doc('202508',{codigo_ibge:'355030'})]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202508',{[FIELDS.families]:''})]),'3106200'),null);
 assert.equal(parseCadunicoResponse({responseHeader:{status:0,partialResults:true},response:{numFound:1,docs:[doc('202508')]}},'3106200'),null);
 assert.equal(parseCadunicoResponse({responseHeader:{status:0},response:{numFound:2,docs:[doc('202508')]}},'3106200'),null);
});
test('cadastro nunca apresenta quantidade superior ao total de familias',()=>{
 assert.equal(parseCadunicoResponse(response([doc('202508',{[FIELDS.updated]:150})]),'3106200'),null);
});
