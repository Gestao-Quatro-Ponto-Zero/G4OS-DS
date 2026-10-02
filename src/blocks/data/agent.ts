/*
 * Dados do "Agente G4" (workspace de análise): projetos, execuções, trace,
 * relatório, contexto e planilha. Mesma empresa (Acme) e mesmas pessoas do
 * Atlas/CRM. "Hoje" = 30/09/2026. Troque pela sua API.
 */
import type { ContextItem, SheetColumn, TraceStep } from "@g4ai/ds";
import { people } from "./workspace";

export type ProjectStatus = "concluido" | "executando" | "aguardando" | "falhou";

export type AgentProject = {
  id: string;
  title: string;
  question: string;
  status: ProjectStatus;
  owner: string; // id de people
  agent: "Analista de receita" | "Analista financeiro" | "Pesquisa de mercado" | "Operações";
  lastRun: string;
  durationMs: number;
  artifacts: number;
  tokens: number;
  cost: number;
};

export const projects: AgentProject[] = [
  { id: "p1", title: "Queda de conversão no funil de PMEs", question: "Por que a conversão de PMEs caiu em setembro?", status: "concluido", owner: "joana", agent: "Analista de receita", lastRun: "hoje, 09:42", durationMs: 40200, artifacts: 3, tokens: 48210, cost: 0.62 },
  { id: "p2", title: "Atraso de pagamentos no Nordeste", question: "Quais clientes do Nordeste estão atrasando e por quê?", status: "aguardando", owner: "elisa", agent: "Analista financeiro", lastRun: "hoje, 08:15", durationMs: 27800, artifacts: 2, tokens: 31400, cost: 0.41 },
  { id: "p3", title: "Preço percebido vs. concorrentes", question: "Como nosso preço é percebido frente à concorrência?", status: "executando", owner: "rafael", agent: "Pesquisa de mercado", lastRun: "agora", durationMs: 12000, artifacts: 1, tokens: 9800, cost: 0.14 },
  { id: "p4", title: "Churn de contas Enterprise no trimestre", question: "Quais contas Enterprise têm risco de cancelar?", status: "concluido", owner: "ana", agent: "Analista de receita", lastRun: "ontem, 17:30", durationMs: 52400, artifacts: 4, tokens: 61200, cost: 0.83 },
  { id: "p5", title: "Estoque parado no CD Campinas", question: "Quais SKUs estão parados há mais de 90 dias?", status: "falhou", owner: "diego", agent: "Operações", lastRun: "ontem, 11:02", durationMs: 8100, artifacts: 0, tokens: 4200, cost: 0.06 },
  { id: "p6", title: "Previsão de caixa para outubro", question: "Vamos fechar outubro com caixa acima do mínimo?", status: "concluido", owner: "elisa", agent: "Analista financeiro", lastRun: "28/09, 18:10", durationMs: 33600, artifacts: 2, tokens: 38900, cost: 0.51 },
  { id: "p7", title: "Tempo de resposta a leads inbound", question: "Quanto tempo levamos para responder um lead inbound?", status: "concluido", owner: "carla", agent: "Analista de receita", lastRun: "27/09, 10:24", durationMs: 21400, artifacts: 2, tokens: 22100, cost: 0.29 },
  { id: "p8", title: "Motivos de perda em negociação", question: "Por que perdemos negócios na etapa de negociação?", status: "concluido", owner: "bruno", agent: "Analista de receita", lastRun: "25/09, 15:48", durationMs: 29800, artifacts: 3, tokens: 34500, cost: 0.46 },
];

export const statusLabel: Record<ProjectStatus, string> = { concluido: "Concluído", executando: "Executando", aguardando: "Aguardando aprovação", falhou: "Falhou" };
export const statusTone: Record<ProjectStatus, "ok" | "info" | "warn" | "bad"> = { concluido: "ok", executando: "info", aguardando: "warn", falhou: "bad" };

export const projectById = (id: string | null | undefined) => projects.find((p) => p.id === id) ?? projects[0];
export const ownerOf = (p: AgentProject) => people.find((x) => x.id === p.owner) ?? people[0];

/* ------------------------------------------------------------------ */
/* Execução (trace) — mesma forma para todos os projetos de exemplo     */
/* ------------------------------------------------------------------ */

export function traceFor(p: AgentProject): TraceStep[] {
  const k = p.durationMs / 40200;
  const s = (ms: number) => Math.round(ms * k);
  return [
    {
      id: "run",
      kind: "agent",
      title: p.agent,
      startMs: 0,
      durationMs: s(40200),
      tokens: p.tokens,
      status: p.status === "falhou" ? "error" : undefined,
      children: [
        { id: "plan", kind: "thinking", title: "Planejar a análise", startMs: 0, durationMs: s(2400), tokens: 1100 },
        { id: "crm", kind: "tool", title: "crm.listar_negocios · setembro", startMs: s(2400), durationMs: s(3100), tokens: 4200 },
        { id: "funnel", kind: "tool", title: "analytics.funil · PMEs × Mid-market", startMs: s(5600), durationMs: s(4200), tokens: 3600 },
        {
          id: "research",
          kind: "agent",
          title: "Subagente de pesquisa",
          startMs: s(5600),
          durationMs: s(15800),
          tokens: 18400,
          children: [
            { id: "calls", kind: "tool", title: "gravacoes.transcrever · 38 ligações", startMs: s(5800), durationMs: s(9400), tokens: 12600 },
            { id: "web", kind: "search", title: "web.buscar · preços de concorrentes", startMs: s(9900), durationMs: s(3800), tokens: 2400 },
            { id: "site", kind: "tool", title: "site.ler · /precos", startMs: s(15400), durationMs: s(1200), tokens: 900, status: p.status === "falhou" ? "error" : undefined },
          ],
        },
        { id: "cross", kind: "thinking", title: "Cruzar funil com objeções das ligações", startMs: s(21600), durationMs: s(6200), tokens: 5400 },
        { id: "sheet", kind: "output", title: "Montar planilha de páginas com preço", startMs: s(27800), durationMs: s(4800), tokens: 4100 },
        { id: "report", kind: "output", title: "Escrever relatório", startMs: s(32600), durationMs: s(7600), tokens: 7200 },
      ],
    },
  ];
}

/** Entrada/saída de exemplo por passo (inspector). */
export const stepIO: Record<string, { input: unknown; output: unknown; latencyMs?: number; error?: string }> = {
  plan: { input: { pergunta: "Por que a conversão de PMEs caiu em setembro?" }, output: { passos: ["comparar funil", "ouvir ligações perdidas", "checar preço público", "concluir"] } },
  crm: { input: { segmento: "PME", periodo: "2026-09", etapa: "*" }, output: { negocios: 412, ganhos: 38, perdidos: 121, taxa_ganho: 0.092 }, latencyMs: 820 },
  funnel: { input: { segmentos: ["PME", "Mid-market"], meses: ["2026-08", "2026-09"] }, output: { pme: { ago: 0.141, set: 0.092 }, mid: { ago: 0.118, set: 0.121 } }, latencyMs: 1340 },
  calls: { input: { filtro: "perdido · PME · set/2026", limite: 40 }, output: { transcritas: 38, objecoes_top: ["preço pouco claro", "preço alto", "falta de parcelamento"] }, latencyMs: 9120 },
  web: { input: { consulta: "planos CRM PME preço mensal 2026" }, output: { concorrentes: 6, faixa: "R$ 59–R$ 149 por usuário" }, latencyMs: 2980 },
  site: { input: { url: "https://acme.com.br/precos" }, output: { paginas_com_preco: 9, sem_preco_final: 5 }, latencyMs: 640, error: undefined },
  cross: { input: { funil: "…", objecoes: "…" }, output: { hipotese: "Queda concentrada após a mudança da página de preços em 02/09" } },
  sheet: { input: { paginas: 9 }, output: { linhas: 9, alteradas: 7 } },
  report: { input: { secoes: ["Relatório", "Descrição", "Visibilidade"] }, output: { palavras: 412, artefatos: 2 } },
};

/* ------------------------------------------------------------------ */
/* Relatório, contexto, planilha                                        */
/* ------------------------------------------------------------------ */

export const answer = [
  "A conversão de PMEs caiu de 14,1 % em agosto para 9,2 % em setembro, enquanto Mid-market ficou estável (11,8 % → 12,1 %). A queda começou na semana de 02/09, quando a página de preços trocou o valor mensal por “a partir de”.",
  "Em 38 ligações de negócios perdidos, a objeção mais citada foi preço pouco claro (17 menções), à frente de preço alto (9). Clientes chegam à demo sem saber quanto vão pagar e saem para comparar com concorrentes que mostram o preço final.",
  "Sugiro publicar o preço final por usuário em todas as páginas de plano e no e-mail pós-demo. Montei uma planilha com as 9 páginas que citam preço e o que muda em cada uma.",
];

export const insights = {
  objections: [
    { label: "Preço pouco claro", badge: "Novo" },
    { label: "Falta de parcelamento", badge: "Novo" },
    { label: "Preço alto", value: "9 menções" },
  ],
  conversion: [
    { label: "PME", value: 0.092, delta: -0.049 },
    { label: "Mid-market", value: 0.121, delta: 0.003 },
  ],
};

export const visibility = [
  { dia: "01/09", conv: 14.3 },
  { dia: "04/09", conv: 13.8 },
  { dia: "08/09", conv: 11.2 },
  { dia: "11/09", conv: 10.1 },
  { dia: "15/09", conv: 9.6 },
  { dia: "18/09", conv: 9.9 },
  { dia: "22/09", conv: 8.8 },
  { dia: "25/09", conv: 9.1 },
  { dia: "29/09", conv: 9.2 },
];

export const context: ContextItem[] = [
  { id: "c1", kind: "record", title: "Negócios de PMEs · setembro", detail: "412 negócios · CRM Acme", relevance: 0.94, citations: 4, pinned: true },
  { id: "c2", kind: "table", title: "Funil por segmento · ago–set", detail: "analytics.funil", relevance: 0.88, citations: 3 },
  { id: "c3", kind: "doc", title: "Transcrições de 38 ligações perdidas", detail: "Gravações · 7 h 12 min", relevance: 0.81, citations: 5 },
  { id: "c4", kind: "web", title: "Página de preços da Acme", detail: "acme.com.br/precos · versão de 02/09", relevance: 0.72, citations: 2 },
  { id: "c5", kind: "web", title: "Preços de 6 concorrentes", detail: "Pesquisa pública · 30/09", relevance: 0.46, citations: 1 },
  { id: "c6", kind: "tool", title: "crm.listar_negocios", detail: "3 chamadas · 2,1 s", relevance: 0.6 },
  { id: "c7", kind: "tool", title: "gravacoes.transcrever", detail: "1 chamada · 9,4 s", relevance: 0.55 },
];

export const sheetColumns: SheetColumn[] = [
  { key: "pagina", label: "Página", width: 180 },
  { key: "visitas", label: "Visitas/mês", align: "right", format: (v) => Number(v).toLocaleString("pt-BR") },
  { key: "antes", label: "Texto atual" },
  { key: "depois", label: "Proposta do agente", width: 220 },
  { key: "prioridade", label: "Prioridade" },
];

export const sheetRows = [
  { pagina: "/precos", visitas: 18400, antes: "a partir de R$ 59", depois: "R$ 89 por usuário/mês, sem taxa de implantação", prioridade: "Alta" },
  { pagina: "/planos/essencial", visitas: 6200, antes: "a partir de R$ 59", depois: "R$ 59 por usuário/mês, até 5 usuários", prioridade: "Alta" },
  { pagina: "/planos/pro", visitas: 5100, antes: "fale com vendas", depois: "R$ 89 por usuário/mês", prioridade: "Alta" },
  { pagina: "/planos/enterprise", visitas: 2300, antes: "fale com vendas", depois: "fale com vendas (mantém)", prioridade: "Baixa" },
  { pagina: "/pme", visitas: 4800, antes: "planos acessíveis", depois: "a partir de R$ 59 por usuário/mês", prioridade: "Média" },
  { pagina: "/comparativo", visitas: 3900, antes: "melhor custo-benefício", depois: "tabela com preço final × 3 concorrentes", prioridade: "Média" },
  { pagina: "/demo (e-mail pós-demo)", visitas: 1200, antes: "proposta em até 2 dias", depois: "preço final no próprio e-mail", prioridade: "Alta" },
  { pagina: "/blog/quanto-custa-um-crm", visitas: 7600, antes: "depende do plano", depois: "faixa de preço com exemplos", prioridade: "Média" },
  { pagina: "/parceiros", visitas: 900, antes: "condições especiais", depois: "condições especiais (mantém)", prioridade: "Baixa" },
];

export const sheetChanged = ["0:depois", "1:depois", "2:depois", "4:depois", "5:depois", "6:depois", "7:depois"];

export const slashCommands = [
  { id: "rel", label: "relatorio", description: "Gera um relatório com achados e gráficos" },
  { id: "pla", label: "planilha", description: "Monta uma planilha a partir dos dados" },
  { id: "res", label: "resumo", description: "Resume a conversa em 5 tópicos" },
  { id: "ema", label: "email", description: "Redige um e-mail com o resultado" },
];

export const followUps = ["Compare com o mesmo mês de 2025", "Quais vendedores foram mais afetados?", "Crie o e-mail para o time de marketing"];

/** Fontes que ainda não estão no contexto e podem ser adicionadas ("+ Adicionar fonte"). */
export const extraSources: ContextItem[] = [
  { id: "x1", kind: "record", title: "Negócios de Mid-market · setembro", detail: "188 negócios · CRM Acme" },
  { id: "x2", kind: "table", title: "Receita por plano · 2026", detail: "analytics.receita_planos" },
  { id: "x3", kind: "doc", title: "Pesquisa de preço com clientes · Q2", detail: "Drive · 24 entrevistas" },
  { id: "x4", kind: "web", title: "Página de preços da Acme · versão de agosto", detail: "acme.com.br/precos · arquivo de 31/08" },
  { id: "x5", kind: "doc", title: "Política comercial de descontos", detail: "Notion · atualizada em 15/09" },
];
