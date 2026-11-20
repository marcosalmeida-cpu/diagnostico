'use strict';
/* Estudo editorial rastreável para o Diagnóstico Territorial.
 * Nenhuma inferência numérica ou recomendação afirma causalidade ou edital aberto.
 * Regras por público, com competências e procedências de cada valor confirmado.
 */
const catalog=require('../estrategia-catalogo');
const fmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
function writeStudy(d){
 const indicators=Array.isArray(d?.indicators)?d.indicators:[];
 const found=id=>indicators.find(x=>x.id===id&&x.status==='verificado'&&Number.isFinite(x.value))||null;
 const sourceName=item=>d.sources?.[item.source]?.name||'fonte pública identificada pelo código '+item.source;
 const number=item=>item.unit==='R$'?money.format(item.value):fmt.format(item.value)+(item.unit==='%'?'%':item.unit&&item.unit!=='pontos (0–100)'?' '+item.unit:'');
 const reference=item=>sourceName(item)+'; '+(item.period&&item.period!=='—'?'competência '+item.period:'competência não informada');
 const fact=(id,prefix)=>{const x=found(id);return x?prefix+' '+number(x)+' ('+reference(x)+').':null;};
 const join=(parts)=>parts.filter(Boolean).join(' ');
 const project=ids=>ids.map(id=>catalog.projects.find(x=>x.id===id)).filter(Boolean).map(x=>({id:x.id,name:x.name,status:x.status,caution:x.caution}));
 const funding=ids=>ids.map(id=>catalog.sources.find(x=>x.id===id)).filter(Boolean).map(x=>({id:x.id,name:x.name,url:x.url,qualification:x.qualification,mechanism:x.mechanism}));
 const sections=[];
 function add({id,title,ids,paragraphs,projectIds=[],fundingIds=[],warnings=[]}){
  const evidence=[...new Set(ids)].map(found).filter(Boolean).map(x=>({id:x.id,label:x.label,value:x.value,unit:x.unit,period:x.period,source:sourceName(x),sourceUrl:d.sources?.[x.source]?.url||null}));
  sections.push({id,title,paragraphs:paragraphs.filter(Boolean),evidence,projects:project(projectIds),funding:funding(fundingIds),warnings,
   assessment:evidence.length?'Indicadores verificados disponíveis; pertinência dos projetos é preliminar.':'Sem quantitativo específico validado para este público; propostas são hipóteses a verificar em campo.'});
 }
 const city=d.municipio?.nome||'Município consultado',uf=d.municipio?.uf||'UF';
 add({id:'contexto',title:'Panorama do território e critérios de interpretação',
  ids:['populacao_censo','populacao_estimativa','economia_pib_municipal','economia_emprego_assalariado_total','contexto_uf_desocupacao_total'],
  paragraphs:[
   join(['O diagnóstico de '+city+'/'+uf+' reúne bases de diferentes competências, que não devem ser tratadas como um retrato único do mesmo ano.',
    fact('populacao_censo','O Censo contabilizou'),fact('populacao_estimativa','A estimativa oficial de população registra'),
    'O dado censitário descreve residentes no ano pesquisado; a estimativa posterior não altera retrospectivamente o perfil social do Censo.']),
   join([fact('economia_pib_municipal','O PIB nominal municipal foi de'),fact('economia_emprego_assalariado_total','O CEMPRE aponta'),
    fact('contexto_uf_desocupacao_total','Como contexto estadual, a PNAD Contínua apresentou taxa de desocupação de'),
    'PIB não é renda disponível para projetos, pessoal assalariado do CEMPRE é contado por local de estabelecimento e desemprego estadual não é taxa municipal. A prospecção deve cruzar demanda social, parceiros e capacidade executiva, sem atribuir causalidade a dados de universos distintos.'])
  ],projectIds:['trilha','socioaprendizagem-publico','apoiar-crescer'],fundingIds:['transferegov','isp']});
 const familyIds=['cadunico_familias','cadunico_pessoas','cadunico_pobreza_total','cadunico_extrema_pobreza','cadunico_extrema_pobreza_pessoas','cadunico_atualizacao_pct','suas_pbf_familias_mds','suas_bpc_mds_pagador','suas_bpc_mds_pcd','suas_bpc_mds_idoso','suas_cras_total_2024'];
 const familyHave=familyIds.some(id=>found(id));
 add({id:'familias',title:'Famílias em vulnerabilidade: CadÚnico, Bolsa Família e BPC',ids:familyIds,
  paragraphs:[
   familyHave?join([
    fact('cadunico_familias','O CadÚnico contabilizou'),fact('cadunico_pessoas','O total de pessoas cadastradas chegou a'),
    fact('cadunico_pobreza_total','No recorte de pobreza e extrema pobreza foram registradas'),
    fact('cadunico_extrema_pobreza','Na faixa de extrema pobreza há'),
    fact('cadunico_extrema_pobreza_pessoas','A contagem de pessoas em extrema pobreza foi de'),
    fact('cadunico_atualizacao_pct','A taxa de atualização cadastral declarada pela fonte é de'),
    fact('suas_pbf_familias_mds','O Bolsa Família registra'),
    fact('suas_bpc_mds_pagador','O BPC apresenta'),
    fact('suas_bpc_mds_pcd','Entre os benefícios BPC por município pagador, para pessoas com deficiência constam'),
    fact('suas_bpc_mds_idoso','Para pessoas idosas, o BPC por município pagador indica')
   ]):'Nesta consulta não foi recuperado um agregado municipal confiável e atualizado de famílias e pessoas do CadÚnico, Bolsa Família ou BPC. A ausência de resposta das bases MDS/CGU não significa inexistência de famílias elegíveis, pessoas em pobreza ou benefícios no território.',
   join([fact('suas_cras_total_2024','Quanto à infraestrutura socioassistencial, o Censo SUAS identificou'),
    'Os números cadastrais, quando disponíveis, descrevem públicos e competências distintos: não somar famílias do Bolsa Família com beneficiários do BPC como pessoas únicas. O BPC por município pagador não indica necessariamente residência. Para construir ação de inclusão social e produtiva é preciso confirmar barreiras de acesso, busca ativa, rede CRAS/CREAS, proteção de renda e condições para formação; valores cadastrais, isoladamente, não fixam metas de atendimento.'])
  ],projectIds:['pot','trilha','agentes-socioambientais','meu-trampo','rede-senior-lab60'],fundingIds:['fmas','procad','sebrae','transferegov'],
  warnings:['Bolsa Família e BPC não são universos aditivos.','Município pagador do BPC pode diferir do município de residência.']});
 const street=found('pop_rua_cadunico_2021'),streetCurrent=found('cadunico_pop_rua');
 add({id:'pop-rua',title:'Pessoas em situação de rua',ids:['pop_rua_cadunico_2021','cadunico_pop_rua','pop_rua_atendimento'],
  paragraphs:[
   join([street?fact('pop_rua_cadunico_2021','A série histórica do Observatório Pop Rua/UFMG registrou'):'Não existe nesta consulta quantitativo municipal confirmado da população cadastrada em situação de rua no histórico de 2021.',
    streetCurrent?fact('cadunico_pop_rua','O cadastro municipal atual informou'):'O quantitativo mais recente de famílias em situação de rua não foi integrado de forma verificável.',
    'A série de 2021 representa pessoas registradas no CadÚnico, e não um censo total nem a realidade corrente. Não extrapolar a observação histórica para o ano da consulta.']),
   'É necessário relacionar abordagem social, Centro POP, acolhimento, documentação, saúde e preferências das pessoas atendidas antes de propor percursos formativos. Uma iniciativa de inclusão produtiva deve estar vinculada à proteção social e à adesão voluntária, não à presunção de disponibilidade para trabalho derivada da contagem cadastral.'
  ],projectIds:['pot','trilha'],fundingIds:['fmas','transferegov','isp']});
 add({id:'juventude',title:'Juventude, educação e aprendizagem profissional',
 ids:['jovens_15_29','jovens_15_29_pct','jovens_15_19','sem_medio_completo_18mais_pct','educacao_nao_frequencia_18a24','educacao_inep_2025_medio','mte_potencial_cota','contexto_uf_desocupacao_18_24'],
 paragraphs:[
  join([fact('jovens_15_29','O município contava com'),fact('jovens_15_29_pct','A participação de 15 a 29 anos na população era de'),
   fact('sem_medio_completo_18mais_pct','Entre residentes de 18 anos ou mais, a proporção sem ensino médio concluído correspondia a'),
   fact('educacao_nao_frequencia_18a24','A não frequência escolar na faixa de 18 a 24 anos era de'),
   'As faixas etárias e os denominadores são diferentes: escolaridade do grupo 18+ não descreve exclusivamente os jovens de 18 a 24 anos.']),
  join([fact('educacao_inep_2025_medio','O Censo Escolar das escolas instaladas no município aponta'),
   fact('mte_potencial_cota','O potencial normativo de cota de aprendizagem é de'),
   fact('contexto_uf_desocupacao_18_24','Na UF, a desocupação dos 18 a 24 anos alcançou'),
   'A relação entre escolaridade, potencial de aprendizagem e presença de empregadores sustenta investigar trilhas de formação e acompanhamento socioemocional. Entretanto, cota potencial não é oportunidade contratante aberta; matrículas no município não representam necessariamente todos os residentes; e a desocupação estadual não pode ser atribuída ao município.'])
 ],projectIds:['socioaprendizagem-publico','conecta','start','trabalho-escola','trilha','jpf'],fundingIds:['fia','mte','mpt','isp','transferegov']});
 add({id:'idosas',title:'Pessoas idosas: autonomia, cuidados e inclusão',
 ids:['pessoas_idosas_60mais','pessoas_idosas_60mais_pct','mulheres_idosas_60mais','suas_bpc_mds_idoso'],
 paragraphs:[
  join([fact('pessoas_idosas_60mais','O Censo identificou'),fact('pessoas_idosas_60mais_pct','A participação das pessoas com 60 anos ou mais era de'),
   fact('mulheres_idosas_60mais','Entre elas, o Censo contou'),fact('suas_bpc_mds_idoso','O BPC destinado a pessoas idosas por município pagador informou'),
   'A distribuição demográfica e a proteção de renda refletem universos diferentes e não permitem identificar, por si, dependência funcional ou desejo de participação produtiva.']),
  'A análise deve confrontar oferta de convivência, mobilidade, acesso digital, condições de cuidado e interesse manifestado pelas próprias pessoas idosas. Projetos de autonomia, cidadania digital ou geração de renda devem respeitar a preservação dos direitos e a legislação de benefícios; a quantidade de idosos não constitui prova de demanda por cursos ou trabalho.'
 ],projectIds:['rede-senior-autonomia','rede-senior-trabalho','rede-senior-lab60'],fundingIds:['idoso','fmas','isp']});
 add({id:'mulheres',title:'Mulheres e desigualdades de acesso a oportunidades',
 ids:['populacao_mulheres','mulheres_pct','jovens_mulheres_15_29','mulheres_idosas_60mais'],
 paragraphs:[
  join([fact('populacao_mulheres','Segundo o quesito sexo do Censo, a população de mulheres compreendia'),
   fact('mulheres_pct','A participação feminina era de'),fact('jovens_mulheres_15_29','Na faixa de 15 a 29 anos, foram identificadas'),
   fact('mulheres_idosas_60mais','Na faixa de 60 anos ou mais, foram identificadas'),
   'Esse recorte censitário não fornece medida municipal de violência, trabalho de cuidados ou identidade de gênero, nem demonstra vulnerabilidade individual.']),
  'Para formular ações de inserção no mundo do trabalho é necessário examinar responsabilidades familiares, acesso a equipamentos de cuidado, renda, qualificação e participação no mercado de trabalho com fontes específicas e escuta no território. As linhas de formação e empreendedorismo podem ser adaptadas, mas sua prioridade depende de evidência direta de barreiras e das condições reais de participação.'
 ],projectIds:['meu-trampo','trilha','start','pot'],fundingIds:['fmas','sebrae','isp','transferegov']});
 add({id:'lgbt',title:'Pessoas LGBTQIAPN+: direitos e inclusão sem estimativas indevidas',
 ids:['lgbt_servicos','lgbt_denuncias'],
 paragraphs:[
  join([fact('lgbt_servicos','A base municipal homologada de serviços reportou'),fact('lgbt_denuncias','A base de denúncias reportou'),
   'O Censo Demográfico 2022 não apresenta contagem municipal por orientação sexual e identidade de gênero; por isso não é correto aplicar proporções nacionais à população do município para produzir números locais.']),
  'A pertinência de ações de inclusão e formação exige articulação com organizações de direitos humanos e movimentos locais, avaliação de barreiras de discriminação e proteção de dados sensíveis. Na falta de uma base municipal representativa, qualquer proposta é uma hipótese de escuta e pactuação, sem estimativa fictícia de tamanho do público.'
 ],projectIds:['trilha','conecta','start'],fundingIds:['isp','transferegov']});
 add({id:'prisional',title:'Sistema prisional: pessoas custodiadas e egressas',
 ids:['prisional_unidades_estabelecimentos','prisional_capacidade_total','prisional_pessoas_custodiadas','prisional_trabalho_pessoas','prisional_educacao_pessoas','prisional_egressos_atendidos'],
 paragraphs:[
  join([fact('prisional_unidades_estabelecimentos','O levantamento de estabelecimentos prisionais registra'),fact('prisional_pessoas_custodiadas','Nas unidades localizadas no município estão contabilizadas'),
   fact('prisional_trabalho_pessoas','Em atividades laborais nas unidades locais constam'),fact('prisional_educacao_pessoas','Em atividades educacionais constam'),
   fact('prisional_egressos_atendidos','Os serviços de atenção à pessoa egressa contabilizaram'),
   'Os dados nacionais do SISDEPEN/SENAPPEN e os de inspeção do CNJ ainda dependem de vinculação municipal homologada quando não há quantitativo apresentado. O local de custódia ou do serviço não demonstra o domicílio anterior ou posterior da pessoa.']),
  'O desafio de reintegração envolve documentação, atendimento especializado, continuidade escolar, estigma, apoio psicossocial e articulação com empregadores. A formação socioeducacional de pessoas egressas pode ser proposta em diálogo com serviços penais e rede do SUAS, mas não se deve projetar a quantidade de egressos residentes a partir da lotação de presídios locais.'
 ],projectIds:['trilha','pot'],fundingIds:['pnape','alvorada','transferegov','isp']});
 add({id:'socioeducativa',title:'Adolescentes em medidas socioeducativas: LA e PSC',
 ids:['mse_la_acompanhamento','mse_psc_acompanhamento','mse_sinase_municipio','mse_meio_aberto','jovens_15_19'],
 paragraphs:[
  join([fact('mse_la_acompanhamento','O Registro Mensal de Atendimentos do CREAS informou acompanhamento em LA de'),
   fact('mse_psc_acompanhamento','O acompanhamento em PSC registrou'),
   fact('jovens_15_19','Como contexto demográfico, o Censo registrou'),
   'Os dados de 15 a 19 anos não correspondem ao número de adolescentes em medidas. Registros mensais de LA/PSC precisam de metodologia própria, sem somar meses como pessoas únicas. Agregados estaduais do SINASE não podem ser imputados ao município.']),
  'O planejamento deve respeitar o Sistema de Garantia de Direitos, o Plano de Atendimento Socioeducativo e os fluxos autorizados de CREAS, escola, família e justiça. Trilhas de projeto de vida, letramento digital e aprendizagem profissional podem ser articuladas, mas dependem da demanda identificada pelo acompanhamento local e não de inferência demográfica.'
 ],projectIds:['jpf','conecta','trilha','socioaprendizagem-publico'],fundingIds:['fia','mpt','fmas','isp']});
 add({id:'articulacao',title:'Leitura transversal: viabilidade e estratégia de financiamento',
 ids:['orcamento_v5_assistencia_total','orcamento_assistencia','orcamento_v5_crianca_adolescente','orcamento_v5_pessoas_idosas','orcamento_v5_propostas_federais_2026'],
 paragraphs:[
  join([fact('orcamento_v5_assistencia_total','A execução de Assistência Social declarada no SICONFI foi de'),
   fact('orcamento_assistencia','Outra visão de despesas liquidadas de assistência social registra'),
   fact('orcamento_v5_crianca_adolescente','A subfunção criança e adolescente contabilizou'),
   fact('orcamento_v5_pessoas_idosas','A subfunção pessoa idosa contabilizou'),
   'São classificações orçamentárias, possivelmente sobrepostas; não somar valores de escopos diferentes nem concluir que representem caixa livre para contratos, editais ou transferências a OSCs.']),
  'Para prospecção, a Rede Cidadã pode examinar FMAS/FEAS, fundos de direitos, transferências públicas, parcerias com empresas e investimentos sociais privados, sempre segundo o público, a causa e as regras do instrumento. A decisão requer atualização de CadÚnico/Bolsa Família/BPC, consulta a LOA/QDD e saldos efetivos de fundos, escuta de gestores, diligência jurídica, dimensionamento de equipe e validação de metas. Não há nesta análise confirmação de edital aberto, destinação orçamentária ou viabilidade aprovada.'
 ],projectIds:['agentes-justica-climatica','agentes-socioambientais','meu-trampo','apoiar-crescer'],fundingIds:['fmas','fia','idoso','transferegov','isp']});
 const limitations=[
  'As competências citadas são aquelas dos indicadores apresentados; data de consulta não substitui ano da pesquisa.',
  'Valores ausentes, nulos ou não homologados jamais significam população zero.',
  'Censo 2022 e fontes mensais, estaduais, municipais e registros de estabelecimentos têm universos diferentes; não se deve extrapolar ou somar automaticamente.',
  'Cota de aprendizagem é potencial normativo, não oportunidade aberta. Pagador do BPC não necessariamente identifica residência.',
  'Dados de unidades prisionais não indicam residência de pessoas custodiadas ou egressas. SINASE por UF não é municipal.',
  'Os projetos e financiamentos apresentados são hipóteses de convergência e prospecção, não contratos, elegibilidade ou editais abertos.',
  'A análise indica caminhos para validação institucional e escuta territorial; não substitui parecer técnico, orçamento, diligência e deliberação de financiadores.'
 ];
 const recommendations=sections.filter(x=>x.projects.length&&x.id!=='contexto'&&x.id!=='articulacao').map(x=>({
  title:x.title,priority:x.evidence.length?'Hipótese contextualizada':'Em validação',
  reason:'Projetos a considerar: '+x.projects.map(p=>p.name).join('; ')+'. Canais a consultar: '+x.funding.map(f=>f.name).join('; ')+'. '+x.assessment
 }));
 return {mode:'estudo_tecnico',title:'Estudo interpretativo da realidade socioterritorial por públicos',sections,
   paragraphs:sections.flatMap(x=>x.paragraphs.map((p,i)=>(i===0?x.title.toUpperCase()+' — ':'')+p)),
   recommendations,limitations,methodology:'Leitura editorial com regras de interpretação, dados numéricos verificados, procedência, competência e limitações por público. Sem geração livre de números ou programas.'};
}
module.exports={writeStudy};
