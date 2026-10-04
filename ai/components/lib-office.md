# lib-office

Arquivo: `src/lib/office.ts` · importe de `@g4ai/ds`.

Modelo de planilha, documento e apresentação do DS.

## cellAddress (function)

Endereço A1 a partir de linha/coluna 0-based.

```ts
cellAddress(row, col): string
```

## CellFormat (type)

Como a coluna é formatada na tela e no Excel.

```ts
type CellFormat = "text" | "integer" | "number" | "currency" | "percent" | "date" | "time" | "datetime"
```

## CellStyle (type)

Aparência que vem do arquivo.

```ts
type CellStyle = { fill?: string; color?: string; italic?: boolean; underline?: boolean; strike?: boolean; align?: "left" | "center" | "right"; wrap?: boolean; negativeRed?: boolean; }
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

## DocAlign (type)

```ts
type DocAlign = "left" | "center" | "right" | "justify"
```

## DocBlock (type)

```ts
type DocBlock = | { type: "heading"; text: string; level?: 1 | 2 | 3; align?: DocAlign } | { type: "paragraph"; text: DocText; align?: DocAlign } | { type: "list"; items: DocText[]; ordered?: boolean; levels?: number[]; markers?: string[]; } | { type: "table"; columns: DocTableColumn[]; rows: CellValue[][]; caption?: string; totalRow?: boolean; headerRows?: number; spans?: Record<string, [number, number]>; fil…
```

## DocRun (type)

Trecho de texto com ênfase.

```ts
type DocRun = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; href?: string; color?: string; highlight?: string }
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

## FileWorkbook (type)

```ts
type FileWorkbook = { title: string; sheets: GridSheet[] }
```

## formatCell (function)

Texto da célula como aparece na tela (pt-BR, mesmas funções de lib/format).

```ts
formatCell(cell): string
```

## GridSheet (type)

Aba já posicionada (o que vem de um .xlsx).

```ts
type GridSheet = { name: string; layout: SheetLayout; freezeColumns?: number; truncated?: boolean; charts?: OfficeChart[]; }
```

## isNumericFormat (function)

```ts
isNumericFormat(f): boolean
```

## LaidCell (type)

```ts
type LaidCell = { value: CellValue; formula?: string; role: "title" | "description" | "header" | "data" | "total"; format: CellFormat; digits?: number; span?: boolean; note?: string; bold?: boolean; style?: CellStyle; merge?: { rows: number; cols: number }; }
```

## layoutSheet (function)

Posiciona a aba numa grade com endereços do Excel: título, descrição, cabeçalho, dados e total.

```ts
layoutSheet(sheet): SheetLayout
```

## OfficeChart (type)

Gráfico do Office reduzido ao que importa para desenhar com os gráficos do DS: tipo, categorias e séries com os valores salvos no arquivo.

```ts
type OfficeChart = { title?: string; kind: "bar" | "line" | "area" | "pie" | "doughnut" | "scatter" | "combo" | "unsupported"; horizontal?: boolean; stacked?: boolean; percent?: boolean; categories: string[]; series: { name: string; values: (number | null)[]; kind?: "bar" | "line" | "area"; x?: (number | null)[] }[]; format?: CellFormat; digits?: number; sourceType?: string; }
```

## OfficeDocument (type)

```ts
type OfficeDocument = { title: string; kicker?: string; subtitle?: string; author?: string; date?: Date | string; cover?: boolean; toc?: boolean; header?: string; footer?: string; blocks: DocBlock[]; }
```

## Presentation (type)

```ts
type Presentation = { title: string; aspect: number; width: number; slides: PresentationSlide[] }
```

## PresentationParagraph (type)

```ts
type PresentationParagraph = { runs: PresentationRun[]; align?: "left" | "center" | "right" | "justify"; level?: number; bullet?: string; size?: number; color?: string; font?: string; lineHeight?: number; lineHeightPt?: number; spaceBefore?: number; spaceAfter?: number; }
```

## PresentationRun (type)

```ts
type PresentationRun = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string; size?: number; font?: string }
```

## PresentationShape (type)

```ts
type PresentationShape = { kind: "text" | "image" | "table" | "line" | "chart"; x: number; y: number; w: number; h: number; rotation?: number; flipH?: boolean; flipV?: boolean; fill?: string; line?: string; lineWidth?: number; lineDash?: boolean; arrowStart?: boolean; arrowEnd?: boolean; elbow?: boolean; geometry?: string; opacity?: number; paragraphs?: PresentationParagraph[]; anchor?: "top" | "middle" | "bottom"; ins…
```

## PresentationSlide (type)

```ts
type PresentationSlide = { title: string; background?: string; shapes: PresentationShape[]; notes?: string }
```

## SheetLayout (type)

```ts
type SheetLayout = { rows: (LaidCell | null)[][]; colCount: number; headerRow: number; firstDataRow: number; lastDataRow: number; totalRow: number | null; widths: number[]; covered?: Map<string, [number, number]>; hiddenRows?: Set<number>; hiddenCols?: Set<number>; }
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
