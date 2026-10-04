/**
 * Planilhas, documentos e apresentações na linguagem do DS, escritos em código
 * ou lidos de arquivos reais do Office.
 *
 * WorkbookView   → abas, grade com endereços A1, barra de fórmula, seleção por
 *                  teclado, soma/média da seleção, copiar para o Excel.
 * DocumentView   → páginas A4 com paginação medida, capa, sumário com página,
 *                  tabelas que quebram repetindo o cabeçalho, imprimir/PDF.
 * OfficeSlide    → slide de um .pptx (posições, cores e imagens do arquivo) para o SlideDeck.
 * OfficeFileView → abre um .xlsx, .docx ou .pptx e escolhe o visualizador, com os estados.
 *
 * Exportar (.xlsx/.docx) é opcional e fica no app: `actions` recebe o botão e
 * a receita está em templates/office-export.ts (docs/guias/office.md).
 */
import { ChartColumn, FileSpreadsheet, FileText, FileWarning, Presentation as PresentationIcon, Printer, RotateCw, Table2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useIsomorphicLayoutEffect as useLayoutEffect } from "../lib/layout-effect";
import {
  cellAddress,
  columnLetter,
  docRuns,
  documentOutline,
  formatCell,
  isNumericFormat,
  layoutSheet,
  type CellFormat,
  type DocBlock,
  type DocText,
  type FileWorkbook,
  type GridSheet,
  type LaidCell,
  type OfficeChart,
  type OfficeDocument,
  type Presentation,
  type PresentationShape,
  type PresentationSlide,
  type SheetLayout,
  type Workbook,
  type CellValue,
} from "../lib/office";
import { OFFICE_SHEET_LIMITS, OfficeFileError, readOfficeFile, type OfficeFile, type OfficeFileErrorCode, type OfficeSource } from "../lib/office-files";
import { formatCompact, formatCurrency, formatNumber, formatPercent } from "../lib/format";
import { Skeleton } from "./feedback";
import { SegmentedControl, Tabs } from "./navigation";
import { AreaChart, BarChart, DonutChart, LineChart } from "./charts";
import { ComboChart, ScatterChart } from "./charts-advanced";
import { LoadingState, StateView } from "./states";
import { SLIDE_HEIGHT, SLIDE_WIDTH, SlideDeck, type DeckSlide } from "./media";
import { Button, Empty } from "./primitives";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Barra superior dos visualizadores. Mesma do SlideDeck: 48 px, ícone,
 * título, contador e ferramentas à direita depois de um separador.
 */
function ViewerBar({ icon, title, meta, children }: { icon: ReactNode; title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
      <span aria-hidden className="shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <p className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium">{title}</p>
      {meta && (
        <span className="text-[12px] tabular-nums text-muted max-sm:hidden" aria-live="polite">
          {meta}
        </span>
      )}
      {children && (
        <>
          <span aria-hidden className="mx-1 h-4 w-px bg-line max-sm:hidden" />
          {children}
        </>
      )}
    </header>
  );
}

/** Ferramenta da barra (texto + ícone), igual às do SlideDeck. */
const viewerTool = "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted hover:bg-soft hover:text-ink aria-pressed:bg-soft aria-pressed:text-ink disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4";

/* ------------------------------------------------------------------ */
/* OfficeChartView                                                     */
/* ------------------------------------------------------------------ */

const chartFormat = (chart: OfficeChart) => (n: number) => (chart.format ? formatCell({ value: n, format: chart.format, digits: chart.digits }) : formatNumber(n, Math.abs(n) < 10 && n % 1 ? 2 : 0));
const chartAxis = (chart: OfficeChart) => (n: number) =>
  chart.percent ? formatPercent(n, 0) : chart.format === "currency" ? formatCurrency(n, { compact: true }) : chart.format === "percent" ? formatPercent(n, 0) : Math.abs(n) >= 10000 ? formatCompact(n) : formatNumber(n);

/**
 * Gráfico do Office (de .xlsx ou .pptx) desenhado com os gráficos do DS:
 * barras, linhas, áreas, rosca, combinado e dispersão. Valores e nomes vêm
 * do arquivo; cores, eixos e tooltip são os do DS.
 */
export function OfficeChartView({ chart, height = 260, showTitle = true, className }: { chart: OfficeChart; height?: number; showTitle?: boolean; className?: string }) {
  const label = chart.title ?? (chart.series.map((s) => s.name).join(", ") || "Gráfico");
  const format = chartFormat(chart);
  const formatAxis = chartAxis(chart);
  const data = chart.categories.map((cat, i) => Object.fromEntries([["categoria", cat], ...chart.series.map((s, k) => [`s${k}`, s.values[i] ?? null])]));
  const series = (kind?: "bar" | "line" | "area") => chart.series.flatMap((s, k) => (!kind || s.kind === kind ? [{ key: `s${k}`, label: s.name }] : []));
  const empty = !chart.series.some((s) => s.values.some((v) => v !== null));
  let body: ReactNode;
  if (chart.kind === "unsupported" || empty)
    body = (
      <p className="m-0 flex items-center justify-center rounded-lg bg-soft px-4 text-center text-[12.5px] text-muted" style={{ height: Math.min(height, 160) }}>
        {empty ? "O gráfico não tem valores salvos no arquivo." : `Gráfico de ${chart.sourceType} ainda não tem equivalente no DS.`}
      </p>
    );
  else if (chart.kind === "pie" || chart.kind === "doughnut")
    body = <DonutChart label={label} format={format} items={chart.categories.map((c, i) => ({ label: c, value: chart.series[0]?.values[i] ?? 0 }))} size={Math.min(height - 24, 200)} />;
  else if (chart.kind === "scatter")
    body = (
      <ScatterChart
        label={label}
        height={height}
        xLabel=""
        yLabel=""
        formatY={format}
        groups={chart.series.length > 1 ? chart.series.map((s) => s.name) : undefined}
        points={chart.series.flatMap((s, k) => s.values.flatMap((y, i) => (y === null || s.x?.[i] == null ? [] : [{ id: `${k}-${i}`, label: s.name, x: s.x[i]!, y, group: chart.series.length > 1 ? s.name : undefined }])))}
      />
    );
  else if (chart.kind === "combo" && series("bar").length === 1 && series("line").length === 1)
    body = <ComboChart label={label} height={height} data={data} index="categoria" bar={series("bar")[0]} line={series("line")[0]} formatBar={format} formatLine={format} />;
  else {
    const Chart = chart.kind === "line" ? LineChart : chart.kind === "area" ? AreaChart : BarChart;
    body = (
      <Chart
        label={label}
        height={height}
        data={data}
        index="categoria"
        series={series()}
        format={format}
        formatAxis={formatAxis}
        stacked={chart.stacked}
        stackOffset={chart.percent ? "expand" : undefined}
        layout={chart.horizontal ? "horizontal" : undefined}
      />
    );
  }
  return (
    <figure className={cn("m-0 min-w-0", className)}>
      {showTitle && chart.title && <figcaption className="mb-3 text-[13.5px] font-medium text-ink">{chart.title}</figcaption>}
      {body}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* WorkbookView                                                        */
/* ------------------------------------------------------------------ */

type Pos = { r: number; c: number };
const ROWNUM = 48;
const ROW_H = 36;
const pxWidth = (chars: number) => Math.round(Math.max(72, chars * 7.2 + 24));

const toGrid = (wb: Workbook | FileWorkbook): GridSheet[] => wb.sheets.map((s) => ("layout" in s ? s : { name: s.name, layout: layoutSheet(s), freezeColumns: s.freezeColumns ?? 1 }));

/**
 * Linhas de abertura da aba (título, fonte, linha em branco) saem da grade e
 * viram o cabeçalho da seção, como em qualquer tabela do DS. Vale para o que
 * foi escrito em código (title/description) e para o título mesclado de um .xlsx.
 */
function sheetIntro(layout: SheetLayout) {
  const limit = layout.headerRow >= 0 ? layout.headerRow : Math.min(3, layout.rows.length);
  const lines: LaidCell[] = [];
  let start = 0;
  for (let r = 0; r < limit; r++) {
    const filled = layout.rows[r].filter((c): c is LaidCell => !!c && (c.value !== null || !!c.merge));
    const firstCell = layout.rows[r][0];
    const onlyFirst = filled.length === 0 || (filled.length === 1 && !!firstCell && typeof firstCell.value === "string");
    if (!onlyFirst) break;
    if (filled[0]) lines.push(filled[0]);
    start = r + 1;
  }
  // Sem cabeçalho definido, só sai da grade se a primeira linha parece título (mesclada ou em negrito).
  if (layout.headerRow < 0 && !(lines[0]?.span || lines[0]?.bold || lines[0]?.role === "title")) return { title: undefined, notes: [] as LaidCell[], start: 0 };
  const [title, ...notes] = lines;
  return { title, notes, start };
}

/**
 * Texto mais largo que a coluna avança pelas células vazias à direita (só o
 * necessário), como no Excel. Números e células mescladas não transbordam.
 */
function overflowSpans(row: (LaidCell | null)[], r: number, cols: number[], px: Map<number, number>, covered?: Map<string, [number, number]>) {
  const out: { c: number; span: number }[] = [];
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (covered?.has(`${r}:${c}`)) continue;
    const cell = row[c];
    let span = 1;
    if (cell && !cell.merge && typeof cell.value === "string" && !isNumericFormat(cell.format) && cell.role !== "header" && !cell.style?.wrap && cell.style?.align !== "center" && cell.style?.align !== "right") {
      const need = formatCell(cell).length * (cell.bold ? 7.6 : 7.1) + 24;
      let width = px.get(c) ?? 0;
      while (width < need && i + span < cols.length && !row[cols[i + span]] && !covered?.has(`${r}:${cols[i + span]}`)) width += px.get(cols[i + span++]) ?? 0;
    }
    out.push({ c, span });
    i += span - 1;
  }
  return out;
}

/**
 * Planilha na linguagem do DS (mesmo visual do DataGrid): abas no topo,
 * título e fonte acima da tabela, cabeçalho e total fixos, colunas fixas.
 * Conteúdo escrito em código (Workbook: colunas, fórmulas, total) ou lido de
 * um .xlsx/.csv (FileWorkbook, de readOfficeFile): cores de célula, mesclas,
 * linhas e colunas ocultas, gráficos. Só as linhas visíveis são desenhadas
 * (dezenas de milhares de linhas sem travar). Setas navegam, Shift seleciona
 * intervalo, Ctrl+C copia para colar no Excel; o rodapé mostra endereço,
 * fórmula e soma, média e contagem da seleção.
 */
export function WorkbookView({
  workbook,
  initialSheet = 0,
  actions,
  loading,
  className,
}: {
  workbook: Workbook | FileWorkbook;
  initialSheet?: number;
  /** Ações na barra do visualizador (ex.: botão "Baixar .xlsx" do app). */
  actions?: ReactNode;
  /** Carregando: mostra o esqueleto da tabela. */
  loading?: boolean;
  className?: string;
}) {
  const uid = useId();
  const grid = useMemo(() => toGrid(workbook), [workbook]);
  const [sheetIndex, setSheetIndex] = useState(Math.min(initialSheet, Math.max(0, grid.length - 1)));
  const sheet = grid[sheetIndex];
  const layout = sheet?.layout ?? null;
  const intro = useMemo(() => (layout ? sheetIntro(layout) : { title: undefined, notes: [] as LaidCell[], start: 0 }), [layout]);
  const firstCell = (l: SheetLayout | null, start: number): Pos => ({ r: l ? Math.min(Math.max(l.firstDataRow, start), Math.max(0, l.rows.length - 1)) : 0, c: 0 });
  const [active, setActive] = useState<Pos>(() => firstCell(layout, intro.start));
  const [anchor, setAnchor] = useState<Pos>(() => firstCell(layout, intro.start));
  const [view, setView] = useState<"table" | "charts">("table");
  const gridRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ top: 0, height: 600, x: false });

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScroll((s) => ({ ...s, height: el.clientHeight || s.height })));
    ro.observe(el);
    return () => ro.disconnect();
  }, [sheetIndex, view]);

  const selectSheet = (id: string) => {
    const i = Number(id);
    setSheetIndex(i);
    setView("table");
    const l = grid[i]?.layout ?? null;
    const p = firstCell(l, l ? sheetIntro(l).start : 0);
    setActive(p);
    setAnchor(p);
    setScroll((s) => ({ ...s, top: 0, x: false }));
    gridRef.current?.scrollTo({ top: 0, left: 0 });
  };

  const frame = cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className);
  const bar = (
    <ViewerBar icon={<FileSpreadsheet />} title={workbook.title} meta={grid.length > 1 ? `${grid.length} abas` : undefined}>
      {actions}
    </ViewerBar>
  );
  const tabs = grid.length > 1 && (
    <div className="shrink-0 overflow-x-auto border-b border-line px-3 pt-1">
      <Tabs label="Abas da planilha" value={String(sheetIndex)} onChange={selectSheet} items={grid.map((s, i) => ({ id: String(i), label: s.name }))} className="-mb-px flex-nowrap" />
    </div>
  );

  // Índices visíveis (sem linhas/colunas ocultas) — calculados antes de qualquer retorno.
  const hasTable = !!layout && layout.colCount > 0 && layout.rows.length > 0;
  const start = intro.start;
  const headerRow = layout?.headerRow ?? -1;
  const hasHeader = headerRow >= 0 && headerRow === start;
  const bodyFrom = hasHeader ? headerRow + 1 : start;
  const bodyTo = layout ? (layout.totalRow !== null ? layout.totalRow - 1 : layout.rows.length - 1) : -1;
  const bodyRows = useMemo(() => {
    const out: number[] = [];
    if (layout) for (let r = bodyFrom; r <= bodyTo; r++) if (!layout.hiddenRows?.has(r)) out.push(r);
    return out;
  }, [layout, bodyFrom, bodyTo]);
  const cols = useMemo(() => (layout ? Array.from({ length: layout.colCount }, (_, c) => c).filter((c) => !layout.hiddenCols?.has(c)) : []), [layout]);
  const rowIndex = useMemo(() => new Map(bodyRows.map((r, i) => [r, i])), [bodyRows]);

  // Mantém a célula ativa à vista: vertical pelo cálculo (linhas virtuais), horizontal pelo navegador.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const i = rowIndex.get(active.r);
    if (i !== undefined) {
      const head = el.querySelector("thead")?.getBoundingClientRect().height ?? 0;
      const foot = el.querySelector("tfoot")?.getBoundingClientRect().height ?? 0;
      const top = i * ROW_H;
      if (top < el.scrollTop) el.scrollTop = top;
      else if (top + ROW_H > el.scrollTop + el.clientHeight - head - foot) el.scrollTop = top + ROW_H - el.clientHeight + head + foot;
    }
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-cell="${active.r}-${active.c}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }, [active, rowIndex]);

  if (loading || !layout || !sheet)
    return (
      <section aria-label={workbook.title} aria-busy={loading || undefined} className={frame}>
        {bar}
        {loading ? (
          <div className="flex flex-col">
            <div className="flex gap-4 border-b border-line px-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="px-4 py-4">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="mt-2 h-3.5 w-48" />
            </div>
            <div className="border-t border-line">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex h-9 items-center gap-6 border-b border-line px-4">
                  <Skeleton className="h-3.5 w-6" />
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="ml-auto h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Empty title="Planilha sem abas" hint="O arquivo não tem nenhuma aba visível." framed={false} />
        )}
      </section>
    );

  const charts = sheet.charts ?? [];
  const showCharts = charts.length > 0 && (view === "charts" || !hasTable);
  const introBlock = (intro.title || intro.notes.length > 0 || (charts.length > 0 && hasTable)) && (
    <div className="flex shrink-0 flex-wrap items-start gap-x-4 gap-y-3 px-4 pb-3 pt-4">
      <div className="min-w-[min(100%,240px)] flex-1">
        {intro.title && <h3 className="m-0 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{formatCell(intro.title)}</h3>}
        {intro.notes.map((n, i) => (
          <p key={i} className="m-0 mt-1 text-[12.5px] text-muted">
            {formatCell(n)}
          </p>
        ))}
        {!intro.title && !intro.notes.length && <p className="m-0 text-[13.5px] font-medium text-ink">{sheet.name}</p>}
      </div>
      {charts.length > 0 && hasTable && (
        <SegmentedControl
          label="Mostrar"
          value={view}
          onChange={setView}
          options={[
            { value: "table", label: "Tabela", icon: <Table2 /> },
            { value: "charts", label: charts.length > 1 ? `Gráficos (${charts.length})` : "Gráfico", icon: <ChartColumn /> },
          ]}
        />
      )}
    </div>
  );

  if (showCharts)
    return (
      <section aria-label={workbook.title} className={frame}>
        {bar}
        {tabs}
        {introBlock}
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto border-t border-line bg-soft/50 p-4 lg:grid-cols-2">
          {charts.map((ch, i) => (
            <div key={i} className={cn("rounded-xl border border-line bg-surface p-4", charts.length === 1 && "lg:col-span-2")}>
              <OfficeChartView chart={ch} height={charts.length === 1 ? 320 : 240} />
            </div>
          ))}
        </div>
      </section>
    );

  const { rows, colCount, totalRow, widths, covered } = layout;
  const freeze = cols.filter((c) => c < Math.min(sheet.freezeColumns ?? 0, colCount)).length;
  const px = new Map(cols.map((c) => [c, pxWidth(widths[c] ?? 9)]));
  const leftOf = (c: number) => ROWNUM + cols.slice(0, cols.indexOf(c)).reduce((a, k) => a + (px.get(k) ?? 0), 0);
  const pinned = (c: number) => cols.indexOf(c) < freeze;
  const r0 = Math.min(active.r, anchor.r);
  const r1 = Math.max(active.r, anchor.r);
  const c0 = Math.min(active.c, anchor.c);
  const c1 = Math.max(active.c, anchor.c);
  const inRange = (r: number, c: number) => r >= r0 && r <= r1 && c >= c0 && c <= c1;
  const cellAt = (r: number, c: number): LaidCell | null => rows[r]?.[c] ?? null;
  const activeCell = cellAt(active.r, active.c);
  const single = r0 === r1 && c0 === c1;
  const address = single ? cellAddress(active.r, active.c) : `${cellAddress(r0, c0)}:${cellAddress(r1, c1)}`;

  // Soma, média e contagem da seleção (como a barra de status do Excel). Limite para não travar em seleção gigante.
  const picked: LaidCell[] = [];
  for (let r = r0; r <= r1 && picked.length < 200000; r++) for (let c = c0; c <= c1; c++) if (cellAt(r, c)) picked.push(cellAt(r, c)!);
  const nums = picked.filter((p) => typeof p.value === "number" && p.role !== "header");
  const numFormat: CellFormat = nums[0]?.format ?? "number";
  const stat = (v: number) => formatCell({ value: v, format: numFormat === "text" || numFormat === "date" || numFormat === "time" || numFormat === "datetime" ? "number" : numFormat, digits: nums[0]?.digits === 6 ? 2 : nums[0]?.digits });
  const sum = nums.reduce((a, p) => a + (p.value as number), 0);
  const filled = picked.filter((p) => p.value !== null && p.value !== undefined && p.value !== "").length;

  // Navegação sobre linhas e colunas visíveis; célula coberta por mescla leva à que manda.
  const navRows = hasHeader ? [headerRow, ...bodyRows] : bodyRows;
  const allNav = totalRow !== null ? [...navRows, totalRow] : navRows;
  const resolve = (p: Pos): Pos => {
    const a = covered?.get(`${p.r}:${p.c}`);
    return a ? { r: a[0], c: a[1] } : p;
  };
  const step = (list: number[], value: number, delta: number) => {
    let i = list.indexOf(value);
    if (i < 0) i = list.findIndex((v) => v >= value);
    return list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + delta))] ?? value;
  };
  const move = (r: number, c: number, extend: boolean) => {
    const next = resolve({ r, c });
    setActive(next);
    if (!extend) setAnchor(next);
  };
  const copy = () => {
    const lines: string[] = [];
    for (const r of allNav.filter((x) => x >= r0 && x <= r1).slice(0, 50000)) lines.push(cols.filter((c) => c >= c0 && c <= c1).map((c) => (cellAt(r, c) ? formatCell(cellAt(r, c)!) : "")).join("\t"));
    void navigator.clipboard?.writeText(lines.join("\n"));
  };
  const onKey = (e: KeyboardEvent) => {
    const { r, c } = active;
    const mod = e.ctrlKey || e.metaKey;
    const page = Math.max(1, Math.floor(scroll.height / ROW_H) - 2);
    const map: Record<string, () => void> = {
      ArrowDown: () => move(mod ? allNav[allNav.length - 1] : step(allNav, r + (cellAt(r, c)?.merge?.rows ?? 1) - 1, 1), c, e.shiftKey),
      ArrowUp: () => move(mod ? allNav[0] : step(allNav, r, -1), c, e.shiftKey),
      ArrowRight: () => move(r, mod ? cols[cols.length - 1] : step(cols, c + (cellAt(r, c)?.merge?.cols ?? 1) - 1, 1), e.shiftKey),
      ArrowLeft: () => move(r, mod ? cols[0] : step(cols, c, -1), e.shiftKey),
      Enter: () => move(step(allNav, r, 1), c, false),
      PageDown: () => move(step(allNav, r, page), c, e.shiftKey),
      PageUp: () => move(step(allNav, r, -page), c, e.shiftKey),
      Home: () => move(mod ? allNav[0] : r, cols[0], e.shiftKey),
      End: () => move(mod ? allNav[allNav.length - 1] : r, cols[cols.length - 1], e.shiftKey),
    };
    if (mod && e.key.toLowerCase() === "c") return copy();
    if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setAnchor({ r: allNav[0], c: cols[0] });
      setActive({ r: allNav[allNav.length - 1], c: cols[cols.length - 1] });
      return;
    }
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };
  const pointer = (r: number, c: number, shift: boolean) => {
    gridRef.current?.focus({ preventScroll: true });
    move(r, c, shift);
  };
  const onScroll = () => {
    const el = gridRef.current;
    if (!el) return;
    setScroll({ top: el.scrollTop, height: el.clientHeight, x: el.scrollLeft > 0 });
  };

  // Janela de linhas desenhadas (+ folga); recua até a linha que abre uma mescla que entra na janela.
  let from = Math.max(0, Math.floor(scroll.top / ROW_H) - 12);
  const to = Math.min(bodyRows.length, Math.ceil((scroll.top + scroll.height) / ROW_H) + 12);
  while (from > 0 && cols.some((c) => {
    const a = covered?.get(`${bodyRows[from]}:${c}`);
    return !!a && a[0] < bodyRows[from];
  }))
    from--;
  const windowRows = bodyRows.slice(from, to);
  const lastWindowRow = windowRows[windowRows.length - 1] ?? -1;
  const spanOf = (r: number, c: number, cell: LaidCell | null, overflow: number, lastRow: number) => {
    if (!cell?.merge) return { rowSpan: 1, colSpan: overflow };
    const rs = bodyRows.slice(rowIndex.get(r) ?? 0).filter((x) => x < r + cell.merge!.rows && x <= lastRow).length || 1;
    const cs = cols.filter((x) => x >= c && x < c + cell.merge!.cols).length || 1;
    return { rowSpan: rs, colSpan: cs };
  };

  /** Célula: estilo do arquivo (fundo, cor, itálico, alinhamento), seleção com 7 % de primary, ativa com contorno. */
  const cellProps = (r: number, c: number, cell: LaidCell | null, spans: { rowSpan: number; colSpan: number }, base = "dg-cell") => {
    const pin = pinned(c) && spans.colSpan === 1;
    const isActive = r === active.r && c === active.c;
    const st = cell?.style;
    const negative = st?.negativeRed && typeof cell?.value === "number" && cell.value < 0;
    const numeric = cell && isNumericFormat(cell.format);
    const sel = inRange(r, c) && !isActive;
    const align = st?.align ?? (numeric ? "right" : "left");
    return {
      id: `${uid}-${r}-${c}`,
      role: "gridcell",
      "aria-selected": inRange(r, c),
      "data-cell": `${r}-${c}`,
      "data-pin": pin ? "" : undefined,
      "data-pin-edge": pin && cols.indexOf(c) === freeze - 1 ? "left" : undefined,
      rowSpan: spans.rowSpan > 1 ? spans.rowSpan : undefined,
      colSpan: spans.colSpan > 1 ? spans.colSpan : undefined,
      onMouseDown: (e: React.MouseEvent) => pointer(r, c, e.shiftKey),
      title: cell?.style?.wrap || (cell && formatCell(cell).length > 40) ? formatCell(cell) : undefined,
      className: cn(
        base,
        "cursor-cell text-[13px]",
        st?.wrap ? "whitespace-normal leading-[16px]" : "whitespace-nowrap",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        numeric && "tabular-nums",
        (cell?.bold || base === "dg-tf") && "font-semibold",
        st?.italic && "italic",
        (st?.underline || st?.strike) && cn(st.underline && "underline", st.strike && "line-through"),
        !st?.color && !negative && "text-ink",
        pin && "sticky",
        isActive && "shadow-[inset_0_0_0_1.5px_var(--color-primary)]",
      ),
      style: {
        left: pin ? leftOf(c) : undefined,
        color: negative ? "var(--ds-rose)" : st?.color,
        ...(st?.fill ? { "--dg-row-bg": sel ? `color-mix(in oklab, var(--ds-primary) 14%, ${st.fill})` : st.fill } : sel ? { "--dg-row-bg": "color-mix(in oklab, var(--ds-primary) 7%, var(--ds-surface))" } : {}),
        ...(base === "dg-th" && st?.fill ? { background: st.fill } : {}),
      } as CSSProperties,
    };
  };
  const content = (cell: LaidCell | null) => <span className={cn("block", cell?.style?.wrap ? "line-clamp-2" : "truncate")}>{cell ? formatCell(cell) : ""}</span>;

  const head = hasHeader ? rows[headerRow] : null;
  const total = totalRow !== null ? rows[totalRow] : null;
  const tableWidth = ROWNUM + cols.reduce((a, c) => a + (px.get(c) ?? 0), 0);

  return (
    <section aria-label={workbook.title} className={frame}>
      {bar}
      {tabs}
      {introBlock}
      <div
        ref={gridRef}
        role="grid"
        aria-label={`Aba ${sheet.name}`}
        aria-rowcount={rows.length}
        aria-colcount={colCount + 1}
        aria-activedescendant={`${uid}-${active.r}-${active.c}`}
        aria-multiselectable
        tabIndex={0}
        onKeyDown={onKey}
        onScroll={onScroll}
        data-density="compact"
        data-scrolled-x={scroll.x || undefined}
        data-scrolled-y={scroll.top > 0 || undefined}
        className="data-grid relative min-h-0 flex-1 overflow-auto border-t border-line outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/30"
      >
        <table role="presentation" className="border-separate border-spacing-0" style={{ width: tableWidth, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: ROWNUM }} />
            {cols.map((c) => (
              <col key={c} style={{ width: px.get(c) }} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              <th role="columnheader" data-pin="" className="dg-th sticky left-0 text-right font-normal" style={{ left: 0 }}>
                <span className="sr-only">Linha</span>
              </th>
              {head
                ? overflowSpans(head, headerRow, cols, new Map(cols.map((c) => [c, 0])), covered).map(({ c }) => {
                    const cell = head[c];
                    const spans = spanOf(headerRow, c, cell, 1, headerRow);
                    const p = cellProps(headerRow, c, cell, spans, "dg-th");
                    const numericCol = isNumericFormat(rows[bodyFrom]?.[c]?.format ?? "text");
                    return (
                      <th key={c} {...p} role="columnheader" title={cell?.note ? `${columnLetter(c)} · ${cell.note}` : `Coluna ${columnLetter(c)}`} className={cn(p.className, "font-medium", !cell?.style?.align && (numericCol ? "text-right" : "text-left"), !cell?.style?.color && "text-muted", c >= c0 && c <= c1 && !cell?.style?.color && "text-ink")}>
                        <span className={cn("inline-flex max-w-full items-center gap-1", numericCol && !cell?.style?.align && "flex-row-reverse")}>
                          <span className="truncate">{cell ? formatCell(cell) : ""}</span>
                          {cell?.note && (
                            <span aria-hidden className="inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-muted ring-1 ring-line-strong">
                              ?
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })
                : cols.map((c) => (
                    <th key={c} role="columnheader" data-pin={pinned(c) ? "" : undefined} className={cn("dg-th text-center font-normal", c >= c0 && c <= c1 && "text-ink", pinned(c) && "sticky")} style={{ left: pinned(c) ? leftOf(c) : undefined }}>
                      {columnLetter(c)}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {from > 0 && (
              <tr aria-hidden style={{ height: from * ROW_H }}>
                <td colSpan={cols.length + 1} className="p-0" />
              </tr>
            )}
            {windowRows.map((r) => {
              const row = rows[r];
              return (
                <tr key={r} role="row" data-row="" aria-rowindex={r + 1} style={{ height: ROW_H }}>
                  <td data-pin="" className={cn("dg-cell sticky left-0 text-right text-[11.5px] tabular-nums", r >= r0 && r <= r1 ? "font-medium text-ink" : "text-muted")} style={{ left: 0 }}>
                    {r + 1}
                  </td>
                  {overflowSpans(row, r, cols, px, covered).map(({ c, span }) => {
                    const cell = row[c];
                    return (
                      <td key={c} {...cellProps(r, c, cell, spanOf(r, c, cell, span, lastWindowRow))}>
                        {content(cell)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {to < bodyRows.length && (
              <tr aria-hidden style={{ height: (bodyRows.length - to) * ROW_H }}>
                <td colSpan={cols.length + 1} className="p-0" />
              </tr>
            )}
            {bodyRows.length === 0 && (
              <tr role="row">
                <td colSpan={cols.length + 1} className="p-0">
                  <Empty title="Aba vazia" hint="Não há linhas nesta aba." framed={false} />
                </td>
              </tr>
            )}
          </tbody>
          {total && totalRow !== null && (
            <tfoot>
              <tr role="row" aria-rowindex={totalRow + 1}>
                <td data-pin="" className="dg-tf sticky left-0 text-right text-[11.5px] font-normal text-muted" style={{ left: 0 }}>
                  {totalRow + 1}
                </td>
                {cols.map((c) => (
                  <td key={c} {...cellProps(totalRow, c, total[c], { rowSpan: 1, colSpan: 1 }, "dg-tf")}>
                    {content(total[c])}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <footer className="flex h-9 shrink-0 items-center gap-3 border-t border-line px-3 text-[12px] text-muted">
        <span className="shrink-0 font-mono text-[11.5px] font-medium tabular-nums text-ink" aria-label="Seleção">
          {address}
        </span>
        <span className="min-w-0 flex-1 truncate" aria-label="Conteúdo da célula">
          {single && activeCell?.formula ? (
            <>
              <code className="font-mono text-[11.5px] text-ink-soft">={activeCell.formula}</code>
              {activeCell.value !== null && activeCell.value !== undefined && <span className="text-muted"> → {formatCell(activeCell)}</span>}
            </>
          ) : single && activeCell ? (
            formatCell(activeCell)
          ) : null}
        </span>
        {sheet.truncated && <span className="shrink-0 max-sm:hidden">Primeiras {formatNumber(OFFICE_SHEET_LIMITS.rows)} linhas</span>}
        {!sheet.truncated && bodyRows.length > 200 && <span className="shrink-0 tabular-nums max-sm:hidden">{formatNumber(bodyRows.length)} linhas</span>}
        {nums.length > 1 && (
          <span className="flex shrink-0 items-center gap-3 tabular-nums max-sm:hidden" aria-live="polite">
            <span>
              Soma <span className="font-medium text-ink">{stat(sum)}</span>
            </span>
            <span>
              Média <span className="font-medium text-ink">{stat(sum / nums.length)}</span>
            </span>
            <span>
              Contagem <span className="font-medium text-ink">{filled}</span>
            </span>
          </span>
        )}
      </footer>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* DocumentView                                                        */
/* ------------------------------------------------------------------ */

/** A4 a 96 dpi; margens iguais às do .docx (2 cm). */
const PAGE_W = 794;
const PAGE_H = 1123;
const PAD_X = 76;
const PAD_TOP = 96;
const PAD_BOTTOM = 80;
const CONTENT_W = PAGE_W - PAD_X * 2;
/** Folga para o arredondamento das linhas na prévia com zoom (tabelas longas acumulam alguns px). */
const CONTENT_H = PAGE_H - PAD_TOP - PAD_BOTTOM - 12;

type PagePiece = { index: number; rows?: [number, number]; last?: boolean };
type DocPage = { kind: "cover" } | { kind: "toc" } | { kind: "content"; pieces: PagePiece[] };

function Runs({ text }: { text: DocText }) {
  return (
    <>
      {docRuns(text).map((r, i) => {
        let node: ReactNode = r.text;
        if (r.bold) node = <strong className="font-semibold text-ink">{node}</strong>;
        if (r.italic) node = <em>{node}</em>;
        if (r.underline || r.strike || r.color || r.highlight)
          // Cor e realce vêm do arquivo (dado de quem escreveu); o realce leva texto escuro para ler nos dois temas.
          node = (
            <span className={cn(r.underline && "underline underline-offset-2", r.strike && "line-through", r.highlight && "rounded-[2px] px-0.5")} style={{ color: r.highlight ? "var(--ds-graph)" : r.color, background: r.highlight }}>
              {node}
            </span>
          );
        if (r.href)
          node = (
            <a href={r.href} className="text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink">
              {node}
            </a>
          );
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

const calloutTone = { neutral: "border-line-strong", info: "border-info", ok: "border-ok", amber: "border-amber", rose: "border-rose" } as const;
const alignClass = { left: "", center: "text-center", right: "text-right", justify: "text-justify hyphens-auto" } as const;

/** Numeração hierárquica para listas escritas em código com níveis: 1., 1.1., 1.1.1. */
function listMarkers(block: Extract<DocBlock, { type: "list" }>) {
  if (block.markers) return block.markers;
  const levels = block.levels ?? block.items.map(() => 0);
  const count: number[] = [];
  return levels.map((lvl) => {
    if (!block.ordered) return "";
    count[lvl] = (count[lvl] ?? 0) + 1;
    count.length = lvl + 1;
    return `${count.map((n) => n ?? 1).join(".")}.`;
  });
}

/** Desenha um bloco do documento. `rows` recorta (linhas do corpo) uma tabela que continua em outra página. */
function DocBlockView({ block, rows, last = true, headingId, toc }: { block: DocBlock; rows?: [number, number]; last?: boolean; headingId?: string; /** Conteúdo do bloco "toc" (o sumário com páginas, montado pelo DocumentView). */ toc?: ReactNode }) {
  switch (block.type) {
    case "toc":
      return <div className="pb-6">{toc}</div>;
    case "heading": {
      const level = block.level ?? 1;
      const align = alignClass[block.align ?? "left"];
      if (level === 1) return <h3 id={headingId} className={cn("m-0 scroll-mt-6 pb-2.5 pt-5 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink", align)}>{block.text}</h3>;
      if (level === 2) return <h4 id={headingId} className={cn("m-0 scroll-mt-6 pb-2 pt-4 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-ink", align)}>{block.text}</h4>;
      return <h5 className={cn("m-0 pb-1.5 pt-3 text-[15px] font-semibold text-ink-soft", align)}>{block.text}</h5>;
    }
    case "paragraph":
      return (
        <p className={cn("m-0 whitespace-pre-line pb-3.5 text-[14px] leading-[1.6] text-ink-soft", alignClass[block.align ?? "left"])}>
          <Runs text={block.text} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      const markers = listMarkers(block);
      const levels = block.levels ?? [];
      const width = Math.max(1, ...markers.map((m) => m.length));
      return (
        <List className="m-0 flex list-none flex-col gap-1.5 p-0 pb-3.5">
          {block.items.map((it, i) => {
            const m = markers[i];
            const bullet = !m || m.length === 1;
            return (
              <li key={i} className="flex items-baseline gap-2.5 text-[14px] leading-[1.6] text-ink-soft" style={{ paddingLeft: (levels[i] ?? 0) * 22 }}>
                {/* Mesma coluna para número e marcador: itens misturados ficam alinhados. */}
                <span className="flex shrink-0 justify-end text-[13px] font-semibold tabular-nums text-accent-deep" style={{ minWidth: `${Math.min(Math.max(width, 2), 8) * 0.6}em` }}>
                  {bullet ? <span aria-hidden className={cn("relative top-[-2px] h-1.5 w-1.5 self-center rounded-full", (levels[i] ?? 0) % 2 ? "border border-accent" : "bg-accent")} /> : m}
                </span>
                <span className="min-w-0 whitespace-pre-line">
                  <Runs text={it} />
                </span>
              </li>
            );
          })}
        </List>
      );
    }
    case "table": {
      const headerRows = block.headerRows ?? -1; // -1: cabeçalho vem de columns[].header
      const body = headerRows > 0 ? block.rows.slice(headerRows) : block.rows;
      const offset = Math.max(0, headerRows);
      const [from, to] = rows ?? [0, body.length];
      const weights = block.columns.map((c) => c.width ?? 1);
      const total = weights.reduce((a, b) => a + b, 0);
      const covered = new Set<string>();
      for (const [key, [rs, cs]] of Object.entries(block.spans ?? {})) {
        const [r, c] = key.split(":").map(Number);
        for (let y = r; y < r + rs; y++) for (let x = c; x < c + cs; x++) if (y !== r || x !== c) covered.add(`${y}:${x}`);
      }
      const numeric = (i: number) => isNumericFormat(block.columns[i]?.format ?? "text");
      const cells = (row: CellValue[], r: number, header: boolean, lastRow: number) =>
        block.columns.flatMap((c, i) => {
          if (covered.has(`${r}:${i}`)) return [];
          const [rs, cs] = block.spans?.[`${r}:${i}`] ?? [1, 1];
          const fill = block.fills?.[`${r}:${i}`];
          const Tag = header ? "th" : "td";
          return [
            <Tag
              key={i}
              scope={header ? "col" : undefined}
              rowSpan={Math.min(rs, lastRow - r + 1) > 1 ? Math.min(rs, lastRow - r + 1) : undefined}
              colSpan={cs > 1 ? cs : undefined}
              className={cn(
                "whitespace-pre-line px-2.5 align-top",
                header ? "py-2 text-left text-[12px] font-semibold text-ink" : "py-1.5 text-ink",
                numeric(i) && cs === 1 && "text-right tabular-nums",
                header && "border-b border-line-strong",
                (block.spans || block.fills) && "border border-line",
              )}
              style={fill ? { background: fill, color: "var(--ds-graph)" } : undefined}
            >
              {formatCell({ value: row[i], format: c.format ?? "text", digits: c.digits })}
            </Tag>,
          ];
        });
      return (
        <div className="pb-4">
          <table className="w-full border-collapse text-[13px]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {weights.map((w, i) => (
                <col key={i} style={{ width: `${(w / total) * 100}%` }} />
              ))}
            </colgroup>
            {headerRows !== 0 && (
              <thead data-measure="head" className="bg-soft">
                {headerRows > 0 ? (
                  block.rows.slice(0, headerRows).map((row, r) => <tr key={r}>{cells(row, r, true, headerRows - 1)}</tr>)
                ) : (
                  <tr>
                    {block.columns.map((c, i) => (
                      <th key={i} scope="col" className={cn("border-b border-line-strong px-2.5 py-2 text-left text-[12px] font-semibold text-ink", numeric(i) && "text-right")}>
                        {c.header}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
            )}
            <tbody>
              {body.slice(from, to).map((row, k) => {
                const r = offset + from + k;
                const isTotal = block.totalRow && from + k === body.length - 1;
                return (
                  <tr key={r} data-measure="row" className={cn(isTotal ? "border-t border-line-strong bg-soft font-semibold" : "border-b border-line")}>
                    {cells(row, r, false, offset + to - 1)}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {block.caption && last && <p className="m-0 pt-2 text-[11.5px] text-muted">{block.caption}</p>}
        </div>
      );
    }
    case "stats":
      return (
        <div className="grid gap-6 pb-5 pt-1" style={{ gridTemplateColumns: `repeat(${block.items.length}, minmax(0, 1fr))` }}>
          {block.items.map((s, i) => (
            <div key={i} className="border-t-2 border-line-strong pt-3">
              <div className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink">{s.value}</div>
              <div className="mt-2 text-[12px] text-muted">{s.label}</div>
              {s.delta && <div className={cn("mt-1 text-[12px] font-medium", s.good === false ? "text-rose" : s.good ? "text-ok" : "text-ink-soft")}>{s.delta}</div>}
            </div>
          ))}
        </div>
      );
    case "callout":
      return (
        <div className="pb-4">
          <div className={cn("rounded-r-md border-l-4 bg-soft px-4 py-3", calloutTone[block.tone ?? "neutral"])}>
            {block.title && <p className="m-0 pb-1 text-[14px] font-semibold text-ink">{block.title}</p>}
            <p className="m-0 text-[13.5px] leading-[1.55] text-ink-soft">
              <Runs text={block.text} />
            </p>
          </div>
        </div>
      );
    case "quote":
      return (
        <figure className="m-0 pb-5 pt-1">
          <blockquote className="m-0 border-l-[3px] border-accent pl-5 text-[17px] leading-[1.5] text-ink">“{block.text}”</blockquote>
          {block.author && (
            <figcaption className="pl-5 pt-2 text-[12.5px]">
              <span className="font-semibold text-ink">{block.author}</span>
              {block.role && <span className="text-muted"> · {block.role}</span>}
            </figcaption>
          )}
        </figure>
      );
    case "signatures":
      return (
        <div className="grid gap-10 pb-4 pt-14" style={{ gridTemplateColumns: `repeat(${block.people.length}, minmax(0, 1fr))` }}>
          {block.people.map((p, i) => (
            <div key={i} className="border-t border-ink pt-2">
              <p className="m-0 text-[13px] font-semibold text-ink">{p.name}</p>
              {p.role && <p className="m-0 text-[12px] text-muted">{p.role}</p>}
            </div>
          ))}
        </div>
      );
    case "image": {
      const width = Math.min(block.width ?? CONTENT_W, CONTENT_W);
      return (
        <figure className="m-0 pb-4">
          <img src={block.src} alt={block.alt ?? ""} className="block max-w-full rounded-sm object-contain" style={{ width, height: Math.round(width * (block.ratio ?? 9 / 16)) }} />
          {block.caption && <figcaption className="pt-2 text-[11.5px] text-muted">{block.caption}</figcaption>}
        </figure>
      );
    }
    case "divider":
      return <hr className="m-0 mb-5 mt-2 border-0 border-t border-line" />;
    case "pageBreak":
      return null;
  }
}

/**
 * Distribui os blocos em páginas a partir das alturas medidas. Título não fica
 * sozinho no pé da página; tabela grande continua na seguinte com o cabeçalho.
 */
function paginate(blocks: DocBlock[], heights: Map<number, { h: number; head?: number; rows?: number[]; caption?: number }>): DocPage[] {
  const pages: { pieces: PagePiece[]; used: number }[] = [{ pieces: [], used: 0 }];
  let cur = pages[0];
  const newPage = (keepHeading = true) => {
    const moved: PagePiece[] = [];
    // Título no fim da página vai junto com o bloco seguinte.
    while (keepHeading && cur.pieces.length > 1 && blocks[cur.pieces[cur.pieces.length - 1].index].type === "heading") moved.unshift(cur.pieces.pop()!);
    cur = { pieces: moved, used: moved.reduce((a, p) => a + (heights.get(p.index)?.h ?? 0), 0) };
    pages.push(cur);
  };
  blocks.forEach((b, index) => {
    const m = heights.get(index);
    if (b.type === "pageBreak") {
      if (cur.pieces.length) newPage(false);
      return;
    }
    if (!m) return;
    if (b.type === "table" && m.rows && m.head !== undefined) {
      const n = m.rows.length;
      const pad = m.h - m.head - m.rows.reduce((a, x) => a + x, 0) - (m.caption ?? 0);
      let r = 0;
      if (n === 0) {
        if (cur.used + m.h > CONTENT_H && cur.pieces.length) newPage();
        cur.pieces.push({ index, rows: [0, 0], last: true });
        cur.used += m.h;
        return;
      }
      while (r < n) {
        const avail = CONTENT_H - cur.used;
        if (m.head + m.rows[r] + pad > avail && cur.pieces.length) {
          newPage();
          continue;
        }
        let k = r;
        let used = m.head + pad;
        while (k < n && used + m.rows[k] <= CONTENT_H - cur.used) used += m.rows[k++];
        if (k === r) used += m.rows[k++]; // linha maior que a página: entra mesmo assim
        const last = k === n;
        if (last) used += m.caption ?? 0;
        cur.pieces.push({ index, rows: [r, k], last });
        cur.used += used;
        r = k;
        if (!last) newPage(false);
      }
      return;
    }
    if (cur.used + m.h > CONTENT_H && cur.pieces.length) newPage();
    cur.pieces.push({ index });
    cur.used += m.h;
  });
  return pages.filter((p) => p.pieces.length).map((p) => ({ kind: "content" as const, pieces: p.pieces }));
}

/** Imprime só as páginas (Salvar como PDF no diálogo do navegador). */
function printPages(source: HTMLElement, title: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) return frame.remove();
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join("");
  const safeTitle = title.replace(/[<>&"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const page = "@page{size:A4;margin:0}html,body{margin:0;background:var(--ds-surface)}[data-doc-page]{box-shadow:none!important;border-radius:0!important;margin:0!important;break-after:page;outline:0!important}[data-doc-page]:last-child{break-after:auto}";
  win.document.open();
  win.document.write(`<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><title>${safeTitle}</title>${styles}<style>${page}</style></head><body class="font-sans text-ink">${source.innerHTML}</body></html>`);
  win.document.close();
  const go = () => {
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  };
  const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
  setTimeout(() => (fonts ? fonts.ready.then(go) : go()), 250);
}

/**
 * Documento paginado em A4, com a mesma estrutura do .docx exportado: capa,
 * sumário com número de página, cabeçalho e "Página X de Y", tabelas que
 * continuam na página seguinte repetindo o cabeçalho. Navegação pelo sumário
 * lateral; Imprimir gera PDF pelo navegador.
 */
export function DocumentView({
  document: doc,
  actions,
  loading,
  showOutline = true,
  className,
}: {
  /** Escrito em código ou lido de um .docx (readOfficeFile). */
  document: OfficeDocument;
  /** Ações na barra do visualizador (ex.: botão "Baixar .docx" do app). */
  actions?: ReactNode;
  loading?: boolean;
  /** Sumário lateral (a partir de 768 px). */
  showOutline?: boolean;
  className?: string;
}) {
  const uid = useId();
  const measureRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [stageRef, stageWidth] = useWidth<HTMLDivElement>();
  const [content, setContent] = useState<DocPage[] | null>(null);
  const [current, setCurrent] = useState(0);
  const outline = useMemo(() => documentOutline(doc), [doc]);
  const showCover = doc.cover !== false;

  const measure = () => {
    const root = measureRef.current;
    if (!root) return;
    const heights = new Map<number, { h: number; head?: number; rows?: number[]; caption?: number }>();
    root.querySelectorAll<HTMLElement>("[data-block]").forEach((el) => {
      const index = Number(el.dataset.block);
      const h = el.getBoundingClientRect().height;
      if (doc.blocks[index]?.type === "table") {
        const head = el.querySelector<HTMLElement>('[data-measure="head"]')?.getBoundingClientRect().height ?? 0;
        const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-measure="row"]')).map((tr) => tr.getBoundingClientRect().height);
        const caption = el.querySelector("p")?.getBoundingClientRect().height ?? 0;
        heights.set(index, { h, head, rows, caption });
      } else heights.set(index, { h });
    });
    setContent(paginate(doc.blocks, heights));
  };
  useLayoutEffect(() => {
    measure();
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mede de novo quando o documento muda
  }, [doc]);

  // Sumário: no lugar do bloco "toc" (como no .docx) ou numa página depois da capa.
  const tocInline = doc.blocks.some((b) => b.type === "toc");
  const tocList = (numbers: boolean) => (
    <>
      <h3 className="m-0 pb-6 text-[24px] font-semibold tracking-[-0.02em]">Sumário</h3>
      <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
        {outline.map((h) => (
          <li key={h.index}>
            <button type="button" tabIndex={numbers ? undefined : -1} onClick={() => goTo(h.index)} className={cn("flex w-full items-baseline gap-2 rounded-sm py-1 text-left hover:text-ink focus-visible:outline-2", h.level === 1 ? "text-[14px] font-medium text-ink" : "pl-5 text-[13.5px] text-ink-soft")}>
              <span className="min-w-0">{h.text}</span>
              <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-line-strong" />
              <span className="tabular-nums text-muted">{numbers && content ? pageOf[h.index] : ""}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
  const pages: DocPage[] = [...(showCover ? [{ kind: "cover" as const }] : []), ...(doc.toc && !tocInline ? [{ kind: "toc" as const }] : []), ...(content ?? [{ kind: "content" as const, pieces: doc.blocks.map((_, index) => ({ index })) }])];
  const pageOf: Record<number, number> = {};
  pages.forEach((p, i) => {
    if (p.kind === "content") p.pieces.forEach((piece) => (pageOf[piece.index] ??= i + 1));
  });

  const scale = stageWidth ? Math.min(1, (stageWidth - (stageWidth < 640 ? 24 : 64)) / PAGE_W) : 1;
  const onScroll = () => {
    const stage = stageRef.current;
    const list = pagesRef.current;
    if (!stage || !list) return;
    const top = stage.getBoundingClientRect().top + stage.clientHeight / 3;
    const els = Array.from(list.querySelectorAll<HTMLElement>("[data-doc-page]"));
    let i = 0;
    els.forEach((el, k) => {
      if (el.getBoundingClientRect().top <= top) i = k;
    });
    setCurrent(i);
  };
  const goTo = (blockIndex: number) => document.getElementById(`${uid}-h${blockIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const date = formatCell({ value: doc.date ?? new Date(), format: "date" });
  const print = () => pagesRef.current && printPages(pagesRef.current, doc.title);

  const pageChrome = (i: number, children: ReactNode, chrome = true) => (
    <article
      key={i}
      data-doc-page
      aria-label={`Página ${i + 1} de ${pages.length}`}
      className="relative overflow-hidden bg-surface text-ink shadow-raised ring-1 ring-line"
      style={{ width: PAGE_W, minHeight: PAGE_H, padding: `${PAD_TOP}px ${PAD_X}px ${PAD_BOTTOM}px` }}
    >
      {chrome && (
        <div className="absolute border-b border-line pb-1 text-[10px] text-muted" style={{ top: 44, left: PAD_X, right: PAD_X }}>
          {doc.header ?? doc.title}
        </div>
      )}
      {children}
      {chrome && (
        <div className="absolute flex justify-between text-[10px] tabular-nums text-muted" style={{ bottom: 36, left: PAD_X, right: PAD_X }}>
          <span>{doc.footer}</span>
          <span>
            Página {i + 1} de {pages.length}
          </span>
        </div>
      )}
    </article>
  );

  const renderPage = (p: DocPage, i: number) => {
    if (p.kind === "cover")
      return (
        <article
          key="cover"
          data-doc-page
          aria-label={`Capa · página 1 de ${pages.length}`}
          className="relative flex flex-col overflow-hidden bg-surface text-ink shadow-raised ring-1 ring-line"
          style={{ width: PAGE_W, height: PAGE_H, padding: `280px ${PAD_X}px ${PAD_BOTTOM + 16}px` }}
        >
          {doc.kicker && (
            <div className="mb-4 flex items-center gap-3 text-[12.5px] font-medium uppercase tracking-[0.14em] text-accent-deep">
              <span aria-hidden className="h-[2px] w-9 bg-accent" />
              {doc.kicker}
            </div>
          )}
          <h2 className="m-0 max-w-[600px] text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">{doc.title}</h2>
          {doc.subtitle && <p className="m-0 mt-5 max-w-[560px] text-[18px] leading-[1.45] text-muted">{doc.subtitle}</p>}
          <div className="mt-auto flex items-baseline justify-between border-t border-line pt-3 text-[12.5px]">
            <span className="text-ink-soft">{doc.author}</span>
            <span className="tabular-nums text-muted">{date}</span>
          </div>
        </article>
      );
    if (p.kind === "toc") return pageChrome(i, tocList(true));
    return pageChrome(
      i,
      p.pieces.map((piece) => (
        <DocBlockView key={`${piece.index}-${piece.rows?.[0] ?? 0}`} block={doc.blocks[piece.index]} rows={piece.rows} last={piece.last ?? true} headingId={!piece.rows ? `${uid}-h${piece.index}` : undefined} toc={tocList(true)} />
      )),
    );
  };

  const currentHeading = [...outline].reverse().find((h) => (pageOf[h.index] ?? 0) <= current + 1)?.index;
  // Sumário agrupado: títulos de nível 2 ficam sob o nível 1 anterior, com linha-guia (como o SectionNav).
  const groups: { h: (typeof outline)[number]; children: typeof outline }[] = [];
  for (const h of outline) {
    if (h.level === 2 && groups.length) groups[groups.length - 1].children.push(h);
    else groups.push({ h, children: [] });
  }
  const outlineItem = (h: (typeof outline)[number], sub: boolean) => {
    const on = h.index === currentHeading;
    return (
      <button
        type="button"
        onClick={() => goTo(h.index)}
        aria-current={on ? "location" : undefined}
        className={cn(
          "relative flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[12.5px] transition-colors duration-150",
          on ? "bg-surface font-medium text-ink shadow-surface ring-1 ring-line-strong" : sub ? "text-muted hover:bg-soft hover:text-ink" : "text-ink-soft hover:bg-soft hover:text-ink",
        )}
      >
        {on && <span aria-hidden className={cn("absolute top-1/2 w-[3px] -translate-y-1/2 bg-nav-marker", sub ? "-left-[14px] h-3.5 rounded-full" : "left-0 h-4 rounded-r-full")} />}
        <span className="min-w-0 flex-1 truncate">{h.text}</span>
        <span className="shrink-0 text-[11px] tabular-nums text-muted">{content ? pageOf[h.index] : ""}</span>
      </button>
    );
  };

  return (
    <section aria-label={doc.title} aria-busy={loading || undefined} className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <ViewerBar icon={<FileText />} title={doc.title} meta={loading ? undefined : `${current + 1} / ${pages.length}`}>
        <button type="button" onClick={print} disabled={loading} className={viewerTool} title="Imprimir ou salvar em PDF">
          <Printer /> <span className="max-sm:sr-only">Imprimir</span>
        </button>
        {actions}
      </ViewerBar>
      <div className="flex min-h-0 flex-1">
        {showOutline && outline.length > 0 && !loading && (
          <nav aria-label="Sumário do documento" className="hidden w-[232px] shrink-0 overflow-y-auto border-r border-line bg-soft/50 px-2 py-3 md:block">
            <p className="m-0 mb-1 flex h-8 items-center px-2 text-[12.5px] font-semibold text-ink">Sumário</p>
            <ul className="m-0 list-none p-0">
              {groups.map(({ h, children }) => (
                <li key={h.index} className="mb-0.5">
                  {outlineItem(h, false)}
                  {children.length > 0 && (
                    <ul className="m-0 ml-2 list-none border-l border-line p-0 py-0.5 pl-3">
                      {children.map((c) => (
                        <li key={c.index} className="relative">
                          {outlineItem(c, true)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div ref={stageRef} onScroll={onScroll} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-soft/60">
          {loading ? (
            <div className="mx-auto my-6 flex w-full max-w-[600px] flex-col gap-3 bg-surface p-10 ring-1 ring-line">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-4 h-24 w-full" />
            </div>
          ) : (
            <div ref={pagesRef} className="mx-auto flex w-fit flex-col gap-6 py-6" style={{ zoom: scale }}>
              {pages.map(renderPage)}
            </div>
          )}
        </div>
      </div>
      {/* Medidor: mesmos blocos, largura útil da página, fora da tela. */}
      <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute left-[-10000px] top-0" style={{ width: CONTENT_W }}>
        {doc.blocks.map((b, index) =>
          b.type === "pageBreak" ? null : (
            <div key={index} data-block={index} className="flow-root">
              <DocBlockView block={b} toc={tocList(false)} />
            </div>
          ),
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Apresentação lida de .pptx                                          */
/* ------------------------------------------------------------------ */

const ALIGN = { left: "left", center: "center", right: "right", justify: "justify" } as const;

/** Contorno das formas do PowerPoint mais usadas, em pontos (px) dentro da caixa w × h. Retângulo, arredondado e elipse vão por CSS. */
function shapePolygon(geom: string | undefined, w: number, h: number): [number, number][] | null {
  const m = Math.min(w, h);
  const tip = m * 0.5;
  switch (geom) {
    case "triangle":
    case "flowChartExtract":
      return [[w / 2, 0], [w, h], [0, h]];
    case "rtTriangle":
      return [[0, 0], [w, h], [0, h]];
    case "diamond":
    case "flowChartDecision":
      return [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]];
    case "parallelogram":
    case "flowChartInputOutput":
      return [[m * 0.25, 0], [w, 0], [w - m * 0.25, h], [0, h]];
    case "trapezoid":
      return [[m * 0.25, 0], [w - m * 0.25, 0], [w, h], [0, h]];
    case "pentagon":
    case "homePlate":
      return [[0, 0], [w - tip, 0], [w, h / 2], [w - tip, h], [0, h]];
    case "chevron":
      return [[0, 0], [w - tip, 0], [w, h / 2], [w - tip, h], [0, h], [tip, h / 2]];
    case "hexagon":
      return [[m * 0.25, 0], [w - m * 0.25, 0], [w, h / 2], [w - m * 0.25, h], [m * 0.25, h], [0, h / 2]];
    case "octagon": {
      const o = m * 0.29;
      return [[o, 0], [w - o, 0], [w, o], [w, h - o], [w - o, h], [o, h], [0, h - o], [0, o]];
    }
    case "rightArrow":
      return [[0, h * 0.25], [w - tip, h * 0.25], [w - tip, 0], [w, h / 2], [w - tip, h], [w - tip, h * 0.75], [0, h * 0.75]];
    case "leftArrow":
      return [[w, h * 0.25], [tip, h * 0.25], [tip, 0], [0, h / 2], [tip, h], [tip, h * 0.75], [w, h * 0.75]];
    case "upArrow":
      return [[w * 0.25, h], [w * 0.25, tip], [0, tip], [w / 2, 0], [w, tip], [w * 0.75, tip], [w * 0.75, h]];
    case "downArrow":
      return [[w * 0.25, 0], [w * 0.75, 0], [w * 0.75, h - tip], [w, h - tip], [w / 2, h], [0, h - tip], [w * 0.25, h - tip]];
    case "plus":
    case "mathPlus": {
      const t = m * 0.25;
      return [[w / 2 - t, 0], [w / 2 + t, 0], [w / 2 + t, h / 2 - t], [w, h / 2 - t], [w, h / 2 + t], [w / 2 + t, h / 2 + t], [w / 2 + t, h], [w / 2 - t, h], [w / 2 - t, h / 2 + t], [0, h / 2 + t], [0, h / 2 - t], [w / 2 - t, h / 2 - t]];
    }
    case "star5": {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 0.38 : 0.5;
        pts.push([w / 2 + Math.cos(a) * w * r, h / 2 + Math.sin(a) * h * r * 1.05]);
      }
      return pts;
    }
    default:
      return null;
  }
}

/** Área de texto dentro da forma (o PowerPoint não escreve na ponta da seta nem fora da elipse): [cima, direita, baixo, esquerda]. */
function textRect(geom: string | undefined, w: number, h: number): [number, number, number, number] {
  const tip = Math.min(w, h) * 0.5;
  switch (geom) {
    case "chevron":
      return [0, tip, 0, tip];
    case "homePlate":
    case "pentagon":
      return [0, tip, 0, 0];
    case "rightArrow":
      return [h * 0.25, tip * 0.5, h * 0.25, 0];
    case "leftArrow":
      return [h * 0.25, 0, h * 0.25, tip * 0.5];
    case "ellipse":
      return [h * 0.146, w * 0.146, h * 0.146, w * 0.146];
    case "triangle":
      return [h * 0.5, w * 0.25, 0, w * 0.25];
    case "diamond":
    case "flowChartDecision":
      return [h * 0.25, w * 0.25, h * 0.25, w * 0.25];
    case "hexagon":
    case "octagon":
      return [0, Math.min(w, h) * 0.25, 0, Math.min(w, h) * 0.25];
    default:
      return [0, 0, 0, 0];
  }
}

/** Tema do DS dentro do slide: claro sobre fundo claro, escuro sobre fundo escuro (gráficos e tabelas do DS legíveis). */
function slideTheme(background?: string) {
  const hex = /#([0-9A-Fa-f]{6})/.exec(background ?? "")?.[1];
  if (!hex) return "light";
  const n = parseInt(hex, 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l < 0.45 ? "dark" : "light";
}

/**
 * Um slide de .pptx no canvas de 1280×720 do DS. Vêm do arquivo: posição,
 * tamanho, fundo (cor, degradê, imagem), elementos do modelo (logo, faixas),
 * formas, linhas e setas, imagens recortadas, tabelas, gráficos (desenhados
 * com os gráficos do DS), fontes e espaçamento. Fonte que não estiver
 * instalada cai na do DS. Slides 4:3 ficam centralizados. Use com SlideDeck
 * via `presentationSlides`.
 */
export function OfficeSlide({ slide, aspect = 16 / 9, width = 960 }: { slide: PresentationSlide; aspect?: number; /** Largura do slide em pontos. */ width?: number }) {
  const uid = useId();
  const wide = aspect >= SLIDE_WIDTH / SLIDE_HEIGHT;
  const w = wide ? SLIDE_WIDTH : Math.round(SLIDE_HEIGHT * aspect);
  const h = wide ? Math.round(SLIDE_WIDTH / aspect) : SLIDE_HEIGHT;
  const k = w / width; // px por ponto
  const font = (name?: string) => (name ? `"${name}", var(--ds-font-sans)` : undefined);
  const box = (s: PresentationShape): CSSProperties => ({
    position: "absolute",
    left: s.x * w,
    top: s.y * h,
    width: Math.max(s.w * w, 1),
    height: Math.max(s.h * h, 1),
    transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
  });
  const radius = (s: PresentationShape) => (s.geometry === "ellipse" ? "50%" : s.geometry === "roundRect" ? Math.min(s.w * w, s.h * h) * 0.1667 : undefined);

  const render = (s: PresentationShape, i: number): ReactNode => {
    const bw = s.w * w;
    const bh = s.h * h;
    if (s.kind === "line") {
      const x1 = s.flipH ? bw : 0;
      const y1 = s.flipV ? bh : 0;
      const x2 = s.flipH ? 0 : bw;
      const y2 = s.flipV ? 0 : bh;
      const marker = `${uid}-a${i}`;
      const sw = Math.max(1, (s.lineWidth ?? 0.75) * k);
      return (
        <svg key={i} aria-hidden style={{ ...box(s), overflow: "visible" }} width={Math.max(bw, 1)} height={Math.max(bh, 1)}>
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={s.line} />
            </marker>
          </defs>
          <path
            d={s.elbow ? `M${x1} ${y1} H${(x1 + x2) / 2} V${y2} H${x2}` : `M${x1} ${y1} L${x2} ${y2}`}
            fill="none"
            stroke={s.line}
            strokeWidth={sw}
            strokeDasharray={s.lineDash ? `${sw * 3} ${sw * 2}` : undefined}
            markerStart={s.arrowStart ? `url(#${marker})` : undefined}
            markerEnd={s.arrowEnd ? `url(#${marker})` : undefined}
          />
        </svg>
      );
    }
    if (s.kind === "image") {
      const [l, t, r, b] = s.crop ?? [0, 0, 0, 0];
      const iw = bw / Math.max(0.01, 1 - l - r);
      const ih = bh / Math.max(0.01, 1 - t - b);
      return (
        <div key={i} style={{ ...box(s), overflow: "hidden", borderRadius: radius(s), opacity: s.opacity, border: s.line ? `${Math.max(1, (s.lineWidth ?? 0.75) * k)}px solid ${s.line}` : undefined, transform: cn(box(s).transform, s.flipH && "scaleX(-1)", s.flipV && "scaleY(-1)") || undefined }}>
          <img src={s.src} alt={s.alt ?? ""} style={{ position: "absolute", left: -l * iw, top: -t * ih, width: iw, height: ih, maxWidth: "none" }} />
        </div>
      );
    }
    if (s.kind === "chart" && s.chart)
      return (
        <div key={i} style={box(s)} className="flex flex-col overflow-hidden p-2">
          {s.chart.title && <p className="m-0 mb-2 text-center font-semibold text-ink" style={{ fontSize: 18 * k }}>{s.chart.title}</p>}
          <OfficeChartView chart={s.chart} showTitle={false} height={Math.max(120, bh - 16 - (s.chart.title ? 18 * k * 1.4 + 8 : 0) - (s.chart.series.length > 1 && s.chart.kind !== "pie" && s.chart.kind !== "doughnut" ? 32 : 0))} />
        </div>
      );
    if (s.kind === "table") {
      const styled = s.cells?.some((row) => row.some((c) => c?.fill));
      return (
        <div key={i} style={box(s)} className="overflow-hidden">
          <table className="w-full border-collapse" style={{ tableLayout: "fixed", fontSize: 14 * k }}>
            {s.colWidths && (
              <colgroup>
                {s.colWidths.map((cw, c) => (
                  <col key={c} style={{ width: `${cw * 100}%` }} />
                ))}
              </colgroup>
            )}
            <tbody>
              {s.rows?.map((row, r) => (
                <tr key={r} className={cn(!styled && (r === 0 ? "border-b border-line-strong font-semibold text-ink" : "border-b border-line text-ink-soft"))}>
                  {row.map((cell, c) => {
                    const st = s.cells?.[r]?.[c];
                    if (st?.covered) return null;
                    return (
                      <td
                        key={c}
                        rowSpan={st?.span && st.span[0] > 1 ? st.span[0] : undefined}
                        colSpan={st?.span && st.span[1] > 1 ? st.span[1] : undefined}
                        className={cn("whitespace-pre-line align-middle", styled && "border border-[color-mix(in_oklab,var(--ds-graph)_12%,transparent)]")}
                        style={{ padding: `${4 * k}px ${8 * k}px`, background: st?.fill, color: st?.color, fontWeight: st?.bold ? 600 : undefined, fontSize: st?.size ? st.size * k : undefined }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    const [t0, r0, b0, l0] = (s.inset ?? [0, 0, 0, 0]).map((v) => v * w);
    const [tt, tr, tb, tl] = textRect(s.geometry, bw, bh);
    const [t, r, b, l] = [t0 + tt, r0 + tr, b0 + tb, l0 + tl];
    const scale = s.fontScale ?? 1;
    const poly = shapePolygon(s.geometry, bw, bh);
    const sw = Math.max(1, (s.lineWidth ?? 0.75) * k);
    const flip = cn(s.flipH && "scaleX(-1)", s.flipV && "scaleY(-1)") || undefined;
    return (
      <div key={i} style={box(s)}>
        {poly ? (
          <>
            {s.fill && <div aria-hidden className="absolute inset-0" style={{ background: s.fill, clipPath: `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(", ")})`, transform: flip }} />}
            {s.line && (
              <svg aria-hidden className="absolute inset-0 overflow-visible" width={bw} height={bh} style={{ transform: flip }}>
                <polygon points={poly.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={s.line} strokeWidth={sw} strokeLinejoin="round" />
              </svg>
            )}
          </>
        ) : (
          (s.fill || s.line) && <div aria-hidden className="absolute inset-0" style={{ background: s.fill, border: s.line ? `${sw}px ${s.lineDash ? "dashed" : "solid"} ${s.line}` : undefined, borderRadius: radius(s) }} />
        )}
        <div className="relative flex h-full flex-col overflow-hidden" style={{ padding: `${t}px ${r}px ${b}px ${l}px`, justifyContent: s.anchor === "middle" ? "center" : s.anchor === "bottom" ? "flex-end" : "flex-start" }}>
          {s.paragraphs?.map((p, j) => {
            const size = (p.size ?? 18) * k * scale;
            return (
              <p
                key={j}
                className="m-0 flex"
                style={{
                  fontSize: size,
                  fontFamily: font(p.font),
                  color: p.color,
                  textAlign: ALIGN[p.align ?? "left"],
                  justifyContent: p.align === "center" ? "center" : p.align === "right" ? "flex-end" : undefined,
                  lineHeight: p.lineHeightPt ? `${p.lineHeightPt * k * scale}px` : 1.2 * (p.lineHeight ?? 1),
                  paddingLeft: (p.level ?? 0) * 36 * k,
                  marginTop: j && p.spaceBefore ? p.spaceBefore * k * scale : 0,
                  marginBottom: p.spaceAfter ? p.spaceAfter * k * scale : 0,
                }}
              >
                {p.bullet && <span className="shrink-0 pr-[0.5em]">{p.bullet}</span>}
                <span className="min-w-0 whitespace-pre-wrap">
                  {p.runs.length
                    ? p.runs.map((run, x) => (
                        <span
                          key={x}
                          style={{
                            fontWeight: run.bold ? 700 : undefined,
                            fontStyle: run.italic ? "italic" : undefined,
                            textDecoration: cn(run.underline && "underline", run.strike && "line-through") || undefined,
                            color: run.color,
                            fontSize: run.size ? run.size * k * scale : undefined,
                            fontFamily: font(run.font),
                          }}
                        >
                          {run.text}
                        </span>
                      ))
                    : " "}
                </span>
              </p>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-graph font-sans">
      <div data-theme={slideTheme(slide.background)} className="absolute overflow-hidden text-ink" style={{ left: (SLIDE_WIDTH - w) / 2, top: (SLIDE_HEIGHT - h) / 2, width: w, height: h, background: slide.background ?? "var(--color-surface)" }}>
        {slide.shapes.map(render)}
      </div>
    </div>
  );
}

/** Converte uma apresentação lida de .pptx nos slides do SlideDeck (com as notas do apresentador). */
export function presentationSlides(presentation: Presentation): DeckSlide[] {
  return presentation.slides.map((s, i) => ({ id: `slide-${i + 1}`, title: s.title, content: <OfficeSlide slide={s} aspect={presentation.aspect} width={presentation.width} />, notes: s.notes }));
}

/* ------------------------------------------------------------------ */
/* Arquivo do Office                                                   */
/* ------------------------------------------------------------------ */

export type OfficeFileState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string; code: OfficeFileErrorCode }
  | { status: "ready"; file: OfficeFile };

/**
 * Lê um .xlsx, .docx ou .pptx (File, Blob, ArrayBuffer ou URL) e devolve o
 * estado: idle (sem arquivo), loading, error (mensagem pronta) ou ready.
 */
export function useOfficeFile(source: OfficeSource | string | null | undefined, name?: string) {
  const [state, setState] = useState<OfficeFileState>({ status: source ? "loading" : "idle" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!source) {
      setState({ status: "idle" });
      return;
    }
    let alive = true;
    setState({ status: "loading" });
    (async () => {
      let data: OfficeSource;
      let fileName = name ?? (typeof File !== "undefined" && source instanceof File ? source.name : undefined);
      if (typeof source === "string") {
        const res = await fetch(source).catch(() => null);
        if (!res?.ok) throw new OfficeFileError("network", "Confira a conexão e tente de novo.");
        data = await res.blob();
        fileName ??= decodeURIComponent(new URL(source, location.href).pathname.split("/").pop() ?? "");
      } else data = source;
      const file = await readOfficeFile(data, { name: fileName });
      if (alive) setState({ status: "ready", file });
    })().catch((e: unknown) => {
      if (alive) setState(e instanceof OfficeFileError ? { status: "error", error: e.message, code: e.code } : { status: "error", error: "O arquivo pode estar corrompido. Salve de novo no Office e tente outra vez.", code: "corrupt" });
    });
    return () => {
      alive = false;
    };
  }, [source, name, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}

/**
 * Mostra um arquivo do Office com o visualizador certo: .xlsx no
 * WorkbookView, .docx no DocumentView, .pptx no SlideDeck. Cuida de
 * carregando, erro (com "Tentar novamente") e sem arquivo.
 */
export function OfficeFileView({
  source,
  name,
  actions,
  empty,
  className,
}: {
  /** File/Blob/ArrayBuffer ou URL do arquivo. */
  source: OfficeSource | string | null | undefined;
  /** Nome do arquivo (título quando o arquivo não tem um). */
  name?: string;
  /** Ações na barra (planilha e documento). */
  actions?: ReactNode;
  /** Conteúdo quando não há arquivo (padrão: aviso curto). */
  empty?: ReactNode;
  className?: string;
}) {
  const state = useOfficeFile(source, name);
  const frame = cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className);
  if (state.status === "idle")
    return <div className={cn(frame, "justify-center")}>{empty ?? <StateView icon={<FileText strokeWidth={1.6} />} title="Nenhum arquivo selecionado" description="Escolha uma planilha, um documento ou uma apresentação." />}</div>;
  if (state.status === "loading")
    return (
      <section aria-busy aria-label={name ?? "Abrindo arquivo"} className={cn(frame, "justify-center")}>
        <LoadingState label="Abrindo arquivo…" hint={name} />
      </section>
    );
  if (state.status === "error") {
    const copy = {
      legacy: { tone: "warn", title: "Formato antigo do Office" },
      unsupported: { tone: "neutral", title: "Este arquivo não é do Office" },
      corrupt: { tone: "bad", title: "Não foi possível abrir o arquivo" },
      network: { tone: "bad", title: "Não foi possível baixar o arquivo" },
    } as const;
    return (
      <div className={cn(frame, "justify-center")}>
        <StateView
          tone={copy[state.code].tone}
          icon={<FileWarning strokeWidth={1.6} />}
          title={copy[state.code].title}
          description={state.error}
          action={
            state.code === "network" ? (
              <Button size="sm" onClick={state.retry}>
                <RotateCw /> Tentar novamente
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }
  const { file } = state;
  if (file.kind === "xlsx" || file.kind === "csv") return <WorkbookView workbook={file.workbook} actions={actions} className={className} />;
  if (file.kind === "docx") return <DocumentView document={file.document} actions={actions} className={className} />;
  if (!file.presentation.slides.length)
    return (
      <div className={cn(frame, "justify-center")}>
        <StateView icon={<PresentationIcon strokeWidth={1.6} />} title="Apresentação sem slides" description="Todos os slides deste arquivo estão ocultos ou ele está vazio." />
      </div>
    );
  return <SlideDeck title={file.presentation.title} slides={presentationSlides(file.presentation)} className={className} />;
}
