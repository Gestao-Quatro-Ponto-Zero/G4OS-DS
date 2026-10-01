# Changelog

## 0.5.0

### Minor Changes

- a805df6: Auditoria e lint de boas práticas, do terminal ao editor e ao CI.

  - **31 regras em 9 categorias** (tokens, tipografia, acessibilidade, formatação pt-BR, componentes, React, imports, segurança, performance), num motor só (`scripts/lint/`) usado pelo CLI, pelo plugin ESLint e pela tool `audit` do MCP. Novas: `arbitrary-radius`, `arbitrary-shadow`, `z-index`, `img-alt`, `field-label`, `clickable-div`, `outline-none`, `positive-tabindex`, `locale-missing`, `date-format`, `effect-return`, `deep-import`, `deprecated-export`, `target-blank`, `dangerous-html`, `icon-star-import`, `as-any-props` e, no preset `strict`, `tailwind-text-scale` e `z-index-token`. Menos falso positivo: texto em `<code>`, exemplos em template literal e `var(--token, fallback)` não contam mais.
  - **`g4os-ds audit`**: `--fix` (trocas seguras: `bg-white`→`bg-surface`, `text-gray-500`→`text-muted`, shadcn→DS, `rounded-[12px]`→`rounded-card`, `rel="noopener"`, imports internos e nomes renomeados), `--changed`/`--staged`/`--since`, `--baseline`/`--update-baseline` (só achado novo falha), `--format pretty|json|markdown|sarif|github`, `--preset`, `--rule`, `--max-warnings`, config `g4os-ds.config.json` (com JSON Schema) ou `package.json#"g4os-ds"`, `overrides` por pasta. Exit code 2 para erro de uso/config.
  - **`g4os-ds init`**: cria config, scripts `ds:*` e o workflow de CI (anotações no PR + SARIF); `--eslint`, `--hook lefthook|husky|simple-git-hooks`, `--baseline`, `--dry-run`. Nunca sobrescreve sem `--force`.
  - **`g4os-ds doctor`**: ordem dos imports CSS, integração do Tailwind v4 (PostCSS/Vite), React duplicado, versões dos peers, `themeScript`, `suppressHydrationWarning`, `transpilePackages` desnecessário; `--format github|sarif|json|markdown`.
  - **Plugin ESLint 9** em `@g4ai/ds/eslint` (`configs.recommended|strict|migration`, `config({ standalone: true })` para projetos sem parser de TS), com tipos. ESLint é dependência opcional.
  - Ignorar com motivo: `// g4os-ds-disable-next-line <regra> -- motivo`, `-line`, `disable`/`enable`, `-file` (a sintaxe `ds-audit-ignore` continua valendo).
  - Tool `audit` do MCP: `format`, `preset`, `severity`, `rule`, `changed`, `since`; achados com `fixable` e `replacement`.
  - Starter `templates/next-app` com `g4os-ds.config.json`, `eslint.config.mjs` e scripts `lint`/`ds:*`.

  Como migrar: nada obrigatório. O `audit` agora pega mais coisas (e `icon-button-label` virou erro); para não travar o CI de um projeto em andamento, rode `npx g4os-ds init --baseline` (ou `npx g4os-ds audit --baseline`) e `npx g4os-ds audit --fix`.

- 4ed1fce: Formulários a partir do uso num app real (Radar de Forecast):

  - **Mudança de comportamento:** `Checkbox` mostra o `label` ao lado da caixa por padrão (como o `Switch`). Para só a caixa (seleção de linha de tabela, tarefa com título ao lado), passe `hideLabel`. Novo `description`. Marcado + desabilitado continua lendo como marcado e o texto fica legível.
  - **Regra única de rótulo:** `Select`, `Combobox`, `DatePicker` (e os novos `MultiSelect`, `NativeSelect`, `CheckboxGroup`) desenham o `label` visível acima do campo, com `hint`, `error` e `optional`, como o `TextField`. Dentro de `FieldBlock` o rótulo continua sendo do FieldBlock (sem duplicar); `hideLabel` para toolbar, tabela e filtro; `Select size="compact"` esconde por padrão. Se você desenhava um `<p>` de rótulo acima de um Select, remova-o.
  - Novos: `MultiSelect` (busca, grupos, "Selecionar todos"/"Limpar", `max`, `disabledReason`, resumo ou chips), `CheckboxGroup` (tudo visível, tri-estado, colunas) e `NativeSelect` (o `<select>` do sistema estilizado, com grupos; a regra `native-select` da auditoria só acusa `<select>` cru).
  - `DatePicker`: rodapé "Hoje"/"Limpar", `clearable`, `now`, `hint`/`error`; nome acessível inclui a data escolhida.
  - Celular: `Select` e `DatePicker` abrem como folha inferior (< 640px, por cima da barra inferior); `Combobox`/`MultiSelect` com a largura da tela. `presentation="popover"` mantém o comportamento antigo.
  - `Button`: desabilitado legível (ghost/quiet com texto muted e borda visível; preenchidos esmaecem) e `disabledReason` (continua focável com `aria-disabled` e explica o motivo em tooltip). `ToggleGroup` e `Switch` ganharam `disabled`.
  - `Sidebar`: o `footer` tem respiro próprio; um `Button` ali não vaza mais do trilho.
  - `Page width="wide|medium|narrow|reading"`: cabeçalho, barra e corpo no mesmo eixo (antes era comum centralizar só o corpo com `mx-auto max-w-*` e o título ficava desalinhado).

- 4ed1fce: Paridade com o shadcn/ui.

  - Novos componentes: `Separator` (com rótulo), `ScrollArea` (barra fina, esmaecimento nas bordas), `Label`, `FieldSet`/`FieldGroup`/`FieldSeparator`, família `Item` (`Item`, `ItemGroup`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`), `Table` estática (`TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`), `Prose` (texto longo), `Toggle`, `ButtonGroup`/`ButtonGroupText`, família `InputGroup` (complementos, botões e faixa de ações dentro do campo), `ColorPicker` (amostras, hex, seletor livre e contraste), `Menubar`, `NavigationMenu`, `SortableList` (arraste e teclado, com anúncios) e `Questionnaire` (uma pergunta por vez, condicionais, atalhos).
  - De/para shadcn/ui → DS em `scripts/data/shadcn-map.json`, publicado como `ai/shadcn-map.json` e `docs/guias/shadcn-equivalencias.md`. Página "shadcn/ui ↔ G4OS-DS" no site e selo "Equivalente no shadcn" em cada página de componente.
  - MCP: `search` entende nomes do shadcn ("alert-dialog", "sheet", "dropdown menu") e devolve o equivalente do DS.

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
