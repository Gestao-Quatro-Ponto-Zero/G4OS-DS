#!/usr/bin/env node
// Servidor MCP do G4OS-DS (sem dependências, Node >= 18).
//   stdio (padrão):  npx -y @g4ai/ds mcp
//   HTTP local:      npx -y @g4ai/ds mcp --http [--port 3845] [--host 127.0.0.1]  →  POST http://127.0.0.1:3845/mcp
// Lê os dados da própria versão instalada (ai/, docs/, src/blocks/), então funciona
// offline e sempre bate com o pacote que o projeto usa.
//
// Compatibilidade: protocolos 2024-11-05, 2025-03-26, 2025-06-18 e 2025-11-25
// (negocia o do cliente; desconhecido → o mais novo). Schemas de entrada no
// subconjunto que Gemini, OpenAI/Codex, Cursor e Copilot aceitam: só type,
// description, enum, properties e required (sem anyOf/$ref/default/additionalProperties).
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { audit } from "./ds-audit.mjs";
import { doctor } from "./doctor.mjs";
import { brandCss, contrast, deriveBrand } from "../plugin/skills/ds-theme/scripts/contrast.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
export const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const read = (p) => readFileSync(join(root, p), "utf8");
const manifest = JSON.parse(read("ai/manifest.json"));
/** Tamanho máximo de texto por resposta (~10 mil tokens): Claude Code avisa acima de 10k e corta em 25k. */
const MAX_CHARS = Number(process.env.G4OS_DS_MCP_MAX_CHARS) || 36000;

const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const log = (...a) => process.stderr.write(`[g4os-ds mcp] ${a.join(" ")}\n`);

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
const guides = listMd("docs")
  .sort()
  .map((rel) => {
    const text = read(join("docs", rel));
    return { slug: rel.replace(/\.md$/, ""), title: text.match(/^#\s+(.+)$/m)?.[1] ?? rel, path: `docs/${rel}`, text };
  });
const categories = [...new Set(manifest.blocks.map((b) => b.category))];

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

const offsetProp = { type: "integer", description: "Opcional. Para continuar uma resposta longa: use o offset indicado no fim da resposta anterior." };
const clamp = (n, lo, hi, d) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.trunc(n))) : d);

// chunk: true → texto longo é paginado por caracteres com `offset`.
const tools = {
  search: {
    title: "Buscar no design system",
    description:
      "Busca no design system: componentes (exports), blocos de tela, guias e padrões. Comece por aqui. Retorna os melhores resultados com o próximo passo (get_component, get_block ou get_guide).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "O que procura, em português ou inglês: 'tabela com seleção', 'funil', 'login', 'DataGrid', 'tema escuro'." },
        kind: { type: "string", enum: ["all", "component", "block", "guide"], description: "Filtra o tipo de resultado. Padrão: all." },
        limit: { type: "integer", description: "Máximo de resultados (1–50). Padrão: 12." },
        offset: { type: "integer", description: "Pula os N primeiros resultados (paginação). Padrão: 0." },
      },
      required: ["query"],
    },
    run({ query, kind = "all", limit, offset }) {
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
      const lim = clamp(limit, 1, 50, 12);
      const off = clamp(offset, 0, 1e6, 0);
      const top = out.slice(off, off + lim).map(({ s, ...r }) => r);
      if (!top.length) return `Nada encontrado para "${query}"${off ? ` a partir de offset=${off}` : ""}. Tente termos mais gerais ("tabela", "gráfico", "formulário") ou list_blocks.`;
      const more = out.length > off + lim ? `\n\nMais ${out.length - off - lim} resultado(s): search ${JSON.stringify({ query, kind, limit: lim, offset: off + lim })}` : "";
      return JSON.stringify(top, null, 2) + more;
    },
  },

  get_component: {
    title: "Documentação de componente",
    chunk: true,
    description: "Documentação de um componente/export (props, tipos, padrões, exemplos de uso) ou de um módulo inteiro (ex.: 'charts', 'data-grid').",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Nome do export (DataGrid, AreaChart, useTheme) ou do módulo (charts, forms)." }, offset: offsetProp },
      required: ["name"],
    },
    run({ name }) {
      const mod = manifest.modules.find((m) => norm(m.name) === norm(name));
      if (mod) return read(`ai/components/${mod.name}.md`);
      const e = exportsIndex.find((x) => x.name === name) ?? exportsIndex.find((x) => norm(x.name) === norm(name));
      if (!e) {
        const near = exportsIndex.filter((x) => norm(x.name).includes(norm(name))).slice(0, 10).map((x) => x.name);
        throw new Error(`Export "${name}" não existe.${near.length ? ` Parecidos: ${near.join(", ")}.` : " Use search."}`);
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
    title: "Listar blocos de tela",
    chunk: true,
    description: `Lista os blocos (telas completas prontas para copiar) por categoria: ${categories.join(", ")}.`,
    inputSchema: { type: "object", properties: { category: { type: "string", description: "Opcional. Filtra por categoria (ex.: CRM)." }, offset: offsetProp } },
    run({ category }) {
      const list = manifest.blocks.filter((b) => !category || norm(b.category) === norm(category));
      if (!list.length) throw new Error(`Categoria "${category}" sem blocos. Categorias: ${categories.join(", ")}.`);
      return list.map((b) => `- ${b.slug} · ${b.title} (${b.category}): ${b.concept?.goal ?? b.description}`).join("\n");
    },
  },

  get_block: {
    title: "Detalhes de um bloco",
    chunk: true,
    description:
      "Detalhes de um bloco de tela: objetivo, padrões (anatomia), o que adaptar, o que evitar, componentes usados, arquivos. Com include_source=true devolve o código para copiar (respostas longas vêm em partes; continue com offset).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Ex.: crm-pipeline, saas-dashboard, auth-login." },
        include_source: { type: "boolean", description: "Inclui o código-fonte do bloco e dos arquivos locais. Padrão: false." },
        offset: offsetProp,
      },
      required: ["slug"],
    },
    run({ slug, include_source = false }) {
      const b = manifest.blocks.find((x) => x.slug === slug) ?? manifest.blocks.find((x) => norm(x.slug) === norm(slug));
      if (!b) throw new Error(`Bloco "${slug}" não existe. Use list_blocks ou search.`);
      let text = read(`ai/blocks/${b.slug}.md`);
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
    title: "Ler guia ou padrão",
    chunk: true,
    description:
      "Lê um guia/padrão: core (regras), anatomia-de-pagina, filtros, tabelas-e-colecoes, dashboards, formularios, tokens, temas-e-dark-mode, marca, escrita, receitas (crm, ats, erp, financeiro), instalacao, migracao, usar-com-ia… Sem slug, lista todos.",
    inputSchema: { type: "object", properties: { slug: { type: "string", description: "Ex.: 'core', 'anatomia-de-pagina' ou 'padroes/filtros'. Vazio lista os guias." }, offset: offsetProp } },
    run({ slug }) {
      if (!slug) return `Guias:\n${guides.map((g) => `- ${g.slug}: ${g.title}`).join("\n")}\n\nTambém: core (regras), tokens.`;
      if (["core", "regras"].includes(norm(slug))) return read("ai/core.md");
      if (norm(slug) === "tokens") return read("ai/tokens.md");
      const g = guides.find((x) => x.slug === slug) ?? guides.find((x) => x.slug.endsWith(`/${slug}`)) ?? guides.find((x) => norm(x.slug).includes(norm(slug)));
      if (!g) throw new Error(`Guia "${slug}" não encontrado. Chame get_guide sem slug para ver a lista.`);
      return g.text;
    },
  },

  get_tokens: {
    title: "Tokens do design system",
    chunk: true,
    description: "Tokens do DS: semânticos (claro/escuro e utilitário Tailwind), escala de texto, raios, presets de marca (data-brand) e de tipografia (data-type). Use antes de escolher qualquer cor/tamanho.",
    inputSchema: { type: "object", properties: { offset: offsetProp } },
    run() {
      const theme = read("src/lib/theme.ts");
      const presets = (name) => [...(theme.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const`))?.[1] ?? "").matchAll(/id: "([\w-]+)", label: "([^"]+)"/g)].map((m) => `${m[1]} (${m[2]})`);
      return `${read("ai/tokens.md")}\n\n## Presets\n\n- data-brand: ${presets("brandPresets").join(", ")}\n- data-type: ${presets("typePresets").join(", ")}\n\nUso: <html data-theme="light|dark|system" data-brand="…" data-type="…">. Para uma marca nova: theme_from_colors.`;
    },
  },

  theme_from_colors: {
    title: "Gerar tema de marca",
    description: "Gera o CSS de uma marca de cliente ([data-brand]) a partir da cor de ação e de destaque, com versão escura e checagem de contraste WCAG.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome da marca (vira data-brand). Ex.: acme." },
        primary: { type: "string", description: "Cor de ação em hex. Ex.: #0b5cff." },
        accent: { type: "string", description: "Opcional. Cor de destaque em hex." },
        radius: { type: "number", description: "Opcional. Escala de raio (0.4 sóbrio · 1 G4 · 1.3 amigável)." },
        font: { type: "string", description: 'Opcional. Fonte, ex.: "Inter", system-ui, sans-serif.' },
      },
      required: ["name", "primary"],
    },
    run({ name, primary, accent, radius, font }) {
      const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
      for (const [k, v] of [["primary", primary], ["accent", accent]]) if (v !== undefined && !hex.test(v)) throw new Error(`"${k}" precisa ser uma cor hex (#rrggbb). Recebido: ${v}`);
      const fix = (v) => (v && !v.startsWith("#") ? `#${v}` : v);
      const brand = deriveBrand(fix(primary), fix(accent ?? primary));
      const id = name.replace(/[^\w-]/g, "").toLowerCase() || "cliente";
      const css = brandCss(id, brand, { radius, font });
      const checks = [
        ["claro · texto sobre ação", brand.light.onPrimary, brand.light.primary],
        ["claro · destaque em texto", brand.light.accentDeep, "#ffffff"],
        ["escuro · texto sobre ação", brand.dark.onPrimary, brand.dark.primary],
        ["escuro · destaque em texto", brand.dark.accentDeep, "#18181b"],
      ].map(([l, a, b]) => `- ${l}: ${contrast(a, b).toFixed(2)}:1 ${contrast(a, b) >= 4.5 ? "✓" : "✗ (mín. 4,5)"}`);
      return `${css}\nContraste (WCAG AA):\n${checks.join("\n")}\n\nCole em themes.css (ou no CSS global) e use <html data-brand="${id}">.`;
    },
  },

  audit: {
    title: "Auditar código",
    description:
      "Audita um caminho do projeto: cores fixas, bg-white/text-white, paleta Tailwind crua, classes shadcn, <select> nativo, confirm/alert, formatação en-US, texto fora da escala. Use para medir migração e revisar telas. Prefira caminho absoluto (alguns clientes iniciam o servidor fora do projeto).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Pasta ou arquivo. Absoluto, ou relativo ao diretório em que o servidor foi iniciado." },
        limit: { type: "integer", description: "Máximo de achados listados (1–200). Padrão: 60." },
        offset: { type: "integer", description: "Pula os N primeiros achados (paginação). Padrão: 0." },
      },
      required: ["path"],
    },
    run({ path, limit, offset }) {
      const lim = clamp(limit, 1, 200, 60);
      const off = clamp(offset, 0, 1e7, 0);
      const r = audit(resolve(process.cwd(), path));
      const next = r.findings.length > off + lim ? { next: `audit ${JSON.stringify({ path, limit: lim, offset: off + lim })}` } : {};
      return JSON.stringify({ target: path, filesScanned: r.filesScanned, totals: r.totals, byRule: r.byRule, shown: `${Math.min(off + 1, r.findings.length)}–${Math.min(off + lim, r.findings.length)} de ${r.findings.length}`, ...next, findings: r.findings.slice(off, off + lim) }, null, 2);
    },
  },

  doctor: {
    title: "Diagnóstico do projeto",
    description: "Confere se um projeto está pronto para o DS: React 19, Tailwind v4, Base UI, import do CSS, tema, fonte, link do Next. Primeiro passo de uma migração.",
    inputSchema: { type: "object", properties: { path: { type: "string", description: "Pasta do projeto (absoluta de preferência). Padrão: diretório atual do servidor." } } },
    run({ path = "." }) {
      return JSON.stringify(doctor(resolve(process.cwd(), path)), null, 2);
    },
  },
};

/** Valida e normaliza argumentos contra o schema (tolerante: "12" → 12, "true" → true, extras ignorados). */
function checkArgs(schema, args) {
  const errors = [];
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    const p = schema.properties[k];
    if (!p || v === null || v === undefined) continue;
    let x = v;
    if ((p.type === "integer" || p.type === "number") && typeof x === "string" && x.trim() !== "" && Number.isFinite(Number(x))) x = Number(x);
    if (p.type === "boolean" && (x === "true" || x === "false")) x = x === "true";
    if (p.type === "string" && (typeof x === "number" || typeof x === "boolean")) x = String(x);
    const ok = p.type === "integer" || p.type === "number" ? typeof x === "number" && Number.isFinite(x) : typeof x === p.type;
    if (!ok) errors.push(`"${k}" deve ser ${p.type}`);
    else if (p.enum && !p.enum.includes(x)) errors.push(`"${k}" deve ser um de: ${p.enum.join(", ")}`);
    else out[k] = p.type === "integer" ? Math.trunc(x) : x;
  }
  for (const k of schema.required ?? []) if (out[k] === undefined || out[k] === "") errors.push(`"${k}" é obrigatório`);
  return { errors, args: out };
}

/** Corta texto longo em pedaços de MAX_CHARS, preferindo quebra de linha, com dica de continuação. */
function paginate(name, args, text) {
  const offset = clamp(args.offset, 0, Number.MAX_SAFE_INTEGER, 0);
  if (offset === 0 && text.length <= MAX_CHARS) return text;
  if (offset >= text.length) return `Fim do conteúdo (${text.length} caracteres; offset=${offset}).`;
  let end = Math.min(text.length, offset + MAX_CHARS);
  if (end < text.length) {
    const nl = text.lastIndexOf("\n", end);
    if (nl > offset + MAX_CHARS * 0.6) end = nl + 1;
  }
  const head = offset ? `[continuação: caracteres ${offset}–${end} de ${text.length}]\n\n` : "";
  const tail = end < text.length ? `\n\n[resposta parcial: ${end} de ${text.length} caracteres. Para continuar chame ${name} ${JSON.stringify({ ...args, offset: end })}]` : "";
  return head + text.slice(offset, end) + tail;
}

function callTool(name, rawArgs) {
  const t = tools[name];
  let args = rawArgs ?? {};
  if (typeof args === "string") {
    try {
      args = JSON.parse(args || "{}"); // alguns clientes mandam os argumentos serializados
    } catch {
      args = {};
    }
  }
  if (typeof args !== "object" || Array.isArray(args)) args = {};
  const { errors, args: clean } = checkArgs(t.inputSchema, args);
  if (errors.length) return { content: [{ type: "text", text: `Argumentos inválidos para ${name}: ${errors.join("; ")}.` }], isError: true };
  try {
    const text = String(t.run(clean));
    return { content: [{ type: "text", text: t.chunk ? paginate(name, clean, text) : text }] };
  } catch (e) {
    return { content: [{ type: "text", text: `Erro: ${e.message}` }], isError: true };
  }
}

/* ------------------------------------------------------------------ */
/* Recursos                                                            */
/* ------------------------------------------------------------------ */

const resources = [
  { uri: "g4os-ds://core", name: "core", title: "Regras e índice (core)", description: "Leia antes de escrever UI.", mimeType: "text/markdown", file: "ai/core.md" },
  { uri: "g4os-ds://tokens", name: "tokens", title: "Tokens", mimeType: "text/markdown", file: "ai/tokens.md" },
  { uri: "g4os-ds://llms", name: "llms", title: "Índice para LLMs", mimeType: "text/plain", file: "ai/llms.txt" },
  ...manifest.modules.map((m) => ({ uri: `g4os-ds://components/${m.name}`, name: `components/${m.name}`, title: `Componentes · ${m.name}`, mimeType: "text/markdown", file: `ai/components/${m.name}.md` })),
  ...manifest.blocks.map((b) => ({ uri: `g4os-ds://blocks/${b.slug}`, name: `blocks/${b.slug}`, title: `Bloco · ${b.title}`, mimeType: "text/markdown", file: `ai/blocks/${b.slug}.md` })),
  ...guides.map((g) => ({ uri: `g4os-ds://guides/${g.slug}`, name: `guides/${g.slug}`, title: `Guia · ${g.title}`, mimeType: "text/markdown", file: g.path })),
];

const resourceTemplates = [
  { uriTemplate: "g4os-ds://components/{module}", name: "componentes", title: "Componentes por módulo", mimeType: "text/markdown", values: () => manifest.modules.map((m) => m.name) },
  { uriTemplate: "g4os-ds://blocks/{slug}", name: "blocos", title: "Bloco de tela", mimeType: "text/markdown", values: () => manifest.blocks.map((b) => b.slug) },
  { uriTemplate: "g4os-ds://guides/{slug}", name: "guias", title: "Guia ou padrão", mimeType: "text/markdown", values: () => guides.map((g) => g.slug) },
];

/* ------------------------------------------------------------------ */
/* Prompts                                                             */
/* ------------------------------------------------------------------ */

const prompts = {
  "adaptar-projeto": {
    title: "Adaptar projeto ao G4OS-DS",
    description: "Roteiro para migrar um app existente para o G4OS-DS: diagnóstico, regras, auditoria e troca guiada.",
    arguments: [
      { name: "path", description: "Pasta do projeto (absoluta de preferência).", required: false },
      { name: "objetivo", description: "O que priorizar (ex.: 'só a tela de clientes', 'tema escuro').", required: false },
    ],
    text: ({ path = ".", objetivo }) => `Adapte o projeto em ${path} ao design system G4OS-DS (@g4ai/ds) usando as ferramentas do servidor MCP g4os-ds.${objetivo ? `\nPrioridade: ${objetivo}.` : ""}

1. doctor { "path": "${path}" } e resolva o que faltar (React 19, Tailwind v4, Base UI, import do CSS, tema, fonte).
2. get_guide { "slug": "core" } e get_guide { "slug": "migracao" }: regras e ordem da migração.
3. audit { "path": "${path}" } para medir o ponto de partida; agrupe os achados por regra.
4. Troque por tela, da mais usada para a menos: para cada uma, search pelo que ela é (ex.: "tabela de clientes") e prefira bloco pronto (get_block) > composição de componentes (get_component) > tokens.
5. Use só tokens semânticos (bg-surface, text-muted, bg-primary text-on-primary), textos em pt-BR e uma anatomia de página (get_guide { "slug": "anatomia-de-pagina" }).
6. Rode audit de novo no que mudou e só termine com zero erros. Resuma o antes/depois.`,
  },
  "criar-tela": {
    title: "Criar tela com o G4OS-DS",
    description: "Cria uma tela nova partindo do bloco mais próximo e das regras do DS.",
    arguments: [
      { name: "descricao", description: "A tela que você quer (ex.: 'pipeline de vendas com filtros').", required: true },
      { name: "categoria", description: `Opcional: ${categories.join(", ")}.`, required: false },
      { name: "arquivo", description: "Opcional: arquivo de destino.", required: false },
    ],
    text: ({ descricao, categoria, arquivo }) => `Crie esta tela com o G4OS-DS (@g4ai/ds): ${descricao}${categoria ? ` (categoria ${categoria})` : ""}.${arquivo ? `\nArquivo de destino: ${arquivo}.` : ""}

1. get_guide { "slug": "core" } (regras obrigatórias).
2. search { "query": ${JSON.stringify(descricao)}, "kind": "block" }${categoria ? ` e list_blocks { "category": "${categoria}" }` : ""}. Se houver bloco próximo, get_block { "slug": "…", "include_source": true } e adapte; não comece do zero.
3. Sem bloco: get_guide { "slug": "anatomia-de-pagina" } e componha com componentes do DS (search/get_component). Nada de HTML cru estilizado à mão.
4. Cores e tamanhos só por tokens (get_tokens). Textos em pt-BR, números e datas em formato brasileiro.
5. Estados: vazio, carregando e erro. Funcione no claro e no escuro.
6. Termine rodando audit no arquivo criado e corrija até zerar os erros.`,
  },
  "revisar-tela": {
    title: "Revisar tela",
    description: "Revisa uma tela existente contra as regras do G4OS-DS e propõe correções.",
    arguments: [{ name: "path", description: "Arquivo ou pasta da tela.", required: true }],
    text: ({ path }) => `Revise ${path} contra o G4OS-DS (@g4ai/ds) usando o servidor MCP g4os-ds.

1. audit { "path": "${path}" } e get_guide { "slug": "core" }.
2. Confira a anatomia (get_guide { "slug": "anatomia-de-pagina" }), estados (vazio, carregando, erro), escrita em pt-BR (get_guide { "slug": "escrita" }) e acessibilidade (get_guide { "slug": "acessibilidade" }).
3. Compare com o bloco mais parecido (search … kind "block" → get_block) e aponte o que diverge sem motivo.
4. Liste os problemas por gravidade (erro, aviso, sugestão) com arquivo:linha e a correção usando componentes/tokens do DS. Corrija se eu pedir.`,
  },
};

function getPrompt(name, args = {}) {
  const p = prompts[name];
  if (!p) return null;
  const missing = p.arguments.filter((a) => a.required && !String(args[a.name] ?? "").trim()).map((a) => a.name);
  if (missing.length) throw Object.assign(new Error(`Argumento obrigatório ausente: ${missing.join(", ")}`), { code: -32602 });
  return { description: p.description, messages: [{ role: "user", content: { type: "text", text: p.text(args) } }] };
}

function complete(ref = {}, argument = {}) {
  const value = norm(argument.value);
  let values = [];
  if (ref.type === "ref/prompt") {
    if (argument.name === "categoria") values = categories;
    if (argument.name === "descricao") values = manifest.blocks.map((b) => b.title);
  } else if (ref.type === "ref/resource") {
    values = resourceTemplates.find((t) => t.uriTemplate === ref.uri)?.values() ?? [];
  }
  const hits = values.filter((v) => norm(v).includes(value));
  return { completion: { values: hits.slice(0, 100), total: hits.length, hasMore: hits.length > 100 } };
}

/* ------------------------------------------------------------------ */
/* JSON-RPC                                                            */
/* ------------------------------------------------------------------ */

const instructions = `G4OS-DS ${pkg.version} (@g4ai/ds): design system para apps G4 OS (CRM, ATS, ERP, financeiro, IA). Antes de escrever UI: get_guide "core" (regras), depois search → get_component/get_block. Prefira bloco pronto > composição de componentes > tokens. Use só tokens semânticos (bg-surface, text-muted, bg-primary text-on-primary), pt-BR, e siga uma anatomia de página (get_guide "anatomia-de-pagina"). Valide com audit. Respostas longas vêm em partes: continue com offset.`;

const LEVELS = ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"];
const newer = (v, than) => PROTOCOLS.indexOf(v) <= PROTOCOLS.indexOf(than); // lista vai do mais novo ao mais antigo

class RpcError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const page = (items, cursor) => {
  if (cursor === undefined || cursor === null) return items;
  const n = Number.parseInt(Buffer.from(String(cursor), "base64").toString("utf8"), 10);
  if (!Number.isFinite(n) || n < 0) throw new RpcError(-32602, "cursor inválido");
  return items.slice(n);
};

export function createSession(notify = () => {}) {
  const session = { protocolVersion: PROTOCOLS[1], logLevel: null, initialized: false };

  function result(method, params) {
    switch (method) {
      case "initialize": {
        const asked = params.protocolVersion;
        session.protocolVersion = PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0];
        session.client = params.clientInfo;
        const caps = { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false }, prompts: { listChanged: false }, logging: {} };
        if (newer(session.protocolVersion, "2025-03-26")) caps.completions = {};
        return { protocolVersion: session.protocolVersion, capabilities: caps, serverInfo: { name: "g4os-ds", title: "G4OS-DS", version: pkg.version }, instructions };
      }
      case "ping":
        return {};
      case "tools/list": {
        const rich = newer(session.protocolVersion, "2025-03-26");
        const list = Object.entries(tools).map(([name, t]) => ({
          name,
          ...(newer(session.protocolVersion, "2025-06-18") ? { title: t.title } : {}),
          description: t.description,
          inputSchema: t.inputSchema,
          ...(rich ? { annotations: { title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } } : {}),
        }));
        return { tools: page(list, params.cursor) };
      }
      case "tools/call": {
        if (typeof params.name !== "string" || !tools[params.name]) throw new RpcError(-32602, `Ferramenta desconhecida: ${params.name}. Disponíveis: ${Object.keys(tools).join(", ")}`);
        const r = callTool(params.name, params.arguments);
        if (r.isError) notify("error", `${params.name}: ${r.content[0].text}`);
        return r;
      }
      case "resources/list":
        return { resources: page(resources.map(({ file, title, ...r }) => (newer(session.protocolVersion, "2025-06-18") ? { ...r, title } : { ...r, description: r.description ?? title })), params.cursor) };
      case "resources/templates/list":
        return { resourceTemplates: page(resourceTemplates.map(({ values, title, ...t }) => (newer(session.protocolVersion, "2025-06-18") ? { ...t, title } : { ...t, description: title })), params.cursor) };
      case "resources/read": {
        if (typeof params.uri !== "string") throw new RpcError(-32602, "uri é obrigatório");
        const r = resources.find((x) => x.uri === params.uri) ?? resources.find((x) => x.uri === params.uri.replace(/\/+$/, ""));
        if (!r) throw new RpcError(-32002, `Recurso não encontrado: ${params.uri}`);
        return { contents: [{ uri: r.uri, mimeType: r.mimeType, text: read(r.file) }] };
      }
      case "resources/subscribe":
      case "resources/unsubscribe":
        throw new RpcError(-32601, "Assinatura de recursos não suportada (o conteúdo não muda durante a sessão).");
      case "prompts/list":
        return { prompts: page(Object.entries(prompts).map(([name, p]) => ({ name, ...(newer(session.protocolVersion, "2025-06-18") ? { title: p.title } : {}), description: p.description, arguments: p.arguments })), params.cursor) };
      case "prompts/get": {
        const r = getPrompt(params.name, params.arguments ?? {});
        if (!r) throw new RpcError(-32602, `Prompt desconhecido: ${params.name}. Disponíveis: ${Object.keys(prompts).join(", ")}`);
        return r;
      }
      case "logging/setLevel":
        if (!LEVELS.includes(params.level)) throw new RpcError(-32602, `level inválido. Use: ${LEVELS.join(", ")}`);
        session.logLevel = params.level;
        return {};
      case "completion/complete":
        return complete(params.ref, params.argument);
      default:
        throw new RpcError(-32601, `Método não suportado: ${method}`);
    }
  }

  /** Processa uma mensagem JSON-RPC já parseada. Devolve a resposta (ou null para notificações/respostas). */
  function handle(msg) {
    if (!msg || typeof msg !== "object" || Array.isArray(msg)) return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Requisição inválida" } };
    const isRequest = "id" in msg && msg.id !== undefined;
    if (typeof msg.method !== "string") {
      if ("result" in msg || "error" in msg) return null; // resposta do cliente (não fazemos requisições)
      return { jsonrpc: "2.0", id: isRequest ? msg.id : null, error: { code: -32600, message: "Requisição inválida: falta method" } };
    }
    if (!isRequest) {
      if (msg.method === "notifications/initialized") session.initialized = true;
      return null; // notificações nunca têm resposta
    }
    const params = msg.params && typeof msg.params === "object" ? msg.params : {};
    try {
      return { jsonrpc: "2.0", id: msg.id, result: result(msg.method, params) };
    } catch (e) {
      const code = typeof e.code === "number" ? e.code : -32603;
      if (code === -32603) log("erro interno em", msg.method, e.stack ?? e.message);
      return { jsonrpc: "2.0", id: msg.id, error: { code, message: e.message } };
    }
  }

  /** Processa um texto JSON (mensagem única ou lote). Devolve o que enviar de volta, ou null. */
  function handleText(text) {
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } };
    }
    if (Array.isArray(msg)) {
      if (!msg.length) return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Lote vazio" } };
      const out = msg.map(handle).filter(Boolean);
      return out.length ? out : null;
    }
    return handle(msg);
  }

  // Só envia logs depois que o cliente pede (logging/setLevel): evita ruído em clientes que exibem tudo.
  const shouldLog = (level) => session.logLevel !== null && LEVELS.indexOf(level) >= LEVELS.indexOf(session.logLevel);
  return { session, handle, handleText, shouldLog };
}

/* ------------------------------------------------------------------ */
/* Transporte stdio                                                    */
/* ------------------------------------------------------------------ */

export function startMcp() {
  // stdout é exclusivo do protocolo: qualquer console.log perdido vai para stderr.
  for (const k of ["log", "info", "debug"]) console[k] = (...a) => process.stderr.write(`${a.map(String).join(" ")}\n`);
  const write = (obj) => process.stdout.write(`${JSON.stringify(obj)}\n`);
  let rpc;
  const notify = (level, data) => rpc?.shouldLog(level) && write({ jsonrpc: "2.0", method: "notifications/message", params: { level, logger: "g4os-ds", data } });
  rpc = createSession(notify);

  process.stdout.on("error", (e) => {
    if (e.code === "EPIPE") process.exit(0); // cliente fechou o pipe
    throw e;
  });
  let buf = "";
  const flush = (line) => {
    line = line.replace(/^﻿/, "").trim();
    if (!line) return;
    const out = rpc.handleText(line);
    if (out) write(out);
  };
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      flush(buf.slice(0, i));
      buf = buf.slice(i + 1);
    }
  });
  // EOF: processa a última linha (sem \n) e sai quando o stdout esvaziar.
  process.stdin.on("end", () => {
    flush(buf);
    buf = "";
    process.stdout.write("", () => process.exit(0));
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"]) process.on(sig, () => process.exit(0));
}

/* ------------------------------------------------------------------ */
/* Transporte Streamable HTTP (sem SSE: respostas em JSON)             */
/* ------------------------------------------------------------------ */

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);
const hostOf = (h) => {
  try {
    return new URL(h.includes("://") ? h : `http://${h}`).hostname;
  } catch {
    return "";
  }
};

export function startHttp({ port = 3845, host = "127.0.0.1", path = "/mcp" } = {}) {
  const sessions = new Map();
  const localOnly = LOCAL.has(host);
  const server = createServer((req, res) => {
    const origin = req.headers.origin;
    const cors = {};
    if (origin && LOCAL.has(hostOf(origin))) {
      Object.assign(cors, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
        "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
        Vary: "Origin",
      });
    }
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { ...cors, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers });
      res.end(body === undefined ? undefined : JSON.stringify(body));
    };
    const fail = (status, code, message) => send(status, { jsonrpc: "2.0", id: null, error: { code, message } });

    // Proteção contra DNS rebinding: só aceita Origin local (e Host local quando escuta só em localhost).
    if (origin && !LOCAL.has(hostOf(origin))) return fail(403, -32000, "Origin não permitida");
    if (localOnly && req.headers.host && !LOCAL.has(hostOf(req.headers.host))) return fail(403, -32000, "Host não permitido");

    const url = new URL(req.url ?? "/", "http://localhost");
    if (req.method === "OPTIONS") return send(204);
    if (url.pathname === "/health" && req.method === "GET") return send(200, { ok: true, name: "g4os-ds", version: pkg.version });
    if (url.pathname !== path && url.pathname !== `${path}/`) return fail(404, -32000, `Use ${path}`);

    const sid = req.headers["mcp-session-id"];
    if (req.method === "GET") return send(405, undefined, { Allow: "POST, DELETE, OPTIONS" }); // sem stream SSE do servidor
    if (req.method === "DELETE") {
      if (sid && sessions.delete(sid)) return send(200, {});
      return fail(404, -32001, "Sessão não encontrada");
    }
    if (req.method !== "POST") return send(405, undefined, { Allow: "POST, GET, DELETE, OPTIONS" });

    const pv = req.headers["mcp-protocol-version"];
    if (pv && !PROTOCOLS.includes(pv)) return fail(400, -32600, `MCP-Protocol-Version não suportada: ${pv}`);

    let body = "";
    req.setEncoding("utf8");
    req.on("data", (c) => {
      body += c;
      if (body.length > 4e6) req.destroy();
    });
    req.on("end", () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return fail(400, -32700, "JSON inválido");
      }
      const msgs = Array.isArray(parsed) ? parsed : [parsed];
      const isInit = msgs.some((m) => m && m.method === "initialize");
      let entry;
      const headers = {};
      if (isInit) {
        const id = randomUUID();
        entry = createSession();
        sessions.set(id, entry);
        headers["Mcp-Session-Id"] = id;
      } else if (sid) {
        entry = sessions.get(sid);
        if (!entry) return fail(404, -32001, "Sessão não encontrada ou expirada: reinicialize");
      } else {
        entry = createSession(); // modo sem sessão: cada requisição é independente
      }
      const out = entry.handleText(body);
      if (out === null) return send(202, undefined, headers);
      send(200, out, headers);
    });
  });
  server.listen(port, host, () => {
    const shown = host.includes(":") ? `[${host}]` : host;
    log(`HTTP em http://${shown}:${server.address().port}${path} (Streamable HTTP, protocolos ${PROTOCOLS.join(", ")})`);
  });
  for (const sig of ["SIGTERM", "SIGINT", "SIGHUP"])
    process.on(sig, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 500).unref();
    });
  return server;
}

/** Interpreta os argumentos do subcomando `mcp` (usado por cli.mjs e na execução direta). */
export function runFromArgs(argv) {
  const opt = (n) => {
    const i = argv.indexOf(n);
    if (i >= 0) return argv[i + 1];
    return argv.find((a) => a.startsWith(`${n}=`))?.slice(n.length + 1);
  };
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stderr.write(`g4os-ds mcp            servidor MCP via stdio (padrão; para Claude Code, Codex, Cursor, VS Code, Gemini CLI…)
g4os-ds mcp --http     Streamable HTTP em http://127.0.0.1:3845/mcp
            --port N   porta (padrão 3845; também env PORT)
            --host H   interface (padrão 127.0.0.1; use 0.0.0.0 só em rede confiável)
`);
    return;
  }
  if (argv.includes("--http")) return startHttp({ port: Number(opt("--port") ?? process.env.PORT ?? 3845), host: opt("--host") ?? "127.0.0.1" });
  startMcp();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) runFromArgs(process.argv.slice(2));
