# Auditoria V5 — SUAS, orçamento, Atlas, benefícios e taxas nacionais

Data: 18 de novembro de 2026. Dados inexistentes ou sem API validada permanecem nulos, nunca zero artificial.

## Indicadores nacionais, consulta automática
- Desocupação: IBGE SIDRA 4094, variável 4099, Brasil, trimestre recente; indicador sobre a FORÇA DE TRABALHO, não habitantes.
- Informalidade: IBGE SIDRA 8529, variável 12466, Brasil, trimestre recente; indicador sobre OCUPADOS.
- Pobreza: API Banco Mundial SI.POV.UMIC, última observação não nula, linha US$8,30 por dia PPC 2021; não é classificação de pobreza no Cadastro Único.
- Indicadores recuperados em teste: 5,2% (desocupação BR, 2026 T3), 37,5% (informalidade BR, 2026 T3), 20,6% (pobreza na linha do Banco Mundial, 2024).
- Fonte e competência aparecem em cada cartão. Servidor mantém cache de 1h; navegador solicita novamente a cada hora.

## Orçamento público municipal
- Tesouro Nacional SICONFI API: https://www.tesourotransparente.gov.br/consultas/consultas-siconfi/siconfi-api-de-dados-abertos
- DCA Anexo I-E: despesas LIQUIDADAS por função/subfunção; I-C: receitas realizadas e deduções; I-D: despesas por natureza econômica.
- Busca anual da última competência declarada (ano anterior ao da consulta, depois ano precedente), nunca limitado a um exercício fixo.
- Funções/subfunções identificáveis: 08 Assistência Social, 08.243 Assistência à Criança e Adolescente, 08.241 Assistência à Pessoa Idosa, 11 Trabalho, 11.333 Empregabilidade, 04.126 Tecnologia, 18 Gestão Ambiental, 23 Comércio e Serviços.
- 11.333 é proxy parcial de qualificação; 04.126 NÃO corresponde diretamente a inclusão digital; 23 NÃO corresponde diretamente a empreendedorismo.
- Cuidado/envelhecimento e Assistência à Pessoa Idosa podem apontar ao MESMO código 08.241; não somar em análises.
- Aprendizagem profissional, FIA, Fundo do Idoso e FMAS NÃO são individualizados na DCA por função/subfunção. Valores permanecem indisponíveis, exigindo LOA/QDD e dados do órgão gestor do fundo.
- Receita após deduções não é RCL; despesa liquidada não é pagamento; PIB não é receita pública; relação simples despesa/receita não equivale à capacidade de endividamento.
- PIB per capita requer dado oficial anual consistente com o denominador populacional; dívida consolidada requer RGF e não deve ser estimada da DCA.

## Cadastro Único e benefícios
- Fonte MDS: https://paineis.mds.gov.br/public/extensions/observatorio-do-cadastro-unico/index.html
- Painel contém agregados de famílias, pessoas, pobreza/renda, famílias em situação de rua e atualização cadastral, mas não foi validada uma API pública nacional agregada estável que entregue todos esses indicadores municipalmente nesta implementação.
- Campos previstos são apresentados como indisponíveis (não zero), com links de fonte, até integração verificável. Família por habitante é razão, não taxa de cobertura.
- CGU: https://api.portaldatransparencia.gov.br/ — os endpoints de PBF/BPC requerem chave da instituição. CGU_API_KEY deve ser configurada como segredo no backend da Vercel. Sem chave, nenhuma quantia ou contagem é exibida.

## Desenvolvimento humano e MSE
- Atlas Brasil/PNUD: https://www.atlasbrasil.org.br/ — IDHM e componentes municipais históricos (2010), sem API municipal oficial validada nesta auditoria. Campos ficam disponíveis para futura integração, mas sem valores artificialmente atuais.
- SINASE: https://www.gov.br/mdh/pt-br/navegue-por-temas/crianca-e-adolescente/levantamentos-nacionais-do-sinase/levantamentos-nacionais — levantamentos nacionais e estaduais não fornecem, por si só, contagem municipal atual de MSE. Não converter dados estaduais em valores municipais.

## Interface, PDF e análise social
- Premium B preservado. Aba Orçamento em vermelho #e12938 ao selecionar/passar mouse, letras brancas. Temas/Públicos em amarelo.
- Cabeçalho com três percentuais nacionais atualizados por API; PDF continua disponível na seção inferior.
- Relatório agrupado por fontes, períodos, rubricas orçamentárias, benefícios, Atlas e MSE, com algoritmo existente de paginação de texto.
- Análise inclui leitura fiscal condicionada, sem inferir disponibilidade para projetos a partir de orçamento liquidado.

## QA
Testar sintaxe, suíte automatizada, consultas de Neves/MG, Recife/PE e São Paulo/SP, responsividade, cores e layout de PDF antes de merge e deploy de produção.
