# lib-color

Arquivo: `src/lib/color.ts` · importe de `@g4ai/ds`.

Utilidades de cor para temas de cliente: contraste WCAG e derivação de uma marca completa (claro + escuro) a partir de 1–2 cores.

## bestOn (function)

Melhor cor de texto sobre `bg` entre as candidatas (padrão: branco × quase-preto).

```ts
bestOn(bg, candidates?): string
```

## brandCss (function)

CSS pronto para colar em themes.css (ou no globals.css do app).

```ts
brandCss(name, brand, extra?): string
```

## BrandTokens (type)

```ts
type BrandTokens = { primary: string; onPrimary: string; accent: string; accentDeep: string; accentSoft: string; blue: string; chart1: string; }
```

## contrast (function)

Razão de contraste (1–21).

```ts
contrast(a, b): number
```

## deriveBrand (function)

Deriva os tokens de marca para claro e escuro a partir da cor de ação (primary) e, opcionalmente, da cor de destaque (accent).

```ts
deriveBrand(primary, accent?): { light: BrandTokens; dark: BrandTokens; }
```

## ensureContrast (function)

Escurece (ou clareia) `color` até atingir `min` de contraste contra `against`.

```ts
ensureContrast(color, against, min?): string
```

## hexToRgb (function)

```ts
hexToRgb(hex): Rgb
```

## luminance (function)

Luminância relativa WCAG 2.x.

```ts
luminance(hex): number
```

## mix (function)

Mistura `a` com `b` (t = 0 → a, 1 → b).

```ts
mix(a, b, t): string
```

## Rgb (type)

```ts
type Rgb = [number, number, number]
```

## rgbToHex (function)

```ts
rgbToHex([r, g, b]): string
```
