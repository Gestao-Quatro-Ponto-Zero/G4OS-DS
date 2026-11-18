#!/usr/bin/env node
// Testes de mergeGeoRegions (src/lib/geo-merge.ts): a união some com as divisas
// internas nos três mapas do DS (UFs, municípios, mundo), membros desconhecidos
// e repetidos, e o caminho com curva.
//   node scripts/test-geo-merge.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const dir = mkdtempSync(join(cache, "g4os-ds-geo-merge-"));
const out = join(dir, "bundle.mjs");
let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${String(e.stack ?? e).split("\n").slice(0, 4).join("\n    ")}`);
  }
}

try {
  await build({
    stdin: {
      contents: `export * from "./src/lib/geo-merge"; export * from "./src/lib/geo-maps"; export * from "./src/lib/geo-br";`,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: out,
    logLevel: "error",
  });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  const G = await import(pathToFileURL(out).href);
  const rings = (region) => G.geoPathRings(region.path).length;

  console.log("mergeGeoRegions");
  await test("dois quadrados vizinhos viram um contorno só", () => {
    const a = { id: "a", name: "A", path: "M0 0l10 0 0 10-10 0z", bbox: [0, 0, 10, 10], centroid: [5, 5] };
    const b = { id: "b", name: "B", path: "M10 0L20 0L20 10L10 10Z", bbox: [10, 0, 20, 10], centroid: [15, 5] };
    const { regions, unknown } = G.mergeGeoRegions([a, b], [{ id: "ab", name: "A e B", members: ["a", "b"] }]);
    assert.deepEqual(unknown, []);
    assert.equal(regions.length, 1);
    assert.equal(regions[0].name, "A e B");
    assert.deepEqual(regions[0].bbox, [0, 0, 20, 10]);
    const [ring] = G.geoPathRings(regions[0].path);
    assert.equal(G.geoPathRings(regions[0].path).length, 1);
    assert.ok(!ring.some(([x, y]) => x === 10 && y === 5), "sem divisa interna");
    assert.equal(ring.length, 6); // os 4 cantos e os 2 pontos da divisa, que ficam na borda
  });
  await test("Sudeste e Sul: as UFs viram um contorno por região", () => {
    const { regions } = G.mergeGeoRegions(G.brUfs, Object.entries(G.brRegions).map(([id, members]) => ({ id, members })));
    assert.equal(regions.length, 5);
    for (const id of ["Sudeste", "Sul", "Centro-Oeste"]) assert.equal(rings(regions.find((r) => r.id === id)), 1, id);
  });
  await test("os 645 municípios de SP voltam ao contorno do estado (continente e ilhas)", async () => {
    const sp = await G.loadBrMunicipios("SP");
    const { regions } = G.mergeGeoRegions(sp.municipios, [{ id: "SP", members: sp.municipios.map((m) => m.id) }]);
    assert.ok(rings(regions[0]) <= 8, `${rings(regions[0])} anéis`);
    assert.ok(regions[0].path.length < 4000);
  });
  await test("países em grupo: Mercosul junta Brasil, Argentina, Uruguai e Paraguai", async () => {
    const w = await G.loadWorldCountries();
    const { regions } = G.mergeGeoRegions(w.countries, [{ id: "MS", name: "Mercosul", members: ["BR", "AR", "UY", "PY"] }]);
    const parts = ["BR", "AR", "UY", "PY"].reduce((s, id) => s + rings(w.countries.find((c) => c.id === id)), 0);
    assert.ok(rings(regions[0]) < parts);
    const br = w.countries.find((c) => c.id === "BR");
    assert.deepEqual(regions[0].centroid, br.centroid); // o maior membro, perto do centro do grupo
  });
  await test("membro desconhecido volta em unknown; repetido fica no primeiro grupo", () => {
    const { regions, unknown } = G.mergeGeoRegions(G.brUfs, [
      { id: "x", members: ["SP", "ZZ"] },
      { id: "y", members: ["SP"] },
      { id: "z", members: ["RJ"] },
    ]);
    assert.deepEqual(unknown, ["ZZ"]);
    assert.deepEqual(regions.map((r) => r.id), ["x", "z"]); // y ficou sem membro
  });
  await test("caminho com curva: o grupo junta os caminhos sem tirar divisa", () => {
    const a = { id: "a", name: "A", path: "M0 0c5 5 5 5 10 0z" };
    assert.equal(G.geoPathRings(a.path), null);
    const { regions } = G.mergeGeoRegions([a, { id: "b", name: "B", path: "M0 0l1 0 0 1z" }], [{ id: "g", members: ["a", "b"] }]);
    assert.equal(regions[0].path, "M0 0c5 5 5 5 10 0zM0 0l1 0 0 1z");
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${passed} ok${failures.length ? `, ${failures.length} falharam` : ""}`);
if (failures.length) process.exit(1);
