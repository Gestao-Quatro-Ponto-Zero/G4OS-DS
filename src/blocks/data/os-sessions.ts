/*
 * Dados do "G4 OS" (app desktop de sessões com agente): sessões, conversas,
 * ferramentas conectadas e agentes. "Hoje" = 30/09/2026. A pessoa logada é o
 * João (mesmo G4 OS da referência). Troque pela sua API.
 *
 * Respostas vêm como blocos de texto rico simples (`Rich`), para virar JSX
 * no bloco e Markdown no "Copiar Markdown" sem depender de parser.
 */
import type { AgentOption, ArtifactKind, ConnectedTool, ContextItem, ModelOption, SessionFile, SessionMode, SessionProject, SessionSummary, StepItem } from "@g4os/ds";

export const osUser = { name: "João Vitor", first: "João", initials: "JV", title: "Head de Produto" };
export const osWorkspace = "G4 OS";

/** Trecho de texto rico: negrito, código ou link para um registro. */
export type Span = { t: string; b?: boolean; code?: boolean; href?: string };
export type Rich = Span[][]; // parágrafos → trechos

export type ThreadEntry =
  | { kind: "user"; id: string; text: string }
  | { kind: "steps"; id: string; title: string; steps: StepItem[] }
  | { kind: "answer"; id: string; body: Rich };

export type OsSession = SessionSummary & {
  mode: SessionMode;
  createdBy: string;
  notes: string;
  files: SessionFile[];
  browser?: { url: string; title: string };
  thread: ThreadEntry[];
};

/* Ferramentas conectadas: tintas vêm dos tokens (acompanham tema e marca). */
export const tools: ConnectedTool[] = [
  { id: "notion", name: "Notion", tint: "var(--ds-ink)" },
  { id: "drive", name: "Google Drive", tint: "var(--ds-chart-2)" },
  { id: "slack", name: "Slack", tint: "var(--ds-chart-4)" },
  { id: "github", name: "GitHub", tint: "var(--ds-ink-soft)" },
  { id: "linear", name: "Linear", tint: "var(--ds-chart-5)" },
  { id: "agenda", name: "Google Agenda", tint: "var(--ds-chart-3)", status: "error" },
];

export const agents: AgentOption[] = [
  { id: "os", name: "G4 OS", initials: "OS", tint: "var(--ds-accent)", description: "Agente geral com todas as ferramentas" },
  { id: "pesquisa", name: "Pesquisa", initials: "PQ", tint: "var(--ds-blue)", description: "Busca na web e em documentos" },
  { id: "dados", name: "Dados", initials: "DD", tint: "var(--ds-chart-5)", description: "Consultas no Databricks e planilhas" },
];

export const tagSuggestions = ["Field Guide FC", "MCP", "Agenda", "CX", "Rotinas", "Financeiro", "Produto"];

const steps = (items: [string, number, string?][]): StepItem[] => items.map(([label, durationMs, detail], i) => ({ id: `s${i}`, label, durationMs, detail, status: "done" }));

export const sessions: OsSession[] = [
  {
    id: "field-guide",
    title: "Field Guide FC — atualização 30/09",
    time: "2m",
    status: "working",
    tags: ["Field Guide FC"],
    day: "Hoje",
    mode: "executar",
    createdBy: "Rotina semanal",
    notes: "Usar a versão do funil aprovada na DIREX de 23/09.",
    files: [{ id: "f1", name: "field-guide-fc-v12.md", size: 48_200, meta: "gerado hoje" }],
    browser: { url: "notion.so/g4/field-guide-fc", title: "Field Guide FC — Funil comercial" },
    thread: [
      { kind: "user", id: "m1", text: "Atualiza o Field Guide FC com as mudanças do funil desta semana." },
      { kind: "steps", id: "m2", title: "Lendo a ata da DIREX e o funil atual", steps: steps([["Abriu a ata da DIREX 23/09 no Notion", 1800], ["Comparou etapas do funil (v11 × proposta)", 2400], ["Listou 4 seções afetadas", 900]]) },
      {
        kind: "answer",
        id: "m3",
        body: [
          [{ t: "Encontrei 4 seções para atualizar.", b: true }, { t: " A etapa “Qualificação” passa a exigir BANT completo e o SLA de primeiro contato cai de 24 h para 4 h." }],
          [{ t: "Estou reescrevendo as seções no " }, { t: "field-guide-fc", code: true }, { t: " e aviso quando terminar." }],
        ],
      },
    ],
  },
  {
    id: "mcp-notion",
    title: "Conectar servidor MCP do Notion",
    time: "11m",
    status: "idle",
    tags: ["MCP"],
    day: "Hoje",
    mode: "executar",
    createdBy: "Novo chat",
    notes: "",
    files: [
      { id: "f1", name: "comparativo-notion-vs-official.csv", size: 12_400, meta: "75 imagens · 2 conexões" },
      { id: "f2", name: "log-oauth.txt", size: 3_100, meta: "anexo" },
    ],
    browser: { url: "github.com/g4/os/issues/1116", title: "Validar fluxo OAuth do MCP do Notion #1116" },
    thread: [
      { kind: "user", id: "m1", text: "Testa as duas conexões do Notion (notion e notion-official) lendo a página do Field Guide." },
      { kind: "steps", id: "m2", title: "Reunindo contexto", steps: steps([["Leu a página pela conexão notion", 3200, "75 imagens, 18 tabelas"], ["Leu a mesma página pela notion-official", 3500, "75 imagens, 18 tabelas"], ["Comparou textos, toggles e arquivos", 1400]]) },
      {
        kind: "answer",
        id: "m3",
        body: [
          [{ t: "As duas leram a página por inteiro.", b: true }, { t: " Textos, toggles e tabelas bateram, e as 75 imagens baixadas pelas duas conexões tinham arquivos idênticos." }],
        ],
      },
      { kind: "user", id: "m4", text: "Então na prática funcionaram iguais né?" },
      { kind: "steps", id: "m5", title: "Reunindo contexto", steps: steps([["Releu a prévia de link da planilha nas duas extrações", 1100], ["Conferiu blocos de link e páginas em branco", 800]]) },
      {
        kind: "answer",
        id: "m6",
        body: [
          [{ t: "Para ler essa página, sim: na prática, funcionaram igual.", b: true }, { t: " Os textos dos toggles e das tabelas coincidiram, e as 75 imagens baixadas pelas duas conexões tinham arquivos idênticos." }],
          [
            { t: "A ressalva é pequena, mas real: as duas extrações deixam uma prévia de link fora do Markdown. A conexão " },
            { t: "notion", code: true },
            { t: " identificou esse bloco como link para uma planilha; a " },
            { t: "notion-official", code: true },
            { t: " o mostrou como página em branco. Isso não afetou o restante, mas não significa paridade total para qualquer tipo de bloco ou para escrita." },
          ],
        ],
      },
      { kind: "user", id: "m7", text: "Blz, precisa atualizar algo na issue? Se sim atualiza, se não já manda no Slack sobre a issue." },
      { kind: "steps", id: "m8", title: "Acompanhar o registro de evidências e a comunicação ao time", steps: steps([["Comentou a validação na GD-545", 1600], ["Atualizou a issue GitHub #1116", 2100], ["Enviou resumo no canal #os-mcp do Slack", 900, "mensagem confirmada"]]) },
      {
        kind: "answer",
        id: "m9",
        body: [
          [
            { t: "Sim, havia uma atualização útil. Registrei a validação da página maior na " },
            { t: "GD-545", href: "#gd-545" },
            { t: " e no " },
            { t: "GitHub #1116", href: "#gh-1116" },
            { t: ". Também " },
            { t: "enviei o resumo ao canal indicado no Slack", href: "#slack" },
            { t: " e confirmei que a mensagem apareceu." },
          ],
          [{ t: "A issue do GitHub segue aberta: o patch ainda precisa ser validado no fluxo OAuth da interface de um build corrigido." }],
        ],
      },
    ],
  },
  {
    id: "tokens",
    title: "Comparar sessões de tokens entre modelos",
    time: "39m",
    status: "idle",
    day: "Hoje",
    mode: "perguntar",
    createdBy: "João Vitor",
    notes: "",
    files: [],
    thread: [
      { kind: "user", id: "m1", text: "Compara o consumo de tokens das últimas 50 sessões entre os modelos." },
      { kind: "steps", id: "m2", title: "Consultando uso no Databricks", steps: steps([["Rodou consulta de uso por modelo", 4200], ["Agrupou por tipo de tarefa", 1300]]) },
      { kind: "answer", id: "m3", body: [[{ t: "Sessões de pesquisa gastam 2,4× mais tokens", b: true }, { t: " que as de execução, puxadas por leitura de páginas longas. Trocar a leitura completa por trechos citados cortaria cerca de 38 %." }]] },
    ],
  },
  {
    id: "agenda",
    title: "Puxar dados da agenda",
    time: "59m",
    status: "error",
    tags: ["Agenda"],
    day: "Hoje",
    mode: "executar",
    createdBy: "João Vitor",
    notes: "",
    files: [],
    thread: [
      { kind: "user", id: "m1", text: "Puxa minhas reuniões da semana e marca as que não têm pauta." },
      { kind: "steps", id: "m2", title: "Lendo o Google Agenda", steps: [{ id: "s0", label: "Conectar ao Google Agenda", status: "error", detail: "Token expirado — reconecte em Ferramentas" }] },
      { kind: "answer", id: "m3", body: [[{ t: "Não consegui ler a agenda.", b: true }, { t: " A conexão com o Google Agenda expirou. Reconecte em ferramentas conectadas e me peça de novo." }]] },
    ],
  },
  {
    id: "cx",
    title: "Resumo de CX",
    time: "1h",
    status: "ready",
    tags: ["CX"],
    day: "Hoje",
    mode: "perguntar",
    createdBy: "Rotina diária",
    notes: "",
    files: [{ id: "f1", name: "resumo-cx-30-09.pdf", size: 220_000, meta: "gerado" }],
    thread: [
      { kind: "user", id: "m1", text: "Resume os tickets de CX de ontem por tema." },
      { kind: "steps", id: "m2", title: "Lendo 142 tickets", steps: steps([["Leu tickets do Zendesk", 3800], ["Agrupou em 6 temas", 2200]]) },
      { kind: "answer", id: "m3", body: [[{ t: "142 tickets, 6 temas.", b: true }, { t: " Acesso ao portal (31 %) e cobrança duplicada (18 %) lideram. A cobrança duplicada começou após a mudança de gateway de 28/09." }]] },
    ],
  },
  {
    id: "help-1",
    title: "Atender solicitação de ajuda",
    time: "1h",
    status: "ready",
    day: "Hoje",
    mode: "executar",
    createdBy: "Slack · #ajuda",
    notes: "",
    files: [],
    thread: [
      { kind: "user", id: "m1", text: "A Carla pediu ajuda para exportar o relatório de pipeline em CSV." },
      { kind: "answer", id: "m2", body: [[{ t: "Respondi a Carla no Slack", b: true }, { t: " com o passo a passo e o link do relatório já filtrado." }]] },
    ],
  },
  {
    id: "funil",
    title: "Atualizar o Field Guide do funil",
    time: "1h",
    status: "idle",
    parentId: "field-guide",
    tags: ["Field Guide FC"],
    day: "Hoje",
    mode: "planejar",
    createdBy: "Ramificada de Field Guide FC",
    notes: "",
    files: [],
    thread: [{ kind: "user", id: "m1", text: "Planeja a reescrita da seção de qualificação." }, { kind: "answer", id: "m2", body: [[{ t: "Plano em 3 passos:", b: true }, { t: " critérios BANT, exemplos de perguntas e SLA de 4 h com alertas." }]] }],
  },
  {
    id: "morning",
    title: "Morning Brief",
    time: "6h",
    status: "idle",
    scheduled: true,
    tags: ["Rotinas"],
    day: "Hoje",
    mode: "perguntar",
    createdBy: "Rotina · seg a sex 08:00",
    notes: "",
    files: [],
    thread: [{ kind: "answer", id: "m1", body: [[{ t: "Bom dia, João.", b: true }, { t: " 4 reuniões hoje, 2 sem pauta. 3 negócios acima de R$ 100 mil mudaram de etapa ontem. Nenhum alerta de faturamento." }]] }],
  },
  {
    id: "gav",
    title: "Comparar GAV de agosto e setembro",
    time: "6h",
    status: "idle",
    tags: ["Financeiro"],
    day: "Hoje",
    mode: "perguntar",
    createdBy: "João Vitor",
    notes: "",
    files: [],
    thread: [{ kind: "user", id: "m1", text: "Compara o GAV de agosto e setembro por unidade." }, { kind: "answer", id: "m2", body: [[{ t: "GAV subiu 6,2 %", b: true }, { t: " em setembro, puxado por SP (+11 %). As demais unidades ficaram estáveis." }]] }],
  },
  {
    id: "design",
    title: "Criar um sistema de design completo",
    time: "ontem",
    status: "idle",
    starred: true,
    tags: ["Produto"],
    day: "Ontem",
    mode: "executar",
    createdBy: "João Vitor",
    notes: "",
    files: [],
    thread: [{ kind: "user", id: "m1", text: "Cria um design system com componentes reaproveitáveis e guias." }, { kind: "answer", id: "m2", body: [[{ t: "Pronto: G4OS-DS", b: true }, { t: " com tokens, componentes, gráficos e blocos de CRM, ATS e ERP." }]] }],
  },
  {
    id: "old",
    title: "Instalar e configurar o servidor local",
    time: "3 dias",
    status: "idle",
    archived: true,
    day: "Esta semana",
    mode: "executar",
    createdBy: "João Vitor",
    notes: "",
    files: [],
    thread: [{ kind: "user", id: "m1", text: "Instala o servidor local do MCP." }, { kind: "answer", id: "m2", body: [[{ t: "Servidor instalado", b: true }, { t: " e respondendo na porta 3100." }]] }],
  },
];

/** Respostas de exemplo para mensagens novas (escolhidas por palavra-chave). */
export function cannedReply(prompt: string): { title: string; steps: StepItem[]; body: Rich } {
  const p = prompt.toLowerCase();
  if (p.includes("slack") || p.includes("manda"))
    return {
      title: "Preparando e enviando a mensagem",
      steps: steps([["Leu o contexto da sessão", 900], ["Redigiu o resumo", 1600], ["Enviou no canal #os-mcp", 700]]),
      body: [[{ t: "Mensagem enviada.", b: true }, { t: " Postei o resumo no " }, { t: "#os-mcp", code: true }, { t: " e marquei quem precisa validar o OAuth." }]],
    };
  if (p.includes("agenda") || p.includes("reuni"))
    return {
      title: "Lendo a agenda",
      steps: steps([["Leu 12 eventos da semana", 1400], ["Cruzou com pautas no Notion", 1800]]),
      body: [[{ t: "Você tem 12 reuniões; 3 estão sem pauta.", b: true }, { t: " Sugeri pautas a partir das últimas atas e deixei como rascunho no Notion." }]],
    };
  return {
    title: "Reunindo contexto",
    steps: steps([["Leu as mensagens anteriores", 700], ["Buscou documentos relacionados no Notion e no Drive", 2600], ["Montou a resposta", 1200]]),
    body: [
      [{ t: "Feito.", b: true }, { t: " Revisei o que já tínhamos nesta sessão e os documentos ligados ao tema." }],
      [{ t: "O ponto principal é manter " }, { t: "uma fonte única", b: true }, { t: " no Notion e avisar o time pelo Slack quando ela mudar. Quer que eu crie a tarefa no " }, { t: "Linear", href: "#linear" }, { t: "?" }],
    ],
  };
}

export const plain = (body: Rich) => body.map((p) => p.map((s) => s.t).join("")).join("\n\n");
export const markdown = (body: Rich) => body.map((p) => p.map((s) => (s.code ? `\`${s.t}\`` : s.href ? `[${s.t}](${s.href})` : s.b ? `**${s.t}**` : s.t)).join("")).join("\n\n");

/* ------------------------------------------------------------------ */
/* Artefatos por resposta (bloco "Sessões com artefatos")              */
/* ------------------------------------------------------------------ */


export type SessionArtifact = { id: string; kind: ArtifactKind; title: string; meta: string };
export type RunInfo = { durationMs: number; steps: number; tools: number; tokens: number; cost: string };

/** Execução de cada resposta: `sessão:entrada` → métricas da linha "Concluído em…". */
export const runByAnswer: Record<string, RunInfo> = {
  "field-guide:m3": { durationMs: 41_200, steps: 3, tools: 2, tokens: 18_400, cost: "R$ 0,24" },
  "mcp-notion:m3": { durationMs: 8_100, steps: 3, tools: 2, tokens: 21_900, cost: "R$ 0,28" },
  "mcp-notion:m6": { durationMs: 1_900, steps: 2, tools: 1, tokens: 6_300, cost: "R$ 0,08" },
  "mcp-notion:m9": { durationMs: 4_600, steps: 3, tools: 3, tokens: 9_800, cost: "R$ 0,13" },
  "tokens:m3": { durationMs: 5_500, steps: 2, tools: 1, tokens: 12_100, cost: "R$ 0,16" },
  "agenda:m3": { durationMs: 2_300, steps: 1, tools: 1, tokens: 1_200, cost: "R$ 0,02" },
  "cx:m3": { durationMs: 6_000, steps: 2, tools: 1, tokens: 33_700, cost: "R$ 0,44" },
  "gav:m2": { durationMs: 3_800, steps: 2, tools: 1, tokens: 8_900, cost: "R$ 0,12" },
};

/** O que cada resposta produziu (abre no painel de artefatos). */
export const artifactsByAnswer: Record<string, SessionArtifact[]> = {
  "field-guide:m3": [{ id: "fg-doc", kind: "doc", title: "Field Guide FC v12", meta: "4 seções em revisão" }],
  "mcp-notion:m3": [{ id: "mcp-sheet", kind: "sheet", title: "Comparativo das conexões", meta: "6 critérios · 1 divergência" }],
  "mcp-notion:m9": [{ id: "mcp-msg", kind: "email", title: "Resumo enviado no Slack", meta: "#os-mcp · 30/09 14:12" }],
  "tokens:m3": [{ id: "tok-report", kind: "report", title: "Tokens por tipo de tarefa", meta: "50 sessões · 3 modelos" }],
  "cx:m3": [{ id: "cx-report", kind: "report", title: "Resumo de CX · 29/09", meta: "142 tickets · 6 temas" }],
  "gav:m2": [{ id: "gav-sheet", kind: "sheet", title: "GAV por unidade", meta: "agosto × setembro" }],
};

/** Continuações sugeridas na última resposta de cada sessão. */
export const followUpsBySession: Record<string, string[]> = {
  "mcp-notion": ["Testar escrita nas duas conexões", "Abrir a issue #1116", "Resumir para a DIREX"],
  "field-guide": ["Mostrar o que mudou na v12", "Avisar o time comercial"],
  tokens: ["Simular corte de 38 %", "Comparar por pessoa"],
  cx: ["Abrir tickets de cobrança duplicada", "Criar alerta para o gateway"],
  gav: ["Detalhar SP por categoria", "Comparar com o orçamento"],
  agenda: ["Reconectar o Google Agenda"],
};

/** Contexto usado por sessão (aba Contexto). */
export const contextBySession: Record<string, ContextItem[]> = {
  "mcp-notion": [
    { id: "c1", kind: "doc", title: "Field Guide FC — página principal", detail: "Notion · 75 imagens, 18 tabelas", relevance: 0.92, citations: 4, pinned: true },
    { id: "c2", kind: "tool", title: "notion.ler_pagina", detail: "2 conexões · 6,7 s", relevance: 0.81, citations: 3 },
    { id: "c3", kind: "record", title: "Issue GitHub #1116", detail: "Validar fluxo OAuth do MCP", relevance: 0.64, citations: 2 },
    { id: "c4", kind: "web", title: "Canal #os-mcp", detail: "Slack · 12 mensagens", relevance: 0.38, citations: 1 },
  ],
  "field-guide": [
    { id: "c1", kind: "doc", title: "Ata da DIREX 23/09", detail: "Notion", relevance: 0.95, citations: 3, pinned: true },
    { id: "c2", kind: "doc", title: "Field Guide FC v11", detail: "Notion · versão publicada", relevance: 0.88, citations: 4 },
  ],
  cx: [
    { id: "c1", kind: "table", title: "Tickets de 29/09", detail: "Zendesk · 142 tickets", relevance: 0.97, citations: 6, pinned: true },
    { id: "c2", kind: "record", title: "Mudança de gateway 28/09", detail: "Changelog financeiro", relevance: 0.7, citations: 1 },
  ],
  tokens: [{ id: "c1", kind: "table", title: "Uso de tokens · últimas 50 sessões", detail: "Databricks", relevance: 0.93, citations: 3, pinned: true }],
  gav: [{ id: "c1", kind: "table", title: "GAV por unidade · ago–set", detail: "Planilha financeira", relevance: 0.9, citations: 2, pinned: true }],
};

/** Conteúdo das planilhas/relatórios de exemplo. */
export const connectionCompare = [
  { criterio: "Texto dos toggles", notion: "Igual", oficial: "Igual", ok: true },
  { criterio: "Tabelas (18)", notion: "Igual", oficial: "Igual", ok: true },
  { criterio: "Imagens (75)", notion: "Idênticas", oficial: "Idênticas", ok: true },
  { criterio: "Prévia de link (planilha)", notion: "Link para planilha", oficial: "Página em branco", ok: false },
  { criterio: "Tempo de leitura", notion: "3,2 s", oficial: "3,5 s", ok: true },
  { criterio: "Escrita", notion: "Não testada", oficial: "Não testada", ok: true },
];
export const gavByUnit = [
  { unidade: "São Paulo", agosto: 412_000, setembro: 457_300 },
  { unidade: "Rio de Janeiro", agosto: 188_000, setembro: 190_400 },
  { unidade: "Belo Horizonte", agosto: 121_500, setembro: 122_100 },
  { unidade: "Curitiba", agosto: 96_800, setembro: 97_900 },
  { unidade: "Recife", agosto: 74_200, setembro: 73_600 },
];
export const cxThemes = [
  { label: "Acesso ao portal", value: 44 },
  { label: "Cobrança duplicada", value: 26 },
  { label: "Nota fiscal", value: 21 },
  { label: "Cancelamento", value: 19 },
  { label: "Integração", value: 17 },
  { label: "Outros", value: 15 },
];
export const tokensByTask = [
  { tarefa: "Pesquisa", opus: 182_000, sonnet: 96_000, haiku: 31_000 },
  { tarefa: "Execução", opus: 74_000, sonnet: 41_000, haiku: 12_000 },
  { tarefa: "Resumo", opus: 38_000, sonnet: 22_000, haiku: 9_000 },
];

/** Artefato gerado por um pedido novo (por palavra-chave). */
export function artifactFor(prompt: string, seq: number): SessionArtifact {
  const p = prompt.toLowerCase();
  if (p.includes("planilha") || p.includes("compar") || p.includes("tabela")) return { id: `art-${seq}`, kind: "sheet", title: "Planilha da análise", meta: "gerada agora" };
  if (p.includes("slack") || p.includes("e-mail") || p.includes("email") || p.includes("manda")) return { id: `art-${seq}`, kind: "email", title: "Mensagem preparada", meta: "rascunho · não enviada" };
  return { id: `art-${seq}`, kind: "report", title: "Relatório da resposta", meta: "3 achados" };
}

/* ------------------------------------------------------------------ */
/* Projetos (lista "Por projeto") e modelos (chip de modelo)           */
/* ------------------------------------------------------------------ */

export const osProjects: SessionProject[] = [
  { id: "field-guide", name: "Field Guide FC" },
  { id: "g4-os", name: "g4-os · MCP e conexões" },
  { id: "cx", name: "Atendimento e CX" },
  { id: "rotinas", name: "Rotinas" },
  { id: "financeiro", name: "Financeiro" },
  { id: "produto", name: "Produto e design" },
];

/** Projeto de cada sessão (as sessões novas herdam o projeto escolhido). */
export const projectOf: Record<string, string> = {
  "field-guide": "field-guide",
  funil: "field-guide",
  "mcp-notion": "g4-os",
  tokens: "g4-os",
  old: "g4-os",
  agenda: "rotinas",
  morning: "rotinas",
  cx: "cx",
  "help-1": "cx",
  gav: "financeiro",
  design: "produto",
};
sessions.forEach((s) => {
  if (!s.projectId && projectOf[s.id]) s.projectId = projectOf[s.id];
});

export const osModels: ModelOption[] = [
  { id: "sol", name: "Sol", group: "G4 OS", description: "Equilíbrio entre velocidade e cuidado (padrão)" },
  { id: "sol-max", name: "Sol Max", group: "G4 OS", description: "Tarefas longas, código e análises profundas" },
  { id: "brisa", name: "Brisa", group: "G4 OS", description: "Respostas rápidas e baratas" },
  { id: "claude-opus", name: "Claude Opus", group: "Externos", description: "Raciocínio e escrita longa" },
  { id: "gpt", name: "GPT", group: "Externos", description: "Compatível com fluxos legados" },
];
