// g4os-ds doctor: confere se um projeto pode usar o DS (portão de pré-requisitos da migração).
// Níveis: ok · info · warn · block (block = exit 1).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dsPkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));
const parse = (v) =>
  String(v ?? "")
    .replace(/^[^\d]*/, "")
    .split(/[.-]/)
    .slice(0, 3)
    .map((x) => Number.parseInt(x, 10) || 0);
const gte = (v, min) => {
  const a = parse(v);
  const b = parse(min);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};
const major = (v) => parse(v)[0];

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
    if (d.name.startsWith(".") || ["node_modules", "dist", "build", ".next", "out", "coverage", "__fixtures__", "fixtures", "__tests__"].includes(d.name)) continue;
    const p = join(dir, d.name);
    if (d.isDirectory()) listFiles(p, exts, depth - 1, out);
    else if (exts.some((e) => d.name.endsWith(e))) out.push(p);
  }
  return out;
}

/** Versões de react instaladas em lugares diferentes (React duplicado quebra hooks). */
function reactCopies(root) {
  const found = new Map();
  const visit = (nm, depth) => {
    if (depth > 3 || !existsSync(nm)) return;
    for (const d of readdirSync(nm, { withFileTypes: true })) {
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      if (d.name.startsWith("@")) {
        for (const s of existsSync(join(nm, d.name)) ? readdirSync(join(nm, d.name)) : []) visit(join(nm, d.name, s, "node_modules"), depth + 1);
        continue;
      }
      if (d.name === "react") {
        try {
          const v = JSON.parse(readFileSync(join(nm, "react", "package.json"), "utf8")).version;
          found.set(relative(root, join(nm, "react")), v);
        } catch {
          /* ignore */
        }
      } else if (depth < 3 && !d.name.startsWith(".")) visit(join(nm, d.name, "node_modules"), depth + 1);
    }
  };
  visit(join(root, "node_modules"), 0);
  return found;
}

export function doctor(target = ".") {
  const pkgPath = findUp(target, "package.json");
  const checks = [];
  const add = (level, label, detail, fix, file) => checks.push({ level, label, detail, ...(fix && level !== "ok" ? { fix } : {}), ...(file ? { file } : {}) });
  if (!pkgPath) {
    add("block", "package.json", "não encontrado", "Rode dentro do projeto do app.");
    return { root: resolve(target), checks, ok: false };
  }
  const root = dirname(pkgPath);
  const rel = (f) => relative(root, f);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  const installed = (name) => {
    const p = join(root, "node_modules", name, "package.json");
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")).version : null;
  };
  const ver = (name) => installed(name) ?? deps[name] ?? null;
  const peers = dsPkg.peerDependencies ?? {};
  const minOf = (name) => (peers[name] ?? "").replace(/^[^\d]*/, "") || "0.0.0";

  // Pacote
  const ds = ver("@g4ai/ds") ?? (existsSync(join(root, "node_modules", "@g4ai", "ds")) ? "link local" : null);
  if (ds) add("ok", "@g4ai/ds", ds);
  else add("block", "@g4ai/ds", "não instalado", "pnpm add @g4ai/ds @base-ui/react lucide-react (ou npm i / yarn add).");
  if (deps["@g4os/ds"]) add("warn", "Pacote antigo @g4os/ds", "ainda nas dependências", "Remova @g4os/ds; o nome publicado é @g4ai/ds (g4os-ds audit --fix troca os imports).");

  // React
  const react = ver("react");
  if (!react) add("block", "React", "não encontrado", "O DS funciona com React 18.2+ e 19.");
  else if (major(react) < 18 || (major(react) === 18 && parse(react)[1] < 2)) add("block", "React", `versão ${react}`, "O DS precisa de React 18.2+ (ou 19): npm i react@18.3 react-dom@18.3, ou react@19 react-dom@19 (Next 15+).");
  else if (major(react) === 18) add("ok", "React", `${react} (suportado; o DS também roda no 19)`);
  else add("ok", "React", react);
  const rd = ver("react-dom");
  if (react && rd && installed("react") && installed("react-dom") && installed("react") !== installed("react-dom")) add("warn", "react-dom", `${rd} ≠ react ${react}`, "Instale react e react-dom na mesma versão.");
  const copies = reactCopies(root);
  const versions = new Set(copies.values());
  if (copies.size > 1) add(versions.size > 1 ? "block" : "warn", "React duplicado", [...copies].map(([p, v]) => `${p}@${v}`).join(", "), "Uma cópia só: deduplique (npm dedupe / pnpm dedupe) ou ajuste overrides; React duplicado quebra hooks (Invalid hook call).");

  // Tailwind
  const tw = ver("tailwindcss");
  const twConfig = ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.cjs", "tailwind.config.mjs"].find((f) => existsSync(join(root, f)));
  if (!tw) add("block", "Tailwind CSS", "não encontrado", "npm i -D tailwindcss@4 @tailwindcss/postcss (ou @tailwindcss/vite).");
  else if (major(tw) < 4) add("block", "Tailwind CSS", `versão ${tw}${twConfig ? ` + ${twConfig}` : ""}`, "Atualize para Tailwind v4 (npx @tailwindcss/upgrade) antes de migrar; o DS usa @theme e @source.");
  else if (installed("tailwindcss") && !gte(tw, minOf("tailwindcss"))) add("warn", "Tailwind CSS", `${tw} (o DS pede ${peers.tailwindcss})`, `npm i -D tailwindcss@^${minOf("tailwindcss")}`);
  else add(twConfig ? "warn" : "ok", "Tailwind CSS", `${tw}${twConfig ? ` (ainda há ${twConfig}: no v4 a config fica no CSS)` : ""}`, twConfig ? "Migre o que restar para @theme no CSS e apague o arquivo (o DS não lê tailwind.config)." : undefined);
  const postcss = ["postcss.config.mjs", "postcss.config.js", "postcss.config.cjs", "postcss.config.ts", ".postcssrc.json"].find((f) => existsSync(join(root, f)));
  const viteCfg = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"].find((f) => existsSync(join(root, f)));
  const pipeline = postcss && /@tailwindcss\/postcss/.test(readFileSync(join(root, postcss), "utf8")) ? `${postcss} (@tailwindcss/postcss)` : viteCfg && /@tailwindcss\/vite/.test(readFileSync(join(root, viteCfg), "utf8")) ? `${viteCfg} (@tailwindcss/vite)` : null;
  if (tw && major(tw) >= 4) {
    if (pipeline) add("ok", "Integração do Tailwind v4", pipeline);
    else if (postcss && /tailwindcss['"]?\s*[:,)]/.test(readFileSync(join(root, postcss), "utf8"))) add("block", "Integração do Tailwind v4", `${postcss} usa o plugin do v3`, "Troque por @tailwindcss/postcss: export default { plugins: { \"@tailwindcss/postcss\": {} } }", postcss);
    else add("warn", "Integração do Tailwind v4", "não encontrei @tailwindcss/postcss nem @tailwindcss/vite", "Next: postcss.config.mjs com @tailwindcss/postcss. Vite: plugin @tailwindcss/vite. (Ignore se usa a CLI do Tailwind.)");
  }

  // Peers
  for (const [name, why] of [
    ["@base-ui/react", "primitivos acessíveis dos componentes"],
    ["lucide-react", "ícones"],
  ]) {
    const v = ver(name);
    if (!v) add("block", name, "não instalado", `npm i ${name} (${why}).`);
    else if (installed(name) && !gte(v, minOf(name))) add("warn", name, `${v} (o DS pede ${peers[name]})`, `npm i ${name}@${peers[name]}`);
    else add("ok", name, v);
  }

  // Outras bibliotecas
  const cssInJs = ["styled-components", "@emotion/react", "@mui/material", "@chakra-ui/react", "antd", "@mantine/core", "bootstrap", "react-bootstrap"].filter((n) => deps[n]);
  if (cssInJs.length) add("warn", "Outras bibliotecas de UI", cssInJs.join(", "), "Convivem durante a migração, mas não há mapeamento 1:1: reescreva por página com componentes do DS e remova a lib no fim.");
  if (deps.recharts || deps["chart.js"] || deps["react-chartjs-2"]) add("info", "Gráficos", "recharts/chart.js presente", "Prefira os gráficos do DS (SVG, tokens, tema escuro). Se mantiver, use @g4ai/ds/shadcn.css (--chart-1…5).");
  if (deps["@radix-ui/react-dialog"] || existsSync(join(root, "components.json"))) add("info", "shadcn/ui", "detectado", "Importe @g4ai/ds/shadcn.css para os componentes existentes herdarem tokens; troque por componentes do DS página a página.");

  // CSS global e ordem dos imports
  const cssFiles = listFiles(root, [".css"]).filter((f) => /@import\s+(?:url\()?["']tailwindcss["']|@tailwind\s+base/.test(readFileSync(f, "utf8")));
  const globalCss = cssFiles[0];
  let cssText = "";
  if (!globalCss) add("block", "CSS global", 'nenhum CSS com @import "tailwindcss"', 'Crie app/globals.css com @import "tailwindcss"; @import "@g4ai/ds/styles.css";');
  else {
    cssText = readFileSync(globalCss, "utf8");
    const r = rel(globalCss);
    const twAt = cssText.search(/@import\s+(?:url\()?["']tailwindcss["']/);
    const dsAt = cssText.search(/@import\s+(?:url\()?["'](?:@g4ai\/ds\/styles\.css|[^"']*G4OS-DS\/src\/styles\/index\.css)["']/);
    if (dsAt < 0) add("block", "Estilos do DS", `${r} não importa @g4ai/ds/styles.css`, 'Adicione depois do tailwind: @import "@g4ai/ds/styles.css";', r);
    else if (twAt >= 0 && dsAt < twAt) add("block", "Ordem dos imports CSS", `${r}: @g4ai/ds/styles.css vem antes de tailwindcss`, '@import "tailwindcss"; primeiro, depois @import "@g4ai/ds/styles.css"; (o DS estende o tema do Tailwind).', r);
    else add("ok", "Estilos do DS", `importados em ${r}, depois do tailwindcss`);
    if (/@tailwind\s+base/.test(cssText)) add("block", "Sintaxe Tailwind v3", `${r} usa @tailwind base`, 'Troque por @import "tailwindcss";', r);
    if (/@g4ai\/ds\/(src|dist)\//.test(cssText)) add("warn", "Import interno no CSS", r, "Use os pontos de entrada: @g4ai/ds/styles.css, tokens.css, themes.css, shadcn.css.", r);
    if (/@config\s+["']/.test(cssText)) add("info", "@config (tailwind.config) no CSS", r, "Compatível, mas a config do v4 vai em @theme; o DS não depende dela.", r);
  }

  // Layout raiz
  const sources = listFiles(root, [".tsx", ".jsx", ".html"]);
  const all = sources.map((f) => [f, readFileSync(f, "utf8")]);
  const rootLayout = all.find(([f]) => /(^|\/)app\/layout\.(t|j)sx$/.test(f.slice(root.length))) ?? all.find(([, s]) => /<html\b/.test(s));
  if (!rootLayout) add("warn", "Raiz <html>", "não encontrei o layout com <html>", "Confira lang, ds-app e data-theme manualmente.");
  else {
    const [f, s] = rootLayout;
    const r = rel(f);
    const tag = s.match(/<html\b[^>]*>/)?.[0] ?? "";
    add(/lang=["'{]?["']?pt-BR/.test(tag) ? "ok" : "warn", 'lang="pt-BR"', r, 'Use <html lang="pt-BR">.', r);
    add(/ds-app/.test(tag) ? "ok" : "info", "className ds-app", /ds-app/.test(tag) ? r : "ausente", "Em apps (não sites) use ds-app: só a área de trabalho rola.", r);
    add(/data-theme/.test(tag) ? "ok" : "warn", "Tema (data-theme)", /data-theme/.test(tag) ? "definido" : "ausente no <html>", 'Adicione data-theme="system" (ou light/dark) ao <html>.', r);
    // Vite: o themeScript costuma ser injetado por um plugin (transformIndexHtml) no vite.config
    const viteCfg = ["vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs"].map((n) => join(root, n)).find((p) => existsSync(p));
    const injected = viteCfg && /themeScript/.test(readFileSync(viteCfg, "utf8")) ? rel(viteCfg) : null;
    const hasTheme = /themeScript/.test(s) || injected;
    add(hasTheme ? "ok" : "warn", "themeScript no <head>", hasTheme ? (injected && !/themeScript/.test(s) ? `${injected} (transformIndexHtml)` : r) : "ausente", "<script dangerouslySetInnerHTML={{ __html: themeScript }} /> no <head> (Next) ou um plugin transformIndexHtml no vite.config (Vite): evita piscar o tema errado.", r);
    if (deps.next && /<html\b/.test(s) && !/suppressHydrationWarning/.test(tag)) add("info", "suppressHydrationWarning", r, "Em Next, o themeScript altera data-theme antes da hidratação: use <html … suppressHydrationWarning>.", r);
  }
  const fontOk = /Figtree/i.test(cssText) || all.some(([, x]) => /Figtree/i.test(x)) || /--ds-font-sans/.test(cssText);
  add(fontOk ? "ok" : "warn", "Fonte", fontOk ? "Figtree (ou --ds-font-sans) configurada" : "Figtree não encontrada", "next/font/google Figtree, <link> do Google Fonts, ou defina --ds-font-sans da marca.");
  if (deps.next) {
    add(all.some(([, s]) => /setLinkComponent\(/.test(s)) ? "ok" : "warn", "setLinkComponent(Link)", "", "Registre next/link uma vez num módulo cliente importado pelo layout (sem isso, links do DS recarregam a página).");
    const nextCfg = ["next.config.ts", "next.config.mjs", "next.config.js"].find((x) => existsSync(join(root, x)));
    if (nextCfg && /transpilePackages[^\]]*@g4ai\/ds/.test(readFileSync(join(root, nextCfg), "utf8"))) add("info", "transpilePackages", `${nextCfg} lista @g4ai/ds`, "Desnecessário: o pacote já vem compilado (dist/). Pode remover.", nextCfg);
  }

  // Qualidade contínua
  const hasConfig = ["g4os-ds.config.json", ".g4os-dsrc.json"].some((x) => existsSync(join(root, x))) || Boolean(pkg["g4os-ds"]);
  const hasScript = Object.values(pkg.scripts ?? {}).some((s) => /g4os-ds\s+audit/.test(s));
  if (hasConfig && hasScript) add("ok", "Auditoria contínua", "config + script de audit");
  else add("info", "Auditoria contínua", hasScript ? "sem g4os-ds.config.json" : "sem script de audit", "npx g4os-ds init: cria a config, scripts ds:audit/ds:doctor e o workflow de CI.");

  const ok = !checks.some((c) => c.level === "block");
  return { root, checks, ok };
}

const icon = { ok: "✓", warn: "△", info: "i", block: "✗" };

export function doctorMarkdown(r) {
  const l = [`# g4os-ds doctor · ${r.root}`, ""];
  for (const c of r.checks) l.push(`${icon[c.level]} **${c.label}**${c.detail ? `: ${c.detail}` : ""}${c.fix ? `\n    → ${c.fix}` : ""}`);
  l.push("", r.ok ? "Pronto para usar o DS." : "Bloqueado: resolva os itens ✗ antes de migrar (ver docs/guias/migracao.md).");
  return l.join("\n");
}

export function doctorFormat(r, kind = "pretty") {
  if (kind === "json") return JSON.stringify(r, null, 2);
  if (kind === "markdown") return doctorMarkdown(r);
  if (kind === "github") {
    const lvl = { block: "error", warn: "warning", info: "notice" };
    return [
      ...r.checks.filter((c) => c.level !== "ok").map((c) => `::${lvl[c.level]} ${c.file ? `file=${c.file},` : ""}title=g4os-ds doctor · ${c.label.replace(/[,:]/g, " ")}::${`${c.detail ?? ""}${c.fix ? ` → ${c.fix}` : ""}`.replace(/\n/g, " ")}`),
      r.ok ? "g4os-ds doctor: pronto para usar o DS" : "g4os-ds doctor: bloqueado",
    ].join("\n");
  }
  if (kind === "sarif") {
    const lvl = { block: "error", warn: "warning", info: "note" };
    const items = r.checks.filter((c) => c.level !== "ok");
    return JSON.stringify(
      {
        $schema: "https://json.schemastore.org/sarif-2.1.0.json",
        version: "2.1.0",
        runs: [
          {
            tool: { driver: { name: "g4os-ds doctor", version: dsPkg.version, informationUri: "https://github.com/Gestao-Quatro-Ponto-Zero/G4OS-DS", rules: [{ id: "doctor", shortDescription: { text: "Pré-requisitos do G4OS-DS" } }] } },
            results: items.map((c) => ({ ruleId: "doctor", level: lvl[c.level], message: { text: `${c.label}: ${c.detail ?? ""}${c.fix ? ` → ${c.fix}` : ""}` }, locations: [{ physicalLocation: { artifactLocation: { uri: c.file ?? "package.json" } } }] })),
          },
        ],
      },
      null,
      2,
    );
  }
  // pretty
  const color = process.stdout.isTTY && !process.env.NO_COLOR;
  const paint = { ok: 32, warn: 33, info: 34, block: 31 };
  const l = [`g4os-ds doctor · ${r.root}`, ""];
  for (const c of r.checks) {
    const ic = color ? `\x1b[${paint[c.level]}m${icon[c.level]}\x1b[0m` : icon[c.level];
    l.push(`${ic} ${c.label}${c.detail ? `: ${c.detail}` : ""}`);
    if (c.fix) l.push(`    → ${c.fix}`);
  }
  l.push("", r.ok ? "Pronto para usar o DS." : "Bloqueado: resolva os itens ✗ antes de migrar (docs/guias/migracao.md).");
  return l.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = doctor(process.argv[2] ?? ".");
  console.log(doctorFormat(r));
  process.exit(r.ok ? 0 : 1);
}
