# lib-geo-maps

Arquivo: `src/lib/geo-maps.ts` · importe de `@g4ai/ds`.

Mapas além das 27 UFs, carregados sob demanda (cada um vira um pedaço do bundle e só desce quando a tela pede): · loadWorldCountries(): os países do mundo (Equal Earth) e o recorte de cada continente · loadBrMunicipios(u

## BrDddMap (type)

```ts
type BrDddMap = { uf: BrUfId; viewBox: string; ddds: readonly BrDddShape[] }
```

## BrDddShape (type)

Uma região de DDD: id = o DDD ("11"), nome "DDD 11" e quantos municípios ela junta.

```ts
type BrDddShape = GeoShape & { municipios: number }
```

## BrMunicipiosMap (type)

```ts
type BrMunicipiosMap = { uf: BrUfId; viewBox: string; municipios: readonly GeoShape[] }
```

## GeoShape (type)

Uma região desenhável: contorno SVG, centróide e caixa da maior parte.

```ts
type GeoShape = { id: string; name: string; path: string; centroid: readonly [number, number]; bbox: readonly [number, number, number, number]; }
```

## loadBrDdd (function)

Regiões de DDD de uma UF: cada uma é a união dos seus municípios, no mesmo viewBox de `loadBrMunicipios(uf)`.

```ts
loadBrDdd(uf): Promise<BrDddMap>
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
const [mapa, setMapa] = useState<BrDddMap | null>(null);
useEffect(() => { void loadBrDdd("SP").then(setMapa); }, []); // SP ~4 KB com gzip

<ChoroplethMap label="Leads por DDD de São Paulo" regions={mapa.ddds} viewBox={mapa.viewBox}
  values={{ "11": 2140, "19": 655, "16": 342 }} regionLabel="DDD" highlight={hl} />
```

## loadBrMunicipios (function)

Municípios de uma UF (malha do IBGE; id = código de 7 dígitos).

```ts
loadBrMunicipios(uf): Promise<BrMunicipiosMap>
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
const [mapa, setMapa] = useState<BrMunicipiosMap | null>(null);
useEffect(() => { void loadBrMunicipios("SP").then(setMapa); }, []); // SP ~40 KB com gzip

<ChoroplethMap label="Leads por município de São Paulo" regions={mapa.municipios} viewBox={mapa.viewBox}
  values={{ "3550308": 2140, "3509502": 412 }} regionLabel="Município" showLabels={false} markers="none" />
```

## loadWorldCountries (function)

Países do mundo (Natural Earth 1:50m, sem a Antártida).

```ts
loadWorldCountries(): Promise<WorldMap>
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
const [mapa, setMapa] = useState<WorldMap | null>(null);
useEffect(() => { void loadWorldCountries().then(setMapa); }, []); // ~20 KB com gzip, só quando a tela pede

<ChoroplethMap label="Clientes por país" regions={mapa.countries}
  viewBox={continente === "Mundo" ? mapa.viewBox : mapa.continentViewBoxes[continente]}
  values={{ BR: 1240, AR: 182, PT: 74 }} regionLabel="País" markers="with-value" markerBelow={8} highlight={hl} />
```

## WorldContinent (type)

Continentes do mapa-múndi (a Rússia fica na Europa; Turquia e Cáucaso, na Ásia).

```ts
type WorldContinent = "África" | "América do Norte" | "América do Sul" | "Ásia" | "Europa" | "Oceania"
```

## worldContinents (const)

## WorldCountry (type)

Um país: id ISO 3166-1 alfa-2 ("BR"), nome em português e continente.

```ts
type WorldCountry = GeoShape & { continent: WorldContinent }
```

## WorldMap (type)

```ts
type WorldMap = { viewBox: string; countries: readonly WorldCountry[]; continentViewBoxes: Readonly<Record<WorldContinent, string>>; }
```
