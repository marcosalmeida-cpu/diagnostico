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
 assert(d.audit?.indicators?.length===d.indicators.length,'Auditoria municipal não acompanha o diagnóstico');
 assert(d.audit.municipality.codigoIBGE==='3106200','Código IBGE divergente na auditoria');
 assert(d.audit.verified+d.audit.unavailable===d.audit.total,'Contagem da auditoria inconsistente');
 assert(d.audit.indicators.every(x=>x.status!=='verificado'||Number.isFinite(x.value)),'Valor indisponível indevidamente verificado');
 assert(d.audit.indicators.every(x=>x.consultedAt===d.generatedAt&&x.sourceUpdatedAt===null),'Tempo de consulta foi confundido com atualização da fonte');
 assert(!d.audit.warnings.some(w=>w.severity==='erro'),'Fonte ausente ou estado inconsistente: '+JSON.stringify(d.audit.warnings.filter(w=>w.severity==='erro').slice(0,5)));
 console.log('ETAPA4_AUDIT_SUMMARY',JSON.stringify({municipio:d.municipio.codigoIBGE,indicadores:d.audit.total,verificados:d.audit.verified,semDados:d.audit.unavailable,origens:d.audit.sources.length,avisos:d.audit.warnings.slice(0,8),modulosPendentes:d.audit.gaps.map(x=>x.id)}));
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
 assert(content.includes('Trilha de auditoria'),'PDF sem trilha de auditoria');
 assert(content.includes('Atualização efetiva de cada base: não informada'),'PDF não declara limite de atualização da fonte');
 assert(pdf.getPageCount()>=10,'Paginação reduzida indevidamente');
 console.log('ETAPA3_PDF_OK',JSON.stringify({pages:pdf.getPageCount(),bytes:bytes.length,
  mapPage:pages[1]?.slice(0,150),matriculas2025:ids.slice(2).map(id=>d.indicators.find(x=>x.id===id)?.value)}));
}
run().catch(e=>{console.error('ETAPA3_PDF_FAIL',e.stack);process.exitCode=1});
