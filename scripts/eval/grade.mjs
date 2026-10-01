/* global document, window, getComputedStyle */
// Avaliador do eval: mede o que um revisor do DS mediria numa tela entregue por um agente.
// Usa SEMPRE as regras do repositório (scripts/cli.mjs), para comparar rodadas com a mesma régua.
//
// Pontos (100):
//   15 typecheck · 10 build · 10 render (sem erro de página, com título) · 5 sem estouro horizontal
//   em 390 px · 5 axe sem violações sérias · 10 visual (título e corpo no mesmo eixo, desabilitado
//   legível, checkbox com texto) · 15 auditoria strict (−2 por erro, −0,5 por aviso)
//   30 rubrica de padrões (itens aplicáveis à tarefa, peso igual)
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { ENGLISH_UI } from "../lint/rules.mjs";

const require = createRequire(import.meta.url);

function sh(cmd, args, o = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 << 20, timeout: 300_000, ...o });
}

function loadPlaywright(repo) {
  for (const p of [process.env.PLAYWRIGHT_PATH, join(repo, "node_modules", "playwright"), join(homedir(), "node_modules", "playwright")].filter(Boolean)) {
    try {
      return require(p);
    } catch {
      /* próximo */
    }
  }
  return null;
}

const CHROME = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p));

/* ------------------------------------------------------------------ */
/* Rubrica estática                                                    */
/* ------------------------------------------------------------------ */

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

export function rubric(src, app, task) {
  const e = task.expects ?? {};
  const code = strip(src);
  const items = [];
  const add = (id, ok, why) => items.push({ id, ok: !!ok, why });
  const texts = [...code.matchAll(/>\s*([^<>{}\n]{2,})\s*</g)].map((m) => m[1].trim()).concat([...code.matchAll(/\b(?:label|title|placeholder|description|hint)=["']([^"']+)["']/g)].map((m) => m[1].trim()));

  add("rota", app.includes(task.route.split("/")[1]), `rota ${task.route} registrada em App.tsx`);
  add("anatomia", /<Page\b/.test(code) && /<(PageHeading|ContextBar|EntityHeader|RecordHeader)\b/.test(code), "Page + PageHeading (ou cabeçalho de registro)");
  add("largura", !/["'`][^"'`]*\bmx-auto\b[^"'`]*\bmax-w-(?:\w+|\[)[^"'`]*["'`]|["'`][^"'`]*\bmax-w-(?:[2-7]xl|screen)[^"'`]*\bmx-auto\b/.test(code), "sem mx-auto max-w-* (Page width faz isso)");
  add("só-ds", [...code.matchAll(/from\s+["']([^"']+)["']/g)].every((m) => /^(@g4ai\/ds|react|react-dom|lucide-react|\.{1,2}\/)/.test(m[1])), "imports só de @g4ai/ds, react, lucide-react e locais");
  add("sem-controle-cru", !/<(select|input|textarea|table)\b/.test(code), "nenhum <select>/<input>/<textarea>/<table> cru");
  add("sem-wrapper-desabilitado", !/opacity-(?:[1-6]0)\b[^"'`]*["'`][^>]*>\s*(?:<span[^>]*pointer-events-none|[^<]*<(?:Button|OperationButton))|pointer-events-none[^"'`]*["'`][^>]*>\s*<(?:Button|OperationButton)/.test(code), "sem span opacity/pointer-events em volta de botão");
  add("rótulo-duplo", !/<FieldBlock\b[^>]*\blabel=[^>]*>\s*<(?:Select|Combobox|DatePicker|TextField|MultiSelect|NumberField|CurrencyField)\b[^>]*\blabel=/.test(code) || /hideLabel/.test(code), "FieldBlock + campo com label (rótulo duplo)");
  add("pt-BR", !texts.some((t) => ENGLISH_UI.test(t)), "texto da interface em pt-BR");
  add("escrita", !/com sucesso|!\s*["'`<]/.test(code), 'sem "com sucesso" nem exclamação');
  add("sem-hex", !/#[0-9a-fA-F]{3,8}\b/.test(code.replace(/href=["']#[^"']*["']/g, "")), "sem cor fixa");
  if (e.list || e.async || e.migration) add("carregando", /<(Skeleton|LoadingState|SkeletonTable|TableSkeleton)\b|loading=\{/.test(code), "estado carregando com Skeleton");
  if (e.list || e.async || e.migration) add("vazio", /<(Empty|StateView)\b|empty=\{/.test(code), "estado vazio com Empty");
  if (e.async) add("erro", /<(Empty|StateView|OperationFeedback|Callout|InlineMessage|AlertCard)\b[^>]*(erro|error|tone=["'](rose|danger|bad)|Tentar)/is.test(code) || /StateView[\s\S]{0,200}error/i.test(code), "estado de erro com saída");
  if (e.currency) add("moeda", /formatCurrency\(/.test(code) && !/toFixed\(|["'`]R\$/.test(code), "dinheiro por formatCurrency");
  if (e.list) add("lista", /<(DataTable|DataGrid)\b/.test(code), "DataTable/DataGrid");
  if (e.list) add("toolbar", /<(TableToolbar|FilterBar|PageToolbar|FacetFilter)\b/.test(code), "TableToolbar/FilterBar para busca e filtros");
  if (e.bulk) add("massa", /<BulkBar\b|selectionColumn|useSelection|selectable/.test(code), "seleção + BulkBar");
  if (e.migration) add("confirmação", /<ConfirmDialog\b/.test(code) && !/\bconfirm\(|\balert\(/.test(code), "ConfirmDialog no lugar de confirm()");
  if (e.migration || e.form) add("toast", /\bnotify\(/.test(code), "notify depois da ação");
  if (e.record) add("registro", (/<(ContextBar|EntityHeader)\b/.test(code) || /<PageHeading\b[^>]*\bcrumbs=/.test(code)) && /<(SplitLayout|PropertyList)\b/.test(code), "cabeçalho de registro (crumbs/ContextBar) + SplitLayout/PropertyList");
  if (e.record) add("abas", /<Tabs\b/.test(code), "Tabs");
  if (e.record) add("drawer", /<Drawer\b/.test(code), "editar em Drawer");
  if (e.form) add("multi", /<(MultiSelect|CheckboxGroup)\b|<Combobox\b[^>]*\bmultiple\b/.test(code), "MultiSelect/CheckboxGroup para vários cargos");
  if (e.form) add("data", /<DatePicker\b/.test(code), "DatePicker");
  if (e.form) add("horário", /<(TimePicker|TimeField)\b/.test(code), "TimePicker");
  if (e.form) add("dias", /<(ToggleGroup|CheckboxGroup|WeekdayPicker)\b/.test(code), "dias da semana com ToggleGroup/CheckboxGroup");
  if (e.disabledReason) add("motivo", /disabledReason=/.test(code), "disabledReason nos controles bloqueados");
  if (e.runs) add("execuções", /<(DataTable|Table|ListPanel|Timeline)\b/.test(code) && /format(Date|Relative|DateTime)\w*\(/.test(code) && !/toLocale\w*String\(/.test(code), "execuções em DataTable/Table com formatDate/formatRelative");
  if (e.runs) add("fuso", /<(Select|NativeSelect|SegmentedControl|Combobox|RadioGroup)\b/.test(code), "fuso com Select/NativeSelect");
  if (e.dashboard) add("kpi", /<KpiCard\b/.test(code) && /goodWhen=["']down["']/.test(code), "KpiCard com goodWhen=down em despesa/inadimplência");
  if (e.dashboard) add("gráfico", /<(AreaChart|LineChart|BarChart|ComboChart|WaterfallChart)\b[^>]*\blabel=/.test(code), "gráfico do DS com label");
  if (e.dashboard) add("título-pergunta", /<ChartCard\b[^>]*title=["'][^"']*\?["']/.test(code), "título de gráfico em forma de pergunta");
  return items;
}

/* ------------------------------------------------------------------ */

function waitPort(port, ms = 20_000) {
  const until = Date.now() + ms;
  return new Promise((res) => {
    const tick = async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/`);
        if (r.ok) return res(true);
      } catch {
        /* ainda não */
      }
      if (Date.now() > until) return res(false);
      setTimeout(tick, 300);
    };
    tick();
  });
}

let portSeq = 4610;

async function render(ws, task, repo) {
  const pw = loadPlaywright(repo);
  if (!pw) return { skipped: "playwright indisponível" };
  const port = portSeq++;
  const vite = join(ws, "node_modules", "vite", "bin", "vite.js");
  const srv = spawn(process.execPath, [vite, "preview", "--outDir", ".eval-dist", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd: ws, stdio: "ignore" });
  try {
    if (!(await waitPort(port))) return { error: "preview não subiu" };
    const browser = await pw.chromium.launch({ headless: true, ...(CHROME ? { executablePath: CHROME } : {}) });
    const out = { shots: [] };
    try {
      const axePath = [join(repo, "node_modules", "axe-core", "axe.min.js")].find(existsSync);
      for (const [w, h, theme] of [
        [1440, 900, "light"],
        [390, 844, "dark"],
      ]) {
        const page = await browser.newPage({ viewport: { width: w, height: h } });
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 300)));
        page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 300)));
        await page.addInitScript((t) => localStorage.setItem("ds-theme", t), theme);
        await page.goto(`http://127.0.0.1:${port}${task.route}`);
        await page.waitForTimeout(2200);
        await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
        await page.waitForTimeout(200);
        const info = await page.evaluate(() => {
          const vw = window.innerWidth;
          const clipped = (el) => {
            for (let p = el.parentElement; p; p = p.parentElement) {
              const s = getComputedStyle(p);
              if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return p.getBoundingClientRect().right <= vw + 1;
            }
            return false;
          };
          let overflow = 0;
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.width && r.right > vw + 1 && !clipped(el)) overflow++;
          }
          const h1El = document.querySelector("h1");
          const h1 = h1El?.textContent?.trim() ?? "";
          // título e corpo no mesmo eixo: 1º bloco visível (borda ou fundo, ≥ 320 px) abaixo do título
          let misaligned = 0;
          if (h1El) {
            const hr = h1El.getBoundingClientRect();
            for (const el of document.querySelectorAll("main *, [data-page] *, body *")) {
              const r = el.getBoundingClientRect();
              if (r.top < hr.bottom + 8 || r.width < 320 || r.top > window.innerHeight) continue;
              const cs = getComputedStyle(el);
              const boxed = parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent");
              if (!boxed) continue;
              misaligned = Math.round(Math.abs(r.left - hr.left));
              break;
            }
          }
          // botão desabilitado apagado por opacidade acumulada (wrapper + estilo do botão)
          let faded = 0;
          for (const b of document.querySelectorAll("button:disabled, button[aria-disabled=true]")) {
            let o = 1;
            for (let p = b; p; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity);
            if (o < 0.45 && b.getBoundingClientRect().width > 0) faded++;
          }
          // checkbox fora de tabela sem texto visível ao lado
          let bareChecks = 0;
          for (const c of document.querySelectorAll("[role=checkbox], input[type=checkbox]")) {
            if (c.closest("table, [role=grid], [role=row], [role=table]") || !c.getBoundingClientRect().width) continue;
            const holder = c.closest("label") ?? c.parentElement?.parentElement;
            if (!(holder?.innerText ?? "").trim()) bareChecks++;
          }
          return { overflow, h1, text: document.body.innerText.length, misaligned, faded, bareChecks };
        });
        let axe = null;
        if (axePath) {
          await page.addScriptTag({ path: axePath });
          axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"], resultTypes: ["violations"] });
            return r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => ({ id: v.id, n: v.nodes.length }));
          });
        }
        const shot = join(ws, `.eval-${w}-${theme}.png`);
        await page.screenshot({ path: shot });
        out.shots.push(shot);
        out[`${w}`] = { errors, ...info, axe };
        await page.close();
      }
    } finally {
      await browser.close();
    }
    return out;
  } finally {
    srv.kill();
  }
}

export async function grade(ws, task, { repo }) {
  const g = { checks: {}, rubric: [] };
  const node = process.execPath;

  const tsc = sh(node, [join(ws, "node_modules", "typescript", "bin", "tsc"), "--noEmit", "-p", ws], { cwd: ws });
  const tscErrors = (tsc.stdout.match(/error TS\d+/g) ?? []).length;
  g.checks.typecheck = { ok: tsc.status === 0, errors: tscErrors, sample: tsc.stdout.split("\n").filter((l) => /error TS/.test(l)).slice(0, 5) };

  const audit = sh(node, [join(repo, "scripts", "cli.mjs"), "audit", "src", "--preset", "strict", "--format", "json"], { cwd: ws });
  let errors = 0;
  let warnings = 0;
  const byRule = {};
  try {
    const j = JSON.parse(audit.stdout);
    for (const f of j.findings ?? []) {
      if (/^src\/legacy\//.test(f.file)) continue; // a tela legada da tarefa de migração não conta
      if (f.severity === "error") errors++;
      else if (f.severity === "warn") warnings++;
      else continue;
      byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
    }
  } catch {
    g.checks.auditRaw = (audit.stdout + audit.stderr).slice(0, 800);
  }
  g.checks.audit = { errors, warnings, byRule };

  const build = sh(node, [join(ws, "node_modules", "vite", "bin", "vite.js"), "build", "--outDir", ".eval-dist", "--logLevel", "error", "--emptyOutDir"], { cwd: ws });
  g.checks.build = { ok: build.status === 0, sample: build.status === 0 ? "" : (build.stderr + build.stdout).slice(0, 800) };

  g.checks.render = g.checks.build.ok ? await render(ws, task, repo) : { skipped: "build falhou" };

  const file = join(ws, task.file);
  const src = existsSync(file) ? readFileSync(file, "utf8") : "";
  const app = existsSync(join(ws, "src", "App.tsx")) ? readFileSync(join(ws, "src", "App.tsx"), "utf8") : "";
  g.checks.file = { exists: !!src, lines: src.split("\n").length, extra: readdirSync(join(ws, "src", "pages")).length };
  g.rubric = src ? rubric(src, app, task) : [];

  // pontuação
  let score = 0;
  score += g.checks.typecheck.ok ? 15 : Math.max(0, 10 - tscErrors * 2);
  score += g.checks.build.ok ? 10 : 0;
  const r = g.checks.render;
  const desk = r?.["1440"];
  const mob = r?.["390"];
  if (desk && mob) {
    score += !desk.errors.length && !mob.errors.length && desk.h1 ? 10 : desk.h1 ? 5 : 0;
    score += mob.overflow === 0 ? 5 : mob.overflow < 4 ? 2 : 0;
    const axeN = [...(desk.axe ?? []), ...(mob.axe ?? [])].reduce((s, v) => s + v.n, 0);
    score += axeN === 0 ? 5 : axeN <= 3 ? 2 : 0;
    // visual (10): eixo título/corpo, desabilitado legível, checkbox com texto
    g.visual = { misaligned: desk.misaligned, faded: desk.faded + mob.faded, bareChecks: desk.bareChecks };
    score += desk.misaligned <= 24 ? 4 : 0;
    score += g.visual.faded === 0 ? 3 : 0;
    score += desk.bareChecks === 0 ? 3 : 0;
  }
  score += src ? Math.max(0, 15 - errors * 2 - warnings * 0.5) : 0;
  const passed = g.rubric.filter((i) => i.ok).length;
  score += g.rubric.length ? (30 * passed) / g.rubric.length : 0;
  g.score = Math.round(score);
  return g;
}
