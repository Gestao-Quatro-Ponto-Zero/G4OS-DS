"use client";

import { AtSign, BarChart3, CalendarDays, ClipboardCheck, Hash, Home, Megaphone, MessagesSquare, PenSquare, Search, Users, Vote } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  AppShell,
  Avatar,
  Badge,
  ErrorState,
  IconButton,
  NotificationCenter,
  SearchPalette,
  Sidebar,
  Skeleton,
  cn,
  formatNumber,
  formatPercent,
  useCommandShortcut,
  type NavItem,
  type SearchResult,
  type SearchScope,
} from "@g4ai/ds";
import { announcementStatus, announcements, areaLabel, chatChannels, cityById, eventMode, events, me, org, pendingForMe, people, readRate, surveys, weekdayShort, type Reaction } from "../data/comms";
import { frameHref, go, setFrameQuery, useFrameParam } from "./frame-route";

/*
 * Casca do Mural (comunicação interna da Vértice Logística). Toda tela do
 * produto usa esta casca: mesma sidebar, mesma busca ⌘K, mesmo sino.
 *
 * Celular: mobileNav="tabbar". A maior parte das pessoas (operação de CD) usa
 * o Mural só no celular, entre um turno e outro: Início, Conversas, Pessoas e
 * Eventos ficam na pílula; Pesquisas, Publicar e Alcance ficam em "Mais".
 *
 * Contadores só quando pedem ação: menções não lidas e pesquisas abertas que
 * a pessoa ainda não respondeu. Total de comunicados nunca vira contador.
 */

export type CommsSection = "inicio" | "conversas" | "pessoas" | "eventos" | "pesquisas" | "publicar" | "alcance";

const mentions = chatChannels.reduce((s, c) => s + c.mentions, 0);
const openSurveys = surveys.filter((s) => s.status === "aberta").length;
const awaitingApproval = announcements.filter((a) => a.status === "aprovacao").length;

export const commsItems: Record<CommsSection, NavItem> = {
  inicio: { href: frameHref("comms-home"), label: "Início", icon: Home },
  conversas: { href: frameHref("comms-channels"), label: "Conversas", icon: MessagesSquare, badge: mentions },
  pessoas: { href: frameHref("comms-people"), label: "Pessoas", icon: Users },
  eventos: { href: frameHref("comms-events"), label: "Eventos", icon: CalendarDays },
  pesquisas: { href: frameHref("comms-surveys"), label: "Pesquisas", icon: Vote, badge: openSurveys },
  publicar: { href: frameHref("comms-compose"), label: "Publicar comunicado", icon: PenSquare, badge: awaitingApproval },
  alcance: { href: frameHref("comms-analytics"), label: "Alcance", icon: BarChart3 },
};

const scopes: SearchScope[] = [
  { id: "comunicados", label: "Comunicados", icon: <Megaphone />, prefix: "!", noun: "comunicados" },
  { id: "pessoas", label: "Pessoas", icon: <Users />, prefix: "@", noun: "pessoas" },
  { id: "canais", label: "Canais", icon: <Hash />, prefix: "#", noun: "canais" },
  { id: "eventos", label: "Eventos", icon: <CalendarDays />, noun: "eventos" },
  { id: "acoes", label: "Ações", icon: <PenSquare />, prefix: ">", noun: "ações" },
];

const results: SearchResult[] = [
  ...announcements.map<SearchResult>((a) => ({
    id: a.id,
    scope: "comunicados",
    title: a.title,
    subtitle: `${a.category} · ${a.audience.label}`,
    icon: <Megaphone />,
    meta: a.status === "publicado" ? <span className="text-[11.5px] text-muted">{formatPercent(readRate(a), 0)} leram</span> : <Badge tone={announcementStatus[a.status].tone}>{announcementStatus[a.status].label}</Badge>,
    keywords: [a.category, a.summary],
    preview: {
      title: a.title,
      subtitle: a.summary,
      properties: [
        { label: "Público", value: a.audience.label },
        { label: "Alcance", value: a.status === "publicado" ? `${formatNumber(a.reads)} de ${formatNumber(a.audienceSize)}` : "—" },
        { label: "Leitura obrigatória", value: a.mandatory ? "Sim" : "Não" },
      ],
    },
    onSelect: () => (a.status === "publicado" ? go("comms-announcement", a.id) : go("comms-compose", { id: a.id })),
  })),
  ...people.map<SearchResult>((p) => ({
    id: `p-${p.id}`,
    scope: "pessoas",
    title: p.name,
    subtitle: `${p.role} · ${cityById(p.city).label}`,
    icon: <Avatar initials={p.initials} tint={p.tint} size="sm" status={p.status} />,
    keywords: [p.email, areaLabel(p.area), ...p.skills],
    preview: { title: p.name, subtitle: p.role, properties: [{ label: "Área", value: areaLabel(p.area) }, { label: "Cidade", value: cityById(p.city).place }, { label: "E-mail", value: p.email }, { label: "Ramal", value: p.phone }] },
    onSelect: () => go("comms-people", { pessoa: p.id }),
  })),
  ...chatChannels.map<SearchResult>((c) => ({
    id: `c-${c.id}`,
    scope: "canais",
    title: c.kind === "canal" ? `#${c.name}` : c.name,
    subtitle: c.kind === "canal" ? c.topic : "Mensagem direta",
    icon: c.kind === "canal" ? <Hash /> : <AtSign />,
    meta: c.kind === "canal" ? <span className="text-[11.5px] text-muted">{formatNumber(c.members)} pessoas</span> : undefined,
    onSelect: () => go("comms-channels", { canal: c.id }),
  })),
  ...events.map<SearchResult>((e) => ({
    id: `e-${e.id}`,
    scope: "eventos",
    title: e.title,
    subtitle: `${weekdayShort(e.date)} · ${e.start} · ${eventMode[e.mode]}${e.city ? ` · ${cityById(e.city).label}` : ""}`,
    icon: <CalendarDays />,
    onSelect: () => go("comms-events", { id: e.id }),
  })),
  { id: "x1", scope: "acoes", title: "Publicar comunicado", icon: <PenSquare />, keywords: ["novo", "criar", "aviso"], shortcut: ["N"], onSelect: () => go("comms-compose") },
  { id: "x2", scope: "acoes", title: "Criar pesquisa ou enquete", icon: <Vote />, keywords: ["enps", "clima", "votação"], onSelect: () => go("comms-surveys", { novo: 1 }) },
  { id: "x3", scope: "acoes", title: "Criar evento", icon: <CalendarDays />, keywords: ["agenda", "encontro"], onSelect: () => go("comms-events", { novo: 1 }) },
  { id: "x4", scope: "acoes", title: "Ver leituras obrigatórias pendentes", icon: <ClipboardCheck />, onSelect: () => go("comms-home") },
  { id: "x5", scope: "acoes", title: "Ver alcance dos comunicados", icon: <BarChart3 />, keywords: ["leitura", "relatório"], onSelect: () => go("comms-analytics") },
];

export function CommsShell({ section, children }: { section: CommsSection; children: ReactNode }) {
  const [search, setSearch] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  useCommandShortcut(() => setSearch(true));
  const current = commsItems[section].href;
  const notifications = [
    { id: "n1", title: "Beatriz Lacerda mencionou você em #comunicacao-interna", body: "“vamos segurar o do VA até sexta?”", time: "há 16 min", media: <Avatar initials="BL" name="Beatriz Lacerda" size="sm" />, href: frameHref("comms-channels", { canal: "comunicacao" }) },
    ...pendingForMe.map((a) => ({ id: `n-${a.id}`, title: "Leitura obrigatória pendente", body: a.title, time: `até ${weekdayShort(a.mandatory!.due)}`, media: <Megaphone className="h-4 w-4 text-muted" />, href: frameHref("comms-announcement", a.id) })),
    { id: "n3", title: "Comunicado aguardando sua aprovação", body: "Reajuste do vale-alimentação em 2027", time: "há 35 min", media: <ClipboardCheck className="h-4 w-4 text-muted" />, href: frameHref("comms-compose", { id: "a9" }) },
    { id: "n4", title: "Café com o CEO · Recife começa às 15h", body: "6 vagas restantes", time: "hoje", media: <CalendarDays className="h-4 w-4 text-muted" />, href: frameHref("comms-events", { id: "e1" }) },
  ].map((n) => ({ ...n, unread: !read.includes(n.id), onSelect: () => setRead((r) => [...r, n.id]) }));
  return (
    <AppShell
      product={org.product}
      workspace={org.name}
      mobileNav="tabbar"
      tabs={[commsItems.inicio, commsItems.conversas, commsItems.pessoas, commsItems.eventos]}
      currentPath={current}
      headerActions={
        <>
          <IconButton label="Buscar (⌘K)" onClick={() => setSearch(true)}>
            <Search />
          </IconButton>
          <NotificationCenter items={notifications} onMarkAllRead={() => setRead(notifications.map((n) => n.id))} />
        </>
      }
      sidebar={({ mobileOpen }) => (
        <Sidebar
          product={org.product}
          workspace={org.name}
          currentPath={current}
          mobileOpen={mobileOpen}
          onSearch={() => setSearch(true)}
          groups={[
            { label: "Mural", items: [commsItems.inicio, commsItems.conversas, commsItems.pessoas, commsItems.eventos, commsItems.pesquisas] },
            { label: "Comunicação interna", items: [commsItems.publicar, commsItems.alcance] },
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
        placeholder="Buscar comunicados, pessoas, canais ou eventos…"
        recentItems={[results.find((x) => x.id === "a1")!, results.find((x) => x.id === "p-beatriz")!, results.find((x) => x.id === "c-comunicacao")!]}
        onSelect={() => setSearch(false)}
        onSeeAll={(scope, q) => {
          setSearch(false);
          if (scope.id === "pessoas") location.href = `?p_q=${encodeURIComponent(q)}${frameHref("comms-people")}`;
          else if (scope.id === "eventos") go("comms-events");
          else go("comms-home");
        }}
        onCreate={(q) => {
          setSearch(false);
          go("comms-compose", { titulo: q });
        }}
        createLabel={(q) => `Publicar comunicado “${q}”`}
      />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Estados de lista (mesmo padrão em todas as telas do Mural)          */
/* ------------------------------------------------------------------ */

/**
 * No showcase, `?estado=carregando|vazio|erro` simula cada estado. No SEU app,
 * venha do hook de dados (isLoading, error, rows.length).
 */
export type ListState = "carregando" | "vazio" | "erro" | null;
export function useListState(): ListState {
  const v = useFrameParam("estado");
  return v === "carregando" || v === "vazio" || v === "erro" ? v : null;
}

/** Carregando com a forma final: linhas, cards de pessoa ou posts do feed. */
export function LoadingShape({ rows = 6, variant = "rows", label = "Carregando…" }: { rows?: number; variant?: "rows" | "cards" | "posts"; label?: string }) {
  if (variant === "cards")
    return (
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <span className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </span>
            </div>
            <Skeleton className="mt-4 h-6 w-40 rounded-full" />
          </li>
        ))}
      </ul>
    );
  if (variant === "posts")
    return (
      <ul className="m-0 list-none space-y-3 p-0" aria-busy="true" aria-label={label}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
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
          <Skeleton className="h-8 w-8 rounded-lg" />
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

/* ------------------------------------------------------------------ */
/* Peças do produto                                                    */
/* ------------------------------------------------------------------ */

/** Reações de um comunicado: emoji + contagem, com estado pressionado. */
export function ReactionRow({ reactions, onToggle, className }: { reactions: Reaction[]; onToggle: (emoji: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Reações">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          aria-pressed={!!r.mine}
          aria-label={`${r.label}: ${formatNumber(r.count)}${r.mine ? ", você reagiu" : ""}`}
          onClick={() => onToggle(r.emoji)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] tabular-nums transition-colors",
            r.mine ? "border-line-strong bg-soft font-medium text-ink" : "border-line bg-surface text-ink-soft hover:bg-soft",
          )}
        >
          <span aria-hidden>{r.emoji}</span>
          {formatNumber(r.count)}
        </button>
      ))}
    </div>
  );
}

/** Alterna a reação da pessoa (mantém a contagem coerente). */
export const toggleReaction = (list: Reaction[], emoji: string) => list.map((r) => (r.emoji === emoji ? { ...r, mine: !r.mine, count: r.count + (r.mine ? -1 : 1) } : r));
