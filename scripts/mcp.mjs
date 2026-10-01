#!/usr/bin/env node
// Servidor MCP do G4OS-DS (stdio, sem dependências).
//   claude mcp add g4os-ds -- npx -y @g4ai/ds mcp
// Lê os dados da própria versão instalada (ai/, docs/, src/blocks/), então funciona
// offline e sempre bate com o pacote que o projeto usa.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { audit } from "./ds-audit.mjs";
import { doctor } from "./doctor.mjs";
import { brandCss, contrast, deriveBrand } from "../plugin/skills/ds-theme/scripts/contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const PROTOCOL = "2025-06-18";
const read = (p) => readFileSync(join(root, p), "utf8");
const manifest = JSON.parse(read("ai/manifest.json"));

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/* ------------------------------------------------------------------ */
/* Índice                                                              */
/* ------------------------------------------------------------------ */

const exportsIndex = manifest.modules.flatMap((m) =>
  m.exports.map((e) => ({ name: e.name, kind: e.kind, module: m.name, summary: e.summary ?? e.description ?? "", doc: `ai/components/${m.name}.md` })),
);
const listMd = (dir, base = "") =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir), { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? listMd(join(dir, d.name), `${base}${d.name}/`) : d.name.endsWith(".md") ? [`${base}${d.name}`] : [],
      )
    : [];
const guides = listMd("docs").map((rel) => {
  const text = read(join("docs", rel));
  return { slug: rel.replace(/\.md$/, ""), title: text.match(/^#\s+(.+)$/m)?.[1] ?? rel, path: `docs/${rel}`, text };
});

function score(q, fields) {
  const stop = new Set(["de", "da", "do", "das", "dos", "com", "para", "pra", "a", "o", "as", "os", "e", "em", "um", "uma", "no", "na", "por", "the", "of", "with", "for"]);
  const terms = norm(q).split(/\s+/).filter((t) => t && !stop.has(t));
  if (!terms.length) return 0;
  let s = 0;
  for (const t of terms) {
    let hit = false;
    fields.forEach(([text, w], i) => {
      const n = norm(text);
      if (!n) return;
      if (i === 0 && n === t) s += 12 * w;
      else if (n.startsWith(t)) s += 6 * w;
      else if (n.includes(t)) s += 3 * w;
      else return;
      hit = true;
    });
    if (!hit) return 0; // todos os termos precisam aparecer
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Ferramentas                                                         */
/* ------------------------------------------------------------------ */

const tools = {
  search: {
    description: "Busca no design system: componentes (exports), blocos de tela, guias e padrões. Comece por aqui. Retorna os melhores resultados com o próximo passo (get_component, get_block ou get_guide).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "O que procura, em português ou inglês: 'tabela com seleção', 'funil', 'login', 'DataGrid', 'tema escuro'." },
        kind: { type: "string", enum: ["all", "component", "block", "guide"], default: "all" },
        limit: { type: "number", default: 12 },
      },
      required: ["query"],
    },
    run({ query, kind = "all", limit = 12 }) {
      const out = [];
      if (kind === "all" || kind === "component")
        for (const e of exportsIndex) {
          const s = score(query, [[e.name, 3], [e.module, 1.5], [e.summary, 1]]);
          if (s) out.push({ s: s + (e.kind === "component" ? 2 : 0), type: "component", name: e.name, module: e.module, kind: e.kind, summary: e.summary, next: `get_component { "name": "${e.name}" }` });
        }
      if (kind === "all" || kind === "block")
        for (const b of manifest.blocks) {
          const s = score(query, [[b.slug, 2], [b.title, 3], [b.category, 2], [b.description, 1], [b.concept?.goal, 1], [(b.concept?.patterns ?? []).join(" "), 0.6]]);
          if (s) out.push({ s, type: "block", slug: b.slug, title: b.title, category: b.category, summary: b.description, next: `get_block { "slug": "${b.slug}" }` });
        }
      if (kind === "all" || kind === "guide")
        for (const g of guides) {
          const s = score(query, [[g.slug, 2], [g.title, 3], [g.text.slice(0, 4000), 0.4]]);
          if (s) out.push({ s, type: "guide", slug: g.slug, title: g.title, next: `get_guide { "slug": "${g.slug}" }` });
        }
      out.sort((a, b) => b.s - a.s);
      const top = out.slice(0, Math.max(1, Math.min(50, limit))).map(({ s, ...r }) => r);
      return top.length ? JSON.stringify(top, null, 2) : `Nada encontrado para "${query}". Tente termos mais gerais ("tabela", "gráfico", "formulário") ou list_blocks.`;
    },
  },

  get_component: {
    description: "Documentação de um componente/export (props, tipos, padrões, exemplos de uso) ou de um módulo inteiro (ex.: 'charts', 'data-grid').",
    inputSchema: { type: "object", properties: { name: { type: "string", description: "Nome do export (DataGrid, AreaChart, useTheme) ou do módulo (charts, forms)." } }, required: ["name"] },
    run({ name }) {
      const mod = manifest.modules.find((m) => norm(m.name) === norm(name));
      if (mod) return read(`ai/components/${mod.name}.md`);
      const e = exportsIndex.find((x) => x.name === name) ?? exportsIndex.find((x) => norm(x.name) === norm(name));
      if (!e) {
        const near = exportsIndex.filter((x) => norm(x.name).includes(norm(name))).slice(0, 10).map((x) => x.name);
        return `Export "${name}" não existe.${near.length ? ` Parecidos: ${near.join(", ")}.` : " Use search."}`;
      }
      const md = read(e.doc);
      // Recorta a seção "## <Nome>" do módulo; cai para o módulo inteiro se não achar.
      const re = new RegExp(`^## ${e.name}(?: \\(|\\s*$)`, "m");
      const start = md.search(re);
      if (start < 0) return md;
      const rest = md.slice(start + 3);
      const end = rest.search(/^## /m);
      const header = md.split("\n").slice(0, 4).join("\n");
      return `${header}\n\n${md.slice(start, end < 0 ? undefined : start + 3 + end).trim()}\n\nImport: \`import { ${e.name} } from "@g4ai/ds";\` · módulo completo: get_component { "name": "${e.module}" }`;
    },
  },

  list_blocks: {
    description: "Lista os blocos (telas completas prontas para copiar) por categoria: SaaS, CRM, ATS, ERP, Financeiro, Autenticação, Configurações, Onboarding, Aplicação, IA, Marketing.",
    inputSchema: { type: "object", properties: { category: { type: "string", description: "Opcional. Filtra por categoria." } } },
    run({ category } = {}) {
      const list = manifest.blocks.filter((b) => !category || norm(b.category) === norm(category));
      if (!list.length) return `Categoria "${category}" sem blocos. Categorias: ${[...new Set(manifest.blocks.map((b) => b.category))].join(", ")}.`;
      return list.map((b) => `- ${b.slug} · ${b.title} (${b.category}): ${b.concept?.goal ?? b.description}`).join("\n");
    },
  },

  get_block: {
    description: "Detalhes de um bloco de tela: objetivo, padrões (anatomia), o que adaptar, o que evitar, componentes usados, arquivos. Com include_source=true devolve o código para copiar.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Ex.: crm-pipeline, saas-dashboard, auth-login." }, include_source: { type: "boolean", default: false } },
      required: ["slug"],
    },
    run({ slug, include_source = false }) {
      const b = manifest.blocks.find((x) => x.slug === slug);
      if (!b) return `Bloco "${slug}" não existe. Use list_blocks ou search.`;
      let text = read(`ai/blocks/${slug}.md`);
      if (include_source) {
        const src = read(b.file);
        const locals = [...src.matchAll(/from "\.\/((?:shells|data)\/[\w-]+)"/g)].map((m) => m[1]);
        text += `\n\n## Código · ${b.file}\n\n\`\`\`tsx\n${src}\n\`\`\``;
        for (const l of new Set(locals)) {
          const p = ["tsx", "ts"].map((ext) => `src/blocks/${l}.${ext}`).find((f) => existsSync(join(root, f)));
          if (p) text += `\n\n## ${p}\n\n\`\`\`tsx\n${read(p)}\n\`\`\``;
        }
        text += `\n\nCopie para src/blocks/ do seu app mantendo a estrutura (shells/, data/). Importa de "@g4ai/ds".`;
      }
      return text;
    },
  },

  get_guide: {
    description: "Lê um guia/padrão: anatomia-de-pagina, filtros, tabelas-e-colecoes, dashboards, formularios, tokens, temas-e-dark-mode, marca, escrita, receitas (crm, ats, erp, financeiro), instalacao, migracao, usar-com-ia… Sem slug, lista todos.",
    inputSchema: { type: "object", properties: { slug: { type: "string", description: "Ex.: 'anatomia-de-pagina' ou 'padroes/filtros'." } } },
    run({ slug } = {}) {
      if (!slug) return `Guias:\n${guides.map((g) => `- ${g.slug}: ${g.title}`).join("\n")}\n\nTambém: core (regras), tokens.`;
      if (["core", "regras"].includes(norm(slug))) return read("ai/core.md");
      if (norm(slug) === "tokens") return read("ai/tokens.md");
      const g = guides.find((x) => x.slug === slug) ?? guides.find((x) => x.slug.endsWith(`/${slug}`)) ?? guides.find((x) => norm(x.slug).includes(norm(slug)));
      return g ? g.text : `Guia "${slug}" não encontrado. Chame get_guide sem slug para ver a lista.`;
    },
  },

  get_tokens: {
    description: "Tokens do DS: semânticos (claro/escuro e utilitário Tailwind), escala de texto, raios, presets de marca (data-brand) e de tipografia (data-type). Use antes de escolher qualquer cor/tamanho.",
    inputSchema: { type: "object", properties: {} },
    run() {
      const theme = read("src/lib/theme.ts");
      const presets = (name) => [...(theme.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`))?.[1] ?? "").matchAll(/id: "([\w-]+)", label: "([^"]+)"/g)].map((m) => `${m[1]} (${m[2]})`);
      return `${read("ai/tokens.md")}\n\n## Presets\n\n- data-brand: ${presets("brandPresets").join(", ")}\n- data-type: ${presets("typePresets").join(", ")}\n\nUso: <html data-theme="light|dark|system" data-brand="…" data-type="…">. Para uma marca nova: theme_from_colors.`;
    },
  },

  theme_from_colors: {
    description: "Gera o CSS de uma marca de cliente ([data-brand]) a partir da cor de ação e de destaque, com versão escura e checagem de contraste WCAG.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome da marca (vira data-brand). Ex.: acme." },
        primary: { type: "string", description: "Cor de ação em hex. Ex.: #0b5cff." },
        accent: { type: "string", description: "Cor de destaque em hex (opcional)." },
        radius: { type: "number", description: "Escala de raio (0,4 sóbrio · 1 G4 · 1,3 amigável)." },
        font: { type: "string", description: 'Fonte, ex.: "\\"Inter\\", system-ui, sans-serif".' },
      },
      required: ["name", "primary"],
    },
    run({ name, primary, accent, radius, font }) {
      const brand = deriveBrand(primary, accent ?? primary);
      const css = brandCss(name.replace(/[^\w-]/g, "").toLowerCase() || "cliente", brand, { radius, font });
      const checks = [
        ["claro · texto sobre ação", brand.light.onPrimary, brand.light.primary],
        ["claro · destaque em texto", brand.light.accentDeep, "#ffffff"],
        ["escuro · texto sobre ação", brand.dark.onPrimary, brand.dark.primary],
        ["escuro · destaque em texto", brand.dark.accentDeep, "#18181b"],
      ].map(([l, a, b]) => `- ${l}: ${contrast(a, b).toFixed(2)}:1 ${contrast(a, b) >= 4.5 ? "✓" : "✗ (mín. 4,5)"}`);
      return `${css}\nContraste (WCAG AA):\n${checks.join("\n")}\n\nCole em themes.css (ou no CSS global) e use <html data-brand="${name}">.`;
    },
  },

  audit: {
    description: "Audita um caminho do projeto: cores fixas, bg-white/text-white, paleta Tailwind crua, classes shadcn, <select> nativo, confirm/alert, formatação en-US, texto fora da escala. Use para medir migração e revisar telas.",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "Pasta ou arquivo (relativo ao diretório atual)." }, limit: { type: "number", default: 60 } }, required: ["path"] },
    run({ path, limit = 60 }) {
      const r = audit(resolve(process.cwd(), path));
      return JSON.stringify({ target: path, filesScanned: r.filesScanned, totals: r.totals, byRule: r.byRule, findings: r.findings.slice(0, limit) }, null, 2);
    },
  },

  doctor: {
    description: "Confere se um projeto está pronto para o DS: React 19, Tailwind v4, Base UI, import do CSS, tema, fonte, link do Next. Primeiro passo de uma migração.",
    inputSchema: { type: "object", properties: { path: { type: "string", default: "." } } },
    run({ path = "." } = {}) {
      return JSON.stringify(doctor(resolve(process.cwd(), path)), null, 2);
    },
  },
};

/* ------------------------------------------------------------------ */
/* Recursos                                                            */
/* ------------------------------------------------------------------ */

const resources = [
  { uri: "g4os-ds://core", name: "Regras e índice (core)", mimeType: "text/markdown", file: "ai/core.md" },
  { uri: "g4os-ds://tokens", name: "Tokens", mimeType: "text/markdown", file: "ai/tokens.md" },
  { uri: "g4os-ds://llms", name: "Índice para LLMs", mimeType: "text/plain", file: "ai/llms.txt" },
  ...manifest.modules.map((m) => ({ uri: `g4os-ds://components/${m.name}`, name: `Componentes · ${m.name}`, mimeType: "text/markdown", file: `ai/components/${m.name}.md` })),
  ...manifest.blocks.map((b) => ({ uri: `g4os-ds://blocks/${b.slug}`, name: `Bloco · ${b.title}`, mimeType: "text/markdown", file: `ai/blocks/${b.slug}.md` })),
  ...guides.map((g) => ({ uri: `g4os-ds://guides/${g.slug}`, name: `Guia · ${g.title}`, mimeType: "text/markdown", file: g.path })),
];

/* ------------------------------------------------------------------ */
/* JSON-RPC sobre stdio                                                */
/* ------------------------------------------------------------------ */

const send = (msg) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...msg })}\n`);
const instructions = `G4OS-DS ${pkg.version} (@g4ai/ds): design system para apps G4 OS (CRM, ATS, ERP, financeiro, IA). Antes de escrever UI: get_guide "core" (regras), depois search → get_component/get_block. Prefira bloco pronto > composição de componentes > tokens. Use só tokens semânticos (bg-surface, text-muted, bg-primary text-on-primary), pt-BR, e siga uma anatomia de página (get_guide "anatomia-de-pagina"). Valide com audit.`;

function handle(req) {
  const { id, method, params = {} } = req;
  const reply = (result) => id !== undefined && send({ id, result });
  const fail = (code, message) => id !== undefined && send({ id, error: { code, message } });
  try {
    switch (method) {
      case "initialize":
        return reply({
          protocolVersion: params.protocolVersion ?? PROTOCOL,
          capabilities: { tools: { listChanged: false }, resources: { listChanged: false, subscribe: false } },
          serverInfo: { name: "g4os-ds", title: "G4OS-DS", version: pkg.version },
          instructions,
        });
      case "notifications/initialized":
      case "notifications/cancelled":
        return;
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) });
      case "tools/call": {
        const t = tools[params.name];
        if (!t) return fail(-32602, `Ferramenta desconhecida: ${params.name}`);
        try {
          return reply({ content: [{ type: "text", text: String(t.run(params.arguments ?? {})) }] });
        } catch (e) {
          return reply({ content: [{ type: "text", text: `Erro: ${e.message}` }], isError: true });
        }
      }
      case "resources/list":
        return reply({ resources: resources.map(({ file, ...r }) => r) });
      case "resources/templates/list":
        return reply({ resourceTemplates: [] });
      case "resources/read": {
        const r = resources.find((x) => x.uri === params.uri);
        if (!r) return fail(-32002, `Recurso não encontrado: ${params.uri}`);
        return reply({ contents: [{ uri: r.uri, mimeType: r.mimeType, text: read(r.file) }] });
      }
      case "prompts/list":
        return reply({ prompts: [] });
      default:
        return fail(-32601, `Método não suportado: ${method}`);
    }
  } catch (e) {
    return fail(-32603, e.message);
  }
}

export function startMcp() {
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (Array.isArray(msg)) msg.forEach(handle);
        else handle(msg);
      } catch {
        send({ id: null, error: { code: -32700, message: "JSON inválido" } });
      }
    }
  });
  process.stdin.on("end", () => process.exit(0));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) startMcp();
