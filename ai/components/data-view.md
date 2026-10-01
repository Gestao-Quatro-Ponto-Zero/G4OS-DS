# data-view

Arquivo: `src/components/data-view.tsx` · importe de `@g4ai/ds`.

useDataView: busca + filtros + ordenação + paginação + seleção de uma coleção num hook só, na ordem certa (filtra → ordena → pagina) e com o estado na URL.

## DataViewApi (type)

```ts
type DataViewApi = ReturnType<typeof useDataView<T>>
```

## useDataView (hook)

```ts
useDataView(rows, options): { filters: { fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>;…
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

## useUrlState (hook)

Um valor espelhado num parâmetro da URL (location.search), sem recarregar e sem mexer no hash nem nos outros parâmetros.

```ts
useUrlState(key, initial, options?): readonly [V, (next: V) => void]
```

Exemplo (showcase `#/p/data-visao-de-dados`):

```tsx
/negocios?q=aurora&f=stage~is~Proposta|Negociação&m=or&sort=valor.desc&page=2

// Peças soltas, quando a paginação e a ordenação são do servidor:
const [sort, setSort] = useUrlState<SortState>("sort", null, {
  serialize: (s) => (s ? `${s.key}.${s.dir}` : ""),
  parse: (raw) => { const [key, dir] = raw.split("."); return key ? { key, dir: dir === "asc" ? "asc" : "desc" } : null; },
});
const [page, setPage] = useUrlState("page", 1, { parse: Number, serialize: (n) => (n > 1 ? String(n) : "") });
const filters = useFilters([], { fields, url: true });            // só o estado; a filtragem é no servidor
const query = serializeFilters(filters.state);                    // mande para a API (mesma semântica de applyFilters)
```
