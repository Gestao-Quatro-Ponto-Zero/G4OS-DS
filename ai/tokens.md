# Tokens

Três camadas: primitivos `--g4-*` (não use) → semânticos `--ds-*` (trocam por tema e marca) → utilitários Tailwind (`bg-surface`, `text-muted`…).
Em classe use o utilitário; em SVG/`style` use `var(--color-<utilitário>)`.

## Semânticos

| Utilitário (sufixo) | Variável | Claro | Escuro | Uso |
| --- | --- | --- | --- | --- |
| `page` | `--ds-page` | `#ffffff` | `#111113` | fundo da área de trabalho |
| `surface` | `--ds-surface` | `#ffffff` | `#18181b` | card, painel, tabela, campo |
| `popover` | `--ds-popover` | `#ffffff` | `#1f1f23` | menu, popover, modal, toast |
| `soft` | `--ds-soft` | `#f8f8f9` | `#202024` | gelo: hover, cabeçalho de tabela, rodapé |
| `rail` | `--ds-rail` | `#fbfbfc` | `#141416` | sidebar |
| `ink` | `--ds-ink` | `#202124` | `#ececef` | texto principal |
| `ink-soft` | `--ds-ink-soft` | `#484a50` | `#c5c6cc` | texto secundário forte |
| `muted` | `--ds-muted` | `#6b6e76` | `#8f929a` | metadado, rótulo, placeholder (AA) |
| `line` | `--ds-line` | `#e9eaed` | `#2a2a2f` | toda borda e divisória |
| `line-strong` | `--ds-line-strong` | `#d2d4da` | `#3b3c43` | hover de card, borda de checkbox |
| `on-ink` | `--ds-on-ink` | `#ffffff` | `#121214` | texto sobre preenchimento forte (ink, rose, ok…) |
| `primary` | `--ds-primary` | `#202124` | `#ececef` |  |
| `on-primary` | `--ds-on-primary` | `#ffffff` | `#121214` | Momentos de marca: capa, login, onboarding, conquista. Não é cor de tela. |
| `brand` | `--ds-brand` | `#001f35` | `#0a2236` |  |
| `on-brand` | `--ds-on-brand` | `#f5f4f3` | `#f5f4f3` |  |
| `brand-accent` | `--ds-brand-accent` | `#b9915b` | `#c9a46f` | Marcador do item ativo na navegação (gesto de marca discreto). |
| `nav-marker` | `--ds-nav-marker` | `#b9915b` | `#c9a46f` | Marca |
| `navy` | `--ds-navy` | `#031a26` | `#0a2130` | superfícies escuras de marca (fica escura nos dois modos) |
| `blue` | `--ds-blue` | `#184560` | `#8cb8da` | link, ação textual, "em andamento" |
| `magenta` | `--ds-clay` | `#842e20` | `#e59a8a` |  |
| `magenta-soft` | `--ds-clay-soft` | `#f6e7e3` | `#3a211c` |  |
| `founders` | `--ds-founders` | `#441b1b` | `#c98b8b` |  |
| `accent` | `--ds-accent` | `#b9915b` | `#c9a46f` | SÓ preenchimento: progresso, foco, próximo passo |
| `accent-deep` | `--ds-accent-deep` | `#8c6a3a` | `#dcbd8e` | texto na cor de destaque |
| `accent-soft` | `--ds-accent-soft` | `#f5eee3` | `#2e2619` | Estados |
| `ok` | `--ds-ok` | `#1b5e20` | `#7fd18b` |  |
| `ok-soft` | `--ds-ok-soft` | `#e8f5e9` | `#15291a` |  |
| `amber` | `--ds-amber` | `#e65100` | `#ffb163` |  |
| `amber-soft` | `--ds-amber-soft` | `#fff3e0` | `#33240f` |  |
| `rose` | `--ds-rose` | `#b71c1c` | `#ff8f86` |  |
| `rose-soft` | `--ds-rose-soft` | `#ffebee` | `#3a1719` |  |
| `info` | `--ds-info` | `#0d47a1` | `#90b8f8` |  |
| `info-soft` | `--ds-info-soft` | `#e3f2fd` | `#14233a` | Canvas escuros (grafo, IA) |
| `ai` | `--ds-ai` | `#18181b` | `#0e0e10` |  |
| `graph` | `--ds-graph` | `#121214` | `#0b0b0d` | Dados |
| `chart-1` | `--ds-chart-1` | `#202124` | `#ececef` |  |
| `chart-2` | `--ds-chart-2` | `#184560` | `#6fa8d6` |  |
| `chart-3` | `--ds-chart-3` | `#b9915b` | `#c9a46f` |  |
| `chart-4` | `--ds-chart-4` | `#842e20` | `#e08d7c` |  |
| `chart-5` | `--ds-chart-5` | `#5f7f6f` | `#8fbfa6` |  |
| `chart-6` | `--ds-chart-6` | `#a3a7b0` | `#6b6e76` |  |
| `chart-grid` | `--ds-chart-grid` | `#eef0f2` | `#242428` | Marca de entidade (iniciais tingidas): quanto da cor da conta entra no texto/fundo |
| — | `--ds-mark-text` | `70%` | `38%` |  |
| — | `--ds-mark-bg` | `8%` | `16%` | Foco e sobreposição |
| — | `--ds-focus` | `#6b6e76` | `#8f929a` |  |
| — | `--ds-backdrop` | `rgb(0 0 0 / 0.2)` | `rgb(0 0 0 / 0.55)` | Sombras: quase invisíveis no claro |
| — | `--ds-shadow-surface` | `0 1px 2px #20212403` | `0 1px 2px #00000040` |  |
| — | `--ds-shadow-raised` | `0 3px 12px #20212407` | `0 4px 16px #00000059` |  |
| — | `--ds-shadow-pressed` | `0 1px 3px #20212408` | `0 1px 3px #00000059` |  |
| — | `--ds-shadow-primary` | `inset 0 1px 0 #ffffff24, 0 1px 2px #20212418` | `inset 0 1px 0 #ffffff14, 0 1px 2px #00000066` |  |
| — | `--ds-shadow-popup` | `0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a` | `0 20px 25px -5px #00000080, 0 8px 10px -6px #00000066, 0 0 0 1px #ffffff0a` |  |
| — | `--ds-shadow-toast` | `0 8px 32px #20212412, 0 2px 4px #20212404` | `0 8px 32px #00000080, 0 0 0 1px #ffffff0a` |  |
| — | `--ds-shadow-overlay` | `0 25px 50px -12px #00000026` | `0 25px 50px -12px #000000a6, 0 0 0 1px #ffffff0a` | Forma e tipo da marca |
| — | `--ds-radius-scale` | `1` | `=` | 0 = quadrado · 0.75 = sóbrio · 1 = G4 · 1.35 = amigável |
| — | `--ds-font-sans` | `"Figtree", "Figtree Fallback", ui-sans-serif, system-ui, sans-serif` | `=` |  |
| — | `--ds-font-mono` | `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace` | `=` | Títulos (h1 de página, título de registro, capa, hero). Pode ser serifada. |
| — | `--ds-font-display` | `var(--ds-font-sans)` | `=` |  |
| — | `--ds-display-weight` | `600` | `=` |  |
| — | `--ds-display-tracking` | `-0.035em` | `=` |  |

## Tipografia (px)

| Utilitário | px | Papel |
| --- | --- | --- |
| `text-overline` | 10 | rótulo de grupo em CAIXA ALTA, tracking .1em |
| `text-meta` | 11 | contador, legenda, data em chip, rótulo de célula mobile |
| `text-caption` | 12 | metadado, cabeçalho de tabela, aba, descrição curta |
| `text-label` | 12.5 | rótulo de campo, item de menu lateral, texto de controle |
| `text-control` | 13 | botão sm, chip, toast, breadcrumb, corpo compacto |
| `text-body` | 13.5 | corpo padrão, tabela, botão md, item de menu |
| `text-input` | 14 | valor digitado, título de card, item de combobox |
| `text-value` | 15 | valor de campo de leitura (Field) |
| `text-section` | 18 | título de área (h2), título de modal |
| `text-record` | 20 | título de drawer, nome do cliente no cabeçalho |
| `text-metric` | 22 | número de indicador |
| `text-title` | 25 | h1 de página (23px < 640px). Não se chama "page" para não colidir com a cor page |

Valores arbitrários permitidos (iguais à escala ou meios-passos de componentes densos): 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30 px. Display (hero, slides): ≥ 26 px.

## Raios (escalam com `--ds-radius-scale`)

| Utilitário | px | Uso |
| --- | --- | --- |
| `rounded-chip` | 6 | badge, contador, chip de data |
| `rounded-control` | 8 | botão, campo, item de menu, aba |
| `rounded-tile` | 10 | card de kanban, marca de entidade |
| `rounded-card` | 12 | card, painel, tabela, popup, toast |
| `rounded-shell` | 16 | modal, ListPanel, StatGrid, calendário |

`rounded-sm/md/lg/xl/2xl` do Tailwind também escalam (4/6/8/12/16 × escala).

## Marcas prontas (`<html data-brand=…>`)

`cliente`, `oceano`, `floresta`, `vinho`, `grafite`, `violeta`, `pergaminho`, `ledger`, `caderno`, `g4-institucional`

Nova marca: sobrescreva só `--ds-*` em `[data-brand="x"]` e `[data-brand="x"][data-theme="dark"]`. Detalhes: `docs/fundamentos/temas-e-dark-mode.md`.
