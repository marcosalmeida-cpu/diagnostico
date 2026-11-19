'use strict';
const {getDiagnosis}=require('./diagnostico');
const {writeStudy}=require('../lib/estudo-territorial');

/* Leitura descritiva fundamentada em evidências por público.
 * Não se substitui o relatório por geração livre; preserva dados e competências.
 */
function factualAnalysis(d){return writeStudy(d);}
async function analyze(d){return factualAnalysis(d);}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 const ibge=String(req.body?.ibge||'');
 if(!/^\d{7}$/.test(ibge))return res.status(400).json({error:'Código IBGE inválido'});
 try{
  const d=await getDiagnosis(ibge);
  const result=await analyze(d);
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({municipio:d.municipio,generatedAt:d.generatedAt,analysis:result});
 }catch(e){return res.status(502).json({error:'Não foi possível produzir o estudo com evidências verificadas.'});}
};
module.exports.analyze=analyze;
module.exports.factualAnalysis=factualAnalysis;
