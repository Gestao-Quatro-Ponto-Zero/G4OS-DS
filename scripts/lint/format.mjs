// Saídas do g4os-ds audit: pretty (terminal), json, markdown, sarif (code scanning), github (anotações).
import { CATEGORIES, RULES } from "./rules.mjs";

export const FORMATS = ["pretty", "json", "markdown", "sarif", "github"];

const useColor = () => process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";
const paint = (code) => (s) => (useColor() ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const c = { red: paint(31), yellow: paint(33), blue: paint(34), dim: paint(2), bold: paint(1), green: paint(32), underline: paint(4) };
const sevLabel = { error: "erro", warn: "aviso", info: "info" };

export function format(report, kind = "pretty", opts = {}) {
  if (kind === "json") return JSON.stringify(stripInternal(report), null, 2);
  if (kind === "markdown") return toMarkdown(report, opts);
  if (kind === "sarif") return JSON.stringify(toSarif(report), null, 2);
  if (kind === "github") return toGithub(report);
  return toPretty(report, opts);
}

function stripInternal(report) {
  return { ...report, findings: report.findings.map(({ start, end, lineText, ...f }) => (void start, void end, void lineText, f)) };
}

function summaryLine(r) {
  const t = r.totals;
  const parts = [`${r.filesScanned} arquivos`, `${t.errors} ${t.errors === 1 ? "erro" : "erros"}`, `${t.warnings} ${t.warnings === 1 ? "aviso" : "avisos"}`];
  if (t.infos) parts.push(`${t.infos} info`);
  if (t.fixed) parts.push(`${t.fixed} corrigidos`);
  if (t.baselined) parts.push(`${t.baselined} na baseline`);
  return parts.join(" · ");
}

function groupBy(list, key) {
  const m = new Map();
  for (const x of list) m.set(x[key], [...(m.get(x[key]) ?? []), x]);
  return m;
}

export function toPretty(r, { fixHints = true, limit = 500 } = {}) {
  const out = [];
  let shown = 0;
  for (const [file, list] of groupBy(r.findings, "file")) {
    if (shown >= limit) break;
    out.push("", c.underline(file));
    for (const f of list) {
      if (shown++ >= limit) break;
      const sev = f.severity === "error" ? c.red("erro ") : f.severity === "warn" ? c.yellow("aviso") : c.blue("info ");
      out.push(`  ${c.dim(`${f.line}:${f.col}`.padEnd(8))} ${sev}  ${f.message}${f.fix ? c.green(" (corrigível)") : ""}  ${c.dim(f.rule)}`);
      out.push(`  ${" ".repeat(8)}        ${c.dim(f.snippet)}${fixHints && f.suggestion ? `  → ${f.suggestion}` : ""}`);
    }
  }
  if (r.findings.length > shown) out.push("", c.dim(`… e mais ${r.findings.length - shown} (use --format json).`));
  out.push("");
  if (r.findings.length) {
    const cats = Object.entries(r.byCategory).sort((a, b) => b[1] - a[1]);
    out.push(c.bold("Por categoria: ") + cats.map(([k, n]) => `${CATEGORIES[k] ?? k} ${n}`).join(" · "));
    const top = Object.entries(r.byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    out.push(c.bold("Mais ocorrências: ") + top.map(([f, n]) => `${f} (${n})`).join(" · "));
    if (r.totals.fixable) out.push(c.green(`${r.totals.fixable} corrigíveis com --fix.`));
  }
  if (r.baseline) out.push(c.dim(r.baseline.created ? `Baseline gravada em ${r.baseline.path} (${r.baseline.baselined} achados).` : `Baseline ${r.baseline.path}: ${r.baseline.baselined} conhecidos ignorados${r.baseline.resolved ? `, ${r.baseline.resolved} já resolvidos (rode --update-baseline)` : ""}.`));
  const t = r.totals;
  const head = t.errors ? c.red(c.bold("✗ ")) : t.warnings ? c.yellow(c.bold("△ ")) : c.green(c.bold("✓ "));
  out.push(`${head}${summaryLine(r)}${!r.findings.length ? " · nada fora do design system" : ""}`);
  return out.join("\n").replace(/^\n/, "");
}

export function toMarkdown(r, { fixHints = false, limit = 400 } = {}) {
  const l = [`# Auditoria G4OS-DS · ${r.target}`, "", `${summaryLine(r).replace(/(\d+ erros?)/, "**$1**")} · ${r.totals.filesWithIssues} arquivos com ocorrência`, ""];
  if (!r.findings.length) return [...l, "Nada fora do design system. ✓"].join("\n");
  l.push("| Regra | Categoria | Gravidade | Ocorrências | O que fazer |", "| --- | --- | --- | --- | --- |");
  const sevOf = Object.fromEntries(r.findings.map((f) => [f.rule, f.severity]));
  for (const [rule, n] of Object.entries(r.byRule).sort((a, b) => b[1] - a[1])) {
    const m = RULES[rule];
    l.push(`| [${m.title}](${m.docs}) (\`${rule}\`) | ${CATEGORIES[m.category]} | ${sevLabel[sevOf[rule]]} | ${n} | ${m.hint.replace(/\|/g, "\\|")} |`);
  }
  l.push("");
  let shown = 0;
  for (const [file, list] of [...groupBy(r.findings, "file")].sort((a, b) => b[1].length - a[1].length)) {
    if (shown >= limit) {
      l.push(`… e mais ${r.findings.length - shown} ocorrências (use --format json para a lista completa).`);
      break;
    }
    l.push(`## ${file} (${list.length})`, "");
    for (const f of list) {
      if (shown++ >= limit) break;
      l.push(`- L${f.line} \`${f.rule}\` ${f.severity === "error" ? "✗" : f.severity === "warn" ? "△" : "i"} \`${f.snippet.replace(/`/g, "'")}\`${fixHints ? ` → ${f.suggestion}` : ""}${f.fix ? " (corrigível)" : ""}`);
    }
    l.push("");
  }
  l.push("Ignorar com motivo: `// g4os-ds-disable-next-line <regra> -- motivo` (ou `// ds-audit-ignore <regra>: motivo`). Corrigir o que é seguro: `g4os-ds audit --fix`.");
  return l.join("\n");
}

const ghEscape = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const ghProp = (s) => ghEscape(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** Anotações de workflow do GitHub Actions (::error file=…,line=…::msg). */
export function toGithub(r) {
  const lines = r.findings.map((f) => {
    const level = f.severity === "error" ? "error" : f.severity === "warn" ? "warning" : "notice";
    return `::${level} file=${ghProp(f.file)},line=${f.line},col=${f.col},endLine=${f.endLine},endColumn=${f.endCol},title=${ghProp(`g4os-ds/${f.rule}`)}::${ghEscape(`${f.message}: ${f.snippet} → ${f.suggestion}`)}`;
  });
  lines.push(`g4os-ds audit: ${summaryLine(r)}`);
  return lines.join("\n");
}

/** SARIF 2.1.0 (GitHub code scanning, Azure DevOps, IDEs). */
export function toSarif(r, { version = "0.0.0" } = {}) {
  const ids = Object.keys(RULES);
  const level = { error: "error", warn: "warning", info: "note" };
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "g4os-ds",
            informationUri: "https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS",
            version: r.toolVersion ?? version,
            rules: ids.map((id) => ({
              id,
              name: id.replace(/(^|-)(\w)/g, (_, __, ch) => ch.toUpperCase()),
              shortDescription: { text: RULES[id].title },
              fullDescription: { text: RULES[id].hint },
              helpUri: RULES[id].docs,
              help: { text: RULES[id].hint, markdown: `${RULES[id].hint}\n\n[Documentação](${RULES[id].docs})` },
              properties: { category: RULES[id].category, tags: ["design-system", RULES[id].category] },
              defaultConfiguration: { level: level[RULES[id].severity] ?? "none" },
            })),
          },
        },
        originalUriBaseIds: { SRCROOT: { uri: `file://${r.cwd.replace(/\\/g, "/").replace(/\/?$/, "/")}` } },
        results: r.findings.map((f) => ({
          ruleId: f.rule,
          ruleIndex: ids.indexOf(f.rule),
          level: level[f.severity],
          message: { text: `${f.message}: ${f.snippet}. ${f.suggestion}` },
          locations: [{ physicalLocation: { artifactLocation: { uri: f.file, uriBaseId: "SRCROOT" }, region: { startLine: f.line, startColumn: f.col, endLine: f.endLine, endColumn: f.endCol } } }],
          partialFingerprints: { "g4osDs/v1": `${f.rule}:${f.file}:${f.lineText ?? f.snippet}` },
        })),
      },
    ],
  };
}
