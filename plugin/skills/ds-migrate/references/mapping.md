# Mapeamentos para migração

Decida pelo **papel** do elemento, não pela cor. Na dúvida, rode `npx g4os-ds audit <arquivo>` (cada achado traz a troca sugerida; `--fix` aplica só as que não dependem de papel).

## Paleta do Tailwind → tokens

| Antes | Papel típico | Depois |
| --- | --- | --- |
| `bg-white` | card, painel, campo | `bg-surface` |
| `bg-white` em menu/modal/popover | flutua | `bg-popover` |
| `bg-gray-50` / `bg-slate-50` | fundo de página, hover, cabeçalho de tabela | `bg-page` (página) · `bg-soft` (hover/faixa) |
| `bg-gray-100` | hover, trilha de progresso, tag neutra | `bg-soft` |
| `border-gray-200/300` | borda | `border-line` / `border-line-strong` |
| `text-gray-900/800` | texto principal | `text-ink` |
| `text-gray-700/600` | secundário forte | `text-ink-soft` |
| `text-gray-500/400` | metadado, placeholder | `text-muted` |
| `bg-blue-600 text-white` (botão) | ação principal | `Button` (variant primary) ou `bg-primary text-on-primary` |
| `text-blue-600` (link) | link | `text-blue` |
| `bg-green-100 text-green-800` | sucesso | `Badge tone="ok"` ou `bg-ok-soft text-ok` |
| `bg-yellow/amber-100 text-amber-800` | atenção | `Badge tone="warn"` ou `bg-amber-soft text-amber` |
| `bg-red-100 text-red-700` | erro | `Badge tone="bad"` ou `bg-rose-soft text-rose` |
| `bg-red-600 text-white` | destrutivo | `Button variant="danger"` dentro de `ConfirmDialog` |
| `bg-indigo/violet/purple-*` | "cor da marca" | `bg-primary` / `accent` (e defina a marca com ds-theme) |
| `bg-black/50` backdrop | sobreposição | use `Modal`/`Drawer` do DS (já têm backdrop) |
| `dark:bg-zinc-900`, `dark:text-white` | tema escuro manual | **remova**: tokens já trocam |
| `shadow-md` em card estático | — | remova; borda `border-line` separa |
| `text-sm` (14) em corpo de tabela/menu | — | `text-body` (13.5) · rótulos `text-label` (12.5) · meta `text-caption` (12) |
| `rounded-md` em botão/campo | — | `rounded-lg` (8) · card `rounded-xl` · modal `rounded-2xl` |

## shadcn/ui → DS

| shadcn | DS |
| --- | --- |
| `Button` | `Button` (`primary`, `ghost`, `quiet`, `danger`), `IconButton label` |
| `Dialog` | `Modal` (curto) · `Drawer` (formulário/edição) · `ConfirmDialog` (irreversível) |
| `AlertDialog` | `ConfirmDialog` |
| `Sheet` | `Drawer` (lateral de edição) ou `Sheet` do DS (mobile/bottom) |
| `Select` | `Select` (lista curta) · `Combobox` (entidades, com busca) |
| `DropdownMenu` | `ActionMenu` (ações de linha) · `Menu` (submenus, checkbox) |
| `Table` + TanStack | `DataTable` + `useSort`/`useSelection`/`usePagination` + `TableToolbar`/`FilterBar` |
| `Tabs` | `Tabs` (seções de entidade) · `SegmentedControl` (trocar visualização) |
| `Card` | `Card` · `LinkedCard` · `ChartCard` · `KpiCard` |
| `Badge` | `Badge tone` (neutro por padrão) |
| `Toast` / `sonner` | `notify(msg, undo?)` (+ `Toaster` já montado no `AppShell`) |
| `Tooltip`, `Popover`, `HoverCard` | `Tooltip`, `Popover`, `HoverCard` |
| `Command` | `CommandPalette` / `SearchPalette` (⌘K) |
| `Calendar`/`DatePicker` | `DatePicker` |
| `Input` + `Label` | `FieldBlock` + `fieldClass`, ou `TextField` |
| `Checkbox`, `Switch`, `RadioGroup`, `Slider` | homônimos do DS |
| `Skeleton` | `Skeleton` |
| Charts (Recharts) | gráficos do DS (`AreaChart`, `BarChart`, `DonutChart`…); se mantiver Recharts, a ponte mapeia `--chart-1…5` |
| `Sidebar` (block) | `AppShell` + `Sidebar` |

Classes: `bg-background`→`bg-page`, `bg-card`→`bg-surface`, `text-foreground`→`text-ink`, `text-muted-foreground`→`text-muted`, **`bg-muted`→`bg-soft`**, **`hover:bg-accent`→`hover:bg-soft`** (no DS `muted` é cor de texto e `accent` é dourado), `border-input`→`border-line`, `bg-destructive`→`bg-rose text-on-ink`.

## MUI / Chakra / Ant / Bootstrap

Não há troca mecânica (tema via provider, props de estilo, grid próprio). Por página:

1. Identifique o **padrão** da tela (lista, registro, formulário, dashboard) e abra o bloco do DS equivalente.
2. Reescreva a apresentação com o bloco/componentes do DS; mantenha hooks de dados, rotas e validação.
3. `Grid`/`Stack`/`Box` → utilitários Tailwind (`grid`, `flex`, `gap-*`) + `Page`, `Section`, `SplitLayout`, `FieldGrid`.
4. `TextField`(MUI) → `TextField`/`FieldBlock`; `Autocomplete` → `Combobox`; `DataGrid` → `DataTable` + hooks; `Snackbar` → `notify`; `Dialog` → `Modal`/`Drawer`.
5. Remova o `ThemeProvider` e a lib só quando nenhuma página a usar.

## Formatação

| Antes | Depois |
| --- | --- |
| `"R$ " + v.toFixed(2)`, `v.toLocaleString("en-US")` | `formatCurrency(v)` |
| `(x * 100).toFixed(1) + "%"` | `formatPercent(x)` (recebe fração) |
| `new Date(d).toLocaleDateString()` | `formatDate(d)` · `formatRelative(d)` |
| `window.confirm("…")` | `ConfirmDialog` (título = pergunta com o objeto, botão = verbo) |
| `alert("Salvo!")` | `notify("Contrato salvo")` |
