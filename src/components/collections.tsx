"use client";

import { AlignJustify, Check, ChevronDown, Columns3, LayoutGrid, List, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { normalize } from "../lib/text";
import { SortHeader, type SortState } from "./data";
import { Skeleton } from "./feedback";
import { SearchInput } from "./forms";
import { SegmentedControl } from "./navigation";
import { Avatar, Button } from "./primitives";

/*
 * Coleções: toolbar, filtros, visualização, densidade, tabela, kanban.
 * Limiares (docs/padroes/densidade.md) — controle só quando há o que controlar:
 *   busca ≥ 12 itens · filtro por atributo ≥ 8 · alternador de visualização ≥ 8
 *   indicadores no topo da lista só em páginas globais.
 */

export const collectionThresholds = { search: 12, facets: 8, viewSwitch: 8 } as const;

/* ------------------------------------------------------------------ */
/* TableToolbar                                                        */
/* ------------------------------------------------------------------ */

/** Busca + filtros + "Limpar" + contagem "X de Y" (aria-live). */
export function TableToolbar({
  query,
  onQuery,
  placeholder = "Filtrar…",
  children,
  shown,
  total,
  dirty,
  onClear,
  noun = "resultado",
  nounPlural,
  hideSearch,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  shown: number;
  total: number;
  dirty?: boolean;
  onClear?: () => void;
  noun?: string;
  nounPlural?: string;
  /** Força esconder a busca (padrão: escondida abaixo de 12 itens). */
  hideSearch?: boolean;
}) {
  const plural = nounPlural ?? `${noun}s`;
  const showSearch = !hideSearch && total >= collectionThresholds.search;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {showSearch && (
        <SearchInput value={query} onChange={onQuery} placeholder={placeholder} className="table-search basis-full sm:min-w-[220px] sm:flex-1" />
      )}
      {children}
      {onClear && dirty && (
        <button type="button" onClick={onClear} className="inline-flex h-10 items-center gap-1 rounded-lg px-2.5 text-[13px] text-muted hover:bg-soft hover:text-ink">
          <X className="h-3.5 w-3.5" />
          Limpar
        </button>
      )}
      <span aria-live="polite" className="ml-auto whitespace-nowrap text-[12px] text-muted">
        {shown === total ? `${total} ${total === 1 ? noun : plural}` : `${shown} de ${total} ${total === 1 ? noun : plural}`}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FacetFilter                                                         */
/* ------------------------------------------------------------------ */

export type FacetOption = {
  /** Identificador (aceita `id` ou `value`, como nos outros controles). */
  id?: string;
  value?: string;
  label: string;
  /** Quantos itens têm este valor (com os outros filtros aplicados). 0 = opção esmaecida. */
  count?: number;
  icon?: ReactNode;
};

/**
 * Filtro multi-seleção por atributo. Gatilho mostra o contador quando ativo.
 * Busca interna (sem acento e caixa) a partir de 8 opções; contagem por
 * opção quando informada. Portal com posição calculada, abre para cima se
 * faltar espaço, fecha em scroll/resize/Esc.
 */
export function FacetFilter({
  label,
  options,
  value,
  onChange,
  align = "right",
}: {
  label: string;
  options: FacetOption[];
  value: string[];
  onChange: (next: string[]) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [position, setPosition] = useState<CSSProperties>({});
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  function openMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(272, window.innerWidth - 40);
    const below = window.innerHeight - rect.bottom - 20;
    const above = rect.top - 20;
    const upwards = below < 240 && above > below;
    const preferredLeft = align === "left" ? rect.left : rect.right - width;
    setPosition({
      width,
      left: Math.max(20, Math.min(preferredLeft, window.innerWidth - width - 20)),
      top: upwards ? undefined : rect.bottom + 8,
      bottom: upwards ? window.innerHeight - rect.top + 8 : undefined,
      maxHeight: Math.max(160, Math.min(360, (upwards ? above : below) - 8)),
    });
    setOpen(true);
  }
  const toggle = (optionId: string) =>
    onChange(value.includes(optionId) ? value.filter((v) => v !== optionId) : [...value, optionId]);
  const keyOf = (o: FacetOption) => o.id ?? o.value ?? o.label;
  const needle = normalize(q.trim());
  const visible = needle ? options.filter((o) => normalize(o.label).includes(needle)) : options;
  const selectedLabels = options.filter((o) => value.includes(keyOf(o))).map((o) => o.label);

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]') ?? []);
          if (!items.length) return;
          event.preventDefault();
          const current = items.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "ArrowDown" ? (current + 1) % items.length : current <= 0 ? items.length - 1 : current - 1;
          items[next]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        aria-label={value.length ? `${label}: ${selectedLabels.join(", ")}` : undefined}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-surface px-3 text-[13px] ring-1",
          value.length ? "font-medium ring-line-strong" : "ring-line hover:bg-soft",
        )}
      >
        {label}
        {value.length > 0 && <span className="rounded-md bg-primary px-1.5 text-[11px] font-medium tabular-nums text-on-primary">{value.length}</span>}
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>
      {open &&
        createPortal(
          <div ref={menu} id={id} role="menu" aria-label={label} style={position} className="fixed z-[100] flex flex-col overflow-hidden rounded-xl bg-popover py-2 shadow-lg ring-1 ring-line">
            {options.length >= collectionThresholds.facets && (
              <div className="px-2 pb-1 pt-1">
                <input
                  aria-label={`Buscar em ${label}`}
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  className="h-7 w-full rounded-md border-0 bg-soft px-2 text-[12.5px] outline-none placeholder:text-muted"
                />
              </div>
            )}
            <div className="min-h-0 overflow-y-auto">
              {visible.map((o) => {
                const key = keyOf(o);
                const on = value.includes(key);
                return (
                  <button
                    key={key}
                    role="menuitemcheckbox"
                    aria-checked={on}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-2.5 text-left text-[13px] leading-relaxed outline-none hover:bg-soft focus-visible:bg-soft",
                      o.count === 0 && !on && "text-muted",
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm ring-1", on ? "bg-primary text-on-primary ring-primary" : "ring-line-strong")}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    {o.icon && <span className="mt-0.5 shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4">{o.icon}</span>}
                    <span className="min-w-0 flex-1">{o.label}</span>
                    {o.count != null && <span className="shrink-0 text-[12px] tabular-nums text-muted">{o.count}</span>}
                  </button>
                );
              })}
              {visible.length === 0 && <div className="px-4 py-2 text-[12.5px] text-muted">Nada neste filtro.</div>}
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setQ("");
                }}
                className="flex w-full items-center gap-2 border-t border-line px-4 py-2 text-left text-[13px] text-muted hover:bg-soft"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DisplayControls                                                     */
/* ------------------------------------------------------------------ */

export type CollectionView = "cards" | "list" | "board";
export type Density = "comfortable" | "compact";

/** Estado de visualização/densidade persistido por área. */
export function useCollectionDisplay(scope: string, initial: CollectionView = "list") {
  const read = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const viewKey = `ds.display.${scope}.view`;
  const densityKey = `ds.display.${scope}.density`;
  const [view, setViewState] = useState<CollectionView>(initial);
  const [density, setDensityState] = useState<Density>("comfortable");
  useEffect(() => {
    setViewState(read(viewKey, initial));
    setDensityState(read(densityKey, "comfortable" as Density));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);
  const setView = (v: CollectionView) => {
    setViewState(v);
    window.localStorage.setItem(viewKey, JSON.stringify(v));
  };
  const setDensity = (d: Density) => {
    setDensityState(d);
    window.localStorage.setItem(densityKey, JSON.stringify(d));
  };
  return { view, setView, density, setDensity };
}

export function DensityControl({ density, onChange }: { density: Density; onChange: (value: Density) => void }) {
  return (
    <button
      type="button"
      aria-label="Visualização compacta"
      aria-pressed={density === "compact"}
      title={density === "compact" ? "Usar espaçamento confortável" : "Reduzir espaçamento"}
      onClick={() => onChange(density === "compact" ? "comfortable" : "compact")}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] transition-colors",
        density === "compact" ? "border-line-strong bg-soft text-ink" : "border-line bg-surface text-muted hover:text-ink",
      )}
    >
      <AlignJustify className="h-3.5 w-3.5" />
      <span className="max-sm:sr-only">Compacto</span>
    </button>
  );
}

/** Cards|Lista (ou Quadro|Lista) + Compacto. No celular, só ícones. */
export function DisplayControls({
  view,
  onView,
  density,
  onDensity,
  board = false,
}: {
  view: CollectionView;
  onView: (value: CollectionView) => void;
  density: Density;
  onDensity: (value: Density) => void;
  board?: boolean;
}) {
  return (
    <div className="display-controls flex flex-wrap items-center gap-2" aria-label="Opções de exibição">
      <SegmentedControl<CollectionView>
        label="Visualização dos registros"
        value={view}
        onChange={onView}
        options={[
          {
            value: board ? "board" : "cards",
            label: board ? "Quadro" : "Cards",
            icon: board ? <Columns3 className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />,
          },
          { value: "list", label: "Lista", icon: <List className="h-3.5 w-3.5" /> },
        ]}
      />
      <DensityControl density={density} onChange={onDensity} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ListPanel                                                           */
/* ------------------------------------------------------------------ */

/**
 * Prévia titulada dentro de um painel com vários assuntos (dashboard/home).
 * Moldura gelo de 3px envolvendo lista branca. `attention` = âmbar para
 * pendências. NÃO use como invólucro de página de lista dedicada.
 * `count` é o total disponível, mesmo que a prévia mostre só alguns.
 */
export function ListPanel({
  title,
  icon,
  count,
  action,
  tone = "neutral",
  children,
}: {
  title: string;
  icon?: ReactNode;
  count?: number;
  action?: ReactNode;
  tone?: "neutral" | "attention";
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border p-[3px]", tone === "attention" ? "border-amber/20 bg-amber-soft/35" : "border-line bg-soft/70")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <h2 className={cn("m-0 flex min-w-0 items-center gap-2 text-[14px] font-medium leading-5", tone === "attention" ? "text-amber" : "text-ink")}>
          {icon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span>}
          {title}
          {count !== undefined && <span className="text-[11px] font-normal tabular-nums text-muted">{count}</span>}
        </h2>
        {action && <div className="ml-auto shrink-0 text-[12px] text-muted [&_a:hover]:text-ink">{action}</div>}
      </div>
      <div className="overflow-hidden rounded-card border border-line bg-surface">{children}</div>
    </section>
  );
}

/** Linha de uma ListPanel: marcador · (contexto / título) · meta · seta. */
export function ListRow({
  href,
  onClick,
  leading,
  kicker,
  title,
  meta,
}: {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  kicker?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
}) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        {kicker && <div className="mb-0.5 truncate text-[11px] text-muted">{kicker}</div>}
        <div className="truncate text-[13.5px] font-medium">{title}</div>
      </div>
      {meta && <div className="shrink-0 text-[12px] tabular-nums text-muted">{meta}</div>}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-soft/40";
  if (href)
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  return <div className={cls.replace(" hover:bg-soft/40", "")}>{body}</div>;
}

/* ------------------------------------------------------------------ */
/* DataTable                                                           */
/* ------------------------------------------------------------------ */

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Célula principal: ocupa a linha inteira e vai para o topo no mobile. */
  primary?: boolean;
  /** Ocupa a linha inteira no mobile. */
  wide?: boolean;
  /** Coluna de ação: separada por linha no mobile. */
  action?: boolean;
  /** Coluna de seleção (selectionColumn): fica ao lado do título no mobile. */
  selection?: boolean;
  mobileHidden?: boolean;
  nowrap?: boolean;
  align?: "left" | "right" | "center";
  /** Chave do `useSort`: o cabeçalho vira botão de ordenação com aria-sort. Exige `header` em texto. */
  sortKey?: string;
  /** Célula do rodapé (total, média). Com qualquer coluna com footer, a tabela ganha <tfoot>. */
  footer?: ReactNode;
  /** Largura fixa da coluna no desktop (px ou CSS). */
  width?: number | string;
  className?: string;
};

/** O que a tabela precisa de um `useSort` (passe o retorno inteiro). */
export type TableSort = { sort: SortState; toggle: (key: string) => void };

/**
 * Tabela padrão: contorno arredondado, cabeçalho gelo 12px, linhas 13.5px
 * com divisória, vira blocos rotulados abaixo de 1024px (o rótulo vem do
 * header quando é string). `view="cards"` mostra a mesma coleção em cards.
 *
 * Estados: `loading` sem linhas mostra esqueleto; com linhas (recarregando)
 * mantém as linhas e mostra uma barra de progresso. `error` mostra o bloco
 * com "Tentar de novo". `empty` quando não há linhas (use EmptyFilterResult
 * quando o vazio é do filtro). `maxHeight` rola por dentro com cabeçalho fixo.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowLabel,
  empty,
  view = "list",
  density,
  label,
  sort,
  loading,
  loadingRows = 5,
  error,
  maxHeight,
  rowSelected,
  rowTone,
  footerLabel,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowLabel?: (row: T) => string;
  empty?: ReactNode;
  view?: "list" | "cards";
  density?: Density;
  /** Nome da tabela para leitores de tela ("Contas a receber"). */
  label?: string;
  /** Retorno do useSort; colunas com `sortKey` ganham cabeçalho ordenável. */
  sort?: TableSort;
  loading?: boolean;
  /** Linhas de esqueleto no primeiro carregamento. */
  loadingRows?: number;
  error?: { message: string; onRetry?: () => void };
  /** Altura máxima: rola por dentro com o cabeçalho fixo. */
  maxHeight?: number | string;
  /** Linha selecionada (seleção em massa ou registro aberto ao lado). */
  rowSelected?: (row: T) => boolean;
  /** Linha que pede atenção (atrasado, bloqueado): faixa à esquerda. */
  rowTone?: (row: T) => "warn" | "bad" | undefined;
  /** Rótulo da primeira célula do rodapé quando ela não tem `footer`. */
  footerLabel?: string;
  className?: string;
}) {
  const refreshing = !!loading && rows.length > 0;
  const firstLoad = !!loading && rows.length === 0;
  const hasFooter = columns.some((c) => c.footer !== undefined) && rows.length > 0 && !firstLoad && !error;
  const selectable = columns.some((c) => c.selection);
  const labelAt = columns.findIndex((c) => !c.selection && c.footer === undefined);
  const alignCls = (a?: Column<T>["align"]) => (a === "right" ? "text-right" : a === "center" ? "text-center" : undefined);
  return (
    <div
      data-density={density}
      data-view={view}
      aria-busy={loading || undefined}
      className={cn("collection-table relative overflow-x-auto rounded-xl border border-line bg-surface", maxHeight != null && view === "list" && "overflow-y-auto", className)}
      style={maxHeight != null && view === "list" ? { maxHeight } : undefined}
    >
      {refreshing && (
        <div role="status" aria-label="Atualizando" className="pointer-events-none sticky left-0 top-0 z-[3] h-0.5 w-full overflow-hidden">
          <span className="ds-progress-indeterminate block h-full w-1/3 bg-primary" />
        </div>
      )}
      <table aria-label={label} className={cn("responsive-table w-full text-left text-[13.5px]", selectable && "selectable-table", maxHeight != null && "sticky-head-table")}>
        <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
          <tr>
            {columns.map((c) => {
              const active = !!sort && !!c.sortKey && sort.sort?.key === c.sortKey;
              const dir = active ? sort!.sort!.dir : undefined;
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={c.sortKey && sort ? (active ? (dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                  style={c.width != null ? { width: c.width } : undefined}
                  className={cn("font-medium", alignCls(c.align))}
                >
                  {c.sortKey && sort && typeof c.header === "string" ? (
                    <SortHeader label={c.header} active={active} dir={dir} onToggle={() => sort.toggle(c.sortKey!)} align={c.align === "right" ? "right" : "left"} />
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={cn(refreshing && "opacity-60 transition-opacity")}>
          {firstLoad &&
            Array.from({ length: loadingRows }, (_, i) => (
              <tr key={`sk${i}`} aria-hidden>
                {columns.map((c) => (
                  <td key={c.key} data-primary={c.primary ? "" : undefined} data-wide={c.wide ? "" : undefined} data-mobile-hidden={c.mobileHidden || c.action ? "" : undefined}>
                    {c.selection ? <Skeleton className="h-4 w-4" /> : c.action ? null : <Skeleton className={cn("h-3.5", c.primary ? "w-3/4" : i % 2 ? "w-1/2" : "w-2/3", c.align === "right" && "ml-auto")} />}
                  </td>
                ))}
              </tr>
            ))}
          {!loading && error && (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <p className="m-0 text-[14px] font-medium text-ink">Não foi possível carregar</p>
                  <p className="m-0 max-w-sm text-[13px] text-muted">{error.message}</p>
                  {error.onRetry && (
                    <Button size="sm" variant="ghost" onClick={error.onRetry}>
                      Tentar de novo
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          )}
          {!loading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="p-4">
                {empty}
              </td>
            </tr>
          )}
          {!firstLoad &&
            !(error && !loading) &&
            rows.map((row) => {
              const selected = rowSelected?.(row);
              const tone = rowTone?.(row);
              return (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                  aria-selected={selected === undefined ? undefined : selected}
                  data-selected={selected ? "" : undefined}
                  data-tone={tone}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={cn("ds-table-row", onRowClick && "cursor-pointer hover:bg-soft/50 focus-visible:bg-soft/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent/50")}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      data-label={typeof c.header === "string" && !c.primary && !c.selection ? c.header : undefined}
                      data-primary={c.primary ? "" : undefined}
                      data-wide={c.wide ? "" : undefined}
                      data-action={c.action && !c.selection ? "" : undefined}
                      data-selection={c.selection ? "" : undefined}
                      data-mobile-hidden={c.mobileHidden ? "" : undefined}
                      data-nowrap={c.nowrap ? "" : undefined}
                      className={cn(alignCls(c.align), c.primary && "font-medium", c.className)}
                      onClick={c.action || c.selection ? (e) => e.stopPropagation() : undefined}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
        {hasFooter && (
          <tfoot className="border-t border-line bg-soft/40 text-[13px] font-medium">
            <tr>
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  data-label={typeof c.header === "string" && c.footer !== undefined ? c.header : undefined}
                  data-primary={i === labelAt ? "" : undefined}
                  data-mobile-hidden={c.footer === undefined && i !== labelAt ? "" : undefined}
                  className={cn("tabular-nums", alignCls(c.align))}
                >
                  {c.footer !== undefined ? c.footer : i === labelAt ? footerLabel ?? "Total" : null}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kanban                                                              */
/* ------------------------------------------------------------------ */

/** Coluna de quadro: cabeçalho com ponto de status + contagem, área de soltar. */
export function KanbanColumn({
  title,
  count,
  dotColor,
  children,
  onDrop,
  dropActive,
  footer,
  meta,
  width = 288,
}: {
  title: string;
  count: number;
  dotColor?: string;
  /** Resumo à direita do cabeçalho (soma de valor, WIP limite). */
  meta?: ReactNode;
  /** Largura mínima; a coluna cresce até 400px quando sobra espaço. */
  width?: number;
  children: ReactNode;
  onDrop?: (event: DragEvent) => void;
  dropActive?: boolean;
  footer?: ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <section
      aria-label={`${title}: ${count}`}
      onDragOver={(e) => {
        if (!onDrop) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        onDrop?.(e);
      }}
      className={cn(
        "flex min-h-0 min-w-0 shrink-0 flex-col rounded-2xl border bg-soft/60 p-2 transition-colors",
        over || dropActive ? "border-line-strong bg-soft" : "border-line",
      )}
      // Mínimo `width`, cresce para ocupar telas largas (até 400px por coluna).
      style={{ flex: `1 0 ${width}px`, maxWidth: Math.max(width, 400) }}
    >
      <header className="flex items-center gap-2 px-2 pb-2 pt-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor ?? "var(--ds-chart-6)" }} />
        <h3 className="m-0 text-[12.5px] font-medium">{title}</h3>
        <span className="text-[11px] tabular-nums text-muted">{count}</span>
        {meta && <span className="ml-auto truncate text-[11.5px] font-medium tabular-nums text-ink-soft">{meta}</span>}
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">{children}</div>
      {footer}
    </section>
  );
}

/**
 * Card de quadro: só título, responsável e prazo. Status muda arrastando ou
 * abrindo o registro, nunca dentro do card. Bloqueado = borda rosa.
 */
export function KanbanCard({
  title,
  flag,
  owner,
  due,
  dueOverdue,
  blocked,
  onOpen,
  draggable = true,
  onDragStart,
  actions,
}: {
  title: string;
  flag?: ReactNode;
  owner?: { name: string; initials: string };
  due?: string;
  dueOverdue?: boolean;
  blocked?: boolean;
  onOpen?: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent) => void;
  actions?: ReactNode;
}) {
  return (
    <div
      draggable={draggable}
      role="button"
      tabIndex={0}
      aria-label={`Abrir: ${title}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      onDragStart={onDragStart}
      className={cn(
        "kanban-task surface-card surface-interactive w-full cursor-grab rounded-tile border bg-surface p-3 text-left hover:border-line-strong active:cursor-grabbing",
        blocked ? "border-rose/30" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[13.5px] font-medium leading-snug">
          {title}
          {flag}
        </div>
        {actions && (
          <span className="-mr-1.5 -mt-1 shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            {actions}
          </span>
        )}
      </div>
      {(owner || due) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {owner ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted">
              <Avatar initials={owner.initials} name={owner.name} size="sm" />
              <span className="truncate">{owner.name.split(" ")[0]}</span>
            </span>
          ) : (
            <span />
          )}
          {due && (
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-md border px-1.5 text-[11px] font-medium tabular-nums",
                dueOverdue ? "border-rose/25 bg-rose-soft/60 text-rose" : "border-line bg-soft/60 text-ink-soft",
              )}
            >
              {due}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Contêiner horizontal do quadro, com rolagem própria. */
export function KanbanBoard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-0 gap-3 overflow-x-auto pb-2 [&>section]:min-h-[240px]", className)}>{children}</div>;
}
