#!/usr/bin/env node
// Regressão de layout do PageHeading em Chromium real. O teste monta os
// componentes e o CSS publicados, cria páginas cujo conteúdo excede a janela
// por poucos pixels e garante que compactar nunca altera a geometria do fluxo.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const dir = mkdtempSync(join(cache, "g4os-ds-page-heading-"));
const chromePaths = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = chromePaths.find((path) => existsSync(path));
if (!executablePath) {
  console.error("Chrome/Chromium não encontrado. Defina CHROME_PATH para rodar test:layout.");
  process.exit(2);
}

const fixture = `
  import React from "react";
  import { createRoot } from "react-dom/client";
  import { Page } from "./src/components/primitives";
  import { PageHeading, PageToolbar } from "./src/components/navigation";

  function Fixture() {
    return (
      <Page className="test-page" width="wide">
        <PageHeading
          title="Projetos"
          description="Organize o trabalho da empresa em um só lugar."
          actions={<button type="button" data-test-action="">Novo projeto</button>}
        />
        <PageToolbar><div>Filtros</div></PageToolbar>
        <div data-test-filler="" />
      </Page>
    );
  }

  createRoot(document.getElementById("root")).render(<Fixture />);

  const frames = async (count = 3) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  };
  window.runCase = async (excess, step) => {
    const page = document.querySelector(".test-page");
    const filler = document.querySelector("[data-test-filler]");
    await frames();
    filler.style.height = page.clientHeight + "px";
    await frames();
    const currentExcess = page.scrollHeight - page.clientHeight;
    filler.style.height = Math.max(0, page.clientHeight + excess - currentExcess) + "px";
    await frames();
    page.scrollTop = 0;
    await frames();

    const initialHeight = page.scrollHeight;
    const max = initialHeight - page.clientHeight;
    const states = [];
    const positions = [];
    let guard = 0;
    while (page.scrollTop < max && guard++ < 200) {
      const before = page.scrollTop;
      page.scrollTop = Math.min(max, before + step);
      page.dispatchEvent(new Event("scroll"));
      await frames();
      positions.push(page.scrollTop);
      states.push(document.querySelector(".sticky-page-header-overlay")?.hasAttribute("data-stuck") ?? false);
      if (page.scrollTop <= before) break;
    }

    const compact = document.querySelector(".sticky-page-header-overlay");
    const flowAction = document.querySelector(".sticky-page-header-flow [data-sticky-actions]");
    const transitions = states.reduce((count, state, index) => count + (index > 0 && state !== states[index - 1] ? 1 : 0), 0);
    const bottom = {
      compactInert: compact?.hasAttribute("inert") ?? true,
      flowActionInert: flowAction?.hasAttribute("inert") ?? false,
      scrollTop: page.scrollTop,
      stuck: compact?.hasAttribute("data-stuck") ?? false,
    };
    const upwardPositions = [];
    guard = 0;
    while (page.scrollTop > 0 && guard++ < 200) {
      const before = page.scrollTop;
      page.scrollTop = Math.max(0, before - step);
      page.dispatchEvent(new Event("scroll"));
      await frames();
      upwardPositions.push(page.scrollTop);
      if (page.scrollTop >= before) break;
    }
    return {
      bottom,
      compactInertAtTop: compact?.hasAttribute("inert") ?? true,
      excess,
      finalHeight: page.scrollHeight,
      clientHeight: page.clientHeight,
      flowActionInertAtTop: flowAction?.hasAttribute("inert") ?? false,
      h1Count: document.querySelectorAll("h1").length,
      max,
      positions,
      scrollTopAtTop: page.scrollTop,
      step,
      stuckAtTop: compact?.hasAttribute("data-stuck") ?? false,
      transitions,
      upwardPositions,
    };
  };
  window.showCompact = async () => {
    const page = document.querySelector(".test-page");
    const filler = document.querySelector("[data-test-filler]");
    filler.style.height = "700px";
    await frames();
    page.scrollTop = 180;
    page.dispatchEvent(new Event("scroll"));
    await frames();
  };
`;

let server;
let browser;
try {
  await build({
    stdin: { contents: fixture, resolveDir: root, loader: "tsx" },
    bundle: true,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    outfile: join(dir, "fixture.js"),
    logLevel: "error",
  });
  const cssInput = join(dir, "fixture.css");
  writeFileSync(cssInput, `@import "${join(root, "src/styles/index.css")}";\n@source "${join(root, "src")}";\n`);
  const tailwind = spawnSync(join(root, "node_modules/.bin/tailwindcss"), ["-i", cssInput, "-o", join(dir, "fixture.out.css")], {
    cwd: root,
    encoding: "utf8",
  });
  if (tailwind.status !== 0) throw new Error(tailwind.stderr || tailwind.stdout || "Falha ao compilar CSS");

  writeFileSync(join(dir, "index.html"), `<!doctype html>
    <html lang="pt-BR" class="ds-app" data-theme="light">
      <head><meta charset="utf-8"><link rel="stylesheet" href="/fixture.out.css"><style>
        html, body, #root { height: 100%; margin: 0; }
        #root { height: 420px; }
        .test-page { box-sizing: border-box; display: block; height: 420px !important; max-height: 420px; overflow-y: auto !important; }
        [data-test-filler] { flex: none; }
      </style></head>
      <body><div id="root"></div><script src="/fixture.js"></script></body>
    </html>`);

  const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript" };
  server = createServer((request, response) => {
    const name = new URL(request.url, "http://fixture").pathname === "/" ? "index.html" : new URL(request.url, "http://fixture").pathname.slice(1);
    const file = join(dir, name);
    if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) return response.writeHead(404).end();
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => typeof globalThis.runCase === "function");

  let passed = 0;
  const results = [];
  for (const excess of [20, 39, 300]) {
    for (const step of [5, 10, 30]) {
      await page.reload();
      await page.waitForFunction(() => typeof globalThis.runCase === "function");
      const result = await page.evaluate(({ excess, step }) => globalThis.runCase(excess, step), { excess, step });
      if (result.max !== excess) console.error("fixture fora do tamanho esperado", result);
      assert.equal(result.max, excess, `excesso ${excess}px deve produzir scroll máximo exato`);
      assert.equal(result.finalHeight, 420 + excess, `scrollHeight mudou no caso ${excess}px/${step}px`);
      assert.equal(result.bottom.scrollTop, result.max, `não alcançou o fim no caso ${excess}px/${step}px`);
      assert.ok(result.positions.every((position, index) => index === 0 || position > result.positions[index - 1]), `scroll não cresceu continuamente no caso ${excess}px/${step}px`);
      assert.ok(result.transitions <= 1, `compacto alternou ${result.transitions} vezes no caso ${excess}px/${step}px`);
      assert.equal(result.h1Count, 1, "o título semântico deve existir uma vez");
      assert.equal(result.scrollTopAtTop, 0, `não voltou ao topo no caso ${excess}px/${step}px`);
      assert.ok(result.upwardPositions.every((position, index) => index === 0 || position < result.upwardPositions[index - 1]), `scroll de volta não diminuiu continuamente no caso ${excess}px/${step}px`);
      assert.equal(result.finalHeight, 420 + excess, `scrollHeight mudou depois de voltar no caso ${excess}px/${step}px`);
      assert.equal(result.stuckAtTop, false, "compacto deve sumir ao voltar ao topo");
      assert.equal(result.compactInertAtTop, true, "compacto oculto deve ficar inerte");
      assert.equal(result.flowActionInertAtTop, false, "ações do cabeçalho completo devem voltar ao Tab");
      if (result.bottom.stuck) {
        assert.equal(result.bottom.compactInert, false, "cópia compacta visível não pode ficar inerte");
        assert.equal(result.bottom.flowActionInert, true, "ações fora da tela não podem continuar no Tab");
      }
      results.push(result);
      console.log(`  ✓ excesso ${excess}px · passo ${step}px · scroll ${result.bottom.scrollTop}px · ${result.transitions} alternância(s)`);
      passed++;
    }
  }
  console.log(`\n${passed} casos de layout ok`);

  const evidenceDir = process.env.EVIDENCE_DIR;
  if (evidenceDir) {
    mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(join(evidenceDir, "results.json"), `${JSON.stringify({ passed, cases: results }, null, 2)}\n`);
    for (const theme of ["light", "dark"]) {
      for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
        await page.setViewportSize({ width, height });
        await page.reload();
        await page.waitForFunction(() => typeof globalThis.showCompact === "function");
        await page.evaluate((value) => globalThis.document.documentElement.setAttribute("data-theme", value), theme);
        await page.evaluate(() => globalThis.showCompact());
        await page.screenshot({ path: join(evidenceDir, `${name}-${theme}-compact.png`), fullPage: true });
      }
    }
    console.log(`Capturas gravadas em ${evidenceDir}`);
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  rmSync(dir, { recursive: true, force: true });
}
