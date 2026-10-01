// Compila o showcase: esbuild (React) + Tailwind CLI (CSS). Saída: showcase/dist.
// Gera showcase/.generated/registry.ts a partir de showcase/pages/*.tsx e
// src/blocks/*.tsx: basta criar o arquivo para ele aparecer no site.
// `node showcase/build.mjs --watch` recompila a cada mudança.
import { build, context } from "esbuild";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");
const gen = join(here, ".generated");
const watch = process.argv.includes("--watch");
mkdirSync(out, { recursive: true });
mkdirSync(gen, { recursive: true });

function writeRegistry() {
  const list = (dir) => readdirSync(dir).filter((f) => f.endsWith(".tsx") && !f.startsWith("_")).sort();
  const pages = list(join(here, "pages"));
  const blocks = list(join(root, "src/blocks"));
  const lines = ["// Gerado por showcase/build.mjs. Não edite.", 'import type { PageModule, BlockModule } from "../kit";'];
  pages.forEach((f, i) => lines.push(`import * as p${i} from "../pages/${f.replace(".tsx", "")}";`, `import p${i}src from "../pages/${f}?raw";`));
  blocks.forEach((f, i) => lines.push(`import * as b${i} from "../../src/blocks/${f.replace(".tsx", "")}";`, `import b${i}src from "../../src/blocks/${f}?raw";`));
  lines.push(`export const pages: PageModule[] = [${pages.map((f, i) => `{ ...p${i}, slug: "${f.replace(".tsx", "")}", source: p${i}src } as PageModule`).join(", ")}];`);
  lines.push(`export const blocks: BlockModule[] = [${blocks.map((f, i) => `{ ...b${i}, slug: "${f.replace(".tsx", "")}", source: b${i}src } as BlockModule`).join(", ")}];`);
  // Arquivos de apoio dos blocos (cascas de produto, dados): aparecem na aba Código.
  const support = [];
  for (const dir of ["shells", "data"]) {
    const abs = join(root, "src/blocks", dir);
    let files = [];
    try {
      files = readdirSync(abs).filter((f) => /\.(tsx?|json)$/.test(f)).sort();
    } catch {}
    files.forEach((f) => support.push(`${dir}/${f}`));
  }
  support.forEach((f, i) => lines.push(`import s${i} from "../../src/blocks/${f}?raw";`));
  lines.push(`export const blockFiles: Record<string, string> = { ${support.map((f, i) => `"${f}": s${i}`).join(", ")} };`);
  writeFileSync(join(gen, "registry.ts"), lines.join("\n") + "\n");
}

const raw = {
  name: "raw",
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: join(a.resolveDir, a.path.replace(/\?raw$/, "")), namespace: "raw" }));
    b.onLoad({ filter: /.*/, namespace: "raw" }, (a) => ({ contents: readFileSync(a.path, "utf8"), loader: "text" }));
  },
};
const regen = {
  name: "regen",
  setup(b) {
    b.onStart(writeRegistry);
  },
};

writeRegistry();
if (process.argv.includes("--registry")) process.exit(0);
const options = {
  entryPoints: [join(here, "main.tsx")],
  bundle: true,
  format: "esm",
  outfile: join(out, "app.js"),
  jsx: "automatic",
  minify: !watch,
  alias: { "@g4ai/ds": join(root, "src/index.ts") },
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  plugins: [raw, regen],
  logLevel: "warning",
};
copyFileSync(join(here, "index.html"), join(out, "index.html"));
const css = ["@tailwindcss/cli", "-i", join(here, "showcase.css"), "-o", join(out, "app.css")];
if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  spawn("npx", [...css, "--watch"], { stdio: "inherit" });
  console.log("showcase em modo watch →", out);
} else {
  await build(options);
  execFileSync("npx", [...css, "--minify"], { stdio: "inherit" });
  console.log("showcase em", out);
}
