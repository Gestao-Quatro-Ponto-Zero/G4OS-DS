import { CalendarPlus, Download, FileSignature, Mail, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DatePicker,
  Empty,
  FieldBlock,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  RadarChart,
  Select,
  SplitLayout,
  StagePath,
  Tabs,
  Timeline,
  formatCurrency,
  notify,
} from "@g4ai/ds";
import { candidateById, interviewsOf, iso, jobById, person, scorecardsOf, shortDate, stageLabel, stages, team, verdictInfo, type Candidate } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Perfil do candidato",
  description: "Candidato em uma vaga: etapas clicáveis, avaliações por critério e por entrevistador, radar contra o perfil da vaga, currículo, entrevistas, agendar, reprovar e criar proposta.",
  category: "ATS",
  order: 5,
  height: 1300,
  concept: {
    goal: "Decidir sobre um candidato com tudo à mão: em que etapa está, como foi avaliado por critério e o que vem a seguir.",
    patterns: [
      "Anatomia C · Registro: trilha + nome + ações fixos; propriedades fixas à direita (SplitLayout)",
      "StagePath clicável mostra o caminho e o próximo passo",
      "Avaliações por critério e por entrevistador; radar contra o perfil da vaga",
      "Reprovar pede confirmação; proposta em modal",
    ],
    adapt: [
      "Registro de cliente no CRM (etapas do negócio), fornecedor em homologação no ERP",
    ],
    avoid: [
      "Nota única sem critérios (esconde o porquê da decisão)",
    ],
  },
} as const;

function Score({ value }: { value: number }) {
  if (!value) return <span className="text-[12px] text-muted">—</span>;
  return (
    <span className="inline-flex" role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} fill={i <= value ? "var(--ds-accent)" : "none"} stroke={i <= value ? "var(--ds-accent)" : "var(--ds-line-strong)"} />
      ))}
    </span>
  );
}

export default function AtsCandidate() {
  const id = useFrameParam("id", "c1");
  return <Profile key={id} candidate={candidateById(id)} />;
}

function Profile({ candidate: c }: { candidate: Candidate }) {
  const job = jobById(c.jobId);
  const cards = scorecardsOf(c.id);
  const criteria = job.criteria.map((k) => k.label);
  const avg = (i: number) => {
    const v = cards.map((s) => s.scores[i]).filter(Boolean);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const overall = cards.length ? job.criteria.reduce((s, k, i) => s + avg(i) * (k.weight / 100), 0) : null;
  const recommend = cards.filter((s) => s.verdict !== "nao").length;
  const [stage, setStage] = useState(c.stage);
  const [tab, setTab] = useState("avaliacoes");
  const [confirm, setConfirm] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [when, setWhen] = useState(iso(3));
  const [who, setWho] = useState(job.manager);
  const [outcome, setOutcome] = useState<{ tone: "ok" | "bad"; label: string } | undefined>(c.status === "reprovado" ? { tone: "bad", label: "Reprovado(a)" } : c.status === "contratado" ? { tone: "ok", label: "Contratado(a)" } : undefined);
  const [extra, setExtra] = useState<{ id: string; title: string; meta: string; tone: "accent"; body: string }[]>([]);
  const first = c.name.split(" ")[0];
  const idx = stages.findIndex((s) => s.id === stage);
  const events = interviewsOf(c.id);

  return (
    <TalentosShell section="candidatos">
      <Page>
        <PageHeading
          crumbs={[
            { label: "Vagas", href: "#/frame/ats-jobs" },
            { label: job.short, href: `#/frame/ats-pipeline?id=${job.id}` },
          ]}
          title={c.name}
          description={`${c.headline} · ${c.city}`}
          actions={
            <>
              <Button variant="ghost" onClick={() => setConfirm(true)} disabled={!!outcome}>
                Reprovar
              </Button>
              <Button variant="ghost" onClick={() => setSchedule(true)} disabled={!!outcome}>
                <CalendarPlus /> Agendar
              </Button>
              {stage === "proposta" ? (
                <Button onClick={() => go("ats-offers", { candidato: c.id })} disabled={!!outcome}>
                  <FileSignature /> Proposta
                </Button>
              ) : (
                <Button
                  disabled={!!outcome}
                  onClick={() => {
                    const next = stages[idx + 1];
                    setStage(next.id);
                    notify(`${first} avançou para ${next.label}`, () => setStage(stages[idx].id));
                  }}
                >
                  Avançar etapa
                </Button>
              )}
            </>
          }
        />
        <StagePath
          className="mt-5"
          stages={stages.map((s) => ({ id: s.id, label: s.label }))}
          current={stage}
          outcome={outcome}
          label="Etapa do processo"
          onSelect={outcome ? undefined : (s) => {
            const before = stage;
            setStage(s as Candidate["stage"]);
            notify(`${first} movido(a) para ${stageLabel(s)}`, () => setStage(before));
          }}
        />
        <div className="mt-8">
          <SplitLayout
            asideWidth={320}
            main={
              <>
                <Tabs
                  label="Seções do candidato"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "avaliacoes", label: `Avaliações${cards.length ? ` · ${cards.length}` : ""}` },
                    { id: "curriculo", label: "Currículo" },
                  ]}
                />
                {tab === "avaliacoes" ? (
                  cards.length === 0 ? (
                    <div className="mt-5">
                      <Empty
                        title="Nenhuma avaliação ainda"
                        hint={`As avaliações aparecem aqui depois de cada entrevista. ${stage === "triagem" ? "Avance para a Entrevista RH para começar." : "Peça para quem entrevistou preencher o modelo da vaga."}`}
                        action={
                          <Button size="sm" variant="ghost" onClick={() => notify("Lembrete enviado para os entrevistadores", undefined, "info")}>
                            Pedir avaliação
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <div className="mt-5 space-y-6">
                      <section className="rounded-xl border border-line bg-surface">
                        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                          <div>
                            <h2 className="m-0 text-[14px] font-medium">Resumo por critério</h2>
                            <p className="m-0 mt-0.5 text-[12px] text-muted">
                              Média de {cards.length} avaliaç{cards.length === 1 ? "ão" : "ões"} · pesos do modelo da vaga
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-[22px] font-semibold tabular-nums tracking-tight">{(overall ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</div>
                            <div className="text-[11.5px] text-muted">
                              de 5 · {recommend} de {cards.length} recomendam
                            </div>
                          </div>
                        </header>
                        <div className="grid items-center gap-2 border-b border-line px-5 py-4 md:grid-cols-[260px_minmax(0,1fr)]">
                          <RadarChart
                            axes={criteria.map((k) => k.split(" ")[0])}
                            series={[
                              { label: first, values: criteria.map((_, i) => avg(i)) },
                              { label: "Perfil da vaga", values: job.criteria.map((k) => k.expected), dashed: true, color: "var(--ds-accent)" },
                            ]}
                            size={240}
                            label={`Perfil de ${first} comparado ao perfil da vaga`}
                          />
                          <p className="m-0 text-[13px] leading-relaxed text-ink-soft">
                            {(() => {
                              const below = job.criteria.map((k, i) => ({ k, v: avg(i) })).filter((x) => x.v && x.v < x.k.expected);
                              return below.length ? (
                                <>
                                  Abaixo do esperado em{" "}
                                  {below.map((b, i) => (
                                    <span key={b.k.label}>
                                      <span className="font-medium text-ink">
                                        {b.k.label.toLowerCase()} ({b.v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })})
                                      </span>
                                      {i < below.length - 1 ? ", " : ""}
                                    </span>
                                  ))}
                                  : vale aprofundar na próxima conversa.
                                </>
                              ) : (
                                "Dentro ou acima do perfil esperado em todos os critérios avaliados."
                              );
                            })()}
                          </p>
                        </div>
                        <ul className="list-none divide-y divide-line p-0">
                          {criteria.map((k, i) => (
                            <li key={k} className="flex items-center gap-4 px-5 py-2.5">
                              <span className="min-w-0 flex-1 text-[13px]">{k}</span>
                              <span className="hidden text-[11.5px] tabular-nums text-muted sm:inline">peso {job.criteria[i].weight} %</span>
                              <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-soft sm:block">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${(avg(i) / 5) * 100}%` }} />
                              </div>
                              <span className="w-8 text-right text-[13px] font-medium tabular-nums">{avg(i) ? avg(i).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "—"}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                      {cards.map((s) => {
                        const v = verdictInfo[s.verdict];
                        const p = person(s.interviewer);
                        return (
                          <section key={s.id} className="rounded-xl border border-line bg-surface px-5 py-4">
                            <header className="flex flex-wrap items-center gap-3">
                              <Avatar initials={p.initials} tint={p.tint} name={p.name} />
                              <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-medium">{p.name}</div>
                                <div className="text-[12px] text-muted">
                                  {s.stage} · {shortDate(s.date)}
                                </div>
                              </div>
                              <Badge tone={v.tone} icon={s.verdict === "nao" ? <ThumbsDown /> : <ThumbsUp />}>
                                {v.label}
                              </Badge>
                            </header>
                            <p className="m-0 mt-3 text-[13px] leading-relaxed text-ink-soft">{s.note}</p>
                            <dl className="m-0 mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                              {criteria.map((k, i) => (
                                <div key={k} className="flex items-center justify-between gap-3">
                                  <dt className="truncate text-[12px] text-muted">{k}</dt>
                                  <dd className="m-0">
                                    <Score value={s.scores[i] ?? 0} />
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </section>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="mt-5 space-y-5">
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                    <ol className="list-none space-y-4 p-0">
                      {c.experience.map((e) => (
                        <li key={e.company + e.period} className="rounded-xl border border-line bg-surface px-5 py-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div className="text-[14px] font-medium">
                              {e.role} · <span className="text-ink-soft">{e.company}</span>
                            </div>
                            <div className="text-[12px] tabular-nums text-muted">{e.period}</div>
                          </div>
                          <p className="m-0 mt-1.5 text-[13px] leading-relaxed text-ink-soft">{e.body}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar initials={c.initials} tint={c.tint} size="lg" name={c.name} />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">{c.name}</div>
                      <div className="truncate text-[12px] text-muted">{c.email}</div>
                    </div>
                  </div>
                  <PropertyList
                    items={[
                      { label: "Vaga", value: <a className="inline-flex min-h-6 items-center text-blue hover:underline" href={`#/frame/ats-job?id=${job.id}`}>{job.short}</a> },
                      { label: "Origem", value: c.referral ? `Indicação de ${c.referral}` : c.source },
                      { label: "Pretensão", value: formatCurrency(c.salaryExpectation, { cents: false }), hint: c.salaryExpectation > job.salary[1] ? "acima da faixa da vaga" : "CLT · mensal" },
                      { label: "Disponibilidade", value: c.notice },
                      { label: "Telefone", value: c.phone },
                    ]}
                  />
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => notify(`Baixando currículo de ${first} (PDF)`, undefined, "info")}>
                      <Download /> Currículo
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1" href={`mailto:${c.email}`}>
                      <Mail /> E-mail
                    </Button>
                  </div>
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <h2 className="m-0 mb-4 text-[13px] font-medium">Entrevistas</h2>
                  <Timeline
                    items={[
                      ...extra,
                      ...events.map((i) => ({
                        id: i.id,
                        title: i.kind,
                        meta: `${shortDate(i.date)} · ${i.time}`,
                        tone: (i.state === "agendada" ? "accent" : i.feedback === "pendente" ? "warn" : "ok") as "accent" | "warn" | "ok",
                        body: `${i.interviewers.map((p) => person(p).name).join(", ")} · ${i.where}${i.feedback === "pendente" ? " · avaliação pendente" : ""}`,
                      })),
                      { id: "applied", title: "Candidatura recebida", meta: shortDate(c.appliedAt), tone: "neutral" as const },
                    ]}
                  />
                </section>
              </>
            }
          />
        </div>
      </Page>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Reprovar ${c.name}?`}
        description="Sai do processo desta vaga e recebe o e-mail de retorno padrão em 24 horas. Você pode reabrir a candidatura depois."
        confirmLabel="Reprovar"
        tone="danger"
        onConfirm={() => {
          setConfirm(false);
          setOutcome({ tone: "bad", label: "Reprovado(a)" });
          notify(`${first} reprovado(a)`, () => setOutcome(undefined), "info");
        }}
      />
      <Modal
        open={schedule}
        onClose={() => setSchedule(false)}
        title={`Agendar entrevista com ${first}`}
        description={`${stageLabel(stage)} · o convite vai por e-mail com o link da sala.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSchedule(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setSchedule(false);
                setExtra((e) => [{ id: `n${e.length}`, title: stageLabel(stage), meta: `${shortDate(when)} · 14:00`, tone: "accent", body: `${person(who).name} · Google Meet` }, ...e]);
                notify(`Entrevista marcada para ${shortDate(when)} às 14:00`);
              }}
            >
              Enviar convite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldBlock label="Data">
            <DatePicker label="Data da entrevista" value={when} onValueChange={setWhen} min={iso(0)} />
          </FieldBlock>
          <Select label="Entrevistador(a)" value={who} onValueChange={setWho} options={team.map((p) => ({ value: p.id, label: p.name, description: p.role }))} />
        </div>
      </Modal>
    </TalentosShell>
  );
}
