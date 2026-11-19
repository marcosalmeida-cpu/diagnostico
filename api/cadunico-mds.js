'use strict';
// MDS MI Social: apenas agregados municipais do Cadastro Único (sem dados pessoais).
// Endpoint publico pode responder HTML de manutencao: devolver null e nao criar zeros.
const ENDPOINT='https://aplicacoes.mds.gov.br/sagi/servicos/misocial';
const FIELDS={
 families:'cadun_qtd_familias_cadastradas_i',
 people:'cadun_qtd_pessoas_cadastradas_i',
 lowerIncome:'cadun_qtd_familias_cadastradas_rfpc_ate_meio_sm_i',
 poverty:'cadun_qtd_familias_cadastradas_pobreza_pbf_i',
 updated:'cadun_qtd_familias_atualizadas_i',
 updateRate:'cadun_taxa_atualizacao_cadastral_d'
};
const scalar=x=>{
 if(x===null||x===undefined||String(x).trim()==='')return null;
 if(typeof x!=='string'&&typeof x!=='number')return null;
 const n=Number(x);return Number.isFinite(n)&&n>=0?n:null;
};
function parseCadunicoResponse(payload,code){
 if(!/^[0-9]{7}$/.test(String(code))||!payload||payload.responseHeader?.partialResults===true||payload.responseHeader?.status!==0)return null;
 const response=payload.response;
 if(!response||!Number.isSafeInteger(response.numFound)||response.numFound<1||response.numFound>64||!Array.isArray(response.docs)||response.docs.length!==response.numFound)return null;
 const code6=String(code).slice(0,6);
 const seen=new Set();
 const docs=[];
 for(const doc of response.docs){
  if(String(doc.codigo_ibge)!==code6||!/^(20[0-9]{2})(0[1-9]|1[0-2])$/.test(String(doc.anomes_s))||typeof doc.id!=='string'||seen.has(doc.id))return null;
  seen.add(doc.id);
  const families=scalar(doc[FIELDS.families]);
  if(families!==null&&families>0)docs.push(doc);
 }
 docs.sort((a,b)=>String(b.anomes_s).localeCompare(String(a.anomes_s)));
 if(!docs.length)return null;
 const row=docs[0];
 const out={period:String(row.anomes_s)};
 for(const [name,field] of Object.entries(FIELDS))out[name]=scalar(row[field]);
 const safeInt=v=>v===null||Number.isSafeInteger(v);
 if(Object.entries(out).some(([key,value])=>key!=='period'&&!safeInt(value)&&key!=='updateRate'))return null;
 if(out.people!==null&&out.people<out.families)return null;
 if(out.lowerIncome!==null&&out.lowerIncome>out.families)return null;
 if(out.poverty!==null&&out.poverty>out.families)return null;
 if(out.updated!==null&&out.updated>out.families)return null;
 if(out.updateRate!==null&&(out.updateRate<0||out.updateRate>100))return null;
 // Taxa oficial MDS pode ter denominador distinto da contagem geral.
 return out;
}
async function getCadunico(code){
 if(!/^[0-9]{7}$/.test(String(code)))return null;
 const now=new Date();
 const maxMonth=now.getUTCFullYear()*100+now.getUTCMonth()+1;
 const minYear=now.getUTCFullYear()-2;
 const minMonth=minYear*100+1;
 const body=new URLSearchParams();
 body.set('q','*:*');body.set('wt','json');body.set('rows','64');body.set('sort','anomes_s desc,id asc');
 body.append('fq','codigo_ibge:'+String(code).slice(0,6));
 body.append('fq','anomes_s:['+minMonth+' TO '+maxMonth+']');
 body.set('fl',['id','codigo_ibge','anomes_s',...Object.values(FIELDS)].join(','));
 try{
  const r=await fetch(ENDPOINT,{method:'POST',redirect:'manual',headers:{accept:'application/json,text/plain','content-type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(13000)});
  if(!r.ok||r.status>=300)return null;
  const text=await r.text();
  if(text.length>300000||!text.trimStart().startsWith('{'))return null;
  return parseCadunicoResponse(JSON.parse(text),code);
 }catch(_){return null;}
}
module.exports={getCadunico,parseCadunicoResponse,FIELDS};
