"use client";

/*
 * Peças compartilhadas pelos gráficos analíticos (coorte, mapa por UF, horizon,
 * dispersão conectada, sankey, cascata):
 *   · ScaleLegend: legenda de escala em degraus ou contínua, com hover que
 *     destaca a faixa no gráfico
 *   · ChartScrubber: controle deslizante de tempo (role="slider", setas,
 *     Home/End, tocar/pausar), para percorrer meses/dias de um gráfico
 *   · AxisBreak: marca de quebra (eixo truncado só com aviso visível)
 *   · useLinkedHighlight: realce ligado entre gráfico, lista e tabela
 *     (hover/foco destaca; clique fixa; Esc solta)
 */

import { Pause, Play } from "lucide-react";
import { useCallback, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { useReducedMotion, useVisibleInterval } from "../lib/motion";
import { divergingColor, sequentialColor, type ScaleTone } from "../lib/scale";

/* ------------------------------------------------------------------ */
/* ScaleLegend                                                         */
/* ------------------------------------------------------------------ */

export type ScaleLegendProps = {
  /** Limites inferiores de cada degrau (de `quantize(...).thresholds`). Em `continuous`, só [mín, máx]. */
  thresholds: number[];
  /** Fim do último degrau (de `quantize(...).domain[1]`). */
  max?: number;
  mode?: "stepped" | "continuous";
  /** Escala de uma cor (`tone`) ou divergente (centrada em zero). */
  scheme?: "sequential" | "diverging";
  tone?: ScaleTone;
  format?: (n: number) => string;
  /** Título curto à esquerda ("% retido", "Receita"). */
  title?: ReactNode;
  /** Degrau em destaque (vindo do gráfico). */
  activeBin?: number | null;
  /** Hover/foco num degrau: o gráfico destaca as células daquela faixa. */
  onHoverBin?: (bin: number | null) => void;
  className?: string;
};

/**
 * Legenda de escala de intensidade. Em degraus, cada faixa é focável e
 * anuncia o intervalo; passar o mouse destaca as células daquela faixa.
 */
export function ScaleLegend({
  thresholds,
  max,
  mode = "stepped",
  scheme = "sequential",
  tone = "ink",
  format = (n) => formatNumber(n),
  title,
  activeBin = null,
  onHoverBin,
  className,
}: ScaleLegendProps) {
  const steps = thresholds.length;
  const colorAt = (i: number) => {
    if (scheme === "diverging") {
      const lo = thresholds[0];
      const hi = max ?? thresholds[steps - 1];
      const mid = (thresholds[i] + (thresholds[i + 1] ?? hi)) / 2;
      const span = Math.max(Math.abs(lo), Math.abs(hi)) || 1;
      return divergingColor(mid / span);
    }
    return sequentialColor(steps === 1 ? 1 : i / (steps - 1), tone);
  };
  if (mode === "continuous") {
    const lo = thresholds[0];
    const hi = max ?? thresholds[thresholds.length - 1];
    const stops = Array.from({ length: 6 }, (_, i) =>
      scheme === "diverging" ? divergingColor(-1 + (i / 5) * 2) : sequentialColor(i / 5, tone),
    );
    return (
      <div className={cn("flex items-center gap-2 text-[11px] text-muted", className)}>
        {title ? <span className="shrink-0 text-ink-soft">{title}</span> : null}
        <span className="tabular-nums">{format(lo)}</span>
        <span aria-hidden className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${stops.join(", ")})` }} />
        <span className="tabular-nums">{format(hi)}</span>
      </div>
    );
  }
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted", className)}>
      {title ? <span className="shrink-0 text-ink-soft">{title}</span> : null}
      <ul className="m-0 flex list-none items-start gap-0.5 p-0" aria-label={typeof title === "string" ? `Escala: ${title}` : "Escala"}>
        {thresholds.map((t, i) => {
          const end = thresholds[i + 1] ?? max;
          const range = end != null ? `${format(t)} a ${format(end)}` : `${format(t)} ou mais`;
          const active = activeBin === i;
          return (
            <li key={i} className="flex flex-col items-start gap-0.5">
              <button
                type="button"
                aria-label={range}
                aria-pressed={onHoverBin ? active : undefined}
                onMouseEnter={() => onHoverBin?.(i)}
                onMouseLeave={() => onHoverBin?.(null)}
                onFocus={() => onHoverBin?.(i)}
                onBlur={() => onHoverBin?.(null)}
                className={cn(
                  "block h-2.5 w-8 rounded-[3px] outline-none ring-offset-1 ring-offset-surface transition-shadow focus-visible:ring-2 focus-visible:ring-muted/50 sm:w-10",
                  active && "ring-2 ring-ink/60",
                  !onHoverBin && "pointer-events-none",
                )}
                tabIndex={onHoverBin ? 0 : -1}
                style={{ background: colorAt(i) }}
              />
              <span className="tabular-nums">{format(t)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ChartScrubber                                                       */
/* ------------------------------------------------------------------ */

export type ChartScrubberProps = {
  /** Quantidade de posições (meses, dias). */
  count: number;
  value: number;
  onChange: (index: number) => void;
  /** Texto de cada posição ("jun 2026"): vai para aria-valuetext e para o rótulo. */
  format?: (index: number) => string;
  /** Nome acessível ("Mês"). */
  label: string;
  /** Mostra tocar/pausar: avança uma posição por `interval` ms (só com a aba visível). */
  playable?: boolean;
  interval?: number;
  className?: string;
};

/**
 * Controle de tempo para gráficos: arraste, clique ou use as setas
 * (Home/End vão ao início e ao fim). Com `playable`, percorre sozinho;
 * com movimento reduzido, o botão de tocar não aparece.
 */
export function ChartScrubber({ count, value, onChange, format = (i) => String(i + 1), label, playable = false, interval = 700, className }: ChartScrubberProps) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const last = Math.max(0, count - 1);
  const set = useCallback((i: number) => onChange(Math.max(0, Math.min(last, i))), [onChange, last]);
  useVisibleInterval(
    () => {
      if (value >= last) setPlaying(false);
      else set(value + 1);
    },
    playing && !reduced ? interval : null,
  );
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: value - 1, ArrowDown: value - 1, ArrowRight: value + 1, ArrowUp: value + 1, Home: 0, End: last, PageDown: value - 3, PageUp: value + 3 };
    if (e.key in map) {
      e.preventDefault();
      setPlaying(false);
      set(map[e.key]);
    }
  };
  const pick = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    set(Math.round(((clientX - r.left) / r.width) * last));
  };
  const pct = last ? (value / last) * 100 : 0;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {playable && !reduced ? (
        <button
          type="button"
          aria-label={playing ? "Pausar" : "Tocar"}
          onClick={() => {
            if (!playing && value >= last) set(0);
            setPlaying((p) => !p);
          }}
          className="ds-hit inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft outline-none hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-muted/40"
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
      ) : null}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          setPlaying(false);
          const el = e.currentTarget;
          el.setPointerCapture?.(e.pointerId);
          pick(e.clientX, el);
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) pick(e.clientX, e.currentTarget);
        }}
        className="group relative h-6 min-w-0 flex-1 cursor-pointer touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-muted/40"
      >
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-soft" />
        <span aria-hidden className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/70" style={{ width: `${pct}%` }} />
        <span
          aria-hidden
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow-sm transition-transform group-hover:scale-110"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="w-20 shrink-0 text-right text-[12px] tabular-nums text-ink-soft" aria-hidden>
        {format(value)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AxisBreak                                                           */
/* ------------------------------------------------------------------ */

/**
 * Marca de quebra (duas barras inclinadas) para um eixo que não começa em
 * zero. Desenhe sobre a barra ou o eixo, centrada em (x, y). SVG.
 */
export function AxisBreak({ x, y, width = 14 }: { x: number; y: number; width?: number }) {
  const h = 3;
  const w = width / 2;
  return (
    <g aria-hidden>
      <path d={`M${x - w},${y + h} L${x + w},${y - h + 1} L${x + w},${y - h + 5} L${x - w},${y + h + 4} Z`} fill="var(--color-surface)" />
      <path d={`M${x - w},${y + h} L${x + w},${y - h + 1} M${x - w},${y + h + 4} L${x + w},${y - h + 5}`} stroke="var(--color-muted)" strokeWidth={1} fill="none" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* useLinkedHighlight                                                  */
/* ------------------------------------------------------------------ */

export type LinkedHighlight<K extends string | number> = {
  /** Item em destaque agora (fixado tem prioridade sobre o hover). */
  active: K | null;
  /** Item fixado por clique/Enter (ou null). */
  pinned: K | null;
  setPinned: (k: K | null) => void;
  setHover: (k: K | null) => void;
  /** Esmaecido: há destaque e não é este. */
  isDimmed: (k: K) => boolean;
  /**
   * Props para qualquer elemento ligado (barra, região SVG, linha da lista):
   * hover e foco destacam; clique e Enter/Espaço fixam; Esc solta.
   */
  bind: (k: K) => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onClick: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
    "data-active": boolean | undefined;
    "data-dimmed": boolean | undefined;
  };
};

/**
 * Realce ligado entre várias vistas do mesmo dado (mapa + lista, sankey +
 * painel, horizon + tabela). Uma fonte de verdade: o que está em foco em uma
 * vista acende nas outras. Controlado opcional via `pinned`/`onPinnedChange`.
 */
export function useLinkedHighlight<K extends string | number>({
  pinned: pinnedProp,
  onPinnedChange,
  defaultPinned = null,
}: { pinned?: K | null; onPinnedChange?: (k: K | null) => void; defaultPinned?: K | null } = {}): LinkedHighlight<K> {
  const [inner, setInner] = useState<K | null>(defaultPinned);
  const [hover, setHover] = useState<K | null>(null);
  const pinned = pinnedProp !== undefined ? pinnedProp : inner;
  const setPinned = useCallback(
    (k: K | null) => {
      if (pinnedProp === undefined) setInner(k);
      onPinnedChange?.(k);
    },
    [pinnedProp, onPinnedChange],
  );
  const active = hover ?? pinned;
  return useMemo(
    () => ({
      active,
      pinned,
      setPinned,
      setHover,
      isDimmed: (k: K) => active != null && active !== k,
      bind: (k: K) => ({
        onMouseEnter: () => setHover(k),
        onMouseLeave: () => setHover(null),
        onFocus: () => setHover(k),
        onBlur: () => setHover(null),
        onClick: () => setPinned(pinned === k ? null : k),
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPinned(pinned === k ? null : k);
          } else if (e.key === "Escape" && pinned != null) {
            e.preventDefault();
            setPinned(null);
          }
        },
        "data-active": active === k || undefined,
        "data-dimmed": (active != null && active !== k) || undefined,
      }),
    }),
    [active, pinned, setPinned],
  );
}
