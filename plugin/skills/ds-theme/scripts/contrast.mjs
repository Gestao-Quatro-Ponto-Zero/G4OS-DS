#!/usr/bin/env node
// Tema de cliente para o G4OS-DS com contraste WCAG garantido (sem dependências).
// Mesma lógica de deriveBrand/brandCss em @g4os/ds (src/lib/color.ts).
//   derive --name acme --primary "#0b5cff" [--accent "#ffb020"] [--radius 1.15] [--font '"Inter", system-ui'] [--out tema.css]
//   check tema.css            confere os blocos [data-brand] de um CSS existente
//   ratio "#fff" "#202124"    contraste entre duas cores
import { readFileSync, writeFileSync } from "node:fs";

const hexToRgb = (hex) => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
};
const bestOn = (bg, candidates = ["#ffffff", "#121214"]) => candidates.slice().sort((p, q) => contrast(q, bg) - contrast(p, bg))[0];
const ensureContrast = (color, against, min = 4.5) => {
  if (contrast(color, against) >= min) return color;
  const target = luminance(against) > 0.5 ? "#000000" : "#ffffff";
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(color, target, t);
    if (contrast(c, against) >= min) return c;
  }
  return target;
};

const LIGHT_SURFACE = "#ffffff";
const DARK_SURFACE = "#18181b";
export function deriveBrand(primary, accent = primary) {
  const light = {
    primary,
    onPrimary: bestOn(primary),
    accent,
    accentDeep: ensureContrast(accent, LIGHT_SURFACE, 4.5),
    accentSoft: mix(accent, LIGHT_SURFACE, 0.88),
    blue: ensureContrast(primary, LIGHT_SURFACE, 4.5),
    chart1: primary,
  };
  const darkPrimary = luminance(primary) < 0.35 ? ensureContrast(mix(primary, "#ffffff", 0.45), DARK_SURFACE, 4.5) : primary;
  const dark = {
    primary: darkPrimary,
    onPrimary: bestOn(darkPrimary),
    accent: ensureContrast(mix(accent, "#ffffff", 0.2), DARK_SURFACE, 3),
    accentDeep: ensureContrast(mix(accent, "#ffffff", 0.35), DARK_SURFACE, 4.5),
    accentSoft: mix(accent, DARK_SURFACE, 0.82),
    blue: ensureContrast(mix(primary, "#ffffff", 0.5), DARK_SURFACE, 4.5),
    chart1: darkPrimary,
  };
  return { light, dark };
}

const kebab = { onPrimary: "on-primary", accentDeep: "accent-deep", accentSoft: "accent-soft", chart1: "chart-1" };
export function brandCss(name, brand, { radius, font } = {}) {
  const block = (t) => Object.entries(t).map(([k, v]) => `  --ds-${kebab[k] ?? k}: ${v};`).join("\n");
  const extras = [radius != null && Number(radius) !== 1 ? `  --ds-radius-scale: ${radius};` : "", font ? `  --ds-font-sans: ${font};` : ""].filter(Boolean).join("\n");
  return `[data-brand="${name}"] {\n${block(brand.light)}${extras ? `\n${extras}` : ""}\n}\n[data-brand="${name}"][data-theme="dark"] {\n${block(brand.dark)}\n}\n`;
}

function report(label, vars, surfaces) {
  const rows = [];
  const need = (what, a, b, min) => {
    if (!a || !b) return;
    const r = contrast(a, b);
    rows.push({ what, a, b, r, min, ok: r >= min });
  };
  need("on-primary sobre primary", vars["on-primary"], vars.primary, 4.5);
  need("accent-deep sobre surface", vars["accent-deep"], vars.surface ?? surfaces.surface, 4.5);
  need("primary sobre page", vars.primary, vars.page ?? surfaces.page, 3);
  need("blue (link) sobre surface", vars.blue, vars.surface ?? surfaces.surface, 4.5);
  if (vars.ink) need("ink sobre page", vars.ink, vars.page ?? surfaces.page, 7);
  if (vars.muted) need("muted sobre surface", vars.muted, vars.surface ?? surfaces.surface, 4.5);
  if (vars["on-ink"] && vars.ink) need("on-ink sobre ink", vars["on-ink"], vars.ink, 4.5);
  console.log(`\n${label}`);
  for (const x of rows) console.log(`  ${x.ok ? "✓" : "✗"} ${x.what.padEnd(28)} ${x.a} / ${x.b}  ${x.r.toFixed(2)}:1 (mín. ${x.min})`);
  return rows.every((x) => x.ok);
}

const parseVars = (body) => Object.fromEntries([...body.matchAll(/--ds-([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b/g)].map(([, k, v]) => [k, v.toLowerCase()]));
const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};

if (args[0] === "derive") {
  const name = opt("name") ?? "cliente";
  const primary = opt("primary");
  if (!primary) {
    console.error('Informe --primary "#hex"');
    process.exit(1);
  }
  const brand = deriveBrand(primary, opt("accent") ?? primary);
  const css = brandCss(name, brand, { radius: opt("radius"), font: opt("font") });
  if (opt("out")) writeFileSync(opt("out"), css);
  console.log(css);
  const ok1 = report(`Contraste · ${name} · claro`, { ...Object.fromEntries(Object.entries(brand.light).map(([k, v]) => [kebab[k] ?? k, v])) }, { surface: LIGHT_SURFACE, page: LIGHT_SURFACE });
  const ok2 = report(`Contraste · ${name} · escuro`, { ...Object.fromEntries(Object.entries(brand.dark).map(([k, v]) => [kebab[k] ?? k, v])) }, { surface: DARK_SURFACE, page: "#111113" });
  process.exit(ok1 && ok2 ? 0 : 1);
} else if (args[0] === "check" && args[1]) {
  const css = readFileSync(args[1], "utf8");
  let ok = true;
  for (const m of css.matchAll(/\[data-brand="([\w-]+)"\](\[data-theme="dark"\])?\s*\{([^}]*)\}/g)) {
    const dark = Boolean(m[2]);
    if (!Object.keys(parseVars(m[3])).length) continue; // bloco sem cores (exemplo em comentário)
    ok = report(`${m[1]} · ${dark ? "escuro" : "claro"}`, parseVars(m[3]), dark ? { surface: DARK_SURFACE, page: "#111113" } : { surface: LIGHT_SURFACE, page: LIGHT_SURFACE }) && ok;
  }
  process.exit(ok ? 0 : 1);
} else if (args[0] === "ratio" && args[2]) {
  console.log(`${contrast(args[1], args[2]).toFixed(2)}:1`);
} else {
  console.log(`contrast.mjs derive --name acme --primary "#0b5cff" [--accent "#ffb020"] [--radius 1.15] [--font '"Inter", system-ui'] [--out tema.css]
contrast.mjs check tema.css
contrast.mjs ratio "#ffffff" "#202124"`);
}
