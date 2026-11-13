# lib-geo-br

Arquivo: `src/lib/geo-br.ts` · importe de `@g4ai/ds`.

Contornos das 27 unidades da federação, prontos para SVG.

## BrRegion (type)

Grande região do IBGE.

```ts
type BrRegion = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul"
```

## brRegions (const)

Grandes regiões e suas UFs (IBGE).

## BrUf (type)

Uma UF desenhável: contorno SVG, centróide (do maior polígono) e caixa.

```ts
type BrUf = { id: BrUfId; name: string; region: BrRegion; path: string; centroid: readonly [number, number]; bbox: readonly [number, number, number, number]; }
```

## BrUfId (type)

Sigla de uma UF.

```ts
type BrUfId = "AC" | "AL" | "AM" | "AP" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA" | "MG" | "MS" | "MT" | "PA" | "PB" | "PE" | "PI" | "PR" | "RJ" | "RN" | "RO" | "RR" | "RS" | "SC" | "SE" | "SP" | "TO"
```

## brUfs (const)

As 27 UFs em ordem alfabética do nome.

## brViewBox (const)

viewBox do mapa do Brasil (use com `brUfs`).
