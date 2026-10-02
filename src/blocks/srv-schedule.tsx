import { CalendarPlus, MapPin, Wrench } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  ListPanel,
  ListRow,
  Meter,
  MiniAgenda,
  MonthCalendar,
  Page,
  PageHeading,
  SegmentedControl,
  Select,
  Skeleton,
  WeekPicker,
  addDays,
  formatNumber,
  startOfWeek,
  weekdayShort,
  type AgendaEvent,
  Table,
} from "@g4ai/ds";
import { clientById, dm, priorityInfo, slaOf, techById, technicians, todayIso, visits, workOrders as seed, type WorkOrder } from "./data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, ScheduleDialog, ServicosShell, useListState } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Agenda dos técnicos",
  description: "Semana por técnico (linhas) e dia (colunas) com OS e visitas preventivas alocadas, carga em horas, hoje destacado e fila de OS sem técnico para alocar. Alternador para o mês; no celular, a agenda de um técnico por vez. ?tecnico= destaca a linha.",
  category: "Serviços",
  order: 8,
  height: 1000,
  concept: {
    goal: "Encaixar cada OS no técnico certo sem estourar a carga de ninguém e sem deixar chamado sem dono.",
    patterns: [
      "Anatomia B · Painel de agenda: cabeçalho fixo com a semana (WeekPicker) e o modo Semana/Mês à direita",
      "Grade técnico × dia feita com tokens: OS em chip com hora, cliente e prioridade em palavra; visita preventiva em chip neutro",
      "Carga semanal por técnico com barra (horas alocadas de 44 h); folga em palavra",
      "Fila “Sem técnico” ao lado: Alocar abre o mesmo Modal de agendamento do quadro e do registro",
      "Celular: escolhe o técnico e vê a MiniAgenda dele; mês em MonthCalendar",
      "Cinco estados: ?estado=carregando|vazio|erro simula",
    ],
    adapt: [
      "Escala de plantão, agenda de consultórios por profissional, rotas de entrega por motorista",
    ],
    avoid: [
      "Arrastar como único jeito de alocar (inacessível por teclado)",
      "Cor do técnico sem nome na célula",
    ],
  },
} as const;

type Slot = { id: string; techId: string; date: string; start: string; end: string; title: string; client: string; wo?: WorkOrder };
const hoursOf = (s: Pick<Slot, "start" | "end">) => (Number(s.end.slice(0, 2)) * 60 + Number(s.end.slice(3, 5)) - Number(s.start.slice(0, 2)) * 60 - Number(s.start.slice(3, 5))) / 60;

export default function SrvSchedule() {
  const estado = useListState();
  const focus = useFrameParam("tecnico");
  const [list, setList] = useState<WorkOrder[]>(seed);
  const [week, setWeek] = useState(startOfWeek(todayIso));
  const [mode, setMode] = useState<"semana" | "mes">("semana");
  const [mobileTech, setMobileTech] = useState(focus ?? technicians[0].id);
  const [allocating, setAllocating] = useState<WorkOrder | null>(null);
  const days = Array.from({ length: 6 }, (_, i) => addDays(week, i));

  const slots: Slot[] =
    estado === "vazio"
      ? []
      : [
          ...list.filter((w) => w.techId && w.schedule).map((w) => ({ id: w.id, techId: w.techId!, date: w.schedule!.date, start: w.schedule!.start, end: w.schedule!.end, title: `${w.number} · ${w.title}`, client: clientById(w.clientId).name, wo: w })),
          ...visits.map((v) => ({ id: v.id, techId: v.techId, date: v.date, start: v.start, end: v.end, title: v.title, client: clientById(v.clientId).name })),
        ];
  const inWeek = slots.filter((s) => s.date >= days[0] && s.date <= days[5]);
  const queue = list.filter((w) => w.stage === "aberta" && !w.techId);
  const toEvent = (s: Slot): AgendaEvent => ({ id: s.id, date: s.date, title: `${s.client} · ${s.title}`, time: s.start, end: s.end, tone: s.wo ? (slaOf(s.wo).late ? "bad" : s.wo.priority === "urgente" ? "warn" : "info") : "neutral" });
  const open = (s: Slot | AgendaEvent) => (seed.some((w) => w.id === s.id) ? go("srv-work-order", s.id) : go("srv-client", visits.find((v) => v.id === s.id)?.clientId ?? "k1"));

  return (
    <ServicosShell section="agenda">
      <Page>
        <PageHeading
          title="Agenda dos técnicos"
          description="OS agendadas e visitas preventivas de contrato. Carga cheia = 44 h por semana."
          actions={
            <>
              <SegmentedControl label="Visualização" value={mode} onChange={setMode} options={[{ value: "semana", label: "Semana" }, { value: "mes", label: "Mês" }]} />
              {mode === "semana" && <WeekPicker value={week} onChange={setWeek} now={todayIso} />}
              <Button onClick={() => go("srv-work-orders", { nova: "1" })}>
                <Wrench /> Abrir OS
              </Button>
            </>
          }
        />
        {estado === "carregando" ? (
          <div className="space-y-2 rounded-xl border border-line bg-surface p-3" aria-busy="true" aria-label="Carregando agenda">
            {technicians.map((t) => (
              <div key={t.id} className="grid grid-cols-[180px_repeat(6,minmax(0,1fr))] gap-2">
                <Skeleton className="h-14" />
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ))}
          </div>
        ) : estado === "erro" ? (
          <LoadError what="a agenda" />
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {mode === "mes" ? (
                <MonthCalendar events={slots.map(toEvent)} now={todayIso} onEventClick={open} maxPerDay={3} />
              ) : !inWeek.length ? (
                <Empty title="Nada agendado nesta semana" hint="Aloque as OS sem técnico ao lado ou volte para a semana atual." action={<Button variant="ghost" onClick={() => setWeek(startOfWeek(todayIso))}>Ir para esta semana</Button>} />
              ) : (
                <>
                  {/* Desktop/tablet: grade técnico × dia */}
                  <Table label="Agenda da semana por técnico" className="hidden text-[12.5px] md:block [&>table]:min-w-[820px] [&>table]:table-fixed">
                      <thead>
                        <tr className="border-b border-line bg-soft text-[12px] text-muted">
                          <th scope="col" className="w-[172px] px-3 py-2 text-left font-medium">
                            Técnico
                          </th>
                          {days.map((d, i) => (
                            <th key={d} scope="col" className={d === todayIso ? "px-2 py-2 text-left font-semibold text-ink" : "px-2 py-2 text-left font-medium"}>
                              <span className="capitalize">{weekdayShort[i]}</span> {dm(d)}
                              {d === todayIso && <span className="ml-1 text-[11px] font-medium text-accent-deep">hoje</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {technicians.map((t) => {
                          const mine = inWeek.filter((s) => s.techId === t.id);
                          const load = mine.reduce((s, x) => s + hoursOf(x), 0);
                          return (
                            <tr key={t.id} className={focus === t.id ? "bg-soft" : undefined}>
                              <th scope="row" className="px-3 py-2.5 text-left align-top font-normal">
                                <button type="button" onClick={() => setFrameQuery({ tecnico: focus === t.id ? undefined : t.id })} className="flex w-full items-center gap-2 rounded-lg text-left hover:bg-soft">
                                  <Avatar initials={t.initials} tint={t.tint} name={t.name} size="sm" status={t.status} />
                                  <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-medium">{t.name}</span>
                                    <span className="block truncate text-[11.5px] text-muted">{t.status === "offline" ? "De folga hoje" : t.skill}</span>
                                  </span>
                                </button>
                                <div className="mt-2">
                                  <div className={load > 40 ? "mb-1 text-[11px] font-medium tabular-nums text-amber" : "mb-1 text-[11px] tabular-nums text-muted"}>{formatNumber(load, 1)} h de 44 h</div>
                                  <Meter value={(load / 44) * 100} tone={load > 40 ? "warn" : "ink"} label={`Carga de ${t.name}`} />
                                </div>
                              </th>
                              {days.map((d) => {
                                const cell = mine.filter((s) => s.date === d).sort((a, b) => a.start.localeCompare(b.start));
                                return (
                                  <td key={d} className={d === todayIso ? "bg-soft px-1.5 py-1.5 align-top" : "px-1.5 py-1.5 align-top"}>
                                    <ul className="m-0 list-none space-y-1 p-0">
                                      {cell.map((s) => (
                                        <li key={s.id}>
                                          <button
                                            type="button"
                                            onClick={() => open(s)}
                                            className={
                                              s.wo
                                                ? `w-full rounded-md border bg-surface px-2 py-1.5 text-left hover:border-line-strong ${slaOf(s.wo).late ? "border-rose/50" : "border-line"}`
                                                : "w-full rounded-md border border-dashed border-line bg-page px-2 py-1.5 text-left hover:border-line-strong"
                                            }
                                          >
                                            <span className="block tabular-nums text-[11px] text-muted">
                                              {s.start}–{s.end}
                                              {s.wo && (s.wo.priority === "urgente" || s.wo.priority === "alta") && <span className={s.wo.priority === "urgente" ? "font-medium text-rose" : "font-medium text-amber"}> · {priorityInfo[s.wo.priority].label}</span>}
                                            </span>
                                            <span className="line-clamp-2 block text-[12px] font-medium leading-snug">{s.client}</span>
                                            <span className="block truncate text-[11px] text-muted">{s.wo ? s.wo.number : `Preventiva · ${s.title}`}</span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                    {!cell.length && t.status === "offline" && d === todayIso && <span className="block px-1 py-2 text-[11px] text-muted">Folga</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                  </Table>
                  {/* Celular: um técnico por vez */}
                  <div className="space-y-4 md:hidden">
                    <Select label="Técnico" value={mobileTech} onValueChange={setMobileTech} options={technicians.map((t) => ({ value: t.id, label: t.name, description: t.skill }))} />
                    <div className="rounded-xl border border-line bg-surface p-4">
                      <MiniAgenda events={inWeek.filter((s) => s.techId === mobileTech).map(toEvent)} now={todayIso} onEventClick={open} />
                    </div>
                  </div>
                  <p className="m-0 mt-2 text-[12px] text-muted">Chip com borda contínua = OS; tracejado = visita preventiva do contrato. Borda vermelha = SLA estourado.</p>
                </>
              )}
            </div>

            <aside className="space-y-6">
              <ListPanel title="Sem técnico" icon={<CalendarPlus />} count={queue.length} tone={queue.length ? "attention" : "neutral"}>
                {queue.length ? (
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {queue.map((w) => (
                      <li key={w.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <a href={frameHref("srv-work-order", w.id)} className="min-w-0 hover:underline">
                            <span className="block font-mono text-[11.5px] text-muted">{w.number}</span>
                            <span className="block text-[13px] font-medium leading-snug">{w.title}</span>
                          </a>
                          <Badge tone={slaOf(w).tone}>{slaOf(w).label}</Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden /> <span className="truncate">{clientById(w.clientId).name} · {clientById(w.clientId).district}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAllocating(w)}>
                          Alocar técnico
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty framed={false} title="Toda OS tem técnico" hint="Chamados novos aparecem aqui até serem alocados." />
                )}
              </ListPanel>
              <ListPanel title="Hoje em campo" icon={<MapPin />}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {slots
                    .filter((s) => s.date === todayIso)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((s) => (
                      <li key={s.id}>
                        <ListRow onClick={() => open(s)} leading={<Avatar initials={techById(s.techId)?.initials ?? "?"} tint={techById(s.techId)?.tint} name={techById(s.techId)?.name ?? ""} size="sm" />} kicker={`${s.start}–${s.end} · ${techById(s.techId)?.name.split(" ")[0]}`} title={s.client} />
                      </li>
                    ))}
                </ul>
              </ListPanel>
            </aside>
          </div>
        )}
      </Page>
      {allocating && (
        <ScheduleDialog
          wo={allocating}
          open
          onClose={() => setAllocating(null)}
          initial={{ date: todayIso < days[0] ? days[0] : addDays(todayIso, 1) }}
          onConfirm={(c) => setList((all) => all.map((w) => (w.id === allocating.id ? { ...w, stage: "agendada", techId: c.techId, schedule: { date: c.date, start: c.start, end: c.end } } : w)))}
        />
      )}
    </ServicosShell>
  );
}
