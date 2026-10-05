#!/usr/bin/env node
// Testes de contrato de componentes: render no servidor (renderToStaticMarkup)
// e asserções sobre a marcação. Cobre o que a varredura de render do
// test:react não verifica (qual classe/texto/estado cada prop produz).
//   npm run test:components
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Dentro de node_modules para o bundle resolver react/lucide do próprio repositório.
const cache = join(root, "node_modules", ".cache");
mkdirSync(cache, { recursive: true });
const dir = mkdtempSync(join(cache, "g4os-ds-components-"));
const out = join(dir, "bundle.mjs");
let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${String(e.stack ?? e).split("\n").slice(0, 4).join("\n    ")}`);
  }
}

try {
  await build({
    stdin: {
      contents: `export { ApprovalRequest, approvalRequestLabels } from "./src/components/ai-workspace";`,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    outfile: out,
    external: ["react", "react-dom", "@base-ui/react", "lucide-react"],
    logLevel: "error",
  });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "module" }));
  const { ApprovalRequest } = await import(pathToFileURL(out).href);
  const { createElement: h } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const render = (props, ...children) => renderToStaticMarkup(h(ApprovalRequest, { title: "Enviar lembrete", ...props }, ...children));
  /** Classes do elemento raiz (section). */
  const rootClass = (html) => html.match(/^<section[^>]*class="([^"]*)"/)[1];
  /** Classes do ícone (primeiro span com place-items-center). */
  const tileClass = (html) => html.match(/<span[^>]*class="([^"]*place-items-center[^"]*)"/)[1];

  console.log("ApprovalRequest");

  test("sem tone, o risk define o tom: low = info, medium = warn, high = bad", () => {
    assert.match(rootClass(render({ risk: "low" })), /border-info\/30/);
    assert.match(tileClass(render({ risk: "low" })), /bg-info-soft text-info/);
    assert.match(rootClass(render({})), /border-amber\/40/);
    assert.match(tileClass(render({ risk: "medium" })), /bg-amber-soft text-amber/);
    assert.match(rootClass(render({ risk: "high" })), /border-rose\/35/);
    assert.match(tileClass(render({ risk: "high" })), /bg-rose-soft text-rose/);
  });

  test("tone sobrepõe o risk", () => {
    const html = render({ risk: "high", tone: "neutral" });
    assert.match(rootClass(html), /border-line/);
    assert.doesNotMatch(rootClass(html), /border-rose/);
    assert.match(tileClass(html), /bg-soft text-muted/);
    assert.match(tileClass(render({ risk: "low", tone: "bad" })), /bg-rose-soft/);
  });

  test("eyebrow e icon substituem a sobrelinha e o ícone do pendente", () => {
    const html = render({ eyebrow: "Comando no terminal", icon: h("svg", { "data-testid": "custom" }) });
    assert.match(html, />Comando no terminal</);
    assert.doesNotMatch(html, /Precisa da sua aprovação/);
    assert.match(html, /data-testid="custom"/);
  });

  test("children entra entre o preview e o rodapé", () => {
    const html = render({ preview: h("p", null, "PREVIEW") }, h("p", null, "CORPO"));
    const p = html.indexOf("PREVIEW");
    const c = html.indexOf("CORPO");
    const f = html.indexOf("<footer");
    assert.ok(p > -1 && c > p && f > c, "ordem preview → corpo → rodapé");
  });

  test("actions substitui os botões padrão", () => {
    const html = render({ onReject: () => {}, actions: h("button", { type: "button" }, "Rodar") });
    assert.match(html, />Rodar</);
    assert.doesNotMatch(html, /Aprovar|Recusar/);
  });

  test("sem actions, mantém os botões padrão", () => {
    const html = render({ onApproveAlways: () => {}, onEdit: () => {}, onReject: () => {} });
    for (const t of ["Aprovar", "Sempre aprovar este tipo", "Editar", "Recusar"]) assert.match(html, new RegExp(`>${t}<|> ${t}<`));
  });

  test("expired e superseded: sem botões, ícone neutro, rótulos padrão e traduzíveis", () => {
    for (const [state, label] of [["expired", "Expirado"], ["superseded", "Substituído"]]) {
      const html = render({ state, risk: "high" });
      assert.match(html, new RegExp(`>${label}<`));
      assert.doesNotMatch(html, /<footer/);
      assert.match(rootClass(html), /border-line/);
      assert.match(tileClass(html), /bg-soft text-muted/);
      assert.match(html, new RegExp(`data-state="${state}"`));
    }
    assert.match(render({ state: "expired", labels: { expired: "Expired" } }), />Expired</);
    assert.match(render({ state: "superseded", labels: { superseded: "Superseded" } }), />Superseded</);
  });

  test("estado decidido mostra o rótulo do estado, não o eyebrow", () => {
    const html = render({ state: "approved", eyebrow: "Comando no terminal" });
    assert.match(html, />Aprovado</);
    assert.doesNotMatch(html, /Comando no terminal/);
    assert.match(tileClass(html), /bg-ok-soft text-ok/);
  });

  test("compact: decidido vira uma linha com ícone, estado, título e impacto", () => {
    const html = render({ state: "rejected", compact: true, impact: "42 clientes", preview: h("p", null, "PREVIEW"), description: "DESC" }, h("p", null, "CORPO"));
    assert.match(html, /^<section[^>]*aria-label="Aprovação: Enviar lembrete"/);
    assert.match(html, />Recusado</);
    assert.match(html, />Enviar lembrete</);
    assert.match(html, />42 clientes</);
    assert.doesNotMatch(html, /PREVIEW|DESC|CORPO|<footer|<header/);
  });

  test("compact é ignorado enquanto pende", () => {
    const html = render({ compact: true, onReject: () => {} });
    assert.match(html, /<footer/);
    assert.match(html, /Precisa da sua aprovação/);
  });

  test("labels parciais continuam funcionando (compatível com 0.7)", () => {
    const html = render({ labels: { approve: "Approve", ariaLabel: (t) => `Approval: ${t}` } });
    assert.match(html, /aria-label="Approval: Enviar lembrete"/);
    assert.match(html, /> Approve</);
    assert.match(html, /Precisa da sua aprovação/);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} ok, ${failures.length} falha(s)`);
if (failures.length) process.exit(1);
