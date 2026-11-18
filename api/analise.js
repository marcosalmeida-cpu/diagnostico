'use strict';
const {getDiagnosis} = require('./diagnostico');

function factualAnalysis(d){
 const find=id=>d.indicators.find(x=>x.id===id&&x.status==='verificado'&&Number.isFinite(x.value));
 const value=id=>find(id)?.value??null;
 const fmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1});
 const fmtN=x=>Number.isFinite(x)?fmt.format(x):'não disponível';
 const fmtI=x=>Number.isFinite(x)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3}).format(x):'indisponível';
 const money=x=>Number.isFinite(x)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(x):'indisponível';
 const paragraphs=[];
 const p=value('populacao_censo'),young=value('jovens_15_29'),yp=value('jovens_15_29_pct');
 const elder=value('pessoas_idosas_60mais_pct'),women=value('mulheres_pct'),low=value('sem_medio_completo_18mais_pct');
 const cras=value('suas_cras_total_2024'),quota=value('mte_potencial_cota');
 const gdp=value('economia_pib_municipal'),growth=value('economia_pib_crescimento_nominal');
 const staff=value('economia_emprego_assalariado_total'),salaried=d.indicators.filter(x=>/^economia_setor_emprego_\d+$/.test(x.id)&&x.status==='verificado').sort((a,b)=>b.value-a.value);
 const rateUF=value('contexto_uf_desocupacao_total'),rateYoungUF=value('contexto_uf_desocupacao_18_24');
 const water=value('saneamento_agua_sem_ligacao_pct'),sewer=value('saneamento_esgoto_fossa_rudimentar_pct');
 const dims=[['trabalho e qualificação de adultos','ivcad_tqa'],['disponibilidade de recursos','ivcad_dr'],['necessidade de cuidados','ivcad_nc'],['condições habitacionais','ivcad_ch'],['primeira infância','ivcad_dpi'],['crianças e adolescentes','ivcad_dca']]
  .map(([name,id])=>({name,v:value(id)})).filter(x=>x.v!==null).sort((a,b)=>b.v-a.v);
 paragraphs.push('APRESENTAÇÃO DO TERRITÓRIO — '+d.municipio.nome+'/'+d.municipio.uf+' (código IBGE '+d.municipio.codigoIBGE+') é analisado como espaço de residência, produção econômica e acesso desigual a serviços públicos. '+(p!==null?'O Censo 2022 registrou '+fmtN(p)+' moradores':'A população censitária não foi validada nesta consulta')+(yp!==null?', com '+fmtN(yp)+'% de pessoas de 15 a 29 anos':'')+(elder!==null?' e '+fmtN(elder)+'% de pessoas de 60 anos ou mais':'')+'. Esses perfis orientam a segmentação potencial, mas não representam automaticamente público vulnerável ou atendível.');
 paragraphs.push('CONTEXTO MACROECONÔMICO E DO MERCADO DE TRABALHO — '+(rateUF!==null?'Na UF '+d.municipio.uf+', a PNAD Contínua registrou taxa de desocupação de '+fmtN(rateUF)+'%'+(find('contexto_uf_desocupacao_total')?.period?' ('+find('contexto_uf_desocupacao_total').period+')':'')+'. '+(rateYoungUF!==null?'Para 18 a 24 anos na mesma UF, a taxa foi de '+fmtN(rateYoungUF)+'%, o que fundamenta examinar as barreiras à transição escola-trabalho. ':''):'Não foi recuperada taxa de desocupação estadual validada. ')+'Não é metodologicamente correto atribuir essas taxas ao município nem estimar seu número de desocupados a partir delas. O contexto estadual aponta condições gerais, não a situação ocupacional de cada bairro.');
 paragraphs.push('DINÂMICA MICROECONÔMICA MUNICIPAL — '+(gdp!==null?'O PIB nominal registrado pelo IBGE foi de '+money(gdp)+' ('+find('economia_pib_municipal').period+'), '+(growth!==null?'com variação nominal de '+fmtN(growth)+'% em relação ao ano anterior':'sem variação anual comparável validada')+'. A variação nominal não desconta a inflação. ':'O PIB municipal não foi obtido nesta consulta. ')+(staff!==null?'O CEMPRE identifica '+fmtN(staff)+' pessoas assalariadas em unidades locais no ano '+find('economia_emprego_assalariado_total').period+'. ':'')+'Esse estoque de postos de trabalho por local de estabelecimento não equivale ao número de residentes empregados ou desempregados.');
 if(salaried.length){
  const main=salaried.slice(0,4).map(x=>x.label.replace(/^Emprego assalariado · /,'')+' ('+fmtN(x.value)+'%)');
  paragraphs.push('ESTRUTURA PRODUTIVA E SETORIAL — Entre os ramos com maior presença de pessoas assalariadas em unidades locais figuram '+main.join('; ')+'. As participações são calculadas sobre o total de pessoal assalariado do CEMPRE, não sobre vagas abertas, PIB setorial ou contratos de aprendizagem. A concentração setorial sugere priorizar mapeamento de empregadores, suas ocupações, requisitos de escolaridade e capacidade de contratação, sem presumir existência imediata de oportunidades.');
 }
 if(low!==null || quota!==null || yp!==null){
  let t='INTERPRETAÇÃO SOCIOEDUCACIONAL — ';
  if(low!==null)t+='O percentual censitário de pessoas de 18 anos ou mais sem ensino médio concluído foi '+fmtN(low)+'% (2022); isso justifica investigar trajetórias escolares interrompidas e barreiras a qualificação, não declarar ausência de competências. ';
  if(quota!==null)t+='O potencial normativo de cota de aprendizagem profissional é de '+fmtN(quota)+' postos (MTE/SIT, 07/2026), que não correspondem a oportunidades efetivamente abertas. ';
  t+='A combinação entre presença juvenil, escolaridade e perfil setorial sustenta a hipótese de projetos de formação integrada, desenvolvimento socioemocional e articulação com empresas, condicionada à identificação de demanda efetiva e da rede educacional local.';
  paragraphs.push(t);
 }
 let social='PROTEÇÃO SOCIAL E DESIGUALDADES — ';
 if(cras!==null)social+='O Censo SUAS 2024 identificou '+fmtN(cras)+' CRAS, número que não mede suficiência de cobertura nem famílias acompanhadas. ';
 if(value('ivcad_geral')!==null)social+='O IVCAD obtido por API pública para o recorte elegível em Pernambuco apresenta índice geral '+fmtI(value('ivcad_geral'))+' (0 a 1); '+(dims.length?'as maiores dimensões relativas são '+dims.slice(0,2).map(x=>x.name+' ('+fmtI(x.v)+')').join(' e ')+'. ':'')+'O índice não é percentual de famílias vulneráveis nem cadastro universal. ';
 else social+='O IVCAD municipal não foi validado automaticamente nesta consulta; o painel público nacional do MDS pode ser consultado para aprofundamento. ';
 social+='A análise de proteção social exige cruzar perfis do Cadastro Único, presença e capacidade dos serviços, rotas de acesso e entrevistas com profissionais e usuários, evitando identificar demanda apenas pela contagem de equipamentos.';
 paragraphs.push(social);
 if(water!==null||sewer!==null)paragraphs.push('DIMENSÃO SOCIOAMBIENTAL — '+(water!==null?fmtN(water)+'% dos domicílios do Censo 2022 não tinham ligação à rede geral de água. ':'')+(sewer!==null?fmtN(sewer)+'% registravam fossa rudimentar ou buraco. ':'')+'São sinais objetivos para investigar desigualdades territoriais de infraestrutura, mas não medem risco de inundação, potabilidade ou cobertura atual de saneamento. A definição de intervenção requer georreferenciamento intraurbano, mapas de ameaças e comparação com dados recentes da defesa civil.');
 const recommend=[];
 recommend.push({title:'Hipótese A — inserção juvenil no mundo do trabalho',priority:young!==null&&quota!==null?'Prioridade para validação':'Condicional',reason:'Investigar oferta de socioaprendizagem e formação profissional articulada à escola e às empresas. Evidências: estrutura etária, potencial de cota normativo e ramos empregadores. Verificar demanda real, horários, aprendizes em execução, transporte, permanência, cotas efetivamente ocupadas e escuta de jovens antes de dimensionar metas.'});
 recommend.push({title:'Hipótese B — trajetórias educacionais e qualificação',priority:low!==null?'Prioridade para validação':'Condicional',reason:'Confrontar escolaridade censitária e perfil do emprego assalariado com oferta de EJA, educação profissional e necessidades das organizações. Definir indicadores de conclusão, permanência, encaminhamento e melhoria de competências, sem imputar desocupação municipal.'});
 recommend.push({title:'Hipótese C — proteção social intersetorial',priority:cras!==null||dims.length?'Prioridade para validação':'Condicional',reason:'Cruzar rede SUAS, CadÚnico e, quando verificável, dimensões do IVCAD com evidências territoriais e capacidade dos equipamentos. Evitar dimensionar atendimentos apenas pelo número de CRAS.'});
 recommend.push({title:'Hipótese D — articulação socioambiental',priority:water!==null||sewer!==null?'Condicional':'Em levantamento',reason:'Mapear desigualdades de acesso a saneamento por bairros, integrar defesa civil, saúde e educação ambiental. A informação disponível é censitária e não demonstra exposição atual a desastres.'});
 const missing=['MEI ativo municipal por API pública estável','número de pessoas desocupadas por município com recorte etário para todos os municípios','séries nacionais automatizadas do IVCAD'].concat(d.modules.filter(m=>m.status==='indisponivel').slice(0,4).map(m=>m.name));
 paragraphs.push('SÍNTESE PARA TOMADA DE DECISÃO — O conjunto de indicadores permite formular hipóteses programáticas, mas NÃO estabelece, isoladamente, elegibilidade de território ou viabilidade de proposta. Antes de alocar recursos, recomenda-se matriz multicritério com necessidade demonstrada, aderência ao objeto social da Rede Cidadã, capacidade da rede, parceiros, cofinanciamento, sustentabilidade e riscos operacionais. Indicadores com anos distintos não devem ser combinados como se tivessem a mesma competência.');
 paragraphs.push('LACUNAS E VERIFICAÇÕES DE CAMPO — Permanecem necessários '+missing.join('; ')+'. Recomenda-se consulta à prefeitura, SINE/CATE local, CRAS/CREAS, escolas, conselhos e atores econômicos, com documentação das fontes e atualização periódica. A hipótese deve ser reformulada caso os dados qualitativos contrariem as inferências iniciais.');
 return {mode:'regras',title:'Estudo técnico preliminar — diagnóstico socioeconômico e hipóteses de projeto',paragraphs,recommendations:recommend,
  limitations:['Análise determinística fundamentada nos indicadores efetivamente verificados; não é um parecer definitivo.',
   'Desocupação por faixa etária aqui é estadual, não municipal. Não calcular número de desempregados municipais com essa taxa.',
   'PIB é anual e nominal; emprego por setor no CEMPRE descreve pessoal assalariado por unidade local, não vagas ou demanda contratante.',
   'IVCAD nacional e MEIs ativos por município carecem de API aberta validada para esta versão.',
   'Não inferir causalidade, suficiência de serviços ou público-alvo apenas de correlações entre fontes de competências diferentes.']};
}
async function analyze(d) {
  const fallback=factualAnalysis(d);
  if(!process.env.OPENAI_API_KEY)return fallback;
  const trusted = {
    municipio:d.municipio,
    indicators:d.indicators.filter(x=>x.status==='verificado'),
    missing:d.modules.filter(x=>x.status!=='verificado').map(x=>({name:x.name,reason:x.reason})),
    sources:d.sources
  };
  try {
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST', signal:AbortSignal.timeout(20000),
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL || 'gpt-5-mini',
        store:false,
        instructions:'Você é analista sênior de políticas públicas e elaboração de projetos da Rede Cidadã. Produza diagnóstico socioeconômico crítico em português brasileiro, apoiado SOMENTE no JSON de evidências: apresentação municipal, contexto macroeconômico da UF separado do município, PIB nominal e crescimento, estrutura setorial de pessoal assalariado, juventude/escolaridade, proteção social e vulnerabilidades, hipóteses de intervenção e limites. Não apenas reproduza números: interprete relações plausíveis, riscos e perguntas a investigar, distinguindo fatos, hipóteses e validações de campo. Proibido inventar indicadores, extrapolar taxa estadual de desocupação para município, inferir pessoas desempregadas a partir de taxa estadual, chamar potencial de cota de oportunidades abertas ou confundir IVCAD com percentual de famílias vulneráveis. Não declare viabilidade conclusiva. Organize em 7 a 9 parágrafos com cabeçalhos textuais curtos em CAIXA ALTA, sem markdown, entre 450 e 750 palavras, sempre com competência das bases.',
        input:JSON.stringify(trusted),
        max_output_tokens:1900
      })
    });
    if(!r.ok)throw new Error('IA indisponível');
    const data=await r.json();
    const generated=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
    if(!generated || generated.length>7000)throw new Error('Sem resultado');
    return {mode:'ia',title:'Análise social assistida por IA',paragraphs:generated.split(/\n\s*\n/).filter(Boolean),
      recommendations:fallback.recommendations,
      limitations:['Análise interpretativa gerada por IA, sujeita a revisão técnica humana.','A IA utiliza apenas os indicadores verificados entregues nesta consulta.']};
  }catch(e){return {...fallback,limitations:[...fallback.limitations,'A chamada à IA não pôde ser concluída; usada análise técnica determinística.']}}
}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  const ibge=String(req.body?.ibge||'');
  if(!/^\d{7}$/.test(ibge))return res.status(400).json({error:'Código IBGE inválido'});
  try{
    const d=await getDiagnosis(ibge);
    const result=await analyze(d);
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({municipio:d.municipio, generatedAt:d.generatedAt,analysis:result});
  }catch(e){return res.status(502).json({error:'Não foi possível produzir análise com evidências verificadas.'})}
};
module.exports.analyze=analyze;
module.exports.factualAnalysis=factualAnalysis;