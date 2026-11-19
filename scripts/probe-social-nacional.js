'use strict';
const queries=[
['cadunico_solr','https://aplicacoes.mds.gov.br/sagi/servicos/misocial','POST'],
['cecad_rua','https://cecad.cidadania.gov.br/agregado/resumovariavelCecad.php?id=44&nome_estado=MG+-+Minas+Gerais&nome_municipio=Belo+Horizonte&p_ibge=3106200&uf_ibge=31'],
['cecad_resumo','https://cecad.cidadania.gov.br/agregado/resumovariavelCecad.php?id=44&p_ibge=3550308&uf_ibge=35'],
['mds_sisan','https://paineis.mds.gov.br/public/extensions/painel_adesoes_sisan/indicadores_municipais.html'],
['mds_ibge_reports','https://aplicacoes.cidadania.gov.br/ri/pbfcad/'],
['visdata','https://aplicacoes.mds.gov.br/sagi/vis/data/home.php'],
['dadosgov','https://dados.gov.br/api/publico/conjuntos-dados?titulo=Bolsa%20Fam%C3%ADlia'],
['dadosgov_search','https://dados.gov.br/api/publico/conjuntos-dados?pagina=1&titulo=Cadastro%20%C3%9Anico'],
['ckan_bpc','https://data.amerigeoss.org/api/3/action/package_show?id=bpc-por-municipio-pagador-mi-social'],
['ckan_pbf','https://data.amerigeoss.org/api/3/action/package_show?id=bolsa-familia-misocial'],
['mds_rma','https://aplicacoes.mds.gov.br/sagi/servicos/misocial'],
['rma_page','https://aplicacoes.mds.gov.br/sagi/vis/data/data-explorer.php']
];
const form=new URLSearchParams({q:'*:*',wt:'json',rows:'2',sort:'anomes_s desc,id asc',fl:'id,codigo_ibge,anomes_s,cadun_qtd_familias_cadastradas_i,cadun_qtd_pessoas_cadastradas_i,cadun_qtd_familias_cadastradas_pobreza_pbf_i,cadun_qtd_familias_cadastradas_extrema_pobreza_i'});
form.append('fq','codigo_ibge:310620');form.append('fq','anomes_s:[202401 TO 202611]');
async function probe([name,url,method]){
 const opt={signal:AbortSignal.timeout(18000),redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; diagnostico-publico/1.0)',accept:'application/json,text/html,*/*'}};
 if(method==='POST'){opt.method='POST';opt.headers['content-type']='application/x-www-form-urlencoded';opt.body=form;}
 try {
  const r=await fetch(url,opt),txt=await r.text(),type=r.headers.get('content-type')||'';
  let j=null;try{j=JSON.parse(txt)}catch(_){}
  const result={name,status:r.status,contentType:type,url:r.url,bytes:txt.length,head:txt.slice(0,500).replace(/\s+/g,' ')};
  if(j){result.keys=Object.keys(j).slice(0,25);result.numFound=j.response?.numFound;result.docs=j.response?.docs?.slice(0,2);
    if(j.result?.resources)result.resources=j.result.resources.slice(0,5).map(x=>({name:x.name,url:x.url,format:x.format}));}
  if(name==='cecad_rua'||name==='cecad_resumo'){
   result.title=(txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1];
   result.tables=(txt.match(/<table[\s\S]*?<\/table>/gi)||[]).slice(0,3).map(x=>x.slice(0,2800).replace(/\s+/g,' '));
   result.csvs=[...txt.matchAll(/href=["']([^"']*(?:csv|download)[^"']*)["']/gi)].slice(0,15).map(x=>x[1]);
   result.params=[...txt.matchAll(/name=["']([^"']+)["']/g)].slice(0,22).map(x=>x[1]);
  }
  console.log('SOCIAL_PROBE',JSON.stringify(result).slice(0,8000));
 }catch(e){console.log('SOCIAL_PROBE',JSON.stringify({name,error:String(e.message)}))}
}
Promise.all(queries.map(probe));
