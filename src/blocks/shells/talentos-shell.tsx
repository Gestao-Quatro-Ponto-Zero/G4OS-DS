"use client";

import { BarChart3, Briefcase, CalendarDays, FileSignature, Globe, Plus, Search, UserPlus, UserSearch } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AppShell, Avatar, Badge, IconButton, SearchPalette, Sidebar, notify, useCommandShortcut, type NavItem, type SearchResult, type SearchScope } from "@g4os/ds";
import { candidates, interviews, jobs, me, offers, stageLabel } from "../data/ats";
import { frameHref, go } from "./frame-route";

/*
 * Casca do produto "Talentos" (ATS). Toda tela do produto usa esta casca:
 * mesma sidebar, mesma busca ⌘K, mesma navegação no celular.
 *
 * Celular: mobileNav="tabbar". Quem recruta vive no celular entre uma
 * entrevista e outra: Painel, Vagas, Candidatos e Entrevistas ficam na pílula;
 * Propostas e Página de carreiras ficam em "Mais".
 */

export type TalentosSection = "painel" | "vagas" | "candidatos" | "entrevistas" | "propostas" | "carreiras";

const pendingFeedback = interviews.filter((i) => i.feedback === "pendente").length;
const pendingOffers = offers.filter((o) => o.status === "aprovacao").length;

const items: Record<TalentosSection, NavItem> = {
  painel: { href: frameHref("ats-dashboard"), label: "Painel", icon: BarChart3 },
  vagas: { href: frameHref("ats-jobs"), label: "Vagas", icon: Briefcase },
  candidatos: { href: frameHref("ats-candidates"), label: "Candidatos", icon: UserSearch },
  entrevistas: { href: frameHref("ats-interviews"), label: "Entrevistas", icon: CalendarDays, badge: pendingFeedback },
  propostas: { href: frameHref("ats-offers"), label: "Propostas", icon: FileSignature, badge: pendingOffers },
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
            { label: "Recrutamento", items: [items.painel, items.vagas, items.candidatos, items.entrevistas, items.propostas] },
            { label: "Divulgação", items: [items.carreiras] },
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
          notify(`Candidato “${q}” adicionado ao banco de talentos`);
        }}
        createLabel={(q) => `Adicionar “${q}” como candidato`}
      />
    </AppShell>
  );
}
