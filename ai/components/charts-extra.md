# charts-extra

Arquivo: `src/components/charts-extra.tsx` · importe de `@g4ai/ds`.

Gráficos de negócio que as bibliotecas comuns não trazem prontos.

## BoxPlot

Distribuição por grupo: caixa = 50 % central (Q1–Q3), traço = mediana, bigodes até 1,5 × IQR, pontos = outliers.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `groups` * | `{ label: string; values: number[]; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<BoxPlot groups={[{ label: "Enterprise", values: [...] }, …]} format={(n) => `${n} d\
```

## BumpChart

Posição no ranking ao longo do tempo (1 no topo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `periods` * | `string[]` |  |  |
| `series` * | `{ label: string; ranks: number[]; color?: string; }[]` |  | ranks[i] = posição (1 = primeiro) no período i. |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `240` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<BumpChart periods={["jun", "jul", "ago", "set"]} series={[{ label: "Ana", ranks: [3, 2, 1, 1] }, …]} />
```

## DivergingBarChart

Pesquisa em escala (Likert 5 pontos, eNPS, satisfação).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `rows` * | `{ label: string; values: number[]; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `scale` | `string[] \| undefined` | `["Discordo totalmente", "Discordo", "Neu` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<DivergingBarChart rows={[{ label: "Tenho clareza das minhas metas", values: [3, 8, 14, 41, 34] }, …]} />
```

## DumbbellChart

Faixa entre dois valores por linha: meta × real, 2025 × 2026, mínimo × máximo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `aLabel` * | `string` |  |  |
| `bLabel` * | `string` |  |  |
| `rows` * | `{ label: string; a: number; b: number; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `goodWhen` | `"up" \| "down" \| undefined` | `"up"` | "down" para custo, prazo, atraso: b abaixo de a é que fica verde. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<DumbbellChart aLabel="Orçado" bLabel="Realizado" rows={[{ label: "Marketing", a: 120000, b: 138000 }, …]} />
```

## Histogram

Frequência por faixa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `values` * | `number[]` |  |  |
| `bins` | `number \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `220` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<Histogram label="Ticket dos pedidos" values={tickets} format={(n) => formatCurrency(n, { compact: true })} />
```

## NpsChart

NPS completo: número (−100 a 100), barra de composição e distribuição das notas 0–10 colorida por grupo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `scores` * | `number[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `previous` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
// scores[i] = respostas com nota i (0 a 10)\n<NpsChart scores={[4, 2, 3, 5, 6, 9, 14, 38, 61, 120, 150]} previous={58} />
```

## ParetoChart

Causas ordenadas (barras) + % acumulado (linha).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value: number; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `260` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<ParetoChart items={[{ label: "Atraso na entrega", value: 142 }, …]} />
```

## PunchCard

Dia × hora com bolinhas de área proporcional.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `string[]` |  |  |
| `rows` * | `string[]` |  |  |
| `values` * | `number[][]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<PunchCard rows={["Seg", …]} columns={["8h", …]} values={[[…]]} />
```

## RadialBars

2–5 metas em anéis concêntricos (atingimento por time, uso por recurso).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value: number; color?: string; hint?: ReactNode; }[]` |  | value em 0–100 (% da meta). |
| `center` | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `size` | `number \| undefined` | `200` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-radial`):

```tsx
<RadialBars items={[{ label: "Vendas", value: 92 }, …]} />
```

## SlopeChart

Antes × depois por item.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `fromLabel` * | `string` |  |  |
| `items` * | `{ label: string; from: number; to: number; }[]` |  |  |
| `toLabel` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `260` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<SlopeChart fromLabel="2025" toLabel="2026" items={[{ label: "Sudeste", from: 42, to: 51 }, …]} />
```

## WaffleChart

Proporção em 100 quadrados.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value: number; color?: string; }[]` |  |  |
| `cell` | `number \| undefined` | `14` |  |
| `className` | `string \| undefined` |  |  |
| `columns` | `number \| undefined` | `10` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-negocio`):

```tsx
<WaffleChart items={[{ label: "Renovaram", value: 72, color: "var(--ds-ok)" }, …]} />
```
