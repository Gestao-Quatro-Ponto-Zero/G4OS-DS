# data

Arquivo: `src/components/data.tsx` · importe de `@g4ai/ds`.

Estado de tabela: useSort, SortHeader, useSelection, selectionColumn, BulkBar, usePagination, Pagination, PropertyList.

## BulkBar

Barra de ações em massa: aparece flutuando no rodapé quando há seleção.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `count` * | `number` |  |  |
| `onClear` * | `() => void` |  |  |
| `gender` | `"m" \| "f" \| undefined` | `"m"` |  |
| `noun` | `string \| undefined` | `"item"` |  |
| `nounPlural` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Filhos são `<button type="button">` simples com ícone + verbo: a barra escura já estiliza (`<BulkBar count={sel.count} noun="vaga" gender="f" onClear={sel.clear}><button type="button" onClick={arquivar}><Archive /> Arquivar</button></BulkBar>`). Ação irreversível abre `ConfirmDialog`.

**Evite**

- ✗ `Button` do DS dentro do `BulkBar` (cores de superfície clara sobre a barra escura).

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
const sort = useSort(invoices, { cliente: (r) => r.customer, valor: (r) => r.value }, { key: "valor", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: sort.sort }); // ordenou → volta à página 1
const sel = useSelection(pages.rows.map((r) => r.id));   // "todos" = página visível

const columns: Column<Invoice>[] = [
  selectionColumn(sel, (r) => r.id, (r) => `fatura de ${r.customer}`),
  { key: "customer", header: "Cliente", sortKey: "cliente", primary: true, cell: (r) => r.customer },
  { key: "value", header: "Valor", sortKey: "valor", align: "right", cell: … },
];

<DataTable label="Faturas" rows={pages.rows} columns={columns} rowKey={(r) => r.id} sort={sort}
  rowSelected={(r) => sel.has(r.id)} />
<Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total}
  pageSize={pages.pageSize} pageSizeOptions={[6, 12, 24]} onPageSizeChange={pages.setPageSize} noun="fatura" />
<BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
  <button type="button" onClick={cobrar}><Mail /> Enviar cobrança</button>
</BulkBar>
```

## Pagination

"1–20 de 312" + anterior/próxima + páginas próximas.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onPage` * | `(page: number) => void` |  |  |
| `page` * | `number` |  |  |
| `pageCount` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `noun` | `string \| undefined` |  | "1–20 de 312 contatos". |
| `nounPlural` | `string \| undefined` |  |  |
| `onPageSizeChange` | `((size: number) => void) \| undefined` |  |  |
| `pageSize` | `number \| undefined` |  |  |
| `pageSizeOptions` | `number[] \| undefined` |  | Mostra "Por página" com estas opções (ex.: [20, 50, 100]). |
| `total` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/nav-paginacao`):

```tsx
const p = usePagination(faturas, 20);
<DataTable rows={p.rows} … />
<Pagination page={p.page} pageCount={p.pageCount} onPage={p.setPage} total={p.total} pageSize={p.pageSize}
  pageSizeOptions={[20, 50, 100]} onPageSizeChange={p.setPageSize} noun="fatura" />
```

## PropertyList

Propriedades de um registro (lateral de contato, candidato, pedido).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `{ label: string; value?: ReactNode; hint?: ReactNode; }[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `stacked` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
<PropertyList items={[
  { label: "Valor", value: formatCurrency(460800), hint: "R$ 160 por usuário/mês" },
  { label: "Probabilidade", value: "75 %" },
  { label: "Concorrente", value: undefined },
]} />
<PropertyList stacked items={…} />
```

## selectionColumn (function)

Coluna de checkbox pronta para DataTable.

```ts
selectionColumn(sel, rowKey, rowLabel): Column<T>
```

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
const sort = useSort(invoices, { cliente: (r) => r.customer, valor: (r) => r.value }, { key: "valor", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: sort.sort }); // ordenou → volta à página 1
const sel = useSelection(pages.rows.map((r) => r.id));   // "todos" = página visível

const columns: Column<Invoice>[] = [
  selectionColumn(sel, (r) => r.id, (r) => `fatura de ${r.customer}`),
  { key: "customer", header: "Cliente", sortKey: "cliente", primary: true, cell: (r) => r.customer },
  { key: "value", header: "Valor", sortKey: "valor", align: "right", cell: … },
];

<DataTable label="Faturas" rows={pages.rows} columns={columns} rowKey={(r) => r.id} sort={sort}
  rowSelected={(r) => sel.has(r.id)} />
<Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total}
  pageSize={pages.pageSize} pageSizeOptions={[6, 12, 24]} onPageSizeChange={pages.setPageSize} noun="fatura" />
<BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
  <button type="button" onClick={cobrar}><Mail /> Enviar cobrança</button>
</BulkBar>
```

## SortDir (type)

```ts
type SortDir = "asc" | "desc"
```

## SortHeader

Cabeçalho clicável de coluna ordenável.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onToggle` * | `() => void` |  |  |
| `active` | `boolean \| undefined` |  |  |
| `align` | `"left" \| "right" \| undefined` | `"left"` |  |
| `dir` | `SortDir \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SortState (type)

```ts
type SortState = { key: string; dir: SortDir } | null
```

## usePagination (hook)

Pagina uma lista no cliente.

```ts
usePagination(rows, pageSize?, options?): { page: number; pageCount: number; pageSize: number; total: number; rows: T[]; setPage: Dispatch<SetStateAc…
```

Exemplo (showcase `#/p/nav-paginacao`):

```tsx
const p = usePagination(faturas, 20);
<DataTable rows={p.rows} … />
<Pagination page={p.page} pageCount={p.pageCount} onPage={p.setPage} total={p.total} pageSize={p.pageSize}
  pageSizeOptions={[20, 50, 100]} onPageSizeChange={p.setPageSize} noun="fatura" />
```

## useSelection (hook)

Seleção múltipla por id.

```ts
useSelection(visible): { selected: Set<string>; count: number; all: boolean; some: boolean; has: (id: string) => boolean; toggle: …
```

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
// filtros → ordenação → paginação → seleção (nessa ordem)
const filtered = useMemo(() => rows.filter(matches), [rows, query, facets]);
const sort = useSort(filtered, by, { key: "data", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: [query, facets, sort.sort] }); // filtrou → página 1
const sel = useSelection(pages.rows.map(rowKey));
// ou tudo junto, com URL: const view = useDataView(rows, { rowKey, fields, search, sortBy, pageSize: 20, url: true })
```

## useSort (hook)

Ordena `rows` por chaves declaradas em `by`.

```ts
useSort(rows, by, initial?): { rows: T[]; sort: SortState; setSort: Dispatch<SetStateAction<SortState>>; toggle: (key: string) => void; …
```

Exemplo (showcase `#/p/data-tabela-estado`):

```tsx
// filtros → ordenação → paginação → seleção (nessa ordem)
const filtered = useMemo(() => rows.filter(matches), [rows, query, facets]);
const sort = useSort(filtered, by, { key: "data", dir: "desc" });
const pages = usePagination(sort.rows, 20, { resetKey: [query, facets, sort.sort] }); // filtrou → página 1
const sel = useSelection(pages.rows.map(rowKey));
// ou tudo junto, com URL: const view = useDataView(rows, { rowKey, fields, search, sortBy, pageSize: 20, url: true })
```
