// Plugin ESLint 9 (flat config) do G4OS-DS: as mesmas regras do `g4os-ds audit`,
// com o mesmo motor (scripts/lint), para aparecer no editor e no `eslint .`.
//
//   import g4osDs from "@g4ai/ds/eslint";
//   export default [...suaConfig, g4osDs.configs.recommended];          // já tem parser de TS/JSX
//   export default [g4osDs.config({ preset: "recommended", standalone: true })]; // sem outro parser
//
// O motor lê o texto do arquivo (className, cn(), clsx(), templates, tags JSX), então funciona
// com qualquer parser: typescript-eslint, espree com JSX, babel ou o leitor próprio (standalone).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lintText } from "./engine.mjs";
import { PRESETS, RULES, presetSeverity } from "./rules.mjs";
import { lineIndex, scanJs } from "./source.mjs";

const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf8"));
const FILES = ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"];
const ALL_ON = Object.fromEntries(Object.keys(RULES).map((id) => [id, "error"]));

// Um lint por arquivo, compartilhado entre as regras (todas ligadas; o ESLint filtra pela config).
const cache = new WeakMap();
function findingsFor(sourceCode, filename) {
  let r = cache.get(sourceCode);
  if (!r) {
    r = lintText(sourceCode.text, filename, { severities: ALL_ON });
    cache.set(sourceCode, r);
  }
  return r;
}

const eslintSeverity = { error: "error", warn: "warn", info: "warn", off: "off" };

const rules = Object.fromEntries(
  Object.entries(RULES).map(([id, meta]) => [
    id,
    {
      meta: {
        type: meta.category === "a11y" || meta.category === "react" || meta.category === "seguranca" ? "problem" : "suggestion",
        docs: { description: `${meta.title}. ${meta.hint}`, url: meta.docs, recommended: presetSeverity(id) !== "off" },
        fixable: meta.fixable ? "code" : undefined,
        schema: [],
        messages: { found: "{{title}}: {{snippet}} → {{suggestion}}" },
      },
      create(context) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const filename = context.filename ?? context.getFilename();
        return {
          "Program:exit"() {
            for (const f of findingsFor(sourceCode, filename)) {
              if (f.rule !== id) continue;
              context.report({
                loc: { start: { line: f.line, column: f.col - 1 }, end: { line: f.endLine, column: f.endCol - 1 } },
                messageId: "found",
                data: { title: meta.title, snippet: f.snippet, suggestion: f.suggestion },
                fix: f.fix ? (fixer) => fixer.replaceTextRange([f.fix.start, f.fix.end], f.fix.text) : null,
              });
            }
          },
        };
      },
    },
  ]),
);

/**
 * Leitor mínimo para projetos sem parser de TS/JSX: devolve um Program vazio com os
 * comentários (para eslint-disable funcionar). Só serve às regras do G4OS-DS.
 */
export const parser = {
  meta: { name: "g4os-ds/standalone", version: pkg.version },
  parseForESLint(code) {
    const idx = lineIndex(code);
    const loc = (o) => {
      const p = idx.pos(o);
      return { line: p.line, column: p.col - 1 };
    };
    const comments = scanJs(code).comments.map((c) => {
      const block = c.text.startsWith("/*");
      return { type: block ? "Block" : "Line", value: block ? c.text.slice(2, -2) : c.text.slice(2), range: [c.start, c.end], loc: { start: loc(c.start), end: loc(c.end) } };
    });
    const ast = { type: "Program", body: [], sourceType: "module", range: [0, code.length], loc: { start: { line: 1, column: 0 }, end: loc(code.length) }, tokens: [], comments };
    return { ast, visitorKeys: { Program: [] } };
  },
};

const plugin = {
  meta: { name: "@g4ai/ds", version: pkg.version, namespace: "g4os-ds" },
  rules,
  parser,
  configs: {},
};

const presetRules = (preset) =>
  Object.fromEntries(
    Object.keys(RULES)
      .map((id) => [`g4os-ds/${id}`, eslintSeverity[presetSeverity(id, preset)]])
      .filter(([, s]) => s !== "off"),
  );

/** Monta um bloco de flat config. standalone: usa o leitor próprio (sem typescript-eslint). */
function config({ preset = "recommended", standalone = false, files = FILES, rules: extra = {} } = {}) {
  if (!PRESETS.includes(preset)) throw new Error(`@g4ai/ds/eslint: preset inválido "${preset}" (use ${PRESETS.join(", ")})`);
  return {
    name: `g4os-ds/${preset}${standalone ? "-standalone" : ""}`,
    files,
    plugins: { "g4os-ds": plugin },
    ...(standalone ? { languageOptions: { parser } } : {}),
    rules: { ...presetRules(preset), ...extra },
  };
}

for (const p of PRESETS) plugin.configs[p] = config({ preset: p });
plugin.configs.all = { ...config({ preset: "strict" }), name: "g4os-ds/all", rules: Object.fromEntries(Object.keys(RULES).map((id) => [`g4os-ds/${id}`, "error"])) };

export { config, rules };
export const configs = plugin.configs;
export default { ...plugin, config };
