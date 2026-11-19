'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {factualAnalysis}=require('../api/analise');
const {themes,audiences}=require('../taxonomy');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const pdf=fs.readFileSync(path.join(root,'api','relatorio.js'),'utf8');
function indicator(id,value,period,source='ibge',unit='pessoas'){
 return {id,label:id.replace(/_/g,' '),value,period,source,unit,status:value===null?'indisponivel':'verificado'};
}
const input={
 municipio:{nome:'Município de Teste',uf:'MG',codigoIBGE:'3106200'},
 sources:{ibge:{name:'IBGE / Censo 2022',url:'https://www.ibge.gov.br/'},mds:{name:'MDS Cadastro Único',url:'https://www.gov.br/mds/'}},
 modules:[],notes:[],indicators:[
 indicator('populacao_censo',123450,'2022'),
 indicator('jovens_15_29',32250,'2022'),
 indicator('jovens_15_29_pct',26.12,'2022','ibge','%'),
 indicator('cadunico_familias',10800,'09/2026','mds','famílias'),
 indicator('suas_pbf_familias_mds',7900,'08/2026','mds','famílias'),
 indicator('suas_bpc_mds_pagador',2100,'08/2026','mds','benefícios'),
 indicator('pop_rua_cadunico_2021',119,'2021','mds'),
 indicator('prisional_pessoas_custodiadas',null,'—','mds'),
 indicator('mse_la_acompanhamento',null,'—','mds'),
 indicator('jovens_mulheres_15_29',16000,'2022'),
 indicator('pessoas_idosas_60mais',12500,'2022')
 ]
};
test('Sistema Prisional integra Públicos, não o menu nem os Temas',()=>{
 assert.equal(themes.some(x=>x.id==='prisional'),false);
 const prison=audiences.find(x=>x.id==='prisional');assert.ok(prison);
 assert.equal(prison.ids.length,7);
 assert.ok(audiences.some(x=>x.id==='familias'));
 assert.ok(!html.includes('href="#prisional"'));
 assert.ok(html.includes('id="prisonSourcesPanel"'));
 assert.ok(app.includes("state.activeKind==='audiences'&&state.activeId==='prisional'"));
});
test('ícones correspondem semanticamente aos itens do menu',()=>{
 for(const name of ['ic-network','ic-funding','ic-projects','ic-prison','ic-family','ic-elder','ic-street'])assert.ok(html.includes('id="'+name+'"'),name);
 for(const pair of [['#rede','ic-network'],['#financiamento','ic-funding'],['#projetos','ic-projects']]){
  const re=new RegExp('href="'+pair[0]+'"[^>]*>[\\s\\S]*?href="#'+pair[1]+'"');
  assert.match(html,re);
 }
});
test('análise narrativa tem público, ano, fonte e vínculos de projetos/financiamento',()=>{
 const a=factualAnalysis(input);
 assert.equal(a.mode,'estudo_tecnico');
 assert.equal(a.sections.length,10);
 for(const id of ['familias','pop-rua','juventude','idosas','mulheres','lgbt','prisional','socioeducativa']){
  const s=a.sections.find(x=>x.id===id);assert.ok(s,'falta público '+id);
  assert.ok(s.paragraphs.join(' ').length>150,id);
  assert.ok(s.projects.length>0,id);
  assert.ok(s.funding.length>0,id);
  assert.ok(s.funding.every(f=>/^https:\/\//.test(f.url)));
 }
 const family=a.sections.find(x=>x.id==='familias');
 assert.match(family.paragraphs[0],/10\.800/);
 assert.match(family.paragraphs[0],/09\/2026/);
 assert.match(family.paragraphs[0],/08\/2026/);
 assert.match(family.paragraphs[0],/MDS Cadastro Único/);
 const pop=a.sections.find(x=>x.id==='pop-rua');
 assert.match(pop.paragraphs[0],/2021/);
 const prison=a.sections.find(x=>x.id==='prisional');
 assert.ok(prison.evidence.length===0);
 assert.match(prison.paragraphs.join(' '),/não demonstra o domicílio/);
 assert.ok(!prison.paragraphs.join(' ').includes('NaN'));
 assert.ok(!a.paragraphs.join(' ').includes('undefined'));
});
test('PDF inclui capítulos de estudo por público, projetos e financiamento com fonte',()=>{
 assert.match(pdf,/strategyPages\(pdf,fonts,data\)/);
 assert.match(pdf,/Fontes de financiamento/);
 assert.match(pdf,/Fontes de consulta|Fonte de consulta/);
 assert.match(pdf,/catalog\.match\(d,catalog\.projects\)/);
 assert.match(pdf,/catalog\.match\(d,catalog\.sources\)/);
 assert.match(pdf,/analysis\.sections/);
});
