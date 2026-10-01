#!/usr/bin/env node
// Varredura visual e de acessibilidade do showcase: visita toda página de
// documentação (#/p/<slug>) e todo bloco (#/frame/<slug>) em 1440 e 390 px,
// tema claro e escuro, e procura problemas da classe que só aparece no uso real:
//
//   overflow     rolagem horizontal da página
//   clipped      elemento cortado por um ancestral com overflow oculto
//                (o bug do rodapé da Sidebar)
//   axe          axe-core WCAG 2.1 AA: contraste < 4,5, nome acessível, rótulo…
//   console      erros de console e exceções não tratadas
//   popup        menu/listbox/diálogo aberto fora da viewport
//   tap          alvo de toque < 24 px no celular (WCAG 2.5.8), sem contar
//                links dentro de texto
//   focus        elemento focado por Tab sem nenhum indicador visível
//
// Exemplos "Evite" propositalmente errados: marque o contêiner com
// data-qa-ignore e a varredura não os conta.
//
// Uso:
//   npm run showcase:build && npm run qa:sweep
//   npm run qa:sweep -- --only pages|blocks --filter crm --viewport 390 --theme dark
//   npm run qa:sweep -- --checks overflow,clipped,axe --concurrency 6 --out qa-report
//   npm run qa:sweep -- --brand oceano --checks axe   (marca/preset de themes.css)
//
// Requisitos: playwright (npx playwright install chromium, ou PLAYWRIGHT_PATH
// apontando para o pacote) e um Chrome/Chromium. Não entra no `npm run check`
// (leva minutos); rode antes de um PR que mexe em componente compartilhado.
// Sai com código 1 quando há achados, 0 sem achados.
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const dist = join(root, "showcase/dist");
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const ALL_CHECKS = ["overflow", "clipped", "axe", "console", "popup", "tap", "focus"];
const checks = new Set((opt("checks", ALL_CHECKS.join(","))).split(","));
const only = opt("only", "all");
const filter = opt("filter", "");
const viewports = opt("viewport", "1440,390").split(",").map(Number);
const themes = opt("theme", "light,dark").split(",");
const brand = opt("brand", "");
const concurrency = Number(opt("concurrency", "6"));
const outDir = join(root, opt("out", "qa-report"));
const verbose = args.includes("--verbose");

if (!existsSync(join(dist, "index.html"))) {
  console.error("showcase/dist não existe. Rode `npm run showcase:build` antes.");
  process.exit(2);
}

function loadPlaywright() {
  const candidates = [process.env.PLAYWRIGHT_PATH, "playwright", "playwright-core", join(process.env.HOME ?? "", "node_modules/playwright")].filter(Boolean);
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* próxima */
    }
  }
  console.error("playwright não encontrado. Instale (npm i -D playwright) ou defina PLAYWRIGHT_PATH.");
  process.exit(2);
}
const { chromium } = loadPlaywright();
const chromePaths = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
const executablePath = chromePaths.find((p) => existsSync(p));
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/* ------------------------------------------------------------ servidor */
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".md": "text/markdown", ".svg": "image/svg+xml", ".png": "image/png" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

/* ------------------------------------------------------------ alvos */
const slugs = (dir) => readdirSync(dir).filter((f) => f.endsWith(".tsx") && !f.startsWith("_")).map((f) => f.replace(".tsx", "")).sort();
const targets = [];
if (only !== "blocks") for (const s of slugs(join(root, "showcase/pages"))) targets.push({ kind: "page", slug: s, hash: `#/p/${s}` });
if (only !== "pages") for (const s of slugs(join(root, "src/blocks"))) targets.push({ kind: "block", slug: s, hash: `#/frame/${s}` });
const jobs = [];
for (const t of targets.filter((t) => !filter || t.slug.includes(filter)))
  for (const vw of viewports) for (const theme of themes) jobs.push({ ...t, vw, theme });

/* ------------------------------------------------------------ verificações no navegador */
// Roda dentro da página. Devolve achados de layout (overflow, clipped, tap).
function layoutProbe({ doTap, mobile }) {
  const out = { overflow: null, clipped: [], tap: [] };
  const vw = window.innerWidth;
  const se = document.scrollingElement;
  if (se.scrollWidth > vw + 1) {
    // quem estoura?
    const culprits = [];
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== "fixed") {
        const p = el.parentElement?.getBoundingClientRect();
        if (!p || p.right <= vw + 1) culprits.push(describe(el));
      }
      if (culprits.length > 3) break;
    }
    // Causa comum: .sr-only/absolute dentro de um rolador sem `position: relative`
    // (o containing block vira o documento e escapa do corte).
    for (const el of document.body.querySelectorAll(".sr-only, [class*='absolute']")) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && culprits.length < 6) culprits.push("posicionado fora do rolador: " + describe(el));
    }
    out.overflow = { scrollWidth: se.scrollWidth, culprits };
  }
  const visible = (el, r) => {
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) return false;
    if (el.closest("[aria-hidden='true'],[inert],.sr-only,[data-qa-ignore]")) return false;
    return true;
  };
  const interactive = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], [role=checkbox], [role=switch], [role=radio], [role=option], [role=combobox], [tabindex]:not([tabindex='-1']), label";
  const targets = mobile && doTap ? [...document.body.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=checkbox], [role=switch], [role=radio]")].map((el) => ({ el, r: el.getBoundingClientRect() })).filter((t) => t.r.width > 0) : [];
  const textLeaf = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
  for (const el of document.body.querySelectorAll("*")) {
    if (!(el.matches(interactive) || textLeaf(el))) continue;
    const r = el.getBoundingClientRect();
    if (!visible(el, r)) continue;
    // clipped: um ancestral que corta (overflow hidden/clip, ou auto/scroll sem rolagem nesse eixo)
    // Elemento (ou ancestral) fixo escapa do overflow dos ancestrais: para a subida ali.
    let a = getComputedStyle(el).position === "fixed" ? null : el.parentElement;
    while (a && a !== document.body) {
      const cs = getComputedStyle(a);
      if (cs.position === "fixed") break;
      // Ancestral que rola na horizontal: o conteúdo é alcançável pela rolagem.
      if (/auto|scroll/.test(cs.overflowX) && a.scrollWidth > a.clientWidth + 1) break;
      const clipsX = /hidden|clip/.test(cs.overflowX) || (/auto|scroll/.test(cs.overflowX) && a.scrollWidth <= a.clientWidth + 1);
      if (clipsX) {
        const ar = a.getBoundingClientRect();
        // Texto truncado por design (truncate/line-clamp) não conta.
        const ecs = getComputedStyle(el);
        const intentional = ecs.textOverflow === "ellipsis" || ecs.webkitLineClamp !== "none" || el.closest("[data-qa-clip],[data-carousel],[aria-roledescription='carousel'],[class*='marquee'],[class*='snap-x']");
        const over = Math.max(ar.left - r.left, r.right - ar.right);
        if (over > 2 && !intentional && ar.width > 0 && r.width < ar.width * 3 && a.scrollWidth <= a.clientWidth + 1) {
          out.clipped.push({ el: describe(el), by: describe(a), px: Math.round(over) });
        }
        break;
      }
      a = a.parentElement;
    }
    if (doTap && mobile && el.matches(interactive) && el.tagName !== "LABEL") {
      // Exceção de link em texto corrido (WCAG 2.5.8): <a> inline cujo bloco tem outro texto além dele.
      const inlineText = el.tagName === "A" && getComputedStyle(el).display === "inline" && (() => {
        let blk = el.parentElement;
        while (blk && getComputedStyle(blk).display === "inline") blk = blk.parentElement;
        if (!blk) return false;
        const own = (el.textContent ?? "").trim().length;
        const all = (blk.textContent ?? "").trim().length;
        return all - own > 3;
      })();
      const inLabel = el.closest("label");
      let target = inLabel ? inLabel.getBoundingClientRect() : r;
      // Área de toque ampliada por pseudo-elemento (.ds-hit, link esticado do card).
      for (const pseudo of ["::before", "::after"]) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content === "none" || ps.position !== "absolute") continue;
        const px = (v) => (v.endsWith("px") ? parseFloat(v) : 0);
        let box = { left: r.left + px(ps.left), right: r.right - px(ps.right), top: r.top + px(ps.top), bottom: r.bottom - px(ps.bottom) };
        // inset:0 relativo a um ancestral posicionado (link esticado): usa o ancestral
        if (getComputedStyle(el).position === "static") {
          let a = el.parentElement;
          while (a && getComputedStyle(a).position === "static") a = a.parentElement;
          if (a) box = a.getBoundingClientRect();
        }
        const w = box.right - box.left;
        const h = box.bottom - box.top;
        if (w >= target.width && h >= target.height) target = { width: w, height: h };
      }
      // Exceção de espaçamento (WCAG 2.5.8): alvo ≥ 16 px cujo círculo de 24 px não encosta em outro alvo.
      const spaced = () => {
        if (Math.min(target.width, target.height) < 16) return false;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return !targets.some((o) => o.el !== el && !o.el.contains(el) && !el.contains(o.el) && o.r.left < cx + 12 && o.r.right > cx - 12 && o.r.top < cy + 12 && o.r.bottom > cy - 12);
      };
      if (!inlineText && (target.width < 24 || target.height < 24) && !spaced() && !el.closest("[role=grid] [role=gridcell] button")) {
        out.tap.push({ el: describe(el), size: `${Math.round(target.width)}x${Math.round(target.height)}` });
      }
    }
  }
  return out;
  function describe(el) {
    const cls = (typeof el.className === "string" ? el.className : el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).slice(0, 6).join(".");
    const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""}${text ? ` "${text}"` : ""}`;
  }
}

function focusSnapshot() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40),
    cls: (typeof el.className === "string" ? el.className : "").split(/\s+/).slice(0, 6).join("."),
    visible: r.width > 0 && r.height > 0,
    style: [cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" ? `outline:${cs.outlineStyle}:${cs.outlineColor}:${cs.outlineWidth}` : "", cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine].join("|"),
    // anel desenhado por um wrapper (focus-within) ou pseudo-elemento
    ring: (() => {
      let a = el.parentElement;
      for (let i = 0; a && i < 3; i++, a = a.parentElement) {
        const s = getComputedStyle(a);
        if ((s.outlineStyle !== "none" && s.outlineWidth !== "0px") || s.boxShadow !== "none") return true;
      }
      const after = getComputedStyle(el, "::after");
      const before = getComputedStyle(el, "::before");
      return [after, before].some((p) => p.content !== "none" && ((p.outlineStyle !== "none" && p.outlineWidth !== "0px") || p.boxShadow !== "none"));
    })(),
  };
}

/* ------------------------------------------------------------ execução */
const browser = await chromium.launch({ headless: true, executablePath });
const findings = [];
const add = (job, check, detail) => findings.push({ check, kind: job.kind, slug: job.slug, vw: job.vw, theme: job.theme, ...detail });

async function runJob(job) {
  const ctx = await browser.newContext({ viewport: { width: job.vw, height: job.vw < 600 ? 844 : 900 }, reducedMotion: "reduce", hasTouch: job.vw < 600 });
  await ctx.addInitScript(`try{localStorage.setItem("ds-theme","${job.theme}");${brand ? `localStorage.setItem("ds-brand","${brand}")` : ""}}catch(e){}`);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200));
  });
  try {
    await page.goto(`${base}${job.hash}?theme=${job.theme}${brand ? `&brand=${brand}` : ""}`, { waitUntil: "load" });
    await page.waitForTimeout(job.kind === "block" ? 700 : 500);
    const frameEl = job.kind === "page" ? page : page;
    if (checks.has("overflow") || checks.has("clipped") || checks.has("tap")) {
      const r = await frameEl.evaluate(layoutProbe, { doTap: checks.has("tap"), mobile: job.vw < 600 });
      if (checks.has("overflow") && r.overflow) add(job, "overflow", { detail: `scrollWidth ${r.overflow.scrollWidth}`, el: r.overflow.culprits.join(" | ") });
      if (checks.has("clipped")) for (const c of r.clipped) add(job, "clipped", { el: c.el, detail: `cortado ${c.px}px por ${c.by}` });
      if (checks.has("tap")) for (const t of r.tap) add(job, "tap", { el: t.el, detail: t.size });
    }
    if (checks.has("axe")) {
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () => {
        // [data-qa-ignore]: exemplos "Evite" de propósito errados na documentação.
        const r = await axe.run({ exclude: [["[data-qa-ignore]"]] }, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
          resultTypes: ["violations"],
        });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 8).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 160), summary: n.failureSummary?.split("\n").slice(1, 2).join(" ").slice(0, 160) })) }));
      });
      for (const v of res) for (const n of v.nodes) add(job, "axe", { rule: v.id, impact: v.impact, el: n.html, detail: n.summary });
    }
    if (checks.has("focus")) {
      await page.mouse.click(1, 1).catch(() => {});
      const seen = new Set();
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press("Tab");
        const s = await page.evaluate(focusSnapshot);
        if (!s || !s.visible) continue;
        const key = s.tag + s.name + s.cls;
        if (seen.has(key)) break;
        seen.add(key);
        // compara com o mesmo elemento sem foco
        const unfocused = await page.evaluate(() => {
          const el = document.activeElement;
          el.blur();
          const cs = getComputedStyle(el);
          const v = [cs.outlineStyle !== "none" && cs.outlineWidth !== "0px" ? `outline:${cs.outlineStyle}:${cs.outlineColor}:${cs.outlineWidth}` : "", cs.boxShadow, cs.borderColor, cs.backgroundColor, cs.textDecorationLine].join("|");
          el.focus({ focusVisible: true });
          return v;
        });
        if (s.style === unfocused && !s.ring) add(job, "focus", { el: `${s.tag}.${s.cls} "${s.name}"`, detail: "foco sem indicador visível" });
      }
    }
    if (checks.has("popup")) {
      const triggers = await page.$$("[aria-haspopup]:not([disabled]):not([aria-disabled=true])");
      for (const t of triggers.slice(0, 3)) {
        try {
          if (!(await t.isVisible())) continue;
          await t.scrollIntoViewIfNeeded({ timeout: 800 });
          const before = await page.evaluate(() => {
            window.__qaPops = new Set(document.querySelectorAll("[role=menu],[role=listbox],[role=dialog],[data-side]"));
          });
          void before;
          await t.click({ timeout: 800 });
          await page.waitForTimeout(250);
          const bad = await page.evaluate(() => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const pops = [...document.querySelectorAll("[role=menu],[role=listbox],[role=dialog],[data-side]")].filter((p) => !window.__qaPops?.has(p) && p.getBoundingClientRect().width > 0);
            return pops
              .map((p) => {
                const r = p.getBoundingClientRect();
                const out = Math.max(-r.left, r.right - vw, -r.top, r.bottom - vh);
                return out > 2 ? { role: p.getAttribute("role") ?? "popup", out: Math.round(out), rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}` } : null;
              })
              .filter(Boolean);
          });
          const name = ((await t.getAttribute("aria-label")) || (await t.innerText()).trim()).slice(0, 40);
          for (const b of bad) add(job, "popup", { el: `gatilho "${name}"`, detail: `${b.role} ${b.out}px fora da tela (${b.rect})` });
          await page.keyboard.press("Escape");
          await page.waitForTimeout(120);
        } catch {
          /* gatilho não clicável: segue */
        }
      }
    }
    if (checks.has("console")) for (const e of [...new Set(errors)]) add(job, "console", { detail: e });
  } catch (e) {
    add(job, "console", { detail: `falha ao carregar: ${String(e.message).slice(0, 160)}` });
  } finally {
    await ctx.close();
  }
}

const started = Date.now();
let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const job = queue.shift();
      await runJob(job);
      done++;
      if (verbose || done % 40 === 0) process.stderr.write(`  ${done}/${jobs.length}\n`);
    }
  }),
);
await browser.close();
server.close();

/* ------------------------------------------------------------ relatório */
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "sweep.json"), JSON.stringify(findings, null, 2));
const byCheck = Object.fromEntries(ALL_CHECKS.filter((c) => checks.has(c)).map((c) => [c, findings.filter((f) => f.check === c)]));
// Agrupa por "assinatura" (regra + elemento) para chegar à causa raiz, não à ocorrência.
const sig = (f) => `${f.check}${f.rule ? ":" + f.rule : ""} ${String(f.el ?? f.detail).replace(/"[^"]*"/g, '"…"').slice(0, 120)}`;
const groups = new Map();
for (const f of findings) {
  const k = sig(f);
  const g = groups.get(k) ?? { key: k, count: 0, where: new Set(), sample: f };
  g.count++;
  g.where.add(`${f.slug}@${f.vw}/${f.theme}`);
  groups.set(k, g);
}
const md = [
  `# Varredura do showcase`,
  ``,
  `${jobs.length} combinações (páginas/blocos × ${viewports.join(", ")} px × ${themes.join(", ")}) em ${Math.round((Date.now() - started) / 1000)} s.`,
  ``,
  `| Verificação | Achados | Assinaturas |`,
  `| --- | ---: | ---: |`,
  ...Object.entries(byCheck).map(([c, l]) => `| ${c} | ${l.length} | ${new Set(l.map(sig)).size} |`),
  ``,
  `## Assinaturas (mais frequentes primeiro)`,
  ``,
  ...[...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 200)
    .map((g) => `- **${g.count}×** \`${g.key}\` — ${g.sample.detail ?? ""}  \n  em ${[...g.where].slice(0, 6).join(", ")}${g.where.size > 6 ? ` +${g.where.size - 6}` : ""}`),
];
writeFileSync(join(outDir, "sweep.md"), md.join("\n") + "\n");
console.log(md.slice(0, 6 + Object.keys(byCheck).length).join("\n"));
console.log(`\nRelatório: ${join(outDir, "sweep.md")} (detalhes em sweep.json)`);
process.exit(findings.length ? 1 : 0);
