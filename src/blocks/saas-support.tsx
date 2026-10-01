import { ArrowLeft, Clock, Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  EntityMark,
  FieldBlock,
  FilterBar,
  Highlight,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  Select,
  TableSearch,
  TextareaField,
  cn,
  notify,
  useFilters,
  type FilterField,
} from "@g4os/ds";
import { customerById, personById, priorityLabel, priorityTone, team, ticketLabel, tickets as baseTickets, today, useFrameParam, type Priority, type Ticket, type TicketStatus } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Central de suporte",
  description: "Fila de chamados com filtros e SLA, conversa com resposta, status, prioridade e responsável; no celular a conversa abre em tela cheia (?id=).",
  category: "SaaS",
  order: 6,
  height: 900,
} as const;

const here = "#/frame/saas-support";
const statuses = Object.keys(ticketLabel) as TicketStatus[];
const priorities = Object.keys(priorityLabel) as Priority[];
const agents = team.filter((p) => p.role.startsWith("Suporte"));

const fields: FilterField<Ticket>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (t) => t.status, options: statuses.map((s) => ({ value: s, label: ticketLabel[s] })) },
  { key: "priority", label: "Prioridade", type: "enum", quick: true, accessor: (t) => t.priority, options: priorities.map((p) => ({ value: p, label: priorityLabel[p] })) },
  { key: "assignee", label: "Responsável", type: "person", accessor: (t) => t.assignee ?? "", options: agents.map((a) => ({ value: a.id, label: a.name })) },
  { key: "channel", label: "Canal", type: "enum", accessor: (t) => t.channel, options: ["E-mail", "Chat", "Telefone"].map((c) => ({ value: c, label: c })) },
];

const slaLeft = (t: Ticket) => t.sla - t.opened;

export default function SaasSupport() {
  const [tickets, setTickets] = useState(baseTickets);
  const id = useFrameParam("id");
  // Desktop abre o primeiro da fila; no celular a fila vem primeiro.
  const [selected, setSelected] = useState<string | null>(() => id ?? (window.matchMedia("(min-width: 1024px)").matches ? baseTickets.find((t) => t.priority === "urgente" && t.status !== "resolvido")?.id ?? null : null));
  const [reply, setReply] = useState("");
  useEffect(() => {
    if (id) setSelected(id);
  }, [id]);
  const filters = useFilters(tickets, {
    fields,
    search: (t) => [t.subject, t.id, customerById(t.customerId).name],
    now: today,
    url: true,
    initial: { query: "", conditions: [{ id: "abertos", field: "status", op: "is_not", value: ["resolvido"] }] },
  });
  const q = filters.state.query;
  const list = [...filters.rows].sort((a, b) => priorities.indexOf(b.priority) - priorities.indexOf(a.priority) || slaLeft(a) - slaLeft(b));
  const current = tickets.find((t) => t.id === selected);
  const update = (patch: Partial<Ticket>, message: string) => {
    if (!current) return;
    const prev = current;
    setTickets((all) => all.map((t) => (t.id === current.id ? { ...t, ...patch } : t)));
    notify(message, () => setTickets((all) => all.map((t) => (t.id === prev.id ? prev : t))));
  };
  const open = tickets.filter((t) => t.status !== "resolvido");

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading title="Suporte" description="Chamados de clientes. Urgentes e com SLA estourando primeiro." />
        <KpiGrid className="mt-6">
          <KpiCard label="Abertos" value={String(open.length)} hint={`${open.filter((t) => !t.assignee).length} sem responsável`} />
          <KpiCard label="SLA estourado" value={String(open.filter((t) => slaLeft(t) < 0).length)} hint="acima do prazo de resposta" />
          <KpiCard label="Primeira resposta" value="42 min" delta={-0.18} goodWhen="down" period="mediana · vs. agosto" />
          <KpiCard label="Satisfação (CSAT)" value="94 %" delta={0.02} period="últimos 30 dias" />
        </KpiGrid>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
          {/* Fila */}
          <section className={cn("min-w-0 space-y-3", current && "hidden lg:block")} aria-label="Fila de chamados">
            <FilterBar filters={filters} noun="chamado" search={<TableSearch value={q} onChange={filters.setQuery} total={tickets.length} noun="chamado" searchIn="assunto, número e cliente" />} />
            <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
              {list.map((t) => {
                const c = customerById(t.customerId);
                const left = slaLeft(t);
                return (
                  <li key={t.id}>
                    <button type="button" onClick={() => setSelected(t.id)} aria-current={t.id === selected ? "true" : undefined} className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-soft/50", t.id === selected && "bg-soft")}>
                      <EntityMark name={c.name} tint={c.tint} className="mt-0.5 h-7 w-7 text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] text-muted">
                            {t.id} · {c.name}
                          </span>
                          {t.status !== "resolvido" && (
                            <span className={cn("inline-flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums", left < 0 ? "font-medium text-rose" : left <= 2 ? "text-amber" : "text-muted")}>
                              <Clock className="h-3 w-3" />
                              {left < 0 ? `${-left} h atrasado` : `${left} h`}
                            </span>
                          )}
                        </span>
                        <Highlight text={t.subject} query={q} className="mt-0.5 block truncate text-[13.5px] font-medium" />
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          <Badge tone={priorityTone[t.priority]}>{priorityLabel[t.priority]}</Badge>
                          <Badge>{ticketLabel[t.status]}</Badge>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {!list.length && <li className="px-4 py-10 text-center text-[13px] text-muted">Nenhum chamado com esses filtros.</li>}
            </ul>
          </section>

          {/* Conversa */}
          <section className={cn("min-w-0 rounded-xl border border-line bg-surface", !current && "hidden lg:grid lg:place-items-center")} aria-label="Conversa">
            {current ? (
              <div className="flex h-full flex-col">
                <header className="border-b border-line px-5 py-4">
                  <button type="button" onClick={() => setSelected(null)} className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink lg:hidden">
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a fila
                  </button>
                  <div className="text-[12px] text-muted">
                    {current.id} · {current.channel} · aberto há {current.opened} h
                  </div>
                  <h2 className="m-0 mt-0.5 text-[16px] font-semibold tracking-tight">{current.subject}</h2>
                  <a href={`#/frame/saas-customer?id=${current.customerId}`} className="mt-1 inline-block text-[12.5px] font-medium text-blue hover:underline">
                    {customerById(current.customerId).name} · {customerById(current.customerId).plan}
                  </a>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <FieldBlock label="Situação">
                      <Select label="Situação" value={current.status} onValueChange={(v) => update({ status: v as TicketStatus }, `Chamado ${current.id}: ${ticketLabel[v as TicketStatus]}`)} options={statuses.map((s) => ({ value: s, label: ticketLabel[s] }))} />
                    </FieldBlock>
                    <FieldBlock label="Prioridade">
                      <Select label="Prioridade" value={current.priority} onValueChange={(v) => update({ priority: v as Priority }, `Prioridade: ${priorityLabel[v as Priority]}`)} options={priorities.map((p) => ({ value: p, label: priorityLabel[p] }))} />
                    </FieldBlock>
                    <FieldBlock label="Responsável">
                      <Select label="Responsável" placeholder="Ninguém" value={current.assignee ?? ""} onValueChange={(v) => update({ assignee: v, status: current.status === "novo" ? "aberto" : current.status }, `Atribuído a ${personById(v).name}`)} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
                    </FieldBlock>
                  </div>
                </header>
                <ol className="m-0 flex-1 list-none space-y-4 overflow-y-auto p-5">
                  {current.messages.map((m, i) => (
                    <li key={i} className={cn("flex gap-3", m.from === "time" && "flex-row-reverse")}>
                      <Avatar initials={m.author.split(" ").map((w) => w[0]).join("").slice(0, 2)} tint={m.from === "time" ? "#184560" : "#3f3f46"} size="sm" name={m.author} />
                      <div className={cn("max-w-[80%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed", m.from === "time" ? "bg-primary text-on-primary" : "border border-line bg-soft")}>
                        <div className={cn("mb-0.5 text-[11.5px]", m.from === "time" ? "text-on-primary/70" : "text-muted")}>
                          {m.author} · {m.ago}
                        </div>
                        {m.text}
                      </div>
                    </li>
                  ))}
                </ol>
                <form
                  className="border-t border-line p-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!reply.trim()) return;
                    setTickets((all) => all.map((t) => (t.id === current.id ? { ...t, status: "aguardando", assignee: t.assignee ?? "carla", messages: [...t.messages, { from: "time", author: personById(t.assignee ?? "carla").name, text: reply.trim(), ago: "agora" }] } : t)));
                    setReply("");
                    notify("Resposta enviada · chamado aguardando cliente");
                  }}
                >
                  <TextareaField label="Responder" value={reply} onChange={setReply} rows={3} placeholder={`Responder a ${customerById(current.customerId).contact}…`} />
                  <div className="mt-2 flex justify-end">
                    <Button type="submit" disabled={!reply.trim()}>
                      <Send /> Enviar resposta
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <p className="m-0 p-10 text-center text-[13px] text-muted">Escolha um chamado na fila para ver a conversa.</p>
            )}
          </section>
        </div>
      </Page>
    </SaasShell>
  );
}
