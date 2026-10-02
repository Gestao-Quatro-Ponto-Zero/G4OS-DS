import { CalendarDays, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Combobox,
  CurrencyField,
  DateBadge,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  MonthCalendar,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  ProjectProgressCard,
  SegmentedControl,
  Select,
  StatCell,
  StatGrid,
  TableSearch,
  TextField,
  cn,
  formatCurrency,
  notify,
  plural,
  useFilters,
  useOperation,
  type AgendaEvent,
  type FilterField,
} from "@g4ai/ds";
import {
  contractById,
  contracts,
  counterpartyById,
  daysFromToday,
  iso,
  me,
  obligationKinds,
  obligations as seed,
  people,
  personById,
  renewals,
  today,
  type Obligation,
  type ObligationKind,
} from "./data/contracts";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ClmShell, LoadError, LoadingRows, useListState } from "./shells/clm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Obrigações e prazos",
  description: "Tudo o que os contratos exigem com data: pagamentos, entregas, reajustes (IGP-M/IPCA), avisos prévios de não renovação e garantias. Lista agrupada por urgência ou calendário do mês, filtros, marcar como cumprida e as renovações em andamento com marcos.",
  category: "Contratos",
  order: 7,
  height: 1200,
  concept: {
    goal: "Não perder prazo de contrato: cobrar a contraparte, pagar em dia e decidir renovações antes do aviso prévio.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (situação, filtros, busca); lista agrupada por urgência ou calendário do mês",
      "Atrasadas primeiro, com dias de atraso em palavra; prazo em DateBadge",
      "Checkbox marca como cumprida com Desfazer",
      "Renovações em andamento como ProjectProgressCard (marcos, responsável, prazo)",
      "Nova obrigação em Drawer, com operação e aviso ao terminar",
      "Cinco estados: ?estado=carregando|vazio|erro; ?filtro=atrasadas vem do painel",
    ],
    adapt: [
      "Compliance regulatório (licenças, alvarás), manutenção preventiva, vencimento de certificados",
    ],
    avoid: [
      "Lista plana por data sem separar o que já atrasou",
      "Aviso prévio tratado como data qualquer: é o prazo que mais custa perder",
    ],
  },
} as const;

type Scope = "abertas" | "atrasadas" | "cumpridas" | "todas";
const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));

const fields: FilterField<Obligation>[] = [
  { key: "kind", label: "Tipo", type: "enum", quick: true, accessor: (o) => o.kind, options: Object.entries(obligationKinds).map(([value, label]) => ({ value, label })) },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (o) => o.owner, options: people.map((p) => ({ value: p.id, label: p.name })) },
  { key: "party", label: "Quem cumpre", type: "enum", accessor: (o) => o.party, options: [{ value: "Vereda", label: "Vereda" }, { value: "Contraparte", label: "Contraparte" }] },
  { key: "due", label: "Prazo", type: "date", accessor: (o) => o.due },
  { key: "value", label: "Valor", type: "currency", accessor: (o) => o.value ?? 0 },
];

const groupOf = (o: Obligation) => {
  if (o.done) return "Cumpridas";
  const d = daysFromToday(o.due);
  if (d < 0) return "Atrasadas";
  if (d <= 7) return "Próximos 7 dias";
  if (d <= 30) return "Próximos 30 dias";
  return "Depois";
};
const groupOrder = ["Atrasadas", "Próximos 7 dias", "Próximos 30 dias", "Depois", "Cumpridas"];

export default function ClmObligations() {
  const estado = useListState();
  const filtro = useFrameParam("filtro");
  const [rows, setRows] = useState(seed);
  const [scope, setScope] = useState<Scope>(filtro === "atrasadas" ? "atrasadas" : "abertas");
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [month, setMonth] = useState(iso(0));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ contractId: string; title: string; kind: ObligationKind; due: string; owner: string; value: number | null }>({ contractId: "", title: "", kind: "entrega", due: iso(14), owner: me.id, value: null });
  const op = useOperation({ busyLabel: "Salvando…" });

  const scoped = useMemo(() => rows.filter((o) => (scope === "abertas" ? !o.done : scope === "atrasadas" ? !o.done && daysFromToday(o.due) < 0 : scope === "cumpridas" ? o.done : true)), [rows, scope]);
  const filters = useFilters(scoped, {
    fields,
    search: (o) => {
      const c = contractById(o.contractId);
      return [o.title, c.number, c.title, counterpartyById(c.counterpartyId).short];
    },
    me: me.id,
    now: today,
    url: "o_",
  });
  const q = filters.state.query;
  const late = rows.filter((o) => !o.done && daysFromToday(o.due) < 0);
  const week = rows.filter((o) => !o.done && daysFromToday(o.due) >= 0 && daysFromToday(o.due) <= 7);
  const notices = rows.filter((o) => !o.done && o.kind === "aviso" && daysFromToday(o.due) <= 60);
  const toPay = rows.filter((o) => !o.done && o.kind === "pagamento" && o.party === "Vereda" && daysFromToday(o.due) <= 30);
  const grouped = groupOrder.map((g) => ({ g, items: filters.rows.filter((o) => groupOf(o) === g).sort((a, b) => a.due.localeCompare(b.due)) })).filter((x) => x.items.length);
  const events: AgendaEvent[] = filters.rows.map((o) => ({ id: o.id, date: o.due, title: o.title, tone: o.done ? "ok" : daysFromToday(o.due) < 0 ? "bad" : o.kind === "aviso" ? "warn" : "neutral", meta: contractById(o.contractId).number }));

  const toggle = (o: Obligation, done: boolean) => {
    setRows((all) => all.map((x) => (x.id === o.id ? { ...x, done } : x)));
    if (done) notify(`Cumprida: ${o.title}`, () => setRows((all) => all.map((x) => (x.id === o.id ? { ...x, done: false } : x))));
  };

  return (
    <ClmShell section="obrigacoes">
      <Page>
        <PageHeading
          title="Obrigações e prazos"
          description="O que os contratos exigem, de quem e até quando. Responsáveis recebem lembrete 7 dias antes e no dia."
          actions={
            <Button onClick={() => setAdding(true)}>
              <Plus /> Nova obrigação
            </Button>
          }
        />
        {estado === "carregando" ? (
          <LoadingRows rows={8} label="Carregando obrigações" />
        ) : estado === "erro" ? (
          <LoadError what="as obrigações" />
        ) : estado === "vazio" ? (
          <Empty
            title="Nenhuma obrigação cadastrada"
            hint="As obrigações saem dos contratos assinados (pagamentos, entregas, reajustes e avisos prévios). Cadastre a primeira ou importe da minuta."
            action={
              <Button onClick={() => setAdding(true)}>
                <Plus /> Nova obrigação
              </Button>
            }
          />
        ) : (
          <>
            <StatGrid cols={4}>
              <StatCell label="Atrasadas" value={late.length} hint={late.length ? `mais antiga há ${Math.max(...late.map((o) => -daysFromToday(o.due)))} dias` : "nenhuma"} tone={late.length ? "bad" : undefined} />
              <StatCell label="Próximos 7 dias" value={week.length} hint="entregas, pagamentos e avisos" />
              <StatCell label="Avisos prévios em 60 dias" value={notices.length} hint="decidir se renova" tone={notices.length ? "warn" : undefined} />
              <StatCell label="A pagar em 30 dias" value={formatCurrency(toPay.reduce((s, o) => s + (o.value ?? 0), 0), { compact: true })} hint={plural(toPay.length, "pagamento")} />
            </StatGrid>

        <PageToolbar className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl<Scope>
              label="Situação"
              value={scope}
              onChange={(v) => {
                setScope(v);
                setFrameQuery({ filtro: v === "atrasadas" ? "atrasadas" : undefined });
              }}
              options={[
                { value: "abertas", label: "Em aberto" },
                { value: "atrasadas", label: `Atrasadas (${late.length})` },
                { value: "cumpridas", label: "Cumpridas" },
                { value: "todas", label: "Todas" },
              ]}
            />
            <SegmentedControl
              label="Visualização"
              value={view}
              onChange={setView}
              options={[
                { value: "lista", label: "Lista", icon: <List /> },
                { value: "calendario", label: "Calendário", icon: <CalendarDays /> },
              ]}
            />
          </div>
          <FilterBar className="mt-3" filters={filters} noun="obrigação" search={<TableSearch value={q} onChange={filters.setQuery} total={scoped.length} noun="obrigação" searchIn="título, contrato e contraparte" />} />
        </PageToolbar>
            <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">

                <div>
                  {!filters.rows.length ? (
                    filters.dirty ? (
                      <EmptyFilterResult filters={filters} noun="obrigação" />
                    ) : (
                      <Empty title={scope === "atrasadas" ? "Nada atrasado" : "Nada por aqui"} hint={scope === "atrasadas" ? "Todas as obrigações estão em dia." : "Troque a situação acima para ver as demais."} />
                    )
                  ) : view === "calendario" ? (
                    <MonthCalendar events={events} month={month} onMonthChange={setMonth} now={iso(0)} onEventClick={(e) => go("clm-contract", { id: rows.find((o) => o.id === e.id)!.contractId, aba: "obrigacoes" })} />
                  ) : (
                    <div className="space-y-6">
                      {grouped.map(({ g, items }) => (
                        <section key={g} aria-label={g}>
                          <h2 className={cn("m-0 mb-2 flex items-center gap-2 text-[13px] font-medium", g === "Atrasadas" && "text-rose")}>
                            {g} <span className="font-normal tabular-nums text-muted">{items.length}</span>
                          </h2>
                          <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                            {items.map((o) => {
                              const c = contractById(o.contractId);
                              const k = counterpartyById(c.counterpartyId);
                              const p = personById(o.owner);
                              const d = daysFromToday(o.due);
                              const isLateOne = !o.done && d < 0;
                              return (
                                <li key={o.id} className="flex items-start gap-3 px-4 py-3 sm:items-center">
                                  <span className="pt-1.5 sm:pt-0">
                                    <Checkbox hideLabel label={`Marcar como cumprida: ${o.title}`} checked={!!o.done} onCheckedChange={(v) => toggle(o, v)} />
                                  </span>
                                  <DateBadge date={o.due} size="sm" tone={o.done ? "neutral" : isLateOne ? "bad" : d <= 7 ? "warn" : "neutral"} />
                                  <div className="min-w-0 flex-1">
                                    <Highlight text={o.title} query={q} className={cn("block text-[13.5px]", o.done && "text-muted line-through")} />
                                    <a href={frameHref("clm-contract", { id: c.id, aba: "obrigacoes" })} className="block truncate text-[12px] text-muted hover:text-ink hover:underline">
                                      <span className="font-mono">{c.number}</span> · {k.short} · {o.party === "Vereda" ? "Vereda cumpre" : `${k.short} cumpre`}
                                    </a>
                                    {o.note && !o.done && <p className="m-0 mt-1 text-[12px] leading-snug text-ink-soft">{o.note}</p>}
                                  </div>
                                  <div className="hidden shrink-0 items-center gap-3 md:flex">
                                    <Badge>{obligationKinds[o.kind]}</Badge>
                                    {o.value ? <span className="w-[92px] text-right text-[12.5px] tabular-nums">{formatCurrency(o.value, { cents: false })}</span> : <span className="w-[92px]" />}
                                    <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />
                                  </div>
                                  <Badge tone={o.done ? "ok" : isLateOne ? "bad" : d === 0 ? "warn" : "neutral"}>{o.done ? "Cumprida" : isLateOne ? `${-d} ${-d === 1 ? "dia" : "dias"} de atraso` : d === 0 ? "Hoje" : `Em ${d} ${d === 1 ? "dia" : "dias"}`}</Badge>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="min-w-0 space-y-4" aria-label="Renovações em andamento">
                <h2 className="m-0 text-[15px] font-medium">Renovações em andamento</h2>
                {renewals.map((r) => {
                  const c = contractById(r.contractId);
                  return (
                    <ProjectProgressCard
                      key={r.id}
                      title={r.title}
                      subtitle={`${c.number} · ${counterpartyById(c.counterpartyId).short}`}
                      owner={personById(r.owner).name}
                      due={r.due}
                      late={!!r.late}
                      milestones={r.milestones}
                      action={
                        <Button size="sm" variant="ghost" onClick={() => go("clm-contract", c.id)}>
                          Abrir contrato
                        </Button>
                      }
                    />
                  );
                })}
              </aside>
            </div>
          </>
        )}
      </Page>

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Nova obrigação"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <OperationButton
              operation={op}
              disabled={!draft.contractId || !draft.title.trim()}
              disabledReason="Escolha o contrato e descreva a obrigação"
              onClick={() =>
                void op.run(
                  async () => {
                    await wait();
                    setRows((all) => [...all, { id: `o${Date.now()}`, contractId: draft.contractId, title: draft.title.trim(), kind: draft.kind, due: draft.due, owner: draft.owner, value: draft.value ?? undefined, party: draft.kind === "pagamento" || draft.kind === "aviso" ? "Vereda" : "Contraparte" }]);
                    setAdding(false);
                    setDraft((d) => ({ ...d, title: "", value: null }));
                  },
                  `Obrigação cadastrada · lembrete para ${personById(draft.owner).name.split(" ")[0]}`,
                )
              }
            >
              Cadastrar obrigação
            </OperationButton>
          </>
        }
      >
        <div className="space-y-4">
          <OperationFeedback operation={op} />
          <Combobox
            label="Contrato"
            placeholder="Buscar por número, objeto ou contraparte…"
            value={draft.contractId}
            onValueChange={(v) => setDraft((d) => ({ ...d, contractId: v }))}
            options={contracts.filter((c) => c.status === "vigente" || c.status === "assinatura").map((c) => ({ value: c.id, label: `${c.number} · ${c.title}`, description: counterpartyById(c.counterpartyId).name }))}
          />
          <TextField label="O que precisa ser feito" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} placeholder="Ex.: Entregar apólice de seguro renovada" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Tipo" value={draft.kind} onValueChange={(v) => setDraft((d) => ({ ...d, kind: v as ObligationKind }))} options={Object.entries(obligationKinds).map(([value, label]) => ({ value, label }))} />
            <DatePicker label="Prazo" value={draft.due} onValueChange={(v) => setDraft((d) => ({ ...d, due: v }))} min={iso(0)} />
            <Select label="Responsável" value={draft.owner} onValueChange={(v) => setDraft((d) => ({ ...d, owner: v }))} options={people.map((p) => ({ value: p.id, label: p.name, description: p.area }))} />
            {draft.kind === "pagamento" && <CurrencyField label="Valor" optional value={draft.value} onChange={(v) => setDraft((d) => ({ ...d, value: v }))} />}
          </div>
        </div>
      </Drawer>
    </ClmShell>
  );
}
