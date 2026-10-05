#!/usr/bin/env node
// Compatibilidade com React 18 (e paridade com 19).
//
// Empacota o DS (npm pack), instala num projeto temporário com react@18 e
// @types/react@18 (e depois com 19) e verifica, como um app consumidor:
//   1. tipos: `tsc` sobre um arquivo que importa todos os exports e sobre os
//      blocos (src/blocks) copiados do pacote instalado;
//   2. render no servidor: renderToString de cada bloco e de cada página do
//      showcase (que exercita os exemplos de todos os componentes);
//   3. render no cliente: createRoot + act em DOM simulado (happy-dom), montar
//      e desmontar cada um.
// Falha com qualquer erro de render ou aviso do React (atributo desconhecido,
// "non-boolean attribute", ref em componente de função, chave…).
//
// Uso: node scripts/test-react18.mjs [--react 18|19|both] [--skip-build] [--only-types]
// Pastas de trabalho ficam em $TMPDIR/g4os-ds-react-compat (reaproveitadas
// entre execuções, então a segunda rodada é bem mais rápida).

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Executado dentro do projeto temporário (resolve react da versão testada).
const RUNNER = String.raw`
// node runner.mjs ssr|client
const phase = process.argv[2];
const issues = [];
let current = { kind: "?", slug: "?" };
const textOf = (args) =>
  args
    .map((a) => (a instanceof Error ? a.stack || a.message : typeof a === "string" ? a : (() => { try { return JSON.stringify(a); } catch { return String(a); } })()))
    .join(" ");
const capture = (level) => (...args) => {
  let text = textOf(args);
  // Formato do React: "Warning: %s ..." com substituições.
  if (typeof args[0] === "string" && args[0].includes("%s")) {
    let i = 1;
    text = args[0].replace(/%s/g, () => String(args[i++])) + " " + args.slice(i).map(String).join(" ");
  }
  // Ruído do ambiente simulado, não do DS. ECONNREFUSED: páginas que buscam arquivo de exemplo
  // (samples/*.xlsx) num DOM sem servidor; o happy-dom registra a falha e o componente mostra o estado de erro.
  if (/Not implemented|happy-dom|getContext|HTMLCanvasElement|ECONNREFUSED/i.test(text)) return;
  if (level === "warn" && !/React|Warning|ref|prop|attribute|key/i.test(text)) return;
  issues.push({ ...current, message: text });
};
console.error = capture("error");
console.warn = capture("warn");

if (phase === "client") {
  const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
  GlobalRegistrator.register({ url: "http://localhost/#/", width: 1440, height: 900 });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView ||= function () {};
}

const { modules } = await import("./render-bundle.mjs");
const React = await import("react");

if (phase === "ssr") {
  const { renderToString } = await import("react-dom/server");
  for (const m of modules) {
    current = { kind: m.kind, slug: m.slug };
    try {
      renderToString(React.createElement(m.C));
    } catch (e) {
      issues.push({ ...current, message: "lançou no render: " + (e?.stack || e) });
    }
  }
} else {
  const { createRoot } = await import("react-dom/client");
  const act = React.act ?? (await import("react-dom/test-utils")).act;
  for (const m of modules) {
    current = { kind: m.kind, slug: m.slug };
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      await act(async () => { root.render(React.createElement(m.C)); });
      await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
      await act(async () => { root.unmount(); });
    } catch (e) {
      issues.push({ ...current, message: "lançou no cliente: " + (e?.stack || e) });
      try { root.unmount(); } catch {}
    }
    host.remove();
  }
}
// Arquivo, não stdout: process.exit() corta a saída de pipe acima de 64 KB.
(await import("node:fs")).writeFileSync("result-" + phase + ".json", JSON.stringify({ count: modules.length, issues }));
process.exit(0);
`;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const which = opt("--react", "both");
const versions = which === "both" ? ["18", "19"] : [which];

const SPECS = {
  18: { react: "18.3.1", "react-dom": "18.3.1", "@types/react": "^18.3.0", "@types/react-dom": "^18.3.0" },
  19: { react: "19.2.8", "react-dom": "19.2.8", "@types/react": "^19.2.0", "@types/react-dom": "^19.2.0" },
};

const work = join(tmpdir(), "g4os-ds-react-compat");
mkdirSync(work, { recursive: true });
const t0 = Date.now();
const log = (msg) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
const run = (cmd, argv, cwd, quiet = true) => {
  const r = spawnSync(cmd, argv, { cwd, encoding: "utf8", stdio: quiet ? "pipe" : "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    if (quiet) process.stderr.write((r.stdout || "") + (r.stderr || ""));
    throw new Error(`${cmd} ${argv.join(" ")} falhou (${r.status})`);
  }
  return r.stdout || "";
};

// ---------------------------------------------------------------- pacote
if (!flag("--skip-build") || !existsSync(join(root, "dist/index.js"))) {
  log("npm run build");
  run("npm", ["run", "-s", "build"], root);
}
run("node", ["showcase/build.mjs", "--registry"], root);
for (const f of readdirSync(work)) if (f.endsWith(".tgz")) rmSync(join(work, f));
const packOut = run("npm", ["pack", "--silent", "--pack-destination", work], root).trim().split("\n").pop();
const tgz = join(work, packOut);
log(`pacote: ${packOut}`);

const failures = [];

for (const v of versions) {
  const dir = join(work, `react${v}`);
  mkdirSync(dir, { recursive: true });
  const spec = SPECS[v];
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: `g4os-ds-react${v}-compat`,
        private: true,
        type: "module",
        dependencies: {
          "@g4ai/ds": `file:${tgz}`,
          ...spec,
          "@base-ui/react": "1.8.0",
          "lucide-react": "1.45.0",
          typescript: "5.9.3",
          esbuild: "^0.25.0",
          "@happy-dom/global-registrator": "^20.0.0",
        },
      },
      null,
      2,
    ),
  );
  log(`React ${v}: npm install`);
  // O tgz muda a cada rodada: força reinstalar só ele.
  rmSync(join(dir, "node_modules/@g4ai"), { recursive: true, force: true });
  rmSync(join(dir, "package-lock.json"), { force: true });
  run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", "--legacy-peer-deps"], dir);
  const installed = JSON.parse(readFileSync(join(dir, "node_modules/react/package.json"), "utf8")).version;
  log(`React ${v}: react@${installed} instalado`);

  // ------------------------------------------------------------ 1. tipos
  const pkg = join(dir, "node_modules/@g4ai/ds");
  rmSync(join(dir, "blocks"), { recursive: true, force: true });
  cpSync(join(pkg, "src/blocks"), join(dir, "blocks"), { recursive: true });
  writeFileSync(
    join(dir, "all-exports.tsx"),
    [
      `import * as DS from "@g4ai/ds";`,
      `import * as Tokens from "@g4ai/ds/tokens";`,
      `// Usos que dependem de tipos do React: refs, eventos, inert e o Link do Next`,
      `// (href: string | UrlObject + propTypes): com @types/react@18 isso já quebrou.`,
      `import { forwardRef, useRef, type AnchorHTMLAttributes } from "react";`,
      `type UrlObject = { pathname?: string; query?: Record<string, string> };`,
      `const NextLikeLink = forwardRef<HTMLAnchorElement, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string | UrlObject; prefetch?: boolean }>(`,
      `  ({ href, prefetch: _p, ...rest }, ref) => <a ref={ref} href={typeof href === "string" ? href : href.pathname} {...rest} />,`,
      `);`,
      `DS.setLinkComponent(NextLikeLink);`,
      `export function Probe() {`,
      `  const ref = useRef<HTMLInputElement>(null);`,
      `  DS.useSlashShortcut(ref);`,
      `  return <div {...DS.inertProps(true)}><DS.Button onClick={(e) => e.preventDefault()}>Ok</DS.Button></div>;`,
      `}`,
      `export { DS, Tokens };`,
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          esModuleInterop: true,
          resolveJsonModule: true,
          isolatedModules: true,
          lib: ["DOM", "DOM.Iterable", "ES2023"],
          types: [],
        },
        include: ["all-exports.tsx", "blocks/**/*.ts", "blocks/**/*.tsx"],
      },
      null,
      2,
    ),
  );
  log(`React ${v}: tsc`);
  const tsc = spawnSync(join(dir, "node_modules/.bin/tsc"), ["-p", "."], { cwd: dir, encoding: "utf8" });
  if (tsc.status !== 0) {
    const out = (tsc.stdout + tsc.stderr).trim();
    // Erros de .d.ts de terceiros não são nossos; os do DS e dos blocos são.
    const lines = out.split("\n").filter((l) => /error TS/.test(l));
    const ours = lines.filter((l) => !/node_modules\/(?!@g4ai)/.test(l));
    if (ours.length) {
      failures.push(`React ${v} · tipos:\n  ${ours.slice(0, 40).join("\n  ")}${ours.length > 40 ? `\n  … +${ours.length - 40}` : ""}`);
    } else if (lines.length) {
      log(`React ${v}: ${lines.length} erro(s) de tipo em pacotes de terceiros (ignorados)`);
    }
  }
  if (flag("--only-types")) continue;

  // ------------------------------------------------------------ 2 e 3. render
  const alias = {
    "@g4ai/ds": pkg,
    "@base-ui/react": join(dir, "node_modules/@base-ui/react"),
    "lucide-react": join(dir, "node_modules/lucide-react"),
  };
  const entry = join(dir, "render-entry.tsx");
  writeFileSync(
    entry,
    [
      `import { pages, blocks } from ${JSON.stringify(join(root, "showcase/.generated/registry.ts"))};`,
      `export const modules = [...blocks.map((b) => ({ kind: "bloco", slug: b.slug, C: b.default })), ...pages.map((p) => ({ kind: "página", slug: p.slug, C: p.default }))];`,
      "",
    ].join("\n"),
  );
  const raw = {
    name: "raw",
    setup(b) {
      b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: join(a.resolveDir, a.path.replace(/\?raw$/, "")), namespace: "raw" }));
      b.onLoad({ filter: /.*/, namespace: "raw" }, (a) => ({ contents: readFileSync(a.path, "utf8"), loader: "text" }));
    },
  };
  const esbuild = await import(join(dir, "node_modules/esbuild/lib/main.js"));
  log(`React ${v}: esbuild`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    outfile: join(dir, "render-bundle.mjs"),
    jsx: "automatic",
    alias,
    external: ["react", "react-dom", "react/*", "react-dom/*"],
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"development"' },
    plugins: [raw],
    logLevel: "error",
    banner: { js: `import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);` },
  });
  writeFileSync(join(dir, "runner.mjs"), RUNNER);
  log(`React ${v}: render (servidor + cliente)`);
  const report = { count: 0, ssr: [], client: [] };
  let broken = false;
  for (const phase of ["ssr", "client"]) {
    rmSync(join(dir, `result-${phase}.json`), { force: true });
    const r = spawnSync("node", ["runner.mjs", phase], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    try {
      const part = JSON.parse(readFileSync(join(dir, `result-${phase}.json`), "utf8"));
      report.count = part.count;
      report[phase] = part.issues;
    } catch {
      failures.push(`React ${v} · ${phase} não terminou:\n${(r.stdout + r.stderr).slice(-3000)}`);
      broken = true;
    }
  }
  if (broken) continue;
  log(`React ${v}: ${report.count} módulos · servidor ${report.ssr.length} problema(s) · cliente ${report.client.length} problema(s)`);
  for (const [phase, list] of [
    ["servidor", report.ssr],
    ["cliente", report.client],
  ]) {
    if (!list.length) continue;
    // Agrupa pela assinatura (primeira linha, sem pilha) para o relatório caber.
    const groups = new Map();
    for (const p of list) {
      const sig = p.message.split("\n")[0].replace(/\s+at .*$/, "").slice(0, 260);
      const g = groups.get(sig) ?? { count: 0, where: new Set() };
      g.count++;
      g.where.add(`${p.kind} ${p.slug}`);
      groups.set(sig, g);
    }
    failures.push(
      `React ${v} · ${phase} (${list.length}):\n` +
        [...groups]
          .sort((a, b) => b[1].count - a[1].count)
          .map(([sig, g]) => `  ${g.count}× ${sig}\n     em ${[...g.where].slice(0, 8).join(", ")}${g.where.size > 8 ? ` +${g.where.size - 8}` : ""}`)
          .join("\n"),
    );
  }
}

if (failures.length) {
  console.error(`\n✗ Compatibilidade React (${versions.join(", ")}): ${failures.length} grupo(s) com problema\n`);
  for (const f of failures) console.error(f + "\n");
  process.exit(1);
}
log(`✓ React ${versions.join(" e ")}: ${flag("--only-types") ? "tipos" : "tipos, render no servidor e no cliente"} sem erros nem avisos`);

