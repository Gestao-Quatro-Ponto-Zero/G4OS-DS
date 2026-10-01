// g4os-ds init: prepara um projeto para checagem contínua do design system.
// Seguro: nunca sobrescreve sem --force, mostra tudo o que muda, --dry-run não grava nada.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { usageError } from "./lint/engine.mjs";

const AUDIT_EXT = "*.{ts,tsx,js,jsx,mjs,css,html}";

function detectPm(root) {
  if (existsSync(join(root, "pnpm-lock.yaml"))) return { name: "pnpm", install: "pnpm install --frozen-lockfile", exec: "pnpm exec g4os-ds", cache: "pnpm" };
  if (existsSync(join(root, "yarn.lock"))) return { name: "yarn", install: "yarn install --frozen-lockfile", exec: "yarn g4os-ds", cache: "yarn" };
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) return { name: "bun", install: "bun install --frozen-lockfile", exec: "bunx g4os-ds", cache: null };
  return { name: "npm", install: existsSync(join(root, "package-lock.json")) ? "npm ci" : "npm install", exec: "npx g4os-ds", cache: existsSync(join(root, "package-lock.json")) ? "npm" : null };
}

function workflow(pm) {
  const setup = [
    "      - uses: actions/checkout@v4",
    ...(pm.name === "pnpm" ? ["      - uses: pnpm/action-setup@v4"] : []),
    ...(pm.name === "bun" ? ["      - uses: oven-sh/setup-bun@v2"] : []),
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          node-version: 22",
    ...(pm.cache ? [`          cache: ${pm.cache}`] : []),
    `      - run: ${pm.install}`,
  ];
  return `# Criado por \`g4os-ds init\`. Checa o design system G4OS-DS em cada PR.
# Docs: https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS/blob/main/docs/guias/auditoria.md
name: G4OS-DS

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write # upload do SARIF (code scanning)

jobs:
  design-system:
    runs-on: ubuntu-latest
    steps:
${setup.join("\n")}
      - name: Pré-requisitos (doctor)
        run: ${pm.exec} doctor --format github
      - name: Auditoria (anotações no PR)
        run: ${pm.exec} audit --format github
      - name: Auditoria (SARIF para code scanning)
        if: always()
        run: ${pm.exec} audit --format sarif --out g4os-ds.sarif || true
      - uses: github/codeql-action/upload-sarif@v3
        if: always() && hashFiles('g4os-ds.sarif') != ''
        continue-on-error: true # repositório privado sem code scanning: as anotações acima já bastam
        with:
          sarif_file: g4os-ds.sarif
          category: g4os-ds
`;
}

const ESLINT_NEW = `// Criado por \`g4os-ds init --eslint\`. Regras do G4OS-DS no ESLint (editor + CI).
// Já usa outro parser (typescript-eslint, eslint-config-next)? Troque standalone por
// g4osDs.configs.recommended no fim do array da sua config.
import g4osDs from "@g4ai/ds/eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "dist/**", "build/**", "out/**", "coverage/**"] },
  g4osDs.config({ preset: "recommended", standalone: true }),
];
`;

const ESLINT_SNIPPET = `import g4osDs from "@g4ai/ds/eslint";

export default [
  // …sua config atual (typescript-eslint, next, etc.)
  g4osDs.configs.recommended, // ou g4osDs.configs.strict
];`;

export async function init({ cwd = process.cwd(), dryRun = false, force = false, eslint = false, hook, baseline = false, ci = true } = {}) {
  const root = resolve(cwd);
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) throw usageError(`package.json não encontrado em ${root}: rode na raiz do app.`);
  if (hook && !["lefthook", "husky", "simple-git-hooks"].includes(hook)) throw usageError(`--hook inválido: ${hook} (use lefthook, husky ou simple-git-hooks)`);
  const log = [dryRun ? "g4os-ds init (simulação: nada foi gravado)" : "g4os-ds init", ""];
  const pm = detectPm(root);
  const write = (rel, content, what) => {
    const p = join(root, rel);
    const exists = existsSync(p);
    if (exists && !force) {
      const same = readFileSync(p, "utf8") === content;
      log.push(same ? `= ${rel} já está assim` : `= ${rel} já existe (mantido; --force para substituir)`);
      return false;
    }
    if (!dryRun) {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, content);
    }
    log.push(`${exists ? "~ substituído" : "+ criado"} ${rel}${what ? ` · ${what}` : ""}`);
    return true;
  };

  // 1. config
  const include = ["src", "app", "components", "lib", "pages", "features", "modules"].filter((d) => existsSync(join(root, d)));
  const blFile = ".g4os-ds-baseline.json";
  const config = {
    $schema: "./node_modules/@g4ai/ds/scripts/lint/config.schema.json",
    extends: "recommended",
    include: include.length ? include : ["."],
    exclude: [],
    rules: {},
    ...(baseline ? { baseline: blFile } : {}),
  };
  write("g4os-ds.config.json", `${JSON.stringify(config, null, 2)}\n`, `preset recommended, pastas ${config.include.join(", ")}`);

  // 2. scripts
  const raw = readFileSync(pkgPath, "utf8");
  const indent = /^(\s+)"/m.exec(raw)?.[1] ?? "  ";
  const pkg = JSON.parse(raw);
  pkg.scripts ??= {};
  const scripts = { "ds:audit": "g4os-ds audit", "ds:audit:changed": "g4os-ds audit --changed", "ds:audit:fix": "g4os-ds audit --fix", "ds:doctor": "g4os-ds doctor" };
  const added = [];
  const kept = [];
  for (const [k, v] of Object.entries(scripts)) {
    if (pkg.scripts[k] === v) continue;
    if (pkg.scripts[k] && !force) kept.push(k);
    else {
      pkg.scripts[k] = v;
      added.push(k);
    }
  }
  if (hook === "simple-git-hooks") {
    if (!pkg["simple-git-hooks"]?.["pre-commit"] || force) {
      pkg["simple-git-hooks"] = { ...pkg["simple-git-hooks"], "pre-commit": `${pm.exec} audit --staged` };
      added.push('"simple-git-hooks".pre-commit');
    } else kept.push('"simple-git-hooks".pre-commit');
  }
  if (added.length) {
    if (!dryRun) writeFileSync(pkgPath, `${JSON.stringify(pkg, null, indent)}\n`);
    log.push(`~ package.json · ${added.join(", ")}`);
  }
  if (kept.length) log.push(`= package.json: ${kept.join(", ")} já existem com outro valor (mantidos; --force para trocar)`);
  if (!added.length && !kept.length) log.push("= package.json já tem os scripts ds:*");

  // 3. CI
  if (ci) write(".github/workflows/g4os-ds.yml", workflow(pm), `doctor + audit (anotações e SARIF), ${pm.name}`);

  // 4. ESLint
  if (eslint) {
    const existing = ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", "eslint.config.mts", ".eslintrc", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs"].find((f) => existsSync(join(root, f)));
    if (existing && !force) {
      log.push(`= ${existing} já existe: adicione à mão (não edito config de ESLint existente):`, "", ...ESLINT_SNIPPET.split("\n").map((l) => `    ${l}`), "");
      if (/^\.eslintrc/.test(existing)) log.push("  (.eslintrc é o formato antigo: o plugin é para ESLint 9 flat config.)");
    } else write("eslint.config.mjs", ESLINT_NEW, "regras do DS no editor e no CI");
    if (!pkg.devDependencies?.eslint && !pkg.dependencies?.eslint) log.push(`  → instale o ESLint 9: ${pm.name === "npm" ? "npm i -D" : pm.name === "yarn" ? "yarn add -D" : `${pm.name} add -D`} eslint@9`);
  }

  // 5. pre-commit
  if (hook === "lefthook") {
    const yml = `pre-commit:\n  commands:\n    g4os-ds:\n      glob: "${AUDIT_EXT}"\n      run: ${pm.exec} audit --staged\n`;
    if (existsSync(join(root, "lefthook.yml")) && !force) {
      const cur = readFileSync(join(root, "lefthook.yml"), "utf8");
      log.push(/g4os-ds/.test(cur) ? "= lefthook.yml já roda g4os-ds" : `= lefthook.yml já existe: adicione em pre-commit.commands:\n    g4os-ds:\n      glob: "${AUDIT_EXT}"\n      run: ${pm.exec} audit --staged`);
    } else write("lefthook.yml", yml, "pre-commit audita só o que está staged");
    log.push("  → ative: npx lefthook install");
  } else if (hook === "husky") {
    const p = join(root, ".husky", "pre-commit");
    const line = `${pm.exec} audit --staged`;
    if (existsSync(p)) {
      const cur = readFileSync(p, "utf8");
      if (/g4os-ds/.test(cur)) log.push("= .husky/pre-commit já roda g4os-ds");
      else {
        if (!dryRun) writeFileSync(p, `${cur.replace(/\n?$/, "\n")}${line}\n`);
        log.push("~ .husky/pre-commit · + audit --staged");
      }
    } else write(".husky/pre-commit", `${line}\n`, "pre-commit audita só o que está staged");
    if (!pkg.devDependencies?.husky) log.push("  → instale e ative: npm i -D husky && npx husky init (mantenha a linha do g4os-ds)");
  } else if (hook === "simple-git-hooks") log.push("  → ative: npx simple-git-hooks");

  // 6. baseline
  if (baseline) {
    if (dryRun) log.push(`+ criaria ${blFile} com os achados atuais (dívida conhecida)`);
    else if (existsSync(join(root, blFile)) && !force) log.push(`= ${blFile} já existe (atualize com g4os-ds audit --update-baseline)`);
    else {
      const { runAudit } = await import("./lint/engine.mjs");
      const r = await runAudit({ cwd: root, baseline: join(root, blFile), updateBaseline: true });
      log.push(`+ criado ${blFile} · ${r.totals.baselined} achados conhecidos; só os novos falham daqui em diante`);
    }
  }

  log.push("", "Próximos passos:", `  ${pm.exec} doctor          pré-requisitos`, `  ${pm.exec} audit           auditoria (--fix corrige o que é seguro)`, "  Docs: node_modules/@g4ai/ds/docs/guias/auditoria.md");
  return { log, pm: pm.name, config };
}
