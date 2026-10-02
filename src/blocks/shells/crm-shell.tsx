import { Briefcase, Building2, CalendarClock, FileText, Gauge, Inbox, KanbanSquare, Plus, Settings, Target, User, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppShell,
  Avatar,
  Badge,
  Button,
  Combobox,
  CurrencyField,
  EntityMark,
  FieldBlock,
  FieldGrid,
  Modal,
  Select,
  TextField,
  SearchPalette,
  Sidebar,
  formatCurrency,
  useCommandShortcut,
  type NavGroup,
  type SearchResult,
  type SearchScope,
} from "@g4ai/ds";
import { companies, companyById, contacts, deals, iso, leads, me, overdueCount, quoteStatus, quotes, repById, reps, stageById, stages, type Deal, type StageId } from "../data/crm";
import { frameHref, goTo } from "./frame-route";

/*
 * Casca do Acme CRM: a mesma sidebar, busca ⌘K e navegação móvel em todas as
 * telas do produto. `current` é o href do item ativo ("#/frame/crm-pipeline");
 * páginas de detalhe passam o item-pai (negócio → Pipeline).
 *
 * mobileNav="tabbar": vendedor usa o CRM no celular entre reuniões, sempre nas
 * mesmas 4 telas (Pipeline, Atividades, Empresas, Painel). Leads, Propostas,
 * Time e Configurações ficam em "Mais".
 *
 * Contadores só quando pedem ação: leads novos sem dono e atividades atrasadas.
 */

const newLeads = leads.filter((l) => l.status === "novo").length;

export const crmNav: NavGroup[] = [
  {
    label: "Vendas",
    items: [
      { href: "#/frame/crm-sales-dashboard", label: "Painel", icon: Gauge },
      { href: "#/frame/crm-leads", label: "Leads", icon: Inbox, badge: newLeads },
      { href: "#/frame/crm-pipeline", label: "Pipeline", icon: KanbanSquare },
      { href: "#/frame/crm-quotes", label: "Propostas", icon: FileText },
      { href: "#/frame/crm-contacts", label: "Empresas e contatos", icon: Building2 },
      { href: "#/frame/crm-activities", label: "Atividades", icon: CalendarClock, badge: overdueCount },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "#/frame/crm-team", label: "Time e metas", icon: Users },
      { href: "#/frame/crm-settings", label: "Configurações", icon: Settings },
    ],
  },
];
const [vendas] = crmNav;
const tabs = [vendas.items[2], vendas.items[5], { ...vendas.items[4], label: "Empresas" }, vendas.items[0]];

const scopes: SearchScope[] = [
  { id: "deals", label: "Negócios", icon: <Briefcase />, prefix: "#", noun: "negócios" },
  { id: "companies", label: "Empresas", icon: <Building2 />, noun: "empresas" },
  { id: "contacts", label: "Contatos", icon: <User />, prefix: "@", noun: "contatos" },
  { id: "quotes", label: "Propostas", icon: <FileText />, noun: "propostas" },
  { id: "actions", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

function useSearchItems(): SearchResult[] {
  return useMemo(() => {
    const d: SearchResult[] = deals.map((x) => {
      const c = companyById(x.companyId);
      return {
        id: x.id,
        scope: "deals",
        title: `${c.name} · ${x.title}`,
        subtitle: `${stageById(x.stage).label} · ${repById(x.owner).name}`,
        icon: <EntityMark name={c.name} tint={c.tint} className="h-6 w-6 text-[10px]" />,
        meta: formatCurrency(x.value, { compact: true }),
        href: `#/frame/crm-deal?id=${x.id}`,
        keywords: [c.domain, x.source],
        preview: {
          title: x.title,
          subtitle: c.name,
          badge: <Badge tone="accent">{stageById(x.stage).label}</Badge>,
          properties: [
            { label: "Valor", value: formatCurrency(x.value, { cents: false }) },
            { label: "Responsável", value: repById(x.owner).name },
            { label: "Origem", value: x.source },
            { label: "Dias na etapa", value: String(x.age) },
          ],
        },
      };
    });
    const c: SearchResult[] = companies.map((x) => ({
      id: x.id,
      scope: "companies",
      title: x.name,
      subtitle: `${x.industry} · ${x.city}`,
      icon: <EntityMark name={x.name} tint={x.tint} className="h-6 w-6 text-[10px]" />,
      meta: x.lifecycle,
      href: `#/frame/crm-company?id=${x.id}`,
      keywords: [x.domain, x.cnpj],
    }));
    const p: SearchResult[] = contacts.map((x) => ({
      id: x.id,
      scope: "contacts",
      title: x.name,
      subtitle: `${x.role} · ${companyById(x.companyId).name}`,
      icon: <Avatar initials={x.initials} tint={x.tint} size="sm" name={x.name} />,
      meta: x.tag,
      href: `#/frame/crm-contact?id=${x.id}`,
      keywords: [x.email, x.phone],
    }));
    const q: SearchResult[] = quotes.map((x) => ({
      id: x.id,
      scope: "quotes",
      title: `${x.number} · ${companyById(x.companyId).name}`,
      subtitle: deals.find((d) => d.id === x.dealId)?.title,
      icon: <FileText />,
      meta: quoteStatus[x.status].label,
      href: frameHref("crm-quotes", x.id),
    }));
    const a: SearchResult[] = [
      { id: "new-deal", scope: "actions", title: "Novo negócio", icon: <Plus />, href: "#/frame/crm-pipeline?novo=1", shortcut: ["N"] },
      { id: "new-quote", scope: "actions", title: "Nova proposta", icon: <FileText />, href: frameHref("crm-quotes", { novo: 1 }) },
      { id: "leads", scope: "actions", title: "Qualificar leads novos", icon: <Inbox />, href: frameHref("crm-leads") },
      { id: "new-task", scope: "actions", title: "Nova atividade", icon: <CalendarClock />, href: "#/frame/crm-activities?novo=1" },
      { id: "goals", scope: "actions", title: "Ver metas do time", icon: <Target />, href: "#/frame/crm-team" },
    ];
    return [...d, ...c, ...p, ...q, ...a];
  }, []);
}

export function CrmShell({ current, children, headerActions }: { current: string; children: ReactNode; headerActions?: ReactNode }) {
  const [search, setSearch] = useState(false);
  const items = useSearchItems();
  useCommandShortcut(() => setSearch(true));
  return (
    <AppShell
      product="Acme CRM"
      workspace="Time comercial · Sudeste"
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={current}
      headerActions={headerActions}
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Acme CRM"
          workspace="Time comercial · Sudeste"
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={crmNav}
          user={{ name: "Ana Lopes", initials: "AL", role: "Executiva de contas" }}
        />
      )}
    >
      {children}
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        scopes={scopes}
        items={items}
        placeholder="Buscar negócios, empresas, contatos ou ações…"
        recentItems={[items[0], items.find((i) => i.id === "c5")!, items.find((i) => i.id === "p1")!].filter(Boolean)}
        onSelect={(r, { newTab }) => {
          if (!newTab && r.href) location.hash = r.href.slice(1);
        }}
        onSeeAll={(scope, q) => {
          const target = scope.id === "deals" ? "crm-pipeline" : scope.id === "quotes" ? "crm-quotes" : "crm-contacts";
          location.href = `?q=${encodeURIComponent(q)}#/frame/${target}`;
        }}
        onCreate={(q) => {
          // Abre o formulário de novo negócio no pipeline já com o título digitado.
          setSearch(false);
          goTo(frameHref("crm-pipeline", { novo: 1, titulo: q }));
        }}
        createLabel={(q) => `Criar negócio “${q}”`}
      />
    </AppShell>
  );
}

/** Formulário de novo negócio (pipeline, página da empresa, ⌘K). */
export function NewDealModal({ open, onClose, onCreate, companyId, defaultTitle }: { open: boolean; onClose: () => void; onCreate: (deal: Deal) => void; companyId?: string; defaultTitle?: string }) {
  const [title, setTitle] = useState(defaultTitle ?? "");
  // Título vindo da busca ⌘K ("Criar negócio “…”"): preenche ao abrir.
  useEffect(() => {
    if (open && defaultTitle) setTitle(defaultTitle);
  }, [open, defaultTitle]);
  const [company, setCompany] = useState(companyId ?? "");
  const [value, setValue] = useState<number | null>(null);
  const [stage, setStage] = useState<StageId>("qualificacao");
  const [owner, setOwner] = useState(me);
  const [tried, setTried] = useState(false);
  const valid = title.trim() && company && value;
  const reset = () => {
    setTitle("");
    setCompany(companyId ?? "");
    setValue(null);
    setStage("qualificacao");
    setTried(false);
  };
  const submit = () => {
    setTried(true);
    if (!valid) return;
    onCreate({ id: `d${Date.now()}`, title: title.trim(), companyId: company, value: value!, stage, owner, age: 0, source: "Manual", created: iso(0), close: iso(30), contactIds: [] });
    reset();
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo negócio"
      description="Entra no pipeline na etapa escolhida. Dá para completar os detalhes depois."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar negócio</Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="O que está sendo vendido" placeholder="Ex.: Licenças anuais · 120 usuários" value={title} onChange={setTitle} error={tried && !title.trim() ? "Dê um nome ao negócio." : undefined} autoFocus />
        <FieldBlock label="Empresa" error={tried && !company ? "Escolha a empresa." : undefined}>
          <Combobox label="Empresa" options={companies.map((c) => ({ value: c.id, label: c.name, description: c.city }))} value={company} onValueChange={setCompany} placeholder="Buscar empresa…" />
        </FieldBlock>
        <FieldGrid>
          <CurrencyField label="Valor" value={value} onChange={setValue} error={tried && !value ? "Informe o valor." : undefined} />
          <FieldBlock label="Etapa">
            <Select label="Etapa" value={stage} onValueChange={(v) => setStage(v as StageId)} options={stages.map((s) => ({ value: s.id, label: s.label }))} />
          </FieldBlock>
        </FieldGrid>
        <FieldBlock label="Responsável">
          <Select label="Responsável" value={owner} onValueChange={setOwner} options={reps.map((r) => ({ value: r.id, label: r.name, description: r.role }))} />
        </FieldBlock>
      </div>
    </Modal>
  );
}
