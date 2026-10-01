// Testes das regras e ferramentas de qualidade: `npm run test:lint`.
// Fixtures em __fixtures__/<regra>.<bad|good|fixed>.<ext>:
//   bad   → pelo menos 1 achado da regra (ou exatamente N com "expect N" na 1ª linha)
//   good  → nenhum achado da regra
//   fixed → resultado esperado de --fix sobre o bad
// Cabeçalhos opcionais: "preset strict", "renames {json}". Arquivos "_*" testam ignores (todas as regras).
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester, Linter } from "eslint";
import tseslint from "typescript-eslint";
import { applyFixes, lintText, loadConfig, runAudit, severitiesFor, exitCode } from "./engine.mjs";
import { format } from "./format.mjs";
import { PRESETS, RULES, presetSeverity, setRenames } from "./rules.mjs";
import g4osDs from "./eslint-plugin.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const fx = join(here, "__fixtures__");
const cli = join(root, "scripts", "cli.mjs");

let ok = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    ok++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${String(e.stack ?? e).split("\n").slice(0, 6).join("\n    ")}`);
  }
}

const tmp = () => mkdtempSync(join(tmpdir(), "g4os-ds-lint-"));
const run = (args, cwd) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

function header(text) {
  const head = text.split("\n").slice(0, 3).join("\n");
  const expect = /expect (\d+)/.exec(head);
  const preset = /preset (\w+)/.exec(head)?.[1];
  const ren = /renames (\{.*\})/.exec(head)?.[1];
  return { expect: expect ? Number(expect[1]) : null, preset, renames: ren ? JSON.parse(ren) : null };
}

function lintFixture(file, text) {
  const h = header(text);
  setRenames(h.renames);
  try {
    const severities = Object.fromEntries(Object.keys(RULES).map((id) => [id, presetSeverity(id, h.preset ?? "recommended")]));
    return { findings: lintText(text, file, { severities }), h, severities };
  } finally {
    setRenames(null);
  }
}

function fixAll(text, file, severities, h) {
  setRenames(h.renames);
  try {
    let out = text;
    for (let i = 0; i < 5; i++) {
      const r = applyFixes(out, lintText(out, file, { severities }));
      if (!r.applied) break;
      out = r.text;
    }
    return out;
  } finally {
    setRenames(null);
  }
}

const files = readdirSync(fx).sort();
const parseName = (f) => /^(.+?)\.(bad|good|fixed)\.(\w+)$/.exec(f);

console.log("Regras · fixtures");
for (const f of files) {
  const m = parseName(f);
  if (!m) continue;
  const [, rule, kind, ext] = m;
  if (kind === "fixed") continue;
  const text = readFileSync(join(fx, f), "utf8");
  await test(`${rule} · ${kind}.${ext}`, () => {
    const { findings, h, severities } = lintFixture(f, text);
    const special = rule.startsWith("_");
    const mine = special ? findings : findings.filter((x) => x.rule === rule);
    const show = () => findings.map((x) => `${x.line}:${x.col} ${x.rule} ${x.snippet}`).join("\n      ");
    if (kind === "good") assert.equal(mine.length, 0, `achados inesperados:\n      ${show()}`);
    else {
      if (h.expect != null) assert.equal(mine.length, h.expect, `esperava ${h.expect} de ${special ? "todas" : rule}, veio ${mine.length}:\n      ${show()}`);
      else assert.ok(mine.length > 0, `nenhum achado de ${rule}`);
      if (!special) assert.ok(mine.every((x) => x.docs?.includes(`#${rule}`) && x.suggestion && x.line > 0 && x.col > 0), "achado sem docs/sugestão/posição");
      const fixed = join(fx, `${rule}.fixed.${ext}`);
      if (existsSync(fixed)) assert.equal(fixAll(text, f, severities, h), readFileSync(fixed, "utf8"), "--fix diferente do esperado");
    }
  });
}

await test("toda regra tem fixture bad e good", () => {
  const have = new Set(files.map(parseName).filter(Boolean).map((m) => `${m[1]}.${m[2]}`));
  const missing = Object.keys(RULES).flatMap((id) => ["bad", "good"].filter((k) => !have.has(`${id}.${k}`)).map((k) => `${id}.${k}`));
  assert.deepEqual(missing, []);
});

await test("regra corrigível tem fixture fixed; metadados completos", () => {
  for (const [id, r] of Object.entries(RULES)) {
    assert.ok(r.title && r.hint && r.category && r.docs, id);
    for (const p of PRESETS) assert.ok(["off", "info", "warn", "error"].includes(presetSeverity(id, p)), `${id} ${p}`);
    if (r.fixable) assert.ok(files.some((f) => f.startsWith(`${id}.fixed.`)), `${id} sem .fixed`);
  }
});

await test("config.schema.json lista todas as regras", () => {
  const schema = JSON.parse(readFileSync(join(here, "config.schema.json"), "utf8"));
  assert.deepEqual(Object.keys(schema.properties.rules.properties).sort(), Object.keys(RULES).sort());
});

await test("docs/guias/auditoria.md documenta todas as regras", () => {
  const doc = readFileSync(join(root, "docs", "guias", "auditoria.md"), "utf8");
  const missing = Object.keys(RULES).filter((id) => !new RegExp(`^#{3,4} \`${id}\``, "m").test(doc));
  assert.deepEqual(missing, []);
});

await test("página do site (guia-auditoria) lista todas as regras", () => {
  const page = readFileSync(join(root, "showcase", "pages", "guia-auditoria.tsx"), "utf8");
  assert.deepEqual(Object.keys(RULES).filter((id) => !page.includes(`["${id}",`)), []);
});

/* ------------------------------------------------------------------ */
/* ESLint                                                              */
/* ------------------------------------------------------------------ */

console.log("Plugin ESLint");
const jsFixture = (f) => /\.(tsx|ts|jsx|js)$/.test(f);

await test("RuleTester (typescript-eslint): valid = good, invalid = bad (+ fixed)", () => {
  const tester = new RuleTester({ languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } });
  for (const id of Object.keys(RULES)) {
    const good = files.filter((f) => f.startsWith(`${id}.good.`) && jsFixture(f));
    const bad = files.filter((f) => f.startsWith(`${id}.bad.`) && jsFixture(f));
    if (!good.length && !bad.length) continue;
    const invalid = bad.map((f) => {
      const code = readFileSync(join(fx, f), "utf8");
      const { findings, h } = lintFixture(f, code);
      const mine = findings.filter((x) => x.rule === id);
      const fixedPath = join(fx, f.replace(".bad.", ".fixed."));
      let output = null;
      if (mine.some((x) => x.fix)) output = existsSync(fixedPath) && !h.renames ? applyFixes(code, mine).text : applyFixes(code, mine).text;
      return { code, filename: f, errors: mine.map((x) => ({ messageId: "found", line: x.line, column: x.col })), output, renames: h.renames };
    });
    // renames: o RuleTester roda síncrono dentro de tester.run; o estado global vale para o caso
    for (const c of invalid.filter((c) => c.renames)) setRenames(c.renames);
    try {
      tester.run(id, g4osDs.rules[id], {
        valid: good.map((f) => ({ code: readFileSync(join(fx, f), "utf8"), filename: f })),
        invalid: invalid.map(({ renames: _r, ...c }) => c),
      });
    } finally {
      setRenames(null);
    }
  }
});

await test("configs: recommended/strict/migration/all + config({ standalone })", () => {
  for (const p of [...PRESETS, "all"]) {
    const c = g4osDs.configs[p];
    assert.ok(c.plugins["g4os-ds"] && Object.keys(c.rules).length > 10, p);
    for (const k of Object.keys(c.rules)) assert.ok(k.startsWith("g4os-ds/") && k.slice(8) in RULES, k);
  }
  assert.equal(g4osDs.configs.recommended.rules["g4os-ds/tailwind-text-scale"], undefined);
  assert.equal(g4osDs.configs.strict.rules["g4os-ds/tailwind-text-scale"], "warn");
  assert.ok(g4osDs.config({ standalone: true }).languageOptions.parser.parseForESLint);
  assert.throws(() => g4osDs.config({ preset: "x" }));
});

await test("standalone (sem typescript-eslint): acha, corrige e respeita eslint-disable", () => {
  const linter = new Linter({ configType: "flat" });
  const cfg = [g4osDs.config({ standalone: true, files: ["**/*.tsx"] })];
  const code = 'export const A = () => <div className="bg-white text-gray-500" />;\n// eslint-disable-next-line g4os-ds/white-black\nexport const B = () => <div className="bg-white" />;\n';
  const msgs = linter.verify(code, cfg, { filename: "a.tsx" });
  assert.deepEqual(msgs.map((m) => m.ruleId).sort(), ["g4os-ds/tailwind-palette", "g4os-ds/white-black"]);
  const fixed = linter.verifyAndFix(code, cfg, { filename: "a.tsx" });
  assert.match(fixed.output, /className="bg-surface text-muted"/);
  assert.match(fixed.output, /B = \(\) => <div className="bg-white"/);
});

await test("mesmo resultado no CLI e no ESLint (bloco real do DS)", () => {
  const file = join(root, "src", "blocks", "crm-pipeline.tsx");
  const code = readFileSync(file, "utf8").replace('className="', 'className="bg-white text-gray-500 ');
  const engine = lintText(code, "x.tsx").map((f) => `${f.rule}:${f.line}:${f.col}`);
  const linter = new Linter({ configType: "flat" });
  const msgs = linter.verify(code, [{ ...g4osDs.configs.strict, languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } } }], { filename: "x.tsx" });
  const eslint = msgs.filter((m) => !m.fatal).map((m) => `${m.ruleId.slice(8)}:${m.line}:${m.column}`);
  assert.ok(engine.length >= 2);
  assert.deepEqual(eslint.filter((x) => engine.includes(x)).sort(), engine.sort());
});

/* ------------------------------------------------------------------ */
/* Config, baseline, formatos                                          */
/* ------------------------------------------------------------------ */

console.log("Config, baseline e formatos");

function project(filesMap, pkgExtra = {}) {
  const dir = tmp();
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", private: true, ...pkgExtra }, null, 2));
  for (const [p, c] of Object.entries(filesMap)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), c);
  }
  return dir;
}

await test("config: extends, rules, include/exclude, overrides; erros de config = exit 2", async () => {
  const dir = project({
    "g4os-ds.config.json": JSON.stringify({ extends: "strict", include: ["src"], exclude: ["src/legacy/**"], rules: { "text-size": "off" }, overrides: [{ files: ["src/admin/**"], rules: { "white-black": "warn" } }] }),
    "src/a.tsx": 'export const A = () => <p className="text-sm text-[14.5px] bg-white" />;\n',
    "src/admin/b.tsx": 'export const B = () => <p className="bg-white" />;\n',
    "src/legacy/c.tsx": 'export const C = () => <p className="bg-white" />;\n',
    "outside/d.tsx": 'export const D = () => <p className="bg-white" />;\n',
  });
  const cfg = loadConfig(dir);
  assert.equal(cfg.preset, "strict");
  assert.equal(severitiesFor(cfg, "src/admin/b.tsx")["white-black"], "warn");
  const r = await runAudit({ cwd: dir });
  const got = r.findings.map((f) => `${f.file}:${f.rule}:${f.severity}`).sort();
  assert.deepEqual(got, ["src/a.tsx:tailwind-text-scale:warn", "src/a.tsx:white-black:error", "src/admin/b.tsx:white-black:warn"]);
  writeFileSync(join(dir, "g4os-ds.config.json"), JSON.stringify({ rules: { "nao-existe": "error" } }));
  const bad = run(["audit"], dir);
  assert.equal(bad.status, 2, bad.stderr);
  assert.match(bad.stderr, /regra desconhecida/);
  writeFileSync(join(dir, "g4os-ds.config.json"), "{}");
  assert.equal(run(["audit", "nao-existe"], dir).status, 2);
  assert.equal(run(["audit", "--format", "xml"], dir).status, 2);
  rmSync(dir, { recursive: true, force: true });
});

await test("package.json#g4os-ds também vale como config", async () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="bg-white" />;\n' }, { "g4os-ds": { rules: { "white-black": "off" } } });
  const r = await runAudit({ cwd: dir, targets: ["src"] });
  assert.equal(r.findings.length, 0);
  assert.match(r.config, /package\.json#g4os-ds/);
  rmSync(dir, { recursive: true, force: true });
});

await test("baseline: cria, ignora o conhecido, falha só no novo, avisa o resolvido", async () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="bg-white" />;\nexport const B = () => <p className="text-gray-500" />;\n' });
  let r = run(["audit", "src", "--baseline"], dir);
  assert.equal(r.status, 0, r.stdout);
  assert.ok(existsSync(join(dir, ".g4os-ds-baseline.json")));
  r = run(["audit", "src", "--baseline"], dir);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /2 na baseline/);
  // linhas mudam de lugar: continua conhecido; novo achado falha
  writeFileSync(join(dir, "src/a.tsx"), '// topo novo\nexport const B = () => <p className="text-gray-500" />;\nexport const A = () => <p className="bg-white" />;\nexport const N = () => <p className="text-black" />;\n');
  r = run(["audit", "src", "--baseline", "--format", "json"], dir);
  assert.equal(r.status, 1);
  const j = JSON.parse(r.stdout);
  assert.deepEqual(j.findings.map((f) => f.snippet), ["text-black"]);
  assert.equal(j.totals.baselined, 2);
  // resolveu um: avisa para atualizar
  writeFileSync(join(dir, "src/a.tsx"), 'export const A = () => <p className="bg-white" />;\n');
  r = run(["audit", "src", "--baseline"], dir);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /já resolvidos/);
  assert.equal(run(["audit", "src", "--update-baseline"], dir).status, 0);
  assert.equal(JSON.parse(readFileSync(join(dir, ".g4os-ds-baseline.json"), "utf8")).total, 1);
  rmSync(dir, { recursive: true, force: true });
});

await test("--fix grava as trocas seguras e devolve 0 quando sobra só aviso", () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <a href="/x" target="_blank" className="bg-white rounded-[12px] border-gray-200 text-[14.5px]">x</a>;\n' });
  const r = run(["audit", "src", "--fix"], dir);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(readFileSync(join(dir, "src/a.tsx"), "utf8"), 'export const A = () => <a href="/x" target="_blank" rel="noopener noreferrer" className="bg-surface rounded-card border-line text-[14.5px]">x</a>;\n');
  assert.match(r.stdout, /corrigidos/);
  rmSync(dir, { recursive: true, force: true });
});

await test("--max-warnings, --rule, --preset e exit codes", () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="text-[14.5px] text-sm" />;\n' });
  assert.equal(run(["audit", "src"], dir).status, 0);
  assert.equal(run(["audit", "src", "--max-warnings", "0"], dir).status, 1);
  assert.equal(run(["audit", "src", "--rule", "text-size=error"], dir).status, 1);
  assert.equal(run(["audit", "src", "--rule", "text-size=off", "--max-warnings=0"], dir).status, 0);
  const strict = run(["audit", "src", "--preset", "strict", "--format", "json"], dir);
  assert.deepEqual(JSON.parse(strict.stdout).findings.map((f) => f.rule).sort(), ["tailwind-text-scale", "text-size"]);
  assert.equal(exitCode({ totals: { errors: 0, warnings: 3 } }, { maxWarnings: 2 }), 1);
  rmSync(dir, { recursive: true, force: true });
});

await test("formatos: json, markdown, github, sarif 2.1.0, pretty", async () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="bg-white" />;\n', "src/b.css": ".x { color: #fff; }\n" });
  const r = await runAudit({ cwd: dir, targets: ["src"] });
  const j = JSON.parse(format(r, "json"));
  assert.equal(j.totals.errors, 2);
  assert.ok(!("start" in j.findings[0]));
  assert.match(format(r, "markdown"), /\| \[bg-white/);
  const gh = format(r, "github").split("\n");
  assert.match(gh[0], /^::error file=src\/a\.tsx,line=1,col=\d+,endLine=1,endColumn=\d+,title=g4os-ds\/white-black::/);
  const s = JSON.parse(format(r, "sarif"));
  assert.equal(s.version, "2.1.0");
  const run0 = s.runs[0];
  assert.equal(run0.tool.driver.name, "g4os-ds");
  assert.equal(run0.tool.driver.rules.length, Object.keys(RULES).length);
  assert.equal(run0.results.length, 2);
  for (const x of run0.results) {
    assert.equal(run0.tool.driver.rules[x.ruleIndex].id, x.ruleId);
    assert.ok(x.locations[0].physicalLocation.region.startLine >= 1);
  }
  assert.match(format(r, "pretty"), /2 erros/);
  const out = join(dir, "r.sarif");
  assert.equal(run(["audit", "src", "--format", "sarif", "--out", out], dir).status, 1);
  assert.equal(JSON.parse(readFileSync(out, "utf8")).runs[0].results.length, 2);
  rmSync(dir, { recursive: true, force: true });
});

await test("--changed / --staged / --since com git", () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="bg-white" />;\n', "src/b.tsx": "export const B = 1;\n" });
  const git = (...a) => execFileSync("git", a, { cwd: dir, stdio: "pipe" });
  git("init", "-q");
  git("-c", "user.email=t@t", "-c", "user.name=t", "add", ".");
  git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "init");
  assert.equal(run(["audit", "src", "--changed"], dir).status, 0, "nada mudou");
  writeFileSync(join(dir, "src/b.tsx"), 'export const B = () => <p className="text-black" />;\n');
  const r = run(["audit", "src", "--changed", "--format", "json"], dir);
  assert.deepEqual(JSON.parse(r.stdout).findings.map((f) => f.file), ["src/b.tsx"]);
  assert.equal(run(["audit", "src", "--staged"], dir).status, 0, "nada staged");
  git("add", "src/b.tsx");
  assert.equal(run(["audit", "src", "--staged"], dir).status, 1);
  assert.equal(run(["audit", "src", "--since", "HEAD"], dir).status, 1);
  rmSync(dir, { recursive: true, force: true });
});

/* ------------------------------------------------------------------ */
/* init e doctor                                                       */
/* ------------------------------------------------------------------ */

console.log("init e doctor");

await test("init: --dry-run não grava; grava config, scripts, CI; não sobrescreve sem --force", () => {
  const dir = project({ "src/a.tsx": 'export const A = () => <p className="bg-white" />;\n', "package-lock.json": "{}" }, { scripts: { "ds:doctor": "echo meu" } });
  const dry = run(["init", "--dry-run", "--eslint", "--hook", "lefthook", "--baseline"], dir);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /simulação/);
  assert.ok(!existsSync(join(dir, "g4os-ds.config.json")) && !existsSync(join(dir, ".github")) && !existsSync(join(dir, "eslint.config.mjs")));
  const real = run(["init", "--eslint", "--hook", "lefthook", "--baseline"], dir);
  assert.equal(real.status, 0, real.stderr);
  const cfg = JSON.parse(readFileSync(join(dir, "g4os-ds.config.json"), "utf8"));
  assert.deepEqual(cfg.include, ["src"]);
  assert.equal(cfg.baseline, ".g4os-ds-baseline.json");
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(pkg.scripts["ds:audit"], "g4os-ds audit");
  assert.equal(pkg.scripts["ds:doctor"], "echo meu", "não troca script existente");
  const wf = readFileSync(join(dir, ".github/workflows/g4os-ds.yml"), "utf8");
  assert.match(wf, /npm ci/);
  assert.match(wf, /audit --format github/);
  assert.match(wf, /upload-sarif/);
  assert.match(readFileSync(join(dir, "eslint.config.mjs"), "utf8"), /g4osDs\.config\(\{ preset: "recommended", standalone: true \}\)/);
  assert.match(readFileSync(join(dir, "lefthook.yml"), "utf8"), /audit --staged/);
  assert.ok(existsSync(join(dir, ".g4os-ds-baseline.json")));
  // com baseline, o audit passa; um erro novo falha
  assert.equal(run(["audit"], dir).status, 0);
  writeFileSync(join(dir, "src/n.tsx"), 'export const N = () => <p className="text-black" />;\n');
  assert.equal(run(["audit"], dir).status, 1);
  writeFileSync(join(dir, "g4os-ds.config.json"), '{ "extends": "strict" }\n');
  const again = run(["init"], dir);
  assert.match(again.stdout, /já existe \(mantido/);
  assert.equal(readFileSync(join(dir, "g4os-ds.config.json"), "utf8"), '{ "extends": "strict" }\n');
  assert.equal(run(["init", "--hook", "nao"], dir).status, 2);
  rmSync(dir, { recursive: true, force: true });
});

await test("init: pnpm + husky + simple-git-hooks + ESLint já existente", () => {
  const dir = project({ "pnpm-lock.yaml": "", "eslint.config.js": "export default [];\n", ".husky/pre-commit": "npm test\n" });
  const r = run(["init", "--eslint", "--hook", "husky"], dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /adicione à mão/);
  assert.equal(readFileSync(join(dir, "eslint.config.js"), "utf8"), "export default [];\n");
  assert.equal(readFileSync(join(dir, ".husky/pre-commit"), "utf8"), "npm test\npnpm exec g4os-ds audit --staged\n");
  assert.match(readFileSync(join(dir, ".github/workflows/g4os-ds.yml"), "utf8"), /pnpm\/action-setup/);
  const s = run(["init", "--hook", "simple-git-hooks"], dir);
  assert.equal(s.status, 0);
  assert.equal(JSON.parse(readFileSync(join(dir, "package.json"), "utf8"))["simple-git-hooks"]["pre-commit"], "pnpm exec g4os-ds audit --staged");
  rmSync(dir, { recursive: true, force: true });
});

await test("init: vários lockfiles seguem o CI existente; pastas vêm de quem importa o DS", () => {
  const dir = project({
    "bun.lock": "",
    "package-lock.json": "{}",
    ".github/workflows/deploy.yml": "jobs:\n  d:\n    steps:\n      - run: npm ci\n",
    "src/index.ts": "export default {};\n",
    "frontend/src/main.tsx": 'import { Button } from "@g4ai/ds";\nexport const M = () => <Button>Ok</Button>;\n',
    "frontend/src/views/a.tsx": 'import { Card } from "@g4ai/ds";\nexport const A = () => <Card />;\n',
  });
  const r = run(["init", "--dry-run"], dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /pastas frontend\/src\b/);
  assert.doesNotMatch(r.stdout, /pastas [^\n]*\bsrc,/);
  assert.match(r.stdout, /npm: já usado no CI/);
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", packageManager: "pnpm@9.0.0" }));
  assert.match(run(["init", "--dry-run"], dir).stdout, /pnpm: campo packageManager/);
  rmSync(dir, { recursive: true, force: true });
});

await test("doctor: bloqueia sem pré-requisitos, aponta ordem do CSS e formatos", () => {
  const dir = project({
    "app/globals.css": '@import "@g4ai/ds/styles.css";\n@import "tailwindcss";\n',
    "app/layout.tsx": 'export default function L({ children }) { return <html lang="en"><body>{children}</body></html>; }\n',
    "postcss.config.mjs": "export default { plugins: { tailwindcss: {} } };\n",
  }, { dependencies: { next: "15.0.0", react: "19.0.0", "react-dom": "19.0.0", "@g4ai/ds": "0.4.0", "@base-ui/react": "1.8.0", "lucide-react": "1.45.0" }, devDependencies: { tailwindcss: "4.3.0" } });
  const r = run(["doctor", "--format", "json"], dir);
  assert.equal(r.status, 1);
  const j = JSON.parse(r.stdout);
  const by = Object.fromEntries(j.checks.map((c) => [c.label, c]));
  assert.equal(by["Ordem dos imports CSS"].level, "block");
  assert.equal(by["Integração do Tailwind v4"].level, "block");
  assert.equal(by['lang="pt-BR"'].level, "warn");
  assert.equal(by["themeScript no <head>"].level, "warn");
  assert.equal(by["setLinkComponent(Link)"].level, "warn");
  const gh = run(["doctor", "--format", "github"], dir).stdout;
  assert.match(gh, /^::error file=app\/globals\.css,title=g4os-ds doctor/m);
  assert.equal(JSON.parse(run(["doctor", "--format", "sarif"], dir).stdout).version, "2.1.0");
  rmSync(dir, { recursive: true, force: true });
});

await test("doctor: React 18.2+ é suportado, abaixo disso bloqueia", () => {
  const deps = (react) => ({ dependencies: { react, "react-dom": react, "@g4ai/ds": "0.5.2", "@base-ui/react": "1.8.0", "lucide-react": "1.45.0" }, devDependencies: { tailwindcss: "4.3.0" } });
  for (const [react, level] of [["18.3.1", "ok"], ["19.2.0", "ok"], ["18.1.0", "block"], ["17.0.2", "block"]]) {
    const dir = project({ "src/a.tsx": "export const A = () => null;\n" }, deps(react));
    const j = JSON.parse(run(["doctor", "--format", "json"], dir).stdout);
    assert.equal(j.checks.find((c) => c.label === "React").level, level, `react ${react}`);
    rmSync(dir, { recursive: true, force: true });
  }
});

await test("rules: lista em markdown e json", () => {
  const md = run(["rules"], root).stdout;
  for (const id of Object.keys(RULES)) assert.ok(md.includes(`\`${id}\``), id);
  assert.equal(Object.keys(JSON.parse(run(["rules", "--format", "json"], root).stdout)).length, Object.keys(RULES).length);
});

console.log(`\n${ok} ok, ${failures.length} falha(s)`);
process.exit(failures.length ? 1 : 0);
