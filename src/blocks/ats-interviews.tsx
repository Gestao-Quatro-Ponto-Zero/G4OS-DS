import { ClipboardCheck, MapPin, Video } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AvatarGroup,
  Avatar,
  Badge,
  Button,
  ChoiceCards,
  Empty,
  ListPanel,
  Page,
  PageHeading,
  Rating,
  SegmentedControl,
  Sheet,
  TextareaField,
  notify,
  plural,
} from "@g4os/ds";
import { candidateById, interviews as seed, iso, jobById, me, person, today, type Interview, type Verdict } from "./data/ats";
import { go } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Entrevistas",
  description: "Agenda de entrevistas por dia com sala/link, avaliações pendentes em destaque e preenchimento do scorecard em uma folha lateral (critérios da vaga, parecer e comentário).",
  category: "ATS",
  order: 7,
  height: 980,
  concept: {
    goal: "Organizar a agenda de entrevistas e não deixar avaliações pendentes.",
    patterns: [
      "Anatomia A · Lista agrupada por dia, cabeçalho fixo",
      "Pendências de avaliação em destaque no topo",
      "Scorecard em folha lateral com os critérios da vaga",
    ],
    adapt: [
      "Agenda de visitas comerciais, reuniões de onboarding, auditorias",
    ],
    avoid: [
      "Formulário de avaliação em outra página (perde a agenda)",
    ],
  },
} as const;

const dayLabel = (d: string) => {
  const diff = Math.round((new Date(`${d}T00:00:00`).getTime() - today.getTime()) / 86400000);
  const date = new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  return diff === 0 ? `Hoje · ${date}` : diff === 1 ? `Amanhã · ${date}` : diff === -1 ? `Ontem · ${date}` : date.charAt(0).toUpperCase() + date.slice(1);
};

export default function AtsInterviews() {
  const [list, setList] = useState(seed);
  const [scope, setScope] = useState<"minhas" | "todas">("todas");
  const [open, setOpen] = useState<Interview | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [note, setNote] = useState("");

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
          <Button size="sm" variant="ghost" onClick={() => notify("Abrindo a sala no Google Meet…", undefined, "info")}>
            Entrar
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => notify(`Endereço copiado: ${i.where}`, undefined, "info")}>
            Como chegar
          </Button>
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
          actions={<SegmentedControl label="De quem" value={scope} onChange={setScope} options={[{ value: "minhas", label: "Minhas" }, { value: "todas", label: "Todas" }]} />}
        />
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
                          {i.kind} de {new Date(`${i.date}T00:00:00`).toLocaleDateString("pt-BR")} · {jobById(i.jobId).short}
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
          {days.length === 0 && <Empty title="Nenhuma entrevista agendada" hint="As entrevistas aparecem aqui assim que alguém agenda pelo perfil do candidato." />}
          {days.map((d) => (
            <section key={d}>
              <h2 className="mb-2 text-[13px] font-medium text-ink-soft">{dayLabel(d)}</h2>
              <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                {upcoming.filter((i) => i.date === d).map((i) => (
                  <Row key={i.id} i={i} />
                ))}
              </ul>
            </section>
          ))}
        </div>
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
            <Button onClick={submit} disabled={!verdict || scores.some((s) => !s)}>
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
    </TalentosShell>
  );
}
