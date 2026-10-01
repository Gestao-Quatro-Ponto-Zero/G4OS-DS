"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { ChartLegend, ChartTooltip, chartColor, useElementWidth } from "./charts";

/*
 * Formas: pizza/rosca e radial. Mesmas regras de charts.tsx: 2–6 fatias,
 * "Outros" por último, total sempre visível, valor exato no hover.
 */

export type PieItem = { key?: string; label: string; value: number; color?: string };

const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a - Math.PI / 2), cy + r * Math.sin(a - Math.PI / 2)] as const;

/** Setor anular de a0 a a1 (radianos, 0 = topo, sentido horário). */
function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (a1 - a0 >= TAU - 1e-6) a1 = a0 + TAU - 1e-4;
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  if (r0 <= 0) return `M${cx},${cy}L${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}Z`;
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  return `M${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`;
}

/**
 * Pizza ou rosca. `innerRadius` (0–0,9 do raio) vira rosca; o centro mostra
 * total ou a fatia ativa. `activeIndex` controla o destaque (Pie – Interativo).
 * `labels`: "inside" (% na fatia), "outside" (nome + valor com linha guia).
 * `rings`: várias roscas concêntricas (comparar períodos/segmentos).
 */
export function PieChart({
  items,
  rings,
  label,
  innerRadius = 0,
  size = 260,
  format = (n) => formatNumber(n),
  labels = "none",
  centerLabel,
  centerValue,
  activeIndex,
  onActiveIndexChange,
  legend = "bottom",
  padAngle = 0.012,
  className,
}: {
  items?: PieItem[];
  /** Anéis concêntricos (do externo para o interno). Use no lugar de `items`. */
  rings?: { label: string; items: PieItem[] }[];
  label: string;
  innerRadius?: number;
  size?: number;
  format?: (n: number) => string;
  labels?: "none" | "inside" | "outside";
  /** Texto pequeno do centro (rosca). Padrão: "Total" ou o nome da fatia ativa. */
  centerLabel?: ReactNode;
  /** Número do centro (rosca). Padrão: total ou valor da fatia ativa. */
  centerValue?: ReactNode;
  activeIndex?: number;
  onActiveIndexChange?: (i: number | null) => void;
  legend?: "bottom" | "right" | false;
  padAngle?: number;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ ring: number; i: number } | null>(null);
  const ringList = rings ?? [{ label, items: items ?? [] }];
  const base = ringList[0].items;
  const colorOf = (it: PieItem, i: number) => it.color ?? chartColor(i);
  const outside = labels === "outside";
  const avail = legend === "right" ? Math.min(size, Math.max(160, (width || size) * 0.55)) : Math.min(size, width || size);
  const S = Math.max(150, avail);
  const margin = outside ? 46 : 6;
  const R = S / 2 - margin;
  const inner = Math.max(0, Math.min(0.9, rings ? Math.max(innerRadius, 0.35) : innerRadius)) * R;
  const ringW = (R - inner) / ringList.length;
  const activeSel = activeIndex ?? (hover?.ring === 0 ? hover.i : null);
  const total0 = base.reduce((t, it) => t + Math.max(0, it.value), 0);
  const current = activeSel != null ? base[activeSel] : null;
  const isDonut = inner > 0;

  const setActive = (ring: number, i: number | null) => {
    setHover(i == null ? null : { ring, i });
    if (ring === 0) onActiveIndexChange?.(i);
  };

  return (
    <div ref={ref} className={cn("flex min-w-0 items-center gap-6", legend === "right" ? "flex-wrap justify-center sm:flex-nowrap" : "flex-col", className)}>
      <div className="relative shrink-0" style={{ width: S, height: S }}>
        <svg
          width={S}
          height={S}
          className="overflow-visible"
          role="img"
          aria-label={`${label}: ${base.map((it) => `${it.label} ${format(it.value)}`).join(", ")}`}
          onPointerLeave={() => setActive(0, null)}
        >
          {ringList.map((ring, ri) => {
            const total = ring.items.reduce((t, it) => t + Math.max(0, it.value), 0) || 1;
            const r1 = R - ri * ringW;
            const r0 = Math.max(inner, r1 - ringW + (ringList.length > 1 ? 3 : 0));
            let a = 0;
            return (
              <g key={ring.label}>
                {ring.items.map((it, i) => {
                  const span = (Math.max(0, it.value) / total) * TAU;
                  const a0 = a + (ring.items.length > 1 ? padAngle / 2 : 0);
                  const a1 = a + span - (ring.items.length > 1 ? padAngle / 2 : 0);
                  a += span;
                  if (a1 <= a0) return null;
                  const on = ri === 0 && activeSel === i;
                  const dim = ri === 0 ? activeSel != null && !on : hover != null && !(hover.ring === ri && hover.i === i);
                  const mid = (a0 + a1) / 2;
                  const pop = on ? 7 : 0;
                  const [dx, dy] = [Math.cos(mid - Math.PI / 2) * pop * 0.0, Math.sin(mid - Math.PI / 2) * pop * 0.0];
                  return (
                    <g key={it.label} transform={`translate(${dx},${dy})`}>
                      <path
                        d={arcPath(S / 2, S / 2, r0, r1 + (on ? 6 : 0), a0, a1)}
                        fill={colorOf(it, i)}
                        stroke="var(--ds-surface)"
                        strokeWidth={1.5}
                        opacity={dim ? 0.4 : 1}
                        className="transition-[opacity] duration-150"
                        onPointerEnter={() => setActive(ri, i)}
                      />
                      {labels === "inside" && span > 0.32 && ri === 0 && (
                        <text
                          x={polar(S / 2, S / 2, (r0 + r1) / 2 + (r0 ? 0 : r1 * 0.12), mid)[0]}
                          y={polar(S / 2, S / 2, (r0 + r1) / 2 + (r0 ? 0 : r1 * 0.12), mid)[1]}
                          dy="0.32em"
                          textAnchor="middle"
                          className="pointer-events-none fill-on-ink text-[12px] font-semibold tabular-nums"
                        >
                          {formatPercent(it.value / total, 0)}
                        </text>
                      )}
                      {outside && ri === 0 && span > 0.12 && (() => {
                        const [ax, ay] = polar(S / 2, S / 2, r1 + 4, mid);
                        const [bx, by] = polar(S / 2, S / 2, r1 + 16, mid);
                        const right = bx >= S / 2;
                        const ex = bx + (right ? 10 : -10);
                        return (
                          <g className="pointer-events-none">
                            <polyline points={`${ax},${ay} ${bx},${by} ${ex},${by}`} fill="none" stroke="var(--ds-line-strong)" />
                            <text x={ex + (right ? 4 : -4)} y={by} dy="-0.1em" textAnchor={right ? "start" : "end"} className="fill-ink-soft text-[11.5px]">
                              {it.label}
                            </text>
                            <text x={ex + (right ? 4 : -4)} y={by} dy="1.05em" textAnchor={right ? "start" : "end"} className="fill-ink text-[11.5px] font-semibold tabular-nums">
                              {format(it.value)}
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        {isDonut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[26px] font-semibold leading-none tabular-nums tracking-tight">{centerValue ?? format(current ? current.value : total0)}</span>
            <span className="mt-1 max-w-[60%] truncate text-[12px] text-muted">{centerLabel ?? (current ? current.label : "Total")}</span>
            {current && total0 > 0 && centerValue == null && <span className="text-[11px] tabular-nums text-muted">{formatPercent(current.value / total0, 0)}</span>}
          </div>
        )}
        {hover && !isDonut && ringList[hover.ring]?.items[hover.i] && (
          <ChartTooltip
            title={ringList.length > 1 ? ringList[hover.ring].label : undefined}
            rows={[{ label: ringList[hover.ring].items[hover.i].label, value: format(ringList[hover.ring].items[hover.i].value), color: colorOf(ringList[hover.ring].items[hover.i], hover.i) }]}
            style={{ top: 4, left: S / 2, transform: "translateX(-50%)" }}
          />
        )}
      </div>
      {legend && (
        <ChartLegend
          className={legend === "right" ? "flex-col !items-start gap-y-2" : ""}
          align="center"
          items={base.map((it, i) => ({ label: it.label, color: colorOf(it, i), value: legend === "right" ? formatPercent(it.value / (total0 || 1), 0) : undefined }))}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RadialChart                                                         */
/* ------------------------------------------------------------------ */

/**
 * Um valor em arco (uso do plano, meta, score) com o número no centro.
 * `shape`: "full" (anel), "half" (semicírculo) ou "three-quarter".
 * `segments` empilha partes no mesmo arco (ex.: desktop + celular).
 */
export function RadialChart({
  value,
  max = 100,
  segments,
  label,
  caption,
  format = (n) => formatNumber(n),
  shape = "full",
  size = 220,
  thickness = 16,
  color = "var(--ds-chart-1)",
  rounded = true,
  className,
}: {
  value?: number;
  max?: number;
  segments?: { label: string; value: number; color?: string }[];
  label: string;
  /** Linha abaixo do número (unidade, contexto). */
  caption?: ReactNode;
  format?: (n: number) => string;
  shape?: "full" | "half" | "three-quarter";
  size?: number;
  thickness?: number;
  color?: string;
  rounded?: boolean;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const S = Math.max(140, Math.min(size, width || size));
  const sweep = shape === "full" ? TAU : shape === "half" ? Math.PI : Math.PI * 1.5;
  const start = shape === "full" ? 0 : shape === "half" ? -Math.PI / 2 : -Math.PI * 0.75;
  const r = S / 2 - thickness / 2 - 2;
  const cx = S / 2;
  const cy = shape === "half" ? S / 2 + S * 0.12 : S / 2;
  const H = shape === "half" ? S * 0.66 : S;
  const segs = segments ?? [{ label, value: value ?? 0, color }];
  const total = segs.reduce((t, s) => t + Math.max(0, s.value), 0);
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x0},${y0}A${r},${r} 0 ${large} 1 ${x1},${y1}`;
  };
  let acc = 0;
  const shown = hover != null ? segs[hover] : null;
  return (
    <div ref={ref} className={cn("flex min-w-0 flex-col items-center", className)}>
      <div className="relative" style={{ width: S, height: H }}>
        <svg width={S} height={H} role="meter" aria-valuenow={total} aria-valuemin={0} aria-valuemax={max} aria-label={`${label}: ${format(total)} de ${format(max)}`} onPointerLeave={() => setHover(null)}>
          <path d={arc(start, start + sweep - (shape === "full" ? 0.0001 : 0))} fill="none" stroke="var(--ds-soft)" strokeWidth={thickness} strokeLinecap={rounded ? "round" : "butt"} />
          {segs.map((s, i) => {
            const frac = Math.max(0, Math.min(1, s.value / (max || 1)));
            const a0 = start + acc * sweep;
            acc += frac;
            const a1 = start + Math.min(1, acc) * sweep;
            if (a1 - a0 <= 0.001) return null;
            return (
              <path
                key={s.label}
                d={arc(a0, a1)}
                fill="none"
                stroke={s.color ?? chartColor(i)}
                strokeWidth={thickness}
                strokeLinecap={rounded && segs.length === 1 ? "round" : "butt"}
                opacity={hover != null && hover !== i ? 0.4 : 1}
                onPointerEnter={() => setHover(i)}
                className="transition-opacity duration-150"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center text-center" style={{ top: shape === "half" ? cy - S * 0.24 : cy - 22 }}>
          <span className="text-[28px] font-semibold leading-none tabular-nums tracking-tight">{format(shown ? shown.value : total)}</span>
          <span className="mt-1 text-[12px] text-muted">{shown ? shown.label : caption ?? label}</span>
        </div>
      </div>
      {segs.length > 1 && <ChartLegend className="mt-2" align="center" items={segs.map((s, i) => ({ label: s.label, color: s.color ?? chartColor(i), value: format(s.value) }))} />}
    </div>
  );
}
