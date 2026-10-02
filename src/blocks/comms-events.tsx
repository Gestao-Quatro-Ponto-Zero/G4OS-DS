import { CalendarPlus, Check, MapPin, Plus, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionMenu,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ChoiceCards,
  DateTimePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  LocationTag,
  Meter,
  MultiSelect,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  PropertyList,
  Select,
  Switch,
  Tabs,
  TextField,
  TextareaField,
  TimePicker,
  formatNumber,
  notify,
  plural,
  useFilters,
  useOperation,
  type FilterField,
} from "@g4ai/ds";
import { areas, cities, cityById, eventMode, events as seed, iso, me, now, personById, todayIso, weekdayShort, type CityId, type CommsEvent, type EventMode } from "./data/comms";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CommsShell, LoadError, LoadingShape, useListState } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · eventos",
  description: "Agenda de eventos internos por dia: presencial, on-line e híbrido, local com hora local, vagas e inscrição com desfazer, lista de espera, detalhe em gaveta com adicionar à agenda e criação de evento.",
  category: "Comunicação",
  order: 7,
  height: 1200,
  concept: {
    goal: "Ver o que vai acontecer, onde e quando (no meu fuso), e se inscrever em um clique.",
    patterns: [
      "Anatomia A · Lista agrupada por dia: cabeçalho fixo + PageToolbar com formato, cidade e categoria",
      "LocationTag no local do evento: hora local de Manaus, Cuiabá ou Lisboa ao lado do horário",
      "Vagas como medidor com palavra; esgotado vira lista de espera (botão diz o que faz)",
      "Detalhe (?id=) e criação (?novo=1) em Drawer, sem perder a agenda",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Treinamentos obrigatórios (com presença), agenda de visitas a clientes, turmas de curso",
    ],
    avoid: [
      "Horário sem fuso quando o time está em várias cidades",
      "Inscrição sem desfazer",
    ],
  },
} as const;

const categoriesEv = ["Cultura", "Treinamento", "Saúde", "Institucional", "Segurança"] as const;
const fields: FilterField<CommsEvent>[] = [
  { key: "mode", label: "Formato", type: "enum", quick: true, accessor: (e) => e.mode, options: (Object.keys(eventMode) as EventMode[]).map((m) => ({ value: m, label: eventMode[m] })) },
  { key: "city", label: "Cidade", type: "enum", quick: true, accessor: (e) => e.city ?? "", options: cities.map((c) => ({ value: c.id, label: c.label })) },
  { key: "category", label: "Categoria", type: "enum", accessor: (e) => e.category, options: categoriesEv.map((c) => ({ value: c, label: c })) },
];

const dayLabel = (d: string) => (d === iso(0) ? `Hoje · ${weekdayShort(d)}` : d === iso(1) ? `Amanhã · ${weekdayShort(d)}` : weekdayShort(d));
const isFull = (e: CommsEvent) => e.capacity != null && e.enrolled >= e.capacity;

function downloadIcs(e: CommsEvent) {
  const dt = (t: string) => `${e.date.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${e.title}`, `DTSTART:${dt(e.start)}`, `DTEND:${dt(e.end)}`, `LOCATION:${e.venue ?? "On-line"}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CommsEvents() {
  const estado = useListState();
  const id = useFrameParam("id");
  const novo = useFrameParam("novo");
  const [rows, setRows] = useState(seed);
  const [tab, setTab] = useState<"proximos" | "meus">("proximos");
  const [creating, setCreating] = useState(!!novo);
  useEffect(() => {
    if (novo) setCreating(true);
  }, [novo]);
  const closeCreate = () => {
    setCreating(false);
    setFrameQuery({ novo: undefined });
  };
  const filters = useFilters(rows, { fields, url: "e_", now });
  const list = useMemo(() => filters.rows.filter((e) => e.date >= todayIso && (tab === "proximos" || e.going)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)), [filters.rows, tab]);
  const days = [...new Set(list.map((e) => e.date))];
  const selected = id ? rows.find((e) => e.id === id) ?? null : null;
  const mine = rows.filter((e) => e.going && e.date >= todayIso);

  const toggle = (e: CommsEvent) => {
    const before = rows;
    const going = !e.going;
    setRows((all) => all.map((x) => (x.id === e.id ? { ...x, going, enrolled: x.enrolled + (going ? 1 : -1), attendeeIds: going ? [me.id, ...x.attendeeIds] : x.attendeeIds.filter((p) => p !== me.id) } : x)));
    notify(going ? (isFull(e) ? `Você entrou na lista de espera de ${e.title}` : `Inscrição confirmada: ${e.title}`) : `Inscrição cancelada: ${e.title}`, () => setRows(before));
  };

  // formulário
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Cultura");
  const [mode, setMode] = useState<EventMode>("presencial");
  const [startAt, setStartAt] = useState(`${iso(7)}T10:00`);
  const [endAt, setEndAt] = useState("11:00");
  const [city, setCity] = useState<CityId>("sp");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState<number | null>(null);
  const [aud, setAud] = useState<string[]>([]);
  const [desc, setDesc] = useState("");
  const [announce, setAnnounce] = useState(true);
  const [tried, setTried] = useState(false);
  const create = useOperation({ busyLabel: "Criando…" });
  const errors = {
    title: !title.trim() ? "Dê um nome ao evento." : undefined,
    venue: mode !== "online" && !venue.trim() ? "Informe onde acontece." : undefined,
    end: endAt <= startAt.slice(11, 16) ? "O término precisa ser depois do início." : undefined,
  };
  const submit = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    const ev: CommsEvent = { id: `e${Date.now()}`, title: title.trim(), category: category as CommsEvent["category"], date: startAt.slice(0, 10), start: startAt.slice(11, 16), end: endAt, mode, city: mode === "online" ? undefined : city, venue: mode === "online" ? undefined : venue.trim(), hostId: me.id, capacity: capacity ?? undefined, enrolled: 1, going: true, description: desc.trim() || "Sem descrição.", attendeeIds: [me.id] };
    void create.run(
      () =>
        new Promise((r) => setTimeout(r, 700)).then(() => {
          setRows((all) => [...all, ev]);
          closeCreate();
          setTitle("");
          setVenue("");
          setDesc("");
          setTried(false);
        }),
      announce ? "Evento criado e avisado no Início" : "Evento criado",
    );
  };

  const body =
    estado === "carregando" ? (
      <LoadingShape variant="posts" rows={4} label="Carregando eventos" />
    ) : estado === "erro" ? (
      <LoadError what="os eventos" />
    ) : estado === "vazio" ? (
      <Empty
        title="Nenhum evento marcado"
        hint="Café com a liderança, treinamentos, ações de saúde: o que acontecer na empresa aparece aqui com inscrição."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Criar evento
          </Button>
        }
      />
    ) : !list.length ? (
      tab === "meus" && !filters.dirty ? (
        <Empty title="Você não está inscrito em nenhum evento" hint="Veja o que vem por aí e se inscreva." action={<Button variant="ghost" onClick={() => setTab("proximos")}>Ver próximos eventos</Button>} />
      ) : (
        <div className="rounded-xl border border-line bg-surface">
          <EmptyFilterResult filters={filters} noun="evento" />
        </div>
      )
    ) : (
      <div className="space-y-6">
        {days.map((d) => (
          <section key={d} aria-labelledby={`dia-${d}`}>
            <h2 id={`dia-${d}`} className="m-0 mb-2 text-[13px] font-medium text-muted first-letter:uppercase">
              {dayLabel(d)}
            </h2>
            <ul className="m-0 list-none space-y-2 p-0">
              {list
                .filter((e) => e.date === d)
                .map((e) => {
                  const c = e.city ? cityById(e.city) : null;
                  const full = isFull(e);
                  return (
                    <li key={e.id} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[52px_minmax(0,1fr)_auto]">
                      <div className="flex h-[52px] flex-col items-center justify-center rounded-lg border border-line bg-soft leading-none">
                        <span className="text-[17px] font-semibold tabular-nums">{e.date.slice(8, 10)}</span>
                        <span className="mt-0.5 text-[10.5px] uppercase text-muted">{new Date(`${e.date}T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                      </div>
                      <div className="min-w-0">
                        <button type="button" onClick={() => setFrameQuery({ id: e.id })} className="text-left text-[14px] font-semibold leading-snug hover:underline">
                          {e.title}
                        </button>
                        <p className="m-0 mt-0.5 text-[12.5px] text-ink-soft">
                          {e.start}–{e.end} · {e.category} · com {personById(e.hostId).name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge icon={e.mode === "online" ? <Video /> : <MapPin />}>{eventMode[e.mode]}</Badge>
                          {c && <LocationTag place={`${e.venue?.split(" · ")[0] ?? c.label} · ${c.label}`} timeZone={c.timeZone} />}
                          {e.mode === "online" && <span className="text-[12px] text-muted">Link enviado na inscrição</span>}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                          <AvatarGroup people={e.attendeeIds.map(personById)} total={e.enrolled} max={4} stacked />
                          {e.capacity != null && (
                            <span className="flex min-w-[160px] flex-1 items-center gap-2 sm:max-w-[240px]">
                              <span className="flex-1"><Meter value={Math.min(100, (e.enrolled / e.capacity) * 100)} tone={full ? "warn" : "ink"} /></span>
                              <span className="shrink-0 text-[12px] tabular-nums text-muted">{full ? "Esgotado" : `${plural(e.capacity - e.enrolled, "vaga")}`}</span>
                            </span>
                          )}
                          {e.capacity == null && <span className="text-[12px] tabular-nums text-muted">{plural(e.enrolled, "inscrito")}</span>}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-start gap-2 md:col-span-1 md:justify-end">
                        {e.going ? (
                          <>
                            <Badge tone="ok" icon={<Check />}>
                              Inscrito
                            </Badge>
                            <ActionMenu
                              label={`Ações de ${e.title}`}
                              actions={[
                                { label: "Adicionar à agenda", icon: <CalendarPlus />, onSelect: () => (downloadIcs(e), notify("Convite .ics baixado", undefined, "info")) },
                                { label: "Cancelar inscrição", separator: true, onSelect: () => toggle(e) },
                              ]}
                            />
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => toggle(e)}>
                            {full ? "Entrar na lista de espera" : "Inscrever-se"}
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    );

  return (
    <CommsShell section="eventos">
      <Page>
        <PageHeading
          title="Eventos"
          description="O que acontece na Vértice nas próximas semanas. Horários no fuso de cada cidade."
          actions={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Criar evento
            </Button>
          }
        />
        {estado !== "vazio" && (
          <PageToolbar>
            <div className="flex flex-wrap items-center gap-3">
              <Tabs
                label="Eventos"
                value={tab}
                onChange={(v) => setTab(v as typeof tab)}
                items={[
                  { id: "proximos", label: "Próximos" },
                  { id: "meus", label: "Minhas inscrições" },
                ]}
              />
              <FilterBar className="min-w-0 flex-1" filters={filters} noun="evento" />
            </div>
          </PageToolbar>
        )}
        <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">{body}</div>
          <aside className="min-w-0 space-y-4" aria-label="Sua agenda">
            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="m-0 text-[13px] font-medium">Sua agenda</h2>
              {mine.length ? (
                <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
                  {mine.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => setFrameQuery({ id: e.id })} className="-mx-1 block w-full rounded-lg px-1 py-0.5 text-left hover:bg-soft">
                        <span className="block text-[12px] text-muted first-letter:uppercase">
                          {dayLabel(e.date)} · {e.start}
                        </span>
                        <span className="block truncate text-[13px] font-medium">{e.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 mt-2 text-[12.5px] text-muted">Nenhuma inscrição. Os eventos em que você se inscrever aparecem aqui.</p>
              )}
            </section>
            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="m-0 text-[13px] font-medium">Seu fuso</h2>
              <LocationTag className="mt-2" place={cityById(me.city).place} timeZone={cityById(me.city).timeZone} />
              <p className="m-0 mt-2 text-[12px] text-muted">Eventos em outras cidades mostram a hora local ao lado do local.</p>
            </section>
          </aside>
        </div>
      </Page>

      {/* Detalhe do evento */}
      <Drawer
        open={!!selected && !creating}
        onClose={() => setFrameQuery({ id: undefined })}
        title={selected?.title ?? "Evento"}
        kicker={selected ? `${selected.category} · ${eventMode[selected.mode]}` : undefined}
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={() => (downloadIcs(selected), notify("Convite .ics baixado", undefined, "info"))}>
                <CalendarPlus /> Adicionar à agenda
              </Button>
              <Button variant={selected.going ? "ghost" : "primary"} onClick={() => toggle(selected)}>
                {selected.going ? "Cancelar inscrição" : isFull(selected) ? "Entrar na lista de espera" : "Inscrever-se"}
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            {selected.going && (
              <p role="status" className="m-0 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-[13px] text-ok">
                <Check className="h-4 w-4" aria-hidden /> Você está inscrito.
              </p>
            )}
            <PropertyList
              items={[
                { label: "Quando", value: <span className="first-letter:uppercase">{`${dayLabel(selected.date)}, ${selected.start}–${selected.end}`}</span>, hint: selected.city ? `Horário de ${cityById(selected.city).label}` : "Horário de Brasília" },
                { label: "Formato", value: eventMode[selected.mode] },
                { label: "Local", value: selected.venue ?? "On-line · o link chega por e-mail e no app" },
                { label: "Organização", value: personById(selected.hostId).name },
                { label: "Vagas", value: selected.capacity != null ? `${formatNumber(selected.enrolled)} de ${formatNumber(selected.capacity)}` : `${formatNumber(selected.enrolled)} inscritos · sem limite` },
              ]}
            />
            {selected.city && <LocationTag place={cityById(selected.city).place} timeZone={cityById(selected.city).timeZone} />}
            <p className="m-0 text-[13.5px] leading-relaxed text-ink-soft">{selected.description}</p>
            <section>
              <h3 className="m-0 text-[12.5px] font-medium text-muted">Quem vai · {formatNumber(selected.enrolled)}</h3>
              <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
                {selected.attendeeIds.map(personById).map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 text-[13px]">
                    <Avatar initials={p.initials} tint={p.tint} name={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="truncate text-[12px] text-muted">{cityById(p.city).label}</span>
                  </li>
                ))}
                {selected.enrolled > selected.attendeeIds.length && <li className="pl-9 text-[12px] text-muted">e mais {formatNumber(selected.enrolled - selected.attendeeIds.length)}</li>}
              </ul>
            </section>
          </div>
        )}
      </Drawer>

      {/* Criar evento */}
      <Drawer
        open={creating}
        onClose={closeCreate}
        title="Criar evento"
        kicker="Eventos"
        width={540}
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>
              Cancelar
            </Button>
            <OperationButton operation={create} onClick={submit}>
              Criar evento
            </OperationButton>
          </>
        }
      >
        <div className="space-y-5">
          <OperationFeedback operation={create} />
          <TextField label="Nome do evento" value={title} onChange={setTitle} placeholder="Ex.: Café com a diretoria · Curitiba" error={tried ? errors.title : undefined} />
          <Select label="Categoria" value={category} onValueChange={setCategory} options={categoriesEv.map((c) => ({ value: c, label: c }))} />
          <ChoiceCards
            label="Formato"
            value={mode}
            onChange={(v: EventMode) => setMode(v)}
            columns={3}
            options={[
              { value: "presencial", label: "Presencial", icon: <MapPin /> },
              { value: "online", label: "On-line", icon: <Video /> },
              { value: "hibrido", label: "Híbrido", description: "Local + transmissão" },
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <DateTimePicker label="Início" value={startAt} onChange={setStartAt} min={todayIso} now={todayIso} />
            <TimePicker label="Término" value={endAt} onChange={setEndAt} step={15} error={tried ? errors.end : undefined} />
          </div>
          {mode !== "online" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Cidade" value={city} onValueChange={(v) => setCity(v as CityId)} options={cities.map((c) => ({ value: c.id, label: c.label, description: c.site }))} />
              <TextField label="Local" value={venue} onChange={setVenue} placeholder="Ex.: Sede · auditório" error={tried ? errors.venue : undefined} />
            </div>
          )}
          <NumberField label="Vagas" value={capacity} onChange={setCapacity} min={1} optional hint="Sem número, a inscrição não tem limite." />
          <MultiSelect label="Público" value={aud} onValueChange={setAud} options={areas.map((a) => ({ value: a.id, label: a.label }))} placeholder="Toda a empresa" />
          <TextareaField label="Descrição" value={desc} onChange={setDesc} placeholder="O que vai acontecer, para quem é, o que levar." optional />
          <Switch label="Avisar no Início e por notificação" checked={announce} onCheckedChange={setAnnounce} />
        </div>
      </Drawer>
    </CommsShell>
  );
}
