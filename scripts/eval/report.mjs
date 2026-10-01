#!/usr/bin/env node
// Tabela comparativa de rodadas do eval: node scripts/eval/report.mjs antes depois [--out .eval]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const oi = argv.indexOf("--out");
const out = resolve(oi < 0 ? join(repo, ".eval") : argv[oi + 1]);
const labels = argv.filter((a, i) => !a.startsWith("--") && (oi < 0 || i !== oi + 1));
const runs = labels.map((l) => {
  const p = join(out, l, "results.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : [];
});
const keys = [...new Set(runs.flat().map((r) => `${r.agent} · ${r.task}`))].sort();
const cell = (r) => (r ? `${r.score}` : "—");
const lines = [`| Agente · tarefa | ${labels.join(" | ")} |`, `| --- | ${labels.map(() => "---:").join(" | ")} |`];
for (const k of keys) lines.push(`| ${k} | ${runs.map((run) => cell(run.find((r) => `${r.agent} · ${r.task}` === k))).join(" | ")} |`);
const avg = (run) => (run.length ? (run.reduce((s, r) => s + r.score, 0) / run.length).toFixed(1) : "—");
lines.push(`| **média** | ${runs.map(avg).join(" | ")} |`);
lines.push("", "Falhas mais comuns (rubrica + auditoria):", "");
runs.forEach((run, i) => {
  const miss = {};
  for (const r of run) {
    for (const it of r.grade.rubric) if (!it.ok) miss[`rubrica: ${it.why}`] = (miss[`rubrica: ${it.why}`] ?? 0) + 1;
    for (const [rule, n] of Object.entries(r.grade.checks.audit?.byRule ?? {})) miss[`audit: ${rule}`] = (miss[`audit: ${rule}`] ?? 0) + n;
    if (!r.grade.checks.typecheck.ok) miss["typecheck falhou"] = (miss["typecheck falhou"] ?? 0) + 1;
    for (const w of ["1440", "390"]) {
      const x = r.grade.checks.render?.[w];
      if (x?.errors?.length) miss[`erro de página (${w})`] = (miss[`erro de página (${w})`] ?? 0) + 1;
      if (x?.overflow) miss[`estouro horizontal (${w})`] = (miss[`estouro horizontal (${w})`] ?? 0) + 1;
      for (const v of x?.axe ?? []) miss[`axe: ${v.id}`] = (miss[`axe: ${v.id}`] ?? 0) + v.n;
    }
  }
  lines.push(`**${labels[i]}**: ${Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, n]) => `${k} (${n})`).join(" · ") || "nenhuma"}`, "");
});
const md = lines.join("\n");
console.log(md);
writeFileSync(join(out, `report-${labels.join("-vs-")}.md`), md + "\n");
