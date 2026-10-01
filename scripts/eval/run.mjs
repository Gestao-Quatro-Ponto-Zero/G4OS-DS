#!/usr/bin/env node
// Eval do DS com agentes de IA: cada tarefa roda num app Vite limpo (templates/vite-app) com o
// pacote empacotado (npm pack) instalado, o AGENTS.snippet e o MCP do pacote — exatamente o que
// um projeto consumidor tem. Depois o avaliador (grade.mjs) mede tipo, auditoria, build, render,
// a11y e uma rubrica de padrões. Não roda no `check` (custa tokens).
//
//   node scripts/eval/run.mjs --label antes --agents claude,codex --tasks all
//   node scripts/eval/run.mjs --label depois --agents claude --tasks vagas-lista,config-automacao
//   node scripts/eval/run.mjs --grade-only --label antes        (só reavalia)
//   node scripts/eval/report.mjs antes depois                   (tabela comparativa)
//
// Opções: --out <dir> (padrão: .eval/ na raiz, fora do git) · --model <claude-model> (padrão sonnet)
//         --codex-model <m> · --budget <usd por tarefa> (3) · --parallel <n> (3) · --tgz <arquivo>
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HARNESS_RULES, TASKS } from "./tasks.mjs";
import { grade } from "./grade.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i < 0 ? d : argv[i + 1];
};
const flag = (k) => argv.includes(`--${k}`);

const label = opt("label", "run");
const out = resolve(opt("out", join(repo, ".eval")));
const agents = opt("agents", "claude").split(",");
const taskIds = opt("tasks", "all");
const tasks = taskIds === "all" ? TASKS : TASKS.filter((t) => taskIds.split(",").includes(t.id));
const model = opt("model", "sonnet");
const codexModel = opt("codex-model");
const budget = opt("budget", "3");
const parallel = Number(opt("parallel", "3"));
const runDir = join(out, label);

const log = (...a) => console.log(`[eval ${new Date().toISOString().slice(11, 19)}]`, ...a);

function sh(cmd, args, o = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 << 20, ...o });
  if (r.status !== 0 && !o.allowFail) throw new Error(`${cmd} ${args.join(" ")}\n${r.stdout}\n${r.stderr}`);
  return r;
}

/* ------------------------------------------------------------------ */
/* Base: starter + pacote empacotado                                   */
/* ------------------------------------------------------------------ */

function prepareBase() {
  const base = join(runDir, "_base");
  if (existsSync(join(base, "node_modules", "@g4ai", "ds"))) return base;
  mkdirSync(runDir, { recursive: true });
  let tgz = opt("tgz");
  if (!tgz) {
    log("npm run build + npm pack…");
    sh("npm", ["run", "-s", "build"], { cwd: repo });
    const r = sh("npm", ["pack", "--silent", "--pack-destination", runDir], { cwd: repo });
    tgz = join(runDir, r.stdout.trim().split("\n").pop());
  }
  rmSync(base, { recursive: true, force: true });
  cpSync(join(repo, "templates", "vite-app"), base, { recursive: true });
  const pkg = JSON.parse(readFileSync(join(base, "package.json"), "utf8"));
  pkg.dependencies["@g4ai/ds"] = `file:${resolve(tgz)}`;
  writeFileSync(join(base, "package.json"), JSON.stringify(pkg, null, 2));
  log("npm install no starter…");
  sh("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: base });
  return base;
}

function snippet() {
  return readFileSync(join(repo, "templates", "AGENTS.snippet.md"), "utf8").replace(/<!--[\s\S]*?-->\s*/, "");
}

function prepareWorkspace(base, agent, task) {
  const ws = join(runDir, agent, task.id);
  rmSync(ws, { recursive: true, force: true });
  mkdirSync(ws, { recursive: true });
  for (const f of readdirSync(base)) if (!["node_modules", "package-lock.json"].includes(f)) cpSync(join(base, f), join(ws, f), { recursive: true });
  symlinkSync(join(base, "node_modules"), join(ws, "node_modules"), "dir");
  for (const [to, from] of Object.entries(task.fixtures ?? {})) {
    mkdirSync(dirname(join(ws, to)), { recursive: true });
    cpSync(join(here, from), join(ws, to));
  }
  writeFileSync(join(ws, "AGENTS.md"), `# Meu app\n\nApp React + Vite. Telas em src/pages, rotas em src/App.tsx.\n\n${snippet()}`);
  writeFileSync(join(ws, "CLAUDE.md"), "@AGENTS.md\n");
  const mcpCli = join(ws, "node_modules", "@g4ai", "ds", "scripts", "cli.mjs");
  writeFileSync(join(ws, ".mcp.json"), JSON.stringify({ mcpServers: { "g4os-ds": { command: "node", args: [mcpCli, "mcp"] } } }, null, 2));
  sh("git", ["init", "-q"], { cwd: ws });
  sh("git", ["-c", "user.email=eval@g4os", "-c", "user.name=eval", "add", "-A"], { cwd: ws });
  sh("git", ["-c", "user.email=eval@g4os", "-c", "user.name=eval", "commit", "-qm", "base"], { cwd: ws });
  return ws;
}

/* ------------------------------------------------------------------ */
/* Agentes                                                             */
/* ------------------------------------------------------------------ */

function run(cmd, args, o) {
  return new Promise((res) => {
    const started = Date.now();
    const p = spawn(cmd, args, { ...o, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => p.kill("SIGTERM"), (o.timeoutMin ?? 30) * 60_000);
    p.on("close", (code) => {
      clearTimeout(timer);
      res({ code, stdout, stderr, ms: Date.now() - started });
    });
  });
}

function codexBin() {
  const found = sh("bash", ["-lc", "ls -d $HOME/.npm/_npx/*/node_modules/@openai/codex-darwin-arm64/vendor/*/bin/codex 2>/dev/null | head -1"], { allowFail: true }).stdout.trim();
  if (found) return found;
  return "codex";
}

async function runAgent(agent, task, ws) {
  const prompt = `${task.prompt}\n${HARNESS_RULES}`;
  if (agent === "noop") return { agent }; // só para testar o harness e o avaliador
  if (agent === "claude") {
    const r = await run(
      "claude",
      [
        "-p", prompt,
        "--model", model,
        "--output-format", "stream-json",
        "--verbose",
        "--max-budget-usd", budget,
        "--mcp-config", join(ws, ".mcp.json"),
        "--strict-mcp-config",
        "--setting-sources", "project",
        "--disable-slash-commands",
        "--no-session-persistence",
        "--permission-mode", "dontAsk",
        "--allowedTools", "Read,Write,Edit,Glob,Grep,Bash(npx tsc *),Bash(npx g4os-ds *),Bash(npx eslint *),Bash(ls *),Bash(cat *),Bash(head *),Bash(tail *),Bash(grep *),Bash(cd *),Bash(echo *),Bash(wc *),Bash(sed -n *),mcp__g4os-ds",
      ],
      { cwd: ws, env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" } },
    );
    let meta = { stderr: r.stderr.slice(-1000) };
    const tools = {};
    for (const line of r.stdout.split("\n")) {
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        continue;
      }
      if (ev.type === "assistant") for (const c of ev.message?.content ?? []) if (c.type === "tool_use") {
        const k = c.name === "Bash" ? `Bash:${String(c.input?.command ?? "").split(" ").slice(0, 3).join(" ")}` : c.name === "Read" ? `Read:${String(c.input?.file_path ?? "").replace(/^.*node_modules\/@g4ai\/ds\//, "ds/")}` : c.name;
        tools[k] = (tools[k] ?? 0) + 1;
      }
      if (ev.type === "result") meta = { ...meta, cost: ev.total_cost_usd, turns: ev.num_turns, result: String(ev.result ?? "").slice(0, 2000), isError: ev.is_error, denials: ev.permission_denials?.map((d) => d.tool_name) };
    }
    meta.tools = tools;
    writeFileSync(join(ws, ".eval-transcript.jsonl"), r.stdout);
    return { agent, code: r.code, ms: r.ms, ...meta };
  }
  if (agent === "codex") {
    const home = join(runDir, "_codexhome", task.id);
    rmSync(home, { recursive: true, force: true });
    mkdirSync(home, { recursive: true });
    const auth = join(homedir(), ".codex", "auth.json");
    if (!existsSync(auth)) return { agent, skipped: "sem ~/.codex/auth.json" };
    cpSync(auth, join(home, "auth.json"));
    const mcpCli = join(ws, "node_modules", "@g4ai", "ds", "scripts", "cli.mjs");
    writeFileSync(join(home, "config.toml"), `[mcp_servers.g4os-ds]\ncommand = "node"\nargs = [${JSON.stringify(mcpCli)}, "mcp"]\nstartup_timeout_sec = 60\n`);
    const args = ["exec", "--cd", ws, "--skip-git-repo-check", "--sandbox", "workspace-write", "-c", "approval_policy=\"never\"", "-o", join(ws, ".codex-last.txt")];
    if (codexModel) args.push("-m", codexModel);
    args.push(prompt);
    const r = await run(codexBin(), args, { cwd: ws, env: { ...process.env, CODEX_HOME: home } });
    const tokens = /tokens used\s*\n?\s*([\d,.]+)/i.exec(r.stdout + r.stderr)?.[1];
    return { agent, code: r.code, ms: r.ms, tokens, result: existsSync(join(ws, ".codex-last.txt")) ? readFileSync(join(ws, ".codex-last.txt"), "utf8").slice(0, 2000) : (r.stderr || r.stdout).slice(-1500) };
  }
  throw new Error(`agente desconhecido: ${agent}`);
}

/* ------------------------------------------------------------------ */

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        results[k] = await fn(items[k]);
      }
    }),
  );
  return results;
}

const jobs = agents.flatMap((agent) => tasks.map((task) => ({ agent, task })));

if (!flag("grade-only")) {
  const base = prepareBase();
  await pool(jobs, parallel, async ({ agent, task }) => {
    const ws = prepareWorkspace(base, agent, task);
    log(`→ ${agent} · ${task.id}`);
    const meta = await runAgent(agent, task, ws);
    writeFileSync(join(ws, ".eval-agent.json"), JSON.stringify(meta, null, 2));
    log(`← ${agent} · ${task.id} (${Math.round((meta.ms ?? 0) / 1000)}s${meta.cost != null ? `, US$ ${meta.cost.toFixed(2)}` : ""})`);
  });
}

log("avaliando…");
const results = [];
for (const { agent, task } of jobs) {
  const ws = join(runDir, agent, task.id);
  if (!existsSync(ws)) continue;
  const g = await grade(ws, task, { repo });
  const meta = existsSync(join(ws, ".eval-agent.json")) ? JSON.parse(readFileSync(join(ws, ".eval-agent.json"), "utf8")) : {};
  results.push({ agent, task: task.id, score: g.score, grade: g, meta: { ms: meta.ms, cost: meta.cost, turns: meta.turns, tokens: meta.tokens } });
  log(`${agent} · ${task.id}: ${g.score}/100`);
}
writeFileSync(join(runDir, "results.json"), JSON.stringify(results, null, 2));
log(`resultados em ${join(runDir, "results.json")}`);
