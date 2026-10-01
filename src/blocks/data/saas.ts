/*
 * Pulso (SaaS de analytics) · dados de exemplo compartilhados por TODAS as
 * telas do produto: a conta aberta na lista mostra o mesmo MRR na página da
 * conta, na cobrança e no suporte. "Hoje" = 30/09/2026.
 */
import { useEffect, useState } from "react";

export const today = new Date(2026, 8, 30);
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const daysFromToday = (isoDate: string) => Math.round((new Date(`${isoDate}T00:00:00`).getTime() - today.getTime()) / 86400000);

/** Parâmetro da rota do frame: #/frame/saas-customer?id=3 → "3". */
export function useFrameParam(name: string) {
  const read = () => new URLSearchParams(location.hash.split("?")[1] ?? "").get(name);
  const [value, setValue] = useState(read);
  useEffect(() => {
    const on = () => setValue(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return value;
}
export const go = (slug: string, id?: string) => {
  location.hash = `/frame/${slug}${id ? `?id=${id}` : ""}`;
};

export const team = [
  { id: "marina", name: "Marina Couto", initials: "MC", tint: "#3f3f46", role: "Head de Produto" },
  { id: "ana", name: "Ana Lopes", initials: "AL", tint: "#842e20", role: "Customer Success" },
  { id: "bruno", name: "Bruno Takeda", initials: "BT", tint: "#184560", role: "Customer Success" },
  { id: "carla", name: "Carla Nogueira", initials: "CN", tint: "#5f7f6f", role: "Suporte N2" },
  { id: "diego", name: "Diego Araújo", initials: "DA", tint: "#8c6a3a", role: "Suporte N1" },
];
export const me = "marina";
export const personById = (id: string) => team.find((p) => p.id === id) ?? team[0];

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export type Plan = "Starter" | "Pro" | "Enterprise";
export type Health = "saudavel" | "atencao" | "risco";
export type Customer = { id: string; name: string; segment: string; plan: Plan; mrr: number; seats: number; usage: number; health: Health; owner: string; city: string; trend: number[]; since: string; tint: string; status: "ativa" | "trial" | "atraso"; nps: number; contact: string; email: string; cnpj: string };

const names = [
  "Grupo Aurora Alimentos", "Vértice Logística", "Clínica Bem Viver", "Rede Horizonte Educação", "Casa Nobre Imóveis", "Metalúrgica Santa Clara",
  "Agro Cerrado", "Farmácias Vida Plena", "Construtora Pilar", "Banco Âncora Digital", "Óticas Visão Clara", "Hotel Mar Azul",
  "Café Serra Alta", "Transportes Rápido Sul", "Escola Novo Saber", "Laboratório Diagnose", "Moda Aurora", "Ferragens Bom Preço",
  "TecnoSeg Seguros", "Instituto Raízes", "Padaria Trigo Nobre", "Studio Arquitetura Lume", "Energia Solar Nordeste", "Pet Mundo",
  "Cooperativa Vale Verde", "Advocacia Moraes & Lima", "Estaleiro Atlântico", "Gráfica Impressão Viva", "Clube Atlético Central", "Mercado Bom Dia",
  "Contabilidade Exata", "Academia Movimento", "Editora Página Um", "Hospital São Lucas", "Distribuidora Norte Sul", "Turismo Rota Brasil",
];
export const segments = ["Varejo", "Indústria", "Saúde", "Educação", "Serviços", "Financeiro"];
const cities = ["São Paulo, SP", "Belo Horizonte, MG", "Curitiba, PR", "Recife, PE", "Porto Alegre, RS", "Goiânia, GO", "Salvador, BA"];
export const plans: Plan[] = ["Starter", "Pro", "Enterprise"];
export const planPrice: Record<Plan, number> = { Starter: 99, Pro: 140, Enterprise: 160 };
const tints = ["#184560", "#842e20", "#202124", "#8c6a3a", "#5f7f6f", "#1b5e20"];
const contacts = ["Renata Farias", "Marcos Siqueira", "Juliana Rocha", "Rafael Almeida", "Beatriz Queiroz", "Thiago Barros", "Camila Prado", "Eduardo Menezes"];

export const customers: Customer[] = names.map((name, i) => {
  const plan = plans[(i * 7) % 3];
  const seats = plan === "Enterprise" ? 120 + ((i * 31) % 200) : plan === "Pro" ? 20 + ((i * 13) % 60) : 3 + ((i * 5) % 12);
  const usage = (i * 37) % 100;
  const contact = contacts[i % contacts.length];
  const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "").slice(0, 14);
  return {
    id: String(i + 1),
    name,
    segment: segments[(i * 5) % segments.length],
    plan,
    seats,
    mrr: seats * planPrice[plan],
    usage,
    health: usage < 25 ? "risco" : usage < 50 ? "atencao" : "saudavel",
    owner: team[1 + (i % 2)].id,
    city: cities[(i * 3) % cities.length],
    trend: Array.from({ length: 8 }, (_, k) => 40 + Math.sin((i + k) / 1.6) * 12 + (usage > 50 ? k * 3 : -k * 2)),
    since: iso(-30 - ((i * 47) % 700)),
    tint: tints[i % tints.length],
    status: i === 2 || i === 11 ? "trial" : i === 3 || i === 17 || i === 22 ? "atraso" : "ativa",
    nps: usage > 60 ? 9 + (i % 2) : usage > 30 ? 7 + (i % 2) : 3 + (i % 4),
    contact,
    email: `${contact.split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@${slug}.com.br`,
    cnpj: `${String(10 + i * 3).padStart(2, "0")}.${String(210 + i * 17).slice(0, 3)}.${String(430 + i * 29).slice(0, 3)}/0001-${String(20 + i * 7).slice(0, 2)}`,
  };
});
export const customerById = (id?: string | null) => customers.find((c) => c.id === id) ?? customers[0];
export const healthLabel: Record<Health, string> = { saudavel: "Saudável", atencao: "Atenção", risco: "Em risco" };
export const healthTone = { saudavel: "ok", atencao: "warn", risco: "bad" } as const;
export const totalMrr = customers.filter((c) => c.status !== "trial").reduce((s, c) => s + c.mrr, 0);

/* ------------------------------------------------------------------ */
/* Cobrança                                                            */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "paga" | "aberta" | "vencida" | "falhou";
export type Invoice = { id: string; number: string; customerId: string; amount: number; issued: string; due: string; status: InvoiceStatus; method: "Cartão" | "Boleto" | "Pix"; attempts?: number };
export const invoiceLabel: Record<InvoiceStatus, string> = { paga: "Paga", aberta: "Em aberto", vencida: "Vencida", falhou: "Cobrança falhou" };
export const invoiceTone = { paga: "ok", aberta: "neutral", vencida: "warn", falhou: "bad" } as const;
const methods: Invoice["method"][] = ["Cartão", "Boleto", "Pix"];
export const invoices: Invoice[] = customers
  .filter((c) => c.status !== "trial")
  .flatMap((c, i) =>
    [0, 1, 2].map((m) => {
      const status: InvoiceStatus = m > 0 ? "paga" : c.status === "atraso" ? (i % 2 ? "vencida" : "falhou") : i % 5 === 0 ? "aberta" : "paga";
      return {
        id: `${c.id}-${m}`,
        number: `NF ${String(24800 - i * 3 - m * 120).padStart(6, "0")}`,
        customerId: c.id,
        amount: c.mrr,
        issued: iso(-m * 30 - 5),
        due: iso(-m * 30 + (status === "aberta" ? 5 : -2)),
        status,
        method: methods[(i + m) % 3],
        attempts: status === "falhou" ? 2 + (i % 2) : undefined,
      };
    }),
  );
export const failingCount = invoices.filter((i) => i.status === "falhou" || i.status === "vencida").length;

/** Movimentos de MRR por mês (novo, expansão, contração, churn) em R$. */
export const mrrMovements = ["abr", "mai", "jun", "jul", "ago", "set"].map((mes, i) => ({
  mes,
  novo: 18_400 + i * 2_100 + (i % 2) * 3_000,
  expansao: 9_800 + i * 1_400,
  contracao: -(3_200 + (i % 3) * 900),
  churn: -(7_600 - i * 600 + (i % 2) * 1_100),
}));
export const mrrSeries = mrrMovements.reduce<{ mes: string; mrr: number }[]>((acc, m, i) => {
  const prev = i ? acc[i - 1].mrr : totalMrr - mrrMovements.reduce((s, x) => s + x.novo + x.expansao + x.contracao + x.churn, 0);
  acc.push({ mes: m.mes, mrr: prev + m.novo + m.expansao + m.contracao + m.churn });
  return acc;
}, []);

/* ------------------------------------------------------------------ */
/* Suporte                                                             */
/* ------------------------------------------------------------------ */

export type TicketStatus = "novo" | "aberto" | "aguardando" | "resolvido";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type Ticket = { id: string; subject: string; customerId: string; priority: Priority; status: TicketStatus; channel: "E-mail" | "Chat" | "Telefone"; opened: number; assignee?: string; sla: number; messages: { from: "cliente" | "time"; author: string; text: string; ago: string }[] };
export const ticketLabel: Record<TicketStatus, string> = { novo: "Novo", aberto: "Em atendimento", aguardando: "Aguardando cliente", resolvido: "Resolvido" };
export const priorityLabel: Record<Priority, string> = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
export const priorityTone = { baixa: "neutral", media: "neutral", alta: "warn", urgente: "bad" } as const;
const subjects = [
  "Painel não carrega após atualização",
  "Como exportar relatório em CSV?",
  "Cobrança duplicada no cartão",
  "Integração com HubSpot parou de sincronizar",
  "Adicionar 20 usuários ao plano",
  "Erro 500 ao salvar filtro",
  "Dúvida sobre nota fiscal",
  "Permissão de leitor não vê dashboards",
  "Webhook retornando 401",
  "Solicitação de treinamento para o time",
  "Lentidão no relatório de funil",
  "Alterar e-mail do administrador",
];
export const tickets: Ticket[] = subjects.map((subject, i) => {
  const c = customers[(i * 5) % customers.length];
  const status: TicketStatus = (["novo", "aberto", "aguardando", "resolvido", "aberto", "novo"] as const)[i % 6];
  const priority: Priority = (["urgente", "baixa", "alta", "alta", "media", "urgente", "baixa", "media", "alta", "baixa", "media", "baixa"] as const)[i];
  return {
    id: `T-${4820 + i}`,
    subject,
    customerId: c.id,
    priority,
    status,
    channel: (["E-mail", "Chat", "Telefone"] as const)[i % 3],
    opened: 1 + ((i * 7) % 60),
    assignee: status === "novo" ? undefined : team[3 + (i % 2)].id,
    sla: priority === "urgente" ? 4 : priority === "alta" ? 8 : 24,
    messages: [
      { from: "cliente", author: c.contact, text: `Olá! ${subject}. Isso está afetando o time desde hoje cedo. Conseguem verificar?`, ago: `há ${1 + ((i * 7) % 60)} h` },
      ...(status !== "novo" ? [{ from: "time" as const, author: personById(team[3 + (i % 2)].id).name, text: "Oi! Já estamos olhando. Consegue enviar um print da tela e o horário aproximado?", ago: "há 40 min" }] : []),
    ],
  };
});
export const urgentOpen = tickets.filter((t) => t.status !== "resolvido" && (t.priority === "urgente" || t.priority === "alta")).length;

/* ------------------------------------------------------------------ */
/* Integrações e relatórios                                            */
/* ------------------------------------------------------------------ */

export type Integration = { id: string; name: string; category: "CRM" | "Comunicação" | "Dados" | "Pagamentos" | "Automação"; description: string; connected: boolean; status?: "ok" | "erro"; lastSync?: string; initials: string; tint: string };
export const integrations: Integration[] = [
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Sincroniza empresas, contatos e negócios.", connected: true, status: "erro", lastSync: "há 6 h", initials: "HS", tint: "#b23c17" },
  { id: "salesforce", name: "Salesforce", category: "CRM", description: "Contas e oportunidades nos dois sentidos.", connected: false, initials: "SF", tint: "#0b5cab" },
  { id: "slack", name: "Slack", category: "Comunicação", description: "Alertas de métricas e resumos diários em canais.", connected: true, status: "ok", lastSync: "há 2 min", initials: "SL", tint: "#4a154b" },
  { id: "teams", name: "Microsoft Teams", category: "Comunicação", description: "Notificações e cards de relatório.", connected: false, initials: "MT", tint: "#4b53bc" },
  { id: "bigquery", name: "BigQuery", category: "Dados", description: "Exporta eventos brutos toda hora.", connected: true, status: "ok", lastSync: "há 38 min", initials: "BQ", tint: "#1a73e8" },
  { id: "databricks", name: "Databricks", category: "Dados", description: "Tabelas Delta com eventos e métricas.", connected: false, initials: "DB", tint: "#c2410c" },
  { id: "stripe", name: "Stripe", category: "Pagamentos", description: "Assinaturas, faturas e MRR em tempo real.", connected: true, status: "ok", lastSync: "há 5 min", initials: "ST", tint: "#533afd" },
  { id: "pagarme", name: "Pagar.me", category: "Pagamentos", description: "Cobranças em boleto e Pix.", connected: false, initials: "PM", tint: "#0f766e" },
  { id: "zapier", name: "Zapier", category: "Automação", description: "Dispara fluxos a partir de eventos do Pulso.", connected: false, initials: "ZP", tint: "#c2410c" },
  { id: "webhooks", name: "Webhooks", category: "Automação", description: "Envia eventos para a sua URL com assinatura HMAC.", connected: true, status: "ok", lastSync: "há 1 min", initials: "WH", tint: "#202124" },
];

export type Report = { id: string; name: string; description: string; owner: string; schedule?: string; lastRun: string; format: "PDF" | "CSV" | "Painel" };
export const reports: Report[] = [
  { id: "r1", name: "Resumo executivo mensal", description: "MRR, churn, NPS e principais contas.", owner: "marina", schedule: "Todo dia 1 · 08:00", lastRun: iso(-29), format: "PDF" },
  { id: "r2", name: "Contas em risco", description: "Uso abaixo de 25 % nos últimos 30 dias.", owner: "ana", schedule: "Toda segunda · 07:00", lastRun: iso(-1), format: "CSV" },
  { id: "r3", name: "Funil de aquisição", description: "Visitas → assinatura por origem.", owner: "marina", lastRun: iso(-3), format: "Painel" },
  { id: "r4", name: "Faturas vencidas", description: "Inadimplência por faixa de atraso.", owner: "bruno", schedule: "Diário · 09:00", lastRun: iso(0), format: "CSV" },
  { id: "r5", name: "Adoção por recurso", description: "Quais recursos cada plano usa.", owner: "marina", lastRun: iso(-12), format: "Painel" },
];

/** Visitantes por dia (90 dias), para a visão geral. */
export const daily = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2026, 6, 3 + i);
  const wave = Math.sin(i / 6) * 180 + Math.sin(i / 2.3) * 90;
  const trend = i * 6;
  return {
    dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
    desktop: Math.round(820 + trend + wave + ((i * 37) % 120)),
    celular: Math.round(540 + trend * 0.8 + wave * 0.7 + ((i * 53) % 90)),
  };
});

/** Notas 0–10 de NPS (quantidade por nota) no trimestre. */
export const npsScores = [3, 2, 4, 5, 6, 9, 14, 38, 61, 118, 152];
