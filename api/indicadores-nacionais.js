'use strict';
// Indicadores nacionais oficiais: consulta pública e competência explícita.
const IBGE='https://servicodados.ibge.gov.br';
const WB='https://api.worldbank.org/v2/country/BRA/indicator/SI.POV.UMIC?format=json&per_page=65';
async function getJson(url){
 const r=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(11000)});
 if(!r.ok||!String(r.headers.get('content-type')).includes('json'))throw Error('Fonte não disponível');
 return r.json();
}
function sidra(data,id){
 const e=Array.isArray(data)?data.find(x=>String(x.id)===id):null;
 const sr=e?.resultados?.[0]?.series?.find(x=>String(x.localidade?.id)==='1');
 if(!sr)return null;
 const entries=Object.entries(sr.serie||{}).filter(([k,v])=>/^\d{6}$/.test(k)&&Number.isFinite(Number(v))).sort((a,b)=>a[0].localeCompare(b[0]));
 if(!entries.length)return null;
 const [period,v]=entries.at(-1),value=Number(v);
 return value>=0&&value<=100?{value,period:period.slice(0,4)+' T'+Number(period.slice(5,6)),periodRaw:period}:null;
}
function poverty(data){
 const rows=Array.isArray(data)&&Array.isArray(data[1])?data[1]:[];
 const entry=rows.filter(x=>x?.countryiso3code==='BRA'&&/^\d{4}$/.test(x.date)&&
  typeof x.value==='number'&&Number.isFinite(x.value)&&x.value>=0&&x.value<=100)
  .sort((a,b)=>Number(b.date)-Number(a.date))[0];
 return entry?{value:entry.value,period:entry.date}:null;
}
async function getBrazil(){
 const urls=[
  IBGE+'/api/v3/agregados/4094/periodos/-1/variaveis/4099?localidades=N1[all]&classificacao=58[95253]',
  IBGE+'/api/v3/agregados/8529/periodos/-1/variaveis/12466?localidades=N1[all]',
  WB
 ];
 const a=await Promise.allSettled(urls.map(getJson));
 const safe=i=>a[i].status==='fulfilled'?a[i].value:null;
 return {
  updatedAt:new Date().toISOString(),
  items:[
   {id:'desocupacao_br',label:'Desocupação · Brasil',...(sidra(safe(0),'4099')||{value:null,period:null}),source:'IBGE/PNAD Contínua',sourceUrl:'https://sidra.ibge.gov.br/tabela/4094',note:'Percentual da força de trabalho desocupada, Brasil; não é percentual da população residente.'},
   {id:'informalidade_br',label:'Informalidade · Brasil',...(sidra(safe(1),'12466')||{value:null,period:null}),source:'IBGE/PNAD Contínua',sourceUrl:'https://sidra.ibge.gov.br/tabela/8529',note:'Percentual dos ocupados classificados como informais; base Brasil.'},
   {id:'pobreza_br',label:'Pobreza · Brasil',...(poverty(safe(2))||{value:null,period:null}),source:'Banco Mundial / Poverty and Inequality Platform',sourceUrl:'https://data.worldbank.org/indicator/SI.POV.UMIC?locations=BR',note:'Proporção abaixo de US$ 8,30/dia PPC 2021. Série internacional, não é faixa de renda do CadÚnico.'}
  ]
 };
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 try{
  const d=await getBrazil();
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=7200');
  return res.status(200).json(d);
 }catch(e){return res.status(502).json({error:'Indicadores nacionais temporariamente indisponíveis'})}
};
module.exports.getBrazil=getBrazil;
module.exports.sidra=sidra;
module.exports.poverty=poverty;
