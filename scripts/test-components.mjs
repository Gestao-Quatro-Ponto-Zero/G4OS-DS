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
      contents: `export { ApprovalRequest, approvalRequestLabels } from "./src/components/ai-workspace"; export { PageHeading } from "./src/components/navigation"; export { Combobox } from "./src/components/forms"; export { Tabs, Breadcrumb } from "./src/components/navigation"; export { ListRow, RowList } from "./src/components/collections"; export { AgentOrb, getAgentOrbDesign } from "./src/components/agent-orb"; export { CodeBlock, DiffView } from "./src/components/code"; export { Menu } from "./src/components/overlays-extra"; export { formatDate, formatRelative } from "./src/lib/format"; export { readFileSync } from "node:fs";`,
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
  const mod = await import(pathToFileURL(out).href);
  const { ApprovalRequest, PageHeading, Combobox } = mod;
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

  console.log("Combobox");

  test("icon da opção aparece ao lado do valor escolhido", () => {
    const options = [
      { value: "gmail", label: "Gmail", icon: h("svg", { "data-testid": "gmail-logo" }) },
      { value: "slack", label: "Slack", icon: h("svg", { "data-testid": "slack-logo" }) },
    ];
    const chosen = renderToStaticMarkup(h(Combobox, { label: "App", options, value: "gmail", onValueChange: () => undefined }));
    assert.match(chosen, /data-testid="gmail-logo"/);
    assert.doesNotMatch(chosen, /data-testid="slack-logo"/);
    const empty = renderToStaticMarkup(h(Combobox, { label: "App", options, value: "", onValueChange: () => undefined }));
    assert.doesNotMatch(empty, /data-testid=/);
  });

  console.log("PageHeading");

  test("sticky mantém o cabeçalho completo no fluxo e cria uma âncora compacta inerte", () => {
    const html = renderToStaticMarkup(h(PageHeading, {
      title: "Projetos",
      description: "Organize o trabalho",
      actions: h("button", { type: "button" }, "Novo projeto"),
    }));
    assert.match(html, /sticky-page-header-anchor/);
    assert.match(html, /sticky-page-header-overlay/);
    assert.match(html, /sticky-page-header-flow/);
    assert.match(html, /data-sticky-observer=""/);
    assert.match(html, /data-sticky-actions=""/);
    assert.equal((html.match(/>Projetos</g) ?? []).length, 2);
    assert.equal((html.match(/>Novo projeto</g) ?? []).length, 2);
  });

  test("sem sticky não duplica título nem ações", () => {
    const html = renderToStaticMarkup(h(PageHeading, {
      sticky: false,
      title: "Projetos",
      actions: h("button", { type: "button" }, "Novo projeto"),
    }));
    assert.doesNotMatch(html, /sticky-page-header-anchor|sticky-page-header-overlay|sticky-page-header-flow/);
    assert.equal((html.match(/>Projetos</g) ?? []).length, 1);
    assert.equal((html.match(/>Novo projeto</g) ?? []).length, 1);
  });

  console.log("Cabeçalho fixo");

  test("o cabeçalho compacto usa o --sticky-top do Page (padding negativo), nunca zero", () => {
    const css = mod.readFileSync(join(root, "src/styles/components.css"), "utf8");
    assert.doesNotMatch(css, /data-compact-page-header\]\s*\{[^}]*--sticky-top/);
    assert.match(css, /\.sticky-page-header-anchor\s*\{[^}]*top:\s*var\(--sticky-top/);
  });

  console.log("Tabs, Breadcrumb, ListRow");

  test("Tabs overflow=scroll: uma linha rolável, aba ativa marcada", () => {
    const items = [{ id: "a", label: "Visão geral" }, { id: "b", label: "Membros", count: 3 }];
    const html = renderToStaticMarkup(h(mod.Tabs, { label: "Seções", items, value: "b", overflow: "scroll" }));
    assert.match(html, /scroll-fade-x/);
    assert.match(html, /flex-nowrap/);
    assert.match(html, /data-active=""[^>]*>Membros \(3\)</);
    const wrap = renderToStaticMarkup(h(mod.Tabs, { label: "Seções", items, value: "a" }));
    assert.match(wrap, /flex-wrap/);
    assert.doesNotMatch(wrap, /scroll-fade-x/);
  });

  test("Breadcrumb back: botão de voltar nomeado antes da trilha", () => {
    const html = renderToStaticMarkup(h(mod.Breadcrumb, { back: { label: "Voltar para Entregas", href: "/entregas" }, items: [{ label: "Entregas", href: "/entregas" }] }));
    assert.match(html, /aria-label="Voltar para Entregas"/);
    assert.ok(html.indexOf("Voltar para Entregas") < html.indexOf(">Entregas<"));
  });

  test("ListRow: com href e ações, o alvo é o título e as ações ficam fora do link", () => {
    const html = renderToStaticMarkup(h(mod.RowList, { label: "Domínios" }, h(mod.ListRow, { href: "/d/1", title: "g4.com", description: "Verificado", actions: h("button", { type: "button" }, "Remover") })));
    assert.match(html, /role="list"/);
    assert.match(html, /linked-card/);
    assert.match(html, /<a[^>]*class="[^"]*card-primary-link[^"]*"[^>]*>g4\.com<\/a>/);
    assert.doesNotMatch(html, /<a[^>]*>(?:(?!<\/a>).)*Remover/);
    const plain = renderToStaticMarkup(h(mod.ListRow, { title: "Sem alvo" }));
    assert.doesNotMatch(plain, /linked-card|<a |<button/);
  });

  console.log("Menu");

  test("menu sem ícones não reserva o espaço do ícone; com ícone, todos os itens reservam", () => {
    // O popup só existe aberto e em portal; o contrato é verificado no código-fonte do item.
    const src = mod.readFileSync(join(root, "src/components/overlays-extra.tsx"), "utf8");
    assert.match(src, /const slot = items\.some/);
    assert.equal((src.match(/\{slot && <span className="flex h-4 w-4 shrink-0/g) ?? []).length, 3);
  });

  console.log("AgentOrb, CodeBlock, DiffView");

  test("AgentOrb: a mesma semente dá o mesmo rosto; decorativo sem labelled", () => {
    assert.deepEqual(mod.getAgentOrbDesign("galt:atlas"), mod.getAgentOrbDesign("galt:atlas"));
    const a = renderToStaticMarkup(h(mod.AgentOrb, { seed: "galt:atlas", size: 40, expression: "working" }));
    assert.equal(a, renderToStaticMarkup(h(mod.AgentOrb, { seed: "galt:atlas", size: 40, expression: "working" })));
    assert.match(a, /aria-hidden="true"/);
    assert.match(a, /data-expression="working"/);
    const named = renderToStaticMarkup(h(mod.AgentOrb, { seed: "galt:atlas", name: "Atlas", labelled: true }));
    assert.match(named, /role="img" aria-label="Atlas"/);
  });

  test("AgentOrb badge: aparece de 24 px para cima, some abaixo", () => {
    const badge = h("svg", { "data-testid": "tool" });
    assert.match(renderToStaticMarkup(h(mod.AgentOrb, { seed: "x", size: 40, badge })), /agent-orb-badge/);
    assert.doesNotMatch(renderToStaticMarkup(h(mod.AgentOrb, { seed: "x", size: 16, badge })), /agent-orb-badge/);
  });

  test("CodeBlock: rótulo da linguagem, linhas numeradas e código escapado", () => {
    const html = renderToStaticMarkup(h(mod.CodeBlock, { language: "ts", lineNumbers: true, code: "const a = '<b>';\nreturn a;" }));
    assert.match(html, />TypeScript</);
    assert.match(html, /&lt;b&gt;/);
    assert.doesNotMatch(html, /<b>/);
    assert.match(html, />2<\/span>/);
    assert.match(renderToStaticMarkup(h(mod.CodeBlock, { code: "Olá" })), />Texto</);
  });

  test("DiffView: saldo de linhas, sinais e palavras marcadas; texto que não é diff vira CodeBlock", () => {
    const diff = "--- a/x.ts\n+++ b/x.ts\n@@ -1,2 +1,2 @@\n ctx\n-atraso há 5 dias\n+atraso há 7 dias\n";
    const html = renderToStaticMarkup(h(mod.DiffView, { diff }));
    assert.match(html, /x\.ts/);
    assert.match(html, /aria-label="1 linhas adicionadas, 1 removidas"/);
    assert.match(html, /<mark[^>]*>5<\/mark>/);
    assert.match(html, /<mark[^>]*>7<\/mark>/);
    assert.match(html, /aria-label="removida"/);
    assert.match(renderToStaticMarkup(h(mod.DiffView, { diff: "nada mudou" })), /code-block/);
  });

  console.log("Formatação");

  test("formatDate com fuso e hora; formatRelative curto e compatível com a assinatura antiga", () => {
    assert.equal(mod.formatDate(new Date("2026-10-01T17:05:00Z"), { time: true, timeZone: "America/Sao_Paulo" }), "01/10/2026, 14:05");
    assert.equal(mod.formatDate("2026-10-01"), "01/10/2026");
    const now = new Date("2026-10-10T12:00:00Z");
    assert.equal(mod.formatRelative(new Date("2026-10-10T11:55:00Z"), { now, short: true }), "5\u00A0min");
    assert.equal(mod.formatRelative(new Date("2026-10-07T12:00:00Z"), { now, short: true }), "3\u00A0d");
    assert.equal(mod.formatRelative(new Date("2026-10-07T12:00:00Z"), now), "há 3 dias");
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${passed} ok, ${failures.length} falha(s)`);
if (failures.length) process.exit(1);
