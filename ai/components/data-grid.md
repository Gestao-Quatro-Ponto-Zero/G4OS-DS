# data-grid

Arquivo: `src/components/data-grid.tsx` · importe de `@g4os/ds`.

DataGrid: a tabela "de trabalho" do DS.

## DataGrid

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `GridColumn<T>[]` |  |  |
| `label` * | `string` |  | Rótulo da grade inteira. |
| `rowKey` * | `(row: T) => string` |  |  |
| `rows` * | `T[]` |  |  |
| `bulkActions` | `((rows: T[], ctx: { allMatching: boolean; count: number; clear: () => void; }) => ReactNode) \| undefined` |  |  |
| `className` | `string \| undefined` |  |  |
| `columnMenu` | `boolean \| undefined` |  | Mostra o menu "Colunas". |
| `defaultCollapsedGroups` | `string[] \| undefined` |  |  |
| `defaultSort` | `SortState \| undefined` |  |  |
| `density` | `Density \| undefined` |  |  |
| `empty` | `ReactNode` |  |  |
| `error` | `{ message: string; onRetry?: () => void; } \| undefined` |  |  |
| `exportFileName` | `string \| undefined` |  | Habilita "Exportar CSV" com este nome de arquivo (sem extensão). |
| `footerLabel` | `string \| undefined` |  |  |
| `footerSlot` | `ReactNode` |  | Abaixo do rodapé (Pagination, contagem). |
| `gender` | `"m" \| "f" \| undefined` |  | Concordância do substantivo ("f": "Todas as 312 contas selecionadas"). |
| `groupBy` | `((row: T) => string) \| undefined` |  |  |
| `groupLabel` | `((group: string, rows: T[]) => ReactNode) \| undefined` |  |  |
| `groupOrder` | `string[] \| undefined` |  |  |
| `hasMore` | `boolean \| undefined` |  |  |
| `height` | `string \| number \| undefined` |  | Altura fixa: a grade rola por dentro. |
| `loading` | `boolean \| undefined` |  |  |
| `loadingMore` | `boolean \| undefined` |  |  |
| `loadMode` | `"button" \| "infinite" \| undefined` |  |  |
| `manualSort` | `boolean \| undefined` |  | true = as linhas já chegam ordenadas (servidor); a grade só mostra o estado. |
| `maxHeight` | `string \| number \| undefined` |  |  |
| `mobile` | `"cards" \| "scroll" \| undefined` |  |  |
| `noun` | `string \| undefined` |  |  |
| `nounPlural` | `string \| undefined` |  |  |
| `onDensityChange` | `((d: Density) => void) \| undefined` |  |  |
| `onEdit` | `((row: T, key: string, value: GridValue) => void) \| undefined` |  |  |
| `onLoadMore` | `(() => void) \| undefined` |  |  |
| `onRowOpen` | `((row: T) => void) \| undefined` |  |  |
| `onSelectAllMatching` | `(() => void) \| undefined` |  |  |
| `onSelectedChange` | `((keys: Set<string>) => void) \| undefined` |  |  |
| `onSortChange` | `((sort: SortState) => void) \| undefined` |  |  |
| `query` | `string \| undefined` |  | Busca atual: destacada nas células padrão. |
| `renderExpanded` | `((row: T) => ReactNode) \| undefined` |  |  |
| `rowActions` | `((row: T) => GridRowAction<T>[]) \| undefined` |  |  |
| `rowLabel` | `((row: T) => string) \| undefined` |  | Nome da linha para leitores de tela e ações ("Abrir Grupo Aurora"). |
| `rowTone` | `((row: T) => "warn" \| "bad" \| "ok" \| undefined) \| undefined` |  |  |
| `selectable` | `boolean \| undefined` |  |  |
| `selected` | `Set<string> \| undefined` |  |  |
| `showDensity` | `boolean \| undefined` |  | Mostra o alternador de densidade na barra. |
| `sort` | `SortState \| undefined` |  |  |
| `storageKey` | `string \| undefined` |  | Salva larguras e colunas visíveis no localStorage com esta chave. |
| `toolbar` | `ReactNode` |  |  |
| `totalCount` | `number \| undefined` |  | Total que existe além da página (habilita "Selecionar todos os N"). |
| `virtualize` | `boolean \| undefined` |  |  |
| `zebra` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/grade-teclado-e-desempenho`):

```tsx
<DataGrid rows={dezMil} height={480} selectable onRowOpen={abrir} />   // virtualize é automático (> 200)
```

## DataGridProps (type)

```ts
type DataGridProps = { rows: T[]; columns: GridColumn<T>[]; rowKey: (row: T) => string; rowLabel?: (row: T) => string; label: string; height?: number | string; maxHeight?: number | string; density?: Density; onDensityChange?: (d: Density) => void; showDensity?: boolean; zebra?: boolean; storageKey?: string; toolbar?: ReactNode; columnMenu?: boolean; exportFileName?: string; query?: string; sort?: SortState; default…
```

## downloadCsv (function)

```ts
downloadCsv(fileName, csv): void
```

## GridColumn (type)

```ts
type GridColumn = { key: string; header: string; tooltip?: string; width?: number; minWidth?: number; maxWidth?: number; pinned?: "left" | "right"; align?: "left" | "right" | "center"; value?: (row: T) => GridValue; cell?: (row: T, ctx: { query: string }) => ReactNode; sortable?: boolean; hideable?: boolean; defaultHidden?: boolean; resizable?: boolean; editable?: GridEditor; footer?: (rows: T[]) => ReactNode; a…
```

## GridEditor (type)

```ts
type GridEditor = | { type: "text" | "number" | "currency" | "date" } | { type: "select"; options: { value: string; label: string }[] }
```

## GridRowAction (type)

```ts
type GridRowAction = { label: string; icon?: ReactNode; onSelect: (row: T) => void; inline?: boolean; tone?: "neutral" | "danger"; separator?: boolean; disabled?: boolean; }
```

## gridToCsv (function)

CSV pt-BR (separador ";", decimal ",", BOM para o Excel abrir acentos).

```ts
gridToCsv(rows, columns): string
```

## GridValue (type)

```ts
type GridValue = string | number | Date | null | undefined
```
