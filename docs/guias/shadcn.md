# shadcn/ui e 21st.dev com o G4OS-DS

O DS cobre as telas de produto. Quando faltar algo (um calendário de agenda, um editor rico, um componente de marketing), você pode trazer do **shadcn/ui** ou do **21st.dev** e fazê-lo parecer nativo com a ponte `@g4ai/ds/shadcn.css`.

**Ordem de preferência:** componente do DS → bloco do DS → composição de componentes do DS → shadcn/21st com a ponte → escrever do zero.

## 1. Ligar a ponte

```css
/* globals.css */
@import "tailwindcss";
@import "@g4ai/ds/styles.css";
@import "@g4ai/ds/shadcn.css";
```

A ponte define as variáveis do shadcn (`--background`, `--primary`, `--border`, `--ring`, `--chart-1…5`, `--sidebar-*`, `--radius`) apontando para os **semânticos** do DS (`--ds-*`) e cria os utilitários `text-muted-foreground`, `border-border`, `bg-sidebar` etc. Por apontar para os semânticos, tudo o que você colar segue o **tema escuro** (`data-theme`) e a **marca** (`data-brand`) sozinho. `bg-primary` e `bg-popover` já existem no DS com o mesmo sentido.

## 2. Configurar o shadcn CLI

```bash
npx shadcn@latest init
```

Depois do `init`:

1. **Apague** do seu `globals.css` o bloco `:root { --background: oklch(...) … }`, o `.dark { … }`, o `@custom-variant dark (&:is(.dark *))` e o `@theme inline { --color-background: var(--background) … }` que o CLI gerou. A ponte e os tokens do DS substituem os quatro.
2. Em `components.json`: `"tailwind": { "cssVariables": true, "baseColor": "neutral" }`, `"iconLibrary": "lucide"`.
3. Mantenha os componentes gerados em `components/ui/` (separado do DS).

```bash
npx shadcn@latest add calendar
```

## 3. Trazer do 21st.dev

- Pelo site: copie o comando `npx shadcn@latest add "https://21st.dev/r/…"` da página do componente.
- Pelo MCP (Claude Code): `claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: <sua chave>"`. A busca (`search`) é gratuita; `get_component` (código) é pago.
- Prefira componentes que já usam as variáveis do shadcn (`bg-background`, `text-muted-foreground`): herdam tudo pela ponte. Componentes com cores fixas (`bg-zinc-900`, `text-violet-500`, gradientes) exigem troca manual.

## 4. Colisões de nome (importante)

Dois nomes significam coisas diferentes no DS e no shadcn. **O DS vence**:

| Classe no código colado | No shadcn | No DS | Troque por |
| --- | --- | --- | --- |
| `bg-accent` | hover neutro | **dourado de marca** | `bg-soft` |
| `text-accent-foreground` | texto no hover | (existe via ponte = ink) | `text-ink` (opcional) |
| `bg-muted` | fundo neutro | **cinza de texto (#6b6e76)** | `bg-soft` |
| `text-muted` | — | cinza de texto | ok |
| `text-muted-foreground` | cinza de texto | (existe via ponte = muted) | `text-muted` (opcional) |

Busca rápida ao colar:

```bash
grep -rnE "bg-accent\b|bg-muted\b|hover:bg-accent\b|hover:bg-muted\b|data-\[.*\]:bg-accent\b" components/ui
# substitua por bg-soft / hover:bg-soft
```

## 5. Checklist depois de colar um componente

- [ ] **Cores**: sem hex, sem `zinc/slate/gray/violet-*`, sem `bg-white`/`text-white`. Neutros → `bg-surface`, `bg-soft`, `border-line`, `text-muted`, `text-ink`. Primário → `bg-primary text-on-primary`. Rode `npx g4os-ds audit components/ui --fix-hints`: ele lista cada troca.
- [ ] **`bg-accent` / `bg-muted`** trocados (tabela acima).
- [ ] **Raio**: controles `rounded-lg` (8 px), cards/popups `rounded-xl` (12 px), modais `rounded-2xl` (16 px). O shadcn usa `rounded-md` em botões e inputs: troque para `rounded-lg`.
- [ ] **Tamanhos de texto**: shadcn usa `text-sm` (14 px) em quase tudo. Troque para a escala do DS: corpo/itens de menu `text-body` (13.5), rótulos `text-label` (12.5), metadados `text-caption` (12). Títulos de card `text-input font-medium` (14), não `font-semibold text-lg`.
- [ ] **Altura**: controles `h-10` (40 px) padrão ou `h-9` compacto; shadcn usa `h-9`/`h-8`.
- [ ] **Sombras**: remova `shadow-sm`/`shadow-md` de superfícies estáticas; popups usam `shadow-popup`, overlays `shadow-overlay`.
- [ ] **Foco**: o shadcn usa `focus-visible:ring-[3px] ring-ring/50`. Com a ponte, `ring` é o cinza neutro do DS. Aceitável; ou remova e deixe o foco global do `base.css`.
- [ ] **Ícones**: lucide, 16 px, sem `size-4` duplicado quando o botão já dimensiona.
- [ ] **`dark:`**: no DS a variante `dark:` responde a `data-theme="dark"` (não à classe `.dark`). As que só trocam cor (`dark:bg-zinc-900`) podem ser apagadas: com os tokens da ponte o componente já troca sozinho. Mantenha só ajustes que token não cobre.
- [ ] **Texto em pt-BR** e verbos nos botões ([escrita](../fundamentos/escrita.md)).
- [ ] **Portais e camadas**: popups com `z-[100]` (`--z-popup`) para aparecer sobre drawers do DS.
- [ ] **Não duplique** o que o DS já tem (Button, Select, Dialog, Table, Tabs, Badge, Card). Use o do DS e traga só o que falta.

## 6. Quando promover para o DS

Se o mesmo componente colado aparece em **2+ apps**, ele vira componente do DS: reescreva com tokens e padrões do DS e siga [contribuir.md](contribuir.md).

## Gráficos do shadcn (Recharts)

Os gráficos do DS são SVG sem dependência e cobrem os casos comuns. Se precisar do `ChartContainer` do shadcn, a ponte mapeia `--chart-1…5` para a paleta do DS; mantenha as [regras de dados](../fundamentos/dados.md) (série 1 = ink, grade clara, eixo em zero, tooltip formatado em pt-BR).
