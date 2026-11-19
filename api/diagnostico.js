'use strict';

const IBGE = 'https://servicodados.ibge.gov.br';
const SICONFI = 'https://apidatalake.tesouro.gov.br';
const {getCras}=require('./suas');
const {getBudget,budgetLines}=require('./orcamento-publico');
const {getFiscalBalances}=require('../lib/fiscal-rgf-rreo');
const {getFiscalPulse}=require('../lib/atividade-fiscal');
const {getIps2026}=require('../lib/ips-brasil');
const {getFederalProposals}=require('../lib/propostas-transferegov');
const {getCadunico}=require('../lib/cadunico-mds');
const {getMdsBenefits}=require('../lib/beneficios-mds');
const {byMunicipio:getPopRuaHistorico}=require('../lib/poprua-ufmg');
const {getEducationFrequency}=require('../lib/educacao-ibge');
const {getSchoolCensus,percentVariation}=require('../lib/censo-escolar-ibge');
const {buildAudit}=require('../lib/auditoria');
const {getBenefits}=require('./beneficios-cgu');
const {getEconomia,getIvcad,getPibPerCapita}=require('./dados-dinamicos');
const {getByMunicipio:readCagedPE,SOURCE:CAGED_PE_SOURCE}=require('../data/caged2026pe');
function readPotential2026(code){
  try{return require('../data/mte2026').getByMunicipio(code);}
  catch(_){return null;}
}
function readIdeb2025(code){
  try { return require('../data/ideb2025').getByMunicipio(code); }
  catch (_) { return {inicial:null,final:null}; }
}

const SOURCES = {
  sisdepen_unidades: {name:'SENAPPEN · SISDEPEN 19º ciclo, dados por estabelecimento',url:'https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados/2025'},
  cnj_geopresidios: {name:'CNJ · Geopresídios, inspeções de estabelecimentos',url:'https://geopresidios.cnj.jus.br/'},
  cnj_cniups: {name:'CNJ · CNIUPS, inspeções de programas socioeducativos',url:'https://www.cnj.jus.br/sistema-carcerario/cadastro-nacional-de-inspecao-de-unidades-e-programas-socioeducativos-cniups/'},
  senappen_egressos: {name:'SENAPPEN · Política Nacional de Atenção à Pessoa Egressa',url:'https://www.gov.br/senappen/pt-br/acesso-a-informacao/politicas-acoes-e-programas/politicas-penais/atencao-a-pessoa-egressa'},
  poprua_ufmg_historico: {name:'Observatório Pop Rua UFMG · população cadastrada em situação de rua, série nacional 2012–2021',url:'https://obpoprua.direito.ufmg.br/repositorio_dados_tabelas.html'},
  mds_beneficios_misocial: {name:'MDS/MI Social · Bolsa Família e BPC por município (agregado mensal)',url:'https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/'},
  cecad_public: {name:'MDS · CECAD 2.0, CadÚnico e população em situação de rua',url:'https://cecad.cidadania.gov.br/tab_cad.php'},
  rma_meio_aberto: {name:'MDS · Registro Mensal de Atendimentos dos CREAS, LA e PSC',url:'https://aplicacoes.mds.gov.br/snas/inteligencia-suas/RMA/Paineis'},
  ibge_pns_lgbt: {name:'IBGE · PNS 2019, orientação sexual autodeclarada (sem total municipal)',url:'https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/33785-em-pesquisa-inedita-do-ibge-2-9-milhoes-de-adultos-se-declararam-homossexuais-ou-bissexuais-em-2019'},
  ibge_censo_rua: {name:'IBGE · Censo Nacional da População em Situação de Rua (projeto, não resultado)',url:'https://www.ibge.gov.br/censo-nacional-pop-rua'},
  ibge_frequencia_2022:{name:'IBGE · Censo Demográfico 2022, frequência escolar (SIDRA 10056)',url:'https://sidra.ibge.gov.br/tabela/10056'},
  inep_censo_2025:{name:'INEP · Censo Escolar 2025, microdados e sinopses',url:'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/sinopses-estatisticas/educacao-basica'},
  transferegov_discricionarias: {name:'Transferegov · propostas discricionárias e legais (Atos Preparatórios)',url:'https://api-publica.transferegov.gestao.gov.br/discricionarias/docs'},
  transferegov_parcerias: {name:'Transferegov · propostas no módulo Gestão de Parcerias',url:'https://api-publica.transferegov.gestao.gov.br/parcerias/docs'},
  ips_brasil_2026: {name:'IPS Brasil 2026 · espelho independente (não é API oficial)',url:'https://raw.githubusercontent.com/ernandes-sobreira/IPS-BRASIL/main/conhece_brasil_v1.json'},
  ips_brasil_oficial: {name:'IPS Brasil · portal oficial de conferência',url:'https://ipsbrasil.org.br/explore/data'},
  ibge: { name: 'IBGE · Censo e estimativas', url: 'https://servicodados.ibge.gov.br/api/docs/' },
  tesouro: { name: 'Tesouro Nacional · SICONFI', url: 'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos' },
  mds: { name: 'MDS · Cadastro Único e IVCAD', url: 'https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/' },
  ivcad_pe: { name: 'MDS/Condepe-Fidem · IVCAD PE via API pública', url: 'https://www.cf.pe.gov.br/observatorio/fontes/seplag_ivcad' },
  ivcad_nacional: { name: 'MDS · IVCAD nacional (painel oficial; API não validada)',url:'https://paineis.mds.gov.br/public/extensions/observatorio-do-cadastro-unico/index.html' },
  ibge_pib_pc: {name:'IBGE · Pesquisa PIB per capita municipal (indicador 47001)',url:'https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/47001'},
  ibge_pib: { name:'IBGE/SIDRA · PIB municipal (5938)',url:'https://sidra.ibge.gov.br/tabela/5938' },
  ibge_cempre: {name:'IBGE/SIDRA · CEMPRE pessoal assalariado por atividade (9528)',url:'https://sidra.ibge.gov.br/tabela/9528'},
  ibge_pnad_uf: {name:'IBGE/SIDRA · PNAD Contínua desocupação por UF/idade (4094)',url:'https://sidra.ibge.gov.br/tabela/4094'},
  mei_oficial: {name:'Receita Federal · Relatórios oficiais de MEI (consulta pública, sem API validada)',url:'https://www22.receita.fazenda.gov.br/inscricaomei/private/pages/relatorios/opcoesRelatorio.jsf'},
  caged_pe: { name: CAGED_PE_SOURCE.name, url: CAGED_PE_SOURCE.sourceUrl },
  ibge_agua: { name: 'IBGE/SIDRA · Censo 2022, domicílios e água (6803)', url: 'https://sidra.ibge.gov.br/tabela/6803' },
  ibge_esgoto: { name: 'IBGE/SIDRA · Censo 2022, esgotamento (6805)', url: 'https://sidra.ibge.gov.br/tabela/6805' },
  inep: { name: 'INEP · IDEB', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados' },
  mte: { name: 'MTE/SIT · Potencial de aprendizagem · 07/2026', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/insercao-de-aprendiz-1/potencial_ead_julho-1.xlsx' },
  mds_cadunico: {name:'MDS/SAGICAD · MI Social, agregados municipais do Cadastro Único',url:'https://aplicacoes.mds.gov.br/sagi/servicos/misocial'},
  cgu_beneficios: {name:'CGU · Portal da Transparência: PBF/BPC por município',url:'https://api.portaldatransparencia.gov.br/'},
  tesouro_dca: {name:'STN/SICONFI · DCA, funções e subfunções',url:'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos'},
  atlas_pnud: {name:'Atlas Brasil/PNUD · IDHM e indicadores históricos',url:'https://www.atlasbrasil.org.br/'},
  sinase_mdhc: {name:'MDHC · Levantamentos do SINASE',url:'https://www.gov.br/mdh/pt-br/navegue-por-temas/crianca-e-adolescente/levantamentos-nacionais-do-sinase/levantamentos-nacionais'},
  tesouro_rgf: {name:'STN/SICONFI · RGF (dívida e disponibilidade de caixa)',url:'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos'},
  tesouro_rreo: {name:'STN/SICONFI · RREO (restos a pagar)',url:'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos'},
  tesouro_msc: {name:'STN/SICONFI · Matriz de Saldos Contábeis',url:'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos'},
  transferegov: {name:'Transferegov · API pública de transferências e emendas',url:'https://api-publica.transferegov.gestao.gov.br/'},
  cgu_emendas: {name:'CGU · Portal da Transparência, emendas parlamentares',url:'https://api.portaldatransparencia.gov.br/'},
  s2id: {name:'MIDR · Sistema Integrado de Informações sobre Desastres',url:'https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil/sistema-integrado-de-informacoes-sobre-desastres'},
  cemaden: {name:'Cemaden · Monitoramento e alertas de risco',url:'https://www.gov.br/cemaden/pt-br'},
  sgb: {name:'SGB · Cartografia de áreas de risco geológico',url:'https://www.sgb.gov.br/'},
  mdhc: {name:'MDHC · Dados abertos e direitos humanos',url:'https://www.gov.br/mdh/pt-br/acesso-a-informacao/dados-abertos'},
  suas: { name: 'MDS · Censo SUAS', url: 'https://www.gov.br/mds/pt-br/acoes-e-programas/suas/gestao-do-suas/vigilancia-socioassistencial-1/censo-suas' }
};

async function json(url, ms = 13000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('Fonte respondeu HTTP ' + response.status);
  const kind = response.headers.get('content-type') || '';
  if (!kind.includes('json')) throw new Error('Formato de resposta não é JSON');
  return response.json();
}
function numeric(value) {
  if (value === null || value === undefined || String(value).trim() === '' || String(value).trim() === '...') return null;
  const raw = String(value).trim();
  const n = Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw);
  return Number.isFinite(n) ? n : null;
}
function seriesValues(data, code) {
  const selected = {};
  for (const item of (Array.isArray(data) ? data : [])) {
    const id = String(item.id ?? item.variavelId ?? '');
    for (const group of (item.resultados || [])) {
      for (const serie of (group.series || [])) {
        if (String(serie.localidade?.id || '') !== code) continue;
        for (const [year, raw] of Object.entries(serie.serie || {})) {
          const value = numeric(raw);
          if (value !== null && /^\d{4}$/.test(year)) selected[id + ':' + year] = value;
        }
      }
    }
  }
  return selected;
}

function classifiedValues(data, code, classId, validIds) {
  const out = new Map();
  if (!Array.isArray(data)) return out;
  for (const item of data) for (const group of item.resultados || []) {
    const classification = (group.classificacoes || []).find(x => String(x.id) === String(classId));
    if (!classification) continue;
    const keys = Object.keys(classification.categoria || {});
    if (keys.length !== 1 || !validIds.includes(String(keys[0]))) continue;
    const key = String(keys[0]);
    for (const serie of group.series || []) {
      if (String(serie.localidade?.id || '') !== code) continue;
      const v = numeric(serie.serie?.['2022']);
      if (v === null || v < 0 || out.has(key)) continue;
      out.set(key, v);
    }
  }
  return out;
}
const within = (value, min, max) => Number.isFinite(value) && value >= min && value <= max ? value : null;

const OLDER_AGE_BANDS=['93095','93096','93097','93098','49108','49109','60040','60041','6653'];
const YOUTH_AGE_BANDS=['93086','93087','93088'];
function extractAgeSex(data,code,population,knownYouth=null){
 if(!Array.isArray(data)||!Number.isSafeInteger(population)||population<=0)return null;
 const records=new Map();
 for(const item of data)for(const row of item.resultados||[]){
  const classes=row.classificacoes||[];
  const sex=classes.find(x=>String(x.id)==='2');
  const age=classes.find(x=>String(x.id)==='287');
  const method=classes.find(x=>String(x.id)==='286');
  if(!sex||!age||!method)continue;
  const sexIds=Object.keys(sex.categoria||{}),ageIds=Object.keys(age.categoria||{}),methodIds=Object.keys(method.categoria||{});
  if(sexIds.length!==1||ageIds.length!==1||methodIds.length!==1||methodIds[0]!=='113635')continue;
  const key=sexIds[0]+':'+ageIds[0];
  if(!['4','5'].includes(sexIds[0]))continue;
  if(!['100362',...OLDER_AGE_BANDS,...YOUTH_AGE_BANDS].includes(ageIds[0]))continue;
  for(const serie of row.series||[]){
   if(String(serie.localidade?.id)!==code)continue;
   const n=numeric(serie.serie?.['2022']);
   if(!Number.isSafeInteger(n)||n<0||records.has(key))return null;
   records.set(key,n);
  }
 }
 const required=['100362',...OLDER_AGE_BANDS,...YOUTH_AGE_BANDS];
 if(required.some(a=>!records.has('4:'+a)||!records.has('5:'+a)))return null;
 const male=records.get('4:100362'),female=records.get('5:100362');
 if(male+female!==population)return null;
 const count=(sex,ages)=>ages.reduce((sum,age)=>sum+records.get(sex+':'+age),0);
 const olderMale=count('4',OLDER_AGE_BANDS),olderFemale=count('5',OLDER_AGE_BANDS);
 const youthMale=count('4',YOUTH_AGE_BANDS),youthFemale=count('5',YOUTH_AGE_BANDS);
 if(olderMale>male||olderFemale>female||youthMale>male||youthFemale>female)return null;
 if(knownYouth!==null&&knownYouth!==youthMale+youthFemale)return null;
 return {male,female,olderMale,olderFemale,older:olderMale+olderFemale,youthMale,youthFemale};
}

function indicator(id, label, value, unit, period, source, note = '') {
  return { id, label, value: Number.isFinite(value) ? value : null, unit, period, source, note, status: Number.isFinite(value) ? 'verificado' : 'indisponivel' };
}
function asFinite(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }

const AGUA_CATS=['72129','72144','72145','72153'];
const ESGOTO_CATS=['46292','46290','72110','72111','72112','72113','92858','72114','72115','92861'];
function extractSaneamento(aguaData,esgotoData,code){
 const w=classifiedValues(aguaData,code,1821,AGUA_CATS);
 const s=classifiedValues(esgotoData,code,11558,ESGOTO_CATS);
 const ints=(map,ids)=>ids.every(id=>Number.isSafeInteger(map.get(id))&&map.get(id)>=0);
 let water=null,sewer=null;
 if(w.size===AGUA_CATS.length&&ints(w,AGUA_CATS)){
  const t=w.get('72129');
  if(t>0&&t===w.get('72144')+w.get('72145')+w.get('72153'))
   water={total:t,redePrincipal:w.get('72144'),comLigacao:w.get('72144')+w.get('72145'),semLigacao:w.get('72153')};
 }
 if(s.size===ESGOTO_CATS.length&&ints(s,ESGOTO_CATS)){
  const t=s.get('46292'),connected=s.get('46290');
  const sum=connected+s.get('72112')+s.get('72113')+s.get('92858')+s.get('72114')+s.get('72115')+s.get('92861');
  if(t>0&&t===sum&&connected===s.get('72110')+s.get('72111'))
   sewer={total:t,redeOuFossaLigada:connected,redePluvial:s.get('72110'),fossaRudimentar:s.get('72113')};
 }
 if(water&&sewer&&water.total!==sewer.total)return {water:null,sewer:null,total:null};
 const total=water?.total??sewer?.total??null;
 return {water,sewer,total};
}

async function getDiagnosis(code) {
  if (!/^\d{7}$/.test(String(code || ''))) throw Object.assign(new Error('Código IBGE inválido'), { status: 400 });
  const codigo = String(code);
  const m = await json(IBGE + '/api/v1/localidades/municipios/' + codigo, 12000);
  if (String(m.id || '') !== codigo) throw Object.assign(new Error('Município não identificado no IBGE'), { status: 404 });
  const uf = m?.microrregiao?.mesorregiao?.UF?.sigla || m?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || 'UF';
  const municipio = { codigoIBGE: codigo, nome: m.nome, uf };
  const results = await Promise.allSettled([
    json(IBGE + '/api/v3/agregados/4714/periodos/2022/variaveis/93|6318|614?localidades=N6[' + codigo + ']'),
    json(IBGE + '/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[' + codigo + ']'),
    fetchBudget(codigo),
    json(IBGE + '/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[' + codigo + ']&classificacao=2[6794]|287[93086,93087,93088]|286[113635]'),
    json(IBGE + '/api/v3/agregados/9543/periodos/2022/variaveis/2513?localidades=N6[' + codigo + ']&classificacao=2[6794]|86[95251]|287[100362]'),
    json(IBGE + '/api/v3/agregados/10061/periodos/2022/variaveis/2667?localidades=N6[' + codigo + ']&classificacao=1568[9493,9494,9495,99713]|58[95253]|2[6794]|86[95251]'),
    getCras(municipio.nome,municipio.uf),
    json(IBGE + '/api/v3/agregados/9514/periodos/2022/variaveis/93?localidades=N6[' + codigo + ']&classificacao=2[4,5]|287[100362,93086,93087,93088,93095,93096,93097,93098,49108,49109,60040,60041,6653]|286[113635]'),
    json(IBGE + '/api/v3/agregados/6803/periodos/2022/variaveis/381?localidades=N6[' + codigo + ']&classificacao=1821[72129,72144,72145,72153]'),
    json(IBGE + '/api/v3/agregados/6805/periodos/2022/variaveis/381?localidades=N6[' + codigo + ']&classificacao=11558[46292,46290,72110,72111,72112,72113,92858,72114,72115,92861]'),
    getEconomia(codigo,uf),
    getIvcad(codigo,uf),
    getBudget(codigo),
    getBenefits(codigo),
    getPibPerCapita(codigo),
    getCadunico(codigo),
    getFiscalBalances(codigo,new Date().getUTCFullYear()-1),
    getFiscalPulse(codigo),
    getFederalProposals(codigo),
    getEducationFrequency(codigo),
    getSchoolCensus(codigo),
    getMdsBenefits(codigo)
  ]);
  const census = results[0].status === 'fulfilled' ? seriesValues(results[0].value, codigo) : {};
  const estimated = results[1].status === 'fulfilled' ? seriesValues(results[1].value, codigo) : {};
  const estimateYears = Object.keys(estimated).filter(k => k.startsWith('9324:')).map(k => Number(k.split(':')[1])).sort((a,b) => b-a);
  const latestYear = estimateYears[0] || null;
  const budget = results[2].status === 'fulfilled' ? results[2].value : null;
  const suasReport = results[6].status === 'fulfilled' ? results[6].value : {data:null,url:null};
  const cras=suasReport?.data || null;
  const age = classifiedValues(results[3].status === 'fulfilled' ? results[3].value : null, codigo, 287, ['93086','93087','93088']);
  const young = age.size === 3 ? [...age.values()].reduce((a,b)=>a+b,0) : null;
  const population = asFinite(census['93:2022']);
  const validYoung = Number.isFinite(young) && young >= 0 && Number.isFinite(population) && young <= population ? young : null;
  const ageSex=extractAgeSex(results[7].status==='fulfilled'?results[7].value:null,codigo,population,validYoung);
  const literacyRaw = results[4].status === 'fulfilled' ? seriesValues(results[4].value, codigo)['2513:2022'] : null;
  const literacy = within(literacyRaw, 0, 100);
  const education = classifiedValues(results[5].status === 'fulfilled' ? results[5].value : null, codigo, 1568, ['9493','9494','9495','99713']);
  const total18 = education.size === 4 ? [...education.values()].reduce((a,b)=>a+b,0) : null;
  const lowCount = Number.isFinite(total18) && total18 > 0 ? education.get('9493') + education.get('9494') : null;
  const lowPct = Number.isFinite(lowCount) && Number.isFinite(total18) && total18 > 0 ? within(100*lowCount/total18,0,100) : null;
  const higherPct = Number.isFinite(total18) && total18 > 0 ? within(100*education.get('99713')/total18,0,100) : null;
  const ideb=readIdeb2025(codigo);
  const learning=readPotential2026(codigo);
  const ivcad=results[11].status==='fulfilled'?results[11].value:null;
  const economic=results[10].status==='fulfilled'?results[10].value:{gdp:null,sectors:null,unemployment:null};
  const budgetDetail=results[12].status==='fulfilled'?results[12].value:null;
  const benefits=results[13].status==='fulfilled'?results[13].value:{configured:false,bolsa:null,bpc:null};
  const pibPerCapita=results[14].status==='fulfilled'?results[14].value:null;
  const cadunico=results[15].status==='fulfilled'?results[15].value:null;
  const balances=results[16].status==='fulfilled'?results[16].value:null;
  const fiscalPulse=results[17].status==='fulfilled'?results[17].value:null;
  const ips2026=getIps2026(codigo);
  const federalProposals=results[18].status==='fulfilled'?results[18].value:null;
  const schoolFrequency=results[19].status==='fulfilled'?results[19].value:null;
  const schoolCensus=results[20].status==='fulfilled'?results[20].value:null;
  const mdsBenefits=results[21].status==='fulfilled'?results[21].value:null;
  const popRuaHistorico=getPopRuaHistorico(codigo,2021);
  const caged = uf==='PE' ? readCagedPE(codigo) : null;
  const sanitation=extractSaneamento(
    results[8].status==='fulfilled'?results[8].value:null,
    results[9].status==='fulfilled'?results[9].value:null,codigo
  );
  const water=sanitation.water,sewer=sanitation.sewer;
  const per=(a,total)=>Number.isSafeInteger(a)&&Number.isSafeInteger(total)&&total>0?within(100*a/total,0,100):null;
  const data = [
    indicator('populacao_censo', 'População residente · Censo', asFinite(census['93:2022']), 'pessoas', '2022', 'ibge'),
    indicator('populacao_estimativa', 'População estimada', latestYear ? asFinite(estimated['9324:' + latestYear]) : null, 'pessoas', latestYear ? String(latestYear) : '—', 'ibge'),
    indicator('area', 'Área territorial', asFinite(census['6318:2022']), 'km²', '2022', 'ibge'),
    indicator('densidade', 'Densidade demográfica', asFinite(census['614:2022']), 'hab./km²', '2022', 'ibge'),
    indicator('populacao_mulheres','População de mulheres · sexo declarado no Censo',ageSex?.female??null,'pessoas','2022','ibge','Recorte do quesito sexo (Mulheres) do IBGE/Censo 2022; não identifica identidade de gênero ou orientação sexual.'),
    indicator('populacao_homens','População de homens · sexo declarado no Censo',ageSex?.male??null,'pessoas','2022','ibge','Recorte do quesito sexo (Homens) do IBGE/Censo 2022.'),
    indicator('mulheres_pct','Participação de mulheres na população',ageSex?within(100*ageSex.female/population,0,100):null,'%','2022','ibge','Denominador: população residente do Censo 2022.'),
    indicator('pessoas_idosas_60mais','Pessoas idosas · 60 anos ou mais',ageSex?.older??null,'pessoas','2022','ibge','Soma das faixas quinquenais de 60 anos ou mais no Censo 2022.'),
    indicator('pessoas_idosas_60mais_pct','Participação da população de 60 anos ou mais',ageSex?within(100*ageSex.older/population,0,100):null,'%','2022','ibge','Denominador: população residente censitária 2022.'),
    indicator('mulheres_idosas_60mais','Mulheres com 60 anos ou mais',ageSex?.olderFemale??null,'pessoas','2022','ibge'),
    indicator('homens_idosos_60mais','Homens com 60 anos ou mais',ageSex?.olderMale??null,'pessoas','2022','ibge'),
    indicator('mulheres_entre_idosos_pct','Participação de mulheres entre pessoas 60+',ageSex&&ageSex.older>0?within(100*ageSex.olderFemale/ageSex.older,0,100):null,'%','2022','ibge','Denominador: população residente de 60 anos ou mais no Censo 2022.'),
    indicator('jovens_mulheres_15_29','Mulheres de 15 a 29 anos',ageSex?.youthFemale??null,'pessoas','2022','ibge','Recorte etário por sexo do Censo 2022, sem inferência de vulnerabilidade.'),
    indicator('jovens_homens_15_29','Homens de 15 a 29 anos',ageSex?.youthMale??null,'pessoas','2022','ibge'),
    indicator('jovens_15_29', 'Pessoas de 15 a 29 anos · Censo', validYoung, 'pessoas', '2022', 'ibge', 'Soma das faixas 15–19, 20–24 e 25–29 anos no Censo 2022.'),
    indicator('jovens_15_29_pct', 'Participação dos jovens de 15 a 29 anos', validYoung !== null && population > 0 ? within(100*validYoung/population,0,100) : null, '%', '2022', 'ibge', 'Percentual sobre a população residente censitária, não sobre estimativa populacional.'),
    indicator('jovens_15_19', 'Adolescentes e jovens de 15 a 19 anos', age.size===3?age.get('93086'):null, 'pessoas','2022','ibge'),
    indicator('jovens_20_24', 'Jovens de 20 a 24 anos', age.size===3?age.get('93087'):null, 'pessoas','2022','ibge'),
    indicator('jovens_25_29', 'Jovens de 25 a 29 anos', age.size===3?age.get('93088'):null, 'pessoas','2022','ibge'),
    indicator('alfabetizacao_15mais', 'Taxa de alfabetização · 15 anos ou mais', literacy, '%', '2022','ibge', 'IBGE tabela 9543; não equivale à conclusão do ensino fundamental.'),
    indicator('sem_medio_completo_18mais', 'Pessoas de 18 anos ou mais sem ensino médio completo', lowCount, 'pessoas','2022','ibge', 'Soma dos níveis sem instrução/fundamental incompleto e fundamental completo/médio incompleto.'),
    indicator('sem_medio_completo_18mais_pct', 'Parcela de 18 anos ou mais sem ensino médio completo', lowPct, '%','2022','ibge', 'Denominador: total da população de 18 anos ou mais com níveis de instrução classificados na tabela 10061.'),
    indicator('superior_completo_18mais_pct','Parcela de 18 anos ou mais com superior completo',higherPct,'%','2022','ibge'),
    indicator('ideb_iniciais_publica_2025','IDEB 2025 · anos iniciais · rede pública',ideb.inicial,'nota (0–10)','2025','inep','Dados da rede pública municipalmente agregados pelo INEP; escala de 0 a 10.'),
    indicator('ideb_finais_publica_2025','IDEB 2025 · anos finais · rede pública',ideb.final,'nota (0–10)','2025','inep','Dados da rede pública municipalmente agregados pelo INEP; escala de 0 a 10.'),
    indicator('mte_potencial_cota','Potencial de cota de aprendizagem profissional',learning?.total??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_comercio','Potencial da cota · comércio',learning?.setores?.['Comércio']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_servicos','Potencial da cota · serviços',learning?.setores?.['Serviços']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_industria','Potencial da cota · indústria',learning?.setores?.['Indústria']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_agricultura','Potencial da cota · agricultura',learning?.setores?.['Agricultura']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_transportes','Potencial da cota · transportes',learning?.setores?.['Transportes']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('mte_cota_outros','Potencial da cota · outros setores',learning?.setores?.['Outros']??null,'postos potenciais','07/2026','mte','Potencial normativo por município, não representa oportunidades abertas nem vagas de contratação.'),
    indicator('suas_cras_total_2024','CRAS identificados · Censo SUAS',cras?.total??null,'unidades','2024','suas_municipal','Contagem dos CRAS por capacidade de referenciamento no Censo SUAS 2024; não é quantidade de famílias atendidas.'),
    indicator('suas_cras_2500_2024','CRAS com capacidade de até 2.500 famílias',cras?.ate2500??null,'unidades','2024','suas_municipal'),
    indicator('suas_cras_3500_2024','CRAS com capacidade de até 3.500 famílias',cras?.ate3500??null,'unidades','2024','suas_municipal'),
    indicator('suas_cras_5000_2024','CRAS com capacidade de até 5.000 famílias',cras?.ate5000??null,'unidades','2024','suas_municipal'),
    indicator('saneamento_domicilios','Domicílios particulares permanentes observados',sanitation.total,'domicílios','2022','ibge_esgoto','Mesmo universo censitário das tabelas IBGE/SIDRA 6803 e 6805, quando disponível.'),
    indicator('saneamento_agua_rede_principal_pct','Domicílios com rede geral como fonte principal de água',water?per(water.redePrincipal,water.total):null,'%','2022','ibge_agua','Domicílios com ligação à rede geral e que a utilizam como forma principal. Não mede potabilidade.'),
    indicator('saneamento_agua_com_ligacao_pct','Domicílios com ligação à rede geral de água',water?per(water.comLigacao,water.total):null,'%','2022','ibge_agua','Inclui domicílios que usam outra fonte principalmente, mas possuem ligação.'),
    indicator('saneamento_agua_sem_ligacao_pct','Domicílios sem ligação à rede geral de água',water?per(water.semLigacao,water.total):null,'%','2022','ibge_agua'),
    indicator('saneamento_esgoto_rede_fossa_pct','Esgotamento por rede geral/pluvial ou fossa ligada à rede',sewer?per(sewer.redeOuFossaLigada,sewer.total):null,'%','2022','ibge_esgoto','Categoria censitária conjunta. Não demonstra tratamento dos efluentes nem ausência de risco climático.'),
    indicator('saneamento_esgoto_rede_pluvial_pct','Esgotamento por rede geral ou pluvial',sewer?per(sewer.redePluvial,sewer.total):null,'%','2022','ibge_esgoto','Inclui rede pluvial; não equivale exclusivamente a rede coletora de esgoto tratada.'),
    indicator('saneamento_esgoto_fossa_rudimentar_pct','Domicílios com fossa rudimentar ou buraco',sewer?per(sewer.fossaRudimentar,sewer.total):null,'%','2022','ibge_esgoto','Proporção no universo de domicílios particulares permanentes ocupados do Censo 2022.'),
    indicator('orcamento_assistencia', 'Despesas liquidadas · Assistência Social', budget?.assist ?? null, 'R$', budget?.period ?? '—', 'tesouro', 'Despesa por função. Não representa orçamento disponível para novos projetos.'),
    indicator('orcamento_educacao', 'Despesas liquidadas · Educação', budget?.education ?? null, 'R$', budget?.period ?? '—', 'tesouro'),
    indicator('orcamento_saude', 'Despesas liquidadas · Saúde', budget?.health ?? null, 'R$', budget?.period ?? '—', 'tesouro')
  ];
  // CadÚnico: API MI Social usa código IBGE de 6 dígitos. O endpoint pode
  // estar em manutenção: sem dados agregados auditados, valores permanecem null.
  // Denominador: Censo 2022 (não é taxa de cobertura no mesmo período).
  const cadPeriod=cadunico?.period||'—';
  const ratioPeople=cadunico?.people!==null&&cadunico?.people!==undefined&&population>0?within(100*cadunico.people/population,0,100):null;
  const ratioFamilies=cadunico?.families!==null&&cadunico?.families!==undefined&&population>0?100*cadunico.families/population:null;
  const cadItems=[
    ['cadunico_familias','Famílias inscritas no CadÚnico','famílias',cadunico?.families],
    ['cadunico_familias_por100','Famílias inscritas / 100 residentes do Censo 2022','famílias/100 hab.',ratioFamilies],
    ['cadunico_pessoas','Pessoas inscritas no CadÚnico','pessoas',cadunico?.people],
    ['cadunico_pessoas_pct','Pessoas inscritas / residentes do Censo 2022','%',ratioPeople],
    ['cadunico_baixa_renda','Famílias com renda per capita até 1/2 salário mínimo','famílias',cadunico?.lowerIncome],
    ['cadunico_pobreza','Famílias na faixa de pobreza, excluída a extrema pobreza','famílias',cadunico?.poverty],
    ['cadunico_extrema_pobreza','Famílias em extrema pobreza · CadÚnico','famílias',cadunico?.extremePovertyFamilies],
    ['cadunico_pobreza_total','Famílias em pobreza ou extrema pobreza · CadÚnico','famílias',cadunico?.povertyAndExtremeFamilies],
    ['cadunico_extrema_pobreza_pessoas','Pessoas em extrema pobreza · CadÚnico','pessoas',cadunico?.extremePovertyPeople],
    ['cadunico_pop_rua','Famílias em situação de rua','famílias',null],
    ['cadunico_atualizadas','Famílias com cadastro atualizado','famílias',cadunico?.updated],
    ['cadunico_atualizacao_pct','Taxa de atualização cadastral publicada pelo MDS','%',cadunico?.updateRate]
  ];
  for(const [id,label,unit,value] of cadItems)
    data.push(indicator(id,label,value??null,unit,id==='cadunico_pop_rua'?'—':cadPeriod,
     id==='cadunico_pop_rua'?'cecad_public':'mds_cadunico',
     id==='cadunico_pop_rua'?
     'A consulta CECAD municipal de famílias em situação de rua ainda não retorna série estruturada validada automaticamente; famílias cadastradas não representam toda a população em situação de rua. A ausência não é zero.':
     id==='cadunico_familias_por100'||id==='cadunico_pessoas_pct'?
     'Numerador: CadÚnico '+cadPeriod+'; denominador: Censo 2022. Anos diferentes, proporção indicativa.':
     'Agregado municipal MDS/MI Social do Cadastro Único. Faixas pobreza, extrema pobreza e total combinado são distintas; não confundir CadÚnico com toda a população de baixa renda. '+(cadunico?'Competência '+cadPeriod+'.':'A API não retornou dados municipais válidos nesta consulta; ausência não é zero.')));
  data.push(indicator('pop_rua_cadunico_2021','População em situação de rua cadastrada · histórico 2021 (UFMG)',
   popRuaHistorico?.value??null,'pessoas','2021','poprua_ufmg_historico',
   'Série nacional 2012–2021, Observatório Pop Rua/Polos UFMG, agregada do CadÚnico. O valor refere-se somente a pessoas cadastradas, não a um censo nem à população total nas ruas. Municípios sem observação ficam indisponíveis, nunca zero. Dados de 2021 NÃO indicam situação atual.'));
  const pbfMds=mdsBenefits?.bolsa??null,bpcMds=mdsBenefits?.bpc??null;
  data.push(indicator('suas_pbf_familias_mds','Bolsa Família · famílias beneficiárias (MDS)',
   pbfMds?.beneficiaries??null,'famílias',pbfMds?.period??'—','mds_beneficios_misocial',
   'Agregado mensal de famílias beneficiárias do Bolsa Família. Fonte MDS/MI Social, município de cadastro. Consulta retorna indisponível quando o serviço estiver em manutenção.'));
  data.push(indicator('suas_bpc_mds_pagador','BPC · benefícios por município pagador (MDS)',
   bpcMds?.beneficiaries??null,'benefícios',bpcMds?.period??'—','mds_beneficios_misocial',
   'BPC por município PAGADOR, não equivale necessariamente aos residentes do município. Não somar cumulativamente os meses; dados ausentes não são zero.'));
  data.push(indicator('suas_bpc_mds_pcd','BPC · benefícios para pessoas com deficiência (município pagador)',
   bpcMds?.disability??null,'benefícios',bpcMds?.period??'—','mds_beneficios_misocial',
   'Parcela de BPC para pessoas com deficiência por município pagador. Não é total de pessoas com deficiência no município.'));
  data.push(indicator('suas_bpc_mds_idoso','BPC · benefícios para pessoas idosas (município pagador)',
   bpcMds?.older??null,'benefícios',bpcMds?.period??'—','mds_beneficios_misocial',
   'Parcela de BPC para idosos por município pagador. Não é total da população idosa.'));
  for(const [id,label,entry,field,unit] of [
    ['suas_bolsa_familia_beneficiarios','Bolsa Família · quantitativo publicado','bolsa','beneficiaries','beneficiários'],
    ['suas_bolsa_familia_valor','Bolsa Família · valor mensal','bolsa','amount','R$'],
    ['suas_bpc_beneficiarios','BPC · beneficiários no mês','bpc','beneficiaries','pessoas'],
    ['suas_bpc_valor','BPC · valor mensal','bpc','amount','R$']
  ]){
   const row=benefits?.[entry]||null;
   data.push(indicator(id,label,row?.[field]??null,unit,row?.period??'—','cgu_beneficios','Fonte CGU com autenticação no servidor. Quantidade mensal publicada não equivale necessariamente a pessoas únicas no ano.'));
  }
  const historic=[
    ['atlas_idhm','IDHM municipal'],['atlas_idhm_educacao','IDHM Educação'],
    ['atlas_idhm_renda','IDHM Renda'],['atlas_idhm_longevidade','IDHM Longevidade'],
    ['atlas_gini','Desigualdade · índice Gini histórico']
  ];
  for(const [id,label] of historic)data.push(indicator(id,label,null,'índice (0–1)','2010','atlas_pnud','Atlas Brasil/PNUD: dados censitários 2010. A API municipal automática ainda não foi validada.'));
  data.push(indicator('mse_sinase_municipio','Adolescentes em MSE · LA e PSC no município',null,'adolescentes','—','rma_meio_aberto','RMA/CREAS possui registros municipais de Liberdade Assistida e Prestação de Serviços à Comunidade; a extração automatizada municipal ainda não foi homologada. Levantamentos SINASE do meio fechado são predominantemente estaduais, não usar como município.'));
  const lines=budgetDetail?.entries||budgetLines.map(([id,label,code,note])=>({id,label,value:null,unit:'R$',period:'—',source:'tesouro_dca',note}));
  const allBudget=[...lines,
    {id:'pib_municipal',label:'PIB municipal (contexto, não receita fiscal)',value:economic.gdp?.pib??null,unit:'R$',period:economic.gdp?.year??'—',source:'ibge_pib',note:'PIB não representa dinheiro do orçamento municipal.'},
    {id:'pib_percapita',label:'PIB per capita municipal · valor oficial',value:pibPerCapita?.value??null,unit:'R$',period:pibPerCapita?.year??'—',source:'ibge_pib_pc',note:'Valor publicado na API de Pesquisas do IBGE, indicador 47001; sem combinar anos distintos.'}
  ];
  for(const row of allBudget)data.push(indicator('orcamento_v5_'+row.id,row.label,row.value??null,row.unit||'R$',row.period||String(budgetDetail?.year||'—'),row.source||'tesouro_dca',row.note));
  const fiscal=budgetDetail?.finances||null;
  for(const [id,label,v,unit,note] of [
    ['tributos','Impostos, taxas e contribuições de melhoria · receita bruta',fiscal?.taxes,'R$','DCA I-C, rubrica 1.1; não representa toda a arrecadação própria.'],
    ['transferencias_totais_brutas','Transferências correntes e de capital · brutas',fiscal?.transfers,'R$','DCA I-C, rubricas 1.7 e 2.4; antes de deduções, sem discriminar origem federal ou estadual.'],
    ['receita','Receita realizada líquida de deduções',fiscal?.revenue,'R$','DCA I-C; não equivale à Receita Corrente Líquida.'],
    ['despesa','Despesa liquidada municipal',fiscal?.expenditure,'R$','DCA I-D; não equivale à despesa paga.'],
    ['investimentos','Investimentos liquidados',fiscal?.investments,'R$','DCA I-D, grupo 4.4, quando identificável.'],
    ['comprometimento','Despesa liquidada / receita realizada',fiscal?.expenditureShare,'%','Relação gerencial, não índice oficial de endividamento.'],
    ['endividamento','Dívida Consolidada Líquida',balances?.debtNet??null,'R$','RGF Anexo 02: saldo DCL pode ser negativo.']
  ])data.push(indicator('orcamento_v5_'+id,label,v??null,unit,id==='endividamento'?(balances?.year?String(balances.year):'—'):(fiscal?.year?String(fiscal.year):'—'),id==='endividamento'?'tesouro_rgf':'tesouro_dca',note));

  // V6: campos tipados e auditáveis. A existência de fonte não comprova dado municipal.
  // Até validar os esquemas e recortes municipais, preservar null, nunca zero.
  // Consultas da DCA e RGF/RREO, sempre com competência e origem explicitas.
  const fiscalIndicators=[
    ['arrecadacao_propria','Receitas não transferidas (excl. operações de crédito) · proxy',fiscal?.ownRevenue,'R$',fiscal?.year,'tesouro_dca','DCA: receita bruta exceto intra menos transferências e crédito. Inclui receitas próprias não tributárias, inclusive alienação de bens. Não representa receita livre.'],
    ['transferencias_uniao','Transferências da União · correntes + capital (brutas)',fiscal?.unionTransfers,'R$',fiscal?.year,'tesouro_dca','DCA contas 1.7.1 + 2.4.1, sem somar subcontas.'],
    ['transferencias_estados','Transferências dos estados · correntes + capital (brutas)',fiscal?.stateTransfers,'R$',fiscal?.year,'tesouro_dca','DCA contas 1.7.2 + 2.4.2; não incluem outras transferências.'],
    ['dependencia_transferencias','Participação das transferências nas receitas brutas',fiscal?.transferDependency,'%',fiscal?.year,'tesouro_dca','Transferências correntes e de capital / receita bruta (exceto intra), mesma competência.'],
    ['divida_consolidada','Dívida consolidada (DC)',balances?.debt,'R$',balances?.year,'tesouro_rgf','RGF Anexo 02, saldo do último quadrimestre ou semestre do ano.'],
    ['restos_pagar','Restos a pagar · saldo total',balances?.restos,'R$',balances?.year,'tesouro_rreo','RREO Anexo 07: saldo final dos restos processados e não processados, incluindo intraorçamentários.'],
    ['disponibilidade_caixa','Disponibilidade de caixa bruta (total)',balances?.cash,'R$',balances?.year,'tesouro_rgf','RGF Anexo 05: total (IV), incluindo recursos vinculados e RPPS. Não equivale a recursos livres.'],
    ['disponibilidade_caixa_liquida','Disponibilidade de caixa líquida (antes dos restos não processados)',balances?.cashNet,'R$',balances?.year,'tesouro_rgf','RGF Anexo 05: total (IV), após obrigações do demonstrativo; inclui recursos vinculados e RPPS.'],
    ['restos_pagar_processados','Restos a pagar processados · saldo',balances?.processed,'R$',balances?.year,'tesouro_rreo','RREO Anexo 07, conta total processados e não processados liquidados, saldo a pagar (e).'],
    ['restos_pagar_nao_processados','Restos a pagar não processados · saldo',balances?.unprocessed,'R$',balances?.year,'tesouro_rreo','RREO Anexo 07, total não processados, saldo a pagar (k).'],
    ['receita_corrente_liquida_rgf','Receita Corrente Líquida municipal (RCL)',balances?.rcl,'R$',balances?.year,'tesouro_rgf','RGF Anexo 02: RCL no último quadrimestre ou semestre; não equivale a recursos livres.']
  ];
  for(const [id,label,value,unit,period,source,note] of fiscalIndicators)
    data.push(indicator('orcamento_v5_'+id,label,value??null,unit,period?String(period):'—',source,note));
  for(const [id,label,source,note] of [
    ['emendas_706','Transferências especiais da União · fonte 706','tesouro_msc','A fonte não identifica automaticamente parlamentar.'],
    ['emendas_710','Transferências especiais estaduais · fonte 710','tesouro_msc','Validar classificação do exercício antes de divulgar.'],
    ['emendas_federais','Emendas federais identificadas','cgu_emendas','Sem consulta municipal validada não estimar.'],
    ['parcerias_osc','Repasses identificados a OSCs','transferegov','Cobertura federal parcial; não representa todas as parcerias.']
  ])data.push(indicator('orcamento_v5_'+id,label,null,'R$','—',source,note));
  const pendingTerritorial=[
    ['clima_desastres','Desastres registrados no município','ocorrências','s2id','Requer recorte IBGE, período e validação de registros.'],
    ['clima_afetados','Pessoas afetadas por desastres','pessoas','s2id','Não inferir número de afetados a partir de ocorrências.'],
    ['clima_alertas','Alertas hidrológicos e geológicos','alertas','cemaden','A cobertura de monitoramento não abrange necessariamente todos os municípios.'],
    ['clima_areas_risco','Áreas mapeadas de risco','áreas','sgb','Mapeamento geológico não equivale à população exposta.'],
    ['pop_rua_atendimento','Atendimentos à população em situação de rua','atendimentos','suas','RMA/Censo SUAS requer competência e abrangência municipal.'],
    ['mse_meio_aberto','Adolescentes em MSE em meio aberto','pessoas','sinase_mdhc','Sem integração municipal validada; não usar total estadual.'],
    ['lgbt_servicos','Serviços públicos especializados LGBTQIA+','serviços','mdhc','Existência de serviços não estima população LGBTQIA+.'],
    ['lgbt_denuncias','Denúncias de violações LGBTQIA+','registros','mdhc','Registros não equivalem à prevalência de violência nem à população.']
  ];
  for(const [id,label,unit,source,note] of pendingTerritorial)
    data.push(indicator(id,label,null,unit,'—',source,note));

  // Propostas federais, não empenhos nem repasses; município do proponente/recebedor.
  data.push(
    indicator('orcamento_v5_propostas_federais_2026','Propostas federais em 2026 · município do proponente',
      federalProposals?.annual??null,'propostas','2026','transferegov_discricionarias',
      'Transferegov Discricionárias e Legais: total de propostas de proponentes cadastrados no município, inclusive rejeitadas e em análise. NÃO representa recurso transferido nem execução local.'),
    indicator('orcamento_v5_propostas_parcerias_historico','Propostas do módulo Gestão de Parcerias · histórico',
      federalProposals?.partnershipHistory??null,'propostas','histórico','transferegov_parcerias',
      'Transferegov Gestão de Parcerias: total histórico de propostas do recebedor localizado no município. NÃO equivale a parcerias formalizadas, projetos executados no território ou recursos pagos.')
  );
  // Série IPS 2026: proveniência secundária, verificada contra códigos IBGE.
  const ipsLabels=[
    ['ips_2026_geral','IPS Brasil 2026 · Índice de Progresso Social'],
    ['ips_2026_necessidades','IPS · Necessidades Humanas Básicas'],
    ['ips_2026_bem_estar','IPS · Fundamentos do Bem-estar'],
    ['ips_2026_oportunidades','IPS · Oportunidades'],
    ['ips_2026_nutricao','IPS · Nutrição e Cuidados Médicos Básicos'],
    ['ips_2026_agua_saneamento','IPS · Água e Saneamento'],
    ['ips_2026_moradia','IPS · Moradia'],
    ['ips_2026_seguranca','IPS · Segurança Pessoal'],
    ['ips_2026_conhecimento','IPS · Acesso ao Conhecimento Básico'],
    ['ips_2026_informacao','IPS · Acesso à Informação e Comunicação'],
    ['ips_2026_saude','IPS · Saúde e Bem-estar'],
    ['ips_2026_meio_ambiente','IPS · Qualidade do Meio Ambiente'],
    ['ips_2026_direitos','IPS · Direitos Individuais'],
    ['ips_2026_liberdade','IPS · Liberdades Individuais e de Escolha'],
    ['ips_2026_inclusao','IPS · Inclusão Social'],
    ['ips_2026_educacao_superior','IPS · Acesso à Educação Superior']
  ];
  for(const [id,label] of ipsLabels)data.push(indicator(id,label,ips2026?.scores?.[id]??null,'pontos (0–100)','2026','ips_brasil_2026',
    'IPS Brasil 2026 transcrito de espelho independente, cruzado com código oficial IBGE. Conferir ipsbrasil.org.br/explore/data. Edições 2024/2025/2026 não são estritamente comparáveis.'));
  // RREO municipal de competência recente: atividade fiscal, NUNCA PIB corrente.
  const fiscalPeriod=fiscalPulse?String(fiscalPulse.year)+' / '+fiscalPulse.period+'º bimestre':'—';
  const fiscalRows=[
    ['economia_pulso_receitas','Receitas realizadas acumuladas no ano',fiscalPulse?.revenue,'R$','RREO Anexo 01. Indicador fiscal, não PIB.'],
    ['economia_pulso_tributos','Receitas tributárias acumuladas no ano',fiscalPulse?.taxes,'R$','RREO Anexo 01. Não representa produção econômica.'],
    ['economia_pulso_despesas','Despesas liquidadas acumuladas no ano',fiscalPulse?.expenses,'R$','RREO Anexo 01.'],
    ['economia_pulso_receitas_variacao','Variação nominal das receitas frente ao mesmo bimestre anterior',fiscalPulse?.revenueVariation,'%','Não deflacionado e não equivale a crescimento do PIB.'],
    ['economia_pulso_tributos_variacao','Variação nominal dos tributos frente ao mesmo bimestre anterior',fiscalPulse?.taxesVariation,'%','Não deflacionado e não equivale a crescimento do PIB.']
  ];
  for(const [id,label,value,unit,note] of fiscalRows)
    data.push(indicator(id,label,value??null,unit,fiscalPeriod,'tesouro_rreo',note));
  const p=economic.gdp||null,sect=economic.sectors||null,unemp=economic.unemployment||null;
  data.push(
    indicator('economia_pib_municipal','PIB municipal a preços correntes',p?.pib??null,'R$',p?.year??'—','ibge_pib','Valor nominal produzido no município; não equivale à renda da população e não é deflacionado.'),
    indicator('economia_pib_crescimento_nominal','Variação nominal anual do PIB municipal',p?.growth??null,'%',p?.year??'—','ibge_pib','Comparação com o ano anterior em preços correntes, não significa crescimento real.'),
    indicator('economia_emprego_assalariado_total','Pessoal ocupado assalariado em unidades locais',sect?.total??null,'vínculos',sect?.year??'—','ibge_cempre','Pessoal assalariado por local de atividade, não equivale à população residente ocupada nem mede desemprego.')
  );
  for(let i=0;i<6;i++){
    const top=sect?.top?.[i]||null;
    data.push(indicator('economia_setor_emprego_'+(i+1),'Emprego assalariado · '+(top?.name||'setor '+(i+1)),top?.share??null,'%',sect?.year??'—','ibge_cempre',
      top?'Participação no total municipal de assalariados das unidades locais, '+top.people.toLocaleString('pt-BR')+' pessoas. Não é participação no PIB ou número de oportunidades abertas.':'Sem setor validado nessa posição.'));
  }
  const ag=unemp?.age||{};
  const statePeriod=unemp?.period?(unemp.period.slice(0,4)+' T'+unemp.period.slice(5,6)+' · '+uf+' (UF)'):'—';
  data.push(
    indicator('contexto_uf_desocupacao_total','Contexto estadual '+uf+' · taxa de desocupação',unemp?.rate??null,'%',statePeriod,'ibge_pnad_uf','PNAD da UF. Não representa taxa nem número de pessoas desocupadas do município.'),
    indicator('contexto_uf_desocupacao_14_17','Contexto estadual '+uf+' · desocupação 14–17 anos',ag['14_17']??null,'%',statePeriod,'ibge_pnad_uf','Faixa etária da UF, não do município.'),
    indicator('contexto_uf_desocupacao_18_24','Contexto estadual '+uf+' · desocupação 18–24 anos',ag['18_24']??null,'%',statePeriod,'ibge_pnad_uf','Faixa etária da UF, não do município.'),
    indicator('contexto_uf_desocupacao_25_39','Contexto estadual '+uf+' · desocupação 25–39 anos',ag['25_39']??null,'%',statePeriod,'ibge_pnad_uf'),
    indicator('contexto_uf_desocupacao_40_59','Contexto estadual '+uf+' · desocupação 40–59 anos',ag['40_59']??null,'%',statePeriod,'ibge_pnad_uf'),
    indicator('contexto_uf_desocupacao_60mais','Contexto estadual '+uf+' · desocupação 60 anos+',ag['60_mais']??null,'%',statePeriod,'ibge_pnad_uf')
  );
  // Novo Caged PE 09/2026 permanece base histórica distinta do CEMPRE dinâmico.
  if(uf==='PE')data.push(
    indicator('caged_admissoes_202609','Admissões formais no mês',caged?.admissoes??null,'vínculos','09/2026','caged_pe','Movimentação Novo Caged ajustada; não equivale a oportunidades de contratação atualmente abertas.'),
    indicator('caged_desligamentos_202609','Desligamentos formais no mês',caged?.desligamentos??null,'vínculos','09/2026','caged_pe'),
    indicator('caged_saldo_202609','Saldo líquido de emprego formal no mês',caged?.saldo??null,'vínculos','09/2026','caged_pe','Admissões menos desligamentos, inclusive valores negativos; não é estoque de empregos.'),
    indicator('caged_salario_admissao_202609','Salário médio nominal de admissão',caged?.salario??null,'R$','09/2026','caged_pe','Média de salários nas admissões do período; não equivale ao salário médio de todos os trabalhadores.')
  );
  // Os nove dados IVCAD só pertencem ao universo territorial da fonte PE.
  // Não contar indisponibilidade de PE como falha de cobertura para municípios de outras UFs.
  if(uf==='PE')data.push(
    indicator('ivcad_geral','IVCAD · índice geral',ivcad?.geral??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe','Média das seis dimensões. Quanto mais próximo de 1, maior a vulnerabilidade no universo do indicador; não equivale à proporção de famílias vulneráveis.'),
    indicator('ivcad_nc','IVCAD · necessidade de cuidados',ivcad?.nc??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe'),
    indicator('ivcad_dpi','IVCAD · primeira infância',ivcad?.dpi??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe'),
    indicator('ivcad_dca','IVCAD · crianças e adolescentes',ivcad?.dca??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe'),
    indicator('ivcad_tqa','IVCAD · trabalho e qualificação de adultos',ivcad?.tqa??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe','Índice de vulnerabilidade familiar; NÃO mede admissões, vínculos formais ou taxa de desemprego.'),
    indicator('ivcad_dr','IVCAD · disponibilidade de recursos',ivcad?.dr??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe'),
    indicator('ivcad_ch','IVCAD · condições habitacionais',ivcad?.ch??null,'índice (0–1)',ivcad?.year?String(ivcad.year):'—','ivcad_pe'),
  );
  // Etapa 3: atendimento escolar por idade entre residentes (IBGE), NÃO matrículas escolares do Inep.
  const ageBands=[
    ['99749','0 a 3 anos','0a3'],['47813','4 a 5 anos','4a5'],['31615','6 a 14 anos','6a14'],
    ['2792','15 a 17 anos','15a17'],['100052','18 a 24 anos','18a24']
  ];
  for(const [age,label,suffix] of ageBands){
    const rate=schoolFrequency?.rates?.[age];
    data.push(indicator('educacao_frequencia_'+suffix,'Frequência escolar bruta · '+label,rate??null,'%','2022','ibge_frequencia_2022',
      'Percentual de residentes de '+label+' que frequentavam escola/creche no Censo 2022, tabela 10056. Não é taxa de matrícula no município nem fluxo escolar atual.'));
    data.push(indicator('educacao_nao_frequencia_'+suffix,'Não frequentavam escola/creche · '+label,
      Number.isFinite(rate)?Number((100-rate).toFixed(2)):null,'%','2022','ibge_frequencia_2022',
      'Complemento de 100% da taxa bruta de frequência escolar, restrito à faixa de idade. Não equivale automaticamente a evasão escolar e não é número de pessoas.'));
  }
  // Inep 2025 (Sinopse) via IBGE/Pesquisa 13: matrículas na rede ESCOLAR LOCAL.
  const censusFields=[
    ['infantil','Matrículas · educação infantil','matrículas'],
    ['creche','Matrículas · creche','matrículas'],
    ['pre_escola','Matrículas · pré-escola','matrículas'],
    ['fundamental','Matrículas · ensino fundamental','matrículas'],
    ['medio','Matrículas · ensino médio','matrículas'],
    ['docentes_infantil','Funções docentes · educação infantil','funções docentes'],
    ['docentes_fundamental','Funções docentes · ensino fundamental','funções docentes'],
    ['docentes_medio','Funções docentes · ensino médio','funções docentes'],
    ['escolas_infantil','Escolas que oferecem educação infantil','escolas'],
    ['escolas_creche','Escolas que oferecem creche','escolas'],
    ['escolas_pre_escola','Escolas que oferecem pré-escola','escolas'],
    ['escolas_fundamental','Escolas que oferecem ensino fundamental','escolas'],
    ['escolas_medio','Escolas que oferecem ensino médio','escolas']
  ];
  for(const [key,label,unit] of censusFields){
    const value=schoolCensus?.fields?.[key]?.current;
    const note=unit==='matrículas'?
      'Censo Escolar/Inep 2025 (final), sinopse via IBGE Pesquisa 13. Conta matrículas em escolas localizadas no município, não pessoas residentes. Etapas de ensino diferentes não devem ser somadas com educação profissional/EJA sem metodologia.' :
      unit==='escolas'?
      'Censo Escolar/Inep 2025 (final), sinopse via IBGE Pesquisa 13. A mesma escola pode ofertar múltiplas etapas: NÃO somar o total de escolas entre etapas.' :
      'Censo Escolar/Inep 2025 (final), sinopse via IBGE Pesquisa 13. Funções docentes por etapa não equivalem a pessoas únicas e NÃO devem ser somadas como docentes distintos.';
    data.push(indicator('educacao_inep_2025_'+key,label,value??null,unit,'2025','inep_censo_2025',note));
  }
  for(const [key,label] of [
    ['creche','Variação de matrículas · creche · 2024–2025'],
    ['pre_escola','Variação de matrículas · pré-escola · 2024–2025'],
    ['fundamental','Variação de matrículas · ensino fundamental · 2024–2025'],
    ['medio','Variação de matrículas · ensino médio · 2024–2025']
  ]){
    data.push(indicator('educacao_inep_variacao_'+key,label,percentVariation(schoolCensus?.fields?.[key])??null,
      '%','2024–2025','inep_censo_2025','Variação anual relativa do estoque de matrículas de escolas no município; não representa abandono ou evasão escolar, nem participação dos jovens residentes.'));
  }
  // Sistema Prisional: nomes, unidades e fontes prontos para importação oficial.
  // O CSV semestral SISDEPEN ainda requer vínculo IBGE e deduplicação homologados.
  for(const [id,label,unit,source,note] of [
    ['prisional_unidades_estabelecimentos','Estabelecimentos prisionais no município','unidades','sisdepen_unidades','Necessário vínculo municipal por localização da unidade; ausência não significa zero.'],
    ['prisional_capacidade_total','Capacidade declarada das unidades prisionais locais','vagas','sisdepen_unidades','Somente somar unidades com registros completos do mesmo ciclo, sem duplicidade de regimes.'],
    ['prisional_pessoas_custodiadas','Pessoas custodiadas em unidades instaladas no município','pessoas','sisdepen_unidades','Local de custódia não equivale à residência nem à origem das pessoas presas.'],
    ['prisional_ocupacao_pct','Taxa de ocupação prisional no município','%','sisdepen_unidades','Requer população e capacidade da mesma cobertura e competência.'],
    ['prisional_educacao_pessoas','Pessoas em atividades educacionais nas unidades locais','pessoas','sisdepen_unidades','Ainda não homologado como total municipal.'],
    ['prisional_trabalho_pessoas','Pessoas em atividades laborais nas unidades locais','pessoas','sisdepen_unidades','Não representa oportunidades de trabalho disponíveis.'],
    ['prisional_egressos_atendidos','Pessoas egressas acompanhadas por serviços no município','pessoas','senappen_egressos','Serviço localizado não implica população egressa residente no município.']
  ])data.push(indicator(id,label,null,unit,'—',source,note));
  data.push(indicator('mse_la_acompanhamento','Adolescentes acompanhados em Liberdade Assistida · RMA/CREAS',null,'adolescentes','—','rma_meio_aberto','RMA municipal ainda não homologado; atendimento mensal não é estoque de indivíduos únicos.'));
  data.push(indicator('mse_psc_acompanhamento','Adolescentes acompanhados em Prestação de Serviços à Comunidade · RMA/CREAS',null,'adolescentes','—','rma_meio_aberto','RMA municipal ainda não homologado; atendimento mensal não é estoque de indivíduos únicos.'));
  const groupOk = (ids) => ids.some(id => data.find(d=>d.id===id)?.status==='verificado');
  const modules = [
    {id:'demografia',name:'Perfil demográfico',status:groupOk(['populacao_censo','populacao_estimativa'])?'verificado':'indisponivel',source:'ibge'},
    {id:'juventude',name:'Juventude de 15 a 29 anos',status:groupOk(['jovens_15_29'])?'verificado':'indisponivel',source:'ibge'},
    {id:'mulheres',name:'População de mulheres · Censo 2022',status:groupOk(['populacao_mulheres'])?'verificado':'indisponivel',source:'ibge',reason:'Recorte oficial por sexo (mulheres), sem representar automaticamente identidade de gênero ou vulnerabilidade.'},
    {id:'idosos',name:'Pessoas idosas de 60 anos ou mais',status:groupOk(['pessoas_idosas_60mais'])?'verificado':'indisponivel',source:'ibge',reason:'IBGE/SIDRA tabela 9514, soma de faixas quinquenais, Censo 2022.'},
    {id:'educacao',name:'Alfabetização e escolaridade',status:groupOk(['alfabetizacao_15mais','sem_medio_completo_18mais_pct'])?'verificado':'indisponivel',source:'ibge',reason:'Dados censitários de 2022; não incluem IDEB ou matrículas atuais.'},
    {id:'matriculas_2025',name:'Matrículas, escolas e docentes · INEP 2025',status:schoolCensus?'verificado':'indisponivel',source:'inep_censo_2025',reason:'Sinopse INEP 2025 via IBGE/Pesquisa 13. Matrículas em escolas locais, não frequência dos moradores. EJA, educação especial e ensino profissional dependem de agregados diferentes.'},
    {id:'frequencia_escolar',name:'Frequência escolar por faixa etária · Censo 2022',status:schoolFrequency?'verificado':'indisponivel',source:'ibge_frequencia_2022',reason:'Taxa de residentes que frequentavam escola ou creche por idade, 2022. Não confundir com matrículas em escolas locais.'},
    {id:'ideb',name:'IDEB 2025 · rede pública',status:(ideb.inicial!==null&&ideb.final!==null)?'verificado':(ideb.inicial!==null||ideb.final!==null)?'parcial':'indisponivel',source:'inep',reason:'Resultados oficiais do INEP de 2025. Algumas redes/municípios não possuem valor publicado.'},
    {id:'orcamento',name:'Execução orçamentária',status:groupOk(['orcamento_assistencia'])?'verificado':'indisponivel',source:'tesouro'},
    {id:'cadunico',name:'Cadastro Único · agregados municipais',status:!cadunico?'indisponivel':(['families','people','poverty','extremePovertyFamilies'].every(k=>Number.isFinite(cadunico[k]))?'verificado':'parcial'),source:'mds_cadunico',reason:!cadunico?'A API MDS MI Social não retornou registros municipais válidos nesta consulta. A ausência não equivale a zero.':'Famílias e pessoas por pobreza, extrema pobreza e renda per capita por competência da base; atualização cadastral permanece indisponível até identificação de coluna oficial.'},
    {id:'ivcad',name:'IVCAD · consulta por API pública',status:uf==='PE'?(ivcad?'verificado':'indisponivel'):'nao_integrado',source:uf==='PE'?'ivcad_pe':'ivcad_nacional',reason:uf==='PE'?(ivcad?'Consulta ao vivo à API pública Condepe-Fidem/MDS. Competência e sete índices conferidos, sem snapshot.':'API de PE não retornou sete dimensões consistentes. Não usar último número armazenado.'):'Painel nacional do MDS é público, mas não foi validada uma API aberta e estável para extração municipal automática. Não inventar IVCAD nem extrapolar Pernambuco.'},
    {id:'aprendizagem',name:'Potencial de aprendizagem profissional · MTE',status:learning?'verificado':'indisponivel',source:'mte',reason:learning?'Fonte MTE/SIT 07/2026, potencial de cota por setor; não são oportunidades abertas.':'O município não possui correspondência exata validada com a base MTE 07/2026.'},
    {id:'suas',name:'CRAS · Censo SUAS 2024',status:cras?'verificado':'indisponivel',source:'suas_municipal',reason:cras?'Relatório municipal MDS/SAGICAD de 2024, equipamentos por capacidade de referenciamento.':'Relatório municipal Censo SUAS 2024 não recuperado ou não validado; verificar no portal oficial.'},
    {id:'saneamento',name:'Saneamento domiciliar · Censo 2022',status:water&&sewer?'verificado':water||sewer?'parcial':'indisponivel',source:'ibge_esgoto',reason:'Censo 2022, dados de domicílios IBGE/SIDRA 6803 e 6805. Não mede riscos climáticos atuais ou tratamento de água e efluentes.'},
    {id:'economia',name:'Estrutura econômica e emprego assalariado municipal',status:sect&&p?'verificado':sect||p?'parcial':'indisponivel',source:'ibge_cempre',reason:'IBGE PIB 5938 e CEMPRE 9528: dados anuais por atividade da unidade local. Emprego setorial NÃO é demanda aberta por contratações.'},
    {id:'contexto_desocupacao',name:'Desocupação por faixa etária · apenas contexto da UF',status:unemp?'verificado':'indisponivel',source:'ibge_pnad_uf',reason:'Taxas estaduais PNAD contínua. Número de desempregados e taxas municipais por faixa etária não disponíveis para todos os municípios.'},
    {id:'mei',name:'MEIs ativos · consulta oficial sem API integrada',status:'nao_integrado',source:'mei_oficial',reason:'Receita Federal disponibiliza painel público por município e faixa etária, mas não foi validada API aberta para consulta automática em todos os municípios. Não estimar MEI pelo CNPJ ou porte.'},
    {id:'beneficios',name:'Bolsa Família e BPC · MDS e CGU por município',status:(Number.isFinite(pbfMds?.beneficiaries)||Number.isFinite(benefits?.bolsa?.beneficiaries))&&(Number.isFinite(bpcMds?.beneficiaries)||Number.isFinite(benefits?.bpc?.beneficiaries))?'verificado':(Number.isFinite(pbfMds?.beneficiaries)||Number.isFinite(benefits?.bolsa?.beneficiaries)||Number.isFinite(bpcMds?.beneficiaries)||Number.isFinite(benefits?.bpc?.beneficiaries))?'parcial':'indisponivel',source:'mds_beneficios_misocial',reason:'MDS MI Social (consulta nacional mensal pública), complementado opcionalmente por API CGU autenticada quando chave institucional estiver configurada. No momento as rotas públicas do MDS podem redirecionar para manutenção; não preencher com zero.'},
    {id:'orcamento_v5',name:'Orçamento por subfunção · SICONFI/DCA',status:budgetDetail?'verificado':'indisponivel',source:'tesouro_dca',reason:budgetDetail?'Dados anuais por função e subfunção. Fundos FIA, Idoso e FMAS não são individualizados pela DCA; proxies devidamente identificadas.':'Sem DCA validada nesta consulta.'},
    {id:'atlas',name:'Atlas/PNUD · IDHM municipal histórico',status:'nao_integrado',source:'atlas_pnud',reason:'Os dados históricos 2010 são públicos, porém a API municipal oficial não foi validada nesta fase.'},
    {id:'sisdepen',name:'Sistema prisional · unidades e custódia por município',status:'nao_integrado',source:'sisdepen_unidades',reason:'Planilhas/CSV oficiais SISDEPEN por unidade; vínculo IBGE, cobertura e capacidade ainda não homologados. Nenhuma quantidade inventada.'},
    {id:'geopresidios',name:'Geopresídios / CNJ · inspeções prisionais',status:'nao_integrado',source:'cnj_geopresidios',reason:'API pública e painel disponíveis; esquema de extração municipal ainda não homologado.'},
    {id:'cniups',name:'CNIUPS / CNJ · unidades e programas socioeducativos',status:'nao_integrado',source:'cnj_cniups',reason:'Painel público de inspeções socioeducativas; quantitativos municipais ainda não extraídos com integridade.'},
    {id:'egressos',name:'Atenção à pessoa egressa · PNAPE',status:'nao_integrado',source:'senappen_egressos',reason:'Serviços e programas públicos identificados; sem agregado validado por município de atendimento e população de origem.'},
    {id:'mse',name:'Medidas socioeducativas municipais · RMA/CREAS (LA/PSC)',status:'nao_integrado',source:'rma_meio_aberto',reason:'Os registros municipais de LA e PSC do SUAS são a fonte correta para o meio aberto, mas o acesso automático agregado não foi validado. O SINASE 2025 do meio fechado agrega sobretudo por UF, não por município.'},
        {id:'trabalho',name:'Trabalho e renda · Novo Caged 09/2026',status:uf==='PE'?(caged?(caged.salario===null?'parcial':'verificado'):'indisponivel'):'nao_integrado',source:uf==='PE'?'caged_pe':'mte',reason:uf==='PE'?(caged?'Movimentações de emprego formal de setembro/2026, conforme curadoria MTE/Condepe-Fidem. Salário pode estar ausente.':'Sem registro completo do movimento mensal nesta base estadual; ausência não é zero.'):'A fonte MTE/Novo Caged integrada nesta etapa é estadual (PE), outros estados exigem arquivos próprios.'},
    {id:'lgbt_municipal',name:'População LGBTQIA+ por município · censo nacional',status:'nao_integrado',source:'ibge_pns_lgbt',reason:'O Censo Demográfico 2022 não coletou orientação sexual nem identidade de gênero; PNS 2019 é pesquisa amostral e não fornece total confiável para todos os municípios. Não aplicar percentuais nacionais ao território.'},
    {id:'rua_censo',name:'Contagem nacional da população em situação de rua',status:'nao_integrado',source:'ibge_censo_rua',reason:'O IBGE prepara o Censo Nacional da População em Situação de Rua; ainda não foi validada divulgação de contagens censitárias municipais. O CadÚnico abrange somente cadastrados e pode subcontar.'},
    {id:'emendas_execucao',name:'Execução financeira e repasses efetivos de emendas',status:'nao_integrado',source:'transferegov',reason:'As contagens atuais do Transferegov são propostas de proponentes cadastrados no município. Empenhos, pagamentos, execução territorial e valores líquidos por emenda ainda exigem conciliação dos instrumentos; propostas não equivalem a recursos liberados.'},
    {id:'educacao_modalidades_2025',name:'EJA, educação profissional e especial · INEP 2025',status:'nao_integrado',source:'inep_censo_2025',reason:'Os microdados oficiais 2025 não puderam ser obtidos com integridade auditada. Sem extração validada não apresentar matrículas dessas modalidades para o município.'},
    {id:'pop_rua_municipal',name:'População em situação de rua · recorte municipal',status:popRuaHistorico?'parcial':'nao_integrado',source:popRuaHistorico?'poprua_ufmg_historico':'mds',reason:popRuaHistorico?'Há observação histórica de pessoas cadastradas em 2021 via UFMG, mas não estimativa da população total nem atualização para 2026. Cadastro de famílias em situação de rua permanece sem série automatizada.':'Fonte histórica nacional UFMG não possui observação confirmada para o município em 2021; Cadastro Único atual e censo total não validados. Ausência de registro não é zero.'},
    {id:'riscos_climaticos',name:'Riscos climáticos e desastres por município',status:'nao_integrado',source:'s2id',reason:'Dados de saneamento do Censo 2022 não equivalem a áreas de risco, alertas, eventos ou famílias afetadas. API municipal confiável ainda não integrada.'},
    {id:'publicos',name:'Públicos prioritários',status:'nao_integrado',source:'mds',reason:'Sem agregados estruturados validados para todos os públicos prioritários.'}
  ];
  const valid = data.filter(d => d.status === 'verificado').length;
  const diagnostic = { version: '11.0-protecao-social-nacional', generatedAt: new Date().toISOString(), municipio, indicators:data, modules,
    sources: {...SOURCES,suas_municipal:{name:'MDS/SAGICAD · Indicadores Censo SUAS 2024',url:suasReport?.url||'https://sagicad-mds.github.io/indicadores-de-desenvolvimento/index.html'}}, quality:{verified:valid,total:data.length,coveragePercent:Math.round(valid/data.length*100),
      disclaimer:'Cobertura se refere somente aos indicadores demonstrativos integrados, não à completude do diagnóstico territorial.'},
    notes:['Ausência de informação não significa zero.', 'Competência estatística e data da consulta são conceitos diferentes.',
      'Comparações e recomendações dependem de indicadores equivalentes e validados.',
      'IVCAD sem snapshots: consulta ao vivo à API pública estadual apenas para Pernambuco. No restante do país, painel MDS disponível para consulta manual, mas API nacional não validada.',
      'Novo Caged setembro/2026 PE ainda é snapshot histórico; os dados nacionais de emprego por setor são consultados dinamicamente via IBGE/CEMPRE, não são oportunidades abertas.'] };
  diagnostic.audit=buildAudit(diagnostic);
  return diagnostic;
}
async function fetchBudget(codigo) {
  for (const year of [2025, 2024]) {
    try {
      const u = new URL(SICONFI + '/ords/siconfi/tt/dca');
      u.searchParams.set('an_exercicio', String(year));
      u.searchParams.set('no_anexo', 'DCA-Anexo I-E');
      u.searchParams.set('id_ente', codigo);
      const response = await json(u.toString(), 14000);
      const rows = Array.isArray(response?.items) ? response.items : [];
      if (!rows.length) continue;
      function get(code) {
        const matches = rows.filter(x => /despesas liquidadas/i.test(String(x.coluna ?? '')) && String(x.cod_conta ?? '').trim() === 'TotalDespesas' && String(x.rotulo ?? '').includes('Total Geral da Despesa por Função') && new RegExp('^' + code + ' \\- ').test(String(x.conta ?? '').trim()));
        const values = matches.map(x => numeric(x.valor)).filter(x => x !== null && x >= 0);
        return values.length === 1 ? values[0] : null; // recusa ambiguidades contábeis
      }
      const assist=get('08'), education=get('12'), health=get('10');
      if ([assist,education,health].some(v=>v!==null)) return {assist,education,health,period:String(year),reference:'DCA-Anexo I-E · despesas liquidadas'};
    } catch (_err) { /* informa indisponibilidade pelos indicadores, sem inventar valores */ }
  }
  return null;
}
module.exports = async function handler(req,res) {
  if (req.method !== 'GET') return res.status(405).json({error:'Método não permitido'});
  try {
    const data = await getDiagnosis(req.query.ibge);
    res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch(e) {
    return res.status(e.status || 502).json({error: e.status ? e.message : 'Não foi possível validar as fontes oficiais agora.',detail: e.status ? undefined : 'Nova tentativa recomendada.'});
  }
};
module.exports.getDiagnosis = getDiagnosis;
module.exports.extractAgeSex=extractAgeSex;
module.exports.extractSaneamento=extractSaneamento;
module.exports.SOURCES = SOURCES;
