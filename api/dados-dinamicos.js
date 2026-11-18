'use strict';
// Consultas dinâmicas com fonte, competência e universo verificados.
// O IVCAD nacional é visualizável em painel MDS mas não tem API pública nacional validada.
// Não reutilizar dados estaduais fora da abrangência da fonte.
const IBGE='https://servicodados.ibge.gov.br';
const PE='https://www.cf.pe.gov.br/api/observatorio/serie';
const ages={'95253':'total','114535':'14_17','100052':'18_24','108875':'25_39','99127':'40_59','3302':'60_mais'};
const sectors={
 '116830':'Agropecuária e pesca','116880':'Indústrias extrativas',
 '116910':'Indústria de transformação','117296':'Eletricidade e gás',
 '117307':'Água, esgoto e resíduos','117329':'Construção',
 '117363':'Comércio e reparação de veículos','117484':'Transporte e armazenagem',
 '117543':'Alojamento e alimentação','117555':'Informação e comunicação',
 '117608':'Finanças e seguros','117666':'Atividades imobiliárias',
 '117673':'Atividades profissionais e técnicas','117714':'Serviços administrativos',
 '117774':'Administração pública','117788':'Educação',
 '117810':'Saúde e serviços sociais','117838':'Artes, esporte e recreação',
 '117861':'Outros serviços','117888':'Serviços domésticos','117892':'Organismos internacionais'
};
async function readJson(url,timeout=12500){
 const response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(timeout)});
 if(!response.ok||!String(response.headers.get('content-type')||'').includes('json'))throw Error('Fonte pública indisponível');
 return response.json();
}
function num(value){
 if(value===null||value===undefined||value===''||value==='-'||value==='...'||value==='..')return null;
 const n=Number(String(value).trim().replace(',','.'));return Number.isFinite(n)?n:null;
}
const validIBGE=code=>/^\d{7}$/.test(String(code||''));
function latest(series){
 const keys=Object.keys(series||{}).filter(x=>/^\d{4}(?:\d{2})?$/.test(x)).sort();
 const period=keys.at(-1)||null;
 return {period,value:period?num(series[period]):null};
}
function classified(data,code,classId){
 const m=new Map();
 for(const ob of Array.isArray(data)?data:[])for(const r of ob.resultados||[]){
  const cl=(r.classificacoes||[]).find(x=>String(x.id)===String(classId));
  if(!cl||Object.keys(cl.categoria||{}).length!==1)continue;
  const cat=Object.keys(cl.categoria)[0];
  if(m.has(cat))return null;
  const local=(r.series||[]).find(x=>String(x.localidade?.id)===String(code));
  if(!local)continue;
  const value=latest(local.serie);
  if(!value.period||value.value===null)continue;
  m.set(cat,value);
 }
 return m;
}
function gdpInfo(data,code){
 const row=(Array.isArray(data)?data:[]).find(x=>String(x.id)==='37')?.resultados?.[0];
 const local=row?.series?.find(x=>String(x.localidade?.id)===code);if(!local)return null;
 const entries=Object.entries(local.serie||{}).filter(([y,v])=>/^\d{4}$/.test(y)&&num(v)!==null).sort((a,b)=>a[0].localeCompare(b[0]));
 if(!entries.length)return null;
 const [year,raw]=entries.at(-1),value=num(raw);if(!(value>0))return null;
 let growth=null;
 if(entries.length>1){const [prevYear,previous]=entries.at(-2);if(+prevYear===+year-1&&num(previous)>0)growth=(value/num(previous)-1)*100}
 return {year,pib:value*1000,growth};
}
function sectorInfo(data,code){
 const entries=classified(data,code,12762),total=entries?.get('117897');
 if(!entries||!total||!Number.isSafeInteger(total.value)||total.value<=0)return null;
 const parts=[];
 for(const [id,name] of Object.entries(sectors)){
  const val=entries.get(id);if(!val||val.period!==total.period)continue;
  if(!Number.isSafeInteger(val.value)||val.value<0)return null;
  parts.push({id,name,people:val.value,share:val.value*100/total.value});
 }
 if(!parts.length||parts.reduce((sum,x)=>sum+x.people,0)>total.value)return null;
 parts.sort((a,b)=>b.people-a.people);
 return {year:total.period,total:total.value,top:parts.slice(0,6),covered:parts.reduce((sum,x)=>sum+x.people,0)/total.value};
}
function unemploymentInfo(data,code){
 const entries=classified(data,code,58),total=entries?.get('95253');
 if(!entries||!total||total.value<0||total.value>100)return null;
 const age={};
 for(const [key,id] of Object.entries(ages)){const x=entries.get(key);if(x&&x.period===total.period&&x.value>=0&&x.value<=100)age[id]=x.value}
 return {period:total.period,rate:total.value,age};
}
async function getEconomia(code,uf){
 if(!validIBGE(code))return {gdp:null,sectors:null,unemployment:null};
 const urls=[
  IBGE+'/api/v3/agregados/5938/periodos/-2/variaveis/37?localidades=N6['+code+']',
  IBGE+'/api/v3/agregados/9528/periodos/-1/variaveis/708?localidades=N6['+code+']&classificacao=12762[117897,'+Object.keys(sectors).join(',')+']',
  IBGE+'/api/v3/agregados/4094/periodos/-1/variaveis/4099?localidades=N3['+code.slice(0,2)+']&classificacao=58['+Object.keys(ages).join(',')+']'
 ];
 const results=await Promise.allSettled(urls.map(url=>readJson(url)));
 return {gdp:results[0].status==='fulfilled'?gdpInfo(results[0].value,code):null,
         sectors:results[1].status==='fulfilled'?sectorInfo(results[1].value,code):null,
         unemployment:results[2].status==='fulfilled'?unemploymentInfo(results[2].value,code.slice(0,2)):null,
         uf};
}
const ivcadFields=[
 ['geral','IVCAD - indice geral'],
 ['nc','IVCAD - necessidade de cuidados'],
 ['dpi','IVCAD - desenvolvimento na primeira infancia'],
 ['dca','IVCAD - desenvolvimento de criancas e adolescentes'],
 ['tqa','IVCAD - trabalho e qualificacao de adultos'],
 ['dr','IVCAD - disponibilidade de recursos'],
 ['ch','IVCAD - condicoes habitacionais']
];
function parseIvcadResponses(values,code){
 if(!Array.isArray(values)||values.length!==7||!validIBGE(code))return null;
 let year=null;const out={};
 for(let i=0;i<ivcadFields.length;i++){
  const x=values[i];
  if(x?.fonte!=='seplag_ivcad'||x.indicador!==ivcadFields[i][1]||x.truncado===true||!Array.isArray(x.observacoes)||x.observacoes.length!==1)return null;
  const r=x.observacoes[0];
  if(String(r.cd_municipio_ibge)!==code||!Number.isSafeInteger(r.ano)||!/^Indice/i.test(String(r.unidade||''))||!String(r.fonte_original||'').includes('MDS'))return null;
  if(year!==null&&year!==r.ano)return null;
  year=r.ano;
  const v=num(r.valor);if(v===null||v<0||v>1)return null;
  out[ivcadFields[i][0]]=v;
 }
 const m=(out.nc+out.dpi+out.dca+out.tqa+out.dr+out.ch)/6;
 if(Math.abs(m-out.geral)>0.0001||year<2024||year>2100)return null;
 return {...out,year};
}
async function getIvcad(code,uf){
 if(!validIBGE(code)||uf!=='PE')return null;
 const requests=ivcadFields.map(([,name])=>{
  const url=new URL(PE);url.searchParams.set('fonte','seplag_ivcad');url.searchParams.set('indicador',name);url.searchParams.set('cd',code);
  return readJson(url.toString(),11000);
 });
 const result=await Promise.allSettled(requests);
 return result.some(x=>x.status!=='fulfilled')?null:parseIvcadResponses(result.map(x=>x.value),code);
}
module.exports={getEconomia,getIvcad,parseIvcadResponses,gdpInfo,sectorInfo,unemploymentInfo,readJson};
