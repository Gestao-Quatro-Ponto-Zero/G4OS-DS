# G4OS-DS

[![npm](https://img.shields.io/npm/v/@g4ai/ds?color=202124&label=%40g4ai%2Fds)](https://www.npmjs.com/package/@g4ai/ds)
[![CI](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/actions/workflows/ci.yml/badge.svg)](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/actions/workflows/ci.yml)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-b9915b)](LICENSE)

**Site e documentação:** https://gestao-quatro-ponto-zero.github.io/G4OS-DS/

Design system para construir **qualquer aplicação G4 OS** — CRM, ATS, ERP, financeiro, portal do cliente, produto SaaS — com a mesma linguagem visual. Três camadas:

- **Tokens** em três camadas (primitivos → semânticos → utilitários), com **tema escuro** e **marcas de cliente** trocando só variáveis.
- **Componentes**: React 19 + Base UI + Tailwind v4, em português, acessíveis, responsivos. Gráficos em SVG sem dependência.
- **Blocos**: telas completas (dashboards, pipelines, registros, listas, login, configurações, onboarding) para copiar e trocar os dados.

A linguagem visual nasceu no G4 Delivery e foi generalizada: superfície e gelo, ação em tinta escura (ou na cor da marca do cliente), dourado só como gesto de marca, borda em vez de sombra, número com contexto, português claro. Agentes de IA aplicam o DS em qualquer repositório com o guia `ai/`, a CLI `g4os-ds` e as skills em `plugin/` ([usar com IA](docs/guias/usar-com-ia.md)).

## Começar

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react      # ou: npm i … / yarn add …
pnpm add -D tailwindcss @tailwindcss/postcss
```

O pacote publica JavaScript compilado (ESM, com `"use client"`) e tipos; o CSS e o código-fonte vão junto para o Tailwind ler as classes. Funciona em Next.js (App Router) e Vite sem configuração extra.

```css
/* globals.css */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";   /* já traz os @source do DS */
/* opcional, para shadcn/ui e 21st.dev: @import "@g4ai/ds/shadcn.css"; */
```

```tsx
// layout raiz
<html lang="pt-BR" className="ds-app" data-theme="system">   // + fonte Figtree
  <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>   // tema salvo, sem piscar

// uma vez, no cliente (Next.js)
import Link from "next/link";
import { setLinkComponent } from "@g4ai/ds";
setLinkComponent(Link);

```

```tsx
import { AppShell, Sidebar, Page, PageHeading, KpiGrid, KpiCard, ChartCard, AreaChart, formatCurrency } from "@g4ai/ds";
```

Guia completo: [docs/guias/instalacao.md](docs/guias/instalacao.md). Starter pronto: [templates/next-app](templates/next-app). Regras para quem constrói (inclusive agentes de IA): [AGENTS.md](AGENTS.md).

## Usar com IA

```text
/plugin marketplace add ../G4OS-DS      # ou a URL git
/plugin install g4os-ds@g4os
```

Depois, no projeto: *"Adapte este projeto ao G4OS-DS"*, *"Crie a tela de pedidos com o design system"*, *"Revise esta tela"*, *"Tema do cliente Acme, azul #0b5cff"*. Sem plugin, cole [`templates/AGENTS.snippet.md`](templates/AGENTS.snippet.md) no `AGENTS.md` do projeto.

```bash
npx g4os-ds doctor              # o projeto pode usar o DS? (React 19, Tailwind v4, CSS, tema…)
npx g4os-ds audit src --fix-hints   # o que foge do DS, com a troca sugerida; --json para acompanhar migração
```

Guia: [docs/guias/usar-com-ia.md](docs/guias/usar-com-ia.md) · migração: [docs/guias/migracao.md](docs/guias/migracao.md) · temas: [docs/fundamentos/temas-e-dark-mode.md](docs/fundamentos/temas-e-dark-mode.md).

## Scripts

| Comando | Faz |
| --- | --- |
| `npm run check` | tokens CSS ↔ TS + TypeScript + `ai/` em dia + auditoria do próprio DS (critério de pronto) |
| `npm run ai:build` | regenera `ai/` (guia para agentes) a partir do código |
| `npm run audit:self` | `g4os-ds audit` em `src/` e `templates/` |
| `npm run check:tokens` | só a paridade de tokens |
| `npm run typecheck` | gera o registro do showcase e roda `tsc` |
| `npm run showcase:build` | compila o site de documentação em `showcase/dist` |
| `npm run showcase:watch` | recompila a cada mudança |
| `npm run showcase` | build + servidor em http://localhost:4173 |

## Mapa do repositório

```
src/
  styles/      tokens.css (3 camadas, claro/escuro) · themes.css (marcas) · base.css · components.css ·
               index.css (entrada, com @source) · shadcn.css (ponte opcional)
  tokens/      espelho TS dos tokens (color / colorDark) para canvas, PDF, e-mail
  lib/         cn · format (pt-BR) · text · portal · theme (useTheme, themeScript) · color (contraste, deriveBrand)
  components/  componentes por família (abaixo)
  blocks/      telas completas, um arquivo por bloco
  index.ts     exporta tudo
showcase/      site de documentação (main.tsx, kit.tsx, pages/*.tsx, build.mjs)
docs/
  fundamentos/ tokens · temas e dark mode · cor · tipografia · espaço e forma · movimento · dados · iconografia · escrita
  padroes/     layout e navegação · densidade · formulários · tabelas e coleções · superfícies ·
               feedback e estados · dashboards · pipelines · acessibilidade · responsivo
  receitas/    crm · ats · erp · financeiro · portal do cliente
  guias/       instalação · next · shadcn (e 21st.dev) · migração · usar com IA · contribuir
ai/            guia gerado para agentes: core.md · components/*.md · blocks/*.md · tokens.md · manifest.json · llms.txt · renames.json
scripts/       cli.mjs (g4os-ds audit | doctor | guide) · build-ai-docs.mjs · check-tokens.mjs
plugin/        plugin do Claude Code: skills g4os-ds · ds-create · ds-migrate · ds-review · ds-theme
.claude/skills ds-contribute (para quem mexe neste repositório)
templates/     next-app (starter App Router) · AGENTS.snippet.md (colar no projeto que usa o DS)
AGENTS.md      regras obrigatórias, 10 passos para um app novo, qual bloco usar
CHANGELOG.md   o que mudou por versão e o que o app precisa fazer
```

## Componentes

Todos exportados por `@g4ai/ds` (ou por módulo: `@g4ai/ds/components/<arquivo>`).

| Família | Arquivo | Exporta |
| --- | --- | --- |
| **Primitivos** | `primitives` | `Button`, `IconButton`, `buttonClass`, `FilterChip`, `Badge`, `Dot`, `CriticalFlag`, `Avatar`, `AvatarGroup`, `EntityMark`, `Card`, `LinkedCard`, `CardAction`, `Section`, `Field`, `FactLine`, `Metric`, `StatGrid`, `StatCell`, `Meter`, `Empty`, `Page`, `Kbd`, `DsLink`, `setLinkComponent`, `Tone`, `toneDot`, `toneText` |
| **Formulários base** | `forms` | `FieldBlock`, `FieldGrid`, `fieldClass`, `areaClass`, `Select`, `Combobox`, `Checkbox`, `Switch`, `SearchInput` |
| **Campos** | `inputs` | `TextField`, `TextareaField`, `PasswordField`, `passwordStrength`, `NumberField`, `CurrencyField`, `MaskedField`, `masks`, `applyMask`, `OtpInput`, `TagInput`, `Slider`, `RadioGroup`, `ChoiceCards`, `ToggleGroup`, `FileDropzone`, `Rating`, `InlineEdit` |
| **Data** | `date-picker` | `DatePicker`, `toDate`, `toIso`, `formatIsoDate` |
| **Navegação** | `navigation` | `Sidebar`, `ProductMark`, `SyncStatus`, `PageHeading`, `StickyHeader`, `Breadcrumb`, `ContextBar`, `Tabs`, `SegmentedControl`, `ActionMenu`, `actionMenuTriggerClass` |
| **Layout** | `layout` | `AppShell`, `ShellBanner`, `EntityHeader`, `SplitLayout`, `ReadingColumn` |
| **Recolhíveis** | `disclosure` | `Accordion`, `Collapsible`, `TreeView`, `DescriptionToggle` |
| **Sobreposições** | `overlays` | `Modal`, `ConfirmDialog`, `Drawer`, `Popover`, `popupClass` |
| **Sobreposições extras** | `overlays-extra` | `Tooltip`, `TooltipGroup`, `HoverCard`, `Menu`, `ContextMenu`, `Sheet`, `CommandPalette`, `useCommandShortcut`, `Lightbox` |
| **Feedback** | `feedback` | `notify`, `Toaster`, `Callout`, `useOperation`, `OperationButton`, `OperationFeedback`, `UncertainFailure`, `Skeleton` |
| **Estados** | `states` | `StateView`, `NotFoundState`, `ErrorState`, `ForbiddenState`, `OfflineState`, `MaintenanceState`, `SuccessState`, `LoadingState`, `LoadingOverlay`, `Spinner`, `Banner`, `InlineMessage`, `AlertCard`, `CountBadge`, `NotificationDot` |
| **Status e progresso** | `status` | `StatusLabel`, `HealthDot`, `StatusBar`, `Stepper`, `NextStep`, `Timeline`, `statusColor`, `statusLabel`, `statusOrder` |
| **Coleções** | `collections` | `TableToolbar`, `FacetFilter`, `DataTable`, `Column`, `DisplayControls`, `DensityControl`, `useCollectionDisplay`, `ListPanel`, `ListRow`, `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `collectionThresholds` |
| **Estado de tabela** | `data` | `useSort`, `SortHeader`, `useSelection`, `selectionColumn`, `BulkBar`, `usePagination`, `Pagination`, `PropertyList` |
| **Pipelines** | `pipeline` | `StagePath`, `RecordCard` |
| **Dashboard** | `dashboard` | `KpiCard`, `KpiGrid`, `Delta`, `ChartCard`, `GoalMeter`, `CompareStat`, `ActivityFeed`, `Leaderboard` |
| **Gráficos** | `charts` | `AreaChart`, `LineChart`, `BarChart`, `Sparkline`, `BarList`, `DonutChart`, `FunnelChart`, `CalendarHeatmap`, `ProgressRing`, `ChartTooltip`, `ChartLegend`, `chartColor` |
| **Gráficos avançados** | `charts-advanced` | `Treemap`, `WaterfallChart`, `ScatterChart`, `RadarChart`, `GaugeChart`, `BulletChart`, `SankeyChart`, `HeatmapMatrix`, `ComboChart`, `ProportionBar`, `GanttChart` |
| **Mídia e conteúdo** | `media` | `Carousel`, `SlideDeck`, `Slide`, `SlideTitle`, `SlideBullets`, `SlideSplit`, `SlideStat`, `SlideQuote`, `SlideCanvas`, `ImageGallery`, `AspectFrame`, `FileCard`, `FileIcon`, `formatBytes` |
| **Utilitários** | `lib/*` | `cn`, `formatCurrency`, `formatNumber`, `formatPercent`, `formatDelta`, `formatCompact`, `formatDate`, `formatRelative`, `normalize`, `plural`, `initials`, `usePortalContainer`, `tokens` |

Exemplos vivos, regras e props de cada um: rode `npm run showcase` e abra **Componentes**, **Gráficos** e **Dashboards**.

## Blocos

Arquivos em `src/blocks/`. Cada um importa só de `@g4ai/ds`, traz os dados de exemplo no topo e funciona de 320 a 1440 px. No showcase, **Blocos** mostra Preview (desktop/tablet/celular) e Código.

| Categoria | Bloco | O que é |
| --- | --- | --- |
| SaaS | `saas-dashboard` | Dashboard de produto: sidebar, KPIs com variação, área com seletor de período, contas recentes |
| SaaS | `saas-analytics` | Aquisição: funil em colunas, origem do tráfego, dispositivos, conversão no tempo, mapa de atividade |
| SaaS | `saas-customers` | Clientes: busca, filtros, ordenação, seleção com ações em massa, paginação, detalhe em drawer |
| CRM | `crm-sales-dashboard` | Painel comercial: meta com ritmo, receita × meta, funil, ranking de vendedores, motivos de perda |
| CRM | `crm-pipeline` | Pipeline: quadro por etapa com soma de valor, previsão ponderada, filtros, arrastar entre etapas |
| CRM | `crm-deal` | Negócio: caminho de etapas, propriedades, nota rápida, atividade, contatos e tarefas |
| CRM | `crm-contacts` | Empresas e contatos: abas, filtros, ordenação, lista/cards, ações rápidas |
| ATS | `ats-dashboard` | Recrutamento: tempo até contratar × SLA, funil, contratações/mês, aceite, qualidade por origem |
| ATS | `ats-jobs` | Vagas abertas: distribuição por etapa, tempo em aberto × SLA, recrutador, filtros por área |
| ATS | `ats-pipeline` | Candidatos da vaga: quadro por etapa com nota média, origem, tempo na etapa |
| ATS | `ats-candidate` | Perfil do candidato: etapas, avaliações por critério e entrevistador, currículo, agenda |
| ERP | `erp-orders` | Pedidos de venda: abas por situação, totais do dia, faturamento em massa, detalhe com itens |
| ERP | `erp-inventory` | Estoque: saldo × mínimo, cobertura em dias, ruptura com ação de compra, valor por categoria |
| ERP | `erp-purchase-requests` | Requisições de compra: cadeia de aprovação, cotações comparadas, aprovar/recusar |
| ERP | `erp-invoice` | Nota fiscal (NF-e) em formato de leitura e impressão |
| Financeiro | `fin-cashflow` | Fluxo de caixa: entradas × saídas, saldo projetado × mínimo, cascata do mês, contas a pagar |
| Financeiro | `fin-receivables` | Contas a receber: aging, inadimplência, prazo médio, cobrança individual e em massa |
| Financeiro | `fin-dre` | DRE gerencial: grupos expansíveis, realizado × orçado, análise vertical, cascata, margens |
| Autenticação | `auth-login` | Entrar: e-mail e senha, SSO, link mágico, painel de marca navy |
| Autenticação | `auth-signup` | Criar conta em duas etapas, força de senha, termos, SSO |
| Autenticação | `auth-otp` | Verificar código de 6 dígitos: colar, verificação automática, reenvio com contagem |
| Autenticação | `auth-forgot-password` | Redefinir senha de ponta a ponta, sem revelar se o e-mail existe |
| Configurações | `settings-profile` | Perfil com subnavegação, alterações não salvas e zona de perigo |
| Configurações | `settings-team` | Equipe e permissões: papéis, convites, licenças, remoção com confirmação |
| Configurações | `settings-billing` | Plano e cobrança: uso × limites, troca de plano, pagamento, faturas |
| Configurações | `settings-notifications` | Matriz evento × canal, resumo diário, horário de silêncio |
| Onboarding | `onboarding-wizard` | Assistente em 4 passos com trilha lateral e conclusão |
| Onboarding | `onboarding-checklist` | Primeiros passos com progresso e ação direta |
| Aplicação | `app-command-palette` | Paleta de comandos ⌘K |
| Aplicação | `app-notifications` | Central de notificações |
| Aplicação | `app-file-manager` | Gerenciador de arquivos com árvore, grade/lista, envio e prévia |
| Aplicação | `app-error-pages` | 404, 500, 403, offline e manutenção dentro da casca |
| Aplicação | `app-presentation` | Apresentação (QBR) com os layouts de slide do DS |

Qual bloco usar para cada tipo de app: [AGENTS.md](AGENTS.md#qual-bloco-usar). Como montar cada app: [docs/receitas](docs/receitas).

## shadcn/ui e 21st.dev

Para o que o DS não tem, traga do shadcn/ui ou do 21st.dev e importe `@g4ai/ds/shadcn.css`: as variáveis do shadcn passam a apontar para os tokens do DS. Leia as colisões (`bg-accent`, `bg-muted`) e o checklist em [docs/guias/shadcn.md](docs/guias/shadcn.md).

## Contribuir

Novo componente, página de documentação ou bloco: [docs/guias/contribuir.md](docs/guias/contribuir.md). Critério de pronto: `npm run check` verde e tela conferida em 1440 e 390 px.


## Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md) (fluxo, verificação, changesets) e [docs/guias/contribuir.md](docs/guias/contribuir.md) (contratos técnicos). Releases saem automaticamente pelo GitHub Actions.

## Licença

Código sob [licença MIT](LICENSE). Os nomes e marcas "G4", "G4 OS" e "G4 Educação" não são cobertos pela licença: ao usar o DS em outro produto, troque a marca (`ProductMark`, nome do produto) pela sua.
