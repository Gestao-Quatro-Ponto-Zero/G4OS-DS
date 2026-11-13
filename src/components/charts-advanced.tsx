"use client";

import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { useReducedMotion } from "../lib/motion";
import { useReadableFills } from "../lib/readable";
import { quantizeScale, sequentialColor } from "../lib/scale";
import { ChartLegend, ChartTooltip, chartColor, niceDomain, niceRange, SrTable, useElementWidth, type ChartDatum, type ChartSeries } from "./charts";
import { AxisBreak, ScaleLegend } from "./charts-kit";

/*
 * Gráficos avançados, mesmas regras de charts.tsx. Qual usar (docs/fundamentos/dados.md):
 *   composição hierárquica ........ Treemap
 *   ponte entre dois totais ........ WaterfallChart (DRE, variação de caixa)
 *   correlação / segmentação ....... ScatterChart (com bolha = 3ª dimensão)
 *   perfil em vários critérios ..... RadarChart (scorecard de candidato, fornecedor)
 *   um número contra faixas ........ GaugeChart (compacto) · BulletChart (em lista)
 *   fluxos entre etapas ............ SankeyChart (origem → etapa → resultado)
 *   intensidade em 2 dimensões ..... HeatmapMatrix (coorte, hora × dia)
 *   volume + taxa no mesmo tempo ... ComboChart (barras + linha em eixo próprio)
 *   partes de 100 % numa linha ..... ProportionBar
 *   cronograma ...................... GanttChart
 */

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/* ------------------------------------------------------------------ */
/* Treemap (squarified)                                                */
/* ------------------------------------------------------------------ */

export type TreemapItem = { label: string; value: number; color?: string; hint?: ReactNode };
type Rect = { x: number; y: number; w: number; h: number };

function squarify(values: number[], rect: Rect): Rect[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const area = rect.w * rect.h;
  const scaled = values.map((v) => (v / total) * area);
  const out: Rect[] = new Array(values.length);
  let { x, y, w, h } = rect;
  let i = 0;
  const worst = (row: number[], side: number) => {
    const s = row.reduce((a, b) => a + b, 0);
    const max = Math.max(...row);
    const min = Math.min(...row);
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  };
  while (i < scaled.length) {
    const side = Math.min(w, h);
    const row = [scaled[i]];
    let j = i + 1;
    while (j < scaled.length && worst([...row, scaled[j]], side) <= worst(row, side)) {
      row.push(scaled[j]);
      j++;
    }
    const s = row.reduce((a, b) => a + b, 0);
    const thick = s / side;
    let off = 0;
    row.forEach((v, k) => {
      const len = v / thick;
      out[i + k] = w >= h ? { x, y: y + off, w: thick, h: len } : { x: x + off, y, w: len, h: thick };
      off += len;
    });
    if (w >= h) {
      x += thick;
      w -= thick;
    } else {
      y += thick;
      h -= thick;
    }
    i = j;
  }
  return out;
}

/**
 * Composição por área (estoque por categoria, receita por produto, gasto por
 * centro de custo). Maior no canto superior esquerdo. Rótulo só onde cabe;
 * o resto aparece no hover. Tons de ink por padrão (ordem = tamanho).
 */
export function Treemap({
  items,
  height = 280,
  format = (n) => formatNumber(n),
  label = "Composição",
  colorful = false,
  className,
}: {
  items: TreemapItem[];
  height?: number;
  format?: (n: number) => string;
  label?: string;
  /** true = paleta chart-1…6; false = tons de ink (mais sóbrio). */
  colorful?: boolean;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const sorted = useMemo(() => [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value), [items]);
  const total = sorted.reduce((s, i) => s + i.value, 0) || 1;
  const rects = useMemo(() => (width ? squarify(sorted.map((i) => i.value), { x: 0, y: 0, w: width, h: height }) : []), [sorted, width, height]);
  // Rampa monocromática sem a faixa do meio (35–70 %), onde nem texto claro nem escuro chega a 4,5:1.
  const shade = (i: number) => {
    const t = sorted.length > 1 ? i / (sorted.length - 1) : 0;
    return t < 0.5 ? 0.92 - t * 0.4 : 0.34 - (t - 0.5) * 0.44;
  };
  const fill = (it: TreemapItem, i: number) => it.color ?? (colorful ? chartColor(i) : `color-mix(in oklab, var(--ds-ink) ${Math.round(shade(i) * 100)}%, transparent)`);
  useReadableFills(ref, [rects.length, colorful, items]);
  return (
    <div ref={ref} className={cn("relative min-w-0", className)} style={{ height }} role="img" aria-label={`${label}: ${sorted.map((i) => `${i.label} ${format(i.value)}`).join(", ")}`}>
      {rects.map((r, i) => {
        const it = sorted[i];
        const fits = r.w > 64 && r.h > 34;
        return (
          <div
            key={it.label}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            data-fill=""
            className="absolute overflow-hidden rounded-md p-2 transition-opacity duration-150"
            style={{ left: r.x + 1, top: r.y + 1, width: Math.max(0, r.w - 2), height: Math.max(0, r.h - 2), background: fill(it, i), opacity: active == null || active === i ? 1 : 0.6 }}
          >
            {fits && (
              <>
                <div className="truncate text-[12px] font-medium leading-tight">{it.label}</div>
                <div className="truncate text-[11.5px] tabular-nums">{format(it.value)}</div>
              </>
            )}
          </div>
        );
      })}
      {active != null && rects[active] && (
        <ChartTooltip
          title={sorted[active].label}
          rows={[
            { label: "Valor", value: format(sorted[active].value) },
            { label: "Participação", value: formatPercent(sorted[active].value / total) },
          ]}
          style={{ left: Math.min(rects[active].x + 8, width - 180), top: Math.min(rects[active].y + 8, height - 70) }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Waterfall                                                           */
/* ------------------------------------------------------------------ */

export type WaterfallStep = { label: string; value: number; kind?: "delta" | "total" };

const EASE = "cubic-bezier(0.2, 0, 0, 1)";

/**
 * Ponte entre um valor inicial e um final (receita bruta → lucro líquido;
 * caixa inicial → final; MRR de início → fim). `kind: "total"` desenha a barra
 * cheia a partir da base (subtotais). Positivo = ok, negativo = rose,
 * total = ink. Quando os dados mudam (troca de período), as barras mudam de
 * altura e posição; nada anima na entrada.
 */
export function WaterfallChart({
  steps,
  height = 260,
  format = (n) => formatNumber(n),
  formatAxis,
  label = "Ponte de valores",
  axisBreak = false,
  connectors = true,
  showValues = true,
  selected,
  onSelect,
  className,
}: {
  steps: WaterfallStep[];
  height?: number;
  format?: (n: number) => string;
  formatAxis?: (n: number) => string;
  label?: string;
  /**
   * Eixo truncado (exceção da regra do zero): começa perto do menor valor, com
   * a marca de quebra no eixo e na base de cada barra de total. Use quando
   * início e fim são grandes e os movimentos pequenos (ponte de MRR, de caixa).
   * `{ min }` fixa onde o eixo começa. A tabela de leitor de tela mantém os valores reais.
   */
  axisBreak?: boolean | { min: number };
  /** Linhas tracejadas ligando o topo de uma barra ao início da seguinte. Padrão: true. */
  connectors?: boolean;
  /** Valor escrito junto da barra (acima dos aumentos e totais, abaixo das quedas). Padrão: true. */
  showValues?: boolean;
  /** Barra selecionada (índice). Com `onSelect`, as barras viram botões: setas percorrem, Enter seleciona, Esc solta; o preenchimento das outras esmaece (os valores seguem legíveis). */
  selected?: number | null;
  /** Clique ou Enter numa barra (índice), ou null ao soltar. */
  onSelect?: (index: number | null) => void;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const bars = useMemo(() => {
    let run = 0;
    return steps.map((s) => {
      if (s.kind === "total") {
        run = s.value;
        return { ...s, from: 0, to: s.value };
      }
      const from = run;
      run += s.value;
      return { ...s, from, to: run };
    });
  }, [steps]);
  const broken = !!axisBreak;
  const breakMin = typeof axisBreak === "object" ? axisBreak.min : null;
  const { lo, hi, ticks } = useMemo(() => {
    if (!broken) {
      const all = bars.flatMap((b) => [b.from, b.to]);
      return niceDomain(Math.min(...all, 0), Math.max(...all, 0), 4);
    }
    // Eixo truncado: ignora o zero das barras de total e começa perto do menor valor.
    const vals = bars.flatMap((b) => (b.kind === "total" ? [b.to] : [b.from, b.to]));
    const vMin = Math.min(...vals);
    const vMax = Math.max(...vals);
    // Folga embaixo: o menor total fica a ~1/3 da altura, legível como barra.
    const floor = Math.max(vMin >= 0 ? 0 : -Infinity, vMin - (vMax - vMin) * 0.6);
    const r = niceRange(floor, vMax, 4, 0.06);
    if (breakMin != null && Number.isFinite(breakMin) && breakMin < vMin) {
      const step = r.ticks.length > 1 ? r.ticks[1] - r.ticks[0] : 1;
      const out: number[] = [];
      for (let v = Math.ceil(breakMin / step) * step; v <= r.hi + step / 2; v += step) out.push(Number(v.toPrecision(12)));
      return { lo: breakMin, hi: r.hi, ticks: out };
    }
    return r;
  }, [bars, broken, breakMin]);
  const axis = formatAxis ?? format;
  const left = Math.min(64, Math.max(28, Math.max(...ticks.map((t) => axis(t).length)) * 6.4 + 10)) + (broken ? 4 : 0);
  const m = { top: 18, bottom: 24 };
  const innerW = Math.max(0, width - left - 8);
  const innerH = height - m.top - m.bottom;
  const base = m.top + innerH;
  const y = (v: number) => Math.min(base, m.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH);
  const band = bars.length ? innerW / bars.length : 0;
  const bw = Math.min(band * 0.64, 56);
  // Faixa estreita (celular): só a barra em foco ou selecionada leva o valor escrito.
  const roomy = band >= 64;
  const interactive = !!onSelect;
  const sel = selected ?? null;
  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${format(Math.abs(v))}`;
  const grow = reduced ? undefined : `y 320ms ${EASE}, height 320ms ${EASE}, opacity 160ms linear`;
  const slide = reduced ? undefined : `transform 320ms ${EASE}, opacity 160ms linear`;
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: bars.length - 1 };
    if (e.key in next) {
      e.preventDefault();
      buttons.current[Math.max(0, Math.min(bars.length - 1, next[e.key]))]?.focus();
    } else if (e.key === "Escape" && sel != null) {
      e.preventDefault();
      onSelect?.(null);
    }
  };
  const tabStop = sel != null && sel < bars.length ? sel : 0;
  return (
    <div ref={ref} className={cn("relative min-w-0", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden onPointerLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width - 8} y1={y(t)} y2={y(t)} stroke={t === 0 && !broken ? "var(--ds-line)" : "var(--ds-chart-grid)"} />
              <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {axis(t)}
              </text>
            </g>
          ))}
          {broken && (
            <>
              <line x1={left} x2={width - 8} y1={base} y2={base} stroke="var(--ds-line)" />
              <AxisBreak x={left + 7} y={base - 4} width={10} />
            </>
          )}
          {bars.map((b, i) => {
            const cx = left + band * (i + 0.5);
            const color = b.kind === "total" ? "var(--ds-ink)" : b.value >= 0 ? "var(--ds-ok)" : "var(--ds-rose)";
            const top = Math.min(y(b.from), y(b.to));
            const bottom = Math.max(y(b.from), y(b.to));
            const h = Math.max(1, bottom - top);
            const dim = sel != null && sel !== i;
            const below = b.kind !== "total" && b.value < 0;
            const ty = below ? Math.min(bottom + 13, base - 3) : top - 5;
            const tx = roomy || (i > 0 && i < bars.length - 1) ? cx : i === 0 ? cx - bw / 2 : cx + bw / 2;
            return (
              <g key={i} onPointerEnter={() => setActive(i)}>
                <rect x={left + band * i} y={m.top} width={band} height={innerH} fill={active === i ? "var(--ds-soft)" : "transparent"} />
                {connectors && i < bars.length - 1 && (
                  <line
                    x1={cx + bw / 2}
                    x2={cx + band - bw / 2}
                    y1={0}
                    y2={0}
                    stroke="var(--ds-line-strong)"
                    strokeDasharray="2 2"
                    style={{ transform: `translateY(${y(b.to)}px)`, transition: slide }}
                  />
                )}
                <rect
                  x={cx - bw / 2}
                  y={top}
                  width={bw}
                  height={h}
                  rx={3}
                  fill={color}
                  // Com uma barra selecionada só o preenchimento esmaece: total segue em
                  // ink (mais leve, nunca cinza claro), variação vira tom de fundo.
                  opacity={b.kind === "total" ? (dim ? 0.7 : 1) : dim ? 0.35 : 0.85}
                  style={{ y: top, height: h, transition: grow } as CSSProperties}
                />
                {broken && b.kind === "total" && bottom >= base - 0.5 && h > 16 && (
                  <g opacity={dim ? 0.7 : 1}>
                    <AxisBreak x={cx} y={base - 10} width={bw + 2} />
                  </g>
                )}
                {showValues && (roomy || sel === i || active === i) && (
                  <text
                    x={0}
                    y={0}
                    textAnchor={roomy ? "middle" : i === 0 ? "start" : i === bars.length - 1 ? "end" : "middle"}
                    style={{ transform: `translate(${tx}px, ${ty}px)`, transition: slide }}
                    className={cn("text-[10.5px] font-medium tabular-nums", dim ? "fill-ink-soft" : b.kind === "total" ? "fill-ink" : b.value >= 0 ? "fill-ok" : "fill-rose")}
                  >
                    {b.kind === "total" ? format(b.value) : signed(b.value)}
                  </text>
                )}
                <text x={cx} y={height - 6} textAnchor="middle" className={cn("text-[11px]", sel === i ? "fill-ink font-medium" : "fill-muted")}>
                  {b.label.length > Math.floor(band / 6.2) ? `${b.label.slice(0, Math.max(3, Math.floor(band / 6.2) - 1))}…` : b.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {interactive && width > 0 && (
        <div role="group" aria-label={label} className="absolute inset-0" onPointerLeave={() => setActive(null)}>
          {bars.map((b, i) => (
            <button
              key={i}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              tabIndex={i === tabStop ? 0 : -1}
              aria-pressed={sel === i}
              aria-label={`${b.label}: ${b.kind === "total" ? format(b.value) : `${signed(b.value)}, acumulado ${format(b.to)}`}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => onSelect?.(sel === i ? null : i)}
              onKeyDown={(e) => onKey(e, i)}
              className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-muted/40"
              style={{ left: left + band * i, top: m.top - 4, width: band, height: innerH + m.bottom + 4 }}
            />
          ))}
        </div>
      )}
      <SrTable label={label} data={steps.map((s) => ({ etapa: s.label, valor: s.value }))} index="etapa" series={[{ key: "valor", label: "Valor" }]} format={format} />
      {active != null && bars[active] && (
        <ChartTooltip
          title={bars[active].label}
          rows={[
            { label: bars[active].kind === "total" ? "Total" : "Variação", value: bars[active].kind === "total" ? format(bars[active].value) : signed(bars[active].value) },
            ...(bars[active].kind === "total" ? [] : [{ label: "Acumulado", value: format(bars[active].to) }]),
          ]}
          style={{ top: 0, left: Math.max(0, Math.min(left + band * active + band / 2 + 10, width - 170)) }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scatter / bolhas                                                    */
/* ------------------------------------------------------------------ */

export type ScatterPoint = { id: string; label: string; x: number; y: number; size?: number; group?: string };

/**
 * Correlação entre duas medidas (ticket × ciclo de venda; salário × tempo de
 * casa). `size` vira bolha. `groups` colore por segmento. Linhas de média
 * opcionais dividem em quadrantes.
 */
export function ScatterChart({
  points,
  xLabel,
  yLabel,
  height = 280,
  formatX = (n) => formatNumber(n),
  formatY = (n) => formatNumber(n),
  groups,
  quadrants = false,
  label = "Dispersão",
  className,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  height?: number;
  formatX?: (n: number) => string;
  formatY?: (n: number) => string;
  groups?: string[];
  /** Linhas de média em X e Y. */
  quadrants?: boolean;
  label?: string;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);
  const gx = niceDomain(Math.min(0, ...points.map((p) => p.x)), Math.max(0, ...points.map((p) => p.x)), 5);
  const gy = niceDomain(Math.min(0, ...points.map((p) => p.y)), Math.max(0, ...points.map((p) => p.y)), 4);
  const maxSize = Math.max(1, ...points.map((p) => p.size ?? 0));
  const left = Math.min(64, Math.max(28, Math.max(...gy.ticks.map((t) => formatY(t).length)) * 6.4 + 10));
  const m = { top: 10, right: 12, bottom: 40 };
  const innerW = Math.max(0, width - left - m.right);
  const innerH = height - m.top - m.bottom;
  const sx = (v: number) => left + ((v - gx.lo) / (gx.hi - gx.lo || 1)) * innerW;
  const sy = (v: number) => m.top + innerH - ((v - gy.lo) / (gy.hi - gy.lo || 1)) * innerH;
  const r = (p: ScatterPoint) => (p.size ? 4 + Math.sqrt(p.size / maxSize) * 16 : 4.5);
  const color = (p: ScatterPoint) => chartColor(groups && p.group ? Math.max(0, groups.indexOf(p.group)) : 0);
  const avgX = points.reduce((s, p) => s + p.x, 0) / (points.length || 1);
  const avgY = points.reduce((s, p) => s + p.y, 0) / (points.length || 1);
  const act = points.find((p) => p.id === active);
  return (
    <div className={cn("min-w-0", className)}>
      {groups && groups.length > 1 && <ChartLegend className="mb-3" items={groups.map((g, i) => ({ label: g, color: chartColor(i) }))} />}
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            {gy.ticks.map((t) => (
              <g key={`y${t}`}>
                <line x1={left} x2={width - m.right} y1={sy(t)} y2={sy(t)} stroke="var(--ds-chart-grid)" />
                <text x={left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {formatY(t)}
                </text>
              </g>
            ))}
            {gx.ticks.map((t) => (
              <text key={`x${t}`} x={sx(t)} y={m.top + innerH + 16} textAnchor="middle" className="fill-muted text-[11px] tabular-nums">
                {formatX(t)}
              </text>
            ))}
            <text x={left + innerW / 2} y={height - 4} textAnchor="middle" className="fill-muted text-[11px] font-medium">
              {xLabel}
            </text>
            <text x={12} y={m.top + innerH / 2} textAnchor="middle" transform={`rotate(-90 12 ${m.top + innerH / 2})`} className="fill-muted text-[11px] font-medium">
              {yLabel}
            </text>
            {quadrants && (
              <g stroke="var(--ds-accent)" strokeDasharray="3 3">
                <line x1={sx(avgX)} x2={sx(avgX)} y1={m.top} y2={m.top + innerH} />
                <line x1={left} x2={width - m.right} y1={sy(avgY)} y2={sy(avgY)} />
              </g>
            )}
            {points.map((p) => (
              <circle
                key={p.id}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={r(p)}
                fill={color(p)}
                fillOpacity={p.size ? 0.28 : 0.85}
                stroke={color(p)}
                strokeWidth={active === p.id ? 2 : 1}
                opacity={active && active !== p.id ? 0.4 : 1}
                onPointerEnter={() => setActive(p.id)}
                onPointerLeave={() => setActive(null)}
                className="transition-opacity duration-150"
              />
            ))}
          </svg>
        )}
        {act && (
          <ChartTooltip
            title={act.label}
            rows={[
              { label: xLabel, value: formatX(act.x) },
              { label: yLabel, value: formatY(act.y) },
              ...(act.group ? [{ label: "Grupo", value: act.group }] : []),
            ]}
            style={{ left: Math.min(sx(act.x) + 12, width - 180), top: Math.max(0, sy(act.y) - 70) }}
          />
        )}
        <SrTable label={label} data={points.map((p) => ({ nome: p.label, x: p.x, y: p.y }))} index="nome" series={[{ key: "x", label: xLabel }, { key: "y", label: yLabel }]} format={(n) => formatNumber(n, 2)} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Radar                                                               */
/* ------------------------------------------------------------------ */

/**
 * Perfil em 3–8 critérios na mesma escala (scorecard de entrevista,
 * avaliação de fornecedor, maturidade). Até 3 séries (candidato × vaga ideal).
 * Variantes: grade "polygon" | "circle", `gridFill`, `fill={false}` (só linhas),
 * `dots`, `radiusAxis` (valores dos anéis), `axisValues` (valor da série 1 junto
 * ao nome do eixo), legenda e tooltip por eixo no hover.
 */
export function RadarChart({
  axes,
  series,
  max = 5,
  size = 300,
  label = "Perfil",
  grid = "polygon",
  gridFill = false,
  rings = 4,
  fill = true,
  dots = true,
  radiusAxis = false,
  axisValues = false,
  legend,
  format = (n: number) => formatNumber(n, 1),
  className,
}: {
  axes: string[];
  series: { label: string; values: number[]; color?: string; dashed?: boolean }[];
  max?: number;
  /** Tamanho máximo; encolhe para caber no contêiner. */
  size?: number;
  label?: string;
  grid?: "polygon" | "circle" | "none";
  /** Anel externo preenchido com soft. */
  gridFill?: boolean;
  rings?: number;
  /** false = só contorno (comparar perfis sem sobrepor manchas). */
  fill?: boolean;
  dots?: boolean;
  radiusAxis?: boolean;
  axisValues?: boolean;
  legend?: boolean;
  format?: (n: number) => string;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const S = Math.max(180, Math.min(size, width || size));
  const c = S / 2;
  // Margem para os rótulos dos eixos, proporcional ao tamanho (cards pequenos não encolhem o radar).
  const pad = Math.min(axisValues ? 74 : 62, S * (axisValues ? 0.24 : 0.2));
  const radius = Math.max(30, c - pad);
  const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * radius * (v / max), c + Math.sin(angle(i)) * radius * (v / max)];
  const levels = Array.from({ length: rings }, (_, k) => (k + 1) / rings);
  const colorOf = (s: (typeof series)[number], i: number) => s.color ?? chartColor(i);
  const showLegend = legend ?? series.length > 1;
  return (
    <div ref={ref} className={cn("relative flex min-w-0 flex-col items-center", className)}>
      <svg
        width={S}
        height={S}
        role="img"
        aria-label={`${label}: ${series.map((s) => `${s.label} — ${axes.map((a, i) => `${a} ${s.values[i]}`).join(", ")}`).join("; ")}`}
        className="max-w-full overflow-visible"
        onPointerLeave={() => setHover(null)}
      >
        {grid !== "none" &&
          levels.map((r, k) =>
            grid === "circle" ? (
              <circle key={r} cx={c} cy={c} r={radius * r} fill={gridFill && k === levels.length - 1 ? "var(--ds-soft)" : "none"} stroke="var(--ds-line)" />
            ) : (
              <polygon key={r} points={axes.map((_, i) => pt(i, max * r).join(",")).join(" ")} fill={gridFill && k === levels.length - 1 ? "var(--ds-soft)" : "none"} stroke="var(--ds-line)" />
            ),
          )}
        {gridFill && grid !== "none" && (
          // anéis por cima do preenchimento
          <g>{levels.slice(0, -1).map((r) => (grid === "circle" ? <circle key={r} cx={c} cy={c} r={radius * r} fill="none" stroke="var(--ds-line)" /> : <polygon key={r} points={axes.map((_, i) => pt(i, max * r).join(",")).join(" ")} fill="none" stroke="var(--ds-line)" />))}</g>
        )}
        {axes.map((a, i) => {
          const [x, y] = pt(i, max);
          const [lx, ly] = pt(i, max * 1.17);
          const anchor = Math.abs(lx - c) < 4 ? "middle" : lx > c ? "start" : "end";
          return (
            <g key={a} onPointerEnter={() => setHover(i)}>
              <line x1={c} y1={c} x2={x} y2={y} stroke={hover === i ? "var(--ds-line-strong)" : "var(--ds-line)"} />
              <circle cx={x} cy={y} r={radius * 0.18} fill="transparent" />
              <text x={lx} y={ly} dy={axisValues ? "-0.15em" : "0.32em"} textAnchor={anchor} className={cn("text-[12px]", hover === i ? "fill-ink font-medium" : "fill-ink-soft")}>
                {a}
              </text>
              {axisValues && series[0] && (
                <text x={lx} y={ly} dy="1.05em" textAnchor={anchor} className="fill-ink text-[12px] font-semibold tabular-nums">
                  {format(series[0].values[i] ?? 0)}
                </text>
              )}
            </g>
          );
        })}
        {radiusAxis &&
          levels.map((r) => (
            <text key={r} x={c + 4} y={c - radius * r} dy="-0.2em" className="fill-muted text-[10.5px] tabular-nums">
              {format(max * r)}
            </text>
          ))}
        {series.map((s, si) => {
          const color = colorOf(s, si);
          const pts = axes.map((_, i) => pt(i, Math.max(0, Math.min(max, s.values[i] ?? 0))));
          return (
            <g key={s.label}>
              <polygon
                points={pts.map((p) => p.join(",")).join(" ")}
                fill={color}
                fillOpacity={s.dashed || !fill ? 0 : series.length > 1 ? 0.12 : 0.18}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "4 3" : undefined}
                strokeLinejoin="round"
              />
              {dots && !s.dashed && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 4.5 : 3} fill={color} stroke="var(--ds-surface)" strokeWidth={1.5} />)}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <ChartTooltip
          title={axes[hover]}
          rows={series.map((s, si) => ({ label: s.label, value: format(s.values[hover] ?? 0), color: colorOf(s, si), dashed: s.dashed }))}
          style={{ top: 8, left: "50%", transform: "translateX(-50%)" }}
        />
      )}
      {showLegend && <ChartLegend className="mt-2" align="center" items={series.map((s, i) => ({ label: s.label, color: colorOf(s, i), dashed: s.dashed }))} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gauge                                                               */
/* ------------------------------------------------------------------ */

/**
 * Um número contra faixas (NPS, SLA, uso do plano, atingimento de meta).
 * Semicírculo; faixas opcionais em tons semânticos suaves. Use pouco: um por
 * card, nunca uma grade de gauges (prefira BulletChart em lista).
 */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  format = (n) => formatNumber(n),
  bands,
  size = 220,
  caption,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  format?: (n: number) => string;
  /** Faixas até `to`: [{ to: 0, tone: "bad", label: "Crítica" }, { to: 50, tone: "warn" }, { to: 100, tone: "ok" }] */
  bands?: { to: number; tone: "ok" | "warn" | "bad" | "neutral"; label?: string }[];
  size?: number;
  caption?: ReactNode;
}) {
  const stroke = 12;
  const ring = 4; // anel externo das faixas
  const pad = 10;
  const r = size / 2 - pad - ring - 4;
  const cx = size / 2;
  const cy = r + pad + ring + 4;
  const h = cy + stroke / 2 + 20; // espaço para mín/máx abaixo das pontas
  const frac = (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min || 1)));
  const pt = (f: number, radius: number) => [cx - Math.cos(Math.PI * f) * radius, cy - Math.sin(Math.PI * f) * radius];
  // Semicírculo: nunca passa de 180°, large-arc = 0.
  const arc = (a: number, b: number, radius: number) => {
    const [x1, y1] = pt(a, radius);
    const [x2, y2] = pt(b, radius);
    return `M${x1},${y1} A${radius},${radius} 0 0 1 ${x2},${y2}`;
  };
  const toneColor = { ok: "var(--ds-ok)", warn: "var(--ds-amber)", bad: "var(--ds-rose)", neutral: "var(--ds-line-strong)" };
  const band = bands?.find((b) => value <= b.to) ?? bands?.[bands.length - 1];
  const color = band ? toneColor[band.tone] : "var(--ds-primary)";
  const f = frac(value);
  const [mx, my] = pt(f, r);
  let prev = min;
  const segments = (bands ?? []).map((b) => {
    const seg = { from: frac(prev), to: frac(b.to), tone: b.tone, label: b.label };
    prev = b.to;
    return seg;
  });
  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: h }}>
        <svg width={size} height={h} role="meter" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-label={`${label}: ${format(value)}${band?.label ? `, ${band.label}` : ""}`} className="absolute inset-0 overflow-visible">
          {/* trilho */}
          <path d={arc(0, 1, r)} fill="none" stroke="var(--ds-soft)" strokeWidth={stroke} strokeLinecap="round" />
          {/* valor */}
          {f > 0 && <path d={arc(0, Math.max(0.004, f), r)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />}
          {/* faixas: anel fino por fora, com respiro entre elas */}
          {segments.map((sgm, i) => (
            <path
              key={i}
              d={arc(sgm.from + (i ? 0.006 : 0), sgm.to - (i < segments.length - 1 ? 0.006 : 0), r + stroke / 2 + ring + 1)}
              fill="none"
              stroke={toneColor[sgm.tone]}
              strokeOpacity={band && sgm.tone === band.tone && value <= (bands![i].to) && (i === 0 || value > bands![i - 1].to) ? 0.9 : 0.35}
              strokeWidth={ring}
            />
          ))}
          {/* marcador do valor */}
          <circle cx={mx} cy={my} r={stroke / 2 + 2.5} fill="var(--ds-surface)" stroke={color} strokeWidth={3} />
        </svg>
        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ top: cy - r * 0.62 }}>
          <span className="text-[28px] font-semibold leading-none tabular-nums tracking-tight">{format(value)}</span>
          {band?.label && (
            <span className="mt-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium" style={{ color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}>
              {band.label}
            </span>
          )}
        </div>
        <span className="absolute bottom-0 text-[11px] tabular-nums text-muted" style={{ left: cx - r - stroke / 2, transform: "translateX(-10%)" }}>
          {format(min)}
        </span>
        <span className="absolute bottom-0 text-[11px] tabular-nums text-muted" style={{ right: cx - r - stroke / 2, transform: "translateX(10%)" }}>
          {format(max)}
        </span>
      </div>
      <div className="mt-2 text-center text-[12px] text-muted">{caption ?? label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bullet                                                              */
/* ------------------------------------------------------------------ */

/**
 * Realizado × meta com faixas qualitativas, numa linha. Ideal em lista
 * (meta por vendedor, orçamento por centro de custo). Mais denso que gauge.
 */
export function BulletChart({
  label,
  value,
  target,
  max,
  ranges = [0.6, 0.9],
  format = (n) => formatNumber(n),
  hint,
  goodWhen = "up",
}: {
  label: string;
  value: number;
  target: number;
  max?: number;
  /** Limites das faixas como fração da meta (ruim < 0,6 ≤ ok < 0,9 ≤ bom). */
  ranges?: [number, number];
  format?: (n: number) => string;
  hint?: ReactNode;
  /** "down" para custo/orçamento: ficar abaixo da meta é bom; estourar 10 % é rose. */
  goodWhen?: "up" | "down";
}) {
  const top = max ?? Math.max(value, target) * 1.15;
  const pct = (v: number) => `${Math.min(100, (v / (top || 1)) * 100)}%`;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(96px,160px)_1fr_auto] sm:gap-y-0" role="meter" aria-label={`${label}: ${format(value)} de ${format(target)}`} aria-valuenow={value} aria-valuemin={0} aria-valuemax={top}>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">{label}</div>
        {hint && <div className="truncate text-[11.5px] text-muted">{hint}</div>}
      </div>
      {/* No celular a barra ganha linha própria (rótulo e valor em cima). */}
      <div className="relative order-last col-span-2 h-5 overflow-hidden rounded bg-soft sm:order-none sm:col-span-1">
        <span className="absolute inset-y-0 left-0 bg-line/70" style={{ width: pct(target * ranges[1]) }} />
        <span className="absolute inset-y-0 left-0 bg-line" style={{ width: pct(target * ranges[0]) }} />
        <span className={cn("absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-r-sm", goodWhen === "down" ? (value <= target ? "bg-ok" : value <= target * 1.1 ? "bg-amber" : "bg-rose") : value >= target ? "bg-ok" : value >= target * ranges[1] ? "bg-ink" : "bg-amber")} style={{ width: pct(value) }} />
        <span aria-hidden className="absolute inset-y-[3px] w-[2px] rounded bg-ink" style={{ left: pct(target) }} />
      </div>
      <div className="text-right text-[12.5px] tabular-nums sm:w-24">
        <span className="font-semibold">{format(value)}</span>
        <span className="text-muted"> / {format(target)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sankey                                                              */
/* ------------------------------------------------------------------ */

export type SankeyNode = {
  id: string;
  label: string;
  column: number;
  /** Cor do nó e das faixas que chegam nele (ex.: perda em `var(--ds-chart-6)`, meta em `var(--ds-ok)`). Sem cor, a faixa herda a cor da origem. */
  color?: string;
};
export type SankeyLink = { source: string; target: string; value: number };

/** Todas as faixas que chegam (para trás, recursivamente) e saem (para frente) de um nó. */
function sankeyTrace(id: string, links: SankeyLink[]) {
  const linkSet = new Set<number>();
  const nodeSet = new Set<string>([id]);
  const walk = (start: string, dir: "up" | "down") => {
    const stack = [start];
    const seen = new Set<string>([start]);
    while (stack.length) {
      const cur = stack.pop()!;
      links.forEach((l, i) => {
        const hit = dir === "up" ? l.target === cur : l.source === cur;
        if (!hit) return;
        linkSet.add(i);
        const next = dir === "up" ? l.source : l.target;
        nodeSet.add(next);
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      });
    }
  };
  walk(id, "up");
  walk(id, "down");
  return { linkSet, nodeSet };
}

/**
 * Fluxos entre etapas (origem do lead → etapa → ganho/perdido; visita →
 * conta → plano). Nós em colunas fixas, largura da faixa = volume.
 * Até ~5 colunas e ~20 nós; mais que isso vira espaguete. Passar o mouse
 * (ou selecionar, com `onSelect`) num nó traça tudo o que chega e sai dele.
 */
export function SankeyChart({
  nodes,
  links,
  height = 300,
  format = (n) => formatNumber(n),
  label = "Fluxo",
  columnLabels,
  nodeLabels = "side",
  selected,
  onSelect,
  minWidth,
  className,
}: {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
  format?: (n: number) => string;
  label?: string;
  /** Rótulo de cada coluna, embaixo ("Visita", "Conta", "Plano"). */
  columnLabels?: string[];
  /** "side": nome e valor à direita do nó. "above": nome e "valor · %" (sobre o total da 1ª coluna) acima do nó. */
  nodeLabels?: "side" | "above";
  /** Nó selecionado (id): traça os fluxos que chegam e saem dele; o resto esmaece. */
  selected?: string | null;
  /** Com `onSelect`, os nós viram botões: setas percorrem (↑↓ na coluna, ←→ entre colunas), Enter seleciona, Esc solta. */
  onSelect?: (id: string | null) => void;
  /** Largura mínima do desenho. Abaixo dela o gráfico rola dentro do próprio contêiner (nunca a página). */
  minWidth?: number;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const reduced = useReducedMotion();
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const above = nodeLabels === "above";
  const layout = useMemo(() => {
    const cols = Math.max(...nodes.map((n) => n.column)) + 1;
    const nodeW = above ? 8 : 10;
    const topPad = above ? 30 : 0;
    const bottomPad = columnLabels?.length ? 24 : 0;
    const plotH = Math.max(40, height - topPad - bottomPad);
    const pad = above ? 40 : 10;
    const labelSpace = above ? 0 : 110;
    const usableW = Math.max(0, width - labelSpace);
    const value = new Map<string, number>();
    nodes.forEach((n) => {
      const out = links.filter((l) => l.source === n.id).reduce((s, l) => s + l.value, 0);
      const inn = links.filter((l) => l.target === n.id).reduce((s, l) => s + l.value, 0);
      value.set(n.id, Math.max(out, inn));
    });
    const colTotals = Array.from({ length: cols }, (_, c) => nodes.filter((n) => n.column === c).reduce((s, n) => s + (value.get(n.id) ?? 0), 0));
    const colCounts = Array.from({ length: cols }, (_, c) => nodes.filter((n) => n.column === c).length);
    const k = Math.max(0, Math.min(...colTotals.map((t, c) => (plotH - pad * (colCounts[c] - 1)) / (t || 1))));
    const pos = new Map<string, { x: number; y: number; h: number; outY: number; inY: number }>();
    for (let c = 0; c < cols; c++) {
      const colNodes = nodes.filter((n) => n.column === c);
      const used = colNodes.reduce((s, n) => s + (value.get(n.id) ?? 0) * k, 0) + pad * (colNodes.length - 1);
      // Rótulos acima: colunas alinhadas no topo (lê-se a queda de volume). Ao lado: centradas.
      let y = above ? topPad : (plotH - used) / 2;
      colNodes.forEach((n) => {
        const h = Math.max(2, (value.get(n.id) ?? 0) * k);
        pos.set(n.id, { x: cols === 1 ? 0 : (c * (usableW - nodeW)) / (cols - 1), y, h, outY: y, inY: y });
        y += h + pad;
      });
    }
    const paths = links.map((l, i) => {
      const s = pos.get(l.source)!;
      const t = pos.get(l.target)!;
      const w = l.value * k;
      const y0 = s.outY + w / 2;
      const y1 = t.inY + w / 2;
      s.outY += w;
      t.inY += w;
      const x0 = s.x + nodeW;
      const x1 = t.x;
      const mx = (x0 + x1) / 2;
      return { ...l, i, w, d: `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}` };
    });
    const total = colTotals[0] || 1;
    return { pos, paths, nodeW, value, cols, total, plotBottom: topPad + plotH };
  }, [nodes, links, width, height, above, columnLabels]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const colorOf = (id: string) => {
    const own = byId.get(id)?.color;
    if (own) return own;
    const first = nodes.filter((n) => n.column === 0);
    const idx = first.findIndex((n) => n.id === id);
    return idx >= 0 ? chartColor(idx) : "var(--ds-line-strong)";
  };
  // cada faixa herda a cor da origem na coluna 0 (ou a cor própria do destino)
  const rootOf = (id: string, depth = 0): string => {
    const incoming = links.find((l) => l.target === id);
    return incoming && depth < 50 ? rootOf(incoming.source, depth + 1) : id;
  };
  const linkColor = (l: SankeyLink) => byId.get(l.target)?.color ?? colorOf(rootOf(l.source));
  const active = hover ?? selected ?? null;
  const trace = useMemo(() => (active ? sankeyTrace(active, links) : null), [active, links]);
  const interactive = !!onSelect;
  const ease = "cubic-bezier(0.2, 0, 0, 1)";
  const morph = reduced ? undefined : `d 360ms ${ease}, stroke-width 360ms ${ease}, stroke-opacity 150ms linear`;
  const grow = reduced ? undefined : `y 360ms ${ease}, height 360ms ${ease}, opacity 150ms linear`;
  const slide = reduced ? undefined : `transform 360ms ${ease}, opacity 150ms linear`;
  const pctOf = (id: string) => formatPercent((layout.value.get(id) ?? 0) / layout.total, 0);
  const nodeText = (n: SankeyNode) => `${n.label}: ${format(layout.value.get(n.id) ?? 0)}${above ? ` (${pctOf(n.id)})` : ""}`;

  const move = (n: SankeyNode, key: string) => {
    const col = nodes.filter((x) => x.column === n.column);
    const i = col.indexOf(n);
    let target: SankeyNode | undefined;
    if (key === "ArrowDown") target = col[i + 1];
    else if (key === "ArrowUp") target = col[i - 1];
    else {
      const c = n.column + (key === "ArrowRight" ? 1 : -1);
      const p = layout.pos.get(n.id)!;
      const mid = p.y + p.h / 2;
      target = nodes
        .filter((x) => x.column === c)
        .sort((a, b) => {
          const pa = layout.pos.get(a.id)!;
          const pb = layout.pos.get(b.id)!;
          return Math.abs(pa.y + pa.h / 2 - mid) - Math.abs(pb.y + pb.h / 2 - mid);
        })[0];
    }
    if (target) buttons.current.get(target.id)?.focus();
  };
  const tabStop = selected && byId.has(selected) ? selected : nodes[0]?.id;

  const chart = (
    <div
      ref={ref}
      className={cn("relative min-w-0", !minWidth && className)}
      style={{ height, minWidth }}
      role={interactive ? "group" : "img"}
      aria-label={
        interactive
          ? label
          : `${label}: ${links.map((l) => `${byId.get(l.source)?.label} → ${byId.get(l.target)?.label}: ${format(l.value)}`).join("; ")}`
      }
    >
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0" aria-hidden>
          {columnLabels?.map((c, i) => {
            if (i >= layout.cols) return null;
            const x = layout.cols === 1 ? 0 : (i * (width - (above ? 0 : 110) - layout.nodeW)) / (layout.cols - 1);
            const last = i === layout.cols - 1 && above;
            return (
              <g key={i}>
                <line x1={x + layout.nodeW / 2} x2={x + layout.nodeW / 2} y1={above ? 30 : 0} y2={layout.plotBottom + 4} stroke="var(--ds-chart-grid)" />
                <text x={last ? x + layout.nodeW : x} y={height - 6} textAnchor={last ? "end" : "start"} className="fill-muted text-[11px]">
                  {c}
                </text>
              </g>
            );
          })}
          {layout.paths.map((p) => {
            const on = trace ? trace.linkSet.has(p.i) : null;
            return (
              <path
                key={p.i}
                d={p.d}
                fill="none"
                stroke={linkColor(p)}
                strokeOpacity={on == null ? 0.22 : on ? 0.5 : 0.06}
                strokeWidth={Math.max(1, p.w)}
                style={{ d: `path("${p.d}")`, strokeWidth: Math.max(1, p.w), transition: morph } as CSSProperties}
              />
            );
          })}
          {nodes.map((n) => {
            const p = layout.pos.get(n.id)!;
            const last = n.column === layout.cols - 1;
            const dim = trace ? !trace.nodeSet.has(n.id) : false;
            const fill = n.color ?? (n.column === 0 ? colorOf(n.id) : "var(--ds-ink)");
            return (
              <g key={n.id} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)} opacity={dim ? 0.35 : 1} style={{ transition: reduced ? undefined : "opacity 150ms linear" }}>
                <rect x={p.x} y={p.y} width={layout.nodeW} height={p.h} rx={2} fill={fill} style={{ y: p.y, height: p.h, transition: grow } as CSSProperties} />
                {above ? (
                  <g style={{ transform: `translate(${last ? p.x + layout.nodeW : p.x}px, ${p.y}px)`, transition: slide }}>
                    <text x={0} y={-18} textAnchor={last ? "end" : "start"} className={cn("fill-ink text-[11.5px]", n.id === selected && "font-semibold")}>
                      {n.label}
                    </text>
                    <text x={0} y={-5} textAnchor={last ? "end" : "start"} className="fill-muted text-[11px] tabular-nums">
                      {format(layout.value.get(n.id) ?? 0)} · {pctOf(n.id)}
                    </text>
                  </g>
                ) : (
                  <text x={p.x + layout.nodeW + 6} y={p.y + p.h / 2} dy="0.32em" className="fill-ink text-[11.5px]">
                    {n.label}
                    <tspan className="fill-muted tabular-nums"> {format(layout.value.get(n.id) ?? 0)}</tspan>
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {interactive && width > 0 && (
        <>
          {nodes.map((n) => {
            const p = layout.pos.get(n.id)!;
            const last = n.column === layout.cols - 1;
            const w = above ? 96 : layout.nodeW + 8;
            const left = above ? (last ? p.x + layout.nodeW - w + 4 : p.x - 4) : p.x - 4;
            const top = above ? p.y - 32 : p.y - 2;
            return (
              <button
                key={n.id}
                ref={(el) => {
                  buttons.current.set(n.id, el);
                }}
                type="button"
                tabIndex={n.id === tabStop ? 0 : -1}
                aria-pressed={selected === n.id}
                aria-label={nodeText(n)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect?.(selected === n.id ? null : n.id)}
                onKeyDown={(e) => {
                  if (e.key.startsWith("Arrow")) {
                    e.preventDefault();
                    move(n, e.key);
                  } else if (e.key === "Escape" && selected != null) {
                    e.preventDefault();
                    onSelect?.(null);
                  }
                }}
                className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-muted/40"
                style={{ left, top, width: w, height: Math.max(16, p.h + (top < p.y ? p.y - top : 0) + 4) }}
              />
            );
          })}
          <SrTable
            label={label}
            data={links.map((l) => ({ fluxo: `${byId.get(l.source)?.label} → ${byId.get(l.target)?.label}`, valor: l.value }))}
            index="fluxo"
            series={[{ key: "valor", label: "Volume" }]}
            format={format}
          />
        </>
      )}
    </div>
  );
  if (!minWidth) return chart;
  return (
    <div className={cn("min-w-0 overflow-x-auto overscroll-x-contain", className)} tabIndex={interactive ? undefined : 0} role={interactive ? undefined : "region"} aria-label={interactive ? undefined : label}>
      {chart}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HeatmapMatrix                                                       */
/* ------------------------------------------------------------------ */

/**
 * Intensidade → opacidade da cor. Monotônica, mas salta a faixa do meio
 * (40–72 %), onde nenhuma cor de texto atinge 4,5:1 sobre o preenchimento.
 */

/**
 * Intensidade em duas dimensões: coorte × mês (retenção), dia × hora
 * (picos de atendimento), vendedor × etapa. Uma cor, 5+ níveis contínuos
 * (ou degraus com `scale`), valor escrito na célula quando cabe. Células com
 * valor são focáveis: setas percorrem, o tooltip mostra o valor. `null` =
 * célula vazia (triângulo de coorte).
 */
export function HeatmapMatrix({
  rows,
  columns,
  values,
  format = (n) => formatNumber(n),
  max,
  tone = "ink",
  showValues = true,
  label = "Matriz",
  cell = 36,
  rowMeta,
  rowMetaLabel,
  rowsLabel,
  summaryRow,
  scale,
  legend = false,
  legendTitle,
  valueLabel = "Valor",
  className,
}: {
  rows: string[];
  columns: string[];
  /** values[linha][coluna]; null = sem dado (célula vazia, sem fundo). */
  values: (number | null)[][];
  format?: (n: number) => string;
  max?: number;
  tone?: "ink" | "accent" | "ok" | "info";
  showValues?: boolean;
  label?: string;
  cell?: number;
  /** Coluna extra depois do rótulo de cada linha (tamanho da coorte, total). */
  rowMeta?: ReactNode[];
  /** Cabeçalho da coluna de `rowMeta` ("Espaços"). */
  rowMetaLabel?: string;
  /** Cabeçalho da coluna de rótulos ("Coorte"). */
  rowsLabel?: string;
  /** Linha de resumo separada no fim ("Média"), pintada na mesma escala. */
  summaryRow?: { label: string; values: (number | null)[]; meta?: ReactNode };
  /** Escala em degraus (`quantizeScale`): `steps` faixas sobre `domain` exatamente como dado ([0.2, 0.8] em 6 → 20, 30… 70 %) ou, sem `domain`, faixas de limites redondos sobre o mínimo e o máximo dos dados. */
  scale?: { steps: number; domain?: [number, number] };
  /** Legenda da escala acima da matriz. `true` desenha o `ScaleLegend` ligado (passar o mouse num degrau destaca as células daquela faixa); um nó substitui a legenda. */
  legend?: boolean | ReactNode;
  /** Título curto da legenda ("% retido"). */
  legendTitle?: string;
  /** Rótulo do valor no tooltip ("Retidos"). */
  valueLabel?: string;
  className?: string;
}) {
  const grid = useMemo(() => (summaryRow ? [...values, summaryRow.values] : values), [values, summaryRow]);
  const rowNames = summaryRow ? [...rows, summaryRow.label] : rows;
  const nums = grid.flat().filter((v): v is number => v != null && Number.isFinite(v));
  const top = max ?? Math.max(1, ...nums);
  const q = useMemo(() => {
    if (!scale) return null;
    const lo = nums.length ? Math.min(...nums) : 0;
    const hi = nums.length ? Math.max(...nums) : 1;
    // Domínio explícito vale como está; sem domínio, limites "redondos" a partir dos dados.
    return scale.domain ? quantizeScale(scale.domain, scale.steps, { nice: false }) : quantizeScale([lo, hi], scale.steps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale?.steps, scale?.domain?.[0], scale?.domain?.[1], grid]);
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const [tip, setTip] = useState<{ r: number; c: number; x: number; y: number; below: boolean } | null>(null);
  const firstCell = (() => {
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < columns.length; c++) if (grid[r]?.[c] != null) return { r, c };
    return { r: 0, c: 0 };
  })();
  const [focus, setFocus] = useState<{ r: number; c: number } | null>(null);
  const cur = focus && grid[focus.r]?.[focus.c] != null ? focus : firstCell;
  const host = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const cells = useRef(new Map<string, HTMLTableCellElement | null>());
  useReadableFills(box, [values, summaryRow, tone, top, q?.steps]);
  const fillOf = (v: number) => {
    if (q) return sequentialColor(q.level(v), tone);
    // Mesma escala da legenda (ScaleLegend contínua): uma fonte de cor só.
    return sequentialColor(Math.max(0, Math.min(1, v / top)), tone);
  };
  const has = (r: number, c: number) => grid[r]?.[c] != null;
  const nextCell = (r: number, c: number, key: string) => {
    const lastCol = columns.length - 1;
    if (key === "ArrowRight") for (let j = c + 1; j <= lastCol; j++) if (has(r, j)) return { r, c: j };
    if (key === "ArrowLeft") for (let j = c - 1; j >= 0; j--) if (has(r, j)) return { r, c: j };
    if (key === "ArrowDown") for (let i = r + 1; i < grid.length; i++) if (has(i, c)) return { r: i, c };
    if (key === "ArrowUp") for (let i = r - 1; i >= 0; i--) if (has(i, c)) return { r: i, c };
    if (key === "Home") for (let j = 0; j <= lastCol; j++) if (has(r, j)) return { r, c: j };
    if (key === "End") for (let j = lastCol; j >= 0; j--) if (has(r, j)) return { r, c: j };
    return null;
  };
  const showTip = (r: number, c: number, el: HTMLElement) => {
    const h = host.current;
    if (!h) return;
    const hr = h.getBoundingClientRect();
    const cr = el.getBoundingClientRect();
    const x = Math.max(70, Math.min(hr.width - 70, cr.left - hr.left + cr.width / 2));
    const below = cr.top - hr.top < 64;
    setTip({ r, c, x, y: below ? cr.bottom - hr.top + 6 : cr.top - hr.top - 6, below });
  };
  const legendNode =
    legend === true ? (
      q ? (
        <ScaleLegend thresholds={q.thresholds} max={q.domain[1]} tone={tone} format={format} title={legendTitle} activeBin={hoverBin} onHoverBin={setHoverBin} />
      ) : (
        <ScaleLegend thresholds={[0, top]} mode="continuous" tone={tone} format={format} title={legendTitle} />
      )
    ) : legend || null;
  const renderCells = (r: number, rowName: string) =>
    columns.map((c, ci) => {
      const v = grid[r]?.[ci];
      if (v == null) return <td key={c} style={{ height: cell * 0.8, minWidth: cell }} />;
      const dim = hoverBin != null && q != null && q.bin(v) !== hoverBin;
      const isStop = cur.r === r && cur.c === ci;
      return (
        <td
          key={c}
          ref={(el) => {
            cells.current.set(`${r}:${ci}`, el);
          }}
          tabIndex={isStop ? 0 : -1}
          data-fill=""
          aria-label={`${rowName} · ${c}: ${format(v)}`}
          onMouseEnter={(e) => showTip(r, ci, e.currentTarget)}
          onMouseLeave={() => setTip(null)}
          onFocus={(e) => {
            setFocus({ r, c: ci });
            showTip(r, ci, e.currentTarget);
          }}
          onBlur={() => setTip(null)}
          onKeyDown={(e) => {
            const n = nextCell(r, ci, e.key);
            if (n || e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") e.preventDefault();
            if (n) cells.current.get(`${n.r}:${n.c}`)?.focus();
            if (e.key === "Escape") setTip(null);
          }}
          className="rounded-[4px] text-center tabular-nums outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-muted/40 motion-reduce:transition-none"
          style={{ height: cell * 0.8, minWidth: cell, background: fillOf(v), opacity: dim ? 0.18 : 1 }}
        >
          {showValues ? format(v) : <span className="sr-only">{format(v)}</span>}
        </td>
      );
    });
  const tipValue = tip ? grid[tip.r]?.[tip.c] : null;
  return (
    <div ref={host} className={cn("relative flex min-w-0 flex-col gap-3", className)}>
      {legendNode}
      <div ref={box} className="min-w-0 overflow-x-auto" role="region" aria-label={label}>
        <table className="border-separate text-[11.5px]" style={{ borderSpacing: 2 }} aria-label={label}>
          <thead>
            <tr>
              <th scope="col" className="pb-1 pr-2 text-left text-[11px] font-normal text-muted">
                {rowsLabel ?? <span className="sr-only">Linha</span>}
              </th>
              {rowMeta && (
                <th scope="col" className="pb-1 pr-3 text-right text-[11px] font-normal text-muted">
                  {rowMetaLabel ?? <span className="sr-only">Detalhe</span>}
                </th>
              )}
              {columns.map((c) => (
                <th key={c} scope="col" className="px-1 pb-1 text-center font-normal text-muted" style={{ minWidth: cell }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r}>
                <th scope="row" className="whitespace-nowrap pr-2 text-left font-normal text-ink-soft">
                  {r}
                </th>
                {rowMeta && <td className="whitespace-nowrap pr-3 text-right tabular-nums text-muted">{rowMeta[ri]}</td>}
                {renderCells(ri, r)}
              </tr>
            ))}
            {summaryRow && (
              <>
                <tr aria-hidden>
                  <td colSpan={columns.length + (rowMeta ? 2 : 1)} className="h-1.5 p-0" />
                </tr>
                <tr>
                  <th scope="row" className="whitespace-nowrap pr-2 text-left font-medium text-ink">
                    {summaryRow.label}
                  </th>
                  {rowMeta && <td className="whitespace-nowrap pr-3 text-right font-medium tabular-nums text-ink-soft">{summaryRow.meta}</td>}
                  {renderCells(rows.length, summaryRow.label)}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      {tip && tipValue != null && (
        <ChartTooltip
          title={`${rowNames[tip.r]} · ${columns[tip.c]}`}
          rows={[{ label: valueLabel, value: format(tipValue) }]}
          style={{ left: tip.x, top: tip.y, transform: `translate(-50%, ${tip.below ? "0" : "-100%"})` }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RetentionCurves                                                     */
/* ------------------------------------------------------------------ */

/**
 * Curvas de retenção por coorte: uma linha por coorte (as recentes mais
 * escuras), a média em destaque. Responde "as coortes novas retêm melhor que
 * as antigas?". Mesmo dado do HeatmapMatrix em triângulo, outra leitura.
 * Setas ←→ percorrem os meses, ↑↓ as coortes; o tooltip mostra o valor.
 */
export function RetentionCurves({
  rows,
  columns,
  average,
  format = (n) => formatPercent(n, 0),
  formatAxis,
  height = 280,
  label,
  className,
}: {
  /** Uma linha por coorte, da mais antiga para a mais recente. `null` = mês ainda não alcançado. */
  rows: { label: string; values: (number | null)[] }[];
  /** Rótulo de cada ponto do eixo X ("1", "2"… meses desde o cadastro). */
  columns: string[];
  /** Curva média, desenhada em destaque. */
  average?: { label?: string; values: (number | null)[] };
  format?: (n: number) => string;
  formatAxis?: (n: number) => string;
  height?: number;
  /** Nome acessível (obrigatório): o que as curvas respondem. */
  label: string;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [pt, setPt] = useState<{ r: number; c: number } | null>(null);
  const series = average ? [...rows, { label: average.label ?? "Média", values: average.values }] : rows;
  const avgIndex = average ? rows.length : -1;
  const all = series.flatMap((s) => s.values).filter((v): v is number => v != null);
  // Taxa: o eixo não precisa começar em zero (docs/fundamentos/dados.md, regra 2); a escala diz onde começa.
  const { lo, hi, ticks } = all.length ? niceRange(Math.min(...all), Math.max(...all), 4, 0.06) : niceDomain(0, 1, 4);
  const axis = formatAxis ?? format;
  const left = Math.min(56, Math.max(28, Math.max(...ticks.map((t) => axis(t).length)) * 6.4 + 10));
  const right = average ? 52 : 12;
  const m = { top: 10, bottom: 24 };
  const innerW = Math.max(0, width - left - right);
  const innerH = height - m.top - m.bottom;
  const x = (c: number) => left + (columns.length > 1 ? (c / (columns.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => m.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH;
  const pathOf = (vals: (number | null)[]) => {
    let d = "";
    let pen = false;
    vals.forEach((v, c) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(c).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const opacityOf = (r: number) => (rows.length <= 1 ? 0.8 : 0.16 + (r / (rows.length - 1)) * 0.66);
  const lastOf = (vals: (number | null)[]) => {
    for (let c = vals.length - 1; c >= 0; c--) if (vals[c] != null) return c;
    return -1;
  };
  const pick = (clientX: number, clientY: number, el: SVGSVGElement) => {
    const b = el.getBoundingClientRect();
    const px = clientX - b.left;
    const py = clientY - b.top;
    const c = Math.max(0, Math.min(columns.length - 1, Math.round(((px - left) / (innerW || 1)) * (columns.length - 1))));
    let best = -1;
    let dist = Infinity;
    series.forEach((s, r) => {
      const v = s.values[c];
      if (v == null) return;
      const d = Math.abs(y(v) - py);
      if (d < dist) {
        dist = d;
        best = r;
      }
    });
    setPt(best >= 0 ? { r: best, c } : null);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const p = pt ?? { r: avgIndex >= 0 ? avgIndex : rows.length - 1, c: 0 };
    const map: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (e.key === "Escape") return setPt(null);
    if (!(e.key in map)) return;
    e.preventDefault();
    const [dr, dc] = map[e.key];
    let r = Math.max(0, Math.min(series.length - 1, p.r + dr));
    let c = Math.max(0, Math.min(columns.length - 1, p.c + dc));
    // Pula para a coorte mais próxima que já tem esse mês.
    if (series[r]?.values[c] == null) {
      if (dc) c = Math.max(0, Math.min(c, lastOf(series[r].values)));
      else {
        let k = r;
        while (k >= 0 && k < series.length && series[k].values[c] == null) k += dr || 1;
        r = k >= 0 && k < series.length ? k : p.r;
      }
    }
    setPt({ r, c });
  };
  const morph = reduced ? undefined : "d 360ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms linear";
  const active = pt ? series[pt.r] : null;
  const activeV = pt && active ? active.values[pt.c] : null;
  const sr = rows.map((s) => Object.fromEntries([["coorte", s.label], ...s.values.map((v, i) => [`m${i}`, v])]) as ChartDatum);
  if (average) sr.push(Object.fromEntries([["coorte", average.label ?? "Média"], ...average.values.map((v, i) => [`m${i}`, v])]) as ChartDatum);
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[12px] text-muted" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            {[0.2, 0.45, 0.8].map((o) => (
              <span key={o} className="h-0.5 w-2.5 rounded-full bg-ink" style={{ opacity: o }} />
            ))}
          </span>
          Coortes (mais escura = mais recente)
        </li>
        {average && (
          <li className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full" style={{ background: "var(--ds-chart-3)" }} />
            {average.label ?? "Média"}
          </li>
        )}
      </ul>
      <div
        ref={ref}
        className="relative min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-muted/40"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${label}. Setas percorrem meses e coortes.`}
        onKeyDown={onKey}
        onBlur={() => setPt(null)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            aria-hidden
            onPointerMove={(e) => pick(e.clientX, e.clientY, e.currentTarget)}
            onPointerLeave={() => setPt(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={t === lo ? "var(--ds-line)" : "var(--ds-chart-grid)"} />
                <text x={left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {axis(t)}
                </text>
              </g>
            ))}
            {columns.map((c, i) => (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
                {c}
              </text>
            ))}
            {rows.map((s, r) => {
              const d = pathOf(s.values);
              const on = pt?.r === r;
              return (
                <path
                  key={s.label}
                  d={d}
                  fill="none"
                  stroke="var(--ds-chart-1)"
                  strokeWidth={on ? 2.25 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={pt ? (on ? 1 : opacityOf(r) * 0.45) : opacityOf(r)}
                  style={{ d: `path("${d}")`, transition: morph } as CSSProperties}
                />
              );
            })}
            {average &&
              (() => {
                const d = pathOf(average.values);
                const lc = lastOf(average.values);
                return (
                  <g>
                    <path d={d} fill="none" stroke="var(--ds-chart-3)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" style={{ d: `path("${d}")`, transition: morph } as CSSProperties} />
                    {lc >= 0 && (
                      <text x={x(lc) + 8} y={y(average.values[lc] as number)} dy="0.32em" className="fill-ink text-[11px] font-medium">
                        {average.label ?? "Média"}
                      </text>
                    )}
                  </g>
                );
              })()}
            {pt && activeV != null && (
              <g>
                <line x1={x(pt.c)} x2={x(pt.c)} y1={m.top} y2={m.top + innerH} stroke="var(--ds-line-strong)" strokeDasharray="2 3" />
                <circle cx={x(pt.c)} cy={y(activeV)} r={4} fill="var(--ds-surface)" stroke={pt.r === avgIndex ? "var(--ds-chart-3)" : "var(--ds-chart-1)"} strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {pt && active && activeV != null && (
          <ChartTooltip
            title={active.label}
            rows={[
              { label: `Mês ${columns[pt.c]}`, value: format(activeV) },
              ...(average && pt.r !== avgIndex && average.values[pt.c] != null ? [{ label: average.label ?? "Média", value: format(average.values[pt.c] as number) }] : []),
            ]}
            style={{ top: 0, left: Math.max(0, Math.min(x(pt.c) + 12, width - 170)) }}
          />
        )}
        <div className="sr-only" aria-live="polite">
          {pt && active && activeV != null ? `${active.label}, mês ${columns[pt.c]}: ${format(activeV)}` : ""}
        </div>
      </div>
      <SrTable label={label} data={sr} index="coorte" series={columns.map((c, i) => ({ key: `m${i}`, label: `Mês ${c}` }))} format={format} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Combo (barras + linha)                                              */
/* ------------------------------------------------------------------ */

/**
 * Volume em barras (eixo esquerdo) + taxa em linha (eixo direito): receita
 * e margem, contratações e tempo médio, pedidos e ticket médio.
 */
export function ComboChart({
  data,
  index,
  bar,
  line,
  height = 260,
  formatBar = (n) => formatNumber(n),
  formatLine = (n) => formatNumber(n),
  label,
  className,
}: {
  data: ChartDatum[];
  index: string;
  bar: ChartSeries;
  line: ChartSeries;
  height?: number;
  formatBar?: (n: number) => string;
  formatLine?: (n: number) => string;
  label: string;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const L = niceDomain(0, Math.max(0, ...data.map((d) => num(d[bar.key]))), 4);
  const R = niceDomain(Math.min(0, ...data.map((d) => num(d[line.key]))), Math.max(0, ...data.map((d) => num(d[line.key]))), 4);
  const left = Math.min(64, Math.max(28, Math.max(...L.ticks.map((t) => formatBar(t).length)) * 6.4 + 10));
  const right = Math.min(64, Math.max(28, Math.max(...R.ticks.map((t) => formatLine(t).length)) * 6.4 + 10));
  const m = { top: 8, bottom: 24 };
  const innerW = Math.max(0, width - left - right);
  const innerH = height - m.top - m.bottom;
  const band = data.length ? innerW / data.length : 0;
  const x = (i: number) => left + band * (i + 0.5);
  const yL = (v: number) => m.top + innerH - ((v - L.lo) / (L.hi - L.lo || 1)) * innerH;
  // eixo direito alinhado às mesmas linhas de grade do esquerdo
  const yR = (v: number) => m.top + innerH - ((v - R.lo) / (R.hi - R.lo || 1)) * innerH;
  const bw = Math.min(band * 0.6, 40);
  const lineColor = line.color ?? "var(--ds-accent)";
  const barColor = bar.color ?? "var(--ds-chart-1)";
  const pts = data.map((d, i) => `${x(i)},${yR(num(d[line.key]))}`).join(" ");
  const every = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56))));
  return (
    <div className={cn("min-w-0", className)}>
      <ChartLegend className="mb-3" items={[{ label: bar.label, color: barColor }, { label: line.label, color: lineColor, dashed: false }]} />
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0"
            aria-hidden
            onPointerMove={(e) => {
              const px = e.clientX - e.currentTarget.getBoundingClientRect().left - left;
              setActive(Math.max(0, Math.min(data.length - 1, Math.floor(px / (band || 1)))));
            }}
            onPointerLeave={() => setActive(null)}
          >
            {L.ticks.map((t, i) => (
              <g key={t}>
                <line x1={left} x2={width - right} y1={yL(t)} y2={yL(t)} stroke={t === 0 ? "var(--ds-line)" : "var(--ds-chart-grid)"} />
                <text x={left - 8} y={yL(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {formatBar(t)}
                </text>
                {R.ticks[i] != null && (
                  <text x={width - right + 8} y={yR(R.ticks[i])} dy="0.32em" className="fill-accent-deep text-[11px] tabular-nums">
                    {formatLine(R.ticks[i])}
                  </text>
                )}
              </g>
            ))}
            {active != null && <rect x={left + band * active} y={m.top} width={band} height={innerH} fill="var(--ds-soft)" />}
            {data.map((d, i) => (
              <rect key={i} x={x(i) - bw / 2} y={yL(num(d[bar.key]))} width={bw} height={Math.max(0, yL(0) - yL(num(d[bar.key])))} rx={3} fill={barColor} opacity={active == null || active === i ? 0.9 : 0.5} />
            ))}
            <polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
            {data.map((d, i) => (
              <circle key={i} cx={x(i)} cy={yR(num(d[line.key]))} r={active === i ? 4 : 2.5} fill="var(--ds-surface)" stroke={lineColor} strokeWidth={2} />
            ))}
            {data.map((d, i) =>
              i % every === 0 ? (
                <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
                  {String(d[index] ?? "")}
                </text>
              ) : null,
            )}
          </svg>
        )}
        {active != null && data[active] && (
          <ChartTooltip
            title={String(data[active][index] ?? "")}
            rows={[
              { label: bar.label, value: formatBar(num(data[active][bar.key])), color: barColor },
              { label: line.label, value: formatLine(num(data[active][line.key])), color: lineColor },
            ]}
            style={{ top: 0, left: x(active) > width / 2 ? undefined : x(active) + 14, right: x(active) > width / 2 ? width - x(active) + 14 : undefined }}
          />
        )}
        <SrTable label={label} data={data} index={index} series={[bar, line]} format={(n) => formatNumber(n, 2)} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProportionBar                                                       */
/* ------------------------------------------------------------------ */

/**
 * Uma barra de 100 % dividida em partes, com legenda e percentuais.
 * Status de faturas, distribuição de estágio, mix de canais.
 */
export function ProportionBar({
  items,
  format = (n) => formatNumber(n),
  height = 10,
  legend = true,
  className,
}: {
  items: { label: string; value: number; color?: string }[];
  format?: (n: number) => string;
  height?: number;
  legend?: boolean;
  className?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex w-full gap-[2px] overflow-hidden rounded-full" style={{ height }} role="img" aria-label={items.map((i) => `${i.label} ${formatPercent(i.value / total, 0)}`).join(", ")}>
        {items.map((it, i) =>
          it.value > 0 ? <span key={it.label} title={`${it.label}: ${format(it.value)}`} style={{ flexGrow: it.value, background: it.color ?? chartColor(i) }} /> : null,
        )}
      </div>
      {legend && (
        <ul className="mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[12px]">
          {items.map((it, i) => (
            <li key={it.label} className="inline-flex items-center gap-1.5 text-muted">
              <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: it.color ?? chartColor(i) }} />
              {it.label}
              <span className="font-medium tabular-nums text-ink">{format(it.value)}</span>
              <span className="tabular-nums">{formatPercent(it.value / total, 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gantt                                                               */
/* ------------------------------------------------------------------ */

export type GanttTask = { id: string; label: string; start: string; end: string; progress?: number; group?: string; tone?: "neutral" | "accent" | "ok" | "warn" | "bad"; milestone?: boolean };

/**
 * Cronograma: tarefas no tempo com progresso e marco. Linha de "hoje" em
 * dourado. Datas ISO (AAAA-MM-DD). Para ≤ 30 linhas; acima, agrupe.
 */
export function GanttChart({ tasks, today = new Date(), label = "Cronograma", className }: { tasks: GanttTask[]; today?: Date; label?: string; className?: string }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const d = (s: string) => new Date(`${s}T00:00:00`).getTime();
  const min = Math.min(...tasks.map((t) => d(t.start)));
  const max = Math.max(...tasks.map((t) => d(t.end))) + 86400000;
  const labelW = Math.min(200, Math.max(120, width * 0.26));
  const innerW = Math.max(0, width - labelW);
  const x = (t: number) => labelW + ((t - min) / (max - min || 1)) * innerW;
  const months: { t: number; label: string }[] = [];
  const cur = new Date(min);
  cur.setDate(1);
  while (cur.getTime() < max) {
    if (cur.getTime() >= min) months.push({ t: cur.getTime(), label: cur.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") });
    cur.setMonth(cur.getMonth() + 1);
  }
  const tone = { neutral: "bg-ink", accent: "bg-accent", ok: "bg-ok", warn: "bg-amber", bad: "bg-rose" };
  const tx = today.getTime();
  return (
    <div ref={ref} className={cn("relative min-w-0 overflow-hidden rounded-xl border border-line bg-surface", className)} role="table" aria-label={label}>
      <div className="relative h-8 border-b border-line bg-soft/60 text-[11px] text-muted" role="row">
        <span className="absolute left-3 top-2" role="columnheader">
          Tarefa
        </span>
        {width > 0 &&
          months.map((m) => (
            <span key={m.t} className="absolute top-2 border-l border-line pl-1.5" style={{ left: x(m.t) }}>
              {m.label}
            </span>
          ))}
      </div>
      {width > 0 && tx >= min && tx <= max && <span aria-hidden className="absolute bottom-0 top-8 z-[1] w-px bg-accent" style={{ left: x(tx) }} title="Hoje" />}
      {tasks.map((t) => {
        const a = x(d(t.start));
        const b = x(d(t.end) + 86400000);
        return (
          <div key={t.id} role="row" className="relative flex h-10 items-center border-b border-line last:border-b-0">
            <div role="cell" className="truncate px-3 text-[12.5px]" style={{ width: labelW }}>
              {t.label}
              {t.group && <span className="ml-1.5 text-[11px] text-muted">{t.group}</span>}
            </div>
            {width > 0 &&
              (t.milestone ? (
                <span role="cell" aria-label={`${t.label}: marco em ${new Date(d(t.start)).toLocaleDateString("pt-BR")}`} className="absolute h-3 w-3 rotate-45 rounded-[2px] bg-accent" style={{ left: a - 6 }} />
              ) : (
                <span
                  role="cell"
                  aria-label={`${t.label}: ${new Date(d(t.start)).toLocaleDateString("pt-BR")} a ${new Date(d(t.end)).toLocaleDateString("pt-BR")}${t.progress != null ? `, ${t.progress}%` : ""}`}
                  className="absolute h-5 overflow-hidden rounded-md bg-line"
                  style={{ left: a, width: Math.max(6, b - a) }}
                  title={`${t.label} · ${t.progress ?? 0}%`}
                >
                  <span className={cn("block h-full opacity-90", tone[t.tone ?? "neutral"])} style={{ width: `${t.progress ?? 0}%` }} />
                </span>
              ))}
          </div>
        );
      })}
    </div>
  );
}
