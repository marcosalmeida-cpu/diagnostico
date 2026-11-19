'use strict';
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const {PDFDocument}=require('pdf-lib');
const {getDiagnosis}=require('../api/diagnostico');
const {getMunicipalMap}=require('../api/cartografia-ibge');
const {generate}=require('../api/relatorio');
async function main(){
 const code='3106200';
 const [d,map]=await Promise.all([getDiagnosis(code),getMunicipalMap(code)]);
 if(!map?.geometry||!map?.districts?.length||!map?.subdistricts?.length)throw Error('IBGE não retornou malha, distritos ou subdistritos para BH');
 const bytes=await generate(d);
 const doc=await PDFDocument.load(bytes);
 if(doc.getPageCount()<5)throw Error('Paginação do relatório inválida');
 const dst='/tmp/diagnostico-etapa2-bh.pdf';fs.writeFileSync(dst,bytes);
 const extracted=spawnSync('pdftotext',['-f','2','-l','2','-layout',dst,'-'],{encoding:'utf8',timeout:15000});
 if(extracted.status!==0)throw Error('Não foi possível validar texto da página 2');
 const second=extracted.stdout;
 for(const term of ['Mapa e organização territorial','Belo Horizonte','DISTRITOS OFICIAIS DO IBGE','Barreiro']){
  if(!second.includes(term))throw Error('Página cartográfica não contém: '+term);
 }
 console.log('ETAPA2_PDF_AUDIT',JSON.stringify({municipio:code,pages:doc.getPageCount(),bytes:bytes.length,geometryVertices:map.geometry.vertices,districts:map.districts.length,subdistricts:map.subdistricts.length,mapPageText:second.slice(0,1100)}));
}
main().catch(e=>{console.error('ETAPA2_PDF_FAILURE',e.stack);process.exitCode=1});
