// g4os-ds doctor: confere se um projeto pode usar o DS (portão de pré-requisitos da migração).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const major = (v) => Number(String(v ?? "").replace(/^[^\d]*/, "").split(".")[0]) || 0;

function findUp(start, name) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, name))) return join(dir, name);
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

function listFiles(dir, exts, depth = 5, out = []) {
  if (depth < 0 || !existsSync(dir)) return out;
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.name.startsWith(".") || ["node_modules", "dist", "build", ".next", "out"].includes(d.name)) continue;
    const p = join(dir, d.name);
    if (d.isDirectory()) listFiles(p, exts, depth - 1, out);
    else if (exts.some((e) => d.name.endsWith(e))) out.push(p);
  }
  return out;
}

export function doctor(target = ".") {
  const pkgPath = findUp(target, "package.json");
  const checks = [];
  const add = (level, label, detail, fix) => checks.push({ level, label, detail, fix });
  if (!pkgPath) {
    add("block", "package.json", "não encontrado", "Rode dentro do projeto do app.");
    return { root: resolve(target), checks, ok: false };
  }
  const root = dirname(pkgPath);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  const installed = (name) => {
    const p = join(root, "node_modules", name, "package.json");
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).version : null;
  };
  const ver = (name) => installed(name) ?? deps[name] ?? null;

  const react = ver("react");
  if (!react) add("block", "React", "não encontrado", "O DS é React 19.");
  else if (major(react) < 19) add("block", "React", `versão ${react}`, "Atualize para React 19 antes de migrar (npm i react@19 react-dom@19; em Next, Next 15+).");
  else add("ok", "React", react);

  const tw = ver("tailwindcss");
  const twConfig = ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.cjs", "tailwind.config.mjs"].find((f) => existsSync(join(root, f)));
  if (!tw) add("block", "Tailwind CSS", "não encontrado", "npm i -D tailwindcss@4 @tailwindcss/postcss (ou @tailwindcss/vite).");
  else if (major(tw) < 4) add("block", "Tailwind CSS", `versão ${tw}${twConfig ? ` + ${twConfig}` : ""}`, "Atualize para Tailwind v4 (npx @tailwindcss/upgrade) antes de migrar; o DS usa @theme e @source.");
  else add(twConfig ? "warn" : "ok", "Tailwind CSS", `${tw}${twConfig ? ` (ainda há ${twConfig}: confira se é necessário no v4)` : ""}`);

  for (const [name, why] of [["@base-ui/react", "primitivos acessíveis dos componentes"], ["lucide-react", "ícones"]]) {
    const v = ver(name);
    if (v) add("ok", name, v);
    else add("block", name, "não instalado", `npm i ${name} (${why}).`);
  }
  const ds = ver("@g4ai/ds") ?? (existsSync(join(root, "node_modules", "@g4ai", "ds")) ? "link local" : null);
  if (ds) add("ok", "@g4ai/ds", ds);
  else add("block", "@g4ai/ds", "não instalado", "pnpm add @g4ai/ds @base-ui/react lucide-react (ou npm i / yarn add).");

  const cssInJs = ["styled-components", "@emotion/react", "@mui/material", "@chakra-ui/react", "antd", "@mantine/core", "bootstrap", "react-bootstrap"].filter((n) => deps[n]);
  if (cssInJs.length) add("warn", "Outras bibliotecas de UI", cssInJs.join(", "), "Convivem durante a migração, mas não há mapeamento 1:1: reescreva por página com componentes do DS e remova a lib no fim.");
  if (deps.recharts || deps["chart.js"] || deps["react-chartjs-2"]) add("info", "Gráficos", "recharts/chart.js presente", "Prefira os gráficos do DS (SVG, tokens, tema escuro). Se mantiver, use @g4ai/ds/shadcn.css (--chart-1…5).");
  if (deps["@radix-ui/react-dialog"] || existsSync(join(root, "components.json"))) add("info", "shadcn/ui", "detectado", "Importe @g4ai/ds/shadcn.css para os componentes existentes herdarem tokens; troque por componentes do DS página a página.");

  const cssFiles = listFiles(root, [".css"]).filter((f) => /@import\s+["']tailwindcss["']|@tailwind\s+base/.test(readFileSync(f, "utf8")));
  const globalCss = cssFiles[0];
  if (!globalCss) add("block", "CSS global", "nenhum CSS com @import \"tailwindcss\"", "Crie app/globals.css com @import \"tailwindcss\"; @import \"@g4ai/ds/styles.css\";");
  else {
    const css = readFileSync(globalCss, "utf8");
    const rel = globalCss.slice(root.length + 1);
    if (/@g4ai\/ds\/styles\.css|G4OS-DS\/src\/styles\/index\.css/.test(css)) add("ok", "Estilos do DS", `importados em ${rel}`);
    else add("block", "Estilos do DS", `${rel} não importa @g4ai/ds/styles.css`, 'Adicione depois do tailwind: @import "@g4ai/ds/styles.css";');
    if (/@tailwind\s+base/.test(css)) add("block", "Sintaxe Tailwind v3", `${rel} usa @tailwind base`, 'Troque por @import "tailwindcss";');
  }

  const sources = listFiles(root, [".tsx", ".jsx", ".html"]);
  const all = sources.map((f) => [f, readFileSync(f, "utf8")]);
  const htmlRoot = all.find(([, s]) => /<html\b/.test(s));
  if (!htmlRoot) add("warn", "Raiz <html>", "não encontrei o layout com <html>", "Confira lang, ds-app e data-theme manualmente.");
  else {
    const [f, s] = htmlRoot;
    const rel = f.slice(root.length + 1);
    const tag = s.match(/<html\b[^>]*>/)[0];
    add(/pt-BR/.test(tag) ? "ok" : "warn", 'lang="pt-BR"', rel, /pt-BR/.test(tag) ? undefined : 'Use <html lang="pt-BR">.');
    add(/ds-app/.test(tag) ? "ok" : "info", "className ds-app", /ds-app/.test(tag) ? rel : "ausente", /ds-app/.test(tag) ? undefined : "Em apps (não sites) use ds-app: só a área de trabalho rola.");
    add(/data-theme/.test(tag) || /themeScript|applyTheme|useTheme/.test(s) ? "ok" : "warn", "Tema (data-theme)", /data-theme/.test(tag) ? "definido" : "ausente", 'Adicione data-theme="system" e <script dangerouslySetInnerHTML={{ __html: themeScript }} /> no <head>.');
    add(/Figtree/i.test(s) || all.some(([, x]) => /Figtree/i.test(x)) || (globalCss && /Figtree/i.test(readFileSync(globalCss, "utf8"))) ? "ok" : "warn", "Fonte Figtree", "", "next/font/google Figtree ou <link> do Google Fonts; ou defina --ds-font-sans da marca.");
  }
  if (deps.next) {
    add(all.some(([, s]) => /setLinkComponent\(/.test(s)) ? "ok" : "warn", "setLinkComponent(Link)", "", "Registre next/link uma vez num módulo cliente importado pelo layout.");
  }
  const ok = !checks.some((c) => c.level === "block");
  return { root, checks, ok };
}

export function doctorMarkdown(r) {
  const icon = { ok: "✓", warn: "△", info: "i", block: "✗" };
  const l = [`# g4os-ds doctor · ${r.root}`, ""];
  for (const c of r.checks) l.push(`${icon[c.level]} **${c.label}**${c.detail ? `: ${c.detail}` : ""}${c.fix && c.level !== "ok" ? `\n    → ${c.fix}` : ""}`);
  l.push("", r.ok ? "Pronto para usar o DS." : "Bloqueado: resolva os itens ✗ antes de migrar (ver docs/guias/migracao.md).");
  return l.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // execução direta: node scripts/doctor.mjs <pasta>
  const r = doctor(process.argv[2] ?? ".");
  console.log(doctorMarkdown(r));
  process.exit(r.ok ? 0 : 1);
}
void statSync;
