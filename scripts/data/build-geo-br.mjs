#!/usr/bin/env node
/*
 * Gera src/lib/geo-br.ts (contornos das 27 UFs) a partir do Natural Earth
 * admin-1 1:50m (domínio público).
 *
 *   node scripts/data/build-geo-br.mjs <ne_50m_admin_1_states_provinces.geojson> [saída]
 *
 * Passos: filtra adm0_a3 = BRA, projeta (equirretangular com correção do
 * cosseno da latitude média), simplifica preservando a topologia (as divisas
 * entre UFs são simplificadas uma vez só e reaproveitadas pelos dois lados,
 * então não abrem frestas), descarta ilhotas, arredonda para inteiros num
 * viewBox de 1000 de largura e escreve caminhos SVG relativos.
 * Node puro, sem dependências.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , input, outArg] = process.argv;
if (!input) {
  console.error("uso: node scripts/data/build-geo-br.mjs <geojson do Natural Earth admin-1> [saída]");
  process.exit(1);
}
const out = resolve(outArg ?? "src/lib/geo-br.ts");

const WIDTH = 1000;
const PAD = 8;
const TOLERANCE = 0.6; // em unidades do viewBox (Douglas–Peucker)
const MIN_ISLAND = 40; // área mínima (unidades²) de um polígono secundário

const NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};
const REGIONS = {
  Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Centro-Oeste": ["DF", "GO", "MT", "MS"],
  Sudeste: ["ES", "MG", "RJ", "SP"],
  Sul: ["PR", "RS", "SC"],
};
const regionOf = Object.fromEntries(Object.entries(REGIONS).flatMap(([r, ufs]) => ufs.map((u) => [u, r])));

const geo = JSON.parse(readFileSync(input, "utf8"));
const feats = geo.features.filter((f) => f.properties.adm0_a3 === "BRA");
if (feats.length !== 27) throw new Error(`esperava 27 UFs, achei ${feats.length}`);

const polysOf = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);

/* ---------- projeção ---------- */
let lon0 = Infinity, lon1 = -Infinity, lat0 = Infinity, lat1 = -Infinity;
for (const f of feats) for (const p of polysOf(f)) for (const r of p) for (const [x, y] of r) {
  lon0 = Math.min(lon0, x); lon1 = Math.max(lon1, x); lat0 = Math.min(lat0, y); lat1 = Math.max(lat1, y);
}
const k = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180);
const scale = (WIDTH - PAD * 2) / ((lon1 - lon0) * k);
const HEIGHT = Math.ceil((lat1 - lat0) * scale + PAD * 2);
const project = ([x, y]) => [PAD + (x - lon0) * k * scale, PAD + (lat1 - y) * scale];

/* ---------- topologia: junções ---------- */
const key = (p) => `${p[0]},${p[1]}`;
const neighbors = new Map();
const addN = (a, b) => {
  const ka = key(a);
  if (!neighbors.has(ka)) neighbors.set(ka, new Set());
  neighbors.get(ka).add(key(b));
};
const ringsAll = [];
for (const f of feats) for (const p of polysOf(f)) for (const r of p) {
  const ring = r.slice(0, -1); // sem o ponto repetido de fechamento
  ringsAll.push(ring);
  for (let i = 0; i < ring.length; i++) {
    addN(ring[i], ring[(i + 1) % ring.length]);
    addN(ring[i], ring[(i - 1 + ring.length) % ring.length]);
  }
}
const isJunction = (p) => (neighbors.get(key(p))?.size ?? 0) > 2;

/* ---------- Douglas–Peucker ---------- */
function dp(pts, tol) {
  if (pts.length <= 2) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    let max = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* Cada trecho entre junções é simplificado numa orientação canônica e guardado. */
const arcCache = new Map();
function simplifyArc(arcLL) {
  const fwd = arcLL.map(key).join(";");
  const rev = [...arcLL].reverse().map(key).join(";");
  const canon = fwd < rev ? fwd : rev;
  if (!arcCache.has(canon)) {
    const base = fwd < rev ? arcLL : [...arcLL].reverse();
    arcCache.set(canon, dp(base.map(project), TOLERANCE));
  }
  const s = arcCache.get(canon);
  return fwd < rev ? s : [...s].reverse();
}

function simplifyRing(ring) {
  let start = ring.findIndex(isJunction);
  const fixedIdx = [];
  if (start === -1) {
    // anel sem vizinhos (ilha): fixa dois pontos opostos
    start = 0;
    fixedIdx.push(0, Math.floor(ring.length / 2));
  } else {
    for (let i = 0; i < ring.length; i++) if (isJunction(ring[i])) fixedIdx.push(i);
  }
  const out = [];
  for (let j = 0; j < fixedIdx.length; j++) {
    const a = fixedIdx[j];
    const b = fixedIdx[(j + 1) % fixedIdx.length];
    const arc = [];
    for (let i = a; ; i = (i + 1) % ring.length) {
      arc.push(ring[i]);
      if (i === b && arc.length > 1) break;
    }
    const s = simplifyArc(arc);
    out.push(...s.slice(0, -1));
  }
  return out;
}

/* ---------- geometria ---------- */
const round = (pts) => {
  const r = [];
  for (const [x, y] of pts) {
    const p = [Math.round(x), Math.round(y)];
    const last = r[r.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) r.push(p);
  }
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  return r;
};
const area = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    s += x0 * y1 - x1 * y0;
  }
  return s / 2;
};
const centroidOf = (pts) => {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const c = x0 * y1 - x1 * y0;
    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  a /= 2;
  return a === 0 ? pts[0] : [cx / (6 * a), cy / (6 * a)];
};
const ringPath = (pts) => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  let prev = pts[0];
  let body = "";
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - prev[0], dy = pts[i][1] - prev[1];
    body += `${body && dx >= 0 ? " " : ""}${dx}${dy >= 0 ? " " : ""}${dy}`;
    prev = pts[i];
  }
  return `${d}l${body}z`;
};

const ufs = [];
for (const f of feats) {
  const id = f.properties.postal;
  if (!NAMES[id]) throw new Error(`sigla desconhecida: ${id}`);
  const polys = polysOf(f)
    .map((p) => p.map((r) => round(simplifyRing(r.slice(0, -1)))).filter((r) => r.length >= 3))
    .filter((p) => p.length)
    .map((p) => ({ rings: p, area: Math.abs(area(p[0])) }))
    .sort((a, b) => b.area - a.area);
  const kept = polys.filter((p, i) => i === 0 || p.area >= MIN_ISLAND);
  const xs = [], ys = [];
  for (const p of kept) for (const r of p.rings) for (const [x, y] of r) { xs.push(x); ys.push(y); }
  const c = centroidOf(kept[0].rings[0]);
  ufs.push({
    id,
    name: NAMES[id],
    region: regionOf[id],
    path: kept.flatMap((p) => p.rings.map(ringPath)).join(""),
    centroid: [Math.round(c[0]), Math.round(c[1])],
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
  });
}
ufs.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const ts = `/*
 * Contornos das 27 unidades da federação, prontos para SVG.
 * Fonte: Natural Earth, admin-1 1:50m (naturalearthdata.com, domínio público).
 * Arquivo gerado: não edite à mão. Para refazer:
 *   node scripts/data/build-geo-br.mjs ne_50m_admin_1_states_provinces.geojson
 * Projeção equirretangular (cos da latitude média), divisas simplificadas
 * sem frestas (Douglas–Peucker por trecho, tolerância ${TOLERANCE}), coordenadas inteiras.
 */

/** Sigla de uma UF. */
export type BrUfId = ${ufs.map((u) => `"${u.id}"`).sort().join(" | ")};

/** Grande região do IBGE. */
export type BrRegion = ${Object.keys(REGIONS).map((r) => `"${r}"`).join(" | ")};

/** Uma UF desenhável: contorno SVG, centróide (do maior polígono) e caixa. */
export type BrUf = {
  id: BrUfId;
  name: string;
  region: BrRegion;
  /** Caminho SVG (pode ter várias partes: desenhe com fill-rule="evenodd"). */
  path: string;
  centroid: readonly [number, number];
  /** [x0, y0, x1, y1] no sistema do \`brViewBox\`. */
  bbox: readonly [number, number, number, number];
};

/** viewBox do mapa do Brasil (use com \`brUfs\`). */
export const brViewBox = "0 0 ${WIDTH} ${HEIGHT}";

/** Grandes regiões e suas UFs (IBGE). */
export const brRegions: Readonly<Record<BrRegion, readonly BrUfId[]>> = {
${Object.entries(REGIONS).map(([r, l]) => `  ${JSON.stringify(r)}: [${l.map((u) => `"${u}"`).join(", ")}],`).join("\n")}
};

/** As 27 UFs em ordem alfabética do nome. */
export const brUfs: readonly BrUf[] = [
${ufs.map((u) => `  { id: "${u.id}", name: ${JSON.stringify(u.name)}, region: ${JSON.stringify(u.region)}, centroid: [${u.centroid.join(", ")}], bbox: [${u.bbox.join(", ")}], path: "${u.path}" },`).join("\n")}
];
`;
writeFileSync(out, ts);
console.log(`${out}: ${ufs.length} UFs, ${(ts.length / 1024).toFixed(1)} KB, viewBox 0 0 ${WIDTH} ${HEIGHT}`);
