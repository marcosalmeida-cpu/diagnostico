'use strict';
// Reproduz indicadores sintéticos IPS Brasil 2026 de um espelho público INDEPENDENTE.
// Gera um snapshot pequeno, com código municipal do IBGE verificado.
// Números não devem ser publicados como fonte primária sem confronto no site IPS.
const fs=require('node:fs');
const SOURCE='https://raw.githubusercontent.com/ernandes-sobreira/IPS-BRASIL/main/conhece_brasil_v1.json';
const IBGE='https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const FIELDS=[
'Índice de Progresso Social','Necessidades Humanas Básicas','Fundamentos do Bem-estar','Oportunidades',
'Nutrição e Cuidados Médicos Básicos','Água e Saneamento','Moradia','Segurança Pessoal',
'Acesso ao Conhecimento Básico','Acesso à Informação e Comunicação','Saúde e Bem-estar',
'Qualidade do Meio Ambiente','Direitos Individuais','Liberdades Individuais e de Escolha',
'Inclusão Social','Acesso à Educação Superior'
];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
async function get(url,max){
 const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('Fonte não disponível: '+r.status);
 const str=await r.text();
 if(str.length>max||str.length<1000)throw Error('Tamanho inesperado da fonte');
 return JSON.parse(str);
}
async function run(){
 const [source,municipalities]=await Promise.all([get(SOURCE,21000000),get(IBGE,11000000)]);
 if(source.n!==5570||source.fonte_ips!=='IPS Brasil 2026'||source.municipios?.length!==5570||!Array.isArray(municipalities)||municipalities.length<5570)throw Error('Cobertura municipal inválida');
 const byName=new Map();
 for(const x of municipalities){
  const uf=x?.microrregiao?.mesorregiao?.UF?.sigla||x?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla;
  if(!uf||!Number.isInteger(x.id))continue;
  const key=uf+'/'+norm(x.nome);
  if(byName.has(key))throw Error('Chave municipal IBGE duplicada: '+key);
  byName.set(key,String(x.id));
 }
 const out={};
 const missing=[],seen=new Set();
 for(const r of source.municipios){
  const key=r.u+'/'+norm(r.m),code=byName.get(key);
  if(!code){missing.push(key);continue;}
  if(seen.has(code))throw Error('Código IBGE duplicado no IPS: '+code);
  const vals=FIELDS.map(k=>r.i?.[k]);
  if(vals.some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100)))throw Error('Pontuação IPS inválida '+code);
  seen.add(code);out[code]=vals.map(v=>Number.isFinite(v)?v:null);
 }
 if(out['3507407']?.[0]!==73.1)throw Error('Nota IPS Gavião Peixoto difere da publicação oficial 2026');
 if(Object.keys(out).length<5550)throw Error('Faltam municípios: '+missing.slice(0,18).join(','));
 const ordered=Object.fromEntries(Object.entries(out).sort(([a],[b])=>a.localeCompare(b)));
 const compact={year:2026,reference:'IPS Brasil 2026',provenance:'espelho público independente — conferir com publicação oficial IPS Brasil',sourceUrl:SOURCE,officialUrl:'https://ipsbrasil.org.br/explore/data',count:Object.keys(ordered).length,fields:FIELDS,municipalities:ordered,unmatched:missing};
 fs.mkdirSync('data',{recursive:true});
 fs.writeFileSync('data/ips2026-snapshot.json',JSON.stringify(compact));
 console.log('IPS_BUILD_AUDIT',JSON.stringify({count:compact.count,missing:missing.slice(0,22),bytes:fs.statSync('data/ips2026-snapshot.json').size,gaviao:out['3507407']?.[0],bh:out['3106200']?.[0]}));
}
run().catch(e=>{console.error('IPS_BUILD_FAILED',e.message);process.exitCode=1});
