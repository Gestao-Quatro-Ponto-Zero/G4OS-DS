# charts-kit

Arquivo: `src/components/charts-kit.tsx` · importe de `@g4ai/ds`.

Peças compartilhadas pelos gráficos analíticos (coorte, mapa por UF, horizon, dispersão conectada, sankey, cascata): · ScaleLegend: legenda de escala em degraus ou contínua, com hover que destaca a faixa no gráfico · Cha

## AxisBreak

Marca de quebra (duas barras inclinadas) para um eixo que não começa em zero.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `x` * | `number` |  |  |
| `y` * | `number` |  |  |
| `width` | `number \| undefined` | `14` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ChartScrubber

Controle de tempo para gráficos: arraste, clique ou use as setas (Home/End vão ao início e ao fim).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `count` * | `number` |  | Quantidade de posições (meses, dias). |
| `label` * | `string` |  | Nome acessível ("Mês"). |
| `onChange` * | `(index: number) => void` |  |  |
| `value` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((index: number) => string) \| undefined` | `(i) => String(i + 1)` | Texto de cada posição ("jun 2026"): vai para aria-valuetext e para o rótulo. |
| `interval` | `number \| undefined` | `700` |  |
| `playable` | `boolean \| undefined` | `false` | Mostra tocar/pausar: avança uma posição por `interval` ms (só com a aba visível). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ChartScrubberProps (type)

```ts
type ChartScrubberProps = { count: number; value: number; onChange: (index: number) => void; format?: (index: number) => string; label: string; playable?: boolean; interval?: number; className?: string; }
```

## LinkedHighlight (type)

```ts
type LinkedHighlight = { active: K | null; pinned: K | null; setPinned: (k: K | null) => void; setHover: (k: K | null) => void; isDimmed: (k: K) => boolean; bind: (k: K) => { onMouseEnter: () => void; onMouseLeave: () => void; onFocus: () => void; onBlur: () => void; onClick: () => void; onKeyDown: (e: KeyboardEvent) => void; "data-active": boolean | undefined; "data-dimmed": boolean | undefined; }; }
```

## ScaleLegend

Legenda de escala de intensidade.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `thresholds` * | `number[]` |  | Limites inferiores de cada degrau (de `quantize(...).thresholds`). |
| `activeBin` | `number \| null \| undefined` | `null` | Degrau em destaque (vindo do gráfico). |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `max` | `number \| undefined` |  | Fim do último degrau (de `quantize(...).domain[1]`). |
| `mode` | `"stepped" \| "continuous" \| undefined` | `"stepped"` |  |
| `onHoverBin` | `((bin: number \| null) => void) \| undefined` |  | Hover/foco num degrau: o gráfico destaca as células daquela faixa. |
| `scheme` | `"sequential" \| "diverging" \| undefined` | `"sequential"` | Escala de uma cor (`tone`) ou divergente (centrada em zero). |
| `title` | `ReactNode` |  | Título curto à esquerda ("% retido", "Receita"). |
| `tone` | `ScaleTone \| undefined` | `"ink"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ScaleLegendProps (type)

```ts
type ScaleLegendProps = { thresholds: number[]; max?: number; mode?: "stepped" | "continuous"; scheme?: "sequential" | "diverging"; tone?: ScaleTone; format?: (n: number) => string; title?: ReactNode; activeBin?: number | null; onHoverBin?: (bin: number | null) => void; className?: string; }
```

## useLinkedHighlight (hook)

Realce ligado entre várias vistas do mesmo dado (mapa + lista, sankey + painel, horizon + tabela).

```ts
useLinkedHighlight(props?): LinkedHighlight<K>
```
