'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {PDFDocument}=require('pdf-lib');
const {getDiagnosis}=require('../api/diagnostico');
const {generate}=require('../api/relatorio');
async function run(){
 const d=await getDiagnosis('3106200');
 const ids=['educacao_frequencia_6a14','educacao_frequencia_15a17',
 'educacao_inep_2025_creche','educacao_inep_2025_pre_escola',
 'educacao_inep_2025_fundamental','educacao_inep_2025_medio',
 'educacao_inep_2025_escolas_fundamental'];
 for(const id of ids){
  const v=d.indicators.find(i=>i.id===id);
  assert(v?.status==='verificado'&&Number.isFinite(v.value),'Indicador educação não integrado: '+id);
 }
 const bytes=await generate(d),pdf=await PDFDocument.load(bytes);
 const dest='/tmp/diagnostico-v9-educacao-bh.pdf';fs.writeFileSync(dest,bytes);
 const t=spawnSync('pdftotext',['-layout',dest,'-'],{encoding:'utf8',timeout:20000});
 if(t.status!==0)throw Error('pdftotext indisponível');
 const content=t.stdout;
 const pages=content.split('\f');
 assert(pages[1]?.includes('Mapa e organização territorial'),'Mapa IBGE não está na página 2');
 for(const label of ['Matrículas','ensino médio','Frequência escolar','creche']){
  assert(content.toLowerCase().includes(label.toLowerCase()),'Texto educacional cortado/ausente: '+label);
 }
 assert(pdf.getPageCount()>=10,'Paginação reduzida indevidamente');
 console.log('ETAPA3_PDF_OK',JSON.stringify({pages:pdf.getPageCount(),bytes:bytes.length,
  mapPage:pages[1]?.slice(0,150),matriculas2025:ids.slice(2).map(id=>d.indicators.find(x=>x.id===id)?.value)}));
}
run().catch(e=>{console.error('ETAPA3_PDF_FAIL',e.stack);process.exitCode=1});
