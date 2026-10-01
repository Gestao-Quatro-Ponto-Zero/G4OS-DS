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
  "overlays-extra": "Tooltip, HoverCard, Menu (submenus, checkbox/radio), ContextMenu, Sheet, CommandPalette, Lightbox.",
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
        const imports = [...s.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@g4os\/ds"/g)]
          .flatMap((m) => m[1].split(","))
          .map((x) => x.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0])
          .filter((x) => x && allExports.has(x))
          .sort();
        return { slug: f.replace(".tsx", ""), file: `src/blocks/${f}`, title: field("title"), description: field("description"), category: field("category"), uses: [...new Set(imports)] };
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
const categories = [...new Set(blocks.map((b) => b.category).filter(Boolean))].sort();

function renderCore() {
  return `# G4OS-DS · guia essencial para agentes (v${pkg.version})

Leia isto antes de escrever ou mudar qualquer UI num projeto que usa \`@g4ai/ds\`. Os detalhes estão ao lado, em \`ai/\` (mesma pasta deste arquivo): \`tokens.md\`, \`components/<módulo>.md\` (props e exemplos), \`blocks/<bloco>.md\`, \`manifest.json\` (tudo em JSON). Leia só o módulo de que precisar.

## Como decidir
1. **Bloco pronto** (\`src/blocks/<slug>.tsx\`): copie o arquivo inteiro e troque os dados do topo. Veja o catálogo abaixo.
2. **Composição de componentes do DS** (import de \`@g4ai/ds\`).
3. Componente do DS com outras props. 4. shadcn/21st com a ponte \`@g4ai/ds/shadcn.css\`. 5. Do zero, só com tokens.

## Regras (resumo de AGENTS.md; todas obrigatórias)
1. **Só tokens semânticos**: \`bg-page\` (fundo), \`bg-surface\` (card/painel/campo), \`bg-popover\` (menu/modal), \`bg-soft\` (hover, cabeçalho), \`text-ink\` / \`text-ink-soft\` / \`text-muted\`, \`border-line\` / \`border-line-strong\`. Ação e seleção: \`bg-primary text-on-primary\`. Texto sobre preenchimento forte (\`bg-ink\`, \`bg-rose\`, \`bg-ok\`): \`text-on-ink\`. Estados: \`ok\`, \`amber\`, \`rose\`, \`info\` (+ \`-soft\` para fundo). **Proibido**: hex, \`bg-white\`, \`text-white\` (exceto sobre \`bg-navy\`), paleta do Tailwind (\`gray-500\`, \`blue-600\`…), \`bg-muted\` (no DS \`muted\` é cor de texto).
2. **Texto na escala**: \`text-caption\` 12 · \`text-label\` 12.5 · \`text-control\` 13 · \`text-body\` 13.5 · \`text-input\` 14 · \`text-section\` 18 · \`text-title\` 25 (ou \`text-[13.5px]\` etc. só com valores da escala).
3. Superfícies separam por **borda de 1 px**, não sombra. Cor sempre com palavra. Número bom não grita.
4. **Um primário por área**; resto \`ghost\`; secundárias no \`ActionMenu\`; \`danger\` só dentro de \`ConfirmDialog\`.
5. **Nunca** \`<select>\` nativo (\`Select\`/\`Combobox\`), \`<input type="date">\` (\`DatePicker\`), \`window.confirm\` (\`ConfirmDialog\`), \`alert\` (\`notify\`).
6. Rótulo visível acima de todo campo (\`FieldBlock\` ou \`label\` dos campos de \`inputs\`).
7. Superfície certa: página = entidade; \`Drawer\` = criar/editar sem perder a lista; \`Modal\` = decisão curta; \`ConfirmDialog\` = irreversível; drawer nunca abre drawer.
8. Controles só quando há o que controlar: busca ≥ 12 itens, filtros ≥ 8, alternador de visão ≥ 8.
9. **Números e datas por \`formatCurrency/formatNumber/formatPercent/formatDelta/formatDate/formatRelative\`** (pt-BR). Nada de \`toFixed\`, \`"R$ " +\`, \`toLocaleString("en-US")\`.
10. **Gráficos do DS** (sem Recharts): série 1 = ink, comparação tracejada, eixo em zero, título = pergunta, \`label\` obrigatório.
11. **Cinco estados** em todo dado: carregando (\`Skeleton\`), vazio (\`Empty\` com próxima ação), vazio por filtro (com "Limpar"), erro (com saída), ideal.
12. Toast (\`notify\`) só depois de terminar; particípio + objeto; "Desfazer" quando reversível; \`useOperation\` enquanto executa.
13. **pt-BR**: verbo + objeto nos botões ("Criar vaga"), sem exclamação, sem "com sucesso", só a primeira letra maiúscula.
14. Acessível: teclado, foco visível, nome acessível (\`IconButton\` exige \`label\`), cor nunca sozinha, \`prefers-reduced-motion\`.
15. Responsivo 320–1440 px sem rolagem horizontal. \`<html lang="pt-BR" className="ds-app" data-theme="system">\`.
16. **Tema e marca**: tudo funciona em \`data-theme="dark"\` e em qualquer \`data-brand\` se a regra 1 for seguida. \`useTheme\`, \`ThemeToggle\`, \`themeScript\` (no \`<head>\`). \`dark:\` só para ajuste fino de imagem.
17. Ícones lucide 16 px. Links do framework via \`setLinkComponent(Link)\` uma vez.

## Verificar (sempre)
- \`npx g4os-ds audit <pasta>\` sem erros (\`--json\` para acompanhar migração). \`npx g4os-ds doctor\` confere pré-requisitos.
- TypeScript do app verde. Telas em 1440 e 390 px, claro e escuro.

## Tokens em uma linha
Fundos \`page · surface · popover · soft · rail\` · texto \`ink · ink-soft · muted\` · linhas \`line · line-strong\` · ação \`primary / on-primary\` · sobre forte \`on-ink\` · marca \`navy · blue · clay · accent (só preenchimento) · accent-deep (texto) · accent-soft\` · estados \`ok · amber · rose · info\` (+\`-soft\`) · dados \`chart-1…6 · chart-grid\`. Raios \`rounded-lg\` controle, \`rounded-xl\` card/popup, \`rounded-2xl\` modal. Tabela completa: \`tokens.md\`.

## Módulos (${componentCount} componentes) → \`ai/components/<nome>.md\`
${modules.map((m) => `- **${m.name}**: ${m.summary || m.exports.map((e) => e.name).slice(0, 8).join(", ")}`).join("\n")}

## Blocos (${blocks.length}) → \`ai/blocks/<slug>.md\`
${categories.map((c) => `- **${c}**: ${blocks.filter((b) => b.category === c).map((b) => `\`${b.slug}\``).join(", ")}`).join("\n")}

## Documentação humana (no pacote)
\`AGENTS.md\` (regras completas), \`docs/fundamentos/\` (cor, tokens, temas, tipografia, dados, escrita), \`docs/padroes/\` (layout, densidade, formulários, tabelas, filtros, superfícies, feedback, dashboards, pipelines, acessibilidade, responsivo), \`docs/receitas/\` (CRM, ATS, ERP, financeiro, portal), \`docs/guias/\` (instalação, migração, shadcn, usar com IA).
`;
}

function renderLlms() {
  return `# @g4ai/ds

> Design system G4 OS (React 19 + Base UI + Tailwind v4): tokens semânticos com tema escuro e marcas, ${componentCount} componentes, gráficos SVG e ${blocks.length} blocos de tela para CRM, ATS, ERP, financeiro e SaaS. Tudo em pt-BR.

Comece por [core.md](core.md). Regras completas em ../AGENTS.md.

## Referência
- [Tokens](tokens.md)
- [Manifesto JSON](manifest.json)
- [Renomeações entre versões](renames.json)

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
  console.log(`ai/ gerado: ${modules.length} módulos, ${componentCount} componentes, ${blocks.length} blocos, ${snippets.length} exemplos do showcase`);
}
