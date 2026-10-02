/*
 * Nexo ERP · módulo Financeiro. Mesma empresa, clientes e fornecedores do
 * módulo Operações (data/erp.ts): o título a receber é da NF emitida no
 * pedido; o a pagar é da compra aprovada. "Hoje" = 30/09/2026.
 */

import type { Tone } from "@g4ai/ds";
import { iso } from "./erp";

export { br, company, customerById, customers, daysAgo, iso, supplierById, suppliers, today } from "./erp";

export const finUser = { name: "Helena Duarte", initials: "HD", role: "Controller" };

/* ------------------------------------------------------------------ */
/* Contas bancárias                                                    */
/* ------------------------------------------------------------------ */

export type BankAccount = {
  id: string;
  bank: string;
  /** Código de compensação (341 Itaú, 001 BB, 077 Inter). */
  code: string;
  label: string;
  kind: "Conta corrente" | "Aplicação";
  agency: string;
  number: string;
  balance: number;
  pending: number;
  /** Última conciliação concluída (ISO) e quem fez. */
  lastReconciled: string;
  reconciledBy: string;
  /** Limite de cheque especial / conta garantida (0 = sem limite). */
  overdraft: number;
  /** Uso: o que passa por esta conta. */
  purpose: string;
  /** Integração do extrato: automática (API/Open Finance) ou arquivo OFX. */
  feed: "Open Finance" | "OFX manual";
};
export const accounts: BankAccount[] = [
  { id: "itau", bank: "Itaú", code: "341", label: "Itaú · CC 1234-5", kind: "Conta corrente", agency: "0912", number: "1234-5", balance: 612_400, pending: 6, lastReconciled: iso(-1), reconciledBy: "Helena Duarte", overdraft: 200_000, purpose: "Recebimentos de boleto e pagamentos a fornecedores", feed: "Open Finance" },
  { id: "bb", bank: "Banco do Brasil", code: "001", label: "Banco do Brasil · CC 98.765-0", kind: "Conta corrente", agency: "3401-2", number: "98.765-0", balance: 318_900, pending: 2, lastReconciled: iso(-4), reconciledBy: "Helena Duarte", overdraft: 100_000, purpose: "Folha de pagamento e tributos (DARF, GPS)", feed: "OFX manual" },
  { id: "inter", bank: "Inter", code: "077", label: "Inter · CC 55.432-1", kind: "Conta corrente", agency: "0001", number: "55.432-1", balance: 142_700, pending: 0, lastReconciled: iso(0), reconciledBy: "conciliação automática", overdraft: 0, purpose: "Pix de clientes do varejo e cartão", feed: "Open Finance" },
  { id: "cdb", bank: "Itaú", code: "341", label: "Aplicação CDB liquidez diária", kind: "Aplicação", agency: "0912", number: "CDB 77.120-4", balance: 81_000, pending: 0, lastReconciled: iso(0), reconciledBy: "conciliação automática", overdraft: 0, purpose: "Reserva de caixa · 102 % do CDI", feed: "Open Finance" },
];
export const accountById = (id: string) => accounts.find((a) => a.id === id);
/** Entradas e saídas dos últimos 7 dias úteis de uma conta (para as barrinhas). */
export function accountFlows(id: string) {
  const seed = { itau: 1, bb: 2, inter: 3, cdb: 4 }[id] ?? 1;
  const scale = { itau: 1, bb: 0.55, inter: 0.3, cdb: 0.02 }[id] ?? 1;
  const days: string[] = [];
  for (let d = 0; days.length < 7; d++) {
    const dt = new Date(2026, 8, 30 - d);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) days.unshift(`${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  return days.map((label, i) => ({
    label,
    entradas: Math.round((52_000 + ((i * 37 + seed * 11) % 9) * 7_400) * scale),
    saidas: Math.round((44_000 + ((i * 53 + seed * 7) % 10) * 6_900) * scale * (id === "bb" && i === 4 ? 4.2 : 1)),
  }));
}
export const cashBalance = accounts.reduce((s, a) => s + a.balance, 0);

/* ------------------------------------------------------------------ */
/* Fluxo de caixa                                                      */
/* ------------------------------------------------------------------ */

export const weeks = [
  { semana: "01–07/09", entradas: 412_000, saidas: -338_000 },
  { semana: "08–14/09", entradas: 368_000, saidas: -401_000 },
  { semana: "15–21/09", entradas: 455_000, saidas: -362_000 },
  { semana: "22–28/09", entradas: 389_000, saidas: -470_000 },
  { semana: "29/09–05/10", entradas: 430_000, saidas: -355_000 },
  { semana: "06–12/10", entradas: 298_000, saidas: -412_000 },
  { semana: "13–19/10", entradas: 346_000, saidas: -389_000 },
  { semana: "20–26/10", entradas: 402_000, saidas: -318_000 },
];
export const minimumCash = 900_000;
export const bridge = [
  { label: "Saldo em 01/09", value: 1_240_000, kind: "total" as const },
  { label: "Recebimentos", value: 1_624_000 },
  { label: "Fornecedores", value: -1_012_000 },
  { label: "Folha", value: -386_000 },
  { label: "Impostos", value: -214_000 },
  { label: "Despesas fixas", value: -97_000 },
  { label: "Saldo em 30/09", value: 1_155_000, kind: "total" as const },
];

/* ------------------------------------------------------------------ */
/* Contas a receber                                                    */
/* ------------------------------------------------------------------ */

export type Receivable = { id: string; doc: string; customerId: string; due: string; value: number; installment: string; method: "Boleto" | "Pix" | "Cartão"; lastContact?: string; promise?: string };
export const receivables: Receivable[] = [
  { id: "t1", doc: "NF 12.301", customerId: "k1", due: iso(-18), value: 23_559.3, installment: "2/3", method: "Boleto", lastContact: "Há 3 dias · e-mail", promise: "Pagar em 03/10" },
  { id: "t2", doc: "NF 12.188", customerId: "k7", due: iso(-33), value: 11_972.1, installment: "1/1", method: "Boleto", lastContact: "Há 12 dias · WhatsApp" },
  { id: "t3", doc: "NF 11.954", customerId: "k3", due: iso(-77), value: 38_900, installment: "3/3", method: "Boleto" },
  { id: "t4", doc: "NF 12.340", customerId: "k4", due: iso(-6), value: 5_961.6, installment: "1/1", method: "Pix", lastContact: "Ontem · telefone", promise: "Pagar hoje" },
  { id: "t5", doc: "NF 11.702", customerId: "k5", due: iso(-120), value: 52_400, installment: "1/2", method: "Boleto", lastContact: "Há 20 dias · jurídico" },
  { id: "t6", doc: "NF 12.255", customerId: "k6", due: iso(-25), value: 84_828.4, installment: "1/3", method: "Boleto" },
  { id: "t7", doc: "NF 12.310", customerId: "k2", due: iso(-10), value: 72_300, installment: "2/4", method: "Cartão", lastContact: "Há 2 dias · e-mail" },
  { id: "t8", doc: "NF 12.345", customerId: "k1", due: iso(12), value: 31_420, installment: "1/3", method: "Boleto" },
  { id: "t9", doc: "NF 12.344", customerId: "k2", due: iso(5), value: 48_900, installment: "1/1", method: "Boleto" },
  { id: "t10", doc: "NF 12.341", customerId: "k6", due: iso(20), value: 22_780, installment: "2/3", method: "Boleto" },
];
export const lateDays = (r: Receivable) => Math.max(0, Math.round((new Date(2026, 8, 30).getTime() - new Date(`${r.due}T00:00:00`).getTime()) / 86400000));
export const agingBuckets = [
  { id: "1–15", label: "1–15 dias", test: (d: number) => d >= 1 && d <= 15 },
  { id: "16–30", label: "16–30 dias", test: (d: number) => d > 15 && d <= 30 },
  { id: "31–60", label: "31–60 dias", test: (d: number) => d > 30 && d <= 60 },
  { id: "61–90", label: "61–90 dias", test: (d: number) => d > 60 && d <= 90 },
  { id: "90+", label: "90+ dias", test: (d: number) => d > 90 },
];

/* ------------------------------------------------------------------ */
/* Contas a pagar                                                      */
/* ------------------------------------------------------------------ */

export function addPayable(p: Payable) {
  payables.unshift(p);
  return p;
}
export const costCenters = ["1.02 · Estoque de revenda", "3.01 · Comercial", "3.02 · Logística", "4.01 · Ocupação", "4.02 · Administrativo", "5.01 · Pessoal", "6.01 · Tributos"];
export const payableCategories = ["Fornecedores", "Frete", "Utilidades", "Pessoal", "Impostos", "Despesas fixas", "TI"];

export type PayableStatus = "aprovacao" | "agendado" | "pago" | "atrasado";
export type Payable = { id: string; doc: string; supplier: string; supplierId?: string; category: string; costCenter: string; due: string; value: number; status: PayableStatus; method: "Boleto" | "Pix" | "TED" | "DARF"; approver?: string };
export const payableStatus: Record<PayableStatus, { label: string; tone: Tone }> = {
  aprovacao: { label: "Aguardando aprovação", tone: "info" },
  agendado: { label: "Agendado", tone: "neutral" },
  pago: { label: "Pago", tone: "ok" },
  atrasado: { label: "Atrasado", tone: "bad" },
};
export const payables: Payable[] = [
  { id: "p1", doc: "NF 88.412", supplier: "Usiminas Distribuição", supplierId: "s1", category: "Fornecedores", costCenter: "1.02 · Estoque de revenda", due: iso(0), value: 98_400, status: "aprovacao", method: "Boleto", approver: "Helena Duarte" },
  { id: "p2", doc: "Fatura 09/2026", supplier: "Energisa Goiás", category: "Utilidades", costCenter: "4.01 · Ocupação", due: iso(-1), value: 12_380.44, status: "atrasado", method: "Boleto" },
  { id: "p3", doc: "Folha 09/2026", supplier: "Folha de pagamento · setembro", category: "Pessoal", costCenter: "5.01 · Pessoal", due: iso(2), value: 386_200, status: "agendado", method: "TED" },
  { id: "p4", doc: "CT-e 7.781", supplier: "Rápido Sul Transportes", supplierId: "s5", category: "Frete", costCenter: "3.02 · Logística", due: iso(3), value: 18_760, status: "aprovacao", method: "Pix", approver: "Helena Duarte" },
  { id: "p5", doc: "DARF 2089", supplier: "Receita Federal · IRPJ/CSLL", category: "Impostos", costCenter: "6.01 · Tributos", due: iso(5), value: 64_910.3, status: "agendado", method: "DARF" },
  { id: "p6", doc: "Aluguel 10/2026", supplier: "Aluguel CD Campinas", category: "Despesas fixas", costCenter: "4.01 · Ocupação", due: iso(7), value: 42_000, status: "agendado", method: "Boleto" },
  { id: "p7", doc: "NF 45.110", supplier: "Gerdau Comercial", supplierId: "s2", category: "Fornecedores", costCenter: "1.02 · Estoque de revenda", due: iso(9), value: 42_300, status: "aprovacao", method: "Boleto", approver: "Helena Duarte" },
  { id: "p8", doc: "NF 3.908", supplier: "ESAB Soldagem", supplierId: "s6", category: "Fornecedores", costCenter: "1.02 · Estoque de revenda", due: iso(12), value: 12_880, status: "agendado", method: "Boleto" },
  { id: "p9", doc: "NF 71.204", supplier: "Kabum Empresas", supplierId: "s4", category: "TI", costCenter: "3.01 · Comercial", due: iso(14), value: 31_140, status: "aprovacao", method: "Boleto", approver: "Helena Duarte" },
  { id: "p10", doc: "NF 88.301", supplier: "Usiminas Distribuição", supplierId: "s1", category: "Fornecedores", costCenter: "1.02 · Estoque de revenda", due: iso(-8), value: 76_200, status: "pago", method: "Boleto" },
  { id: "p11", doc: "Fatura 08/2026", supplier: "Vivo Empresas", category: "Utilidades", costCenter: "4.02 · Administrativo", due: iso(-10), value: 4_120.9, status: "pago", method: "Boleto" },
];

/* ------------------------------------------------------------------ */
/* Conciliação bancária                                                */
/* ------------------------------------------------------------------ */

/** Linha do extrato (OFX) e lançamento do ERP. `match` = id sugerido pelo motor de conciliação. */
export type BankLine = { id: string; date: string; description: string; value: number; match?: string; confidence?: number };
export type LedgerEntry = { id: string; date: string; description: string; value: number; doc: string };
export const bankLines: BankLine[] = [
  { id: "b1", date: iso(-1), description: "PIX RECEBIDO FERRAGENS BOM PRECO", value: 5_961.6, match: "l1", confidence: 0.99 },
  { id: "b2", date: iso(-1), description: "BOLETO PAGO USIMINAS DISTRIB", value: -76_200, match: "l2", confidence: 0.97 },
  { id: "b3", date: iso(-2), description: "TED RECEBIDA METALURGICA S CLARA", value: 36_150, match: "l3", confidence: 0.82 },
  { id: "b4", date: iso(-2), description: "TARIFA PACOTE SERVICOS", value: -289.9 },
  { id: "b5", date: iso(-3), description: "DEB AUTOMATICO VIVO EMPRESAS", value: -4_120.9, match: "l4", confidence: 0.95 },
  { id: "b6", date: iso(-3), description: "PIX RECEBIDO 34567890000112", value: 12_000, match: "l5", confidence: 0.61 },
  { id: "b7", date: iso(-4), description: "RENDIMENTO APLIC AUTOMATICA", value: 842.17 },
];
export const ledger: LedgerEntry[] = [
  { id: "l1", date: iso(-1), description: "Recebimento NF 12.340 · Ferragens Bom Preço", value: 5_961.6, doc: "NF 12.340" },
  { id: "l2", date: iso(-1), description: "Pagamento NF 88.301 · Usiminas Distribuição", value: -76_200, doc: "NF 88.301" },
  { id: "l3", date: iso(-2), description: "Recebimento NF 12.310 (parcela 2/4) · Metalúrgica Santa Clara", value: 36_150, doc: "NF 12.310" },
  { id: "l4", date: iso(-3), description: "Fatura 08/2026 · Vivo Empresas", value: -4_120.9, doc: "Fatura 08/2026" },
  { id: "l5", date: iso(-3), description: "Acordo parcial NF 11.954 · Agro Cerrado Máquinas", value: 12_000, doc: "NF 11.954" },
  { id: "l6", date: iso(-2), description: "Recebimento NF 12.255 (parcela 1/3) · Distribuidora Norte Sul", value: 28_276.13, doc: "NF 12.255" },
];

/* ------------------------------------------------------------------ */
/* Orçamento                                                           */
/* ------------------------------------------------------------------ */

export type BudgetLine = { id: string; center: string; owner: string; kind: "receita" | "despesa"; planned: number; actual: number; plannedYtd: number; actualYtd: number };
export const budget: BudgetLine[] = [
  { id: "b-rec", center: "Receita de vendas", owner: "Paulo Menezes", kind: "receita", planned: 1_200_000, actual: 1_284_930, plannedYtd: 10_200_000, actualYtd: 10_412_000 },
  { id: "b-cmv", center: "1.02 · Estoque de revenda (CMV)", owner: "Sérgio Moura", kind: "despesa", planned: 662_000, actual: 701_400, plannedYtd: 5_600_000, actualYtd: 5_694_000 },
  { id: "b-pes", center: "5.01 · Pessoal", owner: "Helena Duarte", kind: "despesa", planned: 124_000, actual: 128_600, plannedYtd: 1_060_000, actualYtd: 1_052_000 },
  { id: "b-com", center: "3.01 · Comercial", owner: "Paulo Menezes", kind: "despesa", planned: 22_000, actual: 27_380, plannedYtd: 190_000, actualYtd: 204_000 },
  { id: "b-log", center: "3.02 · Logística e frete", owner: "Sérgio Moura", kind: "despesa", planned: 12_000, actual: 13_900, plannedYtd: 110_000, actualYtd: 114_000 },
  { id: "b-adm", center: "4.02 · Administrativo", owner: "Helena Duarte", kind: "despesa", planned: 28_000, actual: 30_100, plannedYtd: 250_000, actualYtd: 246_000 },
  { id: "b-ocu", center: "4.01 · Ocupação", owner: "Helena Duarte", kind: "despesa", planned: 12_000, actual: 14_400, plannedYtd: 108_000, actualYtd: 126_000 },
  { id: "b-ti", center: "4.03 · Tecnologia", owner: "Helena Duarte", kind: "despesa", planned: 9_000, actual: 7_200, plannedYtd: 81_000, actualYtd: 70_400 },
];

/* ------------------------------------------------------------------ */
/* DRE (setembro/2026)                                                 */
/* ------------------------------------------------------------------ */

export type DreLine = { id: string; label: string; actual: number; budget: number; ytd: number; children?: Omit<DreLine, "children">[]; kind?: "revenue" | "cost" | "result" };
export const dre: DreLine[] = [
  {
    id: "rb",
    label: "Receita bruta",
    kind: "revenue",
    actual: 1_284_930,
    budget: 1_200_000,
    ytd: 10_412_000,
    children: [
      { id: "rb1", label: "Venda de mercadorias", actual: 1_196_400, budget: 1_120_000, ytd: 9_718_000 },
      { id: "rb2", label: "Serviços de corte e dobra", actual: 88_530, budget: 80_000, ytd: 694_000 },
    ],
  },
  {
    id: "ded",
    label: "(−) Deduções e impostos sobre vendas",
    kind: "cost",
    actual: -231_290,
    budget: -216_000,
    ytd: -1_874_000,
    children: [
      { id: "ded1", label: "ICMS", actual: -163_190, budget: -153_000, ytd: -1_322_000 },
      { id: "ded2", label: "PIS/COFINS", actual: -46_900, budget: -43_800, ytd: -380_000 },
      { id: "ded3", label: "Devoluções", actual: -21_200, budget: -19_200, ytd: -172_000 },
    ],
  },
  { id: "rl", label: "Receita líquida", kind: "result", actual: 1_053_640, budget: 984_000, ytd: 8_538_000 },
  { id: "cmv", label: "(−) Custo das mercadorias vendidas", kind: "cost", actual: -701_400, budget: -662_000, ytd: -5_694_000 },
  { id: "lb", label: "Lucro bruto", kind: "result", actual: 352_240, budget: 322_000, ytd: 2_844_000 },
  {
    id: "desp",
    label: "(−) Despesas operacionais",
    kind: "cost",
    actual: -214_380,
    budget: -198_000,
    ytd: -1_742_000,
    children: [
      { id: "d1", label: "Pessoal e encargos", actual: -128_600, budget: -124_000, ytd: -1_052_000 },
      { id: "d2", label: "Comerciais e frete", actual: -41_280, budget: -34_000, ytd: -318_000 },
      { id: "d3", label: "Administrativas", actual: -30_100, budget: -28_000, ytd: -246_000 },
      { id: "d4", label: "Ocupação (aluguel, energia)", actual: -14_400, budget: -12_000, ytd: -126_000 },
    ],
  },
  { id: "ebitda", label: "EBITDA", kind: "result", actual: 137_860, budget: 124_000, ytd: 1_102_000 },
  { id: "da", label: "(−) Depreciação e juros", kind: "cost", actual: -21_400, budget: -22_000, ytd: -188_000 },
  { id: "ir", label: "(−) IRPJ e CSLL", kind: "cost", actual: -39_530, budget: -34_700, ytd: -310_000 },
  { id: "ll", label: "Lucro líquido", kind: "result", actual: 76_930, budget: 67_300, ytd: 604_000 },
];
export const marginByMonth = ["abr", "mai", "jun", "jul", "ago", "set"].map((mes, i) => ({ mes, receita: [1_080_000, 1_140_000, 1_096_000, 1_190_000, 1_232_000, 1_284_930][i], margem: [26.1, 27.4, 25.8, 26.9, 27.2, 27.4][i] }));
