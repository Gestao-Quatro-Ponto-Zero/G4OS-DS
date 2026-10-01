# G4OS-DS · guia essencial para agentes (v0.2.1)

Leia isto antes de escrever ou mudar qualquer UI num projeto que usa `@g4ai/ds`. Os detalhes estão ao lado, em `ai/` (mesma pasta deste arquivo): `tokens.md`, `components/<módulo>.md` (props e exemplos), `blocks/<bloco>.md`, `manifest.json` (tudo em JSON). Leia só o módulo de que precisar.

## Como decidir
1. **Bloco pronto** (`src/blocks/<slug>.tsx`): copie o arquivo inteiro e troque os dados do topo. Veja o catálogo abaixo.
2. **Composição de componentes do DS** (import de `@g4ai/ds`).
3. Componente do DS com outras props. 4. shadcn/21st com a ponte `@g4ai/ds/shadcn.css`. 5. Do zero, só com tokens.

## Regras (resumo de AGENTS.md; todas obrigatórias)
1. **Só tokens semânticos**: `bg-page` (fundo), `bg-surface` (card/painel/campo), `bg-popover` (menu/modal), `bg-soft` (hover, cabeçalho), `text-ink` / `text-ink-soft` / `text-muted`, `border-line` / `border-line-strong`. Ação e seleção: `bg-primary text-on-primary`. Texto sobre preenchimento forte (`bg-ink`, `bg-rose`, `bg-ok`): `text-on-ink`. Estados: `ok`, `amber`, `rose`, `info` (+ `-soft` para fundo). **Proibido**: hex, `bg-white`, `text-white` (exceto sobre `bg-navy`), paleta do Tailwind (`gray-500`, `blue-600`…), `bg-muted` (no DS `muted` é cor de texto).
2. **Texto na escala**: `text-caption` 12 · `text-label` 12.5 · `text-control` 13 · `text-body` 13.5 · `text-input` 14 · `text-section` 18 · `text-title` 25 (ou `text-[13.5px]` etc. só com valores da escala).
3. Superfícies separam por **borda de 1 px**, não sombra. Cor sempre com palavra. Número bom não grita.
4. **Um primário por área**; resto `ghost`; secundárias no `ActionMenu`; `danger` só dentro de `ConfirmDialog`.
5. **Nunca** `<select>` nativo (`Select`/`Combobox`), `<input type="date">` (`DatePicker`), `window.confirm` (`ConfirmDialog`), `alert` (`notify`).
6. Rótulo visível acima de todo campo (`FieldBlock` ou `label` dos campos de `inputs`).
7. Superfície certa: página = entidade; `Drawer` = criar/editar sem perder a lista; `Modal` = decisão curta; `ConfirmDialog` = irreversível; drawer nunca abre drawer.
8. Controles só quando há o que controlar: busca ≥ 12 itens, filtros ≥ 8, alternador de visão ≥ 8.
9. **Números e datas por `formatCurrency/formatNumber/formatPercent/formatDelta/formatDate/formatRelative`** (pt-BR). Nada de `toFixed`, `"R$ " +`, `toLocaleString("en-US")`.
10. **Gráficos do DS** (sem Recharts): série 1 = ink, comparação tracejada, eixo em zero, título = pergunta, `label` obrigatório.
11. **Cinco estados** em todo dado: carregando (`Skeleton`), vazio (`Empty` com próxima ação), vazio por filtro (com "Limpar"), erro (com saída), ideal.
12. Toast (`notify`) só depois de terminar; particípio + objeto; "Desfazer" quando reversível; `useOperation` enquanto executa.
13. **pt-BR**: verbo + objeto nos botões ("Criar vaga"), sem exclamação, sem "com sucesso", só a primeira letra maiúscula.
14. Acessível: teclado, foco visível, nome acessível (`IconButton` exige `label`), cor nunca sozinha, `prefers-reduced-motion`.
15. Responsivo 320–1440 px sem rolagem horizontal. `<html lang="pt-BR" className="ds-app" data-theme="system">`.
16. **Tema e marca**: tudo funciona em `data-theme="dark"` e em qualquer `data-brand` se a regra 1 for seguida. `useTheme`, `ThemeToggle`, `themeScript` (no `<head>`). `dark:` só para ajuste fino de imagem.
17. Ícones lucide 16 px. Links do framework via `setLinkComponent(Link)` uma vez.

## Verificar (sempre)
- `npx g4os-ds audit <pasta>` sem erros (`--json` para acompanhar migração). `npx g4os-ds doctor` confere pré-requisitos.
- TypeScript do app verde. Telas em 1440 e 390 px, claro e escuro.

## Tokens em uma linha
Fundos `page · surface · popover · soft · rail` · texto `ink · ink-soft · muted` · linhas `line · line-strong` · ação `primary / on-primary` · sobre forte `on-ink` · marca `navy · blue · clay · accent (só preenchimento) · accent-deep (texto) · accent-soft` · estados `ok · amber · rose · info` (+`-soft`) · dados `chart-1…6 · chart-grid`. Raios `rounded-lg` controle, `rounded-xl` card/popup, `rounded-2xl` modal. Tabela completa: `tokens.md`.

## Módulos (358 componentes) → `ai/components/<nome>.md`
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
- **overlays-extra**: Tooltip, HoverCard, Menu (submenus, checkbox/radio), ContextMenu, Sheet, CommandPalette, Lightbox.
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

## Blocos (85) → `ai/blocks/<slug>.md`
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

## Documentação humana (no pacote)
`AGENTS.md` (regras completas), `docs/fundamentos/` (cor, tokens, temas, tipografia, dados, escrita), `docs/padroes/` (layout, densidade, formulários, tabelas, filtros, superfícies, feedback, dashboards, pipelines, acessibilidade, responsivo), `docs/receitas/` (CRM, ATS, ERP, financeiro, portal), `docs/guias/` (instalação, migração, shadcn, usar com IA).
