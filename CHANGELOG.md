# Changelog

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
