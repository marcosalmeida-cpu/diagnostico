# Diagnóstico Territorial 3.0 — especificação funcional e técnica

**Projeto:** Rede Cidadã — Inteligência Socioterritorial  
**Repositório:** https://github.com/marcosalmeida-cpu/diagnostico  
**Produção preservada até QA:** https://diagnostico-parceirizacao.vercel.app  
**Natureza:** dashboard compacto para decisões preliminares sobre projetos sociais, com fontes públicas e rastreabilidade.  
**Design system:** Guia da Marca Rede Cidadã, setembro/2025; Roboto, #0322D6, #65C8F3, #FF001F e #FFC000. Símbolo original: assets/rede-cidada-rostinho.svg.

## 1. Decisões de UX

1. Manter barra lateral desktop de 80 px apenas com o rosto original e ícones de traços finos; em móvel, barra inferior acessível.
2. Reduzir a capa a um bloco introdutório de aproximadamente 200 a 260 px de altura útil no desktop e 280 a 360 px no celular.
3. Campo de busca pelo município/código IBGE, com a mesma validação atual e exemplos clicáveis.
4. Ao concluir a consulta, rolar suavemente até o início do painel analítico, respeitando prefers-reduced-motion.
5. Criar **duas faixas horizontais**:
   - Eixos temáticos: Demografia; Socioeducação; SUAS; Trabalho e Renda; Justiça Climática; Socioaprendizagem.
   - Públicos prioritários: POP Rua; Juventude; Pessoas Idosas; LGBTQIAPN+; Mulheres; Medida Socioeducativa.
6. As faixas compartilham UM painel de indicadores. A seleção em uma desativa a seleção na outra, evitando 12 blocos verticais.
7. Todos os grupos existem mesmo sem indicador validado, com mensagem explícita de lacuna e fonte em levantamento. A ausência de dado **nunca** é representada como zero.
8. Exibir no máximo **quatro KPIs prioritários** e **seis linhas de indicadores** de início; botão 'Ver todos' revela o restante dentro do grupo.
9. Ao lado da listagem, um resumo de disponibilidade **apenas do conjunto demonstrativo**, nunca uma afirmação de cobertura integral do território.
10. Análise social e catálogo de fontes ficam abaixo do painel como seções compactas/recolhíveis, sem alterar os endpoints e mecanismos auditáveis já funcionando.
11. Exportação de relatório PDF permanece com dados reconsultados no servidor. Futuramente adicionar "escopo do relatório: completo / eixo ativo / público ativo", sem suprimir lacunas.

## 2. Componentes e IDs semânticos

| Componente | Responsabilidade | Comportamento |
| --- | --- | --- |
| SidebarRail | Logotipo e navegação institucional | 80 px desktop; ícones com rótulos de leitor de tela |
| TerritoryHero | Município e pesquisa | compacta; sem visual decorativo volumoso |
| TerritoryStatus | Nome, IBGE, consulta e competências | uma linha de contexto |
| ThematicTabs | Seis eixos temáticos | horizontal, overflow-x auto, scroll-snap |
| AudienceTabs | Seis públicos prioritários | idem, estilo secundário |
| ActiveGroupHeader | Nome, descrição, disponibilidade | muda ao selecionar grupo/público |
| FeaturedMetrics | Até quatro cards | valores só da API; fontes e períodos |
| GroupIndicatorList | Até seis linhas com expansão | evita listas verticais extensas |
| IntegritySummary | validado/total demonstrativo | escopo indicado |
| SocialAnalysis | síntese e interpretação | linguagem hipotética, revisão humana |
| SourceAudit | fontes por módulo e sua situação | preservar enlaces oficiais |
| PdfAction | PDF institucional com todas as informações | usa /api/relatorio; nunca gera via screenshot |

## 3. Classificação de dados existentes (29 métricas em api/diagnostico.js)

### Eixos temáticos

| Eixo | Indicadores já ligados à API | Integrações a validar |
| --- | --- | --- |
| Demografia | populacao_censo, populacao_estimativa, area, densidade, jovens_15_29, jovens_15_29_pct | sexo, idade 60+, composição domiciliar, cor/raça por recorte compatível |
| Socioeducação | alfabetizacao_15mais, sem_medio_completo_18mais, sem_medio_completo_18mais_pct, superior_completo_18mais_pct, ideb_iniciais_publica_2025, ideb_finais_publica_2025, orcamento_educacao | matrículas e evasão com recorte municipal consistente |
| SUAS | suas_cras_total_2024, suas_cras_2500_2024, suas_cras_3500_2024, suas_cras_5000_2024, orcamento_assistencia | CadÚnico, IVCAD, CREAS, Centro POP, acolhimento, RMA; validar metodologia |
| Trabalho e Renda | nenhum indicador específico de vínculos formais integrado | RAIS e Novo Caged municipal com competência e tratamento de revisões |
| Justiça Climática | nenhum indicador climático integrado | S2ID (desastres reconhecidos), INPE (queimadas), SINISA/SNIS (saneamento); validação municipal |
| Socioaprendizagem | mte_potencial_cota, mte_cota_comercio, mte_cota_servicos, mte_cota_industria, mte_cota_agricultura, mte_cota_transportes, mte_cota_outros | vínculos formais de aprendizes, admissões, redes locais e demanda comprovada |

**Métricas complementares já existentes:** orcamento_saude (despesa liquidada em Saúde), a exibir futuramente como contexto transversal de financiamento público, nunca como indicador direto de assistência social.

### Públicos prioritários

| Público | Evidências diretas existentes | Contexto que pode ser exibido com rotulagem explícita | O que falta |
| --- | --- | --- | --- |
| POP Rua | nenhuma | CRAS e despesa de Assistência Social **não** mensuram população em situação de rua | CadÚnico específico, Centro POP e serviços aferidos |
| Juventude | jovens_15_29, jovens_15_29_pct, jovens_15_19, jovens_20_24, jovens_25_29 | escolaridade, IDEB e potencial de cota são indicadores territoriais correlatos, não quantitativo de jovens em vulnerabilidade | matrícula, trabalho jovem, CadÚnico por idade |
| Pessoas Idosas | nenhuma (a API ainda não traz 60+) | demografia geral não substitui 60+ | população 60+, BPC idoso e rede de atenção |
| LGBTQIAPN+ | nenhuma | equipamentos SUAS são contexto universal, sem inferir pertencimento LGBTQIAPN+ | bases públicas agregadas comparáveis com segurança |
| Mulheres | nenhuma (a API ainda não traz recorte por sexo) | alfabetização total não equivale a alfabetização feminina | população por sexo, emprego formal feminino, indicadores de violências públicos com cautela |
| Medida Socioeducativa | nenhuma | faixa 15–19 não equivale a adolescentes em medida socioeducativa | Levantamento Anual SINASE e agregados publicáveis por território |

**Nunca inferir números específicos de raça, identidade de gênero, orientação sexual, situação de rua, violência ou cumprimento de medida socioeducativa de totais populacionais genéricos.**

## 4. Fontes oficiais, tarefas e critérios de integração

1. **IBGE SIDRA/Censo 2022 — demografia por sexo e 60+:** validar universo, tabela, categorias, soma dos grupos, ano e denominador. Condição de publicação: resultados diretos em pelo menos quatro municípios diversos, com documentação.
2. **MDS/SAGICAD/CadÚnico/IVCAD:** https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/ — mapear arquivo/endpoint público, competência, codificação IBGE e confiabilidade. Não automatizar scraping de sistemas autenticados, não tratar famílias como pessoas.
3. **Censo SUAS/RMA:** https://sagicad-mds.github.io/indicadores-de-desenvolvimento/index.html — aproveitar leitor de relatório municipal existente e expandir apenas campos estruturados com unidades claras; distinguir equipamentos, capacidade e atendimentos.
4. **MTE/RAIS/Novo Caged:** https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/acoes-e-programas/programas-projetos-acoes-obras-e-atividades/estatisticas-trabalho/microdados-rais-e-caged — escolher agregados mensais seguros e manter revisões, método e categorias; **não confundir saldo, estoque e número de oportunidades**.
5. **Justiça Climática:** https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil/sistema-integrado-de-informacoes-sobre-desastres ; https://data.inpe.br/queimadas/ ; https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/snis/produtos-do-snis/painel-de-informacoes — não misturar ano civil e ano-base, contagens de focos e área queimada, reconhecimentos administrativos e eventos observados.
6. **Públicos prioritários:** https://www.gov.br/mdh/pt-br/acesso-a-informacao/dados-abertos — habilitar apenas agregados municipais comprovados; para SINASE a fonte adequada deve respeitar as restrições do SIPIA e a publicação oficial do Levantamento Anual.

## 5. Estados e integridade

- VALIDADO: fonte oficial vinculada, valor não nulo e coerente, competência, recorte e unidade determinados.
- PARCIAL: somente parte do grupo possui métricas validadas; não equivale a cobertura temática plena.
- EM IMPLANTAÇÃO: existe fonte pública promissora, mas não há integração municipal verificada.
- INDISPONÍVEL: a consulta falhou, a fonte não possui o recorte ou sua validação rejeitou o resultado.
- ZERO OBSERVADO: exibir 0 somente quando fonte oficial fornece explicitamente 0 e a regra de validação permite.

Por indicador, manter: id, label, value, unit, period, source, note, status e, quando cabível, população de referência/denominador. Fonte e competência devem acompanhar cada número, não apenas um rodapé geral.

## 6. Interação e responsividade

- Desktop: duas barras horizontais acima do painel; a primeira pode ficar sticky ao rolar na área analítica; sidebar existente permanece.
- Mobile: as duas barras com rolagem horizontal, área de toque mínima de 44×44 px e rolagem lateral sem quebrar os nomes. Barra inferior institucional permanece.
- A seleção deve atualizar todos os KPIs e a listagem sem recarregar município nem trocar endereço.
- Estado inicial: Demografia; seleção de público mantém o mesmo diagnóstico e troca apenas o filtro visual.
- Ao trocar município: manter filtro selecionado, atualizar competência e valores, limpar análise antiga; proibir dados do município anterior.
- Teclado: elementos button, foco visível e aria-pressed/aria-current, tabulação natural; sem controles decorativos.
- Nunca inserir conteúdo não confiável com innerHTML. Construir textos de API com textContent.
- Manter navegação sem dependências pesadas nem bibliotecas para ícones já vetorizados.

## 7. Relatório PDF

**Obrigatório:** manter o PDF completo com a visão global, análise crítica, fontes, competências e lacunas, sem substituir ausência por zero.  
**Evolução prevista:** capa, resumo executivo, seis capítulos temáticos, seis capítulos por público (somente quando houver evidências diretas), análise estratégica para Rede Cidadã, recomendações condicionadas, limites e apêndice de fonte/metodologia.  
**Decisão de escopo:** o download deve indicar claramente se é completo ou do filtro ativo; nunca afirmar que a seleção visual limitada equivale ao relatório integral.

## 8. Critérios de aceite da V3

1. A capa fica substancialmente menor que a V2 (desktop e celular).
2. Após consulta válida, viewport rola até o painel de indicadores.
3. Existem seis eixos e seis públicos; somente um painel permanece visível.
4. Todos os atuais 29 indicadores continuam alcançáveis sem perda, inclusive os complementares em seção de auditoria/relatório.
5. Filtros sem dados diretos mostram explicação e fontes pendentes; não mostram números inventados.
6. Até quatro cards e seis linhas inicialmente, com expansão explícita.
7. IBGE, INEP, MTE, MDS e SICONFI preservam os períodos de origem.
8. Testes unitários de mapeamento, estados e seleção; validar ao menos quatro municípios.
9. Verificar visualmente desktop (1440 px) e celular (390 px), sem overflow vertical acidental ou sobreposição.
10. PDF exportado com valores atuais reconsultados, ao menos cinco páginas, texto dentro das margens e marca oficial.
11. Publicar pela branch main somente após QA; domínio fixo não muda e o site legado permanece intocado.

## 9. Ordem de execução

**Release A (UI, sem alterar fontes):** barras, painel único, hero compacto, indicadores agrupados, filtros, estados de lacuna, testes.  
**Release B (dados prioritários):** IBGE sexo/60+; CadÚnico e complementos SUAS mediante extração comprovada.  
**Release C (trabalho/clima):** RAIS/Novo Caged e fontes climáticas municipais validadas.  
**Release D (públicos e análise):** métricas diretas sensíveis, análise social assistiva com revisão humana, PDF com capítulos temáticos e público.

**Não negociáveis:** origem verificável, competência expressa, ausência ≠ zero, respeito à LGPD, nenhuma métrica fictícia e nenhuma inferência de demanda efetiva a partir de potencial normativo.
