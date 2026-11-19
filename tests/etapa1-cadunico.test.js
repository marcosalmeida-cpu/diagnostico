'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseCadunicoResponse,FIELDS}=require('../lib/cadunico-mds');
function response(docs,more=0){return {responseHeader:{status:0},response:{start:0,numFound:docs.length+more,docs}};}
const doc=(date,overrides={})=>({
 codigo_ibge:'310620',anomes_s:date,
 [FIELDS.families]:100,[FIELDS.people]:220,
 [FIELDS.lowerIncome]:80,[FIELDS.lowerIncomePeople]:180,
 [FIELDS.poverty]:28,[FIELDS.povertyPeople]:62,
 [FIELDS.extremePovertyFamilies]:14,[FIELDS.extremePovertyPeople]:31,
 [FIELDS.povertyAndExtremeFamilies]:42,
 [FIELDS.povertyAndExtremePeople]:93,
 ...overrides});
test('MI Social: renda total, pobreza e extrema pobreza pelo DICIONÁRIO NACIONAL verificado',()=>{
 const x=parseCadunicoResponse(response([doc('202501'),doc('202609')]),'3106200');
 assert.deepEqual(x,{
  period:'202609',families:100,people:220,lowerIncome:80,lowerIncomePeople:180,
  poverty:28,povertyPeople:62,extremePovertyFamilies:14,extremePovertyPeople:31,
  povertyAndExtremeFamilies:42,povertyAndExtremePeople:93,updated:null,updateRate:null
 });
 assert.equal(x.extremePovertyFamilies+x.poverty,x.povertyAndExtremeFamilies);
});
test('MI Social: valida vínculo município e competência sem inferir ausências',()=>{
 assert.equal(parseCadunicoResponse(response([doc('202509',{codigo_ibge:'355030'})]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202509',{[FIELDS.families]:''})]),'3106200'),null);
 assert.equal(parseCadunicoResponse({responseHeader:{status:0,partialResults:true},response:{numFound:1,docs:[doc('202509')]}},'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202513')]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202609'),doc('202609')]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202609')],100),'3106200').period,'202609');
});
test('MI Social: recusa incoerências contábeis e aceita zero real',()=>{
 assert.equal(parseCadunicoResponse(response([doc('202609',{[FIELDS.extremePovertyFamilies]:40})]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202609',{[FIELDS.povertyAndExtremeFamilies]:99})]),'3106200'),null);
 assert.equal(parseCadunicoResponse(response([doc('202609',{[FIELDS.people]:50})]),'3106200'),null);
 const zero=doc('202609',{
  [FIELDS.families]:0,[FIELDS.people]:0,[FIELDS.lowerIncome]:0,[FIELDS.lowerIncomePeople]:0,
  [FIELDS.poverty]:0,[FIELDS.povertyPeople]:0,[FIELDS.extremePovertyFamilies]:0,
  [FIELDS.extremePovertyPeople]:0,[FIELDS.povertyAndExtremeFamilies]:0,[FIELDS.povertyAndExtremePeople]:0
 });
 assert.equal(parseCadunicoResponse(response([zero]),'3106200').extremePovertyFamilies,0);
});
test('MI Social: falta de coluna não vira zero nem bloqueia outras colunas válidas',()=>{
 const row=doc('202609',{[FIELDS.extremePovertyFamilies]:undefined,[FIELDS.povertyAndExtremeFamilies]:undefined});
 const result=parseCadunicoResponse(response([row]),'3106200');
 assert.equal(result.extremePovertyFamilies,null);assert.equal(result.poverty,28);
 assert.equal(result.updated,null);assert.equal(result.updateRate,null);
});
