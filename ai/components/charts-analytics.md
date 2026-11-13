# charts-analytics

Arquivo: `src/components/charts-analytics.tsx` · importe de `@g4ai/ds`.

Gráficos analíticos de série temporal: · ConnectedScatter: duas medidas ao longo do tempo (CAC × LTV, preço × volume).

## ConnectedScatter

Dispersão conectada: como duas medidas andaram juntas no tempo (CAC × LTV, preço × volume, custo × satisfação).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Descrição acessível do gráfico (obrigatória). |
| `series` * | `ConnectedScatterSeries[]` |  |  |
| `xLabel` * | `string` |  | Nome da medida do eixo horizontal ("CAC"). |
| `yLabel` * | `string` |  | Nome da medida do eixo vertical ("LTV em 12 meses"). |
| `active` | `string \| undefined` |  | Série em destaque (key). |
| `arrows` | `boolean \| undefined` | `true` | Setas discretas de direção no meio de cada trecho. |
| `className` | `string \| undefined` |  |  |
| `compare` | `boolean \| undefined` | `true` | Mostra as outras séries bem esmaecidas, para comparar. |
| `curve` | `"linear" \| "smooth" \| undefined` | `"smooth"` | Caminho suave (padrão) ou em segmentos retos. |
| `formatAxisX` | `((n: number) => string) \| undefined` |  | Formato dos rótulos dos eixos (compacto). |
| `formatAxisY` | `((n: number) => string) \| undefined` |  |  |
| `formatX` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `formatY` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` | `340` |  |
| `index` | `number \| undefined` |  | Posição da cabeça (índice do ponto). |
| `legend` | `boolean \| undefined` | `true` | Legenda acima do gráfico. |
| `onIndexChange` | `((index: number) => void) \| undefined` |  |  |
| `reference` | `ConnectedScatterReference \| undefined` |  | Linha de razão tracejada (y = ratio · x) com zona saudável opcional. |
| `scrubber` | `boolean \| undefined` | `true` | Controle de tempo embaixo (tocar/pausar). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-analise`):

```tsx
<ConnectedScatter
  label="CAC contra LTV de 12 meses, julho de 2025 a junho de 2026"
  series={[{ key: "pago", label: "Mídia paga", points: [{ x: 780, y: 2950, label: "jul 2025" }, …, { x: 960, y: 4640, label: "jun 2026", note: "Planos anuais" }] }, …]}
  active={canal}
  xLabel="CAC" yLabel="LTV em 12 meses"
  formatX={brl} formatY={brl}
  reference={{ ratio: 3, label: "LTV = 3× CAC", zone: "above", zoneLabel: "Saudável, acima de 3×" }}
/>
```

## ConnectedScatterPoint (type)

```ts
type ConnectedScatterPoint = { x: number; y: number; label: string; note?: string; }
```

## ConnectedScatterProps (type)

```ts
type ConnectedScatterProps = { series: ConnectedScatterSeries[]; active?: string; compare?: boolean; index?: number; onIndexChange?: (index: number) => void; xLabel: string; yLabel: string; formatX?: (n: number) => string; formatY?: (n: number) => string; formatAxisX?: (n: number) => string; formatAxisY?: (n: number) => string; reference?: ConnectedScatterReference; curve?: "smooth" | "linear"; arrows?: boolean; scrubber?:…
```

## ConnectedScatterReference (type)

```ts
type ConnectedScatterReference = { ratio: number; label: string; zone?: "above" | "below"; zoneLabel?: string; }
```

## ConnectedScatterSeries (type)

```ts
type ConnectedScatterSeries = { key: string; label: string; points: ConnectedScatterPoint[]; color?: string; }
```

## HorizonChart

Horizon: muitas séries diárias (8–20) contra a própria base, cada uma numa linha baixa dobrada em faixas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `days` * | `string[]` |  | Rótulo de cada dia (mesmo comprimento de `values`): vai para o cabeçalho e o leitor de tela. |
| `label` * | `string` |  | Descrição acessível do gráfico (obrigatória). |
| `series` * | `HorizonSeries[]` |  |  |
| `bands` | `1 \| 2 \| 3 \| 4 \| undefined` | `3` | Em quantas faixas cada linha dobra. |
| `className` | `string \| undefined` |  |  |
| `extent` | `number \| undefined` |  | Desvio máximo coberto (fração). |
| `format` | `((n: number) => string) \| undefined` | `horizonDelta` | Formato do desvio. Padrão: formatDelta sem casas ("+12 %"; perto de zero, "0 %"). |
| `header` | `boolean \| undefined` | `true` | Cabeçalho com o dia em foco. |
| `index` | `number \| null \| undefined` |  | Dia sob a cruz (índice) ou null. |
| `legend` | `boolean \| undefined` | `true` | Legenda das faixas (HorizonLegend). |
| `onIndexChange` | `((index: number \| null) => void) \| undefined` |  |  |
| `rowHeight` | `number \| undefined` | `32` | Altura de cada linha em px. |
| `sort` | `"name" \| "peak" \| "latest" \| undefined` | `"name"` | Ordem das linhas: nome, pico (maior desvio) ou último dia. |
| `ticks` | `{ index: number; label: string; }[] \| undefined` |  | Marcas do eixo de tempo embaixo (ex.: o 1º de cada mês). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-analise`):

```tsx
// values = desvio de cada dia contra a base, em fração (0.12 = 12 % acima)
<HorizonChart
  label="Vendas diárias por loja contra a média do trimestre"
  series={[{ key: "centro", label: "Loja Centro", values: [0.04, 0.06, -0.02, …] }, …]}
  days={["Dia 1", "Dia 2", …]}
  bands={3}
  sort="peak"
/>
```

## HorizonChartProps (type)

```ts
type HorizonChartProps = { series: HorizonSeries[]; days: string[]; bands?: 1 | 2 | 3 | 4; extent?: number; sort?: "name" | "peak" | "latest"; rowHeight?: number; index?: number | null; onIndexChange?: (index: number | null) => void; format?: (n: number) => string; ticks?: { index: number; label: string }[]; header?: boolean; legend?: boolean; label: string; className?: string; }
```

## HorizonLegend

Legenda do horizon: faixas abaixo e acima da base e a frase de leitura.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `bands` * | `number` |  | Número de faixas (1–4). |
| `extent` * | `number` |  | Desvio máximo coberto (fração: 0.36 = 36 %). |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `horizonDelta` | Formato dos extremos. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-analise`):

```tsx
<HorizonLegend bands={3} extent={0.36} />
```

## HorizonLegendProps (type)

```ts
type HorizonLegendProps = { bands: number; extent: number; format?: (n: number) => string; className?: string; }
```

## HorizonSeries (type)

```ts
type HorizonSeries = { key: string; label: string; values: (number | null)[]; }
```
