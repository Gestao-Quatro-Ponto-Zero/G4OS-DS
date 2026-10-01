#!/usr/bin/env node
// Testes do servidor MCP (scripts/mcp.mjs) com o SDK oficial como cliente.
//   npm run test:mcp                   stdio (todas as versões do protocolo), stdio cru, HTTP, schemas
//   node scripts/test-mcp.mjs --inspector   + smoke test com o MCP Inspector CLI (baixa via npx)
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "scripts", "cli.mjs");
const VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"];
let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n    ${String(e.stack ?? e).split("\n").slice(0, 4).join("\n    ")}`);
  }
}
const text = (r) => r.content.map((c) => c.text).join("");

/* ---------------- Portabilidade dos schemas ---------------- */

// Subconjunto aceito por Gemini (function declarations), OpenAI/Codex, Cursor e Copilot.
const ALLOWED_KEYS = new Set(["type", "description", "enum", "properties", "required", "items"]);
const TYPES = new Set(["string", "integer", "number", "boolean", "object", "array"]);
function checkSchema(schema, where) {
  for (const k of Object.keys(schema)) assert.ok(ALLOWED_KEYS.has(k), `${where}: palavra-chave não portável "${k}"`);
  assert.ok(TYPES.has(schema.type), `${where}: type ausente ou inválido`);
  if (schema.enum) {
    assert.equal(schema.type, "string", `${where}: enum só em string`);
    assert.ok(schema.enum.every((v) => typeof v === "string"), `${where}: enum com valor não-string`);
  }
  if (schema.type === "object") {
    assert.ok(schema.properties && typeof schema.properties === "object", `${where}: object sem properties`);
    for (const r of schema.required ?? []) assert.ok(r in schema.properties, `${where}: required "${r}" não existe em properties`);
    for (const [k, v] of Object.entries(schema.properties)) {
      assert.match(k, /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/, `${where}: nome de propriedade "${k}"`);
      checkSchema(v, `${where}.${k}`);
    }
  }
  if (schema.type === "array") checkSchema(schema.items ?? {}, `${where}[]`);
}

/* ---------------- Cliente SDK sobre stdio ---------------- */

/** Força a versão de protocolo pedida no initialize (o SDK manda sempre a mais nova). */
function pinVersion(transport, version) {
  const send = transport.send.bind(transport);
  transport.send = (msg, opts) => send(msg.method === "initialize" ? { ...msg, params: { ...msg.params, protocolVersion: version } } : msg, opts);
  return transport;
}

async function withStdioClient(version, fn) {
  const transport = pinVersion(new StdioClientTransport({ command: process.execPath, args: [cli, "mcp"], cwd: root, stderr: "pipe" }), version);
  const client = new Client({ name: "g4os-ds-test", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);
  try {
    await fn(client);
  } finally {
    await client.close();
  }
}

const SAMPLE_ARGS = {
  search: { query: "tabela" },
  get_component: { name: "DataGrid" },
  list_blocks: { category: "CRM" },
  get_block: { slug: "crm-pipeline" },
  get_guide: { slug: "core" },
  get_tokens: {},
  theme_from_colors: { name: "acme", primary: "#0b5cff", accent: "#ffb020" },
  audit: { path: join(root, "src", "blocks", "crm-pipeline.tsx"), limit: 5 },
  doctor: { path: root },
};

console.log("MCP · stdio com SDK oficial");
for (const v of VERSIONS) {
  await test(`protocolo ${v}: initialize, tools, resources, prompts, ping`, () =>
    withStdioClient(v, async (c) => {
      assert.equal(c.getServerVersion().name, "g4os-ds");
      const caps = c.getServerCapabilities();
      for (const k of ["tools", "resources", "prompts", "logging"]) assert.ok(caps[k], `capability ${k}`);
      assert.equal(Boolean(caps.completions), v !== "2024-11-05", "completions só a partir de 2025-03-26");
      await c.ping();

      const { tools } = await c.listTools();
      assert.deepEqual(tools.map((t) => t.name).sort(), Object.keys(SAMPLE_ARGS).sort());
      for (const t of tools) {
        assert.match(t.name, /^[a-zA-Z0-9_-]{1,64}$/);
        assert.ok(t.description.length > 20 && t.description.length < 1024, `${t.name}: descrição`);
        assert.equal(t.outputSchema, undefined, `${t.name}: sem outputSchema`);
        checkSchema(t.inputSchema, t.name);
        const r = await c.callTool({ name: t.name, arguments: SAMPLE_ARGS[t.name] });
        assert.ok(!r.isError, `${t.name} falhou: ${text(r).slice(0, 200)}`);
        assert.ok(text(r).length > 20, `${t.name}: resposta vazia`);
      }

      const { resources } = await c.listResources();
      assert.ok(resources.length > 50);
      const core = await c.readResource({ uri: "g4os-ds://core" });
      assert.match(core.contents[0].text, /G4OS-DS/);
      const { resourceTemplates } = await c.listResourceTemplates();
      assert.equal(resourceTemplates.length, 3);
      const block = await c.readResource({ uri: "g4os-ds://blocks/crm-pipeline" });
      assert.ok(block.contents[0].text.length > 100);

      const { prompts } = await c.listPrompts();
      assert.deepEqual(prompts.map((p) => p.name).sort(), ["adaptar-projeto", "criar-tela", "revisar-tela"]);
      const p = await c.getPrompt({ name: "criar-tela", arguments: { descricao: "pipeline de vendas" } });
      assert.equal(p.messages[0].role, "user");
      assert.match(p.messages[0].content.text, /pipeline de vendas/);
      await c.getPrompt({ name: "revisar-tela", arguments: { path: "src/app/page.tsx" } });
      await c.getPrompt({ name: "adaptar-projeto", arguments: {} });

      await c.setLoggingLevel("info");
      if (v !== "2024-11-05") {
        const comp = await c.complete({ ref: { type: "ref/resource", uri: "g4os-ds://blocks/{slug}" }, argument: { name: "slug", value: "crm" } });
        assert.ok(comp.completion.values.includes("crm-pipeline"));
      }
    }),
  );
}

await test("erros: ferramenta/prompt desconhecidos → -32602; argumento inválido → isError", () =>
  withStdioClient("2025-06-18", async (c) => {
    await assert.rejects(c.callTool({ name: "nao_existe", arguments: {} }), (e) => e.code === -32602);
    await assert.rejects(c.getPrompt({ name: "nao-existe" }), (e) => e.code === -32602);
    await assert.rejects(c.getPrompt({ name: "criar-tela", arguments: {} }), (e) => e.code === -32602);
    await assert.rejects(c.readResource({ uri: "g4os-ds://nada" }), (e) => e.code === -32002);
    const bad = await c.callTool({ name: "search", arguments: {} });
    assert.equal(bad.isError, true);
    assert.match(text(bad), /query/);
    const badEnum = await c.callTool({ name: "search", arguments: { query: "x", kind: "foo" } });
    assert.equal(badEnum.isError, true);
    const nf = await c.callTool({ name: "get_block", arguments: { slug: "nao-existe" } });
    assert.equal(nf.isError, true);
    // Coerção tolerante: números e booleanos como string (comum em alguns modelos/clientes).
    const ok = await c.callTool({ name: "search", arguments: { query: "tabela", limit: "2" } });
    assert.ok(!ok.isError);
    assert.equal(JSON.parse(text(ok).split("\n\nMais")[0]).length, 2);
  }),
);

await test("respostas longas: paginadas com offset e dica de continuação", () =>
  withStdioClient("2025-06-18", async (c) => {
    const { tools } = await c.listTools();
    assert.ok(tools.length);
    // O bloco com mais código passa do limite por resposta.
    let slug, first;
    for (const s of ["app-workspace", "crm-pipeline", "saas-dashboard", "crm-deal", "ai-chat"]) {
      const r = await c.callTool({ name: "get_block", arguments: { slug: s, include_source: true } });
      if (!r.isError && /Para continuar chame get_block/.test(text(r))) {
        slug = s;
        first = text(r);
        break;
      }
    }
    if (!slug) {
      const r = await c.callTool({ name: "get_component", arguments: { name: "charts" } });
      assert.match(text(r), /Para continuar chame get_component/, "nenhuma resposta longa encontrada para testar a paginação");
      return;
    }
    const next = Number(first.match(/"offset":(\d+)/)[1]);
    assert.ok(first.length < 40000);
    const r2 = await c.callTool({ name: "get_block", arguments: { slug, include_source: true, offset: next } });
    assert.match(text(r2), new RegExp(`^\\[continuação: caracteres ${next}–`));
  }),
);

/* ---------------- stdio cru (casos de borda do enquadramento) ---------------- */

function rawSession(lines, { closeAfter = true } = {}) {
  return new Promise((resolvePromise, reject) => {
    const p = spawn(process.execPath, [cli, "mcp"], { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => {
      p.kill("SIGKILL");
      reject(new Error(`servidor não saiu após fechar stdin. stderr: ${err}`));
    }, 5000);
    p.on("exit", (code) => {
      clearTimeout(timer);
      resolvePromise({ code, out, err, msgs: out.split("\n").filter(Boolean).map((l) => JSON.parse(l)) });
    });
    (async () => {
      for (const l of lines) {
        p.stdin.write(l);
        await new Promise((r) => setTimeout(r, 15));
      }
      if (closeAfter) p.stdin.end();
    })();
  });
}

console.log("MCP · stdio cru");
await test("CRLF, linhas vazias, pedaços parciais, BOM, lote, lixo, método desconhecido, EOF sem \\n", async () => {
  const init = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2099-01-01", capabilities: {}, clientInfo: { name: "raw", version: "0" } } });
  const { code, msgs, out } = await rawSession([
    `﻿${init.slice(0, 30)}`,
    `${init.slice(30)}\r\n`,
    "\r\n\n   \n",
    `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
    `${JSON.stringify([{ jsonrpc: "2.0", id: 2, method: "ping" }, { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 9 } }, { jsonrpc: "2.0", id: "três", method: "tools/list" }])}\n`,
    `${JSON.stringify([{ jsonrpc: "2.0", method: "notifications/initialized" }])}\n`, // lote só de notificações: sem resposta
    "isto não é json\n",
    `${JSON.stringify({ jsonrpc: "2.0", id: 4, method: "metodo/inexistente" })}\n`,
    `${JSON.stringify({ jsonrpc: "2.0", method: "metodo/inexistente" })}\n`, // notificação desconhecida: ignorada
    `${JSON.stringify({ jsonrpc: "2.0", id: 5, result: {} })}\n`, // resposta vinda do cliente: ignorada
    `${JSON.stringify({ jsonrpc: "2.0", id: 0, method: "tools/call", params: { name: "search", arguments: '{"query":"funil"}' } })}\n`,
    JSON.stringify({ jsonrpc: "2.0", id: 6, method: "ping" }), // sem \n final: processado no EOF
  ]);
  assert.equal(code, 0, "sai com 0 quando o stdin fecha");
  assert.ok(out.split("\n").filter(Boolean).every((l) => JSON.parse(l)), "stdout só tem JSON-RPC");
  const [initRes, batch, parseErr, unknown, call, last, ...rest] = msgs;
  assert.equal(rest.length, 0, `respostas a mais: ${JSON.stringify(rest)}`);
  assert.equal(initRes.id, 1);
  assert.equal(initRes.result.protocolVersion, "2025-11-25", "versão desconhecida → a mais nova suportada");
  assert.ok(Array.isArray(batch), "lote respondido como lote");
  assert.deepEqual(batch.map((m) => m.id), [2, "três"]);
  assert.ok(batch[1].result.tools.length);
  assert.equal(parseErr.error.code, -32700);
  assert.equal(parseErr.id, null);
  assert.equal(unknown.error.code, -32601);
  assert.equal(unknown.id, 4);
  assert.equal(call.id, 0, "id 0 é válido");
  assert.ok(!call.result.isError, "argumentos como string JSON são aceitos");
  assert.equal(last.id, 6);
});

await test("negociação: devolve a versão pedida quando suportada", async () => {
  for (const v of VERSIONS) {
    const { msgs } = await rawSession([`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: v, capabilities: {}, clientInfo: { name: "raw", version: "0" } } })}\n`]);
    assert.equal(msgs[0].result.protocolVersion, v);
    const caps = msgs[0].result.capabilities;
    assert.ok(caps.tools && caps.resources && caps.prompts && caps.logging);
  }
});

await test("SIGTERM encerra limpo", async () => {
  const p = spawn(process.execPath, [cli, "mcp"], { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 300));
  p.kill("SIGTERM");
  const code = await new Promise((r) => p.on("exit", (c, s) => r(c ?? s)));
  assert.equal(code, 0);
});

/* ---------------- Streamable HTTP ---------------- */

async function withHttpServer(fn) {
  const p = spawn(process.execPath, [cli, "mcp", "--http", "--port", "0"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  try {
    const port = await new Promise((res, rej) => {
      let err = "";
      const t = setTimeout(() => rej(new Error(`HTTP não subiu: ${err}`)), 5000);
      p.stderr.on("data", (d) => {
        err += d;
        const m = err.match(/:(\d+)\/mcp/);
        if (m) {
          clearTimeout(t);
          res(Number(m[1]));
        }
      });
    });
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    p.kill("SIGTERM");
  }
}

console.log("MCP · Streamable HTTP");
await test("SDK StreamableHTTPClientTransport: initialize, tools, call, resources", () =>
  withHttpServer(async (base) => {
    const client = new Client({ name: "g4os-ds-test-http", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`));
    await client.connect(transport);
    assert.ok(transport.sessionId, "Mcp-Session-Id devolvido no initialize");
    const { tools } = await client.listTools();
    assert.equal(tools.length, 9);
    const r = await client.callTool({ name: "search", arguments: { query: "login" } });
    assert.match(text(r), /auth-login/);
    const res = await client.readResource({ uri: "g4os-ds://tokens" });
    assert.ok(res.contents[0].text.length > 100);
    await client.ping();
    await transport.terminateSession();
    await client.close();
  }),
);

await test("HTTP: GET 405, Origin externa 403, sessão desconhecida 404, notificação 202, lote, health", () =>
  withHttpServer(async (base) => {
    const post = (body, headers = {}) =>
      fetch(`${base}/mcp`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
    assert.equal((await fetch(`${base}/mcp`)).status, 405);
    assert.equal((await post({ jsonrpc: "2.0", id: 1, method: "ping" }, { Origin: "https://evil.example" })).status, 403);
    const local = await post({ jsonrpc: "2.0", id: 1, method: "ping" }, { Origin: "http://localhost:5173" });
    assert.equal(local.status, 200);
    assert.equal(local.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal((await post({ jsonrpc: "2.0", id: 1, method: "ping" }, { "Mcp-Session-Id": "nao-existe" })).status, 404);
    assert.equal((await post({ jsonrpc: "2.0", method: "notifications/initialized" })).status, 202);
    assert.equal((await post({ jsonrpc: "2.0", id: 1, method: "ping" }, { "MCP-Protocol-Version": "1999-01-01" })).status, 400);
    assert.equal((await post("{lixo")).status, 400);
    const batch = await (await post([{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", id: 2, method: "tools/list" }])).json();
    assert.deepEqual(batch.map((m) => m.id), [1, 2]);
    const pre = await fetch(`${base}/mcp`, { method: "OPTIONS", headers: { Origin: "http://127.0.0.1:3000", "Access-Control-Request-Method": "POST" } });
    assert.equal(pre.status, 204);
    assert.equal((await (await fetch(`${base}/health`)).json()).name, "g4os-ds");
  }),
);

/* ---------------- MCP Inspector (opcional) ---------------- */

if (process.argv.includes("--inspector")) {
  console.log("MCP · Inspector CLI");
  await test("npx @modelcontextprotocol/inspector --cli tools/list e tools/call", () => {
    const run = (...extra) =>
      spawnSync("npx", ["-y", "@modelcontextprotocol/inspector", "--cli", process.execPath, cli, "mcp", ...extra], { cwd: root, encoding: "utf8", timeout: 180000 });
    const list = run("--method", "tools/list");
    assert.equal(list.status, 0, list.stderr);
    assert.equal(JSON.parse(list.stdout).tools.length, 9);
    const call = run("--method", "tools/call", "--tool-name", "search", "--tool-arg", "query=funil");
    assert.equal(call.status, 0, call.stderr);
    assert.match(JSON.parse(call.stdout).content[0].text, /funil/i);
  });
}

console.log(`\n${passed} ok, ${failures.length} falha(s)`);
process.exit(failures.length ? 1 : 0);
