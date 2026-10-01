// Motor do g4os-ds audit: lê arquivos, roda as regras, aplica ignores, config,
// correções seguras (--fix) e baseline. Sem dependências.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { CATEGORIES, PRESETS, RULES, checkClass, checkCode, checkCss, checkTag, presetSeverity } from "./rules.mjs";
import { classTokens, lineIndex, scanJs, scanTags, stripCssComments } from "./source.mjs";

export const EXT = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs", ".mts", ".cts", ".html", ".css"]);
export const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", ".turbo", ".vercel", "coverage", ".generated", ".output", ".svelte-kit", "storybook-static", "ai"]);
const SKIP_FILE = /\.(test|spec|stories)\.[cm]?[jt]sx?$|\.d\.[cm]?ts$|\.min\.(js|css)$/;
const SEV_RANK = { off: 0, info: 1, warn: 2, error: 3 };

/* ------------------------------------------------------------------ */
/* Ignorar com motivo                                                  */
/* ------------------------------------------------------------------ */

const DIRECTIVE = /(ds-audit-ignore-file|ds-audit-ignore-start|ds-audit-ignore-end|ds-audit-ignore|g4os-ds-disable-file|g4os-ds-disable-next-line|g4os-ds-disable-line|g4os-ds-disable|g4os-ds-enable)\b([^\n*]*)/g;

function parseRules(rest) {
  const head = rest.split(/:|--|\*\/|\}/)[0];
  const ids = head
    .split(/[\s,]+/)
    .filter(Boolean)
    .filter((x) => x === "*" || x in RULES);
  return ids.length ? ids : ["*"];
}

/** Monta o teste "esta regra está ignorada nesta linha?" a partir dos comentários. */
export function ignoresFrom(comments, idx) {
  const byLine = new Map();
  const file = new Set();
  const ranges = [];
  let open = null;
  const mark = (line, rules) => {
    if (!byLine.has(line)) byLine.set(line, new Set());
    for (const r of rules) byLine.get(line).add(r);
  };
  const sorted = [...comments].sort((a, b) => a.start - b.start);
  for (const c of sorted) {
    const line = idx.pos(c.start).line;
    const endLine = idx.pos(c.end).line;
    for (const m of c.text.matchAll(DIRECTIVE)) {
      const [, d, rest] = m;
      if (d === "ds-audit-ignore-end" || d === "g4os-ds-enable") {
        if (open) ranges.push({ from: open.line, to: endLine, rules: open.rules });
        open = null;
        continue;
      }
      const rules = parseRules(rest);
      if (d === "ds-audit-ignore-file" || d === "g4os-ds-disable-file") rules.forEach((r) => file.add(r));
      else if (d === "ds-audit-ignore-start" || d === "g4os-ds-disable") open = { line, rules };
      else if (d === "g4os-ds-disable-line") mark(line, rules);
      else if (d === "g4os-ds-disable-next-line") mark(endLine + 1, rules);
      else {
        // ds-audit-ignore: mesma linha ou a seguinte (compatível com versões anteriores)
        mark(line, rules);
        mark(endLine + 1, rules);
      }
    }
  }
  if (open) ranges.push({ from: open.line, to: Infinity, rules: open.rules });
  return (rule, line) => {
    if (file.has(rule) || file.has("*")) return true;
    const s = byLine.get(line);
    if (s && (s.has(rule) || s.has("*"))) return true;
    return ranges.some((r) => line >= r.from && line <= r.to && (r.rules.includes(rule) || r.rules.includes("*")));
  };
}

/* ------------------------------------------------------------------ */
/* Lint de um texto                                                    */
/* ------------------------------------------------------------------ */

/**
 * Audita um arquivo em memória. `severities` = { regra: gravidade } (padrão: recommended).
 * Devolve achados com posição, sugestão e, quando há, `fix: { start, end, text }`.
 */
export function lintText(text, file, { severities, ignoreComments = true } = {}) {
  const ext = extname(file).toLowerCase();
  const idx = lineIndex(text);
  const sev = (r) => severities?.[r] ?? presetSeverity(r);
  const findings = [];
  const seen = new Set();
  let ignored = () => false;

  const report = (rule, start, end, extra = {}) => {
    const severity = sev(rule);
    if (!severity || severity === "off") return;
    const key = `${rule}:${start}`;
    if (seen.has(key)) return;
    const p = idx.pos(start);
    if (ignored(rule, p.line)) return;
    seen.add(key);
    const e = idx.pos(Math.max(start, end));
    const meta = RULES[rule];
    const lineText = idx.lineText(p.line);
    findings.push({
      file,
      line: p.line,
      col: p.col,
      endLine: e.line,
      endCol: e.col,
      start,
      end,
      rule,
      severity,
      category: meta.category,
      message: meta.title,
      snippet: (end - start > 0 && end - start <= 160 && !text.slice(start, end).includes("\n") ? text.slice(start, end) : lineText.trim()).slice(0, 160),
      lineText: lineText.trim().slice(0, 240),
      suggestion: extra.suggestion ?? meta.hint,
      docs: meta.docs,
      ...(extra.fix ? { fix: extra.fix } : {}),
    });
  };

  const checkClassString = (s, near) => {
    if (!s.value || s.value.length > 4000 || !/[a-z]-/.test(s.value)) return;
    const toks = classTokens(s.value);
    const all = new Set(toks.map((t) => t.token));
    for (const t of toks) {
      for (const r of checkClass(t.token, { all, near })) {
        const start = s.start + t.index;
        const end = start + t.token.length;
        let fix;
        if (r.replace === "") {
          // apaga a classe e um espaço vizinho
          const after = s.value.slice(t.index + t.token.length).match(/^\s+/)?.[0].length ?? 0;
          const before = after ? 0 : (s.value.slice(0, t.index).match(/\s+$/)?.[0].length ?? 0);
          fix = { start: start - before, end: end + after, text: "" };
        } else if (r.replace) fix = { start, end, text: r.replace };
        report(r.rule, start, end, { suggestion: r.suggestion, fix });
      }
    }
  };

  if (ext === ".css") {
    const css = stripCssComments(text);
    const comments = [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }));
    if (ignoreComments) ignored = ignoresFrom(comments, idx);
    checkCss({ text, css, report });
  } else if (ext === ".html") {
    const comments = [...text.matchAll(/<!--[\s\S]*?-->/g)].map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }));
    if (ignoreComments) ignored = ignoresFrom(comments, idx);
    const code = text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " "));
    for (const tag of scanTags(code)) {
      checkTag(tag, { code, raw: code, report, ext });
      const cls = tag.attr("class");
      if (cls?.kind === "string") checkClassString({ start: cls.valueStart, value: cls.value }, idx.lineText(idx.pos(cls.start).line));
    }
  } else {
    const { code, strings, comments } = scanJs(text);
    if (ignoreComments) ignored = ignoresFrom(comments, idx);
    // Para tags e regras de código, conteúdo de template literal (exemplos de código em
    // docs) e strings soltas com "<" não contam como JSX.
    const masked = code.split("");
    for (const s of strings) {
      const attr = code[s.start - 2] === "=";
      if (s.quote === "`" || (!attr && s.value.includes("<"))) for (let k = s.start; k < s.end; k++) if (masked[k] !== "\n") masked[k] = " ";
    }
    const codeM = masked.join("");
    for (const tag of scanTags(codeM)) checkTag(tag, { code: codeM, raw: code, report, ext });
    checkCode({ code: codeM, strings, report, ext });
    for (const s of strings) checkClassString(s, idx.lineText(idx.pos(s.start).line));
  }
  return findings.sort((a, b) => a.start - b.start || a.rule.localeCompare(b.rule));
}

/**
 * Aplica correções sem sobreposição, com a mesma regra do ESLint (ordem crescente; uma
 * correção que encosta ou cruza a anterior fica para a próxima passada). Devolve { text, applied }.
 */
export function applyFixes(text, findings) {
  const fixes = findings
    .filter((f) => f.fix)
    .map((f) => f.fix)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  let out = "";
  let last = Number.NEGATIVE_INFINITY;
  let pos = 0;
  let applied = 0;
  for (const f of fixes) {
    if (last >= f.start || f.start > f.end) continue;
    out += text.slice(pos, f.start) + f.text;
    pos = f.end;
    last = f.end;
    applied++;
  }
  return { text: out + text.slice(pos), applied };
}

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export const CONFIG_FILES = ["g4os-ds.config.json", ".g4os-dsrc.json"];

/** Lê g4os-ds.config.json (ou package.json#"g4os-ds") subindo a partir de `cwd`. */
export function loadConfig(cwd = process.cwd(), explicit) {
  if (explicit) {
    const p = resolve(cwd, explicit);
    if (!existsSync(p)) throw usageError(`config não encontrada: ${explicit}`);
    return normalizeConfig(JSON.parse(readFileSync(p, "utf8")), dirname(p), p);
  }
  let dir = resolve(cwd);
  for (;;) {
    for (const f of CONFIG_FILES) {
      const p = join(dir, f);
      if (existsSync(p)) return normalizeConfig(JSON.parse(readFileSync(p, "utf8")), dir, p);
    }
    const pkg = join(dir, "package.json");
    if (existsSync(pkg)) {
      const j = JSON.parse(readFileSync(pkg, "utf8"));
      if (j["g4os-ds"]) return normalizeConfig(j["g4os-ds"], dir, `${pkg}#g4os-ds`);
      return normalizeConfig({}, dir, null); // raiz do projeto sem config
    }
    const up = dirname(dir);
    if (up === dir) return normalizeConfig({}, resolve(cwd), null);
    dir = up;
  }
}

export function usageError(msg) {
  const e = new Error(msg);
  e.exitCode = 2;
  return e;
}

export function normalizeConfig(raw, root, path) {
  const preset = raw.extends ?? "recommended";
  if (!PRESETS.includes(preset)) throw usageError(`extends inválido: "${preset}" (use ${PRESETS.join(", ")})`);
  for (const [id, v] of Object.entries(raw.rules ?? {})) {
    if (!(id in RULES)) throw usageError(`regra desconhecida na config: "${id}"`);
    if (!(normSev(v) in SEV_RANK)) throw usageError(`gravidade inválida para ${id}: ${JSON.stringify(v)} (use off, info, warn, error)`);
  }
  return {
    root,
    path,
    preset,
    rules: raw.rules ?? {},
    include: raw.include ?? null,
    exclude: raw.exclude ?? [],
    overrides: raw.overrides ?? [],
    baseline: raw.baseline ?? null,
    maxWarnings: raw.maxWarnings ?? null,
  };
}

const normSev = (v) => (v === 0 ? "off" : v === 1 ? "warn" : v === 2 ? "error" : String(v));

/** Gravidade efetiva de cada regra para um arquivo (preset → rules → overrides). */
export function severitiesFor(config, relFile) {
  const out = {};
  for (const id of Object.keys(RULES)) out[id] = presetSeverity(id, config.preset);
  for (const [id, v] of Object.entries(config.rules)) out[id] = normSev(v);
  for (const o of config.overrides) {
    if (relFile && (o.files ?? []).some((g) => globToRegExp(g).test(relFile))) for (const [id, v] of Object.entries(o.rules ?? {})) if (id in RULES) out[id] = normSev(v);
  }
  return out;
}

/** Glob simples: **, *, ?, {a,b}. Caminhos com "/". */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += glob[i + 2] === "/" ? 2 : 1;
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "{") {
      const e = glob.indexOf("}", i);
      re += `(?:${glob.slice(i + 1, e).split(",").map(escapeRe).join("|")})`;
      i = e;
    } else re += escapeRe(c);
  }
  // "src" casa com "src/…" também
  return new RegExp(`^${re}(?:/.*)?$`);
}
const escapeRe = (s) => s.replace(/[.+^$()|[\]\\]/g, "\\$&");

/* ------------------------------------------------------------------ */
/* Arquivos                                                            */
/* ------------------------------------------------------------------ */

const toPosix = (p) => p.split(sep).join("/");

export function walk(p, out = []) {
  const st = statSync(p);
  if (st.isFile()) {
    if (EXT.has(extname(p).toLowerCase())) out.push(p);
    return out;
  }
  for (const d of readdirSync(p, { withFileTypes: true })) {
    if (d.name.startsWith(".") && d.name !== ".storybook") continue;
    if (d.isDirectory() && SKIP_DIRS.has(d.name)) continue;
    const full = join(p, d.name);
    if (d.isDirectory()) walk(full, out);
    else if (EXT.has(extname(d.name).toLowerCase()) && !SKIP_FILE.test(d.name)) out.push(full);
  }
  return out;
}

/** Arquivos alterados segundo o git (working tree + staged + não rastreados, ou desde um ref). */
export function changedFiles(cwd, { since, staged } = {}) {
  const git = (...args) => {
    try {
      return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch (e) {
      throw usageError(`git falhou (${args.join(" ")}): está num repositório git?${e.message ? "" : ""}`);
    }
  };
  const top = git("rev-parse", "--show-toplevel").trim();
  const names = new Set();
  const add = (s) => s.split("\n").filter(Boolean).forEach((f) => names.add(resolve(top, f)));
  if (staged) add(git("diff", "--name-only", "--cached", "--diff-filter=ACMR"));
  else {
    if (since) add(git("diff", "--name-only", "--diff-filter=ACMR", `${since}...HEAD`));
    add(git("diff", "--name-only", "--diff-filter=ACMR", "HEAD"));
    add(git("ls-files", "--others", "--exclude-standard"));
  }
  return [...names].filter((f) => existsSync(f));
}

/** Resolve a lista de arquivos a auditar. */
export function collectFiles({ targets, cwd, config, changed, since, staged }) {
  const base = config.root ?? cwd;
  const roots = targets?.length ? targets.map((t) => resolve(cwd, t)) : (config.include ?? ["."]).map((t) => resolve(base, t));
  for (const r of roots) if (!existsSync(r)) throw usageError(`não existe: ${relative(cwd, r) || r}`);
  let files = [...new Set(roots.flatMap((r) => walk(r)))];
  if (changed || since || staged) {
    const ch = new Set(changedFiles(cwd, { since, staged }));
    files = files.filter((f) => ch.has(f));
  }
  const ex = config.exclude.map(globToRegExp);
  if (ex.length) files = files.filter((f) => !ex.some((re) => re.test(toPosix(relative(base, f)))));
  return files.sort();
}

/* ------------------------------------------------------------------ */
/* Baseline                                                            */
/* ------------------------------------------------------------------ */

const fingerprint = (f) => createHash("sha1").update(`${f.file}\0${f.rule}\0${f.lineText}\0${f.snippet}`).digest("hex").slice(0, 16);

export function writeBaseline(path, findings) {
  const counts = {};
  for (const f of findings) {
    const k = fingerprint(f);
    counts[k] ??= { file: f.file, rule: f.rule, snippet: f.snippet, count: 0 };
    counts[k].count++;
  }
  const entries = Object.fromEntries(Object.entries(counts).sort((a, b) => a[1].file.localeCompare(b[1].file) || a[1].rule.localeCompare(b[1].rule)));
  writeFileSync(path, `${JSON.stringify({ $comment: "g4os-ds audit --baseline: dívida conhecida. Só achados novos falham. Atualize com --update-baseline.", version: 1, total: findings.length, entries }, null, 2)}\n`);
}

/** Marca `baselined: true` nos achados já conhecidos. */
export function applyBaseline(path, findings) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const left = Object.fromEntries(Object.entries(data.entries ?? {}).map(([k, v]) => [k, v.count]));
  let n = 0;
  for (const f of findings) {
    const k = fingerprint(f);
    if (left[k] > 0) {
      left[k]--;
      f.baselined = true;
      n++;
    }
  }
  const fixedSince = Object.values(left).reduce((a, b) => a + b, 0);
  return { baselined: n, resolved: fixedSince };
}

/* ------------------------------------------------------------------ */
/* Audit completo                                                      */
/* ------------------------------------------------------------------ */

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

/**
 * Audita caminhos. Opções: targets, cwd, configPath, config, changed, since, staged,
 * fix, baseline (caminho), updateBaseline, rules (sobrescreve), preset.
 */
export async function runAudit(opts = {}) {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const config = opts.config ?? loadConfig(cwd, opts.configPath);
  if (opts.preset) {
    if (!PRESETS.includes(opts.preset)) throw usageError(`preset inválido: ${opts.preset}`);
    config.preset = opts.preset;
  }
  if (opts.rules) Object.assign(config.rules, opts.rules);
  const files = collectFiles({ targets: opts.targets, cwd, config, changed: opts.changed, since: opts.since, staged: opts.staged });
  const display = (f) => toPosix(relative(cwd, f) || f);
  let fixed = 0;
  const perFile = await mapLimit(files, 32, async (abs) => {
    const rel = display(abs);
    const sevs = severitiesFor(config, toPosix(relative(config.root ?? cwd, abs)));
    let text = await readFile(abs, "utf8");
    let found = lintText(text, rel, { severities: sevs });
    if (opts.fix && found.some((f) => f.fix)) {
      for (let pass = 0; pass < 4 && found.some((f) => f.fix); pass++) {
        const r = applyFixes(text, found);
        if (!r.applied) break;
        fixed += r.applied;
        text = r.text;
        found = lintText(text, rel, { severities: sevs });
      }
      await writeFile(abs, text);
    }
    return found;
  });
  const findings = perFile.flat();

  let baseline = null;
  const blPath = opts.baseline === true ? resolve(config.root ?? cwd, config.baseline ?? ".g4os-ds-baseline.json") : opts.baseline ? resolve(cwd, opts.baseline) : config.baseline && opts.baseline !== false ? resolve(config.root ?? cwd, config.baseline) : null;
  if (blPath) {
    if (opts.updateBaseline || !existsSync(blPath)) {
      writeBaseline(blPath, findings.filter((f) => f.severity !== "info"));
      baseline = { path: display(blPath), created: true, baselined: findings.length, resolved: 0 };
      for (const f of findings) f.baselined = true;
    } else baseline = { path: display(blPath), created: false, ...applyBaseline(blPath, findings) };
  }
  return summarize({ target: opts.targets?.length ? opts.targets.join(" ") : (config.include ?? ["."]).join(" "), files, findings, config, fixed, baseline, cwd });
}

/**
 * Versão síncrona, sem --fix (MCP e API antiga). Lê a config a partir do alvo.
 * Opções: preset, rules, changed, since, staged, baseline (caminho para comparar).
 */
export function auditSync(target, { cwd = process.cwd(), preset, rules, changed, since, staged, baseline } = {}) {
  const abs = resolve(cwd, target);
  if (!existsSync(abs)) throw usageError(`não existe: ${target}`);
  const config = loadConfig(statSync(abs).isDirectory() ? abs : dirname(abs));
  if (preset) {
    if (!PRESETS.includes(preset)) throw usageError(`preset inválido: ${preset} (use ${PRESETS.join(", ")})`);
    config.preset = preset;
  }
  if (rules) {
    for (const [id, v] of Object.entries(rules)) if (!(id in RULES) || !(normSev(v) in SEV_RANK)) throw usageError(`regra/gravidade inválida: ${id}=${v}`);
    Object.assign(config.rules, rules);
  }
  const files = collectFiles({ targets: [abs], cwd, config, changed, since, staged });
  const findings = files.flatMap((f) => lintText(readFileSync(f, "utf8"), toPosix(relative(cwd, f) || f), { severities: severitiesFor(config, toPosix(relative(config.root, f))) }));
  const blPath = baseline ? resolve(cwd, baseline) : config.baseline ? resolve(config.root, config.baseline) : null;
  const bl = blPath && existsSync(blPath) ? { path: toPosix(relative(cwd, blPath)), created: false, ...applyBaseline(blPath, findings) } : null;
  return summarize({ target, files, findings, config, fixed: 0, baseline: bl, cwd });
}

function summarize({ target, files, findings, config, fixed, baseline, cwd }) {
  const active = findings.filter((f) => !f.baselined);
  const count = (sev) => active.filter((f) => f.severity === sev).length;
  const byRule = {};
  const byCategory = {};
  const byFile = {};
  for (const f of active) {
    byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
    byFile[f.file] = (byFile[f.file] ?? 0) + 1;
  }
  return {
    target,
    cwd,
    config: config.path ? toPosix(relative(cwd, config.path.replace(/#g4os-ds$/, "")) || config.path) + (config.path.endsWith("#g4os-ds") ? "#g4os-ds" : "") : null,
    preset: config.preset,
    maxWarnings: config.maxWarnings,
    filesScanned: files.length,
    totals: {
      errors: count("error"),
      warnings: count("warn"),
      infos: count("info"),
      fixable: active.filter((f) => f.fix).length,
      fixed,
      baselined: findings.length - active.length,
      filesWithIssues: Object.keys(byFile).length,
    },
    baseline,
    byRule,
    byCategory,
    byFile,
    findings: active,
  };
}

/** Código de saída: 0 ok · 1 erros (ou avisos acima de --max-warnings) · 2 uso/config. */
export function exitCode(report, { maxErrors = 0, maxWarnings } = {}) {
  if (report.totals.errors > maxErrors) return 1;
  if (maxWarnings != null && maxWarnings >= 0 && report.totals.warnings > maxWarnings) return 1;
  return 0;
}

export { CATEGORIES, RULES, SEV_RANK, isAbsolute };
