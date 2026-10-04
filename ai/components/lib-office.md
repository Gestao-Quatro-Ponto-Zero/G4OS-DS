# lib-office

Arquivo: `src/lib/office.ts` · importe de `@g4ai/ds`.

Modelo de planilha e de documento do DS.

## cellAddress (function)

Endereço A1 a partir de linha/coluna 0-based.

```ts
cellAddress(row, col): string
```

## CellFormat (type)

Como a coluna é formatada na tela e no Excel.

```ts
type CellFormat = "text" | "integer" | "number" | "currency" | "percent" | "date"
```

## CellValue (type)

Valor de célula. Datas: `Date` ou "AAAA-MM-DD".

```ts
type CellValue = string | number | boolean | Date | null | undefined
```

## columnLetter (function)

0 → "A", 25 → "Z", 26 → "AA".

```ts
columnLetter(index): string
```

## DocBlock (type)

```ts
type DocBlock = | { type: "heading"; text: string; level?: 1 | 2 | 3 } | { type: "paragraph"; text: DocText } | { type: "list"; items: DocText[]; ordered?: boolean } | { type: "table"; columns: DocTableColumn[]; rows: CellValue[][]; caption?: string; totalRow?: boolean } | { type: "stats"; items: { label: string; value: string; delta?: string; good?: boolean }[] } | { type: "callout"; title?: string; text: Doc…
```

## DocRun (type)

Trecho de texto com ênfase.

```ts
type DocRun = { text: string; bold?: boolean; italic?: boolean; href?: string }
```

## docRuns (function)

```ts
docRuns(text): DocRun[]
```

## DocTableColumn (type)

```ts
type DocTableColumn = { header: string; format?: CellFormat; digits?: number; width?: number }
```

## DocText (type)

```ts
type DocText = string | DocRun[]
```

## documentOutline (function)

Títulos de nível 1 e 2, na ordem, para sumário e navegação.

```ts
documentOutline(doc): { index: number; text: string; level: 1 | 2; }[]
```

## evaluateArithmetic (function)

Avalia aritmética simples (+ − * / parênteses) sem `eval`.

```ts
evaluateArithmetic(expression): number | null
```

## excelNumberFormat (function)

Código de formato numérico do Excel equivalente (o Excel aplica o separador do idioma de quem abre).

```ts
excelNumberFormat(format, digits?): string | undefined
```

## fileSlug (function)

Nome de arquivo seguro a partir do título: "Revisão Q3 · 2026" → "revisao-q3-2026".

```ts
fileSlug(title): string
```

## formatCell (function)

Texto da célula como aparece na tela (pt-BR, mesmas funções de lib/format).

```ts
formatCell(cell): string
```

## isNumericFormat (function)

```ts
isNumericFormat(f): boolean
```

## LaidCell (type)

```ts
type LaidCell = { value: CellValue; formula?: string; role: "title" | "description" | "header" | "data" | "total"; format: CellFormat; digits?: number; span?: boolean; note?: string; }
```

## layoutSheet (function)

Posiciona a aba numa grade com endereços do Excel: título, descrição, cabeçalho, dados e total.

```ts
layoutSheet(sheet): SheetLayout
```

## OfficeDocument (type)

```ts
type OfficeDocument = { title: string; kicker?: string; subtitle?: string; author?: string; date?: Date | string; cover?: boolean; toc?: boolean; header?: string; footer?: string; blocks: DocBlock[]; }
```

## SheetLayout (type)

```ts
type SheetLayout = { rows: (LaidCell | null)[][]; colCount: number; headerRow: number; firstDataRow: number; lastDataRow: number; totalRow: number | null; widths: number[]; }
```

## toCellDate (function)

"2026-10-01" é dia local (mesma regra de lib/format).

```ts
toCellDate(v): Date | null
```

## Workbook (type)

```ts
type Workbook = { title: string; author?: string; sheets: WorkbookSheet[]; }
```

## WorkbookAggregate (type)

```ts
type WorkbookAggregate = "sum" | "average" | "count" | "min" | "max"
```

## WorkbookColumn (type)

```ts
type WorkbookColumn = { key: string; header: string; format?: CellFormat; digits?: number; width?: number; formula?: string; total?: WorkbookAggregate | { formula: string }; note?: string; }
```

## WorkbookRow (type)

```ts
type WorkbookRow = Record<string, CellValue>
```

## WorkbookSheet (type)

```ts
type WorkbookSheet = { name: string; title?: string; description?: string; columns: WorkbookColumn[]; rows: WorkbookRow[]; totals?: boolean | string; freezeColumns?: number; }
```
