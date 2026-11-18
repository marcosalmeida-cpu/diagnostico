'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {parseBudget,finances,budgetLines}=require('../api/orcamento-publico');
const {sidra,poverty}=require('../api/indicadores-nacionais');
const {getBenefits}=require('../api/beneficios-cgu');
test('DCA: criança e pessoa idosa são subfunções; FIA e fundos não têm valores inventados',()=>{
 const rows=[
  {cod_conta:'TotalDespesas',conta:'08 - Assistência Social',coluna:'Despesas Liquidadas',rotulo:'Total Geral da Despesa por Função',valor:1000},
  {cod_conta:'TotalDespesas',conta:'08.243 - Assistência à Criança e ao Adolescente',coluna:'Despesas Liquidadas',rotulo:'Total Geral da Despesa por Função',valor:200},
  {cod_conta:'TotalDespesas',conta:'08.241 - Assistência à Pessoa Idosa',coluna:'Despesas Liquidadas',rotulo:'Total Geral da Despesa por Função',valor:100}
 ];
 const d=parseBudget(rows,2025);
 assert.equal(d.entries.find(x=>x.id==='crianca_adolescente').value,200);
 assert.equal(d.entries.find(x=>x.id==='pessoas_idosas').value,100);
 assert.equal(d.entries.find(x=>x.id==='cuidado_envelhecimento').value,100);
 for(const k of ['fia','fundo_idoso','fmas','aprendizagem'])assert.equal(d.entries.find(x=>x.id===k).value,null);
 assert.equal(parseBudget(rows.map(x=>x.conta.startsWith('08.243')?{...x,valor:1400}:x),2025),null);
});
test('Receitas e despesas são diferenciadas de dívida e de dinheiro livre',()=>{
 const income=[
  {cod_conta:'ReceitasExcetoIntraOrcamentarias',coluna:'Receitas Brutas Realizadas',valor:1000},
  {cod_conta:'ReceitasExcetoIntraOrcamentarias',coluna:'Deduções - FUNDEB',valor:100},
  {cod_conta:'ReceitasExcetoIntraOrcamentarias',coluna:'Outras Deduções da Receita',valor:30}
 ];
 const expense=[{cod_conta:'TotalDespesas',coluna:'Despesas Liquidadas',valor:700}];
 const r=finances(income,expense,2025);
 assert.equal(r.revenue,870);assert.equal(r.expenditure,700);assert.equal(r.investments,null);
 assert.ok(r.expenditureShare>80&&r.expenditureShare<81);
});
test('Três indicadores nacionais só usam Brasil e a última competência não-nula publicada',()=>{
 const ibge=[{id:'12466',resultados:[{classificacoes:[],series:[{localidade:{id:'1'},serie:{202602:'37.8',202603:'37.5'}}]}]}];
 assert.equal(sidra(ibge,'12466').value,37.5);
 assert.equal(sidra([{id:'12466',resultados:[{series:[{localidade:{id:'31'},serie:{202603:'40'}}]}]}],'12466'),null);
 const wb=[{},[{date:'2025',value:null,countryiso3code:'BRA'},{date:'2024',value:20.6,countryiso3code:'BRA'}]];
 assert.deepEqual(poverty(wb),{value:20.6,period:'2024'});
});
test('CGU sem segredo nunca revela informação pessoal ou inventa beneficiários',async()=>{
 if(process.env.CGU_API_KEY)return;
 const d=await getBenefits('3154606');
 assert.deepEqual(d,{configured:false,bolsa:null,bpc:null});
});
