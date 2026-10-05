/**
 * RECEITA OPCIONAL — copie para o seu app (ex.: src/lib/office-export.ts).
 * O DS exibe planilhas e documentos; gerar o arquivo é do app. Instale:
 *   pnpm add exceljs docx
 * Guia: docs/guias/office.md
 *
 * Exportação real para Office: .xlsx (exceljs) e .docx (docx), com a
 * identidade do DS. As bibliotecas são carregadas sob demanda, só quando
 * alguém exporta, então não pesam no carregamento do app.
 *
 *   await exportXlsx(workbook)            // baixa "relatorio.xlsx"
 *   await exportDocx(documento)           // baixa "relatorio.docx"
 *   const blob = await workbookToBlob(wb) // para anexar, enviar, salvar
 */
import {
  cellAddress,
  docRuns,
  documentOutline,
  excelNumberFormat,
  fileSlug,
  formatCell,
  isNumericFormat,
  layoutSheet,
  toCellDate,
  type CellValue,
  type DocBlock,
  type DocText,
  type OfficeDocument,
  type Workbook,
  tokens,
} from "@g4ai/ds";

const { color } = tokens;

/**
 * Cores e fonte dos arquivos. Padrão: tokens do tema claro G4. Para a marca
 * do cliente, passe só o que muda: `{ brand: "#0b5cff", font: "Inter" }`.
 * Hex sem "#" também vale. Fonte padrão: Arial. A fonte precisa existir no
 * computador de quem abre (Figtree só se a equipe tiver instalada); se não
 * existir, o Office troca por outra.
 */
export type OfficeTheme = {
  /** Cabeçalho de tabela, título, capa. */
  brand: string;
  /** Texto sobre `brand`. */
  onBrand: string;
  /** Fio de destaque (dourado G4). */
  accent: string;
  /** Texto do rótulo dourado. */
  accentDeep: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  lineStrong: string;
  soft: string;
  ok: string;
  rose: string;
  font: string;
};

export const officeTheme: OfficeTheme = {
  brand: color.brand,
  onBrand: color.onBrand,
  accent: color.accent,
  accentDeep: color.accentDeep,
  ink: color.ink,
  inkSoft: color.inkSoft,
  muted: color.muted,
  line: color.line,
  lineStrong: color.lineStrong,
  soft: color.soft,
  ok: color.ok,
  rose: color.rose,
  // Arial existe em todo computador com Office; Figtree só onde foi instalada.
  font: "Arial",
};

const hex = (c: string) => c.replace("#", "").toUpperCase();
const argb = (c: string) => `FF${hex(c)}`;
const resolveTheme = (t?: Partial<OfficeTheme>): OfficeTheme => ({ ...officeTheme, ...t });

/** Baixa um Blob com o nome dado (no navegador). */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

type ExcelModule = typeof import("exceljs");

async function loadExcel(): Promise<ExcelModule> {
  const mod = (await import("exceljs")) as ExcelModule & { default?: ExcelModule };
  return mod.default ?? mod;
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Nome de aba válido no Excel: até 31 caracteres, sem : \ / ? * [ ] e único. */
function sheetName(name: string, used: Set<string>) {
  const base = name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Planilha";
  let n = base;
  for (let i = 2; used.has(n.toLowerCase()); i++) n = `${base.slice(0, 28)} (${i})`;
  used.add(n.toLowerCase());
  return n;
}

function excelValue(value: CellValue, isDate: boolean) {
  if (value === undefined || value === null || value === "") return null;
  if (isDate) return toCellDate(value) ?? String(value);
  return value instanceof Date ? value : value;
}

/** Gera o .xlsx como Blob: abas, cabeçalho fixo, filtro, fórmulas vivas, totais e impressão configurada. */
export async function workbookToBlob(workbook: Workbook, options: { theme?: Partial<OfficeTheme> } = {}): Promise<Blob> {
  const ExcelJS = await loadExcel();
  const t = resolveTheme(options.theme);
  const wb = new ExcelJS.Workbook();
  wb.creator = workbook.author ?? "G4OS";
  wb.title = workbook.title;
  wb.created = new Date();
  const used = new Set<string>();
  const font = (extra: Partial<import("exceljs").Font> = {}): Partial<import("exceljs").Font> => ({ name: t.font, size: 10.5, color: { argb: argb(t.ink) }, ...extra });
  const thin = (c: string) => ({ style: "thin" as const, color: { argb: argb(c) } });

  for (const sheet of workbook.sheets) {
    const layout = layoutSheet(sheet);
    const freezeColumns = Math.min(sheet.freezeColumns ?? 1, layout.colCount);
    const ws = wb.addWorksheet(sheetName(sheet.name, used), {
      views: [{ state: "frozen", xSplit: freezeColumns, ySplit: layout.headerRow + 1, showGridLines: false }],
      properties: { defaultRowHeight: 18 },
      pageSetup: {
        paperSize: 9,
        orientation: layout.colCount > 6 ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: `${layout.headerRow + 1}:${layout.headerRow + 1}`,
        margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      },
      headerFooter: {
        oddHeader: `&L&8${workbook.title.replace(/&/g, "&&")}&R&8${sheet.name.replace(/&/g, "&&")}`,
        oddFooter: "&R&8Página &P de &N",
      },
    });
    ws.columns = layout.widths.map((w) => ({ width: w + 1 }));

    layout.rows.forEach((row, r) => {
      const xr = ws.getRow(r + 1);
      row.forEach((cell, c) => {
        const col = sheet.columns[c];
        const target = xr.getCell(c + 1);
        const role = cell?.role ?? (r > layout.headerRow && r <= layout.lastDataRow ? "data" : null);
        if (cell) {
          const isDate = cell.format === "date";
          const v = excelValue(cell.value, isDate);
          target.value = cell.formula ? { formula: cell.formula, result: (typeof v === "number" ? v : undefined) as number } : (v as import("exceljs").CellValue);
          const numFmt = excelNumberFormat(cell.format, cell.digits);
          if (numFmt && role !== "header") target.numFmt = numFmt;
          if (cell.note) target.note = cell.note;
        }
        const numeric = col && isNumericFormat(col.format ?? "text");
        if (role === "header") {
          target.font = font({ bold: true, color: { argb: argb(t.onBrand) } });
          target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(t.brand) } };
          target.alignment = { vertical: "middle", horizontal: numeric ? "right" : "left", wrapText: true, indent: numeric ? 0 : 0 };
          target.border = { bottom: { style: "medium", color: { argb: argb(t.accent) } } };
        } else if (role === "data") {
          target.font = font();
          target.alignment = { vertical: "middle", horizontal: numeric ? "right" : "left" };
          target.border = { bottom: thin(t.line) };
        } else if (role === "total") {
          target.font = font({ bold: true });
          target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(t.soft) } };
          target.alignment = { vertical: "middle", horizontal: numeric && c > 0 ? "right" : "left" };
          target.border = { top: { style: "medium", color: { argb: argb(t.ink) } }, bottom: thin(t.lineStrong) };
        }
      });
      const first = row[0];
      if (first?.role === "title") {
        xr.height = 30;
        xr.getCell(1).font = font({ size: 16, bold: true, color: { argb: argb(t.brand) } });
        xr.getCell(1).alignment = { vertical: "middle" };
      } else if (first?.role === "description") {
        xr.getCell(1).font = font({ size: 9.5, color: { argb: argb(t.muted) } });
      } else if (r === layout.headerRow) xr.height = 24;
      else if (r === layout.totalRow) xr.height = 22;
      if (first?.span && layout.colCount > 1) ws.mergeCells(r + 1, 1, r + 1, layout.colCount);
    });

    if (layout.lastDataRow >= layout.firstDataRow)
      ws.autoFilter = { from: cellAddress(layout.headerRow, 0), to: cellAddress(layout.lastDataRow, layout.colCount - 1) };
  }

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME });
}

/** Gera e baixa o .xlsx. Nome padrão: título em minúsculas, sem acento. */
export async function exportXlsx(workbook: Workbook, options: { fileName?: string; theme?: Partial<OfficeTheme> } = {}) {
  const blob = await workbookToBlob(workbook, options);
  downloadBlob(blob, `${options.fileName ?? fileSlug(workbook.title)}.xlsx`);
  return blob;
}

/* ------------------------------------------------------------------ */
/* Word                                                                */
/* ------------------------------------------------------------------ */

type DocxModule = typeof import("docx");
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Medidas: A4 com margem de 2 cm. Pontos ×2 = half-points do Word. */
const A4 = { width: 11906, height: 16838, margin: 1134 };
const pt = (n: number) => Math.round(n * 2);

/**
 * Gera o .docx como Blob: capa, sumário, títulos com estilo (aparecem no
 * painel de navegação do Word), listas, tabelas, números, destaques,
 * citação e assinaturas; cabeçalho e "Página X de Y" em todas as páginas
 * depois da capa. `pages` (do DocumentView) preenche os números do sumário;
 * o Word recalcula ao atualizar o campo.
 */
export async function documentToBlob(doc: OfficeDocument, options: { theme?: Partial<OfficeTheme>; pages?: Record<number, number> } = {}): Promise<Blob> {
  const d: DocxModule = await import("docx");
  const t = resolveTheme(options.theme);
  const {
    AlignmentType,
    BorderStyle,
    Bookmark,
    Document,
    ExternalHyperlink,
    Footer,
    Header,
    LevelFormat,
    Packer,
    PageNumber,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableOfContents,
    TableRow,
    TabStopType,
    TextRun,
    VerticalAlignTable,
    WidthType,
    HeadingLevel,
    ImageRun,
    LineRuleType,
  } = d;

  const contentWidth = A4.width - A4.margin * 2;
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
  const line = (c: string, size = 4) => ({ style: BorderStyle.SINGLE, size, color: hex(c) });

  const runs = (text: DocText, base: { size?: number; color?: string; bold?: boolean } = {}) =>
    docRuns(text).flatMap((r) =>
      // Quebra de linha dentro do parágrafo ("\n") vira quebra do Word.
      r.text.split("\n").map((part, i) => {
        const run = new TextRun({
          text: part,
          break: i > 0 ? 1 : undefined,
          bold: r.bold ?? base.bold,
          italics: r.italic,
          strike: r.strike,
          size: base.size,
          color: r.color ? hex(r.color) : r.href ? hex(t.ink) : base.color,
          underline: r.href || r.underline ? {} : undefined,
          shading: r.highlight ? { type: ShadingType.CLEAR, color: "auto", fill: hex(r.highlight) } : undefined,
        });
        return r.href ? new ExternalHyperlink({ link: r.href, children: [run] }) : run;
      }),
    );
  const alignment = (a?: string) => (a === "center" ? AlignmentType.CENTER : a === "right" ? AlignmentType.RIGHT : a === "justify" ? AlignmentType.JUSTIFIED : undefined);

  // Imagens: baixa antes (block é síncrono). Aceita data: URL ou URL do mesmo site.
  const imageData = new Map<number, { data: Uint8Array; type: "png" | "jpg" | "gif" | "bmp" }>();
  await Promise.all(
    doc.blocks.map(async (b, i) => {
      if (b.type !== "image") return;
      const blob = await (await fetch(b.src)).blob();
      const type = blob.type.includes("png") ? "png" : blob.type.includes("gif") ? "gif" : blob.type.includes("bmp") ? "bmp" : "jpg";
      imageData.set(i, { data: new Uint8Array(await blob.arrayBuffer()), type });
    }),
  );

  const heading = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 } as const;
  const outline = documentOutline(doc);
  const anchor = (index: number) => `ds_h${index}`;
  let listInstance = 0;

  const tableCell = (children: InstanceType<DocxModule["Paragraph"]>[], opts: { fill?: string; width: number; borders?: Record<string, unknown>; columnSpan?: number; verticalMerge?: "restart" | "continue" }) =>
    new TableCell({
      children,
      columnSpan: opts.columnSpan,
      verticalMerge: opts.verticalMerge,
      width: { size: opts.width, type: WidthType.DXA },
      shading: opts.fill ? { type: ShadingType.CLEAR, color: "auto", fill: hex(opts.fill) } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlignTable.CENTER,
      borders: opts.borders as never,
    });

  function block(b: DocBlock, index: number): (InstanceType<DocxModule["Paragraph"]> | InstanceType<DocxModule["Table"]> | InstanceType<DocxModule["TableOfContents"]>)[] {
    switch (b.type) {
      case "heading": {
        const level = b.level ?? 1;
        const text = new TextRun({ text: b.text });
        return [new Paragraph({ heading: heading[level], alignment: alignment(b.align), children: level <= 2 ? [new Bookmark({ id: anchor(index), children: [text] })] : [text] })];
      }
      case "paragraph":
        return [new Paragraph({ alignment: alignment(b.align), children: runs(b.text) })];
      case "toc":
        return tocBlock();
      case "list": {
        const instance = ++listInstance;
        // Marcador pronto (do .docx) vai como texto; sem ele, numeração do Word por nível (1., 1.1., 1.1.1.).
        return b.items.map((it, i) => {
          const level = Math.min(b.levels?.[i] ?? 0, 2);
          const marker = b.markers?.[i];
          return marker && marker.length > 1
            ? new Paragraph({ indent: { left: 400 + level * 360, hanging: 360 }, spacing: { after: 60 }, children: [new TextRun({ text: `${marker}\t`, bold: true, color: hex(t.accentDeep) }), ...runs(it)] })
            : new Paragraph({ children: runs(it), numbering: { reference: b.ordered ? "ds-ordered" : "ds-bullet", level, instance }, spacing: { after: 60 } });
        });
      }
      case "table": {
        const weights = b.columns.map((c) => c.width ?? 1);
        const sum = weights.reduce((a, x) => a + x, 0);
        const widths = weights.map((w) => Math.floor((w / sum) * contentWidth));
        const align = (i: number) => (isNumericFormat(b.columns[i].format ?? "text") ? AlignmentType.RIGHT : AlignmentType.LEFT);
        // Mesmo visual da tela: cabeçalho em gelo com divisória, linhas só com divisória horizontal.
        const headerRows = b.headerRows ?? -1;
        const covered = new Map<string, "continue" | "skip">();
        for (const [key, [rs, cs]] of Object.entries(b.spans ?? {})) {
          const [r, c] = key.split(":").map(Number);
          for (let y = r; y < r + rs; y++) for (let x = c; x < c + cs; x++) if (y !== r || x !== c) covered.set(`${y}:${x}`, x === c ? "continue" : "skip");
        }
        const row = (values: CellValue[], r: number, header: boolean, total: boolean) =>
          new TableRow({
            tableHeader: header || undefined,
            cantSplit: true,
            children: b.columns.flatMap((c, i) => {
              const cov = covered.get(`${r}:${i}`);
              if (cov === "skip") return [];
              const [rs, cs] = b.spans?.[`${r}:${i}`] ?? [1, 1];
              const fill = b.fills?.[`${r}:${i}`] ?? (header || total ? t.soft : undefined);
              return [
                tableCell(
                  cov ? [new Paragraph({ children: [] })] : [new Paragraph({ alignment: align(i), spacing: { after: 0 }, children: [new TextRun({ text: formatCell({ value: values[i], format: c.format ?? "text", digits: c.digits }), bold: header || total || undefined, size: pt(header ? 9 : 9.5) })] })],
                  {
                    width: widths.slice(i, i + cs).reduce((a, x) => a + x, 0),
                    fill,
                    borders: header ? { bottom: line(t.lineStrong, 6) } : total ? { top: line(t.lineStrong, 6), bottom: line(t.line) } : { bottom: line(t.line) },
                    columnSpan: cs > 1 ? cs : undefined,
                    verticalMerge: cov === "continue" ? "continue" : rs > 1 ? "restart" : undefined,
                  },
                ),
              ];
            }),
          });
        const headRows = headerRows > 0 ? b.rows.slice(0, headerRows).map((v, r) => row(v, r, true, false)) : headerRows === 0 ? [] : [row(b.columns.map((c) => c.header), -1, true, false)];
        const bodyStart = Math.max(0, headerRows);
        const body = b.rows.slice(bodyStart).map((v, k) => row(v, bodyStart + k, false, !!b.totalRow && bodyStart + k === b.rows.length - 1));
        const out: (InstanceType<DocxModule["Paragraph"]> | InstanceType<DocxModule["Table"]>)[] = [
          new Table({ rows: [...headRows, ...body], width: { size: contentWidth, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: noBorders }),
        ];
        out.push(new Paragraph({ spacing: { before: 80, after: 200 }, children: b.caption ? [new TextRun({ text: b.caption, size: pt(8.5), color: hex(t.muted) })] : [] }));
        return out;
      }
      case "stats": {
        const w = Math.floor(contentWidth / b.items.length);
        return [
          new Table({
            width: { size: contentWidth, type: WidthType.DXA },
            columnWidths: b.items.map(() => w),
            layout: TableLayoutType.FIXED,
            borders: noBorders,
            rows: [
              new TableRow({
                children: b.items.map((s) =>
                  tableCell(
                    [
                      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: s.value, bold: true, size: pt(22), color: hex(t.ink) })] }),
                      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: s.label, size: pt(9), color: hex(t.muted) })] }),
                      ...(s.delta ? [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: s.delta, size: pt(9), bold: true, color: hex(s.good === false ? t.rose : s.good ? t.ok : t.inkSoft) })] })] : []),
                    ],
                    { width: w, borders: { top: line(t.lineStrong, 12), bottom: none, left: none, right: none } },
                  ),
                ),
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 120 }, children: [] }),
        ];
      }
      case "callout": {
        const tone = { neutral: t.lineStrong, info: color.info, ok: t.ok, amber: color.amber, rose: t.rose }[b.tone ?? "neutral"];
        return [
          new Table({
            width: { size: contentWidth, type: WidthType.DXA },
            columnWidths: [contentWidth],
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  tableCell(
                    [
                      ...(b.title ? [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: b.title, bold: true })] })] : []),
                      new Paragraph({ spacing: { after: 0 }, children: runs(b.text, { color: hex(t.inkSoft) }) }),
                    ],
                    { width: contentWidth, fill: t.soft, borders: { left: line(tone, 24), top: none, bottom: none, right: none } },
                  ),
                ],
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 120 }, children: [] }),
        ];
      }
      case "quote":
        return [
          new Paragraph({
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: hex(t.accent), space: 12 } },
            spacing: { before: 120, after: b.author ? 40 : 200 },
            children: [new TextRun({ text: `“${b.text}”`, size: pt(13), color: hex(t.ink) })],
          }),
          ...(b.author
            ? [new Paragraph({ indent: { left: 360 }, spacing: { after: 200 }, children: [new TextRun({ text: b.author, bold: true, size: pt(9.5) }), ...(b.role ? [new TextRun({ text: ` · ${b.role}`, size: pt(9.5), color: hex(t.muted) })] : [])] })]
            : []),
        ];
      case "signatures": {
        const w = Math.floor(contentWidth / b.people.length);
        return [
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Table({
            width: { size: contentWidth, type: WidthType.DXA },
            columnWidths: b.people.map(() => w),
            layout: TableLayoutType.FIXED,
            borders: noBorders,
            rows: [
              new TableRow({
                cantSplit: true,
                children: b.people.map((p) =>
                  new TableCell({
                    width: { size: w, type: WidthType.DXA },
                    margins: { left: 240, right: 240 },
                    borders: { top: none, bottom: none, left: none, right: none },
                    children: [
                      new Paragraph({ border: { top: line(t.ink, 6) }, spacing: { before: 0, after: 20 }, children: [new TextRun({ text: p.name, bold: true, size: pt(9.5) })] }),
                      ...(p.role ? [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: p.role, size: pt(9), color: hex(t.muted) })] })] : []),
                    ],
                  }),
                ),
              }),
            ],
          }),
        ];
      }
      case "image": {
        const img = imageData.get(index);
        if (!img) return [];
        const width = Math.min(b.width ?? 642, 642); // px na página A4 (largura útil), igual ao DocumentView
        const height = Math.round(width * (b.ratio ?? 9 / 16));
        return [
          new Paragraph({ spacing: { after: b.caption ? 60 : 200 }, children: [new ImageRun({ type: img.type, data: img.data, transformation: { width, height }, altText: b.alt ? { name: b.alt, description: b.alt, title: b.alt } : undefined })] }),
          ...(b.caption ? [new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: b.caption, size: pt(8.5), color: hex(t.muted) })] })] : []),
        ];
      }
      case "divider":
        return [new Paragraph({ border: { bottom: line(t.line, 6) }, spacing: { before: 120, after: 240 }, children: [] })];
      case "pageBreak":
        return [new Paragraph({ pageBreakBefore: true, children: [] })];
    }
  }

  const date = doc.date ? (toCellDate(doc.date) ?? new Date(doc.date)) : new Date();
  const dateText = formatCell({ value: date, format: "date" });
  const showCover = doc.cover !== false;

  const cover = showCover
    ? [
        new Paragraph({ spacing: { before: 4200 }, children: [] }),
        ...(doc.kicker ? [new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "——  ", color: hex(t.accent), size: pt(10) }), new TextRun({ text: doc.kicker.toUpperCase(), size: pt(9.5), color: hex(t.accentDeep), characterSpacing: 30 })] })] : []),
        new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: doc.title, bold: true, size: pt(30), color: hex(t.brand) })] }),
        ...(doc.subtitle ? [new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: doc.subtitle, size: pt(13.5), color: hex(t.muted) })] })] : []),
        new Paragraph({ border: { top: line(t.line, 6) }, spacing: { before: 2400 }, children: [] }),
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
          children: [new TextRun({ text: doc.author ?? "", size: pt(9.5), color: hex(t.inkSoft) }), new TextRun({ text: `\t${dateText}`, size: pt(9.5), color: hex(t.muted) })],
        }),
        new Paragraph({ pageBreakBefore: false, children: [], spacing: { after: 0 } }),
      ]
    : [];

  function tocBlock(pageBreakBefore = false) {
    return [
      new Paragraph({ pageBreakBefore, spacing: { after: 240 }, children: [new TextRun({ text: "Sumário", bold: true, size: pt(18), color: hex(t.brand) })] }),
      new TableOfContents("Sumário", {
        hyperlink: true,
        headingStyleRange: "1-2",
        cachedEntries: outline.map((h) => ({ title: h.text, level: h.level, page: options.pages?.[h.index], href: anchor(h.index) })),
      }),
    ];
  }
  const tocInline = doc.blocks.some((b) => b.type === "toc");
  const toc = doc.toc && !tocInline ? tocBlock(showCover) : [];

  const firstContent = doc.blocks.length ? [new Paragraph({ pageBreakBefore: showCover || (!!doc.toc && !tocInline), spacing: { after: 0 }, children: [] })] : [];
  const body = doc.blocks.flatMap((b, i) => block(b, i));

  const headerText = doc.header ?? doc.title;
  const file = new Document({
    creator: doc.author ?? "G4OS",
    title: doc.title,
    description: doc.subtitle,
    styles: {
      default: {
        document: { run: { font: t.font, size: pt(10.5), color: hex(t.ink) }, paragraph: { spacing: { after: 140, line: 288, lineRule: LineRuleType.AUTO } } },
        heading1: { run: { font: t.font, size: pt(18), bold: true, color: hex(t.brand) }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true } },
        heading2: { run: { font: t.font, size: pt(13.5), bold: true, color: hex(t.ink) }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true } },
        heading3: { run: { font: t.font, size: pt(11.5), bold: true, color: hex(t.inkSoft) }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true } },
      },
    },
    numbering: {
      config: [
        { reference: "ds-bullet", levels: ["•", "◦", "▪"].map((text, level) => ({ level, format: LevelFormat.BULLET, text, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400 + level * 360, hanging: 260 } }, run: { color: hex(t.accent) } } })) },
        { reference: "ds-ordered", levels: ["%1.", "%1.%2.", "%1.%2.%3."].map((text, level) => ({ level, format: LevelFormat.DECIMAL, text, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400 + level * 360, hanging: 300 + level * 160 } }, run: { color: hex(t.accentDeep), bold: true } } })) },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: showCover,
          page: { size: { width: A4.width, height: A4.height }, margin: { top: A4.margin + 200, bottom: A4.margin, left: A4.margin, right: A4.margin, header: 560, footer: 560 } },
        },
        headers: {
          default: new Header({ children: [new Paragraph({ border: { bottom: line(t.line, 4) }, spacing: { after: 0 }, children: [new TextRun({ text: headerText, size: pt(7.5), color: hex(t.muted) })] })] }),
          ...(showCover ? { first: new Header({ children: [new Paragraph({ children: [] })] }) } : {}),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
                children: [
                  new TextRun({ text: doc.footer ?? "", size: pt(7.5), color: hex(t.muted) }),
                  new TextRun({ children: ["\tPágina ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], size: pt(7.5), color: hex(t.muted) }),
                ],
              }),
            ],
          }),
          ...(showCover ? { first: new Footer({ children: [new Paragraph({ children: [] })] }) } : {}),
        },
        children: [...cover, ...toc, ...firstContent, ...body],
      },
    ],
  });
  const blob = await Packer.toBlob(file);
  return blob.type ? blob : new Blob([blob], { type: DOCX_MIME });
}

/** Gera e baixa o .docx. */
export async function exportDocx(doc: OfficeDocument, options: { fileName?: string; theme?: Partial<OfficeTheme>; pages?: Record<number, number> } = {}) {
  const blob = await documentToBlob(doc, options);
  downloadBlob(blob, `${options.fileName ?? fileSlug(doc.title)}.docx`);
  return blob;
}
