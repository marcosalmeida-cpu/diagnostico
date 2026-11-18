# Diagnóstico Territorial V3.1 — navegação premium e novos recortes IBGE

## Alterações de interface
- Mantida a identidade institucional Rede Cidadã do Guia da Marca 2025: Roboto, logotipo vetorial original e cores oficiais `#0322D6`, `#65C8F3`, `#FF001F`, `#FFC000`.
- Substituição das duas barras horizontais de navegação por **uma única barra premium**, com alternador **Temas | Públicos** à esquerda e seis abas horizontais do modo ativo à direita.
- Uma categoria é exibida por vez; alternar o modo não duplica painéis. A barra única tem cerca de 60–71 px nos testes de desktop e mobile.
- Redução de elementos visíveis: qualidade dos dados e fontes em validação passaram para uma seção recolhível, sem remoção dos controles de integridade nem das fontes.
- Adaptação para celular: alternador de navegação em ícones acessíveis, faixa horizontal rolável e ausência de transbordamento do layout.
- **Medida Socioeducativa** é exibida como **MSE**; leitores de tela e tooltip recebem a denominação completa.
- O PDF continua reconsultando os dados oficiais no servidor; não gera dados a partir da interface.

## Dez novos indicadores verificados — IBGE/SIDRA, Censo 2022, tabela 9514
**Fonte:** https://sidra.ibge.gov.br/tabela/9514

Consulta oficial: variável 93 (população residente), município IBGE (N6), período 2022, forma de declaração da idade total (286[113635]), sexo (2[4,5]) e idades (287[100362,93086,93087,93088,93095,93096,93097,93098,49108,49109,60040,60041,6653]).

| Indicador (ID) | Universo / denominador |
| --- | --- |
| populacao_mulheres | Mulheres no quesito sexo do Censo 2022 |
| populacao_homens | Homens no quesito sexo do Censo 2022 |
| mulheres_pct | Mulheres / população residente censitária |
| pessoas_idosas_60mais | Soma das 9 faixas de 60–64 a 100+ |
| pessoas_idosas_60mais_pct | Pessoas 60+ / população residente censitária |
| mulheres_idosas_60mais | Mulheres 60+, soma das 9 faixas |
| homens_idosos_60mais | Homens 60+, soma das 9 faixas |
| mulheres_entre_idosos_pct | Mulheres 60+ / total de pessoas 60+ |
| jovens_mulheres_15_29 | Mulheres 15–19, 20–24 e 25–29 |
| jovens_homens_15_29 | Homens 15–19, 20–24 e 25–29 |

**Validação obrigatória antes da publicação:** classificação de sexo/idade completa, valores inteiros não negativos, homens + mulheres = população censitária, mulheres 60+ + homens 60+ = 60+ total, mulheres 15–29 + homens 15–29 = jovens 15–29 da outra consulta SIDRA. Dado inválido gera `null`, nunca atribuição zero.

**Interpretação:** sexo censitário não permite inferir identidade de gênero, orientação sexual, violência de gênero, vulnerabilidade social ou demanda individual. As métricas de 2022 devem permanecer identificadas com essa competência, mesmo quando consultadas em 2026.

## Verificações de homologação
- 9 testes automatizados aprovados, incluindo integridade da tabela 9514.
- Ribeirão das Neves/MG, Belo Horizonte/MG, Recife/PE e São Paulo/SP: 39 dos 39 indicadores demonstrativos com valores válidos nas consultas de homologação.
- Chromium/Playwright: larguras 1440, 1024, 390 e 320 px, todas sem scroll horizontal acidental; uma barra, seis filtros no modo Temas, seis no modo Públicos e nenhum erro JavaScript.
- Quatro indicadores em destaque para Mulheres e Pessoas Idosas; MSE corretamente sinalizado como Em implantação, sem informação inventada.
- Relatório PDF de Ribeirão das Neves gerado em 9 páginas A4, sem texto fora das margens.

## Próximas integrações ainda pendentes
- Cadastro Único / IVCAD e recortes de vulnerabilidade municipal: MDS/SAGICAD, exigir competência e agregação válida.
- Trabalho formal por sexo/idade, vínculos, admissões e desligamentos: MTE/RAIS e Novo Caged, respeitar revisões das séries.
- SUAS além dos CRAS: CREAS, Centro POP, acolhimento, RMA; utilizar apenas relatórios oficiais identificáveis.
- Justiça Climática: S2ID, dados de saneamento e queimadas, exigindo identificação do município e compatibilidade temporal.
- MSE, POP Rua e LGBTQIAPN+: não preencher com valores do total populacional e não inferir pertencimento a grupos sensíveis.

**Nota de cobertura:** 39/39 significa apenas que todos os 39 indicadores **implementados** foram verificados para os municípios testados, e não que o diagnóstico social esteja completo.
