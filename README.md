# G4OS-DS

[![npm](https://img.shields.io/npm/v/%40g4ai%2Fds.svg?color=202124)](https://www.npmjs.com/package/@g4ai/ds)
[![CI](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/actions/workflows/ci.yml/badge.svg)](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-b9915b.svg)](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/blob/main/LICENSE)

**Site e documentação:** https://gestao-quatro-ponto-zero.github.io/G4OS-DS/ · **npm:** [`@g4ai/ds`](https://www.npmjs.com/package/@g4ai/ds)

Design system para construir **qualquer aplicação G4 OS** — CRM, ATS, ERP, financeiro, IA, portal do cliente, produto SaaS — com a mesma linguagem visual:

- **Tokens** em três camadas (primitivos → semânticos → utilitários), com **tema escuro** e **marcas de cliente** trocando só variáveis.
- **Componentes**: React 19 + Base UI + Tailwind v4, em português, acessíveis, responsivos. Gráficos em SVG sem dependência.
- **Blocos**: 85+ telas completas (dashboards, pipelines, registros, listas, IA, login, configurações) para copiar e trocar os dados.
- **Feito para agentes**: servidor MCP, `llms.txt`, guia `ai/` gerado do código e skills para Claude Code.

## Instalar

Requisitos: React 19, Tailwind CSS 4, Node 20+.

```bash
pnpm add @g4ai/ds @base-ui/react lucide-react        # ou npm i / yarn add
pnpm add -D tailwindcss @tailwindcss/postcss         # Vite: @tailwindcss/vite
npx g4os-ds doctor                                    # confere React, Tailwind, CSS, tema e fonte
```

```css
/* app/globals.css (Next) ou src/index.css (Vite) */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";   /* tokens, temas, componentes; já traz os @source do DS */
```

O pacote publica JavaScript compilado (ESM com `"use client"`) e tipos, junto com o CSS e o código-fonte que o Tailwind lê. Não precisa de `transpilePackages` nem plugin extra.

### Next.js (App Router)

```tsx
// app/layout.tsx
import { themeScript } from "@g4ai/ds";
import { DsSetup } from "@/lib/ds";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="ds-app" data-theme="system" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><DsSetup />{children}</body>
    </html>
  );
}
```

```tsx
// lib/ds.tsx — registra o Link do Next nos componentes com href
"use client";
import Link from "next/link";
import { setLinkComponent } from "@g4ai/ds";
setLinkComponent(Link);
export function DsSetup() { return null; }
```

Starter completo: [`templates/next-app`](templates/next-app) · guia: [docs/guias/next.md](docs/guias/next.md).

### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { themeScript } from "@g4ai/ds/lib/theme";

// Aplica o tema salvo antes da primeira pintura (sem piscar).
const dsTheme = { name: "ds-theme", transformIndexHtml: () => [{ tag: "script", children: themeScript, injectTo: "head-prepend" as const }] };

export default defineConfig({ plugins: [react(), tailwindcss(), dsTheme] });
```

```html
<!-- index.html -->
<html lang="pt-BR" class="ds-app" data-theme="system">
```

Guia: [docs/guias/vite.md](docs/guias/vite.md).

### Usar

```tsx
import { AppShell, Sidebar, Page, PageHeading, KpiGrid, KpiCard, ChartCard, AreaChart, formatCurrency } from "@g4ai/ds";
```

Para começar uma tela, copie o bloco mais parecido de `node_modules/@g4ai/ds/src/blocks/` (ou do site, aba **Código**) e troque os dados.

## Tema, dark mode e marca

```html
<html data-theme="dark">                <!-- light | dark | system; ThemeToggle/useTheme trocam e salvam -->
<html data-brand="g4-institucional">    <!-- presets de marca; ou o seu [data-brand="acme"] com --ds-primary… -->
<html data-type="editorial">            <!-- presets de tipografia -->
```

Marca de cliente com contraste AA (claro e escuro): skill `ds-theme`, ferramenta MCP `theme_from_colors` ou [docs/fundamentos/temas-e-dark-mode.md](docs/fundamentos/temas-e-dark-mode.md).

## Usar com IA

**MCP** (Claude Code, Codex, Cursor, VS Code, Gemini CLI, Zed, Windsurf, pi, qualquer cliente MCP). Roda local, lê a versão instalada do DS, sem rede:

```bash
claude mcp add g4os-ds -- npx -y @g4ai/ds mcp     # Claude Code
codex mcp add g4os-ds -- npx -y @g4ai/ds mcp      # Codex
```

```json
// Cursor, Claude Desktop, Windsurf, Gemini CLI… · VS Code (.vscode/mcp.json) usa "servers" no lugar de "mcpServers"
{ "mcpServers": { "g4os-ds": { "command": "npx", "args": ["-y", "@g4ai/ds", "mcp"] } } }
```

Config de cada cliente, Windows, modo HTTP (`npx -y @g4ai/ds mcp --http`) e problemas comuns: [docs/guias/mcp.md](docs/guias/mcp.md).

Ferramentas: `search`, `get_component`, `list_blocks`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit`, `doctor`. Prompts: `criar-tela`, `revisar-tela`, `adaptar-projeto`.

**Web** (para agentes que só leem URLs):

- https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms.txt — índice
- https://gestao-quatro-ponto-zero.github.io/G4OS-DS/llms-full.txt — tudo num arquivo
- `…/ai/core.md`, `…/ai/components/<módulo>.md`, `…/ai/blocks/<slug>.md`, `…/ai/manifest.json`, `…/docs/…`

**No projeto**: `node_modules/@g4ai/ds/ai/core.md` é a porta de entrada. Cole [`templates/AGENTS.snippet.md`](templates/AGENTS.snippet.md) no `AGENTS.md`/`CLAUDE.md` do app.

**Plugin do Claude Code** (skills `g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`, `ds-theme`):

```text
/plugin marketplace add Gestao-Quatro-Ponto-Zero/G4OS-DS
/plugin install g4os-ds@g4os
```

Depois peça: *"Adapte este projeto ao G4OS-DS"*, *"Crie a tela de pedidos com o design system"*, *"Revise esta tela"*, *"Tema do cliente Acme, azul #0b5cff"*. Guia: [docs/guias/usar-com-ia.md](docs/guias/usar-com-ia.md) · no site: **Guias › Agentes de IA**.

## CLI

```bash
npx g4os-ds doctor                    # o projeto pode usar o DS?
npx g4os-ds audit src --fix-hints     # o que foge do DS, com a troca sugerida (--json para acompanhar)
npx g4os-ds guide                     # imprime o caminho do guia ai/core.md
npx g4os-ds mcp                       # servidor MCP (stdio; --http para Streamable HTTP)
```

## Atualizar de versão

```bash
pnpm up @g4ai/ds                      # ou npm i @g4ai/ds@latest
npx g4os-ds audit src                 # aponta nomes antigos e o que mudou de regra
```

Leia o [CHANGELOG](CHANGELOG.md) entre a sua versão e a nova: cada entrada diz o que o app precisa fazer. Renomeações ficam em `ai/renames.json`; com o plugin, peça *"Atualize o @g4ai/ds e ajuste o código"* (skill `ds-migrate`, modo atualização). Seguimos [SemVer](https://semver.org/lang/pt-BR/): enquanto estivermos em `0.x`, mudança que quebra sobe o **minor** e vem com "como migrar".

## Documentação

| Para | Onde |
| --- | --- |
| Ver e copiar componentes e blocos | [site](https://gestao-quatro-ponto-zero.github.io/G4OS-DS/) (⌘K busca tudo) |
| Instalar e configurar | [instalação](docs/guias/instalacao.md) · [Next](docs/guias/next.md) · [Vite](docs/guias/vite.md) · [shadcn/21st.dev](docs/guias/shadcn.md) |
| Migrar um projeto existente | [migração](docs/guias/migracao.md) |
| Montar telas | [anatomia de página](docs/padroes/anatomia-de-pagina.md) · [padrões](docs/padroes) · [blocos](ai/blocks) |
| Montar um app inteiro | [receitas](docs/receitas): CRM, ATS, ERP, financeiro, portal do cliente |
| Fundamentos | [tokens](docs/fundamentos/tokens.md) · [temas e dark mode](docs/fundamentos/temas-e-dark-mode.md) · [escrita](docs/fundamentos/escrita.md) |
| Regras para quem constrói (pessoas e agentes) | [AGENTS.md](AGENTS.md) |

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

Exemplos vivos, regras e props: [site](https://gestao-quatro-ponto-zero.github.io/G4OS-DS/) ou `ai/components/<arquivo>.md`. A lista completa está em [`src/index.ts`](src/index.ts).

## Blocos

Arquivos em `src/blocks/` (também no pacote: `node_modules/@g4ai/ds/src/blocks/`). Cada bloco importa só de `@g4ai/ds`, traz os dados de exemplo no topo, funciona de 320 a 1440 px e explica o **conceito** (objetivo, padrões, quando usar, o que evitar) em `ai/blocks/<slug>.md`.

| Categoria | Exemplos |
| --- | --- |
| SaaS | `saas-dashboard`, `saas-analytics`, `saas-customers` |
| CRM | `crm-sales-dashboard`, `crm-pipeline`, `crm-deal`, `crm-contacts`, `crm-company` |
| ATS | `ats-dashboard`, `ats-jobs`, `ats-pipeline`, `ats-candidate`, `ats-interviews` |
| ERP | `erp-orders`, `erp-inventory`, `erp-purchase-requests`, `erp-invoice` |
| Financeiro | `fin-dashboard`, `fin-cashflow`, `fin-receivables`, `fin-dre`, `fin-reconciliation` |
| IA | `ai-workspace`, `ai-chat`, `ai-sessions`, `ai-trace`, `ai-agent-builder`, `ai-agent-connections` |
| Aplicação | `app-command-palette`, `app-notifications`, `app-file-manager`, `app-error-pages`, `app-presentation` |
| Autenticação, configurações, onboarding | `auth-login`, `auth-otp`, `settings-team`, `settings-billing`, `onboarding-wizard` |

Catálogo completo com objetivo de cada um: [ai/llms.txt](ai/llms.txt) ou `list_blocks` no MCP. Qual bloco usar por tipo de app: [AGENTS.md](AGENTS.md#qual-bloco-usar).

## shadcn/ui e 21st.dev

Para o que o DS não tem, traga do shadcn/ui ou do 21st.dev e importe `@g4ai/ds/shadcn.css`: as variáveis do shadcn passam a apontar para os tokens do DS. Colisões (`bg-accent`, `bg-muted`) e checklist: [docs/guias/shadcn.md](docs/guias/shadcn.md).

## Contribuir

```bash
git clone https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS.git && cd G4OS-DS
npm ci
npm run showcase:watch                # site local em showcase/dist
npm run check                         # tokens + tipos + ai/ em dia + auditoria (critério de pronto)
npx changeset                         # descreve a mudança: patch, minor ou major
```

**Como sai uma versão:** o PR com changeset entra na `main` → o GitHub Actions abre (ou atualiza) o PR **"Versão de lançamento"** com o novo número e o CHANGELOG → ao mesclar esse PR, o pacote é publicado no npm automaticamente (Trusted Publishing, com provenance). Ninguém roda `npm publish` à mão. O site é republicado a cada push na `main`.

Fluxo completo: [CONTRIBUTING.md](CONTRIBUTING.md) · contratos técnicos (componente, bloco, página do site): [docs/guias/contribuir.md](docs/guias/contribuir.md).

| Comando | Faz |
| --- | --- |
| `npm run check` | tokens CSS ↔ TS + TypeScript + `ai/` em dia + auditoria do próprio DS |
| `npm run build` | compila `dist/` (o que vai para o npm) |
| `npm run ai:build` | regenera `ai/` (guia para agentes) a partir do código |
| `npm run showcase` | compila o site e serve em http://localhost:4173 |
| `npm run showcase:watch` | recompila o site a cada mudança |

## Mapa do repositório

```
src/           styles/ (tokens, temas, componentes, shadcn.css) · tokens/ · lib/ · components/ · blocks/ · index.ts
showcase/      site de documentação (main.tsx, kit.tsx, pages/*.tsx, build.mjs → também gera llms.txt)
docs/          fundamentos · padroes · receitas · guias
ai/            gerado: core.md · tokens.md · components/*.md · blocks/*.md · manifest.json · llms.txt · renames.json
scripts/       cli.mjs (g4os-ds audit | doctor | guide | mcp) · mcp.mjs · build-ai-docs.mjs · build-lib.mjs
plugin/        plugin do Claude Code (skills) · .claude-plugin/marketplace.json
templates/     next-app (starter) · AGENTS.snippet.md
AGENTS.md      regras obrigatórias e qual bloco usar · CHANGELOG.md  o que mudou e o que o app precisa fazer
```

## Licença

Código sob [licença MIT](LICENSE). Os nomes e marcas "G4", "G4 OS" e "G4 Educação" não são cobertos pela licença: ao usar o DS em outro produto, troque a marca (`ProductMark`, nome do produto) pela sua.
