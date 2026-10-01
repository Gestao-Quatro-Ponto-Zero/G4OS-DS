# Anatomia de página

Toda tela do DS segue uma de nove anatomias. A anatomia decide **o que fica fixo, o que rola e onde fica cada coisa** — é o que faz um CRM, um ATS e um ERP parecerem o mesmo produto. Ao criar ou copiar um bloco, escolha a anatomia antes de escolher componentes, e declare-a em `meta.concept.patterns`.

Exemplos vivos e mini-diagramas: showcase › Navegação › Anatomia de página (`#/p/padroes-anatomia-de-pagina`).

## Regras que valem para todas

1. **O cabeçalho da página é fixo.** Em toda página que rola, o `PageHeading` gruda no topo e compacta (some a descrição, o título diminui, aparece uma linha). `sticky={false}` só em app de altura total, onde a página não rola.
2. **O que é da página fica junto.** Elementos que pertencem à página (título, ações, barra de filtros, subnavegação, coluna de propriedades) grudam **juntos**, colados ao cabeçalho. Nunca deixe algo fixo cujo contexto já rolou embora — foi o caso da subnavegação de Configurações "flutuando" sem o título.
3. **Um invólucro não pode limitar o cabeçalho fixo.** `position: sticky` só funciona dentro do pai. Não embrulhe o `PageHeading` num `div` só dele; se precisar de classe (ex.: `no-print`), use `className="… contents"`.
3a. **Cabeçalho e corpo no mesmo eixo.** Para uma coluna mais estreita (configurações, automações, formulário longo), use `<Page width="narrow">` (`wide` 1200 · `medium` 1024 · `narrow` 896 · `reading` 720 px): o `PageHeading`, a `PageToolbar` e o corpo ficam alinhados, e o fundo fixo do cabeçalho continua de ponta a ponta. Nunca centralize só o corpo com `mx-auto max-w-*`: o título fica à esquerda e o conteúdo no meio.
4. **Uma rolagem por eixo.** Ou a página rola, ou a área rola — nunca as duas na vertical no mesmo lugar. No celular, sempre a página (o `DataGrid` já ignora `maxHeight` abaixo de 640px).
5. **Uma ação primária por área**, à direita do título. Secundárias em `ghost`; o resto no menu ⋯.
6. **Barras de ação flutuam no rodapé da área** (`BulkBar`, "alterações não salvas"): `sticky bottom`, só aparecem quando há o que fazer.
7. **Estados obrigatórios:** vazio com próxima ação, carregando com a forma do conteúdo, erro com saída.

## As nove anatomias

| | Anatomia | Fixo | Rola | Peças | Blocos de referência |
| --- | --- | --- | --- | --- | --- |
| A | **Lista** | Cabeçalho + `PageToolbar` (visões salvas, filtros, busca) colada abaixo | A página (tabela comum) **ou** a grade (DataGrid com `maxHeight` quando a lista é a página inteira e tem totais/colunas fixas) | `PageHeading`, `PageToolbar`, `SavedViews`, `FilterBar`, `TableSearch`, `DataTable`/`DataGrid`, `Pagination`, `BulkBar` | saas-customers, erp-invoices, crm-contacts, erp-orders |
| B | **Painel** (dashboard) | Cabeçalho com filtro de período à direita | A página | `KpiGrid`, `ChartCard`, `ListPanel`, tabelas curtas | saas-dashboard, erp-dashboard, crm-sales-dashboard |
| C | **Registro** (detalhe) | Cabeçalho com trilha, título, estado e ações; coluna de propriedades no desktop (`SplitLayout`, `page-aside`) | Conteúdo principal (abas, feed, itens) | `PageHeading` com `crumbs`, `StagePath`, `Tabs`, `SplitLayout`, `PropertyList`, `ActivityFeed` | crm-deal, saas-customer, ats-candidate, erp-order |
| D | **Configurações** | Título da página + subnavegação colada abaixo (`SettingsLayout`) | Só o conteúdo da seção | `SettingsLayout`, seções rótulo-à-esquerda, barra de alterações | settings-* , crm-settings |
| E | **Quadro** (kanban) | Cabeçalho; no desktop a página **não** rola | Quadro na horizontal; cada coluna na vertical. No celular a página rola e o cabeçalho gruda | `KanbanBoard`, `KanbanColumn`, `RecordCard` | crm-pipeline, ats-pipeline |
| F | **Mestre-detalhe** | Cabeçalho; lista à esquerda | Lista e detalhe rolam cada um (são duas áreas, não aninhadas); no celular o detalhe abre em tela cheia com voltar | Lista + painel, `Drawer`/`Sheet` no celular | erp-purchase-requests, saas-support, fin-reconciliation, ats-offers |
| G | **App de altura total** (conversa, IA, arquivos, apresentação) | Casca, cabeçalho da área, composer | Só a thread/lista/canvas; a página não rola | `AppShell` sem `Page`, `ResizableSplit`, `AgentComposer`, `ArtifactPanel` | ai-chat, ai-agent-builder, app-file-manager, app-presentation |
| H | **Fluxo focado** (auth, assistente) | Nada além do cartão/coluna; rodapé de passos fixo no assistente | O documento | Coluna única ou split com painel de marca; `Stepper` | auth-*, onboarding-wizard |
| I | **Público** (marketing, carreiras) | Cabeçalho do site | O documento (sem casca de app) | `HeroSection`, seções, CTA | marketing-landing, marketing-pricing, ats-careers |

## Detalhes por anatomia

**A · Lista.** A barra de filtros gruda **colada** ao cabeçalho quando a lista passa de uma tela: use `<PageToolbar>` envolvendo `SavedViews` + `FilterBar`. Abaixo de uma tela, não precisa. Escolha a rolagem pela forma da lista: tabela comum rola com a página; `DataGrid` com rolagem interna (`maxHeight="calc(100dvh - …)"`) quando há colunas fixas, totais no rodapé ou virtualização — aí a página praticamente não rola e o cabeçalho da grade fica fixo dentro dela.

**B · Painel.** KPIs no topo (3–5), um gráfico por pergunta, filas de ação ("o que pede atenção") antes de detalhes. Período no cabeçalho, não espalhado pelos cards.

**C · Registro.** A trilha leva de volta à lista. Ações mudam com o estado do registro (ganhar/perder, aprovar, faturar). A coluna de propriedades gruda abaixo do cabeçalho no desktop e vira seção no celular. Edição longa abre em `Drawer`, nunca em outra página.

**D · Configurações.** Título "Configurações" fixo e subnavegação logo abaixo dele; cada seção tem título e descrição próprios. Mudanças com efeito imediato salvam sozinhas; formulários longos usam a barra de "alterações não salvas".

**E · Quadro.** Totais por coluna no cabeçalho da coluna. Arrastar muda o estado; o card só abre o registro. Colunas crescem para ocupar telas largas.

**F · Mestre-detalhe.** A seleção fica no endereço (`?id=`), para compartilhar e voltar. A lista mostra o mínimo para escolher; o detalhe tem o resto.

**G · App de altura total.** Sem `Page`. O cabeçalho da área é fixo por construção; só a área de conteúdo rola. Painéis laterais são redimensionáveis e recolhíveis; no celular viram tela cheia ou `Sheet`.

**H · Fluxo focado.** Uma tarefa por tela, sem navegação do app. Em assistentes, o rodapé com Voltar/Continuar é fixo e o progresso é visível.

**I · Público.** Rolagem do documento, cabeçalho do site fixo e translúcido, seções largas. Sem `AppShell`.

## Celular

- Cabeçalho fixo vira **uma linha** ao grudar: título + ação primária + último item (em geral o ⋯). Trilha e ações secundárias voltam ao rolar para o topo (automático no `PageHeading`).
- A `PageToolbar` **não** gruda no celular: rola junto com a lista (o espaço vertical é do conteúdo).
- Filtros em `FilterSheet` com "Aplicar (N resultados)".
- Coluna de propriedades vira seção abaixo do conteúdo.
- Sem rolagem aninhada: a página rola (grades com `maxHeight` viram rolagem da página automaticamente).
- A pílula (`BottomNav`) nunca cobre conteúdo: o `AppShell` já reserva o espaço.

## Como declarar no bloco

```ts
export const meta = {
  title: "Lista de clientes",
  description: "…",
  category: "SaaS",
  concept: {
    goal: "Achar e agir sobre contas de clientes em escala: quem está em risco, quem pode expandir.",
    patterns: ["Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões, filtros, busca)", "…"],
    adapt: ["CRM (empresas), ERP (clientes B2B): troque colunas e visões salvas"],
    avoid: ["Filtros fora da PageToolbar (somem ao rolar)"],
  },
} as const;
```
