# Diagnóstico Territorial Integrado — Rede Cidadã V2

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
2. MDS/CadÚnico/IVCAD, MTE, RAIS/Novo Caged e Censo SUAS **ainda não estão integrados**; IDEB 2025 (rede pública) está integrado, mas pode ter resultados ausentes conforme o município.
3. A conta da API precisa de rotina institucional de importação de dados em nível municipal, verificação de esquema e competência.
4. A IA é opcional, não deve criar indicadores nem substituir deliberação de equipe técnica.
5. PDF é relatório **preliminar de homologação**. Deve passar por conferência técnica para uso externo.

## Implantação
Aplicação orientada à Vercel, com Node 22+ e `pdf-lib`. Não publicar no domínio V11 antes de testes de integridade, acessibilidade, segurança, desempenho e validação territorial.

## Fluxo de desenvolvimento
- Alterações devem ser submetidas para revisão antes de promover para produção.
- Nunca publicar credenciais no repositório; configurar variáveis somente no painel seguro da Vercel.
- Validar consulta, município, competência, fonte, análise e relatório PDF antes de cada release.
- Os módulos MDS/CadÚnico/IVCAD e MTE ainda exigem integração e validação; não devem ser considerados prontos.

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
