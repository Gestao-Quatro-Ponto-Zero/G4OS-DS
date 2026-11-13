# lib-pivot

Arquivo: `src/lib/pivot.ts` · importe de `@g4ai/ds`.

Motor da tabela dinâmica (pivô).

## emptyPivotLayout (const)

Layout vazio.

## formatPivotValue (function)

Formata um valor do pivô conforme o campo e a agregação.

```ts
formatPivotValue(n, spec, options?): string
```

## pivot (function)

Calcula o pivô. Campos desconhecidos no layout são ignorados; medidas em Linhas/Colunas também.

```ts
pivot(records, fields, layout): PivotResult
```

Exemplo (showcase `#/p/colecoes-tabela-dinamica`):

```tsx
const result = pivot(records, fields, {
  rows: ["regiao", "uf"], columns: ["trimestre"],
  values: [{ field: "receita", agg: "sum" }], filters: [],
});
<PivotTable result={result} label="Receita por região e trimestre" heat />
```

## PIVOT_BLANK (const)

Rótulo de registros sem valor na dimensão.

## PIVOT_TOTAL (const)

Chave do total (linha "Total geral" e coluna "Total").

## PivotAgg (type)

Agregação de um valor do pivô.

```ts
type PivotAgg = "sum" | "avg" | "count" | "min" | "max" | "distinct"
```

## pivotAggLabel (const)

Rótulo pt-BR de cada agregação.

## pivotAggsFor (function)

Agregações oferecidas para um campo (as declaradas ou as padrão do tipo).

```ts
pivotAggsFor(field): PivotAgg[]
```

## PivotArea (type)

Áreas do construtor.

```ts
type PivotArea = "rows" | "columns" | "values" | "filters"
```

## pivotCanDrop (function)

O campo pode ir para a área?

```ts
pivotCanDrop(field, area): boolean
```

## PivotCells (type)

```ts
type PivotCells = Record<string, Record<string, (number | null)[]>>
```

## PivotColumn (type)

Combinação de colunas (folha do cabeçalho).

```ts
type PivotColumn = { key: string; path: string[] }
```

## PivotField (type)

Campo disponível para o pivô: dimensão (agrupa) ou medida (soma, média…).

```ts
type PivotField = { id: string; label: string; kind: "dimension" | "measure"; format?: "currency" | "number" | "percent"; aggs?: PivotAgg[]; values?: string[]; }
```

## PivotFilterSpec (type)

```ts
type PivotFilterSpec = { field: string; include?: string[]; }
```

## PivotHeaderCell (type)

Célula de cabeçalho de coluna num nível, já com a extensão (em combinações).

```ts
type PivotHeaderCell = { label: string; span: number; key: string }
```

## PivotLayout (type)

Configuração do pivô: dimensões em Linhas e Colunas, medidas em Valores, recortes em Filtros.

```ts
type PivotLayout = { rows: string[]; columns: string[]; values: PivotValueSpec[]; filters: PivotFilterSpec[]; }
```

## pivotMove (function)

Move um campo entre áreas (ou para fora, `to.area = null`).

```ts
pivotMove(layout, fields, from, to): PivotLayout
```

## PivotMoveSource (type)

Origem de uma movimentação: área + posição (ou a lista de campos, `area: null`).

```ts
type PivotMoveSource = { area: PivotArea | null; index?: number; field: string }
```

## PivotRecord (type)

```ts
type PivotRecord = Record<string, unknown>
```

## PivotResolvedValue (type)

Valor com campo e rótulo resolvidos ("Receita (Soma)").

```ts
type PivotResolvedValue = PivotValueSpec & { label: string; fieldLabel: string; aggLabel: string; format?: PivotField["format"] }
```

## PivotResult (type)

```ts
type PivotResult = { layout: PivotLayout; rowFields: PivotField[]; columnFields: PivotField[]; values: PivotResolvedValue[]; rows: PivotRowNode[]; columns: PivotColumn[]; columnHeaders: PivotHeaderCell[][]; value: PivotCells; grandTotal: (number | null)[]; recordCount: number; totalRecords: number; }
```

## PivotRowNode (type)

Nó da árvore de linhas: grupo (com filhos e subtotal) ou folha.

```ts
type PivotRowNode = { key: string; path: string[]; label: string; field: string; depth: number; children: PivotRowNode[]; count: number; }
```

## pivotSwap (function)

Troca Linhas e Colunas.

```ts
pivotSwap(layout): PivotLayout
```

## pivotToRows (function)

Achata o resultado numa tabela (CSV, cópia): cabeçalho + uma linha por nó (grupos com subtotal, folhas) + "Total geral".

```ts
pivotToRows(result): { header: string[]; rows: (string | number | null)[][]; }
```

## pivotValues (function)

Valores distintos de uma dimensão nos registros, na ordem de exibição (para o filtro).

```ts
pivotValues(records, field): string[]
```

## PivotValueSpec (type)

```ts
type PivotValueSpec = { field: string; agg: PivotAgg }
```
