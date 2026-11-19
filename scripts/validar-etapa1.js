'use strict';
// Smoke test de fontes oficiais (sem autenticação e sem gravar dados pessoais).
const {getBudget}=require('../api/orcamento-publico');
const {getFiscalBalances}=require('../lib/fiscal-rgf-rreo');
const {getPibPerCapita}=require('../api/dados-dinamicos');
const {getCadunico}=require('../lib/cadunico-mds');
const scenarios=[
 {code:'3106200',name:'Belo Horizonte'},
 {code:'2611606',name:'Recife'},
 {code:'3550308',name:'São Paulo'}
];
async function run({code,name}){
 const [budget,fiscal,pib,cad]=await Promise.allSettled([
  getBudget(code),getFiscalBalances(code,2025),getPibPerCapita(code),getCadunico(code)
 ]);
 const found=x=>x.status==='fulfilled'?x.value:null;
 const d=found(budget),f=found(fiscal),p=found(pib),m=found(cad);
 const output={
  code,name,yearDca:d?.year??null,yearRgf:f?.year??null,
  taxes:d?.finances?.taxes??null,unionTransfers:d?.finances?.unionTransfers??null,
  stateTransfers:d?.finances?.stateTransfers??null,ownRevenue:d?.finances?.ownRevenue??null,
  transferDependency:d?.finances?.transferDependency??null,
  debt:f?.debt??null,debtNet:f?.debtNet??null,cash:f?.cash??null,restos:f?.restos??null,
  pibPerCapita:p,mdsPeriod:m?.period??null,mdsFamilies:m?.families??null
 };
 console.log('ETAPA1_MUNICIPIO',JSON.stringify(output));
 if(code==='3106200'){
  // Contrato de dados reais: segundo relatório de 2025, saldos sem retificações
  // retroativas relevantes devem ser positivos, coerentes e municipais.
  if(!(d?.year===2025&&d.finances?.taxes>1e9&&d.finances?.unionTransfers>1e9&&
       d.finances?.stateTransfers>1e9&&d.finances?.ownRevenue>1e9&&
       f?.year===2025&&f?.debt>1e9&&f?.cash>1e8&&f?.restos>1e6&&
       p?.year==='2023'&&p.value>10000)){
   throw new Error('Belo Horizonte: integracao oficial falhou em campos essenciais');
  }
 }
}
Promise.all(scenarios.map(run)).catch(e=>{console.error('ETAPA1_AUDIT_ERROR',e.message);process.exitCode=1});
