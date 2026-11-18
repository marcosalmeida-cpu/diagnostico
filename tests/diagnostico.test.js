'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {PDFDocument}=require('pdf-lib');
const {getByMunicipio,provenance}=require('../data/ideb2025');
const {generate}=require('../api/relatorio');

test('IDEB 2025 - resultado municipal oficial da rede pública',()=>{
 assert.deepEqual(getByMunicipio('3106200'),{inicial:6.3,final:5.2});
 assert.deepEqual(getByMunicipio('3550308'),{inicial:6.2,final:5});
 assert.deepEqual(getByMunicipio('2611606'),{inicial:5.8,final:4.9});
 assert.deepEqual(getByMunicipio('3154606'),{inicial:5.8,final:4.9});
 assert.deepEqual(getByMunicipio('0000000'),{inicial:null,final:null});
 assert.equal(provenance.ano,2025);
 assert.equal(provenance.rede,'Pública');
 assert.match(provenance.sha256Iniciais,/^[a-f0-9]{64}$/);
 assert.match(provenance.sha256Finais,/^[a-f0-9]{64}$/);
});
test('PDF é legível, multipágina e não trata lacunas como valor zero',async()=>{
 const sources={
  ibge:{name:'IBGE - Censo 2022',url:'https://servicodados.ibge.gov.br/api/docs/'},
  inep:{name:'INEP - IDEB 2025',url:'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados'},
  tesouro:{name:'SICONFI',url:'https://apidatalake.tesouro.gov.br/'},
  mds:{name:'Cadastro Unico',url:'https://www.gov.br/mds/'}
 };
 const metric=(id,label,value,unit,source='ibge')=>({id,label,value,unit,source,period:source==='inep'||source==='tesouro'?'2025':'2022',status:value===null?'indisponivel':'verificado'});
 const indicators=[
  metric('populacao_censo','População residente',2315560,'pessoas'),
  metric('populacao_estimativa','Estimativa de população',2415451,'pessoas'),
  metric('area','Área',331.354,'km²'),metric('densidade','Densidade',6988.18,'hab./km²'),
  metric('jovens_15_29','Jovens de 15-29',479217,'pessoas'),
  metric('jovens_15_29_pct','Participação de jovens',20.6955,'%'),
  metric('jovens_15_19','Jovens de 15-19',134631,'pessoas'),
  metric('jovens_20_24','Jovens de 20-24',169064,'pessoas'),
  metric('jovens_25_29','Jovens de 25-29',175522,'pessoas'),
  metric('alfabetizacao_15mais','Alfabetização 15+',97.78,'%'),
  metric('sem_medio_completo_18mais','18+ sem médio',623858,'pessoas'),
  metric('sem_medio_completo_18mais_pct','18+ sem médio (%)',33.23,'%'),
  metric('superior_completo_18mais_pct','Superior completo (%)',30.05,'%'),
  metric('ideb_iniciais_publica_2025','IDEB inicial rede pública',6.3,'nota (0–10)','inep'),
  metric('ideb_finais_publica_2025','IDEB final rede pública',5.2,'nota (0–10)','inep'),
  metric('orcamento_assistencia','Assistência Social',413513749.69,'R$','tesouro'),
  metric('orcamento_educacao','Educação',null,'R$','tesouro'),
  metric('orcamento_saude','Saúde',6164530838.18,'R$','tesouro')
 ];
 const fixture={
  municipio:{codigoIBGE:'3106200',nome:'Belo Horizonte',uf:'MG'},
  generatedAt:'2026-11-18T18:00:00.000Z',sources,indicators,
  modules:[{id:'demografia',name:'Perfil demográfico',status:'verificado'},{id:'cadunico',name:'Cadastro Único e IVCAD',status:'nao_integrado',reason:'Sem dados publicados integrados'}],
  quality:{verified:17,total:18,coveragePercent:94},
  notes:['Ausência de informação não significa zero.','Competências estatísticas diferem de data de consulta.']
 };
 const output=await generate(fixture);
 const pdf=await PDFDocument.load(output);
 assert.ok(pdf.getPageCount()>=5,'O relatório deve ser multipágina');
 assert.ok(output.byteLength>5000,'O relatório não pode ser vazio');
 assert.equal(output[0],37);
 assert.equal(output[1],80);
 assert.equal(output[2],68);
 assert.equal(output[3],70);
});
