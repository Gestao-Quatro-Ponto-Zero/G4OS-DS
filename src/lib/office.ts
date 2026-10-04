/**
 * Modelo de planilha e de documento do DS. Um único objeto descreve o arquivo:
 * o visualizador (WorkbookView, DocumentView) desenha a partir dele e a
 * exportação (exportXlsx, exportDocx em lib/office-export) gera o .xlsx/.docx
 * a partir dele. O que aparece na tela é o que sai no arquivo.
 */
import { formatCurrency, formatDate, formatNumber, formatPercent } from "./format";

/* ------------------------------------------------------------------ */
/* Planilha                                                            */
/* ------------------------------------------------------------------ */

/** Valor de célula. Datas: `Date` ou "AAAA-MM-DD". Percentual: fração (0,12 = 12 %). */
export type CellValue = string | number | boolean | Date | null | undefined;

/** Como a coluna é formatada na tela e no Excel. */
export type CellFormat = "text" | "integer" | "number" | "currency" | "percent" | "date";

export type WorkbookAggregate = "sum" | "average" | "count" | "min" | "max";

export type WorkbookColumn = {
  /** Chave do valor em cada linha e nome usado nas fórmulas: `{chave}`. */
  key: string;
  header: string;
  /** Padrão "text". Números alinham à direita com algarismos tabulares. */
  format?: CellFormat;
  /** Casas decimais de "number" (padrão 2) e "percent" (padrão 1). */
  digits?: number;
  /** Largura em caracteres, como no Excel. Padrão: estimada pelo conteúdo. */
  width?: number;
  /**
   * Fórmula por linha com as chaves entre chaves: "{qtd} * {preco}".
   * Vira fórmula de verdade no Excel ("=C5*D5"); na tela mostra o resultado.
   * Aceita + − * / e parênteses.
   */
  formula?: string;
  /**
   * Linha de total: agregação (SUBTOTAL no Excel, respeita filtro) ou uma
   * fórmula sobre os totais da mesma linha, para razões: `{ formula: "{lucro} / {receita}" }`.
   */
  total?: WorkbookAggregate | { formula: string };
  /** Comentário no cabeçalho: definição da métrica ou fonte. */
  note?: string;
};

export type WorkbookRow = Record<string, CellValue>;

export type WorkbookSheet = {
  /** Nome da aba (até 31 caracteres, sem : \ / ? * [ ]). */
  name: string;
  /** Título acima da tabela: a conclusão, como em slide ("Setembro foi o melhor mês"). */
  title?: string;
  /** Linha discreta abaixo do título: fonte, período, filtro aplicado. */
  description?: string;
  columns: WorkbookColumn[];
  rows: WorkbookRow[];
  /** Linha de total. `true` = rótulo "Total"; string = rótulo próprio. */
  totals?: boolean | string;
  /** Colunas fixas à esquerda (padrão 1). */
  freezeColumns?: number;
};

export type Workbook = {
  /** Nome do arquivo e título nas propriedades. */
  title: string;
  author?: string;
  sheets: WorkbookSheet[];
};

export type LaidCell = {
  /** Valor final (fórmulas já calculadas). */
  value: CellValue;
  /** Fórmula no formato do Excel, sem "=": "C5*D5", "SUBTOTAL(109,C5:C12)". */
  formula?: string;
  role: "title" | "description" | "header" | "data" | "total";
  format: CellFormat;
  digits?: number;
  /** Ocupa todas as colunas (título e descrição). */
  span?: boolean;
  note?: string;
};

export type SheetLayout = {
  /** Grade: `rows[r][c]`, `null` = célula vazia. Índices 0-based; no Excel, linha r+1. */
  rows: (LaidCell | null)[][];
  colCount: number;
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  totalRow: number | null;
  widths: number[];
};

/** 0 → "A", 25 → "Z", 26 → "AA". */
export function columnLetter(index: number) {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Endereço A1 a partir de linha/coluna 0-based. */
export const cellAddress = (row: number, col: number) => `${columnLetter(col)}${row + 1}`;

const toNumber = (v: CellValue) => (typeof v === "number" ? v : typeof v === "boolean" ? Number(v) : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : 0);

/** "2026-10-01" é dia local (mesma regra de lib/format). */
export const toCellDate = (v: CellValue): Date | null => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00`);
  return null;
};

/**
 * Avalia aritmética simples (+ − * / parênteses) sem `eval`.
 * Divisão por zero dá `null` (célula vazia na tela, #DIV/0! no Excel).
 */
export function evaluateArithmetic(expression: string): number | null {
  const src = expression.replace(/\s+/g, "");
  let i = 0;
  let divZero = false;
  const peek = () => src[i];
  function primary(): number {
    if (peek() === "(") {
      i++;
      const v = sum();
      if (peek() !== ")") throw new Error(`Parêntese não fechado em "${expression}"`);
      i++;
      return v;
    }
    if (peek() === "-") {
      i++;
      return -primary();
    }
    if (peek() === "+") {
      i++;
      return primary();
    }
    const m = /^\d+(\.\d+)?([eE][-+]?\d+)?/.exec(src.slice(i));
    if (!m) throw new Error(`Fórmula inválida: "${expression}"`);
    i += m[0].length;
    return Number(m[0]);
  }
  function product(): number {
    let v = primary();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const r = primary();
      if (op === "/" && r === 0) divZero = true;
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function sum(): number {
    let v = product();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const r = product();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  const v = sum();
  if (i < src.length) throw new Error(`Fórmula inválida: "${expression}"`);
  return divZero || !Number.isFinite(v) ? null : v;
}

const PLACEHOLDER = /\{([^}]+)\}/g;

function resolveFormula(formula: string, keys: Map<string, number>, row: number, values: (key: string) => CellValue, sheet: string) {
  const check = (key: string) => {
    if (!keys.has(key)) throw new Error(`Aba "${sheet}": a fórmula "${formula}" usa {${key}}, que não é uma coluna.`);
    return keys.get(key)!;
  };
  const excel = formula.replace(PLACEHOLDER, (_, k: string) => cellAddress(row, check(k.trim())));
  const numeric = formula.replace(PLACEHOLDER, (_, k: string) => `(${toNumber(values(k.trim()))})`);
  return { excel: excel.replace(/\s+/g, ""), value: evaluateArithmetic(numeric) };
}

const SUBTOTAL: Record<WorkbookAggregate, number> = { average: 101, count: 103, max: 104, min: 105, sum: 109 };

function aggregate(kind: WorkbookAggregate, values: number[]) {
  if (kind === "count") return values.length;
  if (!values.length) return null;
  if (kind === "sum") return values.reduce((a, b) => a + b, 0);
  if (kind === "average") return values.reduce((a, b) => a + b, 0) / values.length;
  return kind === "min" ? Math.min(...values) : Math.max(...values);
}

/**
 * Posiciona a aba numa grade com endereços do Excel: título, descrição,
 * cabeçalho, dados e total. Fórmulas são calculadas aqui, então tela e
 * arquivo mostram o mesmo número.
 */
export function layoutSheet(sheet: WorkbookSheet): SheetLayout {
  const cols = sheet.columns;
  const colCount = cols.length;
  const keys = new Map(cols.map((c, i) => [c.key, i]));
  const rows: (LaidCell | null)[][] = [];
  const empty = () => Array<LaidCell | null>(colCount).fill(null);
  const fmt = (c: WorkbookColumn) => c.format ?? "text";

  if (sheet.title) rows.push([{ value: sheet.title, role: "title", format: "text", span: true }, ...empty().slice(1)]);
  if (sheet.description) rows.push([{ value: sheet.description, role: "description", format: "text", span: true }, ...empty().slice(1)]);
  if (sheet.title || sheet.description) rows.push(empty());

  const headerRow = rows.length;
  rows.push(cols.map((c) => ({ value: c.header, role: "header", format: "text", note: c.note })));

  const firstDataRow = rows.length;
  sheet.rows.forEach((data) => {
    const r = rows.length;
    const computed: Record<string, CellValue> = { ...data };
    const line = cols.map((c): LaidCell => {
      if (c.formula) {
        const { excel, value } = resolveFormula(c.formula, keys, r, (k) => computed[k], sheet.name);
        computed[c.key] = value;
        return { value, formula: excel, role: "data", format: fmt(c), digits: c.digits };
      }
      const raw = data[c.key];
      const value = fmt(c) === "date" ? (toCellDate(raw) ?? raw) : raw;
      return { value, role: "data", format: fmt(c), digits: c.digits };
    });
    rows.push(line);
  });
  const lastDataRow = rows.length - 1;

  let totalRow: number | null = null;
  if (sheet.totals) {
    totalRow = rows.length;
    const r = totalRow;
    const totals: Record<string, CellValue> = {};
    const range = (i: number) => `${cellAddress(firstDataRow, i)}:${cellAddress(lastDataRow, i)}`;
    const line: (LaidCell | null)[] = cols.map((c, i) => {
      if (!c.total || typeof c.total !== "string") return null;
      const nums = rows.slice(firstDataRow, lastDataRow + 1).map((row) => row[i]?.value).filter((v): v is number => typeof v === "number");
      const value = aggregate(c.total, c.total === "count" ? rows.slice(firstDataRow, lastDataRow + 1).map(() => 0) : nums);
      totals[c.key] = value;
      return { value, formula: `SUBTOTAL(${SUBTOTAL[c.total]},${range(i)})`, role: "total", format: c.total === "count" ? "integer" : fmt(c), digits: c.digits };
    });
    cols.forEach((c, i) => {
      if (c.total && typeof c.total === "object") {
        const { excel, value } = resolveFormula(c.total.formula, keys, r, (k) => totals[k], sheet.name);
        line[i] = { value, formula: excel, role: "total", format: fmt(c), digits: c.digits };
      }
    });
    if (!line[0]) line[0] = { value: typeof sheet.totals === "string" ? sheet.totals : "Total", role: "total", format: "text" };
    rows.push(line);
  }

  const widths = cols.map((c, i) => {
    if (c.width) return c.width;
    let w = c.header.length + 2;
    for (let r = headerRow + 1; r < rows.length; r++) {
      const cell = rows[r][i];
      if (cell) w = Math.max(w, formatCell(cell).length + 2);
    }
    return Math.min(Math.max(w, 8), 48);
  });

  return { rows, colCount, headerRow, firstDataRow, lastDataRow, totalRow, widths };
}

/** Texto da célula como aparece na tela (pt-BR, mesmas funções de lib/format). */
export function formatCell(cell: Pick<LaidCell, "value" | "format" | "digits">): string {
  const v = cell.value;
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (cell.format === "date") {
    const d = toCellDate(v);
    return d ? formatDate(d) : String(v);
  }
  if (typeof v !== "number") return v instanceof Date ? formatDate(v) : String(v);
  switch (cell.format) {
    case "currency":
      return formatCurrency(v);
    case "percent":
      return formatPercent(v, cell.digits ?? 1);
    case "integer":
      return formatNumber(Math.round(v), 0);
    case "number":
      return formatNumber(v, cell.digits ?? 2);
    default:
      return formatNumber(v, 2);
  }
}

/** Código de formato numérico do Excel equivalente (o Excel aplica o separador do idioma de quem abre). */
export function excelNumberFormat(format: CellFormat, digits?: number) {
  const dec = (n: number) => (n > 0 ? `.${"0".repeat(n)}` : "");
  switch (format) {
    case "currency":
      return `"R$" #,##0.00;-"R$" #,##0.00`;
    case "percent":
      return `0${dec(digits ?? 1)}%`;
    case "integer":
      return "#,##0";
    case "number":
      return `#,##0${dec(digits ?? 2)}`;
    case "date":
      return "dd/mm/yyyy";
    default:
      return undefined;
  }
}

export const isNumericFormat = (f: CellFormat) => f !== "text" && f !== "date";

/* ------------------------------------------------------------------ */
/* Documento                                                           */
/* ------------------------------------------------------------------ */

/** Trecho de texto com ênfase. Um parágrafo é string ou lista de trechos. */
export type DocRun = { text: string; bold?: boolean; italic?: boolean; href?: string };
export type DocText = string | DocRun[];

export type DocTableColumn = { header: string; format?: CellFormat; digits?: number; /** Fração da largura (padrão: igual). */ width?: number };

export type DocBlock =
  | { type: "heading"; text: string; /** 1 = seção (entra no sumário), 2 = subseção, 3 = tópico. */ level?: 1 | 2 | 3 }
  | { type: "paragraph"; text: DocText }
  | { type: "list"; items: DocText[]; ordered?: boolean }
  | { type: "table"; columns: DocTableColumn[]; rows: CellValue[][]; caption?: string; /** Última linha em negrito, como total. */ totalRow?: boolean }
  | { type: "stats"; items: { label: string; value: string; delta?: string; good?: boolean }[] }
  | { type: "callout"; title?: string; text: DocText; tone?: "neutral" | "info" | "ok" | "amber" | "rose" }
  | { type: "quote"; text: string; author?: string; role?: string }
  | { type: "signatures"; people: { name: string; role?: string }[] }
  | { type: "divider" }
  | { type: "pageBreak" };

export type OfficeDocument = {
  title: string;
  /** Rótulo acima do título na capa ("Relatório trimestral · Q3 2026"). */
  kicker?: string;
  subtitle?: string;
  author?: string;
  /** Data do documento. Padrão: hoje. */
  date?: Date | string;
  /** Capa em página própria (padrão true). */
  cover?: boolean;
  /** Sumário a partir dos títulos de nível 1 e 2. */
  toc?: boolean;
  /** Texto no cabeçalho de cada página (padrão: o título). */
  header?: string;
  /** Texto no rodapé, à esquerda do número da página ("Confidencial"). */
  footer?: string;
  blocks: DocBlock[];
};

export const docRuns = (text: DocText): DocRun[] => (typeof text === "string" ? [{ text }] : text);

/** Títulos de nível 1 e 2, na ordem, para sumário e navegação. */
export function documentOutline(doc: OfficeDocument) {
  return doc.blocks.flatMap((b, index) => (b.type === "heading" && (b.level ?? 1) <= 2 ? [{ index, text: b.text, level: (b.level ?? 1) as 1 | 2 }] : []));
}

/** Nome de arquivo seguro a partir do título: "Revisão Q3 · 2026" → "revisao-q3-2026". */
export function fileSlug(title: string) {
  return (
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "arquivo"
  );
}
