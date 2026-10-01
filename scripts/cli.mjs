#!/usr/bin/env node
// g4os-ds: ferramentas do design system para qualquer projeto.
//   npx g4os-ds audit [pastas…] [--fix] [--format pretty|json|markdown|sarif|github] [--changed] [--baseline]
//   npx g4os-ds doctor [pasta] [--format …]
//   npx g4os-ds init [--dry-run] [--eslint] [--hook lefthook|husky|simple-git-hooks] [--baseline] [--ci]
//   npx g4os-ds rules [--format json|markdown]
//   npx g4os-ds guide          imprime o caminho de ai/core.md (para agentes lerem)
//   npx -y @g4ai/ds mcp        servidor MCP (stdio); --http [--port 3845] para Streamable HTTP
// Saída: 0 ok · 1 achados que falham (erros, avisos acima de --max-warnings, doctor bloqueado) · 2 uso/config.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));

/** Parser mínimo: --a b, --a=b, -f b, flags repetidas viram lista. */
function parseArgs(argv, { values = [], optional = [], short = {} } = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    let a = argv[i];
    if (short[a]) a = short[a];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    let [k, v] = a.slice(2).split(/=(.*)/s);
    if (v === undefined && values.includes(k)) v = argv[++i];
    else if (v === undefined && optional.includes(k) && argv[i + 1] && !argv[i + 1].startsWith("-") && /\.json$/.test(argv[i + 1])) v = argv[++i];
    if (k.startsWith("no-")) {
      out[k.slice(3)] = false;
      continue;
    }
    const val = v ?? true;
    if (k in out && k === "rule") out[k] = [].concat(out[k], val);
    else out[k] = k === "rule" ? [val] : val;
  }
  return out;
}

const fail = (msg) => {
  console.error(`g4os-ds: ${msg}`);
  process.exit(2);
};

const emit = (text, out) => {
  if (out) writeFileSync(out, text.endsWith("\n") ? text : `${text}\n`);
  else process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
};

const HELP = `g4os-ds ${pkg.version} · ferramentas do G4OS-DS

  audit [pastas…]   encontra o que foge do DS: tokens (cores fixas, bg-white, paleta Tailwind,
                    shadcn, raio/sombra/z-index), tipografia, a11y, formatação pt-BR, imports, React
      --fix                  aplica as correções seguras (bg-white→bg-surface, rounded-[12px]→rounded-card…)
      --format <f>           pretty (padrão) | json | markdown | sarif | github   (--json = --format json)
      --changed              só arquivos alterados (git: working tree + staged + novos)
      --staged               só arquivos staged (pre-commit)
      --since <ref>          alterados desde um ref (ex.: origin/main)
      --baseline [arquivo]   compara com a dívida conhecida (cria se não existir); só achados novos falham
      --update-baseline      regrava a baseline com o estado atual
      --config <arquivo>     outra config (padrão: g4os-ds.config.json ou package.json#"g4os-ds")
      --preset <p>           recommended | strict | migration
      --rule <id>=<grav>     liga/desliga regra (off|info|warn|error); repetível
      --max-errors <n>       tolera até n erros (padrão 0)
      --max-warnings <n>     falha se houver mais de n avisos
      --out <arquivo>        grava a saída num arquivo
  doctor [pasta]    confere pré-requisitos (React 18.2+/19, Tailwind v4, CSS e ordem dos imports, tema, fonte,
                    layout raiz, link do Next, React duplicado)   --format pretty|json|markdown|github|sarif
  init              prepara o projeto: g4os-ds.config.json, scripts ds:*, workflow de CI
      --dry-run  --force  --eslint  --hook lefthook|husky|simple-git-hooks  --baseline  --no-ci
  rules             lista as regras   --format markdown|json
  guide             caminho do guia para agentes (ai/core.md)
  mcp               servidor MCP (stdio) para Claude Code, Codex, Cursor, VS Code, Gemini CLI…
                    claude mcp add g4os-ds -- npx -y @g4ai/ds mcp
                    --http [--port 3845] [--host 127.0.0.1]  Streamable HTTP em /mcp

Saída: 0 ok · 1 achados que falham · 2 erro de uso/config. Docs: docs/guias/auditoria.md`;

async function main() {
  const [, , cmd, ...rest] = process.argv;

  if (cmd === "audit") {
    const a = parseArgs(rest, { values: ["format", "since", "config", "preset", "rule", "max-errors", "max-warnings", "out", "limit"], optional: ["baseline"], short: { "-f": "--format" } });
    const { runAudit, exitCode } = await import("./lint/engine.mjs");
    const { format, FORMATS } = await import("./lint/format.mjs");
    const fmt = a.json ? "json" : (a.format ?? "pretty");
    if (!FORMATS.includes(fmt)) fail(`--format inválido: ${fmt} (use ${FORMATS.join(", ")})`);
    const rules = {};
    for (const r of a.rule ?? []) {
      const [id, sev] = String(r).split("=");
      rules[id] = sev ?? "error";
    }
    try {
      const report = await runAudit({
        targets: a._,
        configPath: a.config,
        preset: a.preset,
        rules: Object.keys(rules).length ? rules : undefined,
        changed: Boolean(a.changed),
        staged: Boolean(a.staged),
        since: a.since,
        fix: Boolean(a.fix),
        baseline: a.baseline === false ? false : (a.baseline ?? (a["update-baseline"] ? true : undefined)),
        updateBaseline: Boolean(a["update-baseline"]),
      });
      // re-valida regras passadas por --rule (o motor valida as da config)
      const { RULES } = await import("./lint/rules.mjs");
      for (const id of Object.keys(rules)) if (!(id in RULES)) fail(`regra desconhecida: ${id}`);
      report.toolVersion = pkg.version;
      emit(format(report, fmt, { fixHints: a["fix-hints"] !== false, limit: a.limit ? Number(a.limit) : undefined }), a.out);
      if (a.out && fmt !== "pretty") process.stderr.write(`${report.totals.errors} erros · ${report.totals.warnings} avisos → ${a.out}\n`);
      process.exit(exitCode(report, { maxErrors: Number(a["max-errors"] ?? 0), maxWarnings: a["max-warnings"] != null ? Number(a["max-warnings"]) : (report.maxWarnings ?? undefined) }));
    } catch (e) {
      if (e.exitCode === 2) fail(e.message);
      throw e;
    }
  } else if (cmd === "doctor") {
    const a = parseArgs(rest, { values: ["format", "out"], short: { "-f": "--format" } });
    const { doctor, doctorFormat } = await import("./doctor.mjs");
    const r = doctor(a._[0] ?? ".");
    emit(doctorFormat(r, a.json ? "json" : (a.format ?? "pretty")), a.out);
    process.exit(r.ok ? 0 : 1);
  } else if (cmd === "init") {
    const a = parseArgs(rest, { values: ["hook", "dir"] });
    const { init } = await import("./init.mjs");
    try {
      const r = await init({ cwd: a.dir ?? a._[0] ?? process.cwd(), dryRun: Boolean(a["dry-run"]), force: Boolean(a.force), eslint: Boolean(a.eslint), hook: a.hook, baseline: Boolean(a.baseline), ci: a.ci !== false, version: pkg.version });
      console.log(r.log.join("\n"));
    } catch (e) {
      if (e.exitCode === 2) fail(e.message);
      throw e;
    }
  } else if (cmd === "rules") {
    const a = parseArgs(rest, { values: ["format"] });
    const { RULES, CATEGORIES, presetSeverity } = await import("./lint/rules.mjs");
    if (a.json || a.format === "json") emit(JSON.stringify(Object.fromEntries(Object.entries(RULES).map(([id, r]) => [id, { ...r, recommended: presetSeverity(id), strict: presetSeverity(id, "strict"), migration: presetSeverity(id, "migration") }])), null, 2));
    else {
      const l = ["| Regra | Categoria | recommended | strict | Corrige | O que é |", "| --- | --- | --- | --- | --- | --- |"];
      for (const [id, r] of Object.entries(RULES)) l.push(`| \`${id}\` | ${CATEGORIES[r.category]} | ${presetSeverity(id)} | ${presetSeverity(id, "strict")} | ${r.fixable ? "sim" : ""} | ${r.title} |`);
      emit(l.join("\n"));
    }
  } else if (cmd === "mcp") {
    const { runFromArgs } = await import("./mcp.mjs");
    runFromArgs(rest);
  } else if (cmd === "guide") {
    console.log(join(here, "..", "ai", "core.md"));
  } else if (cmd === "--version" || cmd === "-v" || cmd === "version") {
    console.log(pkg.version);
  } else {
    console.log(HELP);
    process.exit(cmd && cmd !== "help" && cmd !== "--help" && cmd !== "-h" ? 2 : 0);
  }
}

main().catch((e) => {
  console.error(e.stack ?? e.message);
  process.exit(2);
});
