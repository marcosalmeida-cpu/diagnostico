'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {budgetLines,parseBudget}=require('../api/orcamento-publico');
const taxonomy=require('../taxonomy');
test('V6 inclui funções e subfunções sociais solicitadas',()=>{
 const codes=new Set(budgetLines.map(x=>x[2]));
 for(const code of ['08','08.241','08.242','08.243','08.244','11','11.333','11.334','12','12.363','12.366'])assert.ok(codes.has(code),code);
});
test('não atribui valores inexistentes nem confunde zero com indisponibilidade',()=>{
 const rows=[{cod_conta:'TotalDespesas',conta:'08.242 - Assistência à Pessoa com Deficiência',coluna:'Despesas Liquidadas',rotulo:'Total Geral da Despesa por Função',valor:100}];
 const budget=parseBudget(rows,2025);
 assert.equal(budget.entries.find(x=>x.id==='assistencia_deficiencia').value,100);
 assert.equal(budget.entries.find(x=>x.id==='educacao_eja').value,null);
});
test('interface lista indicadores orçamentários V6',()=>{
 const ids=taxonomy.budgets.flatMap(x=>x.ids);
 for(const id of ['assistencia_deficiencia','assistencia_comunitaria','fomento_trabalho','educacao_total','ensino_profissional','educacao_eja'])assert.ok(ids.includes('orcamento_v5_'+id));
});
test('DCA não interpreta campo vazio como despesa zero',()=>{
 const rows=[{cod_conta:'TotalDespesas',conta:'08.242 - Assistência à Pessoa com Deficiência',coluna:'Despesas Liquidadas',rotulo:'Total Geral da Despesa por Função',valor:''}];
 const budget=parseBudget(rows,2025);
 assert.equal(budget.entries.find(x=>x.id==='assistencia_deficiencia').value,null);
});
