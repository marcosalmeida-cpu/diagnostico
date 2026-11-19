# V12 — Sistema Prisional, fontes de financiamento e projetos convergentes
**Data:** 19/11/2026 · **Produto:** Diagnóstico Territorial Integrado da Rede Cidadã.

## Implementação
- Navegação desktop/mobile ganhou **Sistema Prisional**, **Financiamento** e **Projetos** sem criar outro domínio.
- Eixo temático **Sistema Prisional** (7 indicadores), público **Egressos**, detalhamento de **LA** e **PSC** no público **MSE**, e POP Rua histórico também em SUAS.
- Área **Financiamento** relaciona causas e públicos com **11 fontes/mecanismos potenciais**, páginas oficiais e cautelas de elegibilidade. **Não** informa falsamente editais abertos.
- Área **Projetos** contém **10 modelos e propostas**, diferencia referências institucionais e ideias *a estruturar*, sugerindo causas e financiadores para prospecção.
- A relação com cada município utiliza exclusivamente indicadores numéricos com `status=verificado`. Ausência de valor não equivale a zero. Um indicador sozinho não comprova demanda ou viabilidade.
- Abertura do painel não gera falsa informação municipal; preserva histórico de rastreabilidade da v11 e o perfil visual da Rede Cidadã.

## Fontes e situação dos dados por município
| Causa / dado | Fonte | Universo territorial | Situação V12 |
|---|---|---|---|
| CadÚnico: famílias, pessoas, pobreza/extrema pobreza e faixas de renda | [MDS / Dados e Ferramentas](https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/) / MI Social | Municípios com agregados publicados por competência | Campos já existentes na v11; API federal testada respondeu HTML de manutenção em 19/11. Números nulos se não houver resposta válida |
| Bolsa Família: famílias beneficiárias e repasses | [VIS DATA / MDS](https://aplicacoes.cidadania.gov.br/vis/data3/data-explorer.php) e MI Social; CGU com autenticação de servidor | Município e competência mensal | Indicadores existentes na v11; extração automática com pendências de acesso. Não inventar beneficiários |
| BPC: total, pessoa idosa e PCD | MDS / MI Social, [painéis e catálogo](https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/) | Município pagador, NÃO necessariamente residência | Indicadores existentes na v11, sujeitos à disponibilidade da fonte; cuidado com universo |
| POP Rua | [OBPopRua/Polos-UFMG](https://obpoprua.direito.ufmg.br/repositorio_dados_tabelas.html), com série histórica originada no CadÚnico, e CECAD/MDS | Observações em 3.870 municípios na série 2012–2021; 2.962 observações confirmadas para 2021 | Valor histórico municipal 2021 integrado na v11 onde homologado; famílias atuais ainda pendentes de integração |
| LA e PSC | [RMA/CREAS / MDS](https://www.gov.br/mds/pt-br/acoes-e-programas/suas/gestao-do-suas/vigilancia-socioassistencial-1/registro-mensal-de-atendimentos-2013-rma) | Registros de serviços municipais, com cautela sobre fluxo mensal | Novos IDs `mse_la_acompanhamento` e `mse_psc_acompanhamento`; sem valor numérico até homologar arquivo nacional |
| Unidades, capacidade, custódia, educação e trabalho | [SISDEPEN 2025/2, CSV / SENAPPEN](https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados/2025) | Município de LOCALIZAÇÃO da unidade, não município de residência | Nova aba e IDs; importação nacional e conciliação de código IBGE pendentes; sem total inventado |
| Inspeções prisionais | [Geopresídios / CNJ](https://geopresidios.cnj.jus.br/) | Unidade georreferenciada / estabelecimento | Fonte mapeada; API pública descrita pelo CNJ, mas sem esquema e chaves homologados |
| Inspeções do socioeducativo | [CNIUPS / CNJ](https://www.cnj.jus.br/sistema-carcerario/cadastro-nacional-de-inspecao-de-unidades-e-programas-socioeducativos-cniups/) | Unidades e programas socioeducativos | Fonte mapeada; recorte municipal em validação |
| Pessoas egressas e serviços | [PNAPE / SENAPPEN](https://www.gov.br/senappen/pt-br/acesso-a-informacao/politicas-acoes-e-programas/politicas-penais/atencao-a-pessoa-egressa) | Local do serviço e seus atendimentos; não necessariamente domicílio | Fontes e linha de projeto incluídas; quantidades por município pendentes de publicação compatível |

### Critérios exigidos antes de mostrar indicadores prisionais
1. Identificar unidade prisional por município IBGE 7 dígitos, conforme local de funcionamento, sem inferir domicílio dos presos.
2. Confirmar que a mesma unidade e o mesmo semestre não são somados diversas vezes por regime ou sexo.
3. Conferir respostas ausentes e cobertura por UF e ciclo (não presumir zero em unidade sem resposta).
4. Validar presença de pessoa custodiada, vagas, trabalho e educação no mesmo universo e competência, preservando metadados.
5. Versão/competência/fonte/URL de download devem constar na auditoria. Sem inspeção de qualidade, o valor segue nulo.
6. LA/PSC: não somar totais mensais como pessoas únicas sem metodologia de deduplicação.
7. Nenhum dado individualizado ou nominal é necessário para este projeto; usar apenas agregados públicos.

### Estratégia de financiamento
A seção **não é um radar de editais em tempo real**. Fontes e mecanismos são potenciais e precisam de checagem de elegibilidade para o público e a OSC, além de disponibilidade orçamentária. Para SUAS/FNAS, repasse fundo a fundo vai ao ente federativo e só pode chegar à OSC pela forma de execução juridicamente admitida. Para FIA/Fundo da Pessoa Idosa, aprovação do conselho e ato de financiamento são indispensáveis. Para PNAPE/FUNPEN, fluxo de financiamento depende do ente, do instrumento e do edital. Para aprendizagem profissional, potencial de cota não significa oportunidade aberta. O programa Projeto Alvorada da SENAPPEN utiliza TED com instituições da Rede Federal; não é subvenção automática a OSC.

### Critério de decisão para a Rede Cidadã
**Dados públicos atuais e validados > diagnóstico do território > público e causa > metodologia adequada > fonte de financiamento habilitada > proposta com orçamento e capacidade.**

A aplicação pode exibir *compatibilidade temática* quando o município tem indicadores gerais, mas nunca classifica automaticamente a cidade como elegível, nem inventa demanda por causa da ausência de dados.

**Pendências de dados:** baixar e versionar CSV SISDEPEN 19º ciclo em rotina reproduzível; reconciliar chaves e cobertura; obter extratos estruturados nacionais de RMA e MDS com competência; somente depois liberar valores por município. Nenhum extrato parcial de uma UF substitui cobertura nacional.
