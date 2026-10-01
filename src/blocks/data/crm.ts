/*
 * Acme CRM · dados de exemplo compartilhados por TODAS as telas do produto.
 * Um negócio aberto no pipeline mostra o mesmo valor na página do negócio, na
 * empresa, no painel e na busca ⌘K. Troque por chamadas à sua API.
 * "Hoje" = 30/09/2026.
 */
import { useEffect, useState } from "react";

export const today = new Date(2026, 8, 30);
/** Data ISO relativa a hoje: iso(-3) = 3 dias atrás. */
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const daysFromToday = (isoDate: string) => Math.round((new Date(`${isoDate}T00:00:00`).getTime() - today.getTime()) / 86400000);

/** Parâmetro da rota do frame: #/frame/crm-deal?id=d1 → "d1". Reage a mudanças de hash. */
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

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

export type Rep = { id: string; name: string; initials: string; tint: string; role: string; team: "Enterprise" | "PME"; quota: number; won: number; wonPrev: number };
export const reps: Rep[] = [
  { id: "ana", name: "Ana Lopes", initials: "AL", tint: "#3f3f46", role: "Executiva de contas", team: "Enterprise", quota: 1_200_000, won: 1_480_000, wonPrev: 1_254_000 },
  { id: "diego", name: "Diego Araújo", initials: "DA", tint: "#184560", role: "Executivo de contas", team: "Enterprise", quota: 1_200_000, won: 1_210_000, wonPrev: 1_141_000 },
  { id: "carla", name: "Carla Nogueira", initials: "CN", tint: "#842e20", role: "Executiva de contas", team: "PME", quota: 1_100_000, won: 980_000, wonPrev: 1_021_000 },
  { id: "bruno", name: "Bruno Takeda", initials: "BT", tint: "#5f7f6f", role: "Executivo de contas", team: "PME", quota: 1_000_000, won: 760_000, wonPrev: 685_000 },
  { id: "eduardo", name: "Eduardo Barros", initials: "EB", tint: "#8c6a3a", role: "SDR", team: "PME", quota: 900_000, won: 540_000, wonPrev: 614_000 },
];
export const me = "ana";
export const director = { name: "Rafael Queiroz", initials: "RQ", role: "Diretor comercial" };
export const repById = (id: string) => reps.find((r) => r.id === id) ?? reps[0];

/* ------------------------------------------------------------------ */
/* Funil                                                               */
/* ------------------------------------------------------------------ */

export type StageId = "qualificacao" | "diagnostico" | "proposta" | "negociacao" | "fechamento";
export type Stage = { id: StageId; label: string; probability: number; color: string };
export const stages: Stage[] = [
  { id: "qualificacao", label: "Qualificação", probability: 0.1, color: "var(--ds-chart-6)" },
  { id: "diagnostico", label: "Diagnóstico", probability: 0.25, color: "var(--ds-blue)" },
  { id: "proposta", label: "Proposta", probability: 0.5, color: "var(--ds-accent)" },
  { id: "negociacao", label: "Negociação", probability: 0.75, color: "var(--ds-clay)" },
  { id: "fechamento", label: "Fechamento", probability: 0.9, color: "var(--ds-ok)" },
];
export const stageById = (id: string) => stages.find((s) => s.id === id) ?? stages[0];

export const lostReasons = [
  { label: "Preço acima do orçamento", value: 34 },
  { label: "Escolheu concorrente", value: 21 },
  { label: "Sem prioridade no momento", value: 18 },
  { label: "Sem resposta após proposta", value: 14 },
  { label: "Faltou integração", value: 7 },
];

/* ------------------------------------------------------------------ */
/* Empresas e contatos                                                 */
/* ------------------------------------------------------------------ */

export type Lifecycle = "Lead" | "Oportunidade" | "Cliente" | "Ex-cliente";
export type Company = { id: string; name: string; domain: string; industry: string; size: string; city: string; owner: string; tint: string; lifecycle: Lifecycle; lastTouch: number; cnpj: string; arr?: number };
const companyRows: [string, string, string, string, string, string, Lifecycle, number][] = [
  ["Grupo Aurora Alimentos", "aurora.com.br", "Alimentos", "1.000+", "São Paulo, SP", "ana", "Oportunidade", 0],
  ["Vértice Logística", "vertice.log.br", "Logística", "201–500", "Campinas, SP", "bruno", "Oportunidade", 4],
  ["Clínica Bem Viver", "bemviver.med.br", "Saúde", "51–200", "Curitiba, PR", "carla", "Lead", 2],
  ["Rede Horizonte Educação", "horizonte.edu.br", "Educação", "501–1.000", "Belo Horizonte, MG", "ana", "Cliente", 34],
  ["Metalúrgica Santa Clara", "santaclara.ind.br", "Indústria", "1.000+", "Joinville, SC", "diego", "Cliente", 9],
  ["Agro Cerrado", "agrocerrado.com.br", "Agronegócio", "201–500", "Rio Verde, GO", "carla", "Oportunidade", 45],
  ["Farmácias Vida Plena", "vidaplena.com.br", "Varejo", "1.000+", "Recife, PE", "bruno", "Oportunidade", 6],
  ["Óticas Visão Clara", "visaoclara.com.br", "Varejo", "51–200", "Salvador, BA", "diego", "Lead", 2],
  ["Hospital São Lucas", "saolucas.org.br", "Saúde", "1.000+", "Porto Alegre, RS", "ana", "Oportunidade", 1],
  ["Construtora Pilar", "pilar.eng.br", "Construção", "201–500", "Goiânia, GO", "bruno", "Cliente", 18],
  ["Escola Novo Saber", "novosaber.edu.br", "Educação", "51–200", "Fortaleza, CE", "carla", "Lead", 7],
  ["Distribuidora Norte Sul", "nortesul.com.br", "Distribuição", "201–500", "Manaus, AM", "diego", "Oportunidade", 11],
  ["Café Serra Alta", "serraalta.com.br", "Alimentos", "11–50", "Varginha, MG", "eduardo", "Ex-cliente", 62],
  ["TecnoSeg Seguros", "tecnoseg.com.br", "Financeiro", "501–1.000", "São Paulo, SP", "eduardo", "Lead", 23],
];
const tints = ["#842e20", "#184560", "#1b5e20", "#8c6a3a", "#202124", "#5f7f6f"];
export const companies: Company[] = companyRows.map(([name, domain, industry, size, city, owner, lifecycle, lastTouch], i) => ({
  id: `c${i + 1}`,
  name,
  domain,
  industry,
  size,
  city,
  owner,
  lifecycle,
  lastTouch,
  tint: tints[i % tints.length],
  cnpj: `${String(12 + i * 7).padStart(2, "0")}.${String(345 + i * 31).slice(0, 3)}.${String(678 + i * 17).slice(0, 3)}/0001-${String(10 + i * 3).slice(0, 2)}`,
  arr: lifecycle === "Cliente" ? 90_000 + i * 21_000 : undefined,
}));
export const companyById = (id?: string | null) => companies.find((c) => c.id === id) ?? companies[0];

export type Contact = { id: string; name: string; initials: string; tint: string; role: string; email: string; phone: string; companyId: string; tag?: "Decisora" | "Decisor" | "Influenciador" | "Compras" | "Usuário"; lastTouch: number };
const contactRows: [string, string, string, Contact["tag"]][] = [
  ["Renata Farias", "Diretora de Operações", "c1", "Decisora"],
  ["Paulo Menezes", "Gerente de TI", "c1", "Influenciador"],
  ["Luíza Prado", "Compras", "c1", "Compras"],
  ["Marcos Siqueira", "Diretor de Logística", "c2", "Decisor"],
  ["Juliana Rocha", "Coordenadora de Qualidade", "c3", "Decisora"],
  ["Rafael Almeida", "Diretor Acadêmico", "c4", "Decisor"],
  ["Beatriz Queiroz", "CFO", "c5", "Decisora"],
  ["Thiago Barros", "Gerente Industrial", "c5", "Usuário"],
  ["Camila Farias", "Diretora Financeira", "c6", "Decisora"],
  ["Eduardo Menezes", "Gerente de Lojas", "c7", "Influenciador"],
  ["Renato Prado", "Sócio", "c8", "Decisor"],
  ["Helena Siqueira", "Diretora Clínica", "c9", "Decisora"],
  ["Gustavo Rocha", "TI Corporativa", "c9", "Influenciador"],
  ["Patrícia Almeida", "Gerente de Obras", "c10", "Usuário"],
  ["Fernanda Queiroz", "Diretora Pedagógica", "c11", "Decisora"],
  ["Lucas Barros", "Gerente Comercial", "c12", "Decisor"],
  ["Mariana Farias", "Sócia", "c13", "Decisora"],
  ["Rodrigo Menezes", "Head de Operações", "c14", "Influenciador"],
];
export const contacts: Contact[] = contactRows.map(([name, role, companyId, tag], i) => {
  const company = companyById(companyId);
  const [first, last] = name.split(" ");
  return {
    id: `p${i + 1}`,
    name,
    initials: `${first[0]}${last[0]}`,
    tint: tints[(i + 2) % tints.length],
    role,
    email: `${first.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${last.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@${company.domain}`,
    phone: `(${11 + (i % 8) * 6}) 9${String(8100 + i * 137).slice(0, 4)}-${String(2200 + i * 311).slice(0, 4)}`,
    companyId,
    tag,
    lastTouch: (i * 4) % 30,
  };
});
export const contactById = (id?: string | null) => contacts.find((c) => c.id === id) ?? contacts[0];
export const contactsOf = (companyId: string) => contacts.filter((c) => c.companyId === companyId);

/* ------------------------------------------------------------------ */
/* Negócios                                                            */
/* ------------------------------------------------------------------ */

export type Deal = { id: string; title: string; companyId: string; value: number; stage: StageId; owner: string; age: number; source: string; hot?: boolean; created: string; close: string; contactIds: string[]; competitor?: string; note?: string };
export const deals: Deal[] = [
  { id: "d1", title: "Licenças anuais · 240 usuários", companyId: "c1", value: 460_800, stage: "negociacao", owner: "ana", age: 12, source: "Indicação", hot: true, created: iso(-18), close: iso(15), contactIds: ["p1", "p2", "p3"], note: "R$ 160 por usuário/mês · 12 meses" },
  { id: "d2", title: "Expansão para 3 CDs", companyId: "c2", value: 128_000, stage: "proposta", owner: "bruno", age: 21, source: "Outbound", created: iso(-40), close: iso(25), contactIds: ["p4"], competitor: "LogTrack" },
  { id: "d3", title: "Piloto em 2 unidades", companyId: "c3", value: 18_900, stage: "qualificacao", owner: "carla", age: 3, source: "Inbound", created: iso(-3), close: iso(45), contactIds: ["p5"] },
  { id: "d4", title: "Plano Pro · renovação", companyId: "c4", value: 104_160, stage: "fechamento", owner: "ana", age: 34, source: "Base", created: iso(-60), close: iso(3), contactIds: ["p6"] },
  { id: "d5", title: "Módulo financeiro", companyId: "c5", value: 86_400, stage: "diagnostico", owner: "diego", age: 9, source: "Evento", created: iso(-14), close: iso(40), contactIds: ["p7", "p8"] },
  { id: "d6", title: "Implantação completa", companyId: "c6", value: 312_000, stage: "proposta", owner: "carla", age: 45, source: "Outbound", created: iso(-70), close: iso(10), contactIds: ["p9"], competitor: "AgroSys" },
  { id: "d7", title: "Integração com ERP", companyId: "c7", value: 54_600, stage: "diagnostico", owner: "bruno", age: 6, source: "Inbound", created: iso(-10), close: iso(35), contactIds: ["p10"] },
  { id: "d8", title: "Licenças para franquias", companyId: "c8", value: 72_000, stage: "qualificacao", owner: "diego", age: 2, source: "Inbound", created: iso(-2), close: iso(60), contactIds: ["p11"] },
  { id: "d9", title: "Contrato 24 meses", companyId: "c9", value: 540_000, stage: "negociacao", owner: "ana", age: 28, source: "Indicação", created: iso(-52), close: iso(20), contactIds: ["p12", "p13"] },
  { id: "d10", title: "Upgrade Enterprise", companyId: "c10", value: 96_000, stage: "fechamento", owner: "bruno", age: 18, source: "Base", created: iso(-33), close: iso(6), contactIds: ["p14"] },
  { id: "d11", title: "Treinamento de times", companyId: "c11", value: 24_000, stage: "qualificacao", owner: "carla", age: 7, source: "Evento", created: iso(-7), close: iso(50), contactIds: ["p15"] },
  { id: "d12", title: "Painel de vendas", companyId: "c12", value: 38_400, stage: "proposta", owner: "diego", age: 11, source: "Outbound", created: iso(-20), close: iso(18), contactIds: ["p16"] },
];
export const dealById = (id?: string | null) => deals.find((d) => d.id === id) ?? deals[0];
export const dealsOf = (companyId: string) => deals.filter((d) => d.companyId === companyId);
export const sources = [...new Set(deals.map((d) => d.source))];

/* ------------------------------------------------------------------ */
/* Atividades (tarefas, ligações, reuniões, e-mails)                   */
/* ------------------------------------------------------------------ */

export type ActivityType = "ligacao" | "reuniao" | "email" | "tarefa";
export type Activity = { id: string; type: ActivityType; title: string; due: string; time?: string; owner: string; dealId?: string; companyId: string; contactId?: string; done: boolean };
export const activityLabel: Record<ActivityType, string> = { ligacao: "Ligação", reuniao: "Reunião", email: "E-mail", tarefa: "Tarefa" };
export const activities: Activity[] = [
  { id: "a1", type: "tarefa", title: "Enviar minuta com SLA revisado", due: iso(0), owner: "ana", dealId: "d1", companyId: "c1", contactId: "p1", done: false },
  { id: "a2", type: "reuniao", title: "Call com jurídico da Aurora", due: iso(2), time: "10:00", owner: "ana", dealId: "d1", companyId: "c1", contactId: "p1", done: false },
  { id: "a3", type: "tarefa", title: "Confirmar número de usuários", due: iso(-3), owner: "ana", dealId: "d1", companyId: "c1", contactId: "p2", done: false },
  { id: "a4", type: "ligacao", title: "Retomar proposta de expansão", due: iso(-1), time: "15:30", owner: "bruno", dealId: "d2", companyId: "c2", contactId: "p4", done: false },
  { id: "a5", type: "reuniao", title: "Diagnóstico financeiro · Santa Clara", due: iso(0), time: "14:00", owner: "diego", dealId: "d5", companyId: "c5", contactId: "p7", done: false },
  { id: "a6", type: "email", title: "Enviar case de agronegócio", due: iso(-6), owner: "carla", dealId: "d6", companyId: "c6", contactId: "p9", done: false },
  { id: "a7", type: "tarefa", title: "Assinar renovação Horizonte", due: iso(1), owner: "ana", dealId: "d4", companyId: "c4", contactId: "p6", done: false },
  { id: "a8", type: "ligacao", title: "Qualificar piloto da clínica", due: iso(0), time: "11:00", owner: "carla", dealId: "d3", companyId: "c3", contactId: "p5", done: false },
  { id: "a9", type: "reuniao", title: "Apresentação para diretoria · São Lucas", due: iso(3), time: "09:30", owner: "ana", dealId: "d9", companyId: "c9", contactId: "p12", done: false },
  { id: "a10", type: "email", title: "Follow-up integração ERP", due: iso(-2), owner: "bruno", dealId: "d7", companyId: "c7", contactId: "p10", done: false },
  { id: "a11", type: "tarefa", title: "Atualizar escopo do painel", due: iso(4), owner: "diego", dealId: "d12", companyId: "c12", contactId: "p16", done: false },
  { id: "a12", type: "ligacao", title: "Reativar Café Serra Alta", due: iso(-8), owner: "eduardo", companyId: "c13", contactId: "p17", done: false },
  { id: "a13", type: "tarefa", title: "Apresentar case Santa Clara", due: iso(-10), owner: "ana", dealId: "d1", companyId: "c1", done: true },
  { id: "a14", type: "reuniao", title: "Kickoff de upgrade · Pilar", due: iso(1), time: "16:00", owner: "bruno", dealId: "d10", companyId: "c10", contactId: "p14", done: false },
  { id: "a15", type: "ligacao", title: "Primeiro contato TecnoSeg", due: iso(2), time: "10:30", owner: "eduardo", companyId: "c14", contactId: "p18", done: false },
];
/** Atrasadas da pessoa logada (contador da navegação). */
export const overdueCount = activities.filter((a) => a.owner === me && !a.done && daysFromToday(a.due) < 0).length;

/* ------------------------------------------------------------------ */
/* Números do painel                                                   */
/* ------------------------------------------------------------------ */

export const monthly = [
  { mes: "abr", ganho: 820_000, previsto: 0 },
  { mes: "mai", ganho: 1_040_000, previsto: 0 },
  { mes: "jun", ganho: 960_000, previsto: 0 },
  { mes: "jul", ganho: 1_180_000, previsto: 0 },
  { mes: "ago", ganho: 1_310_000, previsto: 0 },
  { mes: "set", ganho: 1_120_000, previsto: 180_000 },
  { mes: "out", ganho: 0, previsto: 1_260_000 },
  { mes: "nov", ganho: 0, previsto: 980_000 },
  { mes: "dez", ganho: 0, previsto: 740_000 },
];
export const funnel = [
  { label: "Leads qualificados", value: 1_240, hint: "MQL → SQL" },
  { label: "Diagnóstico", value: 486 },
  { label: "Proposta enviada", value: 212 },
  { label: "Negociação", value: 118 },
  { label: "Ganho", value: 71 },
];
