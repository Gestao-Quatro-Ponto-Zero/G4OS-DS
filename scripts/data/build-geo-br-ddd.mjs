#!/usr/bin/env node
/*
 * Gera src/lib/geo-data/br-ddd/<UF>.ts: as regiões de DDD de cada UF, cada uma a
 * união dos seus municípios, sem as divisas internas.
 *
 *   node scripts/data/build-geo-br-ddd.mjs <pasta com geojs-*-mun.json> <municipios.csv> [saída]
 *
 * <pasta>: a mesma malha do IBGE de build-geo-br-municipios.mjs (github.com/tbrugz/geodata-br, CC0).
 * <municipios.csv>: código IBGE → DDD, com as colunas codigo_ibge e ddd, como em
 * github.com/kelvins/municipios-brasileiros (MIT), csv/municipios.csv.
 *
 * Mesma projeção e mesmo viewBox do mapa de municípios da UF. Id = o DDD ("11").
 * Um DDD que cruza a divisa (61: DF e entorno de GO) vira uma região em cada UF.
 * Node puro, sem dependências.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { dissolve, equirectangular, shapes } from "./geo-shapes.mjs";

const [, , dir, csvPath, outArg] = process.argv;
if (!dir || !csvPath) {
  console.error("uso: node scripts/data/build-geo-br-ddd.mjs <pasta com geojs-*-mun.json> <municipios.csv> [saída]");
  process.exit(1);
}
const out = resolve(outArg ?? "src/lib/geo-data/br-ddd");
mkdirSync(out, { recursive: true });

// Os mesmos parâmetros do mapa de municípios: o viewBox da UF é o mesmo.
const WIDTH = 1000;
const PAD = 8;
const TOLERANCE = 1.1;
const MIN_ISLAND = 6;
const UF_CODE = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27,
  SE: 28, BA: 29, MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53,
};

const [header, ...lines] = readFileSync(csvPath, "utf8").trim().split(/\r?\n/);
const cols = header.split(",");
const codeAt = cols.indexOf("codigo_ibge"), dddAt = cols.indexOf("ddd");
if (codeAt < 0 || dddAt < 0) throw new Error("o CSV precisa das colunas codigo_ibge e ddd");
// Só as duas colunas numéricas: o nome (que pode ter vírgula) fica de fora.
const dddOf = new Map(lines.map((l) => l.split(",")).map((c) => [c[codeAt], c[dddAt]]));

let total = 0;
for (const [uf, code] of Object.entries(UF_CODE)) {
  const geo = JSON.parse(readFileSync(join(dir, `geojs-${code}-mun.json`), "utf8"));
  const feats = geo.features.filter((f) => String(f.properties.id).startsWith(String(code)));
  const by = new Map();
  for (const f of feats) {
    const ddd = dddOf.get(String(f.properties.id));
    if (!/^[1-9][1-9]$/.test(ddd ?? "")) throw new Error(`${uf}: ${f.properties.id} sem DDD`);
    if (!by.has(ddd)) by.set(ddd, []);
    by.get(ddd).push(f);
  }
  const { project, height } = equirectangular(feats, WIDTH, PAD);
  const regions = dissolve([...by].map(([ddd, features]) => ({ id: ddd, name: `DDD ${ddd}`, features })));
  const drawn = shapes(regions, { project, tolerance: TOLERANCE, minIsland: MIN_ISLAND });
  const rows = regions
    .map((f, i) => ({ id: f.properties.id, name: f.properties.name, count: by.get(f.properties.id).length, ...drawn[i] }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const ts = `/*
 * DDDs de ${uf} (${rows.length}), cada um a união dos seus municípios, prontos para SVG.
 * Fontes: malha municipal do IBGE (via github.com/tbrugz/geodata-br, CC0) e DDD por
 * município de github.com/kelvins/municipios-brasileiros (MIT, Copyright (c) 2016
 * Kelvin S. do Prado). Arquivo gerado: não edite à mão. Para refazer:
 *   node scripts/data/build-geo-br-ddd.mjs <pasta com geojs-*-mun.json> <municipios.csv>
 * Carregue com \`loadBrDdd("${uf}")\` (lib/geo-maps).
 */
import type { BrDddShape } from "../../geo-maps";

export const viewBox = "0 0 ${WIDTH} ${height}";

export const ddds: readonly BrDddShape[] = [
${rows.map((r) => `  { id: "${r.id}", name: "${r.name}", municipios: ${r.count}, centroid: [${r.centroid.join(", ")}], bbox: [${r.bbox.join(", ")}], path: "${r.path}" },`).join("\n")}
];
`;
  writeFileSync(join(out, `${uf}.ts`), ts);
  total += rows.length;
}
console.log(`${out}: ${Object.keys(UF_CODE).length} UFs, ${total} regiões de DDD`);
