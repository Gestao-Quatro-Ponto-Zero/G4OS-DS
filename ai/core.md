# G4OS-DS · guia essencial para agentes (v0.4.0)

Leia isto inteiro antes de escrever ou mudar UI num projeto com `@g4ai/ds`. Detalhes ao lado (mesma pasta): `components/<módulo>.md` (props + exemplos), `blocks/<bloco>.md`, `tokens.md`, `manifest.json`. Com o MCP `g4os-ds` ligado, use `plan_screen` (pedido → anatomia, bloco e componentes), `get_component`, `get_block` e `audit`.

## Fluxo de trabalho (sempre nesta ordem)
1. **Anatomia**: decida qual das 9 anatomias a tela é (tabela abaixo). Ela define o que fica fixo e onde vai cada coisa.
2. **Bloco**: procure um bloco parecido (`blocks/<slug>.md`, MCP `plan_screen`/`search`). Achou? Copie `src/blocks/<slug>.tsx` inteiro e troque dados e textos. Só comece do zero se nenhum servir.
3. **Componentes**: para cada necessidade, use a tabela "Qual componente". Confira as props em `components/<módulo>.md` antes de usar: não invente props.
4. **Estados**: carregando (`Skeleton`/`loading`), vazio (`Empty` com ação), vazio por filtro (com "Limpar"), erro (com "Tentar de novo"), ideal.
5. **Verifique e corrija até limpar**: `npx g4os-ds audit src --fix` → `npx g4os-ds audit src` (0 erros, 0 avisos) → `npx tsc --noEmit` → se houver ESLint com `@g4ai/ds/eslint`, `npx eslint src`. Depois confira a tela em 1440 e 390 px, claro e escuro.

## Anatomia → esqueleto
| Tela | Esqueleto | Bloco de referência |
| --- | --- | --- |
| A · Lista | `Page` › `PageHeading` (1 primário em `actions`) › `PageToolbar` (`TableToolbar`/`FilterBar`) › `DataTable`/`DataGrid` › `Pagination` · `BulkBar` na seleção | `erp-invoices`, `crm-contacts`, `ats-jobs` |
| B · Painel | `Page` › `PageHeading` (período em `actions`) › `KpiGrid` de `KpiCard` › `ChartCard` + gráfico › filas de ação | `fin-dashboard`, `saas-dashboard` |
| C · Registro | `Page` › `PageHeading crumbs` (ações do estado) › `Tabs` › `SplitLayout main aside={<PropertyList/>}` · editar em `Drawer` | `crm-deal`, `crm-company`, `erp-order` |
| D · Configurações | `SettingsLayout` (subnavegação) › `SettingsSection` por assunto; coluna estreita com `Page width="narrow"` | `settings-*`, `crm-settings` |
| E · Quadro | `KanbanBoard` + `RecordCard` | `crm-pipeline` |
| F · Mestre-detalhe | lista + painel; no celular `Sheet` | `erp-purchase-requests` |
| G · App de altura total | `AppShell` sem `Page` (chat, arquivos) | `ai-chat` |
| H · Fluxo focado | coluna única, sem casca (login, assistente) | `auth-login`, `onboarding-wizard` |
| I · Público | sem `AppShell` (landing, preços) | `marketing-landing` |

```tsx
// A · Lista (o esqueleto mais pedido)
<Page>
  <PageHeading title="Vagas" description="Vagas abertas e em pausa." actions={<Button onClick={criar}><Plus /> Criar vaga</Button>} />
  <PageToolbar>
    <TableToolbar query={q} onQuery={setQ} shown={filtradas.length} total={vagas.length} noun="vaga" dirty={!!q} onClear={limpar} />
  </PageToolbar>
  <DataTable label="Vagas" rows={pag.rows} columns={[selectionColumn(sel, (v) => v.id, (v) => v.titulo), ...colunas]} rowKey={(v) => v.id}
    loading={carregando} error={erro} empty={<Empty title="Nenhuma vaga com esses filtros" action={<Button variant="ghost" onClick={limpar}>Limpar filtros</Button>} />} />
  <Pagination page={pag.page} pageCount={pag.pageCount} onPage={pag.setPage} total={pag.total} pageSize={pag.pageSize} />
  <BulkBar count={sel.count} noun="vaga" gender="f" onClear={sel.clear}>
    <button type="button" onClick={arquivar}><Archive /> Arquivar</button>{/* filhos do BulkBar são <button> simples: a barra estiliza */}
  </BulkBar>
</Page>
```

## Qual componente
| Preciso de | Use | Nunca |
| --- | --- | --- |
| Texto curto / longo | `TextField` / `TextareaField` (`label` = rótulo visível) | `<input>`, `<textarea>` cru |
| Número, dinheiro, CPF/CNPJ | `NumberField`, `CurrencyField`, `MaskedField` | `type="number"` cru, `toFixed` |
| 1 opção de até ~7 | `Select` · `SegmentedControl` (2–4, troca de visão) · `RadioGroup` | `<select>` cru |
| 1 entidade de lista longa (pessoa, cliente) | `Combobox` (busca) · `NativeSelect` (seletor do sistema, celular) | `<select>` cru |
| Várias opções | `MultiSelect` (dropdown com busca) · `CheckboxGroup` (todas visíveis, ≤ 12) · `ToggleGroup multiple` (dias da semana) | lista de `Checkbox` solta |
| Data / data e hora / hora | `DatePicker` / `DateTimePicker` / `TimePicker` | `<input type="date|time">` |
| Liga/desliga com efeito imediato | `Switch` | `Checkbox` + botão salvar |
| Confirmar ação irreversível | `ConfirmDialog` | `window.confirm` |
| Avisar que terminou | `notify("Vaga criada")` (+ desfazer) | `alert`, "com sucesso", "!" |
| Ação assíncrona | `useOperation` + `OperationButton` + `OperationFeedback` | `setLoading` manual sem feedback |
| Criar/editar sem sair da lista | `Drawer` com `footer` | página nova, `Modal` longo |
| Tabela de dados | `DataTable` (`selectionColumn`, `useSort`, `usePagination`) · `DataGrid` (planilha, totais, colunas fixas) | `<table>` cru |
| Tabela estática (fatura, comparativo) | `Table` › `TableHeader`/`TableBody`/`TableRow`/`TableCell numeric` | `<table>` cru |
| Status numa linha | `StatusLabel`/`Badge` (troca por `Menu`) | `Select` por linha |
| Número de destaque | `KpiCard delta={0.12}` (fração; `goodWhen="down"` p/ custo) em `KpiGrid` | card montado à mão |
| Gráfico | `ChartCard title="Pergunta?"` + `AreaChart`/`BarChart`/`LineChart label=…` | Recharts, cores fixas |
| Aviso na tela | `Callout tone=…` | `div` colorido |
| Vazio / erro de tela | `Empty` / `StateView` | texto solto |
| Bloqueado com motivo | `<Button disabled disabledReason="…">` | `span` com `opacity-50`/`pointer-events-none` |

## Erros que agentes mais cometem (errado → certo)
1. Centralizar só o corpo: `<Page><PageHeading/><div className="mx-auto max-w-4xl">` → `<Page width="narrow"><PageHeading/>…` (`wide` 1200 · `medium` 1024 · `narrow` 896 · `reading` 720). [`page-width-wrapper`]
2. `<h1>` solto → `<PageHeading title description actions />`. [`page-heading`]
3. Botão bloqueado apagado com wrapper (`opacity-50`, `pointer-events-none`, `title`) → `disabled disabledReason="Demonstração: nada é gravado"`. [`disabled-wrapper`]
4. `label` dos campos **já é visível**. Não repita: `<FieldBlock label="Valor"><CurrencyField label="Valor"/>` → só o campo. [`field-double-label`] `<Checkbox label={x}>{x}</Checkbox>` → `<Checkbox label={x} />`. [`redundant-children`]
5. Rótulo escondido só onde não cabe texto (célula, toolbar): `<Checkbox label={"Selecionar " + r.nome} hideLabel />` ou `selectionColumn`. [`cell-control-label`]
6. Lista de checkboxes para "vários" → `CheckboxGroup` (visíveis) ou `MultiSelect` (dropdown, "3 selecionados").
7. `<select>`, `<input type="date">`, `<textarea>`, `<table>` crus → componentes da tabela acima. [`native-select`, `native-date`, `raw-input`, `raw-table`]
8. `Select` dentro de `cell:` → selo + `Menu`. [`select-per-row`]
9. Dois primários em `actions` → um primário, o resto `variant="ghost"` ou `ActionMenu`. [`multiple-primary`]
10. `Drawer` dentro de `Drawer` → passos no mesmo `Drawer` ou `Modal`. [`nested-drawer`]
11. `confirm()`/`alert()` → `ConfirmDialog` + `notify`. [`confirm-alert`]
12. `"R$ " + v.toFixed(2)`, `toLocaleString("pt-BR", {style})`, `toLocaleDateString("en-US")` → `formatCurrency`, `formatPercent`, `formatDate`, `formatRelative`. [`number-format`, `manual-format`]
13. "Salvo com sucesso!", "Save", "Criar Nova Vaga" → "Alterações salvas", "Salvar", "Criar nova vaga". [`copy-tone`, `english-copy`, `title-case`]
14. `bg-white`, `text-gray-500`, `#1a7f37`, `bg-muted` → `bg-surface`, `text-muted`, `text-ok`, `bg-soft`. [`white-black`, `tailwind-palette`, `hex-color`, `shadcn-class`]
15. `DataTable` com dados assíncronos sem `loading`/`error`/`empty` → passe os três. [`data-states`]
16. Props inventadas ou trocadas: `<Empty description>` (é `hint`; `description` é do `StateView`), `<Card title>` (use `Section`/`ChartCard`), `<Badge variant>` (é `tone`). Confira `components/<módulo>.md` antes; `npx tsc --noEmit` pega o resto.
17. Importar de caminhos internos (`@g4ai/ds/src/…`) → sempre `from "@g4ai/ds"`. [`deep-import`]
18. `useEffect(async () => …)` ou efeito que devolve Promise → função interna `async` e chame. [`effect-return`]

## Regras visuais (resumo de AGENTS.md)
- **Só tokens semânticos**: fundos `bg-page` (área) · `bg-surface` (card, campo) · `bg-popover` (menu, modal) · `bg-soft` (hover, faixa); texto `text-ink` · `text-ink-soft` · `text-muted`; borda `border-line` (`-strong` no hover); ação `bg-primary text-on-primary`; sobre preenchimento forte `text-on-ink`; estados `ok · amber · rose · info` (+`-soft`). Isso garante tema escuro e marca do cliente sem código extra.
- **Texto na escala**: `text-caption` 12 · `text-label` 12.5 · `text-control` 13 · `text-body` 13.5 · `text-input` 14 · `text-section` 18 · `text-title` 25.
- Superfície separa por borda de 1 px, não sombra. Cor sempre com palavra (status = ponto + texto). Número bom não grita.
- Controles só quando há o que controlar: busca ≥ 12 itens, filtros ≥ 8, alternador de visão ≥ 8.
- pt-BR: verbo + objeto nos botões ("Criar vaga"), só a primeira maiúscula, sem exclamação. Toast = particípio + objeto ("Vaga arquivada").
- Acessível: teclado, foco visível, `IconButton label`, gráfico com `label`, cor nunca sozinha. Responsivo 320–1440 px sem rolagem horizontal.
- App: `<html lang="pt-BR" className="ds-app" data-theme="system">`, `themeScript` no `<head>`, `setLinkComponent(Link)` uma vez, `<Toaster />` na raiz. CSS: `@import "tailwindcss"; @import "@g4ai/ds/styles.css";`.

## Antes de concluir
- [ ] `npx g4os-ds audit src`: 0 erros e 0 avisos (use `--fix` antes; `--format json` para ler por regra).
- [ ] `npx tsc --noEmit` verde (e `npx eslint src` se o projeto usa o plugin).
- [ ] Título e corpo no mesmo eixo; um primário por área; rótulos visíveis; nenhum controle cru.
- [ ] Cinco estados implementados; textos em pt-BR; datas e dinheiro pelos formatadores.
- [ ] Conferido em 1440 e 390 px, claro e escuro (`data-theme="dark"` no `<html>`).

## Tokens em uma linha
Fundos `page · surface · popover · soft · rail` · texto `ink · ink-soft · muted` · linhas `line · line-strong` · ação `primary / on-primary` · sobre forte `on-ink` · marca `navy · blue · clay · accent (só preenchimento) · accent-deep (texto) · accent-soft` · estados `ok · amber · rose · info` (+`-soft`) · dados `chart-1…6 · chart-grid`. Raios `rounded-lg` controle, `rounded-xl` card/popup, `rounded-2xl` modal. Tabela completa: `tokens.md`.

## Módulos (435 componentes) → `components/<nome>.md`
- **primitives**: Base visual: Button, IconButton, Badge, Dot, Avatar, EntityMark, Card, Metric, StatGrid, Meter, Empty, Page, Section, Kbd, DsLink/setLinkComponent, tons.
- **overlays**: Modal, ConfirmDialog, Drawer, Popover (Base UI).
- **forms**: Formulário padrão: FieldBlock, FieldGrid, Select, Combobox, Checkbox, Switch, SearchInput, fieldClass.
- **navigation**: Navegação: Sidebar, PageHeading, StickyHeader, Breadcrumb, ContextBar, Tabs, SegmentedControl, ActionMenu, ProductMark.
- **collections**: Coleções: TableToolbar, FacetFilter, DataTable (vira cards no celular), DisplayControls, ListPanel/ListRow, Kanban.
- **feedback**: Feedback de operação: notify/Toaster, Callout, useOperation, OperationButton, OperationFeedback, Skeleton.
- **status**: Status de trabalho (5 estados), StatusLabel, StatusBar, HealthDot, Stepper, NextStep, Timeline.
- **date-picker**: DatePicker (Calendar próprio do DS) e utilitários de data ISO.
- **layout**: Casca: AppShell, ShellBanner, EntityHeader, ReadingColumn, SplitLayout.
- **charts**: Gráficos SVG sem dependência: AreaChart, LineChart, BarChart, Sparkline, BarList, DonutChart, FunnelChart, CalendarHeatmap, ProgressRing.
- **dashboard**: Dashboard: KpiCard, KpiGrid, Delta, ChartCard, GoalMeter, ActivityFeed, Leaderboard, CompareStat.
- **data**: Estado de tabela: useSort, SortHeader, useSelection, selectionColumn, BulkBar, usePagination, Pagination, PropertyList.
- **pipeline**: Pipelines por etapa: StagePath, RecordCard.
- **lib-text**: Texto pt-BR: normalize (busca sem acento), plural, initials.
- **lib-format**: Formatação pt-BR: formatCurrency, formatNumber, formatPercent, formatDelta, formatCompact, formatDate, formatRelative.
- **lib-theme**: Tema e marca: useTheme, applyTheme, themeScript, brandPresets.
- **lib-color**: Utilidades de cor para temas de cliente: contraste WCAG e derivação de uma marca completa (claro + escuro) a partir de 1–2 cores.
- **theme**: ThemeToggle (claro/escuro/sistema).
- **inputs**: Entradas especializadas: TextField, PasswordField, NumberField, CurrencyField, MaskedField (CPF/CNPJ/CEP/telefone), OtpInput, TagInput, Slider, RadioGroup, ChoiceCards, ToggleGroup, FileDropzone, Rating, InlineEdit.
- **charts-advanced**: Gráficos avançados: Treemap, WaterfallChart, ScatterChart, RadarChart, GaugeChart, BulletChart, SankeyChart, HeatmapMatrix, ComboChart, ProportionBar, GanttChart.
- **states**: Estados de tela e avisos: StateView e presets (404, erro, sem acesso, offline), Spinner, LoadingState, Banner, InlineMessage, AlertCard, notifyPromise.
- **overlays-extra**: Tooltip, HoverCard, Menu (submenus, checkbox/radio), ContextMenu, Menubar, Sheet, CommandPalette, Lightbox.
- **disclosure**: Revelação progressiva: Accordion, Collapsible, TreeView, DescriptionToggle.
- **media**: Mídia: Carousel, SlideDeck + helpers de slide, ImageGallery, FileCard, AspectFrame.
- **ai**: Padrões de IA: AskAI, mensagens de chat, SystemMessage, AgentTrace, ToolCallsSection, citações, sugestões.
- **interactive**: Interação e marketing: InputModal, AnimatedModal, LimitDialog, ImageSphere, Hero, FeatureGrid, BeforeAfter, NumberTicker.
- **filters**: Filtros estruturados: FilterBar, filtros ativos, construtor campo/operador/valor, visões salvas, período, estado na URL.
- **search**: Busca: SearchPalette (⌘K global com escopos e prévia) e busca local de tabela ("/").
- **charts-extra**: Gráficos de negócio que as bibliotecas comuns não trazem prontos.
- **charts-shapes**: Formas: pizza/rosca e radial.
- **dates**: Datas e horários. Regras (docs/padroes/datas.md · showcase Formulários › Datas): · valor é ISO só-data ("2026-09-30"); horário "HH:MM"; nada de <input type="date"> · digitar é sempre possível (dd/mm/aaaa, "sexta", "em 3
- **lib-dates**: Datas só-dia em pt-BR, sem dependência.
- **data-grid**: DataGrid: a tabela "de trabalho" do DS.
- **ai-workspace**: Workspace de agente (docs: showcase › IA e interação › Workspace de agente).
- **ai-sessions**: Interface agêntica de sessões (app de trabalho com agente: G4 OS desktop, Codex, T3).
- **brand**: Momentos de marca G4: Navy Blue + Royal Gold + Royal Silver, do manual de marca.
- **connections**: Conexões e apps: marketplace de integrações, detalhe da conexão, permissões por conta e o "cartão do agente" (o que ele acessa, quem ele aciona, o que entrega).
- **email-compose**: Escrever e-mail (com ou sem IA): remetente, destinatários com busca, assunto, corpo, modelo e envio com agendamento.
- **tags**: Etiquetas coloridas (categoria, tipo, status) no estilo "banco de dados": fundo suave + texto AA, 9 matizes em tokens (--ds-tag-*-bg/-fg), claros e escuros.
- **rich-text**: Editor de texto rico LEVE (contentEditable + comandos do navegador).
- **agent-builder**: Construtor de agente: a "ficha" do agente ao lado da conversa com ele.
- **tasks-ai**: Tarefas propostas pela IA (a partir de uma reunião, documento ou análise).
- **record-panel**: Painel lateral de registro (estilo banco de dados): abre ao clicar numa linha da tabela sem tirar a pessoa da lista.
- **collab**: Colaboração entre pessoas (não com a IA): conversa do time ao lado de um documento.
- **ai-layout**: Layout de app agêntico (docs: IA e interação › Layout de app agêntico).
- **structure**: Estrutura: Separator, ScrollArea, Label, FieldSet/FieldGroup/FieldSeparator, Item (mídia · título · ações), Table estática, Prose (texto longo).
- **controls**: Controles: Toggle, ButtonGroup, InputGroup (complementos dentro do campo), ColorPicker.
- **navigation-extra**: NavigationMenu: navegação de site/portal com painéis de links.
- **sortable**: SortableList: reordenar por arraste e teclado, com anúncios pt-BR.
- **questionnaire**: Questionnaire: perguntas uma por vez (escolha, múltipla, livre, condicionais).
- **data-view**: useDataView: busca + filtros + ordenação + paginação + seleção de uma coleção num hook só, na ordem certa (filtra → ordena → pagina) e com o estado na URL.
- **attachment**: Attachment (equivalente ao Attachment do shadcn/ui): anexo componível para composer de IA, mensagens, formulários e listas de documentos.
- **command**: Command componível (equivalente ao Command do shadcn/ui, sem cmdk): busca + lista com grupos, ↑ ↓ Home End Enter, vazio, carregando e atalhos.
- **conversation**: Conversa (equivalentes a Bubble, Marker e Message Scroller do shadcn/ui).

## Blocos (85) → `blocks/<slug>.md` (código em `src/blocks/<slug>.tsx`)
- **ATS**: `ats-candidate`, `ats-candidates`, `ats-careers`, `ats-dashboard`, `ats-interviews`, `ats-job`, `ats-jobs`, `ats-offers`, `ats-pipeline`
- **Aplicação**: `app-collab-doc`, `app-command-palette`, `app-connection`, `app-error-pages`, `app-file-manager`, `app-filtered-list`, `app-global-search`, `app-marketplace`, `app-notifications`, `app-presentation`, `app-record-tracker`
- **Autenticação**: `auth-forgot-password`, `auth-login`, `auth-otp`, `auth-signup`
- **CRM**: `crm-activities`, `crm-company`, `crm-contact`, `crm-contacts`, `crm-deal`, `crm-pipeline`, `crm-sales-dashboard`, `crm-settings`, `crm-team`
- **Configurações**: `settings-appearance`, `settings-audit-log`, `settings-billing`, `settings-integrations`, `settings-notifications`, `settings-profile`, `settings-security`, `settings-team`
- **ERP**: `erp-customers`, `erp-dashboard`, `erp-inventory`, `erp-invoice`, `erp-invoices`, `erp-order`, `erp-orders`, `erp-product`, `erp-purchase-requests`, `erp-suppliers`
- **Financeiro**: `fin-budget`, `fin-cashflow`, `fin-dashboard`, `fin-dre`, `fin-payables`, `fin-receivables`, `fin-reconciliation`
- **IA**: `ai-agent-builder`, `ai-agent-connections`, `ai-agent-run`, `ai-assistant`, `ai-chat`, `ai-codex`, `ai-compose-email`, `ai-conversation`, `ai-projects`, `ai-sessions-artifacts`, `ai-sessions-empty`, `ai-sessions`, `ai-task-proposals`, `ai-trace`, `ai-workspace`
- **Marketing**: `marketing-landing`, `marketing-pricing`
- **Onboarding**: `onboarding-checklist`, `onboarding-wizard`
- **SaaS**: `saas-analytics`, `saas-billing`, `saas-customer`, `saas-customers`, `saas-dashboard`, `saas-integrations`, `saas-reports`, `saas-support`

## Mais
- Regras completas: `AGENTS.md`. Padrões: `docs/padroes/` (anatomia de página, formulários, tabelas, filtros, superfícies, feedback). Receitas por tipo de app: `docs/receitas/`. Auditoria (todas as regras, com exemplos): `docs/guias/auditoria.md`.
- Vindo do shadcn/ui? Traduza por `shadcn-map.json` (Dialog → `Modal`, Alert Dialog → `ConfirmDialog`, Dropdown Menu → `Menu`/`ActionMenu`, Sonner → `notify`, Input → `TextField`, Field → `FieldBlock`). Tabela: `docs/guias/shadcn-equivalencias.md`.
