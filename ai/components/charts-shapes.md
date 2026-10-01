# charts-shapes

Arquivo: `src/components/charts-shapes.tsx` · importe de `@g4ai/ds`.

Formas: pizza/rosca e radial.

## PieChart

Pizza ou rosca. `innerRadius` (0–0,9 do raio) vira rosca; o centro mostra total ou a fatia ativa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `activeIndex` | `number \| undefined` |  |  |
| `centerLabel` | `ReactNode` |  | Texto pequeno do centro (rosca). |
| `centerValue` | `ReactNode` |  | Número do centro (rosca). |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `innerRadius` | `number \| undefined` | `0` |  |
| `items` | `PieItem[] \| undefined` |  |  |
| `labels` | `"none" \| "inside" \| "outside" \| undefined` | `"none"` |  |
| `legend` | `false \| "bottom" \| "right" \| undefined` | `"bottom"` |  |
| `onActiveIndexChange` | `((i: number \| null) => void) \| undefined` |  |  |
| `padAngle` | `number \| undefined` | `0.012` |  |
| `rings` | `{ label: string; items: PieItem[]; }[] \| undefined` |  | Anéis concêntricos (do externo para o interno). |
| `size` | `number \| undefined` | `260` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-pizza`):

```tsx
<PieChart labels="inside" … />
```

## PieItem (type)

```ts
type PieItem = { key?: string; label: string; value: number; color?: string }
```

## RadialChart

Um valor em arco (uso do plano, meta, score) com o número no centro.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `caption` | `ReactNode` |  | Linha abaixo do número (unidade, contexto). |
| `className` | `string \| undefined` |  |  |
| `color` | `string \| undefined` | `"var(--ds-chart-1)"` |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `max` | `number \| undefined` | `100` |  |
| `rounded` | `boolean \| undefined` | `true` |  |
| `segments` | `{ label: string; value: number; color?: string; }[] \| undefined` |  |  |
| `shape` | `"full" \| "half" \| "three-quarter" \| undefined` | `"full"` |  |
| `size` | `number \| undefined` | `220` |  |
| `thickness` | `number \| undefined` | `16` |  |
| `value` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-radial`):

```tsx
<RadialChart shape="half" value={78} format={(n) => `${n}%\
```
