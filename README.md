# Diagnóstico Territorial Integrado — Rede Cidadã (Etapa 4)

> **Status atualizado em 19/11/2026:** a versão de auditoria e transparência acrescenta campos individuais de valor, unidade, competência, município, fonte, hora da consulta e data de atualização quando comprovada, além de filtros, CSV e capítulos de auditoria no PDF. Os limites e a matriz completa de pendências estão em [Auditoria das Etapas 1 a 4](docs/AUDITORIA_ETAPAS_1_A_4_2026-11-19.md). As seções históricas abaixo descrevem evoluções anteriores e não significam que todas as fontes estejam integradas.

Este é o repositório próprio do site **Diagnóstico Territorial Integrado**.

**Ambiente institucional:** https://diagnostico-parceirizacao.vercel.app

**Site V11 preservado:** https://diagnostico-redecidada.vercel.app

**O diagnóstico está em homologação técnica**, mesmo no ambiente institucional. O site V11 `diagnostico-redecidada.vercel.app` permanece intacto.

## Objetivo
Nova interface responsiva para subsidiar decisões sobre projetos sociais. Sem inventar valores, sem converter indisponibilidade em zero e com rastreabilidade das competências.

## Arquitetura
- `index.html`, `styles.css`, `app.js`: interface e consultas sem armazenamento pessoal.
- `api/municipios.js`: busca oficial de municípios pelo IBGE.
- `api/diagnostico.js`: Censo 2022, estimativa, SICONFI, juventude, alfabetização, escolaridade e IDEB 2025. Verificação de competência, fonte e ausência de valores.
- `api/analise.js`: análise técnica regrada; IA generativa opcional se houver `OPENAI_API_KEY` e `OPENAI_MODEL`, configuradas **somente** no ambiente do servidor.
- `api/relatorio.js`: PDF paginado (pdf-lib), com indicadores **reconsultados no servidor**, síntese social, referências, gráficos e lacunas explícitas.

## Fontes públicas
IBGE API / SIDRA: https://servicodados.ibge.gov.br/api/docs/
Tesouro SICONFI: https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos
MDS: https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/
INEP IDEB: https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados
MTE aprendizagem: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/insercao-de-aprendiz-1

## Advertências de integridade
1. `generatedAt` é a hora da consulta; `period` é a competência da fonte.
2. MDS/CadÚnico/IVCAD, RAIS/Novo Caged e Censo SUAS **ainda não estão integrados**. IDEB 2025 (rede pública) e o potencial da cota MTE/SIT (07/2026) estão integrados, mas podem ter resultados ausentes conforme o município.
3. A conta da API precisa de rotina institucional de importação de dados em nível municipal, verificação de esquema e competência.
4. A IA é opcional, não deve criar indicadores nem substituir deliberação de equipe técnica.
5. PDF é relatório **preliminar de homologação**. Deve passar por conferência técnica para uso externo.

## Implantação
Aplicação orientada à Vercel, com Node 22+ e `pdf-lib`. Não publicar no domínio V11 antes de testes de integridade, acessibilidade, segurança, desempenho e validação territorial.

## Fluxo de desenvolvimento
- Alterações devem ser submetidas para revisão antes de promover para produção.
- Nunca publicar credenciais no repositório; configurar variáveis somente no painel seguro da Vercel.
- Validar consulta, município, competência, fonte, análise e relatório PDF antes de cada release.
- Os módulos MDS/CadÚnico/IVCAD, Censo SUAS, RAIS e Novo Caged exigem integração e validação; não devem ser considerados prontos.

## Recortes e metodologia
- Juventude: faixas etárias 15–19, 20–24 e 25–29 do IBGE/SIDRA, tabela 9514, Censo 2022. Percentual dividido pela população censitária do mesmo ano.
- Alfabetização 15+: tabela 9543 do IBGE/SIDRA, Censo 2022 (total por sexo, cor/raça e idade).
- Escolaridade 18+: tabela 10061 do IBGE/SIDRA, Censo 2022. "Sem ensino médio completo" soma os níveis "Sem instrução e fundamental incompleto" e "Fundamental completo e médio incompleto" e usa como denominador os quatro níveis de instrução do universo 18+.
- IDEB 2025: resultados por município e por rede "Pública", notas de 0 a 10, anos iniciais e finais do ensino fundamental. **Não confundir rede pública agregada com rede municipal exclusivamente**.

### Cadeia de custódia do IDEB 2025
Obtido das planilhas XLSX contidas nos arquivos ZIP oficiais INEP. Os certificados do domínio INEP foram verificados usando certificado intermediário da RNP/GlobalSign, sem desativação da validação TLS.

Anos iniciais: https://download.inep.gov.br/ideb/resultados/divulgacao_anos_iniciais_municipios_2025.zip

SHA-256: `89100286327ab07a4b1318ba51974d62da90af334f663bedf6374cb67298a3e7`

Anos finais: https://download.inep.gov.br/ideb/resultados/divulgacao_anos_finais_municipios_2025.zip

SHA-256: `5f81ae18d33567608f10551d4f563a6879afc0182ff28cfd81e913958a30a6b3`

Os dados foram compactados, versionados em `data/ideb2025/` e são lidos localmente pelo servidor. Municípios sem notas publicadas permanecem com `null` (nunca 0). A extração identificou 5.545 municípios com pelo menos um resultado. 

## Testes e operação
```bash
npm install
npm run check
npm test
```
Não configurar credenciais nem dados pessoais no repositório. O PDF e a IA só devem utilizar os valores efetivamente validados para cada competência.

## Potencial de aprendizagem profissional — MTE/SIT (07/2026)
- Fonte oficial: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/insercao-de-aprendiz-1/potencial_ead_julho-1.xlsx
- SHA-256 do arquivo XLSX: `0801a87924d071355c0f31f80fe88237feb13df5b85c73abf2ec08d0ff4da3a9`.
- Competência identificada no cabeçalho: `07/2026`, publicação do arquivo `EmpresasPotencialEad_20260810_1`.
- Total e setores: Comércio, Serviços, Indústria, Agricultura, Transportes e Outros. Conferidos total = soma dos seis setores; não há valores negativos.
- Chave municipal: combinação exata de UF + nome normalizado pela base oficial de localidades do IBGE, convertida para código IBGE 7 dígitos. **5.518 municípios vinculados**; **52 municípios não encontrados com correspondência exata** permanecem indisponíveis, sem tentativa de inferir o código.
- O potencial de cota é **potencial normativo estimado**. Não deve ser apresentado como vagas efetivas, contratações efetivadas ou oportunidades disponíveis para a Rede Cidadã.
- Dados agregados e comprimidos em `data/mte2026/`; sem informações pessoais.

## Identidade visual — Guia da Marca Rede Cidadã, setembro de 2025
- Fonte de referência: Guia da Marca institucional 2025, fornecido pela Rede Cidadã nesta atualização.
- Paleta oficial: azul escuro `#0322D6`, azul claro `#65C8F3`, vermelho `#FF001F`, amarelo `#FFC000` (página 7).
- Tipografia principal: **Roboto**; tipografia de sistema: Open Sans (páginas 8–9).
- Símbolo (rostinho) extraído **diretamente dos caminhos vetoriais** da página 2 do guia, sem esticar ou modificar geometria, salvo escala proporcional e posição. Arquivo: `assets/rede-cidada-rostinho.svg`.
- Barra lateral desktop de 80 px: somente símbolo e quatro ícones finos (com `title` e `aria-label`); navegação móvel inferior com ícones e nomes por acessibilidade.
- Relatório PDF: mesma paleta oficial e símbolo vetorial na capa. Permanecem os controles de rastreabilidade e indisponibilidade.

## Censo SUAS — equipamentos CRAS, competência 2024
- Publicação oficial MDS/SAGICAD: https://sagicad-mds.github.io/indicadores-de-desenvolvimento/index.html
- Fonte: **relatórios municipais dos Indicadores Censo SUAS 2024**, vinculados ao município e UF confirmados previamente na API de localidades do IBGE.
- São integradas **quatro métricas**: número total de CRAS e distribuição por capacidade de referenciamento para até 2.500, 3.500 e 5.000 famílias.
- Somamos as três faixas somente após encontrar exatamente os três registros no relatório municipal de 2024 e confirmar a identificação municipal.
- Esses números **não** são famílias efetivamente atendidas, não medem cobertura suficiente e não substituem inspeção territorial da rede socioassistencial.
- Falha de consulta, diferença no padrão de publicação ou ausência de tabela mantém os números indisponíveis.
- O relatório municipal oficial é linkado individualmente na interface para auditoria.

### Próximas integrações — sem inventar dados
- **Cadastro Único e IVCAD**: consulta pública em https://cecad.cidadania.gov.br/ e https://paineis.mds.gov.br/public/extensions/observatorio-do-cadastro-unico/index.html ; requer processo confiável de captura de agregados municipais, referência e LGPD.
- **RAIS/Novo Caged**: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho ; requer arquivos municipais com controle de competência, ajustes e método.
- Indicadores da rede SUAS além do total de CRAS: mantidos não integrados até comprovação de acesso e metodologia.

## Painel compacto V3 — implementação da navegação
- Especificação: [docs/ESPECIFICACAO-DASHBOARD-V3.md](docs/ESPECIFICACAO-DASHBOARD-V3.md)
- Configuração de categorias, públicos e indicadores existentes: [taxonomy.js](taxonomy.js).
- A capa foi reduzida; uma consulta municipal válida conduz à seção de indicadores; as duas barras horizontais compartilham **um único painel**.
- Seis eixos temáticos: Demografia, Socioeducação, SUAS, Trabalho e Renda, Justiça Climática e Socioaprendizagem.
- Seis públicos: POP Rua, Juventude, Pessoas Idosas, LGBTQIAPN+, Mulheres e Medida Socioeducativa.
- Cards de destaque: até quatro; listagem inicial: até seis indicadores, com botão para expandir; fontes pormenorizadas recolhíveis.
- Os 29 indicadores anteriores continuam mapeados (28 diretamente em eixos e despesa de Saúde como contexto transversal).
- **Não existe indicador fictício:** categorias sem extração municipal verificada mostram "Em implantação", fonte de pesquisa e nota metodológica.
- Jovens 15–29 são população juvenil, **não** quantidade de jovens em vulnerabilidade. Potencial da cota MTE **não** corresponde a oportunidades abertas.
- Os próximos recortes a validar são população 60+, população por sexo, CadÚnico/IVCAD, RAIS/Novo Caged, justiça climática e dados municipais dos públicos específicos.
- O PDF continua abrangente e reconsulta as fontes no servidor. Uma versão por filtro com capítulos por público está especificada, ainda não implementada.
- Testes automatizados de taxonomia, cobertura de IDs e acessibilidade estrutural em tests/taxonomy.test.js.

## V3.1 Premium — painel compacto e IBGE sexo/60+
- [Especificação e verificações V3.1](docs/EVOLUCAO-V3-1-PREMIUM.md).
- Navegação com apenas **uma barra**; alternador **Temas/Públicos**. MSE no painel, com denominação completa acessível.
- **39 indicadores demonstrativos**, sendo dez novos do IBGE/SIDRA 9514, Censo 2022, validados por sexo/idade, com recortes de Mulheres, Pessoas Idosas e Juventude.
- Auditoria de fontes em painel recolhível, sem supressão de dados, notas, competência ou PDF.
- População por sexo no Censo não corresponde a identidade de gênero; nenhuma vulnerabilidade é inferida do total populacional.

## V3.3 — Fontes sociais e socioambientais validadas

- Mantida a **barra Premium B**, cor de destaque amarela oficial, mesmo endereço institucional.
- **+7 indicadores municipais nacionais** do IBGE/Censo 2022 (água e esgotamento), com denominadores conciliados e recorte de domicílios particulares permanentes ocupados.
- **+9 indicadores estaduais** do IVCAD 2026 para **185 municípios de Pernambuco**, incluindo índice geral e seis dimensões; os universos de famílias e pessoas são da extração IVCAD, não de todo o CadÚnico.
- **+4 indicadores mensais de emprego formal** do Novo Caged setembro/2026 apenas para **183 municípios de Pernambuco**, com 179 salários médios nominais de admissão e conciliação de saldo mensal.
- **Total de IDs integrados no projeto:** 59; consultas de PE com 59 indicadores potenciais (58 quando salário indisponível); consultas de outros estados com 46 indicadores, sem extrapolar dados estaduais.
- PDF institucional reconsulta as fontes nacionais e lê snapshots versionados e auditados por SHA-256 das duas bases de PE. O PDF agora inclui seções IVCAD, saneamento e Novo Caged, preservando as limitações.
- [Rastreabilidade, metodologia e avisos de interpretação](docs/INTEGRACAO-IVCAD-CAGED-SANEAMENTO-2026.md).

As séries estaduais estáticas **não** se atualizam automaticamente. Uma nova competência exige reextração, checagens e versionamento. Outras UFs: IVCAD nacional e Caged nacional **não integrados** nesta etapa.

## V4 — economia municipal dinâmica, IVCAD sem snapshot e revisão de PDF
- Fonte, metodologia, limites e QA: [Auditoria V4](docs/AUDITORIA-V4-FONTES-E-PDF.md).
- **IVCAD deixou de ser estático**: snapshots PE excluídos; consulta em tempo real via API pública de PE (sete séries verificadas). A API nacional do MDS não foi validada; fora de PE exibir link para painel nacional, não números fictícios.
- **Novas APIs nacionais IBGE** para PIB municipal anual, pessoal assalariado por setor CNAE (CEMPRE) e desocupação **estadual** por faixas etárias (PNAD), sempre com ano/universo nos indicadores.
- **MEI ativo municipal** ainda não integrado: painel oficial da Receita Federal sem API pública estável confirmada. Não confundir total de empresas ativas com MEIs.
- **PDF sem textos sobrepostos**: os blocos reservam altura conforme texto real, mantendo estética original; a análise social passou a contextualizar economia, território, educação, proteção social e hipóteses de projeto.
- A pesquisa deixou de exibir exemplos de cidades, preservando a consulta por nome ou código IBGE.
- O restante das séries históricas estáticas (Novo Caged PE, IDEB, potencial MTE/SIT) ainda exige novos mecanismos de sincronização.
