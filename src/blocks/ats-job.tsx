import { Copy, ExternalLink, GripVertical, KanbanSquare, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Callout,
  ChoiceCards,
  CurrencyField,
  FunnelChart,
  IconButton,
  ListPanel,
  ListRow,
  NumberField,
  Page,
  PageHeading,
  PropertyList,
  Rating,
  Select,
  SplitLayout,
  Tabs,
  TextField,
  TextareaField,
  formatCurrency,
  notify,
} from "@g4os/ds";
import { areas, candidatesOf, company, jobById, openDays, person, stageLabel, stages, team, type Job } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Vaga",
  description: "Detalhe da vaga: resumo, funil, melhores candidatos, modelo de avaliação (critérios com peso e nota esperada) e canais de divulgação. Com ?id=nova vira o formulário de abertura.",
  category: "ATS",
  order: 3,
  height: 1100,
} as const;

type Criterion = Job["criteria"][number];

/** Editor do modelo de avaliação: critérios com peso (soma 100 %) e nota esperada. */
function ScorecardEditor({ value, onChange }: { value: Criterion[]; onChange: (v: Criterion[]) => void }) {
  const total = value.reduce((s, c) => s + c.weight, 0);
  const set = (i: number, patch: Partial<Criterion>) => onChange(value.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="m-0 text-[14px] font-medium">Modelo de avaliação</h2>
          <p className="m-0 mt-0.5 text-[12px] text-muted">Todo entrevistador avalia estes critérios de 1 a 5. O peso define a nota final.</p>
        </div>
        <Badge tone={total === 100 ? "ok" : "warn"}>Pesos somam {total} %</Badge>
      </header>
      <ul className="list-none divide-y divide-line p-0">
        {value.map((c, i) => (
          <li key={i} className="grid items-center gap-3 px-5 py-3 sm:grid-cols-[16px_minmax(0,1fr)_120px_160px_32px]">
            <GripVertical aria-hidden className="hidden h-4 w-4 text-muted sm:block" />
            <TextField label={`Critério ${i + 1}`} value={c.label} onChange={(label) => set(i, { label })} />
            <NumberField label="Peso" value={c.weight} onChange={(w) => set(i, { weight: w ?? 0 })} min={0} max={100} step={5} suffix="%" />
            <div>
              <span className="mb-1.5 block text-[12.5px] font-medium">Nota esperada</span>
              <Rating value={Math.round(c.expected)} onChange={(expected) => set(i, { expected })} label={`Nota esperada para ${c.label}`} />
            </div>
            <IconButton label={`Remover ${c.label}`} onClick={() => onChange(value.filter((_, k) => k !== i))} disabled={value.length <= 2}>
              <Trash2 />
            </IconButton>
          </li>
        ))}
      </ul>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-soft/40 px-5 py-3">
        <Button size="sm" variant="ghost" onClick={() => onChange([...value, { label: "Novo critério", weight: 0, expected: 4 }])} disabled={value.length >= 8}>
          <Plus /> Adicionar critério
        </Button>
        {total !== 100 && <span className="text-[12px] text-amber">Ajuste os pesos para somar 100 % antes de salvar.</span>}
      </footer>
    </section>
  );
}

/** Formulário de abertura de vaga (?id=nova). */
function NewJob() {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Tecnologia");
  const [mode, setMode] = useState<"Presencial" | "Híbrido" | "Remoto">("Híbrido");
  const [min, setMin] = useState<number | null>(null);
  const [max, setMax] = useState<number | null>(null);
  const [openings, setOpenings] = useState<number | null>(1);
  const [manager, setManager] = useState("marcos");
  const [summary, setSummary] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>(jobById("j1").criteria);
  const [tried, setTried] = useState(false);
  const errors = { title: !title.trim() ? "Dê um título que o candidato entenda: cargo + nível." : undefined, salary: min && max && min > max ? "O mínimo não pode ser maior que o máximo." : undefined };
  const weights = criteria.reduce((s, c) => s + c.weight, 0);
  const save = () => {
    setTried(true);
    if (errors.title || errors.salary || weights !== 100) return;
    notify(`Vaga “${title}” enviada para aprovação de ${person(manager).name}`);
    go("ats-jobs");
  };
  return (
    <TalentosShell section="vagas">
      <Page>
        <PageHeading crumbs={[{ label: "Vagas", href: "#/frame/ats-jobs" }]} title="Abrir vaga" description="A vaga vai para aprovação do gestor e, depois, para a página de carreiras." actions={<><Button variant="ghost" onClick={() => go("ats-jobs")}>Cancelar</Button><Button onClick={save}>Enviar para aprovação</Button></>} />
        <div className="mt-6 max-w-[880px] space-y-6">
          {tried && (errors.title || errors.salary || weights !== 100) && (
            <Callout tone="bad" title="Revise antes de enviar">
              {[errors.title, errors.salary, weights !== 100 ? `Os pesos do modelo de avaliação somam ${weights} %.` : undefined].filter(Boolean).join(" ")}
            </Callout>
          )}
          <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
            <TextField className="sm:col-span-2" label="Título da vaga" value={title} onChange={setTitle} placeholder="Ex.: Pessoa Desenvolvedora Front-end Pleno" error={tried ? errors.title : undefined} />
            <Select label="Área" value={area} onValueChange={setArea} options={areas.map((a) => ({ value: a, label: a }))} />
            <Select label="Gestor(a) da vaga" value={manager} onValueChange={setManager} options={team.slice(3).map((p) => ({ value: p.id, label: p.name, description: p.role }))} />
            <CurrencyField label="Salário mínimo" value={min} onChange={setMin} error={tried ? errors.salary : undefined} />
            <CurrencyField label="Salário máximo" value={max} onChange={setMax} hint="A faixa aparece para o candidato." />
            <NumberField label="Posições" value={openings} onChange={setOpenings} min={1} max={20} />
            <div className="sm:col-span-2">
              <ChoiceCards
                label="Modelo de trabalho"
                columns={3}
                value={mode}
                onChange={setMode}
                options={[
                  { value: "Presencial", label: "Presencial", description: "Todos os dias no escritório" },
                  { value: "Híbrido", label: "Híbrido", description: "2 a 3 dias no escritório" },
                  { value: "Remoto", label: "Remoto", description: "De qualquer lugar do Brasil" },
                ]}
              />
            </div>
            <TextareaField className="sm:col-span-2" label="Sobre a vaga" value={summary} onChange={setSummary} autosize minRows={4} counter hint="O que a pessoa vai fazer nos primeiros 6 meses." />
          </section>
          <ScorecardEditor value={criteria} onChange={setCriteria} />
        </div>
      </Page>
    </TalentosShell>
  );
}

export default function AtsJob() {
  const id = useFrameParam("id", "j1");
  if (id === "nova") return <NewJob />;
  return <JobDetail key={id} job={jobById(id)} />;
}

function JobDetail({ job }: { job: Job }) {
  const [tab, setTab] = useState("resumo");
  const [status, setStatus] = useState(job.status);
  const [criteria, setCriteria] = useState(job.criteria);
  const [channels, setChannels] = useState<string[]>(["site", "linkedin"]);
  const list = candidatesOf(job.id);
  const counts = stages.map((s, i) => job.backlog[i] + list.filter((c) => c.stage === s.id).length);
  const top = [...list].filter((c) => c.rating != null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4);
  const d = openDays(job);
  const recruiter = person(job.recruiter);
  const manager = person(job.manager);

  return (
    <TalentosShell section="vagas">
      <Page>
        <PageHeading
          crumbs={[{ label: "Vagas", href: "#/frame/ats-jobs" }, { label: job.area }]}
          title={job.title}
          description={`${job.location} · ${job.mode} · aberta há ${d} dias de ${job.sla} · ${job.openings} ${job.openings === 1 ? "posição" : "posições"}`}
          actions={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  const next = status === "aberta" ? "pausada" : "aberta";
                  setStatus(next);
                  notify(next === "pausada" ? "Vaga pausada: ela sai da página de carreiras" : "Vaga reaberta", () => setStatus(status));
                }}
              >
                {status === "aberta" ? <Pause /> : <Play />} {status === "aberta" ? "Pausar" : "Reabrir"}
              </Button>
              <Button onClick={() => go("ats-pipeline", job.id)}>
                <KanbanSquare /> Ver candidatos
              </Button>
            </>
          }
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={status === "aberta" ? "ok" : status === "pausada" ? "warn" : "neutral"}>{status === "aberta" ? "Aberta" : status === "pausada" ? "Pausada" : "Encerrada"}</Badge>
          {job.priority && <Badge tone="accent">Prioritária</Badge>}
          {d > job.sla && <Badge tone="bad">Fora do SLA</Badge>}
        </div>
        <Tabs
          className="mt-5"
          label="Seções da vaga"
          value={tab}
          onChange={setTab}
          items={[
            { id: "resumo", label: "Resumo" },
            { id: "avaliacao", label: "Modelo de avaliação" },
            { id: "divulgacao", label: "Divulgação" },
          ]}
        />
        <div className="mt-6">
          {tab === "resumo" && (
            <SplitLayout
              asideWidth={320}
              main={
                <div className="space-y-6">
                  <section className="rounded-xl border border-line bg-surface p-5">
                    <h2 className="m-0 text-[14px] font-medium">Onde estão os candidatos</h2>
                    <p className="m-0 mt-0.5 text-[12px] text-muted">{counts.reduce((s, n) => s + n, 0)} candidaturas · clique em “Ver candidatos” para mover etapas</p>
                    <FunnelChart className="mt-4" stages={stages.map((s, i) => ({ label: s.label, value: counts[i] }))} label={`Funil da vaga ${job.short}`} />
                  </section>
                  <ListPanel title="Melhor avaliados" count={top.length} action={<a href={`#/frame/ats-pipeline?id=${job.id}`}>Ver quadro</a>}>
                    <ul className="list-none divide-y divide-line p-0">
                      {top.map((c) => (
                        <li key={c.id}>
                          <ListRow onClick={() => go("ats-candidate", c.id)} leading={<Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />} kicker={stageLabel(c.stage)} title={c.name} meta={`${(c.rating ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} / 5`} />
                        </li>
                      ))}
                    </ul>
                  </ListPanel>
                  <section className="rounded-xl border border-line bg-surface p-5">
                    <h2 className="m-0 text-[14px] font-medium">Sobre a vaga</h2>
                    <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-ink-soft">{job.summary}</p>
                    <h3 className="m-0 mt-4 text-[12.5px] font-medium">Requisitos</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-ink-soft">
                      {job.requirements.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              }
              aside={
                <section className="rounded-xl border border-line bg-surface p-4">
                  <PropertyList
                    items={[
                      { label: "Faixa salarial", value: `${formatCurrency(job.salary[0], { cents: false })} – ${formatCurrency(job.salary[1], { cents: false })}`, hint: "CLT · mensal" },
                      { label: "Nível", value: job.level },
                      { label: "Recrutador(a)", value: <span className="inline-flex items-center gap-1.5"><Avatar initials={recruiter.initials} tint={recruiter.tint} size="sm" />{recruiter.name}</span> },
                      { label: "Gestor(a)", value: manager.name, hint: manager.role },
                      { label: "SLA", value: `${job.sla} dias`, hint: d > job.sla ? `${d - job.sla} dias acima` : `${job.sla - d} dias restantes` },
                    ]}
                  />
                </section>
              }
            />
          )}
          {tab === "avaliacao" && (
            <div className="max-w-[880px] space-y-4">
              <ScorecardEditor value={criteria} onChange={setCriteria} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCriteria(job.criteria)}>
                  Descartar
                </Button>
                <Button disabled={criteria.reduce((s, c) => s + c.weight, 0) !== 100} onClick={() => notify("Modelo de avaliação salvo. Vale para as próximas avaliações.")}>
                  Salvar modelo
                </Button>
              </div>
            </div>
          )}
          {tab === "divulgacao" && (
            <div className="max-w-[880px] space-y-5">
              <ChoiceCards
                label="Onde a vaga aparece"
                multiple
                columns={2}
                value={channels}
                onChange={(v) => {
                  setChannels(v);
                  notify("Canais de divulgação atualizados", undefined, "info");
                }}
                options={[
                  { value: "site", label: "Página de carreiras", description: company.careersUrl },
                  { value: "linkedin", label: "LinkedIn Jobs", description: "Publicação gratuita + impulsionamento" },
                  { value: "gupy", label: "Gupy", description: "Sincroniza candidaturas a cada hora" },
                  { value: "indicacao", label: "Programa de indicação", description: "Bônus de R$ 2.000 na contratação" },
                ]}
              />
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3">
                <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">{`https://${company.careersUrl}/vagas/${job.id}`}</code>
                <Button size="sm" variant="ghost" onClick={() => notify("Link copiado", undefined, "info")}>
                  <Copy /> Copiar link
                </Button>
                <Button size="sm" variant="ghost" onClick={() => go("ats-careers", job.id)}>
                  <ExternalLink /> Ver como candidato
                </Button>
              </div>
            </div>
          )}
        </div>
      </Page>
    </TalentosShell>
  );
}
