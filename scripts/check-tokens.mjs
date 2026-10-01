// Verifica que src/tokens/index.ts espelha os semânticos de src/styles/tokens.css
// (tema claro → `color`, tema escuro → `colorDark`), a escala de texto e os raios.
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const ts = readFileSync(new URL("../src/tokens/index.ts", import.meta.url), "utf8");
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
let errors = 0;
const fail = (m) => { console.error(m); errors++; };

const block = (selectorRe) => {
  const m = css.match(selectorRe);
  if (!m) return "";
  const start = m.index + m[0].length;
  return css.slice(start, css.indexOf("\n}", start));
};
const primitives = Object.fromEntries([...block(/\n:root \{/).matchAll(/--(g4-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map(([, k, v]) => [k, v.toLowerCase()]));
const semantic = (body) => {
  const out = {};
  for (const [, name, raw] of body.matchAll(/--ds-([a-z0-9-]+):\s*([^;]+);/gi)) {
    let v = raw.trim();
    const ref = v.match(/^var\(--(g4-[a-z0-9-]+)\)$/);
    if (ref) v = primitives[ref[1]];
    if (/^#[0-9a-f]{6}$/i.test(v ?? "")) out[name] = v.toLowerCase();
  }
  return out;
};
const light = semantic(block(/\n:root,\n\[data-theme="light"\] \{/));
const dark = semantic(block(/\n\[data-theme="dark"\] \{/));
if (!Object.keys(light).length || !Object.keys(dark).length) fail("não achei os blocos de tema em tokens.css");

const tsObject = (name) => {
  const m = ts.match(new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\} as const`));
  return m ? Object.fromEntries([...m[1].matchAll(/(\w+): "(#[0-9a-f]{6})"/gi)].map(([, k, v]) => [k, v.toLowerCase()])) : {};
};
const skip = new Set(["focus"]); // estado de interação, não é cor de conteúdo
for (const [theme, values, obj] of [["claro", light, tsObject("color")], ["escuro", dark, tsObject("colorDark")]]) {
  for (const [name, hex] of Object.entries(values)) {
    if (skip.has(name)) continue;
    const key = camel(name);
    if (!(key in obj)) fail(`faltando no TS (${theme}): ${key}`);
    else if (obj[key] !== hex) fail(`divergente (${theme}): ${name} css=${hex} ts=${obj[key]}`);
  }
}
for (const [, name, value] of css.matchAll(/--text-([a-z]+):\s*([\d.]+)px/g)) {
  const m = ts.match(new RegExp(`\\n\\s+${name}: ([\\d.]+),`));
  if (!m || Number(m[1]) !== Number(value)) fail(`texto divergente: ${name}`);
}
for (const [, name, value] of css.matchAll(/--radius-(chip|control|tile|card|shell):\s*calc\(([\d.]+)px/g)) {
  if (!new RegExp(`${name}: ${value}\\b`).test(ts)) fail(`raio divergente: ${name}`);
}
if (errors) { console.error(`${errors} divergência(s)`); process.exit(1); }
console.log(`tokens ok: ${Object.keys(light).length} semânticos claro + ${Object.keys(dark).length} escuro alinhados com o TS`);
