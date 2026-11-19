'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseMunicipalBenefits}=require('../lib/beneficios-mds');
function data(docs){
 return {responseHeader:{status:0},response:{numFound:docs.length,docs}};
}
test('MDS: traz Bolsa Família e BPC por código IBGE e competência com 0 legítimo',()=>{
 const rows=[{
  codigo_ibge:310620,anomes_s:202609,tipo_s:'mes_mu',
  qtd_familias_beneficiarias_bolsa_familia:145003,
  valor_repassado_bolsa_familia:94321678.52,
  bpc_ben_i:47100,bpc_pcd_ben_i:27000,bpc_idoso_ben_i:20100
 },{
  codigo_ibge:310620,anomes_s:202608,tipo_s:'mes_mu',
  qtd_familias_beneficiarias_bolsa_familia:140000,bpc_ben_i:45500,bpc_pcd_ben_i:25500,bpc_idoso_ben_i:20000
 }];
 const r=parseMunicipalBenefits(data(rows),'3106200');
 assert.equal(r.bolsa.beneficiaries,145003);
 assert.equal(r.bolsa.period,'2026-09');
 assert.equal(r.bpc.beneficiaries,47100);
 assert.equal(r.bpc.disability+r.bpc.older,r.bpc.beneficiaries);
 assert.equal(r.bpc.period,'2026-09');
 rows[0].qtd_familias_beneficiarias_bolsa_familia=0;
 assert.equal(parseMunicipalBenefits(data(rows),'3106200').bolsa.beneficiaries,0);
});
test('MDS: indisponibilidade não vira zero; rejeita município divergente e BPC inconsistente',()=>{
 const sample={codigo_ibge:310620,anomes_s:202607,tipo_s:'mes_mu',
  qtd_familias_beneficiarias_bolsa_familia:null,bpc_ben_i:100,
  bpc_pcd_ben_i:30,bpc_idoso_ben_i:71};
 assert.equal(parseMunicipalBenefits(data([sample]),'3106200'),null);
 sample.bpc_idoso_ben_i=70;
 assert.equal(parseMunicipalBenefits(data([sample]),'3550308'),null);
 assert.equal(parseMunicipalBenefits(data([sample]),'3106200').bolsa,null);
 assert.equal(parseMunicipalBenefits(data([sample]),'3106200').bpc.beneficiaries,100);
 assert.equal(parseMunicipalBenefits({responseHeader:{status:503}},'3106200'),null);
});
test('MDS: não usa valores de competências, períodos ou formatos inválidos',()=>{
 const one={codigo_ibge:310620,anomes_s:202601,tipo_s:'mes_mu',bpc_ben_i:'1,000',qtd_familias_beneficiarias_bolsa_familia:'1.5'};
 assert.equal(parseMunicipalBenefits(data([one]),'3106200').bolsa,null);
 assert.equal(parseMunicipalBenefits(data([one]),'3106200').bpc,null);
 assert.equal(parseMunicipalBenefits(data([{...one,anomes_s:202613}]),'3106200'),null);
 assert.equal(parseMunicipalBenefits(data([{...one,tipo_s:'mes_uf'}]),'3106200'),null);
});
