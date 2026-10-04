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
import { FileSpreadsheet, FileText, FileWarning, Presentation as PresentationIcon, Printer, RotateCw } from "lucide-react";
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
  type OfficeDocument,
  type Presentation,
  type PresentationShape,
  type PresentationSlide,
  type SheetLayout,
  type Workbook,
} from "../lib/office";
import { OFFICE_SHEET_LIMITS, OfficeFileError, readOfficeFile, type OfficeFile, type OfficeFileErrorCode, type OfficeSource } from "../lib/office-files";
import { formatNumber } from "../lib/format";
import { Skeleton } from "./feedback";
import { Tabs } from "./navigation";
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

/**
 * Como no Excel, texto mais largo que a coluna avança pelas células vazias à
 * direita (só o necessário). Números nunca transbordam.
 */
function overflowSpans(row: (LaidCell | null)[], px: number[]) {
  const out: { c: number; span: number }[] = [];
  for (let c = 0; c < row.length; c++) {
    const cell = row[c];
    let span = 1;
    if (cell && typeof cell.value === "string" && !isNumericFormat(cell.format) && cell.role !== "header") {
      const need = formatCell(cell).length * (cell.bold ? 7.6 : 7.1) + 24;
      let width = px[c];
      while (width < need && c + span < row.length && !row[c + span]) width += px[c + span++];
    }
    out.push({ c, span });
    c += span - 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* WorkbookView                                                        */
/* ------------------------------------------------------------------ */

type Pos = { r: number; c: number };
const ROWNUM = 48;
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
    const filled = layout.rows[r].filter(Boolean) as LaidCell[];
    const onlyFirst = filled.length === 0 || (filled.length === 1 && layout.rows[r][0] && typeof layout.rows[r][0]!.value === "string");
    if (!onlyFirst) break;
    if (filled[0]) lines.push(filled[0]);
    start = r + 1;
  }
  // Sem cabeçalho fixo, só tira do corpo se a primeira linha parece título (mesclada ou em negrito).
  if (layout.headerRow < 0 && !(lines[0]?.span || lines[0]?.bold || lines[0]?.role === "title")) return { title: undefined, notes: [], start: 0 };
  const [title, ...notes] = lines;
  return { title, notes, start };
}

/**
 * Planilha na linguagem do DS (mesmo visual do DataGrid): abas no topo,
 * título e fonte acima da tabela, cabeçalho e total fixos, colunas fixas.
 * Conteúdo escrito em código (Workbook: colunas, fórmulas, total) ou lido de
 * um .xlsx (FileWorkbook, de readOfficeFile). Setas navegam, Shift seleciona
 * intervalo, Ctrl+C copia para colar no Excel. O rodapé mostra o endereço e a
 * fórmula da célula e soma, média e contagem da seleção.
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
  const intro = useMemo(() => (layout ? sheetIntro(layout) : { title: undefined, notes: [], start: 0 }), [layout]);
  const firstCell = (l: SheetLayout | null, start: number): Pos => ({ r: l ? Math.min(Math.max(l.firstDataRow, start), l.rows.length - 1) : 0, c: 0 });
  const [active, setActive] = useState<Pos>(() => firstCell(layout, intro.start));
  const [anchor, setAnchor] = useState<Pos>(() => firstCell(layout, intro.start));
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState({ x: false, y: false });

  const selectSheet = (id: string) => {
    const i = Number(id);
    setSheetIndex(i);
    const l = grid[i]?.layout ?? null;
    const p = firstCell(l, l ? sheetIntro(l).start : 0);
    setActive(p);
    setAnchor(p);
    gridRef.current?.scrollTo({ top: 0, left: 0 });
  };

  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${active.r}-${active.c}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const frame = cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className);
  const bar = (
    <ViewerBar icon={<FileSpreadsheet />} title={workbook.title} meta={grid.length > 1 ? `${grid.length} abas` : undefined}>
      {actions}
    </ViewerBar>
  );

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

  const { rows, colCount, headerRow, totalRow, widths } = layout;
  const start = intro.start;
  const hasHeader = headerRow >= 0 && headerRow === start;
  const bodyFrom = hasHeader ? headerRow + 1 : start;
  const bodyTo = totalRow !== null ? totalRow - 1 : rows.length - 1;
  const freeze = Math.min(sheet.freezeColumns ?? 0, colCount);
  const px = widths.map(pxWidth);
  const leftOf = (c: number) => ROWNUM + px.slice(0, c).reduce((a, b) => a + b, 0);
  const lastRow = rows.length - 1;
  const r0 = Math.min(active.r, anchor.r);
  const r1 = Math.max(active.r, anchor.r);
  const c0 = Math.min(active.c, anchor.c);
  const c1 = Math.max(active.c, anchor.c);
  const inRange = (r: number, c: number) => r >= r0 && r <= r1 && c >= c0 && c <= c1;
  const cellAt = (r: number, c: number): LaidCell | null => rows[r]?.[c] ?? null;
  const activeCell = cellAt(active.r, active.c);
  const single = r0 === r1 && c0 === c1;
  const address = single ? cellAddress(active.r, active.c) : `${cellAddress(r0, c0)}:${cellAddress(r1, c1)}`;

  // Soma, média e contagem da seleção (como a barra de status do Excel).
  const picked: LaidCell[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (cellAt(r, c)) picked.push(cellAt(r, c)!);
  const nums = picked.filter((p) => typeof p.value === "number" && p.role !== "header");
  const numFormat: CellFormat = nums[0]?.format ?? "number";
  const stat = (v: number) => formatCell({ value: v, format: numFormat === "text" || numFormat === "date" ? "number" : numFormat, digits: nums[0]?.digits });
  const sum = nums.reduce((a, p) => a + (p.value as number), 0);
  const filled = picked.filter((p) => p.value !== null && p.value !== undefined && p.value !== "").length;

  const minRow = hasHeader ? headerRow : start;
  const move = (r: number, c: number, extend: boolean) => {
    const next = { r: Math.max(minRow, Math.min(lastRow, r)), c: Math.max(0, Math.min(colCount - 1, c)) };
    setActive(next);
    if (!extend) setAnchor(next);
  };
  const copy = () => {
    const lines: string[] = [];
    for (let r = r0; r <= r1; r++) {
      const vals: string[] = [];
      for (let c = c0; c <= c1; c++) vals.push(cellAt(r, c) ? formatCell(cellAt(r, c)!) : "");
      lines.push(vals.join("\t"));
    }
    void navigator.clipboard?.writeText(lines.join("\n"));
  };
  const onKey = (e: KeyboardEvent) => {
    const { r, c } = active;
    const mod = e.ctrlKey || e.metaKey;
    const map: Record<string, () => void> = {
      ArrowDown: () => move(mod ? lastRow : r + 1, c, e.shiftKey),
      ArrowUp: () => move(mod ? minRow : r - 1, c, e.shiftKey),
      ArrowRight: () => move(r, mod ? colCount - 1 : c + 1, e.shiftKey),
      ArrowLeft: () => move(r, mod ? 0 : c - 1, e.shiftKey),
      Enter: () => move(r + 1, c, false),
      PageDown: () => move(r + 10, c, e.shiftKey),
      PageUp: () => move(r - 10, c, e.shiftKey),
      Home: () => move(mod ? minRow : r, 0, e.shiftKey),
      End: () => move(mod ? lastRow : r, colCount - 1, e.shiftKey),
    };
    if (mod && e.key.toLowerCase() === "c") return copy();
    if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setAnchor({ r: minRow, c: 0 });
      setActive({ r: lastRow, c: colCount - 1 });
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
    const next = { x: el.scrollLeft > 0, y: el.scrollTop > 0 };
    if (next.x !== scrolled.x || next.y !== scrolled.y) setScrolled(next);
  };

  /** Estilo da célula de dados: seleção com 7 % de primary (igual à linha selecionada do DataGrid), ativa com contorno. */
  const cellProps = (r: number, c: number, cell: LaidCell | null, span = 1) => {
    const pin = c < freeze && span === 1;
    const isActive = r === active.r && c === active.c;
    return {
      id: `${uid}-${r}-${c}`,
      role: "gridcell",
      "aria-selected": inRange(r, c),
      "data-cell": `${r}-${c}`,
      "data-pin": pin ? "" : undefined,
      "data-pin-edge": pin && c === freeze - 1 ? "left" : undefined,
      colSpan: span > 1 ? span : undefined,
      onMouseDown: (e: React.MouseEvent) => pointer(r, c, e.shiftKey),
      className: cn(
        "dg-cell cursor-cell whitespace-nowrap text-[13px]",
        cell && isNumericFormat(cell.format) ? "text-right tabular-nums" : "text-left",
        cell?.bold && "font-semibold",
        cell?.value === null || cell?.value === undefined ? "text-muted" : "text-ink",
        pin && "sticky",
        isActive && "shadow-[inset_0_0_0_1.5px_var(--color-primary)]",
      ),
      style: {
        left: pin ? leftOf(c) : undefined,
        ...(inRange(r, c) && !isActive ? { "--dg-row-bg": "color-mix(in oklab, var(--ds-primary) 7%, var(--ds-surface))" } : {}),
      } as CSSProperties,
    };
  };

  const head = hasHeader ? rows[headerRow] : null;
  const total = totalRow !== null ? rows[totalRow] : null;

  return (
    <section aria-label={workbook.title} className={frame}>
      {bar}
      {grid.length > 1 && (
        <div className="shrink-0 overflow-x-auto border-b border-line px-3 pt-1">
          <Tabs label="Abas da planilha" value={String(sheetIndex)} onChange={selectSheet} items={grid.map((s, i) => ({ id: String(i), label: s.name }))} className="-mb-px flex-nowrap" />
        </div>
      )}
      {(intro.title || intro.notes.length > 0) && (
        <div className="shrink-0 px-4 pb-3 pt-4">
          {intro.title && <h3 className="m-0 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{formatCell(intro.title)}</h3>}
          {intro.notes.map((n, i) => (
            <p key={i} className="m-0 mt-1 text-[12.5px] text-muted">
              {formatCell(n)}
            </p>
          ))}
        </div>
      )}
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
        data-scrolled-x={scrolled.x || undefined}
        data-scrolled-y={scrolled.y || undefined}
        className="data-grid relative min-h-0 flex-1 overflow-auto border-t border-line outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/30"
      >
        <table role="presentation" className="border-separate border-spacing-0" style={{ width: ROWNUM + px.reduce((a, b) => a + b, 0), tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: ROWNUM }} />
            {px.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              <th role="columnheader" data-pin="" className="dg-th sticky left-0 text-right font-normal" style={{ left: 0 }}>
                <span className="sr-only">Linha</span>
              </th>
              {px.map((_, c) => {
                const cell = head?.[c] ?? null;
                const pin = c < freeze;
                const letter = columnLetter(c);
                return (
                  <th
                    key={c}
                    role="columnheader"
                    data-pin={pin ? "" : undefined}
                    data-pin-edge={pin && c === freeze - 1 ? "left" : undefined}
                    title={cell?.note ? `${letter} · ${cell.note}` : `Coluna ${letter}`}
                    onMouseDown={head ? (e) => pointer(headerRow, c, e.shiftKey) : undefined}
                    className={cn("dg-th", head && cell && isNumericFormat(rows[bodyFrom]?.[c]?.format ?? "text") ? "text-right" : "text-left", !head && "text-center font-normal", c >= c0 && c <= c1 && "text-ink")}
                    style={{ left: pin ? leftOf(c) : undefined }}
                  >
                    {head ? (
                      <span className={cn("inline-flex max-w-full items-center gap-1", head && isNumericFormat(rows[bodyFrom]?.[c]?.format ?? "text") && "flex-row-reverse")}>
                        <span className="truncate">{cell ? formatCell(cell) : letter}</span>
                        {cell?.note && (
                          <span aria-hidden className="inline-grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-muted ring-1 ring-line-strong">
                            ?
                          </span>
                        )}
                      </span>
                    ) : (
                      letter
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(bodyFrom, bodyTo + 1).map((row, k) => {
              const r = bodyFrom + k;
              const selectedRow = r >= r0 && r <= r1;
              return (
                <tr key={r} role="row" data-row="" aria-rowindex={r + 1} style={{ height: 36 }}>
                  <td data-pin="" className={cn("dg-cell sticky left-0 text-right text-[11.5px] tabular-nums", selectedRow ? "font-medium text-ink" : "text-muted")} style={{ left: 0 }}>
                    {r + 1}
                  </td>
                  {overflowSpans(row, px).map(({ c, span }) => {
                    const cell = row[c];
                    return (
                      <td key={c} {...cellProps(r, c, cell, span)}>
                        <span className="block truncate">{cell ? formatCell(cell) : ""}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {bodyTo < bodyFrom && (
              <tr role="row">
                <td colSpan={colCount + 1} className="p-0">
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
                {total.map((cell, c) => {
                  const p = cellProps(totalRow, c, cell);
                  return (
                    <td key={c} {...p} className={cn(p.className.replace("dg-cell", "dg-tf"), "font-semibold")}>
                      <span className="block truncate">{cell ? formatCell(cell) : ""}</span>
                    </td>
                  );
                })}
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

/** Desenha um bloco do documento. `rows` recorta uma tabela que continua em outra página. */
function DocBlockView({ block, rows, last = true, headingId }: { block: DocBlock; rows?: [number, number]; last?: boolean; headingId?: string }) {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 1;
      if (level === 1) return <h3 id={headingId} className="m-0 scroll-mt-6 pb-2.5 pt-5 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">{block.text}</h3>;
      if (level === 2) return <h4 id={headingId} className="m-0 scroll-mt-6 pb-2 pt-4 text-[18px] font-semibold leading-snug tracking-[-0.01em] text-ink">{block.text}</h4>;
      return <h5 className="m-0 pb-1.5 pt-3 text-[15px] font-semibold text-ink-soft">{block.text}</h5>;
    }
    case "paragraph":
      return (
        <p className="m-0 pb-3.5 text-[14px] leading-[1.6] text-ink-soft">
          <Runs text={block.text} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className="m-0 flex list-none flex-col gap-1.5 p-0 pb-3.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-baseline gap-3 text-[14px] leading-[1.6] text-ink-soft">
              {block.ordered ? (
                <span className="w-5 shrink-0 text-right text-[13px] font-semibold tabular-nums text-accent-deep">{i + 1}.</span>
              ) : (
                <span aria-hidden className="relative top-[-2px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              )}
              <span className="min-w-0">
                <Runs text={it} />
              </span>
            </li>
          ))}
        </List>
      );
    }
    case "table": {
      const [from, to] = rows ?? [0, block.rows.length];
      const weights = block.columns.map((c) => c.width ?? 1);
      const total = weights.reduce((a, b) => a + b, 0);
      return (
        <div className="pb-4">
          <table className="w-full border-collapse text-[13px]" style={{ tableLayout: "fixed" }}>
            <colgroup>
              {weights.map((w, i) => (
                <col key={i} style={{ width: `${(w / total) * 100}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr data-measure="head">
                {block.columns.map((c, i) => (
                  <th key={i} scope="col" className={cn("border-b-2 border-accent bg-brand px-2.5 py-2 text-left text-[12px] font-semibold text-on-brand", isNumericFormat(c.format ?? "text") && "text-right")}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(from, to).map((row, k) => {
                const isTotal = block.totalRow && from + k === block.rows.length - 1;
                return (
                  <tr key={from + k} data-measure="row" className={cn(isTotal ? "border-t-2 border-ink bg-soft font-semibold" : "border-b border-line")}>
                    {block.columns.map((c, i) => (
                      <td key={i} className={cn("px-2.5 py-1.5 align-top text-ink", isNumericFormat(c.format ?? "text") && "text-right tabular-nums")}>
                        {formatCell({ value: row[i], format: c.format ?? "text", digits: c.digits })}
                      </td>
                    ))}
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

  const pages: DocPage[] = [...(showCover ? [{ kind: "cover" as const }] : []), ...(doc.toc ? [{ kind: "toc" as const }] : []), ...(content ?? [{ kind: "content" as const, pieces: doc.blocks.map((_, index) => ({ index })) }])];
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
    if (p.kind === "toc")
      return pageChrome(
        i,
        <>
          <h3 className="m-0 pb-6 text-[24px] font-semibold tracking-[-0.02em]">Sumário</h3>
          <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
            {outline.map((h) => (
              <li key={h.index}>
                <button type="button" onClick={() => goTo(h.index)} className={cn("flex w-full items-baseline gap-2 rounded-sm py-1 text-left hover:text-ink focus-visible:outline-2", h.level === 1 ? "text-[14px] font-medium text-ink" : "pl-5 text-[13.5px] text-ink-soft")}>
                  <span className="min-w-0">{h.text}</span>
                  <span aria-hidden className="mb-1 min-w-4 flex-1 border-b border-dotted border-line-strong" />
                  <span className="tabular-nums text-muted">{content ? pageOf[h.index] : ""}</span>
                </button>
              </li>
            ))}
          </ol>
        </>,
      );
    return pageChrome(
      i,
      p.pieces.map((piece) => (
        <DocBlockView key={`${piece.index}-${piece.rows?.[0] ?? 0}`} block={doc.blocks[piece.index]} rows={piece.rows} last={piece.last ?? true} headingId={!piece.rows ? `${uid}-h${piece.index}` : undefined} />
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
              <DocBlockView block={b} />
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

/**
 * Um slide de .pptx no canvas de 1280×720 do DS: posição, tamanho, cores,
 * imagens e tabelas vêm do arquivo; o texto usa a fonte do DS. Slides 4:3
 * ficam centralizados. Use com SlideDeck via `presentationSlides`.
 */
export function OfficeSlide({ slide, aspect = 16 / 9, width = 960 }: { slide: PresentationSlide; aspect?: number; /** Largura do slide em pontos. */ width?: number }) {
  const wide = aspect >= SLIDE_WIDTH / SLIDE_HEIGHT;
  const w = wide ? SLIDE_WIDTH : Math.round(SLIDE_HEIGHT * aspect);
  const h = wide ? Math.round(SLIDE_WIDTH / aspect) : SLIDE_HEIGHT;
  const k = w / width; // px por ponto
  const box = (s: PresentationShape): CSSProperties => ({
    position: "absolute",
    left: s.x * w,
    top: s.y * h,
    width: s.w * w,
    height: s.h * h,
    transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
  });
  return (
    <div className="relative h-full w-full overflow-hidden bg-graph font-sans">
      <div className="absolute overflow-hidden" style={{ left: (SLIDE_WIDTH - w) / 2, top: (SLIDE_HEIGHT - h) / 2, width: w, height: h, background: slide.background ?? "var(--color-surface)" }}>
        {slide.shapes.map((s, i) => {
          if (s.kind === "image") return <img key={i} src={s.src} alt={s.alt ?? ""} style={{ ...box(s), objectFit: "fill" }} />;
          if (s.kind === "table")
            return (
              <div key={i} style={box(s)} className="overflow-hidden">
                <table className="h-full w-full border-collapse" style={{ fontSize: 14 * k }}>
                  <tbody>
                    {s.rows?.map((row, r) => (
                      <tr key={r} className={r === 0 ? "bg-brand font-semibold text-on-brand" : "border-b border-line bg-surface text-ink"}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-2 py-1 align-middle">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          const [t, r, b, l] = (s.inset ?? [0, 0, 0, 0]).map((v) => v * w);
          const scale = s.fontScale ?? 1;
          return (
            <div
              key={i}
              style={{
                ...box(s),
                background: s.fill,
                border: s.line ? `${Math.max(1, k)}px solid ${s.line}` : undefined,
                borderRadius: s.geometry === "ellipse" ? "50%" : s.geometry === "roundRect" ? 12 * k : undefined,
                padding: `${t}px ${r}px ${b}px ${l}px`,
                justifyContent: s.anchor === "middle" ? "center" : s.anchor === "bottom" ? "flex-end" : "flex-start",
              }}
              className="flex flex-col overflow-hidden"
            >
              {s.paragraphs?.map((p, j) => (
                <p
                  key={j}
                  className="m-0 flex"
                  style={{ fontSize: (p.size ?? 18) * k * scale, color: p.color, textAlign: ALIGN[p.align ?? "left"], justifyContent: p.align === "center" ? "center" : p.align === "right" ? "flex-end" : undefined, lineHeight: 1.18, paddingLeft: (p.level ?? 0) * 36 * k, marginTop: j && p.bullet ? 6 * k * scale : 0 }}
                >
                  {p.bullet && <span className="shrink-0 pr-[0.5em]">{p.bullet}</span>}
                  <span className="min-w-0 whitespace-pre-wrap">
                    {p.runs.length ? (
                      p.runs.map((run, x) => (
                        <span key={x} style={{ fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? "italic" : undefined, textDecoration: run.underline ? "underline" : undefined, color: run.color, fontSize: run.size ? run.size * k * scale : undefined }}>
                          {run.text}
                        </span>
                      ))
                    ) : (
                      " "
                    )}
                  </span>
                </p>
              ))}
            </div>
          );
        })}
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
  if (file.kind === "xlsx") return <WorkbookView workbook={file.workbook} actions={actions} className={className} />;
  if (file.kind === "docx") return <DocumentView document={file.document} actions={actions} className={className} />;
  if (!file.presentation.slides.length)
    return (
      <div className={cn(frame, "justify-center")}>
        <StateView icon={<PresentationIcon strokeWidth={1.6} />} title="Apresentação sem slides" description="Todos os slides deste arquivo estão ocultos ou ele está vazio." />
      </div>
    );
  return <SlideDeck title={file.presentation.title} slides={presentationSlides(file.presentation)} className={className} />;
}
