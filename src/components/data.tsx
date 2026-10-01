"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import type { Column } from "./collections";
import { Checkbox, NativeSelect } from "./forms";

/*
 * Estado de tabela sem biblioteca: ordenação, seleção, paginação e ações em
 * massa. Compõe com DataTable (collections.tsx). Para 10 mil+ linhas, pagine
 * no servidor e use estes hooks só para a página atual.
 */

/* ------------------------------------------------------------------ */
/* Ordenação                                                           */
/* ------------------------------------------------------------------ */

export type SortDir = "asc" | "desc";
export type SortState = { key: string; dir: SortDir } | null;

/**
 * Ordena `rows` por chaves declaradas em `by`. Clique alterna
 * asc → desc → sem ordenação. Texto compara em pt-BR (acentos, caixa) e
 * números dentro do texto em ordem natural ("Pedido 2" antes de "Pedido 10").
 *
 *   const sort = useSort(deals, { valor: (d) => d.value, nome: (d) => d.name });
 *   header: <SortHeader label="Valor" {...sort.header("valor")} />
 */
export function useSort<T>(rows: T[], by: Record<string, (row: T) => string | number | Date | null | undefined>, initial: SortState = null) {
  const [sort, setSort] = useState<SortState>(initial);
  const sorted = useMemo(() => {
    if (!sort || !by[sort.key]) return rows;
    const get = by[sort.key];
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y, "pt-BR", { sensitivity: "base", numeric: true }) * mul;
      return (Number(x) - Number(y)) * mul;
    });
    // `by` costuma ser literal recriado a cada render; a chave basta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);
  const toggle = (key: string) =>
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  const header = (key: string) => ({ active: sort?.key === key, dir: sort?.key === key ? sort.dir : undefined, onToggle: () => toggle(key) });
  return { rows: sorted, sort, setSort, toggle, header };
}

/** Cabeçalho clicável de coluna ordenável. Seta indica direção. */
export function SortHeader({ label, active, dir, onToggle, align = "left" }: { label: string; active?: boolean; dir?: SortDir; onToggle: () => void; align?: "left" | "right" }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Ordenar por ${label}${active ? (dir === "asc" ? ", crescente" : ", decrescente") : ""}`}
      className={cn("ds-hit -mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-soft hover:text-ink", active && "text-ink", align === "right" && "flex-row-reverse")}
    >
      {label}
      <Icon className={cn("h-3 w-3", !active && "opacity-50")} aria-hidden />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Seleção                                                             */
/* ------------------------------------------------------------------ */

/** Seleção múltipla por id. `visible` = ids da página/filtro atual (para "todos"). */
export function useSelection(visible: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const visibleSelected = visible.filter((id) => selected.has(id)).length;
  const visibleSet = new Set(visible);
  const keepOnly = useCallback(
    (ids: string[]) =>
      setSelected((s) => {
        if (!s.size) return s;
        const keep = new Set(ids);
        const n = new Set([...s].filter((id) => keep.has(id)));
        return n.size === s.size ? s : n;
      }),
    [],
  );
  const all = visible.length > 0 && visibleSelected === visible.length;
  const some = visibleSelected > 0 && !all;
  return {
    selected,
    count: selected.size,
    all,
    some,
    has: (id: string) => selected.has(id),
    toggle: (id: string) =>
      setSelected((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    toggleAll: () =>
      setSelected((s) => {
        const n = new Set(s);
        if (all) visible.forEach((id) => n.delete(id));
        else visible.forEach((id) => n.add(id));
        return n;
      }),
    clear: () => setSelected(new Set()),
    /** Selecionados que estão na lista atual (página/filtro). */
    visibleCount: visibleSelected,
    /** Selecionados escondidos pelo filtro ou em outra página: avise antes de uma ação em massa. */
    hiddenCount: [...selected].filter((id) => !visibleSet.has(id)).length,
    /** Mantém só os ids informados (use ao filtrar, para a ação em massa não pegar o que a pessoa não vê). */
    keepOnly,
    set: (ids: Iterable<string>) => setSelected(new Set(ids)),
  };
}

/** Coluna de checkbox pronta para DataTable. */
export function selectionColumn<T>(sel: ReturnType<typeof useSelection>, rowKey: (row: T) => string, rowLabel: (row: T) => string): Column<T> {
  return {
    key: "__select",
    header: <Checkbox hideLabel label="Selecionar todos" checked={sel.all} indeterminate={sel.some} onCheckedChange={sel.toggleAll} />,
    cell: (row) => <Checkbox hideLabel label={`Selecionar ${rowLabel(row)}`} checked={sel.has(rowKey(row))} onCheckedChange={() => sel.toggle(rowKey(row))} />,
    selection: true,
    className: "w-10",
  };
}

/**
 * Barra de ações em massa: aparece flutuando no rodapé quando há seleção.
 * Ações destrutivas aqui também passam por ConfirmDialog.
 */
export function BulkBar({ count, noun = "item", nounPlural, onClear, children, gender = "m" }: { count: number; noun?: string; nounPlural?: string; onClear: () => void; children: ReactNode; /** Concordância: "f" → "3 contas selecionadas". */ gender?: "m" | "f" }) {
  if (!count) return null;
  return (
    <div role="region" aria-label="Ações em massa" className="enter sticky bottom-4 z-[15] mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-xl bg-ink py-1.5 pl-3 pr-1.5 text-on-ink shadow-toast">
      <span className="text-[12.5px] tabular-nums" aria-live="polite">
        {formatNumber(count)} {count === 1 ? noun : nounPlural ?? `${noun}s`} {gender === "f" ? "selecionada" : "selecionado"}{count === 1 ? "" : "s"}
      </span>
      <span aria-hidden className="mx-1 h-4 w-px bg-on-ink/20" />
      <div className="flex flex-wrap items-center gap-1 [&_button]:inline-flex [&_button]:h-8 [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-lg [&_button]:px-2.5 [&_button]:text-[12.5px] [&_button:hover]:bg-on-ink/10 [&_svg]:h-3.5 [&_svg]:w-3.5">
        {children}
      </div>
      <button type="button" onClick={onClear} aria-label="Limpar seleção" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-ink/70 hover:bg-on-ink/10 hover:text-on-ink">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Paginação                                                           */
/* ------------------------------------------------------------------ */

/**
 * Pagina uma lista no cliente. A página nunca passa da última (excluir a
 * última linha da página 3 leva à página 2) e volta para a 1 quando
 * `resetKey` muda — passe o estado de busca/filtro/ordenação:
 *
 *   const pages = usePagination(filters.rows, 20, { resetKey: filters.state });
 */
export function usePagination<T>(rows: T[], pageSize = 20, options: { resetKey?: unknown } = {}) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const [prevSize, setPrevSize] = useState(pageSize);
  if (prevSize !== pageSize) {
    setPrevSize(pageSize);
    setSize(pageSize);
  }
  const resetSig = useMemo(() => {
    try {
      return JSON.stringify(options.resetKey ?? null);
    } catch {
      return String(options.resetKey);
    }
  }, [options.resetKey]);
  const [prevReset, setPrevReset] = useState(resetSig);
  if (prevReset !== resetSig) {
    setPrevReset(resetSig);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  return {
    page: current,
    pageCount,
    pageSize: size,
    total: rows.length,
    rows: rows.slice((current - 1) * size, current * size),
    setPage,
    /** Troca o tamanho da página mantendo o primeiro item visível. */
    setPageSize: (next: number) => {
      const first = (current - 1) * size;
      setSize(next);
      setPage(Math.floor(first / next) + 1);
    },
  };
}

/** "1–20 de 312" + anterior/próxima + páginas próximas. */
export function Pagination({
  page,
  pageCount,
  onPage,
  total,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  noun,
  nounPlural,
  className,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  total?: number;
  pageSize?: number;
  /** Mostra "Por página" com estas opções (ex.: [20, 50, 100]). Precisa de onPageSizeChange. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** "1–20 de 312 contatos". */
  noun?: string;
  nounPlural?: string;
  className?: string;
}) {
  if (pageCount <= 1 && total == null) return null;
  const sizes = pageSizeOptions && onPageSizeChange && pageSize ? pageSizeOptions : null;
  const unit = noun ? ` ${total === 1 ? noun : nounPlural ?? `${noun}s`}` : "";
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const box = "h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12.5px] tabular-nums disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent";
  const btn = cn("inline-flex", box);
  return (
    <nav aria-label="Paginação" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {total != null && pageSize ? (
          <span className="text-[12px] tabular-nums text-muted" aria-live="polite">
            {total === 0 ? "0" : `${formatNumber((page - 1) * pageSize + 1)}–${formatNumber(Math.min(total, page * pageSize))}`} de {formatNumber(total)}
            {unit}
          </span>
        ) : (
          <span />
        )}
        {sizes && (
          <span className="inline-flex items-center gap-2 text-[12px] text-muted">
            <span aria-hidden>Por página</span>
            <NativeSelect
              label="Itens por página"
              hideLabel
              size="sm"
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange!(Number(v))}
              options={sizes.map((n) => ({ value: String(n), label: String(n) }))}
              className="w-[76px]"
            />
          </span>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <span className="px-2 text-[12px] tabular-nums text-muted sm:hidden">
            {page} de {pageCount}
          </span>
          <button type="button" className={cn(btn, "text-muted hover:bg-soft hover:text-ink")} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} aria-hidden className="hidden px-1 text-[12px] text-muted sm:inline">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? "page" : undefined}
                aria-label={`Página ${p}`}
                onClick={() => onPage(p)}
                className={cn(box, "hidden sm:inline-flex", p === page ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line" : "text-muted hover:bg-soft hover:text-ink")}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={cn(btn, "text-muted hover:bg-soft hover:text-ink")} disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Próxima página">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* PropertyList                                                        */
/* ------------------------------------------------------------------ */

/**
 * Propriedades de um registro (lateral de contato, candidato, pedido).
 * Rótulo à esquerda (ou acima em `stacked`), valor à direita. Valor vazio
 * mostra "—" em muted, nunca some (a ausência também é informação).
 */
export function PropertyList({
  items,
  stacked = false,
  className,
}: {
  items: { label: string; value?: ReactNode; hint?: ReactNode }[];
  stacked?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn(stacked ? "grid gap-4 sm:grid-cols-2" : "divide-y divide-line", className)}>
      {items.map((it) => (
        <div key={it.label} className={cn(stacked ? "min-w-0" : "flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0")}>
          <dt className={cn("text-[12.5px] text-muted", !stacked && "shrink-0")}>{it.label}</dt>
          <dd className={cn("m-0 min-w-0 text-[13px]", stacked ? "mt-1" : "text-right")}>
            {it.value == null || it.value === "" ? <span className="text-muted">—</span> : it.value}
            {it.hint && <div className="mt-0.5 text-[11.5px] text-muted">{it.hint}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
