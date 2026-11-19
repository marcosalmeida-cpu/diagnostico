'use strict';
const host='https://aplicacoes.mds.gov.br';
const root='/cadsuas/';
async function req(path,options={}){
 const r=await fetch(host+root+path,{redirect:'manual',signal:AbortSignal.timeout(16000),...options});
 return {status:r.status,head:Object.fromEntries(r.headers),body:await r.text()};
}
async function run(){
 const first=await req('pesquisarConsultaExterna.html');
 const page=first.body;
 const terms=['function carregarMunicipio','function pesquisar()','function mudarTipo','name="consultaExternaHelper.tipoBusca"'];
 for(const t of terms){
  let p=page.indexOf(t);console.log('CADSUAS_FORM',JSON.stringify({term:t,pos:p,code:p>=0?page.slice(p,p+1800).replace(/\s+/g,' '):null}));
 }
 const fields=[...page.matchAll(/<(?:input|select)[^>]+name=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
 console.log('CADSUAS_FIELDS',JSON.stringify(fields));
 const cookies=first.head['set-cookie']?.split(';')[0]||'';
 for(const [name,method,path,body] of [
  ['carregarMunicipio','POST','visualizarConsultaExterna.html',new URLSearchParams({'consultaExternaHelper.tipoBusca':'ent','consultaExternaHelper.endereco.municipio.uf.sigla':'MG'})],
  ['pesquisarSemMun','POST','pesquisarConsultaExterna.html',new URLSearchParams({'consultaExternaHelper.tipoBusca':'ent','consultaExternaHelper.endereco.municipio.uf.sigla':'MG'})]
 ]){
 try{
  const z=await req(path,{method,headers:{'content-type':'application/x-www-form-urlencoded','cookie':cookies},body});
  const opts=[...z.body.matchAll(/<option value=["']([^"']+)["'][^>]*>([^<]+)<\/option>/gi)].slice(0,30).map(x=>[x[1],x[2].trim()]);
  console.log('CADSUAS_RESPONSE',JSON.stringify({name,status:z.status,location:z.head.location,len:z.body.length,options:opts,form:z.body.match(/<form[^>]+>/)?.[0],head:z.body.slice(0,120).replace(/\s+/g,' '),alerts:z.body.match(/.{0,70}(?:resultado|CRAS|CREAS|unidade|Município).{0,100}/gi)?.slice(0,12)}).slice(0,5300));
 }catch(e){console.log('CADSUAS_RESPONSE',JSON.stringify({name,error:e.message}))}
 }
}
run().catch(e=>{console.log('CADSUAS_PROBE_ERROR',e.message)});
