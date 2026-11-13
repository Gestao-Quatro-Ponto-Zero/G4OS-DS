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

Exemplo (showcase `#/p/dash-progresso-e-presenca`):

```tsx
<MiniBarChart label="Custo por dia" format={(n) => formatCurrency(n)} data={…} />
```

## formatDate (function)

"30/09/2026"; `short` → "30 set"; `time` acrescenta a hora ("30/09/2026, 14:05").

```ts
formatDate(date, props?): string
```

## formatDelta (function)

Variação assinada: 0.125 → "+12,5 %", -0.2 → "−20 %" (sinal de menos tipográfico).

```ts
formatDelta(fraction, digits?): string
```

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

## formatNumber (function)

1234.5 → "1.234,5"; -20 → "−20"

```ts
formatNumber(n, digits?): string
```

## formatPercent (function)

0.1234 → "12,3 %". Recebe fração (0–1), não porcentagem.

```ts
formatPercent(fraction, digits?): string
```

Exemplo (showcase `#/p/graficos-mapa`):

```tsx
// Só a região Sul; PR sem dado
const sul = brUfs.filter((u) => brRegions.Sul.includes(u.id));
<ChoroplethMap label="Penetração no Sul" regions={sul} viewBox={fitViewBox(sul)}
  values={{ PR: null, SC: 0.024, RS: 0.014 }} scale={{ tone: "info" }} format={(n) => formatPercent(n, 1)} />
```

## formatRelative (function)

Data relativa: "há 5 min", "ontem", "em 3 dias".

```ts
formatRelative(date, nowOrOptions?): string
```

Exemplo (showcase `#/p/estrutura-pagina-e-listas`):

```tsx
<ListRow leading={…} kicker="Time de vendas" title="Marina Couto" meta={formatRelative(date, { short: true })} />
```
