# Auditoria transversal — Etapas 1 a 4 · 19/11/2026

Projeto: Rede Cidadã — Diagnóstico Territorial Integrado. Domínio: https://diagnostico-parceirizacao.vercel.app.

## Método desta verificação

- Revisão de código-fonte, estrutura de fontes, módulos de diagnóstico, mapa IBGE, diretórios MDS/Ipea e rotinas de PDF.
- Testes automatizados do GitHub e validação real de fontes municipais para Belo Horizonte (3106200), São Paulo (3550308) e Ribeirão das Neves (3154606), quando a disponibilidade externa permite.
- Ausência de valor não vira zero. Dados de município do proponente não equivalem a execução de projeto no território.
- Não declarar uma integração concluída quando ela depende de API autenticada, documento não baixado ou serviço indisponível.
- Etapa 4 é a trilha transparente que descreve a condição de cada indicador. Não substitui integrações faltantes.

## Etapa 1 — bases demográficas, fiscais e vulnerabilidade

**Já integrado:** Censo 2022, juventude, escolaridade, PIB municipal/PIB per capita no ano mais recente publicado, SICONFI DCA e RGF/RREO, pulso fiscal bimestral, estimativas e proxies identificadas.

**Pendências reais:**
- Cadastro Único nacional: a integração MI Social foi implementada mas o serviço pode retornar página de manutenção. Famílias, pessoas, pobreza, extrema pobreza e atualização não podem ser declaradas completas em todos os municípios.
- IVCAD: conexão verificada apenas para municípios de Pernambuco. **Não extrapolar** índices de Pernambuco aos outros estados nem reutilizar snapshot histórico.
- MEI ativo municipal e desemprego municipal por faixa etária: fonte pública automatizada nacional não consolidada. PNAD UF é apenas contexto estadual.
- Bolsa Família/BPC por API da CGU depende de credencial de servidor; indisponível não significa população beneficiária zero.
- A inexistência de PIB municipal do ano corrente oficialmente fechado impede rotular o proxy fiscal como PIB de 2026.

## Etapa 2 — recursos, transferências e rede territorial

**Já integrado:** IPS Brasil 2026 (16 métricas, fonte secundária/espelho identificada, cruzamento com IBGE), malha territorial IBGE e nomes de distritos/subdistritos no PDF, consulta pública CadSUAS (lista de equipamentos, endereços e contatos quando disponíveis), catálogo Mapa das OSCs/Ipea, e contagem de propostas/gestão de parcerias do Transferegov.

**Pendências reais:**
- Transferências Especiais: empenhos, pagamentos, execução financeira, órgão/parlamentar e destinação efetiva demandam integração por instrumento e regra clara de execução local. **Contagem de propostas não é valor pago**, e entidade com sede no município não é evidência de projeto no município.
- Emendas por área de atuação, repasses específicos a OSCs e editais abertos: não cobertos como base municipal exaustiva.
- Perfil completo das OSCs pode não ter telefone/e-mail; o contato não deve ser inferido.
- Malha de distritos, subdistritos ou regionais administrativas: o mapa traz o contorno municipal, e nomes da API Localidades; não desenha fronteiras internas sem arquivo geográfico autorizado.
- IPS 2026 é espelho secundário; confrontar com resultados oficiais antes de relatórios externos.

## Etapa 3 — infância, adolescência, juventude, educação

**Já integrado:** frequência e não frequência escolar de residentes de 0–3, 4–5, 6–14, 15–17 e 18–24 anos do Censo 2022, e totais de matrículas 2025 por creche, pré-escola, fundamental e médio, funções docentes, escolas ofertantes e variações 2024–2025, pela Sinopse Inep reproduzida na API IBGE.

**Pendências reais:**
- EJA, educação especial e educação profissional **por município**: rotinas para baixar e agregar microdados 2025 foram preparadas, mas o download oficial terminou com falha de conexão. Sem snapshot validado, manter não integrado.
- Dados específicos de aprendizagem por contrato, medidas socioeducativas (MSE), crianças em situação de rua e CRAS/CREAS com capacidade/fluxo de atendimento ainda não constituem séries nacionais municipalizadas completas.
- A variação do número de matrículas não mede evasão. Uma escola pode ofertar mais de uma etapa; funções docentes não representam número de pessoas distintas.
- Censo 2026 está em fase preliminar na data de referência; não substituir silenciosamente dados finais de 2025.

## Etapa 4 — auditoria de indicadores e transparência

**Implementação técnica:**
- Registro por indicador de valor (inclusive zero legítimo), unidade, situação, competência, território IBGE, fonte e link, tipo de origem, método/ressalva, data de consulta e campo da última atualização efetiva da fonte.
- Última atualização das fontes **nunca inventada**: campo `sourceUpdatedAt=null` enquanto a fonte não fornece data auditável. Competência é mantida separada.
- Resumo por fonte, contagem de indicadores disponíveis/indisponíveis, alertas de origem e campos ausentes, lista de módulos pendentes e seus motivos.
- Fichas individuais pesquisáveis com filtro por situação/fonte e exportação CSV com prevenção de fórmulas maliciosas nas células de texto.
- Capítulos de rastreabilidade no PDF, preservando a página cartográfica como página 2.
- Indicadores da base secundária IPS Brasil e snapshots MTE/IDEB/Caged rotulados com procedência, sem alegar atualização em tempo real.
- O índice de cobertura considera **somente indicadores integrados**, não a completude das necessidades sociais de um território.

### Critérios de homologação

1. `npm run check` e `npm test` aprovados.
2. Teste da API de diagnóstico para três municípios e verificação de vínculo código IBGE.
3. PDF gerado após nova consulta, conteúdo de auditoria identificável e mapa na página 2.
4. Deploy Vercel Ready com SHA da branch e alias `diagnostico-parceirizacao.vercel.app` conferidos.
5. Na produção, o status de uma fonte indisponível não deve ser convertido em zero.

### Fontes para acompanhamento

- IVCAD oficial: https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/ivcad/ivcad
- Inep Microdados 2025: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar
- Inep Consulta Matrícula: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/consulta-matricula
- Transferegov Dados Abertos: https://api-publica.transferegov.gestao.gov.br/
- CadSUAS: https://aplicacoes.mds.gov.br/cadsuas/pesquisarConsultaExterna.html
- Mapa das OSCs: https://mapaosc.ipea.gov.br/
- IBGE: https://servicodados.ibge.gov.br/
- STN/SICONFI: https://apidatalake.tesouro.gov.br/
