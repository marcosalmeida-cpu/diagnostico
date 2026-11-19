'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const catalog=require('../estrategia-catalogo');
const taxonomy=require('../taxonomy');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const app=fs.readFileSync(path.join(base,'app.js'),'utf8');
const api=fs.readFileSync(path.join(base,'api','diagnostico.js'),'utf8');
test('causas e fontes são nacionais, rastreáveis e não representadas como editais abertos',()=>{
 assert.ok(catalog.sources.length>=10);
 assert.ok(catalog.projects.length>=9);
 assert.ok(catalog.causes.length>=6);
 const ids=new Set();
 for(const s of catalog.sources){
  assert.match(s.url,/^https:\/\//);
  assert.ok(Array.isArray(s.causes)&&s.causes.length>0);
  assert.ok(s.qualification.length>40);
  assert.ok(s.mechanism.length>30);
  assert.ok(!ids.has(s.id));ids.add(s.id);
 }
 for(const p of catalog.projects){
  assert.ok(p.description.length>40);
  assert.ok(p.funds.every(id=>ids.has(id)),p.id+' referência a financiamento inexistente');
  assert.ok(Array.isArray(p.evidence));
 }
});
test('a correspondência territorial só usa valores numéricos e fontes verificadas',()=>{
 const d={indicators:[
  {id:'jovens_15_29',label:'Jovens',value:0,unit:'pessoas',period:'2022',status:'verificado'},
  {id:'cadunico_familias',label:'Famílias',value:null,unit:'famílias',period:'—',status:'indisponivel'},
  {id:'prisional_pessoas_custodiadas',label:'Prisionais',value:100,unit:'pessoas',period:'—',status:'nao_integrado'},
  {id:'mte_potencial_cota',label:'Aprendizes',value:128,unit:'pessoas',period:'2026',status:'verificado'}
 ]};
 const found=catalog.evidence(d,['jovens_15_29','cadunico_familias','prisional_pessoas_custodiadas','mte_potencial_cota']);
 assert.deepEqual(found.map(x=>x.id),['jovens_15_29','mte_potencial_cota']);
 assert.equal(found[0].value,0,'zero legítimo permanece zero');
 assert.equal(catalog.evidence(null,['jovens_15_29']).length,0);
 assert.ok(catalog.match(d,catalog.projects)[0].verified.length>=1);
});
test('Sistema Prisional tem aba, fonte, público, indicadores e limites territoriais',()=>{
 const prison=taxonomy.audiences.find(x=>x.id==='prisional');
 assert.ok(prison);assert.equal(prison.ids.length,7);
 assert.equal(taxonomy.themes.some(x=>x.id==='prisional'),false);
 for(const id of prison.ids)assert.ok(api.includes("'"+id+"'"));
 for(const id of ['mse_la_acompanhamento','mse_psc_acompanhamento'])assert.ok(api.includes("'"+id+"'"));
 assert.match(api,/sisdepen_unidades/);
 for(const id of ['prisonSourcesPanel','financiamento','projetos','prisonSources','fundingCards','projectCards','fundingCause','projectCause'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/estrategia-ui.js/);
 assert.match(html,/estrategia-catalogo.js/);
 assert.match(app,/RC_STRATEGY_RENDER\(d\)/);
 assert.ok(!html.includes('href="#prisional"'),'Sistema Prisional não deve ser item independente de menu');
});
