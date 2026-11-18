# Diagnóstico Territorial V4 — auditoria de fontes, macroeconomia e PDF (18/11/2026)

## Princípio central
**Publicação apenas após testes completos. Nenhuma métrica inexistente será substituída por zero, estimativa ingênua ou dados de outra região.** A versão Premium B, com navegação amarela, permanece inalterada. Os exemplos clicáveis de municípios foram removidos da busca.

## Alterações que efetivamente usam APIs públicas
| Fonte | Abrangência | Consulta | Competência e limitações |
|---|---|---|---|
| IBGE/SIDRA PIB Municipal 5938, variável 37 | Município — Brasil | `periodos/-2` | Últimos dois anos publicados; PIB em mil reais convertido para reais; crescimento **nominal**, não real |
| IBGE/SIDRA CEMPRE 9528, variável 708, CNAE 2.0 por seções | Município — Brasil | `periodos/-1` | Pessoal **assalariado por unidades locais** e seis ramos líderes em percentual do total; não são vagas, estabelecimentos ativos, residentes empregados ou MEIs |
| IBGE/SIDRA PNAD Contínua 4094, variável 4099, faixas 14–17, 18–24, 25–39, 40–59 e 60+ | **UF, não município** | `periodos/-1` | Taxas de desocupação estaduais e por idade; jamais multiplicar pela população municipal ou afirmar número de desempregados locais |
| MDS/Condepe-Fidem IVCAD PE | **Apenas PE**, código IBGE municipal | API pública /api/observatorio/serie (7 indicadores separados) | Consulta ao vivo e verificação de 6 dimensões, índice sintético (0–1), município, ano e média |
| IBGE/SIDRA demografia e saneamento, Censo SUAS por relatório | Município conforme publicação | consultas existentes | Fontes e competências já identificadas; Censo 2022 não equivale a 2026 |

### IVCAD nacional — limitação transparente
O **Observatório do Cadastro Único do MDS** publica IVCAD para todos os níveis geográficos e contém ferramenta de filtros, mas **não foi identificada e validada uma API pública estável nacional para extração por município**. A interface nacional oficial é https://paineis.mds.gov.br/public/extensions/observatorio-do-cadastro-unico/index.html e a metodologia https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/ivcad/ivcad.

- Os snapshots estáticos `data/ivcad2026pe/index.js` e `snapshot.js` foram **apagados do repositório**.
- Pernambuco consulta sete séries diretamente em https://www.cf.pe.gov.br/observatorio/fontes/seplag_ivcad. Os dados são validados por 7 valores, código IBGE, ano igual, unidade (0–1), atribuição original MDS e comparação índice geral = média das seis dimensões, tolerância 0,0001.
- Quando a API de PE falhar ou vier incompleta, o valor é **indisponível**. Outras UFs exibem o link nacional e aviso `não integrado`, nunca cópia/zero/dado desatualizado.
- O índice depende de um universo elegível do Cadastro Único; não é percentual de famílias pobres e não indica quantas famílias necessitam de atendimento. O relatório não adiciona quantidades artificiais de famílias/pessoas.

### MEIs ativos e desocupação municipal
A Receita Federal publica o painel de MEI https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cadastros e o Mapa de Empresas https://www.gov.br/empresas-e-negocios/pt-br/mapa-de-empresas; **não foi confirmada uma API pública nacional que entregue contagem de MEIs ativos por município em tempo real** com método reprodutível. Portanto, fica como pendência acompanhada de fonte, sem misturar CNPJ total com MEI. Não usar API de terceiros sem verificar definição, licença, última carga e desduplicação.

A PNAD Contínua tem taxa de desocupação por faixa etária **da UF**, enquanto o número de desempregados por município e faixa etária comparável em todas as cidades não está disponível por essa API. A nova seção rotula explicitamente `CONTEXTO ESTADUAL`. Nem todos os municípios têm estimativas próprias oficiais de desocupação comparáveis.

## Relatório PDF
- Mantido desenho da capa, faixas de cores, símbolo e todas as seções.
- O desenho antigo colocava **label, fonte e valor na mesma altura** e reservava espaço fixo insuficiente, produzindo 9–10 colisões em testes de MG e PE.
- Cada cartão de indicador calcula agora sua altura real considerando número de linhas do título, fonte, valor e nota. A quebra de páginas considera título do grupo e margens; textos nunca invadem visualizações adjacentes.
- Títulos longos de fontes e recomendações usam quebras por largura real.
- Análise social inclui: apresentação do município, conjuntura macro da UF, PIB nominal, emprego assalariado por CNAE, socioeducação, SUAS, IVCAD se validado, saneamento, oportunidades de investigação, riscos e hipóteses sociais condicionadas.
- Se OPENAI_API_KEY estiver configurada na implantação, modelo pode fornecer interpretação textual adicional, **restrita a dados confirmados**, separando hipóteses e lacunas; caso contrário, a análise técnico-determinística robusta é usada, sem fingir produção por IA.

## Validação e limites
- Fontes nacionais IBGE e contextos estaduais sempre indicam período e abrangência.
- Dados antigos de Novo Caged PE setembro/2026 permanecem explicitamente históricos e versionados, ainda não dinâmicos; não confundir com novo dado CEMPRE nacional.
- `api/dados-dinamicos.js` cuida de APIs novas. Dados de IVCAD dependem da disponibilidade do endpoint de PE, não de arquivo embutido.
- O catálogo contém 6 eixos e 6 públicos com sigla **MSE**; barra B Premium mantida.
- A homologação foi feita antes de qualquer deploy. PDFs são analisados por detecção de sobreposição geométrica dos trechos de texto, além de compilação e testes de APIs.

## Próxima infraestrutura aconselhada
Para **todas as fontes estarem atualizadas automaticamente**, implementar pipeline com fonte pública oficial, versionamento, competência, checksum, verificação de qualidade, histórico e alerta. Snapshots MTE/INEP/Caged histórico ainda dependem de sincronização. O site não deve se apresentar como totalmente automático enquanto isso não for construído.
