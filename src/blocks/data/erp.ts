/*
 * Nexo ERP · módulo Operações (vendas, estoque, compras, fiscal). Dados de
 * exemplo compartilhados por TODAS as telas: o mesmo pedido, cliente, produto
 * e nota aparecem iguais na lista, no detalhe, no painel e na busca ⌘K.
 * Empresa que usa o ERP: Distribuidora Aço Forte Ltda. (Goiânia/GO).
 * "Hoje" = 30/09/2026. Troque pela sua API.
 */

import type { Tone } from "@g4os/ds";

export const today = new Date(2026, 8, 30);
export const iso = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
/** "2026-09-30" → "30/09/2026" */
export const br = (isoDate: string) => isoDate.split("-").reverse().join("/");
export const daysAgo = (isoDate: string) => Math.round((today.getTime() - new Date(`${isoDate}T00:00:00`).getTime()) / 86400000);

export const company = {
  name: "Distribuidora Aço Forte Ltda.",
  short: "Aço Forte",
  cnpj: "12.345.678/0001-90",
  ie: "10.123.456-7",
  address: "Av. Anhanguera, 5.200 · Setor Campinas · Goiânia/GO · 74043-011",
};

export type User = { id: string; name: string; initials: string; role: string; tint?: string };
// ds-audit-ignore-start hex-color: tintas de avatar e marcas de entidade (identidade)
export const users: User[] = [
  { id: "paulo", name: "Paulo Menezes", initials: "PM", role: "Gerente comercial", tint: "#184560" },
  { id: "ana", name: "Ana Lopes", initials: "AL", role: "Vendedora", tint: "#842e20" },
  { id: "bruno", name: "Bruno Takeda", initials: "BT", role: "Vendedor" },
  { id: "carla", name: "Carla Nogueira", initials: "CN", role: "Vendedora", tint: "#5f7f6f" },
  { id: "sergio", name: "Sérgio Moura", initials: "SM", role: "Almoxarifado", tint: "#8c6a3a" },
  { id: "helena", name: "Helena Duarte", initials: "HD", role: "Controller", tint: "#5f7f6f" },
];
export const me = users[0];
export const user = (id: string) => users.find((u) => u.id === id) ?? users[0];
export const sellers = users.slice(1, 4);

/* ------------------------------------------------------------------ */
/* Depósitos e produtos                                                */
/* ------------------------------------------------------------------ */

export const warehouses = [
  { id: "gyn", name: "CD Goiânia", city: "Goiânia/GO" },
  { id: "cps", name: "CD Campinas", city: "Campinas/SP" },
] as const;
export type WarehouseId = (typeof warehouses)[number]["id"];

export type Product = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  ncm: string;
  cost: number;
  price: number;
  min: number;
  dailyUse: number;
  stock: Record<WarehouseId, number>;
  supplierId: string;
};
export const products: Product[] = [
  { sku: "PAR-0412", name: "Parafuso sextavado M12 × 60 (cx 100)", category: "Fixação", unit: "cx", ncm: "7318.15.00", cost: 52.3, price: 89.9, min: 600, dailyUse: 42, stock: { gyn: 1_240, cps: 600 }, supplierId: "s7" },
  { sku: "CHP-2210", name: "Chapa aço carbono 2 mm 1200 × 3000", category: "Chapas", unit: "un", ncm: "7208.39.00", cost: 418.0, price: 612.0, min: 60, dailyUse: 6, stock: { gyn: 38, cps: 0 }, supplierId: "s1" },
  { sku: "CHP-2215", name: "Chapa aço carbono 3 mm 1200 × 3000", category: "Chapas", unit: "un", ncm: "7208.39.00", cost: 602.0, price: 868.0, min: 40, dailyUse: 4, stock: { gyn: 0, cps: 0 }, supplierId: "s1" },
  { sku: "TUB-1034", name: "Tubo galvanizado 1\" × 6 m", category: "Tubos", unit: "un", ncm: "7306.30.00", cost: 96.2, price: 148.5, min: 150, dailyUse: 11, stock: { gyn: 180, cps: 232 }, supplierId: "s2" },
  { sku: "TUB-1050", name: "Tubo galvanizado 2\" × 6 m", category: "Tubos", unit: "un", ncm: "7306.30.00", cost: 171.4, price: 259.0, min: 80, dailyUse: 7, stock: { gyn: 96, cps: 0 }, supplierId: "s2" },
  { sku: "ELT-0098", name: "Eletrodo 6013 2,5 mm (kg)", category: "Soldagem", unit: "kg", ncm: "8311.10.00", cost: 21.1, price: 32.4, min: 500, dailyUse: 38, stock: { gyn: 1_860, cps: 400 }, supplierId: "s6" },
  { sku: "ELT-0110", name: "Arame MIG ER70S-6 1,0 mm (kg)", category: "Soldagem", unit: "kg", ncm: "7229.20.00", cost: 28.7, price: 44.9, min: 200, dailyUse: 15, stock: { gyn: 0, cps: 140 }, supplierId: "s6" },
  { sku: "TNT-5000", name: "Tinta epóxi cinza 18 L", category: "Acabamento", unit: "lt", ncm: "3208.90.10", cost: 480.0, price: 734.0, min: 30, dailyUse: 2, stock: { gyn: 20, cps: 44 }, supplierId: "s8" },
  { sku: "LUV-0301", name: "Luva de vaqueta (par)", category: "EPI", unit: "par", ncm: "4203.29.00", cost: 9.8, price: 18.9, min: 400, dailyUse: 20, stock: { gyn: 2_900, cps: 1_000 }, supplierId: "s7" },
  { sku: "DSC-0415", name: "Disco de corte 7\"", category: "Abrasivos", unit: "un", ncm: "6804.22.19", cost: 7.4, price: 12.9, min: 300, dailyUse: 31, stock: { gyn: 520, cps: 0 }, supplierId: "s7" },
  { sku: "DSC-0420", name: "Disco flap 4,5\" grão 80", category: "Abrasivos", unit: "un", ncm: "6805.20.00", cost: 9.1, price: 16.5, min: 120, dailyUse: 9, stock: { gyn: 0, cps: 22 }, supplierId: "s7" },
  { sku: "CNT-0012", name: "Cantoneira 1\" × 1/8\" × 6 m", category: "Perfis", unit: "un", ncm: "7216.21.00", cost: 64.9, price: 98.0, min: 100, dailyUse: 8, stock: { gyn: 318, cps: 0 }, supplierId: "s3" },
];
export const productBySku = (sku: string) => products.find((p) => p.sku === sku) ?? products[0];
export const qtyOf = (p: Product) => p.stock.gyn + p.stock.cps;
export type Level = "ruptura" | "baixo" | "ok" | "excesso";
export const levelOf = (p: Product): Level => {
  const q = qtyOf(p);
  return q === 0 ? "ruptura" : q < p.min ? "baixo" : q > p.min * 5 ? "excesso" : "ok";
};
export const levelInfo: Record<Level, { label: string; tone: Tone }> = {
  ruptura: { label: "Ruptura", tone: "bad" },
  baixo: { label: "Abaixo do mínimo", tone: "warn" },
  ok: { label: "Normal", tone: "neutral" },
  excesso: { label: "Excesso", tone: "info" },
};
export const coverageDays = (p: Product) => (p.dailyUse ? Math.floor(qtyOf(p) / p.dailyUse) : Infinity);
export const categories = [...new Set(products.map((p) => p.category))];

/** Movimentações de um produto (entradas +, saídas −). */
export function movementsOf(p: Product) {
  const kinds = [
    { kind: "Venda", sign: -1, doc: "PV-0248" },
    { kind: "Compra", sign: 1, doc: "OC-0412" },
    { kind: "Transferência", sign: -1, doc: "TR-0091" },
    { kind: "Ajuste de inventário", sign: 1, doc: "AJ-0017" },
  ];
  return Array.from({ length: 9 }, (_, i) => {
    const k = kinds[(i * 3 + p.sku.length) % (i % 4 === 1 ? 4 : 1)] ?? kinds[0];
    const qty = Math.max(1, Math.round(p.dailyUse * (1 + ((i * 7) % 5))));
    return { id: `${p.sku}-${i}`, date: iso(-i * 2), kind: k.kind, doc: `${k.doc}${60 - i}`, warehouse: warehouses[i % 2].name, qty: k.sign * (k.kind === "Compra" ? qty * 6 : qty) };
  });
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export type Customer = { id: string; name: string; cnpj: string; city: string; uf: string; segment: string; since: string; creditLimit: number; seller: string; tint: string; contact: string; email: string; phone: string; status: "ativo" | "bloqueado" };
export const customers: Customer[] = [
  { id: "k1", name: "Construtora Pilar Ltda.", cnpj: "98.765.432/0001-10", city: "Goiânia", uf: "GO", segment: "Construção", since: "2019-03-12", creditLimit: 250_000, seller: "ana", tint: "#8c6a3a", contact: "Rogério Pilar", email: "compras@pilar.eng.br", phone: "(62) 3241-8800", status: "ativo" },
  { id: "k2", name: "Metalúrgica Santa Clara S.A.", cnpj: "23.456.789/0001-01", city: "Joinville", uf: "SC", segment: "Indústria", since: "2017-08-02", creditLimit: 400_000, seller: "bruno", tint: "#202124", contact: "Luíza Prado", email: "suprimentos@santaclara.ind.br", phone: "(47) 3422-1000", status: "ativo" },
  { id: "k3", name: "Agro Cerrado Máquinas", cnpj: "34.567.890/0001-12", city: "Rio Verde", uf: "GO", segment: "Agronegócio", since: "2021-01-20", creditLimit: 120_000, seller: "carla", tint: "#5f7f6f", contact: "Marcos Queiroz", email: "financeiro@agrocerrado.com.br", phone: "(64) 3620-4411", status: "bloqueado" },
  { id: "k4", name: "Ferragens Bom Preço", cnpj: "45.678.901/0001-23", city: "Uberlândia", uf: "MG", segment: "Varejo", since: "2020-06-09", creditLimit: 60_000, seller: "ana", tint: "#842e20", contact: "Juliana Barros", email: "compras@bompreco.com.br", phone: "(34) 3212-0099", status: "ativo" },
  { id: "k5", name: "Estaleiro Atlântico", cnpj: "56.789.012/0001-34", city: "Niterói", uf: "RJ", segment: "Naval", since: "2018-11-30", creditLimit: 300_000, seller: "bruno", tint: "#184560", contact: "Eduardo Siqueira", email: "suprimentos@atlantico.nav.br", phone: "(21) 2719-4400", status: "bloqueado" },
  { id: "k6", name: "Distribuidora Norte Sul", cnpj: "67.890.123/0001-45", city: "Manaus", uf: "AM", segment: "Distribuição", since: "2022-04-18", creditLimit: 180_000, seller: "carla", tint: "#5f7f6f", contact: "Thiago Almeida", email: "compras@nortesul.com.br", phone: "(92) 3633-2200", status: "ativo" },
  { id: "k7", name: "Serralheria Irmãos Duarte", cnpj: "78.901.234/0001-56", city: "Campinas", uf: "SP", segment: "Serralheria", since: "2023-02-01", creditLimit: 40_000, seller: "ana", tint: "#202124", contact: "Rafael Duarte", email: "contato@irmaosduarte.com.br", phone: "(19) 3232-7788", status: "ativo" },
];
// ds-audit-ignore-end
export const customerById = (id: string) => customers.find((c) => c.id === id) ?? customers[0];

/* ------------------------------------------------------------------ */
/* Pedidos de venda                                                    */
/* ------------------------------------------------------------------ */

export type OrderStatus = "orcamento" | "aprovado" | "faturado" | "enviado" | "entregue" | "cancelado";
export const orderStatus: Record<OrderStatus, { label: string; tone: Tone }> = {
  orcamento: { label: "Orçamento", tone: "neutral" },
  aprovado: { label: "Aprovado", tone: "info" },
  faturado: { label: "Faturado", tone: "accent" },
  enviado: { label: "Em transporte", tone: "warn" },
  entregue: { label: "Entregue", tone: "ok" },
  cancelado: { label: "Cancelado", tone: "bad" },
};
export const orderFlow: OrderStatus[] = ["orcamento", "aprovado", "faturado", "enviado", "entregue"];
export type Payment = "Pix" | "Boleto 28 dias" | "Cartão 3x" | "Boleto 30/60/90";
export type Order = { id: string; number: string; customerId: string; date: string; items: { sku: string; qty: number; price: number }[]; payment: Payment; status: OrderStatus; seller: string; warehouse: WarehouseId; freight: number; invoice?: string };

const statuses: OrderStatus[] = ["aprovado", "faturado", "enviado", "entregue", "orcamento", "aprovado", "entregue", "enviado", "cancelado", "faturado", "aprovado", "entregue"];
const payments: Payment[] = ["Pix", "Boleto 28 dias", "Cartão 3x", "Boleto 30/60/90"];
export const orders: Order[] = Array.from({ length: 28 }, (_, i) => {
  const status = statuses[i % statuses.length];
  const n = 1 + ((i + 2) % 4);
  const number = 24_870 - i;
  return {
    id: String(number),
    number: `PV-${String(number).padStart(6, "0")}`,
    customerId: customers[(i * 3) % customers.length].id,
    date: iso(-Math.floor(i / 2)),
    items: Array.from({ length: n }, (_, k) => {
      const p = products[(i + k * 2) % products.length];
      return { sku: p.sku, qty: 6 + ((i * 7 + k * 5 + 11) % 44), price: p.price };
    }).filter((it, k, a) => a.findIndex((x) => x.sku === it.sku) === k),
    payment: payments[i % payments.length],
    status,
    seller: sellers[i % sellers.length].id,
    warehouse: i % 3 === 0 ? "cps" : "gyn",
    freight: i % 2 ? 0 : 180 + (i % 5) * 40,
    invoice: ["faturado", "enviado", "entregue"].includes(status) ? String(12_345 - i) : undefined,
  };
});
export const orderById = (id: string) => orders.find((o) => o.id === id || o.number === id) ?? orders[0];
export const orderTotal = (o: Order) => o.items.reduce((s, it) => s + it.qty * it.price, 0) + o.freight;
export const ordersOf = (customerId: string) => orders.filter((o) => o.customerId === customerId);

/* ------------------------------------------------------------------ */
/* Notas fiscais (NF-e)                                                */
/* ------------------------------------------------------------------ */

export type InvoiceStatus = "autorizada" | "cancelada" | "rejeitada" | "processando";
export type Invoice = { id: string; number: string; series: string; orderId: string; customerId: string; issuedAt: string; total: number; status: InvoiceStatus; key: string; cfop: string; reason?: string };
export const invoiceStatus: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  autorizada: { label: "Autorizada", tone: "ok" },
  processando: { label: "Processando", tone: "info" },
  rejeitada: { label: "Rejeitada", tone: "bad" },
  cancelada: { label: "Cancelada", tone: "neutral" },
};
export const invoices: Invoice[] = [
  ...orders
    .filter((o) => o.invoice)
    .map<Invoice>((o, i) => ({
      id: o.invoice!,
      number: `000.0${o.invoice!.slice(0, 2)}.${o.invoice!.slice(2)}`,
      series: "1",
      orderId: o.id,
      customerId: o.customerId,
      issuedAt: o.date,
      total: orderTotal(o),
      status: i === 3 ? "processando" : "autorizada",
      key: `5226${o.date.slice(2, 4)}${o.date.slice(5, 7)}12345678000190550010000${o.invoice}1${String(12_345_678 + i).slice(0, 8)}`,
      cfop: customerById(o.customerId).uf === "GO" ? "5102" : "6102",
    })),
  { id: "12290", number: "000.012.290", series: "1", orderId: "24849", customerId: "k3", issuedAt: iso(-6), total: 18_420, status: "rejeitada", key: "52260912345678000190550010000122901000000001", cfop: "5102", reason: "Rejeição 539: Duplicidade de NF-e com diferença na chave de acesso." },
  { id: "12281", number: "000.012.281", series: "1", orderId: "24846", customerId: "k5", issuedAt: iso(-8), total: 41_100, status: "cancelada", key: "52260912345678000190550010000122811000000002", cfop: "6102", reason: "Cancelada a pedido do cliente (pedido duplicado)." },
];
export const invoiceById = (id: string) => invoices.find((n) => n.id === id) ?? invoices[0];

/* ------------------------------------------------------------------ */
/* Fornecedores e compras                                              */
/* ------------------------------------------------------------------ */

export type Supplier = { id: string; name: string; cnpj: string; category: string; city: string; otif: number; leadTime: number; openPOs: number; spendYtd: number; lastPurchase: string; contact: string; email: string; rating: "A" | "B" | "C"; tint: string };
// ds-audit-ignore-start hex-color: marcas de entidade (identidade)
export const suppliers: Supplier[] = [
  { id: "s1", name: "Usiminas Distribuição", cnpj: "60.894.730/0019-40", category: "Aço plano", city: "Belo Horizonte/MG", otif: 0.94, leadTime: 5, openPOs: 98_400, spendYtd: 1_840_000, lastPurchase: iso(-12), contact: "Cláudia Reis", email: "vendas.go@usiminas.com", rating: "A", tint: "#184560" },
  { id: "s2", name: "Gerdau Comercial", cnpj: "33.611.500/0001-19", category: "Tubos e perfis", city: "São Paulo/SP", otif: 0.91, leadTime: 3, openPOs: 42_300, spendYtd: 1_120_000, lastPurchase: iso(-5), contact: "Rodrigo Lemos", email: "comercial@gerdau.com.br", rating: "A", tint: "#842e20" },
  { id: "s3", name: "Aço Brasil Metais", cnpj: "11.456.222/0001-08", category: "Aço plano e perfis", city: "Anápolis/GO", otif: 0.78, leadTime: 12, openPOs: 0, spendYtd: 312_000, lastPurchase: iso(-41), contact: "Fábio Nunes", email: "vendas@acobrasil.com.br", rating: "C", tint: "#202124" },
  { id: "s4", name: "Kabum Empresas", cnpj: "05.570.714/0001-59", category: "TI e escritório", city: "Limeira/SP", otif: 0.97, leadTime: 7, openPOs: 31_140, spendYtd: 64_000, lastPurchase: iso(-1), contact: "Atendimento B2B", email: "empresas@kabum.com.br", rating: "A", tint: "#5f7f6f" },
  { id: "s5", name: "Rápido Sul Transportes", cnpj: "11.222.333/0001-44", category: "Frete", city: "Goiânia/GO", otif: 0.88, leadTime: 2, openPOs: 18_760, spendYtd: 214_000, lastPurchase: iso(-3), contact: "Marta Rocha", email: "comercial@rapidosul.com.br", rating: "B", tint: "#8c6a3a" },
  { id: "s6", name: "ESAB Soldagem", cnpj: "03.407.567/0001-08", category: "Consumíveis de solda", city: "Contagem/MG", otif: 0.93, leadTime: 6, openPOs: 12_880, spendYtd: 288_000, lastPurchase: iso(-9), contact: "Paulo Viana", email: "pedidos@esab.com.br", rating: "A", tint: "#184560" },
  { id: "s7", name: "3M do Brasil", cnpj: "45.985.371/0001-08", category: "EPI, abrasivos e fixação", city: "Sumaré/SP", otif: 0.86, leadTime: 8, openPOs: 7_420, spendYtd: 196_000, lastPurchase: iso(-16), contact: "Renata Faria", email: "industria@3m.com", rating: "B", tint: "#842e20" },
  { id: "s8", name: "Tintas Coral Industrial", cnpj: "56.998.982/0001-07", category: "Tintas e acabamento", city: "Mauá/SP", otif: 0.9, leadTime: 10, openPOs: 0, spendYtd: 88_000, lastPurchase: iso(-28), contact: "Beatriz Lima", email: "industrial@coral.com.br", rating: "B", tint: "#5f7f6f" },
];
// ds-audit-ignore-end
export const supplierById = (id: string) => suppliers.find((s) => s.id === id) ?? suppliers[0];
export const supplierByName = (name: string) => suppliers.find((s) => s.name === name);

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */

/** Vendas por dia útil nos últimos ~30 dias (fim de semana não fatura). */
export const salesByDay = Array.from({ length: 42 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - 41 + i);
  return d;
})
  .filter((d) => d.getDay() !== 0 && d.getDay() !== 6)
  .slice(-22)
  .map((d, i) => ({ dia: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, vendas: Math.round(41_000 + Math.sin(i / 2.2) * 9_000 + ((i * 37) % 11) * 900 + i * 380), meta: 42_000 }));
export const otifByWeek = ["18/08", "25/08", "01/09", "08/09", "15/09", "22/09", "29/09"].map((semana, i) => ({ semana, otif: [0.91, 0.93, 0.89, 0.94, 0.92, 0.95, 0.9][i] * 100 }));
export const lateReasons = [
  { label: "Falta de estoque", value: 18 },
  { label: "Crédito bloqueado", value: 11 },
  { label: "Transportadora", value: 7 },
  { label: "Erro de cadastro", value: 4 },
  { label: "Endereço incompleto", value: 2 },
];
