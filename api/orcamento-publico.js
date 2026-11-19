'use strict';
// DCA Anexos I-C, I-D e I-E / SICONFI: funções e subfunções legalmente
// identificadas, sem extrapolar rubricas de fundos/programas específicos.
const ROOT='https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca';
async function fetchDca(code,year,annex){
 const u=new URL(ROOT);
 u.searchParams.set('an_exercicio',String(year));
 u.searchParams.set('no_anexo','DCA-Anexo I-'+annex);
 u.searchParams.set('id_ente',code);
 const r=await fetch(u,{headers:{accept:'application/json'},signal:AbortSignal.timeout(14500)});
 if(!r.ok||!String(r.headers.get('content-type')||'').includes('json'))throw Error('Sem DCA');
 const j=await r.json();
 const rows=j?.items;
 return Array.isArray(rows)&&rows.length>0&&rows.length<10000?
  rows.filter(x=>String(x.cod_ibge)===code && Number(x.exercicio)===year):[];
}
function nonnegative(value){
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const n=Number(value);
 return Number.isFinite(n)&&n>=0?n:null;
}
function findUnique(rows,code,col){
 const v=rows.filter(x=>x.cod_conta==='TotalDespesas'&&String(x.conta||'').startsWith(code+' - ')&&x.coluna===col&&x.rotulo==='Total Geral da Despesa por Função')
  .map(x=>nonnegative(x.valor)).filter(x=>x!==null);
 return v.length===1?v[0]:null;
}
const budgetLines=[
 ['assistencia_total','Assistência Social — função 08','08','Função específica'],
 ['assistencia_deficiencia','Assistência à pessoa com deficiência — 08.242','08.242','Subfunção contábil 08.242'],
 ['assistencia_comunitaria','Assistência comunitária — 08.244','08.244','Subfunção contábil 08.244'],
 ['educacao_total','Educação — função 12','12','Despesas liquidadas na função Educação'],
 ['ensino_profissional','Ensino profissional — 12.363','12.363','Subfunção Ensino Profissional'],
 ['educacao_eja','Educação de jovens e adultos — 12.366','12.366','Subfunção EJA'],
 ['fomento_trabalho','Fomento ao trabalho — 11.334','11.334','Subfunção Fomento ao Trabalho'],
 ['crianca_adolescente','Assistência à criança e ao adolescente — 08.243','08.243','Subfunção contábil; não identifica FIA nem investimento total na infância'],
 ['pessoas_idosas','Assistência à pessoa idosa — 08.241','08.241','Subfunção contábil; não identifica o Fundo Municipal do Idoso'],
 ['trabalho_renda','Trabalho — função 11','11','Função Trabalho; não equivale a vagas abertas'],
 ['qualificacao','Empregabilidade / qualificação — 11.333','11.333','Proxy subfuncional, não cobre todos os cursos de qualificação'],
 ['aprendizagem','Aprendizagem profissional — rubrica específica',null,'Não individualizada nacionalmente na DCA: consultar LOA, ações e unidades orçamentárias'],
 ['inclusao_digital','Tecnologia da Informação — 04.126','04.126','Proxy ampla; não mede despesa efetiva com inclusão digital'],
 ['cuidado_envelhecimento','Cuidado e envelhecimento — 08.241','08.241','Mesmo valor de 08.241; NÃO somar com assistência à pessoa idosa'],
 ['socioambiental','Gestão Ambiental — função 18','18','Função Gestão Ambiental; não equivale apenas a justiça climática'],
 ['empreendedorismo','Comércio e Serviços — função 23','23','Contexto funcional amplo, NÃO gasto específico em empreendedorismo'],
 ['fia','Fundo Municipal da Infância e Adolescência (FIA)',null,'DCA não discrimina a unidade orçamentária do fundo; LOA e transparência municipal necessários'],
 ['fundo_idoso','Fundo Municipal da Pessoa Idosa',null,'DCA não discrimina fundo municipal; LOA e balancetes municipais necessários'],
 ['fmas','Fundo Municipal de Assistência Social',null,'A função 08 não equivale ao FMAS; necessário detalhamento da unidade gestora municipal']
];
function parseBudget(rows,year){
 if(!Array.isArray(rows)||!rows.length)return null;
 const unique=(code,col='Despesas Liquidadas')=>code?findUnique(rows,code,col):null;
 const entries=budgetLines.map(([id,label,code,note])=>({id,label,value:unique(code),period:String(year),unit:'R$',source:'tesouro_dca',note,classification:code?'contábil / proxy':'não individualizado'}));
 const total=unique('08'),child=unique('08.243'),older=unique('08.241');
 if(total!==null&&((child!==null&&child>total)||(older!==null&&older>total)))return null;
 return {year,entries};
}
function sumUnique(rows,cod,col){
 const vals=rows.filter(x=>x.cod_conta===cod&&x.coluna===col).map(x=>Number(x.valor)).filter(x=>Number.isFinite(x)&&x>=0);
 return vals.length===1?vals[0]:null;
}
function finances(income,expense,year){
 const gross=sumUnique(income,'ReceitasExcetoIntraOrcamentarias','Receitas Brutas Realizadas');
 const fundeb=sumUnique(income,'ReceitasExcetoIntraOrcamentarias','Deduções - FUNDEB');
 const deductions=sumUnique(income,'ReceitasExcetoIntraOrcamentarias','Outras Deduções da Receita');
 const received=gross!==null&&fundeb!==null&&deductions!==null?gross-fundeb-deductions:null;
 const spent=sumUnique(expense,'TotalDespesas','Despesas Liquidadas');
 const investment=sumUnique(expense,'DO4.4.00.00.00.00','Despesas Liquidadas');
 const share=received>0&&spent!==null?spent/received*100:null;
 return {year,revenue:received,expenditure:spent,investments:investment,expenditureShare:share};
}
async function getBudget(code){
 if(!/^\d{7}$/.test(code))return null;
 const lastAnnualYear=new Date().getUTCFullYear()-1;
 for(const year of [lastAnnualYear,lastAnnualYear-1]){
  let rows=[];
  try{rows=await fetchDca(code,year,'E')}catch(_){continue;}
  if(!rows.length)continue;
  const core=parseBudget(rows,year);if(!core)continue;
  // Anexo I-E é suficiente para divulgar as funções/subfunções;
  // falha de I-C ou I-D não invalida as rubricas de assistência social.
  const other=await Promise.allSettled(['C','D'].map(a=>fetchDca(code,year,a)));
  const income=other[0].status==='fulfilled'?other[0].value:[];
  const expense=other[1].status==='fulfilled'?other[1].value:[];
  return {...core,finances:finances(income,expense,year)};
 }
 return null;
}
module.exports={getBudget,parseBudget,finances,budgetLines,findUnique};
