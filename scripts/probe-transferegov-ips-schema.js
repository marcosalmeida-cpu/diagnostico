'use strict';
async function probe(){
 const j=await (await fetch('https://raw.githubusercontent.com/ernandes-sobreira/IPS-BRASIL/main/conhece_brasil_v1.json',{signal:AbortSignal.timeout(20000)})).json();
 const a=j.municipios||[];
 console.log('IPS_MIRROR_SHAPE',JSON.stringify({length:a.length,first:a[0],middle:a[100],bh:a.find(x=>JSON.stringify(x).toLowerCase().includes('belo horizonte')),keys:Object.keys(j)}).slice(0,5000));
 for(const [module,pathNames] of Object.entries({
  especiais:['/beneficiarios-especiais','/planos-acao-especiais','/programas-especiais','/ordens-pagamentos-ordens-bancarias-especiais'],
  parcerias:['/parceria','/proposta','/beneficiario_emenda_parlamentar'],
  discricionarias:['/propostas','/proponentes']
 })){
   const doc=await(await fetch('https://api-publica.transferegov.gestao.gov.br/'+module+'/openapi.json',{signal:AbortSignal.timeout(25000)})).json();
   for(const path of pathNames){
    const spec=doc.paths?.[path]?.get;if(!spec)continue;
    const params=(spec.parameters||[]).map(p=>({name:p.name,in:p.in,desc:p.description?.slice(0,100),required:p.required,type:p.schema?.type}));
    console.log('TRANSFEREGOV_SCHEMA',JSON.stringify({module,path,params,responseKeys:Object.keys(spec.responses||{})}).slice(0,6000));
   }
 }
}
probe().catch(e=>{console.log('ETAPA2_SCHEMA_ERROR',e.message)});
