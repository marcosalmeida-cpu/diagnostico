'use strict';
// Etapa 4: trilha de auditoria reprodutível por indicador, sem criar valores.
// IMPORTANTE: data da consulta ≠ competência da estatística ≠ atualização da fonte.
const SOURCE_SNAPSHOT=new Set(['mte','inep','caged_pe']);
const SOURCE_SECONDARY=new Set(['ips_brasil_2026']);
const SOURCE_DERIVED=/(_pct$|_por100$|_variacao|_crescimento|_dependencia|_proporcao|_participacao|_taxa|_nao_frequencia_)/i;
const METHOD_PROXIES=/^(economia_pulso_|orcamento_v5_.*proxy|orcamento_v5_propostas_)/;
const isUrl=x=>typeof x==='string'&&/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(x);
const auditStatus=v=>v?.status==='verificado'&&typeof v?.value==='number'&&Number.isFinite(v.value)?'verificado':'indisponivel';
function origin(indicator){
 if(SOURCE_SECONDARY.has(indicator.source))return 'espelho independente';
 if(SOURCE_SNAPSHOT.has(indicator.source))return 'base estatística ou snapshot versionado';
 if(SOURCE_DERIVED.test(indicator.id))return 'cálculo derivado';
 return 'base pública ou API consultada';
}
function method(indicator){
 if(METHOD_PROXIES.test(indicator.id))return 'Indicador auxiliar/proxy; não representa diretamente o fenômeno de referência.';
 if(indicator.id.startsWith('economia_pulso_'))return 'Indicador fiscal, não PIB.';
 if(SOURCE_DERIVED.test(indicator.id))return 'Indicador derivado; verificar denominador, ano e universo na nota.';
 if(SOURCE_SECONDARY.has(indicator.source))return 'Espelho secundário; confrontar com plataforma oficial antes de utilizar em decisões externas.';
 return 'Indicador publicado ou agregado; conferir metodologia e unidade na fonte.';
}
function buildAudit(d){
 if(!d||!Array.isArray(d.indicators)||!d.municipio||typeof d.sources!=='object')throw Error('Diagnóstico incompleto para auditoria');
 const code=String(d.municipio.codigoIBGE||'');
 if(!/^\d{7}$/.test(code)||typeof d.municipio.nome!=='string'||!d.municipio.nome.trim())throw Error('Município inválido na auditoria');
 const time=typeof d.generatedAt==='string'&&!Number.isNaN(Date.parse(d.generatedAt))?new Date(d.generatedAt).toISOString():null;
 const warnings=[],seen=new Set(),sources=new Map(),rows=[];
 for(const item of d.indicators){
  if(!item||typeof item.id!=='string'||!item.id||typeof item.label!=='string'||!item.label.trim())throw Error('Identificador ou rótulo ausente');
  if(seen.has(item.id))throw Error('Identificador de indicador duplicado: '+item.id);
  seen.add(item.id);
  const source=d.sources[item.source],validSource=!!source&&isUrl(source.url)&&typeof source.name==='string'&&!!source.name.trim();
  const status=auditStatus(item);
  if(!validSource)warnings.push({id:item.id,severity:'erro',message:'Fonte ou URL de origem ausente ou inválida.'});
  if(item.status==='verificado'&&status!=='verificado')warnings.push({id:item.id,severity:'erro',message:'Status verificado sem valor numérico válido.'});
  if(status==='verificado'&&(!item.period||item.period==='—'))warnings.push({id:item.id,severity:'atencao',message:'Indicador com valor sem competência estatística identificada.'});
  const unit=typeof item.unit==='string'&&item.unit.trim()?item.unit.trim():null;
  if(status==='verificado'&&!unit)warnings.push({id:item.id,severity:'atencao',message:'Unidade de medida não identificada.'});
  const note=typeof item.note==='string'?item.note.trim():'';
  const record={
   id:item.id,label:item.label,
   value:status==='verificado'?item.value:null,status,unit,
   period:item.period&&item.period!=='—'?String(item.period):null,
   municipality:{codigoIBGE:code,nome:d.municipio.nome,uf:d.municipio.uf||null},
   sourceId:validSource?item.source:String(item.source||''),
   sourceName:validSource?source.name:'Fonte não cadastrada',
   sourceUrl:validSource?source.url:null,
   consultedAt:time,sourceUpdatedAt:null,
   origin:origin(item),method:method(item),note,
   limitation:status!=='verificado'?'Não foi recuperado um valor validado para este município e competência; ausência não é zero.':null
  };
  rows.push(record);
  const k=record.sourceId||'sem-fonte';
  if(!sources.has(k))sources.set(k,{id:k,name:record.sourceName,url:record.sourceUrl,total:0,verified:0,unavailable:0,origin:record.origin});
  const src=sources.get(k);src.total++;if(status==='verificado')src.verified++;else src.unavailable++;
 }
 const verified=rows.filter(x=>x.status==='verificado').length;
 const modules=(Array.isArray(d.modules)?d.modules:[]).filter(x=>x.status!=='verificado').map(x=>({
  id:x.id,name:x.name,status:x.status,reason:x.reason||'Integração ou resultado ainda não validado.',
  sourceId:x.source,sourceUrl:d.sources?.[x.source]?.url||null
 }));
 const result={
  version:'etapa-4-v1',municipality:{codigoIBGE:code,nome:d.municipio.nome,uf:d.municipio.uf||null},
  consultedAt:time,sourceUpdatedAt:null,
  explanation:'Data da consulta indica o instante de geração do diagnóstico, não a última publicação ou atualização da fonte. A competência individual consta em cada indicador.',
  limits:'Cobertura calculada apenas sobre os indicadores implementados na versão, não sobre todos os indicadores que seriam relevantes para o diagnóstico territorial.',
  total:rows.length,verified,unavailable:rows.length-verified,
  sources:[...sources.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),
  indicators:rows,
  warnings,
  gaps:modules,
  sourceQuality:{
   secondaryVerified:rows.filter(x=>x.status==='verificado'&&SOURCE_SECONDARY.has(x.sourceId)).length,
   snapshotVerified:rows.filter(x=>x.status==='verificado'&&SOURCE_SNAPSHOT.has(x.sourceId)).length
  }
 };
 return result;
}
module.exports={buildAudit,origin,method,isUrl};