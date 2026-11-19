'use strict';
const base='https://aplicacoes.mds.gov.br/cadsuas/';
function region(html,field){const pos=html.indexOf('name="'+field+'"');if(pos<0)return '';const a=html.lastIndexOf('<select',pos),b=html.indexOf('</select>',pos);return a<0||b<0?'':html.slice(a,b+9)}
const attrs=x=>[...x.matchAll(/<option[^>]*value=["']([^"']+)["'][^>]*>([\s\S]*?)<\/option>/gi)].map(m=>({id:m[1],label:m[2].replace(/<[^>]+>/g,'').replace(/&\w+;/g,'').trim()}));
async function probe(){
 const first=await fetch(base+'pesquisarConsultaExterna.html',{signal:AbortSignal.timeout(18000)});
 const cookie=first.headers.get('set-cookie')?.split(';')[0]||'';
 await first.text();
 const post=async(path,params)=>{const r=await fetch(base+path,{method:'POST',redirect:'follow',headers:{'content-type':'application/x-www-form-urlencoded',cookie},body:new URLSearchParams(params),signal:AbortSignal.timeout(20000)});return {status:r.status,url:r.url,html:await r.text()}};
 const params={'consultaExternaHelper.tipoBusca':'ent','consultaExternaHelper.endereco.municipio.uf.sigla':'MG','consultaExternaHelper.endereco.municipio.id':'','consultaExternaHelper.nomeEntidade':'','consultaExternaHelper.tipoEntidade.id':''};
 const uf=await post('visualizarConsultaExterna.html',params);
 const municipalities=attrs(region(uf.html,'consultaExternaHelper.endereco.municipio.id'));
 console.log('CADSUAS_MUNICIPIOS',JSON.stringify({status:uf.status,count:municipalities.length,selected:municipalities.filter(x=>/BELO HORIZONTE|RIBEIRÃO DAS NEVES|RIBEIRAO DAS NEVES/i.test(x.label)),sample:municipalities.slice(0,3)}));
 const bh=municipalities.find(x=>/BELO HORIZONTE/i.test(x.label));
 if(!bh)return;
 params['consultaExternaHelper.endereco.municipio.id']=bh.id;
 for(const type of ['','05','26']){
  params['consultaExternaHelper.tipoEntidade.id']=type;
  const r=await post('pesquisarConsultaExterna.html',params);
  const slice=r.html.slice(r.html.indexOf('d-5461696'),r.html.indexOf('d-5461696')+2200);
  console.log('CADSUAS_LISTA',JSON.stringify({type,status:r.status,length:r.html.length,mentions:r.html.match(/.{0,100}(?:<table|CRAS|CREAS|id=.?resultado|<tbody|visualizarEntidade|codigo=|displaytag|resultado.{0,30}).{0,130}/gi)?.slice(0,15),links:[...r.html.matchAll(/href=["']([^"']*visualizarEntidade[^"']*)/gi)].slice(0,8).map(m=>m[1]),snippet:slice.slice(0,1400)}).slice(0,9000));
  const link=r.html.match(/href=["']([^"']*visualizarEntidadeConsultaExterna[^"']*)/i)?.[1];
  if(link){const dest=new URL(link.replace(/&amp;/g,'&'),base);
    const detail=await fetch(dest,{headers:{cookie},signal:AbortSignal.timeout(14000)}),h=await detail.text();
    console.log('CADSUAS_DETAIL',JSON.stringify({status:detail.status,len:h.length,link:dest.toString(),headline:h.match(/.{0,80}(?:Endereço e Contatos|Logradouro|Telefone|Email|Bairro).{0,100}/gi)?.slice(0,25)}).slice(0,4800));
  }
 }
}
async function osc(){
 const url='https://mapaosc.ipea.gov.br/api/api/';
 for(const path of ['lista_osc/municipio/3106200/1','osc/dados_gerais/511766','osc/areas_atuacao/511766','osc/cabecalho/511766']){
  try{const r=await fetch(url+path,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)}),text=await r.text();const j=JSON.parse(text);
  const example=path.startsWith('lista_')?j.lista?.slice(0,2):j;
  console.log('IPEA_DADOS',JSON.stringify({path,status:r.status,total:j.total,keys:Object.keys(j),sample:example}).slice(0,9000));
  }catch(e){console.log('IPEA_DADOS',JSON.stringify({path,error:e.message}))}
 }
}
Promise.all([probe(),osc()]).catch(e=>console.log('DIR_DETALHE_ERROR',e.message));
