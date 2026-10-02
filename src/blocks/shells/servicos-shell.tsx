"use client";

import { CalendarDays, ClipboardList, FileSignature, FileText, Gauge, Plus, Receipt, Repeat, Search, Users, Wrench } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell, Badge, Button, DatePicker, EntityMark, ErrorState, IconButton, Modal, OperationButton, OperationFeedback, SearchPalette, Select, Sidebar, Skeleton, formatCurrency, useCommandShortcut, useOperation, type NavGroup, type NavItem, type SearchResult, type SearchScope } from "@g4ai/ds";
import { charges, chargeState, clientById, clients, company, contractStatus, contracts, invoiceStatus, invoices, iso, isOverdue, me, priorityInfo, quoteStatus, quoteTotals, quotes, slaOf, techById, technicians, visits, woStageLabel, workOrders, type WorkOrder } from "../data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do produto "Ponto ERP" (ERP de serviços para PME: manutenção predial
 * e TI gerenciada). Um produto, dois grupos na sidebar:
 *   Operação   → início, ordens de serviço, agenda, orçamentos, clientes
 *   Financeiro → contratos, faturamento (notas fiscais e cobranças)
 * Contador só no que pede ação: OS sem técnico, NFS-e rejeitadas, cobranças
 * vencidas. Registro (OS, cliente) passa a seção do pai.
 *
 * Celular: mobileNav="both". O ☰ dá acesso a tudo; a pílula traz as 4 telas
 * do dia a dia (Início, OS, Agenda, Cobranças).
 */

export type ServicosSection = "inicio" | "os" | "agenda" | "orcamentos" | "clientes" | "contratos" | "notas" | "cobrancas";

const unassigned = workOrders.filter((w) => w.stage === "aberta" && !w.techId).length;
const rejected = invoices.filter((n) => n.status === "rejeitada").length;
const overdue = charges.filter(isOverdue).length;

const items: Record<ServicosSection, NavItem> = {
  inicio: { href: frameHref("srv-dashboard"), label: "Início", icon: Gauge },
  os: { href: frameHref("srv-work-orders"), label: "Ordens de serviço", icon: Wrench, badge: unassigned },
  agenda: { href: frameHref("srv-schedule"), label: "Agenda dos técnicos", icon: CalendarDays },
  orcamentos: { href: frameHref("srv-quotes"), label: "Orçamentos", icon: FileSignature },
  clientes: { href: frameHref("srv-clients"), label: "Clientes", icon: Users },
  contratos: { href: frameHref("srv-contracts"), label: "Contratos", icon: Repeat },
  notas: { href: frameHref("srv-invoices"), label: "Notas fiscais (NFS-e)", icon: FileText, badge: rejected },
  cobrancas: { href: frameHref("srv-billing"), label: "Cobranças", icon: Receipt, badge: overdue },
};
const sub = (key: ServicosSection) => ({ href: items[key].href, label: items[key].label, badge: items[key].badge });

const groups: NavGroup[] = [
  { label: "Operação", items: [items.inicio, items.os, items.agenda, items.orcamentos, items.clientes] },
  { label: "Financeiro", items: [items.contratos, { label: "Faturamento", icon: Receipt, items: [sub("notas"), sub("cobrancas")] }] },
];
const short = (item: NavItem, label: string): NavItem => ({ ...item, label });
const tabs: NavItem[] = [items.inicio, short(items.os, "OS"), short(items.agenda, "Agenda"), items.cobrancas];

const scopes: SearchScope[] = [
  { id: "os", label: "Ordens de serviço", icon: <Wrench />, prefix: "#", noun: "OS" },
  { id: "clientes", label: "Clientes", icon: <Users />, prefix: "@", noun: "clientes" },
  { id: "comercial", label: "Orçamentos e contratos", icon: <FileSignature />, noun: "documentos" },
  { id: "financeiro", label: "Notas e cobranças", icon: <Receipt />, noun: "títulos" },
  { id: "acoes", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

const digits = (s: string) => s.replace(/\D/g, "");

const results: SearchResult[] = [
  ...workOrders.map<SearchResult>((w) => ({
    id: w.id,
    scope: "os",
    title: `${w.number} · ${w.title}`,
    subtitle: clientById(w.clientId).name,
    icon: <Wrench />,
    meta: <Badge tone={slaOf(w).tone}>{woStageLabel(w.stage)}</Badge>,
    keywords: [digits(w.number), w.site],
    preview: {
      title: w.number,
      subtitle: w.title,
      properties: [
        { label: "Cliente", value: clientById(w.clientId).name },
        { label: "Técnico", value: techById(w.techId)?.name ?? "Sem técnico" },
        { label: "Prioridade", value: priorityInfo[w.priority].label },
        { label: "SLA", value: slaOf(w).label },
      ],
    },
    onSelect: () => go("srv-work-order", w.id),
  })),
  ...clients.map<SearchResult>((k) => ({
    id: k.id,
    scope: "clientes",
    title: k.name,
    subtitle: `${k.cnpj} · ${k.district}`,
    icon: <EntityMark name={k.name} tint={k.tint} className="h-6 w-6 text-[10px]" />,
    keywords: [digits(k.cnpj), k.contact, k.segment],
    onSelect: () => go("srv-client", k.id),
  })),
  ...quotes.map<SearchResult>((q) => ({
    id: q.id,
    scope: "comercial",
    title: `${q.number} · ${q.title}`,
    subtitle: clientById(q.clientId).name,
    icon: <FileSignature />,
    meta: <Badge tone={quoteStatus[q.status].tone}>{quoteStatus[q.status].label}</Badge>,
    keywords: [digits(q.number)],
    preview: { title: q.number, subtitle: q.title, properties: [{ label: "Total", value: formatCurrency(quoteTotals(q).total) }, { label: "Situação", value: quoteStatus[q.status].label }] },
    onSelect: () => go("srv-quotes", q.id),
  })),
  ...contracts.map<SearchResult>((k) => ({
    id: k.id,
    scope: "comercial",
    title: `${k.number} · ${k.plan}`,
    subtitle: clientById(k.clientId).name,
    icon: <Repeat />,
    meta: <span className="text-[11.5px] tabular-nums text-muted">{formatCurrency(k.monthly)}/mês</span>,
    keywords: [digits(k.number), contractStatus[k.status].label],
    onSelect: () => go("srv-contracts", k.id),
  })),
  ...invoices.map<SearchResult>((n) => ({
    id: n.id,
    scope: "financeiro",
    title: n.number ? `NFS-e ${n.number}` : `${n.rps} · ${invoiceStatus[n.status].label}`,
    subtitle: clientById(n.clientId).name,
    icon: <FileText />,
    meta: <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge>,
    keywords: [n.origin.label, digits(n.rps)],
    onSelect: () => go("srv-invoices", n.id),
  })),
  ...charges.map<SearchResult>((b) => ({
    id: b.id,
    scope: "financeiro",
    title: `${b.number} · ${b.method}`,
    subtitle: `${clientById(b.clientId).name} · ${b.description}`,
    icon: <Receipt />,
    meta: <span className="text-[11.5px] tabular-nums">{formatCurrency(b.value)}</span>,
    keywords: [digits(b.number), chargeState(b).label],
    onSelect: () => go("srv-billing", b.id),
  })),
  { id: "a1", scope: "acoes", title: "Abrir ordem de serviço", icon: <Wrench />, keywords: ["nova os", "chamado"], onSelect: () => go("srv-work-orders", { nova: "1" }) },
  { id: "a2", scope: "acoes", title: "Criar orçamento", icon: <FileSignature />, keywords: ["proposta"], onSelect: () => go("srv-quotes", { novo: "1" }) },
  { id: "a3", scope: "acoes", title: "Emitir NFS-e pendentes", icon: <FileText />, onSelect: () => go("srv-invoices", { aba: "pendente" }) },
  { id: "a4", scope: "acoes", title: "Ver cobranças vencidas", icon: <Receipt />, onSelect: () => go("srv-billing", { aba: "vencidas" }) },
  { id: "a5", scope: "acoes", title: "Alocar OS sem técnico", icon: <CalendarDays />, onSelect: () => go("srv-schedule") },
];

export function ServicosShell({ section, children }: { section: ServicosSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
  const current = items[section].href;
  return (
    <AppShell
      product={company.product}
      workspace={company.short}
      mobileNav="both"
      tabs={tabs}
      currentPath={current}
      headerActions={
        <IconButton label="Buscar (⌘K)" onClick={() => setSearch(true)}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product={company.product}
          workspace={`${company.short} · Manutenção predial e TI`}
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={groups}
          storageKey="ponto-erp:sidebar"
          user={{ name: me.name, initials: me.initials, role: me.role }}
        />
      )}
    >
      {children}
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        scopes={scopes}
        items={results}
        placeholder="OS, cliente, CNPJ, orçamento, contrato, NFS-e ou ação…"
        recentItems={[results.find((r) => r.id === "w1")!, results.find((r) => r.id === "k2")!, results.find((r) => r.id === "n4")!]}
        onSelect={() => setSearch(false)}
        onCreate={() => {
          setSearch(false);
          go("srv-work-orders", { nova: "1" });
        }}
        createLabel={(q) => `Abrir OS “${q}”`}
      />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Estados de lista compartilhados (?estado=carregando|vazio|erro)      */
/* ------------------------------------------------------------------ */

export type ListState = "carregando" | "vazio" | "erro" | null;

/** Lê ?estado= para simular os cinco estados de uma lista. */
export function useListState(): ListState {
  const v = useFrameParam("estado");
  return v === "carregando" || v === "vazio" || v === "erro" ? v : null;
}

/** Carregando com a forma de uma tabela: cabeçalho gelo + linhas. */
export function LoadingTable({ rows = 6, label }: { rows?: number; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-busy="true" aria-label={label}>
      <div className="flex gap-4 border-b border-line bg-soft px-4 py-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <span className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </span>
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Erro de carregamento com saída (tentar de novo limpa o ?estado=). */
export function LoadError({ what }: { what: string }) {
  return <ErrorState size="md" title={`Não foi possível carregar ${what}`} description="O servidor do Ponto ERP não respondeu. Nada do que você fez foi perdido." onRetry={() => setFrameQuery({ estado: undefined })} />;
}

/** Botão secundário que leva à tela de alocação (usado em painel e quadro). */
export function ScheduleLink({ children }: { children: ReactNode }) {
  return (
    <Button variant="ghost" href={frameHref("srv-schedule")}>
      <ClipboardList /> {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Agendar OS: técnico, dia e horário (quadro, registro e agenda)       */
/* ------------------------------------------------------------------ */

const slots = ["07:30", "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
const durations = [1, 2, 3, 4, 8];
const plus = (start: string, h: number) => `${String(Number(start.slice(0, 2)) + h).padStart(2, "0")}${start.slice(2)}`;

export type ScheduleChoice = { techId: string; date: string; start: string; end: string };

/** Modal curto para agendar uma OS (decisão rápida, não é cadastro). */
export function ScheduleDialog({ wo, open, onClose, onConfirm, initial }: { wo: WorkOrder; open: boolean; onClose: () => void; onConfirm: (c: ScheduleChoice) => void; initial?: Partial<ScheduleChoice> }) {
  const [techId, setTechId] = useState(initial?.techId ?? wo.techId ?? "");
  const [date, setDate] = useState(initial?.date ?? wo.schedule?.date ?? iso(1));
  const [start, setStart] = useState(initial?.start ?? wo.schedule?.start ?? "08:00");
  const [hours, setHours] = useState("2");
  const op = useOperation({ busyLabel: "Agendando…" });
  const busyCount = (id: string) => workOrders.filter((w) => w.techId === id && w.schedule?.date === date).length + visits.filter((v) => v.techId === id && v.date === date).length;
  const tech = techById(techId);
  const confirm = () => {
    const choice = { techId, date, start, end: plus(start, Number(hours)) };
    void op.run(() => new Promise((r) => setTimeout(r, 500)), `${wo.number} agendada com ${tech?.name.split(" ")[0]} em ${date.split("-").reverse().slice(0, 2).join("/")} às ${start}`).then((err) => {
      if (err) return;
      onConfirm(choice);
      onClose();
    });
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Agendar ${wo.number}`}
      description={`${wo.title} · ${clientById(wo.clientId).name}. O técnico recebe a OS no app com endereço e checklist.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={op.busy}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={confirm} disabled={!techId} disabledReason="Escolha o técnico.">
            Agendar OS
          </OperationButton>
        </>
      }
    >
      <div className="space-y-4">
        <OperationFeedback operation={op} />
        <Select
          label="Técnico"
          value={techId}
          onValueChange={setTechId}
          placeholder="Escolha quem vai atender"
          options={technicians.map((t) => ({ value: t.id, label: t.name, description: `${t.skill} · ${t.status === "offline" ? "de folga" : `${busyCount(t.id)} atendimento(s) no dia`}`, disabled: t.status === "offline" }))}
        />
        <DatePicker label="Dia" value={date} onValueChange={setDate} min={iso(0)} businessDaysOnly />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Início" value={start} onValueChange={setStart} options={slots.map((v) => ({ value: v, label: v }))} />
          <Select label="Duração prevista" value={hours} onValueChange={setHours} options={durations.map((h) => ({ value: String(h), label: h === 8 ? "Dia inteiro" : `${h} h` }))} />
        </div>
      </div>
    </Modal>
  );
}
