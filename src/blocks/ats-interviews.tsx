import { CalendarPlus, ClipboardCheck, MapPin, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AvatarGroup,
  Avatar,
  Badge,
  Button,
  ChoiceCards,
  Combobox,
  Drawer,
  Empty,
  ListPanel,
  MultiSelect,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  Rating,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  SlotPicker,
  TextField,
  TextareaField,
  buttonClass,
  formatDate,
  notify,
  plural,
  useOperation,
  type Slot,
} from "@g4ai/ds";
import { candidateById, candidates, interviews as seed, iso, jobById, me, person, team, today, type Interview, type Verdict } from "./data/ats";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, TalentosShell, useListState } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Entrevistas",
  description: "Agenda de entrevistas por dia com sala/link, avaliações pendentes em destaque, scorecard em folha lateral e agendamento em gaveta (?candidato= abre já preenchido) com horários livres, entrevistadores e link.",
  category: "ATS",
  order: 7,
  height: 980,
  concept: {
    goal: "Organizar a agenda de entrevistas e não deixar avaliações pendentes.",
    patterns: [
      "Anatomia A · Lista agrupada por dia, cabeçalho fixo",
      "Pendências de avaliação em destaque no topo",
      "Scorecard em folha lateral com os critérios da vaga",
      "Agendar em Drawer sem sair da agenda: ?candidato=c4 (vindo do banco de talentos) abre já preenchido",
      "Entrar na sala e Como chegar são links (abrem o Meet ou o mapa)",
      "Cinco estados: ?estado=carregando|vazio|erro simula",
    ],
    adapt: [
      "Agenda de visitas comerciais, reuniões de onboarding, auditorias",
    ],
    avoid: [
      "Formulário de avaliação em outra página (perde a agenda)",
      "Agendar por data solta sem mostrar os horários livres",
    ],
  },
} as const;

const dayLabel = (d: string) => {
  const diff = Math.round((new Date(`${d}T00:00:00`).getTime() - today.getTime()) / 86400000);
  const date = new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  return diff === 0 ? `Hoje · ${date}` : diff === 1 ? `Amanhã · ${date}` : diff === -1 ? `Ontem · ${date}` : date.charAt(0).toUpperCase() + date.slice(1);
};

type Kind = Interview["kind"];
const kinds: Kind[] = ["Entrevista RH", "Case técnico", "Conversa com gestor", "Entrevista final"];
const meetLink = "https://meet.google.com/abc-defg-hij";
const mapsHref = (where: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${where} Nexo S.A.`)}`;

/** Agenda fictícia e determinística: sem fim de semana; alguns horários ocupados. */
function availability(date: string, duration: number): Slot[] {
  const day = new Date(`${date}T00:00:00`).getDay();
  if (day === 0 || day === 6) return [];
  const n = Number(date.slice(8, 10));
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
  return times
    .filter((t) => duration < 90 || !t.endsWith(":30"))
    .map((time, i) => ({ time, busy: (i + n) % 4 === 0 || seed.some((x) => x.date === date && x.time === time) }));
}

type Draft = { candidateId: string; kind: Kind; interviewers: string[]; slot: { date: string; time: string } | null; duration: number; where: string };
const blankDraft = (candidateId = ""): Draft => {
  const c = candidateId ? candidateById(candidateId) : null;
  const kind: Kind = c?.stage === "case" ? "Case técnico" : c?.stage === "final" ? "Entrevista final" : "Entrevista RH";
  return { candidateId, kind, interviewers: c && kind !== "Entrevista RH" ? [jobById(c.jobId).manager] : [me.id], slot: null, duration: kind === "Case técnico" ? 60 : 45, where: meetLink };
};

export default function AtsInterviews() {
  const [list, setList] = useState(seed);
  const [scope, setScope] = useState<"minhas" | "todas">("todas");
  const [open, setOpen] = useState<Interview | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [note, setNote] = useState("");
  const estado = useListState();
  const candidato = useFrameParam("candidato");
  const agendar = useFrameParam("agendar");
  const [scheduling, setScheduling] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => blankDraft());
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Enviando convite…" });

  // Vindo do banco de talentos (?candidato=) ou do ⌘K (?agendar=1): abre a gaveta já preenchida.
  useEffect(() => {
    if (!candidato && !agendar) return;
    setDraft(blankDraft(candidato ?? ""));
    setTried(false);
    setScheduling(true);
  }, [candidato, agendar]);

  const visible = list.filter((i) => i.state !== "cancelada" && (scope === "todas" || i.interviewers.includes(me.id)));
  const pending = visible.filter((i) => i.feedback === "pendente");
  const upcoming = visible.filter((i) => i.state === "agendada").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const days = useMemo(() => [...new Set(upcoming.map((i) => i.date))], [upcoming]);
  const todayCount = upcoming.filter((i) => i.date === iso(0)).length;

  const startReview = (i: Interview) => {
    setOpen(i);
    setScores(jobById(i.jobId).criteria.map(() => 0));
    setVerdict(null);
    setNote("");
  };
  const submit = () => {
    if (!open) return;
    setList((all) => all.map((x) => (x.id === open.id ? { ...x, feedback: "enviado" } : x)));
    notify(`Avaliação de ${candidateById(open.candidateId).name.split(" ")[0]} enviada`);
    setOpen(null);
  };

  const openSchedule = () => {
    setDraft(blankDraft());
    setTried(false);
    op.reset();
    setScheduling(true);
  };
  const closeSchedule = () => {
    setScheduling(false);
    setFrameQuery({ candidato: undefined, agendar: undefined });
  };
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const errors = {
    candidate: !draft.candidateId ? "Escolha o candidato." : undefined,
    interviewers: !draft.interviewers.length ? "Escolha ao menos uma pessoa para entrevistar." : undefined,
    slot: !draft.slot ? "Escolha um horário livre." : undefined,
    where: !draft.where.trim() ? "Informe o link da sala ou o endereço." : undefined,
  };
  const schedule = () => {
    setTried(true);
    if (errors.candidate || errors.interviewers || errors.where || !draft.slot) return;
    const c = candidateById(draft.candidateId);
    const slot = draft.slot;
    const item: Interview = {
      id: `i${Date.now()}`,
      candidateId: c.id,
      jobId: c.jobId,
      kind: draft.kind,
      date: slot.date,
      time: slot.time,
      duration: draft.duration,
      interviewers: draft.interviewers,
      where: draft.where.startsWith("http") ? "Google Meet" : draft.where,
      state: "agendada",
      feedback: "n/a",
    };
    void op
      .run(
        () => new Promise((r) => setTimeout(r, 600)),
        { message: `Entrevista com ${c.name.split(" ")[0]} marcada para ${formatDate(slot.date, { short: true })} às ${slot.time}`, undo: () => setList((all) => all.filter((x) => x.id !== item.id)) },
        { apply: () => setList((all) => [...all, item]), revert: () => setList((all) => all.filter((x) => x.id !== item.id)) },
      )
      .then((err) => {
        if (!err) closeSchedule();
      });
  };

  const Row = ({ i }: { i: Interview }) => {
    const c = candidateById(i.candidateId);
    const j = jobById(i.jobId);
    const online = i.where === "Google Meet";
    return (
      <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="w-14 shrink-0 text-[13px] font-semibold tabular-nums">{i.time}</div>
        <button type="button" onClick={() => go("ats-candidate", c.id)} className="flex min-w-0 flex-1 basis-[220px] items-center gap-3 text-left">
          <Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium hover:underline">{c.name}</span>
            <span className="block truncate text-[12px] text-muted">
              {i.kind} · {j.short} · {i.duration} min
            </span>
          </span>
        </button>
        <span className="hidden items-center gap-1.5 text-[12px] text-muted md:inline-flex">
          {online ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
          {i.where}
        </span>
        <div className="flex w-full items-center justify-end gap-3 pl-[4.5rem] sm:w-auto sm:pl-0">
          <AvatarGroup people={i.interviewers.map((p) => person(p))} max={3} />
          {online ? (
            <a href={meetLink} target="_blank" rel="noreferrer" className={buttonClass({ variant: "ghost", size: "sm" })} aria-label={`Entrar na sala da entrevista com ${c.name} (abre o Google Meet)`}>
              Entrar
            </a>
          ) : (
            <a href={mapsHref(i.where)} target="_blank" rel="noreferrer" className={buttonClass({ variant: "ghost", size: "sm" })} aria-label={`Como chegar a ${i.where} (abre o mapa)`}>
              Como chegar
            </a>
          )}
        </div>
      </li>
    );
  };

  return (
    <TalentosShell section="entrevistas">
      <Page>
        <PageHeading
          title="Entrevistas"
          description={`${todayCount} hoje · ${upcoming.length} agendadas · ${pending.length} avaliações pendentes`}
          actions={
            <>
              <SegmentedControl label="De quem" value={scope} onChange={setScope} options={[{ value: "minhas", label: "Minhas" }, { value: "todas", label: "Todas" }]} />
              <Button onClick={openSchedule}>
                <CalendarPlus /> Agendar entrevista
              </Button>
            </>
          }
        />
        {estado === "carregando" ? (
          <div className="mt-6 space-y-6" aria-busy="true" aria-label="Carregando entrevistas">
            {[3, 2].map((n, k) => (
              <section key={k}>
                <Skeleton className="mb-2 h-3 w-40" />
                <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                  {Array.from({ length: n }, (_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <span className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </span>
                      <Skeleton className="h-8 w-16 rounded-lg" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : estado === "erro" ? (
          <div className="mt-6">
            <LoadError what="a agenda de entrevistas" />
          </div>
        ) : estado === "vazio" ? (
          <div className="mt-6">
            <Empty
              title="Nenhuma entrevista na agenda"
              hint="Agende a primeira a partir do perfil do candidato ou aqui mesmo. O convite vai por e-mail com o link da sala."
              action={
                <Button onClick={openSchedule}>
                  <CalendarPlus /> Agendar entrevista
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {pending.length > 0 && (
              <ListPanel title="Avaliações pendentes" tone="attention" icon={<ClipboardCheck />} count={pending.length}>
                <ul className="list-none divide-y divide-line p-0">
                  {pending.map((i) => {
                    const c = candidateById(i.candidateId);
                    return (
                      <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-medium">{c.name}</div>
                          <div className="truncate text-[12px] text-muted">
                            {i.kind} de {formatDate(i.date)} · {jobById(i.jobId).short}
                          </div>
                        </div>
                        <Badge tone="warn">há {plural(Math.round((today.getTime() - new Date(`${i.date}T00:00:00`).getTime()) / 86400000), "dia")}</Badge>
                        <Button size="sm" onClick={() => startReview(i)}>
                          Avaliar
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ListPanel>
            )}
            {days.length === 0 && (
              <Empty
                title={scope === "minhas" ? "Nenhuma entrevista sua agendada" : "Nenhuma entrevista agendada"}
                hint={scope === "minhas" ? "Você não está como entrevistador(a) em nenhuma entrevista futura." : "As entrevistas aparecem aqui assim que alguém agenda pelo perfil do candidato."}
                action={
                  scope === "minhas" ? (
                    <Button variant="ghost" onClick={() => setScope("todas")}>
                      Ver todas as entrevistas
                    </Button>
                  ) : (
                    <Button onClick={openSchedule}>
                      <CalendarPlus /> Agendar entrevista
                    </Button>
                  )
                }
              />
            )}
            {days.map((d) => (
              <section key={d}>
                <h2 className="mb-2 text-[13px] font-medium text-ink-soft">{dayLabel(d)}</h2>
                <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                  {upcoming
                    .filter((i) => i.date === d)
                    .map((i) => (
                      <Row key={i.id} i={i} />
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Page>
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `Avaliar ${candidateById(open.candidateId).name}` : ""}
        description={open ? `${open.kind} · ${jobById(open.jobId).short}` : undefined}
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Depois
            </Button>
            <Button onClick={submit} disabled={!verdict || scores.some((s) => !s)} disabledReason="Dê nota a todos os critérios e escolha um parecer.">
              Enviar avaliação
            </Button>
          </>
        }
      >
        {open && (
          <div className="space-y-5">
            <ul className="list-none divide-y divide-line rounded-xl border border-line p-0">
              {jobById(open.jobId).criteria.map((k, idx) => (
                <li key={k.label} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="min-w-0 text-[13px]">
                    {k.label}
                    <span className="block text-[11.5px] text-muted">peso {k.weight} % · esperado {k.expected}</span>
                  </span>
                  <Rating value={scores[idx] || null} onChange={(v) => setScores((s) => s.map((x, k2) => (k2 === idx ? v : x)))} label={k.label} showLabel />
                </li>
              ))}
            </ul>
            <ChoiceCards<Verdict>
              label="Parecer"
              columns={1}
              value={verdict}
              onChange={setVerdict}
              options={[
                { value: "sim-forte", label: "Contratar com certeza", description: "Eu brigaria por essa pessoa." },
                { value: "sim", label: "Contratar", description: "Atende o perfil, com pontos a desenvolver." },
                { value: "nao", label: "Não contratar", description: "Não atende critérios essenciais." },
              ]}
            />
            <TextareaField label="Comentário" value={note} onChange={setNote} autosize minRows={3} hint="Evidências, não impressões: o que a pessoa fez ou disse." optional />
          </div>
        )}
      </Sheet>
      <Drawer
        open={scheduling}
        onClose={closeSchedule}
        kicker={draft.candidateId ? `${candidateById(draft.candidateId).name} · ${jobById(candidateById(draft.candidateId).jobId).short}` : undefined}
        title="Agendar entrevista"
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={closeSchedule}>
              Cancelar
            </Button>
            <OperationButton operation={op} onClick={schedule}>
              Enviar convite
            </OperationButton>
          </>
        }
      >
        <div className="space-y-5">
          <OperationFeedback operation={op} />
          <Combobox
            label="Candidato"
            value={draft.candidateId}
            onValueChange={(v: string) => setDraft((d) => ({ ...blankDraft(v), slot: d.slot, where: d.where }))}
            options={candidates.filter((c) => c.status === "ativo").map((c) => ({ value: c.id, label: c.name, description: jobById(c.jobId).short }))}
            placeholder="Buscar candidato…"
            error={tried ? errors.candidate : undefined}
          />
          <Select label="Tipo" value={draft.kind} onValueChange={(v) => patch({ kind: v as Kind })} options={kinds.map((k) => ({ value: k, label: k }))} />
          <MultiSelect
            label="Quem entrevista"
            value={draft.interviewers}
            onValueChange={(v) => patch({ interviewers: v })}
            options={team.map((p) => ({ value: p.id, label: p.name, description: p.role }))}
            display="chips"
            error={tried ? errors.interviewers : undefined}
          />
          <div role="group" aria-label="Data e horário">
            <p className="m-0 mb-2 text-[12.5px] font-medium">Data e horário</p>
            <SlotPicker
              availability={availability}
              value={draft.slot}
              onChange={(slot) => patch({ slot })}
              duration={draft.duration}
              onDurationChange={(duration) => patch({ duration, slot: null })}
              durations={[30, 45, 60, 90]}
              now={iso(0)}
              days={10}
            />
            {tried && errors.slot && <p className="m-0 mt-2 text-[12px] text-rose">{errors.slot}</p>}
          </div>
          <TextField label="Link da sala ou endereço" value={draft.where} onChange={(v) => patch({ where: v })} hint="Online: o link vai no convite. Presencial: escreva a sala e a unidade." error={tried ? errors.where : undefined} />
        </div>
      </Drawer>
    </TalentosShell>
  );
}
