// Compila o pacote para publicação: dist/ (ESM + "use client") e dist/types (.d.ts).
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
const entryPoints = [join(root, "src/index.ts"), join(root, "src/tokens/index.ts"), ...list("src/components", [".tsx", ".ts"]), ...list("src/lib", [".ts", ".tsx"])];

const pkg = (await import(join(root, "package.json"), { with: { type: "json" } })).default;
const external = [...Object.keys(pkg.peerDependencies ?? {}), "react/jsx-runtime", "react-dom/client", "@base-ui/react/*"];

await build({
  entryPoints,
  outbase: join(root, "src"),
  outdir: out,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  external,
  // Tudo aqui é componente/hook de cliente: marca cada arquivo para o Next App Router.
  banner: { js: '"use client";' },
  chunkNames: "chunks/[name]-[hash]",
  sourcemap: true,
  logLevel: "warning",
});

execFileSync("npx", ["tsc", "-p", join(root, "tsconfig.build.json")], { stdio: "inherit" });
console.log(`dist/ pronto: ${entryPoints.length} entradas`);
