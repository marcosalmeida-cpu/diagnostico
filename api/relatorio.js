'use strict';

const {PDFDocument, StandardFonts, rgb} = require('pdf-lib');
const {getDiagnosis} = require('./diagnostico');
const {getMunicipalMap} = require('./cartografia-ibge');
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
 if(id.startsWith('orcamento_v5_'))return 'ORÇAMENTO PÚBLICO MUNICIPAL - SICONFI/DCA';
 if(id.startsWith('cadunico_'))return 'CADASTRO ÚNICO - INDICADORES MUNICIPAIS';
 if(id.startsWith('suas_bpc_')||id.startsWith('suas_bolsa_'))return 'BENEFÍCIOS SOCIAIS - CGU';
 if(id.startsWith('atlas_'))return 'ATLAS BRASIL/PNUD - INDICADORES HISTÓRICOS';
 if(id.startsWith('mse_sinase_'))return 'MEDIDAS SOCIOEDUCATIVAS - SINASE';
 if(id.startsWith('contexto_uf_'))return 'CONTEXTO MACROECONÔMICO ESTADUAL - PNAD';
 if(id.startsWith('economia_setor_')||id==='economia_emprego_assalariado_total')return 'ESTRUTURA SETORIAL DO EMPREGO ASSALARIADO - CEMPRE';
 if(id.startsWith('economia_pib_'))return 'ECONOMIA MUNICIPAL - PIB NOMINAL';
 if(id.startsWith('caged_'))return 'TRABALHO FORMAL - NOVO CAGED 09/2026 (PE)';
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
 if(v.value===null||v.value===undefined)return 'Indisponível';
 if(v.unit==='R$')return currency.format(v.value);
 if(v.unit==='índice (0–1)')return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(v.value)+' (0 a 1)';
 const suffix=v.unit==='pessoas'?' pessoas':v.unit==='%'?'%':v.unit==='km²'?' km²':v.unit==='hab./km²'?' hab./km²':v.unit==='postos potenciais'?' postos potenciais':v.unit==='unidades'?' unidades':v.unit==='famílias'?' famílias':v.unit==='domicílios'?' domicílios':'';
 return number.format(v.value)+suffix;
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
 const left='Diagnóstico Territorial Integrado  |  Rede Cidadã  |  Fontes oficiais';
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
// Página 2 do relatório: malha IBGE real, sem atribuir contornos fictícios a regionais.
function mapPage(pdf,fonts,d,cartography){
 const view=makePage(pdf,fonts,'Mapa e organização territorial',
   d.municipio.nome+' / '+d.municipio.uf+' · limites e unidades administrativas oficiais IBGE');
 const p=view.page;
 const frame={x:48,y:284,w:499,h:384};
 p.drawRectangle({x:frame.x,y:frame.y,width:frame.w,height:frame.h,color:COLORS.neutral,borderWidth:1,borderColor:COLORS.line});
 const g=cartography?.geometry;
 if(g?.polygons?.length&&g.bounds){
  const {minLon,maxLon,minLat,maxLat}=g.bounds;
  const cos=Math.max(.2,Math.cos((minLat+maxLat)/2*Math.PI/180));
  const geoW=(maxLon-minLon)*cos,geoH=maxLat-minLat;
  const scale=Math.min((frame.w-38)/geoW,(frame.h-38)/geoH);
  const offsetX=frame.x+(frame.w-geoW*scale)/2;
  const offsetY=frame.y+(frame.h-geoH*scale)/2;
  function xy(point){return {x:offsetX+(point[0]-minLon)*cos*scale,y:offsetY+(point[1]-minLat)*scale}}
  let drawn=0;
  for(const polygon of g.polygons)for(const ring of polygon){
   // Amostragem preservando primeira/última coordenada. Limite para PDF leve.
   const step=Math.max(1,Math.ceil(ring.length/750));
   const points=ring.filter((_,i)=>i%step===0||i===ring.length-1);
   for(let i=1;i<points.length;i++){
    const a=xy(points[i-1]),b=xy(points[i]);
    p.drawLine({start:a,end:b,color:COLORS.blue,thickness:1.15});
    drawn++;
    if(drawn>4200)break;
   }
   if(drawn>4200)break;
  }
  const center={x:offsetX+geoW*scale/2,y:offsetY+geoH*scale/2};
  p.drawCircle({x:center.x,y:center.y,size:3.8,color:COLORS.green,borderColor:COLORS.navy,borderWidth:.8});
  const mapTitle=d.municipio.nome+' / '+d.municipio.uf;
  text(p,mapTitle,frame.x+14,frame.y+frame.h-18,{size:11,font:fonts.bold,maxWidth:355,color:COLORS.navy,lineHeight:13});
  p.drawText('N',{x:frame.x+frame.w-26,y:frame.y+frame.h-26,size:11,font:fonts.bold,color:COLORS.blue});
  p.drawLine({start:{x:frame.x+frame.w-22,y:frame.y+frame.h-44},end:{x:frame.x+frame.w-22,y:frame.y+frame.h-30},thickness:1.7,color:COLORS.blue});
  p.drawText('Limite municipal (IBGE)',{x:frame.x+12,y:frame.y+13,size:8,font:fonts.reg,color:COLORS.gray});
 }else{
  text(p,'Malha municipal não disponível na consulta ao IBGE. O relatório não substitui o contorno por imagem ilustrativa.',
   frame.x+24,frame.y+frame.h/2,{size:11,font:fonts.reg,color:COLORS.gray,maxWidth:frame.w-48,lineHeight:16});
 }
 let y=268;
 p.drawText('DISTRITOS OFICIAIS DO IBGE',{x:48,y,size:9.3,font:fonts.bold,color:COLORS.navy});y-=17;
 function listCompact(items,limit){
  if(!items.length){y=text(p,'Não retornados na consulta ao IBGE.',48,y,{size:8.1,font:fonts.reg,maxWidth:490,lineHeight:11})-7;return}
  const shown=items.slice(0,limit),height=Math.ceil(shown.length/2)*12;
  shown.forEach((v,i)=>{
   const x=i%2?302:48,yy=y-Math.floor(i/2)*12;
   const label=clean(v.name);
   const maxWidth=230;
   const parts=wrap(label,fonts.reg,8,maxWidth);
   p.drawText(parts[0]||'',{x,y:yy,size:8,font:fonts.reg,color:COLORS.gray});
  });
  y-=height+4;
  if(items.length>limit){y=text(p,'Mais '+(items.length-limit)+' unidades no cadastro territorial do IBGE.',48,y,{size:7.6,font:fonts.reg,maxWidth:480,lineHeight:10})-7;}
 }
 listCompact(cartography?.districts||[],10);
 y-=5;
 if(y>113){
  p.drawText('SUBDISTRITOS CADASTRADOS',{x:48,y,size:9.3,font:fonts.bold,color:COLORS.navy});y-=16;
  listCompact(cartography?.subdistricts||[],Math.max(0,Math.min(14,2*Math.floor((y-96)/12))));
 }
 p.drawText('Contornos internos não disponibilizados pela API consultada; somente o limite municipal é desenhado.',{
  x:48,y:76,size:7.2,font:fonts.reg,color:COLORS.gray
 });
 p.drawText('Fontes: IBGE Malhas v3 e Localidades v1. Sem escalas administrativas inferidas.',{
  x:48,y:63,size:7.2,font:fonts.reg,color:COLORS.gray
 });
}
function indicatorPages(pdf,fonts,d){
 // Paginação por altura real do conteúdo. Label, procedência e valor ocupam linhas
 // distintas; nenhuma linha é colocada sobre elementos vizinhos.
 let view=makePage(pdf,fonts,'Indicadores e métricas municipais',d.municipio.nome+' / '+d.municipio.uf+' · fontes e períodos individuais');
 let p=view.page,y=view.y,current='';
 for(const item of d.indicators){
  const group=sectionOf(item.id),value=formatIndicator(item);
  const source=d.sources[item.source]?.name||'Fonte não cadastrada';
  const sourceLabel=source+'  |  '+(item.period||'competência indisponível');
  const labelRows=wrap(item.label,fonts.bold,9.5,476);
  const sourceRows=wrap(sourceLabel,fonts.reg,7.5,476);
  const valueRows=wrap(value,fonts.bold,12.3,476);
  const noteRows=item.note?wrap(item.note,fonts.reg,7.6,476):[];
  const height=14+labelRows.length*12+sourceRows.length*10+6+valueRows.length*15+
    (noteRows.length?4+noteRows.length*10:0)+7;
  const groupRows=group===current?[]:wrap(group,fonts.bold,9.4,473);
  const headerHeight=groupRows.length?groupRows.length*12+14:0;
  const required=height+headerHeight+8;
  if(y-required<77){
   view=makePage(pdf,fonts,'Indicadores e métricas (continuação)',d.municipio.nome+' / '+d.municipio.uf);
   p=view.page;y=view.y;current='';
  }
  if(current!==group){
   const rows=wrap(group,fonts.bold,9.4,473);
   p.drawRectangle({x:42,y:y-14,width:4,height:16,color:COLORS.green});
   y=text(p,group,54,y,{size:9.4,font:fonts.bold,maxWidth:477,lineHeight:12,color:COLORS.blue})-14;
   current=group;
  }
  const background=item.status==='verificado'?COLORS.pale:COLORS.neutral;
  p.drawRectangle({x:42,y:y-height,width:511,height,color:background});
  let cursor=text(p,item.label,54,y-14,{size:9.5,font:fonts.bold,maxWidth:476,lineHeight:12,color:COLORS.navy});
  cursor=text(p,sourceLabel,54,cursor-1,{size:7.5,font:fonts.reg,maxWidth:476,lineHeight:10,color:COLORS.gray});
  cursor=text(p,value,54,cursor-6,{size:12.3,font:fonts.bold,maxWidth:476,lineHeight:15,color:item.value===null?COLORS.gray:COLORS.blue});
  if(noteRows.length)text(p,item.note,54,cursor-4,{size:7.6,font:fonts.reg,maxWidth:476,lineHeight:10,color:COLORS.gray});
  y-=height+8;
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
  if(y-(rows.length*14+wrap(recommendation.title+' · '+recommendation.priority,fonts.bold,10,499).length*13+24)<78){view=makePage(pdf,fonts,'Propostas de aprofundamento (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,clean(recommendation.title)+' · '+clean(recommendation.priority),44,y,{size:10,font:fonts.bold,color:COLORS.blue,maxWidth:499,lineHeight:13})-6;
  y=text(p,recommendation.reason,44,y,{size:9.5,font:fonts.reg,maxWidth:484,lineHeight:14,color:COLORS.gray})-10;
 }
}
function sourcesPages(pdf,fonts,d,analysis){
 let view=makePage(pdf,fonts,'Fontes, rastreabilidade e limitações','Bases públicas identificadas e status de cobertura');
 let {page:p}=view,y=view.y;
 for(const [key,s] of Object.entries(d.sources)){
  const lines=wrap(s.url,fonts.reg,7.4,506),nameLines=wrap(s.name,fonts.bold,9.6,506),need=nameLines.length*12+lines.length*11+19;
  if(y-need<100){view=makePage(pdf,fonts,'Fontes públicas (continuação)',d.municipio.nome);p=view.page;y=view.y;}
  y=text(p,s.name,43,y,{size:9.6,font:fonts.bold,color:COLORS.blue,maxWidth:506,lineHeight:12})-4;
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
 let cartography=null;
 try{cartography=await getMunicipalMap(data.municipio.codigoIBGE);}catch(_){/* gera PDF com lacuna cartográfica explícita */}
 mapPage(pdf,fonts,data,cartography);
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
