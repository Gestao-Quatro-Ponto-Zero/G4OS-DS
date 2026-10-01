"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import type { Column } from "./collections";
import { Checkbox } from "./forms";

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
 * asc → desc → sem ordenação. Texto compara em pt-BR (acentos, caixa).
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
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y, "pt-BR", { sensitivity: "base" }) * mul;
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
      className={cn("-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-soft hover:text-ink", active && "text-ink", align === "right" && "flex-row-reverse")}
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
  };
}

/** Coluna de checkbox pronta para DataTable. */
export function selectionColumn<T>(sel: ReturnType<typeof useSelection>, rowKey: (row: T) => string, rowLabel: (row: T) => string): Column<T> {
  return {
    key: "__select",
    header: <Checkbox hideLabel label="Selecionar todos" checked={sel.all} indeterminate={sel.some} onCheckedChange={sel.toggleAll} />,
    cell: (row) => <Checkbox hideLabel label={`Selecionar ${rowLabel(row)}`} checked={sel.has(rowKey(row))} onCheckedChange={() => sel.toggle(rowKey(row))} />,
    action: true,
    mobileHidden: true,
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

/** Pagina uma lista no cliente. Volta para a página 1 quando a lista muda de tamanho. */
export function usePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  return {
    page: current,
    pageCount,
    pageSize,
    total: rows.length,
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    setPage,
  };
}

/** "1–20 de 312" + anterior/próxima + páginas próximas. */
export function Pagination({
  page,
  pageCount,
  onPage,
  total,
  pageSize,
  className,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  total?: number;
  pageSize?: number;
  className?: string;
}) {
  if (pageCount <= 1 && total == null) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12.5px] tabular-nums disabled:opacity-40";
  return (
    <nav aria-label="Paginação" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {total != null && pageSize ? (
        <span className="text-[12px] tabular-nums text-muted">
          {total === 0 ? "0" : `${formatNumber((page - 1) * pageSize + 1)}–${formatNumber(Math.min(total, page * pageSize))}`} de {formatNumber(total)}
        </span>
      ) : (
        <span />
      )}
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={cn(btn, "text-muted hover:bg-soft hover:text-ink")} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1 text-[12px] text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPage(p)}
                className={cn(btn, p === page ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line" : "text-muted hover:bg-soft hover:text-ink")}
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
