# Integração territorial — IVCAD, saneamento e Novo Caged (18/11/2026)

## Limite metodológico e geográfico
A plataforma preserva a versão **B Premium**; este lote altera somente dados, análise, PDFs e catálogo das fontes. Todos os valores têm universo/escala explícitos.

| Fonte | Escopo | Competência | Indicadores novos | Critério de validação |
| --- | --- | --- | ---: | --- |
| IBGE/SIDRA 6803, 6805 (domicílios água/esgoto) | Nacional, por município IBGE | 2022 | 7 | Domícilios 2022, soma de categorias mutuamente exclusivas e denominadores iguais |
| IVCAD — MDS, base publicizada por SEPLAG-PE/Condepe-Fidem | **Apenas Pernambuco** (185 municípios) | 2026 | 9 | Código IBGE válido, 0–1, índice ≈ média de seis dimensões, famílias/pessoas inteiros positivos |
| Novo Caged — MTE, série ajustada publicizada por Condepe-Fidem | **Apenas Pernambuco** (183 municípios com movimento informado) | 09/2026 | 4 | Admissões e desligamentos inteiros não negativos, saldo = admissões - desligamentos, salário médio nominal disponível ou null |

**Total do catálogo de IDs:** 59, sendo 39 anteriores, 7 novos nacionais, 9 IVCAD PE e 4 Novo Caged PE. **Total efetivamente consultado fora de Pernambuco:** 46 (não há indicadores IVCAD/Caged PE apresentados como indisponíveis para outras UFs). Os estados fora de PE precisam de novas fontes.

## IVCAD — índice de vulnerabilidade das famílias
- Fonte MDS: https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/ivcad/ivcad
- Catálogo oficial estadual: https://www.dados.pe.gov.br/pt_BR/dataset/indice-de-vulnerabilidade-do-cadastro-unico-ivcad-pernambuco
- CSV original: https://dados.pe.gov.br/dataset/2d11e686-1e8e-4d10-9cac-33d24b9d9e1f/resource/4e5a53bc-7348-4f1c-9ef1-816e12ef9662/download/ivcad_pe_municipios.csv
- SHA256 do CSV: \`cbe89ca8965dbf3c04054a1e503d98011aa9c0d4813026b351e205d994b603cd\`.
- Extração válida: 185 registros estaduais, 2026; snapshot imutável em \`data/ivcad2026pe/\`, sem dados pessoais.
- Índices: geral, necessidade de cuidados, primeira infância, crianças e adolescentes, trabalho e qualificação, disponibilidade de recursos e condições habitacionais.
- O índice geral é validado contra a média das seis dimensões com tolerância 0,0001 devido ao arredondamento do arquivo estadual.
- Os campos \`familias\` e \`pessoas\` pertencem **ao universo da extração do índice**, não necessariamente ao total das famílias/pessoas do Cadastro Único.
- A proporção \`percent_relativo_ao_censo_2022\` foi **descartada**: em cinco municípios excede 100%, pois os universos não são diretamente equivalentes. Não usar como cobertura territorial do Cadastro Único.
- O IVCAD é índice de intensidade (0 a 1) de vulnerabilidade familiar, **não** proporção de famílias vulneráveis, não mede pobreza exclusivamente e não constitui decisão automática de seleção.
- Exemplo verificado: Recife/PE, geral \`0,2657019418\`, universo 304.844 famílias, 630.163 pessoas, seis dimensões completas.

## Novo Caged — movimentação mensal do emprego formal
- Fonte MTE (curadoria pública estadual): https://www.cf.pe.gov.br/observatorio/fontes/mte_novo_caged
- Competência: **setembro de 2026** (último mês retornado na coleta do lote, 18/11/2026). Banco municipal 2026 foi filtrado exclusivamente pelo mês 9.
- Quatro séries: admissões, desligamentos, saldo e salário médio **nominal** de admissão.
- SHA256 dos quatro arquivos JSON exportados na extração: \`admissoes=b576dcf3d9d4b241fb3a98862233cfbc7e58d3c1a94286c3bb745faf37d7220d\`; \`desligamentos=c9b448958d9507a865daad989399eea932054228e559607baa8aec8014915c7c\`; \`saldo=34a9ccb185cb343c26998d088dfa514f0d38b07dd6fea500708d3c10961d753c\`; \`salario=56ecc457d8e86e2c2cf577ffb3f075dd998bece420cb10a7fe83100d7af3c9ad\`.
- 183 municípios com séries de emprego, 179 com salário médio de admissão informado; em quatro deles o salário permanece \`null\`.
- Exemplos: Recife/PE, admissões 22.099, desligamentos 19.033, saldo +3.066, salário médio R$ 2.366,83. Caruaru/PE, admissões 3.574, desligamentos 4.670, saldo −1.096, salário médio R$ 2.285,44.
- **Não tratar admissões como oportunidades abertas**, saldo como estoque de empregos ou salário nominal de admissão como salário médio de todas as pessoas ocupadas.
- Snapshot agregado, sem identificação de trabalhadores, preservado em \`data/caged2026pe/\`.

## Saneamento, água e esgotamento — Censo 2022
- IBGE/SIDRA tabela 6803 (água): https://sidra.ibge.gov.br/tabela/6803
- IBGE/SIDRA tabela 6805 (esgoto): https://sidra.ibge.gov.br/tabela/6805
- Unidade de análise: domicílios particulares permanentes ocupados. As consultas de ambas as tabelas precisam referenciar o mesmo município e mesmo total de domicílios.
- Água: total 72129; rede principal 72144; ligação, uso principal alternativo 72145; sem ligação 72153. Validar soma total.
- Esgoto: total 46292; categoria agregada rede geral/pluvial ou fossa ligada 46290; subgrupos 72110 e 72111; demais destinos 72112,72113,92858,72114,72115,92861. Validar soma de classes e subcategorias.
- Não confundir ligação à rede de água com potabilidade; ligação de esgoto com tratamento; condições sanitárias de 2022 com risco climático atual. O grupo **Justiça Climática** utiliza essas métricas como **contexto estrutural socioambiental**, não medição de desastres.

## QA pré-publicação
- Scripts de verificação sintática \`npm run check\`.
- Suíte \`npm test\` incluindo códigos de validação (IVCAD, municípios de PE, saldo positivo/negativo e saneamento por categorias).
- Consultas reais: Recife, Caruaru, Petrolina (PE), Belo Horizonte e Ribeirão das Neves (MG), São Paulo (SP).
- PDF completo renderizado em 13 páginas para Recife/PE, com análise, fontes e competências, sem texto fora da área de página.

## Pendências expressas
- Cadastro Único nacional: total cadastrado, perfil social e IVCAD nos outros estados necessitam acesso agregado verificável com competência.
- Novo Caged/RAIS nacional: não foi ainda adicionada base uniforme para todas as UFs.
- CREAS, Centro POP, RMA e acolhimento: dependem de integração municipal e conferência de unidades.
- Justiça Climática em sentido estrito: S2ID e queimadas INPE não integrados.
- Atualização: snapshots versionados com SHA256 precisam de rotina de nova coleta e conferência, sem troca silenciosa do ano de referência.
