'use strict';
// Censo SUAS 2024 - relatório municipal oficial publicado pelo MDS/SAGICAD.
// A tabela informa o número de equipamentos CRAS por capacidade de referenciamento.
// Não equivale ao número de famílias atendidas ou à capacidade de oferta atual.
const STATES={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',
 ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',
 MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',
 RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',
 RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
const PREFIX='https://sagicad-mds.github.io/indicadores-de-desenvolvimento/Municipais/';
function reportUrl(city,uf){
 const state=STATES[String(uf||'').toUpperCase()];
 const name=String(city||'').trim();
 if(!state||!name||name.length>120||/[\/\\<>]/.test(name))return null;
 const folder=state.replace(/\s+/g,'_'),place=name.replace(/\s+/g,'_');
 const file='Relatório_Indicadores_Censo_SUAS_2024-'+folder+'-'+place+'.html';
 return PREFIX+encodeURIComponent(folder)+'/'+encodeURIComponent(file);
}
function strip(html){return String(html).replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/\s+/g,' ').trim();}
function parseCras(html,municipio){
 if(typeof html!=='string'||html.length>1500000||!html.includes('Censo SUAS 2024'))return null;
 if(!html.includes('Quantidade de CRAS em 2024 em '+municipio+','))return null;
 const index=html.indexOf('Quantidade de CRAS em 2024 em '+municipio+',');
 const after=html.slice(index,index+6000);
 const table=after.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
 if(!table)return null;
 const entries=Object.create(null);
 for(const tr of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...tr[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(c=>strip(c[1]));
  if(cells.length!==2)continue;
  const capacity=cells[0].match(/^([235])\.?([05])00 famílias referenciadas$/i);
  if(!capacity)continue;
  const code=cells[0].replace(/\D/g,'');
  if(!['2500','3500','5000'].includes(code)||!/^\d{1,5}$/.test(cells[1])||Object.hasOwn(entries,code))return null;
  entries[code]=Number(cells[1]);
 }
 if(Object.keys(entries).length!==3)return null;
 const total=entries['2500']+entries['3500']+entries['5000'];
 if(!Number.isSafeInteger(total)||total>15000)return null;
 return {total,ate2500:entries['2500'],ate3500:entries['3500'],ate5000:entries['5000']};
}
async function getCras(municipio,uf){
 const url=reportUrl(municipio,uf);
 if(!url)return {data:null,url:null};
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(13000),headers:{accept:'text/html','user-agent':'RedeCidada-Diagnostico/2.1'}});
  if(!response.ok)return {data:null,url};
  const len=Number(response.headers.get('content-length')||0);
  if(len>1500000)return {data:null,url};
  const html=await response.text();
  return {data:parseCras(html,municipio),url};
 }catch(_){return {data:null,url};}
}
module.exports={getCras,reportUrl,parseCras};
