"use client";

/*
 * Tabela dinâmica (pivô) para análise self-service:
 *   · PivotTable: desenha o resultado de `buildPivot()` (src/lib/pivot.ts) com
 *     cabeçalho e primeira coluna fixos, grupos recolhíveis, subtotais,
 *     total geral e sombreamento opcional por intensidade.
 *   · PivotBuilder: campos (Dimensões / Medidas) e quatro áreas (Filtros,
 *     Colunas, Linhas, Valores). Arrastar entre áreas e reordenar, com prévia
 *     ao passar por cima, OU sem arrastar: o menu de cada campo move, remove e
 *     troca a agregação; o filtro abre uma lista de valores.
 * Navegar ou editar registros é DataGrid; pergunta fixa é gráfico.
 */

import { ArrowLeftRight, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Download, Eraser, GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import {
  PIVOT_TOTAL,
  emptyPivotLayout,
  formatPivotValue,
  buildPivot,
  pivotAggLabel,
  pivotAggsFor,
  pivotCanDrop,
  pivotMove,
  pivotSwap,
  pivotToRows,
  pivotValues,
  type PivotAgg,
  type PivotArea,
  type PivotField,
  type PivotLayout,
  type PivotMoveSource,
  type PivotRecord,
  type PivotResult,
  type PivotRowNode,
} from "../lib/pivot";
import { scaleExtent, onScaleInk, sequentialColor } from "../lib/scale";
import { ScaleLegend } from "./charts-kit";
import { downloadCsv, gridToCsv, type GridColumn, type GridValue } from "./data-grid";
import { notify } from "./feedback";
import { CheckboxGroup } from "./forms";
import { Menu, type MenuEntry } from "./overlays-extra";
import { Popover } from "./overlays";
import { Button, Empty } from "./primitives";

/* ------------------------------------------------------------------ */
/* PivotTable                                                          */
/* ------------------------------------------------------------------ */

export type PivotTableProps = {
  /** Resultado de `buildPivot(records, fields, layout)`. */
  result: PivotResult;
  /** Nome acessível da tabela ("Receita por região e trimestre"). */
  label: string;
  /** Sombreia as células de detalhe pela intensidade, uma escala por valor. */
  heat?: boolean;
  /** Altura máxima do contêiner (rola dentro dele, nunca a página). Padrão 520. */
  maxHeight?: number | string;
  /** Moeda e contagens abreviadas ("R$ 1,2 mi"). */
  compact?: boolean;
  /** Grupos que começam recolhidos (chaves de `PivotRowNode.key`). */
  defaultCollapsed?: string[];
  /** Conteúdo quando não há valores ou registros (padrão: Empty genérico). */
  empty?: ReactNode;
  className?: string;
};

const cellPad = "px-1 py-1";
const headCls = "whitespace-nowrap border-b border-line bg-soft px-3 py-2 text-[12px] font-medium text-muted";

/**
 * Tabela dinâmica: grupos de linha recolhíveis (chevron, ←/→), subtotais em
 * faixa, total geral em negrito, números à direita. Rola dentro do próprio
 * contêiner com cabeçalho e primeira coluna fixos.
 */
export function PivotTable({ result, label, heat = false, maxHeight = 520, compact = false, defaultCollapsed, empty, className }: PivotTableProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(defaultCollapsed));
  const { rowFields, columns, columnHeaders, values } = result;
  const nV = values.length;
  const colLevels = columnHeaders.length;

  // Escala de intensidade por valor: folhas × combinações (sem subtotais nem totais).
  const scales = useMemo(() => {
    if (!heat) return null;
    const leaves: string[] = [];
    const walk = (ns: PivotRowNode[]) => ns.forEach((n) => (n.children.length ? walk(n.children) : leaves.push(n.key)));
    walk(result.rows);
    const cols = columns.length ? columns.map((c) => c.key) : [PIVOT_TOTAL];
    return values.map((_, vi) => scaleExtent(leaves.flatMap((rk) => cols.map((ck) => result.value[rk]?.[ck]?.[vi]))));
  }, [heat, result, columns, values]);
  const leafCol = (ck: string) => (columns.length ? ck !== PIVOT_TOTAL : true);

  if (!nV || !result.recordCount)
    return (
      <div className={className}>
        {empty ?? <Empty title={nV ? "Nenhum registro para mostrar" : "Escolha um valor para calcular"} hint={nV ? "Revise os filtros ou o período." : "Adicione uma medida em Valores."} />}
      </div>
    );

  const groupKeys: string[] = [];
  const collect = (ns: PivotRowNode[]) => ns.forEach((n) => n.children.length && (groupKeys.push(n.key), collect(n.children)));
  collect(result.rows);
  const allCollapsed = groupKeys.length > 0 && groupKeys.every((k) => collapsed.has(k));
  const toggle = (key: string, open?: boolean) =>
    setCollapsed((s) => {
      const next = new Set(s);
      const willOpen = open ?? next.has(key);
      if (willOpen) next.delete(key);
      else next.add(key);
      return next;
    });

  const fmt = (n: number | null | undefined, vi: number) => formatPivotValue(n, values[vi], { compact });
  const colKeys = [...columns.map((c) => c.key), PIVOT_TOTAL];
  const valueCells = (rowKey: string, kind: "leaf" | "group" | "total") =>
    colKeys.flatMap((ck) =>
      values.map((v, vi) => {
        const n = result.value[rowKey]?.[ck]?.[vi] ?? null;
        let style: CSSProperties | undefined;
        if (scales && kind === "leaf" && leafCol(ck) && n != null) {
          const [lo, hi] = scales[vi];
          const t = hi > lo ? (n - lo) / (hi - lo) : 1;
          style = { background: sequentialColor(t), color: onScaleInk(t) };
        }
        const isTotal = ck === PIVOT_TOTAL;
        return (
          <td
            key={`${ck}-${vi}`}
            className={cn(
              cellPad,
              "border-b border-line text-right tabular-nums",
              kind === "group" && "bg-soft font-medium",
              kind === "total" && "bg-surface font-semibold",
              isTotal && columns.length > 0 && vi === 0 && "border-l",
              isTotal && kind === "leaf" && "font-medium",
            )}
          >
            <span className={cn("block whitespace-nowrap rounded-md px-2 py-1", n == null && "text-muted")} style={style}>
              {fmt(n, vi)}
            </span>
          </td>
        );
      }),
    );

  const rowHeader = (n: PivotRowNode) => {
    const isGroup = n.children.length > 0;
    const open = !collapsed.has(n.key);
    const pad = 12 + n.depth * 20;
    return (
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-[1] whitespace-nowrap border-b border-r border-line py-1 pr-4 text-left text-[13px]",
          isGroup ? "bg-soft font-medium text-ink" : "bg-surface font-normal text-ink-soft",
        )}
        style={{ paddingLeft: isGroup ? pad - 6 : pad + (rowFields.length > 1 ? 22 : 0) }}
      >
        {isGroup ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => toggle(n.key)}
            onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
              const want = e.key === "ArrowRight" ? true : e.key === "ArrowLeft" ? false : null;
              if (want === null || want === open) return;
              e.preventDefault();
              toggle(n.key, want);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-left outline-none hover:bg-line/40 focus-visible:ring-2 focus-visible:ring-muted/40"
          >
            <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-muted transition-transform motion-reduce:transition-none", !open && "-rotate-90")} />
            {n.label}
            <span className="sr-only"> (subtotal)</span>
          </button>
        ) : (
          <span className="inline-block py-1">{n.label}</span>
        )}
      </th>
    );
  };

  const bodyRows: ReactNode[] = [];
  const walk = (ns: PivotRowNode[]) =>
    ns.forEach((n) => {
      const isGroup = n.children.length > 0;
      bodyRows.push(
        <tr key={n.key}>
          {rowHeader(n)}
          {valueCells(n.key, isGroup ? "group" : "leaf")}
        </tr>,
      );
      if (isGroup && !collapsed.has(n.key)) walk(n.children);
    });
  walk(result.rows);

  const headerRows = Math.max(1, colLevels + (nV > 1 || colLevels === 0 ? 1 : 0));
  const corner = (
    <th scope="col" rowSpan={headerRows} className={cn(headCls, "sticky left-0 z-[3] border-r text-left align-bottom")}>
      <span className="inline-flex items-center gap-1">
        {groupKeys.length > 0 && (
          <button
            type="button"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groupKeys))}
            aria-label={allCollapsed ? "Expandir todos os grupos" : "Recolher todos os grupos"}
            title={allCollapsed ? "Expandir todos" : "Recolher todos"}
            className="-ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted outline-none hover:bg-line/40 hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
          >
            {allCollapsed ? <ChevronsUpDown aria-hidden className="h-3.5 w-3.5" /> : <ChevronsDownUp aria-hidden className="h-3.5 w-3.5" />}
          </button>
        )}
        <span className="text-ink-soft">{rowFields.length ? rowFields.map((f) => f.label).join(" / ") : "Total"}</span>
      </span>
    </th>
  );
  const valueHeads = (key: string) =>
    values.map((v, vi) => (
      <th key={`${key}-${vi}`} scope="col" className={cn(headCls, "text-right", key === PIVOT_TOTAL && columns.length > 0 && vi === 0 && "border-l")}>
        {v.label}
      </th>
    ));
  const thead: ReactNode[] = [];
  if (colLevels === 0) {
    thead.push(
      <tr key="v">
        {corner}
        {valueHeads(PIVOT_TOTAL)}
      </tr>,
    );
  } else {
    columnHeaders.forEach((level, d) =>
      thead.push(
        <tr key={`l${d}`}>
          {d === 0 && corner}
          {level.map((h) => (
            <th key={h.key} scope={h.span > 1 || nV > 1 ? "colgroup" : "col"} colSpan={h.span * nV} className={cn(headCls, h.span * nV > 1 ? "text-center" : "text-right", "text-ink-soft")}>
              {h.label}
            </th>
          ))}
          {d === 0 && (
            <th scope={nV > 1 ? "colgroup" : "col"} colSpan={nV} rowSpan={colLevels} className={cn(headCls, "border-l text-ink", nV > 1 ? "text-center" : "text-right")}>
              Total
            </th>
          )}
        </tr>,
      ),
    );
    if (nV > 1)
      thead.push(
        <tr key="v">
          {columns.flatMap((c) => valueHeads(c.key))}
          {valueHeads(PIVOT_TOTAL)}
        </tr>,
      );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div role="region" aria-label={label} tabIndex={0} className="relative min-w-0 overflow-auto rounded-xl border border-line bg-surface outline-none focus-visible:ring-2 focus-visible:ring-muted/40" style={{ maxHeight }}>
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <caption className="sr-only">
            {label}. {values.map((v) => v.label).join(", ")}
            {rowFields.length ? ` por ${rowFields.map((f) => f.label).join(" e ")}` : ""}
            {result.columnFields.length ? `, colunas por ${result.columnFields.map((f) => f.label).join(" e ")}` : ""}.
          </caption>
          <thead className="sticky top-0 z-[2]">{thead}</thead>
          <tbody>{bodyRows}</tbody>
          <tfoot className="sticky bottom-0 z-[2]">
            <tr>
              <th scope="row" className="sticky left-0 z-[1] whitespace-nowrap border-r border-line bg-surface py-2 pl-3 pr-4 text-left text-[13px] font-semibold text-ink shadow-[inset_0_1px_0_var(--color-line-strong)]">
                Total geral
              </th>
              {colKeys.flatMap((ck) =>
                values.map((v, vi) => (
                  <td key={`${ck}-${vi}`} className={cn(cellPad, "bg-surface text-right font-semibold tabular-nums shadow-[inset_0_1px_0_var(--color-line-strong)]", ck === PIVOT_TOTAL && columns.length > 0 && vi === 0 && "border-l border-line")}>
                    <span className="block whitespace-nowrap px-2 py-1">{fmt(result.value[PIVOT_TOTAL]?.[ck]?.[vi], vi)}</span>
                  </td>
                )),
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      {scales && result.rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {values.map((v, vi) => (
            <ScaleLegend key={vi} mode="continuous" thresholds={scales[vi]} title={nV > 1 ? v.label : `Intensidade · ${v.label}`} format={(n) => fmt(n, vi)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PivotBuilder                                                        */
/* ------------------------------------------------------------------ */

/** Campo do construtor: o do motor + ícone lucide opcional no chip. */
export type PivotBuilderField = PivotField & { icon?: ReactNode };

export type PivotBuilderProps = {
  records: PivotRecord[];
  fields: PivotBuilderField[];
  /** Layout controlado (use com `onLayoutChange`). */
  layout?: PivotLayout;
  /** Layout inicial quando não controlado. */
  defaultLayout?: PivotLayout;
  onLayoutChange?: (layout: PivotLayout) => void;
  /** Título do card ("Vendas por região"). */
  title?: ReactNode;
  description?: ReactNode;
  /** Nome acessível da tabela. Padrão: título em texto ou "Tabela dinâmica". */
  label?: string;
  /** Nome do arquivo de "Exportar CSV" (sem extensão). */
  fileName?: string;
  /** Sombreamento por intensidade nas células de detalhe. */
  heat?: boolean;
  compact?: boolean;
  /** Altura máxima da tabela. */
  maxHeight?: number | string;
  /** Controles extras à esquerda das ações (visões salvas, período). */
  toolbar?: ReactNode;
  className?: string;
};

const areaLabel: Record<PivotArea, string> = { filters: "Filtros", columns: "Colunas", rows: "Linhas", values: "Valores" };
const areaOrder: PivotArea[] = ["filters", "columns", "rows", "values"];

type DragItem = PivotMoveSource;
type DropTarget = { area: PivotArea | "palette"; index?: number };
type DragState = { item: DragItem; x: number; y: number; over: DropTarget | null; label: string };

const chipBase = "inline-flex h-8 min-w-0 max-w-full select-none items-center rounded-lg border bg-surface text-[13px] text-ink";

/**
 * Construtor de tabela dinâmica: escolha o que agrupar (Linhas, Colunas), o
 * que calcular (Valores, com Soma/Média/Contagem/Mín./Máx./Distintos) e o
 * recorte (Filtros). Arrastar e soltar com prévia OU o menu de cada campo
 * (teclado). Ações: trocar linhas e colunas, limpar, exportar CSV.
 */
export function PivotBuilder({
  records,
  fields,
  layout: layoutProp,
  defaultLayout,
  onLayoutChange,
  title,
  description,
  label,
  fileName = "tabela-dinamica",
  heat = false,
  compact = false,
  maxHeight,
  toolbar,
  className,
}: PivotBuilderProps) {
  const [inner, setInner] = useState<PivotLayout>(defaultLayout ?? emptyPivotLayout);
  const layout = layoutProp ?? inner;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [message, setMessage] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const byId = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);
  const name = (id: string) => byId.get(id)?.label ?? id;

  const setLayout = (next: PivotLayout, announce?: string) => {
    if (!layoutProp) setInner(next);
    onLayoutChange?.(next);
    if (announce) setMessage(announce);
  };
  const move = (from: DragItem, to: { area: PivotArea | null; index?: number; agg?: PivotAgg }) => {
    const next = pivotMove(layoutRef.current, fields, from, to);
    if (next === layoutRef.current) return;
    setLayout(next, to.area ? `${name(from.field)} em ${areaLabel[to.area]}.` : `${name(from.field)} removido.`);
  };

  /* Arrastar ----------------------------------------------------------- */
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const suppressOpen = useRef(false);

  // Converte o alvo (índice na lista sem o item arrastado) para pivotMove.
  const toMoveTarget = (item: DragItem, over: DropTarget) => {
    if (over.area === "palette") return { area: null as PivotArea | null };
    let index = over.index;
    if (index != null && item.area === over.area && item.index != null && index >= item.index) index += 1;
    return { area: over.area, index };
  };

  const findTarget = (x: number, y: number, item: DragItem): DropTarget | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-pivot-zone]");
    if (!el || !rootRef.current?.contains(el)) return null;
    const area = el.dataset.pivotZone as PivotArea | "palette";
    if (area === "palette") return item.area ? { area } : null;
    if (!pivotCanDrop(byId.get(item.field), area)) return null;
    const chips = Array.from(el.querySelectorAll<HTMLElement>("[data-pivot-chip]:not([data-preview])"));
    let index = chips.length;
    for (let i = 0; i < chips.length; i++) {
      const r = chips[i].getBoundingClientRect();
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) {
        index = i;
        break;
      }
    }
    return { area, index };
  };

  const startPointer = (e: ReactPointerEvent<HTMLElement>, item: DragItem) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let started = false;
    const onMove = (ev: PointerEvent) => {
      if (!started) {
        if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
        started = true;
        suppressOpen.current = true;
        setOpenMenu(null);
        document.body.style.cursor = "grabbing";
      }
      ev.preventDefault();
      setDrag({ item, x: ev.clientX, y: ev.clientY, over: findTarget(ev.clientX, ev.clientY, item), label: name(item.field) });
    };
    const end = (commit: boolean) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      if (!started) return;
      document.body.style.cursor = "";
      const d = dragRef.current;
      if (commit && d?.over) move(item, toMoveTarget(item, d.over));
      else if (commit) setMessage("Nada mudou: solte numa área.");
      setDrag(null);
      setTimeout(() => (suppressOpen.current = false), 0);
    };
    const onUp = () => end(true);
    const onCancel = () => end(false);
    const onKey = (ev: globalThis.KeyboardEvent) => ev.key === "Escape" && end(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
  };
  useEffect(() => () => void (document.body.style.cursor = ""), []);

  const overKey = drag?.over ? `${drag.over.area}:${drag.over.index ?? ""}` : "";
  // Prévia: o layout como ficaria se soltasse agora (áreas e tabela).
  const shown = useMemo(() => {
    if (!drag?.over) return layout;
    return pivotMove(layout, fields, drag.item, toMoveTarget(drag.item, drag.over));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, fields, drag?.item, overKey]);
  const result = useMemo(() => buildPivot(records, fields, shown), [records, fields, shown]);

  /* Ações -------------------------------------------------------------- */
  const hasAny = layout.rows.length + layout.columns.length + layout.values.length + layout.filters.length > 0;
  const swap = () => setLayout(pivotSwap(layout), "Linhas e colunas trocadas.");
  const clear = () => {
    const before = layout;
    setLayout(emptyPivotLayout, "Tabela limpa.");
    notify("Tabela limpa", () => setLayout(before, "Tabela restaurada."));
  };
  const exportCsv = () => {
    const { header, rows } = pivotToRows(buildPivot(records, fields, layout));
    const cols: GridColumn<(GridValue)[]>[] = header.map((h, i) => ({ key: String(i), header: h, value: (r) => r[i] }));
    downloadCsv(fileName, gridToCsv(rows, cols));
  };
  const clearFilters = () => setLayout({ ...layout, filters: layout.filters.map((f) => ({ field: f.field })) }, "Filtros limpos.");
  const firstMeasure = fields.find((f) => f.kind === "measure");

  /* Menus -------------------------------------------------------------- */
  const moveEntries = (item: DragItem, current: PivotArea | null): MenuEntry[] => {
    const f = byId.get(item.field);
    return areaOrder
      .filter((a) => a !== current && pivotCanDrop(f, a))
      .map((a) => ({ label: current ? `Mover para ${areaLabel[a]}` : `Adicionar a ${areaLabel[a]}`, onSelect: () => move(item, { area: a }) }));
  };
  const chipMenu = (area: PivotArea, index: number, field: string, len: number): MenuEntry[] => {
    const item: DragItem = { area, index, field };
    const f = byId.get(field);
    const entries: MenuEntry[] = [];
    if (area === "values" && f) {
      const v = layout.values[index];
      entries.push(
        { type: "label", label: "Agregação" },
        {
          type: "radio",
          value: v?.agg ?? "sum",
          onValueChange: (agg) => {
            const next = { ...layout, values: layout.values.map((x, i) => (i === index ? { ...x, agg: agg as PivotAgg } : x)) };
            setLayout(next, `${f.label}: ${pivotAggLabel[agg as PivotAgg]}.`);
          },
          options: pivotAggsFor(f).map((a) => ({ value: a, label: pivotAggLabel[a] })),
        },
        { type: "separator" },
      );
    }
    const before = area === "rows" ? "Mover para cima" : "Mover para a esquerda";
    const after = area === "rows" ? "Mover para baixo" : "Mover para a direita";
    if (index > 0) entries.push({ label: before, onSelect: () => move(item, { area, index: index - 1 }) });
    if (index < len - 1) entries.push({ label: after, onSelect: () => move(item, { area, index: index + 2 }) });
    entries.push(...moveEntries(item, area), { type: "separator" }, { label: "Remover", onSelect: () => move(item, { area: null }) });
    return entries;
  };
  const menuOpen = (key: string) => ({
    open: openMenu === key,
    onOpenChange: (o: boolean) => {
      if (o && suppressOpen.current) return;
      setOpenMenu(o ? key : null);
    },
  });

  /* Chips -------------------------------------------------------------- */
  const dragAgg = drag
    ? drag.item.area === "values"
      ? layout.values[drag.item.index ?? -1]?.agg
      : byId.get(drag.item.field) && pivotAggsFor(byId.get(drag.item.field)!)[0]
    : undefined;
  /** Chip que representa o item arrastado: na prévia (sobre uma área) ou na origem (fora das áreas). */
  const isDragged = (area: PivotArea, field: string, agg: PivotAgg | undefined, realIndex: number) => {
    if (!drag || drag.item.field !== field) return false;
    if (drag.over) return drag.over.area === area && (area !== "values" || agg === dragAgg);
    return drag.item.area === area && drag.item.index === realIndex;
  };

  const filterChip = (index: number, spec: PivotLayout["filters"][number]) => {
    const f = byId.get(spec.field);
    if (!f) return null;
    const all = pivotValues(records, f);
    const sel = spec.include ?? all;
    const summary = !spec.include || sel.length === all.length ? "Todos" : sel.length === 0 ? "Nenhum" : sel.length === 1 ? sel[0] : `${sel.length} de ${all.length}`;
    const key = `filters:${spec.field}`;
    return (
      <>
        <Popover
          trigger={
            <>
              <span className="truncate font-medium text-ink">{f.label}</span>
              <span className="truncate text-muted">{summary}</span>
              <ChevronDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted" />
            </>
          }
          triggerLabel={`Filtrar ${f.label}: ${summary}`}
          triggerClassName="h-8 min-w-0 gap-1.5 rounded-none px-1.5 text-[13px]"
          title={`Valores de ${f.label}`}
          width={260}
          align="start"
          {...menuOpen(key)}
        >
          <CheckboxGroup
            label={`Valores de ${f.label}`}
            hideLabel
            selectAll="Todos"
            options={all.map((v) => ({ value: v, label: v }))}
            value={sel}
            onValueChange={(v) => {
              const include = v.length === all.length ? undefined : v;
              setLayout({ ...layout, filters: layout.filters.map((x, i) => (i === index ? { field: x.field, ...(include ? { include } : {}) } : x)) }, `${f.label}: ${include ? `${include.length} de ${all.length}` : "todos"}.`);
            }}
          />
        </Popover>
        <Menu
          trigger={<MoreHorizontal aria-hidden />}
          triggerVariant="icon"
          triggerClassName="h-7 w-7 mr-0.5"
          label={`Opções de ${f.label}`}
          items={chipMenu("filters", index, spec.field, layout.filters.length)}
          {...menuOpen(`${key}:menu`)}
        />
      </>
    );
  };

  const zoneChips = (area: PivotArea) => {
    const list: { field: string; agg?: PivotAgg }[] =
      area === "values" ? shown.values : area === "filters" ? shown.filters.map((f) => ({ field: f.field })) : shown[area].map((field) => ({ field }));
    const realLen = area === "values" ? layout.values.length : area === "filters" ? layout.filters.length : layout[area].length;
    return list.map((it) => {
      // Posição no layout real (para menu e arrasto).
      const realIndex =
        area === "values"
          ? layout.values.findIndex((v) => v.field === it.field && v.agg === it.agg)
          : area === "filters"
            ? layout.filters.findIndex((f) => f.field === it.field)
            : layout[area].indexOf(it.field);
      const f = byId.get(it.field);
      const key = `${area}:${it.field}:${it.agg ?? ""}`;
      const dragged = isDragged(area, it.field, it.agg, realIndex);
      const leaving = dragged && !drag?.over;
      return (
        <div
          key={key}
          data-pivot-chip=""
          data-preview={dragged ? "" : undefined}
          onPointerDown={(e) => realIndex >= 0 && startPointer(e, { area, index: realIndex, field: it.field })}
          className={cn(
            chipBase,
            dragged ? "border-dashed border-line-strong bg-soft opacity-70" : "border-line hover:border-line-strong",
            leaving && "opacity-40",
          )}
        >
          <span aria-hidden className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center pl-1 text-muted">
            <GripVertical className="h-3.5 w-3.5" />
          </span>
          {area === "filters" && realIndex >= 0 && !dragged ? (
            filterChip(realIndex, layout.filters[realIndex])
          ) : realIndex >= 0 && !dragged ? (
            <Menu
              trigger={
                <>
                  {f?.icon && <span className="flex shrink-0 text-muted [&_svg]:h-3.5 [&_svg]:w-3.5">{f.icon}</span>}
                  <span className="truncate font-medium">{f?.label ?? it.field}</span>
                  {it.agg && <span className="shrink-0 text-muted">{pivotAggLabel[it.agg]}</span>}
                  <ChevronDown aria-hidden className="!h-3.5 !w-3.5 shrink-0 text-muted" />
                </>
              }
              triggerVariant="bare"
              triggerClassName="h-8 min-w-0 gap-1.5 !rounded-lg pl-1 pr-2 text-[13px] hover:bg-soft data-popup-open:bg-soft"
              label={`${f?.label ?? it.field}${it.agg ? ` (${pivotAggLabel[it.agg]})` : ""} em ${areaLabel[area]}: opções`}
              items={chipMenu(area, realIndex, it.field, realLen)}
              {...menuOpen(key)}
            />
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 pl-1 pr-2.5">
              <span className="truncate font-medium">{f?.label ?? it.field}</span>
              {it.agg && <span className="shrink-0 text-muted">{pivotAggLabel[it.agg]}</span>}
            </span>
          )}
        </div>
      );
    });
  };

  const paletteChip = (f: PivotBuilderField) => {
    const key = `palette:${f.id}`;
    const used = layout.rows.includes(f.id) || layout.columns.includes(f.id) || layout.values.some((v) => v.field === f.id) || layout.filters.some((x) => x.field === f.id);
    return (
      <div key={f.id} onPointerDown={(e) => startPointer(e, { area: null, field: f.id })} className={cn(chipBase, "border-line hover:border-line-strong", drag?.item.field === f.id && drag.item.area === null && "opacity-50")}>
        <Menu
          trigger={
            <>
              {f.icon && <span className="flex shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4">{f.icon}</span>}
              <span className="truncate">{f.label}</span>
              {used && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
            </>
          }
          triggerVariant="bare"
          triggerClassName="h-8 min-w-0 cursor-grab gap-2 !rounded-lg px-2.5 text-[13px] hover:bg-soft data-popup-open:bg-soft"
          label={`${f.label}${used ? " (em uso)" : ""}: adicionar à tabela`}
          items={[{ type: "label", label: f.kind === "measure" ? "Medida" : "Dimensão" }, ...moveEntries({ area: null, field: f.id }, null)]}
          {...menuOpen(key)}
        />
      </div>
    );
  };

  const dims = fields.filter((f) => f.kind === "dimension");
  const measures = fields.filter((f) => f.kind === "measure");
  const dragField = drag ? byId.get(drag.item.field) : undefined;
  const tableLabel = label ?? (typeof title === "string" ? title : "Tabela dinâmica");
  const filtered = result.recordCount === 0 && records.length > 0 && shown.filters.some((f) => f.include);

  let body: ReactNode;
  if (!records.length) body = <Empty title="Nenhum registro para analisar" hint="Quando houver dados no período, eles aparecem aqui para agrupar e somar." />;
  else if (!shown.values.length)
    body = (
      <Empty
        title="Arraste uma medida para Valores"
        hint="Valores dizem o que calcular; Linhas e Colunas, como agrupar. Também dá para usar o menu de cada campo."
        icon={<Plus aria-hidden />}
        action={
          firstMeasure && (
            <Button variant="ghost" size="sm" onClick={() => move({ area: null, field: firstMeasure.id }, { area: "values" })}>
              <Plus /> Somar {firstMeasure.label.toLowerCase()}
            </Button>
          )
        }
      />
    );
  else if (filtered)
    body = (
      <Empty
        title="Nenhum registro com esses filtros"
        hint="Os filtros escolhidos não deixam nenhum registro. Inclua mais valores ou limpe os filtros."
        action={
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        }
      />
    );
  else body = <PivotTable result={result} label={tableLabel} heat={heat} compact={compact} maxHeight={maxHeight} />;

  return (
    <section ref={rootRef} aria-label={typeof title === "string" ? title : "Tabela dinâmica"} className={cn("flex min-w-0 flex-col rounded-xl border border-line bg-surface", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="m-0 text-[15px] font-semibold leading-snug text-ink">{title}</h2>}
            {description && <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-muted">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {toolbar}
            <Button variant="quiet" size="sm" onClick={swap} disabled={!layout.rows.length && !layout.columns.length} disabledReason="Coloque um campo em Linhas ou Colunas">
              <ArrowLeftRight /> Trocar linhas e colunas
            </Button>
            <Button variant="quiet" size="sm" onClick={clear} disabled={!hasAny} disabledReason="A tabela já está vazia">
              <Eraser /> Limpar
            </Button>
            <Button variant="ghost" size="sm" onClick={exportCsv} disabled={!layout.values.length || !result.recordCount} disabledReason="Adicione um valor para exportar">
              <Download /> Exportar CSV
            </Button>
          </div>
        </header>

      <div data-pivot-zone="palette" className="relative grid gap-4 border-b border-line px-4 py-3 md:grid-cols-2">
        {[
          { title: "Dimensões", items: dims },
          { title: "Medidas", items: measures },
        ].map((g) =>
          g.items.length ? (
            <div key={g.title} className="flex min-w-0 flex-col gap-2">
              <p className="m-0 text-[12px] text-muted">{g.title}</p>
              <div className="flex flex-wrap gap-1.5">{g.items.map(paletteChip)}</div>
            </div>
          ) : null,
        )}
        {drag?.item.area && (
          <p
            className={cn(
              "pointer-events-none absolute inset-2 m-0 flex items-center justify-center rounded-lg border border-dashed bg-surface/90 text-[13px]",
              drag.over?.area === "palette" ? "border-primary/50 text-ink" : "border-line-strong text-muted",
            )}
          >
            Solte aqui para remover {drag.label} da tabela
          </p>
        )}
      </div>

      <div className="grid gap-2.5 p-4 md:grid-cols-2">
        {areaOrder.map((area) => {
          const accepts = !drag || pivotCanDrop(dragField, area);
          const over = drag?.over?.area === area;
          const chips = zoneChips(area);
          return (
            <div
              key={area}
              data-pivot-zone={area}
              role="group"
              aria-label={areaLabel[area]}
              className={cn(
                "flex min-h-12 min-w-0 items-start gap-2 rounded-xl border p-2 transition-colors motion-reduce:transition-none",
                over ? "border-primary/50 bg-soft" : drag && accepts ? "border-dashed border-line-strong bg-soft/60" : "border-transparent bg-soft/60",
                drag && !accepts && "opacity-50",
              )}
            >
              <span className="w-16 shrink-0 pl-1 pt-1.5 text-[12.5px] text-muted">{areaLabel[area]}</span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {chips.length ? chips : <span className="pt-1.5 text-[12px] text-muted">{drag ? (accepts ? "Solte aqui" : "Só dimensões") : area === "values" ? "Arraste uma medida" : "Arraste uma dimensão"}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="min-w-0 px-4 pb-4">{body}</div>

      <span role="status" aria-live="polite" className="sr-only">
        {message}
      </span>
      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            className={cn(chipBase, "pointer-events-none fixed z-[var(--z-popup)] gap-1.5 border-line-strong px-2.5 font-medium shadow-raised", !drag.over && "opacity-80")}
            style={{ left: drag.x + 8, top: drag.y + 8 }}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted" />
            {drag.label}
            {drag.over && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
            {drag.over && <span className="text-muted">{drag.over.area === "palette" ? "Remover" : areaLabel[drag.over.area]}</span>}
          </div>,
          document.body,
        )}
    </section>
  );
}
