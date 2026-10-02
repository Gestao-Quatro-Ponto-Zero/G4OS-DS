import { Archive, CheckCircle2, Copy, FlaskConical, History, Pause, PencilLine, Play, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  ActionMenu,
  AgentPlan,
  AppIcon,
  Badge,
  Button,
  Callout,
  ChartCard,
  ConfirmDialog,
  DataTable,
  HealthDot,
  IconButton,
  LineChart,
  LocationTag,
  Meter,
  MiniBarChart,
  Page,
  PageHeading,
  ProjectProgressCard,
  PropertyList,
  RevisionTimeline,
  SplitLayout,
  StackedList,
  StatCell,
  StatGrid,
  Tabs,
  Timeline,
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  formatPercent,
  notify,
  type Column,
  type PlanStep,
  type Revision,
  type TimelineItem,
} from "@g4ai/ds";
import {
  TODAY,
  agentById,
  agentStatusLabel,
  agentStatusTone,
  agents,
  approvalPolicies,
  budgetUse,
  modelById,
  ownerOfAgent,
  personOf,
  presenceOf,
  runWhen,
  runsOf,
  suiteScore,
  suitesOf,
  triggerKindLabel,
  type AgentStatus,
  type FleetAgent,
  type Run,
} from "./data/agents";
import { AgentShell, RunStatusLabel, agentRoutes } from "./shells/agent-shell";
import { frameHref, go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página do agente",
  description: "Registro de um agente (?id=): status, pausar/retomar com confirmação, editar no construtor; abas Visão geral (KPIs, fluxo padrão, rollout da próxima versão, região, quem acompanha), Versões (dial de revisões + changelog, restaurar), Execuções, Avaliações e Permissões; propriedades fixas à direita.",
  category: "IA",
  order: 10.5,
  height: 1240,
  concept: {
    goal: "Dar ao dono de um agente tudo o que ele precisa para confiar, evoluir e responder pelo agente: o que faz, como está indo, o que mudou e o que pode acessar.",
    patterns: [
      "Anatomia C · Registro: trilha 'Agentes', título, status e ações fixos; propriedades em SplitLayout à direita",
      "Ações mudam com o estado: Pausar (com ConfirmDialog) × Retomar; Editar abre o construtor",
      "Fluxo padrão em AgentPlan recolhível; passos que pedem aprovação marcados",
      "Rollout da próxima versão como ProjectProgressCard com o próximo passo",
      "Versões: RevisionTimeline (dial por dia) + Timeline com `leading` como changelog; restaurar pede confirmação",
      "Região de execução com LocationTag (hora local) e aviso de LGPD fora do Brasil",
    ],
    adapt: [
      "Página de uma automação, integração ou robô de RPA",
      "Sem versões? Troque a aba por 'Histórico de alterações' (log de auditoria)",
    ],
    avoid: [
      "Pausar sem dizer o que acontece com o que está na fila",
      "Permissões escondidas em outra tela: quem é dono precisa ver o que o agente pode tocar",
      "Restaurar versão sem confirmação (muda o comportamento em produção)",
    ],
  },
} as const;

const accessTone = { leitura: "neutral", escrita: "info", "escrita com aprovação": "warn" } as const;

function planOf(a: FleetAgent): PlanStep[] {
  return a.flow.map((f, i) => ({
    id: f.id,
    label: f.title,
    status: "done",
    durationMs: f.ms,
    detail: f.approval ? "Pede aprovação humana" : f.tool && !f.title.startsWith(f.tool) ? f.tool : undefined,
    defaultOpen: i === 0,
    content: (
      <span className="block text-[12.5px] leading-relaxed text-ink-soft">
        {f.note ?? (f.kind === "thinking" ? "Raciocínio do modelo, sem chamar ferramentas." : f.tool ? `Chama ${f.tool}.` : "Gera a saída do agente.")}
        {f.approval && " Espera alguém do time aprovar antes de agir."} Média de {formatNumber(f.tokens)} tokens.
      </span>
    ),
  }));
}

export default function AiAgent() {
  const id = useFrameParam("id", "sdr-inbound");
  const base = agentById(id) ?? agents[0];
  return <AgentRecord key={base.id} base={base} />;
}

function AgentRecord({ base }: { base: FleetAgent }) {
  const [status, setStatus] = useState<AgentStatus>(base.status);
  const [prod, setProd] = useState(base.version);
  const [tab, setTab] = useState("visao");
  const [confirm, setConfirm] = useState<null | "pausar" | "arquivar" | { restore: string }>(null);
  const a = base;
  const owner = ownerOfAgent(a);
  const model = modelById(a.model);
  const agentRuns = runsOf(a.id);
  const suites = suitesOf(a.id);
  const total7 = a.runs7d.reduce((s, n) => s + n, 0);
  const days = ["24", "25", "26", "27", "28", "29", "30"];

  const revisions: Revision[] = a.versions.map((v) => ({
    id: v.version,
    date: v.date,
    time: v.time,
    title: `v${v.version} · ${v.title}`,
    author: personOf(v.author).name,
    kind: v.kind,
    tag: v.version === prod ? <Badge tone="ok">Em produção</Badge> : v.stage === "canario" ? <Badge tone="info">Canário</Badge> : v.stage === "rascunho" ? <Badge>Rascunho</Badge> : undefined,
    content: (
      <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-ink-soft">
        {v.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    ),
  }));

  const changelog: TimelineItem[] = a.versions.map((v) => ({
    id: v.version,
    current: v.version === prod,
    tone: v.version === prod ? "ok" : v.stage === "canario" ? "info" : "neutral",
    leading: (
      <span className="block leading-tight">
        <span className="block font-mono text-[12.5px] font-medium text-ink">v{v.version}</span>
        <span className="block text-[12px] text-muted">{formatDate(v.date, { short: true })}</span>
      </span>
    ),
    title: v.title,
    meta: `${personOf(v.author).name} · ${v.score != null ? `avaliação ${formatPercent(v.score, 0)}` : "sem avaliação"}`,
    body: (
      <div>
        <ul className="m-0 list-disc space-y-0.5 pl-5 text-[13px] text-ink-soft">
          {v.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        {v.version !== prod && v.stage === "anterior" && (
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setConfirm({ restore: v.version })}>
            <History /> Restaurar esta versão
          </Button>
        )}
      </div>
    ),
  }));

  const runColumns: Column<Run>[] = [
    {
      key: "subject",
      header: "Execução",
      primary: true,
      cell: (r) => (
        <span className="block min-w-0 leading-tight">
          <span className="block truncate font-medium">{r.subject}</span>
          <span className="block font-mono text-[11.5px] font-normal text-muted">
            {r.id} · v{r.version}
          </span>
        </span>
      ),
    },
    { key: "status", header: "Status", nowrap: true, cell: (r) => <RunStatusLabel status={r.status} /> },
    { key: "start", header: "Início", nowrap: true, cell: (r) => <span className="tabular-nums text-muted">{runWhen(r.startedAt)}</span> },
    { key: "duration", header: "Duração", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{formatDuration(r.durationMs)}</span> },
    { key: "cost", header: "Custo", align: "right", nowrap: true, cell: (r) => <span className="tabular-nums">{formatCurrency(r.cost)}</span> },
  ];

  const people = [...new Set([a.owner, ...a.editors, ...a.watchers])].map((pid) => {
    const p = personOf(pid);
    const role = pid === a.owner ? "Dono" : a.editors.includes(pid) ? "Editor" : "Acompanha";
    return { id: p.id, name: p.name, initials: p.initials, tint: p.tint, status: presenceOf(p), description: p.title || p.email, meta: <Badge>{role}</Badge>, keywords: p.email };
  });

  const scoreSeries = a.versions
    .filter((v) => v.score != null)
    .slice()
    .reverse()
    .map((v) => ({ versao: `v${v.version}`, score: Math.round((v.score ?? 0) * 1000) / 10 }));

  return (
    <AgentShell current={agentRoutes.agents}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Agentes", href: agentRoutes.agents }]}
          title={a.name}
          description={a.purpose}
          actions={
            <>
              {status === "pausado" ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatus("ativo");
                    notify(`${a.name} retomado · ${a.trigger.text.toLowerCase()} volta a disparar`, () => setStatus("pausado"));
                  }}
                >
                  <Play /> Retomar
                </Button>
              ) : (
                <Button variant="ghost" disabled={status === "rascunho"} disabledReason="Rascunho não roda: publique antes" onClick={() => setConfirm("pausar")}>
                  <Pause /> Pausar
                </Button>
              )}
              <Button href={frameHref("ai-agent-builder", a.id)}>
                <PencilLine /> Editar agente
              </Button>
              <ActionMenu
                actions={[
                  { label: "Ver todas as execuções", icon: <History className="h-4 w-4" />, onSelect: () => go("ai-runs", { agente: a.id }) },
                  { label: "Ver avaliações", icon: <FlaskConical className="h-4 w-4" />, onSelect: () => go("ai-agent-evals", { agente: a.id }) },
                  { label: "Duplicar como rascunho", icon: <Copy className="h-4 w-4" />, onSelect: () => go("ai-agent-builder", { de: a.id }) },
                  { label: "Arquivar agente", icon: <Archive className="h-4 w-4" />, tone: "danger", separator: true, onSelect: () => setConfirm("arquivar") },
                ]}
              />
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-muted">
          <HealthDot tone={agentStatusTone[status]} label={agentStatusLabel[status]} />
          <span className="tabular-nums">{prod ? `v${prod} em produção` : "nunca publicado"}</span>
          <span>{model.name}</span>
          <span>
            {triggerKindLabel[a.trigger.kind]} · {a.trigger.text}
          </span>
        </div>

        {(status === "erro" || status === "pausado" || budgetUse(a) > 0.9 || !a.region.brazil) && a.issue && (
          <div className="mt-4">
          <Callout
            tone={status === "erro" ? "bad" : "warn"}
            title={status === "erro" ? "Execuções falhando" : status === "pausado" ? "Agente pausado" : budgetUse(a) > 0.9 ? "Orçamento quase no fim" : "Dados pessoais fora do Brasil"}
            action={
              status === "erro" ? (
                <Button size="sm" variant="ghost" href={frameHref("ai-agent-run", agentRuns.find((r) => r.status === "falhou")?.id ?? "")}>
                  Ver última falha
                </Button>
              ) : budgetUse(a) > 0.9 || !a.region.brazil ? (
                <Button size="sm" variant="ghost" href={frameHref("ai-agent-governance", { secao: budgetUse(a) > 0.9 ? "orcamento" : "dados" })}>
                  Abrir governança
                </Button>
              ) : undefined
            }
          >
            {status === "pausado" && a.issue.startsWith("Pausado") ? a.issue : status === "pausado" ? `Pausado. ${a.issue}` : a.issue}
          </Callout>
          </div>
        )}

        <div className="mt-6">
          <SplitLayout
            asideWidth={340}
            main={
              <>
                <Tabs
                  label="Seções do agente"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "visao", label: "Visão geral" },
                    { id: "versoes", label: "Versões" },
                    { id: "execucoes", label: "Execuções" },
                    { id: "avaliacoes", label: "Avaliações", count: suites.filter((s) => suiteScore(s) < s.threshold).length || undefined },
                    { id: "permissoes", label: "Permissões" },
                  ]}
                />
                <div className="mt-5 space-y-6">
                  {tab === "visao" && (
                    <>
                      <StatGrid cols={4}>
                        <StatCell label="Execuções (30 dias)" value={formatNumber(a.runs30d)} hint={`${formatNumber(total7)} nos últimos 7`} />
                        <StatCell label="Sucesso" value={a.runs30d ? formatPercent(a.successRate) : "—"} tone={a.successRate < 0.9 ? "bad" : undefined} hint="concluídas sem erro" />
                        <StatCell label="Latência p95" value={formatDuration(a.p95Ms)} hint="95 % terminam antes" />
                        <StatCell label="Custo no mês" value={formatCurrency(a.cost30d, { cents: false })} tone={budgetUse(a) > 0.9 ? "warn" : undefined} hint={`${formatPercent(budgetUse(a), 0)} de ${formatCurrency(a.budget, { cents: false })}`} />
                      </StatGrid>
                      <div className="grid gap-4 md:grid-cols-2">
                        <MiniBarChart label="Execuções por dia" caption="24 a 30/09" height={180} data={a.runs7d.map((v, i) => ({ label: days[i], value: v }))} />
                        {a.rollout ? (
                          <ProjectProgressCard
                            title={`Rollout da v${a.rollout.version}`}
                            subtitle={a.versions.find((v) => v.version === a.rollout?.version)?.title}
                            owner={personOf(a.rollout.owner).name}
                            due={a.rollout.due}
                            late={a.rollout.late}
                            milestones={a.rollout.milestones}
                            action={
                              <Button size="sm" variant="ghost" onClick={() => notify(`v${a.rollout?.version} agora atende 50 % dos gatilhos`, () => undefined)}>
                                Liberar para 50 %
                              </Button>
                            }
                          />
                        ) : (
                          <section className="flex flex-col justify-center rounded-xl border border-line bg-surface p-4">
                            <p className="m-0 flex items-center gap-1.5 text-[13px] font-medium">
                              <CheckCircle2 className="h-4 w-4 text-ok" /> Nenhuma versão nova em rollout
                            </p>
                            <p className="m-0 mt-1 text-[12.5px] text-muted">Mudanças publicadas no construtor entram como canário para 10 % dos gatilhos antes de ir para todos.</p>
                          </section>
                        )}
                      </div>
                      <AgentPlan collapsible title={`Fluxo padrão · ${a.flow.length} passos`} steps={planOf(a)} />
                    </>
                  )}

                  {tab === "versoes" && (
                    <>
                      <RevisionTimeline revisions={revisions} today={TODAY} padDays={10} futureDays={5} label={`Revisões de ${a.name}`} />
                      <section>
                        <h2 className="m-0 mb-3 text-[15px] font-medium">Changelog</h2>
                        <Timeline items={changelog} leadingWidth={88} />
                      </section>
                    </>
                  )}

                  {tab === "execucoes" && (
                    <section className="space-y-3">
                      <DataTable
                        label={`Execuções de ${a.name}`}
                        rows={agentRuns}
                        columns={runColumns}
                        rowKey={(r) => r.id}
                        onRowClick={(r) => go("ai-agent-run", r.id)}
                        rowLabel={(r) => `Abrir execução ${r.id}`}
                        rowTone={(r) => (r.status === "falhou" ? "bad" : undefined)}
                        empty={<p className="m-0 px-4 py-8 text-center text-[13px] text-muted">Nenhuma execução recente. O agente roda quando: {a.trigger.text.toLowerCase()}.</p>}
                      />
                      <Button size="sm" variant="ghost" href={frameHref("ai-runs", { agente: a.id })}>
                        Ver todas as execuções
                      </Button>
                    </section>
                  )}

                  {tab === "avaliacoes" && (
                    <>
                      {scoreSeries.length > 1 ? (
                        <ChartCard title="A qualidade subiu a cada versão?" description="Score médio das suítes por versão publicada · %">
                          <LineChart label={`Score de avaliação de ${a.name} por versão`} data={scoreSeries} index="versao" series={[{ key: "score", label: "Score" }]} reference={{ value: 90, label: "Mínimo para publicar" }} height={220} format={(n) => `${formatNumber(n, 1)} %`} dots />
                        </ChartCard>
                      ) : null}
                      {suites.length ? (
                        <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                          {suites.map((s) => {
                            const score = suiteScore(s);
                            const below = score < s.threshold;
                            return (
                              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                                <div className="min-w-0 flex-1">
                                  <p className="m-0 text-[13.5px] font-medium">{s.name}</p>
                                  <p className="m-0 text-[12px] text-muted">
                                    {s.passed} de {s.cases} casos · mínimo {formatPercent(s.threshold, 0)} · {runWhen(s.lastRunAt)}
                                  </p>
                                </div>
                                <div className="w-32">
                                  <Meter value={score * 100} tone={below ? "bad" : "ok"} label={`Score ${formatPercent(score, 0)}`} />
                                </div>
                                <span className={below ? "w-12 text-right text-[13px] font-medium tabular-nums text-rose" : "w-12 text-right text-[13px] tabular-nums"}>{formatPercent(score, 0)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <Callout tone="info" title="Sem suíte de avaliação">
                          Crie casos de teste antes de publicar a primeira versão: o construtor roda as avaliações a cada mudança.
                        </Callout>
                      )}
                      <Button variant="ghost" href={frameHref("ai-agent-evals", { agente: a.id })}>
                        <FlaskConical /> Abrir avaliações
                      </Button>
                    </>
                  )}

                  {tab === "permissoes" && (
                    <>
                      <section>
                        <h2 className="m-0 text-[15px] font-medium">Ferramentas e o que pode fazer</h2>
                        <p className="m-0 mt-0.5 text-[12.5px] text-muted">Escrita com aprovação = o agente prepara, uma pessoa confirma.</p>
                        <ul className="m-0 mt-3 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                          {a.tools.map((t) => (
                            <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="min-w-0 flex-1 text-[13.5px]">{t.label}</span>
                              <Badge tone={accessTone[t.access]}>{t.access === "leitura" ? "Só leitura" : t.access === "escrita" ? "Leitura e escrita" : "Escrita com aprovação"}</Badge>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h2 className="m-0 text-[15px] font-medium">Dados que acessa</h2>
                        <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-[13.5px] text-ink-soft">
                          {a.data.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <h2 className="m-0 text-[15px] font-medium">Quem pode editar</h2>
                            <p className="m-0 mt-0.5 text-[12.5px] text-muted">Editores publicam versões novas; só o dono arquiva.</p>
                          </div>
                          <Button size="sm" variant="ghost" href={frameHref("settings-roles")}>
                            <ShieldCheck /> Papéis e permissões
                          </Button>
                        </div>
                        <ul className="m-0 mt-3 list-none divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface p-0">
                          {[a.owner, ...a.editors.filter((e) => e !== a.owner)].map((pid) => {
                            const p = personOf(pid);
                            return (
                              <li key={pid} className="flex items-center gap-3 px-4 py-2.5">
                                <AppIcon letter={p.initials} color={p.tint} size="sm" variant="soft" label={p.name} />
                                <span className="min-w-0 flex-1 text-[13.5px]">
                                  {p.name}
                                  <span className="block text-[12px] text-muted">{p.title}</span>
                                </span>
                                <Badge>{pid === a.owner ? "Dono" : "Editor"}</Badge>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                      <section>
                        <h2 className="m-0 text-[15px] font-medium">Políticas de aprovação que valem para ele</h2>
                        <ul className="m-0 mt-2 list-none space-y-2 p-0">
                          {approvalPolicies
                            .filter((p) => p.mode !== "nunca")
                            .slice(0, 3)
                            .map((p) => (
                              <li key={p.id} className="rounded-xl border border-line bg-surface px-4 py-3 text-[13px]">
                                <span className="font-medium">{p.label}</span>
                                <span className="block text-[12px] text-muted">
                                  {p.mode === "sempre" ? "Sempre pede aprovação" : `Pede aprovação acima de ${formatCurrency(p.threshold ?? 0, { cents: false })}`} · {p.approver}
                                </span>
                              </li>
                            ))}
                        </ul>
                        <Button size="sm" variant="ghost" className="mt-2" href={frameHref("ai-agent-governance", { secao: "aprovacao" })}>
                          Editar políticas
                        </Button>
                      </section>
                    </>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="m-0 text-[13px] font-medium">Detalhes</h2>
                    <Button size="sm" variant="quiet" href={frameHref("ai-agent-builder", a.id)}>
                      Editar
                    </Button>
                  </div>
                  <PropertyList
                    items={[
                      { label: "Dono", value: owner.name, hint: owner.title },
                      { label: "Área", value: a.area },
                      { label: "Modelo", value: model.name, hint: model.provider },
                      { label: "Versão", value: prod ? `v${prod}` : "Rascunho", hint: a.rollout ? `v${a.rollout.version} em canário` : undefined },
                      { label: "Gatilho", value: a.trigger.text },
                      {
                        label: "Orçamento",
                        value: (
                          <span className="block">
                            <span className="tabular-nums">
                              {formatCurrency(a.cost30d, { cents: false })} de {formatCurrency(a.budget, { cents: false })}
                            </span>
                            <span className="mt-1.5 block"><Meter value={Math.min(100, budgetUse(a) * 100)} tone={budgetUse(a) > 0.9 ? "warn" : "ink"} label="Orçamento do mês usado" /></span>
                          </span>
                        ),
                      },
                      { label: "Criado em", value: formatDate(a.createdAt) },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <h2 className="m-0 mb-2 text-[13px] font-medium">Onde roda</h2>
                  <LocationTag place={a.region.place} timeZone={a.region.timeZone} status={a.region.brazil ? { label: "Dados no Brasil", tone: "ok" } : { label: "Fora do Brasil", tone: "warn" }} href={frameHref("ai-agent-governance", { secao: "dados" })} />
                  <p className="m-0 mt-2 text-[12px] text-muted">{a.region.dc}</p>
                </section>
                <StackedList
                  title="Quem acompanha"
                  items={people}
                  directoryLabel="Pessoas com acesso"
                  directoryHint={`${people.length} pessoas · dono, editores e quem recebe avisos`}
                  emptyFeatured="Ninguém online agora. Avisos de falha vão por e-mail."
                  height={300}
                  action={
                    <IconButton label="Convidar para acompanhar" size="sm" onClick={() => go("settings-team")}>
                      <UserPlus />
                    </IconButton>
                  }
                />
              </>
            }
          />
        </div>

        <ConfirmDialog
          open={confirm === "pausar"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            setStatus("pausado");
            notify(`${a.name} pausado`, () => setStatus(base.status));
          }}
          title={`Pausar ${a.name}?`}
          description={`Ninguém perde dados: gatilhos novos (${a.trigger.text.toLowerCase()}) ficam na fila por até 72 h e rodam quando você retomar. Execuções em andamento terminam normalmente.`}
          confirmLabel="Pausar agente"
        />
        <ConfirmDialog
          open={confirm === "arquivar"}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            notify(`${a.name} arquivado`);
            go("ai-agents");
          }}
          title={`Arquivar ${a.name}?`}
          description="O agente para de rodar e sai da lista. Execuções e versões ficam guardadas por 12 meses para auditoria."
          confirmLabel="Arquivar agente"
          tone="danger"
        />
        <ConfirmDialog
          open={typeof confirm === "object" && confirm !== null}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (typeof confirm !== "object" || !confirm) return;
            const before = prod;
            setProd(confirm.restore);
            setConfirm(null);
            notify(`v${confirm.restore} restaurada em produção`, () => setProd(before));
          }}
          title={typeof confirm === "object" && confirm ? `Restaurar a v${confirm.restore}?` : "Restaurar versão?"}
          description={`A versão restaurada passa a atender 100 % dos gatilhos agora. A v${prod ?? "atual"} continua no histórico e pode voltar a qualquer momento.`}
          confirmLabel="Restaurar versão"
        />
      </Page>
    </AgentShell>
  );
}
