"use client";

import { BookOpenText, Building2, CalendarClock, FilePlus2, FileSignature, FileText, Gauge, Plus, RefreshCw, Search, Stamp } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  AppShell,
  Badge,
  EntityMark,
  ErrorState,
  IconButton,
  SearchPalette,
  Sidebar,
  Skeleton,
  formatCurrency,
  formatDate,
  useCommandShortcut,
  type NavGroup,
  type NavItem,
  type SearchResult,
  type SearchScope,
} from "@g4ai/ds";
import {
  approvals,
  awaitingMe,
  contractStatus,
  contractTypes,
  contracts,
  counterparties,
  counterpartyById,
  daysToEnd,
  diligenceOf,
  isActive,
  isLate,
  me,
  obligations,
  templates,
  type Contract,
} from "../data/contracts";
import { frameHref, go, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do "Pacto", a gestão de contratos (CLM) do Jurídico e de Suprimentos
 * da Vereda Alimentos. Toda tela do produto usa esta casca: mesma sidebar,
 * mesma busca ⌘K, mesma navegação no celular.
 *
 * Contadores só quando pedem ação: aprovações esperando você, obrigações
 * atrasadas e contrapartes com certidão vencida e contrato vigente.
 *
 * Celular: mobileNav="tabbar". Quem aprova e cobra prazos faz isso no
 * celular: Painel, Contratos, Aprovações e Obrigações ficam na pílula;
 * Contrapartes e Modelos ficam em "Mais".
 */

export type ClmSection = "painel" | "contratos" | "aprovacoes" | "obrigacoes" | "contrapartes" | "modelos";

const pendingMine = approvals.filter(awaitingMe).length;
const lateObligations = obligations.filter(isLate).length;
const flaggedParties = counterparties.filter((k) => diligenceOf(k).tone === "bad" && contracts.some((c) => c.counterpartyId === k.id && isActive(c))).length;

const items: Record<ClmSection, NavItem> = {
  painel: { href: frameHref("clm-dashboard"), label: "Painel", icon: Gauge },
  contratos: { href: frameHref("clm-contracts"), label: "Contratos", icon: FileText },
  aprovacoes: { href: frameHref("clm-approvals"), label: "Aprovações", icon: Stamp, badge: pendingMine },
  obrigacoes: { href: frameHref("clm-obligations"), label: "Obrigações e prazos", icon: CalendarClock, badge: lateObligations },
  contrapartes: { href: frameHref("clm-counterparties"), label: "Contrapartes", icon: Building2, badge: flaggedParties },
  modelos: { href: frameHref("clm-templates"), label: "Modelos e cláusulas", icon: BookOpenText },
};

const groups: NavGroup[] = [
  { label: "Contratos", items: [items.painel, items.contratos, items.aprovacoes, items.obrigacoes] },
  { label: "Cadastros", items: [items.contrapartes, items.modelos] },
];
const tabs: NavItem[] = [items.painel, items.contratos, items.aprovacoes, { ...items.obrigacoes, label: "Prazos" }];

const scopes: SearchScope[] = [
  { id: "contratos", label: "Contratos", icon: <FileText />, prefix: "#", noun: "contratos" },
  { id: "contrapartes", label: "Contrapartes", icon: <Building2 />, prefix: "@", noun: "contrapartes" },
  { id: "modelos", label: "Modelos", icon: <BookOpenText />, noun: "modelos" },
  { id: "acoes", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

const results: SearchResult[] = [
  ...contracts.map<SearchResult>((c) => {
    const k = counterpartyById(c.counterpartyId);
    return {
      id: c.id,
      scope: "contratos",
      title: `${c.number} · ${c.title}`,
      subtitle: `${k.short} · ${contractTypes[c.type].short}`,
      icon: <FileSignature />,
      meta: <Badge tone={contractStatus[c.status].tone}>{contractStatus[c.status].label}</Badge>,
      keywords: [k.name, k.taxId.replace(/\D/g, ""), c.number.replace(/\D/g, "")],
      preview: {
        title: c.title,
        subtitle: `${c.number} · ${k.name}`,
        badge: <Badge tone={contractStatus[c.status].tone}>{contractStatus[c.status].label}</Badge>,
        properties: [
          { label: "Valor", value: c.value ? formatCurrency(c.value, { cents: false }) : "Sem valor" },
          { label: "Vigência", value: `${formatDate(c.start)} a ${formatDate(c.end)}` },
          { label: "Tipo", value: contractTypes[c.type].label },
        ],
      },
      onSelect: () => go("clm-contract", c.id),
    };
  }),
  ...counterparties.map<SearchResult>((k) => ({
    id: k.id,
    scope: "contrapartes",
    title: k.name,
    subtitle: `${k.taxLabel} ${k.taxId} · ${k.place}`,
    icon: <EntityMark name={k.short} tint={k.tint} className="h-6 w-6 text-[10px]" />,
    meta: <Badge tone={diligenceOf(k).tone}>{diligenceOf(k).label}</Badge>,
    keywords: [k.taxId.replace(/\D/g, ""), k.short, k.segment],
    onSelect: () => go("clm-counterparties", k.id),
  })),
  ...templates.map<SearchResult>((t) => ({ id: t.id, scope: "modelos", title: t.name, subtitle: `Versão ${t.version} · ${t.uses} contratos em 12 meses`, icon: <BookOpenText />, onSelect: () => go("clm-templates", { modelo: t.id }) })),
  { id: "x1", scope: "acoes", title: "Nova solicitação de contrato", icon: <FilePlus2 />, shortcut: ["N"], keywords: ["criar contrato", "pedir contrato", "minuta"], onSelect: () => go("clm-request") },
  { id: "x2", scope: "acoes", title: "Aprovar contratos esperando você", icon: <Stamp />, onSelect: () => go("clm-approvals") },
  { id: "x3", scope: "acoes", title: "Ver obrigações atrasadas", icon: <CalendarClock />, onSelect: () => go("clm-obligations", { filtro: "atrasadas" }) },
  { id: "x4", scope: "acoes", title: "Renovações automáticas a decidir", icon: <RefreshCw />, onSelect: () => go("clm-contracts", { visao: "renovacao" }) },
];

export function ClmShell({ section, children }: { section: ClmSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
  return (
    <AppShell
      product="Pacto"
      workspace="Vereda Alimentos · Jurídico"
      mobileNav="tabbar"
      tabs={tabs}
      currentPath={items[section].href}
      headerActions={
        <IconButton label="Buscar (⌘K)" onClick={() => setSearch(true)}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Pacto"
          workspace="Vereda Alimentos · Jurídico"
          currentPath={items[section].href}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={groups}
          storageKey="pacto-clm:sidebar"
          user={{ name: me.name, initials: me.initials, role: `${me.role} · ${me.area}` }}
        />
      )}
    >
      {children}
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        scopes={scopes}
        items={results}
        placeholder="Contrato, contraparte, CNPJ, modelo ou ação…"
        recentItems={[results.find((r) => r.id === "c1")!, results.find((r) => r.id === "c3")!, results.find((r) => r.id === "k5")!]}
        onSelect={() => setSearch(false)}
        onSeeAll={(scope, q) => {
          setSearch(false);
          const target = scope.id === "contrapartes" ? "clm-counterparties" : scope.id === "modelos" ? "clm-templates" : "clm-contracts";
          const prefix = scope.id === "contrapartes" ? "k_" : scope.id === "modelos" ? "m_" : "c_";
          location.href = `?${prefix}q=${encodeURIComponent(q)}${frameHref(target)}`;
        }}
        onCreate={(q) => {
          setSearch(false);
          go("clm-request", { objeto: q });
        }}
        createLabel={(q) => `Solicitar contrato “${q}”`}
      />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Peças compartilhadas pelas telas do Pacto                           */
/* ------------------------------------------------------------------ */

/** Situação do contrato: ponto + palavra. */
export function ContractStatusBadge({ contract }: { contract: Contract }) {
  const s = contractStatus[contract.status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** "Vence em 12 dias" com tom só quando pede atenção (≤ 30 dias ou vencido). */
export function EndsIn({ contract, className }: { contract: Contract; className?: string }) {
  const d = daysToEnd(contract);
  if (contract.status === "encerrado") return <span className={className ?? "text-muted"}>Encerrado</span>;
  if (!isActive(contract) && contract.status !== "vencido") return <span className={className ?? "text-muted"}>Começa em {formatDate(contract.start, { short: true })}</span>;
  if (d < 0) return <span className={className ?? "text-rose"}>Venceu há {-d} {-d === 1 ? "dia" : "dias"}</span>;
  if (d <= 30) return <span className={className ?? "font-medium text-rose"}>Vence em {d} {d === 1 ? "dia" : "dias"}</span>;
  if (d <= 90) return <span className={className ?? "text-amber"}>Vence em {d} dias</span>;
  return <span className={className ?? "text-muted"}>Até {formatDate(contract.end, { short: true })}</span>;
}

/*
 * Estados de lista do produto. No showcase, `?estado=carregando|vazio|erro`
 * simula cada um (no SEU app, venha do hook de dados: isLoading, error, rows.length).
 */
export type ListState = "carregando" | "vazio" | "erro" | null;
export function useListState(): ListState {
  const v = useFrameParam("estado");
  return v === "carregando" || v === "vazio" || v === "erro" ? v : null;
}

/** Carregando com a forma final: linhas de tabela ou cards. */
export function LoadingRows({ rows = 6, variant = "rows", label = "Carregando…" }: { rows?: number; variant?: "rows" | "cards"; label?: string }) {
  if (variant === "cards")
    return (
      <ul className="m-0 list-none space-y-2 p-0" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <span className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </span>
            <Skeleton className="h-5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-busy="true" aria-label={label}>
      <div className="flex gap-4 border-b border-line bg-soft px-4 py-2.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <span className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </span>
          <Skeleton className="hidden h-3 w-24 sm:block" />
          <Skeleton className="hidden h-3 w-20 md:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Erro ao carregar uma lista, com saída (tentar de novo). */
export function LoadError({ what }: { what: string }) {
  return (
    <ErrorState
      size="md"
      title={`Não foi possível carregar ${what}`}
      description="A conexão com o servidor falhou. Nada do que você fez foi perdido."
      onRetry={() => setFrameQuery({ estado: undefined })}
    />
  );
}
