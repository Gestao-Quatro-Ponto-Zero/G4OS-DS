# geo

Arquivo: `src/components/geo.tsx` · importe de `@g4ai/ds`.

Mapas coropléticos (região pintada pela intensidade de um número): · ChoroplethMap: mapa em SVG com escala em degraus, legenda que destaca a faixa, tooltip, seleção com zoom e navegação por setas · RankedRegionList: a me

## ChoroplethMap

Mapa coroplético (padrão: Brasil por UF).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Nome acessível do mapa ("Receita por estado em outubro de 2026"). |
| `values` * | `MapValues` |  | Valor por id de região. |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `height` | `number \| undefined` |  | Altura em px. Padrão: proporção do viewBox, até `maxHeight`. |
| `highlight` | `LinkedHighlight<string> \| undefined` |  | Realce compartilhado com outra vista (`useLinkedHighlight`): substitui `selected`/`onSelect`. |
| `legend` | `boolean \| undefined` | `true` | Legenda em degraus abaixo do mapa (passar o mouse destaca a faixa). |
| `legendFormat` | `((n: number) => string) \| undefined` |  | Formato curto dos limites da legenda (padrão: `format`). |
| `legendTitle` | `ReactNode` |  |  |
| `maxHeight` | `number \| undefined` | `640` | Teto da altura automática (recortes altos, como o Nordeste). |
| `onSelect` | `((id: string \| null) => void) \| undefined` |  | Clique ou Enter numa região (de novo na mesma solta: `null`). |
| `onZoomOut` | `(() => void) \| undefined` |  | Ação do botão de voltar que aparece com zoom. |
| `regionLabel` | `string \| undefined` | `"UF"` | Cabeçalho da coluna de regiões na tabela de leitor de tela. |
| `regions` | `readonly MapRegion[] \| undefined` | `brUfs` | Regiões desenháveis. Padrão: as 27 UFs (`brUfs`). |
| `scale` | `ChoroplethScaleOptions \| undefined` |  | Escala em degraus (sequencial ou divergente). |
| `selected` | `string \| null \| undefined` |  | Região selecionada (controlado). |
| `showLabels` | `boolean \| undefined` | `true` | Sigla sobre as regiões que cabem (padrão: sim). |
| `valueLabel` | `string \| undefined` | `"Valor"` | Nome do número no tooltip e na tabela ("Receita"). |
| `viewBox` | `string \| undefined` | `brViewBox` | viewBox das regiões. Padrão: `brViewBox`. |
| `zoomOutLabel` | `string \| undefined` | `"Voltar ao Brasil"` |  |
| `zoomTo` | `string \| null \| undefined` | `null` | Aproxima o mapa da região (anima o viewBox). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
<ChoroplethMap
  label="Crescimento da receita em 12 meses por estado"
  values={crescimentoPorUf}
  scale={{ scheme: "diverging", steps: 6, domain: [-0.3, 0.3] }}
  format={(n) => formatDelta(n, 0)}
  valueLabel="Crescimento"
  selected={uf}
  onSelect={setUf}
  zoomTo={uf}
/>
```

## ChoroplethMapProps (type)

```ts
type ChoroplethMapProps = { label: string; values: MapValues; regions?: readonly MapRegion[]; viewBox?: string; scale?: ChoroplethScaleOptions; format?: (n: number) => string; valueLabel?: string; regionLabel?: string; selected?: string | null; onSelect?: (id: string | null) => void; highlight?: LinkedHighlight<string>; zoomTo?: string | null; onZoomOut?: () => void; zoomOutLabel?: string; legend?: boolean; legendTitle?…
```

## choroplethScale (function)

Escala em degraus de um mapa coroplético.

```ts
choroplethScale(values, props?): ChoroplethScale
```

## ChoroplethScale (type)

Escala pronta: degraus, cor de cada valor e dados para a legenda.

```ts
type ChoroplethScale = { scheme: "sequential" | "diverging"; tone: ScaleTone; thresholds: number[]; max: number; bin: (v: number) => number; color: (v: number | null | undefined) => string | null; level: (v: number) => number; }
```

## ChoroplethScaleOptions (type)

```ts
type ChoroplethScaleOptions = { steps?: number; domain?: [number, number]; scheme?: "sequential" | "diverging"; tone?: ScaleTone; breaks?: "equal" | "quantile"; }
```

## fitViewBox (function)

viewBox que enquadra um conjunto de regiões (recorte por grande região, só os estados com dado).

```ts
fitViewBox(regions, pad?): string
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
// Só a região Sul; PR sem dado
const sul = brUfs.filter((u) => brRegions.Sul.includes(u.id));
<ChoroplethMap label="Penetração no Sul" regions={sul} viewBox={fitViewBox(sul)}
  values={{ PR: null, SC: 0.024, RS: 0.014 }} scale={{ tone: "info" }} format={(n) => formatPercent(n, 1)} />
```

## MapRegion (type)

Uma região desenhável: contorno SVG no sistema do `viewBox`.

```ts
type MapRegion = { id: string; name: string; path: string; centroid?: readonly [number, number]; bbox?: readonly [number, number, number, number]; }
```

## MapValues (type)

Valores por id de região; `null` = sem dado (hachura).

```ts
type MapValues = Record<string, number | null | undefined>
```

## RankedRegionList

Lista ordenada (posição, nome, barra proporcional, valor) que acompanha um `ChoroplethMap`: passar o mouse ou focar uma linha acende a região no mapa e vice-versa; clique ou Enter seleciona.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Nome acessível da lista ("Receita por estado, do maior ao menor"). |
| `values` * | `MapValues` |  |  |
| `className` | `string \| undefined` |  |  |
| `format` | `((n: number) => string) \| undefined` | `(n) => formatNumber(n)` |  |
| `highlight` | `LinkedHighlight<string> \| undefined` |  | Realce compartilhado com o mapa (`useLinkedHighlight`). |
| `hint` | `((id: string) => ReactNode) \| undefined` |  | Detalhe curto à direita do nome ("128 clientes"). |
| `limit` | `number \| undefined` |  | Mostra as primeiras N e um botão "Ver todas". |
| `regions` | `readonly MapRegion[] \| undefined` | `brUfs` | Regiões (para os nomes). |
| `scale` | `ChoroplethScaleOptions \| undefined` |  | Mesma escala do mapa (o quadradinho de cor bate com a região). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
const hl = useLinkedHighlight<string>();

// SP domina: degraus por quantil (mesma quantidade de UFs por faixa)
const escala = { breaks: "quantile" } as const;
<ChoroplethMap label="Receita mensal por estado" values={receitaPorUf} scale={escala} format={brl}
  legendFormat={formatCompact} legendTitle="Receita (R$)" valueLabel="Receita" highlight={hl} />
<RankedRegionList label="Receita por estado, do maior ao menor" values={receitaPorUf} scale={escala} format={brl} highlight={hl} limit={8} />
```

## RankedRegionListProps (type)

```ts
type RankedRegionListProps = { label: string; values: MapValues; regions?: readonly MapRegion[]; scale?: ChoroplethScaleOptions; format?: (n: number) => string; highlight?: LinkedHighlight<string>; limit?: number; hint?: (id: string) => ReactNode; className?: string; }
```
