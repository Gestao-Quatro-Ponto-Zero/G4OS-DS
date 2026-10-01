// Compila o showcase: esbuild (React) + Tailwind CLI (CSS). Saída: showcase/dist.
// Gera showcase/.generated/registry.ts a partir de showcase/pages/*.tsx e
// src/blocks/*.tsx: basta criar o arquivo para ele aparecer no site.
// `node showcase/build.mjs --watch` recompila a cada mudança.
import { build, context } from "esbuild";
import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
writeAgentFiles();

/*
 * Modo web para agentes: o site no GitHub Pages também serve, como arquivos
 * estáticos, o que um agente precisa para usar o DS sem instalar nada:
 *   /llms.txt        índice no formato llmstxt.org (links absolutos para .md)
 *   /llms-full.txt   regras + tokens + anatomias + catálogo, num arquivo só
 *   /ai/**           referência gerada do código (core, tokens, componentes, blocos, manifest.json)
 *   /docs/**.md      guias, padrões, fundamentos e receitas
 */
function writeAgentFiles() {
  const SITE = "https://gestao-quatro-ponto-zero.github.io/G4OS-DS/";
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  writeFileSync(join(out, ".nojekyll"), "");
  for (const d of ["ai", "docs"]) {
    rmSync(join(out, d), { recursive: true, force: true });
    if (existsSync(join(root, d))) cpSync(join(root, d), join(out, d), { recursive: true });
  }
  const listMd = (dir, base = "") =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? listMd(join(dir, e.name), `${base}${e.name}/`) : e.name.endsWith(".md") ? [`${base}${e.name}`] : [],
    );
  const title = (file) => readFileSync(join(root, file), "utf8").match(/^#\s+(.+)$/m)?.[1] ?? file;
  const manifest = JSON.parse(readFileSync(join(root, "ai", "manifest.json"), "utf8"));
  const docs = listMd("docs");
  const section = (dir, label) => {
    const items = docs.filter((d) => d.startsWith(`${dir}/`));
    return items.length ? [`## ${label}`, "", ...items.map((d) => `- [${title(`docs/${d}`)}](${SITE}docs/${d})`), ""] : [];
  };
  const llms = [
    `# G4OS-DS (${pkg.name})`,
    "",
    `> Design system G4 OS: React 19 + Base UI + Tailwind v4, tokens semânticos com tema escuro e marcas de cliente, componentes, gráficos SVG e ${manifest.blocks.length} blocos de tela (CRM, ATS, ERP, financeiro, IA). Tudo em pt-BR. Versão ${pkg.version}.`,
    "",
    `Instale com \`pnpm add ${pkg.name}\`. Antes de escrever UI, leia as regras ([core](${SITE}ai/core.md)) e siga uma anatomia de página. Para agentes com MCP: \`claude mcp add g4os-ds -- npx -y ${pkg.name} mcp\`. Tudo num arquivo: [llms-full.txt](${SITE}llms-full.txt).`,
    "",
    "## Começar",
    "",
    `- [Regras e índice para agentes (core)](${SITE}ai/core.md): leia primeiro`,
    `- [Tokens](${SITE}ai/tokens.md): cores semânticas claro/escuro, escala de texto, raios, marcas`,
    `- [Manifesto JSON](${SITE}ai/manifest.json): todos os componentes (props), blocos (conceito) e tokens`,
    `- [Site com exemplos vivos](${SITE})`,
    "",
    ...section("guias", "Guias"),
    ...section("fundamentos", "Fundamentos"),
    ...section("padroes", "Padrões"),
    ...section("receitas", "Receitas por tipo de app"),
    "## Componentes",
    "",
    ...manifest.modules.map((m) => `- [${m.name}](${SITE}ai/components/${m.name}.md): ${m.summary}`),
    "",
    "## Blocos (telas prontas)",
    "",
    ...manifest.blocks.map((b) => `- [${b.title}](${SITE}ai/blocks/${b.slug}.md) (${b.category}): ${b.concept?.goal ?? b.description}`),
    "",
    "## Optional",
    "",
    `- [Código-fonte](https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS)`,
    `- [Pacote no npm](https://www.npmjs.com/package/${pkg.name})`,
    "",
  ].join("\n");
  writeFileSync(join(out, "llms.txt"), llms);
  const read = (f) => readFileSync(join(root, f), "utf8");
  const full = [
    `# G4OS-DS (${pkg.name} ${pkg.version}) · referência completa para agentes`,
    "",
    `Fonte: ${SITE} · regenerado a cada build. Detalhes de cada componente em ${SITE}ai/components/<módulo>.md e de cada bloco em ${SITE}ai/blocks/<slug>.md.`,
    "",
    read("ai/core.md"),
    read("ai/tokens.md"),
    read("docs/padroes/anatomia-de-pagina.md"),
    read("docs/guias/instalacao.md"),
    "# Catálogo de componentes",
    "",
    ...manifest.modules.map((m) => `## ${m.name}\n\n${m.summary}\n\n${m.exports.map((e) => `- \`${e.name}\` (${e.kind})${e.summary ? `: ${e.summary}` : ""}`).join("\n")}\n`),
    "# Catálogo de blocos",
    "",
    ...manifest.blocks.map((b) =>
      [`## ${b.slug} · ${b.title} (${b.category})`, "", b.concept?.goal ?? b.description ?? "", ...(b.concept?.patterns ?? []).map((x) => `- ${x}`), `Componentes: ${b.uses.join(", ")}`, ""].join("\n"),
    ),
  ].join("\n\n");
  writeFileSync(join(out, "llms-full.txt"), full);
  console.log(`modo agente: llms.txt, llms-full.txt (${Math.round(full.length / 1024)} KB), ai/, docs/ (${docs.length} guias)`);
}
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
