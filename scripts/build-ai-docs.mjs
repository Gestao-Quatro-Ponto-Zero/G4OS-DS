#!/usr/bin/env node
// Gera ai/: o guia que agentes de IA (em QUALQUER repositório) leem para usar o DS.
//   node scripts/build-ai-docs.mjs            escreve ai/
//   node scripts/build-ai-docs.mjs --check    regenera em memória e falha se ai/ estiver desatualizado
// Saída determinística (ordenada, sem data) para diff limpo. Sem rede.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const outDir = join(root, "ai");
const check = process.argv.includes("--check");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const read = (p) => readFileSync(p, "utf8");
const rel = (p) => relative(root, p).split("\\").join("/");

/* ------------------------------------------------------------------ */
/* Módulos exportados por src/index.ts                                 */
/* ------------------------------------------------------------------ */

const indexSrc = read(join(src, "index.ts"));
const modulePaths = [...indexSrc.matchAll(/export \* from "\.\/(components|lib)\/([\w-]+)"/g)].map(([, dir, name]) => ({ dir, name }));
const moduleFile = ({ dir, name }) => [join(src, dir, `${name}.tsx`), join(src, dir, `${name}.ts`)].find(existsSync);

// Resumo de uma linha por módulo (o cabeçalho do arquivo às vezes é longo demais).
const moduleSummary = {
  primitives: "Base visual: Button, IconButton, Badge, Dot, Avatar, EntityMark, Card, Metric, StatGrid, Meter, Empty, Page, Section, Kbd, DsLink/setLinkComponent, tons.",
  overlays: "Modal, ConfirmDialog, Drawer, Popover (Base UI).",
  forms: "Formulário padrão: FieldBlock, FieldGrid, Select, Combobox, Checkbox, Switch, SearchInput, fieldClass.",
  inputs: "Entradas especializadas: TextField, PasswordField, NumberField, CurrencyField, MaskedField (CPF/CNPJ/CEP/telefone), OtpInput, TagInput, Slider, RadioGroup, ChoiceCards, ToggleGroup, FileDropzone, Rating, InlineEdit.",
  navigation: "Navegação: Sidebar, PageHeading, StickyHeader, Breadcrumb, ContextBar, Tabs, SegmentedControl, ActionMenu, ProductMark.",
  collections: "Coleções: TableToolbar, FacetFilter, DataTable (vira cards no celular), DisplayControls, ListPanel/ListRow, Kanban.",
  feedback: "Feedback de operação: notify/Toaster, Callout, useOperation, OperationButton, OperationFeedback, Skeleton.",
  status: "Status de trabalho (5 estados), StatusLabel, StatusBar, HealthDot, Stepper, NextStep, Timeline.",
  "date-picker": "DatePicker (Calendar próprio do DS) e utilitários de data ISO.",
  layout: "Casca: AppShell, ShellBanner, EntityHeader, ReadingColumn, SplitLayout.",
  charts: "Gráficos SVG sem dependência: AreaChart, LineChart, BarChart, Sparkline, BarList, DonutChart, FunnelChart, CalendarHeatmap, ProgressRing.",
  "charts-advanced": "Gráficos avançados: Treemap, WaterfallChart, ScatterChart, RadarChart, GaugeChart, BulletChart, SankeyChart, HeatmapMatrix, ComboChart, ProportionBar, GanttChart.",
  dashboard: "Dashboard: KpiCard, KpiGrid, Delta, ChartCard, GoalMeter, ActivityFeed, Leaderboard, CompareStat.",
  data: "Estado de tabela: useSort, SortHeader, useSelection, selectionColumn, BulkBar, usePagination, Pagination, PropertyList.",
  pipeline: "Pipelines por etapa: StagePath, RecordCard.",
  states: "Estados de tela e avisos: StateView e presets (404, erro, sem acesso, offline), Spinner, LoadingState, Banner, InlineMessage, AlertCard, notifyPromise.",
  "overlays-extra": "Tooltip, HoverCard, Menu (submenus, checkbox/radio), ContextMenu, Menubar, Sheet, CommandPalette, Lightbox.",
  structure: "Estrutura: Separator, ScrollArea, Label, FieldSet/FieldGroup/FieldSeparator, Item (mídia · título · ações), Table estática, Prose (texto longo).",
  controls: "Controles: Toggle, ButtonGroup, InputGroup (complementos dentro do campo), ColorPicker.",
  "navigation-extra": "NavigationMenu: navegação de site/portal com painéis de links.",
  sortable: "SortableList: reordenar por arraste e teclado, com anúncios pt-BR.",
  questionnaire: "Questionnaire: perguntas uma por vez (escolha, múltipla, livre, condicionais).",
  disclosure: "Revelação progressiva: Accordion, Collapsible, TreeView, DescriptionToggle.",
  media: "Mídia: Carousel, SlideDeck + helpers de slide, ImageGallery, FileCard, AspectFrame.",
  filters: "Filtros estruturados: FilterBar, filtros ativos, construtor campo/operador/valor, visões salvas, período, estado na URL.",
  search: "Busca: SearchPalette (⌘K global com escopos e prévia) e busca local de tabela (\"/\").",
  ai: "Padrões de IA: AskAI, mensagens de chat, SystemMessage, AgentTrace, ToolCallsSection, citações, sugestões.",
  interactive: "Interação e marketing: InputModal, AnimatedModal, LimitDialog, ImageSphere, Hero, FeatureGrid, BeforeAfter, NumberTicker.",
  theme: "ThemeToggle (claro/escuro/sistema).",
  cn: "cn(): concatena classes.",
  portal: "usePortalContainer: portais dentro de <dialog> aberto.",
  text: "Texto pt-BR: normalize (busca sem acento), plural, initials.",
  format: "Formatação pt-BR: formatCurrency, formatNumber, formatPercent, formatDelta, formatCompact, formatDate, formatRelative.",
  theme_lib: "Tema e marca: useTheme, applyTheme, themeScript, brandPresets.",
};

/* ------------------------------------------------------------------ */
/* TypeScript: exports, JSDoc e props próprias                         */
/* ------------------------------------------------------------------ */

const files = modulePaths.map(moduleFile).filter(Boolean);
const program = ts.createProgram(files, {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
});
const checker = program.getTypeChecker();
const doc = (sym) => ts.displayPartsToString(sym.getDocumentationComment(checker)).replace(/\s+\n/g, "\n").trim();
const firstSentence = (s) => {
  const flat = s.replace(/\s+/g, " ").trim();
  const m = flat.match(/^(.{20,220}?[.!?])(\s|$)/);
  return (m ? m[1] : flat.slice(0, 220)).trim();
};
const typeText = (t, node) => {
  let s = checker.typeToString(t, node, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
  s = s.replace(/import\("[^"]+"\)\./g, "");
  return s.length > 110 ? `${s.slice(0, 107)}…` : s;
};
const isOwn = (decl) => decl && decl.getSourceFile().fileName.startsWith(src);

function propsOf(fnDecl) {
  const param = fnDecl?.parameters?.[0];
  if (!param) return [];
  const defaults = {};
  if (ts.isObjectBindingPattern(param.name)) {
    for (const el of param.name.elements) {
      const key = (el.propertyName ?? el.name).getText();
      if (el.initializer) defaults[key] = el.initializer.getText().replace(/\s+/g, " ").slice(0, 40);
    }
  }
  const type = checker.getTypeAtLocation(param);
  const out = [];
  for (const p of checker.getPropertiesOfType(type)) {
    const decl = p.valueDeclaration ?? p.declarations?.[0];
    if (!isOwn(decl)) continue; // pula atributos HTML herdados (onClick, className de <button>…)
    const optional = (p.flags & ts.SymbolFlags.Optional) !== 0;
    out.push({
      name: p.getName(),
      type: typeText(checker.getTypeOfSymbolAtLocation(p, param), param),
      required: !optional,
      default: defaults[p.getName()] ?? null,
      description: firstSentence(doc(p)) || null,
    });
  }
  return out.sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
}

function describeExport(sym) {
  const target = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
  const decl = target.valueDeclaration ?? target.declarations?.[0];
  const name = sym.getName();
  const summary = firstSentence(doc(target)) || null;
  if (!decl) return { name, kind: "value", summary };
  if (ts.isTypeAliasDeclaration(decl) || ts.isInterfaceDeclaration(decl)) {
    const body = ts.isTypeAliasDeclaration(decl) ? decl.type.getText() : `{ ${decl.members.map((m) => m.getText()).join(" ")} }`;
    const flat = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\s+/g, " ").trim();
    return { name, kind: "type", summary, definition: flat.length > 400 ? `${flat.slice(0, 397)}…` : flat };
  }
  if (ts.isClassDeclaration(decl)) return { name, kind: "class", summary };
  let fn = ts.isFunctionDeclaration(decl) ? decl : null;
  if (!fn && ts.isVariableDeclaration(decl) && decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) fn = decl.initializer;
  // forwardRef(function X(props, ref) {…}) / memo(…): documenta a função interna.
  if (!fn && ts.isVariableDeclaration(decl) && decl.initializer && ts.isCallExpression(decl.initializer) && /^(forwardRef|memo)$/.test(decl.initializer.expression.getText().replace(/^React\./, ""))) {
    const inner = decl.initializer.arguments[0];
    if (inner && (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner))) fn = inner;
  }
  if (fn) {
    const isComponent = /^[A-Z]/.test(name);
    const isHook = /^use[A-Z]/.test(name);
    const sig = checker.getSignatureFromDeclaration(fn);
    const params = fn.parameters.map((p) => `${p.name.getText().length > 30 ? "props" : p.name.getText()}${p.questionToken || p.initializer ? "?" : ""}`).join(", ");
    return {
      name,
      kind: isComponent ? "component" : isHook ? "hook" : "function",
      summary,
      ...(isComponent ? { props: propsOf(fn) } : { signature: `${name}(${params})${sig ? `: ${typeText(checker.getReturnTypeOfSignature(sig), fn)}` : ""}` }),
    };
  }
  return { name, kind: "const", summary };
}

const modules = modulePaths
  .map((m) => {
    const file = moduleFile(m);
    if (!file) return null;
    const sf = program.getSourceFile(file);
    const modSym = sf && checker.getSymbolAtLocation(sf);
    const exports = modSym ? checker.getExportsOfModule(modSym).map(describeExport) : [];
    exports.sort((a, b) => a.name.localeCompare(b.name));
    const key = m.dir === "lib" && m.name === "theme" ? "theme_lib" : m.name;
    const header = read(file).match(/\/\*\*?\s*\n?([\s\S]*?)\*\//)?.[1].replace(/^\s*\* ?/gm, "").trim() ?? "";
    return { name: m.dir === "lib" ? `lib-${m.name}` : m.name, file: rel(file), summary: moduleSummary[key] ?? firstSentence(header), exports };
  })
  .filter(Boolean);

/* ------------------------------------------------------------------ */
/* Exemplos de uso tirados das páginas do showcase (Demo code=…)       */
/* ------------------------------------------------------------------ */

const pageDir = join(root, "showcase", "pages");
const snippets = [];
if (existsSync(pageDir)) {
  for (const f of readdirSync(pageDir).filter((f) => f.endsWith(".tsx")).sort()) {
    const s = read(join(pageDir, f));
    for (const m of s.matchAll(/code=\{`([\s\S]*?)`\}|code="([^"]+)"/g)) {
      const code = (m[1] ?? m[2]).replace(/\\`/g, "`").replace(/\\\$\{/g, "${").trim();
      if (code.length > 12) snippets.push({ page: f.replace(".tsx", ""), code });
    }
  }
}
const snippetFor = (name) => {
  const re = new RegExp(`(<${name}[\\s>/]|\\b${name}\\()`);
  const hit = snippets.filter((s) => re.test(s.code)).sort((a, b) => a.code.length - b.code.length || a.page.localeCompare(b.page))[0];
  if (!hit) return null;
  const lines = hit.code.split("\n");
  return { page: hit.page, code: lines.length > 24 ? `${lines.slice(0, 24).join("\n")}\n// …` : hit.code };
};

/* ------------------------------------------------------------------ */
/* Blocos                                                              */
/* ------------------------------------------------------------------ */

const allExports = new Set(modules.flatMap((m) => m.exports.map((e) => e.name)));
const blockDir = join(src, "blocks");
const blocks = existsSync(blockDir)
  ? readdirSync(blockDir)
      .filter((f) => f.endsWith(".tsx"))
      .sort()
      .map((f) => {
        const s = read(join(blockDir, f));
        const metaSrc = s.match(/export const meta[^=]*=\s*\{([\s\S]*?)\}\s*(as const)?;/)?.[1] ?? "";
        const field = (k) => metaSrc.match(new RegExp(`${k}:\\s*"((?:[^"\\\\]|\\\\.)*)"`))?.[1] ?? null;
        const imports = [...s.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@g4ai\/ds"/g)]
          .flatMap((m) => m[1].split(","))
          .map((x) => x.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])
          .filter((x) => x && allExports.has(x))
          .sort();
        // meta.concept: { goal, patterns[], adapt[], avoid[] } (aba Conceito do showcase).
        const unq = (x) => x.replace(/\\(["\\])/g, "$1");
        const strs = (body) => [...(body ?? "").matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => unq(m[1]));
        const conceptSrc = s.match(/concept:\s*\{([\s\S]*?)\n\s*\},?\s*\n/)?.[1] ?? "";
        const arr = (k) => strs(conceptSrc.match(new RegExp(`${k}:\\s*\\[([\\s\\S]*?)\\]`))?.[1]);
        const goal = conceptSrc.match(/goal:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
        const concept = goal ? { goal: unq(goal), patterns: arr("patterns"), adapt: arr("adapt"), avoid: arr("avoid") } : null;
        return { slug: f.replace(".tsx", ""), file: `src/blocks/${f}`, title: field("title"), description: field("description"), category: field("category"), concept, uses: [...new Set(imports)] };
      })
  : [];

/* ------------------------------------------------------------------ */
/* Tokens (lidos do CSS)                                               */
/* ------------------------------------------------------------------ */

const tokensCss = read(join(src, "styles", "tokens.css"));
const cssBlock = (re) => {
  const m = tokensCss.match(re);
  if (!m) return "";
  const start = m.index + m[0].length;
  return tokensCss.slice(start, tokensCss.indexOf("\n}", start));
};
const prim = Object.fromEntries([...cssBlock(/\n:root \{/).matchAll(/--(g4-[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
const semanticBlock = (body) =>
  [...body.matchAll(/--ds-([\w-]+):\s*([^;]+);(?:\s*\/\*\s*(.*?)\s*\*\/)?/g)].map(([, name, raw, note]) => {
    const r = raw.trim().match(/^var\(--(g4-[\w-]+)\)$/);
    return { name, value: r ? prim[r[1]] : raw.trim(), note: note ?? null };
  });
const light = semanticBlock(cssBlock(/\n:root,\n\[data-theme="light"\] \{/));
const darkMap = Object.fromEntries(semanticBlock(cssBlock(/\n\[data-theme="dark"\] \{/)).map((t) => [t.name, t.value]));
const bridge = Object.fromEntries([...tokensCss.matchAll(/--color-([\w-]+):\s*var\(--ds-([\w-]+)\)/g)].map(([, util, ds]) => [ds, util]));
const textScale = [...tokensCss.matchAll(/--text-([a-z]+):\s*([\d.]+)px;\s*\/\*\s*(.*?)\s*\*\//g)].map(([, name, px, note]) => ({ name, px: Number(px), note }));
const radii = [...tokensCss.matchAll(/--radius-(chip|control|tile|card|shell):\s*calc\(([\d.]+)px[^;]*;\s*\/\*\s*(.*?)\s*\*\//g)].map(([, name, px, note]) => ({ name, px: Number(px), note }));
const brands = [...read(join(src, "styles", "themes.css")).matchAll(/\[data-brand="([\w-]+)"\] \{/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i);
const tokens = {
  semantic: light.map((t) => ({ token: `--ds-${t.name}`, utility: bridge[t.name] ?? null, light: t.value, dark: darkMap[t.name] ?? null, note: t.note })),
  text: textScale,
  radius: radii,
  brands,
};

/* ------------------------------------------------------------------ */
/* Renderização                                                        */
/* ------------------------------------------------------------------ */

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const files_ = new Map();
const out = (p, content) => files_.set(p, content.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n");

// Notas de uso (certo/errado) por export: scripts/data/usage-notes.json
const usageNotes = Object.fromEntries(Object.entries(JSON.parse(readFileSync(join(root, "scripts", "data", "usage-notes.json"), "utf8"))).filter(([k]) => !k.startsWith("$")));
{
  const known = new Set(modules.flatMap((m) => m.exports.map((e) => e.name)));
  const missing = Object.keys(usageNotes).filter((k) => !known.has(k));
  if (missing.length) throw new Error(`scripts/data/usage-notes.json cita exports que não existem: ${missing.join(", ")}`);
}

function renderModule(m) {
  const lines = [`# ${m.name}`, "", `Arquivo: \`${m.file}\` · importe de \`@g4ai/ds\`.`, "", m.summary, ""];
  for (const e of m.exports) {
    lines.push(`## ${e.name}${e.kind === "component" ? "" : ` (${e.kind})`}`, "");
    if (e.summary) lines.push(e.summary, "");
    if (e.signature) lines.push("```ts", e.signature, "```", "");
    if (e.definition) lines.push("```ts", `type ${e.name} = ${e.definition}`, "```", "");
    if (e.props?.length) {
      lines.push("| Prop | Tipo | Padrão | Descrição |", "| --- | --- | --- | --- |");
      for (const p of e.props) lines.push(`| \`${p.name}\`${p.required ? " *" : ""} | \`${esc(p.type)}\` | ${p.default ? `\`${esc(p.default)}\`` : ""} | ${esc(p.description)} |`);
      lines.push("", "`*` obrigatória. Atributos HTML nativos repassados não são listados.", "");
    }
    const note = usageNotes[e.name];
    if (note) lines.push("**Uso certo**", "", ...note.do.map((x) => `- ✓ ${x}`), "", "**Evite**", "", ...note.dont.map((x) => `- ✗ ${x}`), "");
    const ex = e.kind === "component" || e.kind === "hook" || e.kind === "function" ? snippetFor(e.name) : null;
    if (ex) lines.push(`Exemplo (showcase \`#/p/${ex.page}\`):`, "", "```tsx", ex.code, "```", "");
  }
  return lines.join("\n");
}

function renderBlock(b) {
  return [
    `# ${b.title ?? b.slug}`,
    "",
    `- Arquivo: \`${b.file}\` (copie inteiro; os dados de exemplo ficam no topo)`,
    `- Categoria: ${b.category ?? "—"}`,
    `- Preview: showcase \`#/frame/${b.slug}\` (\`?theme=dark\` para o escuro)`,
    "",
    b.description ?? "",
    "",
    ...(b.concept
      ? [
          "## Conceito",
          "",
          `**Objetivo:** ${b.concept.goal}`,
          "",
          ...(b.concept.patterns.length ? ["**Padrões aplicados**", "", ...b.concept.patterns.map((x) => `- ${x}`), ""] : []),
          ...(b.concept.adapt.length ? ["**Quando usar e o que adaptar**", "", ...b.concept.adapt.map((x) => `- ${x}`), ""] : []),
          ...(b.concept.avoid.length ? ["**Evite**", "", ...b.concept.avoid.map((x) => `- ${x}`), ""] : []),
        ]
      : []),
    "## Componentes usados",
    "",
    b.uses.length ? b.uses.map((u) => `\`${u}\``).join(", ") : "—",
    "",
  ].join("\n");
}

function renderTokens() {
  const l = [
    "# Tokens",
    "",
    "Três camadas: primitivos `--g4-*` (não use) → semânticos `--ds-*` (trocam por tema e marca) → utilitários Tailwind (`bg-surface`, `text-muted`…).",
    "Em classe use o utilitário; em SVG/`style` use `var(--color-<utilitário>)`.",
    "",
    "## Semânticos",
    "",
    "| Utilitário (sufixo) | Variável | Claro | Escuro | Uso |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const t of tokens.semantic) l.push(`| ${t.utility ? `\`${t.utility}\`` : "—"} | \`${t.token}\` | \`${esc(t.light)}\` | \`${esc(t.dark ?? "=")}\` | ${esc(t.note)} |`);
  l.push("", "## Tipografia (px)", "", "| Utilitário | px | Papel |", "| --- | --- | --- |");
  for (const t of tokens.text) l.push(`| \`text-${t.name}\` | ${t.px} | ${esc(t.note)} |`);
  l.push("", "Valores arbitrários permitidos (iguais à escala ou meios-passos de componentes densos): 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 24, 25, 30 px. Display (hero, slides): ≥ 26 px.");
  l.push("", "## Raios (escalam com `--ds-radius-scale`)", "", "| Utilitário | px | Uso |", "| --- | --- | --- |");
  for (const r of tokens.radius) l.push(`| \`rounded-${r.name}\` | ${r.px} | ${esc(r.note)} |`);
  l.push("", "`rounded-sm/md/lg/xl/2xl` do Tailwind também escalam (4/6/8/12/16 × escala).");
  l.push("", "## Marcas prontas (`<html data-brand=…>`)", "", tokens.brands.map((b) => `\`${b}\``).join(", "), "", "Nova marca: sobrescreva só `--ds-*` em `[data-brand=\"x\"]` e `[data-brand=\"x\"][data-theme=\"dark\"]`. Detalhes: `docs/fundamentos/temas-e-dark-mode.md`.");
  return l.join("\n");
}

const componentCount = modules.reduce((n, m) => n + m.exports.filter((e) => e.kind === "component").length, 0);

/* ------------------------------------------------------------------ */
/* De/para shadcn/ui (scripts/data/shadcn-map.json)                    */
/* ------------------------------------------------------------------ */

const shadcnSrc = JSON.parse(read(join(root, "scripts/data/shadcn-map.json")));
const exportModule = new Map(modules.flatMap((m) => m.exports.map((e) => [e.name, m.name])));
const pageSlugs = new Set(readdirSync(join(root, "showcase/pages")).filter((f) => /^[a-z].*\.tsx$/.test(f)).map((f) => f.replace(/\.tsx$/, "")));
{
  const problems = [];
  for (const e of [...shadcnSrc.components, ...shadcnSrc.extras]) {
    for (const n of e.ours) if (!exportModule.has(n)) problems.push(`${e.name}: export "${n}" não existe`);
    for (const pg of e.pages) if (!pageSlugs.has(pg)) problems.push(`${e.name}: página "${pg}" não existe em showcase/pages`);
  }
  if (problems.length) {
    console.error(`scripts/data/shadcn-map.json inválido:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
}
const shadcnStatus = { equivalente: "equivalente", parcial: "parcial", ponte: "use o do shadcn com a ponte", fora: "fora do escopo" };
const shadcnEntries = shadcnSrc.components.map((e) => ({
  shadcn: e.shadcn,
  name: e.name,
  url: `https://ui.shadcn.com/docs/components/${e.shadcn}`,
  status: e.status,
  ours: e.ours.map((n) => ({ name: n, module: exportModule.get(n), doc: `components/${exportModule.get(n)}.md` })),
  pages: e.pages,
  aliases: e.aliases ?? [],
  notes: e.notes,
}));
const shadcnExtras = shadcnSrc.extras.map((e) => ({ name: e.name, ours: e.ours.map((n) => ({ name: n, module: exportModule.get(n), doc: `components/${exportModule.get(n)}.md` })), pages: e.pages, notes: e.notes }));
const SITE = "https://gestao-quatro-ponto-zero.github.io/G4OS-DS/";
const mdCell = (s) => String(s).replace(/\|/g, "\\|");
function renderShadcnDoc() {
  return `# Equivalências shadcn/ui ↔ G4OS-DS

<!-- Gerado por npm run ai:build a partir de scripts/data/shadcn-map.json. Edite o JSON, não este arquivo. -->

O G4OS-DS cobre os ${shadcnEntries.length} componentes do [shadcn/ui](${shadcnSrc.source}) com componentes próprios (Base UI + Tailwind v4, tokens semânticos, pt-BR, tema escuro e marca). Use esta tabela para traduzir um exemplo, um bloco ou um pedido escrito "em shadcn" para o DS.

- **Prefira o componente do DS**: ele já segue as regras de escrita, acessibilidade, densidade e tema.
- **Faltou algo?** Traga do shadcn ou do 21st.dev com a ponte \`@g4ai/ds/shadcn.css\` ([guia](shadcn.md)) e troque \`bg-accent\`/\`bg-muted\` por \`bg-soft\`.
- No site, cada página de componente tem o selo "Equivalente no shadcn". Agentes: o MCP \`search\` entende nomes do shadcn ("alert-dialog", "sheet") e \`ai/shadcn-map.json\` tem a tabela em JSON.

| shadcn/ui | G4OS-DS | Situação | Observação |
| --- | --- | --- | --- |
${shadcnEntries.map((e) => `| [${e.name}](${e.url}) | ${e.ours.length ? e.ours.map((o) => `\`${o.name}\``).join(", ") : "—"} | ${shadcnStatus[e.status] ?? e.status} | ${mdCell(e.notes)}${e.pages.length ? ` ([exemplo](${SITE}#/p/${e.pages[0]}))` : ""} |`).join("\n")}

## Só no G4OS-DS

| Componente | Exports | Observação |
| --- | --- | --- |
${shadcnExtras.map((e) => `| ${e.name} | ${e.ours.map((o) => `\`${o.name}\``).join(", ")} | ${mdCell(e.notes)}${e.pages.length ? ` ([exemplo](${SITE}#/p/${e.pages[0]}))` : ""} |`).join("\n")}

Além disso: gráficos de negócio (funil, cascata, Sankey, Gantt, bullet), DataGrid, filtros estruturados e visões salvas, blocos de IA (sessões, aprovação, raciocínio, ferramentas) e ${blocks.length} blocos de tela completos (CRM, ATS, ERP, financeiro, SaaS).
`;
}
/** Arquivos gerados fora de ai/ (caminho relativo à raiz → conteúdo). */
const extraFiles = new Map([["docs/guias/shadcn-equivalencias.md", renderShadcnDoc().replace(/\n{3,}/g, "\n\n").trimEnd() + "\n"]]);
const categories = [...new Set(blocks.map((b) => b.category).filter(Boolean))].sort();

function renderCore() {
  return `# G4OS-DS · guia essencial para agentes (v${pkg.version})

Leia isto inteiro antes de escrever ou mudar UI num projeto com \`@g4ai/ds\`. Detalhes ao lado (mesma pasta): \`components/<módulo>.md\` (props + exemplos), \`blocks/<bloco>.md\`, \`tokens.md\`, \`manifest.json\`. Com o MCP \`g4os-ds\` ligado, use \`plan_screen\` (pedido → anatomia, bloco e componentes), \`get_component\`, \`get_block\` e \`audit\`.

Requisitos: React 18.2+ ou 19, Tailwind v4, \`@base-ui/react\`, \`lucide-react\` (\`npx g4os-ds doctor\` confere). No React 18: \`{...inertProps(flag)}\` em vez de \`inert={flag}\`, e \`forwardRef\` nos seus componentes usados como gatilho de Tooltip/Menu; não use \`use\`, \`useActionState\`, \`useOptimistic\` nem \`<form action={fn}>\` se o app estiver no 18.

## Fluxo de trabalho (sempre nesta ordem)
1. **Anatomia**: decida qual das 9 anatomias a tela é (tabela abaixo). Ela define o que fica fixo e onde vai cada coisa.
2. **Bloco**: procure um bloco parecido (\`blocks/<slug>.md\`, MCP \`plan_screen\`/\`search\`). Achou? Copie \`src/blocks/<slug>.tsx\` inteiro e troque dados e textos. Só comece do zero se nenhum servir.
3. **Componentes**: para cada necessidade, use a tabela "Qual componente". Confira as props em \`components/<módulo>.md\` antes de usar: não invente props.
4. **Estados**: carregando (\`Skeleton\`/\`loading\`), vazio (\`Empty\` com ação), vazio por filtro (com "Limpar"), erro (com "Tentar de novo"), ideal.
5. **Verifique e corrija até limpar**: \`npx g4os-ds audit src --fix\` → \`npx g4os-ds audit src\` (0 erros, 0 avisos) → \`npx tsc --noEmit\` → se houver ESLint com \`@g4ai/ds/eslint\`, \`npx eslint src\`. Depois confira a tela em 1440 e 390 px, claro e escuro.

## Anatomia → esqueleto
| Tela | Esqueleto | Bloco de referência |
| --- | --- | --- |
| A · Lista | \`Page\` › \`PageHeading\` (1 primário em \`actions\`) › \`PageToolbar\` (\`TableToolbar\`/\`FilterBar\`) › \`DataTable\`/\`DataGrid\` › \`Pagination\` · \`BulkBar\` na seleção | \`erp-invoices\`, \`crm-contacts\`, \`ats-jobs\` |
| B · Painel | \`Page\` › \`PageHeading\` (período em \`actions\`) › \`KpiGrid\` de \`KpiCard\` › \`ChartCard\` + gráfico › filas de ação | \`fin-dashboard\`, \`saas-dashboard\` |
| C · Registro | \`Page\` › \`PageHeading crumbs\` (ações do estado) › \`Tabs\` › \`SplitLayout main aside={<PropertyList/>}\` · editar em \`Drawer\` | \`crm-deal\`, \`crm-company\`, \`erp-order\` |
| D · Configurações | \`SettingsLayout\` (subnavegação) › \`SettingsSection\` por assunto; coluna estreita com \`Page width="narrow"\` | \`settings-*\`, \`crm-settings\` |
| E · Quadro | \`KanbanBoard\` + \`RecordCard\` | \`crm-pipeline\` |
| F · Mestre-detalhe | lista + painel; no celular \`Sheet\` | \`erp-purchase-requests\` |
| G · App de altura total | \`AppShell\` sem \`Page\` (chat, arquivos) | \`ai-chat\` |
| H · Fluxo focado | coluna única, sem casca (login, assistente) | \`auth-login\`, \`onboarding-wizard\` |
| I · Público | sem \`AppShell\` (landing, preços) | \`marketing-landing\` |

\`\`\`tsx
// A · Lista (o esqueleto mais pedido)
<Page>
  <PageHeading title="Vagas" description="Vagas abertas e em pausa." actions={<Button onClick={criar}><Plus /> Criar vaga</Button>} />
  <PageToolbar>
    <TableToolbar query={q} onQuery={setQ} shown={filtradas.length} total={vagas.length} noun="vaga" dirty={!!q} onClear={limpar} />
  </PageToolbar>
  <DataTable label="Vagas" rows={pag.rows} columns={[selectionColumn(sel, (v) => v.id, (v) => v.titulo), ...colunas]} rowKey={(v) => v.id}
    loading={carregando} error={erro} empty={<Empty title="Nenhuma vaga com esses filtros" action={<Button variant="ghost" onClick={limpar}>Limpar filtros</Button>} />} />
  <Pagination page={pag.page} pageCount={pag.pageCount} onPage={pag.setPage} total={pag.total} pageSize={pag.pageSize} />
  <BulkBar count={sel.count} noun="vaga" gender="f" onClear={sel.clear}>
    <button type="button" onClick={arquivar}><Archive /> Arquivar</button>{/* filhos do BulkBar são <button> simples: a barra estiliza */}
  </BulkBar>
</Page>
\`\`\`

## Qual componente
| Preciso de | Use | Nunca |
| --- | --- | --- |
| Texto curto / longo | \`TextField\` / \`TextareaField\` (\`label\` = rótulo visível) | \`<input>\`, \`<textarea>\` cru |
| Número, dinheiro, CPF/CNPJ | \`NumberField\`, \`CurrencyField\`, \`MaskedField\` | \`type="number"\` cru, \`toFixed\` |
| 1 opção de até ~7 | \`Select\` · \`SegmentedControl\` (2–4, troca de visão) · \`RadioGroup\` | \`<select>\` cru |
| 1 entidade de lista longa (pessoa, cliente) | \`Combobox\` (busca) · \`NativeSelect\` (seletor do sistema, celular) | \`<select>\` cru |
| Várias opções | \`MultiSelect\` (dropdown com busca) · \`CheckboxGroup\` (todas visíveis, ≤ 12) · \`ToggleGroup multiple\` (dias da semana) | lista de \`Checkbox\` solta |
| Data / data e hora / hora | \`DatePicker\` / \`DateTimePicker\` / \`TimePicker\` | \`<input type="date|time">\` |
| Liga/desliga com efeito imediato | \`Switch\` | \`Checkbox\` + botão salvar |
| Confirmar ação irreversível | \`ConfirmDialog\` | \`window.confirm\` |
| Avisar que terminou | \`notify("Vaga criada")\` (+ desfazer) | \`alert\`, "com sucesso", "!" |
| Ação assíncrona | \`useOperation\` + \`OperationButton\` + \`OperationFeedback\` | \`setLoading\` manual sem feedback |
| Criar/editar sem sair da lista | \`Drawer\` com \`footer\` | página nova, \`Modal\` longo |
| Tabela de dados | \`DataTable\` (\`selectionColumn\`, \`useSort\`, \`usePagination\`) · \`DataGrid\` (planilha, totais, colunas fixas) | \`<table>\` cru |
| Tabela estática (fatura, comparativo) | \`Table\` › \`TableHeader\`/\`TableBody\`/\`TableRow\`/\`TableCell numeric\` | \`<table>\` cru |
| Status numa linha | \`StatusLabel\`/\`Badge\` (troca por \`Menu\`) | \`Select\` por linha |
| Número de destaque | \`KpiCard delta={0.12}\` (fração; \`goodWhen="down"\` p/ custo) em \`KpiGrid\` | card montado à mão |
| Gráfico | \`ChartCard title="Pergunta?"\` + \`AreaChart\`/\`BarChart\`/\`LineChart label=…\` | Recharts, cores fixas |
| Aviso na tela | \`Callout tone=…\` | \`div\` colorido |
| Vazio / erro de tela | \`Empty\` / \`StateView\` | texto solto |
| Bloqueado com motivo | \`<Button disabled disabledReason="…">\` | \`span\` com \`opacity-50\`/\`pointer-events-none\` |

## Erros que agentes mais cometem (errado → certo)
1. Centralizar só o corpo: \`<Page><PageHeading/><div className="mx-auto max-w-4xl">\` → \`<Page width="narrow"><PageHeading/>…\` (\`wide\` 1200 · \`medium\` 1024 · \`narrow\` 896 · \`reading\` 720). [\`page-width-wrapper\`]
2. \`<h1>\` solto → \`<PageHeading title description actions />\`. [\`page-heading\`]
3. Botão bloqueado apagado com wrapper (\`opacity-50\`, \`pointer-events-none\`, \`title\`) → \`disabled disabledReason="Demonstração: nada é gravado"\`. [\`disabled-wrapper\`]
4. \`label\` dos campos **já é visível**. Não repita: \`<FieldBlock label="Valor"><CurrencyField label="Valor"/>\` → só o campo. [\`field-double-label\`] \`<Checkbox label={x}>{x}</Checkbox>\` → \`<Checkbox label={x} />\`. [\`redundant-children\`]
5. Rótulo escondido só onde não cabe texto (célula, toolbar): \`<Checkbox label={"Selecionar " + r.nome} hideLabel />\` ou \`selectionColumn\`. [\`cell-control-label\`]
6. Lista de checkboxes para "vários" → \`CheckboxGroup\` (visíveis) ou \`MultiSelect\` (dropdown, "3 selecionados").
7. \`<select>\`, \`<input type="date">\`, \`<textarea>\`, \`<table>\` crus → componentes da tabela acima. [\`native-select\`, \`native-date\`, \`raw-input\`, \`raw-table\`]
8. \`Select\` dentro de \`cell:\` → selo + \`Menu\`. [\`select-per-row\`]
9. Dois primários em \`actions\` → um primário, o resto \`variant="ghost"\` ou \`ActionMenu\`. [\`multiple-primary\`]
10. \`Drawer\` dentro de \`Drawer\` → passos no mesmo \`Drawer\` ou \`Modal\`. [\`nested-drawer\`]
11. \`confirm()\`/\`alert()\` → \`ConfirmDialog\` + \`notify\`. [\`confirm-alert\`]
12. \`"R$ " + v.toFixed(2)\`, \`toLocaleString("pt-BR", {style})\`, \`toLocaleDateString("en-US")\` → \`formatCurrency\`, \`formatPercent\`, \`formatDate\`, \`formatRelative\`. [\`number-format\`, \`manual-format\`]
13. "Salvo com sucesso!", "Save", "Criar Nova Vaga" → "Alterações salvas", "Salvar", "Criar nova vaga". [\`copy-tone\`, \`english-copy\`, \`title-case\`]
14. \`bg-white\`, \`text-gray-500\`, \`#1a7f37\`, \`bg-muted\` → \`bg-surface\`, \`text-muted\`, \`text-ok\`, \`bg-soft\`. [\`white-black\`, \`tailwind-palette\`, \`hex-color\`, \`shadcn-class\`]
15. \`DataTable\` com dados assíncronos sem \`loading\`/\`error\`/\`empty\` → passe os três. [\`data-states\`]
16. Props inventadas ou trocadas: \`<Empty description>\` (é \`hint\`; \`description\` é do \`StateView\`), \`<Card title>\` (use \`Section\`/\`ChartCard\`), \`<Badge variant>\` (é \`tone\`). Confira \`components/<módulo>.md\` antes; \`npx tsc --noEmit\` pega o resto.
17. Importar de caminhos internos (\`@g4ai/ds/src/…\`) → sempre \`from "@g4ai/ds"\`. [\`deep-import\`]
18. \`useEffect(async () => …)\` ou efeito que devolve Promise → função interna \`async\` e chame. [\`effect-return\`]

## Regras visuais (resumo de AGENTS.md)
- **Só tokens semânticos**: fundos \`bg-page\` (área) · \`bg-surface\` (card, campo) · \`bg-popover\` (menu, modal) · \`bg-soft\` (hover, faixa); texto \`text-ink\` · \`text-ink-soft\` · \`text-muted\`; borda \`border-line\` (\`-strong\` no hover); ação \`bg-primary text-on-primary\`; sobre preenchimento forte \`text-on-ink\`; estados \`ok · amber · rose · info\` (+\`-soft\`). Isso garante tema escuro e marca do cliente sem código extra.
- **Texto na escala**: \`text-caption\` 12 · \`text-label\` 12.5 · \`text-control\` 13 · \`text-body\` 13.5 · \`text-input\` 14 · \`text-section\` 18 · \`text-title\` 25.
- Superfície separa por borda de 1 px, não sombra. Cor sempre com palavra (status = ponto + texto). Número bom não grita.
- Controles só quando há o que controlar: busca ≥ 12 itens, filtros ≥ 8, alternador de visão ≥ 8.
- pt-BR: verbo + objeto nos botões ("Criar vaga"), só a primeira maiúscula, sem exclamação. Toast = particípio + objeto ("Vaga arquivada").
- Acessível: teclado, foco visível, \`IconButton label\`, gráfico com \`label\`, cor nunca sozinha. Responsivo 320–1440 px sem rolagem horizontal.
- App: \`<html lang="pt-BR" className="ds-app" data-theme="system">\`, \`themeScript\` no \`<head>\`, \`setLinkComponent(Link)\` uma vez, \`<Toaster />\` na raiz. CSS: \`@import "tailwindcss"; @import "@g4ai/ds/styles.css";\`.

## Antes de concluir
- [ ] \`npx g4os-ds audit src\`: 0 erros e 0 avisos (use \`--fix\` antes; \`--format json\` para ler por regra).
- [ ] \`npx tsc --noEmit\` verde (e \`npx eslint src\` se o projeto usa o plugin).
- [ ] Título e corpo no mesmo eixo; um primário por área; rótulos visíveis; nenhum controle cru.
- [ ] Cinco estados implementados; textos em pt-BR; datas e dinheiro pelos formatadores.
- [ ] Conferido em 1440 e 390 px, claro e escuro (\`data-theme="dark"\` no \`<html>\`).

## Tokens em uma linha
Fundos \`page · surface · popover · soft · rail\` · texto \`ink · ink-soft · muted\` · linhas \`line · line-strong\` · ação \`primary / on-primary\` · sobre forte \`on-ink\` · marca \`navy · blue · clay · accent (só preenchimento) · accent-deep (texto) · accent-soft\` · estados \`ok · amber · rose · info\` (+\`-soft\`) · dados \`chart-1…6 · chart-grid\`. Raios \`rounded-lg\` controle, \`rounded-xl\` card/popup, \`rounded-2xl\` modal. Tabela completa: \`tokens.md\`.

## Módulos (${componentCount} componentes) → \`components/<nome>.md\`
${modules.map((m) => `- **${m.name}**: ${m.summary || m.exports.map((e) => e.name).slice(0, 8).join(", ")}`).join("\n")}

## Blocos (${blocks.length}) → \`blocks/<slug>.md\` (código em \`src/blocks/<slug>.tsx\`)
${categories.map((c) => `- **${c}**: ${blocks.filter((b) => b.category === c).map((b) => `\`${b.slug}\``).join(", ")}`).join("\n")}

## Mais
- Regras completas: \`AGENTS.md\`. Padrões: \`docs/padroes/\` (anatomia de página, formulários, tabelas, filtros, superfícies, feedback). Receitas por tipo de app: \`docs/receitas/\`. Auditoria (todas as regras, com exemplos): \`docs/guias/auditoria.md\`.
- Vindo do shadcn/ui? Traduza por \`shadcn-map.json\` (Dialog → \`Modal\`, Alert Dialog → \`ConfirmDialog\`, Dropdown Menu → \`Menu\`/\`ActionMenu\`, Sonner → \`notify\`, Input → \`TextField\`, Field → \`FieldBlock\`). Tabela: \`docs/guias/shadcn-equivalencias.md\`.
`;
}

function renderLlms() {
  return `# @g4ai/ds

> Design system G4 OS (React 18.2+/19 + Base UI + Tailwind v4): tokens semânticos com tema escuro e marcas, ${componentCount} componentes, gráficos SVG e ${blocks.length} blocos de tela para CRM, ATS, ERP, financeiro e SaaS. Tudo em pt-BR.

Comece por [core.md](core.md). Regras completas em ../AGENTS.md.

## Referência
- [Tokens](tokens.md)
- [Manifesto JSON](manifest.json)
- [Renomeações entre versões](renames.json)
- [Equivalências shadcn/ui → DS](shadcn-map.json)

## Componentes
${modules.map((m) => `- [${m.name}](components/${m.name}.md): ${m.summary}`).join("\n")}

## Blocos
${blocks.map((b) => `- [${b.slug}](blocks/${b.slug}.md): ${b.title ?? ""} (${b.category ?? "—"})`).join("\n")}
`;
}

out("core.md", renderCore());
out("tokens.md", renderTokens());
out("llms.txt", renderLlms());
for (const m of modules) out(`components/${m.name}.md`, renderModule(m));
out("shadcn-map.json", JSON.stringify({ $comment: "Gerado de scripts/data/shadcn-map.json: componente do shadcn/ui → export(s) do DS.", source: shadcnSrc.source, components: shadcnEntries, extras: shadcnExtras }, null, 2));
for (const b of blocks) out(`blocks/${b.slug}.md`, renderBlock(b));
out(
  "manifest.json",
  JSON.stringify(
    {
      $schema: "./manifest.schema.json",
      package: pkg.name,
      version: pkg.version,
      // Exemplos ficam só nos .md (manifesto enxuto); aqui vai a página de referência.
      modules: modules.map((m) => ({ ...m, doc: `components/${m.name}.md`, exports: m.exports.map((e) => ({ ...e, examplePage: e.kind === "component" ? snippetFor(e.name)?.page ?? null : undefined })) })),
      blocks,
      tokens,
    },
    null,
    2,
  ),
);
const renamesPath = join(outDir, "renames.json");
out(
  "renames.json",
  existsSync(renamesPath)
    ? read(renamesPath)
    : JSON.stringify(
        {
          $comment: "Renomeações entre versões, lidas pelo audit e pela skill ds-migrate (modo atualização). Formato: { \"<versão>\": { \"exports\": { \"Antigo\": \"Novo\" }, \"classes\": { \"bg-antigo\": \"bg-novo\" }, \"notes\": [\"…\"] } }.",
          "0.2.0": {
            exports: {},
            classes: { "bg-white": "bg-surface", "bg-ink text-white": "bg-primary text-on-primary" },
            notes: ["Tokens em 3 camadas; bg-white/text-white viraram bg-surface/text-on-ink/text-on-primary para suportar tema escuro e marcas."],
          },
        },
        null,
        2,
      ),
);

/* ------------------------------------------------------------------ */
/* Escrever ou conferir                                                */
/* ------------------------------------------------------------------ */

const listExisting = (dir, base = "") =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? listExisting(join(dir, d.name), `${base}${d.name}/`) : [`${base}${d.name}`]))
    : [];

if (check) {
  const existing = new Set(listExisting(outDir));
  const stale = [];
  for (const [p, content] of files_) {
    const full = join(outDir, p);
    if (!existsSync(full) || read(full) !== content) stale.push(p);
    existing.delete(p);
  }
  for (const extra of existing) if (extra !== "manifest.schema.json") stale.push(`${extra} (sobrando)`);
  for (const [p, content] of extraFiles) if (!existsSync(join(root, p)) || read(join(root, p)) !== content) stale.push(p);
  if (stale.length) {
    console.error(`ai/ desatualizado (${stale.length}): ${stale.slice(0, 8).join(", ")}${stale.length > 8 ? "…" : ""}\nRode: npm run ai:build`);
    process.exit(1);
  }
  console.log(`ai/ em dia: ${modules.length} módulos, ${componentCount} componentes, ${blocks.length} blocos`);
} else {
  for (const d of ["components", "blocks"]) rmSync(join(outDir, d), { recursive: true, force: true });
  for (const [p, content] of files_) {
    mkdirSync(dirname(join(outDir, p)), { recursive: true });
    writeFileSync(join(outDir, p), content);
  }
  for (const [p, content] of extraFiles) writeFileSync(join(root, p), content);
  console.log(`ai/ gerado: ${modules.length} módulos, ${componentCount} componentes, ${blocks.length} blocos, ${snippets.length} exemplos do showcase`);
}
