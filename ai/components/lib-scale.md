# lib-scale

Arquivo: `src/lib/scale.ts` · importe de `@g4ai/ds`.

Escalas de cor para dados de intensidade (mapa de calor, coorte, mapa por UF, pivô, horizon).

## divergingColor (function)

Cor de uma posição `t` (-1 a 1) numa escala divergente: negativo em `chart-neg`, positivo em `chart-pos`, zero quase transparente.

```ts
divergingColor(t): string
```

## onScaleInk (function)

Cor do texto sobre uma célula de intensidade `t`: tinta normal até o meio da escala, tinta invertida acima (legível nos dois temas).

```ts
onScaleInk(t): "var(--color-on-ink)" | "var(--color-ink)"
```

## QuantizedScale (type)

```ts
type QuantizedScale = { thresholds: number[]; bin: (v: number) => number; level: (v: number) => number; steps: number; domain: [number, number]; }
```

## quantizeScale (function)

Divide um domínio em `steps` degraus de limites "redondos" (escala em degraus: mais fácil de ler e comparar do que contínua).

```ts
quantizeScale(domain, steps?, { nice = true }?): QuantizedScale
```

## scaleExtent (function)

Mínimo e máximo de uma lista ignorando null/NaN.

```ts
scaleExtent(values): [number, number]
```

## scaleShade (function)

Curva de opacidade: degraus baixos ficam distinguíveis do fundo e os altos não "estouram" (mesmo critério do HeatmapMatrix).

```ts
scaleShade(t): number
```

## ScaleTone (type)

```ts
type ScaleTone = "ink" | "accent" | "ok" | "info" | "pos" | "neg"
```

## sequentialColor (function)

Cor de uma intensidade `t` (0–1) numa escala de uma cor só.

```ts
sequentialColor(t, tone?): string
```
