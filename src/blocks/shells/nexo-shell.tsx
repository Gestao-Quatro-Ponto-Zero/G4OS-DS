"use client";

import { ArrowLeftRight, Boxes, Building2, ClipboardList, FileText, Gauge, Landmark, PieChart, Plus, Receipt, Scale, Search, ShoppingCart, Truck, Users, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell, Badge, EntityMark, IconButton, SearchPalette, Sidebar, formatCurrency, useCommandShortcut, type NavGroup, type NavItem, type SearchResult, type SearchScope } from "@g4os/ds";
import { customers, invoices, me, orderStatus, orderTotal, orders, products, customerById, levelInfo, levelOf, qtyOf, suppliers } from "../data/erp";
import { finUser, payables, receivables } from "../data/fin";
import { frameHref, go } from "./frame-route";

/*
 * Casca do produto "Nexo ERP". Um produto, dois módulos:
 *   Operações  → vendas, clientes, estoque, compras, fornecedores, notas
 *   Financeiro → caixa, a receber, a pagar, conciliação, orçamento, DRE
 * A sidebar mostra só o módulo atual (≤ 7 itens) + atalho para o outro;
 * o público de cada módulo é diferente (comercial/almoxarifado × controller).
 *
 * Celular: mobileNav="both". O ☰ dá acesso a tudo, inclusive à troca de
 * módulo; a pílula traz as 4 telas do dia a dia do módulo atual.
 */

export type NexoModule = "operacoes" | "financeiro";
export type NexoSection =
  | "painel"
  | "pedidos"
  | "clientes"
  | "estoque"
  | "compras"
  | "fornecedores"
  | "notas"
  | "fin-painel"
  | "caixa"
  | "receber"
  | "pagar"
  | "conciliacao"
  | "orcamento"
  | "dre";

const pendingApprovals = payables.filter((p) => p.status === "aprovacao").length;

const items: Record<NexoSection, NavItem> = {
  painel: { href: frameHref("erp-dashboard"), label: "Painel", icon: Gauge },
  pedidos: { href: frameHref("erp-orders"), label: "Pedidos de venda", icon: ShoppingCart, badge: orders.filter((o) => o.status === "aprovado").length },
  clientes: { href: frameHref("erp-customers"), label: "Clientes", icon: Users },
  estoque: { href: frameHref("erp-inventory"), label: "Estoque", icon: Boxes, badge: products.filter((p) => levelOf(p) === "ruptura").length },
  compras: { href: frameHref("erp-purchase-requests"), label: "Compras", icon: ClipboardList, badge: 2 },
  fornecedores: { href: frameHref("erp-suppliers"), label: "Fornecedores", icon: Truck },
  notas: { href: frameHref("erp-invoices"), label: "Notas fiscais", icon: FileText },
  "fin-painel": { href: frameHref("fin-dashboard"), label: "Visão financeira", icon: PieChart },
  caixa: { href: frameHref("fin-cashflow"), label: "Fluxo de caixa", icon: Wallet },
  receber: { href: frameHref("fin-receivables"), label: "Contas a receber", icon: Receipt },
  pagar: { href: frameHref("fin-payables"), label: "Contas a pagar", icon: Landmark, badge: pendingApprovals },
  conciliacao: { href: frameHref("fin-reconciliation"), label: "Conciliação", icon: ArrowLeftRight, badge: 4 },
  orcamento: { href: frameHref("fin-budget"), label: "Orçamento", icon: Scale },
  dre: { href: frameHref("fin-dre"), label: "DRE", icon: FileText },
};

const moduleOf = (s: NexoSection): NexoModule => (["painel", "pedidos", "clientes", "estoque", "compras", "fornecedores", "notas"].includes(s) ? "operacoes" : "financeiro");

const groups: Record<NexoModule, NavGroup[]> = {
  operacoes: [
    { label: "Vendas", items: [items.painel, items.pedidos, items.clientes, items.notas] },
    { label: "Suprimentos", items: [items.estoque, items.compras, items.fornecedores] },
    { label: "Módulos", items: [{ href: frameHref("fin-dashboard"), label: "Ir para Financeiro", icon: Landmark, match: "#none-fin" }] },
  ],
  financeiro: [
    { label: "Financeiro", items: [items["fin-painel"], items.caixa, items.receber, items.pagar] },
    { label: "Controladoria", items: [items.conciliacao, items.orcamento, items.dre] },
    { label: "Módulos", items: [{ href: frameHref("erp-dashboard"), label: "Ir para Operações", icon: Building2, match: "#none-ops" }] },
  ],
};
// Na pílula, rótulos curtos (cabem em 4 colunas de ~80px).
const short = (item: NavItem, label: string): NavItem => ({ ...item, label });
const tabs: Record<NexoModule, NavItem[]> = {
  operacoes: [items.painel, short(items.pedidos, "Pedidos"), items.estoque, items.compras],
  financeiro: [short(items["fin-painel"], "Visão"), short(items.caixa, "Caixa"), short(items.pagar, "A pagar"), short(items.receber, "A receber")],
};

const scopes: SearchScope[] = [
  { id: "pedidos", label: "Pedidos", icon: <ShoppingCart />, prefix: "#", noun: "pedidos" },
  { id: "clientes", label: "Clientes", icon: <Users />, prefix: "@", noun: "clientes" },
  { id: "produtos", label: "Produtos", icon: <Boxes />, noun: "produtos" },
  { id: "financeiro", label: "Títulos", icon: <Receipt />, noun: "títulos" },
  { id: "acoes", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

const results: SearchResult[] = [
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
  ...receivables.map<SearchResult>((r) => ({ id: r.id, scope: "financeiro", title: `${r.doc} · a receber`, subtitle: customerById(r.customerId).name, icon: <Receipt />, meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(r.value)}</span>, onSelect: () => go("fin-receivables") })),
  ...payables.map<SearchResult>((p) => ({ id: p.id, scope: "financeiro", title: `${p.doc} · a pagar`, subtitle: p.supplier, icon: <Landmark />, meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(p.value)}</span>, onSelect: () => go("fin-payables", p.id) })),
  ...suppliers.map<SearchResult>((s) => ({ id: s.id, scope: "clientes", title: s.name, subtitle: `Fornecedor · ${s.category}`, icon: <Truck />, keywords: [s.cnpj.replace(/\D/g, "")], onSelect: () => go("erp-suppliers", s.id) })),
  ...invoices.map<SearchResult>((n) => ({ id: `nf${n.id}`, scope: "pedidos", title: `NF-e ${n.number}`, subtitle: customerById(n.customerId).name, icon: <FileText />, keywords: [n.key, n.id], onSelect: () => go("erp-invoice", n.id) })),
  { id: "a1", scope: "acoes", title: "Novo pedido de venda", icon: <Plus />, keywords: ["criar pedido", "vender"], onSelect: () => go("erp-order", "novo") },
  { id: "a2", scope: "acoes", title: "Aprovar contas a pagar", icon: <Landmark />, onSelect: () => go("fin-payables") },
  { id: "a3", scope: "acoes", title: "Conciliar extrato do Itaú", icon: <ArrowLeftRight />, onSelect: () => go("fin-reconciliation") },
  { id: "a4", scope: "acoes", title: "Ver itens em ruptura", icon: <Boxes />, onSelect: () => go("erp-inventory") },
];

export function NexoShell({ section, children }: { section: NexoSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
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
          groups={groups[mod]}
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
        recentItems={[results[0], results.find((r) => r.id === "k1")!, results.find((r) => r.id === "CHP-2210")!]}
        onSelect={() => setSearch(false)}
        onSeeAll={(scope, q) => {
          setSearch(false);
          const target = { pedidos: ["erp-orders", ""], clientes: ["erp-customers", "k_"], produtos: ["erp-inventory", "e_"], financeiro: ["fin-receivables", "r_"] }[scope.id] ?? ["erp-orders", ""];
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
