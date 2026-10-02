"use client";

import { BarChart3, Briefcase, CalendarDays, ClipboardCheck, ClipboardList, FileSignature, Globe, LineChart, Plus, Search, UserPlus, UserSearch } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell, Avatar, Badge, ErrorState, IconButton, SearchPalette, Sidebar, Skeleton, useCommandShortcut, type NavItem, type SearchResult, type SearchScope } from "@g4ai/ds";
import { admissions, candidates, interviews, jobs, me, offers, requisitionsAwaitingMe, stageLabel } from "../data/ats";
import { frameHref, go, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do produto "Talentos" (ATS). Toda tela do produto usa esta casca:
 * mesma sidebar, mesma busca ⌘K, mesma navegação no celular.
 *
 * Celular: mobileNav="tabbar". Quem recruta vive no celular entre uma
 * entrevista e outra: Painel, Vagas, Candidatos e Entrevistas ficam na pílula;
 * Requisições, Propostas, Admissões, Relatórios e Página de carreiras ficam
 * em "Mais".
 */

export type TalentosSection = "painel" | "vagas" | "requisicoes" | "candidatos" | "entrevistas" | "propostas" | "admissoes" | "relatorios" | "carreiras";

const pendingFeedback = interviews.filter((i) => i.feedback === "pendente").length;
const pendingOffers = offers.filter((o) => o.status === "aprovacao").length;
const openAdmissions = admissions.filter((a) => a.status === "andamento" && a.items.some((i) => !i.done)).length;

const items: Record<TalentosSection, NavItem> = {
  painel: { href: frameHref("ats-dashboard"), label: "Painel", icon: BarChart3 },
  vagas: { href: frameHref("ats-jobs"), label: "Vagas", icon: Briefcase },
  requisicoes: { href: frameHref("ats-requisitions"), label: "Requisições", icon: ClipboardList, badge: requisitionsAwaitingMe },
  candidatos: { href: frameHref("ats-candidates"), label: "Candidatos", icon: UserSearch },
  entrevistas: { href: frameHref("ats-interviews"), label: "Entrevistas", icon: CalendarDays, badge: pendingFeedback },
  propostas: { href: frameHref("ats-offers"), label: "Propostas", icon: FileSignature, badge: pendingOffers },
  admissoes: { href: frameHref("ats-admission"), label: "Admissões", icon: ClipboardCheck, badge: openAdmissions },
  relatorios: { href: frameHref("ats-reports"), label: "Relatórios", icon: LineChart },
  carreiras: { href: frameHref("ats-careers"), label: "Página de carreiras", icon: Globe },
};

const scopes: SearchScope[] = [
  { id: "vagas", label: "Vagas", icon: <Briefcase />, prefix: "#", noun: "vagas" },
  { id: "candidatos", label: "Candidatos", icon: <UserSearch />, prefix: "@", noun: "candidatos" },
  { id: "acoes", label: "Ações", icon: <Plus />, prefix: ">", noun: "ações" },
];

const results: SearchResult[] = [
  ...jobs.map<SearchResult>((j) => ({
    id: j.id,
    scope: "vagas",
    title: j.title,
    subtitle: `${j.area} · ${j.location}`,
    icon: <Briefcase />,
    meta: j.status === "aberta" ? undefined : <Badge>{j.status === "pausada" ? "Pausada" : "Encerrada"}</Badge>,
    keywords: [j.area, j.level, j.short],
    preview: { title: j.title, subtitle: j.summary, properties: [{ label: "Área", value: j.area }, { label: "Local", value: `${j.location} · ${j.mode}` }, { label: "Vagas", value: j.openings }] },
    onSelect: () => go("ats-job", j.id),
  })),
  ...candidates.map<SearchResult>((c) => ({
    id: c.id,
    scope: "candidatos",
    title: c.name,
    subtitle: c.headline,
    icon: <Avatar initials={c.initials} tint={c.tint} size="sm" />,
    meta: <span className="text-[11.5px] text-muted">{c.status === "ativo" ? stageLabel(c.stage) : c.status === "banco" ? "Banco de talentos" : c.status === "contratado" ? "Contratado(a)" : "Reprovado(a)"}</span>,
    keywords: [c.email, c.city, ...c.skills],
    preview: { title: c.name, subtitle: c.headline, properties: [{ label: "Vaga", value: jobs.find((j) => j.id === c.jobId)?.short }, { label: "Etapa", value: stageLabel(c.stage) }, { label: "Origem", value: c.source }, { label: "Cidade", value: c.city }] },
    onSelect: () => go("ats-candidate", c.id),
  })),
  { id: "a1", scope: "acoes", title: "Abrir vaga", icon: <Plus />, keywords: ["nova vaga", "criar"], onSelect: () => go("ats-job", { id: "nova" }) },
  { id: "a2", scope: "acoes", title: "Adicionar candidato", icon: <UserPlus />, keywords: ["novo candidato", "cadastrar"], onSelect: () => go("ats-candidates", { novo: 1 }) },
  { id: "a3", scope: "acoes", title: "Ver entrevistas de hoje", icon: <CalendarDays />, onSelect: () => go("ats-interviews") },
  { id: "a4", scope: "acoes", title: "Propostas aguardando aprovação", icon: <FileSignature />, onSelect: () => go("ats-offers") },
  { id: "a5", scope: "acoes", title: "Aprovar requisições de vaga", icon: <ClipboardList />, keywords: ["requisição", "aprovação", "headcount"], onSelect: () => go("ats-requisitions") },
  { id: "a6", scope: "acoes", title: "Agendar entrevista", icon: <CalendarDays />, keywords: ["marcar", "entrevista"], onSelect: () => go("ats-interviews", { agendar: 1 }) },
  { id: "a7", scope: "acoes", title: "Acompanhar admissões", icon: <ClipboardCheck />, keywords: ["onboarding", "documentos", "contratados"], onSelect: () => go("ats-admission") },
  { id: "a8", scope: "acoes", title: "Ver relatórios de recrutamento", icon: <LineChart />, keywords: ["funil", "tempo para contratar", "origem"], onSelect: () => go("ats-reports") },
];

export function TalentosShell({ section, children }: { section: TalentosSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  useCommandShortcut(() => setSearch(true));
  const current = items[section].href;
  return (
    <AppShell
      product="Talentos"
      workspace="Recrutamento · Nexo S.A."
      mobileNav="tabbar"
      tabs={[items.painel, items.vagas, items.candidatos, items.entrevistas]}
      currentPath={current}
      headerActions={
        <IconButton label="Buscar (⌘K)" onClick={() => setSearch(true)}>
          <Search />
        </IconButton>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product="Talentos"
          workspace="Recrutamento · Nexo S.A."
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={[
            { label: "Recrutamento", items: [items.painel, items.vagas, items.requisicoes, items.candidatos, items.entrevistas, items.propostas, items.admissoes] },
            { label: "Gestão", items: [items.relatorios, items.carreiras] },
          ]}
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
        placeholder="Buscar vagas, candidatos ou ações…"
        recentItems={[results.find((r) => r.id === "c1")!, results.find((r) => r.id === "j1")!, results.find((r) => r.id === "a1")!]}
        onSelect={() => setSearch(false)}
        onSeeAll={(scope, q) => {
          setSearch(false);
          // leva à lista já filtrada (a busca vai na URL da lista)
          if (scope.id === "vagas") location.href = `?v_q=${encodeURIComponent(q)}${frameHref("ats-jobs")}`;
          else location.href = `?c_q=${encodeURIComponent(q)}${frameHref("ats-candidates")}`;
        }}
        onCreate={(q) => {
          setSearch(false);
          // abre o cadastro de verdade, já com o nome digitado
          go("ats-candidates", { novo: 1, nome: q });
        }}
        createLabel={(q) => `Adicionar “${q}” como candidato`}
      />
    </AppShell>
  );
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

/** Carregando com a forma final: linhas de tabela/lista ou cards. */
export function LoadingRows({ rows = 6, variant = "rows", label = "Carregando…" }: { rows?: number; variant?: "rows" | "cards"; label?: string }) {
  if (variant === "cards")
    return (
      <ul className="m-0 list-none space-y-2 p-0" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <span className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </span>
            <Skeleton className="h-5 w-16 rounded-full" />
          </li>
        ))}
      </ul>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface" aria-busy="true" aria-label={label}>
      <div className="flex gap-4 border-b border-line bg-soft px-4 py-2.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
          <Skeleton className="h-8 w-8 rounded-full" />
          <span className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </span>
          <Skeleton className="hidden h-3 w-20 sm:block" />
          <Skeleton className="h-3 w-14" />
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
