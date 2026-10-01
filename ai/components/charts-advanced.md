# charts-advanced

Arquivo: `src/components/charts-advanced.tsx` · importe de `@g4os/ds`.

Gráficos avançados: Treemap, WaterfallChart, ScatterChart, RadarChart, GaugeChart, BulletChart, SankeyChart, HeatmapMatrix, ComboChart, ProportionBar, GanttChart.

## BulletChart

Realizado × meta com faixas qualitativas, numa linha.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `target` * | `number` |  |  |
| `value` * | `number` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `goodWhen` | `"up" \| "down" \| undefined` | `"up"` | "down" para custo/orçamento: ficar abaixo da meta é bom; estourar 10 % é rose. |
| `hint` | `ReactNode` |  |  |
| `max` | `number \| undefined` |  |  |
| `ranges` | `[number, number] \| undefined` | `[0.6, 0.9]` | Limites das faixas como fração da meta (ruim < 0,6 ≤ ok < 0,9 ≤ bom). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-metas`):

```tsx
<BulletChart label="Ana Lopes" hint="Enterprise" value={412000} target={380000} format={brl} />
```

## ComboChart

Volume em barras (eixo esquerdo) + taxa em linha (eixo direito): receita e margem, contratações e tempo médio, pedidos e ticket médio.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `bar` * | `ChartSeries` |  |  |
| `data` * | `ChartDatum[]` |  |  |
| `index` * | `string` |  |  |
| `label` * | `string` |  |  |
| `line` * | `ChartSeries` |  |  |
| `className` | `string \| undefined` |  |  |
| `formatBar` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `formatLine` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `260` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-linhas`):

```tsx
<ComboChart bar={{ key: "pedidos", label: "Pedidos" }} line={{ key: "ticket", label: "Ticket médio" }} … />
```

## GanttChart

Cronograma: tarefas no tempo com progresso e marco.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tasks` * | `GanttTask[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Cronograma"` |  |
| `today` | `Date \| undefined` | `new Date()` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-padroes`):

```tsx
<GanttChart tasks={[{ id: "1", label: "Integração fiscal", start: "2026-09-07", end: "2026-10-16", progress: 55 }, { id: "2", label: "Go-live", start: "2026-11-03", end: "2026-11-03", milestone: true }]} />
```

## GanttTask (type)

```ts
type GanttTask = { id: string; label: string; start: string; end: string; progress?: number; group?: string; tone?: "neutral" | "accent" | "ok" | "warn" | "bad"; milestone?: boolean }
```

## GaugeChart

Um número contra faixas (NPS, SLA, uso do plano, atingimento de meta).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `value` * | `number` |  |  |
| `bands` | `{ to: number; tone: "ok" \| "warn" \| "bad" \| "neutral"; label?: string; }[] \| undefined` |  | Faixas até `to`: [{ to: 0, tone: "bad", label: "Crítica" }, { to: 50, tone: "warn" }, { to: 100, tone: "ok" }] |
| `caption` | `ReactNode` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `max` | `number \| undefined` | `100` |  |
| `min` | `number \| undefined` | `0` |  |
| `size` | `number \| undefined` | `220` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-radial`):

```tsx
<GaugeChart value={72} min={-100} max={100} bands={[…]} />
```

## HeatmapMatrix

Intensidade em duas dimensões: coorte × mês (retenção), dia × hora (picos de atendimento), vendedor × etapa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `string[]` |  |  |
| `rows` * | `string[]` |  |  |
| `values` * | `(number \| null)[][]` |  | values[linha][coluna]; null = sem dado. |
| `cell` | `number \| undefined` | `36` |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `label` | `string \| undefined` | `"Matriz"` |  |
| `max` | `number \| undefined` |  |  |
| `showValues` | `boolean \| undefined` | `true` |  |
| `tone` | `"ok" \| "info" \| "accent" \| "ink" \| undefined` | `"ink"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-padroes`):

```tsx
<HeatmapMatrix rows={["jan/26", …]} columns={["M0", "M1", …]} values={[[100, 88, …], …]} format={(n) => `${n}%\
```

## ProportionBar

Uma barra de 100 % dividida em partes, com legenda e percentuais.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value: number; color?: string; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `10` |  |
| `legend` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-composicao`):

```tsx
<ProportionBar items={[{ label: "Pagas", value: 188, color: "var(--ds-ok)" }, …]} />
```

## RadarChart

Perfil em 3–8 critérios na mesma escala (scorecard de entrevista, avaliação de fornecedor, maturidade).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `axes` * | `string[]` |  |  |
| `series` * | `{ label: string; values: number[]; color?: string; dashed?: boolean; }[]` |  |  |
| `axisValues` | `boolean \| undefined` | `false` |  |
| `className` | `string \| undefined` |  |  |
| `dots` | `boolean \| undefined` | `true` |  |
| `fill` | `boolean \| undefined` | `true` | false = só contorno (comparar perfis sem sobrepor manchas). |
| `format` | `((n: number) => string) \| undefined` | `(n: number) => formatNumber(n, 1)` |  |
| `grid` | `"none" \| "polygon" \| "circle" \| undefined` | `"polygon"` |  |
| `gridFill` | `boolean \| undefined` | `false` | Anel externo preenchido com soft. |
| `label` | `string \| undefined` | `"Perfil"` |  |
| `legend` | `boolean \| undefined` |  |  |
| `max` | `number \| undefined` | `5` |  |
| `radiusAxis` | `boolean \| undefined` | `false` |  |
| `rings` | `number \| undefined` | `4` |  |
| `size` | `number \| undefined` | `300` | Tamanho máximo; encolhe para caber no contêiner. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-radar`):

```tsx
<RadarChart gridFill … />
```

## SankeyChart

Fluxos entre etapas (origem do lead → etapa → ganho/perdido; receita → centros de custo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `links` * | `SankeyLink[]` |  |  |
| `nodes` * | `SankeyNode[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `300` |  |
| `label` | `string \| undefined` | `"Fluxo"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-conversao`):

```tsx
<SankeyChart
  nodes={[{ id: "org", label: "Orgânico", column: 0 }, { id: "qual", label: "Qualificado", column: 1 }, { id: "won", label: "Ganho", column: 2 }, …]}
  links={[{ source: "org", target: "qual", value: 520 }, { source: "qual", target: "won", value: 312 }, …]}
/>
```

## SankeyLink (type)

```ts
type SankeyLink = { source: string; target: string; value: number }
```

## SankeyNode (type)

```ts
type SankeyNode = { id: string; label: string; column: number }
```

## ScatterChart

Correlação entre duas medidas (ticket × ciclo de venda; salário × tempo de casa).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `points` * | `ScatterPoint[]` |  |  |
| `xLabel` * | `string` |  |  |
| `yLabel` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `formatX` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `formatY` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `groups` | `string[] \| undefined` |  |  |
| `height` | `number \| undefined` | `280` |  |
| `label` | `string \| undefined` | `"Dispersão"` |  |
| `quadrants` | `boolean \| undefined` | `false` | Linhas de média em X e Y. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-padroes`):

```tsx
<ScatterChart points={[{ id, label, x, y, size?, group? }]} xLabel="Valor (R$ mil)" yLabel="Ciclo (dias)" groups={["Enterprise", "Mid-market", "PME"]} quadrants />
```

## ScatterPoint (type)

```ts
type ScatterPoint = { id: string; label: string; x: number; y: number; size?: number; group?: string }
```

## Treemap

Composição por área (estoque por categoria, receita por produto, gasto por centro de custo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `TreemapItem[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `colorful` | `boolean \| undefined` | `false` | true = paleta chart-1…6; false = tons de ink (mais sóbrio). |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `280` |  |
| `label` | `string \| undefined` | `"Composição"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-composicao`):

```tsx
<Treemap items={estoquePorCategoria} format={(n) => formatCurrency(n, { compact: true })} />
```

## TreemapItem (type)

```ts
type TreemapItem = { label: string; value: number; color?: string; hint?: ReactNode }
```

## WaterfallChart

Ponte entre um valor inicial e um final (receita bruta → lucro líquido; caixa inicial → final).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `WaterfallStep[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  |  |
| `height` | `number \| undefined` | `260` |  |
| `label` | `string \| undefined` | `"Ponte de valores"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-metas`):

```tsx
<WaterfallChart
  steps={[
    { label: "Receita bruta", value: 1033000, kind: "total" },
    { label: "Impostos", value: -142000 },
    { label: "Custos", value: -371000 },
    { label: "Margem", value: 520000, kind: "total" },
    …
  ]}
  format={(n) => formatCurrency(n, { compact: true })}
/>
```

## WaterfallStep (type)

```ts
type WaterfallStep = { label: string; value: number; kind?: "delta" | "total" }
```
