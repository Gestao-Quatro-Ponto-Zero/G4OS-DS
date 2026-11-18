/*
 * Núcleo dos geradores de mapas (build-geo-world.mjs, build-geo-br-municipios.mjs):
 * projeta, simplifica sem frestas e escreve caminhos SVG com coordenadas inteiras.
 *
 * As divisas entre vizinhos são simplificadas uma vez só (Douglas–Peucker por
 * trecho entre junções, numa orientação canônica) e reaproveitadas pelos dois
 * lados, então o mapa não abre frestas. Node puro, sem dependências.
 */

export const polysOf = (geometry) => (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates);

/** Projeção equirretangular com a correção do cosseno da latitude média (recortes de um país). */
export function equirectangular(features, width, pad) {
  let lon0 = Infinity, lon1 = -Infinity, lat0 = Infinity, lat1 = -Infinity;
  for (const f of features) for (const p of polysOf(f.geometry)) for (const r of p) for (const [x, y] of r) {
    lon0 = Math.min(lon0, x); lon1 = Math.max(lon1, x); lat0 = Math.min(lat0, y); lat1 = Math.max(lat1, y);
  }
  const k = Math.cos((((lat0 + lat1) / 2) * Math.PI) / 180);
  const scale = (width - pad * 2) / ((lon1 - lon0) * k);
  return {
    height: Math.ceil((lat1 - lat0) * scale + pad * 2),
    project: ([x, y]) => [pad + (x - lon0) * k * scale, pad + (lat1 - y) * scale],
  };
}

/** Equal Earth (Šavrič, Patterson e Jenny, 2018): área fiel, boa para o mundo inteiro. */
export function equalEarthRaw(lon, lat) {
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
  const l = (lon * Math.PI) / 180;
  const t = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = t * t, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, -y];
}

const key = (p) => `${p[0]},${p[1]}`;

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
  let prev = pts[0];
  let body = "";
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - prev[0], dy = pts[i][1] - prev[1];
    body += `${body && dx >= 0 ? " " : ""}${dx}${dy >= 0 ? " " : ""}${dy}`;
    prev = pts[i];
  }
  return `M${pts[0][0]} ${pts[0][1]}l${body}z`;
};

/**
 * Formas desenháveis de cada feição: `{ path, centroid, bbox }`, na ordem de
 * `features`. `project` leva [lon, lat] ao viewBox; `tolerance` é a do
 * Douglas–Peucker em unidades do viewBox; ilhas menores que `minIsland`
 * (unidades²) somem, menos a maior parte de cada feição. `bbox` e `centroid`
 * vêm da maior parte (a França sem a Guiana, os EUA sem o Alasca): servem ao
 * zoom, ao rótulo e ao alvo de toque.
 */
export function shapes(features, { project, tolerance, minIsland }) {
  const neighbors = new Map();
  const addN = (a, b) => {
    const ka = key(a);
    if (!neighbors.has(ka)) neighbors.set(ka, new Set());
    neighbors.get(ka).add(key(b));
  };
  for (const f of features) for (const p of polysOf(f.geometry)) for (const r of p) {
    const ring = r.slice(0, -1);
    for (let i = 0; i < ring.length; i++) {
      addN(ring[i], ring[(i + 1) % ring.length]);
      addN(ring[i], ring[(i - 1 + ring.length) % ring.length]);
    }
  }
  const isJunction = (p) => (neighbors.get(key(p))?.size ?? 0) > 2;

  const arcCache = new Map();
  const simplifyArc = (arc) => {
    const fwd = arc.map(key).join(";");
    const rev = [...arc].reverse().map(key).join(";");
    const canon = fwd < rev ? fwd : rev;
    if (!arcCache.has(canon)) arcCache.set(canon, dp((fwd < rev ? arc : [...arc].reverse()).map(project), tolerance));
    const s = arcCache.get(canon);
    return fwd < rev ? s : [...s].reverse();
  };
  const simplifyRing = (ring) => {
    const fixed = [];
    for (let i = 0; i < ring.length; i++) if (isJunction(ring[i])) fixed.push(i);
    if (!fixed.length) fixed.push(0, Math.floor(ring.length / 2)); // ilha: dois pontos opostos
    const out = [];
    for (let j = 0; j < fixed.length; j++) {
      const a = fixed[j], b = fixed[(j + 1) % fixed.length];
      const arc = [];
      for (let i = a; ; i = (i + 1) % ring.length) {
        arc.push(ring[i]);
        if (i === b && arc.length > 1) break;
      }
      out.push(...simplifyArc(arc).slice(0, -1));
    }
    return out;
  };

  return features.map((f) => {
    const polys = polysOf(f.geometry)
      .map((p) => p.map((r) => round(simplifyRing(r.slice(0, -1)))).filter((r) => r.length >= 3))
      .filter((p) => p.length)
      .map((p) => ({ rings: p, area: Math.abs(area(p[0])) }))
      .sort((a, b) => b.area - a.area);
    // Ilha ou país pequeno demais para o arredondamento (Malta, Singapura): um
    // quadrado de 1 unidade no centro da maior parte. O mapa põe um alvo de toque nele.
    if (!polys.length) {
      const biggest = polysOf(f.geometry)
        .map((p) => p[0].map(project))
        .sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0];
      const [cx, cy] = biggest.reduce(([sx, sy], [x, y]) => [sx + x / biggest.length, sy + y / biggest.length], [0, 0]).map(Math.round);
      polys.push({ rings: [[[cx, cy], [cx + 1, cy], [cx + 1, cy + 1], [cx, cy + 1]]], area: 1 });
    }
    const kept = polys.filter((p, i) => i === 0 || p.area >= minIsland);
    const main = kept[0].rings[0];
    const xs = main.map((q) => q[0]), ys = main.map((q) => q[1]);
    const c = centroidOf(main);
    return {
      path: kept.flatMap((p) => p.rings.map(ringPath)).join(""),
      centroid: [Math.round(c[0]), Math.round(c[1])],
      bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    };
  });
}
