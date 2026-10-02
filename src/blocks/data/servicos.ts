/*
 * Ponto ERP · ERP de serviços para pequena e média empresa (orçamento → OS →
 * NFS-e → cobrança, contratos recorrentes e agenda de técnicos em campo).
 * Empresa que usa o ERP: Vértice Manutenção Predial e TI Ltda. (São Paulo/SP),
 * 16 clientes de exemplo (14 com contrato), 6 técnicos. Dados compartilhados por TODAS as
 * telas: a mesma OS, cliente, contrato, nota e cobrança aparecem iguais na
 * lista, no registro, no painel e na busca ⌘K. "Hoje" = 30/09/2026 (quarta).
 * Troque pela sua API.
 */

import type { Tone } from "@g4ai/ds";

export const today = new Date(2026, 8, 30);
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const todayIso = iso(0);
/** Dias entre hoje e a data (negativo = passou). */
export const daysFrom = (isoDate: string) => Math.round((new Date(`${isoDate.slice(0, 10)}T00:00:00`).getTime() - today.getTime()) / 86400000);
/** "2026-09-30" → "30/09" */
export const dm = (isoDate: string) => isoDate.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
/** "2026-09-30" → "30/09/2026" */
export const br = (isoDate: string) => isoDate.slice(0, 10).split("-").reverse().join("/");

export const company = {
  product: "Ponto ERP",
  name: "Vértice Manutenção Predial e TI Ltda.",
  short: "Vértice",
  cnpj: "27.418.552/0001-03",
  im: "6.218.334-0",
  city: "São Paulo/SP",
  regime: "Simples Nacional · Anexo III",
};

/* ------------------------------------------------------------------ */
/* Pessoas: escritório e técnicos de campo                             */
/* ------------------------------------------------------------------ */

export type Person = { id: string; name: string; initials: string; role: string; tint?: string };
// ds-audit-ignore-start hex-color: tintas de avatar e marcas de entidade (identidade)
export const staff: Person[] = [
  { id: "renata", name: "Renata Albuquerque", initials: "RA", role: "Gestora de operações", tint: "#184560" },
  { id: "marcelo", name: "Marcelo Faria", initials: "MF", role: "Financeiro", tint: "#5f7f6f" },
  { id: "bianca", name: "Bianca Souto", initials: "BS", role: "Comercial", tint: "#842e20" },
];
export const me = staff[0];
export const staffById = (id: string) => staff.find((p) => p.id === id) ?? staff[0];

export type Skill = "Elétrica" | "Climatização" | "Redes e TI" | "Hidráulica" | "Suporte TI" | "Civil";
export type Technician = Person & { skill: Skill; phone: string; status: "online" | "away" | "offline"; where: string; rate: number };
export const technicians: Technician[] = [
  { id: "diego", name: "Diego Ramos", initials: "DR", role: "Técnico eletricista", skill: "Elétrica", phone: "(11) 98144-2210", status: "online", where: "Em atendimento · Vila Mariana", rate: 145, tint: "#8c6a3a" },
  { id: "juliana", name: "Juliana Prado", initials: "JP", role: "Técnica de climatização", skill: "Climatização", phone: "(11) 97720-8831", status: "online", where: "Em deslocamento · Pinheiros", rate: 165, tint: "#184560" },
  { id: "felipe", name: "Felipe Nakamura", initials: "FN", role: "Técnico de redes", skill: "Redes e TI", phone: "(11) 99231-4410", status: "online", where: "Em atendimento · Itaim Bibi", rate: 130, tint: "#5f7f6f" },
  { id: "marcos", name: "Marcos Tavares", initials: "MT", role: "Encanador e pedreiro", skill: "Hidráulica", phone: "(11) 98870-1123", status: "away", where: "Almoço · volta às 13:30", rate: 120, tint: "#842e20" },
  { id: "aline", name: "Aline Costa", initials: "AC", role: "Suporte de TI (N2)", skill: "Suporte TI", phone: "(11) 97455-0921", status: "online", where: "Remoto · central", rate: 130 },
  { id: "rogerio", name: "Rogério Lima", initials: "RL", role: "Eletricista (geradores)", skill: "Elétrica", phone: "(11) 99012-7744", status: "offline", where: "Folga compensada", rate: 145, tint: "#3d4a5c" },
];
export const techById = (id?: string) => technicians.find((t) => t.id === id);

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export type Segment = "Condomínio" | "Clínica" | "Escritório" | "Escola" | "Varejo" | "Indústria";
export type ClientStatus = "ativo" | "implantacao" | "inadimplente" | "inativo";
export type Client = {
  id: string;
  name: string;
  cnpj: string;
  segment: Segment;
  district: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  since: string;
  status: ClientStatus;
  /** Tomador retém o ISS na fonte (substituto tributário). */
  issWithheld: boolean;
  tint?: string;
};

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
const c = (id: string, name: string, cnpj: string, segment: Segment, district: string, address: string, contact: string, since: string, status: ClientStatus, issWithheld: boolean, tint?: string): Client => ({
  id,
  name,
  cnpj,
  segment,
  district,
  address,
  contact,
  email: `${slug(contact.replace(/^Dra?\.\s/, "").split(" ")[0])}@${slug(name.split(" · ")[0].split(" ").slice(-1)[0])}.com.br`,
  phone: `(11) 3${id.length}${cnpj.slice(0, 2)}-${cnpj.slice(3, 6)}${cnpj.slice(7, 8)}`,
  since,
  status,
  issWithheld,
  tint,
});

export const clients: Client[] = [
  c("k1", "Condomínio Edifício Jardim Europa", "11.203.884/0001-52", "Condomínio", "Jardim Europa", "Rua Groenlândia, 1.420", "Sílvia Marques", "2023-03-01", "ativo", false, "#184560"),
  c("k2", "Clínica Vitta Saúde", "23.551.019/0001-07", "Clínica", "Vila Mariana", "Rua Domingos de Morais, 2.210", "Dr. Henrique Sato", "2024-01-15", "ativo", true, "#5f7f6f"),
  c("k3", "Escritório Moraes & Lins Advogados", "08.774.312/0001-90", "Escritório", "Itaim Bibi", "Av. Brig. Faria Lima, 3.900 · 12º andar", "Patrícia Lins", "2022-08-10", "ativo", true, "#842e20"),
  c("k4", "Colégio Horizonte", "61.902.554/0001-31", "Escola", "Perdizes", "Rua Cardoso de Almeida, 980", "Ricardo Pacheco", "2023-02-01", "ativo", true, "#8c6a3a"),
  c("k5", "Padaria e Confeitaria Real", "19.330.876/0001-44", "Varejo", "Mooca", "Rua da Mooca, 3.115", "Antônio Ferreira", "2024-06-03", "inadimplente", false),
  c("k6", "Condomínio Residencial Ipê Amarelo", "14.661.230/0001-68", "Condomínio", "Morumbi", "Rua Dr. Alceu de Campos Rodrigues, 455", "Cláudio Neves", "2021-11-20", "ativo", false, "#3d4a5c"),
  c("k7", "Laboratório Bioanálise", "30.118.442/0001-25", "Clínica", "Pinheiros", "Rua dos Pinheiros, 1.060", "Fernanda Rocha", "2025-09-01", "implantacao", true, "#5f7f6f"),
  c("k8", "Ateliê Gráfico Tipo Certo", "26.004.991/0001-13", "Indústria", "Barra Funda", "Rua Brigadeiro Galvão, 712", "Lucas Amaral", "2024-03-12", "ativo", false),
  c("k9", "Coworking Base Paulista", "35.887.106/0001-80", "Escritório", "Bela Vista", "Av. Paulista, 1.636 · 4º andar", "Mariana Teles", "2025-02-17", "ativo", true, "#184560"),
  c("k10", "Rede Farma Bem · loja Moema", "07.223.901/0004-72", "Varejo", "Moema", "Av. Ibirapuera, 2.640", "Gustavo Ribeiro", "2023-07-01", "ativo", true, "#842e20"),
  c("k11", "Condomínio Comercial Torre Sul", "12.448.770/0001-09", "Condomínio", "Santo Amaro", "Av. das Nações Unidas, 18.801", "Elaine Borges", "2022-04-01", "ativo", true, "#8c6a3a"),
  c("k12", "Escola de Idiomas Fluent", "28.906.335/0001-56", "Escola", "Tatuapé", "Rua Tuiuti, 2.004", "Rafaela Duarte", "2024-10-01", "ativo", false),
  c("k13", "Metalúrgica Paulista Brasil", "04.512.663/0001-38", "Indústria", "Vila Leopoldina", "Rua Carlos Weber, 1.200", "Otávio Mendes", "2025-10-01", "implantacao", true, "#3d4a5c"),
  c("k14", "Hotel Boutique Consolação", "17.390.228/0001-61", "Varejo", "Consolação", "Rua Augusta, 1.050", "Beatriz Campos", "2023-05-15", "ativo", true, "#184560"),
  c("k15", "Consultório Odonto Sorriso", "33.075.814/0001-02", "Clínica", "Santana", "Rua Voluntários da Pátria, 2.980", "Dra. Camila Ortiz", "2024-08-01", "inadimplente", false, "#5f7f6f"),
  c("k16", "Agência Pixel Norte", "29.661.540/0001-77", "Escritório", "Vila Madalena", "Rua Harmonia, 455", "Thiago Bastos", "2023-01-10", "inativo", false),
];
// ds-audit-ignore-end
export const clientById = (id: string) => clients.find((k) => k.id === id) ?? clients[0];

export const clientStatus: Record<ClientStatus, { label: string; tone: Tone }> = {
  ativo: { label: "Ativo", tone: "neutral" },
  implantacao: { label: "Em implantação", tone: "info" },
  inadimplente: { label: "Inadimplente", tone: "bad" },
  inativo: { label: "Inativo", tone: "neutral" },
};

/* ------------------------------------------------------------------ */
/* Catálogo de serviços (LC 116) e materiais                           */
/* ------------------------------------------------------------------ */

export type Service = { id: string; name: string; unit: string; price: number; code: string; iss: number };
export const services: Service[] = [
  { id: "hp", name: "Hora técnica · manutenção predial", unit: "h", price: 145, code: "7.10", iss: 0.05 },
  { id: "hc", name: "Hora técnica · climatização", unit: "h", price: 165, code: "14.01", iss: 0.05 },
  { id: "ht", name: "Hora técnica · suporte de TI", unit: "h", price: 130, code: "1.07", iss: 0.029 },
  { id: "vt", name: "Visita técnica (deslocamento)", unit: "visita", price: 90, code: "7.10", iss: 0.05 },
  { id: "pr", name: "Instalação de ponto de rede cat6", unit: "ponto", price: 180, code: "14.06", iss: 0.05 },
  { id: "hg", name: "Higienização de split até 24 mil BTU", unit: "un", price: 220, code: "14.01", iss: 0.05 },
  { id: "pe", name: "Plantão emergencial 24 h", unit: "h", price: 240, code: "7.10", iss: 0.05 },
  { id: "pm", name: "Laudo PMOC (ar-condicionado)", unit: "laudo", price: 680, code: "14.01", iss: 0.05 },
];
export const serviceById = (id: string) => services.find((s) => s.id === id) ?? services[0];

export type Material = { id: string; name: string; unit: string; price: number };
export const materials: Material[] = [
  { id: "m1", name: "Cabo de rede cat6", unit: "m", price: 4.9 },
  { id: "m2", name: "Disjuntor DIN 32 A", unit: "un", price: 38 },
  { id: "m3", name: "Filtro de ar G4", unit: "un", price: 46 },
  { id: "m4", name: "Gás refrigerante R-410A", unit: "kg", price: 112 },
  { id: "m5", name: "Patch cord cat6 1,5 m", unit: "un", price: 17.5 },
  { id: "m6", name: "Reparo de válvula de descarga", unit: "un", price: 64 },
  { id: "m7", name: "Lâmpada tubular LED 18 W", unit: "un", price: 21 },
  { id: "m8", name: "Switch gerenciável 24 portas", unit: "un", price: 1890 },
];
export const materialById = (id: string) => materials.find((m) => m.id === id) ?? materials[0];

/* ------------------------------------------------------------------ */
/* Contratos recorrentes                                               */
/* ------------------------------------------------------------------ */

export type ContractStatus = "ativo" | "implantacao" | "renovar" | "suspenso" | "encerrado";
export type Contract = {
  id: string;
  number: string;
  clientId: string;
  plan: string;
  scope: string;
  monthly: number;
  index: "IPCA" | "IGP-M";
  start: string;
  /** Aniversário: data do próximo reajuste e da renovação. */
  renewal: string;
  billingDay: number;
  method: "Boleto" | "Pix";
  sla: string;
  hoursIncluded: number;
  hoursUsed: number;
  status: ContractStatus;
};

export const contracts: Contract[] = [
  { id: "ct1", number: "CT-2023-004", clientId: "k1", plan: "Manutenção predial · Completo", scope: "Elétrica, hidráulica e bombas; 2 visitas preventivas/mês; plantão 24 h", monthly: 6_800, index: "IGP-M", start: "2023-03-01", renewal: "2027-03-01", billingDay: 5, method: "Boleto", sla: "4 h úteis", hoursIncluded: 24, hoursUsed: 19, status: "ativo" },
  { id: "ct2", number: "CT-2024-002", clientId: "k2", plan: "Climatização · PMOC", scope: "18 splits e 1 VRF; PMOC mensal; laudo anual", monthly: 3_950, index: "IPCA", start: "2024-01-15", renewal: "2026-11-15", billingDay: 10, method: "Pix", sla: "8 h úteis", hoursIncluded: 12, hoursUsed: 7, status: "renovar" },
  { id: "ct3", number: "CT-2022-011", clientId: "k3", plan: "TI gerenciada · 42 estações", scope: "Service desk, backup, antivírus e rede; R$ 89 por estação", monthly: 3_738, index: "IPCA", start: "2022-08-10", renewal: "2027-08-10", billingDay: 10, method: "Boleto", sla: "2 h úteis", hoursIncluded: 30, hoursUsed: 26, status: "ativo" },
  { id: "ct4", number: "CT-2023-002", clientId: "k4", plan: "Manutenção predial · Essencial", scope: "1 visita preventiva/mês; corretivas até 10 h", monthly: 4_200, index: "IGP-M", start: "2023-02-01", renewal: "2027-02-01", billingDay: 5, method: "Boleto", sla: "8 h úteis", hoursIncluded: 10, hoursUsed: 11.5, status: "ativo" },
  { id: "ct5", number: "CT-2024-007", clientId: "k5", plan: "Manutenção predial · Essencial", scope: "Câmaras frias e elétrica; 1 visita/mês", monthly: 1_980, index: "IPCA", start: "2024-06-03", renewal: "2026-12-03", billingDay: 15, method: "Boleto", sla: "8 h úteis", hoursIncluded: 6, hoursUsed: 2, status: "suspenso" },
  { id: "ct6", number: "CT-2021-009", clientId: "k6", plan: "Manutenção predial · Completo", scope: "3 torres; bombas, portões, interfonia e elétrica", monthly: 9_400, index: "IGP-M", start: "2021-11-20", renewal: "2026-11-20", billingDay: 5, method: "Boleto", sla: "4 h úteis", hoursIncluded: 32, hoursUsed: 21, status: "renovar" },
  { id: "ct7", number: "CT-2025-014", clientId: "k7", plan: "Climatização · PMOC + TI gerenciada", scope: "12 splits, 2 câmaras de amostras; 16 estações", monthly: 5_120, index: "IPCA", start: "2026-09-15", renewal: "2027-09-15", billingDay: 10, method: "Pix", sla: "4 h úteis", hoursIncluded: 16, hoursUsed: 3, status: "implantacao" },
  { id: "ct8", number: "CT-2024-004", clientId: "k8", plan: "Manutenção predial · Essencial", scope: "Elétrica industrial leve; 1 visita/mês", monthly: 2_650, index: "IPCA", start: "2024-03-12", renewal: "2027-03-12", billingDay: 15, method: "Pix", sla: "8 h úteis", hoursIncluded: 8, hoursUsed: 4, status: "ativo" },
  { id: "ct9", number: "CT-2025-003", clientId: "k9", plan: "TI gerenciada · 64 estações", scope: "Wi-Fi, impressão, service desk; R$ 89 por estação", monthly: 5_696, index: "IPCA", start: "2025-02-17", renewal: "2027-02-17", billingDay: 10, method: "Boleto", sla: "2 h úteis", hoursIncluded: 40, hoursUsed: 33, status: "ativo" },
  { id: "ct10", number: "CT-2023-008", clientId: "k10", plan: "Climatização · PMOC", scope: "6 splits e câmara de vacinas", monthly: 1_740, index: "IPCA", start: "2023-07-01", renewal: "2027-07-01", billingDay: 5, method: "Pix", sla: "4 h úteis", hoursIncluded: 6, hoursUsed: 5, status: "ativo" },
  { id: "ct11", number: "CT-2022-004", clientId: "k11", plan: "Manutenção predial · Completo", scope: "Torre de 22 andares; geradores e SPDA", monthly: 12_300, index: "IGP-M", start: "2022-04-01", renewal: "2027-04-01", billingDay: 5, method: "Boleto", sla: "2 h úteis", hoursIncluded: 40, hoursUsed: 28, status: "ativo" },
  { id: "ct12", number: "CT-2024-010", clientId: "k12", plan: "TI gerenciada · 18 estações", scope: "Laboratório de idiomas e secretaria", monthly: 1_602, index: "IPCA", start: "2024-10-01", renewal: "2026-10-01", billingDay: 10, method: "Pix", sla: "8 h úteis", hoursIncluded: 8, hoursUsed: 6, status: "renovar" },
  { id: "ct13", number: "CT-2026-019", clientId: "k13", plan: "Manutenção predial · Completo", scope: "Galpão de 3.200 m², subestação e compressores", monthly: 8_900, index: "IGP-M", start: "2026-10-01", renewal: "2027-10-01", billingDay: 5, method: "Boleto", sla: "4 h úteis", hoursIncluded: 30, hoursUsed: 0, status: "implantacao" },
  { id: "ct14", number: "CT-2023-006", clientId: "k14", plan: "Manutenção predial + Climatização", scope: "42 quartos; ar-condicionado, elétrica e hidráulica", monthly: 7_450, index: "IPCA", start: "2023-05-15", renewal: "2027-05-15", billingDay: 15, method: "Boleto", sla: "4 h úteis", hoursIncluded: 26, hoursUsed: 22, status: "ativo" },
  { id: "ct15", number: "CT-2024-008", clientId: "k15", plan: "Climatização · PMOC", scope: "4 splits e autoclave", monthly: 890, index: "IPCA", start: "2024-08-01", renewal: "2027-08-01", billingDay: 10, method: "Pix", sla: "8 h úteis", hoursIncluded: 3, hoursUsed: 1, status: "ativo" },
  { id: "ct16", number: "CT-2023-001", clientId: "k16", plan: "TI gerenciada · 12 estações", scope: "Encerrado a pedido do cliente (mudou para home office)", monthly: 1_068, index: "IPCA", start: "2023-01-10", renewal: "2026-07-10", billingDay: 10, method: "Pix", sla: "8 h úteis", hoursIncluded: 6, hoursUsed: 0, status: "encerrado" },
];
export const contractById = (id?: string) => contracts.find((x) => x.id === id);
export const contractStatus: Record<ContractStatus, { label: string; tone: Tone }> = {
  ativo: { label: "Ativo", tone: "neutral" },
  implantacao: { label: "Em implantação", tone: "info" },
  renovar: { label: "Renovação próxima", tone: "warn" },
  suspenso: { label: "Suspenso", tone: "bad" },
  encerrado: { label: "Encerrado", tone: "neutral" },
};
/** Receita recorrente mensal: contratos que faturam (ativos, a renovar e em implantação). */
export const mrr = contracts.filter((k) => ["ativo", "renovar", "implantacao"].includes(k.status)).reduce((s, k) => s + k.monthly, 0);
/** Índice acumulado em 12 meses (exemplo). */
export const indexRate = { IPCA: 0.0431, "IGP-M": 0.0362 } as const;

/** Marcos de implantação de contrato novo (para ProjectProgressCard). */
export const onboardingOf = (k: Contract) => {
  const started = k.status === "implantacao" && daysFrom(k.start) <= 0;
  return [
    { id: "o1", title: "Contrato assinado", description: "Assinatura digital pelos dois lados", status: "done" as const, date: iso(-20) },
    { id: "o2", title: "Vistoria inicial e inventário", description: "Levantamento de equipamentos, quadros e estações", status: started ? ("done" as const) : ("current" as const), date: started ? iso(-9) : iso(2) },
    { id: "o3", title: "Plano de manutenção (PMOC) e acessos", description: "Cronograma preventivo, senhas e contatos de plantão", status: started ? ("current" as const) : ("todo" as const), date: iso(4) },
    { id: "o4", title: "Primeira preventiva", description: "Visita com checklist completo e relatório ao síndico/gestor", status: "todo" as const, date: iso(9) },
    { id: "o5", title: "Primeira mensalidade", description: `Boleto/Pix no dia ${k.billingDay}`, status: "todo" as const, date: iso(14) },
  ];
};

/* ------------------------------------------------------------------ */
/* Orçamentos                                                          */
/* ------------------------------------------------------------------ */

export type QuoteStatus = "rascunho" | "enviado" | "aprovado" | "recusado" | "expirado";
export type QuoteItem = { id: string; kind: "servico" | "material"; refId: string; description: string; qty: number; price: number };
export type Quote = {
  id: string;
  number: string;
  clientId: string;
  title: string;
  kind: "Avulso" | "Recorrente";
  owner: string;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  items: QuoteItem[];
  discount: number;
  note?: string;
  /** Depois de aprovado: o que ele virou. */
  result?: { kind: "os" | "contrato"; id: string; number: string };
};

const si = (refId: string, qty: number, description?: string): QuoteItem => {
  const s = serviceById(refId);
  return { id: `${refId}-${qty}`, kind: "servico", refId, description: description ?? s.name, qty, price: s.price };
};
const mi = (refId: string, qty: number): QuoteItem => {
  const m = materialById(refId);
  return { id: `${refId}-${qty}`, kind: "material", refId, description: m.name, qty, price: m.price };
};

export const quotes: Quote[] = [
  { id: "q1", number: "ORC-0418", clientId: "k9", title: "Cabeamento cat6 do 5º andar (24 pontos)", kind: "Avulso", owner: "bianca", createdAt: iso(-2), validUntil: iso(13), status: "enviado", items: [si("pr", 24), mi("m1", 620), mi("m5", 24), mi("m8", 1)], discount: 0.05 },
  { id: "q2", number: "ORC-0417", clientId: "k13", title: "Manutenção predial · Completo (galpão)", kind: "Recorrente", owner: "bianca", createdAt: iso(-12), validUntil: iso(3), status: "aprovado", items: [si("hp", 30, "Pacote mensal · 30 h técnicas"), si("vt", 4, "Visitas preventivas mensais")], discount: 0.1, result: { kind: "contrato", id: "ct13", number: "CT-2026-019" } },
  { id: "q3", number: "ORC-0416", clientId: "k14", title: "Troca de 6 condensadoras do 3º andar", kind: "Avulso", owner: "renata", createdAt: iso(-4), validUntil: iso(11), status: "enviado", items: [si("hc", 36), mi("m4", 18), si("vt", 3)], discount: 0 },
  { id: "q4", number: "ORC-0415", clientId: "k1", title: "Substituição do quadro geral da garagem", kind: "Avulso", owner: "renata", createdAt: iso(-8), validUntil: iso(7), status: "aprovado", items: [si("hp", 16), mi("m2", 18), si("vt", 2)], discount: 0, result: { kind: "os", id: "w4", number: "OS-3184" } },
  { id: "q5", number: "ORC-0414", clientId: "k12", title: "Renovação · TI gerenciada 24 estações", kind: "Recorrente", owner: "bianca", createdAt: iso(-1), validUntil: iso(14), status: "rascunho", items: [si("ht", 24, "Estação gerenciada (mensal)")], discount: 0.08, note: "Valor por estação: R$ 89 com 8 % de desconto de renovação." },
  { id: "q6", number: "ORC-0413", clientId: "k4", title: "Impermeabilização da laje da quadra", kind: "Avulso", owner: "renata", createdAt: iso(-22), validUntil: iso(-7), status: "expirado", items: [si("hp", 64), si("vt", 4)], discount: 0 },
  { id: "q7", number: "ORC-0412", clientId: "k10", title: "Câmara de vacinas · troca do compressor", kind: "Avulso", owner: "renata", createdAt: iso(-10), validUntil: iso(5), status: "recusado", items: [si("hc", 8), si("pe", 2), si("vt", 1)], discount: 0, note: "Cliente optou por trocar o equipamento inteiro pela garantia do fabricante." },
  { id: "q8", number: "ORC-0411", clientId: "k2", title: "Higienização de 18 splits (antecipada)", kind: "Avulso", owner: "bianca", createdAt: iso(-6), validUntil: iso(9), status: "enviado", items: [si("hg", 18), mi("m3", 18)], discount: 0.1 },
  { id: "q9", number: "ORC-0410", clientId: "k6", title: "Automação dos portões da torre C", kind: "Avulso", owner: "renata", createdAt: iso(-15), validUntil: iso(0), status: "enviado", items: [si("hp", 12), si("vt", 2)], discount: 0 },
  { id: "q10", number: "ORC-0409", clientId: "k3", title: "Migração do servidor de arquivos para nuvem", kind: "Avulso", owner: "bianca", createdAt: iso(-18), validUntil: iso(-3), status: "aprovado", items: [si("ht", 40)], discount: 0.05, result: { kind: "os", id: "w8", number: "OS-3176" } },
  { id: "q11", number: "ORC-0408", clientId: "k8", title: "Iluminação LED do galpão de impressão", kind: "Avulso", owner: "renata", createdAt: iso(-3), validUntil: iso(12), status: "rascunho", items: [si("hp", 10), mi("m7", 64)], discount: 0 },
];
export const quoteById = (id?: string | null) => quotes.find((q) => q.id === id);
export const quoteStatus: Record<QuoteStatus, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Enviado", tone: "info" },
  aprovado: { label: "Aprovado", tone: "ok" },
  recusado: { label: "Recusado", tone: "bad" },
  expirado: { label: "Expirado", tone: "warn" },
};
/** Totais do orçamento: subtotal, desconto, ISS (destacado, já incluso no preço). */
export const quoteTotals = (q: Pick<Quote, "items" | "discount">) => {
  const services_ = q.items.filter((i) => i.kind === "servico").reduce((s, i) => s + i.qty * i.price, 0);
  const materials_ = q.items.filter((i) => i.kind === "material").reduce((s, i) => s + i.qty * i.price, 0);
  const subtotal = services_ + materials_;
  const discount = subtotal * q.discount;
  const total = subtotal - discount;
  const iss = services_ * (1 - q.discount) * 0.05;
  return { services: services_, materials: materials_, subtotal, discount, total, iss };
};

/* ------------------------------------------------------------------ */
/* Ordens de serviço                                                   */
/* ------------------------------------------------------------------ */

export type WoStage = "aberta" | "agendada" | "execucao" | "concluida" | "faturada";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type WoKind = "Corretiva" | "Preventiva" | "Instalação" | "Chamado de TI" | "Emergencial";
export type HoursEntry = { id: string; techId: string; date: string; start: string; end: string; hours: number; note: string };
export type UsedMaterial = { id: string; materialId: string; qty: number };
export type WorkOrder = {
  id: string;
  number: string;
  clientId: string;
  title: string;
  kind: WoKind;
  stage: WoStage;
  priority: Priority;
  techId?: string;
  openedAt: string;
  /** Prazo do SLA (data e hora). */
  due: string;
  dueTime: string;
  schedule?: { date: string; start: string; end: string };
  contractId?: string;
  quoteId?: string;
  site: string;
  description: string;
  checklist: { id: string; label: string; done: boolean }[];
  hours: HoursEntry[];
  materials: UsedMaterial[];
  /** Horas cobertas pelo contrato (não faturam). */
  covered: boolean;
  invoiceId?: string;
  signedBy?: string;
  photos: number;
};

const checklists: Record<WoKind, string[]> = {
  Corretiva: ["Isolar a área e sinalizar", "Diagnosticar a causa", "Executar o reparo", "Testar o funcionamento", "Limpar o local e recolher resíduos"],
  Preventiva: ["Conferir o plano de manutenção", "Inspeção visual e termográfica", "Limpeza e reaperto", "Medições (tensão, corrente, pressão)", "Registrar no livro de manutenção"],
  Instalação: ["Conferir projeto e materiais", "Passar infraestrutura", "Instalar e identificar", "Certificar / testar", "Entregar documentação ao cliente"],
  "Chamado de TI": ["Confirmar o problema com o usuário", "Acesso remoto ou presencial", "Aplicar a correção", "Validar com o usuário", "Documentar na base de conhecimento"],
  Emergencial: ["Atender em até 2 h", "Conter o risco", "Reparo provisório ou definitivo", "Relatório com fotos ao síndico/gestor"],
};
export const checklistFor = (kind: WoKind, done: number) => checklists[kind].map((label, i) => ({ id: `ck${i}`, label, done: i < done }));

type WoSeed = [id: string, number: string, clientId: string, title: string, kind: WoKind, stage: WoStage, priority: Priority, techId: string | undefined, openedDays: number, dueDays: number, dueTime: string, scheduleDays: number | null, slot: string, site: string, extra?: Partial<WorkOrder>];
const seeds: WoSeed[] = [
  ["w1", "OS-3191", "k11", "Gerador não assume carga no teste semanal", "Emergencial", "execucao", "urgente", "diego", 0, 0, "14:00", 0, "08:30-12:30", "Subsolo 2 · sala do gerador", { contractId: "ct11", covered: true }],
  ["w2", "OS-3190", "k3", "Impressora do jurídico sem rede", "Chamado de TI", "aberta", "media", undefined, 0, 0, "17:00", null, "", "12º andar · ilha do jurídico", { contractId: "ct3", covered: true }],
  ["w3", "OS-3189", "k2", "Split da sala 4 pingando água", "Corretiva", "agendada", "alta", "juliana", -1, 1, "12:00", 1, "09:00-11:00", "Térreo · consultório 4", { contractId: "ct2", covered: true }],
  ["w4", "OS-3184", "k1", "Substituição do quadro geral da garagem", "Instalação", "execucao", "media", "diego", -6, 2, "18:00", 0, "13:00-18:00", "Garagem G1 · quadro QGBT", { quoteId: "q4", covered: false }],
  ["w5", "OS-3188", "k6", "Bomba de recalque da torre B desarmando", "Corretiva", "aberta", "alta", undefined, -1, -0, "16:00", null, "", "Torre B · casa de bombas", { contractId: "ct6", covered: true }],
  ["w6", "OS-3187", "k9", "Wi-Fi caindo na sala de reunião Paulista", "Chamado de TI", "agendada", "media", "felipe", -1, 1, "17:00", 1, "14:00-16:00", "4º andar · sala Paulista", { contractId: "ct9", covered: true }],
  ["w7", "OS-3186", "k14", "Preventiva mensal · ar-condicionado dos quartos", "Preventiva", "concluida", "baixa", "juliana", -5, -1, "18:00", -1, "08:00-17:00", "Andares 2 a 6", { contractId: "ct14", covered: true, signedBy: "Beatriz Campos" }],
  ["w8", "OS-3176", "k3", "Migração do servidor de arquivos para nuvem", "Instalação", "concluida", "media", "felipe", -14, -2, "18:00", -2, "09:00-18:00", "12º andar · rack", { quoteId: "q10", covered: false, signedBy: "Patrícia Lins" }],
  ["w9", "OS-3183", "k4", "Vazamento no banheiro do 2º andar", "Corretiva", "concluida", "media", "marcos", -4, -2, "12:00", -3, "08:00-11:30", "Bloco A · banheiro masculino 2º", { contractId: "ct4", covered: false, signedBy: "Ricardo Pacheco" }],
  ["w10", "OS-3182", "k10", "Câmara de vacinas com alarme de temperatura", "Emergencial", "faturada", "urgente", "juliana", -6, -6, "12:00", -6, "07:30-10:00", "Fundos · câmara de vacinas", { contractId: "ct10", covered: false, invoiceId: "n3", signedBy: "Gustavo Ribeiro" }],
  ["w11", "OS-3181", "k8", "Preventiva elétrica mensal", "Preventiva", "faturada", "baixa", "diego", -9, -7, "18:00", -7, "08:00-12:00", "Galpão de impressão", { contractId: "ct8", covered: true, invoiceId: "n5", signedBy: "Lucas Amaral" }],
  ["w12", "OS-3192", "k7", "Vistoria inicial e inventário de equipamentos", "Preventiva", "agendada", "media", "juliana", 0, 2, "18:00", 2, "08:00-12:00", "Laboratório · todos os andares", { contractId: "ct7", covered: true }],
  ["w13", "OS-3185", "k12", "Notebooks do laboratório sem atualização", "Chamado de TI", "execucao", "baixa", "aline", -3, 1, "17:00", 0, "10:00-12:00", "Remoto · 18 estações", { contractId: "ct12", covered: true }],
  ["w14", "OS-3180", "k11", "Troca de lâmpadas do hall e escadas", "Corretiva", "concluida", "baixa", "diego", -7, -3, "18:00", -4, "13:00-17:00", "Hall e escada de emergência", { contractId: "ct11", covered: true, signedBy: "Elaine Borges" }],
  ["w15", "OS-3193", "k14", "Ralo do quarto 304 entupido", "Corretiva", "aberta", "media", undefined, 0, 1, "12:00", null, "", "3º andar · quarto 304", { contractId: "ct14", covered: true }],
  ["w16", "OS-3179", "k1", "Interfone das torres sem áudio", "Corretiva", "agendada", "media", "rogerio", -2, -1, "18:00", 2, "09:00-11:00", "Portaria · central de interfonia", { contractId: "ct1", covered: true }],
  ["w17", "OS-3178", "k13", "Vistoria da subestação (implantação)", "Preventiva", "agendada", "alta", "diego", -2, 3, "18:00", 3, "08:00-12:00", "Subestação 13,8 kV", { contractId: "ct13", covered: true }],
  ["w18", "OS-3177", "k9", "Instalação de 6 pontos de rede no 4º andar", "Instalação", "faturada", "media", "felipe", -12, -8, "18:00", -9, "09:00-17:00", "4º andar · ilha nova", { covered: false, invoiceId: "n7", signedBy: "Mariana Teles" }],
  ["w19", "OS-3194", "k4", "Disjuntor da cozinha desarmando", "Corretiva", "aberta", "alta", undefined, 0, 0, "18:00", null, "", "Cozinha industrial", { contractId: "ct4", covered: false }],
  ["w20", "OS-3175", "k6", "Preventiva das bombas e reservatórios", "Preventiva", "concluida", "baixa", "marcos", -6, -4, "18:00", -4, "08:00-12:00", "Torres A, B e C", { contractId: "ct6", covered: true, signedBy: "Cláudio Neves" }],
];

const stageDone: Record<WoStage, number> = { aberta: 0, agendada: 0, execucao: 2, concluida: 99, faturada: 99 };

export const workOrders: WorkOrder[] = seeds.map(([id, number, clientId, title, kind, stage, priority, techId, openedDays, dueDays, dueTime, scheduleDays, slot, site, extra]) => {
  const [start, end] = slot ? slot.split("-") : ["", ""];
  const tech = techById(techId);
  const worked = stage === "execucao" || stage === "concluida" || stage === "faturada";
  const h = (a: string, b: string) => (Number(b.slice(0, 2)) * 60 + Number(b.slice(3)) - Number(a.slice(0, 2)) * 60 - Number(a.slice(3))) / 60;
  const hours: HoursEntry[] =
    worked && tech && scheduleDays !== null
      ? [
          { id: `${id}-h1`, techId: tech.id, date: iso(scheduleDays), start, end: stage === "execucao" ? "agora" : end, hours: stage === "execucao" ? Math.max(1, Math.round(h(start, end) / 2)) : h(start, end), note: stage === "execucao" ? "Em andamento" : "Execução" },
          ...(kind === "Instalação" || kind === "Emergencial" ? [{ id: `${id}-h2`, techId: "marcos", date: iso(scheduleDays), start, end: stage === "execucao" ? "agora" : end, hours: stage === "execucao" ? 2 : h(start, end), note: "Apoio" }] : []),
        ]
      : [];
  const mats: Record<WoKind, UsedMaterial[]> = {
    Corretiva: [{ id: `${id}-m1`, materialId: kind === "Corretiva" && title.includes("Vazamento") ? "m6" : "m2", qty: 2 }],
    Preventiva: [{ id: `${id}-m1`, materialId: "m3", qty: 6 }],
    Instalação: [{ id: `${id}-m1`, materialId: title.includes("rede") ? "m1" : "m2", qty: title.includes("rede") ? 180 : 18 }, { id: `${id}-m2`, materialId: "m5", qty: 6 }],
    "Chamado de TI": [],
    Emergencial: [{ id: `${id}-m1`, materialId: "m4", qty: 2 }],
  };
  return {
    id,
    number,
    clientId,
    title,
    kind,
    stage,
    priority,
    techId,
    openedAt: iso(openedDays),
    due: iso(dueDays),
    dueTime,
    schedule: scheduleDays === null ? undefined : { date: iso(scheduleDays), start, end },
    site,
    description: `${title}. Chamado aberto por ${clientById(clientId).contact} pelo portal do cliente.`,
    checklist: checklistFor(kind, stageDone[stage]),
    hours,
    materials: worked ? mats[kind] : [],
    covered: true,
    photos: worked ? (stage === "execucao" ? 2 : 5) : 0,
    ...extra,
  };
});
export const woById = (id?: string | null) => workOrders.find((w) => w.id === id);
export const woStages: { id: WoStage; label: string }[] = [
  { id: "aberta", label: "Aberta" },
  { id: "agendada", label: "Agendada" },
  { id: "execucao", label: "Em execução" },
  { id: "concluida", label: "Concluída" },
  { id: "faturada", label: "Faturada" },
];
export const woStageLabel = (s: WoStage) => woStages.find((x) => x.id === s)!.label;
export const priorityInfo: Record<Priority, { label: string; tone: Tone }> = {
  baixa: { label: "Baixa", tone: "neutral" },
  media: { label: "Média", tone: "neutral" },
  alta: { label: "Alta", tone: "warn" },
  urgente: { label: "Urgente", tone: "bad" },
};
export const isOpen = (w: Pick<WorkOrder, "stage">) => w.stage === "aberta" || w.stage === "agendada" || w.stage === "execucao";
/** SLA: estourado (passou do prazo), vence hoje ou no prazo. */
export const slaOf = (w: Pick<WorkOrder, "stage" | "due" | "dueTime">): { label: string; tone: Tone; late: boolean } => {
  if (!isOpen(w)) return { label: "Cumprido", tone: "neutral", late: false };
  const d = daysFrom(w.due);
  if (d < 0) return { label: `Atrasada ${-d} d`, tone: "bad", late: true };
  if (d === 0) return { label: `Vence hoje ${w.dueTime}`, tone: "warn", late: false };
  return { label: d === 1 ? `Amanhã ${w.dueTime}` : `Em ${d} dias`, tone: "neutral", late: false };
};
export const woLabor = (w: WorkOrder) => w.hours.reduce((s, h) => s + h.hours * (techById(h.techId)?.rate ?? 140), 0);
export const woMaterials = (w: WorkOrder) => w.materials.reduce((s, m) => s + m.qty * materialById(m.materialId).price, 0);
/** Valor a faturar: materiais sempre; mão de obra só se não coberta pelo contrato. */
export const woValue = (w: WorkOrder) => woMaterials(w) + (w.covered ? 0 : woLabor(w)) + (w.covered ? 0 : 90);

/** Visitas preventivas de contrato já na agenda (além das OS). */
export const visits: { id: string; techId: string; clientId: string; title: string; date: string; start: string; end: string }[] = [
  { id: "v1", techId: "juliana", clientId: "k2", title: "PMOC mensal", date: iso(-2), start: "08:00", end: "12:00" },
  { id: "v2", techId: "marcos", clientId: "k6", title: "Ronda hidráulica", date: iso(-1), start: "13:00", end: "17:00" },
  { id: "v3", techId: "diego", clientId: "k11", title: "Termografia dos quadros", date: iso(-2), start: "13:00", end: "17:00" },
  { id: "v4", techId: "felipe", clientId: "k3", title: "Visita mensal de TI", date: iso(0), start: "09:00", end: "12:00" },
  { id: "v5", techId: "aline", clientId: "k9", title: "Revisão de backups", date: iso(-1), start: "09:00", end: "11:00" },
  { id: "v6", techId: "marcos", clientId: "k4", title: "Preventiva hidráulica", date: iso(1), start: "08:00", end: "12:00" },
  { id: "v7", techId: "juliana", clientId: "k15", title: "PMOC mensal", date: iso(2), start: "14:00", end: "16:00" },
  { id: "v8", techId: "aline", clientId: "k12", title: "Plantão remoto", date: iso(1), start: "13:00", end: "17:00" },
  { id: "v9", techId: "rogerio", clientId: "k11", title: "Teste mensal do gerador", date: iso(-2), start: "08:00", end: "10:00" },
  { id: "v10", techId: "diego", clientId: "k8", title: "Preventiva elétrica", date: iso(1), start: "13:00", end: "17:00" },
  { id: "v11", techId: "felipe", clientId: "k7", title: "Inventário de estações", date: iso(2), start: "13:00", end: "17:00" },
  { id: "v12", techId: "marcos", clientId: "k1", title: "Ronda de bombas", date: iso(3), start: "08:00", end: "11:00" },
];

/* ------------------------------------------------------------------ */
/* NFS-e                                                               */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "pendente" | "processando" | "emitida" | "rejeitada" | "cancelada";
export type Invoice = {
  id: string;
  number?: string;
  rps: string;
  clientId: string;
  origin: { kind: "os" | "contrato"; id: string; label: string };
  issuedAt: string;
  competence: string;
  value: number;
  serviceCode: string;
  issRate: number;
  issWithheld: boolean;
  city: string;
  status: InvoiceStatus;
  verification?: string;
  rejection?: { code: string; message: string; field: "im" | "code" | "cnpj"; fieldLabel: string; current: string; hint: string };
  cancelReason?: string;
};

const inv = (id: string, number: string | undefined, rps: string, clientId: string, origin: Invoice["origin"], issuedDays: number, value: number, serviceCode: string, status: InvoiceStatus, extra?: Partial<Invoice>): Invoice => ({
  id,
  number,
  rps,
  clientId,
  origin,
  issuedAt: iso(issuedDays),
  competence: "09/2026",
  value,
  serviceCode,
  issRate: serviceById(services.find((s) => s.code === serviceCode)?.id ?? "hp").iss,
  issWithheld: clientById(clientId).issWithheld,
  city: "São Paulo/SP",
  status,
  verification: number ? `${id.toUpperCase()}X-${rps.slice(-3)}Q7` : undefined,
  ...extra,
});

export const invoices: Invoice[] = [
  inv("n1", undefined, "RPS 1.284", "k3", { kind: "os", id: "w8", label: "OS-3176" }, 0, 4_940, "1.07", "pendente"),
  inv("n2", undefined, "RPS 1.283", "k4", { kind: "os", id: "w9", label: "OS-3183" }, 0, 818, "7.10", "pendente"),
  inv("n3", "2026/000431", "RPS 1.282", "k10", { kind: "os", id: "w10", label: "OS-3182" }, -5, 1_354, "14.01", "emitida"),
  inv("n4", undefined, "RPS 1.281", "k2", { kind: "contrato", id: "ct2", label: "CT-2024-002 · set/2026" }, -2, 3_950, "14.01", "rejeitada", {
    rejection: { code: "E160", message: "Inscrição municipal do tomador não confere com o CNPJ informado.", field: "im", fieldLabel: "Inscrição municipal do tomador", current: "4.118.902-7", hint: "Consulte o CCM do cliente na Prefeitura de São Paulo (Cadastro de Contribuintes Mobiliários)." },
  }),
  inv("n5", "2026/000429", "RPS 1.280", "k8", { kind: "os", id: "w11", label: "OS-3181" }, -6, 276, "7.10", "emitida"),
  inv("n6", undefined, "RPS 1.279", "k14", { kind: "contrato", id: "ct14", label: "CT-2023-006 · set/2026" }, -1, 7_450, "7.10", "processando"),
  inv("n7", "2026/000427", "RPS 1.278", "k9", { kind: "os", id: "w18", label: "OS-3177" }, -7, 2_184, "14.06", "emitida"),
  inv("n8", "2026/000426", "RPS 1.277", "k11", { kind: "contrato", id: "ct11", label: "CT-2022-004 · set/2026" }, -25, 12_300, "7.10", "emitida"),
  inv("n9", "2026/000425", "RPS 1.276", "k1", { kind: "contrato", id: "ct1", label: "CT-2023-004 · set/2026" }, -25, 6_800, "7.10", "emitida"),
  inv("n10", "2026/000424", "RPS 1.275", "k6", { kind: "contrato", id: "ct6", label: "CT-2021-009 · set/2026" }, -25, 9_400, "7.10", "emitida"),
  inv("n11", "2026/000423", "RPS 1.274", "k4", { kind: "contrato", id: "ct4", label: "CT-2023-002 · set/2026" }, -25, 4_200, "7.10", "emitida"),
  inv("n12", undefined, "RPS 1.273", "k12", { kind: "contrato", id: "ct12", label: "CT-2024-010 · set/2026" }, -20, 1_602, "1.07", "rejeitada", {
    rejection: { code: "E326", message: "Código de serviço 1.07 incompatível com a atividade informada no RPS.", field: "code", fieldLabel: "Código do serviço (LC 116)", current: "1.07", hint: "Para suporte em informática a Prefeitura de SP aceita 1.07 com o código de tributação 02800. Confira o código de tributação municipal." },
  }),
  inv("n13", "2026/000421", "RPS 1.272", "k3", { kind: "contrato", id: "ct3", label: "CT-2022-011 · set/2026" }, -20, 3_738, "1.07", "emitida"),
  inv("n14", "2026/000420", "RPS 1.271", "k9", { kind: "contrato", id: "ct9", label: "CT-2025-003 · set/2026" }, -20, 5_696, "1.07", "emitida"),
  inv("n15", "2026/000418", "RPS 1.269", "k5", { kind: "contrato", id: "ct5", label: "CT-2024-007 · set/2026" }, -15, 1_980, "7.10", "cancelada", { cancelReason: "Contrato suspenso por inadimplência; nota substituída por acordo de parcelamento." }),
  inv("n16", "2026/000417", "RPS 1.268", "k14", { kind: "os", id: "w-3172", label: "OS-3172" }, -16, 1_420, "14.01", "emitida"),
  inv("n17", "2026/000416", "RPS 1.267", "k15", { kind: "contrato", id: "ct15", label: "CT-2024-008 · set/2026" }, -20, 890, "14.01", "emitida"),
];
export const invoiceById = (id?: string | null) => invoices.find((n) => n.id === id);
export const invoiceStatus: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  pendente: { label: "A emitir", tone: "neutral" },
  processando: { label: "Na prefeitura", tone: "info" },
  emitida: { label: "Emitida", tone: "ok" },
  rejeitada: { label: "Rejeitada", tone: "bad" },
  cancelada: { label: "Cancelada", tone: "neutral" },
};
export const issOf = (n: Pick<Invoice, "value" | "issRate">) => n.value * n.issRate;

/* ------------------------------------------------------------------ */
/* Cobranças (boleto e Pix) e régua                                    */
/* ------------------------------------------------------------------ */

export type ChargeStatus = "aberta" | "paga" | "cancelada";
export type Charge = {
  id: string;
  number: string;
  clientId: string;
  description: string;
  invoiceId?: string;
  contractId?: string;
  issuedAt: string;
  due: string;
  value: number;
  method: "Boleto" | "Pix";
  status: ChargeStatus;
  paidAt?: string;
  agreement?: string;
};
const ch = (id: string, number: string, clientId: string, description: string, dueDays: number, value: number, method: Charge["method"], status: ChargeStatus, extra?: Partial<Charge>): Charge => ({
  id,
  number,
  clientId,
  description,
  issuedAt: iso(dueDays - 10),
  due: iso(dueDays),
  value,
  method,
  status,
  ...extra,
});

export const charges: Charge[] = [
  ch("b1", "COB-2214", "k5", "Mensalidade ago/2026 · CT-2024-007", -46, 1_980, "Boleto", "aberta", { contractId: "ct5" }),
  ch("b2", "COB-2219", "k5", "Mensalidade set/2026 · CT-2024-007", -15, 1_980, "Boleto", "aberta", { contractId: "ct5", agreement: "Acordo proposto: 3 × R$ 1.320" }),
  ch("b3", "COB-2231", "k15", "Mensalidade set/2026 · CT-2024-008", -20, 890, "Pix", "aberta", { contractId: "ct15", invoiceId: "n17" }),
  ch("b4", "COB-2236", "k4", "OS-3170 · troca de bomba da piscina", -8, 2_340, "Boleto", "aberta"),
  ch("b5", "COB-2240", "k10", "OS-3182 · câmara de vacinas", -1, 1_354, "Pix", "aberta", { invoiceId: "n3" }),
  ch("b6", "COB-2241", "k8", "OS-3181 · materiais", 3, 276, "Pix", "aberta", { invoiceId: "n5" }),
  ch("b7", "COB-2242", "k9", "OS-3177 · pontos de rede", 3, 2_184, "Boleto", "aberta", { invoiceId: "n7" }),
  ch("b8", "COB-2243", "k11", "Mensalidade out/2026 · CT-2022-004", 5, 12_300, "Boleto", "aberta", { contractId: "ct11" }),
  ch("b9", "COB-2244", "k1", "Mensalidade out/2026 · CT-2023-004", 5, 6_800, "Boleto", "aberta", { contractId: "ct1" }),
  ch("b10", "COB-2245", "k6", "Mensalidade out/2026 · CT-2021-009", 5, 9_400, "Boleto", "aberta", { contractId: "ct6" }),
  ch("b11", "COB-2246", "k4", "Mensalidade out/2026 · CT-2023-002", 5, 4_200, "Boleto", "aberta", { contractId: "ct4" }),
  ch("b12", "COB-2247", "k3", "Mensalidade out/2026 · CT-2022-011", 10, 3_738, "Boleto", "aberta", { contractId: "ct3" }),
  ch("b13", "COB-2248", "k9", "Mensalidade out/2026 · CT-2025-003", 10, 5_696, "Boleto", "aberta", { contractId: "ct9" }),
  ch("b14", "COB-2249", "k2", "Mensalidade out/2026 · CT-2024-002", 10, 3_950, "Pix", "aberta", { contractId: "ct2" }),
  ch("b15", "COB-2230", "k11", "Mensalidade set/2026 · CT-2022-004", -25, 12_300, "Boleto", "paga", { contractId: "ct11", invoiceId: "n8", paidAt: iso(-25) }),
  ch("b16", "COB-2229", "k1", "Mensalidade set/2026 · CT-2023-004", -25, 6_800, "Boleto", "paga", { contractId: "ct1", invoiceId: "n9", paidAt: iso(-24) }),
  ch("b17", "COB-2228", "k6", "Mensalidade set/2026 · CT-2021-009", -25, 9_400, "Boleto", "paga", { contractId: "ct6", invoiceId: "n10", paidAt: iso(-23) }),
  ch("b18", "COB-2232", "k3", "Mensalidade set/2026 · CT-2022-011", -20, 3_738, "Boleto", "paga", { contractId: "ct3", invoiceId: "n13", paidAt: iso(-20) }),
  ch("b19", "COB-2233", "k9", "Mensalidade set/2026 · CT-2025-003", -20, 5_696, "Boleto", "paga", { contractId: "ct9", invoiceId: "n14", paidAt: iso(-19) }),
  ch("b20", "COB-2237", "k14", "OS-3172 · preventiva extra", -10, 1_420, "Pix", "paga", { invoiceId: "n16", paidAt: iso(-10) }),
  ch("b21", "COB-2238", "k12", "Mensalidade set/2026 · CT-2024-010", -20, 1_602, "Pix", "paga", { contractId: "ct12", paidAt: iso(-2) }),
];
export const chargeById = (id?: string | null) => charges.find((b) => b.id === id);
export const isOverdue = (b: Pick<Charge, "status" | "due">) => b.status === "aberta" && daysFrom(b.due) < 0;
export const chargeState = (b: Pick<Charge, "status" | "due">): { label: string; tone: Tone } =>
  b.status === "paga" ? { label: "Paga", tone: "ok" } : b.status === "cancelada" ? { label: "Cancelada", tone: "neutral" } : isOverdue(b) ? { label: `Vencida há ${-daysFrom(b.due)} d`, tone: "bad" } : daysFrom(b.due) === 0 ? { label: "Vence hoje", tone: "warn" } : { label: "A vencer", tone: "neutral" };

/** Régua de cobrança: lembretes automáticos por e-mail e WhatsApp. */
export const dunningSteps = [
  { id: "d-3", offset: -3, label: "D-3", title: "Lembrete amigável", channel: "E-mail com boleto e Pix" },
  { id: "d0", offset: 0, label: "D0", title: "Vence hoje", channel: "WhatsApp com Pix copia e cola" },
  { id: "d+1", offset: 1, label: "D+1", title: "Pagamento não identificado", channel: "E-mail + WhatsApp com 2ª via" },
  { id: "d+7", offset: 7, label: "D+7", title: "Aviso de suspensão", channel: "E-mail ao financeiro do cliente" },
  { id: "d+15", offset: 15, label: "D+15", title: "Suspensão do contrato", channel: "Tarefa para o financeiro decidir" },
] as const;

/** Extrato do banco para conciliação simples (créditos do Itaú). */
export const bankLines = [
  { id: "x1", date: iso(0), description: "PIX RECEBIDO · REDE FARMA BEM LTDA", value: 1_354, match: "b5" },
  { id: "x2", date: iso(-1), description: "LIQUIDAÇÃO BOLETO · COLEGIO HORIZONTE", value: 2_340, match: "b4" },
  { id: "x3", date: iso(-1), description: "PIX RECEBIDO · CAMILA ORTIZ", value: 890, match: "b3" },
  { id: "x4", date: iso(-2), description: "TED RECEBIDA · 04512663000138", value: 4_450, match: undefined },
];

/* ------------------------------------------------------------------ */
/* Financeiro do painel                                                */
/* ------------------------------------------------------------------ */

export const cash = { balance: 186_430.22, accounts: [{ bank: "Itaú · conta PJ", value: 142_118.4 }, { bank: "Inter · conta Pix", value: 44_311.82 }] };
export const payables = [
  { id: "p1", label: "Folha de pagamento (out)", due: iso(5), value: 58_400 },
  { id: "p2", label: "DAS · Simples Nacional", due: iso(20), value: 9_870 },
  { id: "p3", label: "Aluguel do escritório e almoxarifado", due: iso(10), value: 7_200 },
  { id: "p4", label: "Frota · leasing das 4 vans", due: iso(12), value: 8_960 },
  { id: "p5", label: "Fornecedores de materiais", due: iso(15), value: 12_640 },
  { id: "p6", label: "Combustível e pedágio", due: iso(30), value: 4_300 },
];

/** Fluxo previsto das próximas 8 semanas (entradas e saídas). */
export const cashflow = [
  { semana: "29/09", entradas: 9_520, saidas: -6_100 },
  { semana: "06/10", entradas: 46_670, saidas: -66_800 },
  { semana: "13/10", entradas: 28_420, saidas: -21_600 },
  { semana: "20/10", entradas: 8_300, saidas: -14_870 },
  { semana: "27/10", entradas: 6_200, saidas: -4_300 },
  { semana: "03/11", entradas: 48_100, saidas: -60_200 },
  { semana: "10/11", entradas: 29_800, saidas: -22_900 },
  { semana: "17/11", entradas: 9_100, saidas: -15_400 },
];

/** OS concluídas por dia (últimos 14 dias úteis). */
export const doneByDay = [
  { label: "10", value: 7 },
  { label: "11", value: 9 },
  { label: "14", value: 6 },
  { label: "15", value: 11 },
  { label: "16", value: 8 },
  { label: "17", value: 10 },
  { label: "18", value: 5 },
  { label: "21", value: 9 },
  { label: "22", value: 12 },
  { label: "23", value: 8 },
  { label: "24", value: 7 },
  { label: "25", value: 10 },
  { label: "28", value: 9 },
  { label: "29", value: 6 },
];

/** Receita recorrente nos últimos 6 meses (para o painel e contratos). */
export const mrrHistory = [
  { mes: "abr", mrr: 57_900 },
  { mes: "mai", mrr: 58_640 },
  { mes: "jun", mrr: 59_310 },
  { mes: "jul", mrr: 59_980 },
  { mes: "ago", mrr: 60_416 },
  { mes: "set", mrr: 74_436 },
];

/* ------------------------------------------------------------------ */
/* Agregados por cliente                                               */
/* ------------------------------------------------------------------ */

export const openBalance = (clientId: string) => charges.filter((b) => b.clientId === clientId && b.status === "aberta").reduce((s, b) => s + b.value, 0);
export const overdueBalance = (clientId: string) => charges.filter((b) => b.clientId === clientId && isOverdue(b)).reduce((s, b) => s + b.value, 0);
export const clientMrr = (clientId: string) => contracts.filter((k) => k.clientId === clientId && ["ativo", "renovar", "implantacao"].includes(k.status)).reduce((s, k) => s + k.monthly, 0);
export const clientOpenWos = (clientId: string) => workOrders.filter((w) => w.clientId === clientId && isOpen(w)).length;

/* ------------------------------------------------------------------ */
/* Orçamento aprovado → OS ou contrato (sem redigitar)                 */
/* ------------------------------------------------------------------ */

/** OS nova a partir de um orçamento avulso aprovado (id "orc-<quoteId>"). */
export const woFromQuote = (q: Quote): WorkOrder => ({
  id: `orc-${q.id}`,
  number: "OS-3195",
  clientId: q.clientId,
  title: q.title,
  kind: q.items.some((i) => i.kind === "material") ? "Instalação" : "Corretiva",
  stage: "aberta",
  priority: "media",
  openedAt: iso(0),
  due: iso(5),
  dueTime: "18:00",
  quoteId: q.id,
  site: clientById(q.clientId).address,
  description: `Gerada do orçamento ${q.number} aprovado. ${q.items.length} itens copiados.`,
  checklist: checklistFor(q.items.some((i) => i.kind === "material") ? "Instalação" : "Corretiva", 0),
  hours: [],
  materials: q.items.filter((i) => i.kind === "material").map((i) => ({ id: i.id, materialId: i.refId, qty: i.qty })),
  covered: false,
  photos: 0,
});

/** Contrato novo (em implantação) a partir de um orçamento recorrente aprovado. */
export const contractFromQuote = (q: Quote): Contract => ({
  id: `orc-${q.id}`,
  number: "CT-2026-020",
  clientId: q.clientId,
  plan: q.title,
  scope: q.items.map((i) => `${i.qty.toLocaleString("pt-BR")} × ${i.description}`).join("; "),
  monthly: quoteTotals(q).total,
  index: "IPCA",
  start: iso(1),
  renewal: iso(366),
  billingDay: 10,
  method: "Boleto",
  sla: "8 h úteis",
  hoursIncluded: q.items.filter((i) => i.kind === "servico").reduce((s, i) => s + i.qty, 0),
  hoursUsed: 0,
  status: "implantacao",
});
