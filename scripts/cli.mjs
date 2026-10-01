#!/usr/bin/env node
// g4os-ds: ferramentas do design system para qualquer projeto.
//   npx g4os-ds audit <pasta> [--json] [--fix-hints] [--max-errors N] [--out arquivo]
//   npx g4os-ds doctor [pasta] [--json]
//   npx g4os-ds guide          imprime o caminho de ai/core.md (para agentes lerem)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { audit, toMarkdown } from "./ds-audit.mjs";
import { doctor, doctorMarkdown } from "./doctor.mjs";

const [, , cmd, ...rest] = process.argv;
const flag = (n) => rest.includes(n);
const opt = (n) => {
  const i = rest.indexOf(n);
  return i >= 0 ? rest[i + 1] : undefined;
};
const positional = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--max-errors", "--out"].includes(rest[i - 1])));
const emit = (text) => {
  const out = opt("--out");
  if (out) writeFileSync(out, text);
  else console.log(text);
};

if (cmd === "audit") {
  const targets = positional.length ? positional : ["."];
  const reports = targets.map((t) => audit(t));
  const merged = {
    target: targets.join(" "),
    filesScanned: reports.reduce((n, r) => n + r.filesScanned, 0),
    totals: {
      errors: reports.reduce((n, r) => n + r.totals.errors, 0),
      warnings: reports.reduce((n, r) => n + r.totals.warnings, 0),
      filesWithIssues: reports.reduce((n, r) => n + r.totals.filesWithIssues, 0),
    },
    byRule: reports.reduce((acc, r) => {
      for (const [k, v] of Object.entries(r.byRule)) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    }, {}),
    byFile: Object.assign({}, ...reports.map((r) => r.byFile)),
    findings: reports.flatMap((r) => r.findings),
  };
  emit(flag("--json") ? JSON.stringify(merged, null, 2) : toMarkdown(merged, { fixHints: flag("--fix-hints") }));
  const max = Number(opt("--max-errors") ?? 0);
  process.exit(merged.totals.errors > max ? 1 : 0);
} else if (cmd === "doctor") {
  const r = doctor(positional[0] ?? ".");
  emit(flag("--json") ? JSON.stringify(r, null, 2) : doctorMarkdown(r));
  process.exit(r.ok ? 0 : 1);
} else if (cmd === "guide") {
  console.log(join(dirname(fileURLToPath(import.meta.url)), "..", "ai", "core.md"));
} else {
  console.log(`g4os-ds · ferramentas do G4OS-DS

  audit <pasta…>   encontra o que foge do DS (cores fixas, bg-white, paleta Tailwind,
                   classes shadcn, <select>, confirm/alert, formatação en-US, texto fora da escala)
                   --json  --fix-hints  --max-errors N  --out arquivo
  doctor [pasta]   confere pré-requisitos (React 19, Tailwind v4, Base UI, CSS, tema, fonte)
  guide            caminho do guia para agentes (ai/core.md)`);
  process.exit(cmd ? 1 : 0);
}
