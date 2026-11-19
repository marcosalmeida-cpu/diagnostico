'use strict';
(async()=>{
 for(const q of ['familias por faixa de renda no cadastro unico','familias inscritas no cadastro unico','cadastro unico renda extrema pobreza','registro mensal de atendimentos creas']){
 try{const u='https://data.amerigeoss.org/api/3/action/package_search?q='+encodeURIComponent(q)+'&rows=20',r=await fetch(u,{signal:AbortSignal.timeout(15000)}),j=await r.json();
 console.log('CKAN_SEARCH',JSON.stringify({q,status:r.status,count:j.result?.count,packages:j.result?.results?.slice(0,12).map(x=>({name:x.name,title:x.title,resources:x.resources?.slice(0,2).map(k=>({url:k.url,format:k.format}))}))}).slice(0,14500));
 }catch(e){console.log('CKAN_SEARCH',JSON.stringify({q,error:e.message}));}}
})();
