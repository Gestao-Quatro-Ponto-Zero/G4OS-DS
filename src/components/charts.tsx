"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber, formatPercent } from "../lib/format";
import { DsLink } from "./primitives";

/*
 * Gráficos em SVG puro, sem dependência. Regras (docs/fundamentos/dados.md):
 *   · série 1 = ink (o número que importa); comparação = chart-2; até 6 séries
 *   · grade horizontal clara, sem eixo vertical desenhado, sem sombra, sem 3D
 *   · valor exato sempre alcançável: tooltip no hover/teclado + tabela sr-only
 *   · eixo Y começa em zero em barras e áreas (nunca "zoom" que exagera)
 *   · cor sozinha nunca carrega significado: legenda ou rótulo direto
 */

export type ChartDatum = Record<string, string | number | null | undefined>;
export type ChartSeries = {
  key: string;
  label: string;
  /** Cor CSS. Padrão: paleta chart-1…6 na ordem das séries. */
  color?: string;
  /** Tracejada: meta, previsão, período anterior. */
  dashed?: boolean;
  /** Ícone na legenda e no tooltip (no lugar do quadradinho de cor). */
  icon?: ComponentType<{ className?: string }>;
};

/** Cor da série i (usa tokens, então acompanha qualquer tema). */
export const chartColor = (i: number) => `var(--ds-chart-${(i % 6) + 1})`;

/* ------------------------------------------------------------------ */
/* Utilidades internas                                                 */
/* ------------------------------------------------------------------ */

/** Largura observada de um elemento (para gráficos responsivos). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Escala "bonita": passos 1 · 2 · 2,5 · 5 · 10 × 10ⁿ, sempre incluindo zero. */
export function niceDomain(min: number, max: number, ticks = 4) {
  const lo0 = Math.min(0, min);
  const hi0 = Math.max(0, max);
  const span = hi0 - lo0 || 1;
  const raw = span / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(lo0 / step) * step;
  const hi = Math.ceil(hi0 / step) * step || step;
  const values: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) values.push(Number(v.toPrecision(12)));
  return { lo, hi, ticks: values };
}

/** Escala "bonita" sem forçar o zero (para linhas de taxa/preço), com folga relativa. */
export function niceRange(min: number, max: number, ticks = 4, pad = 0.08) {
  const span0 = max - min || Math.abs(max) || 1;
  const lo0 = min - span0 * pad;
  const hi0 = max + span0 * pad;
  const raw = (hi0 - lo0) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  // Não cruza o zero à toa: dados positivos não ganham eixo negativo.
  const lo = min >= 0 ? Math.max(0, Math.floor(lo0 / step) * step) : Math.floor(lo0 / step) * step;
  const hi = Math.ceil(hi0 / step) * step;
  const values: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) values.push(Number(v.toPrecision(12)));
  return { lo, hi, ticks: values };
}

/** Curva monotônica (Fritsch–Carlson): suave sem inventar picos entre pontos. */
export function linePath(points: [number, number][], curved: boolean) {
  const n = points.length;
  if (!n) return "";
  if (!curved || n < 3) return `M${points.map((p) => p.join(",")).join("L")}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    m[i] = (points[i + 1][1] - points[i][1]) / (dx[i] || 1);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const h = a * a + b * b;
    if (h > 9) {
      const s = 3 / Math.sqrt(h);
      t[i] = s * a * m[i];
      t[i + 1] = s * b * m[i];
    }
  }
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += `C${points[i][0] + c},${points[i][1] + c * t[i]} ${points[i + 1][0] - c},${points[i + 1][1] - c * t[i + 1]} ${points[i + 1][0]},${points[i + 1][1]}`;
  }
  return d;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Tabela escondida para leitores de tela: o valor exato de cada ponto. */
export function SrTable({ label, data, index, series, format }: { label: string; data: ChartDatum[]; index: string; series: ChartSeries[]; format: (n: number) => string }) {
  // <table> ignora height:1px do sr-only e estica a rolagem: o invólucro é que some.
  return (
    <div className="sr-only">
    <table>
      <caption>{label}</caption>
      <thead>
        <tr>
          <th scope="col">{index}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <th scope="row">{String(d[index] ?? "")}</th>
            {series.map((s) => (
              <td key={s.key}>{d[s.key] == null ? "—" : format(num(d[s.key]))}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChartConfig / ChartContainer (opcional, no estilo do shadcn)        */
/* ------------------------------------------------------------------ */

/**
 * Configuração compartilhada das séries: chave → rótulo, cor e ícone.
 * Com <ChartContainer config>, os gráficos dentro dele herdam rótulos e cores
 * (e `series` pode ser omitido: vira uma série por chave da config).
 */
export type ChartConfig = Record<string, { label: string; color?: string; icon?: ComponentType<{ className?: string }> }>;

const ChartConfigContext = createContext<ChartConfig | null>(null);

/** Lê a ChartConfig do ChartContainer mais próximo (ou null). */
export function useChartConfig() {
  return useContext(ChartConfigContext);
}

/**
 * Moldura opcional: fornece a ChartConfig aos gráficos filhos e expõe cada
 * cor como variável CSS `--chart-<chave>` (útil em legendas e textos próprios).
 */
export function ChartContainer({ config, children, className }: { config: ChartConfig; children: ReactNode; className?: string }) {
  const style = Object.fromEntries(
    Object.entries(config).map(([k, v], i) => [`--chart-${k}`, v.color ?? chartColor(i)]),
  ) as CSSProperties;
  return (
    <ChartConfigContext.Provider value={config}>
      <div className={cn("min-w-0", className)} style={style}>
        {children}
      </div>
    </ChartConfigContext.Provider>
  );
}

/** Junta séries explícitas com a ChartConfig (rótulo, cor, ícone). */
function resolveSeries(series: ChartSeries[] | undefined, config: ChartConfig | null): ChartSeries[] {
  if (!series) return Object.entries(config ?? {}).map(([key, v], i) => ({ key, label: v.label, color: v.color ?? chartColor(i), icon: v.icon }));
  if (!config) return series;
  return series.map((s, i) => ({ ...s, label: s.label || config[s.key]?.label || s.key, color: s.color ?? config[s.key]?.color ?? chartColor(i), icon: s.icon ?? config[s.key]?.icon }));
}

/* ------------------------------------------------------------------ */
/* Tooltip e legenda                                                   */
/* ------------------------------------------------------------------ */

export type ChartTooltipIndicator = "dot" | "line" | "dashed";

/** Opções do tooltip dos gráficos cartesianos. */
export type ChartTooltipOptions = {
  /** Marcador da série: quadradinho (padrão), barra vertical ou tracejado. */
  indicator?: ChartTooltipIndicator;
  /** Esconde o título (rótulo do eixo X). */
  hideLabel?: boolean;
  /** Esconde o marcador de cor. */
  hideIndicator?: boolean;
  /** Formata o título: (rótulo do X, linha de dados) → conteúdo. */
  labelFormatter?: (label: string, datum: ChartDatum) => ReactNode;
  /** Formata cada valor: (valor, chave da série, linha) → conteúdo. */
  valueFormatter?: (value: number, key: string, datum: ChartDatum) => ReactNode;
  /** Linha de total no fim. `true` = "Total", ou passe o rótulo. */
  showTotal?: boolean | string;
  /** Abre já mostrando o tooltip neste ponto (documentação, telas estáticas). */
  defaultIndex?: number;
};

export type ChartTooltipItem = { key?: string; label: string; value: ReactNode; color?: string; dashed?: boolean; icon?: ComponentType<{ className?: string }> };

/**
 * Conteúdo do tooltip (sem posicionamento). Use em tooltips próprios para
 * manter o mesmo visual dos gráficos do DS.
 */
export function ChartTooltipContent({
  label,
  items,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  total,
  className,
}: {
  label?: ReactNode;
  items: ChartTooltipItem[];
  indicator?: ChartTooltipIndicator;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  total?: { label: string; value: ReactNode };
  className?: string;
}) {
  const nest = indicator !== "dot" && items.length === 1 && !hideIndicator;
  return (
    <div className={cn("grid min-w-[150px] gap-1.5 rounded-lg border border-line bg-popover px-3 py-2 text-[12px] shadow-popup", className)}>
      {!hideLabel && label != null && !nest && <div className="font-medium text-ink">{label}</div>}
      <div className="grid gap-1">
        {items.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key ?? r.label} className={cn("flex items-stretch gap-2", indicator === "dot" && "items-center")}>
              {Icon ? (
                <Icon className="h-3 w-3 shrink-0 self-center text-muted" />
              ) : (
                !hideIndicator && (
                  <span
                    aria-hidden
                    className={cn(
                      "shrink-0",
                      indicator === "dot" && (r.dashed ? "h-0 w-2.5 border-t-2 border-dashed" : "h-2.5 w-2.5 rounded-[3px]"),
                      indicator === "line" && "w-1 rounded-full",
                      indicator === "dashed" && "w-0 border-l-2 border-dashed bg-transparent",
                    )}
                    style={indicator === "dashed" || (indicator === "dot" && r.dashed) ? { borderColor: r.color } : { background: r.color }}
                  />
                )
              )}
              <div className={cn("flex min-w-0 flex-1 justify-between gap-4", nest && "items-end")}>
                <div className="grid min-w-0 gap-0.5">
                  {nest && !hideLabel && label != null && <span className="font-medium text-ink">{label}</span>}
                  <span className="truncate text-muted">{r.label}</span>
                </div>
                <span className="font-medium tabular-nums text-ink">{r.value}</span>
              </div>
            </div>
          );
        })}
      </div>
      {total && (
        <div className="flex justify-between gap-4 border-t border-line pt-1.5">
          <span className="text-muted">{total.label}</span>
          <span className="font-semibold tabular-nums text-ink">{total.value}</span>
        </div>
      )}
    </div>
  );
}

/** Tooltip posicionado (absoluto). API antiga mantida: `rows` + `title`. */
export function ChartTooltip({
  title,
  rows,
  style,
  className,
  indicator,
  hideLabel,
  hideIndicator,
  total,
}: {
  title: ReactNode;
  rows: ChartTooltipItem[];
  style?: CSSProperties;
  className?: string;
  indicator?: ChartTooltipIndicator;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  total?: { label: string; value: ReactNode };
}) {
  return (
    <div className={cn("pointer-events-none absolute z-10", className)} style={style}>
      <ChartTooltipContent label={title} items={rows} indicator={indicator} hideLabel={hideLabel} hideIndicator={hideIndicator} total={total} />
    </div>
  );
}

/**
 * Legenda horizontal. Use quando há 2+ séries e não dá para rotular direto.
 * Com `onToggle`, cada item vira botão que liga/desliga a série.
 */
export function ChartLegend({
  items,
  className,
  onToggle,
  align = "start",
}: {
  items: { key?: string; label: string; color: string; dashed?: boolean; value?: ReactNode; hidden?: boolean; icon?: ComponentType<{ className?: string }> }[];
  className?: string;
  onToggle?: (key: string) => void;
  align?: "start" | "center" | "end";
}) {
  return (
    <ul
      className={cn(
        "flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-[12px] text-muted",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        className,
      )}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const swatch = Icon ? (
          <Icon className="h-3 w-3 shrink-0" />
        ) : (
          <span
            aria-hidden
            className={cn("shrink-0", it.dashed ? "h-0 w-3 border-t-2 border-dashed" : "h-2.5 w-2.5 rounded-[3px]")}
            style={it.dashed ? { borderColor: it.color } : { background: it.color }}
          />
        );
        const body = (
          <>
            {swatch}
            {it.label}
            {it.value != null && <span className="font-medium tabular-nums text-ink">{it.value}</span>}
          </>
        );
        return (
          <li key={it.key ?? it.label}>
            {onToggle && it.key ? (
              <button
                type="button"
                aria-pressed={!it.hidden}
                onClick={() => onToggle(it.key!)}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors hover:bg-soft hover:text-ink", it.hidden && "opacity-45 [&>span]:!bg-line-strong")}
                title={it.hidden ? `Mostrar ${it.label}` : `Ocultar ${it.label}`}
              >
                {body}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5">{body}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Gráfico cartesiano (base de AreaChart, LineChart e BarChart)        */
/* ------------------------------------------------------------------ */

export type ChartCurve = "monotone" | "linear" | "step";

export type CartesianProps = {
  data: ChartDatum[];
  /** Chave do eixo X (mês, dia, etapa). Em barras horizontais, as categorias. */
  index: string;
  /** Séries. Opcional dentro de <ChartContainer config>: uma por chave da config. */
  series?: ChartSeries[];
  /** Resumo em uma frase para leitor de tela: "Receita mensal de jan a set". */
  label: string;
  /** Altura em px (padrão 280). A largura acompanha o contêiner. */
  height?: number;
  format?: (n: number) => string;
  /** Formato do valor no eixo Y (padrão: format). Use a versão compacta. */
  formatAxis?: (n: number) => string;
  formatIndex?: (v: string) => string;
  stacked?: boolean;
  /** "expand" = empilhado 100 % (cada coluna soma 100 %). Implica `stacked`. */
  stackOffset?: "none" | "expand";
  /** true/false força; "interactive" = clicar liga/desliga séries. Padrão: 2+ séries. */
  legend?: boolean | "interactive";
  legendPosition?: "top" | "bottom";
  yAxis?: boolean;
  xAxis?: boolean;
  grid?: "horizontal" | "both" | "none";
  /** Curva de linhas/áreas. */
  curve?: ChartCurve;
  /** Marcadores em cada ponto (linhas/áreas). */
  dots?: boolean;
  /** Preenchimento em degradê nas áreas (padrão true). Falso = cor chapada suave. */
  gradient?: boolean;
  /** Tooltip: opções, ou false para desligar. */
  tooltip?: ChartTooltipOptions | false;
  /** Rótulos de valor: em barras ("top" padrão, "inside"); em linhas, acima do ponto. */
  labels?: boolean | "top" | "inside";
  /** Rótulo com o valor no último ponto de cada linha. */
  endLabels?: boolean;
  /** Barras: "vertical" (padrão) ou "horizontal" (categorias à esquerda). */
  layout?: "vertical" | "horizontal";
  /** Barras horizontais: nome da categoria dentro da barra em vez do eixo. */
  categoryInside?: boolean;
  /** Raio das pontas das barras (padrão 4). */
  radius?: number;
  /** Barras: cor por item (série única), ex. tons por categoria. */
  colorBy?: (datum: ChartDatum, index: number) => string | undefined;
  /** Barras: destaca um item (os outros ficam esmaecidos). */
  activeIndex?: number;
  /** Séries visíveis (controlado). */
  activeSeries?: string[];
  onActiveSeriesChange?: (keys: string[]) => void;
  /** Linha horizontal de referência (meta, limite). */
  reference?: { value: number; label: string };
  /** Eixo começando em zero. Padrão: sim em barras/áreas, não em linhas. */
  zero?: boolean;
  className?: string;
};

type Kind = "area" | "line" | "bar";

const defaultFormat = (n: number) => formatNumber(n);

/** Caminho em degraus (step-after). */
function stepPath(points: [number, number][]) {
  if (!points.length) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) d += `H${points[i][0]}V${points[i][1]}`;
  return d;
}
function curvePath(points: [number, number][], curve: ChartCurve) {
  return curve === "step" ? stepPath(points) : linePath(points, curve === "monotone");
}

/** Retângulo com cantos arredondados só de um lado (a ponta da barra). */
function barPath(x: number, y: number, w: number, h: number, r: number, side: "top" | "bottom" | "right" | "left") {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (side === "top") return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  if (side === "bottom") return `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
  if (side === "right") return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  return `M${x + w},${y}H${x + r}Q${x},${y} ${x},${y + r}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w}Z`;
}

function Cartesian({
  kind,
  data,
  index,
  series: seriesProp,
  label,
  height = 280,
  format = defaultFormat,
  formatAxis,
  formatIndex = (v) => v,
  stacked: stackedProp = false,
  stackOffset = "none",
  legend,
  legendPosition = "top",
  yAxis = true,
  xAxis = true,
  grid = "horizontal",
  curve = "monotone",
  dots = false,
  gradient = true,
  tooltip = {},
  labels = false,
  endLabels = false,
  layout = "vertical",
  categoryInside = false,
  radius = 4,
  colorBy,
  activeIndex,
  activeSeries,
  onActiveSeriesChange,
  reference,
  zero: zeroProp,
  className,
}: CartesianProps & { kind: Kind }) {
  // Barras e áreas começam no zero (sempre); linhas usam o intervalo dos dados.
  const zero = zeroProp ?? (kind !== "line" || !!stackedProp || stackOffset === "expand");
  const config = useChartConfig();
  const series = useMemo(() => resolveSeries(seriesProp, config), [seriesProp, config]);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(tooltip ? (tooltip.defaultIndex ?? null) : null);
  const [ownVisible, setOwnVisible] = useState<string[] | null>(null);
  const visibleKeys = activeSeries ?? ownVisible ?? series.map((s) => s.key);
  const toggleSeries = (key: string) => {
    const next = visibleKeys.includes(key) ? visibleKeys.filter((k) => k !== key) : series.map((s) => s.key).filter((k) => k === key || visibleKeys.includes(k));
    if (!next.length) return; // sempre sobra uma série
    if (activeSeries === undefined) setOwnVisible(next);
    onActiveSeriesChange?.(next);
  };
  const vis = series.filter((s) => visibleKeys.includes(s.key));
  const expand = stackOffset === "expand";
  const stacked = stackedProp || expand;
  const horizontal = kind === "bar" && layout === "horizontal";
  const gid = useId().replace(/:/g, "");
  const n = data.length;
  const colorOf = (s: ChartSeries) => s.color ?? chartColor(series.indexOf(s));

  // Valores efetivos (100 % empilhado divide pelo total da coluna).
  const totals = useMemo(() => data.map((d) => vis.reduce((t, s) => t + Math.max(0, num(d[s.key])), 0)), [data, vis]);
  const val = (d: ChartDatum, i: number, key: string) => (expand ? (totals[i] ? Math.max(0, num(d[key])) / totals[i] : 0) : num(d[key]));

  const { lo, hi, ticks } = useMemo(() => {
    if (expand) return { lo: 0, hi: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
    let min = 0;
    let max = 0;
    data.forEach((d, i) => {
      if (stacked) {
        let pos = 0;
        let neg = 0;
        for (const s of vis) {
          const v = val(d, i, s.key);
          if (v >= 0) pos += v;
          else neg += v;
        }
        max = Math.max(max, pos);
        min = Math.min(min, neg);
      } else {
        for (const s of vis) {
          const v = val(d, i, s.key);
          max = Math.max(max, v);
          min = Math.min(min, v);
        }
      }
    });
    if (reference) max = Math.max(max, reference.value);
    // Rótulos de valor precisam de folga para não colidir com bordas e eixo.
    if (labels && !horizontal) {
      max = max > 0 ? max * 1.12 : max;
      min = min < 0 ? min * 1.25 : min;
    }
    if (!zero) {
      // Linhas (taxas, preços): domínio pelos dados, com folga, sem forçar o zero.
      let lo0 = Infinity;
      let hi0 = -Infinity;
      data.forEach((d, i) => vis.forEach((s) => {
        if (d[s.key] == null) return;
        const v = val(d, i, s.key);
        lo0 = Math.min(lo0, v);
        hi0 = Math.max(hi0, v);
      }));
      if (reference) {
        lo0 = Math.min(lo0, reference.value);
        hi0 = Math.max(hi0, reference.value);
      }
      if (Number.isFinite(lo0) && hi0 > lo0) return niceRange(lo0, hi0, height < 180 ? 3 : 4, labels ? 0.18 : 0.08);
    }
    return niceDomain(min, max, height < 180 ? 3 : 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, vis.map((s) => s.key).join(), stacked, expand, reference, height, labels, horizontal, zero]);

  // Sem formatAxis: casas decimais suficientes para o passo do eixo (evita "1, 1, 1, 0").
  const axisFormat = (v: number) => {
    if (expand) return formatPercent(v, 0);
    if (formatAxis) return formatAxis(v);
    const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
    return step < 1 && format === defaultFormat ? formatNumber(v, Math.min(3, Math.ceil(-Math.log10(step)))) : format(v);
  };

  // Pilhas: base e topo de cada série visível em cada ponto.
  const stacks = useMemo(() => {
    const lows: Record<string, number[]> = {};
    const highs: Record<string, number[]> = {};
    const pos = new Array(n).fill(0);
    const neg = new Array(n).fill(0);
    vis.forEach((s) => {
      lows[s.key] = [];
      highs[s.key] = [];
      data.forEach((d, i) => {
        const v = val(d, i, s.key);
        if (!stacked) {
          lows[s.key][i] = 0;
          highs[s.key][i] = v;
        } else if (v >= 0) {
          lows[s.key][i] = pos[i];
          pos[i] += v;
          highs[s.key][i] = pos[i];
        } else {
          lows[s.key][i] = neg[i];
          neg[i] += v;
          highs[s.key][i] = neg[i];
        }
      });
    });
    return { lows, highs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, vis.map((s) => s.key).join(), stacked, expand, n]);

  /* ---------- geometria ---------- */
  const catW = horizontal && !categoryInside ? Math.min(150, Math.max(40, Math.max(...data.map((d) => formatIndex(String(d[index] ?? "")).length)) * 6.6 + 12)) : 0;
  const axisW = !horizontal && yAxis ? Math.min(68, Math.max(28, Math.max(...ticks.map((t) => axisFormat(t).length)) * 6.8 + 12)) : 0;
  const labelTop = (labels || endLabels) && !horizontal ? 16 : 0;
  const m = horizontal
    ? { top: 4, right: labels ? 56 : 12, bottom: xAxis ? 26 : 6, left: catW }
    : { top: 10 + labelTop, right: endLabels ? 56 : 10, bottom: xAxis ? 28 : 8, left: axisW };
  const innerW = Math.max(0, width - m.left - m.right);
  const innerH = Math.max(0, height - m.top - m.bottom);
  // Escala de valor: vertical → y; horizontal → x.
  const vScale = (v: number) => (horizontal ? m.left + ((v - lo) / (hi - lo || 1)) * innerW : m.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH);
  const band = n ? (horizontal ? innerH : innerW) / n : 0;
  const cat = (i: number) => (horizontal ? m.top + band * (i + 0.5) : kind === "bar" ? m.left + band * (i + 0.5) : m.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1)));

  // Espaço por rótulo do eixo X: pelo maior rótulo (meses curtos cabem todos; datas pulam).
  const longest = Math.max(1, ...data.map((d) => formatIndex(String(d[index] ?? "")).length));
  const tickLabelW = Math.max(...ticks.map((t) => axisFormat(t).length)) * 7 + 10;
  const hTickEvery = horizontal ? Math.max(1, Math.ceil(tickLabelW / Math.max(1, innerW / Math.max(1, ticks.length - 1)))) : 1;
  const labelEvery = horizontal ? 1 : Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / (longest * 7 + 18)))));

  const pick = (clientX: number, clientY: number, rect: DOMRect) => {
    if (!n) return null;
    if (horizontal) {
      const py = clientY - rect.top - m.top;
      return Math.max(0, Math.min(n - 1, Math.floor(py / (band || 1))));
    }
    const px = clientX - rect.left - m.left;
    const i = kind === "bar" ? Math.floor(px / (band || 1)) : Math.round((px / (innerW || 1)) * (n - 1));
    return Math.max(0, Math.min(n - 1, i));
  };
  const onKey = (e: KeyboardEvent) => {
    const next = horizontal ? "ArrowDown" : "ArrowRight";
    const prev = horizontal ? "ArrowUp" : "ArrowLeft";
    if (e.key === next) setActive((a) => Math.min(n - 1, (a ?? -1) + 1));
    else if (e.key === prev) setActive((a) => Math.max(0, (a ?? n) - 1));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const interactive = legend === "interactive";
  const showLegend = interactive || (legend ?? series.length > 1);
  const legendEl = showLegend && (
    <ChartLegend
      className={legendPosition === "top" ? "mb-3" : "mt-3"}
      align={legendPosition === "bottom" ? "center" : "start"}
      onToggle={interactive ? toggleSeries : undefined}
      items={series.map((s) => ({ key: s.key, label: s.label, color: colorOf(s), dashed: s.dashed, hidden: !visibleKeys.includes(s.key), icon: s.icon }))}
    />
  );

  /* ---------- tooltip ---------- */
  const tip = tooltip === false ? null : tooltip;
  const tipPos = active != null ? cat(active) : 0;
  const datum = active != null ? data[active] : undefined;
  const rawLabel = datum ? formatIndex(String(datum[index] ?? "")) : "";
  const fmtValue = (d: ChartDatum, key: string, i: number) => {
    const raw = num(d[key]);
    if (d[key] == null) return "—";
    if (tip?.valueFormatter) return tip.valueFormatter(raw, key, d);
    return expand ? `${format(raw)} · ${formatPercent(val(d, i, key), 0)}` : format(raw);
  };
  const tipTotal =
    tip?.showTotal && datum && active != null
      ? { label: typeof tip.showTotal === "string" ? tip.showTotal : "Total", value: format(vis.reduce((t, s) => t + num(datum[s.key]), 0)) }
      : undefined;

  const barSize = (count: number) => {
    const groupW = Math.min(band * (horizontal ? 0.72 : count > 1 ? 0.78 : 0.68), stacked ? (horizontal ? 34 : 64) : (horizontal ? (count > 1 ? 16 : 30) : 44) * count + 4 * (count - 1));
    const barW = stacked ? groupW : Math.max(2, (groupW - 3 * (count - 1)) / count);
    return { groupW, barW };
  };

  return (
    <div className={cn("min-w-0", className)}>
      {legendPosition === "top" && legendEl}
      <div
        ref={ref}
        className="relative outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-muted/40"
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${label}. Use as setas para navegar pelos pontos.`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="absolute inset-0 block overflow-visible"
            aria-hidden
            onPointerMove={(e) => setActive(pick(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()))}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              {vis.map((s) => (
                <linearGradient key={s.key} id={`${gid}-g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={colorOf(s)} stopOpacity={gradient ? (stacked ? 0.32 : 0.22) : stacked ? 0.3 : 0.14} />
                  <stop offset="100%" stopColor={colorOf(s)} stopOpacity={gradient ? (stacked ? 0.1 : 0.01) : stacked ? 0.3 : 0.14} />
                </linearGradient>
              ))}
            </defs>

            {/* grade de valores */}
            {grid !== "none" &&
              ticks.map((t) =>
                horizontal ? (
                  <line key={t} x1={vScale(t)} x2={vScale(t)} y1={m.top} y2={m.top + innerH} stroke={t === 0 ? "var(--ds-line)" : "var(--ds-chart-grid)"} />
                ) : (
                  <line key={t} x1={m.left} x2={width - m.right} y1={vScale(t)} y2={vScale(t)} stroke={t === 0 ? "var(--ds-line)" : "var(--ds-chart-grid)"} />
                ),
              )}
            {/* grade de categorias */}
            {grid === "both" &&
              data.map((_, i) =>
                i % labelEvery === 0 ? (
                  horizontal ? (
                    <line key={i} x1={m.left} x2={width - m.right} y1={cat(i)} y2={cat(i)} stroke="var(--ds-chart-grid)" strokeDasharray="2 4" />
                  ) : (
                    <line key={i} x1={cat(i)} x2={cat(i)} y1={m.top} y2={m.top + innerH} stroke="var(--ds-chart-grid)" strokeDasharray="2 4" />
                  )
                ) : null,
              )}
            {/* eixo de valores */}
            {(horizontal ? xAxis : yAxis) &&
              ticks.map((t, ti) =>
                horizontal ? (
                  // Eixo horizontal estreito: mostra rótulos alternados para não encostarem.
                  ti % hTickEvery !== 0 && ti !== ticks.length - 1 ? null : (
                  <text key={t} x={vScale(t)} y={height - 7} textAnchor={ti === ticks.length - 1 ? "end" : ti === 0 ? "start" : "middle"} className="fill-muted text-[12px] tabular-nums">
                    {axisFormat(t)}
                  </text>
                  )
                ) : (
                  <text key={t} x={m.left - 10} y={vScale(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[12px] tabular-nums">
                    {axisFormat(t)}
                  </text>
                ),
              )}

            {/* faixa ativa (barras) */}
            {kind === "bar" && active != null && tip && (
              horizontal ? (
                <rect x={m.left} y={m.top + band * active} width={innerW} height={band} rx={6} fill="var(--ds-soft)" />
              ) : (
                <rect x={m.left + band * active} y={m.top} width={band} height={innerH} rx={6} fill="var(--ds-soft)" />
              )
            )}

            {/* marcas */}
            {kind === "bar"
              ? vis.map((s, si) => {
                  const { groupW, barW } = barSize(vis.length);
                  return (
                    <g key={s.key}>
                      {data.map((d, i) => {
                        const a = stacks.lows[s.key][i];
                        const b = stacks.highs[s.key][i];
                        if (a === b) return null;
                        const v = b - a;
                        const p0 = vScale(a);
                        const p1 = vScale(b);
                        const len = Math.max(1, Math.abs(p1 - p0));
                        const off = stacked ? cat(i) - groupW / 2 : cat(i) - groupW / 2 + si * (barW + 3);
                        // Arredonda só a ponta externa (último segmento de cada lado da pilha).
                        const outer = !stacked || vis.slice(si + 1).every((o) => (v >= 0 ? val(d, i, o.key) <= 0 : val(d, i, o.key) >= 0));
                        const r = outer ? radius : 0;
                        const path = horizontal
                          ? barPath(Math.min(p0, p1), off, len, barW, r, v >= 0 ? "right" : "left")
                          : barPath(off, Math.min(p0, p1), barW, len, r, v >= 0 ? "top" : "bottom");
                        const fill = (vis.length === 1 && colorBy?.(d, i)) || colorOf(s);
                        const dim = activeIndex != null && i !== activeIndex;
                        return (
                          <path
                            key={i}
                            d={path}
                            fill={fill}
                            stroke={stacked ? "var(--ds-surface)" : undefined}
                            strokeWidth={stacked ? 1 : undefined}
                            opacity={dim ? 0.45 : 1}
                            className="transition-opacity duration-150"
                          />
                        );
                      })}
                    </g>
                  );
                })
              : vis.map((s) => {
                  const top = data.map((_, i) => [cat(i), vScale(stacks.highs[s.key][i])] as [number, number]);
                  const base = data.map((_, i) => [cat(i), vScale(stacks.lows[s.key][i])] as [number, number]).reverse();
                  const line = curvePath(top, curve);
                  const baseLine = curvePath(base, curve === "step" ? "linear" : curve);
                  const area = curve === "step" ? `${line}L${base.map((p) => p.join(",")).join("L")}Z` : `${line}L${baseLine.slice(1)}Z`;
                  const primary = series.indexOf(s) === 0;
                  return (
                    <g key={s.key}>
                      {kind === "area" && !s.dashed && <path d={area} fill={`url(#${gid}-g-${s.key})`} />}
                      <path
                        d={line}
                        fill="none"
                        stroke={colorOf(s)}
                        strokeWidth={primary ? 2 : 1.75}
                        strokeDasharray={s.dashed ? "4 4" : undefined}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {dots &&
                        top.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={3} fill="var(--ds-surface)" stroke={colorOf(s)} strokeWidth={1.75} />)}
                    </g>
                  );
                })}

            {/* rótulos de valor */}
            {labels &&
              (kind === "bar"
                ? vis.map((s, si) => {
                    // Empilhado: só o total, no topo da pilha.
                    if (stacked && si !== vis.length - 1) return null;
                    const { groupW, barW } = barSize(vis.length);
                    return (
                      <g key={`l-${s.key}`}>
                        {data.map((d, i) => {
                          const v = stacked ? vis.reduce((t, o) => t + num(d[o.key]), 0) : num(d[s.key]);
                          const end = vScale(stacked ? stacks.highs[s.key][i] : val(d, i, s.key));
                          const center = stacked ? cat(i) : cat(i) - groupW / 2 + si * (barW + 3) + barW / 2;
                          const text = expand ? formatPercent(1, 0) : format(v);
                          if (horizontal) {
                            const inside = labels === "inside";
                            const name = formatIndex(String(d[index] ?? ""));
                            if (categoryInside && end - vScale(0) <= name.length * 6.8 + 20) return null;
                            return (
                              <text
                                key={i}
                                x={inside ? end - 8 : end + 6}
                                y={center}
                                dy="0.32em"
                                textAnchor={inside ? "end" : "start"}
                                className={cn("text-[12px] font-medium tabular-nums", inside ? "fill-on-ink" : "fill-ink")}
                              >
                                {text}
                              </text>
                            );
                          }
                          const inside = labels === "inside";
                          // Barras estreitas: fonte menor e, se ainda não couber, um rótulo sim e outro não.
                          const room = stacked ? band : barW + 6;
                          const small = text.length * 6.4 > room;
                          if (small && text.length * 5.6 > room && i % 2 === 1) return null;
                          return (
                            <text
                              key={i}
                              style={small ? { fontSize: 10.5 } : undefined}
                              x={center}
                              y={inside ? end + 14 : v >= 0 ? end - 6 : end + 14}
                              textAnchor="middle"
                              className={cn("text-[11.5px] font-medium tabular-nums", inside ? "fill-on-ink" : "fill-ink-soft")}
                            >
                              {text}
                            </text>
                          );
                        })}
                      </g>
                    );
                  })
                : vis.map((s) => (
                    <g key={`l-${s.key}`}>
                      {data.map((d, i) => (
                        <text key={i} x={cat(i)} y={vScale(stacks.highs[s.key][i]) - 9} textAnchor="middle" className="fill-ink-soft text-[11.5px] font-medium tabular-nums">
                          {format(num(d[s.key]))}
                        </text>
                      ))}
                    </g>
                  )))}

            {/* nome da categoria dentro da barra (horizontal) */}
            {horizontal &&
              categoryInside &&
              data.map((d, i) => {
                const { groupW } = barSize(vis.length);
                const name = formatIndex(String(d[index] ?? ""));
                const barEnd = vScale(stacked ? (stacks.highs[vis[vis.length - 1]?.key]?.[i] ?? 0) : val(d, i, vis[0]?.key ?? ""));
                const fits = barEnd - vScale(0) > name.length * 6.8 + 20;
                // Não coube: o nome vai para fora da barra (e o valor, logo depois).
                return (
                  <text
                    key={`c-${i}`}
                    x={fits ? vScale(0) + 10 : barEnd + 6}
                    y={cat(i) - (vis.length > 1 && !stacked ? groupW / 2 - 8 : 0)}
                    dy="0.32em"
                    className={cn("text-[12px] font-medium", fits ? "fill-on-ink" : "fill-ink-soft")}
                  >
                    {name}
                    {!fits && labels && <tspan className="fill-ink font-semibold tabular-nums">{"  "}{format(num(d[vis[0]?.key ?? ""]))}</tspan>}
                  </text>
                );
              })}

            {/* valor no fim de cada linha */}
            {endLabels &&
              kind !== "bar" &&
              n > 0 &&
              vis.map((s) => {
                const last = n - 1;
                const cy = vScale(stacks.highs[s.key][last]);
                return (
                  <g key={`e-${s.key}`}>
                    <circle cx={cat(last)} cy={cy} r={4} fill={colorOf(s)} stroke="var(--ds-surface)" strokeWidth={2} />
                    <text x={cat(last) + 9} y={cy} dy="0.32em" className="text-[12px] font-semibold tabular-nums" fill={colorOf(s)}>
                      {format(num(data[last][s.key]))}
                    </text>
                  </g>
                );
              })}

            {/* referência (meta) */}
            {reference && !horizontal && (
              <g>
                <line x1={m.left} x2={width - m.right} y1={vScale(reference.value)} y2={vScale(reference.value)} stroke="var(--ds-accent)" strokeDasharray="4 4" />
                <text x={width - m.right} y={vScale(reference.value) - 6} textAnchor="end" className="fill-accent-deep text-[12px] font-medium">
                  {reference.label}
                </text>
              </g>
            )}

            {/* cursor (linhas/áreas) */}
            {kind !== "bar" && active != null && tip && (
              <g>
                <line x1={cat(active)} x2={cat(active)} y1={m.top} y2={m.top + innerH} stroke="var(--ds-line-strong)" strokeDasharray={tip.indicator === "dashed" ? "3 3" : undefined} />
                {vis.map((s) => (
                  <circle key={s.key} cx={cat(active)} cy={vScale(stacks.highs[s.key][active])} r={4.5} fill="var(--ds-surface)" stroke={colorOf(s)} strokeWidth={2} />
                ))}
              </g>
            )}

            {/* eixo de categorias */}
            {(horizontal ? !categoryInside : xAxis) &&
              data.map((d, i) =>
                i % labelEvery === 0 ? (
                  horizontal ? (
                    <text key={i} x={m.left - 10} y={cat(i)} dy="0.32em" textAnchor="end" className="fill-ink-soft text-[12px]">
                      {formatIndex(String(d[index] ?? ""))}
                    </text>
                  ) : (
                    <text
                      key={i}
                      x={cat(i)}
                      y={height - 8}
                      textAnchor={kind !== "bar" && i === 0 ? "start" : kind !== "bar" && i === n - 1 ? "end" : "middle"}
                      className="fill-muted text-[12px]"
                    >
                      {formatIndex(String(d[index] ?? ""))}
                    </text>
                  )
                ) : null,
              )}
          </svg>
        )}

        {tip && active != null && datum && (
          <ChartTooltip
            title={tip.labelFormatter ? tip.labelFormatter(rawLabel, datum) : rawLabel}
            indicator={tip.indicator}
            hideLabel={tip.hideLabel}
            hideIndicator={tip.hideIndicator}
            total={tipTotal}
            rows={vis.map((s) => ({ key: s.key, label: s.label, value: fmtValue(datum, s.key, active), color: (vis.length === 1 && kind === "bar" && colorBy?.(datum, active)) || colorOf(s), dashed: s.dashed, icon: s.icon }))}
            style={
              horizontal
                ? { top: Math.min(Math.max(0, tipPos - 20), Math.max(0, height - 90)), left: Math.min(width - 190, m.left + innerW * 0.55) }
                : { top: m.top, left: tipPos > width / 2 ? undefined : tipPos + 14, right: tipPos > width / 2 ? width - tipPos + 14 : undefined }
            }
          />
        )}
        <SrTable label={label} data={data} index={index} series={vis} format={format} />
      </div>
      {legendPosition === "bottom" && legendEl}
    </div>
  );
}

/**
 * Evolução no tempo com volume (receita, visitantes, vagas abertas).
 * Uma série: área com gradiente. Duas: a segunda é comparação (tracejada se
 * for meta/período anterior). `stacked` para partes de um total;
 * `stackOffset="expand"` para participação (100 %).
 */
export function AreaChart(props: CartesianProps) {
  return <Cartesian kind="area" {...props} />;
}

/** Tendência sem volume (taxa, preço, NPS): só a linha. `dots`, `labels`, `endLabels`. */
export function LineChart(props: CartesianProps) {
  return <Cartesian kind="line" {...props} />;
}

/**
 * Comparação entre categorias ou períodos discretos. Aceita negativos
 * (fluxo de caixa). `stacked` para composição, `stackOffset="expand"` para
 * 100 %, `layout="horizontal"` para rankings com nomes longos. Até ~16
 * barras; acima disso use AreaChart.
 */
export function BarChart(props: CartesianProps) {
  return <Cartesian kind="bar" {...props} />;
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

/** Mini tendência sem eixos, ao lado de um número. Nunca sozinha. */
export function Sparkline({
  values,
  tone = "neutral",
  width = 96,
  height = 28,
  area = true,
  className,
}: {
  values: number[];
  tone?: "neutral" | "ok" | "bad" | "accent";
  width?: number;
  height?: number;
  area?: boolean;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const color = { neutral: "var(--ds-ink)", ok: "var(--ds-ok)", bad: "var(--ds-rose)", accent: "var(--ds-accent)" }[tone];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const pts = values.map((v, i) => [pad + (i * (width - pad * 2)) / (values.length - 1), pad + (height - pad * 2) * (1 - (v - min) / (max - min || 1))] as [number, number]);
  const line = linePath(pts, true);
  return (
    <svg width={width} height={height} className={cn("block shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {area && <path d={`${line}L${pts[pts.length - 1][0]},${height}L${pts[0][0]},${height}Z`} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* MiniBarChart                                                        */
/* ------------------------------------------------------------------ */

/**
 * Barrinhas de atividade num cartão pequeno (7 dias, 12 meses, 24 horas).
 * O cabeçalho mostra o valor da barra apontada/focada — ou do último ponto,
 * em repouso. Barra ativa em tinta, vizinhas mais leves. Teclado: foco no
 * gráfico e ←/→. `label` é obrigatório (vira o título e o nome acessível).
 */
export function MiniBarChart({
  label,
  data,
  format = (n: number) => formatNumber(n),
  caption,
  height = 96,
  framed = true,
  className,
}: {
  label: string;
  data: { label: string; value: number }[];
  format?: (n: number) => string;
  /** Linha abaixo do título ("Últimos 7 dias"). */
  caption?: ReactNode;
  height?: number;
  /** false dentro de um cartão que já tem borda. */
  framed?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.value));
  const shown = active ?? data.length - 1;
  const cur = data[shown];
  // Muitas barras: rótulo só a cada N (e no último e no ativo), para não encavalar.
  const every = data.length > 10 ? Math.ceil(data.length / 6) : 1;
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    setActive((a) => {
      const i = a ?? data.length - 1;
      if (e.key === "Home") return 0;
      if (e.key === "End") return data.length - 1;
      return Math.min(data.length - 1, Math.max(0, i + (e.key === "ArrowLeft" ? -1 : 1)));
    });
  };
  if (!data.length) return null;
  return (
    <div className={cn("min-w-0", framed && "surface-card rounded-xl border border-line bg-surface px-4 py-3.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12.5px] text-muted">{label}</div>
          {caption && <div className="truncate text-[11px] text-muted">{caption}</div>}
        </div>
        {/* Anuncia só quando o teclado navega (não a cada passada do mouse). */}
        <div className="shrink-0 text-right" aria-live={focused ? "polite" : "off"}>
          <div className="text-[18px] font-semibold leading-none tabular-nums">{format(cur.value)}</div>
          <div className="mt-1 text-[11px] text-muted">{cur.label}</div>
        </div>
      </div>
      <div
        className="mt-3 flex items-end gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-muted/40"
        style={{ height: height + 18 }}
        tabIndex={0}
        role="group"
        aria-label={`${label}. Use as setas para ver cada barra.`}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setActive(null);
        }}
        onPointerLeave={() => setActive(null)}
      >
        {data.map((d, i) => {
          const on = active === i;
          const near = active != null && Math.abs(active - i) === 1;
          return (
            <div key={`${d.label}-${i}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" onPointerEnter={() => setActive(i)}>
              <div
                aria-hidden
                className={cn(
                  "w-full max-w-[28px] rounded-[4px] transition-[background-color,transform] duration-150 motion-reduce:transition-none",
                  on ? "bg-ink" : near ? "bg-ink/35" : active != null ? "bg-ink/12" : "bg-ink/25",
                )}
                style={{ height: Math.max(2, (d.value / max) * height) }}
              />
              <span aria-hidden className={cn("mt-1.5 max-w-full whitespace-nowrap text-[10px] leading-none", on ? "font-medium text-ink" : "text-muted", !on && i % every !== 0 && i !== data.length - 1 && "invisible")}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <SrTable label={label} data={data} index="label" series={[{ key: "value", label }]} format={format} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BarList                                                             */
/* ------------------------------------------------------------------ */

export type BarListItem = { label: string; value: number; hint?: ReactNode; href?: string; icon?: ReactNode };

/**
 * Ranking horizontal (origem de leads, produtos mais vendidos, motivos de
 * perda). Rótulo dentro da barra, valor à direita. Ordena do maior ao menor.
 */
export function BarList({
  items,
  format = (n) => formatNumber(n),
  sort = true,
  limit,
  tone = "neutral",
  showShare = false,
  className,
}: {
  items: BarListItem[];
  format?: (n: number) => string;
  sort?: boolean;
  limit?: number;
  tone?: "neutral" | "accent";
  /** Mostra a participação (%) de cada item no total. */
  showShare?: boolean;
  className?: string;
}) {
  const rows = (sort ? [...items].sort((a, b) => b.value - a.value) : items).slice(0, limit);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = items.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <ul className={cn("flex list-none flex-col gap-1.5 p-0", className)}>
      {rows.map((r) => {
        const inner = (
          <>
            <span className="relative flex h-8 min-w-0 flex-1 items-center">
              <span
                aria-hidden
                className={cn("absolute inset-y-0 left-0 rounded-md", tone === "accent" ? "bg-accent-soft" : "bg-ink/[0.06]")}
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
              <span className="relative flex min-w-0 items-center gap-2 px-2.5 text-[13px] text-ink [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-muted">
                {r.icon}
                <span className="truncate">{r.label}</span>
                {r.hint && <span className="truncate text-[12px] text-muted">{r.hint}</span>}
              </span>
            </span>
            <span className="w-20 shrink-0 text-right text-[13px] font-medium tabular-nums">{format(r.value)}</span>
            {showShare && <span className="w-12 shrink-0 text-right text-[12px] tabular-nums text-muted">{formatPercent(r.value / total, 0)}</span>}
          </>
        );
        return (
          <li key={r.label}>
            {r.href ? (
              <DsLink href={r.href} className="flex items-center gap-3 rounded-md hover:bg-soft/60">
                {inner}
              </DsLink>
            ) : (
              <div className="flex items-center gap-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export type DonutItem = { label: string; value: number; color?: string };

/**
 * Parte de um todo com 2–6 fatias (mix de receita, status de faturas).
 * O centro mostra o total ou a fatia sob o cursor. Com mais de 6 fatias,
 * use BarList.
 */
export function DonutChart({
  items,
  label,
  format = (n) => formatNumber(n),
  centerLabel = "Total",
  size = 168,
  thickness = 18,
  legend = true,
  className,
}: {
  items: DonutItem[];
  label: string;
  format?: (n: number) => string;
  centerLabel?: string;
  size?: number;
  thickness?: number;
  legend?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = items.reduce((s, it) => s + Math.max(0, it.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = items.length > 1 ? 2 : 0;
  let offset = 0;
  const color = (it: DonutItem, i: number) => it.color ?? chartColor(i);
  const current = active != null ? items[active] : null;
  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${items.map((it) => `${it.label} ${format(it.value)}`).join(", ")}`}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden onPointerLeave={() => setActive(null)}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ds-soft)" strokeWidth={thickness} />
          {total > 0 &&
            items.map((it, i) => {
              const len = (Math.max(0, it.value) / total) * c;
              const dash = Math.max(0, len - gap);
              const el = (
                <circle
                  key={it.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={color(it, i)}
                  strokeWidth={active === i ? thickness + 4 : thickness}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  opacity={active == null || active === i ? 1 : 0.35}
                  className="transition-[opacity,stroke-width] duration-150"
                  onPointerEnter={() => setActive(i)}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-[70%] truncate text-[11px] text-muted">{current ? current.label : centerLabel}</span>
          <span className="text-[18px] font-semibold tabular-nums tracking-tight">{format(current ? current.value : total)}</span>
          {current && total > 0 && <span className="text-[11px] tabular-nums text-muted">{formatPercent(current.value / total, 0)}</span>}
        </div>
      </div>
      {legend && (
        <ul className="flex min-w-[160px] flex-1 list-none flex-col gap-1.5 p-0">
          {items.map((it, i) => (
            <li
              key={it.label}
              className={cn("flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px]", active === i && "bg-soft")}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
            >
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: color(it, i) }} />
              <span className="min-w-0 flex-1 truncate text-ink-soft">{it.label}</span>
              <span className="font-medium tabular-nums">{format(it.value)}</span>
              <span className="w-10 text-right text-[12px] tabular-nums text-muted">{total ? formatPercent(it.value / total, 0) : "—"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Funil                                                               */
/* ------------------------------------------------------------------ */

export type FunnelStage = { label: string; value: number; hint?: ReactNode };

/**
 * Conversão entre etapas (lead → cliente, candidatura → contratação).
 * Mostra valor, conversão da etapa anterior e conversão acumulada; a maior
 * perda ganha destaque âmbar (é onde agir).
 *   variant="bars"    linhas horizontais: cabe em card estreito, lê rápido
 *   variant="columns" colunas com faixa de perda entre elas: dashboard largo
 */
export function FunnelChart({
  stages,
  format = (n) => formatNumber(n),
  variant = "bars",
  highlightDrop = true,
  label = "Funil de conversão",
  className,
}: {
  stages: FunnelStage[];
  format?: (n: number) => string;
  variant?: "bars" | "columns";
  highlightDrop?: boolean;
  label?: string;
  className?: string;
}) {
  const first = stages[0]?.value || 1;
  const rates = stages.map((s, i) => (i === 0 ? 1 : s.value / (stages[i - 1].value || 1)));
  let worst = -1;
  if (highlightDrop && stages.length > 2) {
    let min = Infinity;
    rates.forEach((r, i) => {
      if (i > 0 && r < min) {
        min = r;
        worst = i;
      }
    });
  }
  const summary = `${label}: ${stages.map((s) => `${s.label} ${format(s.value)}`).join(", ")}. Conversão total ${formatPercent((stages[stages.length - 1]?.value ?? 0) / first)}.`;

  if (variant === "columns") return <FunnelColumns stages={stages} format={format} rates={rates} worst={worst} summary={summary} className={className} />;

  return (
    <ol className={cn("list-none p-0", className)} aria-label={summary}>
      {stages.map((s, i) => (
        <li key={s.label}>
          {i > 0 && (
            <div className="flex items-center gap-2 py-1 pl-[2px] text-[11.5px] text-muted">
              <span aria-hidden className={cn("ml-[3px] h-4 w-px", i === worst ? "bg-amber" : "bg-line-strong")} />
              <span className={cn("tabular-nums", i === worst && "font-medium text-amber")}>
                {formatPercent(rates[i])} avançam
              </span>
              <span className="tabular-nums">· {format(stages[i - 1].value - s.value)} saem</span>
              {i === worst && <span className="rounded bg-amber-soft px-1.5 py-px text-[10.5px] font-medium text-amber">maior perda</span>}
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-[34%] min-w-0 max-w-[180px] shrink-0">
              <div className="truncate text-[13px] font-medium">{s.label}</div>
              {s.hint && <div className="truncate text-[11.5px] text-muted">{s.hint}</div>}
            </div>
            <div className="relative h-8 min-w-0 flex-1 rounded-md bg-soft">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-ink transition-[width] duration-300"
                style={{ width: `${Math.max(1.5, (s.value / first) * 100)}%`, opacity: 1 - (i / Math.max(1, stages.length)) * 0.45 }}
              />
            </div>
            <div className="w-24 shrink-0 text-right">
              <div className="text-[13.5px] font-semibold tabular-nums">{format(s.value)}</div>
              <div className="text-[11px] tabular-nums text-muted">{i === 0 ? "100 %" : formatPercent(s.value / first)}</div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FunnelColumns({
  stages,
  format,
  rates,
  worst,
  summary,
  className,
}: {
  stages: FunnelStage[];
  format: (n: number) => string;
  rates: number[];
  worst: number;
  summary: string;
  className?: string;
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const height = 200;
  const first = stages[0]?.value || 1;
  const n = stages.length;
  const slot = n ? width / n : 0;
  const colW = Math.min(slot * 0.56, 96);
  const h = (v: number) => Math.max(3, (v / first) * (height - 8));
  return (
    <div className={cn("min-w-0", className)} role="img" aria-label={summary}>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="absolute inset-0 block" aria-hidden>
            {stages.map((s, i) => {
              const cx = slot * (i + 0.5);
              const x0 = cx - colW / 2;
              const top = height - h(s.value);
              const next = stages[i + 1];
              return (
                <g key={s.label}>
                  {next && (
                    <polygon
                      points={`${x0 + colW},${top} ${cx + slot - colW / 2},${height - h(next.value)} ${cx + slot - colW / 2},${height} ${x0 + colW},${height}`}
                      fill={i + 1 === worst ? "var(--ds-amber-soft)" : "var(--ds-soft)"}
                    />
                  )}
                  <rect x={x0} y={top} width={colW} height={h(s.value)} rx={4} fill="var(--ds-ink)" opacity={1 - (i / Math.max(1, n)) * 0.45} />
                </g>
              );
            })}
          </svg>
        )}
        {width > 0 &&
          stages.slice(1).map((s, j) => {
            const i = j + 1;
            return (
              <span
                key={s.label}
                className={cn(
                  "absolute top-1 -translate-x-1/2 rounded-md border bg-surface px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                  i === worst ? "border-amber/30 text-amber" : "border-line text-ink-soft",
                )}
                style={{ left: slot * i }}
              >
                {formatPercent(rates[i], 0)}
              </span>
            );
          })}
      </div>
      <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {stages.map((s) => (
          <div key={s.label} className="min-w-0 px-1 text-center">
            <div className="text-[14px] font-semibold tabular-nums">{format(s.value)}</div>
            <div className="truncate text-[12px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heatmap de calendário                                               */
/* ------------------------------------------------------------------ */

/**
 * Intensidade por dia (atividade, vendas, entrevistas). 5 níveis de uma cor
 * só, quantizados pelo máximo do período. Mês no topo, Seg/Qua/Sex à esquerda.
 */
export function CalendarHeatmap({
  values,
  end = new Date(),
  weeks = 26,
  noun = "atividades",
  tone = "ink",
  className,
}: {
  values: { date: string; value: number }[];
  end?: Date;
  weeks?: number;
  noun?: string;
  tone?: "ink" | "accent" | "ok";
  className?: string;
}) {
  const map = useMemo(() => new Map(values.map((v) => [v.date.slice(0, 10), v.value])), [values]);
  const max = Math.max(1, ...values.map((v) => v.value));
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const start = new Date(endDay);
  start.setDate(start.getDate() - endDay.getDay() - (weeks - 1) * 7);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const base = { ink: "var(--ds-ink)", accent: "var(--ds-accent)", ok: "var(--ds-ok)" }[tone];
  const level = (v: number) => (v <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)));
  const fill = (l: number) => (l === 0 ? "var(--ds-soft)" : `color-mix(in oklab, ${base} ${[0, 20, 42, 68, 100][l]}%, transparent)`);
  const cols: { date: Date; value: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { date: Date; value: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      col.push({ date: day, value: day > endDay ? -1 : map.get(iso(day)) ?? 0 });
    }
    cols.push(col);
  }
  const cell = 11;
  const gapPx = 3;
  const total = values.reduce((s, v) => s + v.value, 0);
  return (
    <div className={cn("min-w-0", className)}>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${formatNumber(total)} ${noun} nas últimas ${weeks} semanas`}>
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: "auto 1fr" }}>
          <span />
          <div className="relative h-4 text-[10.5px] text-muted">
            {cols.map((col, w) =>
              col[0].date.getDate() <= 7 ? (
                <span key={w} className="absolute" style={{ left: w * (cell + gapPx) }}>
                  {col[0].date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                </span>
              ) : null,
            )}
          </div>
          <div className="grid pr-1 text-[10.5px] leading-none text-muted" style={{ gridTemplateRows: `repeat(7, ${cell}px)`, rowGap: gapPx }}>
            {["", "Seg", "", "Qua", "", "Sex", ""].map((d, i) => (
              <span key={i} className="flex items-center">
                {d}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap: gapPx }}>
            {cols.map((col, w) => (
              <div key={w} className="grid" style={{ gridTemplateRows: `repeat(7, ${cell}px)`, rowGap: gapPx }}>
                {col.map((c) => (
                  <span
                    key={c.date.toISOString()}
                    title={c.value < 0 ? undefined : `${c.date.toLocaleDateString("pt-BR")}: ${formatNumber(c.value)} ${noun}`}
                    className="rounded-[2.5px]"
                    style={{ width: cell, height: cell, background: c.value < 0 ? "transparent" : fill(level(c.value)) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted">
        Menos
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: fill(l) }} />
        ))}
        Mais
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRing                                                        */
/* ------------------------------------------------------------------ */

/** Anel de progresso compacto (meta atingida, score, capacidade). */
export function ProgressRing({
  value,
  size = 44,
  thickness = 4,
  tone = "ink",
  label,
  children,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  tone?: "ink" | "accent" | "ok" | "warn" | "bad";
  label: string;
  /** Conteúdo central; padrão = "NN%". */
  children?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const color = { ink: "var(--ds-ink)", accent: "var(--ds-accent)", ok: "var(--ds-ok)", warn: "var(--ds-amber)", bad: "var(--ds-rose)" }[tone];
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progresso"}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ds-line)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="relative text-[11px] font-semibold tabular-nums" style={{ fontSize: size < 40 ? 9.5 : size > 64 ? 15 : 11 }}>
        {children ?? `${Math.round(pct)}%`}
      </span>
    </span>
  );
}
