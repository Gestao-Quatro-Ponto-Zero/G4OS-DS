"use client";

/*
 * Mapas coropléticos (região pintada pela intensidade de um número):
 *   · ChoroplethMap: mapa em SVG com escala em degraus, legenda que destaca
 *     a faixa, tooltip, seleção com zoom e navegação por setas
 *   · RankedRegionList: a mesma informação como lista ordenada, ligada ao
 *     mapa pelo mesmo realce (área grande engana: o mapa nunca vai sozinho)
 *   · choroplethScale: a escala compartilhada pelos dois
 * Padrão: as 27 UFs (`brUfs` de lib/geo-br). Outros mapas: passe `regions`
 * e `viewBox`. Ver docs/fundamentos/dados.md.
 */

import { ArrowLeft } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { brUfs, brViewBox } from "../lib/geo-br";
import { useReducedMotion } from "../lib/motion";
import { divergingColor, scaleExtent, onScaleInk, quantizeScale, sequentialColor, type ScaleTone } from "../lib/scale";
import { ChartTooltipContent, SrTable } from "./charts";
import { ScaleLegend, useLinkedHighlight, type LinkedHighlight } from "./charts-kit";
import { Button } from "./primitives";

/* ------------------------------------------------------------------ */
/* Tipos e escala                                                      */
/* ------------------------------------------------------------------ */

/** Uma região desenhável: contorno SVG no sistema do `viewBox`. */
export type GeoRegion = {
  id: string;
  name: string;
  /** Caminho SVG; várias partes (ilhas) são desenhadas com fill-rule="evenodd". */
  path: string;
  /** Ponto do rótulo e do tooltip. Sem ele, o centro da `bbox`. */
  centroid?: readonly [number, number];
  /** [x0, y0, x1, y1]: usada no zoom, nos rótulos e no alvo mínimo de toque. */
  bbox?: readonly [number, number, number, number];
};

/** Valores por id de região; `null` = sem dado (hachura). */
export type GeoValues = Record<string, number | null | undefined>;

export type ChoroplethScaleOptions = {
  /** Quantidade de degraus (padrão 5; divergente arredonda para par, padrão 6). */
  steps?: number;
  /** Domínio fixo. Padrão: mínimo e máximo dos valores (divergente: simétrico em zero). */
  domain?: [number, number];
  /** `sequential` (uma cor, de claro a forte) ou `diverging` (abaixo × acima de zero). */
  scheme?: "sequential" | "diverging";
  /** Cor da escala sequencial. */
  tone?: ScaleTone;
  /**
   * Como cortar os degraus (sequencial): `equal` = faixas do mesmo tamanho;
   * `quantile` = mesma quantidade de regiões por faixa, com limites
   * arredondados. Use `quantile` quando um valor domina (SP na receita):
   * se o topo ainda juntar valores muito distantes (o maior ≥ 3× o início do
   * último degrau), o último degrau começa na média do topo.
   */
  breaks?: "equal" | "quantile";
};

/** Escala pronta: degraus, cor de cada valor e dados para a legenda. */
export type ChoroplethScale = {
  scheme: "sequential" | "diverging";
  tone: ScaleTone;
  /** Limites inferiores dos degraus (para `ScaleLegend`). */
  thresholds: number[];
  /** Fim do último degrau. */
  max: number;
  /** Degrau de um valor. */
  bin: (v: number) => number;
  /** Cor do valor (null para sem dado). */
  color: (v: number | null | undefined) => string | null;
  /** Intensidade 0–1 (para escolher a cor do texto com `onScaleInk`). */
  level: (v: number) => number;
};

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Arredonda para 2 algarismos significativos (limites legíveis: 120 mil, 1,5 mi). */
function roundNice(v: number, mode: "down" | "up" | "near") {
  if (v === 0 || !Number.isFinite(v)) return 0;
  const mag = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 1);
  const f = mode === "down" ? Math.floor : mode === "up" ? Math.ceil : Math.round;
  return f(v / mag) * mag;
}

/**
 * Escala em degraus de um mapa coroplético. A mesma instância pinta o mapa,
 * a legenda e a lista ordenada, então as três cores batem.
 */
export function choroplethScale(values: GeoValues, { steps, domain, scheme = "sequential", tone = "ink", breaks = "equal" }: ChoroplethScaleOptions = {}): ChoroplethScale {
  const nums = Object.values(values).filter(isNum);
  if (scheme === "diverging") {
    const [lo, hi] = domain ?? scaleExtent(nums);
    const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
    const half = Math.max(1, Math.ceil((steps ?? 6) / 2));
    const q = quantizeScale([0, m], half);
    const step = q.thresholds[1] - q.thresholds[0] || m / half;
    const top = step * half;
    const n = half * 2;
    const thresholds = Array.from({ length: n }, (_, i) => -top + i * step);
    const bin = (v: number) => Math.max(0, Math.min(n - 1, Math.floor((v + top) / step)));
    const mid = (v: number) => (thresholds[bin(v)] + step / 2) / top;
    return {
      scheme,
      tone,
      thresholds,
      max: top,
      bin,
      color: (v) => (isNum(v) ? divergingColor(mid(v)) : null),
      level: (v) => Math.abs(mid(v)),
    };
  }
  if (breaks === "quantile" && nums.length > 1) {
    const sorted = [...nums].sort((a, b) => a - b);
    const n = Math.max(2, Math.round(steps ?? 5));
    const quantileCuts = (k: number) => {
      const out: number[] = [roundNice(sorted[0], "down")];
      for (let i = 1; i < k; i++) {
        const c = roundNice(sorted[Math.min(sorted.length - 1, Math.floor((i / k) * sorted.length))], "near");
        if (c > out[out.length - 1]) out.push(c);
      }
      return out;
    };
    let cuts = quantileCuts(n);
    // Cauda alta: quando o último degrau junta valores muito diferentes (SP com
    // 6× a receita de SC), ele vira cabeça × cauda: n − 1 degraus por quantil e
    // o último começa na média do topo, para o maior não ter o tom do sexto.
    const top = sorted.filter((v) => v >= cuts[cuts.length - 1]);
    if (n >= 3 && top.length > 1 && top[top.length - 1] >= 3 * cuts[cuts.length - 1]) {
      const head = quantileCuts(n - 1);
      const rest = sorted.filter((v) => v >= head[head.length - 1]);
      const mean = roundNice(rest.reduce((a, v) => a + v, 0) / rest.length, "near");
      if (mean > head[head.length - 1] && mean <= rest[rest.length - 1]) cuts = [...head, mean];
    }
    const bin = (v: number) => {
      let b = 0;
      for (let i = 0; i < cuts.length; i++) if (v >= cuts[i]) b = i;
      return b;
    };
    const level = (v: number) => (cuts.length === 1 ? 1 : bin(v) / (cuts.length - 1));
    return {
      scheme,
      tone,
      thresholds: cuts,
      max: roundNice(sorted[sorted.length - 1], "up"),
      bin,
      color: (v) => (isNum(v) ? sequentialColor(level(v), tone) : null),
      level,
    };
  }
  const q = quantizeScale(domain ?? scaleExtent(nums), steps ?? 5);
  return {
    scheme,
    tone,
    thresholds: q.thresholds,
    max: q.domain[1],
    bin: q.bin,
    color: (v) => (isNum(v) ? sequentialColor(q.level(v), tone) : null),
    level: q.level,
  };
}

/**
 * viewBox que enquadra um conjunto de regiões (recorte por grande região,
 * só os estados com dado). `pad` é a folga em fração do lado maior.
 */
export function fitGeoViewBox(regions: readonly GeoRegion[], pad = 0.04) {
  const boxes = regions.flatMap((r) => (r.bbox ? [r.bbox] : []));
  if (!boxes.length) return brViewBox;
  const x0 = Math.min(...boxes.map((b) => b[0]));
  const y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[2]));
  const y1 = Math.max(...boxes.map((b) => b[3]));
  const p = Math.max(x1 - x0, y1 - y0) * pad;
  return [x0 - p, y0 - p, x1 - x0 + p * 2, y1 - y0 + p * 2].map(Math.round).join(" ");
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

type Box = [number, number, number, number]; // x, y, w, h

const parseViewBox = (vb: string): Box => {
  const [x, y, w, h] = vb.split(/[\s,]+/).map(Number);
  return [x || 0, y || 0, w || 1000, h || 1000];
};

const centerOf = (r: GeoRegion, fallback: Box): [number, number] =>
  r.centroid ? [r.centroid[0], r.centroid[1]] : r.bbox ? [(r.bbox[0] + r.bbox[2]) / 2, (r.bbox[1] + r.bbox[3]) / 2] : [fallback[0] + fallback[2] / 2, fallback[1] + fallback[3] / 2];

/** Próxima região na direção da seta (a mais perto num cone à frente). */
function neighborIn(regions: readonly GeoRegion[], fromId: string, dir: "left" | "right" | "up" | "down", base: Box) {
  const from = regions.find((r) => r.id === fromId);
  if (!from) return null;
  const [fx, fy] = centerOf(from, base);
  const [ux, uy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best: string | null = null;
  let score = Infinity;
  for (const r of regions) {
    if (r.id === fromId) continue;
    const [x, y] = centerOf(r, base);
    const along = (x - fx) * ux + (y - fy) * uy;
    if (along <= 1) continue;
    const across = Math.abs((x - fx) * uy - (y - fy) * ux);
    const s = along + across * 2.2;
    if (s < score) {
      score = s;
      best = r.id;
    }
  }
  return best;
}

/** Tamanho observado (largura e altura) do contêiner. */
function useBoxSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize([el.clientWidth, el.clientHeight]);
    const ro = new ResizeObserver(([e]) => setSize([Math.round(e.contentRect.width), Math.round(e.contentRect.height)]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** viewBox animado até o alvo (transição curta; movimento reduzido vai direto). */
function useAnimatedBox(target: Box) {
  const reduced = useReducedMotion();
  const [box, setBox] = useState<Box>(target);
  const current = useRef<Box>(target);
  const key = target.join(",");
  useEffect(() => {
    const from = current.current;
    const to = key.split(",").map(Number) as Box;
    if (reduced || from.join(",") === key) {
      current.current = to;
      setBox(to);
      return;
    }
    const start = performance.now();
    const ms = 380;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - (1 - t) ** 3;
      const b = from.map((v, i) => v + (to[i] - v) * e) as Box;
      current.current = b;
      setBox(b);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, reduced]);
  return box;
}

/* ------------------------------------------------------------------ */
/* ChoroplethMap                                                       */
/* ------------------------------------------------------------------ */

export type ChoroplethMapProps = {
  /** Nome acessível do mapa ("Receita por estado em outubro de 2026"). Obrigatório. */
  label: string;
  /** Valor por id de região. Ausente ou `null` = sem dado (hachura e "—"). */
  values: GeoValues;
  /** Regiões desenháveis. Padrão: as 27 UFs (`brUfs`). */
  regions?: readonly GeoRegion[];
  /** viewBox das regiões. Padrão: `brViewBox`. */
  viewBox?: string;
  /** Escala em degraus (sequencial ou divergente). */
  scale?: ChoroplethScaleOptions;
  format?: (n: number) => string;
  /** Nome do número no tooltip e na tabela ("Receita"). */
  valueLabel?: string;
  /** Cabeçalho da coluna de regiões na tabela de leitor de tela. */
  regionLabel?: string;
  /** Região selecionada (controlado). As outras esmaecem. */
  selected?: string | null;
  /** Clique ou Enter numa região (de novo na mesma solta: `null`). */
  onSelect?: (id: string | null) => void;
  /** Realce compartilhado com outra vista (`useLinkedHighlight`): substitui `selected`/`onSelect`. */
  highlight?: LinkedHighlight<string>;
  /** Aproxima o mapa da região (anima o viewBox). `null` volta ao mapa inteiro. */
  zoomTo?: string | null;
  /** Ação do botão de voltar que aparece com zoom. Padrão: solta a seleção. */
  onZoomOut?: () => void;
  zoomOutLabel?: string;
  /** Legenda em degraus acima do mapa, com o fim da escala (passar o mouse destaca a faixa). */
  legend?: boolean;
  legendTitle?: ReactNode;
  /** Formato curto dos limites da legenda (padrão: `format`). Ex.: `formatCompact` para dinheiro. */
  formatLegend?: (n: number) => string;
  /** Sigla sobre as regiões que cabem (padrão: sim). */
  showLabels?: boolean;
  /** Altura em px. Padrão: proporção do viewBox, até `maxHeight`. */
  height?: number;
  /** Teto da altura automática (recortes altos, como o Nordeste). */
  maxHeight?: number;
  className?: string;
};

/**
 * Mapa coroplético (padrão: Brasil por UF). Escala em degraus, sem dado em
 * hachura, tooltip com nome e valor, seleção com zoom e "Voltar". Teclado:
 * Tab entra no mapa, setas andam para a UF vizinha naquela direção,
 * Enter seleciona, Esc solta. Sempre com a lista ordenada ao lado
 * (`RankedRegionList`): área grande engana.
 */
export function ChoroplethMap({
  label,
  values,
  regions = brUfs,
  viewBox = brViewBox,
  scale: scaleOptions,
  format = (n) => formatNumber(n),
  valueLabel = "Valor",
  regionLabel = "UF",
  selected,
  onSelect,
  highlight,
  zoomTo = null,
  onZoomOut,
  zoomOutLabel = "Voltar ao Brasil",
  legend = true,
  legendTitle,
  formatLegend,
  showLabels = true,
  height,
  maxHeight = 640,
  className,
}: ChoroplethMapProps) {
  const own = useLinkedHighlight<string>({ pinned: selected, onPinnedChange: onSelect });
  const hl = highlight ?? own;
  const scale = useMemo(() => choroplethScale(values, scaleOptions), [values, scaleOptions]);
  const base = useMemo(() => parseViewBox(viewBox), [viewBox]);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hatchId = `ds-hatch-${uid}`;
  const [boxRef, [W, H]] = useBoxSize<HTMLDivElement>();
  const refs = useRef(new Map<string, SVGPathElement>());
  const [legendBin, setLegendBin] = useState<number | null>(null);
  const [tabStop, setTabStop] = useState<string | null>(null);

  const zoomRegion = zoomTo ? regions.find((r) => r.id === zoomTo) : undefined;
  const target = useMemo<Box>(() => {
    if (!zoomRegion?.bbox) return base;
    const [x0, y0, x1, y1] = zoomRegion.bbox;
    const aspect = W && H ? W / H : base[2] / base[3];
    const tw = Math.max(x1 - x0, (y1 - y0) * aspect, base[2] * 0.14) * 1.5;
    const th = tw / aspect;
    return [(x0 + x1) / 2 - tw / 2, (y0 + y1) / 2 - th / 2, tw, th];
  }, [zoomRegion, base, W, H]);
  const vb = useAnimatedBox(target);
  const s = W && H ? Math.min(W / vb[2], H / vb[3]) : 0; // px por unidade
  const ox = W ? (W - vb[2] * s) / 2 : 0;
  const oy = H ? (H - vb[3] * s) / 2 : 0;
  const zoomFactor = base[2] / vb[2];

  const valueText = (id: string) => (isNum(values[id]) ? format(values[id] as number) : "Sem dado");
  const dimmed = (id: string) => {
    if (legendBin != null) {
      const v = values[id];
      return !isNum(v) || scale.bin(v) !== legendBin;
    }
    return hl.isDimmed(id);
  };
  const stop = tabStop ?? hl.pinned ?? regions[0]?.id ?? null;
  const active = hl.active ? regions.find((r) => r.id === hl.active) : undefined;
  const activeValue = active ? values[active.id] : null;

  const move = (e: KeyboardEvent, id: string) => {
    const dirs: Record<string, "left" | "right" | "up" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
    let next: string | null = null;
    if (e.key in dirs) next = neighborIn(regions, id, dirs[e.key], base);
    else if (e.key === "Home") next = regions[0]?.id ?? null;
    else if (e.key === "End") next = regions[regions.length - 1]?.id ?? null;
    else return false;
    e.preventDefault();
    if (next) {
      setTabStop(next);
      refs.current.get(next)?.focus();
    }
    return true;
  };

  // Tooltip: centróide da região ativa em pixels do contêiner.
  let tip: { x: number; y: number; below: boolean } | null = null;
  if (active && s && active.id !== zoomTo) {
    const [cx, cy] = centerOf(active, base);
    const x = ox + (cx - vb[0]) * s;
    const y = oy + (cy - vb[1]) * s;
    tip = { x: Math.max(84, Math.min(W - 84, x)), y, below: y < 80 };
  }

  const srRows = useMemo(() => [...regions].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((r) => ({ [regionLabel]: r.name, v: values[r.id] ?? null })), [regions, values, regionLabel]);
  const minTarget = 14; // px: abaixo disso a região ganha um círculo de toque

  const legendFormat = formatLegend ?? format;
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {/* Legenda colada ao topo do mapa, com o fim do último degrau (a escala fecha). */}
      {legend ? (
        <div className="flex min-w-0 flex-wrap items-end gap-x-1.5 gap-y-1">
          <ScaleLegend
            thresholds={scale.thresholds}
            max={scale.max}
            scheme={scale.scheme}
            tone={scale.tone}
            format={legendFormat}
            title={legendTitle ?? valueLabel}
            activeBin={legendBin ?? (isNum(activeValue) ? scale.bin(activeValue) : null)}
            onHoverBin={setLegendBin}
            className="min-w-0"
          />
          <span className="whitespace-nowrap text-[11px] tabular-nums text-muted">{legendFormat(scale.max)}</span>
        </div>
      ) : null}
      <div ref={boxRef} className="relative w-full" style={height ? { height } : { aspectRatio: `${base[2]} / ${base[3]}`, maxHeight: maxHeight }}>
        <svg viewBox={vb.join(" ")} preserveAspectRatio="xMidYMid meet" role="group" aria-label={label} className="block h-full w-full overflow-hidden">
          <defs>
            <pattern id={hatchId} width={6 / zoomFactor} height={6 / zoomFactor} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={6 / zoomFactor} height={6 / zoomFactor} fill="var(--color-soft)" />
              <line x1={0} y1={0} x2={0} y2={6 / zoomFactor} stroke="var(--color-line-strong)" strokeWidth={1.5 / zoomFactor} />
            </pattern>
          </defs>
          {/* Contorno do país em line (UFs claras não somem no fundo): o traço largo
              fica por baixo e o preenchimento em surface cobre a metade de dentro. */}
          <g aria-hidden pointerEvents="none">
            {regions.map((r) => (
              <path key={`o-${r.id}`} d={r.path} fill="none" stroke="var(--color-line)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
            {regions.map((r) => (
              <path key={`b-${r.id}`} d={r.path} fill="var(--color-surface)" fillRule="evenodd" />
            ))}
          </g>
          {regions.map((r) => {
            const v = values[r.id];
            const fill = scale.color(v) ?? `url(#${hatchId})`;
            const b = hl.bind(r.id);
            return (
              <path
                key={r.id}
                ref={(el) => {
                  if (el) refs.current.set(r.id, el);
                  else refs.current.delete(r.id);
                }}
                d={r.path}
                fill={fill}
                fillRule="evenodd"
                stroke="var(--color-surface)"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={r.id === stop ? 0 : -1}
                aria-label={`${r.name}: ${valueText(r.id)}`}
                aria-pressed={hl.pinned === r.id}
                {...b}
                onFocus={() => {
                  setTabStop(r.id);
                  b.onFocus();
                }}
                onKeyDown={(e) => {
                  if (!move(e, r.id)) b.onKeyDown(e);
                }}
                // g4os-ds-disable-next-line outline-none -- o foco aparece como contorno em ink desenhado sobre a região ativa
                className="cursor-pointer outline-none transition-opacity duration-150 motion-reduce:transition-none"
                style={{ opacity: dimmed(r.id) ? 0.4 : 1 }}
              />
            );
          })}
          {/* Alvo mínimo de toque (DF, ilhas pequenas): círculo sobre o centróide. */}
          {s > 0 &&
            regions.map((r) => {
              if (!r.bbox) return null;
              const w = (r.bbox[2] - r.bbox[0]) * s;
              const h = (r.bbox[3] - r.bbox[1]) * s;
              if (Math.min(w, h) >= minTarget) return null;
              const [cx, cy] = centerOf(r, base);
              const b = hl.bind(r.id);
              const on = hl.active === r.id;
              // Marcador com a cor da própria UF (sobre surface, igual à legenda),
              // contorno em line-strong e a sigla ao lado: lê como "aqui é o DF".
              return (
                <g
                  key={`t-${r.id}`}
                  aria-hidden
                  onMouseEnter={b.onMouseEnter}
                  onMouseLeave={b.onMouseLeave}
                  onClick={b.onClick}
                  className="cursor-pointer transition-opacity duration-150 motion-reduce:transition-none"
                  style={{ opacity: dimmed(r.id) ? 0.4 : 1 }}
                >
                  <circle cx={cx} cy={cy} r={6 / s} fill="var(--color-surface)" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6 / s}
                    fill={scale.color(values[r.id]) ?? `url(#${hatchId})`}
                    stroke={on ? "var(--color-ink)" : "var(--color-line-strong)"}
                    strokeWidth={on ? 1.75 : 1}
                    vectorEffect="non-scaling-stroke"
                  />
                  {showLabels ? (
                    <text
                      x={cx + 9 / s}
                      y={cy}
                      dy="0.35em"
                      fontSize={10 / s}
                      fontWeight={600}
                      fill="var(--color-ink)"
                      stroke="var(--color-surface)"
                      strokeWidth={3 / s}
                      strokeLinejoin="round"
                      paintOrder="stroke"
                      className="pointer-events-none select-none"
                    >
                      {r.id}
                    </text>
                  ) : null}
                </g>
              );
            })}
          {showLabels && s > 0 && (
            <g aria-hidden className="pointer-events-none select-none">
              {regions.map((r) => {
                if (!r.bbox) return null;
                const w = (r.bbox[2] - r.bbox[0]) * s;
                const h = (r.bbox[3] - r.bbox[1]) * s;
                if (w < 30 || h < 20) return null;
                const [cx, cy] = centerOf(r, base);
                const v = values[r.id];
                return (
                  <text
                    key={r.id}
                    x={cx}
                    y={cy}
                    dy="0.35em"
                    textAnchor="middle"
                    fontSize={10 / s}
                    fontWeight={500}
                    fill={isNum(v) ? onScaleInk(scale.level(v)) : "var(--color-muted)"}
                    style={{ opacity: dimmed(r.id) ? 0.4 : 0.85 }}
                  >
                    {r.id}
                  </text>
                );
              })}
            </g>
          )}
          {active && (
            <path d={active.path} fill="none" fillRule="evenodd" stroke="var(--color-ink)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" pointerEvents="none" />
          )}
        </svg>
        {zoomTo ? (
          <Button size="sm" variant="ghost" className="absolute left-0 top-0" onClick={onZoomOut ?? (() => hl.setPinned(null))}>
            <ArrowLeft aria-hidden /> {zoomOutLabel}
          </Button>
        ) : null}
        {tip && active ? (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 w-max max-w-[240px]"
            style={{ left: tip.x, top: tip.y, transform: tip.below ? "translate(-50%, 14px)" : "translate(-50%, calc(-100% - 14px))" }}
          >
            <ChartTooltipContent
              label={active.name}
              items={[{ label: valueLabel, value: isNum(activeValue) ? format(activeValue) : "Sem dado", color: scale.color(activeValue) ?? "var(--color-soft)" }]}
            />
          </div>
        ) : null}
      </div>
      <SrTable label={label} data={srRows} index={regionLabel} series={[{ key: "v", label: valueLabel }]} format={format} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RankedRegionList                                                    */
/* ------------------------------------------------------------------ */

export type RankedRegionListProps = {
  /** Nome acessível da lista ("Receita por estado, do maior ao menor"). */
  label: string;
  values: GeoValues;
  /** Regiões (para os nomes). Padrão: as 27 UFs. */
  regions?: readonly GeoRegion[];
  /** Mesma escala do mapa (o quadradinho de cor bate com a região). */
  scale?: ChoroplethScaleOptions;
  format?: (n: number) => string;
  /** Realce compartilhado com o mapa (`useLinkedHighlight`). */
  highlight?: LinkedHighlight<string>;
  /** Mostra as primeiras N e um botão "Ver todas". */
  limit?: number;
  /** Detalhe curto à direita do nome ("128 clientes"). */
  hint?: (id: string) => ReactNode;
  className?: string;
};

/**
 * Lista ordenada (posição, nome, barra proporcional, valor) que acompanha um
 * `ChoroplethMap`: passar o mouse ou focar uma linha acende a região no mapa
 * e vice-versa; clique ou Enter seleciona. Setas sobem e descem.
 */
export function RankedRegionList({ label, values, regions = brUfs, scale: scaleOptions, format = (n) => formatNumber(n), highlight, limit, hint, className }: RankedRegionListProps) {
  const own = useLinkedHighlight<string>();
  const hl = highlight ?? own;
  const scale = useMemo(() => choroplethScale(values, scaleOptions), [values, scaleOptions]);
  const [all, setAll] = useState(false);
  const [tabStop, setTabStop] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const rows = useMemo(() => {
    const withValue = regions.filter((r) => isNum(values[r.id])).sort((a, b) => (values[b.id] as number) - (values[a.id] as number));
    const without = regions.filter((r) => !isNum(values[r.id])).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return [...withValue, ...without];
  }, [regions, values]);
  // A selecionada aparece mesmo fora do limite.
  const cut = limit && !all ? rows.slice(0, limit) : rows;
  const pinnedOut = hl.pinned && !cut.some((r) => r.id === hl.pinned) ? rows.find((r) => r.id === hl.pinned) : undefined;
  const shown = pinnedOut ? [...cut, pinnedOut] : cut;
  const maxAbs = Math.max(1e-9, ...rows.map((r) => Math.abs((values[r.id] as number) ?? 0)).filter(Number.isFinite));
  const stop = tabStop ?? hl.pinned ?? shown[0]?.id ?? null;

  const onKey = (e: KeyboardEvent, i: number) => {
    const to = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? shown.length - 1 : null;
    if (to == null) return false;
    e.preventDefault();
    const next = shown[Math.max(0, Math.min(shown.length - 1, to))];
    if (next) {
      setTabStop(next.id);
      refs.current.get(next.id)?.focus();
    }
    return true;
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <ol aria-label={label} className="m-0 flex list-none flex-col p-0">
        {shown.map((r, i) => {
          const v = values[r.id];
          const has = isNum(v);
          const pos = rows.indexOf(r) + 1;
          const b = hl.bind(r.id);
          const isActive = hl.active === r.id;
          const bar = has ? (scale.scheme === "diverging" ? sequentialColor(0.8, v >= 0 ? "pos" : "neg") : sequentialColor(0.8, scale.tone)) : undefined;
          return (
            <li key={r.id}>
              <button
                ref={(el) => {
                  if (el) refs.current.set(r.id, el);
                  else refs.current.delete(r.id);
                }}
                type="button"
                tabIndex={r.id === stop ? 0 : -1}
                aria-pressed={hl.pinned === r.id}
                aria-label={`${pos}º ${r.name}: ${has ? format(v) : "sem dado"}`}
                {...b}
                onFocus={() => {
                  setTabStop(r.id);
                  b.onFocus();
                }}
                onKeyDown={(e) => {
                  if (!onKey(e, i)) b.onKeyDown(e);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none transition-[background-color,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-muted/40 motion-reduce:transition-none",
                  isActive ? "bg-soft" : "hover:bg-soft/60",
                  hl.pinned === r.id && "ring-1 ring-line-strong",
                  hl.isDimmed(r.id) && hl.pinned != null && "opacity-60",
                )}
              >
                <span aria-hidden className="w-5 shrink-0 text-right text-[12px] tabular-nums text-muted">
                  {has ? pos : "—"}
                </span>
                <span aria-hidden className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-line" style={{ background: scale.color(v) ?? "var(--color-soft)" }} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[13px] text-ink">{r.name}</span>
                    {hint ? <span className="truncate text-[12px] text-muted">{hint(r.id)}</span> : null}
                  </span>
                  <span aria-hidden className="block h-1 w-full rounded-full bg-soft">
                    {has ? <span className="block h-1 rounded-full" style={{ width: `${Math.max(2, (Math.abs(v) / maxAbs) * 100)}%`, background: bar }} /> : null}
                  </span>
                </span>
                <span className={cn("w-20 shrink-0 text-right text-[13px] tabular-nums", has ? "font-medium text-ink" : "text-muted")}>{has ? format(v) : "—"}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {limit && rows.length > limit ? (
        <Button variant="quiet" size="sm" className="self-start" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? "Mostrar menos" : `Ver todas (${formatNumber(rows.length)})`}
        </Button>
      ) : null}
    </div>
  );
}
