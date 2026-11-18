# Diagnóstico Territorial V3.2 — barra mais compacta, amarelo institucional

## Decisão de design
**Versão B — Compacta Premium (padrão de produção)**: mantém ícones finos e nomes dos seis recortes, altura medida em QA de **53 px no desktop** e **54 px no celular**, com estado selecionado em amarelo oficial `#FFC000`, texto azul-escuro `#10265B` e hover amarelo claro `#FFE28A`. Essa opção preserva leitura rápida dos nomes em web e mobile.

**Versão A — Ultra (alternativa comparável)**: utiliza chips mais próximos e menor respiro, altura medida de **42 px no desktop** e **52 px no celular**, sem alterar comportamento, fontes, dados ou endereço da plataforma.

## Comparação no mesmo endereço
- B / Padrão: https://diagnostico-parceirizacao.vercel.app/
- A / Ultra: https://diagnostico-parceirizacao.vercel.app/?barra=ultra

A opção de URL é apenas visual. Qualquer outro parâmetro `barra` utiliza a versão premium padrão. O site não cria novos endereços ou projetos na Vercel; as duas opções são CSS no mesmo deploy.

## Componentes
- Alternador Temas/Públicos, faixas de recortes, estados `aria-pressed`, títulos acessíveis de MSE e seleção do grupo.
- A barra ativa em amarelo vivo; hover em amarelo suave; foco visível acessível; textos e ícones em azul-marinho de alto contraste.
- `nav-variants.css` carrega após `styles.css`, preservando o Guia da Marca (setembro/2025), o rostinho original, a barra lateral e o PDF.
- Nas telas touch, os botões mantêm área de toque mínima aproximada de 42 px.

## QA realizado em homologação
- `npm run check`: aprovado.
- `npm test`: **12 de 12 aprovados**; nenhum indicador ou endpoint alterado.
- Playwright Chromium: duas opções × 4 larguras (1440/1024/390/320 px) = **8 combinações testadas**.
- Estado ativo: `rgb(255, 192, 0)`; hover em desktop: `rgb(255, 226, 138)`; mudança Temas → Públicos e seleção de MSE corretas.
- Ausência de scroll horizontal de página, seis filtros por grupo, sem erros JavaScript.

## Escopo
Esta versão altera somente a apresentação da barra. Integrações CadÚnico/IVCAD, RAIS, Novo Caged, Censo SUAS e justiça climática continuam no backlog com exigência de fonte e competência municipal verificáveis. O número dos 39 indicadores demonstrativos integrados é preservado.
