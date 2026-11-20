'use strict';
const {gunzipSync}=require('node:zlib');
const SOURCE_URL='https://redecidada.sharepoint.com/sites/habilitacoes/_layouts/15/Doc.aspx?sourcedoc=%7B4F3A4387-5754-4AF7-B6B4-2E853B4BF8FE%7D&action=default';
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
let snapshot=null,loadedValue=null;
function loadSnapshot(){
 const raw=process.env.HABILITACOES_TERRITORIAIS_GZIP_B64||'';
 if(!raw)return null;
 if(snapshot&&raw===loadedValue)return snapshot;
 const parsed=JSON.parse(gunzipSync(Buffer.from(raw,'base64')).toString('utf8'));
 if(parsed.schema!==1||!Array.isArray(parsed.rows)||parsed.rows.length<1)throw Error('Estrutura da base de habilitações inválida');
 snapshot=parsed;loadedValue=raw;return snapshot;
}
function validity(raw){
 if(!raw)return {label:'Não informada',condition:'sem_data'};
 if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){
   const t=Date.parse(raw+'T23:59:59Z');
   if(!Number.isFinite(t))return {label:raw,condition:'nao_verificavel'};
   return {label:raw,condition:t<Date.now()?'vencido':'data_futura'};
 }
 return {label:raw,condition:'informacao_textual'};
}
function council(status,number,expiry,extra){
 const valid=validity(expiry);
 return {status:status||'Não informado',numero:number||null,validade:valid.label,condicaoData:valid.condition,...extra};
}
function getRecord(row){
 const [municipio,uf,modalidade,situacaoTerritorio,cmdcaStatus,cmdcaInicio,inscricaoAte,registroAte,cmdcaNumero,cmasStatus,cmasNumero,cmasAte,cmdpiStatus,cmdpiNumero,cmdpiAte]=row;
 return {
   municipio,uf,modalidade:modalidade||'Não informada',situacaoTerritorio:situacaoTerritorio||'Não informada',
   cmdcaInscricao:council(cmdcaStatus,cmdcaNumero,inscricaoAte,{inicio:cmdcaInicio||null}),
   cmdcaRegistro:council(cmdcaStatus,null,registroAte,{observacao:'Situação geral do CMDCA; não comprova registro individual sem documento correspondente.'}),
   cmas:council(cmasStatus,cmasNumero,cmasAte),
   cmdpi:council(cmdpiStatus,cmdpiNumero,cmdpiAte),
 };
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const nome=String(req.query?.municipio||'').trim(),uf=String(req.query?.uf||'').trim().toUpperCase();
 if(nome.length<2||nome.length>120||!/^[A-Z]{2}$/.test(uf))return res.status(400).json({error:'Município e UF são obrigatórios.'});
 try{
  const data=loadSnapshot();
  if(!data)return res.status(503).json({error:'Base institucional de habilitações não configurada.'});
  const row=data.rows.find(r=>norm(r[0])===norm(nome)&&String(r[1]).toUpperCase()===uf);
  const source={name:data.sourceFile,sheet:data.sourceSheet,updatedAt:data.sourceUpdatedAt,url:SOURCE_URL};
  if(!row)return res.status(200).json({found:false,source,message:'Município sem registro identificado nesta planilha. Isto não comprova ausência de inscrição.'});
  return res.status(200).json({found:true,source,record:getRecord(row)});
 }catch(_){return res.status(503).json({error:'Não foi possível consultar o retrato de habilitações; nenhuma situação foi presumida.'})}
};
module.exports._test={norm,validity,getRecord,loadSnapshot};
