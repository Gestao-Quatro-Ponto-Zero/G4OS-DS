/*
 * Motor da tabela dinâmica (pivô). Puro, sem React: recebe registros, a
 * descrição dos campos e o layout (Linhas, Colunas, Valores, Filtros) e
 * devolve a árvore de linhas com subtotais, as colunas, as células e os
 * totais. Usado por PivotTable / PivotBuilder (src/components/pivot.tsx) e
 * testado em scripts/test-pivot.mjs.
 *
 * Agregações recalculam a partir dos registros em cada nível: a média de um
 * subtotal é a média dos registros do grupo, nunca a média das médias.
 */

import { formatCompact, formatCurrency, formatNumber, formatPercent } from "./format";

/** Agregação de um valor do pivô. */
export type PivotAgg = "sum" | "avg" | "count" | "min" | "max" | "distinct";

/** Campo disponível para o pivô: dimensão (agrupa) ou medida (soma, média…). */
export type PivotField = {
  id: string;
  label: string;
  kind: "dimension" | "measure";
  /** Formato dos números da medida. `percent` espera fração (0,12 = 12 %). */
  format?: "currency" | "number" | "percent";
  /** Agregações oferecidas (a primeira é a padrão). Medida: soma, média, mín., máx., contagem. Dimensão: contagem, distintos. */
  aggs?: PivotAgg[];
  /** Ordem das categorias de uma dimensão ("1º tri", "2º tri"…). As que faltarem vêm depois, em ordem alfabética. */
  values?: string[];
};

/** Áreas do construtor. */
export type PivotArea = "rows" | "columns" | "values" | "filters";

export type PivotValueSpec = { field: string; agg: PivotAgg };
export type PivotFilterSpec = {
  field: string;
  /** Valores mantidos. `undefined` = todos; `[]` = nenhum. */
  include?: string[];
};

/** Configuração do pivô: dimensões em Linhas e Colunas, medidas em Valores, recortes em Filtros. */
export type PivotLayout = {
  rows: string[];
  columns: string[];
  values: PivotValueSpec[];
  filters: PivotFilterSpec[];
};

export type PivotRecord = Record<string, unknown>;

/** Nó da árvore de linhas: grupo (com filhos e subtotal) ou folha. */
export type PivotRowNode = {
  /** Chave única (caminho de valores). Use em `result.value[key]`. */
  key: string;
  /** Valores das dimensões de linha até este nível. */
  path: string[];
  label: string;
  /** Campo da dimensão deste nível. */
  field: string;
  /** 0 = primeira dimensão de linha. */
  depth: number;
  children: PivotRowNode[];
  /** Registros que caem no nó. */
  count: number;
};

/** Combinação de colunas (folha do cabeçalho). */
export type PivotColumn = { key: string; path: string[] };

/** Célula de cabeçalho de coluna num nível, já com a extensão (em combinações). */
export type PivotHeaderCell = { label: string; span: number; key: string };

/** Valor com campo e rótulo resolvidos ("Receita (Soma)"). */
export type PivotResolvedValue = PivotValueSpec & { label: string; fieldLabel: string; aggLabel: string; format?: PivotField["format"] };

export type PivotCells = Record<string, Record<string, (number | null)[]>>;

export type PivotResult = {
  layout: PivotLayout;
  rowFields: PivotField[];
  columnFields: PivotField[];
  values: PivotResolvedValue[];
  /** Raízes da árvore de linhas (vazio sem dimensões de linha). */
  rows: PivotRowNode[];
  /** Combinações de colunas na ordem de exibição (vazio sem dimensões de coluna). */
  columns: PivotColumn[];
  /** Um nível por dimensão de coluna, com `span` em combinações. */
  columnHeaders: PivotHeaderCell[][];
  /**
   * `value[rowKey][colKey][i]`: valor `i` da célula. Linhas de grupo trazem o
   * subtotal. `PIVOT_TOTAL` como rowKey = total da coluna; como colKey = total
   * da linha; nos dois = total geral.
   */
  value: PivotCells;
  /** Atalho para `value[PIVOT_TOTAL][PIVOT_TOTAL]`. */
  grandTotal: (number | null)[];
  /** Registros depois dos filtros. */
  recordCount: number;
  /** Registros antes dos filtros. */
  totalRecords: number;
};

/** Chave do total (linha "Total geral" e coluna "Total"). */
export const PIVOT_TOTAL = "__total__";
/** Rótulo de registros sem valor na dimensão. */
export const PIVOT_BLANK = "Sem valor";
const SEP = "\u001f";

/** Rótulo pt-BR de cada agregação. */
export const pivotAggLabel: Record<PivotAgg, string> = {
  sum: "Soma",
  avg: "Média",
  count: "Contagem",
  min: "Mínimo",
  max: "Máximo",
  distinct: "Distintos",
};

/** Agregações oferecidas para um campo (as declaradas ou as padrão do tipo). */
export function pivotAggsFor(field: PivotField): PivotAgg[] {
  if (field.aggs?.length) return field.aggs;
  return field.kind === "measure" ? ["sum", "avg", "min", "max", "count"] : ["count", "distinct"];
}

/** Layout vazio. */
export const emptyPivotLayout: PivotLayout = { rows: [], columns: [], values: [], filters: [] };

const dimValue = (v: unknown) => (v == null || v === "" ? PIVOT_BLANK : v instanceof Date ? v.toISOString().slice(0, 10) : String(v));
const numValue = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

function orderValues(field: PivotField | undefined, seen: Iterable<string>) {
  const set = new Set(seen);
  const declared = (field?.values ?? []).filter((v) => set.has(v));
  const rest = [...set].filter((v) => !declared.includes(v)).sort((a, b) => (a === PIVOT_BLANK ? 1 : b === PIVOT_BLANK ? -1 : a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })));
  return [...declared, ...rest];
}

/** Valores distintos de uma dimensão nos registros, na ordem de exibição (para o filtro). */
export function pivotValues(records: PivotRecord[], field: PivotField): string[] {
  return orderValues(
    field,
    records.map((r) => dimValue(r[field.id])),
  );
}

type Acc = { sum: number; n: number; rows: number; min: number; max: number; set: Set<string> | null };
const newAcc = (distinct: boolean): Acc => ({ sum: 0, n: 0, rows: 0, min: Infinity, max: -Infinity, set: distinct ? new Set() : null });

function finish(acc: Acc | undefined, agg: PivotAgg): number | null {
  if (!acc) return agg === "count" || agg === "distinct" ? 0 : null;
  switch (agg) {
    case "sum":
      return acc.n ? acc.sum : null;
    case "avg":
      return acc.n ? acc.sum / acc.n : null;
    case "min":
      return acc.n ? acc.min : null;
    case "max":
      return acc.n ? acc.max : null;
    case "count":
      return acc.rows;
    case "distinct":
      return acc.set?.size ?? 0;
  }
}

/**
 * Calcula o pivô. Campos desconhecidos no layout são ignorados; medidas em
 * Linhas/Colunas também. Sem Valores, o resultado ainda traz linhas e
 * colunas (o componente mostra o estado vazio).
 */
export function pivot(records: PivotRecord[], fields: PivotField[], layout: PivotLayout): PivotResult {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const isDim = (id: string) => byId.get(id)?.kind === "dimension";
  const rowIds = layout.rows.filter(isDim);
  const colIds = layout.columns.filter((id) => isDim(id) && !rowIds.includes(id));
  const values: PivotResolvedValue[] = layout.values
    .filter((v) => byId.has(v.field))
    .map((v) => {
      const f = byId.get(v.field)!;
      const aggLabel = pivotAggLabel[v.agg];
      return { ...v, fieldLabel: f.label, aggLabel, label: `${f.label} (${aggLabel})`, format: f.format };
    });

  // Filtros
  const filters = layout.filters.filter((f) => byId.has(f.field) && f.include);
  const kept = filters.length
    ? records.filter((r) => filters.every((f) => f.include!.includes(dimValue(r[f.field]))))
    : records;

  // Acumuladores por (linha, coluna)
  const accs = new Map<string, Acc[]>();
  const rowSeen: Map<string, Set<string>>[] = rowIds.map(() => new Map());
  const rowCount = new Map<string, number>();
  const colSeen = new Map<string, string[]>();
  const getAccs = (rk: string, ck: string) => {
    const k = rk + "\u001e" + ck;
    let a = accs.get(k);
    if (!a) {
      a = values.map((v) => newAcc(v.agg === "distinct"));
      accs.set(k, a);
    }
    return a;
  };

  for (const r of kept) {
    const rPath = rowIds.map((id) => dimValue(r[id]));
    const cPath = colIds.map((id) => dimValue(r[id]));
    const rowKeys = [PIVOT_TOTAL];
    for (let d = 0; d < rPath.length; d++) {
      const parent = d === 0 ? "" : rPath.slice(0, d).join(SEP);
      let s = rowSeen[d].get(parent);
      if (!s) rowSeen[d].set(parent, (s = new Set()));
      s.add(rPath[d]);
      const k = rPath.slice(0, d + 1).join(SEP);
      rowKeys.push(k);
      rowCount.set(k, (rowCount.get(k) ?? 0) + 1);
    }
    const colKeys = [PIVOT_TOTAL];
    if (cPath.length) {
      const ck = cPath.join(SEP);
      if (!colSeen.has(ck)) colSeen.set(ck, cPath);
      colKeys.push(ck);
    }
    for (const rk of rowKeys)
      for (const ck of colKeys) {
        const a = getAccs(rk, ck);
        values.forEach((v, i) => {
          const acc = a[i];
          const raw = r[v.field];
          if (v.agg === "count") {
            if (raw != null && raw !== "") acc.rows++;
            return;
          }
          if (v.agg === "distinct") {
            if (raw != null && raw !== "") acc.set!.add(dimValue(raw));
            return;
          }
          const n = numValue(raw);
          if (n == null) return;
          acc.sum += n;
          acc.n++;
          if (n < acc.min) acc.min = n;
          if (n > acc.max) acc.max = n;
        });
      }
  }

  // Árvore de linhas
  const buildRows = (depth: number, prefix: string[]): PivotRowNode[] => {
    if (depth >= rowIds.length) return [];
    const parent = prefix.join(SEP);
    const seen = rowSeen[depth].get(depth === 0 ? "" : parent);
    if (!seen) return [];
    const f = byId.get(rowIds[depth]);
    return orderValues(f, seen).map((label) => {
      const path = [...prefix, label];
      const key = path.join(SEP);
      return { key, path, label, field: rowIds[depth], depth, children: buildRows(depth + 1, path), count: rowCount.get(key) ?? 0 };
    });
  };
  const rows = buildRows(0, []);

  // Colunas: ordena combinações nível a nível (respeitando `values` de cada campo)
  const colFields = colIds.map((id) => byId.get(id)!);
  const levelOrder = colFields.map((f, d) => orderValues(f, [...colSeen.values()].map((p) => p[d])));
  const columns: PivotColumn[] = [...colSeen.entries()]
    .map(([key, path]) => ({ key, path }))
    .sort((a, b) => {
      for (let d = 0; d < a.path.length; d++) {
        const diff = levelOrder[d].indexOf(a.path[d]) - levelOrder[d].indexOf(b.path[d]);
        if (diff) return diff;
      }
      return 0;
    });
  const columnHeaders: PivotHeaderCell[][] = colFields.map((_, d) => {
    const level: PivotHeaderCell[] = [];
    for (const c of columns) {
      const key = c.path.slice(0, d + 1).join(SEP);
      const last = level[level.length - 1];
      if (last && last.key === key) last.span++;
      else level.push({ label: c.path[d], span: 1, key });
    }
    return level;
  });

  // Células
  const value: PivotCells = {};
  const allRowKeys = [PIVOT_TOTAL];
  const walk = (ns: PivotRowNode[]) =>
    ns.forEach((n) => {
      allRowKeys.push(n.key);
      walk(n.children);
    });
  walk(rows);
  const allColKeys = [PIVOT_TOTAL, ...columns.map((c) => c.key)];
  for (const rk of allRowKeys) {
    const row: Record<string, (number | null)[]> = {};
    for (const ck of allColKeys) {
      const a = accs.get(rk + "\u001e" + ck);
      row[ck] = values.map((v, i) => finish(a?.[i], v.agg));
    }
    value[rk] = row;
  }

  return {
    layout,
    rowFields: rowIds.map((id) => byId.get(id)!),
    columnFields: colFields,
    values,
    rows,
    columns,
    columnHeaders,
    value,
    grandTotal: value[PIVOT_TOTAL][PIVOT_TOTAL],
    recordCount: kept.length,
    totalRecords: records.length,
  };
}

/** Formata um valor do pivô conforme o campo e a agregação. `null` vira "—". */
export function formatPivotValue(n: number | null | undefined, spec: { agg: PivotAgg; format?: PivotField["format"] }, options: { compact?: boolean } = {}) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (spec.agg === "count" || spec.agg === "distinct") return options.compact ? formatCompact(n) : formatNumber(n);
  switch (spec.format) {
    case "currency":
      return formatCurrency(n, options.compact ? { compact: true } : { cents: false });
    case "percent":
      return formatPercent(n);
    default:
      return formatNumber(n, Number.isInteger(n) ? 0 : 1);
  }
}

/**
 * Achata o resultado numa tabela (CSV, cópia): cabeçalho + uma linha por nó
 * (grupos com subtotal, folhas) + "Total geral". As primeiras colunas são as
 * dimensões de linha; depois, cada combinação × valor e o total.
 */
export function pivotToRows(result: PivotResult): { header: string[]; rows: (string | number | null)[][] } {
  const { rowFields, columns, values } = result;
  const vLabel = (v: PivotResolvedValue) => (values.length > 1 ? ` · ${v.label}` : "");
  const header = [
    ...(rowFields.length ? rowFields.map((f) => f.label) : [""]),
    ...columns.flatMap((c) => values.map((v) => `${c.path.join(" · ")}${vLabel(v)}`)),
    ...values.map((v) => (columns.length ? `Total${vLabel(v)}` : v.label)),
  ];
  const width = Math.max(1, rowFields.length);
  const line = (labels: string[], key: string) => {
    const cells = result.value[key];
    return [...labels, ...Array(width - labels.length).fill(""), ...columns.flatMap((c) => cells[c.key]), ...cells[PIVOT_TOTAL]];
  };
  const rows: (string | number | null)[][] = [];
  const walk = (ns: PivotRowNode[]) =>
    ns.forEach((n) => {
      rows.push(line(n.children.length ? [...n.path.slice(0, -1), `${n.label} (subtotal)`] : n.path, n.key));
      walk(n.children);
    });
  walk(result.rows);
  rows.push(line(["Total geral"], PIVOT_TOTAL));
  return { header, rows };
}

/** O campo pode ir para a área? Medida só em Valores; dimensão em qualquer uma. */
export function pivotCanDrop(field: PivotField | undefined, area: PivotArea) {
  if (!field) return false;
  return area === "values" || field.kind === "dimension";
}

/** Origem de uma movimentação: área + posição (ou a lista de campos, `area: null`). */
export type PivotMoveSource = { area: PivotArea | null; index?: number; field: string };

/**
 * Move um campo entre áreas (ou para fora, `to.area = null`). Garante as
 * regras do construtor: uma dimensão fica em Linhas OU Colunas; medida só em
 * Valores; o mesmo campo + agregação não se repete em Valores. Devolve o
 * layout sem mudança quando o destino não aceita o campo.
 */
export function pivotMove(layout: PivotLayout, fields: PivotField[], from: PivotMoveSource, to: { area: PivotArea | null; index?: number; agg?: PivotAgg }): PivotLayout {
  const field = fields.find((f) => f.id === from.field);
  if (!field) return layout;
  if (to.area && !pivotCanDrop(field, to.area)) return layout;
  const next: PivotLayout = { rows: [...layout.rows], columns: [...layout.columns], values: [...layout.values], filters: [...layout.filters] };
  // Retira da origem, lembrando o que levar junto (agregação, filtro).
  let agg = to.agg;
  let include: string[] | undefined;
  let srcIndex = -1;
  if (from.area === "values") {
    srcIndex = from.index ?? next.values.findIndex((v) => v.field === from.field);
    if (srcIndex >= 0) agg = agg ?? next.values.splice(srcIndex, 1)[0].agg;
  } else if (from.area === "filters") {
    srcIndex = from.index ?? next.filters.findIndex((f) => f.field === from.field);
    if (srcIndex >= 0) include = next.filters.splice(srcIndex, 1)[0].include;
  } else if (from.area) {
    srcIndex = next[from.area].indexOf(from.field);
    if (srcIndex >= 0) next[from.area].splice(srcIndex, 1);
  }
  if (!to.area) return next;
  const clampAt = (len: number, i?: number, sameArea?: boolean) => {
    if (i == null) return len;
    // Índice do alvo foi calculado com o item ainda na lista: corrige ao mover para depois dele.
    const adj = sameArea && srcIndex >= 0 && i > srcIndex ? i - 1 : i;
    return Math.max(0, Math.min(len, adj));
  };
  const same = from.area === to.area;
  if (to.area === "rows" || to.area === "columns") {
    const other = to.area === "rows" ? "columns" : "rows";
    next[other] = next[other].filter((id) => id !== field.id);
    const list = next[to.area].filter((id) => id !== field.id);
    list.splice(clampAt(list.length, to.index, same), 0, field.id);
    next[to.area] = list;
  } else if (to.area === "filters") {
    const existing = next.filters.findIndex((f) => f.field === field.id);
    if (existing >= 0) include = include ?? next.filters.splice(existing, 1)[0].include;
    next.filters.splice(clampAt(next.filters.length, to.index, same), 0, { field: field.id, ...(include ? { include } : {}) });
  } else {
    const a = agg && pivotAggsFor(field).includes(agg) ? agg : pivotAggsFor(field)[0];
    const dup = next.values.findIndex((v) => v.field === field.id && v.agg === a);
    if (dup >= 0) next.values.splice(dup, 1);
    const at = clampAt(next.values.length, to.index, same);
    next.values.splice(dup >= 0 && dup < at ? at - 1 : at, 0, { field: field.id, agg: a });
  }
  return next;
}

/** Troca Linhas e Colunas. */
export function pivotSwap(layout: PivotLayout): PivotLayout {
  return { ...layout, rows: layout.columns, columns: layout.rows };
}
