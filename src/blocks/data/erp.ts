/*
 * Nexo ERP · módulo Operações (vendas, estoque, compras, fiscal). Dados de
 * exemplo compartilhados por TODAS as telas: o mesmo pedido, cliente, produto
 * e nota aparecem iguais na lista, no detalhe, no painel e na busca ⌘K.
 * Empresa que usa o ERP: Distribuidora Aço Forte Ltda. (Goiânia/GO).
 * "Hoje" = 30/09/2026. Troque pela sua API.
 */

import type { Tone } from "@g4ai/ds";

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
  { id: "debora", name: "Débora Rezende", initials: "DR", role: "Compradora", tint: "#184560" },
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
  /** Inativo: não aparece no pedido de venda; o saldo restante é liquidado. */
  status?: ProductStatus;
  /** Código de barras (GTIN/EAN-13). */
  ean?: string;
};
export type ProductStatus = "ativo" | "inativo";
export const productStatusOf = (p: Product): ProductStatus => p.status ?? "ativo";
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
  { sku: "PRF-0075", name: "Perfil U enrijecido 75 × 40 × 2 mm × 6 m", category: "Perfis", unit: "un", ncm: "7216.61.10", cost: 88.4, price: 131.0, min: 120, dailyUse: 9, stock: { gyn: 210, cps: 96 }, supplierId: "s3" },
  { sku: "BRC-0100", name: "Broca aço rápido HSS 10 mm", category: "Ferramentas", unit: "un", ncm: "8207.50.11", cost: 14.2, price: 24.9, min: 80, dailyUse: 3, stock: { gyn: 140, cps: 60 }, supplierId: "s7" },
  { sku: "TNT-5010", name: "Tinta epóxi branca 18 L (linha antiga)", category: "Acabamento", unit: "lt", ncm: "3208.90.10", cost: 455.0, price: 690.0, min: 0, dailyUse: 0, stock: { gyn: 12, cps: 0 }, supplierId: "s8", status: "inativo" },
];
/** Itens de linha usados nos pedidos de exemplo (os 12 primeiros do catálogo). */
const catalog = products.slice(0, 12);
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

export type Customer = {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  uf: string;
  segment: string;
  since: string;
  creditLimit: number;
  seller: string;
  tint: string;
  contact: string;
  email: string;
  phone: string;
  status: "ativo" | "bloqueado";
  /** Cadastro completo (clientes novos): endereço de entrega, IE e condição padrão. */
  address?: string;
  ie?: string;
  payment?: Payment;
};
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
      const p = catalog[(i + k * 2) % catalog.length];
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
export type Invoice = {
  id: string;
  number: string;
  series: string;
  orderId: string;
  customerId: string;
  issuedAt: string;
  total: number;
  status: InvoiceStatus;
  key: string;
  cfop: string;
  reason?: string;
  /** Campo que a SEFAZ recusou (rejeição): o que corrigir antes de reenviar. */
  rejected?: { field: string; label: string; value: string; hint: string };
};
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
  { id: "12290", number: "000.012.290", series: "1", orderId: "24849", customerId: "k3", issuedAt: iso(-6), total: 18_420, status: "rejeitada", key: "52260912345678000190550010000122901000000001", cfop: "5102", reason: "Rejeição 233: IE do destinatário não cadastrada na SEFAZ-GO.", rejected: { field: "ie", label: "Inscrição estadual do destinatário", value: "10.456.789-0", hint: "Consulte o Sintegra de GO. Produtor rural usa a IE da propriedade." } },
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

/* ------------------------------------------------------------------ */
/* Gravação de exemplo                                                 */
/* ------------------------------------------------------------------ */
/*
 * As telas do showcase gravam nos próprios arrays acima (ficam na memória
 * enquanto a página está aberta): o pedido criado em "Novo pedido" aparece
 * na lista e no detalhe; o cliente novo, no ⌘K. No SEU app, chame a API.
 */

export function addOrder(draft: Omit<Order, "id" | "number">) {
  const n = Math.max(...orders.map((o) => Number(o.id))) + 1;
  const order: Order = { ...draft, id: String(n), number: `PV-${String(n).padStart(6, "0")}` };
  orders.unshift(order);
  return order;
}
export function updateOrder(id: string, patch: Partial<Order>) {
  const i = orders.findIndex((o) => o.id === id);
  if (i >= 0) orders[i] = { ...orders[i], ...patch };
}
export function addCustomer(c: Customer) {
  customers.push(c);
  return c;
}
export function addProduct(p: Product) {
  products.push(p);
  return p;
}
export function addSupplier(s: Supplier) {
  suppliers.push(s);
  return s;
}
export function addInvoice(n: Invoice) {
  invoices.unshift(n);
  return n;
}

export const ufs = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
export const paymentTerms: Payment[] = ["Pix", "Boleto 28 dias", "Cartão 3x", "Boleto 30/60/90"];
export const segments = [...new Set(customers.map((c) => c.segment))];

/* ------------------------------------------------------------------ */
/* Requisições de compra                                               */
/* ------------------------------------------------------------------ */

export type ReqStatus = "pendente" | "aprovada" | "recusada";
export type PurchaseRequest = {
  id: string;
  number: string;
  title: string;
  requester: { name: string; initials: string; area: string };
  date: string;
  need: string;
  costCenter: string;
  items: { name: string; qty: number; unit: string; sku?: string }[];
  quotes: { supplier: string; total: number; delivery: string; terms: string }[];
  chain: { role: string; who: string; state: "done" | "current" | "upcoming" }[];
  status: ReqStatus;
  urgent?: boolean;
  /** Fornecedor da cotação escolhida (depois da aprovação). */
  chosen?: string;
  /** Pedido de compra gerado a partir desta requisição. */
  orderId?: string;
};
export const reqStatus: Record<ReqStatus, { label: string; tone: Tone }> = {
  pendente: { label: "Aguardando", tone: "warn" },
  aprovada: { label: "Aprovada", tone: "ok" },
  recusada: { label: "Recusada", tone: "bad" },
};
export const purchaseRequests: PurchaseRequest[] = [
  {
    id: "r1",
    number: "RC-2026-0412",
    title: "Reposição de chapas de aço 2 mm e 3 mm",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "30/09",
    need: "08/10/2026",
    costCenter: "1.02 · Estoque de revenda",
    items: [
      { name: "Chapa aço carbono 2 mm 1200 × 3000", qty: 120, unit: "un", sku: "CHP-2210" },
      { name: "Chapa aço carbono 3 mm 1200 × 3000", qty: 80, unit: "un", sku: "CHP-2215" },
    ],
    quotes: [
      { supplier: "Usiminas Distribuição", total: 98_400, delivery: "5 dias úteis", terms: "28/56 dias" },
      { supplier: "Gerdau Comercial", total: 101_900, delivery: "3 dias úteis", terms: "30 dias" },
      { supplier: "Aço Brasil Metais", total: 96_200, delivery: "12 dias úteis", terms: "à vista" },
    ],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "current" },
      { role: "Diretoria financeira", who: "acima de R$ 50 mil", state: "upcoming" },
    ],
    status: "pendente",
    urgent: true,
  },
  {
    id: "r2",
    number: "RC-2026-0409",
    title: "Notebooks para novo time comercial",
    requester: { name: "Paulo Menezes", initials: "PM", area: "Comercial" },
    date: "29/09",
    need: "20/10/2026",
    costCenter: "3.01 · Comercial",
    items: [{ name: "Notebook i7 16 GB 512 GB SSD", qty: 6, unit: "un" }],
    quotes: [
      { supplier: "Kabum Empresas", total: 31_140, delivery: "7 dias", terms: "30 dias" },
      { supplier: "Dell Brasil", total: 33_600, delivery: "15 dias", terms: "30/60 dias" },
    ],
    chain: [
      { role: "Solicitante", who: "Paulo Menezes", state: "done" },
      { role: "Gestor da área", who: "Rafael Queiroz", state: "done" },
      { role: "Compras", who: "Você", state: "current" },
    ],
    status: "pendente",
  },
  {
    id: "r3",
    number: "RC-2026-0405",
    title: "EPIs trimestrais · luvas e óculos",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "26/09",
    need: "05/10/2026",
    costCenter: "4.10 · Segurança do trabalho",
    items: [
      { name: "Luva de vaqueta (par)", qty: 400, unit: "par", sku: "LUV-0301" },
      { name: "Óculos de proteção incolor", qty: 150, unit: "un" },
    ],
    quotes: [{ supplier: "Protege EPI", total: 5_870, delivery: "4 dias", terms: "28 dias" }],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "current" },
      { role: "Compras", who: "Você", state: "upcoming" },
    ],
    status: "pendente",
  },
  {
    id: "r5",
    number: "RC-2026-0401",
    title: "Consumíveis de solda · eletrodo 6013 e arame MIG",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "24/09",
    need: "10/10/2026",
    costCenter: "1.02 · Estoque de revenda",
    items: [
      { name: "Eletrodo 6013 2,5 mm (kg)", qty: 600, unit: "kg", sku: "ELT-0098" },
      { name: "Arame MIG ER70S-6 1,0 mm (kg)", qty: 300, unit: "kg", sku: "ELT-0110" },
    ],
    quotes: [
      { supplier: "ESAB Soldagem", total: 21_270, delivery: "6 dias úteis", terms: "28 dias" },
      { supplier: "3M do Brasil", total: 23_480, delivery: "8 dias úteis", terms: "30 dias" },
      { supplier: "Gerdau Comercial", total: 22_900, delivery: "4 dias úteis", terms: "28 dias" },
    ],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "done" },
    ],
    status: "aprovada",
    chosen: "ESAB Soldagem",
    orderId: "4132",
  },
  {
    id: "r6",
    number: "RC-2026-0399",
    title: "Discos flap e brocas para o CD Campinas",
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: "23/09",
    need: "07/10/2026",
    costCenter: "1.02 · Estoque de revenda",
    items: [
      { name: "Disco flap 4,5\" grão 80", qty: 400, unit: "un", sku: "DSC-0420" },
      { name: "Broca aço rápido HSS 10 mm", qty: 120, unit: "un", sku: "BRC-0100" },
    ],
    quotes: [
      { supplier: "3M do Brasil", total: 5_344, delivery: "8 dias úteis", terms: "30 dias" },
      { supplier: "Protege EPI", total: 5_910, delivery: "5 dias úteis", terms: "28 dias" },
      { supplier: "ESAB Soldagem", total: 5_720, delivery: "6 dias úteis", terms: "28 dias" },
    ],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "done" },
    ],
    status: "aprovada",
    chosen: "3M do Brasil",
  },
  {
    id: "r4",
    number: "RC-2026-0398",
    title: "Manutenção preventiva da ponte rolante",
    requester: { name: "Diego Araújo", initials: "DA", area: "Manutenção" },
    date: "22/09",
    need: "30/09/2026",
    costCenter: "5.02 · Manutenção",
    items: [{ name: "Serviço de manutenção preventiva", qty: 1, unit: "sv" }],
    quotes: [{ supplier: "Içamento Centro-Oeste", total: 7_900, delivery: "agendado 29/09", terms: "30 dias" }],
    chain: [
      { role: "Solicitante", who: "Diego Araújo", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "done" },
      { role: "Compras", who: "Você", state: "done" },
    ],
    status: "aprovada",
    chosen: "Içamento Centro-Oeste",
  },
];
export const requestById = (id: string) => purchaseRequests.find((r) => r.id === id || r.number === id);
/** Requisições que chegaram à etapa de Compras e esperam decisão. */
export const requestsAwaitingMe = () => purchaseRequests.filter((r) => r.status === "pendente" && r.chain.some((c) => c.who === "Você" && c.state === "current"));
export const requestTotal = (r: PurchaseRequest) => (r.quotes.length ? Math.min(...r.quotes.map((q) => q.total)) : 0);

/** Cria a requisição (vai para o gestor da área) e devolve o registro. */
export function addPurchaseRequest(input: { title: string; items: PurchaseRequest["items"]; need?: string; urgent?: boolean; costCenter?: string }) {
  const n = 413 + purchaseRequests.filter((r) => r.id.startsWith("n")).length;
  const r: PurchaseRequest = {
    id: `n${n}`,
    number: `RC-2026-0${n}`,
    title: input.title,
    requester: { name: "Sérgio Moura", initials: "SM", area: "Almoxarifado" },
    date: br(iso(0)).slice(0, 5),
    need: input.need ?? br(iso(10)),
    costCenter: input.costCenter ?? "1.02 · Estoque de revenda",
    items: input.items,
    quotes: [],
    chain: [
      { role: "Solicitante", who: "Sérgio Moura", state: "done" },
      { role: "Gestor da área", who: "Fernanda Luz", state: "current" },
      { role: "Compras", who: "Você", state: "upcoming" },
    ],
    status: "pendente",
    urgent: input.urgent,
  };
  purchaseRequests.unshift(r);
  return r;
}
export function updatePurchaseRequest(id: string, patch: Partial<PurchaseRequest>) {
  const i = purchaseRequests.findIndex((r) => r.id === id);
  if (i >= 0) purchaseRequests[i] = { ...purchaseRequests[i], ...patch };
}
/** Quanto pedir para voltar a 3× o mínimo (sugestão de reposição). */
export const suggestedQty = (p: Product) => Math.max(0, p.min * 3 - qtyOf(p));

/* ------------------------------------------------------------------ */
/* Pedidos de compra                                                   */
/* ------------------------------------------------------------------ */

export type PoStatus = "rascunho" | "enviado" | "confirmado" | "parcial" | "recebido" | "cancelado";
export const poStatus: Record<PoStatus, { label: string; tone: Tone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  enviado: { label: "Enviado", tone: "info" },
  confirmado: { label: "Confirmado", tone: "accent" },
  parcial: { label: "Recebido parcial", tone: "warn" },
  recebido: { label: "Recebido", tone: "ok" },
  cancelado: { label: "Cancelado", tone: "bad" },
};
export const poFlow: PoStatus[] = ["rascunho", "enviado", "confirmado", "parcial", "recebido"];
export type PoItem = { sku: string; qty: number; cost: number; received: number };
export type PurchaseOrder = {
  id: string;
  number: string;
  supplierId: string;
  requestId?: string;
  buyer: string;
  createdAt: string;
  expected: string;
  payment: string;
  freight: "CIF" | "FOB";
  freightValue: number;
  warehouse: WarehouseId;
  items: PoItem[];
  status: PoStatus;
  sentAt?: string;
  confirmedAt?: string;
  receivedAt?: string;
  /** Nº do pedido no sistema do fornecedor (vem na confirmação). */
  supplierRef?: string;
  /** Chave da NF-e de entrada (44 dígitos). */
  nfeKey?: string;
  notes?: string;
};
const po = (n: number, supplierId: string, status: PoStatus, expectedIn: number, warehouse: WarehouseId, items: [string, number, number, number?][], extra: Partial<PurchaseOrder> = {}): PurchaseOrder => ({
  id: String(n),
  number: `OC-${String(n).padStart(6, "0")}`,
  supplierId,
  buyer: "debora",
  createdAt: iso(expectedIn - supplierById(supplierId).leadTime - 2),
  expected: iso(expectedIn),
  payment: "28/56 dias",
  freight: "CIF",
  freightValue: 0,
  warehouse,
  items: items.map(([sku, qty, cost, received]) => ({ sku, qty, cost, received: received ?? (status === "recebido" ? qty : 0) })),
  status,
  sentAt: status === "rascunho" ? undefined : iso(expectedIn - supplierById(supplierId).leadTime - 1),
  confirmedAt: ["confirmado", "parcial", "recebido"].includes(status) ? iso(expectedIn - supplierById(supplierId).leadTime) : undefined,
  receivedAt: status === "recebido" ? iso(expectedIn) : status === "parcial" ? iso(expectedIn) : undefined,
  supplierRef: ["confirmado", "parcial", "recebido"].includes(status) ? `${supplierById(supplierId).name.split(" ")[0].toUpperCase()}-${88_000 + n}` : undefined,
  nfeKey: status === "recebido" || status === "parcial" ? `5226${iso(expectedIn).slice(2, 4)}${iso(expectedIn).slice(5, 7)}${supplierById(supplierId).cnpj.replace(/\D/g, "")}5500100${String(n * 7).padStart(7, "0")}1${String(n * 13).padStart(8, "0")}` : undefined,
  ...extra,
});
export const purchaseOrders: PurchaseOrder[] = [
  po(4132, "s6", "rascunho", 8, "gyn", [["ELT-0098", 600, 21.1], ["ELT-0110", 300, 28.7]], { requestId: "r5", notes: "Entregar no CD Goiânia, doca 2, das 7h às 16h." }),
  po(4131, "s1", "enviado", 4, "gyn", [["CHP-2215", 80, 602], ["CHP-2210", 60, 418]], { payment: "28/56 dias" }),
  po(4130, "s2", "confirmado", 0, "gyn", [["TUB-1050", 120, 171.4], ["TUB-1034", 100, 96.2]], { payment: "30 dias", freight: "FOB", freightValue: 1_850 }),
  po(4129, "s7", "parcial", -2, "cps", [["DSC-0420", 300, 9.1, 120], ["DSC-0415", 500, 7.4, 500]], { payment: "30 dias", notes: "Saldo de 180 discos flap prometido para 03/10." }),
  po(4128, "s6", "confirmado", -1, "gyn", [["ELT-0110", 200, 28.7]], { payment: "28 dias" }),
  po(4127, "s8", "enviado", 6, "cps", [["TNT-5000", 40, 480]], { payment: "28 dias", freight: "FOB", freightValue: 640 }),
  po(4126, "s3", "recebido", -6, "gyn", [["CNT-0012", 200, 64.9], ["PRF-0075", 150, 88.4]], { payment: "à vista" }),
  po(4125, "s1", "recebido", -12, "gyn", [["CHP-2210", 100, 418]]),
  po(4124, "s7", "cancelado", -9, "gyn", [["LUV-0301", 400, 9.8]], { notes: "Cancelado: preço acima da tabela negociada. Recomprado com outro fornecedor." }),
  po(4123, "s2", "recebido", -15, "cps", [["TUB-1034", 200, 96.2]], { payment: "30 dias" }),
  po(4122, "s6", "recebido", -20, "gyn", [["ELT-0098", 800, 20.9]], { payment: "28 dias" }),
];
export const purchaseOrderById = (id: string) => purchaseOrders.find((p) => p.id === id || p.number === id);
export const poSubtotal = (p: Pick<PurchaseOrder, "items">) => p.items.reduce((s, it) => s + it.qty * it.cost, 0);
export const poTotal = (p: Pick<PurchaseOrder, "items" | "freightValue">) => poSubtotal(p) + p.freightValue;
/** Aguardando chegada (enviado, confirmado ou com saldo a receber). */
export const awaitingReceipt = (p: PurchaseOrder) => p.status === "enviado" || p.status === "confirmado" || p.status === "parcial";
export const poLate = (p: PurchaseOrder) => awaitingReceipt(p) && p.expected < iso(0);
export function addPurchaseOrder(draft: Omit<PurchaseOrder, "id" | "number">) {
  const n = Math.max(...purchaseOrders.map((p) => Number(p.id))) + 1;
  const order: PurchaseOrder = { ...draft, id: String(n), number: `OC-${String(n).padStart(6, "0")}` };
  purchaseOrders.unshift(order);
  return order;
}
export function updatePurchaseOrder(id: string, patch: Partial<PurchaseOrder>) {
  const i = purchaseOrders.findIndex((p) => p.id === id);
  if (i >= 0) purchaseOrders[i] = { ...purchaseOrders[i], ...patch };
  return purchaseOrders[i];
}

/* ------------------------------------------------------------------ */
/* Movimentações de estoque (kardex)                                   */
/* ------------------------------------------------------------------ */

export type MoveKind = "entrada" | "saida" | "transferencia" | "ajuste";
export const moveKind: Record<MoveKind, { label: string; tone: Tone }> = {
  entrada: { label: "Entrada", tone: "ok" },
  saida: { label: "Saída", tone: "neutral" },
  transferencia: { label: "Transferência", tone: "info" },
  ajuste: { label: "Ajuste", tone: "warn" },
};
export const adjustReasons = ["Contagem cíclica", "Avaria no manuseio", "Perda por oxidação", "Erro de lançamento", "Inventário anual"];
export type StockMove = {
  id: string;
  date: string;
  time: string;
  sku: string;
  kind: MoveKind;
  warehouse: WarehouseId;
  /** Depósito de destino (transferência). */
  to?: WarehouseId;
  /** Quantidade com sinal no saldo total (transferência = quantidade movida, não muda o total). */
  qty: number;
  doc: string;
  who: string;
  reason?: string;
  /** Saldo total do produto depois do movimento. */
  balance: number;
};
function seedMoves(): StockMove[] {
  const out: StockMove[] = [];
  const pattern: MoveKind[] = ["saida", "saida", "entrada", "saida", "transferencia", "saida", "ajuste", "saida"];
  catalog.forEach((p, pi) => {
    let bal = qtyOf(p);
    const home: WarehouseId = p.stock.gyn >= p.stock.cps ? "gyn" : "cps";
    for (let i = 0; i < 7; i++) {
      let kind = pattern[(i + pi) % pattern.length];
      const day = -(i * 3 + (pi % 3));
      const base = Math.max(1, Math.round(p.dailyUse * (2 + ((i * 5 + pi) % 4))));
      let qty = kind === "entrada" ? base * 4 : kind === "ajuste" ? -Math.max(1, Math.round(base / 6)) : kind === "transferencia" ? base : -base;
      // Andando para trás no tempo: o saldo antes do movimento não pode ficar negativo.
      if (kind === "entrada" && bal - qty < 0) {
        kind = "saida";
        qty = -base;
      }
      const sale = orders[(pi * 3 + i) % orders.length];
      const buy = purchaseOrders.find((o) => o.status === "recebido" && o.items.some((it) => it.sku === p.sku));
      out.push({
        id: `${p.sku}-${i}`,
        date: iso(day),
        time: `${String(8 + ((i * 3 + pi) % 9)).padStart(2, "0")}:${String((i * 17 + pi * 7) % 60).padStart(2, "0")}`,
        sku: p.sku,
        kind,
        warehouse: kind === "transferencia" ? (home === "gyn" ? "gyn" : "cps") : home,
        to: kind === "transferencia" ? (home === "gyn" ? "cps" : "gyn") : undefined,
        qty,
        doc: kind === "saida" ? sale.number : kind === "entrada" ? buy?.number ?? `OC-00${4110 - i}` : kind === "transferencia" ? `TR-00${91 - i - pi}` : `AJ-00${17 + pi}`,
        who: kind === "saida" ? "Faturamento automático" : kind === "entrada" ? "Sérgio Moura" : kind === "transferencia" ? "Sérgio Moura" : "Helena Duarte",
        reason: kind === "ajuste" ? adjustReasons[(i + pi) % adjustReasons.length] : undefined,
        balance: bal,
      });
      if (kind !== "transferencia") bal -= qty;
    }
  });
  return out.sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
}
export const stockMoves: StockMove[] = seedMoves();
/** Registra o movimento, atualiza o saldo do produto e devolve o lançamento. */
export function addStockMove(input: Omit<StockMove, "id" | "balance" | "date" | "time"> & { date?: string }) {
  const p = productBySku(input.sku);
  if (input.kind === "transferencia" && input.to) {
    p.stock[input.warehouse] -= input.qty;
    p.stock[input.to] += input.qty;
  } else {
    p.stock[input.warehouse] = Math.max(0, p.stock[input.warehouse] + input.qty);
  }
  const now = new Date();
  const m: StockMove = { ...input, id: `m${now.getTime()}${input.sku}`, date: input.date ?? iso(0), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, balance: qtyOf(p) };
  stockMoves.unshift(m);
  return m;
}

/* ------------------------------------------------------------------ */
/* Expedição                                                           */
/* ------------------------------------------------------------------ */

export type ShipStatus = "separar" | "separado" | "transito" | "entregue";
export const shipStatus: Record<ShipStatus, { label: string; tone: Tone }> = {
  separar: { label: "A separar", tone: "neutral" },
  separado: { label: "Separado", tone: "info" },
  transito: { label: "Em trânsito", tone: "warn" },
  entregue: { label: "Entregue", tone: "ok" },
};
export const shipFlow: ShipStatus[] = ["separar", "separado", "transito", "entregue"];
export const carriers = ["Rápido Sul Transportes", "Jamef Encomendas", "Braspress", "Patrus Transportes"];
const tzOf = (uf: string) => (uf === "AM" ? "America/Manaus" : uf === "MT" || uf === "MS" ? "America/Cuiaba" : "America/Sao_Paulo");
export type ShipEvent = { id: string; date: string; time: string; title: string; place: string; tone?: Tone };
export type Shipment = {
  id: string;
  orderId: string;
  carrier: string;
  tracking?: string;
  origin: WarehouseId;
  dest: { city: string; uf: string; timeZone: string };
  volumes: number;
  weightKg: number;
  freight: number;
  eta: string;
  status: ShipStatus;
  events: ShipEvent[];
};
export const originOf = (w: WarehouseId) => (w === "gyn" ? { place: "CD Goiânia, GO", timeZone: "America/Sao_Paulo" } : { place: "CD Campinas, SP", timeZone: "America/Sao_Paulo" });
function seedShipments(): Shipment[] {
  return orders
    .filter((o) => o.status === "faturado" || o.status === "enviado" || o.status === "entregue")
    .slice(0, 16)
    .map((o, i) => {
      const c = customerById(o.customerId);
      const status: ShipStatus = o.status === "faturado" ? (i % 2 ? "separado" : "separar") : o.status === "enviado" ? "transito" : "entregue";
      const carrier = carriers[i % carriers.length];
      const far = c.uf === "AM" || c.uf === "RJ" || c.uf === "SC";
      const eta = iso(status === "entregue" ? -2 - (i % 4) : status === "transito" ? (i % 3 === 0 ? -1 : 1 + (i % 3)) : far ? 6 : 3);
      const origin = originOf(o.warehouse);
      const dest = `${c.city}, ${c.uf}`;
      const ev: ShipEvent[] = [{ id: "e1", date: o.date, time: "09:12", title: "NF-e autorizada · pedido liberado para separação", place: origin.place }];
      if (status !== "separar") ev.push({ id: "e2", date: o.date, time: "14:40", title: `Separado e conferido · ${2 + (i % 5)} volumes`, place: origin.place });
      if (status === "transito" || status === "entregue") {
        const back = status === "entregue" ? daysAgo(eta) : 0;
        ev.push({ id: "e3", date: iso(-back - 2), time: "18:05", title: `Coletado por ${carrier}`, place: origin.place });
        ev.push({ id: "e4", date: iso(-back - 1), time: "06:30", title: far ? "Em transferência entre filiais da transportadora" : "Chegou à unidade de destino", place: far ? "Centro de distribuição da transportadora" : dest });
      }
      if (status === "transito" && eta < iso(0)) ev.push({ id: "e5", date: iso(0), time: "07:50", title: "Tentativa de entrega sem sucesso · recebimento fechado", place: dest, tone: "bad" });
      if (status === "entregue") ev.push({ id: "e6", date: eta, time: "10:24", title: `Entregue · recebido por ${c.contact}`, place: dest, tone: "ok" });
      return {
        id: `EXP-${String(3_310 - i)}`,
        orderId: o.id,
        carrier,
        tracking: status === "separar" || status === "separado" ? undefined : `${carrier.slice(0, 2).toUpperCase()}${String(48_210_000 + i * 731)}BR`,
        origin: o.warehouse,
        dest: { city: c.city, uf: c.uf, timeZone: tzOf(c.uf) },
        volumes: 2 + (i % 5),
        weightKg: Math.round(orderTotal(o) / 38),
        freight: o.freight || 180 + (i % 4) * 65,
        eta,
        status,
        events: ev.reverse(),
      };
    });
}
export const shipments: Shipment[] = seedShipments();
export const shipmentById = (id: string) => shipments.find((s) => s.id === id || s.orderId === id);
export const shipmentLate = (s: Shipment) => s.status !== "entregue" && s.eta < iso(0);
