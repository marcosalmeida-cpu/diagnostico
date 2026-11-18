'use strict';

const {PDFDocument, StandardFonts, rgb} = require('pdf-lib');
const {getDiagnosis} = require('./diagnostico');
const {analyze} = require('./analise');

const A4 = [595.28, 841.89];
// Paleta Rede Cidadã / Guia da Marca - setembro de 2025.
const COLORS = {
  navy: rgb(3/255,34/255,214/255), blue: rgb(3/255,34/255,214/255),
  sky: rgb(101/255,200/255,243/255), red: rgb(1,0,31/255),
  pale: rgb(.94,.97,1), green: rgb(1,192/255,0), ink: rgb(.12,.17,.28),
  gray: rgb(.37,.45,.56), line: rgb(.87,.91,.96), white: rgb(1,1,1),
  neutral: rgb(.985,.99,.997)
};
const BRANDPATHS = [
  ['M436.290,218.145 C436.290,97.667 338.623,0 218.145,0 C97.667,0 0,97.667 0,218.145 C0,338.624 97.667,436.291 218.145,436.291 C338.623,436.291 436.290,338.624 436.290,218.145 Z',COLORS.blue],
  ['M220.714,172.217 L220.714,100.913 L236.075,100.913 L236.075,139.266 C247.711,122.434 263.967,109.038 283.030,100.913 L283.030,117.454 C260.762,128.828 243.655,148.811 236.075,173.013 L236.075,257.429 L220.714,257.429 L220.714,173.147 L220.438,173.147 C220.521,172.833 220.627,172.530 220.714,172.217 Z',rgb(0,235/255,1)],
  ['M189.121,163.519 C189.121,146.231 175.105,132.216 157.816,132.216 C140.526,132.216 126.510,146.231 126.510,163.519 C126.510,180.808 140.526,194.823 157.816,194.823 C175.105,194.823 189.121,180.808 189.121,163.519 Z',COLORS.green],
  ['M220.899,351.336 C168.274,351.595 123.862,318.338 110.893,273.080 L127.135,273.080 C139.626,310.194 176.910,337.055 220.834,336.838 C264.576,336.653 301.416,309.880 313.757,273.080 L329.984,273.080 C317.181,317.963 273.319,351.114 220.899,351.336 Z',COLORS.red]
];
function drawBrandFace(page,x,y,size){
  const scale=size/436.29;
  for(const [path,color] of BRANDPATHS)page.drawSvgPath(path,{x,y,scale,color});
}
function brandStripe(page,y,height=5){
  const segment=A4[0]/4;
  [COLORS.sky,COLORS.blue,COLORS.red,COLORS.green].forEach((color,i)=>
    page.drawRectangle({x:i*segment,y,width:segment+.2,height,color}));
}
const number=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
const clean=s=>String(s??'').replace(/[\u0000-\u001f]/g,' ')
  .replace(/[\u2010-\u2015]/g,'-').replace(/[^\u0020-\u007e\u00a0-\u00ff]/g,' ')
  .replace(/\s+/g,' ').trim();

function wrap(text,font,size,width) {
  const words=clean(text).split(' ');
  const result=[];let line='';
  for(const word of words){
    if(!word)continue;
    // Even long links must fit inside the page.
    const chunks=[];let chunk='';
    for(const char of word){
      if(chunk && font.widthOfTextAtSize(chunk+char,size)>width){chunks.push(chunk);chunk=char}
      else chunk+=char;
    }
    if(chunk)chunks.push(chunk);
    for(let i=0;i<chunks.length;i++){
      const piece=chunks[i];
      const candidate=line?line+(i===0?' ':'')+piece:piece;
      if(line && font.widthOfTextAtSize(candidate,size)>width){result.push(line);line=piece}
      else line=candidate;
    }
  }
  if(line)result.push(line);
  return result.length?result:[''];
}
function text(page,string,x,y,style) {
  const {size=10,font,color=COLORS.ink,maxWidth=510,lineHeight=size*1.45}=style;
  const rows=wrap(string,font,size,maxWidth);
  for(const row of rows){page.drawText(row,{x,y,size,font,color});y-=lineHeight}
  return y;
}
function rule(page,y,x=42,w=511){page.drawLine({start:{x,y},end:{x:x+w,y},thickness:1,color:COLORS.line})}
function sectionOf(id){
 if(id.startsWith('ivcad_'))return 'IVCAD 2026 - VULNERABILIDADE FAMILIAR (PE)';
 if(id.startsWith('saneamento_'))return 'INFRAESTRUTURA SOCIOAMBIENTAL - CENSO 2022';
 if(id.startsWith('suas_'))return 'PROTEÇÃO SOCIAL - CENSO SUAS 2024';
 if(id.startsWith('mte_'))return 'APRENDIZAGEM PROFISSIONAL - POTENCIAL DE COTA';
 if(id.startsWith('orcamento_'))return 'EXECUÇÃO ORÇAMENTÁRIA';
 if(id.startsWith('pessoas_idosas')||id.startsWith('mulheres_idosas')||id.startsWith('homens_idosos')||id.startsWith('mulheres_entre_idosos'))return 'PESSOAS IDOSAS - CENSO 2022';
 if(id.startsWith('populacao_mulheres')||id.startsWith('populacao_homens')||id==='mulheres_pct')return 'COMPOSIÇÃO POR SEXO - CENSO 2022';
 if(id.startsWith('jovens_'))return 'PERFIL DA JUVENTUDE';
 if(/(alfabetizacao|medio|superior|ideb)/.test(id))return 'ESCOLARIDADE E EDUCAÇÃO';
 return 'PERFIL DEMOGRÁFICO';
}
function formatIndicator(v){
 if(v.value===null)return 'Indisponível';
 if(v.unit==='R
 return number.format(v.value)+(v.unit==='pessoas'?' pessoas':v.unit==='%'?'%':v.unit==='km²'?' km²':v.unit==='hab./km²'?' hab./km²':v.unit==='postos potenciais'?' postos potenciais':v.unit==='unidades'?' unidades':v.unit==='famílias'?' famílias':v.unit==='domicílios'?' domicílios':'');
}
function makePage(pdf,fonts,title,subtitle){
 const p=pdf.addPage(A4),h=A4[1];
 p.drawRectangle({x:0,y:h-72,width:A4[0],height:72,color:COLORS.navy});
 brandStripe(p,h-5,5);
 p.drawText('REDE CIDADÃ',{x:42,y:h-31,size:14,font:fonts.bold,color:COLORS.white});
 p.drawText('INTELIGÊNCIA SOCIOTERRITORIAL',{x:42,y:h-50,size:8,font:fonts.reg,color:COLORS.green});
 let y=h-103;
 y=text(p,title,42,y,{size:20,font:fonts.bold,color:COLORS.navy,maxWidth:510,lineHeight:22});
 y=text(p,subtitle,42,y-4,{size:9,font:fonts.reg,color:COLORS.gray,maxWidth:510,lineHeight:13});
 return {page:p,y:y-31};
}
function footer(p,i,total,fonts){
 brandStripe(p,0,4);
 rule(p,48);
 const left='Diagnóstico Territorial Integrado  |  Rede Cidadã  |  HOMOLOGAÇÃO';
 p.drawText(clean(left),{x:42,y:33,size:7.5,font:fonts.reg,color:COLORS.gray});
 p.drawText(i+'/'+total,{x:522,y:33,size:8,font:fonts.bold,color:COLORS.blue});
}
function statBox(page,fonts,x,y,w,label,value,sub){
 page.drawRectangle({x,y:y-93,width:w,height:93,color:COLORS.pale});
 text(page,label,x+15,y-19,{size:9,font:fonts.bold,maxWidth:w-30,color:COLORS.gray,lineHeight:13});
 text(page,value,x+15,y-47,{size:20,font:fonts.bold,maxWidth:w-30,color:COLORS.navy,lineHeight:21});
 text(page,sub,x+15,y-76,{size:8,font:fonts.reg,maxWidth:w-30,color:COLORS.gray,lineHeight:11});
}
function cover(pdf,fonts,d,analysis){
 const p=pdf.addPage(A4),h=A4[1],w=A4[0];
 p.drawRectangle({x:0,y:0,width:w,height:h,color:COLORS.navy});
 brandStripe(p,h-14,14);
 // Símbolo original do guia da marca em suporte claro, preservado sem distorções.
 p.drawCircle({x:490,y:h-102,size:51,color:COLORS.white});
 drawBrandFace(p,459,h-71,62);
 p.drawText('REDE CIDADÃ',{x:46,y:h-86,font:fonts.bold,size:19,color:COLORS.white});
 p.drawText('OBSERVATÓRIO DE REALIDADE SOCIAL',{x:46,y:h-112,font:fonts.reg,size:9,color:COLORS.green});
 p.drawText('DIAGNÓSTICO',{x:46,y:635,font:fonts.bold,size:38,color:COLORS.white});
 p.drawText('TERRITORIAL',{x:46,y:588,font:fonts.bold,size:38,color:COLORS.white});
 p.drawRectangle({x:46,y:547,width:80,height:6,color:COLORS.green});
 let y=text(p,d.municipio.nome+' / '+d.municipio.uf,46,509,{size:25,font:fonts.bold,color:COLORS.white,maxWidth:500,lineHeight:30});
 y=text(p,'Código IBGE: '+d.municipio.codigoIBGE,46,y-9,{size:12,font:fonts.reg,color:COLORS.white,maxWidth:500});
 y=text(p,'Consulta: '+new Date(d.generatedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),46,y-3,{size:10,font:fonts.reg,color:COLORS.green,maxWidth:500});
 p.drawRectangle({x:46,y:265,width:503,height:126,color:COLORS.blue});
 p.drawText('CONTROLE DE INTEGRIDADE',{x:65,y:365,size:10,font:fonts.bold,color:COLORS.green});
 p.drawText(d.quality.verified+' / '+d.quality.total,{x:65,y:312,size:32,font:fonts.bold,color:COLORS.white});

 p.drawText('Indicadores do recorte demonstrativo',{x:196,y:322,size:10,font:fonts.reg,color:COLORS.white});
 p.drawText('Ausência de dado não equivale a valor zero.',{x:65,y:287,size:10,font:fonts.reg,color:COLORS.white});
 text(p,'Relatório preliminar com informações oficiais, referências, análise social e lacunas explícitas. A interpretação não substitui diagnóstico de campo e decisão técnica institucional.',46,225,{size:11,font:fonts.reg,color:COLORS.white,maxWidth:492,lineHeight:17});
 p.drawText('MODO DE ANÁLISE: '+(analysis.mode==='ia'?'IA ASSISTIVA COM REVISÃO HUMANA':'REGRAS AUDITÁVEIS'),{x:46,y:91,size:9,font:fonts.bold,color:COLORS.green});
 p.drawText('HOMOLOGAÇÃO - NÃO É PARECER DEFINITIVO DE VIABILIDADE',{x:46,y:70,size:8.5,font:fonts.bold,color:COLORS.white});
}
function indicatorPages(pdf,fonts,d){
 let view=makePage(pdf,fonts,'Indicadores e métricas municipais',d.municipio.nome+' / '+d.municipio.uf+' · fontes e períodos individuais');
 let p=view.page,y=view.y,current='';
 for(const item of d.indicators){
  const group=sectionOf(item.id),value=formatIndicator(item);
  const valueLines=wrap(value,fonts.bold,13,477);
  const noteLines=item.note?wrap(item.note,fonts.reg,7.3,474):[];
  const rowHeight=39+(valueLines.length>1?14:0)+(noteLines.length?Math.min(noteLines.length,2)*10:0);
  const need=(current===group?0:26)+rowHeight+9;
  if(y-need<67){view=makePage(pdf,fonts,'Indicadores e métricas (continuação)',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;current=''}
  if(current!==group){
   p.drawRectangle({x:42,y:y-2,width:4,height:14,color:COLORS.green});
   p.drawText(clean(group),{x:54,y:y+1,size:10,font:fonts.bold,color:COLORS.blue});
   y-=25;current=group;
  }
  p.drawRectangle({x:42,y:y-rowHeight,width:511,height:rowHeight,color:item.status==='verificado'?COLORS.pale:COLORS.neutral});
  p.drawText(clean(item.label),{x:54,y:y-16,size:9.5,font:fonts.bold,color:COLORS.navy,maxWidth:478});
  let pos=text(p,value,54,y-35,{size:13,font:fonts.bold,color:item.value===null?COLORS.gray:COLORS.blue,maxWidth:478,lineHeight:14});
  if(noteLines.length){text(p,item.note,54,pos-1,{size:7.3,font:fonts.reg,color:COLORS.gray,maxWidth:474,lineHeight:10})}
  const source=d.sources[item.source]?.name||'Fonte não cadastrada';
  const sourceLabel=source+' | '+(item.period||'competência indisponível');
  p.drawText(clean(sourceLabel),{x:288,y:y-16,size:7.2,font:fonts.reg,color:COLORS.gray,maxWidth:251});
  y-=rowHeight+6;
 }
}
function executivePage(pdf,fonts,d){
 const view=makePage(pdf,fonts,'Síntese executiva','Recorte inicial de dados públicos por município');
 const {page:p}=view;let y=view.y;
 const by=id=>d.indicators.find(x=>x.id===id);
 statBox(p,fonts,42,y,247,'População residente · Censo',formatIndicator(by('populacao_censo')),'IBGE · 2022');
 statBox(p,fonts,306,y,247,'Juventude · 15 a 29 anos',formatIndicator(by('jovens_15_29')),'IBGE · 2022');
 y-=108;
 statBox(p,fonts,42,y,247,'Alfabetização · 15 anos ou mais',formatIndicator(by('alfabetizacao_15mais')),'IBGE · 2022');
 statBox(p,fonts,306,y,247,'Sem ensino médio · 18 anos ou mais',formatIndicator(by('sem_medio_completo_18mais_pct')),'IBGE · 2022');
 y-=126;
 p.drawText('PAINEL DE MARCADORES SOCIAIS',{x:42,y,size:11,font:fonts.bold,color:COLORS.navy});
 y-=31;
 for(const [id,label] of [['jovens_15_29_pct','Participação dos jovens'],['alfabetizacao_15mais','Alfabetização'],['sem_medio_completo_18mais_pct','Sem ensino médio concluído']]){
  const item=by(id),n=item?.value;
  p.drawText(label,{x:44,y,size:10,font:fonts.reg,color:COLORS.blue});
  p.drawText(n===null||n===undefined?'N/D':number.format(n)+'%',{x:467,y,size:10,font:fonts.bold,color:COLORS.navy});
  y-=12;
  p.drawRectangle({x:44,y:y-10,width:478,height:9,color:COLORS.line});
  if(Number.isFinite(n)&&n>=0&&n<=100)p.drawRectangle({x:44,y:y-10,width:478*n/100,height:9,color:COLORS.sky});
  y-=40;
 }
 y-=10;
 rule(p,y);y-=32;
 p.drawText('COMO INTERPRETAR OS DADOS',{x:43,y,size:11,font:fonts.bold,color:COLORS.navy});y-=23;
 for(const paragraph of [
  'Os percentuais referem-se a populações distintas. A juventude utiliza o total de residentes; alfabetização utiliza pessoas de 15 anos ou mais; escolaridade utiliza pessoas de 18 anos ou mais.',
  'O último Censo é de 2022. Não se deve apresentar seus resultados como se retratassem automaticamente a situação de 2026.',
  'Para deliberar sobre projetos, integrar indicadores de trabalho, aprendizagem e proteção social e realizar escuta qualificada da rede territorial.'
 ]){
  y=text(p,paragraph,44,y,{size:10,font:fonts.reg,maxWidth:500,color:COLORS.gray,lineHeight:15})-17;
 }
}
function analysisPages(pdf,fonts,d,analysis){
 let view=makePage(pdf,fonts,'Leitura técnica e análise social','Interpretação fundamentada nos indicadores disponíveis');
 let {page:p}=view,y=view.y;
 p.drawText('MÉTODO: '+(analysis.mode==='ia'?'ANÁLISE ASSISTIDA POR IA':'SÍNTESE DETERMINÍSTICA'),{x:44,y,size:9,font:fonts.bold,color:COLORS.blue});y-=30;
 const blocks=Array.isArray(analysis.paragraphs)?analysis.paragraphs:[];
 for(const paragraph of blocks){
  const rows=wrap(paragraph,fonts.reg,10.5,493),height=rows.length*16+18;
  if(y-height<80){view=makePage(pdf,fonts,'Leitura técnica (continuação)',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;}
  p.drawRectangle({x:42,y:y-height+13,width:3,height:height-6,color:COLORS.green});
  y=text(p,paragraph,53,y-5,{size:10.5,font:fonts.reg,maxWidth:490,lineHeight:16,color:COLORS.ink})-14;
 }
 if(y<240){view=makePage(pdf,fonts,'Propostas de aprofundamento',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;}
 y-=8;p.drawText('RECOMENDAÇÕES CONDICIONADAS',{x:43,y,size:11,font:fonts.bold,color:COLORS.navy});y-=26;
 for(const recommendation of analysis.recommendations||[]){
  const rows=wrap(recommendation.reason,fonts.reg,9.5,485);
  if(y-(rows.length*14+28)<70){view=makePage(pdf,fonts,'Propostas de aprofundamento (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  p.drawText(clean(recommendation.title)+' · '+clean(recommendation.priority),{x:44,y,size:10,font:fonts.bold,color:COLORS.blue});y-=19;
  y=text(p,recommendation.reason,44,y,{size:9.5,font:fonts.reg,maxWidth:484,lineHeight:14,color:COLORS.gray})-10;
 }
}
function sourcesPages(pdf,fonts,d,analysis){
 let view=makePage(pdf,fonts,'Fontes, rastreabilidade e limitações','Bases públicas identificadas e status de cobertura');
 let {page:p}=view,y=view.y;
 for(const [key,s] of Object.entries(d.sources)){
  const lines=wrap(s.url,fonts.reg,7.4,510),need=26+lines.length*11;
  if(y-need<100){view=makePage(pdf,fonts,'Fontes públicas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  p.drawText(clean(s.name),{x:43,y,size:10,font:fonts.bold,color:COLORS.blue});y-=15;
  y=text(p,s.url,44,y,{size:7.4,font:fonts.reg,maxWidth:507,lineHeight:11,color:COLORS.gray})-15;
 }
 if(y<235){view=makePage(pdf,fonts,'Fontes e lacunas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
 p.drawText('MÓDULOS PENDENTES OU INDISPONÍVEIS',{x:42,y,size:11,font:fonts.bold,color:COLORS.navy});y-=25;
 for(const mod of d.modules.filter(m=>m.status!=='verificado')){
  const msg=(mod.name||mod.id)+' - '+(mod.reason||'Indicadores não confirmados.');
  const rows=wrap(msg,fonts.reg,8.8,497),need=rows.length*13+11;
  if(y-need<100){view=makePage(pdf,fonts,'Lacunas de evidência (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,msg,44,y,{size:8.8,font:fonts.reg,maxWidth:497,lineHeight:13,color:COLORS.gray})-11;
 }
 if(y<205){view=makePage(pdf,fonts,'Notas metodológicas',d.municipio.nome);p=view.page;y=view.y;}
 p.drawText('LIMITAÇÕES OBRIGATÓRIAS',{x:43,y,size:10,font:fonts.bold,color:COLORS.navy});y-=22;
 const limitations=[...d.notes,...(analysis.limitations||[]),'O relatório é uma síntese preliminar de homologação. A viabilidade de projetos depende da validação técnica institucional.'];
 for(const msg of [...new Set(limitations)]){
  const rows=wrap(msg,fonts.reg,8.7,499),needed=rows.length*12+10;
  if(y-needed<100){view=makePage(pdf,fonts,'Notas metodológicas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,'- '+msg,44,y,{size:8.7,font:fonts.reg,maxWidth:499,lineHeight:12,color:COLORS.gray})-10;
 }
}
async function generate(data){
 const pdf=await PDFDocument.create();
 const fonts={reg:await pdf.embedFont(StandardFonts.Helvetica),bold:await pdf.embedFont(StandardFonts.HelveticaBold)};
 const analysis=await analyze(data);
 pdf.setTitle('Diagnóstico Territorial - '+data.municipio.nome+' / '+data.municipio.uf);
 pdf.setAuthor('Rede Cidadã - Inteligência Socioterritorial');
 pdf.setSubject('Diagnóstico em homologação, fontes públicas, indicadores e limitações');
 cover(pdf,fonts,data,analysis);
 executivePage(pdf,fonts,data);
 indicatorPages(pdf,fonts,data);
 analysisPages(pdf,fonts,data,analysis);
 sourcesPages(pdf,fonts,data,analysis);
 const pages=pdf.getPages();
 for(let i=0;i<pages.length;i++) if(i>0)footer(pages[i],i+1,pages.length,fonts);
 return pdf.save();
}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 const ibge=String(req.body?.ibge||'');
 if(!/^\d{7}$/.test(ibge))return res.status(400).json({error:'Código IBGE inválido'});
 try{
  const data=await getDiagnosis(ibge);
  const bytes=await generate(data);
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="Rede-Cidada-Diagnostico-'+ibge+'.pdf"');
  res.setHeader('Cache-Control','no-store');
  return res.status(200).send(Buffer.from(bytes));
 }catch(e){
  return res.status(502).json({error:'Não foi possível gerar um relatório verificável. Confirme a disponibilidade das fontes e tente novamente.'});
 }
};
module.exports.generate=generate;
)return currency.format(v.value);
 if(v.unit==='índice (0–1)')return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(v.value)+' (0 a 1)';
 return number.format(v.value)+(v.unit==='pessoas'?' pessoas':v.unit==='%'?'%':v.unit==='km²'?' km²':v.unit==='hab./km²'?' hab./km²':v.unit==='postos potenciais'?' postos potenciais':v.unit==='unidades'?' unidades':'');
}
function makePage(pdf,fonts,title,subtitle){
 const p=pdf.addPage(A4),h=A4[1];
 p.drawRectangle({x:0,y:h-72,width:A4[0],height:72,color:COLORS.navy});
 brandStripe(p,h-5,5);
 p.drawText('REDE CIDADÃ',{x:42,y:h-31,size:14,font:fonts.bold,color:COLORS.white});
 p.drawText('INTELIGÊNCIA SOCIOTERRITORIAL',{x:42,y:h-50,size:8,font:fonts.reg,color:COLORS.green});
 let y=h-103;
 y=text(p,title,42,y,{size:20,font:fonts.bold,color:COLORS.navy,maxWidth:510,lineHeight:22});
 y=text(p,subtitle,42,y-4,{size:9,font:fonts.reg,color:COLORS.gray,maxWidth:510,lineHeight:13});
 return {page:p,y:y-31};
}
function footer(p,i,total,fonts){
 brandStripe(p,0,4);
 rule(p,48);
 const left='Diagnóstico Territorial Integrado  |  Rede Cidadã  |  HOMOLOGAÇÃO';
 p.drawText(clean(left),{x:42,y:33,size:7.5,font:fonts.reg,color:COLORS.gray});
 p.drawText(i+'/'+total,{x:522,y:33,size:8,font:fonts.bold,color:COLORS.blue});
}
function statBox(page,fonts,x,y,w,label,value,sub){
 page.drawRectangle({x,y:y-93,width:w,height:93,color:COLORS.pale});
 text(page,label,x+15,y-19,{size:9,font:fonts.bold,maxWidth:w-30,color:COLORS.gray,lineHeight:13});
 text(page,value,x+15,y-47,{size:20,font:fonts.bold,maxWidth:w-30,color:COLORS.navy,lineHeight:21});
 text(page,sub,x+15,y-76,{size:8,font:fonts.reg,maxWidth:w-30,color:COLORS.gray,lineHeight:11});
}
function cover(pdf,fonts,d,analysis){
 const p=pdf.addPage(A4),h=A4[1],w=A4[0];
 p.drawRectangle({x:0,y:0,width:w,height:h,color:COLORS.navy});
 brandStripe(p,h-14,14);
 // Símbolo original do guia da marca em suporte claro, preservado sem distorções.
 p.drawCircle({x:490,y:h-102,size:51,color:COLORS.white});
 drawBrandFace(p,459,h-71,62);
 p.drawText('REDE CIDADÃ',{x:46,y:h-86,font:fonts.bold,size:19,color:COLORS.white});
 p.drawText('OBSERVATÓRIO DE REALIDADE SOCIAL',{x:46,y:h-112,font:fonts.reg,size:9,color:COLORS.green});
 p.drawText('DIAGNÓSTICO',{x:46,y:635,font:fonts.bold,size:38,color:COLORS.white});
 p.drawText('TERRITORIAL',{x:46,y:588,font:fonts.bold,size:38,color:COLORS.white});
 p.drawRectangle({x:46,y:547,width:80,height:6,color:COLORS.green});
 let y=text(p,d.municipio.nome+' / '+d.municipio.uf,46,509,{size:25,font:fonts.bold,color:COLORS.white,maxWidth:500,lineHeight:30});
 y=text(p,'Código IBGE: '+d.municipio.codigoIBGE,46,y-9,{size:12,font:fonts.reg,color:COLORS.white,maxWidth:500});
 y=text(p,'Consulta: '+new Date(d.generatedAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),46,y-3,{size:10,font:fonts.reg,color:COLORS.green,maxWidth:500});
 p.drawRectangle({x:46,y:265,width:503,height:126,color:COLORS.blue});
 p.drawText('CONTROLE DE INTEGRIDADE',{x:65,y:365,size:10,font:fonts.bold,color:COLORS.green});
 p.drawText(d.quality.verified+' / '+d.quality.total,{x:65,y:312,size:32,font:fonts.bold,color:COLORS.white});

 p.drawText('Indicadores do recorte demonstrativo',{x:196,y:322,size:10,font:fonts.reg,color:COLORS.white});
 p.drawText('Ausência de dado não equivale a valor zero.',{x:65,y:287,size:10,font:fonts.reg,color:COLORS.white});
 text(p,'Relatório preliminar com informações oficiais, referências, análise social e lacunas explícitas. A interpretação não substitui diagnóstico de campo e decisão técnica institucional.',46,225,{size:11,font:fonts.reg,color:COLORS.white,maxWidth:492,lineHeight:17});
 p.drawText('MODO DE ANÁLISE: '+(analysis.mode==='ia'?'IA ASSISTIVA COM REVISÃO HUMANA':'REGRAS AUDITÁVEIS'),{x:46,y:91,size:9,font:fonts.bold,color:COLORS.green});
 p.drawText('HOMOLOGAÇÃO - NÃO É PARECER DEFINITIVO DE VIABILIDADE',{x:46,y:70,size:8.5,font:fonts.bold,color:COLORS.white});
}
function indicatorPages(pdf,fonts,d){
 let view=makePage(pdf,fonts,'Indicadores e métricas municipais',d.municipio.nome+' / '+d.municipio.uf+' · fontes e períodos individuais');
 let p=view.page,y=view.y,current='';
 for(const item of d.indicators){
  const group=sectionOf(item.id),value=formatIndicator(item);
  const valueLines=wrap(value,fonts.bold,13,477);
  const noteLines=item.note?wrap(item.note,fonts.reg,7.3,474):[];
  const rowHeight=39+(valueLines.length>1?14:0)+(noteLines.length?Math.min(noteLines.length,2)*10:0);
  const need=(current===group?0:26)+rowHeight+9;
  if(y-need<67){view=makePage(pdf,fonts,'Indicadores e métricas (continuação)',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;current=''}
  if(current!==group){
   p.drawRectangle({x:42,y:y-2,width:4,height:14,color:COLORS.green});
   p.drawText(clean(group),{x:54,y:y+1,size:10,font:fonts.bold,color:COLORS.blue});
   y-=25;current=group;
  }
  p.drawRectangle({x:42,y:y-rowHeight,width:511,height:rowHeight,color:item.status==='verificado'?COLORS.pale:COLORS.neutral});
  p.drawText(clean(item.label),{x:54,y:y-16,size:9.5,font:fonts.bold,color:COLORS.navy,maxWidth:478});
  let pos=text(p,value,54,y-35,{size:13,font:fonts.bold,color:item.value===null?COLORS.gray:COLORS.blue,maxWidth:478,lineHeight:14});
  if(noteLines.length){text(p,item.note,54,pos-1,{size:7.3,font:fonts.reg,color:COLORS.gray,maxWidth:474,lineHeight:10})}
  const source=d.sources[item.source]?.name||'Fonte não cadastrada';
  const sourceLabel=source+' | '+(item.period||'competência indisponível');
  p.drawText(clean(sourceLabel),{x:288,y:y-16,size:7.2,font:fonts.reg,color:COLORS.gray,maxWidth:251});
  y-=rowHeight+6;
 }
}
function executivePage(pdf,fonts,d){
 const view=makePage(pdf,fonts,'Síntese executiva','Recorte inicial de dados públicos por município');
 const {page:p}=view;let y=view.y;
 const by=id=>d.indicators.find(x=>x.id===id);
 statBox(p,fonts,42,y,247,'População residente · Censo',formatIndicator(by('populacao_censo')),'IBGE · 2022');
 statBox(p,fonts,306,y,247,'Juventude · 15 a 29 anos',formatIndicator(by('jovens_15_29')),'IBGE · 2022');
 y-=108;
 statBox(p,fonts,42,y,247,'Alfabetização · 15 anos ou mais',formatIndicator(by('alfabetizacao_15mais')),'IBGE · 2022');
 statBox(p,fonts,306,y,247,'Sem ensino médio · 18 anos ou mais',formatIndicator(by('sem_medio_completo_18mais_pct')),'IBGE · 2022');
 y-=126;
 p.drawText('PAINEL DE MARCADORES SOCIAIS',{x:42,y,size:11,font:fonts.bold,color:COLORS.navy});
 y-=31;
 for(const [id,label] of [['jovens_15_29_pct','Participação dos jovens'],['alfabetizacao_15mais','Alfabetização'],['sem_medio_completo_18mais_pct','Sem ensino médio concluído']]){
  const item=by(id),n=item?.value;
  p.drawText(label,{x:44,y,size:10,font:fonts.reg,color:COLORS.blue});
  p.drawText(n===null||n===undefined?'N/D':number.format(n)+'%',{x:467,y,size:10,font:fonts.bold,color:COLORS.navy});
  y-=12;
  p.drawRectangle({x:44,y:y-10,width:478,height:9,color:COLORS.line});
  if(Number.isFinite(n)&&n>=0&&n<=100)p.drawRectangle({x:44,y:y-10,width:478*n/100,height:9,color:COLORS.sky});
  y-=40;
 }
 y-=10;
 rule(p,y);y-=32;
 p.drawText('COMO INTERPRETAR OS DADOS',{x:43,y,size:11,font:fonts.bold,color:COLORS.navy});y-=23;
 for(const paragraph of [
  'Os percentuais referem-se a populações distintas. A juventude utiliza o total de residentes; alfabetização utiliza pessoas de 15 anos ou mais; escolaridade utiliza pessoas de 18 anos ou mais.',
  'O último Censo é de 2022. Não se deve apresentar seus resultados como se retratassem automaticamente a situação de 2026.',
  'Para deliberar sobre projetos, integrar indicadores de trabalho, aprendizagem e proteção social e realizar escuta qualificada da rede territorial.'
 ]){
  y=text(p,paragraph,44,y,{size:10,font:fonts.reg,maxWidth:500,color:COLORS.gray,lineHeight:15})-17;
 }
}
function analysisPages(pdf,fonts,d,analysis){
 let view=makePage(pdf,fonts,'Leitura técnica e análise social','Interpretação fundamentada nos indicadores disponíveis');
 let {page:p}=view,y=view.y;
 p.drawText('MÉTODO: '+(analysis.mode==='ia'?'ANÁLISE ASSISTIDA POR IA':'SÍNTESE DETERMINÍSTICA'),{x:44,y,size:9,font:fonts.bold,color:COLORS.blue});y-=30;
 const blocks=Array.isArray(analysis.paragraphs)?analysis.paragraphs:[];
 for(const paragraph of blocks){
  const rows=wrap(paragraph,fonts.reg,10.5,493),height=rows.length*16+18;
  if(y-height<80){view=makePage(pdf,fonts,'Leitura técnica (continuação)',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;}
  p.drawRectangle({x:42,y:y-height+13,width:3,height:height-6,color:COLORS.green});
  y=text(p,paragraph,53,y-5,{size:10.5,font:fonts.reg,maxWidth:490,lineHeight:16,color:COLORS.ink})-14;
 }
 if(y<240){view=makePage(pdf,fonts,'Propostas de aprofundamento',d.municipio.nome+' / '+d.municipio.uf);p=view.page;y=view.y;}
 y-=8;p.drawText('RECOMENDAÇÕES CONDICIONADAS',{x:43,y,size:11,font:fonts.bold,color:COLORS.navy});y-=26;
 for(const recommendation of analysis.recommendations||[]){
  const rows=wrap(recommendation.reason,fonts.reg,9.5,485);
  if(y-(rows.length*14+28)<70){view=makePage(pdf,fonts,'Propostas de aprofundamento (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  p.drawText(clean(recommendation.title)+' · '+clean(recommendation.priority),{x:44,y,size:10,font:fonts.bold,color:COLORS.blue});y-=19;
  y=text(p,recommendation.reason,44,y,{size:9.5,font:fonts.reg,maxWidth:484,lineHeight:14,color:COLORS.gray})-10;
 }
}
function sourcesPages(pdf,fonts,d,analysis){
 let view=makePage(pdf,fonts,'Fontes, rastreabilidade e limitações','Bases públicas identificadas e status de cobertura');
 let {page:p}=view,y=view.y;
 for(const [key,s] of Object.entries(d.sources)){
  const lines=wrap(s.url,fonts.reg,7.4,510),need=26+lines.length*11;
  if(y-need<100){view=makePage(pdf,fonts,'Fontes públicas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  p.drawText(clean(s.name),{x:43,y,size:10,font:fonts.bold,color:COLORS.blue});y-=15;
  y=text(p,s.url,44,y,{size:7.4,font:fonts.reg,maxWidth:507,lineHeight:11,color:COLORS.gray})-15;
 }
 if(y<235){view=makePage(pdf,fonts,'Fontes e lacunas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
 p.drawText('MÓDULOS PENDENTES OU INDISPONÍVEIS',{x:42,y,size:11,font:fonts.bold,color:COLORS.navy});y-=25;
 for(const mod of d.modules.filter(m=>m.status!=='verificado')){
  const msg=(mod.name||mod.id)+' - '+(mod.reason||'Indicadores não confirmados.');
  const rows=wrap(msg,fonts.reg,8.8,497),need=rows.length*13+11;
  if(y-need<100){view=makePage(pdf,fonts,'Lacunas de evidência (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,msg,44,y,{size:8.8,font:fonts.reg,maxWidth:497,lineHeight:13,color:COLORS.gray})-11;
 }
 if(y<205){view=makePage(pdf,fonts,'Notas metodológicas',d.municipio.nome);p=view.page;y=view.y;}
 p.drawText('LIMITAÇÕES OBRIGATÓRIAS',{x:43,y,size:10,font:fonts.bold,color:COLORS.navy});y-=22;
 const limitations=[...d.notes,...(analysis.limitations||[]),'O relatório é uma síntese preliminar de homologação. A viabilidade de projetos depende da validação técnica institucional.'];
 for(const msg of [...new Set(limitations)]){
  const rows=wrap(msg,fonts.reg,8.7,499),needed=rows.length*12+10;
  if(y-needed<100){view=makePage(pdf,fonts,'Notas metodológicas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,'- '+msg,44,y,{size:8.7,font:fonts.reg,maxWidth:499,lineHeight:12,color:COLORS.gray})-10;
 }
}
async function generate(data){
 const pdf=await PDFDocument.create();
 const fonts={reg:await pdf.embedFont(StandardFonts.Helvetica),bold:await pdf.embedFont(StandardFonts.HelveticaBold)};
 const analysis=await analyze(data);
 pdf.setTitle('Diagnóstico Territorial - '+data.municipio.nome+' / '+data.municipio.uf);
 pdf.setAuthor('Rede Cidadã - Inteligência Socioterritorial');
 pdf.setSubject('Diagnóstico em homologação, fontes públicas, indicadores e limitações');
 cover(pdf,fonts,data,analysis);
 executivePage(pdf,fonts,data);
 indicatorPages(pdf,fonts,data);
 analysisPages(pdf,fonts,data,analysis);
 sourcesPages(pdf,fonts,data,analysis);
 const pages=pdf.getPages();
 for(let i=0;i<pages.length;i++) if(i>0)footer(pages[i],i+1,pages.length,fonts);
 return pdf.save();
}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 const ibge=String(req.body?.ibge||'');
 if(!/^\d{7}$/.test(ibge))return res.status(400).json({error:'Código IBGE inválido'});
 try{
  const data=await getDiagnosis(ibge);
  const bytes=await generate(data);
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="Rede-Cidada-Diagnostico-'+ibge+'.pdf"');
  res.setHeader('Cache-Control','no-store');
  return res.status(200).send(Buffer.from(bytes));
 }catch(e){
  return res.status(502).json({error:'Não foi possível gerar um relatório verificável. Confirme a disponibilidade das fontes e tente novamente.'});
 }
};
module.exports.generate=generate;
