/*
 * Junta regiões de um mapa em grupos, sem as divisas internas: municípios em
 * regiões de venda, UFs em "Sudeste", países em "Mercosul". Roda no navegador,
 * sobre as formas que o mapa já carregou; nenhum dado novo desce.
 *
 * Como funciona: os mapas do DS (geo-br, mundo, municípios) simplificam cada
 * divisa uma vez só e a reaproveitam nos dois lados, com coordenadas inteiras.
 * Então a divisa entre dois membros do mesmo grupo aparece duas vezes, aresta
 * por aresta, e some. As arestas que sobram formam o contorno do grupo, e o
 * fill-rule="evenodd" do mapa desenha os buracos e as ilhas sem pedir sentido.
 * Caminhos só com M, L, H, V e Z (absolutos ou relativos); curva não entra.
 */
import type { GeoRegion } from "../components/geo";

/** Um grupo: o id que os valores usam, o nome que a tela mostra e os ids dos membros. */
export type GeoGroup = { id: string; name?: string; members: readonly string[] };

export type GeoMergeResult = {
  /** Uma região por grupo com algum membro conhecido, na ordem dos grupos. */
  regions: GeoRegion[];
  /** Membros que não são id de nenhuma região, na ordem em que aparecem. */
  unknown: string[];
};

type Point = readonly [number, number];
const pointKey = (p: Point) => `${p[0]},${p[1]}`;

/** Os anéis de um caminho SVG feito de retas. `null` quando o caminho tem curva. */
export function geoPathRings(path: string): Point[][] | null {
  const tokens = path.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const rings: Point[][] = [];
  let ring: Point[] = [];
  let x = 0,
    y = 0,
    sx = 0,
    sy = 0,
    cmd = "";
  const close = () => {
    if (ring.length > 1 && pointKey(ring[0]) === pointKey(ring[ring.length - 1])) ring.pop();
    if (ring.length >= 3) rings.push(ring);
    ring = [];
  };
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "z" || cmd === "Z") {
        close();
        x = sx;
        y = sy;
      }
      continue;
    }
    const n = (k: number) => Number(tokens[i + k]);
    switch (cmd) {
      case "M":
      case "m":
        close();
        x = cmd === "m" ? x + n(0) : n(0);
        y = cmd === "m" ? y + n(1) : n(1);
        sx = x;
        sy = y;
        ring.push([x, y]);
        cmd = cmd === "m" ? "l" : "L"; // pares seguintes são retas
        i += 2;
        break;
      case "L":
      case "l":
        x = cmd === "l" ? x + n(0) : n(0);
        y = cmd === "l" ? y + n(1) : n(1);
        ring.push([x, y]);
        i += 2;
        break;
      case "H":
      case "h":
        x = cmd === "h" ? x + n(0) : n(0);
        ring.push([x, y]);
        i += 1;
        break;
      case "V":
      case "v":
        y = cmd === "v" ? y + n(0) : n(0);
        ring.push([x, y]);
        i += 1;
        break;
      default:
        return null;
    }
  }
  close();
  return rings;
}

const ringArea = (r: readonly Point[]) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const [x0, y0] = r[i];
    const [x1, y1] = r[(i + 1) % r.length];
    s += x0 * y1 - x1 * y0;
  }
  return Math.abs(s / 2);
};

const ringPath = (r: readonly Point[]) => {
  let d = `M${r[0][0]} ${r[0][1]}l`;
  for (let i = 1; i < r.length; i++) {
    const dx = r[i][0] - r[i - 1][0];
    const dy = r[i][1] - r[i - 1][1];
    d += `${i > 1 && dx >= 0 ? " " : ""}${dx}${dy >= 0 ? " " : ""}${dy}`;
  }
  return `${d}z`;
};

/** O contorno da união: as arestas que aparecem um número ímpar de vezes, fechadas em anéis. */
function outline(rings: readonly (readonly Point[])[]) {
  const edges = new Set<string>();
  const points = new Map<string, Point>();
  for (const r of rings)
    for (let i = 0; i < r.length; i++) {
      const a = r[i];
      const b = r[(i + 1) % r.length];
      const ka = pointKey(a);
      const kb = pointKey(b);
      if (ka === kb) continue;
      points.set(ka, a);
      points.set(kb, b);
      const e = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      if (edges.has(e)) edges.delete(e);
      else edges.add(e);
    }
  const next = new Map<string, string[]>();
  for (const e of edges) {
    const [a, b] = e.split("|");
    (next.get(a) ?? next.set(a, []).get(a)!).push(b);
    (next.get(b) ?? next.set(b, []).get(b)!).push(a);
  }
  const used = new Set<string>();
  const take = (a: string, b: string) => used.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  const free = (a: string, b: string) => !used.has(a < b ? `${a}|${b}` : `${b}|${a}`);
  const out: Point[][] = [];
  // Cada ponta tem grau par (cada anel soma 2 e cada par cancelado tira 2): todo passeio fecha.
  for (const [start, outs] of next)
    for (const first of outs) {
      if (!free(start, first)) continue;
      const ring: Point[] = [points.get(start)!];
      let prev = start;
      let at = first;
      take(prev, at);
      while (at !== start) {
        ring.push(points.get(at)!);
        const step = next.get(at)!.find((n) => free(at, n));
        if (!step) break;
        take(at, step);
        prev = at;
        at = step;
      }
      if (ring.length >= 3) out.push(ring);
    }
  return out;
}

/**
 * Junta as regiões de cada grupo numa região só. O rótulo fica no centro do
 * membro mais perto do centro do grupo (pesado pela área), sempre dentro dele;
 * a caixa cobre todos os membros. Uma região fica em um grupo só: a primeira
 * vez que aparece vale.
 */
export function mergeGeoRegions(
  regions: readonly GeoRegion[],
  groups: readonly GeoGroup[],
): GeoMergeResult {
  const byId = new Map(regions.map((r) => [r.id, r]));
  const taken = new Set<string>();
  const unknown: string[] = [];
  const merged: GeoRegion[] = [];
  for (const group of groups) {
    const members: GeoRegion[] = [];
    for (const id of group.members) {
      const region = byId.get(id);
      if (!region) unknown.push(id);
      else if (!taken.has(id)) {
        taken.add(id);
        members.push(region);
      }
    }
    if (!members.length) continue;
    const parts = members.map((m) => ({ m, rings: geoPathRings(m.path) }));
    const straight = parts.every((p) => p.rings);
    const rings = straight ? outline(parts.flatMap((p) => p.rings!)) : [];
    const path = straight ? rings.map(ringPath).join("") : members.map((m) => m.path).join("");
    const weighted = parts.map(({ m, rings: r }) => {
      const c = m.centroid ?? (m.bbox ? [(m.bbox[0] + m.bbox[2]) / 2, (m.bbox[1] + m.bbox[3]) / 2] : null);
      return { c, w: r ? r.reduce((s, ring) => s + ringArea(ring), 0) : 1 };
    });
    const total = weighted.reduce((s, p) => s + (p.c ? p.w : 0), 0);
    const mean = total
      ? weighted.reduce(([sx, sy], p) => (p.c ? [sx + (p.c[0] * p.w) / total, sy + (p.c[1] * p.w) / total] : [sx, sy]), [0, 0])
      : null;
    const centroid = mean
      ? weighted
          .filter((p) => p.c)
          .sort((a, b) => Math.hypot(a.c![0] - mean[0], a.c![1] - mean[1]) - Math.hypot(b.c![0] - mean[0], b.c![1] - mean[1]))[0]?.c
      : undefined;
    const boxes = members.flatMap((m) => (m.bbox ? [m.bbox] : []));
    merged.push({
      id: group.id,
      name: group.name ?? group.id,
      path,
      ...(centroid ? { centroid: [centroid[0], centroid[1]] as const } : {}),
      ...(boxes.length
        ? {
            bbox: [
              Math.min(...boxes.map((b) => b[0])),
              Math.min(...boxes.map((b) => b[1])),
              Math.max(...boxes.map((b) => b[2])),
              Math.max(...boxes.map((b) => b[3])),
            ] as const,
          }
        : {}),
    });
  }
  return { regions: merged, unknown };
}
