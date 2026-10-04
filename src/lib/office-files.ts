/**
 * Leitura de arquivos reais do Office no navegador, sem dependências:
 * descompacta o .xlsx/.docx/.pptx (DecompressionStream) e lê o XML (DOMParser).
 *
 *   const file = await readOfficeFile(blob)   // detecta pelo conteúdo
 *   file.kind === "xlsx" → <WorkbookView workbook={file.workbook} />
 *   file.kind === "docx" → <DocumentView document={file.document} />
 *   file.kind === "pptx" → <SlideDeck slides={presentationSlides(file.presentation)} />
 *
 * O objetivo é ler o conteúdo e desenhar na linguagem do DS, não reproduzir o
 * Office pixel a pixel: valores, fórmulas, formatos, títulos, listas, tabelas,
 * imagens, posição dos elementos e cores do slide entram; macros, gráficos
 * nativos, SmartArt, comentários e formatação condicional não.
 * Formatos binários antigos (.xls, .doc, .ppt) não são lidos.
 */
import { type CellFormat, type DocBlock, type DocRun, type DocTableColumn, type FileWorkbook, type GridSheet, type LaidCell, type OfficeDocument, type Presentation, type PresentationParagraph, type PresentationRun, type PresentationShape, type PresentationSlide } from "./office";

export type OfficeSource = Blob | ArrayBuffer | Uint8Array;
export type OfficeFile = { kind: "xlsx"; workbook: FileWorkbook } | { kind: "docx"; document: OfficeDocument } | { kind: "pptx"; presentation: Presentation };

/** Erro com mensagem pronta para a pessoa (pt-BR). `retryable`: tentar de novo pode resolver (rede). */
export class OfficeFileError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
  }
}

/** Limites de exibição de planilha (a grade não é virtualizada). */
export const OFFICE_SHEET_LIMITS = { rows: 2000, columns: 60 };

/* ------------------------------------------------------------------ */
/* Zip                                                                 */
/* ------------------------------------------------------------------ */

async function toBytes(src: OfficeSource) {
  if (src instanceof Uint8Array) return src;
  if (src instanceof ArrayBuffer) return new Uint8Array(src);
  return new Uint8Array(await src.arrayBuffer());
}

type ZipEntry = { method: number; size: number; offset: number };
class Zip {
  private entries = new Map<string, ZipEntry>();
  private cache = new Map<string, Promise<Uint8Array>>();
  constructor(private data: Uint8Array) {
    const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let eocd = -1;
    for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--)
      if (v.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    if (eocd < 0) throw new OfficeFileError("O arquivo está corrompido ou não é do Office.");
    const count = v.getUint16(eocd + 10, true);
    let p = v.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    for (let n = 0; n < count && v.getUint32(p, true) === 0x02014b50; n++) {
      const nameLen = v.getUint16(p + 28, true);
      const name = dec.decode(data.subarray(p + 46, p + 46 + nameLen));
      this.entries.set(name, { method: v.getUint16(p + 10, true), size: v.getUint32(p + 20, true), offset: v.getUint32(p + 42, true) });
      p += 46 + nameLen + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    }
  }
  has(name: string) {
    return this.entries.has(name);
  }
  bytes(name: string): Promise<Uint8Array> {
    const hit = this.cache.get(name);
    if (hit) return hit;
    const e = this.entries.get(name);
    if (!e) return Promise.reject(new OfficeFileError(`Parte ausente no arquivo: ${name}`));
    const v = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
    const raw = this.data.slice(start, start + e.size);
    const out =
      e.method === 0
        ? Promise.resolve(raw)
        : e.method === 8
          ? new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then((b) => new Uint8Array(b))
          : Promise.reject(new OfficeFileError("Compressão não suportada neste arquivo."));
    this.cache.set(name, out);
    return out;
  }
  async text(name: string) {
    return new TextDecoder().decode(await this.bytes(name));
  }
  async xml(name: string) {
    const doc = new DOMParser().parseFromString(await this.text(name), "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new OfficeFileError(`XML inválido em ${name}.`);
    return doc;
  }
  async dataUrl(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const mime = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", bmp: "image/bmp" } as Record<string, string>)[ext];
    if (!mime) return undefined; // emf/wmf: o navegador não desenha
    const b = await this.bytes(name);
    let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return `data:${mime};base64,${btoa(s)}`;
  }
}

/* XML: busca por nome local, ignorando prefixo de namespace. */
const kids = (el: Element | Document | null | undefined, name: string) => (el ? Array.from(el.children).filter((c) => c.localName === name) : []);
const kid = (el: Element | Document | null | undefined, name: string) => kids(el, name)[0];
const all = (el: Element | Document | null | undefined, name: string) => (el ? Array.from(el.getElementsByTagNameNS("*", name)) : []);
const first = (el: Element | Document | null | undefined, name: string) => all(el, name)[0];
const at = (el: Element | null | undefined, name: string) => el?.getAttribute(name) ?? null;
const on = (el: Element | undefined) => !!el && !["0", "false", "off"].includes(at(el, "w:val") ?? at(el, "val") ?? "1");

function resolvePath(from: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = from.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

type Rel = { target: string; type: string; external: boolean };
async function rels(zip: Zip, part: string) {
  const i = part.lastIndexOf("/");
  const path = `${part.slice(0, i)}/_rels/${part.slice(i + 1)}.rels`;
  const map = new Map<string, Rel>();
  if (!zip.has(path)) return map;
  for (const r of all(await zip.xml(path), "Relationship")) {
    const external = at(r, "TargetMode") === "External";
    const target = at(r, "Target") ?? "";
    map.set(at(r, "Id") ?? "", { target: external ? target : resolvePath(part, target), type: at(r, "Type") ?? "", external });
  }
  return map;
}
const relOfType = (m: Map<string, Rel>, suffix: string) => [...m.values()].find((r) => r.type.endsWith(suffix));

async function coreTitle(zip: Zip) {
  if (!zip.has("docProps/core.xml")) return "";
  return first(await zip.xml("docProps/core.xml"), "title")?.textContent?.trim() ?? "";
}

/* ------------------------------------------------------------------ */
/* Detecção                                                            */
/* ------------------------------------------------------------------ */

/** Lê qualquer .xlsx, .docx ou .pptx, detectando o tipo pelo conteúdo. `name` vira o título se o arquivo não tiver um. */
export async function readOfficeFile(src: OfficeSource, options: { name?: string } = {}): Promise<OfficeFile> {
  const data = await toBytes(src);
  if (data[0] === 0xd0 && data[1] === 0xcf && data[2] === 0x11 && data[3] === 0xe0)
    throw new OfficeFileError("Formato antigo do Office (.xls, .doc ou .ppt). Salve como .xlsx, .docx ou .pptx e abra de novo.");
  if (data[0] !== 0x50 || data[1] !== 0x4b) throw new OfficeFileError("Este arquivo não é uma planilha, documento ou apresentação do Office.");
  const zip = new Zip(data);
  if (zip.has("xl/workbook.xml")) return { kind: "xlsx", workbook: await parseXlsx(zip, options.name) };
  if (zip.has("word/document.xml")) return { kind: "docx", document: await parseDocx(zip, options.name) };
  if (zip.has("ppt/presentation.xml")) return { kind: "pptx", presentation: await parsePptx(zip, options.name) };
  throw new OfficeFileError("Este arquivo não é uma planilha, documento ou apresentação do Office.");
}

const titleFromName = (name?: string) => (name ? name.replace(/\.[^.]+$/, "") : "");

export async function readXlsx(src: OfficeSource, options: { name?: string } = {}) {
  return parseXlsx(new Zip(await toBytes(src)), options.name);
}
export async function readDocx(src: OfficeSource, options: { name?: string } = {}) {
  return parseDocx(new Zip(await toBytes(src)), options.name);
}
export async function readPptx(src: OfficeSource, options: { name?: string } = {}) {
  return parsePptx(new Zip(await toBytes(src)), options.name);
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

const DATE_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);

/** Traduz o formato numérico do Excel para o formato do DS. */
function numberFormat(id: number, code?: string): { format: CellFormat; digits?: number } {
  const builtin: Record<number, { format: CellFormat; digits?: number }> = { 1: { format: "integer" }, 2: { format: "number", digits: 2 }, 3: { format: "integer" }, 4: { format: "number", digits: 2 }, 9: { format: "percent", digits: 0 }, 10: { format: "percent", digits: 2 }, 49: { format: "text" } };
  if (DATE_IDS.has(id)) return { format: "date" };
  if (builtin[id]) return builtin[id];
  if (!code || id === 0) return { format: "number", digits: 6 }; // Geral
  const bare = code.split(";")[0].replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\\./g, "");
  const decimals = /\.(0+)/.exec(bare)?.[1].length ?? 0;
  if (bare.includes("%")) return { format: "percent", digits: decimals };
  if (/[dmyhs]/i.test(bare) && !/[0#]/.test(bare)) return { format: "date" };
  if (/R\$/.test(code)) return { format: "currency" };
  if (/[0#]/.test(bare)) return decimals ? { format: "number", digits: decimals } : { format: "integer" };
  return { format: "number", digits: 6 };
}

const cellRef = (ref: string) => {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  let c = 0;
  for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
  return { r: Number(m[2]) - 1, c: c - 1 };
};

const serialToDate = (n: number, date1904: boolean) => {
  const days = Math.floor(n) + (date1904 ? 1462 : 0);
  const d = new Date(1899, 11, 30 + days);
  const secs = Math.round((n - Math.floor(n)) * 86400);
  if (secs) d.setSeconds(secs);
  return d;
};

async function parseXlsx(zip: Zip, name?: string): Promise<FileWorkbook> {
  const wb = await zip.xml("xl/workbook.xml");
  const wbRels = await rels(zip, "xl/workbook.xml");
  const date1904 = ["1", "true"].includes(at(first(wb, "workbookPr"), "date1904") ?? "");

  const shared = zip.has("xl/sharedStrings.xml")
    ? kids(first(await zip.xml("xl/sharedStrings.xml"), "sst"), "si").map((si) => [...kids(si, "t"), ...kids(si, "r").flatMap((r) => kids(r, "t"))].map((t) => t.textContent ?? "").join(""))
    : [];

  const styles = zip.has("xl/styles.xml") ? await zip.xml("xl/styles.xml") : null;
  const codes = new Map(all(styles, "numFmt").map((n) => [Number(at(n, "numFmtId")), at(n, "formatCode") ?? ""]));
  const fonts = kids(first(styles, "fonts"), "font").map((f) => on(kid(f, "b")));
  const xfs = kids(first(styles, "cellXfs"), "xf").map((xf) => {
    const id = Number(at(xf, "numFmtId") ?? 0);
    return { ...numberFormat(id, codes.get(id)), bold: fonts[Number(at(xf, "fontId") ?? 0)] ?? false };
  });

  const sheets: GridSheet[] = [];
  for (const s of kids(first(wb, "sheets"), "sheet")) {
    if (at(s, "state") === "hidden" || at(s, "state") === "veryHidden") continue;
    const rel = wbRels.get(at(s, "r:id") ?? "");
    if (!rel || !zip.has(rel.target)) continue;
    const doc = await zip.xml(rel.target);
    const cells = new Map<string, LaidCell>();
    let maxR = -1;
    let maxC = -1;
    let truncated = false;
    for (const row of all(first(doc, "sheetData"), "row")) {
      for (const c of kids(row, "c")) {
        const pos = cellRef(at(c, "r") ?? "");
        if (!pos) continue;
        if (pos.r >= OFFICE_SHEET_LIMITS.rows || pos.c >= OFFICE_SHEET_LIMITS.columns) {
          truncated = true;
          continue;
        }
        const t = at(c, "t");
        const v = kid(c, "v")?.textContent ?? null;
        const f = kid(c, "f")?.textContent || undefined;
        const style = xfs[Number(at(c, "s") ?? 0)] ?? { format: "number" as CellFormat, digits: 6, bold: false };
        let value: LaidCell["value"] = null;
        let format: CellFormat = style.format;
        if (t === "s") value = shared[Number(v)] ?? "";
        else if (t === "inlineStr") value = all(c, "t").map((x) => x.textContent ?? "").join("");
        else if (t === "str" || t === "e") value = v ?? "";
        else if (t === "b") value = v === "1";
        else if (v !== null && v !== "") value = Number(v);
        if (typeof value !== "number") format = "text";
        else if (format === "date") value = serialToDate(value, date1904);
        else if (format === "text") format = "number";
        if (value === null && !f) continue;
        cells.set(`${pos.r}:${pos.c}`, { value, formula: f, role: "data", format, digits: style.digits, bold: style.bold || undefined });
        maxR = Math.max(maxR, pos.r);
        maxC = Math.max(maxC, pos.c);
      }
    }
    const colCount = Math.max(maxC + 1, 1);
    const rowCount = Math.max(maxR + 1, 1);

    // Mescla que começa em A e cobre a linha inteira (título, faixa) vira célula larga.
    for (const m of all(doc, "mergeCell")) {
      const [a, b] = (at(m, "ref") ?? "").split(":").map(cellRef);
      if (!a || !b || a.c !== 0 || a.r !== b.r || b.c < Math.min(colCount - 1, 2)) continue;
      const cell = cells.get(`${a.r}:0`);
      if (cell && ![...cells.keys()].some((k) => k.startsWith(`${a.r}:`) && k !== `${a.r}:0`)) cell.span = true;
    }

    const pane = first(doc, "pane");
    const frozen = at(pane, "state") === "frozen" || at(pane, "state") === "frozenSplit";
    const ySplit = frozen ? Math.round(Number(at(pane, "ySplit") ?? 0)) : 0;
    const xSplit = frozen ? Math.round(Number(at(pane, "xSplit") ?? 0)) : 0;
    const headerRow = ySplit > 0 ? ySplit - 1 : -1;

    const widths = Array.from({ length: colCount }, () => 9);
    for (const col of all(first(doc, "cols"), "col")) {
      const min = Number(at(col, "min")) - 1;
      const max = Math.min(Number(at(col, "max")) - 1, colCount - 1);
      const w = Number(at(col, "width") ?? 9);
      for (let i = min; i <= max; i++) widths[i] = at(col, "hidden") === "1" ? 3 : Math.min(Math.max(w, 3), 60);
    }

    const rows: (LaidCell | null)[][] = Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: colCount }, (_, c) => {
        const cell = cells.get(`${r}:${c}`) ?? null;
        if (cell && r === headerRow && !cell.span) cell.role = "header";
        return cell;
      }),
    );
    sheets.push({
      name: at(s, "name") ?? `Planilha ${sheets.length + 1}`,
      freezeColumns: xSplit,
      truncated,
      layout: { rows, colCount, headerRow, firstDataRow: headerRow + 1, lastDataRow: rowCount - 1, totalRow: null, widths },
    });
  }
  return { title: (await coreTitle(zip)) || titleFromName(name) || "Planilha", sheets };
}

/* ------------------------------------------------------------------ */
/* Word                                                                */
/* ------------------------------------------------------------------ */

const EMU_PER_PX = 9525;
const NUMERIC_TEXT = /^[(\-−+]?\s*(R\$|US\$|\$|€)?\s*[\d.,]+\s*(%|p\.p\.|mi|mil|bi)?\)?$/;

async function parseDocx(zip: Zip, name?: string): Promise<OfficeDocument> {
  const doc = await zip.xml("word/document.xml");
  const docRels = await rels(zip, "word/document.xml");
  const styleNames = new Map<string, string>();
  // Listas também vêm do estilo ("List Bullet", "List Number"): numeração no pPr do estilo.
  const styleNum = new Map<string, string>();
  if (zip.has("word/styles.xml"))
    for (const st of all(await zip.xml("word/styles.xml"), "style")) {
      const id = at(st, "w:styleId") ?? "";
      styleNames.set(id, (at(kid(st, "name"), "w:val") ?? "").toLowerCase());
      const num = at(first(kid(kid(st, "pPr"), "numPr"), "numId"), "w:val");
      if (num) styleNum.set(id, num);
    }
  const ordered = new Map<string, boolean>();
  if (zip.has("word/numbering.xml")) {
    const nx = await zip.xml("word/numbering.xml");
    const abstract = new Map(kids(first(nx, "numbering"), "abstractNum").map((a) => [at(a, "w:abstractNumId"), at(kid(kids(a, "lvl").find((l) => at(l, "w:ilvl") === "0"), "numFmt"), "w:val")]));
    for (const n of kids(first(nx, "numbering"), "num")) ordered.set(at(n, "w:numId") ?? "", (abstract.get(at(kid(n, "abstractNumId"), "w:val")) ?? "bullet") !== "bullet");
  }

  const blocks: DocBlock[] = [];
  let title = "";
  let list: { numId: string; block: Extract<DocBlock, { type: "list" }> } | null = null;

  const runsOf = (p: Element): { runs: DocRun[]; pageBreak: boolean } => {
    const out: DocRun[] = [];
    let pageBreak = false;
    const walk = (el: Element, href?: string) => {
      for (const ch of Array.from(el.children)) {
        if (ch.localName === "hyperlink") {
          const rel = docRels.get(at(ch, "r:id") ?? "");
          walk(ch, rel?.external ? rel.target : undefined);
        } else if (ch.localName === "r") {
          const pr = kid(ch, "rPr");
          let text = "";
          for (const t of Array.from(ch.children)) {
            if (t.localName === "t") text += t.textContent ?? "";
            else if (t.localName === "tab") text += " ";
            else if (t.localName === "br" && at(t, "w:type") === "page") pageBreak = true;
            else if (t.localName === "br") text += " ";
          }
          if (!text) continue;
          const run: DocRun = { text, bold: on(kid(pr, "b")) || undefined, italic: on(kid(pr, "i")) || undefined, href };
          const prev = out[out.length - 1];
          if (prev && prev.bold === run.bold && prev.italic === run.italic && prev.href === run.href) prev.text += text;
          else out.push(run);
        } else if (["ins", "smartTag", "sdt", "sdtContent", "fldSimple"].includes(ch.localName)) walk(ch, href);
      }
    };
    walk(p);
    return { runs: out, pageBreak };
  };

  const images = async (p: Element) => {
    const out: DocBlock[] = [];
    for (const drawing of all(p, "drawing")) {
      const blip = first(drawing, "blip");
      const rel = docRels.get(at(blip, "r:embed") ?? "");
      const src = rel && !rel.external && zip.has(rel.target) ? await zip.dataUrl(rel.target) : undefined;
      if (!src) continue;
      const ext = first(drawing, "extent");
      const cx = Number(at(ext, "cx") ?? 0);
      const cy = Number(at(ext, "cy") ?? 0);
      out.push({ type: "image", src, alt: at(first(drawing, "docPr"), "descr") ?? at(first(drawing, "docPr"), "name") ?? undefined, width: cx ? Math.round(cx / EMU_PER_PX) : undefined, ratio: cx && cy ? cy / cx : undefined });
    }
    return out;
  };

  const body = first(doc, "body");
  for (const el of Array.from(body?.children ?? [])) {
    if (el.localName === "p") {
      const pPr = kid(el, "pPr");
      const styleId = at(kid(pPr, "pStyle"), "w:val") ?? "";
      const style = styleNames.get(styleId) ?? styleId.toLowerCase();
      if (kid(pPr, "pageBreakBefore") && on(kid(pPr, "pageBreakBefore")) && blocks.length) blocks.push({ type: "pageBreak" });
      const { runs, pageBreak } = runsOf(el);
      const text = runs.map((r) => r.text).join("").trim();
      const numId = at(first(kid(pPr, "numPr"), "numId"), "w:val") ?? styleNum.get(styleId) ?? (/^list (bullet|number)/.test(style) ? style : null);
      if (text) {
        const heading = /^heading (\d)$/.exec(style);
        if (style === "title") {
          if (!title) title = text;
          blocks.push({ type: "heading", text, level: 1 });
          list = null;
        } else if (heading) {
          blocks.push({ type: "heading", text, level: Math.min(Number(heading[1]), 3) as 1 | 2 | 3 });
          list = null;
        } else if (numId && numId !== "0") {
          if (!list || list.numId !== numId) {
            list = { numId, block: { type: "list", items: [], ordered: ordered.get(numId) ?? style.startsWith("list number") } };
            blocks.push(list.block);
          }
          list.block.items.push(runs);
        } else {
          list = null;
          blocks.push(style === "quote" || style === "intense quote" ? { type: "quote", text } : { type: "paragraph", text: runs });
        }
      }
      const imgs = await images(el);
      if (imgs.length) {
        list = null;
        blocks.push(...imgs);
      }
      if (pageBreak) blocks.push({ type: "pageBreak" });
    } else if (el.localName === "tbl") {
      list = null;
      const rows = kids(el, "tr").map((tr) => kids(tr, "tc").map((tc) => kids(tc, "p").map((p) => runsOf(p).runs.map((r) => r.text).join("")).join(" ").trim()));
      if (!rows.length) continue;
      const width = Math.max(...rows.map((r) => r.length));
      const [head, ...data] = rows;
      const columns: DocTableColumn[] = Array.from({ length: width }, (_, i) => {
        const vals = data.map((r) => r[i] ?? "").filter(Boolean);
        const numeric = vals.length > 0 && vals.filter((v) => NUMERIC_TEXT.test(v)).length >= vals.length * 0.8;
        // Formato numérico só alinha à direita: o texto do arquivo é mantido como está.
        return { header: head[i] ?? "", format: numeric ? "number" : "text" };
      });
      blocks.push({ type: "table", columns, rows: data.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? "")) });
    }
  }
  while (blocks[blocks.length - 1]?.type === "pageBreak") blocks.pop();
  return { title: (await coreTitle(zip)) || title || titleFromName(name) || "Documento", cover: false, blocks };
}

/* ------------------------------------------------------------------ */
/* PowerPoint                                                          */
/* ------------------------------------------------------------------ */

type Theme = Record<string, string>;
const SCHEME_ALIAS: Record<string, string> = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };

function hexToHsl(hex: string) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToHex(h: number, s: number, l: number) {
  const f = (p: number, q: number, t: number) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0");
  return s === 0 ? `${ch(l)}${ch(l)}${ch(l)}` : `${ch(f(p, q, h + 1 / 3))}${ch(f(p, q, h))}${ch(f(p, q, h - 1 / 3))}`;
}

/** Cor de um elemento com solidFill/srgbClr/schemeClr/sysClr (+ lumMod/lumOff). */
function colorOf(el: Element | undefined, theme: Theme): string | undefined {
  if (!el) return undefined;
  const c = Array.from(el.children).find((x) => ["srgbClr", "schemeClr", "sysClr", "prstClr"].includes(x.localName));
  if (!c) return undefined;
  let hex =
    c.localName === "srgbClr" ? at(c, "val") : c.localName === "sysClr" ? at(c, "lastClr") : c.localName === "schemeClr" ? theme[SCHEME_ALIAS[at(c, "val") ?? ""] ?? at(c, "val") ?? ""] : ({ black: "000000", white: "FFFFFF" } as Record<string, string>)[at(c, "val") ?? ""];
  if (!hex) return undefined;
  const mod = Number(at(kid(c, "lumMod"), "val") ?? 100000) / 100000;
  const off = Number(at(kid(c, "lumOff"), "val") ?? 0) / 100000;
  if (mod !== 1 || off) {
    const [h, s, l] = hexToHsl(hex);
    hex = hslToHex(h, s, l * mod + off);
  }
  return `#${hex.toUpperCase()}`;
}
const fillOf = (spPr: Element | undefined, theme: Theme) => (kid(spPr, "noFill") ? undefined : colorOf(kid(spPr, "solidFill"), theme));

type Xfrm = { x: number; y: number; w: number; h: number; rot?: number };
const xfrmOf = (el: Element | undefined): Xfrm | undefined => {
  const off = kid(el, "off");
  const ext = kid(el, "ext");
  if (!off || !ext) return undefined;
  return { x: Number(at(off, "x")), y: Number(at(off, "y")), w: Number(at(ext, "cx")), h: Number(at(ext, "cy")), rot: Number(at(el, "rot") ?? 0) / 60000 || undefined };
};

type Placeholder = { xfrm?: Xfrm; anchor?: string; size?: number[]; color?: string; bullet?: boolean; align?: string };
type PhKind = "title" | "body" | "other";
const phKind = (type: string | null): PhKind => (type === "title" || type === "ctrTitle" ? "title" : !type || type === "body" || type === "subTitle" || type === "obj" ? "body" : "other");

/** Tamanhos por nível (lvl1pPr…lvl9pPr defRPr sz), cor e marcador de uma lista de estilos. */
function levelStyles(list: Element | undefined, theme: Theme) {
  const size: number[] = [];
  let color: string | undefined;
  let bullet: boolean | undefined;
  let align: string | undefined;
  for (let i = 1; i <= 9; i++) {
    const lvl = kid(list, `lvl${i}pPr`);
    const sz = at(kid(lvl, "defRPr"), "sz");
    if (sz) size[i - 1] = Number(sz) / 100;
    if (i === 1) {
      color = colorOf(kid(kid(lvl, "defRPr"), "solidFill"), theme);
      align = at(lvl, "algn") ?? undefined;
      if (kid(lvl, "buNone")) bullet = false;
      else if (kid(lvl, "buChar") || kid(lvl, "buAutoNum")) bullet = true;
    }
  }
  return { size, color, bullet, align };
}

async function placeholders(zip: Zip, part: string, theme: Theme) {
  const map = new Map<string, Placeholder>();
  if (!part || !zip.has(part)) return map;
  const doc = await zip.xml(part);
  for (const sp of all(first(doc, "spTree"), "sp")) {
    const ph = first(kid(sp, "nvSpPr"), "ph");
    if (!ph) continue;
    const type = at(ph, "type");
    const st = levelStyles(first(kid(sp, "txBody"), "lstStyle"), theme);
    const entry: Placeholder = { xfrm: xfrmOf(first(kid(sp, "spPr"), "xfrm")), anchor: at(first(kid(sp, "txBody"), "bodyPr"), "anchor") ?? undefined, size: st.size.length ? st.size : undefined, color: st.color, bullet: st.bullet, align: st.align };
    if (at(ph, "idx")) map.set(`idx:${at(ph, "idx")}`, entry);
    map.set(`type:${type ?? "body"}`, entry);
    if (!map.has(`kind:${phKind(type)}`)) map.set(`kind:${phKind(type)}`, entry);
  }
  return map;
}

async function parsePptx(zip: Zip, name?: string): Promise<Presentation> {
  const pres = await zip.xml("ppt/presentation.xml");
  const presRels = await rels(zip, "ppt/presentation.xml");
  const size = first(pres, "sldSz");
  const W = Number(at(size, "cx") ?? 12192000);
  const H = Number(at(size, "cy") ?? 6858000);
  const masterCache = new Map<string, { theme: Theme; ph: Map<string, Placeholder>; styles: Record<PhKind, ReturnType<typeof levelStyles>>; bg?: string }>();
  const layoutCache = new Map<string, { ph: Map<string, Placeholder>; bg?: string; master: string }>();

  const bgOf = (doc: Document, theme: Theme) => {
    const bg = first(doc, "bg");
    return colorOf(kid(kid(bg, "bgPr"), "solidFill"), theme) ?? colorOf(kid(bg, "bgRef"), theme);
  };

  async function master(path: string) {
    if (masterCache.has(path)) return masterCache.get(path)!;
    const doc = await zip.xml(path);
    const mRels = await rels(zip, path);
    const theme: Theme = {};
    const themePath = relOfType(mRels, "/theme")?.target;
    if (themePath && zip.has(themePath))
      for (const c of Array.from(first(await zip.xml(themePath), "clrScheme")?.children ?? [])) theme[c.localName] = at(kid(c, "srgbClr"), "val") ?? at(kid(c, "sysClr"), "lastClr") ?? "";
    const tx = first(doc, "txStyles");
    const m = { theme, ph: await placeholders(zip, path, theme), styles: { title: levelStyles(kid(tx, "titleStyle"), theme), body: levelStyles(kid(tx, "bodyStyle"), theme), other: levelStyles(kid(tx, "otherStyle"), theme) }, bg: bgOf(doc, theme) };
    masterCache.set(path, m);
    return m;
  }
  async function layout(path: string) {
    if (layoutCache.has(path)) return layoutCache.get(path)!;
    const lRels = await rels(zip, path);
    const masterPath = relOfType(lRels, "/slideMaster")?.target ?? "";
    const m = await master(masterPath);
    const l = { ph: await placeholders(zip, path, m.theme), bg: bgOf(await zip.xml(path), m.theme), master: masterPath };
    layoutCache.set(path, l);
    return l;
  }

  const slides: PresentationSlide[] = [];
  const ids = kids(first(pres, "sldIdLst"), "sldId");
  for (const [n, id] of ids.entries()) {
    const path = presRels.get(at(id, "r:id") ?? "")?.target;
    if (!path || !zip.has(path)) continue;
    const doc = await zip.xml(path);
    if (at(doc.documentElement, "show") === "0") continue; // slide oculto
    const sRels = await rels(zip, path);
    const l = await layout(relOfType(sRels, "/slideLayout")?.target ?? "");
    const m = await master(l.master);
    const theme = m.theme;
    const textColor = theme.dk1 ? `#${theme.dk1}` : undefined;
    const shapes: PresentationShape[] = [];
    let title = "";

    const text = (txBody: Element | undefined, kind: PhKind | null, ph?: Placeholder, lph?: Placeholder): Pick<PresentationShape, "paragraphs" | "anchor" | "inset" | "fontScale"> => {
      const bodyPr = kid(txBody, "bodyPr");
      const local = levelStyles(kid(txBody, "lstStyle"), theme);
      const base = kind ? m.styles[kind] : m.styles.other;
      const sizeAt = (lvl: number) => local.size[lvl] ?? ph?.size?.[lvl] ?? lph?.size?.[lvl] ?? (kind ? base.size[lvl] : undefined) ?? (kind === "title" ? 44 : 18);
      const colorDefault = local.color ?? ph?.color ?? lph?.color ?? (kind ? base.color : undefined) ?? textColor;
      const alignDefault = local.align ?? ph?.align ?? lph?.align ?? (kind ? base.align : undefined);
      const bulletDefault = local.bullet ?? ph?.bullet ?? lph?.bullet ?? (kind === "body" ? (base.bullet ?? true) : false);
      const paragraphs: PresentationParagraph[] = kids(txBody, "p").map((p) => {
        const pPr = kid(p, "pPr");
        const lvl = Number(at(pPr, "lvl") ?? 0);
        const runs: PresentationRun[] = [];
        for (const r of Array.from(p.children)) {
          if (r.localName === "r" || r.localName === "fld") {
            const rPr = kid(r, "rPr");
            const sz = at(rPr, "sz");
            runs.push({ text: kid(r, "t")?.textContent ?? "", bold: at(rPr, "b") === "1" || undefined, italic: at(rPr, "i") === "1" || undefined, underline: !!at(rPr, "u") && at(rPr, "u") !== "none" ? true : undefined, size: sz ? Number(sz) / 100 : undefined, color: colorOf(kid(rPr, "solidFill"), theme) });
          } else if (r.localName === "br") runs.push({ text: "\n" });
        }
        const hasText = runs.some((r) => r.text.trim());
        const bullet = !hasText || kid(pPr, "buNone") ? undefined : kid(pPr, "buChar") ? (at(kid(pPr, "buChar"), "char") ?? "•") : kid(pPr, "buAutoNum") ? "#" : bulletDefault ? "•" : undefined;
        const algn = at(pPr, "algn") ?? alignDefault;
        return { runs, level: lvl, bullet, size: sizeAt(lvl), color: colorDefault, align: algn === "ctr" ? "center" : algn === "r" ? "right" : algn === "just" ? "justify" : undefined };
      });
      let n = 1;
      for (const p of paragraphs) if (p.bullet === "#") p.bullet = `${n++}.`;
      const anchor = at(bodyPr, "anchor") ?? ph?.anchor ?? lph?.anchor ?? (kind === "title" ? "ctr" : "t");
      const ins = (k: string, d: number) => Number(at(bodyPr, k) ?? d) / W;
      const scale = at(kid(bodyPr, "normAutofit"), "fontScale");
      return { paragraphs, anchor: anchor === "ctr" ? "middle" : anchor === "b" ? "bottom" : "top", inset: [ins("tIns", 45720), ins("rIns", 91440), ins("bIns", 45720), ins("lIns", 91440)], fontScale: scale ? Number(scale) / 100000 : undefined };
    };

    type Map2 = (x: Xfrm) => Xfrm;
    const walk = async (tree: Element | undefined, map: Map2) => {
      for (const el of Array.from(tree?.children ?? [])) {
        if (el.localName === "sp") {
          const ph = first(kid(el, "nvSpPr"), "ph");
          const type = ph ? at(ph, "type") : null;
          const kind = ph ? phKind(type) : null;
          const key = (k: Map<string, Placeholder>) => (ph ? (at(ph, "idx") && k.get(`idx:${at(ph, "idx")}`)) || k.get(`type:${type ?? "body"}`) || k.get(`kind:${kind}`) : undefined);
          const lph = key(l.ph);
          const mph = key(m.ph);
          const spPr = kid(el, "spPr");
          const xf = xfrmOf(kid(spPr, "xfrm")) ?? lph?.xfrm ?? mph?.xfrm;
          if (!xf) continue;
          const t = map(xf);
          const body = text(kid(el, "txBody"), kind, lph, mph);
          // Forma desenhada sem cor própria herda a do estilo (fillRef, geralmente accent1).
          const fillRef = first(kid(el, "style"), "fillRef");
          const fill = fillOf(spPr, theme) ?? (!kind && !kid(spPr, "noFill") && fillRef && at(fillRef, "idx") !== "0" ? colorOf(fillRef, theme) : undefined);
          const geom = at(kid(spPr, "prstGeom"), "prst");
          const plain = (body.paragraphs ?? []).map((p) => p.runs.map((r) => r.text).join("")).join(" ").trim();
          if (kind === "title" && plain && !title) title = plain;
          if (!plain && !fill && !kid(kid(spPr, "ln"), "solidFill")) continue;
          shapes.push({ kind: "text", x: t.x / W, y: t.y / H, w: t.w / W, h: t.h / H, rotation: t.rot, fill, line: kid(kid(spPr, "ln"), "noFill") ? undefined : colorOf(kid(kid(spPr, "ln"), "solidFill"), theme), geometry: geom === "roundRect" ? "roundRect" : geom === "ellipse" ? "ellipse" : "rect", ...body });
        } else if (el.localName === "pic") {
          const xf = xfrmOf(first(kid(el, "spPr"), "xfrm"));
          const rel = sRels.get(at(first(el, "blip"), "r:embed") ?? "");
          const src = xf && rel && !rel.external && zip.has(rel.target) ? await zip.dataUrl(rel.target) : undefined;
          if (!xf || !src) continue;
          const t = map(xf);
          shapes.push({ kind: "image", x: t.x / W, y: t.y / H, w: t.w / W, h: t.h / H, rotation: t.rot, src, alt: at(first(el, "cNvPr"), "descr") ?? undefined });
        } else if (el.localName === "graphicFrame") {
          const tbl = first(el, "tbl");
          const xf = xfrmOf(kid(el, "xfrm"));
          if (!tbl || !xf) continue;
          const t = map(xf);
          shapes.push({ kind: "table", x: t.x / W, y: t.y / H, w: t.w / W, h: t.h / H, rows: kids(tbl, "tr").map((tr) => kids(tr, "tc").map((tc) => all(tc, "t").map((x) => x.textContent ?? "").join(""))) });
        } else if (el.localName === "grpSp") {
          const g = first(kid(el, "grpSpPr"), "xfrm");
          const off = xfrmOf(g);
          const ch = { x: Number(at(kid(g, "chOff"), "x") ?? 0), y: Number(at(kid(g, "chOff"), "y") ?? 0), w: Number(at(kid(g, "chExt"), "cx") ?? 0), h: Number(at(kid(g, "chExt"), "cy") ?? 0) };
          const inner: Map2 = off && ch.w && ch.h ? (x) => map({ x: off.x + ((x.x - ch.x) * off.w) / ch.w, y: off.y + ((x.y - ch.y) * off.h) / ch.h, w: (x.w * off.w) / ch.w, h: (x.h * off.h) / ch.h, rot: x.rot }) : map;
          await walk(el, inner);
        }
      }
    };
    await walk(first(doc, "spTree"), (x) => x);

    let notes: string | undefined;
    const notesPath = relOfType(sRels, "/notesSlide")?.target;
    if (notesPath && zip.has(notesPath)) {
      const nd = await zip.xml(notesPath);
      const body = all(nd, "sp").find((sp) => at(first(sp, "ph"), "type") === "body");
      notes = kids(kid(body, "txBody"), "p").map((p) => all(p, "t").map((t) => t.textContent ?? "").join("")).filter(Boolean).join("\n") || undefined;
    }
    slides.push({ title: title || `Slide ${n + 1}`, background: bgOf(doc, theme) ?? l.bg ?? m.bg ?? (theme.lt1 ? `#${theme.lt1}` : undefined), shapes, notes });
  }
  return { title: (await coreTitle(zip)) || titleFromName(name) || "Apresentação", aspect: W / H, width: W / 12700, slides };
}
