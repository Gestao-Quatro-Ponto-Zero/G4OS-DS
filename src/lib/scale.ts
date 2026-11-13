/*
 * Escalas de cor para dados de intensidade (mapa de calor, coorte, mapa por UF,
 * pivô, horizon). Tudo devolve `color-mix` sobre tokens, então acompanha tema
 * escuro e marca sem código extra. Ver docs/fundamentos/dados.md.
 */

export type ScaleTone = "ink" | "accent" | "ok" | "info" | "pos" | "neg";

const toneVar: Record<ScaleTone, string> = {
  ink: "var(--color-chart-1)",
  accent: "var(--color-accent)",
  ok: "var(--color-ok)",
  info: "var(--color-info)",
  pos: "var(--color-chart-pos)",
  neg: "var(--color-chart-neg)",
};

const clamp01 = (t: number) => (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0);

/**
 * Curva de opacidade: degraus baixos ficam distinguíveis do fundo e os altos
 * não "estouram" (mesmo critério do HeatmapMatrix).
 */
export function scaleShade(t: number) {
  const a = clamp01(t);
  return a <= 0.5 ? 0.06 + a * 0.74 : 0.43 + (a - 0.5) * 1.14;
}

/** Cor de uma intensidade `t` (0–1) numa escala de uma cor só. */
export function sequentialColor(t: number, tone: ScaleTone = "ink") {
  return `color-mix(in oklab, ${toneVar[tone]} ${Math.round(scaleShade(t) * 100)}%, transparent)`;
}

/**
 * Cor de uma posição `t` (-1 a 1) numa escala divergente: negativo em
 * `chart-neg`, positivo em `chart-pos`, zero quase transparente.
 */
export function divergingColor(t: number) {
  const v = Number.isFinite(t) ? Math.max(-1, Math.min(1, t)) : 0;
  if (Math.abs(v) < 1e-9) return "color-mix(in oklab, var(--color-line) 60%, transparent)";
  return sequentialColor(Math.abs(v), v > 0 ? "pos" : "neg");
}

/**
 * Cor do texto sobre uma célula de intensidade `t`: tinta normal até o meio
 * da escala, tinta invertida acima (legível nos dois temas).
 */
export function onScaleInk(t: number) {
  return clamp01(t) > 0.55 ? "var(--color-on-ink)" : "var(--color-ink)";
}

export type QuantizedScale = {
  /** Limites inferiores de cada degrau (comprimento = steps). */
  thresholds: number[];
  /** Índice do degrau (0…steps-1) de um valor. */
  bin: (v: number) => number;
  /** Intensidade 0–1 do degrau (para sequentialColor). */
  level: (v: number) => number;
  steps: number;
  domain: [number, number];
};

const niceStep = (raw: number) => {
  if (raw <= 0 || !Number.isFinite(raw)) return 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  // Tolerância: 0,6 / 6 = 0,10000000000000002 não pode virar passo 0,2.
  const n = raw / mag - 1e-9;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
};

/**
 * Divide um domínio em `steps` degraus de limites "redondos" (escala em
 * degraus: mais fácil de ler e comparar do que contínua).
 */
export function quantizeScale(domain: [number, number], steps = 5, { nice = true }: { nice?: boolean } = {}): QuantizedScale {
  const n = Math.max(2, Math.round(steps));
  let [lo, hi] = domain;
  if (!(hi > lo)) hi = lo + 1;
  let step = (hi - lo) / n;
  if (nice) {
    step = niceStep(step);
    lo = Math.floor(lo / step) * step;
  }
  const thresholds = Array.from({ length: n }, (_, i) => lo + i * step);
  const bin = (v: number) => {
    if (!Number.isFinite(v)) return 0;
    let b = 0;
    for (let i = 0; i < n; i++) if (v >= thresholds[i]) b = i;
    return b;
  };
  return { thresholds, bin, level: (v) => (n === 1 ? 1 : bin(v) / (n - 1)), steps: n, domain: [lo, lo + step * n] };
}

/** Mínimo e máximo de uma lista ignorando null/NaN. */
export function scaleExtent(values: Iterable<number | null | undefined>): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values) {
    if (v == null || !Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo === Infinity ? [0, 1] : [lo, hi];
}
