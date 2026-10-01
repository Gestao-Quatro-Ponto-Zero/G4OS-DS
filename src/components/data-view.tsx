"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePagination, useSelection, useSort, type SortState } from "./data";
import { useFilters, type FilterField, type FilterState } from "./filters";

/*
 * useDataView: busca + filtros + ordenação + paginação + seleção de uma
 * coleção num hook só, na ordem certa (filtra → ordena → pagina) e com o
 * estado na URL. É a receita de "tabela de lista" pronta:
 *
 *   const view = useDataView(deals, {
 *     rowKey: (d) => d.id,
 *     fields,                                   // FilterField[] (FilterBar)
 *     search: (d) => [d.name, d.company],       // busca livre
 *     sortBy: { valor: (d) => d.value, nome: (d) => d.name },
 *     defaultSort: { key: "valor", dir: "desc" },
 *     pageSize: 20,
 *     url: true,                                // ?q=…&f=…&sort=valor.desc&page=2
 *   });
 *
 *   <FilterBar filters={view.filters} search={<TableSearch … />} />
 *   <DataTable rows={view.rows} sort={view.sort} columns={[selectionColumn(view.selection, …), …]}
 *     empty={view.emptyKind === "filtered" ? <EmptyFilterResult filters={view.filters} /> : <Empty … />} />
 *   <Pagination {...view.pagination} />
 *
 * No servidor (10 mil+ linhas): use `useUrlState` + os componentes direto,
 * com `manualSort` no DataGrid e `loading` mantendo as linhas.
 */

type Accessor<T> = (row: T) => string | number | Date | null | undefined;

export function useDataView<T>(
  rows: T[],
  options: {
    rowKey: (row: T) => string;
    fields?: FilterField<T>[];
    search?: (row: T) => (string | number | null | undefined)[];
    sortBy?: Record<string, Accessor<T>>;
    defaultSort?: SortState;
    /** Itens por página. 0 = sem paginação. Padrão: 20. */
    pageSize?: number;
    /** Opções do "Por página" (ex.: [20, 50, 100]). */
    pageSizeOptions?: number[];
    initialFilters?: FilterState;
    /** Pessoa atual (filtro "sou eu"). */
    me?: string;
    now?: Date;
    /** Espelha filtros, ordenação e página na URL. true ou prefixo ("c_") se houver 2 listas na tela. */
    url?: boolean | string;
  },
) {
  const { rowKey, pageSize = 20 } = options;
  const prefix = typeof options.url === "string" ? options.url : "";
  const urlOn = !!options.url;
  const noFields = useMemo<FilterField<T>[]>(() => [], []);

  const filters = useFilters(rows, {
    fields: options.fields ?? noFields,
    search: options.search,
    initial: options.initialFilters,
    me: options.me,
    now: options.now,
    url: options.url,
  });

  const sort = useSort(filters.rows, options.sortBy ?? {}, options.defaultSort ?? null);
  const [urlSort, setUrlSort] = useUrlState<SortState>(`${prefix}sort`, options.defaultSort ?? null, {
    enabled: urlOn,
    serialize: (s) => (s ? `${s.key}.${s.dir}` : ""),
    parse: (raw) => {
      const [key, dir] = raw.split(".");
      return key && (dir === "asc" || dir === "desc") ? { key, dir } : null;
    },
  });
  // URL → estado na primeira leitura; estado → URL depois.
  const syncedSort = useRef(false);
  useEffect(() => {
    if (!urlOn) return;
    if (!syncedSort.current) {
      syncedSort.current = true;
      if (JSON.stringify(urlSort) !== JSON.stringify(sort.sort)) sort.setSort(urlSort);
      return;
    }
    setUrlSort(sort.sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort.sort, urlOn]);

  const filterSig = useMemo(() => JSON.stringify([filters.state, sort.sort]), [filters.state, sort.sort]);
  const pages = usePagination(sort.rows, pageSize > 0 ? pageSize : Math.max(1, sort.rows.length), { resetKey: filterSig });
  const [urlPage, setUrlPage] = useUrlState<number>(`${prefix}page`, 1, {
    enabled: urlOn && pageSize > 0,
    serialize: (n) => (n > 1 ? String(n) : ""),
    parse: (raw) => Math.max(1, Number.parseInt(raw, 10) || 1),
  });
  const syncedPage = useRef(false);
  useEffect(() => {
    if (!urlOn || pageSize <= 0) return;
    if (!syncedPage.current) {
      syncedPage.current = true;
      if (urlPage !== pages.page) pages.setPage(urlPage);
      return;
    }
    setUrlPage(pages.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.page, urlOn, pageSize]);

  const visibleKeys = useMemo(() => pages.rows.map(rowKey), [pages.rows, rowKey]);
  const selection = useSelection(visibleKeys);
  // Filtro novo: a seleção fica só com o que ainda aparece (ação em massa nunca pega o que a pessoa não vê).
  const filteredKeys = useMemo(() => filters.rows.map(rowKey), [filters.rows, rowKey]);
  const keepOnly = selection.keepOnly;
  useEffect(() => {
    keepOnly(filteredKeys);
  }, [filteredKeys, keepOnly]);

  const emptyKind: "none" | "filtered" | null = sort.rows.length > 0 ? null : rows.length === 0 ? "none" : "filtered";

  return {
    filters,
    sort,
    pages,
    selection,
    /** Linhas da página atual (já filtradas e ordenadas). */
    rows: pages.rows,
    /** Todas as linhas que passam no filtro, ordenadas (exportar, "selecionar todos os N"). */
    filteredRows: sort.rows,
    total: rows.length,
    shown: sort.rows.length,
    /** Por que a tabela está vazia: sem dados ("none") ou pelo filtro ("filtered"). */
    emptyKind,
    /** Props prontas para <Pagination {...view.pagination} />. */
    pagination: {
      page: pages.page,
      pageCount: pages.pageCount,
      onPage: pages.setPage,
      total: pages.total,
      pageSize: pages.pageSize,
      pageSizeOptions: options.pageSizeOptions,
      onPageSizeChange: options.pageSizeOptions ? pages.setPageSize : undefined,
    },
    /** Volta ao estado inicial: sem busca e filtros, ordenação padrão, página 1. */
    reset: () => {
      filters.clear();
      sort.setSort(options.defaultSort ?? null);
      selection.clear();
    },
  };
}

export type DataViewApi<T> = ReturnType<typeof useDataView<T>>;

/**
 * Um valor espelhado num parâmetro da URL (location.search), sem recarregar
 * e sem mexer no hash nem nos outros parâmetros. Valor vazio ("") remove o
 * parâmetro. Lê a URL na montagem.
 *
 *   const [tab, setTab] = useUrlState("aba", "abertos");
 *   const [page, setPage] = useUrlState("page", 1, { parse: Number, serialize: String });
 */
export function useUrlState<V>(
  key: string,
  initial: V,
  options: { enabled?: boolean; parse?: (raw: string) => V; serialize?: (value: V) => string } = {},
) {
  const { enabled = true } = options;
  const serializeRef = useRef(options.serialize);
  useEffect(() => {
    serializeRef.current = options.serialize;
  });
  const [value, setValue] = useState<V>(() => {
    if (!enabled || typeof window === "undefined") return initial;
    const raw = new URL(window.location.href).searchParams.get(key);
    if (raw == null) return initial;
    return options.parse ? options.parse(raw) : (raw as unknown as V);
  });
  const set = useCallback(
    (next: V) => {
      setValue(next);
      if (!enabled || typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const raw = serializeRef.current ? serializeRef.current(next) : next == null ? "" : String(next);
      if (raw) url.searchParams.set(key, raw);
      else url.searchParams.delete(key);
      if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
    },
    [enabled, key],
  );
  return [value, set] as const;
}
