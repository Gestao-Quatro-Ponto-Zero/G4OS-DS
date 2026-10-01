# lib-format

Arquivo: `src/lib/format.ts` · importe de `@g4ai/ds`.

Formatação pt-BR: formatCurrency, formatNumber, formatPercent, formatDelta, formatCompact, formatDate, formatRelative.

## formatCompact (function)

1250000 → "1,3 mi"

```ts
formatCompact(n): string
```

## formatCurrency (function)

1234.5 → "R$ 1.234,50".

```ts
formatCurrency(n, options?): string
```

Exemplo (showcase `#/p/graficos-composicao`):

```tsx
<Treemap items={estoquePorCategoria} format={(n) => formatCurrency(n, { compact: true })} />
```

## formatDate (function)

"30/09/2026"; `short` → "30 set"

```ts
formatDate(date, { short = false }?): string
```

## formatDelta (function)

Variação assinada: 0.125 → "+12,5 %", -0.2 → "−20 %" (sinal de menos tipográfico).

```ts
formatDelta(fraction, digits?): string
```

## formatNumber (function)

1234.5 → "1.234,5"

```ts
formatNumber(n, digits?): string
```

## formatPercent (function)

0.1234 → "12,3 %". Recebe fração (0–1), não porcentagem.

```ts
formatPercent(fraction, digits?): string
```

## formatRelative (function)

Data relativa curta: "há 5 min", "ontem", "em 3 dias".

```ts
formatRelative(date, now?): string
```
