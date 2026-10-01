import { BarChart3, CreditCard, FileText, Home, LifeBuoy, Plug, Plus, Receipt, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  AppShell,
  Badge,
  EntityMark,
  SearchPalette,
  Sidebar,
  formatCurrency,
  useCommandShortcut,
  type NavGroup,
  type SearchResult,
  type SearchScope,
} from "@g4os/ds";
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
      { href: "#/frame/saas-billing", label: "Cobrança", icon: CreditCard, badge: failingCount },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "#/frame/saas-support", label: "Suporte", icon: LifeBuoy, badge: urgentOpen },
      { href: "#/frame/saas-reports", label: "Relatórios", icon: FileText },
      { href: "#/frame/saas-integrations", label: "Integrações", icon: Plug },
    ],
  },
];
const [produto, operacao] = saasNav;
const tabs = [produto.items[0], produto.items[2], produto.items[3], operacao.items[0]];

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
          location.href = `?q=${encodeURIComponent(q)}#/frame/${target}`;
        }}
      />
    </AppShell>
  );
}
