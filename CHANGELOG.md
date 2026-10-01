# Changelog

## 0.4.0

### Minor Changes

- 230126c: Servidor MCP compatível com os principais clientes (Claude Code, Codex, Cursor, VS Code/Copilot, Gemini CLI, Zed, Windsurf, Cline, Continue, Goose, JetBrains, opencode, pi via adaptador).

  - Negocia os protocolos 2024-11-05, 2025-03-26, 2025-06-18 e 2025-11-25.
  - stdio mais robusto: CRLF, BOM, pedaços parciais, lotes respondidos como lote, EOF sem quebra de linha, SIGTERM, stdout só para o protocolo.
  - Schemas de entrada portáveis (Gemini, OpenAI): sem `default`, inteiros como `integer`. Argumentos inválidos voltam como `isError` para o modelo corrigir.
  - Prompts `criar-tela`, `revisar-tela` e `adaptar-projeto`; templates de recurso com autocompletar; `logging/setLevel`; `completion/complete`.
  - Respostas longas paginadas com `offset` (cabem no limite do Claude Code); `search` e `audit` com `offset`.
  - Novo modo Streamable HTTP local: `npx -y @g4ai/ds mcp --http [--port 3845]`.
  - Novo guia `docs/guias/mcp.md` com a config de cada cliente, Windows e problemas comuns. Testes com o SDK oficial: `npm run test:mcp`.

## 0.3.0

### Minor Changes

- 2110022: Docs e ferramentas para agentes de IA, e instruções de uso pelo npm.

  - Novo `g4os-ds mcp`: servidor MCP local (sem dependências) com `search`, `get_component`, `list_blocks`, `get_block`, `get_guide`, `get_tokens`, `theme_from_colors`, `audit` e `doctor`. Instale com `claude mcp add g4os-ds -- npx -y @g4ai/ds mcp`.
  - Site publica `llms.txt`, `llms-full.txt`, `ai/` e `docs/` para agentes que leem URLs.
  - `ai/blocks/*.md` agora traz o conceito de cada bloco (objetivo, padrões, o que adaptar, o que evitar) e a lista de componentes usados (estava vazia desde a troca de nome do pacote).
  - `g4os-ds doctor` não pede mais `transpilePackages` quando o pacote vem do npm (compilado).
  - README, guias (novo: Vite), starter `templates/next-app` e skills passam a instalar pelo npm (`pnpm add @g4ai/ds`). Nova seção "Atualizar de versão".

  O que o app precisa fazer: nada. Se o seu `next.config` tem `transpilePackages: ["@g4ai/ds"]` e o pacote vem do npm, pode remover.

## 0.2.1

### Patch Changes

- 80e2fde: README: selos do npm e da licença corrigidos (exibem no npmjs.com) e link da licença absoluto.

Formato: versão · o que mudou · o que o app precisa fazer. Renomeações ficam também em `ai/renames.json` (lidas pela skill `ds-migrate` e pelo `audit`).

## 0.2.0

**Tokens em três camadas, tema escuro e marcas**

- Primitivos `--g4-*` → semânticos `--ds-*` → utilitários Tailwind. Novos utilitários: `bg-surface`, `bg-popover`, `bg-primary`/`text-on-primary`, `text-on-ink`.
- Tema escuro por `<html data-theme="light|dark|system">`; `useTheme`, `ThemeToggle`, `themeScript`. Variante `dark:` ligada a `data-theme`.
- Marcas de cliente por `data-brand` (presets em `themes.css`); `deriveBrand`/`brandCss`/`contrast` em `@g4ai/ds`. Raios escalam com `--ds-radius-scale`; fonte por `--ds-font-sans`.
- `styles.css` já declara os `@source` do DS: o `@source "../node_modules/@g4ai/ds/src"` no app virou opcional.
- **App precisa**: trocar `bg-white` → `bg-surface`/`bg-popover`, `bg-ink text-white` (ação) → `bg-primary text-on-primary`, `text-white` sobre preenchimento forte → `text-on-ink`; `--font-sans` no app → `--ds-font-sans`. `npx g4os-ds audit src` lista tudo.

**Componentes e gráficos**

- Gráficos SVG: área, linha, barras, combo, sparkline, funil, sankey, donut, treemap, barra de proporção, ranking, anel, waterfall, bullet, gauge, dispersão, radar, matriz de calor, calendário de calor, Gantt.
- Dashboard (`KpiCard`, `Delta`, `ChartCard`, `GoalMeter`, `ActivityFeed`, `Leaderboard`, `CompareStat`), estado de tabela (`useSort`, `useSelection`, `BulkBar`, `Pagination`, `PropertyList`), pipelines (`StagePath`, `RecordCard`).
- Entradas (`TextField`, `OtpInput`, `CurrencyField`, máscaras BR, `TagInput`, `Slider`, `ChoiceCards`, `FileDropzone`, `Rating`…), estados de tela, `Banner`, `Tooltip`, `HoverCard`, `Menu`, `Sheet`, `CommandPalette`, `Lightbox`, `Accordion`, `TreeView`, `Carousel`, `SlideDeck`, filtros e busca, padrões de IA e interação.
- Status `done` agora se chama "Concluído".

**Blocos**: SaaS, CRM, ATS, ERP, Financeiro, Autenticação, Configurações, Onboarding, Aplicação, IA e Marketing.

**Kit para agentes**: `ai/` gerado do código (`core.md`, componentes, blocos, tokens, `manifest.json`, `llms.txt`, `renames.json`); CLI `g4os-ds` (`audit`, `doctor`, `guide`); plugin do Claude Code com as skills `g4os-ds`, `ds-create`, `ds-migrate`, `ds-review`, `ds-theme`; `templates/AGENTS.snippet.md`.

## 0.1.0

Primeira versão: tokens, estilos e componentes extraídos do G4 Delivery; showcase.
