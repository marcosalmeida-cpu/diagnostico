'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {gzipSync}=require('node:zlib');
const handler=require('../lib/habilitacoes');
function invoke(q){
 let status=200,payload=null,headers={};
 const res={setHeader:(k,v)=>headers[k]=v,status(v){status=v;return this},json(v){payload=v;return this}};
 return handler({method:'GET',query:q},res).then(()=>({status,payload,headers}));
}
test('consulta por município+UF, com acentos, preserva as diferenças de conselhos',async()=>{
 process.env.HABILITACOES_TERRITORIAIS_GZIP_B64=gzipSync(JSON.stringify({schema:1,sourceFile:'Teste',sourceSheet:'Socioaprendizagem',sourceUpdatedAt:'2026-11-19T18:17:37Z',rows:[['São Paulo','SP','Presencial','Em operação','Certificado','2025-01-01','2027-01-01','2026-01-01','1505','Não se aplica','','','Em andamento','','']]})).toString('base64');
 const r=await invoke({municipio:'Sao Paulo',uf:'sp'});
 assert.equal(r.status,200);assert.equal(r.payload.found,true);
 assert.equal(r.payload.record.modalidade,'Presencial');
 assert.equal(r.payload.record.cmdcaInscricao.validade,'2027-01-01');
 assert.equal(r.payload.record.cmdcaRegistro.condicaoData,'vencido');
 assert.equal(r.payload.record.cmas.status,'Não se aplica');
 assert.equal(r.payload.record.cmdpi.status,'Em andamento');
 assert.equal(r.headers['Cache-Control'],'private, no-store, max-age=0');
});
test('município fora da planilha não é tratado como sem inscrição',async()=>{
 const r=await invoke({municipio:'Campinas',uf:'SP'});
 assert.equal(r.status,200);assert.equal(r.payload.found,false);
 assert.match(r.payload.message,/não comprova ausência/i);
});
test('parâmetros inválidos recebem 400',async()=>{
 const r=await invoke({municipio:'A',uf:'SP'});assert.equal(r.status,400);
});
