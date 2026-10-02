# charts

Arquivo: `src/components/charts.tsx` · importe de `@g4ai/ds`.

Gráficos SVG sem dependência: AreaChart, LineChart, BarChart, Sparkline, BarList, DonutChart, FunnelChart, CalendarHeatmap, ProgressRing.

## AreaChart

Evolução no tempo com volume (receita, visitantes, vagas abertas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `data` * | `ChartDatum[]` |  |  |
| `index` * | `string` |  | Chave do eixo X (mês, dia, etapa). |
| `label` * | `string` |  | Resumo em uma frase para leitor de tela: "Receita mensal de jan a set". |
| `activeIndex` | `number \| undefined` |  | Barras: destaca um item (os outros ficam esmaecidos). |
| `activeSeries` | `string[] \| undefined` |  | Séries visíveis (controlado). |
| `categoryInside` | `boolean \| undefined` |  | Barras horizontais: nome da categoria dentro da barra em vez do eixo. |
| `className` | `string \| undefined` |  |  |
| `colorBy` | `((datum: ChartDatum, index: number) => string \| undefined) \| undefined` |  | Barras: cor por item (série única), ex. |
| `curve` | `ChartCurve \| undefined` |  | Curva de linhas/áreas. |
| `dots` | `boolean \| undefined` |  | Marcadores em cada ponto (linhas/áreas). |
| `endLabels` | `boolean \| undefined` |  | Rótulo com o valor no último ponto de cada linha. |
| `format` | `((n: number) => string) \| undefined` |  |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  | Formato do valor no eixo Y (padrão: format). |
| `formatIndex` | `((v: string) => string) \| undefined` |  |  |
| `gradient` | `boolean \| undefined` |  | Preenchimento em degradê nas áreas (padrão true). |
| `grid` | `"both" \| "none" \| "horizontal" \| undefined` |  |  |
| `height` | `number \| undefined` |  | Altura em px (padrão 280). |
| `labels` | `boolean \| "top" \| "inside" \| undefined` |  | Rótulos de valor: em barras ("top" padrão, "inside"); em linhas, acima do ponto. |
| `layout` | `"horizontal" \| "vertical" \| undefined` |  | Barras: "vertical" (padrão) ou "horizontal" (categorias à esquerda). |
| `legend` | `boolean \| "interactive" \| undefined` |  | true/false força; "interactive" = clicar liga/desliga séries. |
| `legendPosition` | `"top" \| "bottom" \| undefined` |  |  |
| `onActiveSeriesChange` | `((keys: string[]) => void) \| undefined` |  |  |
| `radius` | `number \| undefined` |  | Raio das pontas das barras (padrão 4). |
| `reference` | `{ value: number; label: string; } \| undefined` |  | Linha horizontal de referência (meta, limite). |
| `series` | `ChartSeries[] \| undefined` |  | Séries. Opcional dentro de <ChartContainer config>: uma por chave da config. |
| `stacked` | `boolean \| undefined` |  |  |
| `stackOffset` | `"none" \| "expand" \| undefined` |  | "expand" = empilhado 100 % (cada coluna soma 100 %). |
| `tooltip` | `false \| ChartTooltipOptions \| undefined` |  | Tooltip: opções, ou false para desligar. |
| `xAxis` | `boolean \| undefined` |  |  |
| `yAxis` | `boolean \| undefined` |  |  |
| `zero` | `boolean \| undefined` |  | Eixo começando em zero. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-area`):

```tsx
<AreaChart curve="step" … />
```

## BarChart

Comparação entre categorias ou períodos discretos.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `data` * | `ChartDatum[]` |  |  |
| `index` * | `string` |  | Chave do eixo X (mês, dia, etapa). |
| `label` * | `string` |  | Resumo em uma frase para leitor de tela: "Receita mensal de jan a set". |
| `activeIndex` | `number \| undefined` |  | Barras: destaca um item (os outros ficam esmaecidos). |
| `activeSeries` | `string[] \| undefined` |  | Séries visíveis (controlado). |
| `categoryInside` | `boolean \| undefined` |  | Barras horizontais: nome da categoria dentro da barra em vez do eixo. |
| `className` | `string \| undefined` |  |  |
| `colorBy` | `((datum: ChartDatum, index: number) => string \| undefined) \| undefined` |  | Barras: cor por item (série única), ex. |
| `curve` | `ChartCurve \| undefined` |  | Curva de linhas/áreas. |
| `dots` | `boolean \| undefined` |  | Marcadores em cada ponto (linhas/áreas). |
| `endLabels` | `boolean \| undefined` |  | Rótulo com o valor no último ponto de cada linha. |
| `format` | `((n: number) => string) \| undefined` |  |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  | Formato do valor no eixo Y (padrão: format). |
| `formatIndex` | `((v: string) => string) \| undefined` |  |  |
| `gradient` | `boolean \| undefined` |  | Preenchimento em degradê nas áreas (padrão true). |
| `grid` | `"both" \| "none" \| "horizontal" \| undefined` |  |  |
| `height` | `number \| undefined` |  | Altura em px (padrão 280). |
| `labels` | `boolean \| "top" \| "inside" \| undefined` |  | Rótulos de valor: em barras ("top" padrão, "inside"); em linhas, acima do ponto. |
| `layout` | `"horizontal" \| "vertical" \| undefined` |  | Barras: "vertical" (padrão) ou "horizontal" (categorias à esquerda). |
| `legend` | `boolean \| "interactive" \| undefined` |  | true/false força; "interactive" = clicar liga/desliga séries. |
| `legendPosition` | `"top" \| "bottom" \| undefined` |  |  |
| `onActiveSeriesChange` | `((keys: string[]) => void) \| undefined` |  |  |
| `radius` | `number \| undefined` |  | Raio das pontas das barras (padrão 4). |
| `reference` | `{ value: number; label: string; } \| undefined` |  | Linha horizontal de referência (meta, limite). |
| `series` | `ChartSeries[] \| undefined` |  | Séries. Opcional dentro de <ChartContainer config>: uma por chave da config. |
| `stacked` | `boolean \| undefined` |  |  |
| `stackOffset` | `"none" \| "expand" \| undefined` |  | "expand" = empilhado 100 % (cada coluna soma 100 %). |
| `tooltip` | `false \| ChartTooltipOptions \| undefined` |  | Tooltip: opções, ou false para desligar. |
| `xAxis` | `boolean \| undefined` |  |  |
| `yAxis` | `boolean \| undefined` |  |  |
| `zero` | `boolean \| undefined` |  | Eixo começando em zero. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-barras`):

```tsx
<BarChart labels … />
```

## BarList

Ranking horizontal (origem de leads, produtos mais vendidos, motivos de perda).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `BarListItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `limit` | `number \| undefined` |  |  |
| `showShare` | `boolean \| undefined` | `false` | Mostra a participação (%) de cada item no total. |
| `sort` | `boolean \| undefined` | `true` |  |
| `tone` | `"neutral" \| "accent" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-composicao`):

```tsx
<BarList items={[{ label: "Google orgânico", value: 2140, href: "/leads?origem=google" }, …]} showShare />
```

## BarListItem (type)

```ts
type BarListItem = { label: string; value: number; hint?: ReactNode; href?: string; icon?: ReactNode }
```

## CalendarHeatmap

Intensidade por dia (atividade, vendas, entrevistas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `values` * | `{ date: string; value: number; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `end` | `Date \| undefined` | `new Date()` |  |
| `noun` | `string \| undefined` | `"atividades"` |  |
| `tone` | `"ok" \| "accent" \| "ink" \| undefined` | `"ink"` |  |
| `weeks` | `number \| undefined` | `26` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-padroes`):

```tsx
<CalendarHeatmap values={[{ date: "2026-09-30", value: 6 }, …]} weeks={26} noun="atividades" tone="ink" />
```

## CartesianProps (type)

```ts
type CartesianProps = { data: ChartDatum[]; index: string; series?: ChartSeries[]; label: string; height?: number; format?: (n: number) => string; formatAxis?: (n: number) => string; formatIndex?: (v: string) => string; stacked?: boolean; stackOffset?: "none" | "expand"; legend?: boolean | "interactive"; legendPosition?: "top" | "bottom"; yAxis?: boolean; xAxis?: boolean; grid?: "horizontal" | "both" | "none"; curve…
```

## chartColor (function)

Cor da série i (usa tokens, então acompanha qualquer tema).

```ts
chartColor(i): string
```

## ChartConfig (type)

Configuração compartilhada das séries: chave → rótulo, cor e ícone.

```ts
type ChartConfig = Record<string, { label: string; color?: string; icon?: ComponentType<{ className?: string }> }>
```

## ChartContainer

Moldura opcional: fornece a ChartConfig aos gráficos filhos e expõe cada cor como variável CSS `--chart-<chave>` (útil em legendas e textos próprios).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `config` * | `ChartConfig` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-tooltip`):

```tsx
<ChartContainer config={{ online: { label: "Online", icon: Globe }, loja: { label: "Loja física", icon: Store } }}>
  <BarChart stacked … />
</ChartContainer>
```

## ChartCurve (type)

```ts
type ChartCurve = "monotone" | "linear" | "step"
```

## ChartDatum (type)

```ts
type ChartDatum = Record<string, string | number | null | undefined>
```

## ChartLegend

Legenda horizontal. Use quando há 2+ séries e não dá para rotular direto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ key?: string; label: string; color: string; dashed?: boolean; value?: ReactNode; hidden?: boolean; icon?:…` |  |  |
| `align` | `"start" \| "center" \| "end" \| undefined` | `"start"` |  |
| `className` | `string \| undefined` |  |  |
| `onToggle` | `((key: string) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ChartSeries (type)

```ts
type ChartSeries = { key: string; label: string; color?: string; dashed?: boolean; icon?: ComponentType<{ className?: string }>; }
```

## ChartTooltip

Tooltip posicionado (absoluto).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `rows` * | `ChartTooltipItem[]` |  |  |
| `title` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |
| `hideIndicator` | `boolean \| undefined` |  |  |
| `hideLabel` | `boolean \| undefined` |  |  |
| `indicator` | `ChartTooltipIndicator \| undefined` |  |  |
| `style` | `CSSProperties \| undefined` |  |  |
| `total` | `{ label: string; value: ReactNode; } \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ChartTooltipContent

Conteúdo do tooltip (sem posicionamento).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `ChartTooltipItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `hideIndicator` | `boolean \| undefined` | `false` |  |
| `hideLabel` | `boolean \| undefined` | `false` |  |
| `indicator` | `ChartTooltipIndicator \| undefined` | `"dot"` |  |
| `label` | `ReactNode` |  |  |
| `total` | `{ label: string; value: ReactNode; } \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-tooltip`):

```tsx
<ChartTooltipContent
  label="Setembro"
  indicator="line"
  items={[{ label: "Online", value: "R$ 214 mil", color: "var(--ds-chart-1)" }, …]}
  total={{ label: "Total", value: "R$ 354 mil" }}
/>
```

## ChartTooltipIndicator (type)

```ts
type ChartTooltipIndicator = "dot" | "line" | "dashed"
```

## ChartTooltipItem (type)

```ts
type ChartTooltipItem = { key?: string; label: string; value: ReactNode; color?: string; dashed?: boolean; icon?: ComponentType<{ className?: string }> }
```

## ChartTooltipOptions (type)

Opções do tooltip dos gráficos cartesianos.

```ts
type ChartTooltipOptions = { indicator?: ChartTooltipIndicator; hideLabel?: boolean; hideIndicator?: boolean; labelFormatter?: (label: string, datum: ChartDatum) => ReactNode; valueFormatter?: (value: number, key: string, datum: ChartDatum) => ReactNode; showTotal?: boolean | string; defaultIndex?: number; }
```

## DonutChart

Parte de um todo com 2–6 fatias (mix de receita, status de faturas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `DonutItem[]` |  |  |
| `label` * | `string` |  |  |
| `centerLabel` | `string \| undefined` | `"Total"` |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `legend` | `boolean \| undefined` | `true` |  |
| `size` | `number \| undefined` | `168` |  |
| `thickness` | `number \| undefined` | `18` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-composicao`):

```tsx
<DonutChart label="Mix de receita" items={[{ label: "Assinaturas", value: 612000 }, …]} format={(n) => formatCurrency(n, { compact: true })} />
```

## DonutItem (type)

```ts
type DonutItem = { label: string; value: number; color?: string }
```

## FunnelChart

Conversão entre etapas (lead → cliente, candidatura → contratação).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `stages` * | `FunnelStage[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `highlightDrop` | `boolean \| undefined` | `true` |  |
| `label` | `string \| undefined` | `"Funil de conversão"` |  |
| `variant` | `"bars" \| "columns" \| undefined` | `"bars"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-conversao`):

```tsx
<FunnelChart variant="columns" stages={etapas} />
```

## FunnelStage (type)

```ts
type FunnelStage = { label: string; value: number; hint?: ReactNode }
```

## LineChart

Tendência sem volume (taxa, preço, NPS): só a linha.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `data` * | `ChartDatum[]` |  |  |
| `index` * | `string` |  | Chave do eixo X (mês, dia, etapa). |
| `label` * | `string` |  | Resumo em uma frase para leitor de tela: "Receita mensal de jan a set". |
| `activeIndex` | `number \| undefined` |  | Barras: destaca um item (os outros ficam esmaecidos). |
| `activeSeries` | `string[] \| undefined` |  | Séries visíveis (controlado). |
| `categoryInside` | `boolean \| undefined` |  | Barras horizontais: nome da categoria dentro da barra em vez do eixo. |
| `className` | `string \| undefined` |  |  |
| `colorBy` | `((datum: ChartDatum, index: number) => string \| undefined) \| undefined` |  | Barras: cor por item (série única), ex. |
| `curve` | `ChartCurve \| undefined` |  | Curva de linhas/áreas. |
| `dots` | `boolean \| undefined` |  | Marcadores em cada ponto (linhas/áreas). |
| `endLabels` | `boolean \| undefined` |  | Rótulo com o valor no último ponto de cada linha. |
| `format` | `((n: number) => string) \| undefined` |  |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  | Formato do valor no eixo Y (padrão: format). |
| `formatIndex` | `((v: string) => string) \| undefined` |  |  |
| `gradient` | `boolean \| undefined` |  | Preenchimento em degradê nas áreas (padrão true). |
| `grid` | `"both" \| "none" \| "horizontal" \| undefined` |  |  |
| `height` | `number \| undefined` |  | Altura em px (padrão 280). |
| `labels` | `boolean \| "top" \| "inside" \| undefined` |  | Rótulos de valor: em barras ("top" padrão, "inside"); em linhas, acima do ponto. |
| `layout` | `"horizontal" \| "vertical" \| undefined` |  | Barras: "vertical" (padrão) ou "horizontal" (categorias à esquerda). |
| `legend` | `boolean \| "interactive" \| undefined` |  | true/false força; "interactive" = clicar liga/desliga séries. |
| `legendPosition` | `"top" \| "bottom" \| undefined` |  |  |
| `onActiveSeriesChange` | `((keys: string[]) => void) \| undefined` |  |  |
| `radius` | `number \| undefined` |  | Raio das pontas das barras (padrão 4). |
| `reference` | `{ value: number; label: string; } \| undefined` |  | Linha horizontal de referência (meta, limite). |
| `series` | `ChartSeries[] \| undefined` |  | Séries. Opcional dentro de <ChartContainer config>: uma por chave da config. |
| `stacked` | `boolean \| undefined` |  |  |
| `stackOffset` | `"none" \| "expand" \| undefined` |  | "expand" = empilhado 100 % (cada coluna soma 100 %). |
| `tooltip` | `false \| ChartTooltipOptions \| undefined` |  | Tooltip: opções, ou false para desligar. |
| `xAxis` | `boolean \| undefined` |  |  |
| `yAxis` | `boolean \| undefined` |  |  |
| `zero` | `boolean \| undefined` |  | Eixo começando em zero. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-linhas`):

```tsx
<LineChart dots … />
```

## linePath (function)

Curva monotônica (Fritsch–Carlson): suave sem inventar picos entre pontos.

```ts
linePath(points, curved): string
```

## MiniBarChart

Barrinhas de atividade num cartão pequeno (7 dias, 12 meses, 24 horas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `data` * | `{ label: string; value: number; }[]` |  |  |
| `label` * | `string` |  |  |
| `caption` | `ReactNode` |  | Linha abaixo do título ("Últimos 7 dias"). |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n: number) => formatNumber(n)` |  |
| `framed` | `boolean \| undefined` | `true` | false dentro de um cartão que já tem borda. |
| `height` | `number \| undefined` | `96` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-progresso-e-presenca`):

```tsx
<MiniBarChart label="Custo por dia" format={(n) => formatCurrency(n)} data={…} />
```

## niceDomain (function)

Escala "bonita": passos 1 · 2 · 2,5 · 5 · 10 × 10ⁿ, sempre incluindo zero.

```ts
niceDomain(min, max, ticks?): { lo: number; hi: number; ticks: number[]; }
```

## niceRange (function)

Escala "bonita" sem forçar o zero (para linhas de taxa/preço), com folga relativa.

```ts
niceRange(min, max, ticks?, pad?): { lo: number; hi: number; ticks: number[]; }
```

## ProgressRing

Anel de progresso compacto (meta atingida, score, capacidade).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `value` * | `number` |  | 0–100 |
| `children` | `ReactNode` |  | Conteúdo central; padrão = "NN%". |
| `size` | `number \| undefined` | `44` |  |
| `thickness` | `number \| undefined` | `4` |  |
| `tone` | `"ok" \| "warn" \| "bad" \| "accent" \| "ink" \| undefined` | `"ink"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-radial`):

```tsx
<ProgressRing value={74} label="Recebido" tone="ok" />
```

## Sparkline

Mini tendência sem eixos, ao lado de um número.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `values` * | `number[]` |  |  |
| `area` | `boolean \| undefined` | `true` |  |
| `className` | `string \| undefined` |  |  |
| `height` | `number \| undefined` | `28` |  |
| `tone` | `"neutral" \| "ok" \| "bad" \| "accent" \| undefined` | `"neutral"` |  |
| `width` | `number \| undefined` | `96` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SrTable

Tabela escondida para leitores de tela: o valor exato de cada ponto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `data` * | `ChartDatum[]` |  |  |
| `format` * | `(n: number) => string` |  |  |
| `index` * | `string` |  |  |
| `label` * | `string` |  |  |
| `series` * | `ChartSeries[]` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## useChartConfig (hook)

Lê a ChartConfig do ChartContainer mais próximo (ou null).

```ts
useChartConfig(): ChartConfig | null
```

## useElementWidth (hook)

Largura observada de um elemento (para gráficos responsivos).

```ts
useElementWidth(): readonly [RefObject<T | null>, number]
```
