#!/usr/bin/env node
/*
 * Gera src/lib/geo-data/br-mun/<UF>.ts (municípios de cada UF) a partir da
 * malha municipal do IBGE em GeoJSON, um arquivo por UF (geojs-<código>-mun.json,
 * como em github.com/tbrugz/geodata-br, CC0).
 *
 *   node scripts/data/build-geo-br-municipios.mjs <pasta com geojs-*-mun.json> [saída]
 *
 * Id = código IBGE de 7 dígitos. Um viewBox de 1000 de largura por UF, em
 * projeção equirretangular (cos da latitude média), divisas sem frestas.
 * Node puro, sem dependências.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { equirectangular, shapes } from "./geo-shapes.mjs";

const [, , dir, outArg] = process.argv;
if (!dir) {
  console.error("uso: node scripts/data/build-geo-br-municipios.mjs <pasta com geojs-*-mun.json> [saída]");
  process.exit(1);
}
const out = resolve(outArg ?? "src/lib/geo-data/br-mun");
mkdirSync(out, { recursive: true });

const WIDTH = 1000;
const PAD = 8;
const TOLERANCE = 1.1;
const MIN_ISLAND = 6;
const UF_CODE = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27,
  SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53,
};

let total = 0;
for (const [uf, code] of Object.entries(UF_CODE)) {
  const geo = JSON.parse(readFileSync(join(dir, `geojs-${code}-mun.json`), "utf8"));
  const feats = geo.features.filter((f) => String(f.properties.id).startsWith(String(code)));
  if (!feats.length) throw new Error(`${uf}: nenhum município`);
  const { project, height } = equirectangular(feats, WIDTH, PAD);
  const drawn = shapes(feats, { project, tolerance: TOLERANCE, minIsland: MIN_ISLAND });
  const rows = feats
    .map((f, i) => ({ id: String(f.properties.id), name: String(f.properties.name), ...drawn[i] }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const ts = `/*
 * Municípios de ${uf} (${rows.length}), prontos para SVG. Fonte: malha municipal do IBGE
 * (via github.com/tbrugz/geodata-br, CC0). Arquivo gerado: não edite à mão. Para refazer:
 *   node scripts/data/build-geo-br-municipios.mjs <pasta com geojs-*-mun.json>
 * Carregue com \`loadBrMunicipios("${uf}")\` (lib/geo-maps).
 */
import type { GeoShape } from "../../geo-maps";

export const viewBox = "0 0 ${WIDTH} ${height}";

export const municipios: readonly GeoShape[] = [
${rows.map((r) => `  { id: "${r.id}", name: ${JSON.stringify(r.name)}, centroid: [${r.centroid.join(", ")}], bbox: [${r.bbox.join(", ")}], path: "${r.path}" },`).join("\n")}
];
`;
  writeFileSync(join(out, `${uf}.ts`), ts);
  total += rows.length;
}
console.log(`${out}: ${Object.keys(UF_CODE).length} UFs, ${total} municípios`);
