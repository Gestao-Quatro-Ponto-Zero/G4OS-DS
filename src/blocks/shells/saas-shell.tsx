import { BarChart3, CreditCard, FileText, Gauge, Home, Layers, LifeBuoy, Plug, Plus, Receipt, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  AppShell,
  Badge,
  EntityMark,
  ErrorState,
  Skeleton,
  SearchPalette,
  Sidebar,
  formatCurrency,
  useCommandShortcut,
  type NavGroup,
  type SearchResult,
  type SearchScope,
} from "@g4ai/ds";
import { frameHref, goTo, setFrameQuery, useFrameParam } from "./frame-route";
import { customerById, customers, failingCount, healthLabel, healthTone, invoiceLabel, invoices, ticketLabel, tickets, urgentOpen } from "../data/saas";

/*
 * Casca do Pulso (SaaS de analytics). `current` = href do item ativo; páginas
 * de detalhe passam o item-pai (conta → Clientes).
 *
 * mobileNav="both": é um back-office com 7 seções, usado sobretudo no desktop.
 * No celular, a pílula leva às 4 telas de plantão (visão geral, clientes,
 * cobrança, suporte) e o ☰ dá acesso ao resto.
 */

export const saasNav: NavGroup[] = [
  {
    label: "Produto",
    items: [
      { href: "#/frame/saas-dashboard", label: "Visão geral", icon: Home },
      { href: "#/frame/saas-analytics", label: "Análises", icon: BarChart3 },
      { href: "#/frame/saas-customers", label: "Clientes", icon: Users },
      { href: "#/frame/saas-usage", label: "Uso e limites", icon: Gauge },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "#/frame/saas-billing", label: "Cobrança", icon: CreditCard, badge: failingCount },
      { href: "#/frame/saas-plans", label: "Planos e preços", icon: Layers },
      { href: "#/frame/saas-support", label: "Suporte", icon: LifeBuoy, badge: urgentOpen },
      { href: "#/frame/saas-reports", label: "Relatórios", icon: FileText },
      { href: "#/frame/saas-integrations", label: "Integrações", icon: Plug },
    ],
  },
];
const navItems = saasNav.flatMap((g) => g.items);
const tabs = ["saas-dashboard", "saas-customers", "saas-billing", "saas-support"].map((slug) => navItems.find((i) => i.href === `#/frame/${slug}`)!);

const scopes: SearchScope[] = [
  { id: "customers", label: "Clientes", icon: <Users />, prefix: "@", noun: "clientes" },
  { id: "invoices", label: "Faturas", icon: <Receipt />, prefix: "#", noun: "faturas" },
  { id: "tickets", label: "Chamados", icon: <LifeBuoy />, noun: "chamados" },
  { id: "actions", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

export function SaasShell({ current, children, headerActions }: { current: string; children: ReactNode; headerActions?: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
  const items = useMemo<SearchResult[]>(
    () => [
      ...customers.map((c) => ({
        id: `c${c.id}`,
        scope: "customers",
        title: c.name,
        subtitle: `${c.plan} · ${c.segment} · ${c.city}`,
        icon: <EntityMark name={c.name} tint={c.tint} className="h-6 w-6 text-[10px]" />,
        meta: formatCurrency(c.mrr, { compact: true }),
        href: `#/frame/saas-customer?id=${c.id}`,
        keywords: [c.contact, c.email, c.cnpj],
        preview: {
          title: c.name,
          subtitle: `${c.segment} · ${c.city}`,
          badge: <Badge tone={healthTone[c.health]}>{healthLabel[c.health]}</Badge>,
          properties: [
            { label: "Plano", value: c.plan },
            { label: "MRR", value: formatCurrency(c.mrr, { cents: false }) },
            { label: "Usuários", value: String(c.seats) },
            { label: "Uso (30 dias)", value: `${c.usage}%` },
          ],
        },
      })),
      ...invoices
        .filter((i) => i.status !== "paga")
        .map((i) => ({ id: i.id, scope: "invoices", title: `${i.number} · ${customerById(i.customerId).name}`, subtitle: invoiceLabel[i.status], meta: formatCurrency(i.amount, { compact: true }), href: `#/frame/saas-billing?id=${i.id}` })),
      ...tickets.map((t) => ({ id: t.id, scope: "tickets", title: t.subject, subtitle: `${t.id} · ${customerById(t.customerId).name}`, meta: ticketLabel[t.status], href: `#/frame/saas-support?id=${t.id}` })),
      { id: "new-report", scope: "actions", title: "Novo relatório", icon: <FileText />, href: "#/frame/saas-reports?novo=1" },
      { id: "connect", scope: "actions", title: "Conectar integração", icon: <Plug />, href: "#/frame/saas-integrations" },
      { id: "plans", scope: "actions", title: "Editar planos e preços", icon: <Layers />, href: "#/frame/saas-plans" },
      { id: "limits", scope: "actions", title: "Ver contas perto do limite", icon: <Gauge />, href: "#/frame/saas-usage" },
    ],
    [],
  );
  return (
    <AppShell
      product="Pulso"
      workspace="Pulso Analytics"
      mobileNav="both"
      tabs={tabs}
      currentPath={current}
      headerActions={headerActions}
      sidebar={({ mobileOpen }) => (
        <Sidebar product="Pulso" workspace="Pulso Analytics · Produção" currentPath={current} mobileOpen={mobileOpen} onSearch={() => setSearch(true)} groups={saasNav} user={{ name: "Marina Couto", initials: "MC", role: "Head de Produto" }} />
      )}
    >
      {children}
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        scopes={scopes}
        items={items}
        placeholder="Buscar clientes, faturas, chamados ou ações…"
        recentItems={[items[0], items[5]]}
        onSelect={(r, { newTab }) => {
          if (!newTab && r.href) location.hash = r.href.slice(1);
        }}
        onSeeAll={(scope, q) => {
          const target = scope.id === "invoices" ? "saas-billing" : scope.id === "tickets" ? "saas-support" : "saas-customers";
          goTo(frameHref(target, { q }));
        }}
      />
    </AppShell>
  );
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

/** Esqueleto de lista com a forma da tabela (avatar + duas linhas + valores). */
export function ListSkeleton({ rows = 6, label = "Carregando lista" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex gap-4 border-b border-line bg-soft/60 px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="hidden h-3 w-16 sm:block" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Erro ao carregar a lista, com saída (tentar de novo limpa o estado simulado). */
export function ListError({ noun }: { noun: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <ErrorState
        title={`Não foi possível carregar ${noun}`}
        description="A conexão com o servidor falhou. Nada foi perdido; tente de novo em instantes."
        onRetry={() => setFrameQuery({ estado: undefined })}
        details="GET /api/v1 · 503 Service Unavailable · req_8f2c41"
      />
    </div>
  );
}
