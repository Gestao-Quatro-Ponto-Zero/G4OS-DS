# Espaço, forma e profundidade

## Espaçamento

Base de 4 px. Os valores que realmente aparecem no DS, em ordem de frequência:

| px | Tailwind | Onde |
| --- | --- | --- |
| 8 | `gap-2`, `p-2` | ícone + texto, entre botões, entre chips |
| 12 | `gap-3`, `py-3` | entre cards, célula de tabela (vertical), padding vertical de card |
| 6 | `gap-1.5` | ponto + rótulo, avatar + nome, itens de legenda |
| 4 | `gap-1` | abas, grupo de ícones |
| 16 | `gap-4`, `px-4` | padding horizontal de card e célula, entre blocos de formulário |
| 24 | `gap-6`, `space-y-6` | entre seções de uma página, padding de modal |
| 32 / 40 | `gap-8`, `gap-10` | entre colunas de `SplitLayout`, antes de rodapé |

Regra de proximidade: **o que é relacionado fica mais perto do que o que não é.** Rótulo e campo: 6–8 px. Campo e próximo campo: 16 px. Seção e seção: 24–36 px.

## Margens da página

`Page` (classe `page-inset`) aplica margens responsivas. Não reinvente.

| Largura | Lateral | Topo | Rodapé |
| --- | --- | --- | --- |
| < 640 px | 20 px | 28 px | 40 px |
| ≥ 640 px | 28 px | 32 px | 48 px |
| ≥ 1024 px | 40 px | 36 px | 48 px |

`--content-max` (1440 px) limita dashboards muito largos; `--reading-max` (620 px) limita texto.

## Raios

Tailwind padrão (`rounded-md` 6, `rounded-lg` 8, `rounded-xl` 12, `rounded-2xl` 16) + tokens de papel:

| Token | px | Papel |
| --- | --- | --- |
| `radius-chip` | 6 | badge, contador, chip de data |
| `radius-control` | 8 | botão, campo, item de menu, aba, segmento |
| `radius-tile` | 10 | card de kanban, marca de entidade |
| `radius-card` | 12 | card, painel, tabela, popup, toast |
| `radius-shell` | 16 | modal, `ListPanel`, `StatGrid`, calendário, moldura de bloco |

Aninhamento: o raio de dentro é menor que o de fora (moldura 16 → lista 12 → linha 8). Nunca o mesmo raio encaixado com padding pequeno.

## Bordas

- 1 px `border-line` em **toda** superfície: card, tabela, campo, popup.
- Hover de algo clicável escurece a borda (`hover:border-line-strong`) e sobe a sombra (`surface-interactive`).
- Divisória interna: `divide-y divide-line` ou `border-t border-line`. Nunca `<hr>` com margem grande.
- Borda tracejada só em estado vazio e zona de soltar arquivo.

## Sombras

Quase invisíveis. **Superfície se separa por borda; sombra indica que algo flutua ou pode ser clicado.**

| Token | Uso |
| --- | --- |
| `shadow-surface` | card em repouso (quase nada) |
| `shadow-raised` | card clicável no hover |
| `shadow-pressed` | botão pressionado |
| `shadow-primary` | brilho interno do botão primário |
| `shadow-popup` | menu, select, popover, tooltip de gráfico |
| `shadow-toast` | toast, barra de ações em massa |
| `shadow-overlay` | modal, drawer |

Nunca `shadow-lg` do Tailwind em card estático, nunca sombra colorida.

## Camadas (z-index)

Variáveis em `:root`. Use `z-[var(--z-popup)]` ou os valores abaixo; não invente `z-[9999]`.

| Variável | Valor | O quê |
| --- | --- | --- |
| `--z-sticky-local` | 15 | cabeçalho fixo dentro de seção, `BulkBar` |
| `--z-sticky` | 20 | cabeçalho de página |
| `--z-sticky-shell` | 30 | cabeçalho de entidade |
| `--z-nav` | 40 | sidebar no celular |
| `--z-floating` | 50 | menus posicionados à mão |
| `--z-toast` | 80 | toasts |
| `--z-backdrop` / `--z-modal` | 90 / 95 | fundo e modal |
| `--z-popup` | 100 | select, combobox, menu, popover: sempre por cima, inclusive de modal |

## Tamanhos de alvo

- Controle padrão: 40 px de altura (`min-h-10`); compacto 36 px (`sm`); em toolbar densa 32 px.
- Alvo de toque mínimo: 32 × 32 px (ícones), 40 px em celular sempre que possível.
- Ícone dentro de botão: 16 px. Em badge: 12 px. Em estado vazio: 20 px dentro de quadro de 36 px.
