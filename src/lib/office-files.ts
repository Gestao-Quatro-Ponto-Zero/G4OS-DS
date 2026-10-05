/**
 * Leitura de arquivos reais do Office no navegador, sem dependências:
 * descompacta o .xlsx/.docx/.pptx (DecompressionStream) e lê o XML (DOMParser).
 * CSV/TSV também (separador e vírgula decimal detectados; UTF-8 ou Windows-1252).
 *
 *   const file = await readOfficeFile(blob)   // detecta pelo conteúdo
 *   file.kind === "xlsx" | "csv" → <WorkbookView workbook={file.workbook} />
 *   file.kind === "docx"         → <DocumentView document={file.document} />
 *   file.kind === "pptx"         → <SlideDeck slides={presentationSlides(file.presentation)} />
 *
 * O objetivo é o conteúdo na linguagem do DS, cobrindo o que aparece na
 * maioria dos arquivos de empresa (ver docs/guias/office.md): valores,
 * fórmulas, formatos, cores de célula, mesclas, gráficos, listas em níveis,
 * tabelas mescladas, modelo e fundo do slide, formas, linhas e imagens.
 * Formatos binários antigos (.xls, .doc, .ppt, .xlsb) não são lidos.
 */
import {
  type CellFormat,
  type CellStyle,
  type CellValue,
  type DocAlign,
  type DocBlock,
  type DocRun,
  type DocTableColumn,
  type FileWorkbook,
  type GridSheet,
  type LaidCell,
  type OfficeChart,
  type OfficeDocument,
  type Presentation,
  type PresentationParagraph,
  type PresentationRun,
  type PresentationShape,
  type PresentationSlide,
} from "./office";

export type OfficeSource = Blob | ArrayBuffer | Uint8Array;
export type OfficeFile = { kind: "xlsx"; workbook: FileWorkbook } | { kind: "csv"; workbook: FileWorkbook } | { kind: "docx"; document: OfficeDocument } | { kind: "pptx"; presentation: Presentation };

/**
 * Erro de leitura com motivo, para a tela escolher título e saída:
 * legacy (.xls/.doc/.ppt/.xlsb), protected (senha), unsupported (não é Office), corrupt, network.
 */
export type OfficeFileErrorCode = "legacy" | "protected" | "unsupported" | "corrupt" | "network";
export class OfficeFileError extends Error {
  constructor(
    readonly code: OfficeFileErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/** Limites de leitura de planilha. A grade só desenha as linhas visíveis. */
export const OFFICE_SHEET_LIMITS = { rows: 50000, columns: 200 };

/* ------------------------------------------------------------------ */
/* Zip e XML                                                           */
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
  private xmlCache = new Map<string, Promise<Document>>();
  constructor(private data: Uint8Array) {
    const v = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let eocd = -1;
    for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--)
      if (v.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    if (eocd < 0) throw new OfficeFileError("corrupt", "O arquivo está corrompido ou incompleto.");
    const count = v.getUint16(eocd + 10, true);
    let p = v.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    // Diretório central fora do arquivo ou cortado: corrompido (não estoura com RangeError).
    for (let n = 0; n < count && p + 46 <= data.length && v.getUint32(p, true) === 0x02014b50; n++) {
      const nameLen = v.getUint16(p + 28, true);
      // Alguns programas gravam "xl\worksheets\sheet1.xml": normaliza para "/".
      const name = dec.decode(data.subarray(p + 46, p + 46 + nameLen)).replace(/\\/g, "/");
      // Nomes de parte no pacote do Office não diferenciam maiúsculas (sharedstrings.xml = sharedStrings.xml).
      this.entries.set(name.toLowerCase(), { method: v.getUint16(p + 10, true), size: v.getUint32(p + 20, true), offset: v.getUint32(p + 42, true) });
      p += 46 + nameLen + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    }
    if (!this.entries.size) throw new OfficeFileError("corrupt", "O arquivo está corrompido ou incompleto.");
  }
  has(name: string) {
    return this.entries.has(name.toLowerCase());
  }
  bytes(name: string): Promise<Uint8Array> {
    const hit = this.cache.get(name);
    if (hit) return hit;
    const e = this.entries.get(name.toLowerCase());
    if (!e) return Promise.reject(new OfficeFileError("corrupt", `Parte ausente no arquivo: ${name}`));
    const v = new DataView(this.data.buffer, this.data.byteOffset, this.data.byteLength);
    if (e.offset + 30 > this.data.length) return Promise.reject(new OfficeFileError("corrupt", "O arquivo está corrompido ou incompleto."));
    const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
    const raw = this.data.slice(start, start + e.size);
    const out =
      e.method === 0
        ? Promise.resolve(raw)
        : e.method === 8
          ? new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then((b) => new Uint8Array(b))
          : Promise.reject(new OfficeFileError("corrupt", "Compressão não suportada neste arquivo."));
    this.cache.set(name, out);
    return out;
  }
  async text(name: string) {
    return new TextDecoder().decode(await this.bytes(name));
  }
  xml(name: string): Promise<Document> {
    const hit = this.xmlCache.get(name);
    if (hit) return hit;
    const out = this.text(name).then((t) => {
      const doc = new DOMParser().parseFromString(t, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) throw new OfficeFileError("corrupt", `XML inválido em ${name}.`);
      return doc;
    });
    this.xmlCache.set(name, out);
    return out;
  }
  async dataUrl(name: string) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const mime = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", bmp: "image/bmp" } as Record<string, string>)[ext];
    if (!mime || !this.has(name)) return undefined; // emf/wmf: o navegador não desenha
    const b = await this.bytes(name);
    let s = "";
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return `data:${mime};base64,${btoa(s)}`;
  }
}

/* XML: busca por nome local, ignorando o prefixo de namespace. */
// Laço direto nos filhos (sem criar arrays): planilha grande tem centenas de milhares de células.
const kids = (el: Element | Document | null | undefined, name: string) => {
  const out: Element[] = [];
  for (let c = el?.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name) out.push(c);
  return out;
};
const kid = (el: Element | Document | null | undefined, name: string) => {
  for (let c = el?.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name) return c;
  return undefined;
};
const all = (el: Element | Document | null | undefined, name: string) => (el ? Array.from(el.getElementsByTagNameNS("*", name)) : []);
const first = (el: Element | Document | null | undefined, name: string) => all(el, name)[0];
/**
 * Atributo pelo nome com prefixo ("r:id", "w:val"). O prefixo é livre no XML: se o arquivo usa outro
 * ("d3p1:id", comum em geradores .NET/Java), procura pelo nome local entre os atributos com namespace.
 */
const at = (el: Element | null | undefined, name: string) => {
  if (!el) return null;
  const v = el.getAttribute(name);
  if (v !== null) return v;
  const i = name.indexOf(":");
  if (i < 0) return null;
  const local = name.slice(i + 1);
  for (const a of Array.from(el.attributes)) if (a.localName === local && a.prefix) return a.value;
  return null;
};
const num = (el: Element | null | undefined, name: string, fallback = 0) => {
  const v = at(el, name);
  return v === null || v === "" ? fallback : Number(v);
};
const on = (el: Element | undefined) => !!el && !["0", "false", "off", "none"].includes(at(el, "w:val") ?? at(el, "val") ?? "1");

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
type Rels = Map<string, Rel>;
async function rels(zip: Zip, part: string): Promise<Rels> {
  const i = part.lastIndexOf("/");
  const path = `${part.slice(0, i)}/_rels/${part.slice(i + 1)}.rels`;
  const map: Rels = new Map();
  if (!part || !zip.has(path)) return map;
  for (const r of all(await zip.xml(path), "Relationship")) {
    const external = at(r, "TargetMode") === "External";
    const target = (at(r, "Target") ?? "").replace(/\\/g, "/");
    map.set(at(r, "Id") ?? "", { target: external ? target : resolvePath(part, target), type: at(r, "Type") ?? "", external });
  }
  return map;
}
const relOfType = (m: Rels, suffix: string) => [...m.values()].find((r) => r.type.endsWith(suffix));
const relsOfType = (m: Rels, suffix: string) => [...m.values()].filter((r) => r.type.endsWith(suffix));

async function coreTitle(zip: Zip) {
  if (!zip.has("docProps/core.xml")) return "";
  return first(await zip.xml("docProps/core.xml"), "title")?.textContent?.trim() ?? "";
}

/* ------------------------------------------------------------------ */
/* Cor                                                                 */
/* ------------------------------------------------------------------ */

function hexToHsl(hex: string) {
  const n = parseInt(hex.slice(0, 6), 16);
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
const lighten = (hex: string, fn: (l: number) => number) => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, Math.max(0, fn(l))));
};
/** Luminância relativa (0 escuro, 1 claro) para escolher texto legível sobre um fundo. */
const luminance = (hex: string) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => {
    const v = x / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

type Theme = Record<string, string>;
const SCHEME_ALIAS: Record<string, string> = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
type Fonts = { major?: string; minor?: string };

async function readTheme(zip: Zip, path: string | undefined): Promise<{ colors: Theme; fonts: Fonts; doc?: Document }> {
  if (!path || !zip.has(path)) return { colors: {}, fonts: {} };
  const doc = await zip.xml(path);
  const colors: Theme = {};
  for (const c of Array.from(first(doc, "clrScheme")?.children ?? [])) colors[c.localName] = at(kid(c, "srgbClr"), "val") ?? at(kid(c, "sysClr"), "lastClr") ?? "";
  const font = (kind: string) => at(kid(first(doc, kind), "latin"), "typeface") || undefined;
  return { colors, fonts: { major: font("majorFont"), minor: font("minorFont") }, doc };
}

/**
 * Cor DrawingML (srgbClr, schemeClr, sysClr, prstClr) com lumMod/lumOff,
 * tint/shade e alpha. Devolve "#RRGGBB" ou "#RRGGBBAA". `phClr` é a cor de
 * quem chama um estilo do tema (fillRef/bgRef).
 */
function colorOf(el: Element | undefined | null, theme: Theme, phClr?: string): string | undefined {
  if (!el) return undefined;
  const c = Array.from(el.children).find((x) => ["srgbClr", "schemeClr", "sysClr", "prstClr"].includes(x.localName));
  if (!c) return undefined;
  const val = at(c, "val") ?? "";
  let hex: string | undefined =
    c.localName === "srgbClr"
      ? val
      : c.localName === "sysClr"
        ? (at(c, "lastClr") ?? undefined)
        : c.localName === "schemeClr"
          ? val === "phClr"
            ? phClr?.replace("#", "").slice(0, 6)
            : theme[SCHEME_ALIAS[val] ?? val]
          : ({ black: "000000", white: "FFFFFF", red: "FF0000", green: "008000", blue: "0000FF", yellow: "FFFF00", gray: "808080" } as Record<string, string>)[val];
  if (!hex) return undefined;
  for (const m of Array.from(c.children)) {
    const v = num(m, "val") / 100000;
    if (m.localName === "lumMod") hex = lighten(hex, (l) => l * v);
    else if (m.localName === "lumOff") hex = lighten(hex, (l) => l + v);
    else if (m.localName === "tint") hex = lighten(hex, (l) => l + (1 - l) * (1 - v));
    else if (m.localName === "shade") hex = lighten(hex, (l) => l * v);
  }
  const alpha = kid(c, "alpha");
  const a = alpha ? Math.round((num(alpha, "val") / 100000) * 255) : 255;
  return `#${hex.toUpperCase()}${a < 255 ? a.toString(16).padStart(2, "0").toUpperCase() : ""}`;
}

/** Preenchimento DrawingML como valor CSS: cor, degradê ou imagem. */
async function fillCss(el: Element | undefined | null, theme: Theme, zip: Zip, partRels: Rels, phClr?: string): Promise<string | undefined> {
  if (!el) return undefined;
  const solid = kid(el, "solidFill");
  if (solid) return colorOf(solid, theme, phClr);
  const grad = kid(el, "gradFill");
  if (grad) {
    const stops = all(kid(grad, "gsLst"), "gs")
      .map((gs) => ({ pos: num(gs, "pos") / 1000, color: colorOf(gs, theme, phClr) }))
      .filter((s) => s.color)
      .sort((a, b) => a.pos - b.pos);
    if (!stops.length) return undefined;
    const list = stops.map((s) => `${s.color} ${s.pos}%`).join(", ");
    if (kid(grad, "path")) return `radial-gradient(circle at center, ${list})`;
    const lin = kid(grad, "lin");
    return `linear-gradient(${(lin ? num(lin, "ang") / 60000 : 90) + 90}deg, ${list})`;
  }
  const blip = kid(el, "blipFill");
  if (blip) {
    const rel = partRels.get(at(first(blip, "blip"), "r:embed") ?? "");
    const src = rel && !rel.external ? await zip.dataUrl(rel.target) : undefined;
    return src ? `url("${src}") center / cover no-repeat` : undefined;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Detecção                                                            */
/* ------------------------------------------------------------------ */

const titleFromName = (name?: string) => (name ? name.replace(/\.[^.]+$/, "") : "");
const UNSUPPORTED = "Abra uma planilha (.xlsx ou .csv), um documento (.docx) ou uma apresentação (.pptx).";

/** Lê .xlsx, .docx, .pptx ou .csv, detectando o tipo pelo conteúdo. `name` vira o título se o arquivo não tiver um. */
export async function readOfficeFile(src: OfficeSource, options: { name?: string } = {}): Promise<OfficeFile> {
  try {
    return await detectAndRead(await toBytes(src), options.name);
  } catch (e) {
    // Qualquer falha que não seja um motivo conhecido vira "corrompido", sempre com mensagem para a pessoa.
    if (e instanceof OfficeFileError) throw e;
    throw new OfficeFileError("corrupt", "O arquivo está corrompido ou foi salvo de um jeito que o DS não lê. Abra no Office, salve de novo e tente outra vez.");
  }
}

/** O Office guarda arquivo com senha num contêiner do formato antigo, com a parte "EncryptedPackage". */
function isEncrypted(data: Uint8Array) {
  const name = [..."EncryptedPackage"].flatMap((ch) => [ch.charCodeAt(0), 0]);
  outer: for (let i = 0; i <= Math.min(data.length, 2_000_000) - name.length; i++) {
    for (let k = 0; k < name.length; k++) if (data[i + k] !== name[k]) continue outer;
    return true;
  }
  return false;
}

async function detectAndRead(data: Uint8Array, name?: string): Promise<OfficeFile> {
  const options = { name };
  if (data[0] === 0xd0 && data[1] === 0xcf && data[2] === 0x11 && data[3] === 0xe0) {
    if (isEncrypted(data)) throw new OfficeFileError("protected", "Remova a senha no Office (Arquivo › Informações › Proteger) e abra de novo.");
    throw new OfficeFileError("legacy", "Abra no Excel, Word ou PowerPoint e salve como .xlsx, .docx ou .pptx.");
  }
  if (data[0] === 0x50 && data[1] === 0x4b) {
    const zip = new Zip(data);
    if (zip.has("xl/workbook.xml")) return { kind: "xlsx", workbook: await parseXlsx(zip, options.name) };
    if (zip.has("xl/workbook.bin")) throw new OfficeFileError("legacy", "Planilha binária do Excel (.xlsb). Salve como .xlsx e abra de novo.");
    if (zip.has("word/document.xml")) return { kind: "docx", document: await parseDocx(zip, options.name) };
    if (zip.has("ppt/presentation.xml")) return { kind: "pptx", presentation: await parsePptx(zip, options.name) };
    throw new OfficeFileError("unsupported", UNSUPPORTED);
  }
  if (looksLikeText(data)) return { kind: "csv", workbook: parseCsv(data, options.name) };
  throw new OfficeFileError("unsupported", UNSUPPORTED);
}

export async function readXlsx(src: OfficeSource, options: { name?: string } = {}) {
  return parseXlsx(new Zip(await toBytes(src)), options.name);
}
export async function readDocx(src: OfficeSource, options: { name?: string } = {}) {
  return parseDocx(new Zip(await toBytes(src)), options.name);
}
export async function readPptx(src: OfficeSource, options: { name?: string } = {}) {
  return parsePptx(new Zip(await toBytes(src)), options.name);
}
export async function readCsv(src: OfficeSource, options: { name?: string } = {}) {
  return parseCsv(await toBytes(src), options.name);
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

function looksLikeText(data: Uint8Array) {
  const n = Math.min(data.length, 8192);
  for (let i = 0; i < n; i++) if (data[i] === 0) return false;
  return n > 0;
}

/** UTF-8; se não for válido, Windows-1252 (o "CSV do Excel" salvo no Windows em português). */
function decodeText(data: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(data);
  }
}

function splitCsv(text: string, sep: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Interpreta um texto de CSV: número pt-BR ou en, R$, %, data dd/mm/aaaa. */
function csvValue(raw: string, decimalComma: boolean): { value: CellValue; format: CellFormat; digits?: number } {
  const t = raw.trim();
  if (!t) return { value: null, format: "text" };
  let m = /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/.exec(t);
  const iso = m ? null : /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(t);
  const g = m ?? iso;
  if (g) {
    const [y, mo, d] = iso ? [g[1], g[2], g[3]] : [g[3], g[2], g[1]];
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(g[4] ?? 0), Number(g[5] ?? 0));
    if (!Number.isNaN(date.getTime())) return { value: date, format: g[4] ? "datetime" : "date" };
  }
  const currency = /^-?\s*R\$/.test(t);
  const percent = /%$/.test(t);
  const body = t.replace(/R\$|%|\s/g, "").replace(/^\((.*)\)$/, "-$1");
  m = decimalComma ? /^-?\d{1,3}(\.\d{3})*(,\d+)?$|^-?\d+(,\d+)?$/.exec(body) : /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.exec(body);
  if (!m) return { value: t, format: "text" };
  // Código com zero à esquerda (CEP, CPF sem máscara, matrícula) continua texto.
  if (/^0\d/.test(body)) return { value: t, format: "text" };
  const normalized = decimalComma ? body.replace(/\./g, "").replace(",", ".") : body.replace(/,/g, "");
  const n = Number(normalized);
  if (Number.isNaN(n)) return { value: t, format: "text" };
  const digits = normalized.split(".")[1]?.length ?? 0;
  if (percent) return { value: n / 100, format: "percent", digits };
  if (currency) return { value: n, format: "currency" };
  return { value: n, format: digits ? "number" : "integer", digits: digits || undefined };
}

function parseCsv(data: Uint8Array, name?: string): FileWorkbook {
  const text = decodeText(data);
  const sample = text.slice(0, 20000).split(/\r?\n/).slice(0, 20);
  const count = (line: string, sep: string) => line.split(sep).length - 1;
  const sep = [";", "\t", ",", "|"].map((s) => ({ s, n: sample.reduce((a, l) => a + Math.min(count(l, s), 200), 0) })).sort((a, b) => b.n - a.n)[0].s;
  // Separador ";" é o padrão do Excel em português, que usa vírgula decimal.
  const decimalComma = sep !== "," && /\d,\d/.test(text.slice(0, 20000));
  const raw = splitCsv(text, sep).filter((r) => r.some((c) => c.trim()));
  let truncated = false;
  if (raw.length > OFFICE_SHEET_LIMITS.rows) {
    raw.length = OFFICE_SHEET_LIMITS.rows;
    truncated = true;
  }
  const colCount = Math.min(Math.max(1, ...raw.slice(0, 500).map((r) => r.length)), OFFICE_SHEET_LIMITS.columns);
  const parsed = raw.map((r) => Array.from({ length: colCount }, (_, c) => csvValue(r[c] ?? "", decimalComma)));
  const header = parsed.length > 1 && parsed[0].every((c) => c.format === "text") && parsed[0].some((c) => c.value !== null);
  const rows: (LaidCell | null)[][] = parsed.map((r, i) => r.map((c) => (c.value === null ? null : { value: c.value, role: header && i === 0 ? "header" : "data", format: c.format, digits: c.digits })));
  const widths = Array.from({ length: colCount }, (_, c) => Math.min(40, Math.max(8, ...raw.slice(0, 200).map((r) => (r[c] ?? "").trim().length + 1))));
  const sheet: GridSheet = {
    name: titleFromName(name) || "Planilha",
    truncated,
    layout: { rows, colCount, headerRow: header ? 0 : -1, firstDataRow: header ? 1 : 0, lastDataRow: rows.length - 1, totalRow: null, widths },
  };
  return { title: titleFromName(name) || "Planilha", sheets: [sheet] };
}

/* ------------------------------------------------------------------ */
/* Excel                                                               */
/* ------------------------------------------------------------------ */

/** Paleta indexada padrão do Excel (arquivos antigos e do LibreOffice usam índice em vez de RGB). */
const INDEXED = [
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF", "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF",
  "800000", "008000", "000080", "808000", "800080", "008080", "C0C0C0", "808080", "9999FF", "993366", "FFFFCC", "CCFFFF", "660066", "FF8080", "0066CC", "CCCCFF",
  "000080", "FF00FF", "FFFF00", "00FFFF", "800080", "800000", "008080", "0000FF", "00CCFF", "CCFFFF", "CCFFCC", "FFFF99", "99CCFF", "FF99CC", "CC99FF", "FFCC99",
  "3366FF", "33CCCC", "99CC00", "FFCC00", "FF9900", "FF6600", "666699", "969696", "003366", "339966", "003300", "333300", "993300", "993366", "333399", "333333",
];

/** Traduz o formato numérico do Excel para o formato do DS. */
function numberFormat(id: number, code?: string): { format: CellFormat; digits?: number; negativeRed?: boolean } {
  if (id >= 14 && id <= 17) return { format: "date" };
  if (id === 22) return { format: "datetime" };
  if ((id >= 18 && id <= 21) || (id >= 45 && id <= 47)) return { format: "time" };
  const builtin: Record<number, { format: CellFormat; digits?: number }> = { 1: { format: "integer" }, 2: { format: "number", digits: 2 }, 3: { format: "integer" }, 4: { format: "number", digits: 2 }, 9: { format: "percent", digits: 0 }, 10: { format: "percent", digits: 2 }, 49: { format: "text" } };
  if (builtin[id]) return builtin[id];
  if (!code || id === 0 || /^general$/i.test(code)) return { format: "number", digits: 6 }; // Geral
  const [positive, negative] = code.split(";");
  const negativeRed = !!negative && /\[(red|vermelho)\]/i.test(negative);
  const bare = positive.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\\./g, "").replace(/_.|\*./g, "");
  const decimals = /\.(0+)/.exec(bare)?.[1].length ?? 0;
  if (bare.includes("%")) return { format: "percent", digits: decimals, negativeRed };
  const hasDate = /[dy]/i.test(bare) || /m{3,}/i.test(bare) || (/m/i.test(bare) && !/[hs:]/i.test(bare));
  const hasTime = /h/i.test(bare) || /[:]/.test(bare) || /s/i.test(bare);
  if (!/[0#?]/.test(bare) && (hasDate || hasTime)) return { format: hasDate && hasTime ? "datetime" : hasDate ? "date" : "time" };
  if (/R\$/.test(code)) return { format: "currency", digits: decimals, negativeRed };
  if (/[0#]/.test(bare)) return decimals ? { format: "number", digits: decimals, negativeRed } : { format: "integer", negativeRed };
  return { format: "number", digits: 6 };
}

const cellRef = (ref: string) => {
  const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(ref);
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

type XlsxStyle = { format: CellFormat; digits?: number; bold: boolean; style?: CellStyle };

async function xlsxStyles(zip: Zip, theme: Theme): Promise<XlsxStyle[]> {
  if (!zip.has("xl/styles.xml")) return [];
  const doc = await zip.xml("xl/styles.xml");
  // Ordem do índice de tema no Excel: lt1, dk1, lt2, dk2, accent1…6, hlink, folHlink.
  const themeOrder = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const xColor = (el: Element | undefined) => {
    if (!el) return undefined;
    let hex: string | undefined;
    if (at(el, "rgb")) hex = at(el, "rgb")!.slice(-6);
    else if (at(el, "theme") !== null) hex = theme[themeOrder[num(el, "theme")]];
    else if (at(el, "indexed") !== null) hex = INDEXED[num(el, "indexed")];
    if (!hex) return undefined;
    const tint = num(el, "tint");
    if (tint) hex = lighten(hex, (l) => (tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint));
    return `#${hex.toUpperCase()}`;
  };
  const codes = new Map(all(doc, "numFmt").map((n) => [num(n, "numFmtId"), at(n, "formatCode") ?? ""]));
  const fonts = kids(first(doc, "fonts"), "font").map((f) => ({ bold: on(kid(f, "b")), italic: on(kid(f, "i")), underline: on(kid(f, "u")), strike: on(kid(f, "strike")), color: xColor(kid(f, "color")) }));
  const defaultColor = fonts[0]?.color;
  const fills = kids(first(doc, "fills"), "fill").map((f) => {
    const p = kid(f, "patternFill");
    return p && at(p, "patternType") === "solid" ? xColor(kid(p, "fgColor")) : undefined;
  });
  return kids(first(doc, "cellXfs"), "xf").map((xf) => {
    const id = num(xf, "numFmtId");
    const nf = numberFormat(id, codes.get(id));
    const font = fonts[num(xf, "fontId")];
    const fill = fills[num(xf, "fillId")];
    const al = kid(xf, "alignment");
    const h = at(al, "horizontal");
    const style: CellStyle = {
      fill: fill && fill !== "#FFFFFF" ? fill : undefined,
      color: font?.color && font.color !== defaultColor && font.color !== "#000000" ? font.color : undefined,
      italic: font?.italic || undefined,
      underline: font?.underline || undefined,
      strike: font?.strike || undefined,
      align: h === "center" || h === "centerContinuous" ? "center" : h === "right" ? "right" : h === "left" ? "left" : undefined,
      wrap: at(al, "wrapText") === "1" || undefined,
      negativeRed: nf.negativeRed,
    };
    // Texto legível sobre o fundo do arquivo, nos dois temas do DS.
    if (style.fill && !style.color) style.color = luminance(style.fill) > 0.35 ? `#${theme.dk1 || INDEXED[0]}` : `#${theme.lt1 || INDEXED[1]}`;
    const clean = Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined)) as CellStyle;
    return { format: nf.format, digits: nf.digits, bold: font?.bold ?? false, style: Object.keys(clean).length ? clean : undefined };
  });
}

async function parseXlsx(zip: Zip, name?: string): Promise<FileWorkbook> {
  const wb = await zip.xml("xl/workbook.xml");
  const wbRels = await rels(zip, "xl/workbook.xml");
  const date1904 = ["1", "true"].includes(at(first(wb, "workbookPr"), "date1904") ?? "");
  const theme = (await readTheme(zip, relOfType(wbRels, "/theme")?.target)).colors;
  const shared = zip.has("xl/sharedStrings.xml") ? kids(first(await zip.xml("xl/sharedStrings.xml"), "sst"), "si").map((si) => [...kids(si, "t"), ...kids(si, "r").flatMap((r) => kids(r, "t"))].map((t) => t.textContent ?? "").join("")) : [];
  const xfs = await xlsxStyles(zip, theme);
  const fallback: XlsxStyle = { format: "number", digits: 6, bold: false };

  const sheets: GridSheet[] = [];
  const byName = new Map<string, Map<string, LaidCell>>();
  const pendingCharts: { sheet: GridSheet; paths: string[] }[] = [];

  for (const s of kids(first(wb, "sheets"), "sheet")) {
    if (at(s, "state") === "hidden" || at(s, "state") === "veryHidden") continue;
    const rel = wbRels.get(at(s, "r:id") ?? "");
    const sheetName = at(s, "name") ?? `Planilha ${sheets.length + 1}`;
    if (!rel || !zip.has(rel.target)) continue;
    const sRels = await rels(zip, rel.target);
    const chartPaths: string[] = [];
    for (const d of relsOfType(sRels, "/drawing")) {
      if (!zip.has(d.target)) continue;
      const dRels = await rels(zip, d.target);
      for (const gf of all(await zip.xml(d.target), "chart")) {
        const c = dRels.get(at(gf, "r:id") ?? "");
        if (c && zip.has(c.target)) chartPaths.push(c.target);
      }
    }
    // Folha de gráfico (chartsheet): só o gráfico, sem grade.
    if (rel.type.endsWith("/chartsheet")) {
      const sheet: GridSheet = { name: sheetName, layout: { rows: [], colCount: 0, headerRow: -1, firstDataRow: 0, lastDataRow: -1, totalRow: null, widths: [] } };
      sheets.push(sheet);
      pendingCharts.push({ sheet, paths: chartPaths });
      continue;
    }
    const doc = await zip.xml(rel.target);
    const cells = new Map<string, LaidCell>();
    let maxR = -1;
    let maxC = -1;
    let truncated = false;
    const hiddenRows = new Set<number>();
    for (const row of all(first(doc, "sheetData"), "row")) {
      const r = num(row, "r") - 1;
      if (at(row, "hidden") === "1" && r >= 0) hiddenRows.add(r);
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
        const st = xfs[num(c, "s")] ?? fallback;
        let value: CellValue = null;
        let format: CellFormat = st.format;
        if (t === "s") value = shared[Number(v)] ?? "";
        else if (t === "inlineStr") {
          const is = kid(c, "is");
          value = kid(is, "t")?.textContent ?? all(is, "t").map((x) => x.textContent ?? "").join("");
        }
        else if (t === "str" || t === "e") value = v ?? "";
        else if (t === "b") value = v === "1";
        else if (v !== null && v !== "") value = Number(v);
        if (typeof value !== "number") format = "text";
        else if (format === "date" || format === "time" || format === "datetime") value = serialToDate(value, date1904);
        else if (format === "text") format = "number";
        // Célula só com estilo (fundo) também conta: faixas coloridas de cabeçalho.
        if (value === null && !f && !st.style?.fill) continue;
        cells.set(`${pos.r}:${pos.c}`, { value, formula: f, role: "data", format, digits: st.digits, bold: st.bold || undefined, style: st.style });
        maxR = Math.max(maxR, pos.r);
        maxC = Math.max(maxC, pos.c);
      }
    }
    const colCount = Math.max(maxC + 1, 1);
    const rowCount = Math.max(maxR + 1, 1);

    // Mesclas: a célula de cima à esquerda manda; as outras ficam cobertas.
    const covered = new Map<string, [number, number]>();
    for (const m of all(doc, "mergeCell")) {
      const [a, b] = (at(m, "ref") ?? "").split(":").map(cellRef);
      if (!a || !b || a.r >= rowCount || a.c >= colCount) continue;
      const rows = Math.min(b.r, rowCount - 1) - a.r + 1;
      const cols = Math.min(b.c, colCount - 1) - a.c + 1;
      if (rows * cols <= 1) continue;
      let anchor = cells.get(`${a.r}:${a.c}`);
      if (!anchor) cells.set(`${a.r}:${a.c}`, (anchor = { value: null, role: "data", format: "text" }));
      anchor.merge = { rows, cols };
      for (let r = a.r; r < a.r + rows; r++)
        for (let c = a.c; c < a.c + cols; c++)
          if (r !== a.r || c !== a.c) {
            covered.set(`${r}:${c}`, [a.r, a.c]);
            cells.delete(`${r}:${c}`);
          }
      // Título mesclado na linha toda vira cabeçalho da seção.
      if (a.c === 0 && rows === 1 && cols >= Math.min(colCount, 3)) anchor.span = true;
    }

    // Cabeçalho: painel congelado; senão a tabela do Excel ou o filtro automático.
    const pane = first(doc, "pane");
    const frozen = at(pane, "state") === "frozen" || at(pane, "state") === "frozenSplit";
    const ySplit = frozen ? Math.round(num(pane, "ySplit")) : 0;
    const xSplit = frozen ? Math.round(num(pane, "xSplit")) : 0;
    let headerRow = ySplit > 0 ? ySplit - 1 : -1;
    if (headerRow < 0)
      for (const t of relsOfType(sRels, "/table")) {
        if (!zip.has(t.target)) continue;
        const tbl = first(await zip.xml(t.target), "table");
        const ref = cellRef((at(tbl, "ref") ?? "").split(":")[0]);
        if (ref && at(tbl, "headerRowCount") !== "0") {
          headerRow = ref.r;
          break;
        }
      }
    if (headerRow < 0) {
      const ref = cellRef((at(kid(doc.documentElement, "autoFilter"), "ref") ?? "").split(":")[0]);
      if (ref) headerRow = ref.r;
    }

    const fmt = first(doc, "sheetFormatPr");
    const defaultWidth = num(fmt, "defaultColWidth", 0) || num(fmt, "baseColWidth", 8) + 1;
    const widths = Array.from({ length: colCount }, () => Math.min(Math.max(defaultWidth, 3), 60));
    const hiddenCols = new Set<number>();
    for (const col of all(first(doc, "cols"), "col")) {
      const min = num(col, "min") - 1;
      const max = Math.min(num(col, "max") - 1, colCount - 1);
      for (let i = min; i <= max; i++) {
        if (at(col, "hidden") === "1") hiddenCols.add(i);
        if (at(col, "width")) widths[i] = Math.min(Math.max(num(col, "width"), 3), 60);
      }
    }

    const rows: (LaidCell | null)[][] = Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: colCount }, (_, c) => {
        const cell = cells.get(`${r}:${c}`) ?? null;
        if (cell && r === headerRow && !cell.span) cell.role = "header";
        return cell;
      }),
    );
    const sheet: GridSheet = {
      name: sheetName,
      freezeColumns: xSplit,
      truncated,
      layout: { rows, colCount, headerRow, firstDataRow: headerRow + 1, lastDataRow: rowCount - 1, totalRow: null, widths, covered, hiddenRows, hiddenCols },
    };
    sheets.push(sheet);
    byName.set(sheetName, cells);
    if (chartPaths.length) pendingCharts.push({ sheet, paths: chartPaths });
  }

  // Gráficos: valores salvos no gráfico ou, se faltarem, lidos das células referenciadas.
  const resolveRef: RefResolver = (ref) => {
    const m = /^(?:'?(.+?)'?!)?\$?([A-Z]+\$?\d+)(?::\$?([A-Z]+\$?\d+))?$/.exec(ref.trim());
    if (!m) return { values: [] };
    const cells = byName.get((m[1] ?? "").replace(/''/g, "'")) ?? [...byName.values()][0];
    const a = cellRef(m[2].replace(/\$/g, ""));
    const b = cellRef((m[3] ?? m[2]).replace(/\$/g, ""));
    if (!cells || !a || !b) return { values: [] };
    const values: CellValue[] = [];
    let fmt: LaidCell | undefined;
    for (let r = a.r; r <= b.r; r++)
      for (let c = a.c; c <= b.c; c++) {
        const cell = cells.get(`${r}:${c}`);
        values.push(cell?.value ?? null);
        if (!fmt && typeof cell?.value === "number") fmt = cell;
      }
    return { values, format: fmt?.format, digits: fmt?.digits };
  };
  for (const { sheet, paths } of pendingCharts) sheet.charts = await Promise.all(paths.map((p) => parseChart(zip, p, resolveRef)));

  return { title: (await coreTitle(zip)) || titleFromName(name) || "Planilha", sheets };
}

/* ------------------------------------------------------------------ */
/* Gráficos (xlsx e pptx)                                              */
/* ------------------------------------------------------------------ */

const CHART_KIND: Record<string, OfficeChart["kind"]> = {
  barChart: "bar",
  bar3DChart: "bar",
  lineChart: "line",
  line3DChart: "line",
  areaChart: "area",
  area3DChart: "area",
  pieChart: "pie",
  pie3DChart: "pie",
  ofPieChart: "pie",
  doughnutChart: "doughnut",
  scatterChart: "scatter",
  bubbleChart: "scatter",
};

type RefResolver = (ref: string) => { values: CellValue[]; format?: CellFormat; digits?: number };

async function parseChart(zip: Zip, path: string, resolveRef?: RefResolver): Promise<OfficeChart> {
  const doc = await zip.xml(path);
  const chart = first(doc, "chart");
  const titleEl = kid(chart, "title");
  const title = titleEl && at(kid(chart, "autoTitleDeleted"), "val") !== "1" ? all(titleEl, "t").map((t) => t.textContent ?? "").join("") || undefined : undefined;
  const groups = Array.from(kid(chart, "plotArea")?.children ?? []).filter((g) => g.localName.endsWith("Chart"));

  /** Pontos do cache (strCache/numCache) por índice, ou das células referenciadas. */
  let refFormat: { format?: CellFormat; digits?: number } | undefined;
  const points = (src: Element | undefined): { values: CellValue[]; formatCode?: string } => {
    if (!src) return { values: [] };
    const cache = first(src, "numCache") ?? first(src, "strCache");
    if (cache) {
      const values: CellValue[] = Array.from({ length: num(kid(cache, "ptCount"), "val") }, () => null);
      for (const pt of kids(cache, "pt")) {
        const t = kid(pt, "v")?.textContent ?? "";
        values[num(pt, "idx")] = cache.localName === "numCache" ? (t === "" ? null : Number(t)) : t;
      }
      return { values, formatCode: kid(cache, "formatCode")?.textContent ?? undefined };
    }
    const multi = first(src, "multiLvlStrCache");
    if (multi) return { values: kids(kids(multi, "lvl")[0], "pt").map((pt) => kid(pt, "v")?.textContent ?? "") };
    const lit = first(src, "numLit") ?? first(src, "strLit");
    if (lit) return { values: kids(lit, "pt").map((pt) => kid(pt, "v")?.textContent ?? "") };
    const ref = first(src, "f")?.textContent ?? "";
    if (!ref || !resolveRef) return { values: [] };
    const got = resolveRef(ref);
    if (got.format && got.format !== "text") refFormat ??= got;
    return { values: got.values };
  };
  const toNum = (v: CellValue) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

  let categories: string[] = [];
  const series: OfficeChart["series"] = [];
  let formatCode: string | undefined;
  let horizontal = false;
  let stacked = false;
  let percent = false;
  const kinds = new Set<OfficeChart["kind"]>();
  let sourceType: string | undefined;

  for (const g of groups) {
    const k = CHART_KIND[g.localName];
    if (!k) {
      sourceType ??= g.localName.replace(/Chart$/, "");
      continue;
    }
    kinds.add(k);
    if (k === "bar") horizontal = at(kid(g, "barDir"), "val") === "bar";
    const grouping = at(kid(g, "grouping"), "val");
    if (grouping === "stacked" || grouping === "percentStacked") stacked = true;
    if (grouping === "percentStacked") percent = true;
    for (const ser of kids(g, "ser")) {
      const tx = kid(ser, "tx");
      const name = (tx && (kid(tx, "v")?.textContent ?? String(points(tx).values[0] ?? ""))) || `Série ${series.length + 1}`;
      const cat = points(kid(ser, "cat") ?? kid(ser, "xVal"));
      const val = points(kid(ser, "val") ?? kid(ser, "yVal"));
      formatCode ??= val.formatCode;
      if (cat.values.length > categories.length) categories = cat.values.map((v) => (v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v ?? "")));
      series.push({
        name,
        values: val.values.map(toNum),
        kind: k === "line" ? "line" : k === "area" ? "area" : k === "bar" ? "bar" : undefined,
        x: k === "scatter" ? cat.values.map(toNum) : undefined,
      });
    }
  }
  const kind: OfficeChart["kind"] = kinds.size === 0 ? "unsupported" : kinds.size > 1 && kinds.has("bar") && (kinds.has("line") || kinds.has("area")) ? "combo" : [...kinds][0];
  if (!categories.length) categories = (series[0]?.values ?? []).map((_, i) => String(i + 1));
  const nf = formatCode ? numberFormat(-1, formatCode) : refFormat ? { format: refFormat.format!, digits: refFormat.digits } : undefined;
  return {
    title,
    kind,
    horizontal: horizontal || undefined,
    stacked: stacked || undefined,
    percent: percent || undefined,
    categories,
    series,
    format: nf && nf.format !== "date" && nf.format !== "time" && nf.format !== "datetime" && !(nf.format === "number" && nf.digits === 6) ? nf.format : undefined,
    digits: nf?.digits,
    sourceType: kind === "unsupported" ? (sourceType ?? "desconhecido") : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Word                                                                */
/* ------------------------------------------------------------------ */

const EMU_PER_PX = 9525;
const NUMERIC_TEXT = /^[(\-−+]?\s*(R\$|US\$|\$|€)?\s*[\d.,]+\s*(%|p\.p\.|mi|mil|bi)?\)?$/;
/** Cores do realce do Word, em versão clara para ler em cima. */
const HIGHLIGHT: Record<string, string> = {
  yellow: "#FFF59D",
  green: "#C8E6C9",
  cyan: "#B2EBF2",
  magenta: "#F8BBD0",
  blue: "#BBDEFB",
  red: "#FFCDD2",
  darkYellow: "#E6D96B",
  lightGray: "#E0E0E0",
  darkGray: "#BDBDBD",
};

type NumLevel = { fmt: string; text: string; start: number };

const roman = (n: number) => {
  const map: [number, string][] = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let out = "";
  for (const [v, s] of map)
    while (n >= v) {
      out += s;
      n -= v;
    }
  return out;
};
const letters = (n: number) => {
  let s = "";
  while (n > 0) {
    s = String.fromCharCode(97 + ((n - 1) % 26)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const formatCounter = (n: number, fmt: string) =>
  fmt === "lowerLetter" ? letters(n) : fmt === "upperLetter" ? letters(n).toUpperCase() : fmt === "lowerRoman" ? roman(n) : fmt === "upperRoman" ? roman(n).toUpperCase() : fmt === "decimalZero" ? String(n).padStart(2, "0") : String(n);
const BULLETS = ["•", "◦", "▪"];

async function parseDocx(zip: Zip, name?: string): Promise<OfficeDocument> {
  const doc = await zip.xml("word/document.xml");
  const docRels = await rels(zip, "word/document.xml");

  // Estilos: nome (para achar títulos) e numeração herdada (listas definidas no estilo).
  const styleNames = new Map<string, string>();
  const styleNum = new Map<string, { numId: string; ilvl: number }>();
  if (zip.has("word/styles.xml"))
    for (const st of all(await zip.xml("word/styles.xml"), "style")) {
      const id = at(st, "w:styleId") ?? "";
      styleNames.set(id, (at(kid(st, "name"), "w:val") ?? "").toLowerCase());
      const numPr = kid(kid(st, "pPr"), "numPr");
      const n = at(kid(numPr, "numId"), "w:val");
      if (n) styleNum.set(id, { numId: n, ilvl: Number(at(kid(numPr, "ilvl"), "w:val") ?? 0) });
    }

  // Numeração: numId → níveis (formato, texto "%1.%2.", início). O contador segue pelo documento todo.
  const numbering = new Map<string, NumLevel[]>();
  if (zip.has("word/numbering.xml")) {
    const nx = await zip.xml("word/numbering.xml");
    const abstract = new Map(
      kids(first(nx, "numbering"), "abstractNum").map((a) => [
        at(a, "w:abstractNumId"),
        kids(a, "lvl").map((l) => ({ fmt: at(kid(l, "numFmt"), "w:val") ?? "decimal", text: at(kid(l, "lvlText"), "w:val") ?? "", start: Number(at(kid(l, "start"), "w:val") ?? 1) })),
      ]),
    );
    for (const n of kids(first(nx, "numbering"), "num")) numbering.set(at(n, "w:numId") ?? "", abstract.get(at(kid(n, "abstractNumId"), "w:val")) ?? []);
  }
  const counters = new Map<string, number[]>();
  const marker = (numId: string, ilvl: number) => {
    const levels = numbering.get(numId);
    const lvl = levels?.[ilvl];
    if (!lvl || lvl.fmt === "bullet" || lvl.fmt === "none") return { marker: BULLETS[ilvl % 3], ordered: false };
    const c = counters.get(numId) ?? [];
    for (let i = 0; i <= ilvl; i++) c[i] ??= (levels?.[i]?.start ?? 1) - 1;
    c[ilvl] += 1;
    c.length = ilvl + 1;
    counters.set(numId, c);
    const text = lvl.text.replace(/%(\d)/g, (_, d: string) => formatCounter(c[Number(d) - 1] ?? 1, levels?.[Number(d) - 1]?.fmt ?? "decimal"));
    return { marker: text || `${c[ilvl]}.`, ordered: true };
  };

  /** Texto dos trechos, sem campos (número de página, data automática). */
  const runsOf = (p: Element): { runs: DocRun[]; pageBreak: boolean } => {
    const out: DocRun[] = [];
    let pageBreak = false;
    // Campo complexo: begin → instrução (esconde) → separate → resultado (mostra) → end.
    const fields: ("instr" | "result")[] = [];
    const same = (a: DocRun, b: DocRun) => a.bold === b.bold && a.italic === b.italic && a.underline === b.underline && a.strike === b.strike && a.href === b.href && a.color === b.color && a.highlight === b.highlight;
    const walk = (el: Element, href?: string) => {
      for (const ch of Array.from(el.children)) {
        if (ch.localName === "hyperlink") {
          const rel = docRels.get(at(ch, "r:id") ?? "");
          walk(ch, rel?.external ? rel.target : undefined);
        } else if (ch.localName === "r") {
          const pr = kid(ch, "rPr");
          let text = "";
          for (const t of Array.from(ch.children)) {
            if (t.localName === "fldChar") {
              const type = at(t, "w:fldCharType");
              if (type === "begin") fields.push("instr");
              else if (type === "separate" && fields.length) fields[fields.length - 1] = "result";
              else if (type === "end") fields.pop();
            } else if (fields.includes("instr")) continue;
            else if (t.localName === "t") text += t.textContent ?? "";
            else if (t.localName === "ruby") text += all(kid(t, "rubyBase"), "t").map((x) => x.textContent ?? "").join("");
            else if (t.localName === "tab") text += " ";
            else if (t.localName === "br" && at(t, "w:type") === "page") pageBreak = true;
            else if (t.localName === "br") text += "\n";
          }
          if (!text) continue;
          const color = at(kid(pr, "color"), "w:val");
          const hl = at(kid(pr, "highlight"), "w:val");
          const shd = at(kid(pr, "shd"), "w:fill");
          const run: DocRun = {
            text,
            bold: on(kid(pr, "b")) || undefined,
            italic: on(kid(pr, "i")) || undefined,
            underline: on(kid(pr, "u")) || undefined,
            strike: on(kid(pr, "strike")) || undefined,
            href,
            color: color && color !== "auto" && color !== "000000" ? `#${color.toUpperCase()}` : undefined,
            highlight: (hl && HIGHLIGHT[hl]) || (shd && shd !== "auto" && shd.toUpperCase() !== "FFFFFF" ? `#${shd.toUpperCase()}` : undefined),
          };
          const prev = out[out.length - 1];
          if (prev && same(prev, run)) prev.text += text;
          else out.push(run);
        } else if (["ins", "moveTo", "smartTag", "sdt", "sdtContent", "customXml", "fldSimple"].includes(ch.localName)) walk(ch, href);
      }
    };
    walk(p);
    return { runs: out, pageBreak };
  };
  const plain = (el: Element) => kids(el, "p").map((p) => runsOf(p).runs.map((r) => r.text).join("")).join("\n").trim();

  const images = async (p: Element) => {
    const out: DocBlock[] = [];
    for (const drawing of all(p, "drawing")) {
      const rel = docRels.get(at(first(drawing, "blip"), "r:embed") ?? "");
      const src = rel && !rel.external ? await zip.dataUrl(rel.target) : undefined;
      if (!src) continue;
      const ext = first(drawing, "extent");
      const cx = num(ext, "cx");
      const cy = num(ext, "cy");
      const pr = first(drawing, "docPr");
      out.push({ type: "image", src, alt: at(pr, "descr") || at(pr, "name") || undefined, width: cx ? Math.round(cx / EMU_PER_PX) : undefined, ratio: cx && cy ? cy / cx : undefined });
    }
    return out;
  };

  /** Filhos com nome `name`, abrindo controles de conteúdo (sdt) e customXml no caminho. */
  const deep = (el: Element, name: string): Element[] =>
    Array.from(el.children).flatMap((c) => (c.localName === name ? [c] : ["sdt", "sdtContent", "customXml"].includes(c.localName) ? deep(c.localName === "sdt" ? (kid(c, "sdtContent") ?? c) : c, name) : []));
  const table = (el: Element): DocBlock => {
    const grid = kids(kid(el, "tblGrid"), "gridCol").map((g) => num(g, "w:w", 1));
    const trs = deep(el, "tr");
    const cols = Math.max(grid.length, ...trs.map((tr) => deep(tr, "tc").reduce((a, tc) => a + Number(at(kid(kid(tc, "tcPr"), "gridSpan"), "w:val") ?? 1), 0)));
    const rows: CellValue[][] = [];
    const spans: Record<string, [number, number]> = {};
    const fills: Record<string, string> = {};
    const bold: boolean[][] = [];
    const vOpen = new Map<number, string>(); // coluna → célula que abriu a mescla vertical
    let headerRows = 0;
    trs.forEach((tr, r) => {
      if (on(kid(kid(tr, "trPr"), "tblHeader")) && headerRows === r) headerRows++;
      const row: CellValue[] = Array.from({ length: cols }, () => "");
      bold[r] = [];
      let c = 0;
      for (const tc of deep(tr, "tc")) {
        const pr = kid(tc, "tcPr");
        const span = Number(at(kid(pr, "gridSpan"), "w:val") ?? 1);
        const vMerge = kid(pr, "vMerge");
        const fill = at(kid(pr, "shd"), "w:fill");
        if (vMerge && at(vMerge, "w:val") !== "restart" && vOpen.has(c)) {
          const key = vOpen.get(c)!;
          spans[key] = [(spans[key]?.[0] ?? 1) + 1, spans[key]?.[1] ?? span];
        } else {
          row[c] = plain(tc);
          const runs = kids(tc, "p").flatMap((p) => runsOf(p).runs);
          bold[r][c] = runs.length > 0 && runs.every((x) => x.bold);
          if (span > 1 || vMerge) spans[`${r}:${c}`] = [1, span];
          if (vMerge) vOpen.set(c, `${r}:${c}`);
          else vOpen.delete(c);
          if (fill && fill !== "auto" && fill.toUpperCase() !== "FFFFFF") fills[`${r}:${c}`] = `#${fill.toUpperCase()}`;
        }
        c += span;
      }
      rows.push(row);
    });
    for (const [k, v] of Object.entries(spans)) if (v[0] === 1 && v[1] === 1) delete spans[k];
    // Sem "repetir como cabeçalho": a primeira linha é cabeçalho se for toda em negrito ou sombreada.
    if (!headerRows && rows.length > 1) {
      const filled = rows[0].map((v, c) => v !== "" && (bold[0][c] || !!fills[`0:${c}`]));
      if (filled.filter(Boolean).length >= Math.max(1, rows[0].filter((v) => v !== "").length)) headerRows = 1;
    }
    const body = rows.slice(headerRows);
    const columns: DocTableColumn[] = Array.from({ length: cols }, (_, i) => {
      const vals = body.map((r) => String(r[i] ?? "")).filter(Boolean);
      const numeric = vals.length > 0 && vals.filter((v) => NUMERIC_TEXT.test(v)).length >= vals.length * 0.8;
      // Formato numérico só alinha à direita: o texto do arquivo é mantido como está.
      return { header: "", format: numeric ? "number" : "text", width: grid[i] };
    });
    return { type: "table", columns, rows, headerRows, spans: Object.keys(spans).length ? spans : undefined, fills: Object.keys(fills).length ? fills : undefined };
  };

  const blocks: DocBlock[] = [];
  let title = "";
  let toc = false;
  let list: Extract<DocBlock, { type: "list" }> | null = null;
  const alignOf = (pPr: Element | undefined): DocAlign | undefined => {
    const jc = at(kid(pPr, "jc"), "w:val");
    return jc === "center" ? "center" : jc === "right" || jc === "end" ? "right" : jc === "both" || jc === "distribute" ? "justify" : undefined;
  };

  // Corpo, abrindo controles de conteúdo (sdt); o sumário automático do Word sai (o DS monta o próprio).
  const bodyElements = (parent: Element | undefined): Element[] =>
    Array.from(parent?.children ?? []).flatMap((el) => {
      if (el.localName === "sdt") {
        const gallery = at(first(kid(el, "sdtPr"), "docPartGallery"), "w:val") ?? "";
        if (/table of contents/i.test(gallery)) {
          toc = true;
          return [el];
        }
        return bodyElements(kid(el, "sdtContent"));
      }
      if (el.localName === "customXml") return bodyElements(el);
      return [el];
    });

  const placeToc = () => {
    if (!blocks.some((b) => b.type === "toc")) blocks.push({ type: "toc" });
    list = null;
  };
  for (const el of bodyElements(first(doc, "body"))) {
    if (el.localName === "sdt") {
      placeToc();
      continue;
    }
    if (el.localName === "p") {
      const pPr = kid(el, "pPr");
      const styleId = at(kid(pPr, "pStyle"), "w:val") ?? "";
      const style = styleNames.get(styleId) ?? styleId.toLowerCase();
      // Sumário do Word: estilo "TOC n" ou campo TOC solto (sem controle de conteúdo).
      if (/^toc ?\d/.test(style) || all(el, "instrText").some((x) => /^\s*TOC\b/.test(x.textContent ?? ""))) {
        toc = true;
        placeToc();
        continue;
      }
      if (on(kid(pPr, "pageBreakBefore")) && blocks.length) blocks.push({ type: "pageBreak" });
      const { runs, pageBreak } = runsOf(el);
      const text = runs.map((r) => r.text).join("").trim();
      const numPr = kid(pPr, "numPr");
      const fromStyle = styleNum.get(styleId);
      const numId = at(kid(numPr, "numId"), "w:val") ?? fromStyle?.numId ?? null;
      const ilvl = Number(at(kid(numPr, "ilvl"), "w:val") ?? fromStyle?.ilvl ?? 0);
      const numbered = !!numId && numId !== "0";
      const align = alignOf(pPr);
      if (text) {
        const heading = /^heading (\d)$/.exec(style);
        if (style === "title") {
          if (!title) title = text;
          blocks.push({ type: "heading", text, level: 1, align });
          list = null;
        } else if (style === "subtitle") {
          blocks.push({ type: "paragraph", text: [{ text, italic: true }], align });
          list = null;
        } else if (heading) {
          // Título numerado (1. Objeto, 2. Prazo) mantém o número no texto.
          const m = numbered ? marker(numId!, ilvl) : null;
          blocks.push({ type: "heading", text: m?.ordered ? `${m.marker} ${text}` : text, level: Math.min(Number(heading[1]), 3) as 1 | 2 | 3, align });
          list = null;
        } else if (numbered) {
          const m = marker(numId!, ilvl);
          if (!list) {
            list = { type: "list", items: [], ordered: m.ordered, levels: [], markers: [] };
            blocks.push(list);
          }
          list.items.push(runs);
          list.levels!.push(ilvl);
          list.markers!.push(m.marker);
        } else {
          list = null;
          blocks.push(style === "quote" || style === "intense quote" ? { type: "quote", text } : { type: "paragraph", text: runs, align });
        }
      } else if (!pageBreak) list = null;
      const imgs = await images(el);
      if (imgs.length) {
        list = null;
        blocks.push(...imgs);
      }
      if (pageBreak) blocks.push({ type: "pageBreak" });
    } else if (el.localName === "tbl") {
      list = null;
      if (deep(el, "tr").length) blocks.push(table(el));
    }
  }
  while (blocks[blocks.length - 1]?.type === "pageBreak") blocks.pop();

  // Cabeçalho e rodapé do Word (texto; o número da página é do DS).
  const sect = kid(first(doc, "body"), "sectPr") ?? all(doc, "sectPr").pop();
  const partText = async (kind: "headerReference" | "footerReference") => {
    const ref = kids(sect, kind).find((r) => (at(r, "w:type") ?? "default") === "default");
    const rel = docRels.get(at(ref, "r:id") ?? "");
    if (!rel || !zip.has(rel.target)) return undefined;
    const part = (await zip.xml(rel.target)).documentElement;
    const text = bodyElements(part)
      .filter((p) => p.localName === "p")
      .map((p) => runsOf(p).runs.map((r) => r.text).join("").trim())
      .filter(Boolean)
      .join(" · ")
      .replace(/\s*\b(p[áa]gina|p[áa]g\.?|page)\s*\d*\s*((de|of)\s*\d*)?\s*$/i, "")
      .replace(/[\s·|•–—:,-]+$/, "")
      .trim();
    return text || undefined;
  };

  return {
    title: (await coreTitle(zip)) || title || titleFromName(name) || "Documento",
    cover: false,
    toc: toc && !blocks.some((b) => b.type === "toc") ? true : undefined,
    header: await partText("headerReference"),
    footer: await partText("footerReference"),
    blocks,
  };
}

/* ------------------------------------------------------------------ */
/* PowerPoint                                                          */
/* ------------------------------------------------------------------ */

type Xfrm = { x: number; y: number; w: number; h: number; rot?: number; flipH?: boolean; flipV?: boolean };
const xfrmOf = (el: Element | undefined): Xfrm | undefined => {
  const off = kid(el, "off");
  const ext = kid(el, "ext");
  if (!off || !ext) return undefined;
  return { x: num(off, "x"), y: num(off, "y"), w: num(ext, "cx"), h: num(ext, "cy"), rot: num(el, "rot") / 60000 || undefined, flipH: at(el, "flipH") === "1" || undefined, flipV: at(el, "flipV") === "1" || undefined };
};

type LevelStyle = { size: number[]; lineHeight: number[]; lineHeightPt: number[]; spaceBefore: number[]; spaceAfter: number[]; color?: string; bullet?: boolean; align?: string; font?: string };
type Placeholder = { xfrm?: Xfrm; anchor?: string; style: LevelStyle };
type PhKind = "title" | "body" | "other";
const phKind = (type: string | null): PhKind => (type === "title" || type === "ctrTitle" ? "title" : !type || type === "body" || type === "subTitle" || type === "obj" ? "body" : "other");
const fontName = (face: string | null, fonts: Fonts) => (!face ? undefined : face === "+mj-lt" ? fonts.major : face === "+mn-lt" ? fonts.minor : face.startsWith("+") ? undefined : face);

/** Espaçamento (lnSpc, spcBef, spcAft): spcPct em fração, spcPts em pontos. */
const spacing = (el: Element | undefined) => {
  const pct = kid(el, "spcPct");
  const pts = kid(el, "spcPts");
  return { pct: pct ? num(pct, "val") / 100000 : undefined, pts: pts ? num(pts, "val") / 100 : undefined };
};

function levelStyles(list: Element | undefined, theme: Theme, fonts: Fonts): LevelStyle {
  const st: LevelStyle = { size: [], lineHeight: [], lineHeightPt: [], spaceBefore: [], spaceAfter: [] };
  for (let i = 1; i <= 9; i++) {
    const lvl = kid(list, `lvl${i}pPr`);
    if (!lvl) continue;
    const def = kid(lvl, "defRPr");
    if (at(def, "sz")) st.size[i - 1] = num(def, "sz") / 100;
    const ln = spacing(kid(lvl, "lnSpc"));
    if (ln.pct !== undefined) st.lineHeight[i - 1] = ln.pct;
    if (ln.pts !== undefined) st.lineHeightPt[i - 1] = ln.pts;
    const bef = spacing(kid(lvl, "spcBef")).pts;
    if (bef !== undefined) st.spaceBefore[i - 1] = bef;
    const aft = spacing(kid(lvl, "spcAft")).pts;
    if (aft !== undefined) st.spaceAfter[i - 1] = aft;
    if (i === 1) {
      st.color = colorOf(kid(def, "solidFill"), theme);
      st.align = at(lvl, "algn") ?? undefined;
      st.font = fontName(at(kid(def, "latin"), "typeface"), fonts);
      if (kid(lvl, "buNone")) st.bullet = false;
      else if (kid(lvl, "buChar") || kid(lvl, "buAutoNum")) st.bullet = true;
    }
  }
  return st;
}

async function placeholders(zip: Zip, part: string, theme: Theme, fonts: Fonts) {
  const map = new Map<string, Placeholder>();
  if (!part || !zip.has(part)) return map;
  const doc = await zip.xml(part);
  for (const sp of all(first(doc, "spTree"), "sp")) {
    const ph = first(kid(sp, "nvSpPr"), "ph");
    if (!ph) continue;
    const type = at(ph, "type");
    const entry: Placeholder = { xfrm: xfrmOf(first(kid(sp, "spPr"), "xfrm")), anchor: at(first(kid(sp, "txBody"), "bodyPr"), "anchor") ?? undefined, style: levelStyles(first(kid(sp, "txBody"), "lstStyle"), theme, fonts) };
    if (at(ph, "idx")) map.set(`idx:${at(ph, "idx")}`, entry);
    map.set(`type:${type ?? "body"}`, entry);
    if (!map.has(`kind:${phKind(type)}`)) map.set(`kind:${phKind(type)}`, entry);
  }
  return map;
}

type Part = { path: string; doc: Document; rels: Rels };
type TableStyle = { header?: string; headerText?: string; band?: string; whole?: string };
type Master = { part: Part; theme: Theme; fonts: Fonts; themeDoc?: Document; ph: Map<string, Placeholder>; styles: Record<PhKind, LevelStyle> };
type Layout = { part: Part; ph: Map<string, Placeholder>; master: Master };

async function parsePptx(zip: Zip, name?: string): Promise<Presentation> {
  const pres = await zip.xml("ppt/presentation.xml");
  const presRels = await rels(zip, "ppt/presentation.xml");
  const size = first(pres, "sldSz");
  const W = num(size, "cx", 12192000);
  const H = num(size, "cy", 6858000);
  const masters = new Map<string, Master>();
  const layouts = new Map<string, Layout>();
  const tableStyleCache = new Map<string, Map<string, TableStyle>>();
  const part = async (path: string): Promise<Part> => ({ path, doc: await zip.xml(path), rels: await rels(zip, path) });

  /** Estilos de tabela usados (ppt/tableStyles.xml): fundo do cabeçalho, faixas e texto do cabeçalho. */
  async function tableStyles(theme: Theme, key: string) {
    if (tableStyleCache.has(key)) return tableStyleCache.get(key)!;
    const map = new Map<string, TableStyle>();
    const path = relOfType(presRels, "/tableStyles")?.target;
    if (path && zip.has(path))
      for (const st of all(await zip.xml(path), "tblStyle")) {
        const fill = (name: string) => colorOf(kid(first(first(kid(st, name), "tcStyle"), "fill"), "solidFill"), theme);
        const headerTx = first(kid(st, "firstRow"), "tcTxStyle");
        map.set(at(st, "styleId") ?? "", { header: fill("firstRow"), band: fill("band1H"), whole: fill("wholeTbl"), headerText: colorOf(headerTx, theme) ?? colorOf(kid(headerTx, "fontRef"), theme) });
      }
    // Estilo padrão de tabela do PowerPoint (Médio 2 – Ênfase 1): embutido no Office, raramente gravado no arquivo.
    const builtin = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
    if (!map.has(builtin) && theme.accent1)
      map.set(builtin, {
        header: `#${theme.accent1.toUpperCase()}`,
        headerText: theme.lt1 ? `#${theme.lt1.toUpperCase()}` : undefined,
        band: `#${lighten(theme.accent1, (l) => l + (1 - l) * 0.6).toUpperCase()}`,
        whole: `#${lighten(theme.accent1, (l) => l + (1 - l) * 0.8).toUpperCase()}`,
      });
    tableStyleCache.set(key, map);
    return map;
  }

  async function master(path: string): Promise<Master> {
    if (masters.has(path)) return masters.get(path)!;
    const p = await part(path);
    const t = await readTheme(zip, relOfType(p.rels, "/theme")?.target);
    const tx = first(p.doc, "txStyles");
    const m: Master = {
      part: p,
      theme: t.colors,
      fonts: t.fonts,
      themeDoc: t.doc,
      ph: await placeholders(zip, path, t.colors, t.fonts),
      styles: { title: levelStyles(kid(tx, "titleStyle"), t.colors, t.fonts), body: levelStyles(kid(tx, "bodyStyle"), t.colors, t.fonts), other: levelStyles(kid(tx, "otherStyle"), t.colors, t.fonts) },
    };
    m.styles.title.font ??= t.fonts.major;
    m.styles.body.font ??= t.fonts.minor;
    m.styles.other.font ??= t.fonts.minor;
    masters.set(path, m);
    return m;
  }
  async function layout(path: string): Promise<Layout> {
    if (layouts.has(path)) return layouts.get(path)!;
    const p = await part(path);
    const m = await master(relOfType(p.rels, "/slideMaster")?.target ?? "");
    const l = { part: p, ph: await placeholders(zip, path, m.theme, m.fonts), master: m };
    layouts.set(path, l);
    return l;
  }

  /** Fundo: bgPr (cor, degradê, imagem) ou bgRef (estilo de fundo do tema). */
  const background = async (p: Part, m: Master) => {
    const bg = kid(first(p.doc, "cSld"), "bg");
    if (!bg) return undefined;
    const bgPr = kid(bg, "bgPr");
    if (bgPr) return fillCss(bgPr, m.theme, zip, p.rels);
    const ref = kid(bg, "bgRef");
    if (!ref) return undefined;
    const idx = num(ref, "idx");
    const color = colorOf(ref, m.theme);
    const style = idx >= 1001 ? Array.from(first(m.themeDoc, "bgFillStyleLst")?.children ?? [])[idx - 1001] : undefined;
    if (style) {
      const holder = style.ownerDocument.createElementNS(style.namespaceURI, "holder");
      holder.appendChild(style.cloneNode(true));
      return (await fillCss(holder, m.theme, zip, m.part.rels, color)) ?? color;
    }
    return color;
  };

  const slides: PresentationSlide[] = [];
  for (const [n, id] of kids(first(pres, "sldIdLst"), "sldId").entries()) {
    const path = presRels.get(at(id, "r:id") ?? "")?.target;
    if (!path || !zip.has(path)) continue;
    const slide = await part(path);
    if (at(slide.doc.documentElement, "show") === "0") continue; // slide oculto
    const l = await layout(relOfType(slide.rels, "/slideLayout")?.target ?? "");
    const m = l.master;
    const theme = m.theme;
    const tStyles = await tableStyles(theme, m.part.path);
    const textColor = theme.dk1 ? `#${theme.dk1}` : undefined;
    const shapes: PresentationShape[] = [];
    let title = "";

    const text = (
      txBody: Element | undefined,
      kind: PhKind | null,
      ph: Placeholder | undefined,
      lph: Placeholder | undefined,
      defaultColor?: string,
    ): Pick<PresentationShape, "paragraphs" | "anchor" | "inset" | "fontScale"> => {
      const bodyPr = kid(txBody, "bodyPr");
      const local = levelStyles(kid(txBody, "lstStyle"), theme, m.fonts);
      const base = kind ? m.styles[kind] : m.styles.other;
      const chain = [local, ph?.style, lph?.style, kind ? base : undefined].filter(Boolean) as LevelStyle[];
      const perLevel = (key: "size" | "lineHeight" | "lineHeightPt" | "spaceBefore" | "spaceAfter", lvl: number) => chain.map((st) => st[key][lvl]).find((v) => v !== undefined);
      const single = <K extends "color" | "bullet" | "align" | "font">(key: K) => chain.map((st) => st[key]).find((v) => v !== undefined) as LevelStyle[K];
      const colorDefault = defaultColor ?? single("color") ?? textColor;
      const fontDefault = single("font") ?? (kind === "title" ? m.fonts.major : m.fonts.minor);
      const bulletDefault = single("bullet") ?? (kind === "body" ? (base.bullet ?? true) : false);
      const alignDefault = single("align");
      const autofit = kid(bodyPr, "normAutofit");
      const lnReduce = num(autofit, "lnSpcReduction") / 100000;
      let auto = 0;
      const paragraphs: PresentationParagraph[] = kids(txBody, "p").map((p) => {
        const pPr = kid(p, "pPr");
        const lvl = num(pPr, "lvl");
        const runs: PresentationRun[] = [];
        for (const r of Array.from(p.children)) {
          if (r.localName === "r" || r.localName === "fld") {
            const rPr = kid(r, "rPr");
            runs.push({
              text: kid(r, "t")?.textContent ?? "",
              bold: at(rPr, "b") === "1" || undefined,
              italic: at(rPr, "i") === "1" || undefined,
              underline: !!at(rPr, "u") && at(rPr, "u") !== "none" ? true : undefined,
              strike: !!at(rPr, "strike") && at(rPr, "strike") !== "noStrike" ? true : undefined,
              size: at(rPr, "sz") ? num(rPr, "sz") / 100 : undefined,
              color: colorOf(kid(rPr, "solidFill"), theme),
              font: fontName(at(kid(rPr, "latin"), "typeface"), m.fonts),
            });
          } else if (r.localName === "br") runs.push({ text: "\n" });
        }
        const hasText = runs.some((r) => r.text.trim());
        const autoNum = !!kid(pPr, "buAutoNum");
        const bullet = !hasText || kid(pPr, "buNone") ? undefined : kid(pPr, "buChar") ? (at(kid(pPr, "buChar"), "char") ?? "•") : autoNum ? `${++auto}.` : bulletDefault ? "•" : undefined;
        const algn = at(pPr, "algn") ?? alignDefault;
        const ln = spacing(kid(pPr, "lnSpc"));
        const lh = ln.pct ?? perLevel("lineHeight", lvl);
        const endSize = at(kid(p, "endParaRPr"), "sz");
        return {
          runs,
          level: lvl,
          bullet,
          size: perLevel("size", lvl) ?? (endSize ? Number(endSize) / 100 : kind === "title" ? 44 : 18),
          color: colorDefault,
          font: fontDefault,
          align: algn === "ctr" ? "center" : algn === "r" ? "right" : algn === "just" ? "justify" : undefined,
          lineHeight: lh !== undefined ? Math.max(0.6, lh - lnReduce) : lnReduce ? 1 - lnReduce : undefined,
          lineHeightPt: ln.pts ?? perLevel("lineHeightPt", lvl),
          spaceBefore: spacing(kid(pPr, "spcBef")).pts ?? perLevel("spaceBefore", lvl),
          spaceAfter: spacing(kid(pPr, "spcAft")).pts ?? perLevel("spaceAfter", lvl),
        };
      });
      const anchor = at(bodyPr, "anchor") ?? ph?.anchor ?? lph?.anchor ?? (kind === "title" ? "ctr" : "t");
      const ins = (k: string, d: number) => num(bodyPr, k, d) / W;
      const scale = at(autofit, "fontScale");
      return { paragraphs, anchor: anchor === "ctr" ? "middle" : anchor === "b" ? "bottom" : "top", inset: [ins("tIns", 45720), ins("rIns", 91440), ins("bIns", 45720), ins("lIns", 91440)], fontScale: scale ? Number(scale) / 100000 : undefined };
    };

    type Map2 = (x: Xfrm) => Xfrm;
    const box = (t: Xfrm) => ({ x: t.x / W, y: t.y / H, w: t.w / W, h: t.h / H, rotation: t.rot, flipH: t.flipH, flipV: t.flipV });
    const lineOf = (spPr: Element | undefined, styleEl: Element | undefined) => {
      const ln = kid(spPr, "ln");
      if (kid(ln, "noFill")) return {};
      const ref = first(styleEl, "lnRef");
      const color = colorOf(kid(ln, "solidFill"), theme) ?? (ref && num(ref, "idx") > 0 ? colorOf(ref, theme) : undefined);
      if (!color) return {};
      const dash = at(kid(ln, "prstDash"), "val");
      const end = (name: string) => !!at(kid(ln, name), "type") && at(kid(ln, name), "type") !== "none";
      return { line: color, lineWidth: at(ln, "w") ? num(ln, "w") / 12700 : 0.75, lineDash: !!dash && dash !== "solid" ? true : undefined, arrowStart: end("headEnd") || undefined, arrowEnd: end("tailEnd") || undefined };
    };

    /** Desenha uma árvore de formas (mestre, layout ou slide). `template` = pula os espaços reservados. */
    const walk = async (tree: Element | undefined, map: Map2, p: Part, template: boolean): Promise<void> => {
      for (const el of Array.from(tree?.children ?? [])) {
        const name = el.localName;
        if (name === "sp" || name === "cxnSp") {
          const ph = first(kid(el, name === "sp" ? "nvSpPr" : "nvCxnSpPr"), "ph");
          if (ph && template) continue;
          const type = ph ? at(ph, "type") : null;
          const kind = ph ? phKind(type) : null;
          const key = (k: Map<string, Placeholder>) => (ph ? (at(ph, "idx") && k.get(`idx:${at(ph, "idx")}`)) || k.get(`type:${type ?? "body"}`) || k.get(`kind:${kind}`) : undefined);
          const lph = key(l.ph);
          const mph = key(m.ph);
          const spPr = kid(el, "spPr");
          const xf = xfrmOf(kid(spPr, "xfrm")) ?? lph?.xfrm ?? mph?.xfrm;
          if (!xf) continue;
          const t = map(xf);
          const geom = at(kid(spPr, "prstGeom"), "prst") ?? "rect";
          const styleEl = kid(el, "style");
          const ln = lineOf(spPr, styleEl);
          if (name === "cxnSp" || geom === "line" || /Connector\d?$/.test(geom)) {
            if (ln.line) shapes.push({ kind: "line", ...box(t), ...ln, elbow: geom.startsWith("bentConnector") || undefined });
            continue;
          }
          // Forma sem cor própria herda a do estilo (fillRef); o texto dela, a do fontRef.
          const fillRef = first(styleEl, "fillRef");
          const fill = kid(spPr, "noFill") ? undefined : ((await fillCss(spPr, theme, zip, p.rels)) ?? (!kind && fillRef && num(fillRef, "idx") > 0 ? colorOf(fillRef, theme) : undefined));
          const body = text(kid(el, "txBody"), kind, lph, mph, !kind ? colorOf(first(styleEl, "fontRef"), theme) : undefined);
          const plain = (body.paragraphs ?? []).map((q) => q.runs.map((r) => r.text).join("")).join(" ").trim();
          if (kind === "title" && plain && !title) title = plain;
          if (!plain && !fill && !ln.line) continue;
          shapes.push({ kind: "text", ...box(t), fill, ...ln, geometry: geom, ...body });
        } else if (name === "pic") {
          const ph = first(kid(el, "nvPicPr"), "ph");
          if (ph && template) continue;
          const spPr = kid(el, "spPr");
          const xf = xfrmOf(kid(spPr, "xfrm"));
          const blipFill = kid(el, "blipFill");
          const blip = kid(blipFill, "blip");
          const rel = p.rels.get(at(blip, "r:embed") ?? "");
          const src = xf && rel && !rel.external ? await zip.dataUrl(rel.target) : undefined;
          if (!xf || !src) continue;
          const sr = kid(blipFill, "srcRect");
          const crop: [number, number, number, number] = [num(sr, "l") / 100000, num(sr, "t") / 100000, num(sr, "r") / 100000, num(sr, "b") / 100000];
          const alpha = kid(blip, "alphaModFix");
          shapes.push({
            kind: "image",
            ...box(map(xf)),
            src,
            alt: at(first(el, "cNvPr"), "descr") ?? undefined,
            crop: crop.some(Boolean) ? crop : undefined,
            geometry: at(kid(spPr, "prstGeom"), "prst") ?? undefined,
            opacity: alpha ? num(alpha, "amt") / 100000 : undefined,
            ...lineOf(spPr, undefined),
          });
        } else if (name === "graphicFrame") {
          const xf = xfrmOf(kid(el, "xfrm"));
          if (!xf) continue;
          const t = map(xf);
          const chartRef = first(el, "chart");
          const tbl = first(el, "tbl");
          if (chartRef) {
            const rel = p.rels.get(at(chartRef, "r:id") ?? "");
            if (rel && zip.has(rel.target)) shapes.push({ kind: "chart", ...box(t), chart: await parseChart(zip, rel.target) });
          } else if (tbl) {
            const grid = kids(kid(tbl, "tblGrid"), "gridCol").map((g) => num(g, "w", 1));
            const total = grid.reduce((a, b) => a + b, 0) || 1;
            const tblPr = kid(tbl, "tblPr");
            const st = tStyles.get(kid(tblPr, "tableStyleId")?.textContent ?? "");
            const firstRow = at(tblPr, "firstRow") === "1";
            const banded = at(tblPr, "bandRow") === "1";
            const trs = kids(tbl, "tr");
            const rows = trs.map((tr) => kids(tr, "tc").map((tc) => all(tc, "p").map((q) => all(q, "t").map((x) => x.textContent ?? "").join("")).join("\n")));
            const cells = trs.map((tr, r) =>
              kids(tr, "tc").map((tc) => {
                if (at(tc, "hMerge") === "1" || at(tc, "vMerge") === "1") return { covered: true };
                const tcPr = kid(tc, "tcPr");
                const rPr = first(tc, "rPr");
                const header = firstRow && r === 0;
                const band = banded && (r - (firstRow ? 1 : 0)) % 2 === 0;
                return {
                  fill: kid(tcPr, "noFill") ? undefined : (colorOf(kid(tcPr, "solidFill"), theme) ?? (header ? st?.header : band ? st?.band : st?.whole)),
                  color: colorOf(kid(rPr, "solidFill"), theme) ?? (header ? st?.headerText : undefined),
                  bold: at(rPr, "b") === "1" || header || undefined,
                  size: at(rPr, "sz") ? num(rPr, "sz") / 100 : undefined,
                  span: at(tc, "gridSpan") || at(tc, "rowSpan") ? ([num(tc, "rowSpan", 1), num(tc, "gridSpan", 1)] as [number, number]) : undefined,
                };
              }),
            );
            shapes.push({ kind: "table", ...box(t), rows, cells, colWidths: grid.map((g) => g / total) });
          }
        } else if (name === "grpSp") {
          const g = kid(kid(el, "grpSpPr"), "xfrm");
          const off = xfrmOf(g);
          const ch = { x: num(kid(g, "chOff"), "x"), y: num(kid(g, "chOff"), "y"), w: num(kid(g, "chExt"), "cx"), h: num(kid(g, "chExt"), "cy") };
          const inner: Map2 = off && ch.w && ch.h ? (x) => map({ ...x, x: off.x + ((x.x - ch.x) * off.w) / ch.w, y: off.y + ((x.y - ch.y) * off.h) / ch.h, w: (x.w * off.w) / ch.w, h: (x.h * off.h) / ch.h }) : map;
          await walk(el, inner, p, template);
        } else if (name === "AlternateContent") {
          const alt = kid(el, "Fallback") ?? kid(el, "Choice");
          if (alt) await walk(alt, map, p, template);
        }
      }
    };

    // Ordem do PowerPoint: formas do mestre, do layout e do slide (salvo "ocultar gráficos de fundo").
    const showMaster = at(slide.doc.documentElement, "showMasterSp") !== "0";
    if (showMaster && at(l.part.doc.documentElement, "showMasterSp") !== "0") await walk(first(m.part.doc, "spTree"), (x) => x, m.part, true);
    if (showMaster) await walk(first(l.part.doc, "spTree"), (x) => x, l.part, true);
    await walk(first(slide.doc, "spTree"), (x) => x, slide, false);

    let notes: string | undefined;
    const notesPath = relOfType(slide.rels, "/notesSlide")?.target;
    if (notesPath && zip.has(notesPath)) {
      const nd = await zip.xml(notesPath);
      const body = all(nd, "sp").find((sp) => at(first(sp, "ph"), "type") === "body");
      notes = kids(kid(body, "txBody"), "p").map((q) => all(q, "t").map((t) => t.textContent ?? "").join("")).filter(Boolean).join("\n") || undefined;
    }
    const bg = (await background(slide, m)) ?? (await background(l.part, m)) ?? (await background(m.part, m)) ?? (theme.lt1 ? `#${theme.lt1}` : undefined);
    slides.push({ title: title || `Slide ${n + 1}`, background: bg, shapes, notes });
  }
  return { title: (await coreTitle(zip)) || titleFromName(name) || "Apresentação", aspect: W / H, width: W / 12700, slides };
}
