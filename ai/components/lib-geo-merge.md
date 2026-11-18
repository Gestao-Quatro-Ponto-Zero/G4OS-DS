# lib-geo-merge

Arquivo: `src/lib/geo-merge.ts` · importe de `@g4ai/ds`.

Junta regiões de um mapa em grupos, sem as divisas internas: municípios em regiões de venda, UFs em "Sudeste", países em "Mercosul".

## GeoGroup (type)

Um grupo: o id que os valores usam, o nome que a tela mostra e os ids dos membros.

```ts
type GeoGroup = { id: string; name?: string; members: readonly string[] }
```

## GeoMergeResult (type)

```ts
type GeoMergeResult = { regions: GeoRegion[]; unknown: string[]; }
```

## geoPathRings (function)

Os anéis de um caminho SVG feito de retas.

```ts
geoPathRings(path): Point[][] | null
```

## mergeGeoRegions (function)

Junta as regiões de cada grupo numa região só.

```ts
mergeGeoRegions(regions, groups): GeoMergeResult
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
const { regions, unknown } = mergeGeoRegions(brUfs, [
  { id: "Sudeste", members: ["ES", "MG", "RJ", "SP"] },
  { id: "Sul", members: ["PR", "RS", "SC"] },
]);
// Municípios: mergeGeoRegions(mapa.municipios, [{ id: "Grande SP", members: ["3550308", "3518800"] }])
// Países: mergeGeoRegions(mapa.countries, [{ id: "Mercosul", members: ["BR", "AR", "UY", "PY"] }])

<ChoroplethMap label="Receita por região" regions={regions} values={{ Sudeste: 18.4e6, Sul: 6.1e6 }} regionLabel="Região" />
```
