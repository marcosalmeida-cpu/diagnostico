'use strict';
// Leitura SOMENTE da consulta externa pública CadSUAS (MDS). Nenhuma credencial.
const ORIGIN='https://aplicacoes.mds.gov.br';
const ROOT=ORIGIN+'/cadsuas/';
const UF_CODES=/^[A-Z]{2}$/;
const IBGE_CODES=/^[0-9]{7}$/;
const entityMap={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',ccedil:'ç',Ccedil:'Ç',aacute:'á',Aacute:'Á',eacute:'é',Eacute:'É',iacute:'í',Iacute:'Í',oacute:'ó',Oacute:'Ó',uacute:'ú',Uacute:'Ú',agrave:'à',atilde:'ã',Atilde:'Ã',otilde:'õ',Otilde:'Õ',ecirc:'ê',Ecirc:'Ê',acirc:'â',Acirc:'Â',ocirc:'ô',Ocirc:'Ô'};
function decode(s){
 return String(s||'').replace(/&#(?:x([0-9a-fA-F]+)|([0-9]+));/g,(_,h,d)=>{
   const code=parseInt(h||d,h?16:10);return code>0&&code<65536?String.fromCharCode(code):' ';
 }).replace(/&([a-zA-Z]+);/g,(v,k)=>entityMap[k]??' ');
}
const strip=s=>decode(String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const norm=s=>strip(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function extractSelect(html,name){
 const re=/<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
 for(const m of html.matchAll(re)){
  if(!new RegExp('name=["\']'+name.replace(/[.]/g,'[.]')+'["\']').test(m[1]))continue;
  return [...m[2].matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi)]
   .map(x=>({id:x[1],name:strip(x[2])})).filter(x=>x.id&&x.name);
 }
 return [];
}
function parseList(html,code,uf,name,page,type){
 const m=html.match(/<table[^>]*id=["']entidadeList["'][\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
 if(!m)return null;
 const items=[];
 const types={};
 for(const t of extractSelect(html,'consultaExternaHelper.tipoEntidade.id'))types[t.id]=t.name;
 for(const tr of m[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>x[1]);
  if(cells.length<5)return null;
  const a=cells[1].match(/<a\b[^>]*href=["'][^"']*?codigo=([0-9]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
  if(!a)return null;
  const id=Number(a[1]),rowUF=strip(cells[3]),municipality=strip(cells[4]);
  if(!Number.isSafeInteger(id)||rowUF!==uf||norm(municipality)!==norm(name))return null;
  const label=strip(a[2]),unitId=strip(cells[2]);
  if(!label)return null;
  items.push({id,name:label,registration:unitId||null,category:type&&types[type]?types[type]:null,
   address:null,phone:null,email:null,url:ROOT+'visualizarEntidadeConsultaExterna.html?aba=endereco_contatos&codigo='+id});
 }
 const next=html.includes('d-5461696-p='+(page+1))&&items.length>0;
 return {items,page,hasMore:next,types:Object.entries(types).map(([id,name])=>({id,name})),
  source:'MDS / CadSUAS (consulta pública)',sourceUrl:ROOT+'pesquisarConsultaExterna.html',
  note:'Unidades cadastradas no CadSUAS; endereço e telefone extraídos da ficha pública quando disponíveis.'};
}
function labelValue(html,label){
 const re=new RegExp('<strong>\\s*'+label+'\\s*:?\\s*<\\/strong>([\\s\\S]*?)(?=<\\/td>|<\\/tr>|<strong>|<\\/div>|$)','i');
 const m=html.match(re);return m?strip(m[1]).slice(0,350):null;
}
function parseDetails(html){
 const address=labelValue(html,'Endere(?:&ccedil;|ç|&#xE7;|&#231;)o');
 const phone=labelValue(html,'Telefone');
 const email=labelValue(html,'E-mail Institucional');
 return {address:address||null,phone:phone&&phone.replace(/\D/g,'').length>=8?phone:null,
  email:email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?email:null};
}
async function getHtml(url,opt={}){
 const r=await fetch(url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; DiagnosticoTerritorial/1.0)',...opt.headers},signal:AbortSignal.timeout(13000),...opt});
 if(!r.ok)throw Error('CadSUAS indisponível');
 const html=await r.text();
 if(html.length>500000||html.length<100)return null;
 return {html,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};
}
async function getMunicipality(code){
 const r=await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios/'+code,{headers:{accept:'application/json'},signal:AbortSignal.timeout(10500)});
 if(!r.ok)throw Error('IBGE indisponível');
 const j=await r.json();
 const uf=j?.microrregiao?.mesorregiao?.UF?.sigla||j?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla;
 if(String(j?.id)!==code||!UF_CODES.test(uf||'')||typeof j.nome!=='string')throw Error('Município IBGE inválido');
 return {uf,name:j.nome};
}
async function getCadSuasDirectory(code,page=1,type=''){
 if(!IBGE_CODES.test(String(code))||!Number.isInteger(page)||page<1||page>300||!/^\d{0,2}$/.test(type))return null;
 const {uf,name}=await getMunicipality(code);
 const first=await getHtml(ROOT+'pesquisarConsultaExterna.html');
 if(!first)return null;
 const cookie=first.cookie;
 const post=async(path,body)=>{
  const response=await getHtml(ROOT+path,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded',cookie},body:new URLSearchParams(body)});
  return response?.html||null;
 };
 const form={'consultaExternaHelper.tipoBusca':'ent','consultaExternaHelper.endereco.municipio.uf.sigla':uf,
  'consultaExternaHelper.endereco.municipio.id':'','consultaExternaHelper.cpfcnpj':'',
  'consultaExternaHelper.nomeEntidade':'','consultaExternaHelper.tipoEntidade.id':type,
  'consultaExternaHelper.possuiCeas':'0'};
 const selectedHtml=await post('visualizarConsultaExterna.html',form);
 if(!selectedHtml)return null;
 const selected=extractSelect(selectedHtml,'consultaExternaHelper.endereco.municipio.id')
  .find(x=>norm(x.name)===norm(name));
 if(!selected||!/^[0-9]+$/.test(selected.id))return null;
 form['consultaExternaHelper.endereco.municipio.id']=selected.id;
 const available=extractSelect(selectedHtml,'consultaExternaHelper.tipoEntidade.id');
 if(type&&!available.some(x=>x.id===type))return null;
 let html=await post('pesquisarConsultaExterna.html',form);
 if(!html)return null;
 if(page>1){
  const q=new URLSearchParams({...form,'d-5461696-p':String(page)});
  const other=await getHtml(ROOT+'pesquisarConsultaExterna.html?'+q.toString(),{headers:{cookie}});
  if(!other)return null;html=other.html;
 }
 const parsed=parseList(html,code,uf,name,page,type);
 if(!parsed)return null;
 const data=await Promise.allSettled(parsed.items.slice(0,20).map(x=>getHtml(x.url,{headers:{cookie}})));
 parsed.items=parsed.items.map((x,i)=>{
  const h=data[i]?.status==='fulfilled'?data[i].value?.html:null;
  const d=h?parseDetails(h):{};
  return {...x,...d};
 });
 return {...parsed,municipality:name,uf};
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const code=String(req.query.ibge||''),type=String(req.query.tipo||''),page=Number(req.query.pagina||1);
 if(!IBGE_CODES.test(code)||!Number.isInteger(page)||page<1||page>300||!/^\d{0,2}$/.test(type))return res.status(400).json({error:'Parâmetros inválidos'});
 try{
  const data=await getCadSuasDirectory(code,page,type);
  if(!data)return res.status(502).json({error:'O CadSUAS não retornou uma listagem municipal verificável.'});
  res.setHeader('Cache-Control','public, s-maxage=1200, stale-while-revalidate=900');
  return res.status(200).json(data);
 }catch(_){return res.status(502).json({error:'A consulta pública do CadSUAS está temporariamente indisponível.'})}
};
module.exports.getCadSuasDirectory=getCadSuasDirectory;
module.exports.parseList=parseList;
module.exports.parseDetails=parseDetails;
module.exports.extractSelect=extractSelect;
