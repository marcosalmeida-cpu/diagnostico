'use strict';
// Educação e frequência escolar / Censo Demográfico 2022: IBGE Agregados 10056.
// Taxas por faixa etária não devem ser confundidas com matrículas do Inep.
const BASE='https://servicodados.ibge.gov.br/api/v3/agregados/10056/periodos/2022/variaveis/3795';
const AGES=Object.freeze({'99749':'0 a 3 anos','47813':'4 a 5 anos','31615':'6 a 14 anos','2792':'15 a 17 anos','100052':'18 a 24 anos'});
function parseFrequency(payload,code){
 if(!Array.isArray(payload)||!/^\d{7}$/.test(String(code)))return null;
 const rows=payload.filter(x=>String(x.id)==='3795');
 if(rows.length!==1||!Array.isArray(rows[0].resultados))return null;
 const rates={};
 for(const record of rows[0].resultados){
  const classifications=record.classificacoes;
  if(!Array.isArray(classifications)||classifications.length<3)continue;
  const category=id=>classifications.filter(c=>String(c.id)===String(id)).flatMap(c=>Object.keys(c.categoria||{}));
  const age=category(58),sex=category(2),race=category(86);
  if(age.length!==1||!AGES[age[0]]||sex.length!==1||sex[0]!=='6794'||race.length!==1||race[0]!=='95251')continue;
  const series=(record.series||[]).filter(s=>String(s.localidade?.id)===String(code));
  if(series.length!==1)return null;
  const raw=series[0].serie?.['2022'];
  if(raw===null||raw===undefined||raw===''||raw==='-'||raw==='...'||raw==='..')continue;
  const value=Number(String(raw).replace(',','.'));
  if(!Number.isFinite(value)||value<0||value>100)return null;
  if(Object.hasOwn(rates,age[0]))return null;
  rates[age[0]]=value;
 }
 return Object.keys(rates).length?{year:2022,rates}:null;
}
async function getEducationFrequency(code){
 if(!/^\d{7}$/.test(String(code)))return null;
 const url=BASE+'?localidades=N6%5B'+code+'%5D&classificacao=58%5B99749,47813,31615,2792,100052%5D%7C2%5B6794%5D%7C86%5B95251%5D';
 try{
  const response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if(!response.ok||!String(response.headers.get('content-type')||'').includes('json'))return null;
  const data=await response.json();
  return parseFrequency(data,code);
 }catch(_){return null}
}
module.exports={getEducationFrequency,parseFrequency,AGES};
