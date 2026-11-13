# charts-advanced

Arquivo: `src/components/charts-advanced.tsx` · importe de `@g4ai/ds`.

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
| `values` * | `(number \| null)[][]` |  | values[linha][coluna]; null = sem dado (célula vazia, sem fundo). |
| `cell` | `number \| undefined` | `36` |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `label` | `string \| undefined` | `"Matriz"` |  |
| `legend` | `ReactNode` | `false` | Legenda da escala acima da matriz. |
| `legendTitle` | `string \| undefined` |  | Título curto da legenda ("% retido"). |
| `max` | `number \| undefined` |  |  |
| `rowMeta` | `ReactNode[] \| undefined` |  | Coluna extra depois do rótulo de cada linha (tamanho da coorte, total). |
| `rowMetaLabel` | `string \| undefined` |  | Cabeçalho da coluna de `rowMeta` ("Espaços"). |
| `rowsLabel` | `string \| undefined` |  | Cabeçalho da coluna de rótulos ("Coorte"). |
| `scale` | `{ steps: number; domain?: [number, number]; } \| undefined` |  | Escala em degraus (`quantizeScale`): `steps` faixas sobre `domain` exatamente como dado ([0.2, 0.8] em 6 → 20, 30… 70 %) ou, sem `domain`, faixas de limites redondos sobre o mínimo e o máximo dos dados. |
| `showValues` | `boolean \| undefined` | `true` |  |
| `summaryRow` | `{ label: string; values: (number \| null)[]; meta?: ReactNode; } \| undefined` |  | Linha de resumo separada no fim ("Média"), pintada na mesma escala. |
| `tone` | `"ok" \| "info" \| "accent" \| "ink" \| undefined` | `"ink"` |  |
| `valueLabel` | `string \| undefined` | `"Valor"` | Rótulo do valor no tooltip ("Retidos"). |

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
| `grid` | `"circle" \| "none" \| "polygon" \| undefined` | `"polygon"` |  |
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

## RetentionCurves

Curvas de retenção por coorte: uma linha por coorte (as recentes mais escuras), a média em destaque.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `string[]` |  | Rótulo de cada ponto do eixo X ("1", "2"… meses desde o cadastro). |
| `label` * | `string` |  | Nome acessível (obrigatório): o que as curvas respondem. |
| `rows` * | `{ label: string; values: (number \| null)[]; }[]` |  | Uma linha por coorte, da mais antiga para a mais recente. |
| `average` | `{ label?: string; values: (number \| null)[]; } \| undefined` |  | Curva média, desenhada em destaque. |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatPercent(n, 0)` |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  |  |
| `height` | `number \| undefined` | `280` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-saas`):

```tsx
<RetentionCurves
  rows={[{ label: "jan", values: [0.74, 0.63, 0.55] }, { label: "fev", values: [0.75, 0.64, null] }]}
  columns={["1", "2", "3"]}
  average={{ label: "Média", values: [0.745, 0.635, 0.55] }}
  label="Curvas de retenção por coorte"
/>
```

## SankeyChart

Fluxos entre etapas (origem do lead → etapa → ganho/perdido; visita → conta → plano).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `links` * | `SankeyLink[]` |  |  |
| `nodes` * | `SankeyNode[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `columnLabels` | `string[] \| undefined` |  | Rótulo de cada coluna, embaixo ("Visita", "Conta", "Plano"). |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `300` |  |
| `label` | `string \| undefined` | `"Fluxo"` |  |
| `minWidth` | `number \| undefined` |  | Largura mínima do desenho. |
| `nodeLabels` | `"side" \| "above" \| undefined` | `"side"` | "side": nome e valor à direita do nó. |
| `onSelect` | `((id: string \| null) => void) \| undefined` |  | Com `onSelect`, os nós viram botões: setas percorrem (↑↓ na coluna, ←→ entre colunas), Enter seleciona, Esc solta. |
| `selected` | `string \| null \| undefined` |  | Nó selecionado (id): traça os fluxos que chegam e saem dele; o resto esmaece. |

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
type SankeyNode = { id: string; label: string; column: number; color?: string; }
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

Ponte entre um valor inicial e um final (receita bruta → lucro líquido; caixa inicial → final; MRR de início → fim).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `WaterfallStep[]` |  |  |
| `axisBreak` | `boolean \| { min: number; } \| undefined` | `false` | Eixo truncado (exceção da regra do zero): começa perto do menor valor, com a marca de quebra no eixo e na base de cada barra de total. |
| `className` | `string \| undefined` |  |  |
| `connectors` | `boolean \| undefined` | `true` | Linhas tracejadas ligando o topo de uma barra ao início da seguinte. |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `formatAxis` | `((n: number) => string) \| undefined` |  |  |
| `height` | `number \| undefined` | `260` |  |
| `label` | `string \| undefined` | `"Ponte de valores"` |  |
| `onSelect` | `((index: number \| null) => void) \| undefined` |  | Clique ou Enter numa barra (índice), ou null ao soltar. |
| `selected` | `number \| null \| undefined` |  | Barra selecionada (índice). |
| `showValues` | `boolean \| undefined` | `true` | Valor escrito junto da barra (acima dos aumentos e totais, abaixo das quedas). |

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
