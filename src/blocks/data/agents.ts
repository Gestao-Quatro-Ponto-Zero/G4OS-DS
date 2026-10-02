/*
 * Frota de agentes do "Agente G4": os agentes de IA que a Acme roda em
 * produção, com dono, modelo, versões, execuções, avaliações, aprovações
 * pendentes, orçamento e governança. Mesma empresa e mesmas pessoas do
 * Atlas/CRM (data/workspace). "Agora" = 30/09/2026, 10:30. Troque pela sua API.
 *
 * Compatível com data/agent.ts (projetos do workspace: o "Analista de receita"
 * é um agente desta frota) e com data/agent-builder.ts (gatilhos e ferramentas
 * usam os mesmos apps, então o construtor abre qualquer agente por ?id=).
 */
import type { TraceStep } from "@g4ai/ds";
import { people, type Person } from "./workspace";
import type { AppId } from "./agent-builder";

export const NOW = new Date("2026-09-30T10:30:00");
export const TODAY = "2026-09-30";

/* ------------------------------------------------------------------ */
/* Modelos                                                             */
/* ------------------------------------------------------------------ */

export type ModelId = "g4-pro" | "g4-rapido" | "g4-analitico" | "g4-mini";
export type Model = { id: ModelId; name: string; provider: string; input: number; output: number; note: string; allowed: boolean; dataInBrazil: boolean };

/** Preço em R$ por 1 milhão de tokens (entrada / saída). */
export const models: Model[] = [
  { id: "g4-pro", name: "G4 Pro", provider: "Claude Sonnet via G4", input: 16.5, output: 82.5, note: "Padrão para agentes que escrevem para clientes", allowed: true, dataInBrazil: true },
  { id: "g4-rapido", name: "G4 Rápido", provider: "Claude Haiku via G4", input: 5.5, output: 27.5, note: "Classificação, triagem e alto volume", allowed: true, dataInBrazil: true },
  { id: "g4-analitico", name: "G4 Analítico", provider: "Claude Opus via G4", input: 82.5, output: 412.5, note: "Análises longas; exige aprovação do dono da área", allowed: true, dataInBrazil: true },
  { id: "g4-mini", name: "G4 Mini (experimental)", provider: "Modelo aberto hospedado nos EUA", input: 1.1, output: 4.4, note: "Sem garantia de residência de dados no Brasil", allowed: false, dataInBrazil: false },
];
export const modelById = (id: ModelId) => models.find((m) => m.id === id) ?? models[0];

/* ------------------------------------------------------------------ */
/* Agentes                                                             */
/* ------------------------------------------------------------------ */

export type AgentStatus = "ativo" | "pausado" | "rascunho" | "erro";
export const agentStatusLabel: Record<AgentStatus, string> = { ativo: "Ativo", pausado: "Pausado", rascunho: "Rascunho", erro: "Com erro" };
export const agentStatusTone: Record<AgentStatus, "ok" | "warn" | "neutral" | "bad"> = { ativo: "ok", pausado: "warn", rascunho: "neutral", erro: "bad" };

export type Area = "Comercial" | "Financeiro" | "Suporte" | "Pessoas" | "Fiscal" | "Operações" | "Marketing";
export const areas: Area[] = ["Comercial", "Financeiro", "Suporte", "Pessoas", "Fiscal", "Operações", "Marketing"];

export type TriggerKind = "evento" | "agenda" | "manual" | "api";
export const triggerKindLabel: Record<TriggerKind, string> = { evento: "Evento", agenda: "Agenda", manual: "Manual", api: "API" };

export type Access = "leitura" | "escrita" | "escrita com aprovação";

/** Um passo do fluxo padrão do agente (vira o plano e o trace das execuções). */
export type FlowStep = {
  id: string;
  kind: "thinking" | "tool" | "search" | "output";
  title: string;
  /** Duração de referência (ms) numa execução típica. */
  ms: number;
  tokens: number;
  /** Ferramenta/conector usado ("crm.buscar_lead"). */
  tool?: string;
  /** Passo que espera aprovação humana antes de agir. */
  approval?: boolean;
  input?: unknown;
  output?: unknown;
  note?: string;
};

export type AgentVersion = {
  version: string;
  date: string;
  time: string;
  author: string; // id de people
  kind: "major" | "minor";
  title: string;
  notes: string[];
  /** Score médio das avaliações nesta versão (0–1). */
  score?: number;
  stage?: "producao" | "canario" | "anterior" | "rascunho";
};

export type Region = { place: string; timeZone: string; dc: string; brazil: boolean };

export type FleetAgent = {
  id: string;
  name: string;
  purpose: string;
  area: Area;
  owner: string; // id de people
  model: ModelId;
  status: AgentStatus;
  /** Versão em produção (null = nunca publicado). */
  version: string | null;
  region: Region;
  trigger: { kind: TriggerKind; text: string };
  /** Execuções por dia nos últimos 7 dias (24/09 → 30/09). */
  runs7d: number[];
  runs30d: number;
  successRate: number;
  p95Ms: number;
  cost30d: number;
  budget: number;
  tokens30d: number;
  tools: { id: string; label: string; app?: AppId; access: Access }[];
  data: string[];
  editors: string[];
  watchers: string[];
  flow: FlowStep[];
  versions: AgentVersion[];
  /** Próxima versão em rollout gradual. */
  rollout?: { version: string; owner: string; due: string; late?: boolean; milestones: { id: string; title: string; description?: string; status: "done" | "current" | "todo"; date?: string }[] };
  /** Gatilhos e ferramentas no formato do construtor (data/agent-builder). */
  builder: { triggers: { app: AppId; text: string }[]; tools: AppId[] };
  /** Motivo do erro/pausa, em uma frase. */
  issue?: string;
  createdAt: string;
};

const sp: Region = { place: "São Paulo, SP", timeZone: "America/Sao_Paulo", dc: "Brasil · São Paulo (sa-east-1)", brazil: true };
const fortaleza: Region = { place: "Fortaleza, CE", timeZone: "America/Fortaleza", dc: "Brasil · Fortaleza (borda NE)", brazil: true };
const virginia: Region = { place: "Virgínia, EUA", timeZone: "America/New_York", dc: "EUA · Virgínia (us-east-1)", brazil: false };

export const agents: FleetAgent[] = [
  {
    id: "sdr-inbound",
    name: "SDR de inbound",
    purpose: "Qualifica leads do site em até 5 minutos, enriquece com dados públicos e agenda a reunião com o executivo certo.",
    area: "Comercial",
    owner: "rafael",
    model: "g4-pro",
    status: "ativo",
    version: "3.4",
    region: sp,
    trigger: { kind: "evento", text: "Novo lead no formulário do site" },
    runs7d: [212, 238, 251, 96, 74, 266, 241],
    runs30d: 4870,
    successRate: 0.962,
    p95Ms: 18400,
    cost30d: 1948,
    budget: 2500,
    tokens30d: 61_200_000,
    tools: [
      { id: "crm", label: "Acme CRM · leads e negócios", app: "g4crm", access: "escrita" },
      { id: "agenda", label: "Google Agenda dos executivos", app: "gdrive", access: "escrita" },
      { id: "email", label: "E-mail de primeiro contato", app: "hubspot", access: "escrita com aprovação" },
      { id: "web", label: "Busca na web (dados públicos)", access: "leitura" },
    ],
    data: ["Leads e negócios do CRM", "Agenda de 6 executivos", "Site e LinkedIn da empresa do lead"],
    editors: ["rafael", "ana", "eduardo"],
    watchers: ["joana", "carla", "bruno", "diego", "marina"],
    flow: [
      { id: "plan", kind: "thinking", title: "Entender o lead e o que ele pediu", ms: 1400, tokens: 900, output: { intencao: "demonstração", urgencia: "alta" } },
      { id: "crm", kind: "tool", title: "crm.buscar_lead", tool: "crm.buscar_lead", ms: 600, tokens: 300, input: { email: "marcos@redehorizonte.edu.br" }, output: { lead: "LD-9921", origem: "Formulário /demo", duplicado: false } },
      { id: "enrich", kind: "search", title: "web.buscar · empresa e cargo", tool: "web.buscar", ms: 4200, tokens: 3100, input: { q: "Rede Horizonte educação funcionários" }, output: { funcionarios: 1200, segmento: "Educação", cidade: "Curitiba" } },
      { id: "score", kind: "thinking", title: "Pontuar o lead (ICP e urgência)", ms: 2100, tokens: 1600, output: { score: 82, faixa: "A", motivo: "1.200 funcionários, pediu demo, cargo decisor" } },
      { id: "route", kind: "tool", title: "crm.atribuir_executivo", tool: "crm.atribuir", ms: 700, tokens: 200, input: { regiao: "Sul", segmento: "Educação" }, output: { executivo: "Bruno Takeda" } },
      { id: "slot", kind: "tool", title: "agenda.buscar_horarios", tool: "agenda.livres", ms: 1300, tokens: 400, input: { pessoa: "bruno", dias: 3 }, output: { horarios: ["01/10 10:00", "01/10 15:30", "02/10 09:00"] } },
      { id: "email", kind: "output", title: "Redigir e-mail com 3 horários", ms: 3800, tokens: 2400, approval: true, output: { assunto: "Demonstração Acme · escolha um horário", palavras: 118 } },
    ],
    versions: [
      { version: "3.5", date: "2026-09-29", time: "17:40", author: "eduardo", kind: "minor", title: "Responde em espanhol para leads da América Latina", notes: ["Detecta o idioma do formulário", "Modelo de e-mail em espanhol revisado pelo time de LatAm"], score: 0.94, stage: "canario" },
      { version: "3.4", date: "2026-09-18", time: "11:05", author: "rafael", kind: "minor", title: "Roteamento por região e segmento", notes: ["Leads de Educação vão para Bruno Takeda", "Fila de reserva quando o executivo está de férias"], score: 0.93, stage: "producao" },
      { version: "3.3", date: "2026-09-09", time: "16:20", author: "ana", kind: "minor", title: "Enriquecimento com LinkedIn da empresa", notes: ["Número de funcionários e segmento entram no score", "Leads com e-mail pessoal ganham uma pergunta a mais"], score: 0.9, stage: "anterior" },
      { version: "3.0", date: "2026-08-25", time: "09:30", author: "rafael", kind: "major", title: "Agenda a reunião sozinho", notes: ["Busca horários livres do executivo", "E-mail com 3 opções; aprovação humana no primeiro contato"], score: 0.87, stage: "anterior" },
      { version: "2.2", date: "2026-08-12", time: "14:10", author: "eduardo", kind: "minor", title: "Score de ICP revisado", notes: ["Pesos novos por segmento e porte"], score: 0.84, stage: "anterior" },
      { version: "2.0", date: "2026-07-30", time: "10:00", author: "rafael", kind: "major", title: "Qualificação automática", notes: ["Primeira versão em produção", "Só qualifica; o executivo agenda"], score: 0.81, stage: "anterior" },
    ],
    rollout: {
      version: "3.5",
      owner: "eduardo",
      due: "2026-10-06",
      milestones: [
        { id: "m1", title: "Avaliações acima de 90 %", description: "Suíte de qualificação: 94 % · nenhuma regressão", status: "done", date: "2026-09-29" },
        { id: "m2", title: "Canário com 10 % dos leads", description: "62 execuções · 0 falha · p95 17,8 s", status: "current", date: "2026-09-30" },
        { id: "m3", title: "50 % dos leads", status: "todo", date: "2026-10-02" },
        { id: "m4", title: "100 % e aposentar a 3.4", status: "todo", date: "2026-10-06" },
      ],
    },
    builder: { triggers: [{ app: "hubspot", text: "Novo envio do formulário “Fale com vendas”" }, { app: "slack", text: "Mensagem com “lead” em #inbound" }], tools: ["g4crm", "gdrive", "linkedin"] },
    createdAt: "2026-07-12",
  },
  {
    id: "followup",
    name: "Follow-up de propostas",
    purpose: "Dois dias depois de uma proposta enviada, lê o histórico do negócio e prepara o e-mail de próximo passo para o executivo aprovar.",
    area: "Comercial",
    owner: "ana",
    model: "g4-pro",
    status: "ativo",
    version: "2.1",
    region: sp,
    trigger: { kind: "agenda", text: "Todo dia às 9h, propostas sem resposta há 2 dias" },
    runs7d: [38, 41, 44, 0, 0, 47, 42],
    runs30d: 812,
    successRate: 0.941,
    p95Ms: 12100,
    cost30d: 341,
    budget: 400,
    tokens30d: 6_800_000,
    tools: [
      { id: "crm", label: "Acme CRM · negócios", app: "g4crm", access: "leitura" },
      { id: "files", label: "Arquivos do negócio (propostas)", app: "gdrive", access: "leitura" },
      { id: "erp", label: "ERP · faturas do cliente", access: "leitura" },
      { id: "email", label: "E-mail do executivo", app: "hubspot", access: "escrita com aprovação" },
    ],
    data: ["Negócios em Proposta e Negociação", "PDFs de propostas", "Faturas abertas no ERP"],
    editors: ["ana", "rafael"],
    watchers: ["diego", "carla", "bruno"],
    flow: [
      { id: "plan", kind: "thinking", title: "Planejar os passos", ms: 1100, tokens: 640, output: { passos: ["buscar negócio", "ler proposta", "pesquisar empresa", "consultar faturas", "redigir e-mail"] } },
      { id: "crm", kind: "tool", title: "crm.buscar_negocio", tool: "crm.buscar_negocio", ms: 420, tokens: 180, input: { empresa: "Grupo Aurora Alimentos" }, output: { id: "NEG-2291", etapa: "Negociação", valor: 460800 } },
      { id: "doc", kind: "tool", title: "arquivos.ler · Proposta v3.pdf", tool: "arquivos.ler", ms: 1300, tokens: 2600, input: { arquivo: "Proposta v3.pdf" }, output: { preco_usuario_mes: 160, prazo_meses: 12, implantacao_dias: 60 } },
      { id: "web", kind: "search", title: "web.buscar · notícias da empresa", tool: "web.buscar", ms: 1200, tokens: 400, input: { q: "Grupo Aurora Alimentos 2026" }, output: { resultados: 6, relevantes: 2 } },
      { id: "erp", kind: "tool", title: "erp.consultar_faturas", tool: "erp.consultar_faturas", ms: 1100, tokens: 260, input: { cliente: "AURORA-01" }, output: { faturas_abertas: 0, inadimplencia: false } },
      { id: "cross", kind: "thinking", title: "Cruzar proposta com histórico", ms: 1300, tokens: 1100, output: { riscos: ["SLA 99,9 %", "prazo de implantação"], argumento: "case Santa Clara" } },
      { id: "out", kind: "output", title: "Redigir e-mail de follow-up", ms: 2600, tokens: 1300, approval: true, output: { assunto: "Próximos passos · licenças Aurora", palavras: 142 } },
    ],
    versions: [
      { version: "2.1", date: "2026-09-15", time: "10:12", author: "ana", kind: "minor", title: "Consulta faturas antes de cobrar resposta", notes: ["Não insiste com cliente inadimplente", "Nova tentativa automática quando o ERP demora"], score: 0.92, stage: "producao" },
      { version: "2.0", date: "2026-08-28", time: "15:00", author: "ana", kind: "major", title: "Lê a proposta em PDF", notes: ["Cita preço, prazo e implantação da proposta", "Tom ajustado ao guia de voz"], score: 0.89, stage: "anterior" },
      { version: "1.4", date: "2026-08-02", time: "11:30", author: "rafael", kind: "minor", title: "Ignora negócios em pausa", notes: ["Etapa “Em pausa” fica de fora"], score: 0.85, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "g4crm", text: "Negócio em Proposta sem atividade há 2 dias" }], tools: ["g4crm", "gdrive"] },
    createdAt: "2026-06-20",
  },
  {
    id: "cobranca",
    name: "Cobrança amigável",
    purpose: "Lembra clientes de boletos vencidos por e-mail e WhatsApp, oferece segunda via e propõe parcelamento dentro da política.",
    area: "Financeiro",
    owner: "elisa",
    model: "g4-pro",
    status: "ativo",
    version: "1.8",
    region: sp,
    trigger: { kind: "agenda", text: "Dias úteis às 8h, títulos vencidos de 1 a 30 dias" },
    runs7d: [96, 102, 99, 0, 0, 131, 118],
    runs30d: 2140,
    successRate: 0.978,
    p95Ms: 9800,
    cost30d: 1792,
    budget: 1900,
    tokens30d: 21_400_000,
    tools: [
      { id: "erp", label: "ERP · contas a receber", access: "leitura" },
      { id: "boleto", label: "Banco · segunda via de boleto", access: "escrita" },
      { id: "whats", label: "WhatsApp Business", access: "escrita com aprovação" },
      { id: "email", label: "E-mail do financeiro", app: "hubspot", access: "escrita" },
    ],
    data: ["Títulos a receber", "Contatos financeiros dos clientes", "Política de parcelamento 2026"],
    editors: ["elisa", "joana"],
    watchers: ["marina", "rafael"],
    flow: [
      { id: "list", kind: "tool", title: "erp.titulos_vencidos", tool: "erp.titulos_vencidos", ms: 900, tokens: 400, input: { de: 1, ate: 30 }, output: { titulos: 41, valor: 186400 } },
      { id: "plan", kind: "thinking", title: "Escolher abordagem por cliente", ms: 2400, tokens: 1900, output: { lembrete: 33, segunda_via: 6, parcelamento: 2 } },
      { id: "boleto", kind: "tool", title: "banco.segunda_via", tool: "banco.segunda_via", ms: 1800, tokens: 300, input: { titulos: 6 }, output: { gerados: 6 } },
      { id: "msg", kind: "output", title: "Escrever mensagens", ms: 3100, tokens: 2800, output: { emails: 33, whatsapp: 8 } },
      { id: "deal", kind: "output", title: "Propor parcelamento", ms: 1500, tokens: 900, approval: true, note: "Acima de R$ 10 mil pede aprovação do financeiro", output: { propostas: 2 } },
    ],
    versions: [
      { version: "1.8", date: "2026-09-22", time: "08:40", author: "elisa", kind: "minor", title: "WhatsApp para títulos acima de 15 dias", notes: ["E-mail continua no 1º lembrete", "Mensagem curta, com link da segunda via"], score: 0.95, stage: "producao" },
      { version: "1.7", date: "2026-09-03", time: "17:15", author: "elisa", kind: "minor", title: "Parcelamento em até 4x", notes: ["Política 2026 do financeiro", "Acima de R$ 10 mil pede aprovação"], score: 0.93, stage: "anterior" },
      { version: "1.0", date: "2026-07-01", time: "09:00", author: "joana", kind: "major", title: "Lembretes por e-mail", notes: ["Primeira versão em produção"], score: 0.88, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "sheets", text: "Todo dia útil às 8h" }], tools: ["sheets", "hubspot"] },
    issue: "Gasto em 94 % do orçamento do mês",
    createdAt: "2026-06-15",
  },
  {
    id: "conciliacao",
    name: "Conciliação bancária",
    purpose: "Casa o extrato dos bancos com os lançamentos do ERP e explica as diferenças que sobraram para o financeiro decidir.",
    area: "Financeiro",
    owner: "elisa",
    model: "g4-analitico",
    status: "erro",
    version: "2.0",
    region: sp,
    trigger: { kind: "agenda", text: "Todo dia às 6h, extratos do dia anterior" },
    runs7d: [3, 3, 3, 1, 1, 3, 2],
    runs30d: 74,
    successRate: 0.811,
    p95Ms: 142000,
    cost30d: 612,
    budget: 800,
    tokens30d: 1_900_000,
    tools: [
      { id: "itau", label: "Itaú · extrato (Open Finance)", access: "leitura" },
      { id: "bb", label: "Banco do Brasil · extrato", access: "leitura" },
      { id: "erp", label: "ERP · lançamentos", access: "escrita com aprovação" },
    ],
    data: ["Extratos de 3 contas", "Lançamentos a pagar e a receber"],
    editors: ["elisa"],
    watchers: ["joana", "marina"],
    flow: [
      { id: "itau", kind: "tool", title: "itau.extrato", tool: "itau.extrato", ms: 8200, tokens: 600, input: { conta: "1234-5", data: "2026-09-29" }, output: { lancamentos: 214 } },
      { id: "bb", kind: "tool", title: "bb.extrato", tool: "bb.extrato", ms: 6400, tokens: 500, input: { conta: "88.112-0", data: "2026-09-29" }, output: { lancamentos: 96 } },
      { id: "erp", kind: "tool", title: "erp.lancamentos", tool: "erp.lancamentos", ms: 5100, tokens: 900, output: { lancamentos: 301 } },
      { id: "match", kind: "thinking", title: "Casar valores, datas e favorecidos", ms: 64000, tokens: 22000, output: { casados: 292, sobras: 18 } },
      { id: "report", kind: "output", title: "Explicar as diferenças", ms: 21000, tokens: 6400, approval: true, output: { diferencas: 18, valor: 12840.55 } },
    ],
    versions: [
      { version: "2.0", date: "2026-09-10", time: "18:00", author: "elisa", kind: "major", title: "Três contas e explicação das sobras", notes: ["Inclui Banco do Brasil", "Sugere o lançamento para cada sobra"], score: 0.86, stage: "producao" },
      { version: "1.2", date: "2026-08-14", time: "09:20", author: "elisa", kind: "minor", title: "Tolerância de centavos", notes: ["Diferença até R$ 0,10 conta como casada"], score: 0.84, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "sheets", text: "Todo dia às 6h" }], tools: ["sheets"] },
    issue: "Itaú trocou o formato do extrato: 3 execuções seguidas falharam",
    createdAt: "2026-07-20",
  },
  {
    id: "triagem",
    name: "Triagem de suporte",
    purpose: "Lê cada chamado novo, classifica por produto e urgência, junta duplicados e sugere a primeira resposta ao atendente.",
    area: "Suporte",
    owner: "eduardo",
    model: "g4-rapido",
    status: "ativo",
    version: "4.2",
    region: fortaleza,
    trigger: { kind: "evento", text: "Chamado novo no Zendesk" },
    runs7d: [512, 548, 530, 201, 188, 602, 577],
    runs30d: 13_640,
    successRate: 0.991,
    p95Ms: 3900,
    cost30d: 1023,
    budget: 1500,
    tokens30d: 74_000_000,
    tools: [
      { id: "zendesk", label: "Zendesk · chamados", access: "escrita" },
      { id: "kb", label: "Base de conhecimento", app: "notion", access: "leitura" },
      { id: "slack", label: "Slack · #suporte-urgente", app: "slack", access: "escrita" },
    ],
    data: ["Chamados dos últimos 90 dias", "Artigos da base de conhecimento"],
    editors: ["eduardo", "joana"],
    watchers: ["ana"],
    flow: [
      { id: "read", kind: "thinking", title: "Ler o chamado e o histórico do cliente", ms: 700, tokens: 1100 },
      { id: "dup", kind: "search", title: "kb.buscar · chamados parecidos", tool: "kb.buscar", ms: 900, tokens: 600, output: { parecidos: 3, duplicado: false } },
      { id: "class", kind: "thinking", title: "Classificar produto e urgência", ms: 500, tokens: 400, output: { produto: "Faturamento", urgencia: "alta" } },
      { id: "reply", kind: "output", title: "Sugerir primeira resposta", ms: 1100, tokens: 900, output: { artigo: "Como emitir segunda via", palavras: 84 } },
    ],
    versions: [
      { version: "4.2", date: "2026-09-24", time: "14:00", author: "eduardo", kind: "minor", title: "Junta chamados duplicados", notes: ["Mesmo cliente e assunto em 24 h vira um chamado só"], score: 0.97, stage: "producao" },
      { version: "4.1", date: "2026-09-12", time: "10:30", author: "eduardo", kind: "minor", title: "Urgência por palavra-chave do contrato", notes: ["Clientes Enterprise com “parado” sobem para urgente"], score: 0.96, stage: "anterior" },
      { version: "4.0", date: "2026-08-20", time: "16:45", author: "joana", kind: "major", title: "Migração para o G4 Rápido", notes: ["Custo por chamado caiu 61 %", "p95 de 7,2 s para 3,9 s"], score: 0.95, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "slack", text: "Mensagem nova em #suporte" }], tools: ["notion", "slack"] },
    createdAt: "2026-04-02",
  },
  {
    id: "recrutador",
    name: "Triagem de currículos",
    purpose: "Lê currículos das vagas abertas, compara com os requisitos e explica a nota de cada candidato para o recrutador decidir.",
    area: "Pessoas",
    owner: "bruno",
    model: "g4-pro",
    status: "pausado",
    version: "1.3",
    region: sp,
    trigger: { kind: "evento", text: "Candidatura nova numa vaga aberta" },
    runs7d: [64, 71, 58, 0, 0, 0, 0],
    runs30d: 1210,
    successRate: 0.955,
    p95Ms: 14800,
    cost30d: 388,
    budget: 600,
    tokens30d: 9_100_000,
    tools: [
      { id: "ats", label: "TalentOS · candidaturas", access: "escrita com aprovação" },
      { id: "files", label: "Currículos (PDF)", app: "gdrive", access: "leitura" },
    ],
    data: ["Candidaturas e currículos", "Requisitos das vagas"],
    editors: ["bruno", "joana"],
    watchers: ["marina", "carla"],
    flow: [
      { id: "cv", kind: "tool", title: "arquivos.ler · currículo", tool: "arquivos.ler", ms: 2100, tokens: 3400 },
      { id: "req", kind: "tool", title: "ats.requisitos_da_vaga", tool: "ats.vaga", ms: 500, tokens: 300 },
      { id: "score", kind: "thinking", title: "Comparar com requisitos (sem nome, foto ou idade)", ms: 4800, tokens: 2600, output: { nota: 7.8, atende: 6, parcial: 2, falta: 1 } },
      { id: "note", kind: "output", title: "Explicar a nota no ATS", ms: 1900, tokens: 900, approval: true },
    ],
    versions: [
      { version: "1.3", date: "2026-09-05", time: "11:00", author: "bruno", kind: "minor", title: "Esconde nome, foto e idade antes de pontuar", notes: ["Pedido do jurídico (LGPD e viés)"], score: 0.88, stage: "producao" },
      { version: "1.0", date: "2026-08-08", time: "15:30", author: "bruno", kind: "major", title: "Nota com justificativa", notes: ["Primeira versão em produção"], score: 0.83, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "gdrive", text: "Currículo novo na pasta da vaga" }], tools: ["gdrive", "notion"] },
    issue: "Pausado por Bruno Takeda em 27/09 para revisão de viés com o jurídico",
    createdAt: "2026-08-01",
  },
  {
    id: "nfe",
    name: "Conferência de NF-e",
    purpose: "Confere o XML de cada nota fiscal de entrada com o pedido de compra e o recebimento, e segura as notas com divergência.",
    area: "Fiscal",
    owner: "joana",
    model: "g4-rapido",
    status: "ativo",
    version: "2.6",
    region: sp,
    trigger: { kind: "evento", text: "NF-e de entrada recebida da SEFAZ" },
    runs7d: [44, 52, 47, 6, 3, 58, 49],
    runs30d: 1180,
    successRate: 0.983,
    p95Ms: 6200,
    cost30d: 96,
    budget: 300,
    tokens30d: 4_200_000,
    tools: [
      { id: "sefaz", label: "SEFAZ · XML das notas", access: "leitura" },
      { id: "erp", label: "ERP · pedidos de compra e recebimento", access: "escrita com aprovação" },
    ],
    data: ["NF-e de entrada", "Pedidos de compra", "Recebimentos do CD Campinas"],
    editors: ["joana", "elisa"],
    watchers: ["marina", "diego"],
    flow: [
      { id: "xml", kind: "tool", title: "sefaz.baixar_xml", tool: "sefaz.xml", ms: 900, tokens: 700, output: { nota: "4471", emitente: "Aço Forte Distribuidora", valor: 48210.0 } },
      { id: "po", kind: "tool", title: "erp.pedido_de_compra", tool: "erp.pedido", ms: 600, tokens: 300, output: { pedido: "PC-1182", valor: 46030.0 } },
      { id: "diff", kind: "thinking", title: "Comparar itens, quantidades e impostos", ms: 2200, tokens: 1500, output: { divergencias: 1, valor: 2180.0, motivo: "frete cobrado a mais" } },
      { id: "hold", kind: "output", title: "Segurar ou liberar a nota", ms: 400, tokens: 200, approval: true },
    ],
    versions: [
      { version: "2.6", date: "2026-09-20", time: "13:10", author: "joana", kind: "minor", title: "Confere o frete do CT-e", notes: ["Frete divergente acima de R$ 500 segura a nota"], score: 0.96, stage: "producao" },
      { version: "2.0", date: "2026-08-15", time: "10:00", author: "elisa", kind: "major", title: "Segura notas com divergência", notes: ["Antes só avisava; agora segura com aprovação"], score: 0.94, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "gdrive", text: "XML novo na pasta “NF-e entrada”" }], tools: ["gdrive", "sheets"] },
    createdAt: "2026-05-10",
  },
  {
    id: "reunioes",
    name: "Resumo de reuniões",
    purpose: "Transcreve reuniões do Meet, resume decisões e cria as tarefas combinadas para cada pessoa.",
    area: "Operações",
    owner: "joana",
    model: "g4-rapido",
    status: "ativo",
    version: "1.9",
    region: sp,
    trigger: { kind: "evento", text: "Gravação nova no Google Meet" },
    runs7d: [27, 31, 29, 2, 0, 33, 24],
    runs30d: 640,
    successRate: 0.969,
    p95Ms: 48000,
    cost30d: 287,
    budget: 400,
    tokens30d: 18_400_000,
    tools: [
      { id: "meet", label: "Google Meet · gravações", app: "gdrive", access: "leitura" },
      { id: "linear", label: "Linear · tarefas", app: "linear", access: "escrita" },
      { id: "slack", label: "Slack · canal da reunião", app: "slack", access: "escrita" },
    ],
    data: ["Gravações de reuniões internas", "Projetos no Linear"],
    editors: ["joana"],
    watchers: ["rafael", "ana", "elisa", "eduardo"],
    flow: [
      { id: "tx", kind: "tool", title: "meet.transcrever", tool: "meet.transcrever", ms: 28000, tokens: 9000 },
      { id: "sum", kind: "thinking", title: "Separar decisões, riscos e combinados", ms: 9000, tokens: 4200 },
      { id: "tasks", kind: "output", title: "Criar tarefas no Linear", ms: 3400, tokens: 800, output: { tarefas: 5 } },
      { id: "post", kind: "output", title: "Postar resumo no Slack", ms: 900, tokens: 400 },
    ],
    versions: [
      { version: "1.9", date: "2026-09-16", time: "09:00", author: "joana", kind: "minor", title: "Tarefas com prazo sugerido", notes: ["Usa a data falada na reunião quando existe"], score: 0.93, stage: "producao" },
      { version: "1.5", date: "2026-08-21", time: "11:40", author: "joana", kind: "minor", title: "Resumo em 5 tópicos", notes: ["Decisões primeiro, depois riscos"], score: 0.9, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "gdrive", text: "Gravação nova na pasta “Meet Recordings”" }], tools: ["linear", "slack"] },
    createdAt: "2026-06-01",
  },
  {
    id: "williams",
    name: "Williams · mídia paga",
    purpose: "Analisa as campanhas pagas toda segunda, propõe criativos e prepara o relatório semanal de mídia para o marketing.",
    area: "Marketing",
    owner: "carla",
    model: "g4-pro",
    status: "ativo",
    version: "5.0",
    region: virginia,
    trigger: { kind: "agenda", text: "Toda segunda às 8h e quando uma campanha é publicada" },
    runs7d: [6, 4, 5, 1, 0, 9, 7],
    runs30d: 148,
    successRate: 0.932,
    p95Ms: 96000,
    cost30d: 734,
    budget: 900,
    tokens30d: 12_600_000,
    tools: [
      { id: "meta", label: "Meta Ads", access: "escrita com aprovação" },
      { id: "google", label: "Google Ads", access: "escrita com aprovação" },
      { id: "drive", label: "Google Drive · relatórios", app: "gdrive", access: "escrita" },
      { id: "slack", label: "Slack · #marketing", app: "slack", access: "escrita" },
    ],
    data: ["Campanhas e públicos (inclui listas de clientes)", "Site acme.com.br"],
    editors: ["carla", "rafael"],
    watchers: ["joana"],
    flow: [
      { id: "pull", kind: "tool", title: "ads.resultados_da_semana", tool: "ads.resultados", ms: 12000, tokens: 3800 },
      { id: "brand", kind: "search", title: "Subagente · pesquisa de marca", tool: "web.buscar", ms: 38000, tokens: 14000 },
      { id: "creative", kind: "output", title: "Subagente · 6 variações de criativo", ms: 26000, tokens: 9800 },
      { id: "report", kind: "output", title: "Relatório semanal no Drive", ms: 14000, tokens: 5200 },
      { id: "budget", kind: "output", title: "Propor ajuste de orçamento", ms: 2000, tokens: 700, approval: true },
    ],
    versions: [
      { version: "5.0", date: "2026-09-21", time: "19:00", author: "carla", kind: "major", title: "Subagentes de marca e criativos", notes: ["Pesquisa de marca e criativos rodam em paralelo", "Relatório sai 40 min mais cedo"], score: 0.89, stage: "producao" },
      { version: "4.3", date: "2026-09-01", time: "10:00", author: "carla", kind: "minor", title: "Termos negativos sugeridos", notes: ["Lista semanal para o Google Ads"], score: 0.9, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "slack", text: "Menção a @williams em #marketing" }], tools: ["gdrive", "slack", "reddit"] },
    issue: "Roda fora do Brasil e acessa listas de clientes (dado pessoal)",
    createdAt: "2026-03-18",
  },
  {
    id: "analista-receita",
    name: "Analista de receita",
    purpose: "Responde perguntas sobre funil, conversão e churn cruzando CRM, ligações e analytics, com relatório e planilha.",
    area: "Comercial",
    owner: "joana",
    model: "g4-analitico",
    status: "ativo",
    version: "1.6",
    region: sp,
    trigger: { kind: "manual", text: "Pergunta no Workspace" },
    runs7d: [4, 6, 3, 0, 1, 5, 3],
    runs30d: 96,
    successRate: 0.958,
    p95Ms: 52400,
    cost30d: 118,
    budget: 300,
    tokens30d: 3_900_000,
    tools: [
      { id: "crm", label: "Acme CRM", app: "g4crm", access: "leitura" },
      { id: "calls", label: "Gravações de ligações", access: "leitura" },
      { id: "analytics", label: "Analytics do funil", access: "leitura" },
    ],
    data: ["CRM inteiro (somente leitura)", "Ligações gravadas", "Funil por segmento"],
    editors: ["joana", "rafael"],
    watchers: ["ana", "carla", "bruno", "diego"],
    flow: [
      { id: "plan", kind: "thinking", title: "Planejar a análise", ms: 2400, tokens: 1100 },
      { id: "crm", kind: "tool", title: "crm.listar_negocios", tool: "crm.listar_negocios", ms: 3100, tokens: 4200 },
      { id: "funnel", kind: "tool", title: "analytics.funil", tool: "analytics.funil", ms: 4200, tokens: 3600 },
      { id: "calls", kind: "tool", title: "gravacoes.transcrever", tool: "gravacoes.transcrever", ms: 9400, tokens: 12600 },
      { id: "report", kind: "output", title: "Escrever relatório", ms: 7600, tokens: 7200 },
    ],
    versions: [
      { version: "1.6", date: "2026-09-11", time: "16:00", author: "joana", kind: "minor", title: "Planilha junto do relatório", notes: ["Toda análise sai com a tabela de apoio"], score: 0.91, stage: "producao" },
    ],
    builder: { triggers: [{ app: "slack", text: "Pergunta em #receita com @analista" }], tools: ["g4crm", "sheets"] },
    createdAt: "2026-05-22",
  },
  {
    id: "frete",
    name: "Cotação de frete",
    purpose: "Cota o frete de cada pedido aprovado com 4 transportadoras e reserva a mais barata que cumpre o prazo prometido ao cliente.",
    area: "Operações",
    owner: "diego",
    model: "g4-rapido",
    status: "ativo",
    version: "1.2",
    region: sp,
    trigger: { kind: "api", text: "Pedido aprovado no ERP Nexo" },
    runs7d: [58, 63, 61, 4, 2, 70, 66],
    runs30d: 1420,
    successRate: 0.972,
    p95Ms: 11200,
    cost30d: 71,
    budget: 200,
    tokens30d: 3_100_000,
    tools: [
      { id: "erp", label: "ERP Nexo · pedidos", access: "leitura" },
      { id: "transp", label: "4 transportadoras (API de cotação)", access: "escrita com aprovação" },
      { id: "sheets", label: "Tabela de prazos por UF", app: "sheets", access: "leitura" },
    ],
    data: ["Pedidos aprovados", "Endereços de entrega", "Tabela de prazos"],
    editors: ["diego", "joana"],
    watchers: ["elisa"],
    flow: [
      { id: "order", kind: "tool", title: "erp.pedido", tool: "erp.pedido", ms: 500, tokens: 300, output: { pedido: "PV-20931", uf: "PR", peso_kg: 1840 } },
      { id: "quote", kind: "tool", title: "transportadoras.cotar · 4 empresas", tool: "frete.cotar", ms: 6200, tokens: 900, output: { cotacoes: 4, menor: 1290.4 } },
      { id: "pick", kind: "thinking", title: "Escolher pelo preço dentro do prazo", ms: 900, tokens: 700, output: { escolhida: "Rodonaves", prazo_dias: 3 } },
      { id: "book", kind: "output", title: "Reservar a coleta", ms: 1400, tokens: 300, approval: true, note: "Frete acima de R$ 5 mil pede aprovação" },
    ],
    versions: [
      { version: "1.2", date: "2026-09-19", time: "15:20", author: "diego", kind: "minor", title: "Prazo prometido ao cliente entra na escolha", notes: ["Descarta cotação que estoura o prazo do pedido"], score: 0.95, stage: "producao" },
      { version: "1.0", date: "2026-08-30", time: "10:00", author: "diego", kind: "major", title: "Cotação automática", notes: ["Primeira versão em produção"], score: 0.92, stage: "anterior" },
    ],
    builder: { triggers: [{ app: "sheets", text: "Pedido aprovado no ERP" }], tools: ["sheets"] },
    createdAt: "2026-08-22",
  },
  {
    id: "churn",
    name: "Alerta de churn",
    purpose: "Toda semana aponta contas com sinais de cancelamento (uso caindo, chamados repetidos, fatura atrasada) e sugere a ação.",
    area: "Comercial",
    owner: "ana",
    model: "g4-pro",
    status: "rascunho",
    version: null,
    region: sp,
    trigger: { kind: "agenda", text: "Toda sexta às 16h" },
    runs7d: [0, 0, 0, 0, 0, 2, 1],
    runs30d: 3,
    successRate: 1,
    p95Ms: 31000,
    cost30d: 2.4,
    budget: 200,
    tokens30d: 180_000,
    tools: [
      { id: "crm", label: "Acme CRM", app: "g4crm", access: "leitura" },
      { id: "zendesk", label: "Zendesk · chamados", access: "leitura" },
    ],
    data: ["Contas e uso", "Chamados de suporte", "Faturas"],
    editors: ["ana"],
    watchers: [],
    flow: [
      { id: "usage", kind: "tool", title: "analytics.uso_por_conta", tool: "analytics.uso", ms: 6000, tokens: 2000 },
      { id: "tickets", kind: "tool", title: "zendesk.chamados_por_conta", tool: "zendesk.chamados", ms: 4000, tokens: 1800 },
      { id: "risk", kind: "thinking", title: "Pontuar risco de cancelamento", ms: 9000, tokens: 5200 },
      { id: "list", kind: "output", title: "Lista de contas e ação sugerida", ms: 5000, tokens: 2600 },
    ],
    versions: [{ version: "0.3", date: "2026-09-29", time: "18:20", author: "ana", kind: "minor", title: "Rascunho com 3 sinais de risco", notes: ["Testado em 3 execuções manuais"], stage: "rascunho" }],
    builder: { triggers: [{ app: "sheets", text: "Toda sexta às 16h" }], tools: ["g4crm"] },
    createdAt: "2026-09-26",
  },
];

export const agentById = (id: string | null | undefined) => agents.find((a) => a.id === id);
export const personOf = (id: string): Person => people.find((p) => p.id === id) ?? people[0];
export const ownerOfAgent = (a: FleetAgent) => personOf(a.owner);
export const budgetUse = (a: FleetAgent) => a.cost30d / a.budget;

/** Presença aproximada pela última atividade (para avatares e StackedList). */
export function presenceOf(p: Person): "online" | "away" | "offline" {
  if (p.lastSeen === "agora" || /min/.test(p.lastSeen)) return "online";
  if (/h$/.test(p.lastSeen)) return "away";
  return "offline";
}

/* ------------------------------------------------------------------ */
/* Execuções                                                           */
/* ------------------------------------------------------------------ */

export type RunStatus = "sucesso" | "falhou" | "executando" | "aguardando" | "cancelada";
export const runStatusLabel: Record<RunStatus, string> = { sucesso: "Concluída", falhou: "Falhou", executando: "Executando", aguardando: "Aguardando aprovação", cancelada: "Cancelada" };
export const runStatusTone: Record<RunStatus, "ok" | "bad" | "info" | "warn" | "neutral"> = { sucesso: "ok", falhou: "bad", executando: "info", aguardando: "warn", cancelada: "neutral" };

export type Run = {
  id: string;
  agentId: string;
  version: string;
  /** "2026-09-30T09:41". */
  startedAt: string;
  status: RunStatus;
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  /** Sobre o que foi ("Lead · Rede Horizonte"). */
  subject: string;
  trigger: { kind: TriggerKind; text: string; by?: string };
  /** Passo que falhou (o trace para ali). */
  failedStep?: string;
  /** Passo que falhou uma vez e deu certo na nova tentativa. */
  retriedStep?: string;
  error?: string;
  /** Aprovação pendente desta execução. */
  approvalId?: string;
  output?: { title: string; to?: string; body: string };
  /** Execução de teste (avaliação). */
  evalCase?: string;
};

const run = (id: string, agentId: string, startedAt: string, status: RunStatus, durationMs: number, tokens: number, cost: number, subject: string, extra: Partial<Run> = {}): Run => {
  const a = agentById(agentId);
  return {
    id,
    agentId,
    version: a?.version ?? a?.versions[0]?.version ?? "0.1",
    startedAt,
    status,
    durationMs,
    tokensIn: Math.round(tokens * 0.82),
    tokensOut: tokens - Math.round(tokens * 0.82),
    cost,
    subject,
    trigger: a?.trigger ?? { kind: "manual", text: "Manual" },
    ...extra,
  };
};

const auroraEmail = `Olá, Renata,

Obrigado pela conversa de ontem. Ajustamos a proposta com o SLA de 99,9 % e multa por indisponibilidade, como o jurídico pediu, mantendo a implantação em 60 dias.

Para seguirmos, preciso só da confirmação do número de usuários (240) até sexta. Com isso, envio a minuta final na segunda.

Um abraço,
Ana Lopes`;

export const runs: Run[] = [
  run("RUN-4830", "triagem", "2026-09-30T10:27", "executando", 2100, 1900, 0.02, "Chamado #88213 · Hospital São Lucas"),
  run("RUN-4829", "sdr-inbound", "2026-09-30T10:22", "aguardando", 13900, 9100, 0.41, "Lead · Marcos Leal (Rede Horizonte)", { approvalId: "APR-219", version: "3.5" }),
  run("RUN-4828", "nfe", "2026-09-30T10:15", "aguardando", 4400, 2700, 0.03, "NF-e 4471 · Aço Forte Distribuidora", { approvalId: "APR-218" }),
  run("RUN-4827", "triagem", "2026-09-30T10:09", "sucesso", 3100, 3000, 0.03, "Chamado #88209 · Vértice Logística"),
  run("RUN-4826", "cobranca", "2026-09-30T09:58", "aguardando", 8800, 6900, 0.58, "Parcelamento · Vértice Logística", { approvalId: "APR-217" }),
  run("RUN-4825", "sdr-inbound", "2026-09-30T09:51", "sucesso", 15200, 8800, 0.39, "Lead · Tânia Kuroda (Hospital São Lucas)"),
  run("RUN-4824", "triagem", "2026-09-30T09:47", "falhou", 4100, 1200, 0.01, "Chamado #88201 · Grupo Aurora", {
    failedStep: "dup",
    error: "kb.buscar respondeu 429 (limite de 60 chamadas/min do Notion). A execução parou antes de classificar.",
  }),
  run("RUN-4823", "williams", "2026-09-30T09:45", "executando", 64000, 21000, 0.94, "Campanha “Outubro PME” publicada", { trigger: { kind: "evento", text: "Campanha publicada no Meta Ads" } }),
  run("RUN-4822", "williams", "2026-09-30T09:44", "executando", 41000, 15800, 0.71, "Pesquisa de marca · concorrentes de outubro", { trigger: { kind: "evento", text: "Campanha publicada no Meta Ads" } }),
  run("RUN-4821", "followup", "2026-09-30T09:41", "aguardando", 9400, 8420, 0.42, "Follow-up · Grupo Aurora", {
    retriedStep: "erp",
    error: "Tempo esgotado após 1,4 s (limite do conector). Repetido automaticamente.",
    approvalId: "APR-216",
    trigger: { kind: "manual", text: "Disparado por Ana Lopes", by: "ana" },
    output: { title: "Próximos passos · licenças Aurora", to: "renata.farias@aurora.com.br", body: auroraEmail },
  }),
  run("RUN-4820", "reunioes", "2026-09-30T09:32", "sucesso", 41800, 13900, 0.11, "Reunião semanal de receita"),
  run("RUN-4819", "sdr-inbound", "2026-09-30T09:18", "sucesso", 12800, 8100, 0.36, "Lead · Saulo Kyoto (Vértice Logística)"),
  run("RUN-4818", "williams", "2026-09-30T08:00", "aguardando", 92000, 31500, 1.18, "Relatório semanal de mídia", { approvalId: "APR-215", output: { title: "Relatório semanal de mídia", body: "CPA caiu 12 % na semana. Criativo “Planilha x CRM” perdeu 24 % de CTR. Proposta: mover R$ 3.000 de Google para Meta na campanha Outubro PME." } }),
  run("RUN-4817", "conciliacao", "2026-09-30T06:00", "falhou", 21400, 2100, 0.38, "Extratos de 29/09", {
    failedStep: "itau",
    error: "itau.extrato devolveu um campo novo (“dataLancamentoContabil”) e o leitor esperava “dataLancamento”. Nenhum lançamento foi alterado.",
  }),
  run("RUN-4816", "cobranca", "2026-09-30T08:00", "sucesso", 9100, 7600, 0.62, "Lembretes do dia · 41 títulos"),
  run("RUN-4815", "followup", "2026-09-30T09:00", "sucesso", 8900, 7900, 0.4, "Follow-up · Hospital São Lucas"),
  run("RUN-4814", "nfe", "2026-09-30T08:41", "sucesso", 3900, 2600, 0.03, "NF-e 4468 · Plásticos União"),
  run("RUN-4813", "triagem", "2026-09-30T08:12", "sucesso", 2800, 2700, 0.02, "Chamado #88190 · Rede Horizonte"),
  run("RUN-4812", "followup", "2026-09-29T09:00", "falhou", 3200, 1900, 0.09, "Follow-up · Construtora Alicerce", {
    failedStep: "doc",
    error: "arquivos.ler: “Proposta final.pdf” está protegido por senha. Peça a versão sem senha ao executivo.",
  }),
  run("RUN-4811", "analista-receita", "2026-09-29T17:30", "sucesso", 52400, 61200, 0.83, "Churn de contas Enterprise no trimestre", { trigger: { kind: "manual", text: "Pergunta de Ana Lopes no Workspace", by: "ana" } }),
  run("RUN-4810", "recrutador", "2026-09-27T11:20", "cancelada", 6100, 2900, 0.08, "Candidatura · Analista de dados", { error: "Cancelada quando o agente foi pausado." }),
  run("RUN-4809", "conciliacao", "2026-09-29T06:00", "falhou", 20800, 2000, 0.37, "Extratos de 28/09", { failedStep: "itau", error: "itau.extrato: formato do campo de data mudou." }),
  run("RUN-4808", "churn", "2026-09-29T18:25", "sucesso", 29800, 11800, 0.9, "Teste manual · contas Enterprise", { version: "0.3", trigger: { kind: "manual", text: "Teste de Ana Lopes no construtor", by: "ana" } }),
  run("RUN-4807", "reunioes", "2026-09-29T15:10", "sucesso", 46200, 14800, 0.12, "Comitê de produto"),
  run("RUN-4806", "sdr-inbound", "2026-09-29T14:02", "falhou", 7400, 3100, 0.14, "Lead · e-mail pessoal sem empresa", { failedStep: "route", error: "crm.atribuir: nenhum executivo disponível para a região Norte. Lead ficou na fila de reserva." }),
  run("RUN-4805", "cobranca", "2026-09-29T08:00", "sucesso", 9600, 7400, 0.61, "Lembretes do dia · 38 títulos"),
  run("RUN-4804", "nfe", "2026-09-29T16:40", "sucesso", 4100, 2500, 0.03, "NF-e 4460 · Aço Forte Distribuidora"),
  run("RUN-4803", "williams", "2026-09-29T08:00", "sucesso", 88000, 30100, 1.11, "Plano de criativos Q4"),
  run("RUN-4802", "analista-receita", "2026-09-28T18:10", "sucesso", 33600, 38900, 0.51, "Previsão de caixa para outubro", { trigger: { kind: "manual", text: "Pergunta de Elisa Monteiro no Workspace", by: "elisa" } }),
  run("RUN-4801", "conciliacao", "2026-09-28T06:00", "falhou", 22100, 2200, 0.39, "Extratos de 27/09", { failedStep: "itau", error: "itau.extrato: formato do campo de data mudou." }),
  run("RUN-4800", "triagem", "2026-09-28T11:31", "sucesso", 3300, 3100, 0.03, "Chamado #88102 · Grupo Aurora"),
  run("RUN-4799", "williams", "2026-09-27T08:00", "sucesso", 79000, 27600, 1.02, "Termos negativos sugeridos"),
  run("RUN-4798", "frete", "2026-09-30T10:05", "sucesso", 8700, 2100, 0.01, "Pedido PV-20931 · Curitiba, PR"),
  run("RUN-4797", "frete", "2026-09-29T16:12", "falhou", 9800, 1200, 0.01, "Pedido PV-20918 · Manaus, AM", { failedStep: "quote", error: "Nenhuma das 4 transportadoras atende Manaus no prazo de 5 dias. O pedido voltou para o comercial." }),
];

export const runById = (id: string | null | undefined) => runs.find((r) => r.id === id);
export const runsOf = (agentId: string) => runs.filter((r) => r.agentId === agentId);

/** Execuções que produziram o que o Williams entrega (cartão de conexões). */
export const williamsRuns = { brand: "RUN-4822", creative: "RUN-4823", ads: "RUN-4818", doc: "RUN-4818", pdf: "RUN-4803", sheet: "RUN-4799" } as const;

/** "hoje, 09:41" · "ontem, 17:30" · "28 set, 18:10". */
export function runWhen(iso: string) {
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  if (day === TODAY) return `hoje, ${time}`;
  if (day === "2026-09-29") return `ontem, ${time}`;
  const d = new Date(`${day}T00:00:00`);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")}, ${time}`;
}

/** Trace da execução a partir do fluxo padrão do agente (escala pela duração; para no passo que falhou). */
export function traceOf(r: Run): { steps: TraceStep[]; io: Record<string, { input?: unknown; output?: unknown; error?: string; model?: string }> } {
  const a = agentById(r.agentId) ?? agents[0];
  const io: Record<string, { input?: unknown; output?: unknown; error?: string; model?: string }> = {};
  const children: TraceStep[] = [];
  let t = 0;
  let tokens = 0;
  const failAt = r.failedStep ? a.flow.findIndex((f) => f.id === r.failedStep) : -1;
  const runningAt = r.status === "executando" ? Math.max(1, Math.round(a.flow.length * 0.6)) : -1;
  // Escala pelos passos que de fato rodaram (até a falha ou até o passo em andamento).
  const last = failAt >= 0 ? failAt : runningAt >= 0 ? runningAt : a.flow.length - 1;
  const base = a.flow.slice(0, last + 1).reduce((s, f) => s + f.ms, 0);
  const k = r.durationMs / base;
  a.flow.forEach((f, i) => {
    if (failAt >= 0 && i > failAt) return;
    if (runningAt >= 0 && i > runningAt) return;
    const ms = Math.max(120, Math.round(f.ms * k));
    if (r.retriedStep === f.id) {
      const first = Math.round(ms * 0.55);
      children.push({ id: `${f.id}-1`, kind: "tool", title: `${f.title} (1ª tentativa)`, startMs: t, durationMs: first, tokens: Math.round(f.tokens * 0.4), status: "error" });
      io[`${f.id}-1`] = { input: f.input, error: r.error };
      t += first + 30;
      children.push({ id: f.id, kind: f.kind, title: `${f.title} (nova tentativa)`, startMs: t, durationMs: ms, tokens: f.tokens });
    } else {
      const failed = i === failAt;
      children.push({ id: f.id, kind: f.kind, title: f.title, startMs: t, durationMs: ms, tokens: f.tokens, status: failed ? "error" : runningAt === i ? "running" : undefined });
      if (failed) io[f.id] = { input: f.input, error: r.error };
    }
    if (!io[f.id]) io[f.id] = { input: f.input, output: f.output, model: f.kind === "thinking" || f.kind === "output" ? modelById(a.model).name : undefined };
    t += ms;
    tokens += f.tokens;
  });
  return {
    steps: [{ id: "run", kind: "agent", title: a.name, startMs: 0, durationMs: Math.max(t, 1), tokens, status: r.status === "falhou" ? "error" : r.status === "executando" ? "running" : undefined, children }],
    io,
  };
}

/* ------------------------------------------------------------------ */
/* Série da frota (setembro)                                           */
/* ------------------------------------------------------------------ */

/** Execuções e falhas por dia, 01/09 → 30/09. */
export const fleetDaily = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const weekday = new Date(`2026-09-${String(day).padStart(2, "0")}T12:00:00`).getDay();
  const weekend = weekday === 0 || weekday === 6;
  const trend = 1 + i * 0.012;
  const wave = 1 + 0.08 * Math.sin(i * 1.7);
  const total = Math.round((weekend ? 520 : 1180) * trend * wave);
  // Pico de falhas em 28–30/09 (conciliação + limite do Notion na triagem).
  const rate = day >= 28 ? 0.034 : 0.016 + 0.006 * Math.cos(i * 2.3);
  const falhas = Math.round(total * rate);
  return { dia: `${String(day).padStart(2, "0")}/09`, execucoes: total - falhas, falhas };
});

export const fleetTotals = {
  runs30d: fleetDaily.reduce((s, d) => s + d.execucoes + d.falhas, 0),
  runsPrev: 27_310,
  success: 0.978,
  successPrev: 0.984,
  cost30d: agents.reduce((s, a) => s + a.cost30d, 0),
  costPrev: 6_420,
  p95Ms: 21_400,
  p95Prev: 24_900,
  hoursSaved: 1_860,
};

/** Custo por área no mês (R$). */
export const costByArea = areas.map((area) => ({ label: area, value: agents.filter((a) => a.area === area).reduce((s, a) => s + a.cost30d, 0) }));

/* ------------------------------------------------------------------ */
/* Aprovações (human-in-the-loop)                                      */
/* ------------------------------------------------------------------ */

export type Approval = {
  id: string;
  agentId: string;
  runId: string;
  title: string;
  description: string;
  impact: string;
  risk: "low" | "medium" | "high";
  requestedAt: string;
  /** Por que a política pediu aprovação. */
  policy: string;
  facts: { label: string; value: string }[];
  preview: { kind: "email"; to: string; subject: string; body: string } | { kind: "rows"; columns: string[]; rows: string[][] } | { kind: "text"; body: string };
  /** Prazo para decidir antes de expirar. */
  expiresIn: string;
};

export const approvals: Approval[] = [
  {
    id: "APR-219",
    agentId: "sdr-inbound",
    runId: "RUN-4829",
    title: "Enviar e-mail com 3 horários para Marcos Leal",
    description: "Primeiro contato com um lead novo. A versão 3.5 (canário) escreveu o e-mail; o horário fica reservado na agenda de Bruno Takeda por 24 h.",
    impact: "1 lead · score 82",
    risk: "low",
    requestedAt: "2026-09-30T10:22",
    policy: "Primeiro contato com cliente sempre pede aprovação",
    facts: [
      { label: "Empresa", value: "Rede Horizonte · 1.200 funcionários" },
      { label: "Executivo", value: "Bruno Takeda" },
      { label: "Origem", value: "Formulário /demo" },
    ],
    preview: { kind: "email", to: "marcos@redehorizonte.edu.br", subject: "Demonstração Acme · escolha um horário", body: "Olá, Marcos,\n\nVi que você pediu uma demonstração para a Rede Horizonte. O Bruno Takeda, que cuida de educação aqui na Acme, tem estes horários:\n\n· quarta, 01/10, às 10h\n· quarta, 01/10, às 15h30\n· quinta, 02/10, às 9h\n\nÉ só responder com o melhor para você.\n\nAbraço,\nTime Acme" },
    expiresIn: "23 h",
  },
  {
    id: "APR-218",
    agentId: "nfe",
    runId: "RUN-4828",
    title: "Segurar a NF-e 4471 da Aço Forte",
    description: "O frete do CT-e está R$ 2.180 acima do combinado no pedido PC-1182. Segurar a nota impede o lançamento no contas a pagar até o fornecedor corrigir.",
    impact: "R$ 48.210,00",
    risk: "high",
    requestedAt: "2026-09-30T10:15",
    policy: "Segurar nota acima de R$ 10 mil pede aprovação do fiscal",
    facts: [
      { label: "Nota", value: "4471 · emitida em 29/09" },
      { label: "Pedido", value: "PC-1182 · R$ 46.030,00" },
      { label: "Diferença", value: "R$ 2.180,00 no frete" },
    ],
    preview: { kind: "rows", columns: ["Item", "Pedido", "Nota", "Diferença"], rows: [["Bobina aço 0,5 mm", "R$ 38.400,00", "R$ 38.400,00", "—"], ["Chapa galvanizada", "R$ 5.830,00", "R$ 5.830,00", "—"], ["Frete (CT-e 9912)", "R$ 1.800,00", "R$ 3.980,00", "+ R$ 2.180,00"]] },
    expiresIn: "2 dias",
  },
  {
    id: "APR-217",
    agentId: "cobranca",
    runId: "RUN-4826",
    title: "Oferecer parcelamento em 4x para a Vértice Logística",
    description: "3 boletos vencidos há 18 dias. O cliente respondeu no WhatsApp pedindo para parcelar; a proposta segue a política 2026 (até 4x, juros de 1,5 % ao mês).",
    impact: "R$ 18.400,00",
    risk: "medium",
    requestedAt: "2026-09-30T09:58",
    policy: "Parcelamento acima de R$ 10 mil pede aprovação do financeiro",
    facts: [
      { label: "Títulos", value: "3 boletos · vencidos há 18 dias" },
      { label: "Parcelas", value: "4x de R$ 4.738,00" },
      { label: "Histórico", value: "Sem atraso nos últimos 12 meses" },
    ],
    preview: { kind: "text", body: "Oi, Saulo! Conseguimos parcelar os 3 boletos de setembro (R$ 18.400,00) em 4x de R$ 4.738,00, com a primeira parcela em 10/10. Posso gerar os boletos novos?" },
    expiresIn: "6 h",
  },
  {
    id: "APR-216",
    agentId: "followup",
    runId: "RUN-4821",
    title: "Enviar follow-up para Renata Farias (Grupo Aurora)",
    description: "Proposta v3 enviada há 2 dias sem resposta. O e-mail confirma o SLA de 99,9 % pedido pelo jurídico e pede o número de usuários.",
    impact: "Negócio de R$ 460.800",
    risk: "low",
    requestedAt: "2026-09-30T09:41",
    policy: "E-mail para cliente sai só com aprovação do executivo",
    facts: [
      { label: "Negócio", value: "NEG-2291 · Negociação" },
      { label: "Executiva", value: "Ana Lopes" },
      { label: "Faturas abertas", value: "Nenhuma" },
    ],
    preview: { kind: "email", to: "renata.farias@aurora.com.br", subject: "Próximos passos · licenças Aurora", body: auroraEmail },
    expiresIn: "1 dia",
  },
  {
    id: "APR-215",
    agentId: "williams",
    runId: "RUN-4818",
    title: "Mover R$ 3.000 de Google Ads para Meta Ads",
    description: "Na campanha “Outubro PME”, o custo por conversão no Meta está 31 % menor. O orçamento total da campanha não muda.",
    impact: "R$ 3.000 por semana",
    risk: "high",
    requestedAt: "2026-09-30T08:00",
    policy: "Qualquer mudança de orçamento de mídia pede aprovação",
    facts: [
      { label: "Campanha", value: "Outubro PME" },
      { label: "CPA Meta / Google", value: "R$ 84 / R$ 122" },
      { label: "Período", value: "01/10 a 31/10" },
    ],
    preview: { kind: "rows", columns: ["Canal", "Hoje", "Proposto"], rows: [["Google Ads", "R$ 9.000/sem", "R$ 6.000/sem"], ["Meta Ads", "R$ 6.000/sem", "R$ 9.000/sem"]] },
    expiresIn: "3 dias",
  },
];

export const approvalById = (id: string | null | undefined) => approvals.find((a) => a.id === id);
export const riskLabel = { low: "Risco baixo", medium: "Risco médio", high: "Risco alto" } as const;
export const riskTone = { low: "neutral", medium: "warn", high: "bad" } as const;

/* ------------------------------------------------------------------ */
/* Avaliações                                                          */
/* ------------------------------------------------------------------ */

export type EvalSuite = {
  id: string;
  agentId: string;
  name: string;
  description: string;
  cases: number;
  passed: number;
  /** Score mínimo para publicar. */
  threshold: number;
  lastRunAt: string;
  /** Score por versão (antiga → nova). */
  history: { version: string; score: number }[];
};

export const evalSuites: EvalSuite[] = [
  { id: "ev-sdr-qual", agentId: "sdr-inbound", name: "Qualificação de leads", description: "120 leads reais anonimizados com a faixa certa (A, B, C).", cases: 120, passed: 113, threshold: 0.9, lastRunAt: "2026-09-29T17:52", history: [{ version: "2.0", score: 0.81 }, { version: "2.2", score: 0.84 }, { version: "3.0", score: 0.87 }, { version: "3.3", score: 0.9 }, { version: "3.4", score: 0.93 }, { version: "3.5", score: 0.94 }] },
  { id: "ev-sdr-tom", agentId: "sdr-inbound", name: "Tom e guia de voz", description: "E-mails avaliados contra o guia de voz (sem promessas, sem exclamação).", cases: 40, passed: 37, threshold: 0.9, lastRunAt: "2026-09-29T17:55", history: [{ version: "3.0", score: 0.85 }, { version: "3.3", score: 0.9 }, { version: "3.4", score: 0.92 }, { version: "3.5", score: 0.93 }] },
  { id: "ev-sdr-esp", agentId: "sdr-inbound", name: "Leads em espanhol", description: "Formulários de LatAm: idioma e moeda certos.", cases: 24, passed: 21, threshold: 0.9, lastRunAt: "2026-09-29T17:58", history: [{ version: "3.4", score: 0.42 }, { version: "3.5", score: 0.875 }] },
  { id: "ev-fu-email", agentId: "followup", name: "E-mails de follow-up", description: "Cita preço e prazo da proposta; não insiste com inadimplente.", cases: 60, passed: 55, threshold: 0.9, lastRunAt: "2026-09-26T10:00", history: [{ version: "1.4", score: 0.85 }, { version: "2.0", score: 0.89 }, { version: "2.1", score: 0.92 }] },
  { id: "ev-cob-pol", agentId: "cobranca", name: "Política de parcelamento", description: "Nunca oferece mais que 4x nem juros abaixo da política.", cases: 50, passed: 50, threshold: 0.98, lastRunAt: "2026-09-22T08:30", history: [{ version: "1.0", score: 0.9 }, { version: "1.7", score: 0.96 }, { version: "1.8", score: 1 }] },
  { id: "ev-conc", agentId: "conciliacao", name: "Casamento de extratos", description: "30 dias de extrato real com o resultado conferido pelo financeiro.", cases: 30, passed: 19, threshold: 0.85, lastRunAt: "2026-09-30T07:10", history: [{ version: "1.2", score: 0.84 }, { version: "2.0", score: 0.86 }, { version: "2.0 (extrato novo)", score: 0.63 }] },
  { id: "ev-tri", agentId: "triagem", name: "Classificação de chamados", description: "500 chamados rotulados por produto e urgência.", cases: 500, passed: 486, threshold: 0.95, lastRunAt: "2026-09-24T13:40", history: [{ version: "4.0", score: 0.95 }, { version: "4.1", score: 0.96 }, { version: "4.2", score: 0.972 }] },
  { id: "ev-rec-vies", agentId: "recrutador", name: "Viés na nota", description: "Pares de currículos iguais com nome, idade e gênero trocados.", cases: 80, passed: 71, threshold: 0.95, lastRunAt: "2026-09-27T10:00", history: [{ version: "1.0", score: 0.83 }, { version: "1.3", score: 0.8875 }] },
  { id: "ev-nfe", agentId: "nfe", name: "Divergências de NF-e", description: "Notas com e sem divergência de item, imposto e frete.", cases: 90, passed: 87, threshold: 0.95, lastRunAt: "2026-09-20T13:30", history: [{ version: "2.0", score: 0.94 }, { version: "2.6", score: 0.967 }] },
];

export const suitesOf = (agentId: string) => evalSuites.filter((s) => s.agentId === agentId);
export const suiteScore = (s: EvalSuite) => s.passed / s.cases;

export type EvalFailure = { id: string; suiteId: string; title: string; expected: string; got: string; runId: string; isNew: boolean };
export const evalFailures: EvalFailure[] = [
  { id: "f1", suiteId: "ev-conc", title: "Pix recebido com favorecido abreviado", expected: "Casar com o título 3381 (Construtora Alicerce)", got: "Ficou como sobra", runId: "RUN-4817", isNew: true },
  { id: "f2", suiteId: "ev-conc", title: "Tarifa bancária do dia 28", expected: "Lançar como despesa bancária", got: "Falhou ao ler a data do extrato", runId: "RUN-4809", isNew: true },
  { id: "f3", suiteId: "ev-conc", title: "TED parcial de cliente", expected: "Casar 2 de 3 parcelas", got: "Falhou ao ler a data do extrato", runId: "RUN-4801", isNew: true },
  { id: "f4", suiteId: "ev-sdr-esp", title: "Lead do México com telefone +52", expected: "Responder em espanhol, preço em dólar", got: "Respondeu em espanhol, preço em reais", runId: "RUN-4829", isNew: false },
  { id: "f5", suiteId: "ev-sdr-qual", title: "Lead com e-mail pessoal sem empresa", expected: "Faixa C e pergunta sobre a empresa", got: "Tentou atribuir e falhou (região Norte)", runId: "RUN-4806", isNew: false },
  { id: "f6", suiteId: "ev-rec-vies", title: "Mesmo currículo, idade 52 × 29", expected: "Mesma nota (± 0,2)", got: "Nota 6,9 × 7,6", runId: "RUN-4810", isNew: false },
  { id: "f7", suiteId: "ev-fu-email", title: "Proposta protegida por senha", expected: "Avisar o executivo e parar", got: "Falhou sem avisar", runId: "RUN-4812", isNew: false },
];

/* ------------------------------------------------------------------ */
/* Governança                                                          */
/* ------------------------------------------------------------------ */

export const creditPlan = { used: 7_340, limit: 10_000, resetsOn: "2026-10-01", plan: "Business · R$ 10.000 em créditos por mês" };

export const areaBudgets = areas.map((area) => {
  const list = agents.filter((a) => a.area === area);
  return { area, budget: list.reduce((s, a) => s + a.budget, 0), spent: list.reduce((s, a) => s + a.cost30d, 0), agents: list.length };
});

export type ApprovalMode = "sempre" | "acima" | "nunca";
export type ApprovalPolicy = { id: string; label: string; description: string; mode: ApprovalMode; threshold?: number; approver: string };
export const approvalPolicies: ApprovalPolicy[] = [
  { id: "email-cliente", label: "Primeiro e-mail para um cliente ou lead", description: "Mensagens que saem em nome da Acme para alguém de fora.", mode: "sempre", approver: "Dono do agente ou executivo da conta" },
  { id: "dinheiro", label: "Movimentar dinheiro ou propor condição comercial", description: "Parcelamento, desconto, estorno, mudança de orçamento de mídia.", mode: "acima", threshold: 10000, approver: "Financeiro (Elisa Monteiro)" },
  { id: "fiscal", label: "Segurar ou recusar nota fiscal", description: "Notas que travam o contas a pagar.", mode: "acima", threshold: 10000, approver: "Fiscal (Joana Ribeiro)" },
  { id: "pessoas", label: "Decisão sobre candidato ou colaborador", description: "Reprovar, avançar etapa, alterar cadastro.", mode: "sempre", approver: "Recrutador da vaga" },
  { id: "interno", label: "Tarefas e mensagens internas", description: "Criar tarefa, postar no Slack, atualizar campo interno.", mode: "nunca", approver: "—" },
];

export const rateLimits = [
  { id: "triagem", label: "Triagem de suporte", perMinute: 60, perDay: 20000, note: "Notion limita a 60 chamadas/min" },
  { id: "sdr-inbound", label: "SDR de inbound", perMinute: 20, perDay: 1500 },
  { id: "cobranca", label: "Cobrança amigável", perMinute: 10, perDay: 400, note: "WhatsApp: no máximo 1 mensagem por cliente por dia" },
  { id: "williams", label: "Williams · mídia paga", perMinute: 5, perDay: 50 },
];

export const apiKeys = [
  { id: "k1", name: "ERP Nexo (produção)", prefix: "g4a_live_7f3c", scope: "Disparar agentes de Financeiro e Fiscal", createdBy: "elisa", lastUsed: "há 4 min" },
  { id: "k2", name: "Site · formulário de demo", prefix: "g4a_live_19ab", scope: "Disparar SDR de inbound", createdBy: "rafael", lastUsed: "há 8 min" },
  { id: "k3", name: "Teste local · Eduardo", prefix: "g4a_test_c0de", scope: "Somente agentes em rascunho", createdBy: "eduardo", lastUsed: "há 12 dias" },
];

/* ------------------------------------------------------------------ */
/* Modelos de agente (galeria "Descobrir agentes")                     */
/* ------------------------------------------------------------------ */

export type TemplateCategory = "Vendas" | "Financeiro" | "Suporte" | "Pessoas" | "Operações";
export const templateCategories: TemplateCategory[] = ["Vendas", "Financeiro", "Suporte", "Pessoas", "Operações"];

export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  apps: AppId[];
  /** Ferramentas sem app no catálogo (rótulo). */
  extra?: string[];
  teams: number;
  author: string;
  official: boolean;
  /** Agente da frota criado a partir dele. */
  basedOn?: string;
  setupMinutes: number;
};

export const templates: AgentTemplate[] = [
  { id: "t-sdr", name: "SDR de inbound", description: "Qualifica leads do site, pontua pelo seu ICP e agenda com o executivo certo.", category: "Vendas", apps: ["hubspot", "g4crm", "gdrive"], teams: 214, author: "Time G4", official: true, basedOn: "sdr-inbound", setupMinutes: 15 },
  { id: "t-followup", name: "Follow-up de propostas", description: "Lê a proposta e o histórico do negócio e escreve o próximo e-mail para você aprovar.", category: "Vendas", apps: ["g4crm", "gdrive"], teams: 168, author: "Time G4", official: true, basedOn: "followup", setupMinutes: 10 },
  { id: "t-churn", name: "Alerta de churn", description: "Aponta contas com uso caindo e chamados repetidos e sugere a ação da semana.", category: "Vendas", apps: ["g4crm", "notion"], teams: 91, author: "Ana Lopes", official: false, basedOn: "churn", setupMinutes: 20 },
  { id: "t-social", name: "Posts a partir do blog", description: "Artigo publicado vira rascunho para LinkedIn, X e Reddit no tom da marca.", category: "Vendas", apps: ["slack", "linkedin", "reddit"], teams: 133, author: "Time G4", official: true, setupMinutes: 10 },
  { id: "t-cobranca", name: "Cobrança amigável", description: "Lembretes de boletos vencidos, segunda via e parcelamento dentro da sua política.", category: "Financeiro", apps: ["sheets", "hubspot"], extra: ["WhatsApp"], teams: 187, author: "Time G4", official: true, basedOn: "cobranca", setupMinutes: 25 },
  { id: "t-conc", name: "Conciliação bancária", description: "Casa extratos com o ERP e explica cada diferença que sobrou.", category: "Financeiro", apps: ["sheets"], extra: ["Open Finance"], teams: 122, author: "Time G4", official: true, basedOn: "conciliacao", setupMinutes: 30 },
  { id: "t-nfe", name: "Conferência de NF-e", description: "Confere XML com pedido e recebimento e segura notas com divergência.", category: "Financeiro", apps: ["gdrive", "sheets"], extra: ["SEFAZ"], teams: 76, author: "Joana Ribeiro", official: false, basedOn: "nfe", setupMinutes: 20 },
  { id: "t-triagem", name: "Triagem de suporte", description: "Classifica chamados, junta duplicados e sugere a primeira resposta.", category: "Suporte", apps: ["notion", "slack"], extra: ["Zendesk"], teams: 241, author: "Time G4", official: true, basedOn: "triagem", setupMinutes: 10 },
  { id: "t-faq", name: "Respostas da base de conhecimento", description: "Responde dúvidas repetidas no chat com artigos da sua base e cita a fonte.", category: "Suporte", apps: ["notion", "slack"], teams: 158, author: "Time G4", official: true, setupMinutes: 10 },
  { id: "t-cv", name: "Triagem de currículos", description: "Nota com justificativa contra os requisitos, sem nome, foto ou idade.", category: "Pessoas", apps: ["gdrive", "notion"], teams: 97, author: "Time G4", official: true, basedOn: "recrutador", setupMinutes: 15 },
  { id: "t-onb", name: "Onboarding de colaborador", description: "Cria acessos, agenda conversas da primeira semana e acompanha o checklist.", category: "Pessoas", apps: ["slack", "notion", "gdrive"], teams: 64, author: "Carla Nogueira", official: false, setupMinutes: 20 },
  { id: "t-meet", name: "Resumo de reuniões", description: "Transcreve, resume decisões e cria as tarefas combinadas no Linear.", category: "Operações", apps: ["gdrive", "linear", "slack"], teams: 302, author: "Time G4", official: true, basedOn: "reunioes", setupMinutes: 5 },
  { id: "t-estoque", name: "Estoque parado", description: "Toda semana lista SKUs sem giro há 90 dias e sugere promoção ou transferência.", category: "Operações", apps: ["sheets"], extra: ["ERP"], teams: 58, author: "Diego Araújo", official: false, setupMinutes: 15 },
];

export const templateById = (id: string | null | undefined) => templates.find((t) => t.id === id);
