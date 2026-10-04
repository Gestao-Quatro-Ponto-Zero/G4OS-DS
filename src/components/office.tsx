/**
 * Planilhas e documentos na linguagem do DS, com exportação real para Office.
 *
 * WorkbookView  → abas, grade com endereços A1, barra de fórmula, seleção por
 *                 teclado, soma/média da seleção, copiar para o Excel, .xlsx.
 * DocumentView  → páginas A4 com paginação medida, capa, sumário com página,
 *                 tabelas que quebram repetindo o cabeçalho, imprimir/PDF, .docx.
 *
 * O conteúdo é dado (Workbook, OfficeDocument em lib/office): a mesma fonte
 * desenha a tela e gera o arquivo, então o que se vê é o que se baixa.
 */
import { ChevronRight, Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Fragment, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
  type LaidCell,
  type OfficeDocument,
  type Workbook,
} from "../lib/office";
import { exportDocx, exportXlsx, type OfficeTheme } from "../lib/office-export";
import { OperationButton, OperationFeedback, Skeleton, useOperation } from "./feedback";

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

/** Barra superior comum aos dois visualizadores. */
function ViewerBar({ icon, title, meta, children }: { icon: ReactNode; title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line px-3 py-1.5">
      <span className="shrink-0 text-muted [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
        {icon}
      </span>
      <p className="m-0 min-w-0 flex-1 truncate text-[13.5px] font-medium">{title}</p>
      {meta && <span className="text-[12px] tabular-nums text-muted max-sm:hidden">{meta}</span>}
      {children}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* WorkbookView                                                        */
/* ------------------------------------------------------------------ */

type Pos = { r: number; c: number };
const ROWNUM = 44;
const LETTERS_H = 25;
const pxWidth = (chars: number) => Math.round(Math.max(64, chars * 7.4 + 16));

/**
 * Planilha na tela, com o mesmo layout do .xlsx exportado: título, fonte,
 * cabeçalho na cor da marca, fórmulas vivas e linha de total. Clique ou use
 * as setas para navegar (Shift seleciona intervalo, Ctrl+C copia para colar
 * no Excel). A barra mostra a fórmula da célula; o rodapé, soma e média da seleção.
 */
export function WorkbookView({
  workbook,
  initialSheet = 0,
  fileName,
  theme,
  loading,
  className,
}: {
  workbook: Workbook;
  initialSheet?: number;
  /** Nome do arquivo sem extensão (padrão: título sem acento). */
  fileName?: string;
  /** Cores e fonte do arquivo exportado (padrão: tokens G4 do tema claro). */
  theme?: Partial<OfficeTheme>;
  /** Carregando: mostra o esqueleto da grade. */
  loading?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [sheetIndex, setSheetIndex] = useState(Math.min(initialSheet, Math.max(0, workbook.sheets.length - 1)));
  const sheet = workbook.sheets[sheetIndex];
  const layout = useMemo(() => (sheet ? layoutSheet(sheet) : null), [sheet]);
  const start = (): Pos => ({ r: layout ? Math.min(layout.firstDataRow, layout.rows.length - 1) : 0, c: 0 });
  const [active, setActive] = useState<Pos>(start);
  const [anchor, setAnchor] = useState<Pos>(start);
  const gridRef = useRef<HTMLDivElement>(null);
  const op = useOperation({ busyLabel: "Gerando…", fallback: "Não foi possível gerar a planilha." });

  const selectSheet = (i: number) => {
    setSheetIndex(i);
    const l = workbook.sheets[i] ? layoutSheet(workbook.sheets[i]) : null;
    const p = { r: l ? Math.min(l.firstDataRow, l.rows.length - 1) : 0, c: 0 };
    setActive(p);
    setAnchor(p);
  };

  useEffect(() => {
    gridRef.current?.querySelector<HTMLElement>(`[data-cell="${active.r}-${active.c}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const download = () => op.run(() => exportXlsx(workbook, { fileName, theme }), "Planilha baixada");
  const bar = (
    <ViewerBar icon={<FileSpreadsheet />} title={workbook.title} meta={workbook.sheets.length > 1 ? `${workbook.sheets.length} abas` : undefined}>
      <OperationButton operation={op} variant="ghost" size="sm" onClick={download} disabled={loading} disabledReason="Aguarde os dados carregarem">
        <Download /> Baixar .xlsx
      </OperationButton>
    </ViewerBar>
  );
  const frame = cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className);

  if (loading || !layout || !sheet)
    return (
      <section aria-label={workbook.title} aria-busy={loading || undefined} className={frame}>
        {bar}
        <div className="flex flex-col gap-2 p-4">
          {loading ? (
            <>
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </>
          ) : (
            <p className="m-0 py-10 text-center text-[13.5px] text-muted">Esta planilha não tem abas.</p>
          )}
        </div>
      </section>
    );

  const { rows, colCount, headerRow, totalRow, widths } = layout;
  const freeze = Math.min(sheet.freezeColumns ?? 1, colCount);
  const px = widths.map(pxWidth);
  const leftOf = (c: number) => ROWNUM + px.slice(0, c).reduce((a, b) => a + b, 0);
  const lastRow = rows.length - 1;
  const r0 = Math.min(active.r, anchor.r);
  const r1 = Math.max(active.r, anchor.r);
  const c0 = Math.min(active.c, anchor.c);
  const c1 = Math.max(active.c, anchor.c);
  const inRange = (r: number, c: number) => r >= r0 && r <= r1 && c >= c0 && c <= c1;
  const cellAt = (r: number, c: number): LaidCell | null => rows[r]?.[c] ?? null;
  const activeCell = cellAt(active.r, active.c) ?? (rows[active.r]?.[0]?.span ? rows[active.r][0] : null);
  const address = r0 === r1 && c0 === c1 ? cellAddress(active.r, active.c) : `${cellAddress(r0, c0)}:${cellAddress(r1, c1)}`;
  const formulaText = activeCell ? (activeCell.formula ? `=${activeCell.formula}` : formatCell(activeCell)) : "";

  // Soma, média e contagem da seleção (como a barra de status do Excel).
  const picked: LaidCell[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (cellAt(r, c)) picked.push(cellAt(r, c)!);
  const nums = picked.filter((p) => typeof p.value === "number" && p.role !== "header");
  const numFormat: CellFormat = nums[0]?.format ?? "number";
  const stat = (v: number) => formatCell({ value: v, format: numFormat === "text" || numFormat === "date" ? "number" : numFormat, digits: nums[0]?.digits });
  const sum = nums.reduce((a, p) => a + (p.value as number), 0);
  const filled = picked.filter((p) => p.value !== null && p.value !== undefined && p.value !== "").length;

  const move = (r: number, c: number, extend: boolean) => {
    const next = { r: Math.max(0, Math.min(lastRow, r)), c: Math.max(0, Math.min(colCount - 1, c)) };
    // Título e descrição ocupam a linha toda: a célula é sempre a coluna A.
    if (rows[next.r]?.[0]?.span) next.c = 0;
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
      ArrowUp: () => move(mod ? 0 : r - 1, c, e.shiftKey),
      ArrowRight: () => move(r, mod ? colCount - 1 : c + 1, e.shiftKey),
      ArrowLeft: () => move(r, mod ? 0 : c - 1, e.shiftKey),
      Enter: () => move(r + 1, c, false),
      Tab: () => move(r, c + (e.shiftKey ? -1 : 1), false),
      PageDown: () => move(r + 10, c, e.shiftKey),
      PageUp: () => move(r - 10, c, e.shiftKey),
      Home: () => move(mod ? 0 : r, 0, e.shiftKey),
      End: () => move(mod ? lastRow : r, colCount - 1, e.shiftKey),
    };
    if (mod && e.key.toLowerCase() === "c") return copy();
    if (mod && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setAnchor({ r: 0, c: 0 });
      setActive({ r: lastRow, c: colCount - 1 });
      return;
    }
    // Tab na última coluna sai da grade, como em qualquer controle.
    if (e.key === "Tab" && ((c === colCount - 1 && !e.shiftKey) || (c === 0 && e.shiftKey))) return;
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };
  const pointer = (r: number, c: number, shift: boolean) => {
    gridRef.current?.focus({ preventScroll: true });
    move(r, c, shift);
  };

  const cellClass = (cell: LaidCell | null, r: number, c: number) => {
    const numeric = cell ? isNumericFormat(cell.format) : false;
    const role = cell?.role ?? (r > headerRow && (totalRow === null || r < totalRow) ? "data" : "empty");
    return cn(
      "h-7 cursor-cell overflow-hidden text-ellipsis whitespace-nowrap px-2 py-0 align-middle",
      numeric && "text-right tabular-nums",
      role === "header" && "sticky z-[2] h-8 border-b-2 border-r border-b-accent border-r-on-brand/15 bg-brand text-[12.5px] font-semibold text-on-brand",
      role === "title" && "h-11 bg-surface text-[18px] font-semibold tracking-[-0.01em] text-ink",
      role === "description" && "bg-surface text-[12px] text-muted",
      (role === "data" || role === "empty") && "border-b border-r border-line bg-surface text-ink",
      role === "total" && "border-b border-r border-t-2 border-line border-t-ink bg-soft font-semibold text-ink",
      c < freeze && !cell?.span && "sticky z-[1]",
      role === "header" && c < freeze && "z-[3]",
      inRange(r, c) && !(r === active.r && c === active.c) && "bg-[color-mix(in_oklab,var(--color-primary)_7%,var(--color-surface))]",
      r === active.r && c === active.c && "shadow-[inset_0_0_0_2px_var(--color-primary)]",
    );
  };

  return (
    <section aria-label={workbook.title} className={frame}>
      {bar}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-soft/50 px-2 text-[13px]">
        <span className="w-[76px] shrink-0 truncate rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[12px] tabular-nums" aria-label="Célula selecionada">
          {address}
        </span>
        <span aria-hidden className="shrink-0 font-serif text-[13px] italic text-muted">
          fx
        </span>
        <span className={cn("min-w-0 flex-1 truncate text-[12.5px] text-ink-soft", activeCell?.formula && "font-mono")} aria-label="Conteúdo da célula">
          {formulaText}
        </span>
      </div>
      <OperationFeedback operation={op} inline className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2 text-[13px] text-rose" />
      <div
        ref={gridRef}
        role="grid"
        aria-label={`Aba ${sheet.name}`}
        aria-rowcount={rows.length + 1}
        aria-colcount={colCount + 1}
        aria-activedescendant={`${uid}-${active.r}-${active.c}`}
        aria-multiselectable
        tabIndex={0}
        onKeyDown={onKey}
        className="relative min-h-0 flex-1 overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-muted/30"
      >
        <table role="presentation" className="border-separate border-spacing-0 text-[13px]" style={{ width: ROWNUM + px.reduce((a, b) => a + b, 0), tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: ROWNUM }} />
            {px.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              <th role="columnheader" aria-label="Linhas e colunas" className="sticky left-0 top-0 z-[4] border-b border-r border-line bg-soft" style={{ height: LETTERS_H }} />
              {px.map((_, c) => (
                <th
                  key={c}
                  role="columnheader"
                  className={cn("sticky top-0 z-[2] border-b border-r border-line bg-soft text-center text-[11px] font-medium text-muted", c >= c0 && c <= c1 && "bg-line text-ink", c < freeze && "z-[4]")}
                  style={{ height: LETTERS_H, left: c < freeze ? leftOf(c) : undefined }}
                >
                  {columnLetter(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => {
              const spanCell = row[0]?.span ? row[0] : null;
              const top = r === headerRow ? LETTERS_H : undefined;
              return (
                <tr key={r} role="row" aria-rowindex={r + 2}>
                  <th
                    role="rowheader"
                    className={cn("sticky left-0 z-[1] border-b border-r border-line bg-soft px-1 text-right text-[11px] font-normal tabular-nums text-muted", r >= r0 && r <= r1 && "bg-line text-ink", r === headerRow && "z-[3]")}
                    style={{ top }}
                  >
                    {r + 1}
                  </th>
                  {spanCell ? (
                    <td
                      id={`${uid}-${r}-0`}
                      role="gridcell"
                      aria-selected={inRange(r, 0)}
                      data-cell={`${r}-0`}
                      colSpan={colCount}
                      onMouseDown={(e) => pointer(r, 0, e.shiftKey)}
                      className={cellClass(spanCell, r, 0)}
                    >
                      {formatCell(spanCell)}
                    </td>
                  ) : (
                    row.map((cell, c) => (
                      <td
                        key={c}
                        id={`${uid}-${r}-${c}`}
                        role="gridcell"
                        aria-selected={inRange(r, c)}
                        data-cell={`${r}-${c}`}
                        onMouseDown={(e) => pointer(r, c, e.shiftKey)}
                        title={cell?.note}
                        className={cn(cellClass(cell, r, c), cell?.note && "relative")}
                        style={{ top, left: c < freeze ? leftOf(c) : undefined }}
                      >
                        {cell ? formatCell(cell) : ""}
                        {cell?.note && <span aria-hidden className="absolute right-0 top-0 h-0 w-0 border-l-[6px] border-t-[6px] border-l-transparent border-t-accent" />}
                      </td>
                    ))
                  )}
                </tr>
              );
            })}
            {sheet.rows.length === 0 && (
              <tr role="row">
                <td role="gridcell" colSpan={colCount + 1} className="px-3 py-8 text-center text-[13.5px] text-muted">
                  Nenhuma linha nesta aba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="flex min-h-9 shrink-0 items-stretch border-t border-line bg-soft/50">
        <div role="tablist" aria-label="Abas" className="flex min-w-0 flex-1 overflow-x-auto">
          {workbook.sheets.map((s, i) => (
            <button
              key={s.name + i}
              type="button"
              role="tab"
              aria-selected={i === sheetIndex}
              onClick={() => selectSheet(i)}
              className={cn(
                "shrink-0 whitespace-nowrap border-r border-line px-3.5 text-[12.5px] outline-none focus-visible:bg-soft",
                i === sheetIndex ? "border-t-2 border-t-accent bg-surface font-medium text-ink" : "border-t-2 border-t-transparent text-muted hover:bg-soft hover:text-ink",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        {nums.length > 1 && (
          <div className="flex shrink-0 items-center gap-3 px-3 text-[12px] tabular-nums text-muted max-sm:hidden" aria-live="polite">
            <span>
              Média <span className="text-ink">{stat(sum / nums.length)}</span>
            </span>
            <span>
              Contagem <span className="text-ink">{filled}</span>
            </span>
            <span>
              Soma <span className="text-ink">{stat(sum)}</span>
            </span>
          </div>
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
  fileName,
  theme,
  loading,
  showOutline = true,
  className,
}: {
  document: OfficeDocument;
  /** Nome do arquivo sem extensão (padrão: título sem acento). */
  fileName?: string;
  /** Cores e fonte do arquivo exportado (padrão: tokens G4 do tema claro). */
  theme?: Partial<OfficeTheme>;
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
  const op = useOperation({ busyLabel: "Gerando…", fallback: "Não foi possível gerar o documento." });
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
  const download = () => op.run(() => exportDocx(doc, { fileName, theme, pages: pageOf }), "Documento baixado");
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
  const tool = "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-muted hover:bg-soft hover:text-ink disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4";

  return (
    <section aria-label={doc.title} aria-busy={loading || undefined} className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <ViewerBar icon={<FileText />} title={doc.title} meta={loading ? undefined : `Página ${current + 1} de ${pages.length}`}>
        <button type="button" onClick={print} disabled={loading} className={tool}>
          <Printer /> <span className="max-sm:sr-only">Imprimir</span>
        </button>
        <OperationButton operation={op} variant="ghost" size="sm" onClick={download} disabled={loading} disabledReason="Aguarde o documento carregar">
          <Download /> Baixar .docx
        </OperationButton>
      </ViewerBar>
      <OperationFeedback operation={op} inline className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2 text-[13px] text-rose" />
      <div className="flex min-h-0 flex-1">
        {showOutline && outline.length > 0 && !loading && (
          <nav aria-label="Sumário do documento" className="hidden w-[220px] shrink-0 overflow-y-auto border-r border-line bg-soft/50 p-2.5 md:block">
            <p className="m-0 px-2 pb-1.5 pt-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted">Sumário</p>
            <ul className="m-0 flex list-none flex-col gap-px p-0">
              {outline.map((h) => (
                <li key={h.index}>
                  <button
                    type="button"
                    onClick={() => goTo(h.index)}
                    aria-current={h.index === currentHeading ? "location" : undefined}
                    className={cn(
                      "flex w-full items-baseline gap-1.5 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-soft hover:text-ink aria-[current=location]:bg-surface aria-[current=location]:text-ink aria-[current=location]:shadow-surface aria-[current=location]:ring-1 aria-[current=location]:ring-line",
                      h.level === 1 ? "font-medium text-ink-soft" : "pl-5 text-muted",
                    )}
                  >
                    {h.level === 1 && <ChevronRight aria-hidden className="relative top-[2px] h-3 w-3 shrink-0 text-muted" />}
                    <span className="min-w-0 flex-1">{h.text}</span>
                    <span className="text-[11px] tabular-nums text-muted">{content ? pageOf[h.index] : ""}</span>
                  </button>
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
