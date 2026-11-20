'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../estrategia-catalogo');
const taxonomy=require('../taxonomy');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const study=fs.readFileSync(path.join(__dirname,'../lib/estudo-territorial.js'),'utf8');
const expected=[
  "Programa Operação Trabalho - POT",
  "Rede Sênior: Autonomia Digital",
  "Rede Sênior: Mundo do Trabalho",
  "Rede Sênior: LAB60+",
  "Agentes Socioambientais",
  "Conecta",
  "Start",
  "Jovens Profissionais do Futuro - JPF",
  "O Trabalho vai à escola",
  "Trilha de Desenvolvimento",
  "Meu Trampo é Empreender!",
  "Agentes de Justiça Climática",
  "Socioaprendizagem Público",
  "Apoiar para crescer"
];
test('catálogo contém exatamente os 14 programas da Rede Cidadã informados',()=>{
 assert.deepEqual(catalog.projects.map(x=>x.name),expected);
 const sourceIds=new Set(catalog.sources.map(x=>x.id));
 const projectIds=new Set(catalog.projects.map(x=>x.id));
 assert.equal(projectIds.size,14);
 for(const p of catalog.projects){
  assert.ok(p.description.length>=60,p.id);
  assert.ok(p.caution.length>=60,p.id);
  assert.ok(p.funds.every(id=>sourceIds.has(id)),p.id);
  assert.ok(study.includes("'"+p.id+"'"),p.id+' sem indicação na análise por público');
 }
});
test('prisional integra Públicos e ícones da interface existem',()=>{
 assert.ok(taxonomy.audiences.some(x=>x.id==='prisional'&&x.icon==='ic-prison'));
 assert.ok(!taxonomy.themes.some(x=>x.id==='prisional'));
 const sidebar=html.match(/<nav class="side-nav"[\s\S]*?<\/nav>/)?.[0]||'';
 assert.ok(!sidebar.includes('ic-prison'));
 for(const t of [...taxonomy.themes,...taxonomy.audiences,...taxonomy.budgets])assert.ok(html.includes('id="'+t.icon+'"'),t.id);
 assert.ok(html.includes('id="prisonSourcesPanel"'));
});
