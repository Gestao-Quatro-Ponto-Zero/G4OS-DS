#!/usr/bin/env node
// As libs puras e os tokens do pacote rodam no servidor (Server Component, rota
// de API, script): sem "use client" e sem React no grafo. Roda depois do build.
//   npm run build && node scripts/test-server-libs.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const files = ["lib/format.js", "lib/pivot.js", "lib/scale.js", "lib/geo-br.js", "lib/dates.js", "lib/text.js", "tokens/index.js"];
const seen = new Set();
const walk = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  const src = readFileSync(file, "utf8");
  assert.ok(!/^\s*["']use client["']/.test(src), `${file.replace(dist + "/", "")} não pode ter "use client"`);
  assert.ok(!/from\s+["'](react|react-dom|@base-ui\/react|lucide-react)/.test(src), `${file.replace(dist + "/", "")} importa React`);
  for (const [, rel] of src.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) walk(join(dirname(file), rel));
};
for (const f of files) walk(join(dist, f));

const { formatCurrency } = await import(pathToFileURL(join(dist, "lib/format.js")).href);
const { buildPivot } = await import(pathToFileURL(join(dist, "lib/pivot.js")).href);
const { quantizeScale } = await import(pathToFileURL(join(dist, "lib/scale.js")).href);
const { brUfs } = await import(pathToFileURL(join(dist, "lib/geo-br.js")).href);
assert.equal(formatCurrency(-20000, { compact: true }), "−R$ 20 mil");
const r = buildPivot([{ uf: "SP", v: 2 }, { uf: "SP", v: 3 }], [{ id: "uf", label: "UF", kind: "dimension" }, { id: "v", label: "V", kind: "measure" }], { rows: ["uf"], columns: [], values: [{ field: "v", agg: "sum" }], filters: [] });
assert.equal(r.grandTotal?.[0] ?? r.grandTotal, 5);
assert.equal(quantizeScale([0, 100], 5).steps, 5);
assert.equal(brUfs.length, 27);
console.log(`libs de servidor ok: ${seen.size} arquivos sem "use client" nem React; format, pivot, escala e geo rodam no Node`);
