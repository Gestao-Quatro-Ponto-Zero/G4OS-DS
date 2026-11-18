#!/usr/bin/env node
/*
 * Gera src/lib/geo-data/world.ts (países do mundo) a partir do Natural Earth
 * admin-0 1:50m (domínio público, com nome em português).
 *
 *   node scripts/data/build-geo-world.mjs <ne_50m_admin_0_countries.geojson> [saída]
 *
 * Projeção Equal Earth (área fiel). Id = ISO 3166-1 alfa-2 (ISO_A2_EH): a
 * Somalilândia entra na Somália e o Chipre do Norte no Chipre, como nas
 * bases que usam ISO; partes com o mesmo código viram um país só. Sem a
 * Antártida. Continente pelo Natural Earth; ilhas de "mar aberto" vão para o
 * continente da ONU. Node puro, sem dependências.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { equalEarthRaw, polysOf, shapes } from "./geo-shapes.mjs";

const [, , input, outArg] = process.argv;
if (!input) {
  console.error("uso: node scripts/data/build-geo-world.mjs <geojson do Natural Earth admin-0> [saída]");
  process.exit(1);
}
const out = resolve(outArg ?? "src/lib/geo-data/world.ts");

const WIDTH = 1000;
const PAD = 6;
const TOLERANCE = 0.5;
const MIN_ISLAND = 4;

const CONTINENTS = {
  Africa: "África",
  "North America": "América do Norte",
  "South America": "América do Sul",
  Asia: "Ásia",
  Europe: "Europa",
  Oceania: "Oceania",
};
const UN_REGION = { Africa: "África", Asia: "Ásia", Americas: "América do Sul", Oceania: "Oceania", Europe: "Europa" };
const MERGE = { SOL: "SO", CYN: "CY" }; // ADM0_A3 sem ISO → país ISO
/** Recorte de cada continente em [lon0, lat0, lon1, lat1]. */
const FRAMES = {
  "África": [-20, -36, 55, 38],
  "América do Norte": [-170, 6, -12, 84],
  "América do Sul": [-83, -56, -33, 13],
  "Ásia": [25, -11, 150, 78],
  "Europa": [-25, 34, 45, 72],
  "Oceania": [110, -48, 180, 0],
};

const geo = JSON.parse(readFileSync(input, "utf8"));
const byId = new Map();
for (const f of geo.features) {
  const p = f.properties;
  if (p.CONTINENT === "Antarctica") continue;
  const id = MERGE[p.ADM0_A3] ?? (p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : p.ADM0_A3);
  const continent = CONTINENTS[p.CONTINENT] ?? UN_REGION[p.REGION_UN];
  if (!continent) throw new Error(`sem continente: ${p.ADMIN}`);
  const polys = polysOf(f.geometry);
  const prev = byId.get(id);
  if (prev) {
    prev.geometry.coordinates.push(...polys);
    // O nome e o continente ficam com a maior parte (Austrália, não Ashmore).
    if ((p.POP_EST ?? 0) > prev.pop) Object.assign(prev, { name: p.NAME_PT, continent, pop: p.POP_EST ?? 0 });
  } else {
    byId.set(id, { id, name: p.NAME_PT, continent, pop: p.POP_EST ?? 0, geometry: { type: "MultiPolygon", coordinates: [...polys] } });
  }
}
const feats = [...byId.values()];

let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
for (const f of feats) for (const p of f.geometry.coordinates) for (const [lon, lat] of p[0]) {
  const [x, y] = equalEarthRaw(lon, lat);
  x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
}
const scale = (WIDTH - PAD * 2) / (x1 - x0);
const HEIGHT = Math.ceil((y1 - y0) * scale + PAD * 2);
const project = ([lon, lat]) => {
  const [x, y] = equalEarthRaw(lon, lat);
  return [PAD + (x - x0) * scale, PAD + (y - y0) * scale];
};

const drawn = shapes(feats, { project, tolerance: TOLERANCE, minIsland: MIN_ISLAND });
const countries = feats
  .map((f, i) => ({ ...f, ...drawn[i] }))
  .filter((c) => c.path)
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const frame = ([lon0, lat0, lon1, lat1]) => {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const lon = lon0 + ((lon1 - lon0) * i) / 20, lat = lat0 + ((lat1 - lat0) * i) / 20;
    pts.push(project([lon, lat0]), project([lon, lat1]), project([lon0, lat]), project([lon1, lat]));
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const fx = Math.max(0, Math.min(...xs)), fy = Math.max(0, Math.min(...ys));
  return [fx, fy, Math.min(WIDTH, Math.max(...xs)) - fx, Math.min(HEIGHT, Math.max(...ys)) - fy].map(Math.round).join(" ");
};

const ts = `/*
 * Contornos dos países do mundo, prontos para SVG.
 * Fonte: Natural Earth, admin-0 1:50m (naturalearthdata.com, domínio público).
 * Arquivo gerado: não edite à mão. Para refazer:
 *   node scripts/data/build-geo-world.mjs ne_50m_admin_0_countries.geojson
 * Projeção Equal Earth, divisas simplificadas sem frestas (tolerância ${TOLERANCE}),
 * coordenadas inteiras. Carregue com \`loadWorldCountries()\` (lib/geo-maps).
 */
import type { WorldContinent, WorldCountry } from "../geo-maps";

export const worldViewBox = "0 0 ${WIDTH} ${HEIGHT}";

export const continentViewBoxes: Readonly<Record<WorldContinent, string>> = {
${Object.entries(FRAMES).map(([c, f]) => `  ${JSON.stringify(c)}: "${frame(f)}",`).join("\n")}
};

export const worldCountries: readonly WorldCountry[] = [
${countries.map((c) => `  { id: "${c.id}", name: ${JSON.stringify(c.name)}, continent: ${JSON.stringify(c.continent)}, centroid: [${c.centroid.join(", ")}], bbox: [${c.bbox.join(", ")}], path: "${c.path}" },`).join("\n")}
];
`;
writeFileSync(out, ts);
console.log(`${out}: ${countries.length} países, ${(ts.length / 1024).toFixed(1)} KB, viewBox 0 0 ${WIDTH} ${HEIGHT}`);
