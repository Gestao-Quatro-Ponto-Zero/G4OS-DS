"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronRight, Columns3, Download, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { parseDateInput } from "../lib/dates";
import { formatDate, formatNumber } from "../lib/format";
import { DensityControl, type Density } from "./collections";
import { BulkBar, SortHeader, type SortState } from "./data";
import { Skeleton } from "./feedback";
import { Highlight } from "./filters";
import { Checkbox } from "./forms";
import { ActionMenu, type MenuAction } from "./navigation";
import { ContextMenu, Menu, type MenuEntry } from "./overlays-extra";
import { popupClass } from "./overlays";
import { Button, Empty } from "./primitives";
import { Spinner } from "./states";

/*
 * DataGrid: a tabela "de trabalho" do DS. Use quando a lista É a tela
 * (contatos, pedidos, faturas, candidatos) e a pessoa age sobre as linhas.
 * Para listas curtas, leitura ou prévia em card, DataTable (collections.tsx)
 * continua sendo o padrão. Regras em docs/padroes/tabelas-e-colecoes.md.
 *
 *   rolagem interna ...... height/maxHeight; cabeçalho e rodapé fixos; colunas fixas (pinned)
 *   seleção .............. checkbox, shift+clique, "selecionar todos os N", BulkBar
 *   ações de linha ....... ícones no hover + ⋯ + clique direito (mesmas ações)
 *   colunas .............. ordenar, mostrar/ocultar, redimensionar, persistir (storageKey)
 *   linhas ............... expandir, agrupar com subtotal, totais no rodapé, tom de atenção
 *   edição inline ........ texto, número, moeda, lista, data
 *   teclado .............. ↑↓ Home End · Enter abre · Espaço/X seleciona · E edita · Esc limpa
 *   desempenho ........... virtualização automática acima de 200 itens
 *   extras ............... CSV (pt-BR), copiar célula, destaque da busca, cards no celular
 */

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type GridValue = string | number | Date | null | undefined;

export type GridEditor =
  | { type: "text" | "number" | "currency" | "date" }
  | { type: "select"; options: { value: string; label: string }[] };

export type GridColumn<T> = {
  key: string;
  header: string;
  /** Explica o que a coluna mede (tooltip no cabeçalho). */
  tooltip?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: "left" | "right";
  align?: "left" | "right" | "center";
  /** Valor bruto: ordena, exporta, copia e destaca a busca. */
  value?: (row: T) => GridValue;
  /** Conteúdo da célula. Padrão: `value` formatado com destaque da busca. */
  cell?: (row: T, ctx: { query: string }) => ReactNode;
  /** Padrão: true quando há `value`. */
  sortable?: boolean;
  /** false = sempre visível (não aparece no menu Colunas). */
  hideable?: boolean;
  defaultHidden?: boolean;
  resizable?: boolean;
  editable?: GridEditor;
  /** Célula do rodapé fixo (total, média). Recebe todas as linhas. */
  footer?: (rows: T[]) => ReactNode;
  /** Subtotal no cabeçalho de grupo. */
  aggregate?: (rows: T[]) => ReactNode;
  /** Papel no card do celular (mobile="cards"). */
  mobile?: "title" | "subtitle" | "meta" | "hidden";
  className?: string;
};

export type GridRowAction<T> = {
  label: string;
  icon?: ReactNode;
  onSelect: (row: T) => void;
  /** Aparece como ícone na linha (máx. 3). Todas aparecem no ⋯ e no clique direito. */
  inline?: boolean;
  tone?: "neutral" | "danger";
  separator?: boolean;
  disabled?: boolean;
};

export type DataGridProps<T> = {
  rows: T[];
  columns: GridColumn<T>[];
  rowKey: (row: T) => string;
  /** Nome da linha para leitores de tela e ações ("Abrir Grupo Aurora"). */
  rowLabel?: (row: T) => string;
  /** Rótulo da grade inteira. */
  label: string;
  /** Altura fixa: a grade rola por dentro. */
  height?: number | string;
  maxHeight?: number | string;
  density?: Density;
  onDensityChange?: (d: Density) => void;
  /** Mostra o alternador de densidade na barra. */
  showDensity?: boolean;
  zebra?: boolean;
  /** Salva larguras e colunas visíveis no localStorage com esta chave. */
  storageKey?: string;
  toolbar?: ReactNode;
  /** Mostra o menu "Colunas". Padrão: true. */
  columnMenu?: boolean;
  /** Habilita "Exportar CSV" com este nome de arquivo (sem extensão). */
  exportFileName?: string;
  /** Busca atual: destacada nas células padrão. */
  query?: string;

  // ordenação
  sort?: SortState;
  defaultSort?: SortState;
  onSortChange?: (sort: SortState) => void;
  /** true = as linhas já chegam ordenadas (servidor); a grade só mostra o estado. */
  manualSort?: boolean;

  // seleção
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (keys: Set<string>) => void;
  /** Total que existe além da página (habilita "Selecionar todos os N"). */
  totalCount?: number;
  onSelectAllMatching?: () => void;
  bulkActions?: (rows: T[], ctx: { allMatching: boolean; count: number; clear: () => void }) => ReactNode;
  noun?: string;
  nounPlural?: string;
  /** Concordância do substantivo ("f": "Todas as 312 contas selecionadas"). */
  gender?: "m" | "f";

  // linhas
  onRowOpen?: (row: T) => void;
  rowActions?: (row: T) => GridRowAction<T>[];
  rowTone?: (row: T) => "warn" | "bad" | "ok" | undefined;
  renderExpanded?: (row: T) => ReactNode;
  groupBy?: (row: T) => string;
  groupLabel?: (group: string, rows: T[]) => ReactNode;
  groupOrder?: string[];
  defaultCollapsedGroups?: string[];
  footerLabel?: string;
  onEdit?: (row: T, key: string, value: GridValue) => void;

  // estados
  loading?: boolean;
  error?: { message: string; onRetry?: () => void };
  empty?: ReactNode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  loadMode?: "button" | "infinite";
  /** Abaixo do rodapé (Pagination, contagem). */
  footerSlot?: ReactNode;

  // desempenho e celular
  virtualize?: boolean;
  mobile?: "scroll" | "cards";
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const ROW_H: Record<Density, number> = { comfortable: 44, compact: 36 };
const GROUP_H = 38;
const EXPANDED_ESTIMATE = 160;
const SELECT_W = 44;
const EXPAND_W = 36;

function formatValue(v: GridValue) {
  if (v == null || v === "") return "—";
  if (v instanceof Date) return formatDate(v);
  if (typeof v === "number") return formatNumber(v, 2);
  return String(v);
}

function compare(a: GridValue, b: GridValue) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b, "pt-BR", { sensitivity: "base", numeric: true });
  return Number(a) - Number(b);
}

function csvCell(v: GridValue) {
  let s: string;
  if (v == null) s = "";
  else if (v instanceof Date) s = formatDate(v);
  else if (typeof v === "number") s = String(v).replace(".", ",");
  else s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV pt-BR (separador ";", decimal ",", BOM para o Excel abrir acentos). */
export function gridToCsv<T>(rows: T[], columns: GridColumn<T>[]) {
  const cols = columns.filter((c) => c.value);
  const lines = [cols.map((c) => csvCell(c.header)).join(";"), ...rows.map((r) => cols.map((c) => csvCell(c.value!(r))).join(";"))];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Prefs = { widths: Record<string, number>; hidden: string[] | null };

function usePrefs(storageKey?: string) {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    if (!storageKey || typeof window === "undefined") return { widths: {}, hidden: null };
    try {
      const raw = localStorage.getItem(`ds-grid:${storageKey}`);
      return raw ? { widths: {}, hidden: null, ...JSON.parse(raw) } : { widths: {}, hidden: null };
    } catch {
      return { widths: {}, hidden: null };
    }
  });
  const update = useCallback(
    (fn: (p: Prefs) => Prefs) =>
      setPrefs((p) => {
        const next = fn(p);
        if (storageKey) {
          try {
            localStorage.setItem(`ds-grid:${storageKey}`, JSON.stringify(next));
          } catch {
            /* sem storage: segue só na memória */
          }
        }
        return next;
      }),
    [storageKey],
  );
  return [prefs, update] as const;
}

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/* ------------------------------------------------------------------ */
/* Editor de célula                                                    */
/* ------------------------------------------------------------------ */

function CellEditor({ editor, initial, label, onCommit, onCancel }: { editor: GridEditor; initial: GridValue; label: string; onCommit: (v: GridValue) => void; onCancel: () => void }) {
  const toText = () => {
    if (initial == null) return "";
    if (editor.type === "currency" && typeof initial === "number") return initial.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (editor.type === "date") return typeof initial === "string" ? formatDate(initial) : initial instanceof Date ? formatDate(initial) : "";
    return String(initial);
  };
  const [text, setText] = useState(toText);
  const done = useRef(false);
  const parse = (): GridValue | undefined => {
    const t = text.trim();
    if (editor.type === "number" || editor.type === "currency") {
      if (!t) return null;
      const n = Number(t.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    }
    if (editor.type === "date") return t ? parseDateInput(t) : null;
    return t;
  };
  const commit = () => {
    if (done.current) return;
    const v = parse();
    done.current = true;
    if (v === undefined) onCancel();
    else onCommit(v);
  };
  if (editor.type === "select") {
    return (
      <BaseSelect.Root
        items={editor.options}
        value={initial == null ? null : String(initial)}
        defaultOpen
        modal={false}
        onValueChange={(v) => onCommit((v as string | null) ?? null)}
        onOpenChange={(open) => !open && setTimeout(() => !done.current && onCancel(), 0)}
      >
        <BaseSelect.Trigger aria-label={label} className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-muted bg-surface px-2 text-left text-[13px] outline-none">
          <BaseSelect.Value className="truncate" />
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} collisionPadding={12} className="z-[100] outline-none">
            <BaseSelect.Popup className={cn(popupClass, "min-w-[max(160px,var(--anchor-width))] p-1.5")}>
              <BaseSelect.List className="max-h-[260px] overflow-y-auto outline-none">
                {editor.options.map((o) => (
                  <BaseSelect.Item key={o.value} value={o.value} className="flex cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] outline-none data-highlighted:bg-soft">
                    <BaseSelect.ItemText className="flex-1 truncate">{o.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator>
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    );
  }
  const preview = editor.type === "date" && text.trim() ? parseDateInput(text.trim()) : null;
  return (
    <div className="relative">
      <input
        autoFocus
        aria-label={label}
        value={text}
        inputMode={editor.type === "number" || editor.type === "currency" ? "decimal" : undefined}
        placeholder={editor.type === "date" ? "dd/mm/aaaa ou “sexta”" : undefined}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            done.current = true;
            onCancel();
          }
        }}
        onBlur={commit}
        className={cn(
          "h-8 w-full rounded-md border border-muted bg-surface px-2 text-[13px] text-ink shadow-[0_0_0_3px_color-mix(in_oklab,var(--ds-ink)_6%,transparent)] outline-none",
          (editor.type === "number" || editor.type === "currency") && "text-right tabular-nums",
        )}
      />
      {editor.type === "date" && text.trim() && (
        <span className={cn("absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md border border-line bg-popover px-2 py-1 text-[11.5px] shadow-popup", preview ? "text-ink-soft" : "text-rose")}>
          {preview ? formatDate(preview) : "Data não reconhecida"}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataGrid                                                            */
/* ------------------------------------------------------------------ */

type Slot<T> =
  | { kind: "select" | "expand" | "filler"; key: string; width: number; pin?: "left" | "right" }
  | { kind: "data"; key: string; width: number; pin?: "left" | "right"; col: GridColumn<T> }
  | { kind: "actions"; key: string; width: number; pin: "right" };

type Item<T> = { kind: "row"; row: T; key: string; index: number } | { kind: "group"; key: string; label: string; rows: T[] } | { kind: "expanded"; row: T; key: string };

export function DataGrid<T>(props: DataGridProps<T>) {
  const {
    rows,
    columns,
    rowKey,
    rowLabel = rowKey,
    label,
    height,
    maxHeight,
    zebra,
    storageKey,
    toolbar,
    columnMenu = true,
    exportFileName,
    query = "",
    manualSort,
    selectable,
    totalCount,
    bulkActions,
    noun = "item",
    nounPlural,
    gender = "m",
    onRowOpen,
    rowActions,
    rowTone,
    renderExpanded,
    groupBy,
    groupLabel,
    groupOrder,
    footerLabel = "Total",
    onEdit,
    loading,
    error,
    empty,
    hasMore,
    loadingMore,
    onLoadMore,
    loadMode = "button",
    footerSlot,
    mobile = "scroll",
    className,
  } = props;

  /* preferências ----------------------------------------------------- */
  const [prefs, setPrefs] = usePrefs(storageKey);
  const hidden = prefs.hidden ?? columns.filter((c) => c.defaultHidden).map((c) => c.key);
  const visibleCols = columns.filter((c) => !hidden.includes(c.key));
  const widthOf = (c: GridColumn<T>) => prefs.widths[c.key] ?? c.width ?? 160;

  /* densidade -------------------------------------------------------- */
  const [densityState, setDensityState] = useState<Density>(props.density ?? "comfortable");
  const density = props.density ?? densityState;
  const setDensity = (d: Density) => {
    props.onDensityChange?.(d);
    if (props.density === undefined) setDensityState(d);
  };
  const rowH = ROW_H[density];

  /* ordenação -------------------------------------------------------- */
  const [sortState, setSortState] = useState<SortState>(props.defaultSort ?? null);
  const sort = props.sort !== undefined ? props.sort : sortState;
  const setSort = (s: SortState) => {
    props.onSortChange?.(s);
    if (props.sort === undefined) setSortState(s);
  };
  const toggleSort = (key: string) => setSort(!sort || sort.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null);
  const sortedRows = useMemo(() => {
    if (manualSort || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.value) return rows;
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(col.value!(a), col.value!(b)) * mul);
  }, [rows, sort, manualSort, columns]);

  /* seleção ---------------------------------------------------------- */
  const [selState, setSelState] = useState<Set<string>>(new Set());
  const selected = props.selected ?? selState;
  const [allMatching, setAllMatching] = useState(false);
  const setSelected = (s: Set<string>) => {
    setAllMatching(false);
    props.onSelectedChange?.(s);
    if (!props.selected) setSelState(s);
  };
  const lastClicked = useRef<number | null>(null);
  const shiftDown = useRef(false);
  const visibleKeys = useMemo(() => sortedRows.map(rowKey), [sortedRows, rowKey]);
  const selectedOnPage = visibleKeys.filter((k) => selected.has(k)).length;
  const allOnPage = visibleKeys.length > 0 && selectedOnPage === visibleKeys.length;
  const toggleRow = (index: number, key: string) => {
    const next = new Set(selected);
    if (shiftDown.current && lastClicked.current != null) {
      const [a, b] = [lastClicked.current, index].sort((x, y) => x - y);
      const on = !selected.has(key);
      for (let i = a; i <= b; i++) {
        if (on) next.add(visibleKeys[i]);
        else next.delete(visibleKeys[i]);
      }
    } else if (next.has(key)) next.delete(key);
    else next.add(key);
    lastClicked.current = index;
    shiftDown.current = false;
    setSelected(next);
  };
  const toggleAll = () => {
    const next = new Set(selected);
    if (allOnPage) visibleKeys.forEach((k) => next.delete(k));
    else visibleKeys.forEach((k) => next.add(k));
    setSelected(next);
  };
  const clearSelection = () => setSelected(new Set());
  const selectedRows = useMemo(() => sortedRows.filter((r) => selected.has(rowKey(r))), [sortedRows, selected, rowKey]);

  /* expandir e grupos ------------------------------------------------ */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (key: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(props.defaultCollapsedGroups ?? []));

  const items = useMemo<Item<T>[]>(() => {
    const out: Item<T>[] = [];
    const pushRow = (row: T, index: number) => {
      const key = rowKey(row);
      out.push({ kind: "row", row, key, index });
      if (renderExpanded && expanded.has(key)) out.push({ kind: "expanded", row, key: `${key}__exp` });
    };
    if (!groupBy) {
      sortedRows.forEach(pushRow);
      return out;
    }
    const groups = new Map<string, { row: T; index: number }[]>();
    sortedRows.forEach((row, index) => {
      const g = groupBy(row);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push({ row, index });
    });
    const order = groupOrder ? [...groupOrder.filter((g) => groups.has(g)), ...[...groups.keys()].filter((g) => !groupOrder.includes(g))] : [...groups.keys()];
    order.forEach((g) => {
      const list = groups.get(g)!;
      out.push({ kind: "group", key: `__group_${g}`, label: g, rows: list.map((x) => x.row) });
      if (!collapsed.has(g)) list.forEach((x) => pushRow(x.row, x.index));
    });
    return out;
  }, [sortedRows, groupBy, groupOrder, collapsed, expanded, renderExpanded, rowKey]);

  const [scrollRef, size] = useSize<HTMLDivElement>();

  /* colunas e fixação ------------------------------------------------ */
  const inlineCount = (row?: T) => (rowActions && row ? rowActions(row).filter((a) => a.inline).slice(0, 3).length : 0);
  const maxInline = useMemo(() => (rowActions ? Math.max(0, ...sortedRows.slice(0, 50).map((r) => inlineCount(r))) : 0), [rowActions, sortedRows]); // eslint-disable-line react-hooks/exhaustive-deps
  const slots = useMemo<Slot<T>[]>(() => {
    const left: Slot<T>[] = [];
    const mid: Slot<T>[] = [];
    const right: Slot<T>[] = [];
    if (selectable) left.push({ kind: "select", key: "__select", width: SELECT_W, pin: "left" });
    if (renderExpanded) left.push({ kind: "expand", key: "__expand", width: EXPAND_W, pin: "left" });
    visibleCols.forEach((col) => {
      // No celular, coluna fixa ocupa no máximo 42 % da largura (sobra área para rolar).
      const w = col.pinned && size.w > 0 && size.w < 640 ? Math.min(widthOf(col), Math.round(size.w * 0.42)) : widthOf(col);
      const s: Slot<T> = { kind: "data", key: col.key, width: w, pin: col.pinned, col };
      if (col.pinned === "left") left.push(s);
      else if (col.pinned === "right") right.push(s);
      else mid.push(s);
    });
    const tail: Slot<T>[] = [...right];
    if (rowActions) tail.push({ kind: "actions", key: "__actions", width: 16 + maxInline * 32 + 32, pin: "right" });
    // Sem nada fixo à esquerda, as colunas extras não são fixas.
    return [...left, ...mid, { kind: "filler", key: "__filler", width: 0 }, ...tail];
  }, [selectable, renderExpanded, visibleCols, rowActions, maxInline, prefs.widths, size.w]); // eslint-disable-line react-hooks/exhaustive-deps

  const offsets = useMemo(() => {
    const map: Record<string, CSSProperties> = {};
    let l = 0;
    slots.forEach((s) => {
      if (s.pin === "left") {
        map[s.key] = { position: "sticky", left: l };
        l += s.width;
      }
    });
    let r = 0;
    [...slots].reverse().forEach((s) => {
      if (s.pin === "right") {
        map[s.key] = { position: "sticky", right: r };
        r += s.width;
      }
    });
    return map;
  }, [slots]);
  const lastLeft = [...slots].reverse().find((s) => s.pin === "left")?.key;
  const firstRight = slots.find((s) => s.pin === "right")?.key;
  const dataWidth = slots.reduce((sum, s) => sum + s.width, 0);
  const firstData = slots.find((s) => s.kind === "data") as Extract<Slot<T>, { kind: "data" }> | undefined;
  const editableCols = slots.filter((s): s is Extract<Slot<T>, { kind: "data" }> => s.kind === "data" && !!s.col.editable);

  /* rolagem, tamanho e virtualização -------------------------------- */
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const raf = useRef(0);
  const onScroll = () => {
    const el = scrollRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    root.toggleAttribute("data-scrolled-y", el.scrollTop > 0);
    root.toggleAttribute("data-scrolled-x", el.scrollLeft > 0);
    root.toggleAttribute("data-scroll-end-x", el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setScrollTop(el.scrollTop));
  };
  useEffect(() => {
    const el = scrollRef.current;
    const root = rootRef.current;
    if (el && root) root.toggleAttribute("data-scroll-end-x", el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, [size.w, dataWidth, scrollRef]);

  const measured = useRef<Record<string, number>>({});
  const [, force] = useState(0);
  const heightOf = (it: Item<T>) => (it.kind === "row" ? rowH : it.kind === "group" ? GROUP_H : measured.current[it.key] ?? EXPANDED_ESTIMATE);
  const virtual = (props.virtualize ?? items.length > 200) && !loading;
  const HEADER_H = 40;
  const tops = useMemo(() => {
    const t: number[] = [];
    let acc = 0;
    items.forEach((it) => {
      t.push(acc);
      acc += heightOf(it);
    });
    t.push(acc);
    return t;
  }, [items, rowH, measured.current]); // eslint-disable-line react-hooks/exhaustive-deps
  let start = 0;
  let end = items.length;
  if (virtual) {
    const viewTop = Math.max(0, scrollTop - HEADER_H) - rowH * 8;
    const viewBottom = scrollTop + (size.h || 600) + rowH * 8;
    let lo = 0;
    let hi = items.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tops[mid + 1] <= viewTop) lo = mid + 1;
      else hi = mid;
    }
    start = lo;
    end = start;
    while (end < items.length && tops[end] < viewBottom) end++;
  }
  const visibleItems = items.slice(start, end);

  /* foco por teclado ------------------------------------------------- */
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rowItems = useMemo(() => items.filter((i): i is Extract<Item<T>, { kind: "row" }> => i.kind === "row"), [items]);
  const pendingFocus = useRef<string | null>(null);
  const moveFocus = (key: string) => {
    setFocusKey(key);
    pendingFocus.current = key;
    const idx = items.findIndex((i) => i.key === key);
    const el = scrollRef.current;
    if (el && idx >= 0) {
      const top = tops[idx] + HEADER_H;
      const bottom = top + heightOf(items[idx]);
      const footerH = hasFooter ? rowH : 0;
      if (top < el.scrollTop + HEADER_H) el.scrollTop = top - HEADER_H;
      else if (bottom > el.scrollTop + el.clientHeight - footerH) el.scrollTop = bottom - el.clientHeight + footerH;
    }
  };
  useEffect(() => {
    if (!pendingFocus.current) return;
    const tr = rootRef.current?.querySelector<HTMLElement>(`tr[data-key="${CSS.escape(pendingFocus.current)}"]`);
    if (tr) {
      tr.focus({ preventScroll: true });
      pendingFocus.current = null;
    }
  });

  /* edição ------------------------------------------------------------ */
  const [editing, setEditing] = useState<{ row: string; col: string } | null>(null);

  /* menu de contexto ------------------------------------------------ */
  const [ctx, setCtx] = useState<{ row: T; col?: GridColumn<T> } | null>(null);
  const ctxItems: MenuEntry[] = useMemo(() => {
    if (!ctx) return [{ type: "label", label: "Clique com o botão direito numa linha" }];
    const entries: MenuEntry[] = [];
    if (onRowOpen) entries.push({ label: "Abrir", onSelect: () => onRowOpen(ctx.row) });
    rowActions?.(ctx.row).forEach((a) => {
      if (a.separator) entries.push({ type: "separator" });
      entries.push({ label: a.label, icon: a.icon, tone: a.tone, disabled: a.disabled, onSelect: () => a.onSelect(ctx.row) });
    });
    if (entries.length) entries.push({ type: "separator" });
    if (ctx.col?.value) {
      const v = ctx.col.value(ctx.row);
      entries.push({ label: `Copiar ${ctx.col.header.toLowerCase()}`, onSelect: () => navigator.clipboard?.writeText(formatValue(v)) });
    }
    if (selectable) {
      const key = rowKey(ctx.row);
      entries.push({
        label: selected.has(key) ? "Tirar da seleção" : "Selecionar",
        shortcut: "X",
        onSelect: () => {
          const n = new Set(selected);
          if (n.has(key)) n.delete(key);
          else n.add(key);
          setSelected(n);
        },
      });
    }
    if (ctx.col?.editable && onEdit) entries.push({ label: `Editar ${ctx.col.header.toLowerCase()}`, shortcut: "E", onSelect: () => setEditing({ row: rowKey(ctx.row), col: ctx.col!.key }) });
    return entries;
  }, [ctx, rowActions, onRowOpen, selectable, selected, onEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* carregar mais (infinito) ---------------------------------------- */
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (loadMode !== "infinite" || !hasMore || !onLoadMore || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !loadingMore && onLoadMore(), { root: scrollRef.current, rootMargin: "200px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [loadMode, hasMore, onLoadMore, loadingMore, scrollRef]);

  /* redimensionar ---------------------------------------------------- */
  const startResize = (col: GridColumn<T>, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const w0 = widthOf(col);
    const min = col.minWidth ?? 72;
    const max = col.maxWidth ?? 640;
    const move = (ev: PointerEvent) => {
      const w = Math.max(min, Math.min(max, w0 + ev.clientX - x0));
      setPrefs((p) => ({ ...p, widths: { ...p.widths, [col.key]: w } }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const autosize = (col: GridColumn<T>) => {
    const cells = rootRef.current?.querySelectorAll<HTMLElement>(`[data-col="${CSS.escape(col.key)}"] [data-cell-content]`);
    let w = 0;
    cells?.forEach((c) => (w = Math.max(w, c.scrollWidth)));
    const next = Math.max(col.minWidth ?? 72, Math.min(col.maxWidth ?? 640, w + 28));
    setPrefs((p) => ({ ...p, widths: { ...p.widths, [col.key]: next } }));
  };

  /* celular ---------------------------------------------------------- */
  const isMobile = useMedia("(max-width: 639.98px)");
  const cards = mobile === "cards" && isMobile;

  const hasFooter = slots.some((s) => s.kind === "data" && s.col.footer);
  const showToolbar = !!toolbar || columnMenu || !!exportFileName || props.showDensity;
  const allCount = totalCount ?? rows.length;
  const selCount = allMatching ? allCount : selected.size;

  /* ----------------------------------------------------------------- */

  const cellStyle = (s: Slot<T>, extra?: CSSProperties): CSSProperties => ({ ...offsets[s.key], ...extra });
  const pinAttrs = (s: Slot<T>) => ({
    "data-pin": s.pin,
    "data-pin-edge": s.key === lastLeft ? "left" : s.key === firstRight ? "right" : undefined,
  });

  const renderCell = (s: Slot<T>, row: T, key: string, index: number) => {
    if (s.kind === "select")
      return (
        <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-cell text-center" onPointerDownCapture={(e) => (shiftDown.current = e.shiftKey)}>
          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox hideLabel label={`Selecionar ${rowLabel(row)}`} checked={selected.has(key)} onCheckedChange={() => toggleRow(index, key)} />
          </div>
        </td>
      );
    if (s.kind === "expand") {
      const open = expanded.has(key);
      return (
        <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-cell text-center">
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Recolher ${rowLabel(row)}` : `Expandir ${rowLabel(row)}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(key);
            }}
            className="inline-grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-90")} />
          </button>
        </td>
      );
    }
    if (s.kind === "filler") return <td key={s.key} className="dg-cell" aria-hidden />;
    if (s.kind === "actions") {
      const actions = rowActions!(row);
      const inline = actions.filter((a) => a.inline).slice(0, 3);
      const menu: MenuAction[] = actions.map((a) => ({ label: a.label, icon: a.icon, onSelect: () => a.onSelect(row), tone: a.tone, separator: a.separator, disabled: a.disabled }));
      return (
        <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-cell dg-actions" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-0.5">
            {inline.map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.label}
                aria-label={`${a.label}: ${rowLabel(row)}`}
                disabled={a.disabled}
                onClick={() => a.onSelect(row)}
                className={cn("dg-quick inline-grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-soft hover:text-ink disabled:opacity-40 [&_svg]:h-4 [&_svg]:w-4", a.tone === "danger" && "hover:text-rose")}
              >
                {a.icon}
              </button>
            ))}
            <ActionMenu actions={menu} label={`Ações: ${rowLabel(row)}`} />
          </div>
        </td>
      );
    }
    const col = (s as Extract<Slot<T>, { kind: "data" }>).col;
    const isEditing = editing?.row === key && editing.col === col.key;
    const content = col.cell ? col.cell(row, { query }) : col.value ? <Highlight text={formatValue(col.value(row))} query={query} /> : null;
    return (
      <td
        key={s.key}
        {...pinAttrs(s)}
        data-col={col.key}
        style={cellStyle(s)}
        className={cn("dg-cell", col.align === "right" && "text-right", col.align === "center" && "text-center", col.editable && onEdit && "dg-editable", col.className)}
        onClick={
          col.editable && onEdit && !isEditing
            ? (e) => {
                e.stopPropagation();
                setEditing({ row: key, col: col.key });
              }
            : undefined
        }
      >
        {isEditing ? (
          <CellEditor
            editor={col.editable!}
            initial={col.value?.(row)}
            label={`${col.header}: ${rowLabel(row)}`}
            onCommit={(v) => {
              setEditing(null);
              if (v !== col.value?.(row)) onEdit?.(row, col.key, v);
              moveFocus(key);
            }}
            onCancel={() => {
              setEditing(null);
              moveFocus(key);
            }}
          />
        ) : (
          <div data-cell-content className={cn("truncate", s.key === firstData?.key && "font-medium text-ink")}>
            {content}
          </div>
        )}
      </td>
    );
  };

  const onRowKey = (e: ReactKeyboardEvent<HTMLTableRowElement>, row: T, key: string, index: number) => {
    if (e.target !== e.currentTarget) return;
    const pos = rowItems.findIndex((r) => r.key === key);
    const go = (i: number) => {
      const t = rowItems[Math.max(0, Math.min(rowItems.length - 1, i))];
      if (t) moveFocus(t.key);
    };
    switch (e.key) {
      case "ArrowDown":
        go(pos + 1);
        break;
      case "ArrowUp":
        go(pos - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(rowItems.length - 1);
        break;
      case "PageDown":
        go(pos + Math.max(1, Math.floor((size.h || 400) / rowH) - 1));
        break;
      case "PageUp":
        go(pos - Math.max(1, Math.floor((size.h || 400) / rowH) - 1));
        break;
      case "Enter":
        if (onRowOpen) onRowOpen(row);
        else if (renderExpanded) toggleExpanded(key);
        break;
      case "ArrowRight":
        if (renderExpanded && !expanded.has(key)) toggleExpanded(key);
        else return;
        break;
      case "ArrowLeft":
        if (renderExpanded && expanded.has(key)) toggleExpanded(key);
        else return;
        break;
      case " ":
      case "x":
      case "X":
        if (!selectable) return;
        shiftDown.current = e.shiftKey;
        toggleRow(index, key);
        break;
      case "e":
      case "E":
        if (!editableCols.length || !onEdit) return;
        setEditing({ row: key, col: editableCols[0].col.key });
        break;
      case "Escape":
        if (selected.size) clearSelection();
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const colEntries: MenuEntry[] = [
    { type: "label", label: "Colunas visíveis" },
    ...columns
      .filter((c) => c.hideable !== false)
      .map(
        (c): MenuEntry => ({
          type: "checkbox",
          label: c.header,
          checked: !hidden.includes(c.key),
          onCheckedChange: (on) =>
            setPrefs((p) => {
              const h = new Set(p.hidden ?? columns.filter((x) => x.defaultHidden).map((x) => x.key));
              if (on) h.delete(c.key);
              else if (columns.length - h.size > 1) h.add(c.key);
              return { ...p, hidden: [...h] };
            }),
        }),
      ),
    { type: "separator" },
    { label: "Restaurar colunas e larguras", icon: <RotateCcw />, onSelect: () => setPrefs(() => ({ widths: {}, hidden: null })) },
  ];

  const exportRows = () => downloadCsv(exportFileName ?? "exportacao", gridToCsv(selected.size ? selectedRows : sortedRows, visibleCols));

  /* estados de corpo -------------------------------------------------- */
  const colCount = slots.length;
  const bodyState = loading ? (
    Array.from({ length: 6 }, (_, i) => (
      <tr key={`sk${i}`} className="dg-row" style={{ height: rowH }}>
        {slots.map((s) => (
          <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-cell">
            {s.kind === "data" ? <Skeleton className={cn("h-3", i % 2 ? "w-3/5" : "w-4/5")} /> : s.kind === "select" ? <Skeleton className="mx-auto h-4 w-4" /> : null}
          </td>
        ))}
      </tr>
    ))
  ) : error ? (
    <tr>
      <td colSpan={colCount} className="p-0">
        <div className="sticky left-0 flex flex-col items-center gap-3 px-6 py-10 text-center" style={{ width: size.w || undefined }} role="alert">
          <p className="m-0 text-[14px] font-medium">Não foi possível carregar</p>
          <p className="m-0 max-w-sm text-[13px] text-muted">{error.message}</p>
          {error.onRetry && (
            <Button size="sm" variant="ghost" onClick={error.onRetry}>
              Tentar de novo
            </Button>
          )}
        </div>
      </td>
    </tr>
  ) : !rows.length ? (
    <tr>
      <td colSpan={colCount} className="p-0">
        <div className="sticky left-0 p-4" style={{ width: size.w || undefined }}>
          {empty ?? <Empty framed={false} title={`Nenhum ${noun} por aqui`} hint="Ajuste a busca ou os filtros." />}
        </div>
      </td>
    </tr>
  ) : null;

  /* cards no celular -------------------------------------------------- */
  const cardView = cards && !loading && !error && rows.length > 0 && (
    <ul className="m-0 flex list-none flex-col gap-2 p-2">
      {sortedRows.map((row, index) => {
        const key = rowKey(row);
        const dataCols = visibleCols.filter((c) => c.mobile !== "hidden");
        const title = dataCols.find((c) => c.mobile === "title") ?? dataCols[0];
        const subtitle = dataCols.find((c) => c.mobile === "subtitle");
        const metas = dataCols.filter((c) => c !== title && c !== subtitle).slice(0, 4);
        const tone = rowTone?.(row);
        const actions = rowActions?.(row) ?? [];
        const render = (c: GridColumn<T>) => (c.cell ? c.cell(row, { query }) : c.value ? <Highlight text={formatValue(c.value(row))} query={query} /> : null);
        return (
          <li
            key={key}
            data-key={key}
            data-tone={tone}
            data-selected={selectable && selected.has(key) ? "" : undefined}
            className={cn("dg-card rounded-xl border border-line bg-surface p-3", onRowOpen && "linked-card cursor-pointer")}
          >
            <div className="flex items-start gap-2.5">
              {selectable && (
                <span className="relative z-[1] pt-0.5" onPointerDownCapture={(e) => (shiftDown.current = e.shiftKey)}>
                  <Checkbox hideLabel label={`Selecionar ${rowLabel(row)}`} checked={selected.has(key)} onCheckedChange={() => toggleRow(index, key)} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {/* Abrir o registro: botão esticado sobre o card (linked-card); checkbox e ações ficam por cima. */}
                {onRowOpen ? (
                  <button type="button" onClick={() => onRowOpen(row)} className="card-primary-link block w-full truncate rounded-[inherit] text-left text-[14px] font-medium">
                    {title && render(title)}
                  </button>
                ) : (
                  <div className="truncate text-[14px] font-medium">{title && render(title)}</div>
                )}
                {subtitle && <div className="mt-0.5 truncate text-[12.5px] text-muted">{render(subtitle)}</div>}
              </div>
              {actions.length > 0 && (
                <ActionMenu label={`Ações: ${rowLabel(row)}`} actions={actions.map((a) => ({ label: a.label, icon: a.icon, onSelect: () => a.onSelect(row), tone: a.tone, separator: a.separator, disabled: a.disabled }))} />
              )}
            </div>
            {metas.length > 0 && (
              <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {metas.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[11px] text-muted">{c.header}</dt>
                    <dd className={cn("m-0 truncate text-[13px]", c.align === "right" && "tabular-nums")}>{render(c)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {actions.some((a) => a.inline) && (
              <div className="mt-2.5 flex gap-1.5 border-t border-line pt-2.5">
                {actions
                  .filter((a) => a.inline)
                  .slice(0, 3)
                  .map((a) => (
                    <button key={a.label} type="button" onClick={() => a.onSelect(row)} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[12.5px] text-ink-soft ring-1 ring-line hover:bg-soft [&_svg]:h-3.5 [&_svg]:w-3.5">
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  /* ----------------------------------------------------------------- */

  const tableWidth = Math.max(dataWidth, size.w);

  return (
    <div
      ref={rootRef}
      className={cn("data-grid relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface", maxHeight != null && "data-grid-capped", className)}
      data-density={density}
      data-zebra={zebra ? "" : undefined}
      // maxHeight vale do tablet para cima; no celular a página rola (sem rolagem aninhada).
      style={{ height, ["--dg-max-h" as string]: maxHeight == null ? undefined : typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
    >
      {showToolbar && (
        <div className="flex flex-wrap items-start gap-2 border-b border-line px-3 py-2">
          {/* Bloco: FilterBar/TableSearch ocupam a largura; controles da grade ficam no fim da linha. */}
          <div className="min-w-0 flex-1 basis-[280px]">{toolbar}</div>
          <div className="ml-auto flex min-h-10 items-center gap-1.5">
            {props.showDensity && <DensityControl density={density} onChange={setDensity} />}
            {exportFileName && (
              <button type="button" onClick={exportRows} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft ring-1 ring-line hover:bg-soft" title={selected.size ? "Exportar selecionados" : "Exportar o que está na tela"}>
                <Download className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">{selected.size ? `Exportar ${selected.size}` : "Exportar"}</span>
              </button>
            )}
            {columnMenu && !cards && (
              <Menu label="Colunas" align="end" triggerClassName="h-8 px-2.5 text-[12.5px] font-normal text-ink-soft" trigger={<><Columns3 aria-hidden /> <span className="hidden sm:inline">Colunas</span></>} items={colEntries} />
            )}
          </div>
        </div>
      )}

      {selectable && allOnPage && totalCount != null && totalCount > rows.length && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-line bg-accent-soft/50 px-3 py-2 text-[12.5px] text-ink-soft" role="status">
          {allMatching ? (
            <>
              {gender === "f" ? "Todas as" : "Todos os"} <strong className="tabular-nums">{formatNumber(totalCount)}</strong> {nounPlural ?? `${noun}s`} estão {gender === "f" ? "selecionadas" : "selecionados"}.
              <button type="button" onClick={clearSelection} className="font-medium text-blue hover:underline">
                Limpar seleção
              </button>
            </>
          ) : (
            <>
              {gender === "f" ? "As" : "Os"} {formatNumber(rows.length)} desta página estão {gender === "f" ? "selecionadas" : "selecionados"}.
              <button
                type="button"
                onClick={() => {
                  setAllMatching(true);
                  props.onSelectAllMatching?.();
                }}
                className="font-medium text-blue hover:underline"
              >
                Selecionar {gender === "f" ? "todas as" : "todos os"} {formatNumber(totalCount)}
              </button>
            </>
          )}
        </div>
      )}

      <ContextMenu items={ctxItems} className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onContextMenuCapture={(e) => {
            const tr = (e.target as HTMLElement).closest<HTMLElement>("tr[data-key],li[data-key]");
            const td = (e.target as HTMLElement).closest<HTMLElement>("td[data-col]");
            const it = tr ? rowItems.find((r) => r.key === tr.dataset.key) : undefined;
            // Fora de uma linha (cabeçalho, rodapé, vazio): menu nativo do navegador.
            if (!it) {
              e.stopPropagation();
              return;
            }
            setCtx({ row: it.row, col: columns.find((c) => c.key === td?.dataset.col) });
          }}
          className="dg-scroll relative min-h-0 flex-1 overflow-auto overscroll-contain"
        >
          {cards ? (
            cardView || <table className="w-full"><tbody>{bodyState}</tbody></table>
          ) : (
            <table
              role="grid"
              aria-label={label}
              aria-rowcount={items.length + 1}
              aria-multiselectable={selectable || undefined}
              className="dg-table border-separate border-spacing-0 text-left text-[13.5px]"
              style={{ width: tableWidth, tableLayout: "fixed" }}
            >
              <colgroup>
                {slots.map((s) => (
                  <col key={s.key} style={{ width: s.kind === "filler" ? Math.max(0, tableWidth - dataWidth) : s.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {slots.map((s) => {
                    if (s.kind === "select")
                      return (
                        <th key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-th text-center">
                          <span className="flex items-center justify-center">
                            <Checkbox hideLabel label="Selecionar todos desta página" checked={allOnPage} indeterminate={selectedOnPage > 0 && !allOnPage} onCheckedChange={toggleAll} />
                          </span>
                        </th>
                      );
                    if (s.kind === "expand" || s.kind === "filler") return <th key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-th" aria-hidden={s.kind === "filler" || undefined} />;
                    if (s.kind === "actions")
                      return (
                        <th key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className="dg-th">
                          <span className="sr-only">Ações</span>
                        </th>
                      );
                    const col = (s as Extract<Slot<T>, { kind: "data" }>).col;
                    const sortable = col.sortable ?? !!col.value;
                    const active = sort?.key === col.key;
                    return (
                      <th
                        key={s.key}
                        {...pinAttrs(s)}
                        scope="col"
                        aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                        style={cellStyle(s)}
                        title={col.tooltip}
                        className={cn("dg-th group/th", col.align === "right" && "text-right", col.align === "center" && "text-center")}
                      >
                        <div className={cn("flex min-w-0 items-center gap-1", col.align === "right" && "justify-end", col.align === "center" && "justify-center")}>
                          {sortable ? (
                            <SortHeader label={col.header} active={active} dir={active ? sort!.dir : undefined} onToggle={() => toggleSort(col.key)} align={col.align === "right" ? "right" : "left"} />
                          ) : (
                            <span className="truncate">{col.header}</span>
                          )}
                          {col.tooltip && (
                            <span aria-hidden className="inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-muted ring-1 ring-line-strong">
                              ?
                            </span>
                          )}
                        </div>
                        {col.resizable !== false && (
                          <span
                            role="separator"
                            aria-orientation="vertical"
                            aria-label={`Redimensionar ${col.header}`}
                            title="Arraste para ajustar · clique duplo para caber o conteúdo"
                            onPointerDown={(e) => startResize(col, e)}
                            onDoubleClick={() => autosize(col)}
                            className="dg-resize absolute inset-y-0 -right-1 z-[1] w-2 cursor-col-resize"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {bodyState ??
                  (() => {
                    const out: ReactNode[] = [];
                    if (virtual && tops[start] > 0) out.push(<tr key="__top" aria-hidden style={{ height: tops[start] }} />);
                    visibleItems.forEach((it) => {
                      if (it.kind === "group") {
                        const g = it.label;
                        const open = !collapsed.has(g);
                        const lead = slots.findIndex((s) => s.kind === "data") + 1;
                        out.push(
                          <tr key={it.key} className="dg-group" style={{ height: GROUP_H }}>
                            <td colSpan={Math.max(1, lead)} className="dg-cell" style={{ position: "sticky", left: 0 }}>
                              <button
                                type="button"
                                aria-expanded={open}
                                onClick={() =>
                                  setCollapsed((c) => {
                                    const n = new Set(c);
                                    if (n.has(g)) n.delete(g);
                                    else n.add(g);
                                    return n;
                                  })
                                }
                                className="inline-flex max-w-full items-center gap-1.5 rounded-md py-0.5 pr-2 text-left text-[12.5px] font-semibold text-ink hover:text-ink-soft"
                              >
                                <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 text-muted transition-transform", open && "rotate-90")} />
                                <span className="truncate">{groupLabel ? groupLabel(g, it.rows) : g}</span>
                                <span className="shrink-0 text-[11.5px] font-normal tabular-nums text-muted">{it.rows.length}</span>
                              </button>
                            </td>
                            {slots.slice(Math.max(1, lead)).map((s) => (
                              <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className={cn("dg-cell", s.kind === "data" && s.col.align === "right" && "text-right")}>
                                {s.kind === "data" && s.col.aggregate ? <span className="text-[12.5px] font-medium tabular-nums">{s.col.aggregate(it.rows)}</span> : null}
                              </td>
                            ))}
                          </tr>,
                        );
                        return;
                      }
                      if (it.kind === "expanded") {
                        out.push(
                          <tr key={it.key} className="dg-expanded">
                            <td colSpan={colCount} className="p-0">
                              <div
                                ref={(el) => {
                                  if (!el) return;
                                  const h = el.getBoundingClientRect().height;
                                  if (Math.abs((measured.current[it.key] ?? 0) - h) > 1) {
                                    measured.current[it.key] = h;
                                    if (virtual) force((n) => n + 1);
                                  }
                                }}
                                className="sticky left-0 border-b border-line bg-soft/60 px-4 py-3"
                                style={{ width: size.w || undefined }}
                              >
                                {renderExpanded!(it.row)}
                              </div>
                            </td>
                          </tr>,
                        );
                        return;
                      }
                      const { row, key, index } = it;
                      const sel = selectable && selected.has(key);
                      out.push(
                        <tr
                          key={key}
                          data-key={key}
                          data-index={index}
                          data-row=""
                          data-even={zebra && index % 2 === 1 ? "" : undefined}
                          data-tone={rowTone?.(row)}
                          aria-rowindex={index + 2}
                          aria-selected={selectable ? sel : undefined}
                          aria-label={onRowOpen ? `Abrir ${rowLabel(row)}` : undefined}
                          tabIndex={(focusKey ?? rowItems[0]?.key) === key ? 0 : -1}
                          onFocus={() => setFocusKey(key)}
                          onKeyDown={(e) => onRowKey(e, row, key, index)}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("button,a,input,[role=checkbox],[role=combobox],[data-no-open]")) return;
                            if (e.shiftKey && selectable) {
                              shiftDown.current = true;
                              toggleRow(index, key);
                              return;
                            }
                            onRowOpen?.(row);
                          }}
                          className={cn("dg-row group", onRowOpen && "cursor-pointer")}
                          style={{ height: rowH }}
                        >
                          {slots.map((s) => renderCell(s, row, key, index))}
                        </tr>,
                      );
                    });
                    if (virtual && tops[items.length] - tops[end] > 0) out.push(<tr key="__bottom" aria-hidden style={{ height: tops[items.length] - tops[end] }} />);
                    return out;
                  })()}
              </tbody>
              {hasFooter && !loading && !error && rows.length > 0 && (
                <tfoot>
                  <tr>
                    {slots.map((s) => (
                      <td key={s.key} {...pinAttrs(s)} style={cellStyle(s)} className={cn("dg-tf", s.kind === "data" && s.col.align === "right" && "text-right")}>
                        {s.kind === "data" ? (s.col.footer ? s.col.footer(sortedRows) : s.key === firstData?.key ? <span className="text-muted">{footerLabel}</span> : null) : null}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          )}
          {hasMore && onLoadMore && !loading && (
            <div className="sticky left-0 flex justify-center py-3" style={{ width: size.w || undefined }}>
              {loadMode === "infinite" ? (
                <div ref={sentinel} className="flex h-8 items-center gap-2 text-[12.5px] text-muted">
                  {loadingMore && (
                    <>
                      <Spinner size="sm" /> Carregando mais…
                    </>
                  )}
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? <Spinner size="xs" /> : null}
                  {loadingMore ? "Carregando…" : "Carregar mais"}
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Barra de massa: flutua sobre a área rolável, acima do rodapé de totais. */}
        {selectable && bulkActions && selCount > 0 && (
          <div onContextMenu={(e) => e.stopPropagation()} className="pointer-events-none absolute inset-x-0 z-[6] flex justify-center px-3 [&>*]:pointer-events-auto [&>*]:mt-0" style={{ bottom: hasFooter && !cards ? 48 : 10 }}>
            <BulkBar count={selCount} noun={noun} nounPlural={nounPlural} gender={gender} onClear={clearSelection}>
              {bulkActions(allMatching ? sortedRows : selectedRows, { allMatching, count: selCount, clear: clearSelection })}
            </BulkBar>
          </div>
        )}
      </ContextMenu>

      {footerSlot && <div className="border-t border-line px-3 py-2">{footerSlot}</div>}
    </div>
  );
}
