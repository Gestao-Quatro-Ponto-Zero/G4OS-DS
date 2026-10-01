// g4os-ds audit: encontra o que foge do design system num projeto (ou no próprio DS).
// Uso: node scripts/cli.mjs audit <pasta|arquivo> [--json] [--fix-hints] [--max-errors N]
// Ignorar com justificativa (mesma linha ou linha anterior):
//   // ds-audit-ignore <regra>: motivo          {/* ds-audit-ignore <regra>: motivo */}
//   /* ds-audit-ignore-file <regra>: motivo */   no topo do arquivo (vale para o arquivo todo)
//   {/* ds-audit-ignore-start <regra>: motivo */} … {/* ds-audit-ignore-end */}   trecho (logo em SVG, painel navy)
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const EXT = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".html", ".css"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".vercel", "coverage", ".generated", "ai"]);

/** Tamanhos de texto permitidos (px): escala + meios-passos de componentes densos. ≥ 26 = display (hero, slides). */
export const TEXT_ALLOW = new Set([10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30]);

const NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"];
const HUE_TO_TOKEN = {
  red: "rose", rose: "rose", pink: "rose",
  orange: "amber", amber: "amber", yellow: "amber",
  green: "ok", emerald: "ok", lime: "ok", teal: "ok",
  blue: "blue", sky: "info", cyan: "info", indigo: "blue",
  violet: "primary", purple: "primary", fuchsia: "primary",
};
function paletteSuggestion(prop, hue, shade) {
  const n = Number(shade);
  if (NEUTRALS.includes(hue)) {
    if (prop === "bg") return n <= 100 ? "bg-soft" : n <= 300 ? "bg-line" : n >= 800 ? "bg-primary (ação) ou bg-ink" : "bg-soft";
    if (prop === "border" || prop === "divide" || prop === "ring" || prop === "outline") return n <= 200 ? `${prop}-line` : `${prop}-line-strong`;
    return n <= 400 ? `${prop}-muted` : n <= 500 ? `${prop}-muted` : n <= 700 ? `${prop}-ink-soft` : `${prop}-ink`;
  }
  const t = HUE_TO_TOKEN[hue] ?? "primary";
  if (t === "primary") return prop === "bg" ? "bg-primary text-on-primary (ação) ou bg-accent-soft" : `${prop}-accent-deep`;
  if (prop === "bg") return n <= 100 ? `bg-${t}-soft` : t === "blue" ? "bg-primary (se for ação) ou bg-info-soft" : `bg-${t} text-on-ink`;
  return `${prop}-${t}`;
}

const SHADCN = {
  "bg-background": "bg-page",
  "text-foreground": "text-ink",
  "bg-card": "bg-surface",
  "text-card-foreground": "text-ink",
  "text-popover-foreground": "text-ink",
  "bg-muted": "bg-soft (no DS `muted` é cor de TEXTO)",
  "text-muted-foreground": "text-muted",
  "bg-secondary": "bg-soft",
  "text-secondary-foreground": "text-ink",
  "hover:bg-accent": "hover:bg-soft (no DS `accent` é dourado de marca)",
  "text-accent-foreground": "text-ink",
  "text-primary-foreground": "text-on-primary",
  "bg-destructive": "bg-rose text-on-ink",
  "text-destructive": "text-rose",
  "border-input": "border-line",
  "border-border": "border-line",
  "ring-ring": "(remova: o foco global do DS já cuida)",
  "ring-offset-background": "(remova)",
};

export const RULES = {
  "hex-color": { severity: "error", title: "Cor fixa (hex/rgb) em classe ou estilo", hint: "Use o token: bg-surface, text-ink, var(--color-line)…" },
  "white-black": { severity: "error", title: "bg-white / text-white / *-black", hint: "bg-surface (card), bg-popover (menu), text-on-primary (sobre primary), text-on-ink (sobre ink/rose/ok). text-white só sobre bg-navy." },
  "tailwind-palette": { severity: "error", title: "Cor da paleta do Tailwind", hint: "Troque pelo token semântico sugerido." },
  "shadcn-class": { severity: "error", title: "Classe semântica do shadcn", hint: "Troque pelo equivalente do DS (ou importe @g4ai/ds/shadcn.css e troque aos poucos)." },
  "native-select": { severity: "error", title: "<select> nativo", hint: "Select (lista curta) ou Combobox (entidades)." },
  "native-date": { severity: "error", title: '<input type="date">', hint: "DatePicker." },
  "confirm-alert": { severity: "error", title: "window.confirm / alert", hint: "ConfirmDialog / notify." },
  "number-format": { severity: "error", title: "Formatação fora do pt-BR", hint: "formatCurrency / formatNumber / formatPercent / formatDate de @g4ai/ds." },
  "text-size": { severity: "warn", title: "Tamanho de texto fora da escala", hint: "Use text-caption/label/control/body/input/section/title ou um valor da escala." },
  "icon-button-label": { severity: "warn", title: "Botão só com ícone sem nome acessível", hint: "IconButton label=… ou aria-label." },
  "html-lang": { severity: "warn", title: '<html> sem lang="pt-BR"', hint: '<html lang="pt-BR" className="ds-app" data-theme="system">' },
  "hardcoded-dark": { severity: "warn", title: "dark: trocando cor que o token já troca", hint: "Remova: bg-surface/text-ink já mudam no tema escuro." },
};

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isFile()) {
    if (EXT.has(extname(p))) out.push(p);
    return out;
  }
  for (const d of readdirSync(p, { withFileTypes: true })) {
    if (d.name.startsWith(".") && d.name !== ".storybook") continue;
    if (d.isDirectory() && SKIP_DIRS.has(d.name)) continue;
    const full = join(p, d.name);
    if (d.isDirectory()) walk(full, out);
    else if (EXT.has(extname(d.name)) && !/\.(test|spec|stories)\.|\.d\.ts$/.test(d.name)) out.push(full);
  }
  return out;
}

/** Linhas ignoradas: comentário na mesma linha ou na anterior; arquivo inteiro com -file. */
function ignoresFor(lines) {
  const byLine = new Map();
  const file = new Set();
  const open = new Set();
  const mark = (at, rule) => {
    if (!byLine.has(at)) byLine.set(at, new Set());
    byLine.get(at).add(rule);
  };
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/ds-audit-ignore-start\s+([\w-]+|\*)/g)) open.add(m[1]);
    if (/ds-audit-ignore-end/.test(l)) open.clear();
    for (const r of open) mark(i, r);
    for (const m of l.matchAll(/ds-audit-ignore(-file)?\s+([\w-]+|\*)/g)) {
      if (m[1]) file.add(m[2]);
      else {
        for (const at of [i, i + 1]) {
          if (!byLine.has(at)) byLine.set(at, new Set());
          byLine.get(at).add(m[2]);
        }
      }
    }
  });
  return (rule, i) => file.has(rule) || file.has("*") || byLine.get(i)?.has(rule) || byLine.get(i)?.has("*");
}

/** Strings que parecem className: className="…", cn("…", …), tons em objetos { a: "bg-x" }. */
const CLASSY = /(?:^|[\s"'`{(:,])(?:!?[a-z]+:)*(?:bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|decoration|placeholder|caret|accent)-/;

export function auditSource(text, file) {
  const findings = [];
  const lines = text.split("\n");
  // CSS: comentários viram espaço (mantendo as linhas) antes de procurar cores.
  const cssLines = extname(file) === ".css" ? text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n") : lines;
  const ignored = ignoresFor(lines);
  const ext = extname(file);
  const isCss = ext === ".css";
  const isHtml = ext === ".html";
  const add = (rule, i, col, snippet, suggestion) => {
    if (ignored(rule, i)) return;
    findings.push({ file, line: i + 1, col: col + 1, rule, severity: RULES[rule].severity, snippet: snippet.trim().slice(0, 160), suggestion: suggestion ?? RULES[rule].hint });
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      if (!/ds-audit/.test(trimmed)) return;
    }

    if (isCss) {
      // Hex fora de declaração de custom property (--x: #…) é cor fixa. Custom
      // properties (tokens, [data-brand]) são o lugar certo de uma cor.
      const code = cssLines[i].replace(/--[\w-]+\s*:[^;]*;?/g, (d) => " ".repeat(d.length));
      for (const m of code.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g)) add("hex-color", i, m.index, line);
      return;
    }

    // className / strings de classe
    const classy = CLASSY.test(line) || /className=|class=/.test(line);
    if (classy) {
      for (const m of line.matchAll(/\b(?:[a-z-]+:)*(bg|text|border|ring|fill|stroke|from|to|via|outline|divide|shadow|decoration)-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\))\]/g)) add("hex-color", i, m.index, m[0]);
      for (const m of line.matchAll(/(?<![\w-])(?:[a-z-]+:)*(bg|text|border|ring|fill|stroke|divide|outline|from|to|via)-(white|black)\b(\/[\d.[\]]+)?/g)) {
        const [tok, prop, color, alpha] = m;
        // Sobre superfícies de marca escuras (navy, lightbox preto) branco é permitido.
        const darkContext = /\b(bg-navy|from-navy|bg-black|bg-graph|bg-ai)\b/.test(line);
        if (color === "white" && darkContext && prop !== "bg") continue;
        if (color === "white" && darkContext && alpha) continue;
        if (color === "black" && alpha && prop === "bg") continue; // backdrop bg-black/20
        const sug = prop === "bg" ? (color === "white" ? "bg-surface (ou bg-popover em menus/modais)" : "bg-ink") : prop === "text" ? (color === "white" ? "text-on-primary (sobre primary) · text-on-ink (sobre ink/rose/ok) · text-white só sobre bg-navy" : "text-ink") : `${prop}-line / ${prop}-surface`;
        add("white-black", i, m.index, tok, sug);
      }
      for (const m of line.matchAll(/(?<![\w-])(?:[a-z-]+:)*(bg|text|border|ring|fill|stroke|divide|outline|from|to|via|shadow|decoration|placeholder)-(slate|gray|zinc|neutral|stone|red|rose|pink|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia)-(50|[1-9]00|950)\b/g)) {
        add("tailwind-palette", i, m.index, m[0], /(^|:)dark:/.test(m[0]) || m[0].startsWith("dark:") ? "remova: o token semântico já troca no tema escuro" : paletteSuggestion(m[1], m[2], m[3]));
      }
      for (const [cls, sug] of Object.entries(SHADCN)) {
        const re = new RegExp(`(?<![\\w-])(?:[a-z-]+:)*${cls.replace(/[-:]/g, (c) => `\\${c}`)}(?![\\w-])`, "g");
        for (const m of line.matchAll(re)) add("shadcn-class", i, m.index, m[0], sug);
      }
      for (const m of line.matchAll(/\btext-\[(\d+(?:\.\d+)?)px\]/g)) {
        const px = Number(m[1]);
        if (!TEXT_ALLOW.has(px) && px < 26) add("text-size", i, m.index, m[0], `Mais próximo na escala: ${[...TEXT_ALLOW].sort((a, b) => Math.abs(a - px) - Math.abs(b - px))[0]}px`);
      }
      for (const m of line.matchAll(/\bdark:(bg|text|border)-(white|black|gray-\d+|zinc-\d+|slate-\d+|neutral-\d+)\b/g)) add("hardcoded-dark", i, m.index, m[0]);
    }

    // Cor fixa em atributos/estilo JSX (fill, stroke, color, background…); `tint` é identidade de registro.
    if (!isHtml && !/\btint\b|tint:/.test(line)) {
      for (const m of line.matchAll(/\b(fill|stroke|stopColor|stop-color|color|background|backgroundColor|borderColor)(=|:\s*)\{?["'`](#[0-9a-fA-F]{3,8}|rgba?\([^"'`]*\))["'`]/g)) add("hex-color", i, m.index, m[0]);
    }

    if (/<select[\s>]/.test(line)) add("native-select", i, line.indexOf("<select"), line);
    if (/<input[^>]*type=["']date["']/.test(line)) add("native-date", i, line.indexOf("<input"), line);
    for (const m of line.matchAll(/(?<![\w.$])(?:window\.)?(confirm|alert)\(/g)) {
      if (/function\s+(confirm|alert)|\.(confirm|alert)\(/.test(line) && !/window\./.test(m[0])) continue;
      add("confirm-alert", i, m.index, m[0]);
    }
    for (const m of line.matchAll(/toLocaleString\(\s*["'`]en|Intl\.NumberFormat\(\s*["'`]en|toLocaleDateString\(\s*["'`]en|\.toFixed\(\s*2\s*\)|["'`]R\$ ?["'`]\s*\+|`R\$ ?\$\{|>\s*\$\s?\d|["'`]\$\s?["'`]\s*\+|currency:\s*["'`]USD|US\$\s?\{?/g)) add("number-format", i, m.index, m[0]);
  });

  // <html> sem lang pt-BR (só em .html e .tsx/.jsx, fora de comentários)
  if (isHtml || ext === ".tsx" || ext === ".jsx") {
    for (const m of text.matchAll(/<html\b[^>]*>/g)) {
      const i = text.slice(0, m.index).split("\n").length - 1;
      const ln = lines[i].trim();
      if (ln.startsWith("*") || ln.startsWith("//") || ln.startsWith("/*") || /^\s*\*|`|\/\//.test(lines[i].slice(0, lines[i].indexOf("<html")))) continue;
      if (!/lang=["'{]?["']?pt-BR/.test(m[0])) add("html-lang", i, 0, m[0]);
    }
  }

  // <button> só com ícone e sem nome acessível (heurística multi-linha)
  if (!isCss) {
    for (const m of text.matchAll(/<button\b((?:=>|[^>])*)>([\s\S]*?)<\/button>/g)) {
      const [, attrs, body] = m;
      if (/aria-label|aria-labelledby|aria-hidden|title=|\{\.\.\.[\w.]+\}/.test(attrs)) continue;
      const textContent = body.replace(/<[^>]+>/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
      if (textContent === "" && /<[A-Z][\w.]*[^>]*\/>/.test(body)) {
        const i = text.slice(0, m.index).split("\n").length - 1;
        add("icon-button-label", i, 0, `<button${attrs.slice(0, 60)}>`);
      }
    }
  }
  return findings;
}

export function audit(target) {
  const abs = resolve(target);
  if (!existsSync(abs)) throw new Error(`não existe: ${target}`);
  const files = walk(abs);
  const findings = files.flatMap((f) => auditSource(readFileSync(f, "utf8"), relative(process.cwd(), f) || f));
  const byRule = {};
  const byFile = {};
  for (const f of findings) {
    byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
    byFile[f.file] = (byFile[f.file] ?? 0) + 1;
  }
  const errors = findings.filter((f) => f.severity === "error").length;
  return { target, filesScanned: files.length, totals: { errors, warnings: findings.length - errors, filesWithIssues: Object.keys(byFile).length }, byRule, byFile, findings };
}

export function toMarkdown(report, { fixHints = false, limit = 400 } = {}) {
  const { totals, byRule, findings } = report;
  const l = [`# Auditoria G4OS-DS · ${report.target}`, "", `${report.filesScanned} arquivos · **${totals.errors} erros** · ${totals.warnings} avisos · ${totals.filesWithIssues} arquivos com ocorrência`, ""];
  if (!findings.length) return [...l, "Nada fora do design system. ✓"].join("\n");
  l.push("| Regra | Gravidade | Ocorrências | O que fazer |", "| --- | --- | --- | --- |");
  for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) l.push(`| ${RULES[rule].title} (\`${rule}\`) | ${RULES[rule].severity === "error" ? "erro" : "aviso"} | ${n} | ${RULES[rule].hint} |`);
  l.push("");
  const byFile = new Map();
  for (const f of findings) byFile.set(f.file, [...(byFile.get(f.file) ?? []), f]);
  let shown = 0;
  for (const [file, list] of [...byFile].sort((a, b) => b[1].length - a[1].length)) {
    if (shown >= limit) {
      l.push(`… e mais ${findings.length - shown} ocorrências (use --json para a lista completa).`);
      break;
    }
    l.push(`## ${file} (${list.length})`, "");
    for (const f of list) {
      if (shown++ >= limit) break;
      l.push(`- L${f.line} \`${f.rule}\` ${f.severity === "error" ? "✗" : "△"} \`${f.snippet.replace(/`/g, "'")}\`${fixHints ? ` → ${f.suggestion}` : ""}`);
    }
    l.push("");
  }
  l.push("Ignorar com motivo: `// ds-audit-ignore <regra>: motivo` na linha (ou anterior).");
  return l.join("\n");
}
