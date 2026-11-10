// Espelha cada bloco `[data-brand="x"][data-theme="dark"]` de src/styles/themes.css em
// `@media (prefers-color-scheme: dark) { [data-brand="x"][data-theme="system"] }`, para a marca
// também escurecer quando o tema segue o sistema. `--check` falha se o espelho estiver desatualizado.
import { readFileSync, writeFileSync } from "node:fs";
const file = new URL("../src/styles/themes.css", import.meta.url);
const START = "/* >>> gerado por scripts/sync-brand-system.mjs: não edite à mão <<< */";
const css = readFileSync(file, "utf8");
const source = css.split(START)[0].trimEnd();
const darkSelector = String.raw`\[data-brand="[a-z0-9-]+"\]\[data-theme="dark"\]`;
const blockPattern = new RegExp(`^(${darkSelector}(?:,\\n${darkSelector})*) \\{\\n([\\s\\S]*?)\\n\\}`, "gm");
const blocks = [...source.matchAll(blockPattern)];
const mirror = blocks
  .map(([, selectors, body]) => `${selectors.replaceAll('[data-theme="dark"]', '[data-theme="system"]').replace(/^/gm, "  ")} {\n${body.replace(/^/gm, "  ")}\n  }`)
  .join("\n");
const next = `${source}\n\n${START}\n/* "system": a marca segue o sistema operacional, com os mesmos valores do bloco escuro acima. */\n@media (prefers-color-scheme: dark) {\n${mirror}\n}\n`;
if (process.argv.includes("--check")) {
  if (next !== css) {
    console.error("themes.css: o espelho de data-theme=\"system\" está desatualizado. Rode `node scripts/sync-brand-system.mjs`.");
    process.exit(1);
  }
  console.log(`themes.css: ${blocks.length} marcas espelhadas em data-theme="system"`);
} else {
  writeFileSync(file, next);
  console.log(`themes.css: ${blocks.length} marcas espelhadas`);
}
