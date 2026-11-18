'use strict';

const IBGE = 'https://servicodados.ibge.gov.br';
const SICONFI = 'https://apidatalake.tesouro.gov.br';
const SOURCES = {
  ibge: { name: 'IBGE · Censo e estimativas', url: 'https://servicodados.ibge.gov.br/api/docs/' },
  tesouro: { name: 'Tesouro Nacional · SICONFI', url: 'https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos' },
  mds: { name: 'MDS · Cadastro Único e IVCAD', url: 'https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/' },
  inep: { name: 'INEP · IDEB', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados' },
  mte: { name: 'MTE · Potencial de cota de aprendizagem', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/insercao-de-aprendiz-1' },
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
function indicator(id, label, value, unit, period, source, note = '') {
  return { id, label, value: Number.isFinite(value) ? value : null, unit, period, source, note, status: Number.isFinite(value) ? 'verificado' : 'indisponivel' };
}
function asFinite(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
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
    json(IBGE + '/api/v3/agregados/10061/periodos/2022/variaveis/2667?localidades=N6[' + codigo + ']&classificacao=1568[9493,9494,9495,99713]|58[95253]|2[6794]|86[95251]')
  ]);
  const census = results[0].status === 'fulfilled' ? seriesValues(results[0].value, codigo) : {};
  const estimated = results[1].status === 'fulfilled' ? seriesValues(results[1].value, codigo) : {};
  const estimateYears = Object.keys(estimated).filter(k => k.startsWith('9324:')).map(k => Number(k.split(':')[1])).sort((a,b) => b-a);
  const latestYear = estimateYears[0] || null;
  const budget = results[2].status === 'fulfilled' ? results[2].value : null;
  const age = classifiedValues(results[3].status === 'fulfilled' ? results[3].value : null, codigo, 287, ['93086','93087','93088']);
  const young = age.size === 3 ? [...age.values()].reduce((a,b)=>a+b,0) : null;
  const population = asFinite(census['93:2022']);
  const validYoung = Number.isFinite(young) && young >= 0 && Number.isFinite(population) && young <= population ? young : null;
  const literacyRaw = results[4].status === 'fulfilled' ? seriesValues(results[4].value, codigo)['2513:2022'] : null;
  const literacy = within(literacyRaw, 0, 100);
  const education = classifiedValues(results[5].status === 'fulfilled' ? results[5].value : null, codigo, 1568, ['9493','9494','9495','99713']);
  const total18 = education.size === 4 ? [...education.values()].reduce((a,b)=>a+b,0) : null;
  const lowCount = Number.isFinite(total18) && total18 > 0 ? education.get('9493') + education.get('9494') : null;
  const lowPct = Number.isFinite(lowCount) && Number.isFinite(total18) && total18 > 0 ? within(100*lowCount/total18,0,100) : null;
  const higherPct = Number.isFinite(total18) && total18 > 0 ? within(100*education.get('99713')/total18,0,100) : null;
  const data = [
    indicator('populacao_censo', 'População residente · Censo', asFinite(census['93:2022']), 'pessoas', '2022', 'ibge'),
    indicator('populacao_estimativa', 'População estimada', latestYear ? asFinite(estimated['9324:' + latestYear]) : null, 'pessoas', latestYear ? String(latestYear) : '—', 'ibge'),
    indicator('area', 'Área territorial', asFinite(census['6318:2022']), 'km²', '2022', 'ibge'),
    indicator('densidade', 'Densidade demográfica', asFinite(census['614:2022']), 'hab./km²', '2022', 'ibge'),
    indicator('jovens_15_29', 'Pessoas de 15 a 29 anos · Censo', validYoung, 'pessoas', '2022', 'ibge', 'Soma das faixas 15–19, 20–24 e 25–29 anos no Censo 2022.'),
    indicator('jovens_15_29_pct', 'Participação dos jovens de 15 a 29 anos', validYoung !== null && population > 0 ? within(100*validYoung/population,0,100) : null, '%', '2022', 'ibge', 'Percentual sobre a população residente censitária, não sobre estimativa populacional.'),
    indicator('jovens_15_19', 'Adolescentes e jovens de 15 a 19 anos', age.size===3?age.get('93086'):null, 'pessoas','2022','ibge'),
    indicator('jovens_20_24', 'Jovens de 20 a 24 anos', age.size===3?age.get('93087'):null, 'pessoas','2022','ibge'),
    indicator('jovens_25_29', 'Jovens de 25 a 29 anos', age.size===3?age.get('93088'):null, 'pessoas','2022','ibge'),
    indicator('alfabetizacao_15mais', 'Taxa de alfabetização · 15 anos ou mais', literacy, '%', '2022','ibge', 'IBGE tabela 9543; não equivale à conclusão do ensino fundamental.'),
    indicator('sem_medio_completo_18mais', 'Pessoas de 18 anos ou mais sem ensino médio completo', lowCount, 'pessoas','2022','ibge', 'Soma dos níveis sem instrução/fundamental incompleto e fundamental completo/médio incompleto.'),
    indicator('sem_medio_completo_18mais_pct', 'Parcela de 18 anos ou mais sem ensino médio completo', lowPct, '%','2022','ibge', 'Denominador: total da população de 18 anos ou mais com níveis de instrução classificados na tabela 10061.'),
    indicator('superior_completo_18mais_pct','Parcela de 18 anos ou mais com superior completo',higherPct,'%','2022','ibge'),
    indicator('orcamento_assistencia', 'Despesas liquidadas · Assistência Social', budget?.assist ?? null, 'R$', budget?.period ?? '—', 'tesouro', 'Despesa por função. Não representa orçamento disponível para novos projetos.'),
    indicator('orcamento_educacao', 'Despesas liquidadas · Educação', budget?.education ?? null, 'R$', budget?.period ?? '—', 'tesouro'),
    indicator('orcamento_saude', 'Despesas liquidadas · Saúde', budget?.health ?? null, 'R$', budget?.period ?? '—', 'tesouro')
  ];
  const groupOk = (ids) => ids.some(id => data.find(d=>d.id===id)?.status==='verificado');
  const modules = [
    {id:'demografia',name:'Perfil demográfico',status:groupOk(['populacao_censo','populacao_estimativa'])?'verificado':'indisponivel',source:'ibge'},
    {id:'juventude',name:'Juventude de 15 a 29 anos',status:groupOk(['jovens_15_29'])?'verificado':'indisponivel',source:'ibge'},
    {id:'educacao',name:'Alfabetização e escolaridade',status:groupOk(['alfabetizacao_15mais','sem_medio_completo_18mais_pct'])?'verificado':'indisponivel',source:'ibge',reason:'Dados censitários de 2022; não incluem IDEB ou matrículas atuais.'},
    {id:'ideb',name:'IDEB 2025',status:'nao_integrado',source:'inep',reason:'Resultados publicados pelo INEP; carga municipal estruturada ainda em preparação.'},
    {id:'orcamento',name:'Execução orçamentária',status:groupOk(['orcamento_assistencia'])?'verificado':'indisponivel',source:'tesouro'},
    {id:'cadunico',name:'Cadastro Único e IVCAD',status:'nao_integrado',source:'mds',reason:'Sem extração agregada municipal validada nesta versão.'},
    {id:'aprendizagem',name:'Aprendizagem profissional',status:'nao_integrado',source:'mte',reason:'Importação do arquivo municipal do MTE pendente.'},
    {id:'suas',name:'Proteção social e Censo SUAS',status:'nao_integrado',source:'suas',reason:'Importação de equipamentos e serviços municipais pendente.'},
    {id:'trabalho',name:'Trabalho e renda',status:'nao_integrado',source:'mte',reason:'RAIS/Novo Caged ainda não validados.'},
    {id:'publicos',name:'Públicos prioritários',status:'nao_integrado',source:'mds',reason:'Sem agregados estruturados validados para todos os públicos prioritários.'}
  ];
  const valid = data.filter(d => d.status === 'verificado').length;
  return { version: '2.0-homologacao', generatedAt: new Date().toISOString(), municipio, indicators:data, modules,
    sources: SOURCES, quality:{verified:valid,total:data.length,coveragePercent:Math.round(valid/data.length*100),
      disclaimer:'Cobertura se refere somente aos indicadores demonstrativos integrados, não à completude do diagnóstico territorial.'},
    notes:['Ausência de informação não significa zero.', 'Competência estatística e data da consulta são conceitos diferentes.',
      'Comparações e recomendações dependem de indicadores equivalentes e validados.'] };
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
module.exports.SOURCES = SOURCES;
