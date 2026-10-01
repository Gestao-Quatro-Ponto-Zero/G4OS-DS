/*
 * Utilidades de cor para temas de cliente: contraste WCAG e derivação de uma
 * marca completa (claro + escuro) a partir de 1–2 cores. Usado pelo gerador
 * de temas do showcase e pela skill ds-theme.
 */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Luminância relativa WCAG 2.x. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste (1–21). Texto normal precisa ≥ 4,5; grande/ícone ≥ 3. */
export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Mistura `a` com `b` (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as Rgb);
}

/** Melhor cor de texto sobre `bg` entre as candidatas (padrão: branco × quase-preto). */
export function bestOn(bg: string, candidates: string[] = ["#ffffff", "#121214"]) {
  return candidates.reduce((best, c) => (contrast(bg, c) > contrast(bg, best) ? c : best), candidates[0]);
}

/** Escurece (ou clareia) `color` até atingir `min` de contraste contra `against`. */
export function ensureContrast(color: string, against: string, min = 4.5) {
  const toward = luminance(against) > 0.5 ? "#000000" : "#ffffff";
  let c = color;
  for (let t = 0; t <= 1 && contrast(c, against) < min; t += 0.04) c = mix(color, toward, t);
  return c;
}

export type BrandTokens = {
  primary: string;
  onPrimary: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  blue: string;
  chart1: string;
};

/**
 * Deriva os tokens de marca para claro e escuro a partir da cor de ação
 * (primary) e, opcionalmente, da cor de destaque (accent). Garante AA:
 * on-primary ≥ 4,5 sobre primary; accent-deep ≥ 4,5 sobre a superfície.
 */
export function deriveBrand(primary: string, accent = primary) {
  const lightSurface = "#ffffff";
  const darkSurface = "#18181b";
  const light: BrandTokens = {
    primary,
    onPrimary: bestOn(primary),
    accent,
    accentDeep: ensureContrast(accent, lightSurface, 4.5),
    accentSoft: mix(accent, lightSurface, 0.88),
    blue: ensureContrast(primary, lightSurface, 4.5),
    chart1: primary,
  };
  const darkPrimary = luminance(primary) < 0.35 ? ensureContrast(mix(primary, "#ffffff", 0.45), darkSurface, 4.5) : primary;
  const dark: BrandTokens = {
    primary: darkPrimary,
    onPrimary: bestOn(darkPrimary),
    accent: ensureContrast(mix(accent, "#ffffff", 0.2), darkSurface, 3),
    accentDeep: ensureContrast(mix(accent, "#ffffff", 0.35), darkSurface, 4.5),
    accentSoft: mix(accent, darkSurface, 0.82),
    blue: ensureContrast(mix(primary, "#ffffff", 0.5), darkSurface, 4.5),
    chart1: darkPrimary,
  };
  return { light, dark };
}

/** CSS pronto para colar em themes.css (ou no globals.css do app). */
export function brandCss(
  name: string,
  brand: { light: BrandTokens; dark: BrandTokens },
  extra: { radiusScale?: number; fontSans?: string } = {},
) {
  const block = (t: BrandTokens) =>
    [
      `  --ds-primary: ${t.primary};`,
      `  --ds-on-primary: ${t.onPrimary};`,
      `  --ds-blue: ${t.blue};`,
      `  --ds-accent: ${t.accent};`,
      `  --ds-accent-deep: ${t.accentDeep};`,
      `  --ds-accent-soft: ${t.accentSoft};`,
      `  --ds-chart-1: ${t.chart1};`,
    ].join("\n");
  const extras = [
    extra.radiusScale != null && extra.radiusScale !== 1 ? `  --ds-radius-scale: ${extra.radiusScale};` : "",
    extra.fontSans ? `  --ds-font-sans: ${extra.fontSans};` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `[data-brand="${name}"] {\n${block(brand.light)}${extras ? `\n${extras}` : ""}\n}\n[data-brand="${name}"][data-theme="dark"] {\n${block(brand.dark)}\n}\n`;
}
