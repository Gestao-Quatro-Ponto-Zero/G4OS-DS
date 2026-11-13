// Compila o pacote para publicação: dist/ (ESM; componentes com "use client",
// libs puras e tokens sem a marca, para uso no servidor) e dist/types (.d.ts).
// O CSS (src/styles) e o código-fonte seguem no pacote: o Tailwind do app lê
// as classes direto de src/components via @source (ver src/styles/index.css).
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");
rmSync(out, { recursive: true, force: true });

const list = (dir, ext) => readdirSync(join(root, dir)).filter((f) => ext.some((e) => f.endsWith(e)) && !f.endsWith(".d.ts")).map((f) => join(root, dir, f));
// Libs puras (sem React): saem SEM "use client", para rodar em Server Component,
// rota de API ou script (ex.: buildPivot e formatCurrency no servidor). Uma lib
// só entra aqui se nem ela nem o que importa usam React — o check abaixo garante.
const serverSafe = ["cn", "color", "dates", "diff", "format", "geo-br", "office", "office-files", "pivot", "scale", "text"];
const serverEntries = [join(root, "src/tokens/index.ts"), ...serverSafe.map((n) => join(root, "src/lib", `${n}.ts`))];
const clientEntries = [join(root, "src/index.ts"), ...list("src/components", [".tsx", ".ts"]), ...list("src/lib", [".ts", ".tsx"]).filter((f) => !serverEntries.includes(f))];
const entryPoints = [...clientEntries, ...serverEntries];

const pkg = (await import(join(root, "package.json"), { with: { type: "json" } })).default;
const external = [...Object.keys(pkg.peerDependencies ?? {}), "react/jsx-runtime", "react-dom/client", "@base-ui/react/*"];

const common = {
  outbase: join(root, "src"),
  outdir: out,
  bundle: true,
  splitting: true,
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  external,
  sourcemap: true,
  logLevel: "warning",
};

// Componentes, hooks e o ponto de entrada principal: tudo de cliente, marcado
// para o Next App Router.
await build({
  ...common,
  entryPoints: clientEntries,
  platform: "browser",
  banner: { js: '"use client";' },
  chunkNames: "chunks/[name]-[hash]",
});

// Libs puras e tokens: sem a marca, com chunks próprios (nunca dividem código
// com os chunks de cliente, que levam "use client").
const server = await build({
  ...common,
  entryPoints: serverEntries,
  platform: "neutral",
  mainFields: ["module", "main"],
  chunkNames: "chunks/server-[name]-[hash]",
  metafile: true,
});
const reactish = /^(react|react-dom|@base-ui\/react|lucide-react)(\/|$)/;
for (const [file, meta] of Object.entries(server.metafile.outputs)) {
  const bad = meta.imports.filter((i) => i.external && reactish.test(i.path));
  if (bad.length) throw new Error(`${file} é lib de servidor mas importa ${bad.map((i) => i.path).join(", ")}: tire de serverSafe em scripts/build-lib.mjs`);
}

execFileSync("npx", ["tsc", "-p", join(root, "tsconfig.build.json")], { stdio: "inherit" });
console.log(`dist/ pronto: ${entryPoints.length} entradas`);
