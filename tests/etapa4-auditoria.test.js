'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {buildAudit,isUrl}=require('../lib/auditoria');
function fixture(){
 return {
  municipio:{codigoIBGE:'3106200',nome:'Belo Horizonte',uf:'MG'},
  generatedAt:'2026-11-19T12:00:00.000Z',
  sources:{ibge:{name:'IBGE',url:'https://servicodados.ibge.gov.br/'},ips_brasil_2026:{name:'IPS Brasil 2026 · espelho independente',url:'https://ipsbrasil.org.br/explore/data'}},
  indicators:[
   {id:'populacao_censo',label:'População residente',value:2315560,unit:'pessoas',period:'2022',source:'ibge',status:'verificado',note:'Censo 2022'},
   {id:'cadunico_familias',label:'Famílias no CadÚnico',value:null,unit:'famílias',period:'—',source:'ibge',status:'indisponivel',note:'API indisponível'},
   {id:'ips_2026_geral',label:'IPS 2026',value:66.9,unit:'pontos (0–100)',period:'2026',source:'ips_brasil_2026',status:'verificado',note:'Espelho independente'}
  ],
  modules:[{id:'cadunico',name:'Cadastro Único',status:'indisponivel',reason:'Sem dados validáveis'}]
 };
}
test('auditoria identifica a data da consulta sem inventar atualização das fontes',()=>{
 const a=buildAudit(fixture());
 assert.equal(a.total,3);assert.equal(a.verified,2);assert.equal(a.unavailable,1);
 assert.equal(a.sourceUpdatedAt,null);assert.equal(a.consultedAt,'2026-11-19T12:00:00.000Z');
 assert.equal(a.indicators[0].municipality.codigoIBGE,'3106200');
 assert.equal(a.indicators[0].sourceUrl,'https://servicodados.ibge.gov.br/');
 assert.equal(a.indicators[1].value,null);assert.notEqual(a.indicators[1].value,0);
 assert.equal(a.indicators[1].period,null);
 assert.equal(a.indicators[2].origin,'espelho independente');
 assert.equal(a.sourceQuality.secondaryVerified,1);
 assert.equal(a.gaps[0].reason,'Sem dados validáveis');
});
test('auditoria recusa identificadores duplicados e mostra problema de procedência',()=>{
 const dup=fixture();dup.indicators.push({...dup.indicators[0]});
 assert.throws(()=>buildAudit(dup),/duplicado/);
 const problem=fixture();problem.indicators[0].source='desconhecida';
 const a=buildAudit(problem);
 assert.equal(a.warnings[0].severity,'erro');
 assert.equal(a.indicators[0].sourceUrl,null);
 assert.equal(isUrl('javascript:alert(1)'),false);
});
test('interface da Etapa 4 contém filtros, exportação e link de origem',()=>{
 const root=path.join(__dirname,'..');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(root,'auditoria-ui.js'),'utf8');
 const pdf=fs.readFileSync(path.join(root,'api','relatorio.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 for(const id of ['auditSearch','auditStatus','auditSource','auditRows','auditCsv','auditMore','auditUnderlying'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/auditoria-ui\.js/);
 assert.match(ui,/textContent/);
 assert.match(ui,/cleanCsv/);
 assert.match(app,/audit:d\.audit/);
 assert.match(pdf,/auditPages\(pdf,fonts,data\)/);
});
