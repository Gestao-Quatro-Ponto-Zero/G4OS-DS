"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { useReadableFills } from "../lib/readable";
import { BarChart, ChartLegend, ChartTooltip, chartColor, niceDomain, useElementWidth, type ChartDatum } from "./charts";

/*
 * Gráficos de negócio que as bibliotecas comuns não trazem prontos.
 *   NpsChart ............ NPS com promotores/neutros/detratores + distribuição 0–10
 *   DivergingBarChart ... pesquisa Likert, eNPS, satisfação (negativo ← | → positivo)
 *   SlopeChart .......... antes × depois por item (quem subiu, quem caiu)
 *   DumbbellChart ....... faixa entre dois valores (meta × real, mín × máx, 2025 × 2026)
 *   WaffleChart ......... proporção em 100 quadrados (lê melhor que pizza)
 *   BoxPlot ............. distribuição (mediana, quartis, extremos) por grupo
 *   Histogram ........... frequência por faixa, com bins automáticos
 *   PunchCard ........... dia × hora com bolinhas proporcionais
 *   BumpChart ........... ranking ao longo do tempo
 *   ParetoChart ......... causas em barras + % acumulado (regra 80/20)
 *   RadialBars .......... 2–5 metas em anéis concêntricos
 */

/* ------------------------------------------------------------------ */
/* NPS                                                                 */
/* ------------------------------------------------------------------ */

/**
 * NPS completo: número (−100 a 100), barra de composição e distribuição das
 * notas 0–10 colorida por grupo. `scores[i]` = quantidade de respostas com nota i.
 */
export function NpsChart({ scores, previous, className }: { scores: number[]; previous?: number; className?: string }) {
  const total = scores.reduce((s, n) => s + n, 0) || 1;
  const det = scores.slice(0, 7).reduce((s, n) => s + n, 0);
  const pas = scores.slice(7, 9).reduce((s, n) => s + n, 0);
  const pro = scores.slice(9, 11).reduce((s, n) => s + n, 0);
  const nps = Math.round(((pro - det) / total) * 100);
  const max = Math.max(1, ...scores);
  const zone = nps >= 75 ? "Excelência" : nps >= 50 ? "Qualidade" : nps >= 0 ? "Aperfeiçoamento" : "Crítica";
  const groups = [
    { label: "Detratores", sub: "0–6", n: det, color: "var(--ds-rose)" },
    { label: "Neutros", sub: "7–8", n: pas, color: "var(--ds-line-strong)" },
    { label: "Promotores", sub: "9–10", n: pro, color: "var(--ds-ok)" },
  ];
  const colorFor = (i: number) => (i <= 6 ? "var(--ds-rose)" : i <= 8 ? "var(--ds-line-strong)" : "var(--ds-ok)");
  return (
    <div className={cn("min-w-0", className)} role="group" aria-label={`NPS ${nps}, zona de ${zone}. ${pro} promotores, ${pas} neutros, ${det} detratores de ${total} respostas.`}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-semibold leading-none tabular-nums tracking-tight">{nps > 0 ? `+${nps}` : nps}</span>
            {previous != null && (
              <span className={cn("text-[12px] font-medium tabular-nums", nps >= previous ? "text-ok" : "text-rose")}>
                {nps >= previous ? "▲" : "▼"} {Math.abs(nps - previous)} pts
              </span>
            )}
          </div>
          <div className="mt-1 text-[12px] text-muted">
            Zona de <span className="font-medium text-ink">{zone}</span> · {formatNumber(total)} respostas
          </div>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[12px]">
          {groups.map((g) => (
            <li key={g.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: g.color }} />
              <span className="text-muted">{g.label}</span>
              <span className="font-medium tabular-nums">{formatPercent(g.n / total, 0)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex h-2.5 gap-[2px] overflow-hidden rounded-full">
        {groups.map((g) => (g.n ? <span key={g.label} style={{ flexGrow: g.n, background: g.color }} /> : null))}
      </div>
      <div className="mt-5 grid grid-cols-11 items-end gap-1" style={{ height: 88 }} aria-hidden>
        {scores.map((n, i) => (
          <div key={i} className="flex h-full flex-col justify-end">
            <span className="mb-1 text-center text-[10px] tabular-nums text-muted">{n ? formatNumber(n) : ""}</span>
            <span className="rounded-t-[3px]" style={{ height: `${(n / max) * 62}px`, minHeight: n ? 2 : 0, background: colorFor(i), opacity: i <= 6 ? 0.55 + (i / 6) * 0.45 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-11 gap-1 text-center text-[11px] tabular-nums text-muted" aria-hidden>
        {scores.map((_, i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diverging (Likert)                                                  */
/* ------------------------------------------------------------------ */

/**
 * Pesquisa em escala (Likert 5 pontos, eNPS, satisfação). Negativos à
 * esquerda do zero, positivos à direita, neutro centralizado. Cada linha soma
 * 100 %. `values` na ordem da escala (do mais negativo ao mais positivo).
 */
export function DivergingBarChart({
  rows,
  scale = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
  className,
}: {
  rows: { label: string; values: number[] }[];
  scale?: string[];
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useReadableFills(box, [rows, scale]);
  const k = scale.length;
  const mid = Math.floor(k / 2);
  const hasNeutral = k % 2 === 1;
  const strengthOf = (i: number) => (hasNeutral && i === mid ? 0 : i < mid ? (mid - i) / mid : (i - (hasNeutral ? mid : mid - 1)) / mid);
  const colors = scale.map((_, i) => {
    if (hasNeutral && i === mid) return "var(--ds-line-strong)";
    // Dois níveis bem separados (forte = cor cheia, moderado = 30 %): a faixa do
    // meio não deixa nenhum texto em 4,5:1.
    const st = strengthOf(i);
    return `color-mix(in oklab, ${i < mid ? "var(--ds-rose)" : "var(--ds-ok)"} ${st >= 0.99 ? 100 : Math.round(18 + st * 24)}%, transparent)`;
  });
  const data = rows.map((r) => {
    const total = r.values.reduce((s, n) => s + n, 0) || 1;
    const pct = r.values.map((v) => v / total);
    const negSum = pct.slice(0, mid).reduce((s, n) => s + n, 0) + (hasNeutral ? pct[mid] / 2 : 0);
    return { ...r, pct, negSum };
  });
  const maxNeg = Math.max(...data.map((d) => d.negSum), 0.01);
  const maxPos = Math.max(...data.map((d) => 1 - d.negSum), 0.01);
  const span = maxNeg + maxPos;
  return (
    <div ref={box} className={cn("min-w-0", className)}>
      <ChartLegend className="mb-3" items={scale.map((s, i) => ({ label: s, color: colors[i] }))} />
      <div className="space-y-2">
        {data.map((d) => {
          const positive = d.pct.slice(hasNeutral ? mid + 1 : mid).reduce((s, n) => s + n, 0);
          return (
            <div key={d.label} role="group" className="grid grid-cols-[minmax(80px,200px)_1fr_48px] items-center gap-3" aria-label={`${d.label}: ${formatPercent(positive, 0)} positivo`}>
              <span className="truncate text-[12.5px] text-ink-soft">{d.label}</span>
              <div className="relative h-6">
                <span aria-hidden className="absolute inset-y-[-4px] w-px bg-line-strong" style={{ left: `${(maxNeg / span) * 100}%` }} />
                <div className="absolute inset-y-0 flex overflow-hidden rounded" style={{ left: `${((maxNeg - d.negSum) / span) * 100}%`, width: `${(1 / span) * 100}%` }}>
                  {d.pct.map((p, i) => (
                    <span key={i} title={`${scale[i]}: ${formatPercent(p, 0)}`} data-fill="" className="flex items-center justify-center text-[10.5px] font-medium tabular-nums" style={{ width: `${p * 100}%`, background: colors[i] }}>
                      {p >= 0.09 ? formatPercent(p, 0) : ""}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-right text-[12.5px] font-semibold tabular-nums text-ok">{formatPercent(positive, 0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slope                                                               */
/* ------------------------------------------------------------------ */

/** Antes × depois por item. Linhas que sobem = ok, que caem = rose; destaque no hover. */
export function SlopeChart({
  items,
  fromLabel,
  toLabel,
  format = (n) => formatNumber(n),
  height = 260,
  className,
}: {
  items: { label: string; from: number; to: number }[];
  fromLabel: string;
  toLabel: string;
  format?: (n: number) => string;
  height?: number;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);
  const all = items.flatMap((i) => [i.from, i.to]);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const top = 28;
  const bottom = 12;
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo || 1)) * (height - top - bottom);
  const label = Math.min(150, width * 0.3);
  const x1 = label;
  const x2 = width - label;
  return (
    <div ref={ref} className={cn("relative min-w-0", className)} style={{ height }} role="img" aria-label={items.map((i) => `${i.label}: ${format(i.from)} → ${format(i.to)}`).join("; ")}>
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          <text x={x1} y={12} textAnchor="middle" className="fill-muted text-[11px] font-medium">
            {fromLabel}
          </text>
          <text x={x2} y={12} textAnchor="middle" className="fill-muted text-[11px] font-medium">
            {toLabel}
          </text>
          <line x1={x1} x2={x1} y1={top - 6} y2={height - bottom} stroke="var(--ds-line)" />
          <line x1={x2} x2={x2} y1={top - 6} y2={height - bottom} stroke="var(--ds-line)" />
          {items.map((it) => {
            const up = it.to >= it.from;
            const color = up ? "var(--ds-ok)" : "var(--ds-rose)";
            const dim = active && active !== it.label;
            return (
              <g key={it.label} opacity={dim ? 0.2 : 1} onPointerEnter={() => setActive(it.label)} onPointerLeave={() => setActive(null)} className="transition-opacity duration-150">
                <line x1={x1} x2={x2} y1={y(it.from)} y2={y(it.to)} stroke={color} strokeWidth={active === it.label ? 2.5 : 1.75} />
                <circle cx={x1} cy={y(it.from)} r={3.5} fill={color} />
                <circle cx={x2} cy={y(it.to)} r={3.5} fill={color} />
                <text x={x1 - 8} y={y(it.from)} dy="0.32em" textAnchor="end" className="fill-ink-soft text-[11.5px]">
                  {it.label} <tspan className="fill-muted tabular-nums">{format(it.from)}</tspan>
                </text>
                <text x={x2 + 8} y={y(it.to)} dy="0.32em" className="fill-ink text-[11.5px] font-medium tabular-nums">
                  {format(it.to)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dumbbell                                                            */
/* ------------------------------------------------------------------ */

/** Faixa entre dois valores por linha: meta × real, 2025 × 2026, mínimo × máximo. */
export function DumbbellChart({
  rows,
  aLabel,
  bLabel,
  format = (n) => formatNumber(n),
  goodWhen = "up",
  className,
}: {
  rows: { label: string; a: number; b: number }[];
  aLabel: string;
  bLabel: string;
  format?: (n: number) => string;
  /** "down" para custo, prazo, atraso: b abaixo de a é que fica verde. */
  goodWhen?: "up" | "down";
  className?: string;
}) {
  const all = rows.flatMap((r) => [r.a, r.b]);
  const { lo, hi } = niceDomain(Math.min(...all), Math.max(...all), 4);
  const pct = (v: number) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
  return (
    <div className={cn("min-w-0", className)}>
      <ChartLegend className="mb-3" items={[{ label: aLabel, color: "var(--ds-chart-6)" }, { label: bLabel, color: "var(--ds-chart-1)" }]} />
      <div className="space-y-1">
        {rows.map((r) => {
          const [l, h] = r.a <= r.b ? [r.a, r.b] : [r.b, r.a];
          return (
            <div key={r.label} role="group" className="grid grid-cols-[minmax(80px,160px)_1fr_auto] items-center gap-3 py-1" aria-label={`${r.label}: ${aLabel} ${format(r.a)}, ${bLabel} ${format(r.b)}`}>
              <span className="truncate text-[12.5px] text-ink-soft">{r.label}</span>
              <div className="relative h-4">
                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line" />
                <span aria-hidden className={cn("absolute top-1/2 h-[3px] -translate-y-1/2 rounded", (goodWhen === "up" ? r.b >= r.a : r.b <= r.a) ? "bg-ok/60" : "bg-rose/60")} style={{ left: pct(l), width: `calc(${pct(h)} - ${pct(l)})` }} />
                <span aria-hidden className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-chart-6" style={{ left: pct(r.a), background: "var(--ds-chart-6)" }} />
                <span aria-hidden className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface" style={{ left: pct(r.b), background: "var(--ds-chart-1)" }} />
              </div>
              <span className="w-28 text-right text-[12px] tabular-nums">
                <span className="text-muted">{format(r.a)} → </span>
                <span className="font-semibold">{format(r.b)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Waffle                                                              */
/* ------------------------------------------------------------------ */

/** Proporção em 100 quadrados. Lê melhor que pizza para 2–4 partes. */
export function WaffleChart({
  items,
  columns = 10,
  cell = 14,
  className,
}: {
  items: { label: string; value: number; color?: string }[];
  columns?: number;
  cell?: number;
  className?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  // arredondamento que soma exatamente 100 (maiores restos)
  const raw = items.map((i) => (i.value / total) * 100);
  const floor = raw.map(Math.floor);
  let rest = 100 - floor.reduce((s, n) => s + n, 0);
  raw
    .map((v, i) => [v - floor[i], i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (rest > 0) {
        floor[i]++;
        rest--;
      }
    });
  const cells = floor.flatMap((n, i) => Array.from({ length: n }, () => i));
  const color = (i: number) => items[i].color ?? chartColor(i);
  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="grid shrink-0" style={{ gridTemplateColumns: `repeat(${columns}, ${cell}px)`, gap: 3 }} role="img" aria-label={items.map((i, k) => `${i.label} ${floor[k]}%`).join(", ")}>
        {cells.map((i, k) => (
          <span key={k} className="rounded-[3px]" style={{ width: cell, height: cell, background: color(i) }} />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[13px]">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color(i) }} />
            <span className="text-ink-soft">{it.label}</span>
            <span className="font-semibold tabular-nums">{floor[i]}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BoxPlot                                                             */
/* ------------------------------------------------------------------ */

function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

/**
 * Distribuição por grupo: caixa = 50 % central (Q1–Q3), traço = mediana,
 * bigodes até 1,5 × IQR, pontos = outliers. Salário por cargo, prazo de
 * entrega por transportadora, ciclo de venda por segmento.
 */
export function BoxPlot({
  groups,
  format = (n) => formatNumber(n),
  className,
}: {
  groups: { label: string; values: number[] }[];
  format?: (n: number) => string;
  className?: string;
}) {
  const stats = useMemo(
    () =>
      groups.map((g) => {
        const s = [...g.values].sort((a, b) => a - b);
        const q1 = quantile(s, 0.25);
        const med = quantile(s, 0.5);
        const q3 = quantile(s, 0.75);
        const iqr = q3 - q1;
        const loW = s.find((v) => v >= q1 - 1.5 * iqr) ?? s[0];
        const hiW = [...s].reverse().find((v) => v <= q3 + 1.5 * iqr) ?? s[s.length - 1];
        const outliers = s.filter((v) => v < loW || v > hiW);
        return { label: g.label, q1, med, q3, loW, hiW, outliers, n: s.length };
      }),
    [groups],
  );
  const all = groups.flatMap((g) => g.values);
  const { lo, hi, ticks } = niceDomain(Math.min(...all, 0), Math.max(...all), 5);
  const pct = (v: number) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className={cn("relative min-w-0", className)}>
      <div className="grid grid-cols-[minmax(80px,140px)_1fr] gap-x-3">
        <span />
        <div className="relative mb-1 h-4 text-[10.5px] tabular-nums text-muted">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
              {format(t)}
            </span>
          ))}
        </div>
        {stats.map((s, i) => (
          <div key={s.label} className="contents">
            <span className="flex h-9 items-center truncate text-[12.5px] text-ink-soft">{s.label}</span>
            <div
              className="relative h-9"
              role="img"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              aria-label={`${s.label}: mediana ${format(s.med)}, 50% entre ${format(s.q1)} e ${format(s.q3)}`}
            >
              {ticks.map((t) => (
                <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-chart-grid" style={{ left: pct(t), background: "var(--ds-chart-grid)" }} />
              ))}
              <span aria-hidden className="absolute top-1/2 h-px bg-ink-soft" style={{ left: pct(s.loW), width: `calc(${pct(s.hiW)} - ${pct(s.loW)})` }} />
              <span aria-hidden className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-soft" style={{ left: pct(s.loW) }} />
              <span aria-hidden className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-soft" style={{ left: pct(s.hiW) }} />
              <span
                aria-hidden
                className="absolute top-1/2 h-5 -translate-y-1/2 rounded-[3px] border border-ink/70"
                style={{ left: pct(s.q1), width: `calc(${pct(s.q3)} - ${pct(s.q1)})`, background: "color-mix(in oklab, var(--ds-chart-1) 14%, var(--ds-surface))" }}
              />
              <span aria-hidden className="absolute top-1/2 h-5 w-[2px] -translate-y-1/2 bg-ink" style={{ left: pct(s.med) }} />
              {s.outliers.map((o, k) => (
                <span key={k} aria-hidden className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-soft" style={{ left: pct(o) }} />
              ))}
              {active === i && (
                <ChartTooltip
                  title={`${s.label} · ${s.n} itens`}
                  rows={[
                    { label: "Máximo", value: format(s.hiW) },
                    { label: "Q3", value: format(s.q3) },
                    { label: "Mediana", value: format(s.med) },
                    { label: "Q1", value: format(s.q1) },
                    { label: "Mínimo", value: format(s.loW) },
                  ]}
                  style={{ left: pct(s.q3), top: 36, marginLeft: 8 }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Histogram                                                           */
/* ------------------------------------------------------------------ */

/** Frequência por faixa. Bins automáticos (regra de Sturges) ou fixos. */
export function Histogram({
  values,
  bins,
  format = (n) => formatNumber(n),
  label,
  height = 220,
  className,
}: {
  values: number[];
  bins?: number;
  format?: (n: number) => string;
  label: string;
  height?: number;
  className?: string;
}) {
  const data = useMemo<ChartDatum[]>(() => {
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const k = bins ?? Math.max(4, Math.ceil(Math.log2(values.length) + 1));
    const raw = (max - min) / k || 1;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
    const start = Math.floor(min / step) * step;
    const n = Math.ceil((max - start) / step) || 1;
    const counts = new Array(n).fill(0);
    values.forEach((v) => counts[Math.min(n - 1, Math.floor((v - start) / step))]++);
    return counts.map((c, i) => ({ faixa: `${format(start + i * step)}–${format(start + (i + 1) * step)}`, qtd: c }));
  }, [values, bins, format]);
  return <BarChart className={className} label={label} data={data} index="faixa" series={[{ key: "qtd", label: "Quantidade" }]} height={height} />;
}

/* ------------------------------------------------------------------ */
/* PunchCard                                                           */
/* ------------------------------------------------------------------ */

/** Dia × hora com bolinhas de área proporcional. Mais legível que heatmap com poucos dados. */
export function PunchCard({
  rows,
  columns,
  values,
  format = (n) => formatNumber(n),
  className,
}: {
  rows: string[];
  columns: string[];
  values: number[][];
  format?: (n: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...values.flat());
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)} tabIndex={0} role="region" aria-label="Distribuição por dia e hora">
      <div className="inline-grid items-center gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `auto repeat(${columns.length}, 32px)` }}>
        <span />
        {columns.map((c) => (
          <span key={c} className="text-center text-[10.5px] text-muted">
            {c}
          </span>
        ))}
        {rows.map((r, ri) => (
          <div key={r} className="contents">
            <span className="pr-2 text-[12px] text-ink-soft">{r}</span>
            {columns.map((c, ci) => {
              const v = values[ri]?.[ci] ?? 0;
              const d = v ? 5 + Math.sqrt(v / max) * 21 : 0;
              return (
                <span key={c} className="grid h-8 place-items-center" title={`${r} · ${c}: ${format(v)}`}>
                  {v ? <span className="rounded-full" style={{ width: d, height: d, background: `color-mix(in oklab, var(--ds-chart-1) ${Math.round(35 + (v / max) * 65)}%, transparent)` }} /> : <span className="h-1 w-1 rounded-full bg-line" />}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BumpChart                                                           */
/* ------------------------------------------------------------------ */

/** Posição no ranking ao longo do tempo (1 no topo). Destaque de uma série no hover. */
export function BumpChart({
  periods,
  series,
  height = 240,
  className,
}: {
  periods: string[];
  /** ranks[i] = posição (1 = primeiro) no período i. */
  series: { label: string; ranks: number[]; color?: string }[];
  height?: number;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);
  const n = Math.max(...series.flatMap((s) => s.ranks));
  const left = 28;
  const right = 120;
  const top = 12;
  const bottom = 24;
  const x = (i: number) => left + (periods.length <= 1 ? 0 : (i * (width - left - right)) / (periods.length - 1));
  const y = (r: number) => top + ((r - 1) / Math.max(1, n - 1)) * (height - top - bottom);
  return (
    <div ref={ref} className={cn("relative min-w-0", className)} style={{ height }} role="img" aria-label={series.map((s) => `${s.label}: ${s.ranks.map((r) => `${r}º`).join(" → ")}`).join("; ")}>
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          {Array.from({ length: n }, (_, i) => (
            <text key={i} x={0} y={y(i + 1)} dy="0.32em" className="fill-muted text-[11px] tabular-nums">
              {i + 1}º
            </text>
          ))}
          {periods.map((p, i) => (
            <text key={p} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
              {p}
            </text>
          ))}
          {series.map((s, si) => {
            const color = s.color ?? chartColor(si);
            const dim = active && active !== s.label;
            const pts = s.ranks.map((r, i) => `${x(i)},${y(r)}`).join(" ");
            return (
              <g key={s.label} opacity={dim ? 0.15 : 1} onPointerEnter={() => setActive(s.label)} onPointerLeave={() => setActive(null)} className="transition-opacity duration-150">
                <polyline points={pts} fill="none" stroke={color} strokeWidth={active === s.label ? 3.5 : 2.5} strokeLinejoin="round" strokeLinecap="round" />
                {s.ranks.map((r, i) => (
                  <circle key={i} cx={x(i)} cy={y(r)} r={4.5} fill="var(--ds-surface)" stroke={color} strokeWidth={2} />
                ))}
                <text x={x(periods.length - 1) + 10} y={y(s.ranks[s.ranks.length - 1])} dy="0.32em" className="fill-ink text-[12px] font-medium">
                  {s.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pareto                                                              */
/* ------------------------------------------------------------------ */

/**
 * Causas ordenadas (barras) + % acumulado (linha). A linha dos 80 % mostra
 * quais poucas causas explicam a maior parte (reclamações, devoluções, perdas).
 */
export function ParetoChart({
  items,
  format = (n) => formatNumber(n),
  height = 260,
  className,
}: {
  items: { label: string; value: number }[];
  format?: (n: number) => string;
  height?: number;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, i) => s + i.value, 0) || 1;
  let acc = 0;
  const rows = sorted.map((i) => {
    acc += i.value;
    return { ...i, cum: acc / total };
  });
  const { hi, ticks } = niceDomain(0, sorted[0]?.value ?? 1, 4);
  const m = { top: 10, right: 40, bottom: 44, left: 40 };
  const innerW = Math.max(0, width - m.left - m.right);
  const innerH = height - m.top - m.bottom;
  const band = rows.length ? innerW / rows.length : 0;
  const x = (i: number) => m.left + band * (i + 0.5);
  const yL = (v: number) => m.top + innerH - (v / (hi || 1)) * innerH;
  const yR = (f: number) => m.top + innerH - f * innerH;
  const vital = rows.findIndex((r) => r.cum >= 0.8);
  return (
    <div className={cn("min-w-0", className)}>
      <ChartLegend className="mb-3" items={[{ label: "Ocorrências", color: "var(--ds-chart-1)" }, { label: "% acumulado", color: "var(--ds-accent)" }]} />
      <div ref={ref} className="relative" style={{ height }} role="img" aria-label={`Pareto: ${vital + 1} de ${rows.length} causas somam 80% (${rows.slice(0, vital + 1).map((r) => r.label).join(", ")})`}>
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0" aria-hidden onPointerLeave={() => setActive(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={m.left} x2={width - m.right} y1={yL(t)} y2={yL(t)} stroke="var(--ds-chart-grid)" />
                <text x={m.left - 8} y={yL(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {format(t)}
                </text>
              </g>
            ))}
            {[0, 0.5, 0.8, 1].map((f) => (
              <text key={f} x={width - m.right + 6} y={yR(f)} dy="0.32em" className={cn("text-[11px] tabular-nums", f === 0.8 ? "fill-accent-deep font-medium" : "fill-muted")}>
                {Math.round(f * 100)}%
              </text>
            ))}
            <line x1={m.left} x2={width - m.right} y1={yR(0.8)} y2={yR(0.8)} stroke="var(--ds-accent)" strokeDasharray="3 3" />
            {rows.map((r, i) => (
              <g key={r.label} onPointerEnter={() => setActive(i)}>
                <rect x={m.left + band * i} y={m.top} width={band} height={innerH} fill={active === i ? "var(--ds-soft)" : "transparent"} />
                <rect x={x(i) - Math.min(band * 0.62, 44) / 2} y={yL(r.value)} width={Math.min(band * 0.62, 44)} height={Math.max(0, yL(0) - yL(r.value))} rx={3} fill="var(--ds-chart-1)" opacity={i <= vital ? 0.95 : 0.35} />
                <text x={x(i)} y={height - m.bottom + 16} textAnchor="middle" className="fill-muted text-[11px]">
                  {r.label.length > Math.max(4, Math.floor(band / 6.5)) ? `${r.label.slice(0, Math.max(3, Math.floor(band / 6.5) - 1))}…` : r.label}
                </text>
              </g>
            ))}
            <polyline points={rows.map((r, i) => `${x(i)},${yR(r.cum)}`).join(" ")} fill="none" stroke="var(--ds-accent)" strokeWidth={2} strokeLinejoin="round" />
            {rows.map((r, i) => (
              <circle key={i} cx={x(i)} cy={yR(r.cum)} r={3} fill="var(--ds-surface)" stroke="var(--ds-accent)" strokeWidth={2} />
            ))}
          </svg>
        )}
        {active != null && rows[active] && (
          <ChartTooltip
            title={rows[active].label}
            rows={[
              { label: "Ocorrências", value: format(rows[active].value) },
              { label: "Participação", value: formatPercent(rows[active].value / total) },
              { label: "Acumulado", value: formatPercent(rows[active].cum) },
            ]}
            style={{ top: 0, left: Math.min(x(active) + 12, width - 190) }}
          />
        )}
      </div>
      {vital >= 0 && (
        <p className="m-0 mt-2 text-[12px] text-muted">
          <span className="font-medium text-ink">{vital + 1} de {rows.length}</span> causas explicam 80 % das ocorrências.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RadialBars                                                          */
/* ------------------------------------------------------------------ */

/** 2–5 metas em anéis concêntricos (atingimento por time, uso por recurso). */
export function RadialBars({
  items,
  size = 200,
  className,
  center,
}: {
  /** value em 0–100 (% da meta). */
  items: { label: string; value: number; color?: string; hint?: ReactNode }[];
  size?: number;
  className?: string;
  center?: ReactNode;
}) {
  const stroke = Math.max(8, Math.min(14, size / (items.length * 3.6)));
  const gap = 4;
  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={items.map((i) => `${i.label} ${Math.round(i.value)}%`).join(", ")}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          {items.map((it, i) => {
            const r = size / 2 - stroke / 2 - i * (stroke + gap);
            const c = 2 * Math.PI * r;
            const color = it.color ?? chartColor(i);
            const v = Math.max(0, Math.min(100, it.value));
            return (
              <g key={it.label}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ds-soft)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} className="transition-[stroke-dasharray] duration-500" />
              </g>
            );
          })}
        </svg>
        {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color ?? chartColor(i) }} />
            <span className="text-ink-soft">{it.label}</span>
            <span className="font-semibold tabular-nums">{Math.round(it.value)}%</span>
            {it.hint && <span className="text-[12px] text-muted">{it.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
