"use client";

import { ArrowLeftRight, Boxes, Building2, ClipboardCheck, ClipboardList, FileText, Gauge, History, Landmark, Package, PackageCheck, PieChart, Plus, Receipt, Scale, Search, ShoppingBag, ShoppingCart, Truck, Users, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell, Badge, EntityMark, ErrorState, IconButton, SearchPalette, Sidebar, Skeleton, formatCurrency, useCommandShortcut, type NavGroup, type NavItem, type SearchResult, type SearchScope } from "@g4ai/ds";
import { awaitingReceipt, customers, invoices, iso, me, orderStatus, orderTotal, orders, poLate, poStatus, poTotal, products, customerById, levelInfo, levelOf, purchaseOrders, purchaseRequests, qtyOf, reqStatus, requestsAwaitingMe, shipStatus, shipments, supplierById, suppliers } from "../data/erp";
import { accounts, finUser, payables, receivables } from "../data/fin";
import { frameHref, go, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do produto "Nexo ERP". Um produto, duas áreas na mesma sidebar:
 *   Operações  → painel, vendas, compras, estoque, cadastros
 *   Financeiro → visão, tesouraria, contas (a receber, a pagar), controladoria
 * Páginas irmãs ficam sob um item-pai que abre e fecha (Vendas, Compras,
 * Estoque, Cadastros, Tesouraria, Contas, Controladoria): a sidebar mostra 9
 * linhas em vez de 22, e o pai abre sozinho quando a tela atual é um subitem.
 * Recolhida, cada pai abre um menu à direita com os subitens.
 *
 * Celular: mobileNav="both". O ☰ dá acesso a tudo; a pílula traz as 4 telas
 * do dia a dia da área atual.
 */

export type NexoModule = "operacoes" | "financeiro";
export type NexoSection =
  | "painel"
  | "pedidos"
  | "notas"
  | "compras"
  | "compras-pedidos"
  | "recebimento"
  | "estoque"
  | "movimentacoes"
  | "expedicao"
  | "clientes"
  | "fornecedores"
  | "produtos"
  | "fin-painel"
  | "bancos"
  | "caixa"
  | "conciliacao"
  | "receber"
  | "pagar"
  | "orcamento"
  | "dre";

const pendingApprovals = payables.filter((p) => p.status === "aprovacao").length;
// Contadores só quando pedem ação (AGENTS.md 13): nunca total.
const items: Record<NexoSection, NavItem> = {
  painel: { href: frameHref("erp-dashboard"), label: "Painel", icon: Gauge },
  pedidos: { href: frameHref("erp-orders"), label: "Pedidos de venda", icon: ShoppingCart, badge: orders.filter((o) => o.status === "aprovado").length },
  notas: { href: frameHref("erp-invoices"), label: "Notas fiscais", icon: FileText, badge: invoices.filter((n) => n.status === "rejeitada").length || undefined },
  compras: { href: frameHref("erp-purchase-requests"), label: "Requisições", icon: ClipboardList, badge: requestsAwaitingMe().length || undefined },
  "compras-pedidos": { href: frameHref("erp-purchase-orders"), label: "Pedidos de compra", icon: ShoppingBag },
  recebimento: { href: frameHref("erp-receiving"), label: "Recebimento", icon: PackageCheck, badge: purchaseOrders.filter((p) => awaitingReceipt(p) && p.expected <= iso(0)).length || undefined },
  estoque: { href: frameHref("erp-inventory"), label: "Posição de estoque", icon: Boxes, badge: products.filter((p) => levelOf(p) === "ruptura").length },
  movimentacoes: { href: frameHref("erp-stock-movements"), label: "Movimentações", icon: History },
  expedicao: { href: frameHref("erp-shipping"), label: "Expedição", icon: Truck, badge: shipments.filter((s) => s.status === "separar").length || undefined },
  clientes: { href: frameHref("erp-customers"), label: "Clientes", icon: Users },
  fornecedores: { href: frameHref("erp-suppliers"), label: "Fornecedores", icon: Building2 },
  produtos: { href: frameHref("erp-products"), label: "Produtos", icon: Package },
  "fin-painel": { href: frameHref("fin-dashboard"), label: "Visão financeira", icon: PieChart },
  bancos: { href: frameHref("fin-bank-accounts"), label: "Contas bancárias", icon: Landmark },
  caixa: { href: frameHref("fin-cashflow"), label: "Fluxo de caixa", icon: Wallet },
  conciliacao: { href: frameHref("fin-reconciliation"), label: "Conciliação", icon: ArrowLeftRight, badge: accounts.reduce((s, a) => s + a.pending, 0) || undefined },
  receber: { href: frameHref("fin-receivables"), label: "Contas a receber", icon: Receipt },
  pagar: { href: frameHref("fin-payables"), label: "Contas a pagar", icon: ClipboardCheck, badge: pendingApprovals },
  orcamento: { href: frameHref("fin-budget"), label: "Orçamento", icon: Scale },
  dre: { href: frameHref("fin-dre"), label: "DRE", icon: FileText },
};

const financeSections: NexoSection[] = ["fin-painel", "bancos", "caixa", "conciliacao", "receber", "pagar", "orcamento", "dre"];
const moduleOf = (s: NexoSection): NexoModule => (financeSections.includes(s) ? "financeiro" : "operacoes");

/** Subitem a partir de um item da tabela acima (sem ícone: o pai já tem). */
const subOf = (key: NexoSection) => ({ href: items[key].href, label: items[key].label, badge: items[key].badge });

const groups: NavGroup[] = [
  {
    label: "Operações",
    items: [
      items.painel,
      { label: "Vendas", icon: ShoppingCart, items: [subOf("pedidos"), subOf("notas")] },
      { label: "Compras", icon: ShoppingBag, items: [subOf("compras"), subOf("compras-pedidos"), subOf("recebimento")] },
      { label: "Estoque", icon: Boxes, items: [subOf("estoque"), subOf("movimentacoes"), subOf("expedicao")] },
      { label: "Cadastros", icon: Users, items: [subOf("clientes"), subOf("fornecedores"), subOf("produtos")] },
    ],
  },
  {
    label: "Financeiro",
    items: [
      items["fin-painel"],
      { label: "Tesouraria", icon: Landmark, items: [subOf("bancos"), subOf("caixa"), subOf("conciliacao")] },
      { label: "Contas", icon: Receipt, items: [subOf("receber"), subOf("pagar")] },
      { label: "Controladoria", icon: Scale, items: [subOf("orcamento"), subOf("dre")] },
    ],
  },
];
// Na pílula, rótulos curtos (cabem em 4 colunas de ~80px).
const short = (item: NavItem, label: string): NavItem => ({ ...item, label });
const tabs: Record<NexoModule, NavItem[]> = {
  operacoes: [items.painel, short(items.pedidos, "Pedidos"), short(items.estoque, "Estoque"), short(items["compras-pedidos"], "Compras")],
  financeiro: [short(items["fin-painel"], "Visão"), short(items.bancos, "Bancos"), short(items.pagar, "A pagar"), short(items.receber, "A receber")],
};

const scopes: SearchScope[] = [
  { id: "pedidos", label: "Vendas", icon: <ShoppingCart />, prefix: "#", noun: "pedidos e notas" },
  { id: "clientes", label: "Clientes e fornecedores", icon: <Users />, prefix: "@", noun: "cadastros" },
  { id: "produtos", label: "Produtos", icon: <Boxes />, noun: "produtos" },
  { id: "compras", label: "Compras", icon: <ShoppingBag />, noun: "compras" },
  { id: "expedicao", label: "Expedição", icon: <Truck />, noun: "entregas" },
  { id: "financeiro", label: "Financeiro", icon: <Receipt />, noun: "títulos e contas" },
  { id: "acoes", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

function buildResults(): SearchResult[] {
  return [
    ...orders.map<SearchResult>((o) => ({
      id: `o${o.id}`,
      scope: "pedidos",
      title: o.number,
      subtitle: customerById(o.customerId).name,
      icon: <ShoppingCart />,
      meta: <Badge tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</Badge>,
      keywords: [o.number.replace(/\D/g, "").replace(/^0+/, ""), customerById(o.customerId).cnpj.replace(/\D/g, "")],
      preview: { title: o.number, subtitle: customerById(o.customerId).name, properties: [{ label: "Total", value: formatCurrency(orderTotal(o)) }, { label: "Situação", value: orderStatus[o.status].label }, { label: "Itens", value: o.items.length }] },
      onSelect: () => go("erp-order", o.id),
    })),
    ...customers.map<SearchResult>((c) => ({
      id: c.id,
      scope: "clientes",
      title: c.name,
      subtitle: `${c.cnpj} · ${c.city}/${c.uf}`,
      icon: <EntityMark name={c.name} tint={c.tint} className="h-6 w-6 text-[10px]" />,
      keywords: [c.cnpj.replace(/\D/g, ""), c.contact],
      onSelect: () => go("erp-customers", c.id),
    })),
    ...products.map<SearchResult>((p) => ({
      id: p.sku,
      scope: "produtos",
      title: p.name,
      subtitle: `${p.sku} · ${p.category}`,
      icon: <Boxes />,
      meta: <span className="text-[11.5px] tabular-nums text-muted">{qtyOf(p)} {p.unit}</span>,
      keywords: [p.sku, p.ncm],
      preview: { title: p.name, subtitle: p.sku, badge: <Badge tone={levelInfo[levelOf(p)].tone}>{levelInfo[levelOf(p)].label}</Badge>, properties: [{ label: "Em estoque", value: `${qtyOf(p)} ${p.unit}` }, { label: "Preço", value: formatCurrency(p.price) }] },
      onSelect: () => go("erp-product", p.sku),
    })),
    ...purchaseOrders.map<SearchResult>((p) => ({
      id: `oc${p.id}`,
      scope: "compras",
      title: p.number,
      subtitle: `${supplierById(p.supplierId).name} · pedido de compra`,
      icon: <ShoppingBag />,
      meta: <Badge tone={poLate(p) ? "bad" : poStatus[p.status].tone}>{poLate(p) ? "Atrasado" : poStatus[p.status].label}</Badge>,
      keywords: [p.number.replace(/\D/g, "").replace(/^0+/, ""), supplierById(p.supplierId).cnpj.replace(/\D/g, "")],
      preview: { title: p.number, subtitle: supplierById(p.supplierId).name, properties: [{ label: "Total", value: formatCurrency(poTotal(p)) }, { label: "Situação", value: poStatus[p.status].label }, { label: "Itens", value: p.items.length }] },
      onSelect: () => go("erp-purchase-order", p.id),
    })),
    ...purchaseRequests.map<SearchResult>((r) => ({ id: `rc${r.id}`, scope: "compras", title: r.number, subtitle: r.title, icon: <ClipboardList />, meta: <Badge tone={reqStatus[r.status].tone}>{reqStatus[r.status].label}</Badge>, onSelect: () => go("erp-purchase-requests", r.id) })),
    ...shipments.map<SearchResult>((s) => ({
      id: s.id,
      scope: "expedicao",
      title: `${s.id} · ${customerById(orders.find((o) => o.id === s.orderId)?.customerId ?? "").name}`,
      subtitle: `${s.carrier}${s.tracking ? ` · rastreio ${s.tracking}` : ""} · ${s.dest.city}/${s.dest.uf}`,
      icon: <Truck />,
      meta: <Badge tone={shipStatus[s.status].tone}>{shipStatus[s.status].label}</Badge>,
      keywords: [s.tracking ?? "", s.orderId],
      onSelect: () => go("erp-shipping", s.id),
    })),
    ...receivables.map<SearchResult>((r) => ({ id: r.id, scope: "financeiro", title: `${r.doc} · a receber`, subtitle: customerById(r.customerId).name, icon: <Receipt />, meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(r.value)}</span>, onSelect: () => go("fin-receivables", r.id) })),
    ...payables.map<SearchResult>((p) => ({ id: p.id, scope: "financeiro", title: `${p.doc} · a pagar`, subtitle: p.supplier, icon: <ClipboardCheck />, meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(p.value)}</span>, onSelect: () => go("fin-payables", p.id) })),
    ...accounts.map<SearchResult>((a) => ({ id: `ct${a.id}`, scope: "financeiro", title: a.label, subtitle: `${a.kind} · ag. ${a.agency}`, icon: <Landmark />, meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(a.balance, { cents: false })}</span>, onSelect: () => go("fin-bank-accounts", a.id) })),
    ...suppliers.map<SearchResult>((s) => ({ id: s.id, scope: "clientes", title: s.name, subtitle: `Fornecedor · ${s.category}`, icon: <Building2 />, keywords: [s.cnpj.replace(/\D/g, "")], onSelect: () => go("erp-suppliers", s.id) })),
    ...invoices.map<SearchResult>((n) => ({ id: `nf${n.id}`, scope: "pedidos", title: `NF-e ${n.number}`, subtitle: customerById(n.customerId).name, icon: <FileText />, keywords: [n.key, n.id], onSelect: () => go("erp-invoice", n.id) })),
    { id: "a1", scope: "acoes", title: "Novo pedido de venda", icon: <Plus />, keywords: ["criar pedido", "vender"], onSelect: () => go("erp-order", "novo") },
    { id: "a5", scope: "acoes", title: "Novo pedido de compra", icon: <ShoppingBag />, keywords: ["comprar", "oc"], onSelect: () => go("erp-purchase-orders", { novo: "1" }) },
    { id: "a6", scope: "acoes", title: "Registrar recebimento de mercadoria", icon: <PackageCheck />, keywords: ["entrada", "nf de entrada", "conferência"], onSelect: () => go("erp-receiving") },
    { id: "a7", scope: "acoes", title: "Ajuste de inventário", icon: <History />, keywords: ["contagem", "kardex", "acerto"], onSelect: () => go("erp-stock-movements", { ajuste: "1" }) },
    { id: "a8", scope: "acoes", title: "Cadastrar produto", icon: <Package />, keywords: ["sku", "novo produto"], onSelect: () => go("erp-products", { novo: "1" }) },
    { id: "a9", scope: "acoes", title: "Emitir NF-e de pedido aprovado", icon: <FileText />, keywords: ["faturar", "nota"], onSelect: () => go("erp-invoices", { emitir: "1" }) },
    { id: "a2", scope: "acoes", title: "Aprovar contas a pagar", icon: <ClipboardCheck />, onSelect: () => go("fin-payables") },
    { id: "a3", scope: "acoes", title: "Conciliar extrato do Itaú", icon: <ArrowLeftRight />, onSelect: () => go("fin-reconciliation", { conta: "itau" }) },
    { id: "a4", scope: "acoes", title: "Ver itens em ruptura", icon: <Boxes />, onSelect: () => go("erp-inventory") },
  ];
}

/* ------------------------------------------------------------------ */
/* Estados de demonstração (?estado=carregando|vazio|erro)             */
/* ------------------------------------------------------------------ */

/**
 * No showcase, `?estado=` força um dos estados da lista para conferir as
 * cinco formas (carregando, vazio, vazio por filtro, erro, com dados).
 * No SEU app troque pelo estado da consulta (isLoading, error, data.length).
 */
export type DemoState = "carregando" | "vazio" | "erro" | null;
export function useDemoState(): DemoState {
  const v = useFrameParam("estado");
  return v === "carregando" || v === "vazio" || v === "erro" ? v : null;
}
/** Erro para `DataTable`/`DataGrid` (`error={…}`): "Tentar de novo" limpa o estado simulado. */
export const demoError = (demo: DemoState, noun: string) => (demo === "erro" ? { message: `Não foi possível carregar ${noun}. A conexão com o servidor falhou; nada foi perdido.`, onRetry: () => setFrameQuery({ estado: undefined }) } : undefined);

/** Esqueleto de lista com a forma de uma fila de cartões (mestre-detalhe, quadro). */
export function CardsSkeleton({ rows = 5, label = "Carregando" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line bg-surface px-4 py-3">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Erro de área inteira (painel, quadro) com saída. */
export function DemoErrorState({ noun }: { noun: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <ErrorState title={`Não foi possível carregar ${noun}`} description="A conexão com o servidor falhou. Nada foi perdido; tente de novo em instantes." onRetry={() => setFrameQuery({ estado: undefined })} details="GET /api/v1/nexo · 503 Service Unavailable · req_4c19ad" />
    </div>
  );
}

export function NexoShell({ section, children }: { section: NexoSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
  // Recalcula ao abrir: o que foi criado nas telas (pedido, cliente, OC) aparece na busca.
  const results = search ? buildResults() : [];
  const mod = moduleOf(section);
  const current = items[section].href;
  const who = mod === "financeiro" ? finUser : me;
  return (
    <AppShell
      product="Nexo ERP"
      workspace={`Aço Forte · ${mod === "financeiro" ? "Financeiro" : "Operações"}`}
      mobileNav="both"
      tabs={tabs[mod]}
      currentPath={current}
      headerActions={
        <IconButton label="Buscar (⌘K)" onClick={() => setSearch(true)}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Nexo ERP"
          workspace={`Distribuidora Aço Forte · ${mod === "financeiro" ? "Financeiro" : "Operações"}`}
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={groups}
          storageKey="nexo-erp:sidebar"
          user={{ name: who.name, initials: who.initials, role: who.role }}
        />
      )}
    >
      {children}
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        scopes={scopes}
        items={results}
        placeholder="Pedido, cliente, CNPJ, SKU, NF-e ou ação…"
        recentItems={results.filter((r) => r.id === results[0]?.id || r.id === "k1" || r.id === "CHP-2210" || r.id === "oc4130")}
        onSelect={() => setSearch(false)}
        onSeeAll={(scope, q) => {
          setSearch(false);
          const target = { pedidos: ["erp-orders", ""], clientes: ["erp-customers", "k_"], produtos: ["erp-products", "pr_"], compras: ["erp-purchase-orders", "oc_"], expedicao: ["erp-shipping", "x_"], financeiro: ["fin-receivables", "r_"] }[scope.id] ?? ["erp-orders", ""];
          location.href = `?${target[1]}q=${encodeURIComponent(q)}${frameHref(target[0])}`;
        }}
        onCreate={() => {
          setSearch(false);
          go("erp-order", "novo");
        }}
        createLabel={(q) => `Novo pedido para “${q}”`}
      />
    </AppShell>
  );
}
