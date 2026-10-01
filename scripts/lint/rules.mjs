// Regras do G4OS-DS: uma fonte só para o CLI (g4os-ds audit), o plugin ESLint
// (@g4ai/ds/eslint) e a tool `audit` do MCP. Cada regra tem metadados (categoria,
// gravidade por preset, dica, link) e é verificada em uma de três passadas:
//   class  → cada classe de cada string (className, cn(), clsx(), templates)
//   tag    → cada tag JSX/HTML com seus atributos
//   code   → o código (sem comentários) e as strings soltas
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { splitVariants, tagBody } from "./source.mjs";

export const DOCS_BASE = "https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/blob/main/docs/guias/auditoria.md";

export const CATEGORIES = {
  tokens: "Tokens e cor",
  tipografia: "Tipografia",
  a11y: "Acessibilidade",
  formatacao: "Formatação pt-BR",
  componentes: "Componentes",
  react: "React",
  imports: "Imports",
  seguranca: "Segurança",
  performance: "Performance",
};

/** Tamanhos de texto permitidos (px). ≥ 26 = display (hero, slides). */
export const TEXT_ALLOW = new Set([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30]);
const RADIUS_TOKEN = { 6: "chip", 8: "control", 10: "tile", 12: "card", 16: "shell" };
const Z_TOKEN = { 15: "sticky-local", 20: "sticky", 30: "sticky-shell", 40: "nav", 50: "floating", 80: "toast", 90: "backdrop", 95: "modal", 100: "popup" };
const TW_TEXT = { "text-xs": ["text-caption", 12], "text-sm": ["text-input", 14], "text-base": ["text-[16px]", 16], "text-lg": ["text-section", 18], "text-xl": ["text-record", 20], "text-2xl": ["text-[24px]", 24] };

/**
 * Regras. `severity` = preset recommended; `strict`/`migration` sobrescrevem quando diferem.
 * Gravidades: "error" | "warn" | "info" | "off".
 */
export const RULES = {
  // tokens
  "hex-color": { category: "tokens", severity: "error", fixable: false, title: "Cor fixa (hex/rgb/hsl)", hint: "Use o token: bg-surface, text-ink, border-line; em SVG/style, var(--ds-…)." },
  "white-black": { category: "tokens", severity: "error", fixable: true, title: "bg-white / text-white / *-black", hint: "bg-surface (card), bg-popover (menu), text-on-primary (sobre primary), text-on-ink (sobre ink/rose/ok). text-white só sobre bg-navy/bg-brand." },
  "tailwind-palette": { category: "tokens", severity: "error", fixable: true, title: "Cor da paleta do Tailwind", hint: "Troque pelo token semântico sugerido (text-muted, border-line, bg-ok-soft…)." },
  "shadcn-class": { category: "tokens", severity: "error", fixable: true, title: "Classe semântica do shadcn", hint: "Troque pelo equivalente do DS (ou importe @g4ai/ds/shadcn.css e troque aos poucos)." },
  "hardcoded-dark": { category: "tokens", severity: "warn", fixable: true, title: "dark: trocando cor que o token já troca", hint: "Remova: bg-surface/text-ink/border-line já mudam no tema escuro. dark: só para imagem e ilustração." },
  "arbitrary-radius": { category: "tokens", severity: "warn", fixable: true, title: "Raio arbitrário igual a um token", hint: "rounded-chip (6) · rounded-control (8) · rounded-tile (10) · rounded-card (12) · rounded-shell (16): seguem --ds-radius-scale da marca." },
  "arbitrary-shadow": { category: "tokens", severity: "warn", fixable: false, title: "Sombra arbitrária sem token", hint: "shadow-surface · shadow-raised · shadow-popup · shadow-toast · shadow-overlay (mudam no tema escuro)." },
  "z-index": { category: "tokens", severity: "warn", fixable: false, title: "z-index acima da camada de popup", hint: "A pilha do DS vai até --z-popup (100). Acima disso, menus e selects ficam por baixo." },
  "z-index-token": { category: "tokens", severity: "off", strict: "info", fixable: true, title: "z-index numérico igual a uma camada do DS", hint: "z-[var(--z-sticky)] · z-[var(--z-modal)] · z-[var(--z-popup)]…" },
  // tipografia
  "text-size": { category: "tipografia", severity: "warn", fixable: false, title: "Tamanho de texto fora da escala", hint: "text-caption/label/control/body/input/section/title ou um px da escala (10–25, 30)." },
  "tailwind-text-scale": { category: "tipografia", severity: "off", strict: "warn", fixable: true, title: "Escala de texto do Tailwind (text-sm, text-lg…)", hint: "Use a escala do DS: text-caption (12), text-input (14), text-section (18), text-record (20)." },
  // componentes
  "native-select": { category: "componentes", severity: "error", fixable: false, title: "<select> cru", hint: "Select (lista curta), Combobox (entidades), MultiSelect (vários) ou NativeSelect (seletor do sistema estilizado: celular, lista longa sem busca)." },
  "native-date": { category: "componentes", severity: "error", fixable: false, title: '<input type="date|datetime-local|month">', hint: "DatePicker · DateTimePicker · MonthPicker · TimePicker." },
  "confirm-alert": { category: "componentes", severity: "error", fixable: false, title: "window.confirm / alert / prompt", hint: "ConfirmDialog para confirmar; notify para avisar; Modal com campo para perguntar." },
  "deprecated-export": { category: "componentes", severity: "error", fixable: true, title: "Export ou classe renomeada", hint: "Troque pelo nome novo (ai/renames.json)." },
  "as-any-props": { category: "componentes", severity: "info", fixable: false, title: "as any em prop de componente", hint: "Tipos do DS documentam o contrato: ajuste o dado, não silencie o tipo." },
  // a11y
  "icon-button-label": { category: "a11y", severity: "error", fixable: false, title: "Botão só com ícone sem nome acessível", hint: "IconButton label=… ou aria-label no <button>." },
  "img-alt": { category: "a11y", severity: "error", fixable: false, title: "<img> sem alt", hint: 'alt="descrição" (ou alt="" se for decorativa).' },
  "field-label": { category: "a11y", severity: "warn", fixable: false, title: "Campo sem rótulo", hint: "Envolva em FieldBlock label=… (rótulo visível) ou dê aria-label." },
  "clickable-div": { category: "a11y", severity: "warn", fixable: false, title: "onClick em div/span sem teclado", hint: "Use <button type=\"button\"> (ou role, tabIndex={0} e onKeyDown)." },
  "outline-none": { category: "a11y", severity: "warn", fixable: false, title: "Foco removido sem substituto", hint: "Mantenha um foco visível: focus-visible:ring-2 ring-primary/40, ou deixe o foco global do DS." },
  "positive-tabindex": { category: "a11y", severity: "warn", fixable: false, title: "tabIndex positivo", hint: "Use 0 ou -1; a ordem do teclado segue o DOM." },
  "html-lang": { category: "a11y", severity: "warn", fixable: false, title: '<html> sem lang="pt-BR"', hint: '<html lang="pt-BR" className="ds-app" data-theme="system">' },
  // formatação
  "number-format": { category: "formatacao", severity: "error", fixable: false, title: "Formatação fora do pt-BR", hint: "formatCurrency / formatNumber / formatPercent / formatDate de @g4ai/ds." },
  "locale-missing": { category: "formatacao", severity: "warn", fixable: false, title: "toLocaleString/Intl sem locale", hint: "Sem locale, o formato muda com o navegador. Use os formatadores de @g4ai/ds (pt-BR)." },
  "date-format": { category: "formatacao", severity: "warn", fixable: false, title: "Formato de data fixo", hint: "formatDate / formatRelative de @g4ai/ds (dd/mm/aaaa, '12 mar', 'há 2 dias')." },
  // react
  "effect-return": { category: "react", severity: "warn", fixable: false, title: "Efeito devolve algo que não é limpeza", hint: "useEffect(() => { x(); }, …): um efeito só pode devolver uma função de limpeza (Promise ou valor quebra o React)." },
  // imports
  "deep-import": { category: "imports", severity: "error", fixable: true, title: "Import interno do pacote", hint: 'Importe de "@g4ai/ds" (e CSS de "@g4ai/ds/styles.css"): caminhos internos mudam entre versões.' },
  // segurança
  "target-blank": { category: "seguranca", severity: "warn", fixable: true, title: 'target="_blank" sem rel="noopener"', hint: 'Adicione rel="noopener noreferrer".' },
  "dangerous-html": { category: "seguranca", severity: "warn", fixable: false, title: "dangerouslySetInnerHTML", hint: "Só com HTML gerado por você e escapado (themeScript é seguro). Conteúdo de usuário: RichTextView." },
  // performance
  "icon-star-import": { category: "performance", severity: "warn", fixable: false, title: 'import * de "lucide-react"', hint: "Importe só os ícones usados: import { Plus } from \"lucide-react\"." },
};

for (const [id, r] of Object.entries(RULES)) r.docs = `${DOCS_BASE}#${id}`;

export const PRESETS = ["recommended", "strict", "migration"];

/** Gravidade de uma regra num preset. */
export function presetSeverity(id, preset = "recommended") {
  const r = RULES[id];
  if (preset === "strict") return r.strict ?? (r.severity === "off" ? "warn" : r.severity);
  if (preset === "migration") {
    if (r.migration) return r.migration;
    if (r.severity === "off") return "off";
    return ["deep-import", "deprecated-export", "target-blank", "img-alt"].includes(id) ? r.severity : "warn";
  }
  return r.severity;
}

/* ------------------------------------------------------------------ */
/* Renomeações (ai/renames.json)                                       */
/* ------------------------------------------------------------------ */

let renamesCache;
/** Só para testes: troca as renomeações (null volta a ler ai/renames.json). */
export function setRenames(r) {
  renamesCache = r ? { exports: Object.fromEntries(Object.entries(r.exports ?? {}).map(([a, b]) => [a, { to: b, since: "teste" }])), classes: Object.fromEntries(Object.entries(r.classes ?? {}).map(([a, b]) => [a, { to: b, since: "teste" }])) } : undefined;
}
export function renames() {
  if (renamesCache) return renamesCache;
  const exports = {};
  const classes = {};
  try {
    const p = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "ai", "renames.json");
    const json = JSON.parse(readFileSync(p, "utf8"));
    for (const [v, r] of Object.entries(json)) {
      if (v.startsWith("$")) continue;
      for (const [a, b] of Object.entries(r.exports ?? {})) exports[a] = { to: b, since: v };
      for (const [a, b] of Object.entries(r.classes ?? {})) classes[a] = { to: b, since: v };
    }
  } catch {
    /* sem renames.json: regra fica vazia */
  }
  return (renamesCache = { exports, classes });
}

/* ------------------------------------------------------------------ */
/* Passada "class"                                                     */
/* ------------------------------------------------------------------ */

const NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"];
const HUES = "slate|gray|zinc|neutral|stone|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia";
const STATE_HUE = { red: "rose", rose: "rose", green: "ok", emerald: "ok", amber: "amber", yellow: "amber", orange: "amber", sky: "info", cyan: "info" };
const COLOR_PROPS = "bg|text|border(?:-[trblxy])?|ring|fill|stroke|divide|outline|from|to|via|shadow|decoration|placeholder|caret|accent";
const PALETTE_RE = new RegExp(`^(${COLOR_PROPS})-(${HUES})-(50|[1-9]00|950)(/[\\w.[\\]]+)?$`);
const WB_RE = new RegExp(`^(${COLOR_PROPS})-(white|black)(/[\\w.[\\]]+)?$`);
const DS_COLOR_TOKENS = "page|surface|popover|soft|rail|ink|ink-soft|muted|line|line-strong|primary|on-primary|on-ink|accent|accent-soft|accent-deep|ok|ok-soft|amber|amber-soft|rose|rose-soft|info|info-soft|blue";
const DARK_TOKEN_RE = new RegExp(`^(bg|text|border(?:-[trblxy])?|ring|divide|fill|stroke)-(white|black|${DS_COLOR_TOKENS}|(?:${HUES})-\\d+)(/[\\w.[\\]]+)?$`);

/** Sugestão (e troca segura, quando existe) para uma cor da paleta. */
function paletteFix(prop, hue, shade) {
  const n = Number(shade);
  const p = prop.replace(/-[trblxy]$/, "");
  if (NEUTRALS.includes(hue)) {
    // fundo neutro depende do papel (bg-soft para hover/faixa, bg-surface para card, bg-page para página): sem troca automática
    if (p === "bg") return { sug: n <= 100 ? "bg-soft (hover, faixa) · bg-surface (card) · bg-page (página)" : n <= 300 ? "bg-soft ou bg-line" : n >= 800 ? "bg-primary (ação) ou bg-ink" : "bg-soft" };
    if (["border", "divide", "ring", "outline"].includes(p)) return n <= 200 ? { fix: `${prop}-line` } : n <= 400 ? { fix: `${prop}-line-strong` } : { sug: `${prop}-line-strong` };
    if (p === "text" || p === "placeholder") return n >= 400 && n <= 500 ? { fix: `${prop}-muted` } : n >= 600 && n <= 700 ? { fix: `${prop}-ink-soft` } : n >= 800 ? { fix: `${prop}-ink` } : { sug: `${prop}-muted` };
    return { sug: `${prop}-muted / ${prop}-ink` };
  }
  const t = STATE_HUE[hue];
  if (t) {
    if (p === "bg") return n <= 100 ? { fix: `bg-${t}-soft` } : { sug: `bg-${t} text-on-ink` };
    if (p === "text") return n >= 500 && n <= 800 ? { fix: `text-${t}` } : { sug: `text-${t}` };
    if (p === "border" || p === "ring") return n >= 200 && n <= 300 ? { fix: `${prop}-${t}/30` } : { sug: `${prop}-${t}/30` };
    return { sug: `${prop}-${t}` };
  }
  if (["blue", "indigo"].includes(hue)) return { sug: p === "bg" ? "bg-primary (ação) ou bg-info-soft" : p === "text" ? "text-blue (link) ou text-info" : `${prop}-info` };
  return { sug: p === "bg" ? "bg-primary text-on-primary (ação) ou bg-accent-soft" : `${prop}-accent-deep` };
}

const SHADCN = {
  "bg-background": "bg-page",
  "text-foreground": "text-ink",
  "bg-card": "bg-surface",
  "text-card-foreground": "text-ink",
  "text-popover-foreground": "text-ink",
  "bg-muted": "bg-soft",
  "text-muted-foreground": "text-muted",
  "bg-secondary": "bg-soft",
  "text-secondary-foreground": "text-ink",
  "text-accent-foreground": "text-ink",
  "text-primary-foreground": "text-on-primary",
  "text-destructive": "text-rose",
  "text-destructive-foreground": "text-on-ink",
  "border-destructive": "border-rose",
  "border-input": "border-line",
  "border-border": "border-line",
  "bg-destructive": null, // bg-rose text-on-ink
  "ring-ring": null, // remova: o foco global do DS já cuida
  "ring-offset-background": null,
};
const SHADCN_HINT = { "bg-destructive": "bg-rose text-on-ink", "ring-ring": "remova: o foco global do DS já cuida", "ring-offset-background": "remova", "bg-muted": "bg-soft (no DS `muted` é cor de TEXTO)" };

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/;

/**
 * Verifica uma classe. `ctx` = { all: Set das classes da mesma string, near: texto da linha }.
 * Devolve [{ rule, suggestion, replace? (string; "" apaga) }].
 */
export function checkClass(token, ctx) {
  const out = [];
  const { variants, base, important } = splitVariants(token);
  if (!base || base.length > 200) return out;
  const prefix = variants.length ? `${variants.join(":")}:` : "";
  const lead = important && token.slice(prefix.length).startsWith("!");
  const trail = important && !lead;
  const rebuild = (b) => `${prefix}${lead ? "!" : ""}${b}${trail ? "!" : ""}`;
  const isDark = variants.includes("dark");

  // cor literal em valor arbitrário (bg-[#fff], shadow-[0_0_0_1px_#000], fill-[rgb(…)])
  const arb = /\[(.*)\]/.exec(base);
  // var(--token, fallback) é token com plano B: ok.
  if (arb && !/^var\(--/.test(arb[1]) && COLOR_LITERAL.test(arb[1].replace(/url\(#[^)]*\)/g, "")) && !/^(content|font|grid|bg-\[url)/.test(base)) {
    out.push({ rule: "hex-color", suggestion: "Use o utilitário do token (bg-surface, text-ink…) ou var(--ds-…) dentro do valor." });
    return out;
  }

  if (isDark) {
    if (DARK_TOKEN_RE.test(base)) out.push({ rule: "hardcoded-dark", replace: "" });
    if (PALETTE_RE.test(base) || WB_RE.test(base)) return out;
  }

  let m = WB_RE.exec(base);
  if (m) {
    const [, prop, color, alpha = ""] = m;
    const darkCtx = /\b(bg-navy|from-navy|bg-black|bg-graph|bg-ai|bg-brand)\b/.test(ctx.near);
    if (color === "white" && darkCtx && (prop !== "bg" || alpha)) return out;
    if (color === "black" && alpha && (prop === "bg" || prop === "shadow")) return out; // backdrop bg-black/20, cor de sombra
    if (color === "white" && prop === "bg") out.push({ rule: "white-black", suggestion: "bg-surface (ou bg-popover em menus/modais)", replace: rebuild(`bg-surface${alpha}`) });
    else if (color === "black" && prop === "text") out.push({ rule: "white-black", suggestion: "text-ink", replace: rebuild(`text-ink${alpha}`) });
    else if (color === "white" && prop === "text") {
      const has = (re) => [...ctx.all].some((c) => re.test(splitVariants(c).base));
      const to = has(/^bg-primary(\/|$)/) ? "text-on-primary" : has(/^bg-brand(\/|$)/) ? "text-on-brand" : has(/^bg-(ink|rose|ok|amber|info|clay|magenta)(\/|$)/) ? "text-on-ink" : null;
      out.push({ rule: "white-black", suggestion: to ?? "text-on-primary (sobre primary) · text-on-ink (sobre ink/rose/ok) · text-white só sobre bg-navy", replace: to ? rebuild(`${to}${alpha}`) : undefined });
    } else out.push({ rule: "white-black", suggestion: prop === "bg" ? "bg-ink (ou bg-black/40 para backdrop)" : `${prop}-line / ${prop}-surface` });
    return out;
  }

  m = PALETTE_RE.exec(base);
  if (m) {
    const [, prop, hue, shade, alpha = ""] = m;
    const f = paletteFix(prop, hue, shade);
    out.push({ rule: "tailwind-palette", suggestion: f.fix ?? f.sug, replace: f.fix ? rebuild(f.fix + (f.fix.includes("/") ? "" : alpha)) : undefined });
    return out;
  }

  if (base in SHADCN) {
    const to = SHADCN[base];
    out.push({ rule: "shadcn-class", suggestion: SHADCN_HINT[base] ?? to, replace: to ? rebuild(to) : undefined });
  } else if (base === "bg-accent" && variants.some((v) => /^(hover|focus|data-\[highlighted\]|data-\[state=open\]|aria-selected)/.test(v))) {
    out.push({ rule: "shadcn-class", suggestion: `${prefix}bg-soft (no DS \`accent\` é o dourado de marca)`, replace: rebuild("bg-soft") });
  }

  m = /^text-\[(\d+(?:\.\d+)?)(px|rem|em)\]$/.exec(base);
  if (m) {
    const px = m[2] === "px" ? Number(m[1]) : Number(m[1]) * 16;
    if (m[2] !== "px") out.push({ rule: "text-size", suggestion: `Use px da escala (${px}px ≈ ${nearestText(px)}px).` });
    else if (!TEXT_ALLOW.has(px) && px < 26) out.push({ rule: "text-size", suggestion: `Mais próximo na escala: ${nearestText(px)}px` });
  }
  if (base in TW_TEXT) out.push({ rule: "tailwind-text-scale", suggestion: TW_TEXT[base][0], replace: rebuild(TW_TEXT[base][0]) });

  m = /^rounded(-(?:[trbl]|tl|tr|bl|br|s|e|ss|se|es|ee))?-\[(\d+)px\]$/.exec(base);
  if (m && RADIUS_TOKEN[m[2]]) out.push({ rule: "arbitrary-radius", suggestion: `rounded${m[1] ?? ""}-${RADIUS_TOKEN[m[2]]}`, replace: rebuild(`rounded${m[1] ?? ""}-${RADIUS_TOKEN[m[2]]}`) });

  m = /^shadow-\[(.+)\]$/.exec(base);
  if (m && !/var\(--/.test(m[1])) out.push({ rule: "arbitrary-shadow" });

  m = /^-?z-(?:\[(\d+)\]|(\d+))$/.exec(base);
  if (m) {
    const n = Number(m[1] ?? m[2]);
    if (n > 100) out.push({ rule: "z-index", suggestion: n > 100 ? "z-[var(--z-popup)] no máximo; para modal use z-[var(--z-modal)]." : undefined });
    else if (Z_TOKEN[n]) out.push({ rule: "z-index-token", suggestion: `z-[var(--z-${Z_TOKEN[n]})]`, replace: rebuild(`z-[var(--z-${Z_TOKEN[n]})]`) });
  }

  const ren = renames().classes[token] ?? renames().classes[base];
  if (ren && !out.length) out.push({ rule: "deprecated-export", suggestion: `${ren.to} (desde ${ren.since})`, replace: rebuild(ren.to) });
  return out;
}

const nearestText = (px) => [...TEXT_ALLOW].sort((a, b) => Math.abs(a - px) - Math.abs(b - px))[0];

/* ------------------------------------------------------------------ */
/* Passada "tag"                                                       */
/* ------------------------------------------------------------------ */

const FOCUS_REPLACEMENT = /(focus-visible|focus|focus-within|group-focus-visible|peer-focus-visible|data-\[focus[\w-]*\]|data-\[highlighted\]):(ring|shadow|outline-(?!none|hidden|0)|border|bg|underline|text)|(?<![\w-])ds-bare(?![\w-])/;
const OUTLINE_NONE = /(?<![\w-])(?:[\w-]+:)*outline-(none|hidden|0)(?![\w-])/;

/** Rótulo envolvendo a posição? (<label> ou FieldBlock/Field abertos antes, ainda não fechados) */
function insideLabel(code, at) {
  const before = code.slice(Math.max(0, at - 4000), at);
  const marks = [...before.matchAll(/<(\/?)(label|FieldBlock|Field)(?=[\s>])/g)];
  let depth = 0;
  for (let k = marks.length - 1; k >= 0; k--) {
    if (marks[k][1]) depth++;
    else if (depth === 0) return true;
    else depth--;
  }
  return false;
}

/** Roda as regras de tag. `report(rule, start, end, extra)` */
export function checkTag(tag, { code, raw = code, report, ext }) {
  const { name } = tag;
  const lower = name[0] === name[0].toLowerCase();
  const a = (k) => tag.attr(k);
  const strVal = (k) => {
    const x = a(k);
    if (!x) return undefined;
    if (x.kind === "string") return x.value;
    const s = /^\s*["'`]([^"'`]*)["'`]\s*$/.exec(x.value);
    return s ? s[1] : null; // null = expressão dinâmica
  };
  const at = [tag.start, Math.min(tag.end, tag.start + name.length + 1)];

  if (name === "select") report("native-select", ...at);
  if (name === "input" && /^(date|datetime-local|month|week|time)$/.test(strVal("type") ?? "")) report("native-date", ...at);
  if (name === "html" && ext !== ".css") {
    const lang = strVal("lang");
    if (lang !== "pt-BR" && lang !== null && !tag.spread) report("html-lang", ...at);
  }

  if (name === "img" && !tag.has("alt") && !tag.spread) report("img-alt", ...at);

  if (name === "button" && !tag.spread && !tag.has("aria-label", "aria-labelledby", "title", "aria-hidden")) {
    const body = tagBody(code, tag);
    if (body != null) {
      const text = body
        .replace(/\{\s*\}/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (text === "" && /<[A-Z][\w.]*[^>]*\/>/.test(body)) report("icon-button-label", ...at);
    }
  }
  if (name === "IconButton" && !tag.spread && !tag.has("label", "aria-label")) report("icon-button-label", ...at);

  if ((name === "input" || name === "textarea") && !tag.spread) {
    const type = strVal("type") ?? "text";
    const skip = /^(hidden|submit|button|reset|image|file)$/.test(type);
    if (!skip && !tag.has("aria-label", "aria-labelledby", "id", "title") && !insideLabel(code, tag.start)) report("field-label", ...at);
  }

  if (/^(div|span|li|td|tr|p|img|section|article)$/.test(name) && tag.has("onClick") && !tag.spread) {
    const role = strVal("role");
    // onClick que só para propagação ou só foca o campo de dentro não é uma ação nova.
    const handler = a("onClick").value.replace(/^[^?]*\?(?!\.)\s*/, "").replace(/\s*:\s*undefined\s*$/, "");
    const passive = /^\s*\(?\s*\w*\s*\)?\s*=>\s*[\w$.?]+\.(stopPropagation|focus)\(\)\s*$/.test(handler);
    const decorative = tag.has("aria-hidden") || role === "presentation" || role === "none";
    // item de widget composto (listbox, menu, árvore, grade): o contêiner cuida do teclado
    const composite = /^(option|menuitem|menuitemcheckbox|menuitemradio|treeitem|row|gridcell|tab)$/.test(role ?? "");
    const keyboard = tag.has("tabIndex", "contentEditable") && tag.has("onKeyDown", "onKeyUp", "onKeyPress");
    if (!passive && !decorative && !composite && !keyboard) report("clickable-div", ...at);
  }

  const ti = a("tabIndex") ?? a("tabindex");
  if (ti && /^\s*[1-9]\d*\s*$/.test(ti.value)) report("positive-tabindex", ti.start, ti.end);

  if (name === "a" && strVal("target") === "_blank") {
    const rel = strVal("rel");
    if (!tag.spread && (rel === undefined || (rel !== null && !/noopener|noreferrer/.test(rel)))) {
      const t = a("target");
      report("target-blank", t.start, t.end, rel === undefined ? { fix: { start: t.end, end: t.end, text: ' rel="noopener noreferrer"' } } : {});
    }
  }

  const dh = a("dangerouslySetInnerHTML");
  if (dh && !/__html:\s*themeScript\b/.test(dh.value)) report("dangerous-html", dh.start, dh.end);

  const cls = a("className") ?? a("class");
  const clsRaw = cls ? raw.slice(cls.valueStart, cls.end) : "";
  if (cls && lower && !/^(input|textarea|select)$/.test(name) && OUTLINE_NONE.test(clsRaw) && !FOCUS_REPLACEMENT.test(clsRaw)) {
    // Substitutos aceitos: filho com group-focus-visible:, contêiner com focus-within:,
    // alvo programático (tabIndex={-1}, ex.: <main> de "pular para o conteúdo").
    const groupOk = /(?<![\w-])group(?![\w-])/.test(clsRaw) && /group-focus(-visible)?:/.test(tagBody(raw, tag) ?? "");
    const programmatic = /^\s*-1\s*$/.test(a("tabIndex")?.value ?? "");
    const containerOk = /focus-within:/.test(raw.slice(Math.max(0, tag.start - 800), tag.start));
    if (!groupOk && !programmatic && !containerOk) report("outline-none", cls.start, cls.end);
  }

  if (!lower && !tag.spread) {
    for (const x of tag.attrs) {
      const codeOnly = x.kind === "expr" ? x.value.replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""') : "";
      if (/\bas\s+any\b/.test(codeOnly)) report("as-any-props", x.start, x.end);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Passada "code"                                                      */
/* ------------------------------------------------------------------ */

// Corpo conciso que devolve Promise ou valor (setState/scrollIntoView devolvem undefined: ok).
const EFFECT_BAD_BODY = /^(?:async\b|await\b|new\s|fetch\(|import\(|[\w$.?]+(?:\?\.|\.)(?:then|catch|finally|play|json|text|requestFullscreen|share|writeText)\(|[\w$.[\]]+\s*[+\-*/|&]?=(?![=>])|[[{"'`\d])/;

/**
 * Regras sobre o código. `code` = texto sem comentários, com o conteúdo de templates apagado
 * (exemplos de código em `…` não contam). `strings` = literais (para padrões dentro de string).
 */
export function checkCode({ code, strings, report, ext }) {
  if (ext === ".css") return;

  // confirm/alert/prompt (ignora se o arquivo declara um `confirm` próprio, ex.: const { confirm } = useConfirm())
  const local = new Set();
  for (const m of code.matchAll(/(?:\b(?:const|let|var|function)\s+|[{,]\s*)(confirm|alert|prompt)\b(?=\s*[,}=(:])/g)) local.add(m[1]);
  for (const m of code.matchAll(/(?<![\w.$])(window\.)?(confirm|alert|prompt)\s*\(/g)) {
    if (!m[1] && local.has(m[2])) continue;
    if (!m[1] && /function\s*$/.test(code.slice(Math.max(0, m.index - 12), m.index))) continue;
    report("confirm-alert", m.index, m.index + m[0].length - 1);
  }

  // cor literal em atributo SVG/estilo: fill="#fff", style={{ color: "rgb(…)" }}; `tint` é identidade do registro
  for (const s of strings) {
    if (!COLOR_LITERAL.test(s.value.replace(/url\(#[^)]*\)/g, "").replace(/var\(--[\w-]+\s*,[^)]*\)/g, ""))) continue;
    const before = code.slice(Math.max(0, s.start - 40), s.start - 1);
    if (!/(?:^|[\s{,(])(fill|stroke|stopColor|stop-color|floodColor|lightingColor|color|background|backgroundColor|backgroundImage|borderColor|outlineColor|caretColor|textDecorationColor|boxShadow)\s*(?:=\s*\{?|:\s*)$/.test(before)) continue;
    const line = code.slice(code.lastIndexOf("\n", s.start) + 1, code.indexOf("\n", s.start) >>> 0);
    if (/\btint\b/.test(line)) continue;
    report("hex-color", s.start, s.end, { suggestion: "var(--ds-…) (ex.: var(--ds-ink), color-mix(in oklab, var(--ds-ink) 20%, transparent))." });
  }

  // formatação en-US / dinheiro na mão
  for (const m of code.matchAll(/\.toLocale(?:Date|Time)?String\(\s*["'`]en|new Intl\.\w+\(\s*["'`]en|\.toFixed\(\s*2\s*\)|["'`]R\$ ?["'`]\s*\+|["'`]\$\s?["'`]\s*\+|currency:\s*["'`]USD|["'`]US\$/g)) report("number-format", m.index, m.index + m[0].length);
  for (const s of strings) {
    if (s.quote === "`" && /^\s*R\$\s?$/.test(s.value) && code.slice(s.end, s.end + 2) === "${") report("number-format", s.start, s.end);
  }

  for (const m of code.matchAll(/\.toLocale(?:Date|Time)?String\(\s*\)|new Intl\.(?:NumberFormat|DateTimeFormat|RelativeTimeFormat)\(\s*(?:\)|undefined\b)/g)) report("locale-missing", m.index, m.index + m[0].length);

  for (const s of strings) {
    const v = s.value.trim();
    if (/^(?:[dDmMyY]{1,4}[/.-]){2}[dDmMyY]{1,4}(?:[ T][Hh]{1,2}:mm(?::ss)?)?$/.test(v) && /M/.test(v) && /[dD]/.test(v)) report("date-format", s.start, s.end, { suggestion: /^M/.test(v) ? "Ordem americana (mês/dia). Use formatDate de @g4ai/ds." : undefined });
  }

  // efeito que devolve algo que não é limpeza
  for (const m of code.matchAll(/\buse(?:Layout)?Effect\(\s*(async\b)?\s*\(\s*\)\s*=>\s*/g)) {
    const rest = code.slice(m.index + m[0].length, m.index + m[0].length + 200);
    if (m[1] || (!rest.startsWith("{") && !rest.startsWith("(") && EFFECT_BAD_BODY.test(rest))) report("effect-return", m.index, m.index + m[0].length);
  }

  // imports internos / nome antigo do pacote
  for (const m of code.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\(\s*)(["'])([^"'\n]+)\1/g)) {
    const spec = m[2];
    const s = m.index + m[0].length - spec.length - 1;
    const fix = deepImportFix(spec);
    if (fix !== undefined) report("deep-import", s, s + spec.length, fix ? { fix: { start: s, end: s + spec.length, text: fix }, suggestion: fix } : {});
  }

  // exports renomeados (ai/renames.json): troca no import por "Novo as Antigo"
  const ren = renames().exports;
  if (Object.keys(ren).length) {
    for (const m of code.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']@g4ai\/ds["']/g)) {
      const listStart = m.index + m[0].indexOf("{") + 1;
      for (const im of m[1].matchAll(/\b([A-Za-z_$][\w$]*)\b(\s+as\s+[\w$]+)?/g)) {
        const r = ren[im[1]];
        if (!r || im[1] === "type") continue;
        const s = listStart + im.index;
        report("deprecated-export", s, s + im[1].length, { suggestion: `${r.to} (desde ${r.since})`, fix: { start: s, end: s + im[1].length, text: im[2] ? r.to : `${r.to} as ${im[1]}` } });
      }
    }
  }

  for (const m of code.matchAll(/import\s+\*\s+as\s+\w+\s+from\s*["']lucide-react["']/g)) report("icon-star-import", m.index, m.index + m[0].length);
}

/** Caminho interno → troca segura ("" = sem troca automática; undefined = está ok). */
export function deepImportFix(spec) {
  if (/^@g4os\/ds(\/|$)/.test(spec)) return spec.replace(/^@g4os\/ds/, "@g4ai/ds");
  const m = /^@g4ai\/ds\/(src|dist)\/(.*)$/.exec(spec);
  if (m) {
    if (/^styles\/(index|tokens|themes|shadcn)\.css$/.test(m[2])) return `@g4ai/ds/${m[2].replace("styles/", "").replace("index.css", "styles.css")}`;
    if (/\.css$/.test(m[2])) return "";
    return "@g4ai/ds";
  }
  if (/(^|\/)node_modules\//.test(spec)) return "";
  if (/(^|\/)G4OS-DS\/src\//.test(spec)) return /\.css$/.test(spec) ? "@g4ai/ds/styles.css" : "@g4ai/ds";
  return undefined;
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

export function checkCss({ text, css, report }) {
  // Hex fora de custom property é cor fixa. Custom properties (tokens, [data-brand]) são o lugar da cor.
  const lines = css.split("\n");
  let off = 0;
  for (const line of lines) {
    // custom properties, url(…) e máscaras (#000 em mask-image é opacidade, não cor) não contam
    const masked = line
      .replace(/--[\w-]+\s*:[^;]*;?/g, (d) => " ".repeat(d.length))
      .replace(/(?:-webkit-)?mask(?:-image)?\s*:[^;]*;?/g, (d) => " ".repeat(d.length))
      .replace(/url\([^)]*\)/g, (d) => " ".repeat(d.length));
    for (const m of masked.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/g)) report("hex-color", off + m.index, off + m.index + m[0].length);
    for (const m of masked.matchAll(/\bz-index\s*:\s*(\d+)/g)) if (Number(m[1]) > 100) report("z-index", off + m.index, off + m.index + m[0].length);
    off += line.length + 1;
  }
  // outline: none sem substituto no mesmo bloco
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const [, selector, body] = m;
    const o = /\boutline\s*:\s*(none|0)\b/.exec(body);
    if (!o) continue;
    if (/box-shadow|border-color|outline-color|background|text-decoration/.test(body)) continue;
    if (!/:focus/.test(selector)) continue; // fora de :focus não remove o foco de ninguém
    // foco mostrado por um ancestral: .card:has(.link:focus-visible) { outline: … }
    const compound = /([.#]?[\w-]+)(?=:focus)/.exec(selector.trim().split(/\s+/).pop() ?? "")?.[1];
    if (compound && css.includes(`:has(${compound}:focus`)) continue;
    const at = m.index + selector.length + 1 + o.index;
    report("outline-none", at, at + o[0].length);
  }
  for (const m of css.matchAll(/@import\s+(?:url\()?["']([^"']+)["']/g)) {
    const spec = m[1];
    const fix = deepImportFix(spec);
    const s = m.index + m[0].length - spec.length - 1;
    if (fix !== undefined) report("deep-import", s, s + spec.length, fix ? { fix: { start: s, end: s + spec.length, text: fix }, suggestion: fix } : {});
  }
  void text;
}
