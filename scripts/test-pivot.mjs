#!/usr/bin/env node
// Testes do motor da tabela dinâmica (src/lib/pivot.ts): agregações,
// subtotais, totais, filtros, ordem de categorias, casos de borda e
// movimentação de campos entre áreas.
//   node scripts/test-pivot.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const dir = mkdtempSync(join(cache, "g4os-ds-pivot-"));
const out = join(dir, "bundle.mjs");
let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${String(e.stack ?? e).split("\n").slice(0, 4).join("\n    ")}`);
  }
}

try {
  await build({
    entryPoints: [join(root, "src/lib/pivot.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
    logLevel: "error",
  });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  const P = await import(pathToFileURL(out).href);
  const { pivot, pivotToRows, formatPivotValue, pivotMove, pivotSwap, pivotValues, PIVOT_TOTAL: T, emptyPivotLayout } = P;

  const fields = [
    { id: "regiao", label: "Região", kind: "dimension", values: ["Sul", "Sudeste"] },
    { id: "uf", label: "UF", kind: "dimension" },
    { id: "tri", label: "Trimestre", kind: "dimension", values: ["1º tri", "2º tri"] },
    { id: "canal", label: "Canal", kind: "dimension" },
    { id: "receita", label: "Receita", kind: "measure", format: "currency" },
    { id: "desconto", label: "Desconto", kind: "measure", format: "percent", aggs: ["avg", "min", "max"] },
  ];
  const records = [
    { regiao: "Sudeste", uf: "SP", tri: "1º tri", canal: "Parceiros", receita: 100, desconto: 0.1 },
    { regiao: "Sudeste", uf: "SP", tri: "2º tri", canal: "Inside", receita: 200, desconto: 0.2 },
    { regiao: "Sudeste", uf: "RJ", tri: "1º tri", canal: "Inside", receita: 50, desconto: 0 },
    { regiao: "Sul", uf: "PR", tri: "2º tri", canal: "Parceiros", receita: 30, desconto: 0.3 },
    { regiao: "Sul", uf: "RS", tri: "1º tri", canal: "Inside", receita: 20, desconto: 0.1 },
    { regiao: "Sul", uf: "RS", tri: "1º tri", canal: "Inside", receita: 10, desconto: null },
  ];
  const L = (o) => ({ ...emptyPivotLayout, ...o });
  const SEP = "\u001f";

  console.log("pivot · agregações");
  const r = pivot(records, fields, L({ rows: ["regiao", "uf"], columns: ["tri"], values: [{ field: "receita", agg: "sum" }] }));

  test("soma por folha e coluna", () => {
    assert.deepEqual(r.value[`Sudeste${SEP}SP`]["1º tri"], [100]);
    assert.deepEqual(r.value[`Sudeste${SEP}SP`]["2º tri"], [200]);
    assert.deepEqual(r.value[`Sul${SEP}RS`]["1º tri"], [30]);
  });
  test("célula sem registros é null na soma", () => {
    assert.deepEqual(r.value[`Sudeste${SEP}RJ`]["2º tri"], [null]);
  });
  test("subtotal do grupo e total da linha", () => {
    assert.deepEqual(r.value.Sudeste["1º tri"], [150]);
    assert.deepEqual(r.value.Sudeste[T], [350]);
    assert.deepEqual(r.value.Sul[T], [60]);
  });
  test("total da coluna e total geral", () => {
    assert.deepEqual(r.value[T]["1º tri"], [180]);
    assert.deepEqual(r.value[T]["2º tri"], [230]);
    assert.deepEqual(r.grandTotal, [410]);
    assert.equal(r.recordCount, 6);
  });
  test("árvore de linhas respeita a ordem declarada (Sul antes de Sudeste) e ordena o resto", () => {
    assert.deepEqual(r.rows.map((n) => n.label), ["Sul", "Sudeste"]);
    assert.deepEqual(r.rows[1].children.map((n) => n.label), ["RJ", "SP"]);
    assert.equal(r.rows[0].children[1].count, 2);
    assert.equal(r.rows[0].depth, 0);
    assert.equal(r.rows[0].children[0].depth, 1);
  });
  test("ordem de colunas segue `values` do campo", () => {
    assert.deepEqual(r.columns.map((c) => c.key), ["1º tri", "2º tri"]);
    assert.deepEqual(r.columnHeaders, [[{ label: "1º tri", span: 1, key: "1º tri" }, { label: "2º tri", span: 1, key: "2º tri" }]]);
  });

  const avg = pivot(records, fields, L({ rows: ["regiao", "uf"], values: [{ field: "desconto", agg: "avg" }, { field: "receita", agg: "count" }, { field: "canal", agg: "distinct" }, { field: "receita", agg: "min" }, { field: "receita", agg: "max" }] }));
  test("média do subtotal recalcula a partir dos registros (não é média de médias)", () => {
    // Sudeste: SP média 0,15; RJ 0 → média de médias seria 0,075; dos registros é 0,1.
    assert.ok(Math.abs(avg.value.Sudeste[T][0] - 0.1) < 1e-12);
    // Sul: PR 0,3, RS 0,1 (um registro sem desconto é ignorado) → 0,2.
    assert.ok(Math.abs(avg.value.Sul[T][0] - 0.2) < 1e-12);
  });
  test("contagem, distintos, mínimo e máximo", () => {
    assert.deepEqual(avg.value.Sul[T].slice(1), [3, 2, 10, 30]);
    assert.deepEqual(avg.grandTotal.slice(1), [6, 2, 10, 200]);
  });

  console.log("pivot · filtros e bordas");
  test("filtro mantém só os valores incluídos", () => {
    const f = pivot(records, fields, L({ rows: ["regiao"], values: [{ field: "receita", agg: "sum" }], filters: [{ field: "canal", include: ["Inside"] }] }));
    assert.equal(f.recordCount, 4);
    assert.equal(f.totalRecords, 6);
    assert.deepEqual(f.grandTotal, [280]);
    assert.deepEqual(f.rows.map((n) => n.label), ["Sul", "Sudeste"]);
  });
  test("filtro sem `include` não recorta; `include: []` recorta tudo", () => {
    assert.equal(pivot(records, fields, L({ values: [{ field: "receita", agg: "sum" }], filters: [{ field: "canal" }] })).recordCount, 6);
    const none = pivot(records, fields, L({ rows: ["regiao"], values: [{ field: "receita", agg: "sum" }], filters: [{ field: "canal", include: [] }] }));
    assert.equal(none.recordCount, 0);
    assert.deepEqual(none.rows, []);
    assert.deepEqual(none.grandTotal, [null]);
  });
  test("sem colunas: só o total por linha", () => {
    const s = pivot(records, fields, L({ rows: ["regiao"], values: [{ field: "receita", agg: "sum" }] }));
    assert.deepEqual(s.columns, []);
    assert.deepEqual(s.columnHeaders, []);
    assert.deepEqual(Object.keys(s.value.Sul), [T]);
  });
  test("sem linhas: só a linha de total por coluna", () => {
    const s = pivot(records, fields, L({ columns: ["tri"], values: [{ field: "receita", agg: "sum" }] }));
    assert.deepEqual(s.rows, []);
    assert.deepEqual(s.value[T]["2º tri"], [230]);
    assert.deepEqual(s.grandTotal, [410]);
  });
  test("dois níveis de coluna agrupam o cabeçalho com span", () => {
    const s = pivot(records, fields, L({ columns: ["tri", "canal"], values: [{ field: "receita", agg: "sum" }] }));
    assert.deepEqual(s.columnHeaders[0].map((h) => [h.label, h.span]), [["1º tri", 2], ["2º tri", 2]]);
    assert.deepEqual(s.columnHeaders[1].map((h) => h.label), ["Inside", "Parceiros", "Inside", "Parceiros"]);
  });
  test("vários valores por célula", () => {
    const s = pivot(records, fields, L({ rows: ["regiao"], columns: ["tri"], values: [{ field: "receita", agg: "sum" }, { field: "receita", agg: "avg" }] }));
    assert.deepEqual(s.value.Sudeste["1º tri"], [150, 75]);
    assert.deepEqual(s.values.map((v) => v.label), ["Receita (Soma)", "Receita (Média)"]);
  });
  test("dados vazios não quebram", () => {
    const s = pivot([], fields, L({ rows: ["regiao"], columns: ["tri"], values: [{ field: "receita", agg: "sum" }, { field: "receita", agg: "count" }] }));
    assert.deepEqual(s.rows, []);
    assert.deepEqual(s.columns, []);
    assert.deepEqual(s.grandTotal, [null, 0]);
    assert.equal(pivotToRows(s).rows.length, 1);
  });
  test("medida em Linhas e campo desconhecido são ignorados", () => {
    const s = pivot(records, fields, L({ rows: ["receita", "xpto", "regiao"], values: [{ field: "receita", agg: "sum" }, { field: "xpto", agg: "sum" }] }));
    assert.deepEqual(s.rowFields.map((f) => f.id), ["regiao"]);
    assert.equal(s.values.length, 1);
  });
  test("valor ausente na dimensão vira 'Sem valor', no fim", () => {
    const s = pivot([...records, { uf: "AM", receita: 5 }], fields, L({ rows: ["regiao"], values: [{ field: "receita", agg: "sum" }] }));
    assert.deepEqual(s.rows.map((n) => n.label), ["Sul", "Sudeste", "Sem valor"]);
    assert.deepEqual(pivotValues(records, fields[3]), ["Inside", "Parceiros"]);
  });

  console.log("pivotToRows e formatPivotValue");
  test("pivotToRows achata com subtotais e total geral", () => {
    const { header, rows } = pivotToRows(r);
    assert.deepEqual(header, ["Região", "UF", "1º tri", "2º tri", "Total"]);
    assert.deepEqual(rows[0], ["Sul (subtotal)", "", 30, 30, 60]);
    assert.deepEqual(rows[1], ["Sul", "PR", null, 30, 30]);
    assert.deepEqual(rows.at(-1), ["Total geral", "", 180, 230, 410]);
    assert.equal(rows.length, 1 + 2 + 1 + 2 + 1);
  });
  test("formatPivotValue usa lib/format", () => {
    assert.equal(formatPivotValue(1234.5, { agg: "sum", format: "currency" }).replace(/\s/g, " "), "R$ 1.235");
    assert.equal(formatPivotValue(0.125, { agg: "avg", format: "percent" }), "12,5 %");
    assert.equal(formatPivotValue(1234, { agg: "count", format: "currency" }), "1.234");
    assert.equal(formatPivotValue(null, { agg: "sum" }), "—");
  });

  console.log("pivotMove e pivotSwap");
  const base = L({ rows: ["regiao", "uf"], columns: ["tri"], values: [{ field: "receita", agg: "sum" }], filters: [{ field: "canal", include: ["Inside"] }] });
  test("da lista para Colunas tira de Linhas (dimensão em um lugar só)", () => {
    const m = pivotMove(base, fields, { area: null, field: "uf" }, { area: "columns", index: 0 });
    assert.deepEqual(m.rows, ["regiao"]);
    assert.deepEqual(m.columns, ["uf", "tri"]);
  });
  test("reordena dentro da área", () => {
    const m = pivotMove(base, fields, { area: "rows", index: 0, field: "regiao" }, { area: "rows", index: 2 });
    assert.deepEqual(m.rows, ["uf", "regiao"]);
  });
  test("medida não entra em Linhas nem Filtros", () => {
    assert.equal(pivotMove(base, fields, { area: "values", index: 0, field: "receita" }, { area: "rows" }), base);
    assert.equal(pivotMove(base, fields, { area: null, field: "receita" }, { area: "filters" }), base);
  });
  test("Valores: agregação padrão do campo e sem duplicar campo + agregação", () => {
    const m = pivotMove(base, fields, { area: null, field: "desconto" }, { area: "values" });
    assert.deepEqual(m.values.at(-1), { field: "desconto", agg: "avg" });
    const d = pivotMove(base, fields, { area: null, field: "receita" }, { area: "values" });
    assert.equal(d.values.length, 1);
    const c = pivotMove(base, fields, { area: null, field: "canal" }, { area: "values" });
    assert.deepEqual(c.values.at(-1), { field: "canal", agg: "count" });
  });
  test("filtro leva os valores escolhidos ao mudar de posição; remover tira", () => {
    const m = pivotMove(base, fields, { area: "filters", index: 0, field: "canal" }, { area: "filters", index: 0 });
    assert.deepEqual(m.filters, [{ field: "canal", include: ["Inside"] }]);
    const out = pivotMove(base, fields, { area: "rows", index: 1, field: "uf" }, { area: null });
    assert.deepEqual(out.rows, ["regiao"]);
  });
  test("trocar linhas e colunas", () => {
    const s = pivotSwap(base);
    assert.deepEqual([s.rows, s.columns], [["tri"], ["regiao", "uf"]]);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} ok${failures.length ? `, ${failures.length} falharam` : ""}`);
if (failures.length) process.exit(1);
