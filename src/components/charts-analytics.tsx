"use client";

/*
 * Gráficos analíticos de série temporal:
 *   · ConnectedScatter: duas medidas ao longo do tempo (CAC × LTV, preço ×
 *     volume). Pontos em ordem do tempo ligados por um caminho com setas de
 *     direção, cabeça no mês atual, linha de razão (y = k·x) com zona saudável
 *     e controle de tempo embaixo.
 *   · HorizonChart: muitas séries diárias contra a própria base, cada uma numa
 *     faixa baixa dobrada em N camadas (acima em chart-pos, abaixo em
 *     chart-neg; cor mais forte = mais longe da base), com cruz sincronizada.
 *   · HorizonLegend: como ler as faixas.
 *
 * Regras (docs/fundamentos/dados.md): nada anima na entrada; troca de série e
 * de faixas transiciona curto (movimento reduzido = troca direta); valor exato
 * por teclado e tabela para leitor de tela.
 */

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";
import { formatDelta, formatNumber, formatPercent } from "../lib/format";
import { useReducedMotion } from "../lib/motion";
import { sequentialColor } from "../lib/scale";
import { ChartTooltip, niceRange, useElementWidth } from "./charts";
import { ChartScrubber } from "./charts-kit";

/* ------------------------------------------------------------------ */
/* Utilidades internas                                                 */
/* ------------------------------------------------------------------ */

/**
 * Interpola uma lista de números quando ela muda (não na montagem). Com
 * movimento reduzido devolve o alvo direto.
 */
function useTween(target: number[], ms: number) {
  const reduced = useReducedMotion();
  const sig = target.join(",");
  const shown = useRef(target);
  const lastSig = useRef(sig);
  const [frame, setFrame] = useState<number[] | null>(null);
  // Entre o render com o alvo novo e o primeiro quadro: continua mostrando o atual.
  const pending = sig !== lastSig.current && !reduced && shown.current.length > 0;
  useEffect(() => {
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    const from = shown.current;
    if (reduced || !from.length) {
      shown.current = target;
      setFrame(null);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - t) ** 3;
      const cur = target.map((v, i) => {
        const f = from[i] ?? from[from.length - 1] ?? v;
        return f + (v - f) * e;
      });
      shown.current = cur;
      if (t < 1) {
        setFrame(cur);
        raf = requestAnimationFrame(tick);
      } else setFrame(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `sig` resume `target`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, reduced, ms]);
  if (!pending && !frame) shown.current = target;
  return pending ? shown.current : (frame ?? target);
}

/** Índice controlado ou não, com callback. */
function useIndex<T>(value: T | undefined, initial: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState<T>(initial);
  const current = value !== undefined ? value : inner;
  const set = (v: T) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  return [current, set] as const;
}

type Pt = [number, number];

/** Segmentos de Bézier por Catmull-Rom (passa por todos os pontos, sem cantos). */
function smoothSegments(pts: Pt[], smooth: boolean) {
  const segs: { d: string; mid: Pt; angle: number; len: number }[] = [];
  const k = smooth ? 0.9 : 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
    const mid: Pt = [(p1[0] + 3 * c1[0] + 3 * c2[0] + p2[0]) / 8, (p1[1] + 3 * c1[1] + 3 * c2[1] + p2[1]) / 8];
    const tx = p2[0] + c2[0] - c1[0] - p1[0];
    const ty = p2[1] + c2[1] - c1[1] - p1[1];
    segs.push({
      d: smooth ? `C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}` : `L${p2[0]},${p2[1]}`,
      mid,
      angle: (Math.atan2(ty || p2[1] - p1[1], tx || p2[0] - p1[0]) * 180) / Math.PI,
      len: Math.hypot(p2[0] - p1[0], p2[1] - p1[1]),
    });
  }
  return segs;
}

const halo = { paintOrder: "stroke", stroke: "var(--color-surface)", strokeWidth: 3, strokeLinejoin: "round" } as const;

/* ------------------------------------------------------------------ */
/* ConnectedScatter                                                    */
/* ------------------------------------------------------------------ */

export type ConnectedScatterPoint = {
  x: number;
  y: number;
  /** Rótulo do instante ("jun 2026"): vai para a cabeça, o controle de tempo e a tabela. */
  label: string;
  /** Anotação curta junto ao ponto ("Planos anuais"). */
  note?: string;
};

export type ConnectedScatterSeries = {
  key: string;
  label: string;
  /** Em ordem do tempo, do mais antigo ao mais recente. */
  points: ConnectedScatterPoint[];
  /** Cor CSS do caminho. Padrão: chart-1 (tinta). */
  color?: string;
};

export type ConnectedScatterReference = {
  /** Razão da linha y = ratio · x (3 = "LTV de 3× o CAC"). */
  ratio: number;
  /** Rótulo da linha ("3× CAC"). */
  label: string;
  /** Lado saudável da linha, sombreado em verde bem leve. */
  zone?: "above" | "below";
  /** Rótulo da zona ("Saudável, acima de 3×"). */
  zoneLabel?: string;
};

export type ConnectedScatterProps = {
  series: ConnectedScatterSeries[];
  /** Série em destaque (key). Padrão: a primeira. Trocar transiciona o caminho. */
  active?: string;
  /** Mostra as outras séries bem esmaecidas, para comparar. Padrão: true. */
  compare?: boolean;
  /** Posição da cabeça (índice do ponto). Controlado; sem ele, começa no último. */
  index?: number;
  onIndexChange?: (index: number) => void;
  /** Nome da medida do eixo horizontal ("CAC"). */
  xLabel: string;
  /** Nome da medida do eixo vertical ("LTV em 12 meses"). */
  yLabel: string;
  formatX?: (n: number) => string;
  formatY?: (n: number) => string;
  /** Formato dos rótulos dos eixos (compacto). Padrão: formatX/formatY. */
  formatAxisX?: (n: number) => string;
  formatAxisY?: (n: number) => string;
  /** Linha de razão tracejada (y = ratio · x) com zona saudável opcional. */
  reference?: ConnectedScatterReference;
  /** Caminho suave (padrão) ou em segmentos retos. */
  curve?: "smooth" | "linear";
  /** Setas discretas de direção no meio de cada trecho. Padrão: true. */
  arrows?: boolean;
  /** Controle de tempo embaixo (tocar/pausar). Padrão: true. */
  scrubber?: boolean;
  /** Legenda acima do gráfico. Padrão: true. */
  legend?: boolean;
  height?: number;
  /** Descrição acessível do gráfico (obrigatória). */
  label: string;
  className?: string;
};

/**
 * Dispersão conectada: como duas medidas andaram juntas no tempo (CAC × LTV,
 * preço × volume, custo × satisfação). Cada mês é um ponto, ligado ao seguinte
 * por um caminho com setas; a cabeça marca o mês em foco. Setas do teclado ou
 * o controle de tempo movem a cabeça.
 */
export function ConnectedScatter({
  series,
  active: activeProp,
  compare = true,
  index: indexProp,
  onIndexChange,
  xLabel,
  yLabel,
  formatX = (n) => formatNumber(n),
  formatY = (n) => formatNumber(n),
  formatAxisX,
  formatAxisY,
  reference,
  curve = "smooth",
  arrows = true,
  scrubber = true,
  legend = true,
  height = 340,
  label,
  className,
}: ConnectedScatterProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const clip = useId().replace(/:/g, "");
  const current = series.find((s) => s.key === activeProp) ?? series[0];
  const points = useMemo(() => current?.points ?? [], [current]);
  const n = points.length;
  const [rawIndex, setIndex] = useIndex(indexProp, Math.max(0, n - 1), onIndexChange);
  const index = Math.max(0, Math.min(n - 1, rawIndex));
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const color = current?.color ?? "var(--color-chart-1)";

  // Domínio estável entre séries: trocar de canal não mexe nos eixos.
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const gx = niceRange(Math.min(...xs, Infinity), Math.max(...xs, -Infinity), 5, 0.06);
  const gy = niceRange(Math.min(...ys, Infinity), Math.max(...ys, -Infinity), 4, 0.1);
  const axX = formatAxisX ?? formatX;
  const axY = formatAxisY ?? formatY;
  const left = Math.min(72, Math.max(36, Math.max(...gy.ticks.map((t) => axY(t).length)) * 6.6 + 14));
  const m = { top: 8, right: 16, bottom: 44 };
  const innerW = Math.max(0, width - left - m.right);
  const innerH = Math.max(0, height - m.top - m.bottom);
  const sx = (v: number) => left + ((v - gx.lo) / (gx.hi - gx.lo || 1)) * innerW;
  const sy = (v: number) => m.top + innerH - ((v - gy.lo) / (gy.hi - gy.lo || 1)) * innerH;
  const xTickW = Math.max(...gx.ticks.map((t) => axX(t).length)) * 6.6 + 12;
  const xEvery = Math.max(1, Math.ceil((gx.ticks.length * xTickW) / Math.max(1, innerW)));

  // Caminho da série ativa, interpolado quando a série muda.
  const flat = useTween(
    points.flatMap((p) => [p.x, p.y]),
    420,
  );
  const shown: Pt[] = points.map((_, i) => [sx(flat[i * 2] ?? points[i].x), sy(flat[i * 2 + 1] ?? points[i].y)]);
  const segs = smoothSegments(shown, curve === "smooth");
  const head = shown[index];
  const headPt = points[index];

  /* ---------- linha de razão e zona ---------- */
  let refLine: { a: Pt; b: Pt; angle: number; zone: string | null; zoneLabelAt: Pt | null } | null = null;
  if (reference && innerW > 0) {
    const p = (x: number): Pt => [sx(x), sy(reference.ratio * x)];
    const p1 = p(gx.lo);
    const p2 = p(gx.hi);
    // Trecho visível (y dentro da área de plotagem).
    const top = m.top;
    const bottom = m.top + innerH;
    const tAt = (y: number) => (p2[1] === p1[1] ? Infinity : (y - p1[1]) / (p2[1] - p1[1]));
    const t0 = Math.max(0, Math.min(tAt(top), tAt(bottom)));
    const t1 = Math.min(1, Math.max(tAt(top), tAt(bottom)));
    const lerp = (t: number): Pt => [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
    if (t1 > t0) {
      const a = lerp(t0);
      const b = lerp(t1);
      const far = reference.zone === "above" ? -1e4 : 1e4;
      const zone = reference.zone ? `M${p1[0]},${p1[1]}L${p2[0]},${p2[1]}L${p2[0]},${far}L${p1[0]},${far}Z` : null;
      // Rótulo da zona no canto que certamente está dentro dela.
      const corner: Pt = reference.zone === "above" ? [left + 10, top + 16] : [left + innerW - 10, bottom - 10];
      const cx = gx.lo + ((corner[0] - left) / (innerW || 1)) * (gx.hi - gx.lo);
      const cy = gy.lo + ((bottom - corner[1]) / (innerH || 1)) * (gy.hi - gy.lo);
      const inside = reference.zone === "above" ? cy > reference.ratio * cx : cy < reference.ratio * cx;
      refLine = { a, b, angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, zone, zoneLabelAt: reference.zone && inside ? corner : null };
    } else if (reference.zone) {
      // Linha fora da área: a zona cobre tudo ou nada.
      const allAbove = sy(reference.ratio * gx.hi) > bottom;
      const covers = reference.zone === "above" ? allAbove : !allAbove;
      refLine = covers ? { a: [0, 0], b: [0, 0], angle: 0, zone: `M${left},${top}h${innerW}v${innerH}h${-innerW}Z`, zoneLabelAt: [left + 10, top + 16] } : null;
    }
  }

  /* ---------- interação ---------- */
  const nearest = (clientX: number, clientY: number, rect: DOMRect, maxD: number) => {
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best = -1;
    let bd = maxD;
    shown.forEach(([x, y], i) => {
      const d = Math.hypot(x - px, y - py);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best < 0 ? null : best;
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: index - 1, ArrowDown: index - 1, ArrowRight: index + 1, ArrowUp: index + 1, Home: 0, End: n - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    setIndex(Math.max(0, Math.min(n - 1, map[e.key])));
  };
  const tipIdx = hover ?? (focused ? index : null);
  const tipPt = tipIdx != null ? points[tipIdx] : null;
  const tipAt = tipIdx != null ? shown[tipIdx] : null;

  const ghosts = compare ? series.filter((s) => s !== current && s.points.length > 1) : [];
  const ghostPaths = ghosts.map((s) => {
    const pts: Pt[] = s.points.map((p) => [sx(p.x), sy(p.y)]);
    const d = `M${pts[0][0]},${pts[0][1]}${smoothSegments(pts, curve === "smooth").map((g) => g.d).join("")}`;
    return { key: s.key, label: s.label, d, end: pts[pts.length - 1] };
  });

  const start = shown[0];
  const pastD = head ? `M${start[0]},${start[1]}${segs.slice(0, index).map((g) => g.d).join("")}` : "";
  const futureD = head && index < n - 1 ? `M${head[0]},${head[1]}${segs.slice(index).map((g) => g.d).join("")}` : "";
  const narrow = innerW > 0 && innerW < 420;
  // Anotação em texto: no estreito só a do mês em foco; nunca encostada na cabeça.
  const noteShown = (i: number) => (!narrow || i === index) && (i === index || !head || Math.hypot(shown[i][0] - head[0], shown[i][1] - head[1]) > 40);
  const sideOf = (x: number) => (x > left + innerW * 0.6 ? "end" : "start");

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {legend && (
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 text-[12px] text-muted">
          <span className="text-ink-soft">{yLabel}</span>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0">
            {current && (
              <li className="flex items-center gap-1.5">
                <svg width="18" height="8" aria-hidden className="shrink-0">
                  <path d="M1,4H17" stroke={color} strokeWidth={2} strokeLinecap="round" />
                </svg>
                {current.label}, em ordem do tempo
              </li>
            )}
            {ghosts.length > 0 && (
              <li className="flex items-center gap-1.5">
                <svg width="18" height="8" aria-hidden className="shrink-0">
                  <path d="M1,4H17" stroke="var(--color-muted)" strokeOpacity={0.45} strokeWidth={1.5} strokeLinecap="round" />
                </svg>
                {ghosts.length === 1 ? "Outro canal" : "Outros canais"}
              </li>
            )}
            {reference && (
              <li className="flex items-center gap-1.5">
                <svg width="18" height="8" aria-hidden className="shrink-0">
                  <path d="M1,4H17" stroke="var(--color-muted)" strokeWidth={1.25} strokeDasharray="3 3" />
                </svg>
                {reference.label}
              </li>
            )}
            {reference?.zone && (
              <li className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 shrink-0 rounded-[3px] border border-ok/30" style={{ background: "color-mix(in oklab, var(--color-ok) 12%, transparent)" }} />
                {reference.zoneLabel ?? "Zona saudável"}
              </li>
            )}
          </ul>
        </div>
      )}
      <div
        ref={ref}
        className="relative touch-pan-y outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-muted/40"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${label}. Use as setas para percorrer os meses.`}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0 block"
            aria-hidden
            onPointerMove={(e) => setHover(nearest(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), 22))}
            onPointerLeave={() => setHover(null)}
            onPointerDown={(e) => {
              const i = nearest(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), 28);
              if (i != null) setIndex(i);
            }}
          >
            <defs>
              <clipPath id={`${clip}-plot`}>
                <rect x={left} y={m.top} width={innerW} height={innerH} />
              </clipPath>
            </defs>
            {refLine?.zone && <path d={refLine.zone} clipPath={`url(#${clip}-plot)`} fill="color-mix(in oklab, var(--color-ok) 7%, transparent)" />}
            {gy.ticks.map((t) => (
              <g key={`y${t}`}>
                <line x1={left} x2={left + innerW} y1={sy(t)} y2={sy(t)} stroke={t === gy.lo ? "var(--color-line)" : "var(--color-chart-grid)"} />
                <text x={left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11.5px] tabular-nums">
                  {axY(t)}
                </text>
              </g>
            ))}
            {gx.ticks.map((t, i) =>
              i % xEvery === 0 ? (
                <text key={`x${t}`} x={sx(t)} y={m.top + innerH + 17} textAnchor={i === 0 ? "start" : i === gx.ticks.length - 1 ? "end" : "middle"} className="fill-muted text-[11.5px] tabular-nums">
                  {axX(t)}
                </text>
              ) : null,
            )}
            <text x={left + innerW / 2} y={height - 4} textAnchor="middle" className="fill-ink-soft text-[12px]">
              {xLabel}
            </text>
            {refLine?.zoneLabelAt && reference?.zoneLabel && (
              <text x={refLine.zoneLabelAt[0]} y={refLine.zoneLabelAt[1]} textAnchor={reference.zone === "above" ? "start" : "end"} className="fill-ok text-[12px] font-medium">
                {reference.zoneLabel}
              </text>
            )}
            {refLine && reference && refLine.a[0] !== refLine.b[0] && (
              <g>
                <line x1={refLine.a[0]} y1={refLine.a[1]} x2={refLine.b[0]} y2={refLine.b[1]} stroke="var(--color-muted)" strokeWidth={1.25} strokeDasharray="4 4" />
                <text
                  transform={`translate(${refLine.a[0] + (refLine.b[0] - refLine.a[0]) * 0.94},${refLine.a[1] + (refLine.b[1] - refLine.a[1]) * 0.94}) rotate(${refLine.angle})`}
                  dy={-6}
                  textAnchor="end"
                  className="fill-muted text-[11.5px]"
                  style={halo}
                >
                  {reference.label}
                </text>
              </g>
            )}

            {/* Outras séries, esmaecidas, com o nome na ponta. */}
            {ghostPaths.map((g) => (
              <g key={g.key} className="transition-opacity duration-200">
                <path d={g.d} fill="none" stroke="var(--color-muted)" strokeOpacity={0.35} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
                <text x={g.end[0]} y={g.end[1]} dx={sideOf(g.end[0]) === "end" ? -6 : 6} dy={-6} textAnchor={sideOf(g.end[0])} className="fill-muted text-[11px]" style={halo} opacity={0.8}>
                  {g.label}
                </text>
              </g>
            ))}

            {/* Guias da cabeça até os eixos. */}
            {head && (
              <g stroke="var(--color-line-strong)" strokeWidth={1}>
                <line x1={left} x2={head[0]} y1={head[1]} y2={head[1]} />
                <line x1={head[0]} x2={head[0]} y1={head[1]} y2={m.top + innerH} />
              </g>
            )}

            {/* Caminho: até a cabeça forte; depois dela, esmaecido. */}
            {futureD && <path d={futureD} fill="none" stroke={color} strokeOpacity={0.28} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />}
            {pastD && <path d={pastD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
            {arrows &&
              segs.map((g, i) =>
                g.len < 22 ? null : (
                  <path key={i} d="M-3.5,-3L2.5,0L-3.5,3Z" transform={`translate(${g.mid[0]},${g.mid[1]}) rotate(${g.angle})`} fill={color} opacity={i < index ? 1 : 0.3} />
                ),
              )}
            {shown.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={hover === i ? 4 : 2.6} fill={color} opacity={i <= index ? 1 : 0.35} />
            ))}

            {/* Anotações sem texto visível viram anel no ponto (o texto fica no tooltip). */}
            {points.map((p, i) =>
              p.note && shown[i] && !noteShown(i) ? (
                <circle key={`r${i}`} cx={shown[i][0]} cy={shown[i][1]} r={5.5} fill="none" stroke={color} strokeWidth={1} opacity={i <= index ? 0.7 : 0.3} />
              ) : null,
            )}
            {points.map((p, i) =>
              p.note && shown[i] && noteShown(i) ? (
                <text
                  key={`n${i}`}
                  x={shown[i][0]}
                  y={shown[i][1]}
                  dx={sideOf(shown[i][0]) === "end" ? -9 : 9}
                  dy={14}
                  textAnchor={sideOf(shown[i][0])}
                  className="fill-ink-soft text-[11.5px]"
                  style={halo}
                  opacity={i <= index ? 1 : 0.55}
                >
                  {p.note}
                </text>
              ) : null,
            )}

            {/* Início e cabeça. */}
            {start && index > 0 && (
              <text x={start[0]} y={start[1]} dx={start[0] > left + 64 ? -9 : 6} dy={start[0] > left + 64 ? "0.32em" : 16} textAnchor={start[0] > left + 64 ? "end" : "start"} className="fill-muted text-[11.5px]" style={halo}>
                {points[0].label}
              </text>
            )}
            {head && headPt && (
              <g>
                <circle cx={head[0]} cy={head[1]} r={10} fill={color} fillOpacity={0.14} />
                <circle cx={head[0]} cy={head[1]} r={4.5} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
                <text x={head[0]} y={head[1]} dx={sideOf(head[0]) === "end" ? -14 : 14} dy={-10} textAnchor={sideOf(head[0])} className="fill-ink text-[12px] font-semibold" style={halo}>
                  {headPt.label}
                </text>
              </g>
            )}
          </svg>
        )}
        {tipPt && tipAt && (
          <ChartTooltip
            title={tipPt.note ? `${tipPt.label} · ${tipPt.note}` : tipPt.label}
            rows={[
              { label: xLabel, value: formatX(tipPt.x) },
              { label: yLabel, value: formatY(tipPt.y) },
              ...(reference ? [{ label: "Razão", value: `${formatNumber(tipPt.y / (tipPt.x || 1), 1)}×` }] : []),
            ]}
            // Do lado oposto ao ponto, para não cobrir o caminho nem os eixos.
            style={{
              left: tipAt[0] > width / 2 ? Math.max(0, tipAt[0] - 226) : Math.min(tipAt[0] + 16, width - 220),
              top: tipAt[1] > height / 2 ? Math.max(0, tipAt[1] - 124) : Math.min(tipAt[1] + 16, height - 120),
            }}
          />
        )}
        <span className="sr-only" aria-live="polite">
          {focused && headPt ? `${headPt.label}: ${xLabel} ${formatX(headPt.x)}, ${yLabel} ${formatY(headPt.y)}${headPt.note ? `. ${headPt.note}` : ""}` : ""}
        </span>
        <div className="sr-only">
          <table>
            <caption>{`${label}${current ? ` · ${current.label}` : ""}`}</caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col">{xLabel}</th>
                <th scope="col">{yLabel}</th>
                <th scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <th scope="row">{p.label}</th>
                  <td>{formatX(p.x)}</td>
                  <td>{formatY(p.y)}</td>
                  <td>{p.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {scrubber && n > 1 && <ChartScrubber count={n} value={index} onChange={setIndex} format={(i) => points[i]?.label ?? ""} label="Mês" playable />}
    </div>
  );
}

/** Desvio sem casas; o que arredonda para zero aparece como "0 %", sem sinal. */
const horizonDelta = (n: number) => (Math.abs(n) < 0.005 ? formatPercent(0, 0) : formatDelta(n, 0));

/* ------------------------------------------------------------------ */
/* HorizonLegend                                                       */
/* ------------------------------------------------------------------ */

export type HorizonLegendProps = {
  /** Número de faixas (1–4). */
  bands: number;
  /** Desvio máximo coberto (fração: 0.36 = 36 %). */
  extent: number;
  /** Formato dos extremos. Padrão: formatDelta sem casas. */
  format?: (n: number) => string;
  className?: string;
};

/** Legenda do horizon: faixas abaixo e acima da base e a frase de leitura. */
export function HorizonLegend({ bands, extent, format = horizonDelta, className }: HorizonLegendProps) {
  const b = Math.max(1, Math.round(bands));
  const size = extent / b;
  const sizeText = formatPercent(size, Math.abs(size * 100 - Math.round(size * 100)) < 0.05 ? 0 : 1);
  const levels = Array.from({ length: b }, (_, k) => (k + 1) / b);
  return (
    <div className={cn("flex w-full flex-col gap-1.5 text-[11.5px] text-muted sm:w-[300px]", className)}>
      <div className="flex items-center gap-0.5" aria-hidden>
        {[...levels].reverse().map((t) => (
          <span key={`n${t}`} className="h-2.5 min-w-0 flex-1 rounded-[2px]" style={{ background: sequentialColor(t, "neg") }} />
        ))}
        <span className="mx-1 h-4 w-px shrink-0 bg-line-strong" />
        {levels.map((t) => (
          <span key={`p${t}`} className="h-2.5 min-w-0 flex-1 rounded-[2px]" style={{ background: sequentialColor(t, "pos") }} />
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 tabular-nums">
        <span>{format(-extent)}</span>
        <span className="text-center">Abaixo</span>
        <span>0</span>
        <span className="text-center">Acima</span>
        <span>{format(extent)}</span>
      </div>
      <p className="m-0 text-[12px] leading-snug text-ink-soft">
        {b === 1 ? `Cada linha usa uma faixa só, de ${sizeText}.` : `Cada linha dobra em ${b} faixas de ${sizeText}.`} Cor mais forte = mais longe da base.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HorizonChart                                                        */
/* ------------------------------------------------------------------ */

export type HorizonSeries = {
  key: string;
  label: string;
  /** Desvio de cada dia em relação à base, em fração (0.12 = 12 % acima). `null` = sem dado. */
  values: (number | null)[];
};

export type HorizonChartProps = {
  series: HorizonSeries[];
  /** Rótulo de cada dia (mesmo comprimento de `values`): vai para o cabeçalho e o leitor de tela. */
  days: string[];
  /** Em quantas faixas cada linha dobra. Padrão: 3. Trocar transiciona suave. */
  bands?: 1 | 2 | 3 | 4;
  /** Desvio máximo coberto (fração). Padrão: o maior desvio dos dados, arredondado para faixas de ponto percentual inteiro. */
  extent?: number;
  /** Ordem das linhas: nome, pico (maior desvio) ou último dia. Padrão: "name". */
  sort?: "name" | "peak" | "latest";
  /** Altura de cada linha em px. Padrão: 32. */
  rowHeight?: number;
  /** Dia sob a cruz (índice) ou null. Controlado; sem ele, segue o ponteiro e o teclado. */
  index?: number | null;
  onIndexChange?: (index: number | null) => void;
  /** Formato do desvio. Padrão: formatDelta sem casas ("+12 %"; perto de zero, "0 %"). */
  format?: (n: number) => string;
  /** Marcas do eixo de tempo embaixo (ex.: o 1º de cada mês). */
  ticks?: { index: number; label: string }[];
  /** Cabeçalho com o dia em foco. Padrão: true. */
  header?: boolean;
  /** Legenda das faixas (HorizonLegend). Padrão: true. */
  legend?: boolean;
  /** Descrição acessível do gráfico (obrigatória). */
  label: string;
  className?: string;
};

/**
 * Horizon: muitas séries diárias (8–20) contra a própria base, cada uma numa
 * linha baixa dobrada em faixas. Acima da base em `chart-pos`, abaixo em
 * `chart-neg`; quanto mais forte a cor, mais longe. A cruz é a mesma em todas
 * as linhas; o valor do dia (ou do último) fica à direita.
 */
export function HorizonChart({
  series,
  days,
  bands = 3,
  extent: extentProp,
  sort = "name",
  rowHeight = 32,
  index: indexProp,
  onIndexChange,
  format = horizonDelta,
  ticks,
  header = true,
  legend = true,
  label,
  className,
}: HorizonChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [index, setIndex] = useIndex<number | null>(indexProp, null, onIndexChange);
  const [row, setRow] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const n = days.length;
  const last = n - 1;
  const [b] = useTween([bands], 380);

  const maxAbs = useMemo(() => {
    let mx = 0;
    for (const s of series) for (const v of s.values) if (v != null && Number.isFinite(v)) mx = Math.max(mx, Math.abs(v));
    return mx;
  }, [series]);
  // Padrão: faixas de ponto percentual inteiro (3 faixas de 11 %, não de 10,7 %).
  const extent = extentProp ?? ((Math.ceil((maxAbs * 100) / bands) * bands) / 100 || 0.01);
  const size = extent / Math.max(0.5, b);
  const layers = Math.ceil(b - 1e-6);

  const stats = useMemo(
    () =>
      series.map((s) => {
        let peak = -Infinity;
        let peakAt = -1;
        let low = Infinity;
        let lowAt = -1;
        let latestAt = -1;
        s.values.forEach((v, i) => {
          if (v == null || !Number.isFinite(v)) return;
          if (v > peak) [peak, peakAt] = [v, i];
          if (v < low) [low, lowAt] = [v, i];
          latestAt = i;
        });
        return { key: s.key, peak, peakAt, low, lowAt, latestAt, latest: latestAt >= 0 ? (s.values[latestAt] as number) : null };
      }),
    [series],
  );
  const order = useMemo(() => {
    const idx = series.map((_, i) => i);
    if (sort === "name") idx.sort((a, z) => series[a].label.localeCompare(series[z].label, "pt-BR"));
    else if (sort === "peak") idx.sort((a, z) => Math.max(Math.abs(stats[z].peak), Math.abs(stats[z].low)) - Math.max(Math.abs(stats[a].peak), Math.abs(stats[a].low)));
    else idx.sort((a, z) => (stats[z].latest ?? -Infinity) - (stats[a].latest ?? -Infinity));
    const pos: number[] = [];
    idx.forEach((si, p) => (pos[si] = p));
    return { idx, pos };
  }, [series, stats, sort]);

  const narrow = width > 0 && width < 480;
  const labelW = narrow ? 78 : 128;
  const valueW = narrow ? 44 : 56;
  const gap = 8;
  const chartW = Math.max(0, width - labelW - valueW - gap * 2);
  const plotH = rowHeight - 6;
  const xAt = (i: number) => (n <= 1 ? chartW / 2 : (i / last) * chartW);
  const day = index ?? last;

  const paths = useMemo(() => {
    if (!chartW) return [];
    return series.map((s) => {
      const out: { d: string; fill: string }[] = [];
      for (const sign of [1, -1] as const) {
        for (let k = 0; k < layers; k++) {
          let d = `M0,${rowHeight - 2}`;
          let any = false;
          s.values.forEach((v, i) => {
            const h = v == null || !Number.isFinite(v) || Math.sign(v) !== sign ? 0 : Math.max(0, Math.min(1, (Math.abs(v) - k * size) / size));
            if (h > 0) any = true;
            d += `L${Math.round(xAt(i) * 100) / 100},${Math.round((rowHeight - 2 - h * plotH) * 100) / 100}`;
          });
          d += `L${chartW},${rowHeight - 2}Z`;
          if (any) out.push({ d, fill: sequentialColor(Math.min(1, (k + 1) / Math.max(1, b)), sign > 0 ? "pos" : "neg") });
        }
      }
      return out;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, chartW, layers, size, b, rowHeight, plotH, n]);

  const valueAt = (s: HorizonSeries) => {
    if (index != null) return s.values[index] ?? null;
    const st = stats[series.indexOf(s)];
    return st.latest;
  };

  const move = (i: number | null) => setIndex(i == null ? null : Math.max(0, Math.min(last, i)));
  const onKey = (e: KeyboardEvent) => {
    const cur = index ?? last;
    const rowCur = row ?? -1;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => move(cur - 1),
      ArrowRight: () => move(cur + 1),
      PageUp: () => move(cur - 7),
      PageDown: () => move(cur + 7),
      Home: () => move(0),
      End: () => move(last),
      ArrowDown: () => setRow(Math.min(series.length - 1, rowCur + 1)),
      ArrowUp: () => setRow(Math.max(0, rowCur - 1)),
      Escape: () => {
        move(null);
        setRow(null);
      },
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    keys[e.key]();
  };
  const pick = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const x = clientX - r.left - labelW - gap;
    if (x < -gap || x > chartW + gap || !chartW) return;
    move(Math.round((Math.max(0, Math.min(chartW, x)) / chartW) * last));
  };
  const rowSeries = row != null ? series[order.idx[row]] : null;
  const live = focused
    ? `${days[day] ?? ""}${rowSeries ? `. ${rowSeries.label}: ${valueAt(rowSeries) == null ? "sem dado" : format(valueAt(rowSeries) as number)}` : ""}`
    : "";

  return (
    <div className={cn("flex min-w-0 flex-col gap-4", className)}>
      {(header || legend) && (
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          {header && (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[17px] font-semibold tracking-tight text-ink">{days[day]}</span>
              <span className="text-[12px] text-muted">{index == null || index === last ? "Último dia" : "Dia sob a cruz"}</span>
            </div>
          )}
          {legend && <HorizonLegend bands={bands} extent={extent} format={format} />}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <div
          ref={ref}
          role="group"
          tabIndex={0}
          aria-label={`${label}. Setas para os lados mudam o dia; para cima e para baixo percorrem as linhas.`}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setRow(null);
          }}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse" && indexProp === undefined) move(null);
          }}
          className="relative touch-pan-y border-t border-line outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-muted/40"
          style={{ height: series.length * rowHeight }}
        >
          {width > 0 &&
            series.map((s, si) => {
              const pos = order.pos[si];
              const v = valueAt(s);
              const on = row === pos;
              return (
                <div
                  key={s.key}
                  className={cn("absolute inset-x-0 top-0 flex items-center border-b border-line transition-transform duration-300 ease-out motion-reduce:transition-none", on && "bg-soft")}
                  style={{ height: rowHeight, transform: `translateY(${pos * rowHeight}px)`, gap }}
                >
                  <span className={cn("shrink-0 truncate", narrow ? "text-[11.5px]" : "text-[13px]", on ? "font-medium text-ink" : "text-ink-soft")} style={{ width: labelW }} title={s.label}>
                    {s.label}
                  </span>
                  <svg width={chartW} height={rowHeight} className="block shrink-0" aria-hidden>
                    <line x1={0} x2={chartW} y1={rowHeight - 2} y2={rowHeight - 2} stroke="var(--color-chart-grid)" />
                    {paths[si]?.map((p, k) => (
                      <path key={k} d={p.d} fill={p.fill} />
                    ))}
                  </svg>
                  <span className={cn("shrink-0 text-right tabular-nums", narrow ? "text-[11.5px]" : "text-[12.5px]", on ? "font-medium text-ink" : "text-ink-soft")} style={{ width: valueW }}>
                    {v == null ? "—" : format(v)}
                  </span>
                </div>
              );
            })}
          {width > 0 && index != null && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 w-px"
              style={{ left: labelW + gap + xAt(index), background: "color-mix(in oklab, var(--color-ink) 55%, transparent)" }}
            />
          )}
          <span className="sr-only" aria-live="polite">
            {live}
          </span>
        </div>
        {ticks && ticks.length > 0 && width > 0 && (
          <div className="relative h-4 text-[11px] text-muted" aria-hidden>
            {ticks.map((t) => (
              <span key={t.index} className="absolute top-0 whitespace-nowrap tabular-nums" style={{ left: labelW + gap + xAt(t.index) }}>
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="sr-only">
        <table>
          <caption>{`${label}. Resumo por linha: pico, mínimo e último dia.`}</caption>
          <thead>
            <tr>
              <th scope="col">Série</th>
              <th scope="col">Pico</th>
              <th scope="col">Mínimo</th>
              <th scope="col">Último</th>
            </tr>
          </thead>
          <tbody>
            {order.idx.map((si) => {
              const s = series[si];
              const st = stats[si];
              return (
                <tr key={s.key}>
                  <th scope="row">{s.label}</th>
                  <td>{st.peakAt >= 0 ? `${format(st.peak)} em ${days[st.peakAt]}` : "—"}</td>
                  <td>{st.lowAt >= 0 ? `${format(st.low)} em ${days[st.lowAt]}` : "—"}</td>
                  <td>{st.latest == null ? "—" : `${format(st.latest)} em ${days[st.latestAt]}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
