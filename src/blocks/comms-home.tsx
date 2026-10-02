import { CalendarDays, Cake, CheckCircle2, Eye, MessageCircle, Pin, PenSquare, PartyPopper, Vote } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Empty,
  ErrorState,
  ListPanel,
  ListRow,
  Meter,
  Page,
  PageHeading,
  Skeleton,
  Tabs,
  cn,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelative,
  notify,
  plural,
} from "@g4ai/ds";
import { areaLabel, birthdays, cityById, eventMode, events, firstName, homePoll, iso, me, newHires, now, pendingForMe, personById, published, readRate, weekdayShort, type Announcement } from "./data/comms";
import { frameHref, go, setFrameQuery } from "./shells/frame-route";
import { CommsShell, LoadingShape, ReactionRow, toggleReaction, useListState } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · início",
  description: "Início da intranet: leituras obrigatórias pendentes, comunicados fixados, feed com reações e leitura, eventos da semana, enquete aberta, aniversariantes e quem chegou.",
  category: "Comunicação",
  order: 1,
  height: 1250,
  concept: {
    goal: "Em um minuto, saber o que a empresa precisa que eu leia, o que mudou e o que está acontecendo com as pessoas.",
    patterns: [
      "Anatomia B · Painel de leitura: cabeçalho fixo; “Precisa de você” (leitura obrigatória) antes do feed",
      "Fixados no topo; feed de comunicados com autor, público, reações e quantas pessoas leram",
      "Coluna lateral com o que é da semana: eventos, enquete aberta, aniversários e novos colegas",
      "Cinco estados: ?estado=carregando (forma final da página), erro (com saída) e vazio (feed sem comunicados); aba Não lidos vazia oferece Ver todos",
    ],
    adapt: [
      "Portal do franqueado (comunicados da franqueadora), portal do parceiro, intranet de escola",
    ],
    avoid: [
      "Feed sem distinguir oficial (comunicado) de conversa (canal)",
      "Contador de total de comunicados na navegação: só o que pede ação",
    ],
  },
} as const;

const weekEvents = events.filter((e) => e.date >= iso(0) && e.date <= iso(6)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

function PostCard({ a, onReact }: { a: Announcement; onReact: (emoji: string) => void }) {
  const author = personById(a.authorId);
  const href = frameHref("comms-announcement", a.id);
  return (
    <article className="rounded-xl border border-line bg-surface p-4 sm:p-5" aria-labelledby={`post-${a.id}`}>
      <header className="flex items-center gap-3">
        <Avatar initials={author.initials} tint={author.tint} name={author.name} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="m-0 truncate text-[13px] font-medium">{author.name}</p>
          <p className="m-0 truncate text-[12px] text-muted">
            {formatRelative(a.publishedAt, now)} · para {a.audience.label}
          </p>
        </div>
        {!a.readByMe && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-info">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-info" /> Não lido
          </span>
        )}
      </header>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge>{a.category}</Badge>
        {a.mandatory && <Badge tone={a.ackByMe ? "ok" : "warn"}>{a.ackByMe ? "Leitura confirmada" : `Leitura obrigatória até ${formatDate(a.mandatory.due, { short: true })}`}</Badge>}
      </div>
      <h3 id={`post-${a.id}`} className="m-0 mt-2 text-[15px] font-semibold leading-snug">
        <a href={href} className="hover:underline">
          {a.title}
        </a>
      </h3>
      <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-ink-soft">{a.summary}</p>
      <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ReactionRow reactions={a.reactions} onToggle={onReact} />
        <a href={href} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden /> {plural(a.comments, "comentário")}
        </a>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] tabular-nums text-muted">
          <Eye className="h-3.5 w-3.5" aria-hidden /> {formatNumber(a.reads)} leram · {formatPercent(readRate(a), 0)}
        </span>
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Estados do painel. No showcase, `?estado=carregando|erro|vazio`    */
/* simula cada um; no SEU app troque pelo estado da consulta          */
/* (isLoading, error, sem dados). O cabeçalho fica visível em todos;  */
/* no vazio ele não mostra números, período nem exportar.             */
/* ------------------------------------------------------------------ */

type SkeletonCard = { kind: "chart" | "list"; span?: 1 | 2 | 3; h?: number };
const skeletonCols = { 1: "", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 5: "lg:grid-cols-5" } as const;
const skeletonSpan = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;

/** Carregando com a forma final: painéis de lista e cartões (aqui sem faixa de KPIs: `kpis={0}`). */
function PanelSkeleton({ kpis = 4, rows }: { kpis?: 0 | 4 | 5; rows: { cols: keyof typeof skeletonCols; cards: SkeletonCard[] }[] }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando painel" className="space-y-6">
      {kpis > 0 && (
        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", kpis === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          {Array.from({ length: kpis }, (_, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-3 w-32 max-w-full" />
            </div>
          ))}
        </div>
      )}
      {rows.map((r, i) => (
        <div key={i} className={cn("grid items-start gap-6", skeletonCols[r.cols])}>
          {r.cards.map((c, j) =>
            c.kind === "chart" ? (
              <div key={j} className={cn("min-w-0 rounded-xl border border-line bg-surface px-6 py-5", skeletonSpan[c.span ?? 1])}>
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="mt-2 h-3 w-40 max-w-full" />
                <div className="mt-5" style={{ height: c.h ?? 220 }}>
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              </div>
            ) : (
              <div key={j} className={cn("min-w-0 rounded-2xl border border-line bg-soft/70 p-[3px]", skeletonSpan[c.span ?? 1])}>
                <div className="px-3 py-3">
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {Array.from({ length: 4 }, (_, k) => (
                    <div key={k} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-2.5 w-1/4" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** Erro ao carregar o painel, com saída: tentar de novo (limpa o estado simulado) ou ir para outra tela. */
function PanelError({ what, alt }: { what: string; alt?: { label: string; href: string } }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <ErrorState
        size="md"
        title={`Não foi possível carregar ${what}`}
        description="O servidor não respondeu. Nada do que você fez foi perdido; tente de novo em instantes."
        retryLabel="Tentar de novo"
        onRetry={() => setFrameQuery({ estado: undefined })}
        secondaryAction={
          alt && (
            <Button variant="ghost" href={alt.href}>
              {alt.label}
            </Button>
          )
        }
      />
    </div>
  );
}

export default function CommsHome() {
  const estado = useListState();
  const [posts, setPosts] = useState(published);
  const [tab, setTab] = useState("todos");
  const [vote, setVote] = useState<string | null>(null);
  const [greeted, setGreeted] = useState<string[]>([]);
  const pinned = posts.filter((a) => a.pinned);
  const unread = posts.filter((a) => !a.readByMe);
  const feed = (tab === "naolidos" ? unread : posts).filter((a) => !a.pinned || tab === "naolidos");
  const react = (id: string, emoji: string) => setPosts((all) => all.map((a) => (a.id === id ? { ...a, reactions: toggleReaction(a.reactions, emoji) } : a)));
  const votes = homePoll.options.map((o) => ({ ...o, votes: o.votes + (vote === o.id ? 1 : 0) }));
  const totalVotes = votes.reduce((s, o) => s + o.votes, 0);
  const greet = (id: string, what: string) => {
    setGreeted((g) => [...g, id]);
    notify(`${what} enviada para ${firstName(personById(id))}`);
  };
  const longDate = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <CommsShell section="inicio">
      <Page>
        <PageHeading
          kicker={longDate.charAt(0).toUpperCase() + longDate.slice(1)}
          title={`Bom dia, ${firstName(me)}`}
          description="O que a Vértice precisa que você saiba hoje, e o que está acontecendo com as pessoas."
          actions={
            <Button href={frameHref("comms-compose")}>
              <PenSquare /> Publicar comunicado
            </Button>
          }
        />

        {estado === "carregando" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <PanelSkeleton kpis={0} rows={[{ cols: 1, cards: [{ kind: "list" }] }]} />
              <LoadingShape variant="posts" rows={3} label="Carregando comunicados" />
            </div>
            <PanelSkeleton kpis={0} rows={[{ cols: 1, cards: [{ kind: "list" }] }, { cols: 1, cards: [{ kind: "chart", h: 140 }] }, { cols: 1, cards: [{ kind: "list" }] }]} />
          </div>
        ) : estado === "erro" ? (
          <PanelError what="o início" alt={{ label: "Abrir conversas", href: frameHref("comms-channels") }} />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              {estado === null && pendingForMe.length > 0 && (
                <ListPanel title="Precisa de você" tone="attention" count={pendingForMe.length} icon={<CheckCircle2 />}>
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {pendingForMe.map((a) => (
                      <li key={a.id}>
                        <ListRow
                          href={frameHref("comms-announcement", a.id)}
                          kicker={`Leitura obrigatória · ${a.category} · confirme até ${weekdayShort(a.mandatory!.due)}`}
                          title={a.title}
                          meta={<span className="text-[12px] font-medium text-ink">Ler e confirmar</span>}
                        />
                      </li>
                    ))}
                  </ul>
                </ListPanel>
              )}

              {estado === null && pinned.length > 0 && (
                <section aria-labelledby="fixados">
                  <h2 id="fixados" className="m-0 mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
                    <Pin className="h-3.5 w-3.5" aria-hidden /> Fixados pela Comunicação
                  </h2>
                  <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2">
                    {pinned.map((a) => (
                      <li key={a.id}>
                        <a href={frameHref("comms-announcement", a.id)} className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                          <span className="flex flex-wrap gap-1.5">
                            <Badge>{a.category}</Badge>
                            {a.mandatory && <Badge tone={a.ackByMe ? "ok" : "warn"}>{a.ackByMe ? "Confirmada" : "Obrigatória"}</Badge>}
                          </span>
                          <span className="mt-2 block text-[14px] font-semibold leading-snug">{a.title}</span>
                          <span className="mt-1 line-clamp-2 block text-[12.5px] text-ink-soft">{a.summary}</span>
                          <span className="mt-auto block pt-3">
                            <span className="mb-1.5 flex justify-between text-[12px] tabular-nums text-muted">
                              <span>{formatPercent(readRate(a), 0)} do público leu</span>
                              {a.mandatory && a.acks != null && <span>{formatPercent(a.acks / a.audienceSize, 0)} confirmaram</span>}
                            </span>
                            <Meter value={readRate(a) * 100} label={`${formatPercent(readRate(a), 0)} do público leu`} />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section aria-labelledby="feed">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h2 id="feed" className="m-0 text-[15px] font-semibold">
                    Comunicados
                  </h2>
                  {estado !== "vazio" && (
                    <Tabs
                      label="Filtrar comunicados"
                      value={tab}
                      onChange={setTab}
                      items={[
                        { id: "todos", label: "Todos" },
                        { id: "naolidos", label: "Não lidos", count: unread.length },
                      ]}
                    />
                  )}
                </div>
                {estado === "vazio" ? (
                  <Empty
                    title="Nenhum comunicado publicado ainda"
                    hint="Quando a Comunicação ou a liderança publicar um aviso oficial, ele aparece aqui e chega no app, no e-mail ou no WhatsApp."
                    action={
                      <Button href={frameHref("comms-compose")}>
                        <PenSquare /> Publicar o primeiro comunicado
                      </Button>
                    }
                  />
                ) : feed.length === 0 ? (
                  <Empty
                    title="Você leu todos os comunicados"
                    hint="Nada novo desde a sua última visita. Os anteriores continuam em Todos."
                    action={
                      <Button variant="ghost" onClick={() => setTab("todos")}>
                        Ver todos
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {feed.map((a) => (
                      <PostCard key={a.id} a={a} onReact={(e) => react(a.id, e)} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="min-w-0 space-y-4" aria-label="Nesta semana">
              <ListPanel title="Eventos da semana" icon={<CalendarDays />} action={<a href={frameHref("comms-events")} className="text-[12.5px] text-muted hover:text-ink">Ver agenda</a>}>
                {weekEvents.map((e) => (
                  <ListRow
                    key={e.id}
                    href={frameHref("comms-events", { id: e.id })}
                    leading={
                      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-soft leading-none">
                        <span className="text-[13px] font-semibold tabular-nums">{e.date.slice(8, 10)}</span>
                        <span className="text-[10px] uppercase text-muted">{weekdayShort(e.date).slice(0, 3)}</span>
                      </span>
                    }
                    kicker={`${e.start} · ${eventMode[e.mode]}${e.city ? ` · ${cityById(e.city).label}` : ""}`}
                    title={e.title}
                    meta={e.going ? <Badge tone="ok">Inscrito</Badge> : undefined}
                  />
                ))}
              </ListPanel>

              <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="enquete">
                <h2 id="enquete" className="m-0 flex items-center gap-2 text-[13px] font-medium">
                  <Vote className="h-4 w-4 text-muted" aria-hidden /> Enquete aberta
                </h2>
                <p className="m-0 mt-2 text-[14px] font-semibold leading-snug">{homePoll.question}</p>
                {vote ? (
                  <ul className="m-0 mt-3 list-none space-y-3 p-0">
                    {votes.map((o) => (
                      <li key={o.id}>
                        <div className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                          <span className={cn(o.id === vote && "font-medium")}>
                            {o.label}
                            {o.id === vote && <span className="text-muted"> · seu voto</span>}
                          </span>
                          <span className="tabular-nums text-muted">{formatPercent(o.votes / totalVotes, 0)}</span>
                        </div>
                        <Meter value={(o.votes / totalVotes) * 100} tone={o.id === vote ? "ink" : "accent"} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 space-y-2" role="group" aria-label="Opções da enquete">
                    {homePoll.options.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setVote(o.id);
                          notify("Voto registrado", () => setVote(null));
                        }}
                        className="flex w-full items-center rounded-lg border border-line px-3 py-2 text-left text-[13px] transition-colors hover:border-line-strong hover:bg-soft"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="m-0 mt-3 text-[12px] text-muted">
                  {formatNumber(totalVotes)} votos · encerra {weekdayShort(iso(5))} ·{" "}
                  <a href={frameHref("comms-surveys")} className="underline-offset-2 hover:underline">
                    ver pesquisas
                  </a>
                </p>
              </section>

              <ListPanel title="Aniversários da semana" icon={<Cake />}>
                {birthdays.map(({ p, in: inDays }) => (
                  <ListRow
                    key={p.id}
                    leading={<Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />}
                    kicker={`${inDays === 0 ? "Hoje" : inDays === 1 ? "Amanhã" : weekdayShort(iso(inDays))} · ${cityById(p.city).label}`}
                    title={p.name}
                    meta={
                      inDays === 0 ? (
                        greeted.includes(p.id) ? (
                          <span className="text-[12px] text-muted">Parabéns enviado</span>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => greet(p.id, "Mensagem de parabéns")}>
                            Dar parabéns
                          </Button>
                        )
                      ) : undefined
                    }
                  />
                ))}
              </ListPanel>

              <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby="chegaram">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="chegaram" className="m-0 flex items-center gap-2 text-[13px] font-medium">
                    <PartyPopper className="h-4 w-4 text-muted" aria-hidden /> Chegaram nas últimas semanas
                  </h2>
                  <AvatarGroup people={newHires} max={4} stacked />
                </div>
                <ul className="m-0 mt-3 list-none space-y-2 p-0">
                  {newHires.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <a href={frameHref("comms-people", { pessoa: p.id })} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:bg-soft">
                        <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" status={p.status} />
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-[12px] text-muted">
                            {p.role} · {areaLabel(p.area)} · desde {formatDate(p.since, { short: true })}
                          </span>
                        </span>
                      </a>
                      {greeted.includes(p.id) ? (
                        <span className="shrink-0 text-[12px] text-muted">Enviado</span>
                      ) : (
                        <Button size="sm" variant="quiet" onClick={() => greet(p.id, "Mensagem de boas-vindas")}>
                          Dar boas-vindas
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
                <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={() => go("comms-announcement", "a6")}>
                  Ler o comunicado de boas-vindas
                </Button>
              </section>
            </aside>
          </div>
        )}
      </Page>
    </CommsShell>
  );
}
