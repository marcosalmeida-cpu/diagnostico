# Revisão V11 — fontes nacionais municipalizadas de proteção social (19/11/2026)

## Regra de abrangência

**Aplicar exclusivamente fontes de abrangência nacional, com chave IBGE e sem extrapolações regionais.** A integração deve poder receber código de município em qualquer UF, com valores por competência e sem dados pessoais. Se um serviço bloqueia automação, a resposta do dashboard permanece **indisponível**; não importa registros específicos de Belo Horizonte, São Paulo, Pernambuco ou outro território como se fossem dados nacionais.

## CadÚnico: pobreza, extrema pobreza e renda

**Fonte MDS/SAGICAD:** dataset do Plano de Dados Abertos "Cadastro Único - Famílias/Pessoas por faixas de renda per capita - MI Social" (dados mensais por município). Documento oficial: https://mds.gov.br/webarquivos/MDS/1_Acesso_a_Informacao/Dados_Abertos/PDA/2024-2026.pdf

Catálogo que documenta a API e os nomes exatos das colunas: https://data.amerigeoss.org/dataset/cadastro-unico-familias-pessoas-cadastradas-por-faixas-de-renda

Campos conferidos na descrição da API nacional (agregados):
- `cadunico_tot_fam_i`: famílias no CadÚnico;
- `cadunico_tot_pes_i`: pessoas no CadÚnico;
- `cadunico_tot_fam_rpc_ate_meio_sm_i`: famílias com renda per capita de até meio salário mínimo;
- `cadunico_tot_fam_pob_i`: famílias em pobreza (faixa da série);
- `cadunico_tot_fam_ext_pob_i`: famílias em extrema pobreza (faixa da série);
- `cadunico_tot_fam_pob_e_ext_pob_i`: famílias em pobreza **ou** extrema pobreza;
- `cadunico_tot_pes_pob_i`, `cadunico_tot_pes_ext_pob_i` e `cadunico_tot_pes_pob_e_ext_pob_i` são as versões em pessoas.

**Importante:** os limites monetários das faixas mudaram ao longo do tempo; manter a competência individual. Pobreza e extrema pobreza NÃO devem ser somadas à categoria total sem verificar se as faixas são disjuntas. O sistema confronta com o campo oficial de total combinado sempre que todos estão presentes. Famílias e pessoas cadastradas não abrangem automaticamente quem está fora do cadastro.

**Situação da automação:** a API pública MI Social `https://aplicacoes.mds.gov.br/sagi/servicos/misocial` redirecionou, em testes de 19/11/2026 via GitHub Actions, para página de avisos do governo, com `200 text/html`, **não dados JSON**. Os novos campos estão integrados, mas a ingestão efetiva está indisponível até o serviço permitir extração estruturada. Campos de atualização cadastral ficam nulos até identificação verificável dos nomes de coluna na mesma fonte; não inventar.

## Bolsa Família e BPC

**PBF:** "Bolsa Família – MI Social", recurso mensal `qtd_familias_beneficiarias_bolsa_familia` e `valor_repassado_bolsa_familia`. Catálogo: https://data.amerigeoss.org/dataset/bolsa-familia-misocial1

**BPC:** "BPC por Município Pagador - MI Social". Campos mensais `bpc_ben_i` (total), `bpc_pcd_ben_i` (pessoas com deficiência) e `bpc_idoso_ben_i` (idosos). Catálogo via API: https://data.amerigeoss.org/api/3/action/package_show?id=bpc-por-municipio-pagador-mi-social . O município **pagador** não é garantia do município de residência. A divisão por grupos não representa população total de pessoas idosas ou PCD.

A consulta federal MDS é feita por município IBGE 6 dígitos, obtido dos primeiros seis dígitos do código IBGE municipal. A API CGU/Portal da Transparência fica como fonte alternativa somente com chave de servidor configurada; a Vercel não possui `CGU_API_KEY` neste projeto, segundo inspeção somente de nomes de variáveis, sem revelar valores.

**Situação:** campos e validações implementados; as contagens ao vivo continuam indisponíveis enquanto o MDS retorna HTML de manutenção e a CGU não possui chave institucional.

## Situação de rua

- O CECAD 2.0/TABCAD, https://cecad.cidadania.gov.br/tab_cad.php, permite agregados públicos nacionais com filtro por município e marcador de famílias em situação de rua.
- A chamada automática do TABCAD não foi homologada; consultas diretas retornaram a página de avisos do MDS. O painel permanece com o campo de famílias cadastradas em situação de rua **indisponível**.
- **Integração histórica validada:** Observatório Brasileiro de Políticas Públicas com a População em Situação de Rua (Polos/UFMG), baseado no Cadastro Único, série nacional 2012–2021. O conjunto abrange **3.870 municípios que apresentaram observações ao longo da série** e **2.962 registros municipais confirmados em 2021**. A planilha municipal de 2021 foi confrontada com a série histórica original. Três códigos (1504752, 4220000, 5006275) aparecem na série, mas não na planilha independente de conferência 2021: seus valores de 2021 foram omitidos, não zerados, mantendo os outros anos. Indicador adicionado ao diagnóstico: `pop_rua_cadunico_2021` (unidade: **pessoas cadastradas**; competência 2021). A fonte histórica não representa total da população nas ruas e não substitui a necessidade do cadastro atualizado.
- Fonte original e tabelas municipalizadas: https://obpoprua.direito.ufmg.br/repositorio_dados_tabelas.html

- População cadastrada não equivale à população total em situação de rua; pode haver subnotificação.
- O IBGE disponibiliza página oficial do **Censo Nacional da População em Situação de Rua**, https://www.ibge.gov.br/censo-nacional-pop-rua, ainda em preparação no momento desta revisão. Não existe resultado final universal municipal a integrar como contagem censitária.

## SINASE e medidas socioeducativas

- Para **Liberdade Assistida (LA)** e **Prestação de Serviços à Comunidade (PSC)**, a fonte nacional municipalizável é o Registro Mensal de Atendimentos (RMA/CREAS), compilado pelo MDS/Secretaria Nacional de Assistência Social, ligado ao acompanhamento em meio aberto.
- Portal: https://aplicacoes.mds.gov.br/snas/inteligencia-suas/RMA/Paineis
- O SINASE/MDHC tem levantamentos nacionais cuja divulgação de meio fechado é predominantemente por UF e não substitui a contagem municipal de LA/PSC. Os documentos do SIPIA-SINASE não têm, nesta auditoria, API pública nacional municipal de quantitativos validada.
- Permanecem sem valor numérico no diagnóstico até homologação de uma tabela nacional municipal com período, universo e procedência. **Ausência não indica inexistência de adolescentes em medidas.**

## População LGBTQIA+

- **Não houve quesito de orientação sexual ou identidade de gênero no Censo 2022.** A Pesquisa Nacional de Saúde (PNS 2019) investigou orientação sexual autodeclarada entre adultos, mas publica recortes para o Brasil, Grandes Regiões, UFs e capitais — não para todos os municípios.
- Fonte IBGE: https://www.ibge.gov.br/estatisticas/sociais/saude/9160-pesquisa-nacional-de-saude.html?lang=pt-BR e https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/33785-em-pesquisa-inedita-do-ibge-2-9-milhoes-de-adultos-se-declararam-homossexuais-ou-bissexuais-em-2019
- Não extrapolar estimativas nacionais para uma cidade. Indicadores municipais de serviços, políticas e denúncias poderão ser pesquisados separadamente, **sem serem rotulados como tamanho populacional LGBTQIA+**.

## Critérios para publicação e seguimento

1. `npm run check` e `npm test` devem passar no GitHub Actions do commit publicado.
2. PDF deve manter mapa IBGE na página 2 e a auditoria de fontes; consultas de outro território não podem alterar os valores.
3. Fonte oficial temporariamente inacessível deve ser representada como nula, com referência e motivo. Nunca como zero.
4. Toda nova fonte agregada precisa de código IBGE, competência e controles aritméticos e de versão.
5. Para ter **valores atuais realmente numéricos para os 5.570 municípios**, mesmo após integrar a fonte histórica UFMG, falta obter uma publicação nacional com endpoint estruturado acessível ou um extrato oficial estável de abrangência universal. Não afirmar cobertura numérica enquanto esse requisito estiver pendente.

### Fontes verificáveis
- https://www.gov.br/mds/pt-br/orgaos/SAGICAD/dados-e-ferramentas-informacionais/dados-e-ferramentas-do-cadastro-unico/
- https://www.gov.br/mds/pt-br/acesso-a-informacao/dados-abertos
- https://cecad.cidadania.gov.br/
- https://data.amerigeoss.org/dataset/bolsa-familia-misocial1
- https://data.amerigeoss.org/api/3/action/package_show?id=bpc-por-municipio-pagador-mi-social
- https://www.ibge.gov.br/censo-nacional-pop-rua
