'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {themes,audiences}=require('../taxonomy');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const js=fs.readFileSync(path.join(base,'app.js'),'utf8');
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8');
const api=fs.readFileSync(path.join(base,'api','diagnostico.js'),'utf8');
const liveIds=[...api.matchAll(/indicator\('([^']+)'/g)].map(x=>x[1]).filter(id=>id!=='economia_setor_emprego_');

test('6 grupos temáticos e 6 públicos, únicos e corretamente rotulados',()=>{
 assert.equal(themes.length,6);
 assert.equal(audiences.length,6);
 assert.deepEqual(themes.map(x=>x.name),['Demografia','Socioeducação','SUAS','Trabalho e Renda','Justiça Climática','Socioaprendizagem']);
 assert.deepEqual(audiences.map(x=>x.name),['POP Rua','Juventude','Pessoas Idosas','LGBTQIAPN+','Mulheres','MSE']);
 assert.equal(new Set([...themes,...audiences].map(x=>x.id)).size,12);
 for(const group of [...themes,...audiences]){
  assert.ok(group.description.length>30);
  assert.ok(Array.isArray(group.ids)&&Array.isArray(group.pending));
  for(const p of group.pending)assert.match(p.url,/^https:\/\//);
 }
});
test('todos os indicadores estáticos ou gerados dinamicamente estão mapeados sem valores fabricados',()=>{
 assert.equal(liveIds.length,66);
 const dynamicIds=Array.from({length:6},(_,i)=>'economia_setor_emprego_'+(i+1));
 const known=new Set([...liveIds,...dynamicIds]);
 const reachable=new Set(themes.flatMap(x=>[...x.ids,...(x.contextIds||[])]));
 for(const id of liveIds)assert.ok(reachable.has(id),id+' perdido da taxonomia');
 for(const g of [...themes,...audiences])for(const id of [...g.ids,...(g.contextIds||[])])assert.ok(known.has(id),id+' não existe na API');
 assert.equal(themes.find(x=>x.id==='trabalho').ids.length,19);
 assert.equal(themes.find(x=>x.id==='clima').ids.length,7);
 assert.equal(audiences.find(x=>x.id==='pop-rua').ids.length,0);
 assert.equal(audiences.find(x=>x.id==='lgbt').ids.length,0);
 assert.equal(audiences.find(x=>x.id==='socioeducativa').ids.length,0);
});
test('layout compacto mantém navegação acessível e controles ativos',()=>{
 for(const id of ['switchThemes','switchAudiences','activeTabs','integrityDisclosure','activePanel','featuredMetrics','groupTitle','groupDescription','groupStatus','indicatorList','indicatorCount','showAllBtn','groupGaps','coverage','coverageBar','moduleList','pdfTop','pdfBottom'])assert.ok(html.includes('id="'+id+'"'),id+' ausente');
 assert.ok(html.indexOf('taxonomy.js')<html.indexOf('app.js'));
 assert.match(html,/class="hero hero-compact"/);
 assert.match(html,/class="rail-brand"/);
 assert.match(css,/dashboard-tabs/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/scrollIntoView/);
 assert.match(js,/textContent/);
});
