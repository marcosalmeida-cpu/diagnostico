'use strict';
(async()=>{
 const u='https://paineis.mds.gov.br/public/extensions/painel_adesoes_sisan/indicadores_municipais.html';
 try{
  const r=await fetch(u,{signal:AbortSignal.timeout(20000)}),h=await r.text();
  const scripts=[...h.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(x=>x[1]);
  const links=[...h.matchAll(/(?:[\w./-]+\.(?:csv|json|xlsx|geojson))/gi)].map(x=>x[0]);
  const queryLines=h.split('\n').filter(x=>/\.csv|\.json|xlsx|qlik|connect|loadData|indicadores|dados|api\/|fetch\(/i.test(x)).slice(0,120);
  console.log('SISAN_SITE',JSON.stringify({scripts,links:[...new Set(links)].slice(0,80),lines:queryLines.map(x=>x.trim().slice(0,450))}).slice(0,23000));
  for(const source of scripts.filter(x=>/sisan|indicador|main|app|dados|database|data/i.test(x)).slice(0,10)){
   try{
    const url=new URL(source,u),rr=await fetch(url,{signal:AbortSignal.timeout(11000)}),s=await rr.text();
    console.log('SISAN_SCRIPT',JSON.stringify({source:url.href,status:rr.status,len:s.length,dataLinks:[...new Set([...s.matchAll(/(?:[\w./-]+\.(?:csv|json|xlsx|geojson))/gi)].map(x=>x[0]))].slice(0,30),hits:s.split('\n').filter(x=>/fetch\(|\.csv|\.json|api\/|qlik|Municipio/i.test(x)).slice(0,30).map(x=>x.slice(0,240))}).slice(0,8000));
   }catch(e){console.log('SISAN_SCRIPT_ERROR',source,e.message)}
  }
 }catch(e){console.log('SISAN_ERROR',String(e))}
})();
