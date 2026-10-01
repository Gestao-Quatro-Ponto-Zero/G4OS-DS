# Temas, marcas e modo escuro

Um app G4 OS atende clientes diferentes com o mesmo código. O que muda por cliente é **só a camada semântica** dos [tokens](tokens.md): cor de ação, destaque, raio, fonte. Componentes, blocos e regras ficam iguais.

Gerador visual no showcase: **Fundamentos › Temas e marca** (`#/p/fund-temas`): escolha cor de ação, destaque, raio e fonte, veja componentes reais nos dois temas e copie o CSS.

## Modo escuro

```tsx
<html lang="pt-BR" className="ds-app" data-theme="system">   {/* light | dark | system */}
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} /> {/* evita piscar o tema errado */}
  </head>
```

```tsx
import { ThemeToggle, useTheme } from "@g4os/ds";

<ThemeToggle />                        // Claro · Escuro · Sistema, persiste em localStorage
const { mode, setMode, brand, setBrand, resolved } = useTheme();
```

- `system` segue o sistema operacional (`prefers-color-scheme`).
- O escuro **não é inversão**: superfícies sobem de luminância com a elevação (`page` < `surface` < `popover`), estados ficam mais claros e menos saturados, sombras ficam mais densas e ganham um contorno de 1 px.
- A variante `dark:` do Tailwind segue `data-theme` (não a mídia do SO direto). Use só para ajuste fino que token não resolve (ex.: `dark:opacity-80` numa ilustração). **Nunca** `dark:bg-zinc-900`: `bg-surface` já troca.
- Painéis `bg-navy`, o `Lightbox` e os slides navy ficam escuros nos dois temas de propósito.

## Marca de cliente

Presets prontos em `src/styles/themes.css` (importado por `styles.css`): `oceano`, `floresta`, `vinho`, `grafite`, `violeta`.

```html
<html data-theme="system" data-brand="oceano">
```

Marca nova, no CSS global do app (depois de `@import "@g4os/ds/styles.css"`):

```css
[data-brand="acme"] {
  --ds-primary: #0b5cff;        /* botão principal, seleção */
  --ds-on-primary: #ffffff;     /* texto sobre ele: contraste ≥ 4,5 */
  --ds-blue: #0b5cff;           /* links */
  --ds-accent: #ffb020;         /* preenchimento de destaque */
  --ds-accent-deep: #8a5a00;    /* destaque como texto: contraste ≥ 4,5 sobre branco */
  --ds-accent-soft: #fff4dc;
  --ds-chart-1: #0b5cff;
  --ds-radius-scale: 1.15;
  --ds-font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
[data-brand="acme"][data-theme="dark"] {
  --ds-primary: #7ea8ff;        /* versão clara para ler sobre escuro */
  --ds-on-primary: #0a1630;
  --ds-blue: #8fb5ff;
  --ds-accent: #ffc04d;
  --ds-accent-deep: #ffd27f;
  --ds-accent-soft: #33260c;
  --ds-chart-1: #7ea8ff;
}
```

Sem escrever à mão: `deriveBrand(primary, accent)` + `brandCss(nome, marca, { radiusScale, fontSans })` (de `@g4os/ds`) geram os dois blocos com contraste AA garantido. A skill `ds-theme` faz o mesmo a partir do logo ou das cores do cliente.

### Regras de marca

1. **Só semânticos** (`--ds-*`). Nunca redefina `--color-*` (a ponte) nem primitivos `--g4-*`.
2. **Contraste AA nos dois temas**: `on-primary` sobre `primary` ≥ 4,5; `accent-deep` sobre `surface` ≥ 4,5; `primary` sobre `page` ≥ 3 (é usado como fundo de controle). `contrast(a, b)` de `@g4os/ds` calcula.
3. **Estados não são marca**: `ok`, `amber`, `rose` continuam verde, âmbar e vermelho em qualquer cliente. Uma marca vermelha não pode deixar "erro" indistinguível: se `primary` for vermelho, mantenha `rose` e confira que o botão principal não parece destrutivo (considere um primário escuro e o vermelho só no `accent`).
4. Marca não troca densidade, escala de texto nem layout.
5. `data-theme="system"` + marca: o bloco `[data-brand][data-theme="dark"]` não casa com `system`. Se a marca precisar de ajuste no escuro do sistema, repita-o dentro de `@media (prefers-color-scheme: dark) { [data-brand="x"][data-theme="system"] { … } }`.

## Aplicar só numa parte da tela

Os seletores são atributos, então valem em qualquer elemento:

```tsx
<div data-theme="dark">…</div>                           {/* uma área escura (preview, canvas) */}
<div data-brand="floresta">…</div>                       {/* prévia de marca */}
<div style={{ "--ds-primary": "#0b5cff" } as React.CSSProperties}>…</div>
```

Portais (menus, modais) renderizam no `body` e herdam o tema do `<html>`, não do `div`. Para prévias com popups, aplique no `<html>`.

## Verificar

- Toda tela em claro **e** escuro (`#/frame/<bloco>?theme=dark&brand=oceano` no showcase).
- `npx g4os-ds audit src` sem `white-black`, `hex-color` e `tailwind-palette`: são exatamente o que quebra o escuro e a marca.

## Sistemas completos (presets que mudam tudo)

Além das marcas que trocam só a cor de ação (`oceano`, `floresta`, `vinho`, `grafite`, `violeta`), três presets redefinem superfícies, texto, forma, sombra e tipo — úteis quando o cliente pede “a cara” de outro produto:

| `data-brand` | Referência | O que muda |
| --- | --- | --- |
| `pergaminho` | Anthropic | Fundo marfim (#f0eee6), cards #faf9f5, argila como única cor de ação, títulos em serifa (Source Serif 4, peso 400), sem sombra, raio ×1,4 |
| `ledger` | Stripe | Branco puro, texto azul-marinho (#061b31), índigo (#533afd) na ação, raio ×0,5 (4px), títulos peso 300 com tracking apertado, sem sombra |
| `caderno` | Notion | Papel morno (#f6f5f4), azul (#0075de) na ação, destaque marigold, títulos peso 700 compactos |

Todos têm versão escura própria e passam em contraste AA (confira com `node plugin/skills/ds-theme/scripts/contrast.mjs check src/styles/themes.css`).

## Tipografia como eixo próprio (`data-type`)

Tipo é independente da cor: qualquer marca combina com qualquer tipografia.

```html
<html data-theme="system" data-brand="oceano" data-type="editorial">
```

| `data-type` | Texto | Títulos |
| --- | --- | --- |
| (nenhum) / `g4` | Figtree | Figtree 600 |
| `editorial` | Inter | Source Serif 4, 500 |
| `tecnica` | IBM Plex Sans (+ Plex Mono) | Plex 600 |
| `neutra` | Inter | Inter 650 |
| `suave` | Manrope | Manrope 700 |

Tokens envolvidos: `--ds-font-sans`, `--ds-font-mono`, `--ds-font-display` (títulos de página, registro, hero; padrão = sans), `--ds-display-weight`, `--ds-display-tracking`. O app precisa carregar as fontes (next/font ou Google Fonts). No código: `useTheme()` expõe `type`/`setType`; `typePresets` lista as opções; `themeScript` aplica `data-type` antes da primeira pintura.

Precedência: `data-type` vence a fonte definida por uma marca (fica depois em `themes.css`).
