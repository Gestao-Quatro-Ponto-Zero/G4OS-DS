import { FlaskConical, Play } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  ChartCard,
  DataTable,
  Empty,
  EmptyFilterResult,
  FilterBar,
  HealthDot,
  Highlight,
  LineChart,
  Meter,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PageToolbar,
  Select,
  StatCell,
  StatGrid,
  TableSearch,
  formatNumber,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { agentById, agents, evalFailures, evalSuites, runWhen, suiteScore, type EvalFailure, type EvalSuite } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Avaliações de agentes",
  description: "Suítes de teste de cada agente: casos, score contra o mínimo para publicar, score por versão em gráfico, regressões, rodar avaliação (uma suíte ou todas) e casos que falharam com link para a execução. Cinco estados (?estado=).",
  category: "IA",
  order: 14,
  height: 1180,
  concept: {
    goal: "Saber se uma versão nova do agente ficou melhor ou pior antes de ela atender clientes, e achar o caso que quebrou.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar com filtros; gráfico do agente escolhido acima da tabela",
      "Score por versão em LineChart com linha de referência no mínimo para publicar",
      "Suíte abaixo do mínimo = palavra + cor na linha (regressão)",
      "Rodar avaliação com useOperation: o botão diz o que está fazendo",
      "Caso que falhou leva à execução, onde está o trace",
    ],
    adapt: [
      "Testes de regras de automação, validação de prompts, QA de integrações",
      "Fora de IA: suíte = conjunto de cenários; score = % aprovado",
    ],
    avoid: [
      "Score sem o mínimo ao lado (ninguém sabe se 87 % é bom)",
      "Falha sem link para o caso e a execução",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statusOf = (s: EvalSuite) => {
  const score = suiteScore(s);
  const prev = s.history[s.history.length - 2]?.score;
  if (score < s.threshold && prev != null && score < prev) return { label: "Regressão", tone: "bad" as const };
  if (score < s.threshold) return { label: "Abaixo do mínimo", tone: "warn" as const };
  return { label: "Passando", tone: "ok" as const };
};

const fields: FilterField<EvalSuite>[] = [
  { key: "agent", label: "Agente", type: "enum", quick: true, accessor: (s) => s.agentId, options: agents.filter((a) => evalSuites.some((s) => s.agentId === a.id)).map((a) => ({ value: a.id, label: a.name })) },
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (s) => statusOf(s).label, options: ["Passando", "Abaixo do mínimo", "Regressão"].map((v) => ({ value: v, label: v })) },
  { key: "cases", label: "Casos", type: "number", accessor: (s) => s.cases },
];

export default function AiAgentEvals() {
  const estado = useAgentDemoState();
  const visible = estado === "vazio" ? [] : evalSuites;
  const filters = useFilters(visible, { fields, search: (s) => [s.name, s.description, agentById(s.agentId)?.name] });
  const q = filters.state.query;
  const agentId = useFrameParam("agente", "sdr-inbound");
  const agent = agentById(agentId) ?? agents[0];
  const suites = evalSuites.filter((s) => s.agentId === agent.id);
  const [running, setRunning] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Record<string, string>>({});
  const all = useOperation({ busyLabel: "Rodando 9 suítes…" });
  const one = useOperation({ busyLabel: "Rodando…" });

  // Score médio por versão (só as suítes que existiam naquela versão).
  const chart = useMemo(() => {
    const versions = [...new Set(suites.flatMap((s) => s.history.map((h) => h.version)))];
    return versions.map((v) => {
      const hits = suites.flatMap((s) => s.history.filter((h) => h.version === v).map((h) => h.score));
      return { versao: `v${v}`, score: Math.round((hits.reduce((a, b) => a + b, 0) / Math.max(1, hits.length)) * 1000) / 10, suites: hits.length };
    });
  }, [suites]);

  const failures = evalFailures.filter((f) => !filters.state.conditions.length || filters.rows.some((s) => s.id === f.suiteId));
  const regressions = visible.filter((s) => statusOf(s).tone !== "ok");
  const totalCases = visible.reduce((s, x) => s + x.cases, 0);
  const passed = visible.reduce((s, x) => s + x.passed, 0);

  const runSuite = (s: EvalSuite) => {
    setRunning(s.id);
    void one.run(() => wait(1500), `${s.name}: ${s.passed} de ${s.cases} casos passaram`).then(() => {
      setRunning(null);
      setLastRun((l) => ({ ...l, [s.id]: "agora" }));
    });
  };

  const columns: Column<EvalSuite>[] = [
    {
      key: "name",
      header: "Suíte",
      primary: true,
      cell: (s) => (
        <span className="block min-w-0 leading-tight">
          <Highlight text={s.name} query={q} className="block truncate font-medium" />
          <span className="block truncate text-[12px] font-normal text-muted">{agentById(s.agentId)?.name}</span>
        </span>
      ),
    },
    { key: "cases", header: "Casos", align: "right", nowrap: true, mobileHidden: true, cell: (s) => <span className="tabular-nums text-muted">{formatNumber(s.cases)}</span> },
    {
      key: "score",
      header: "Score",
      nowrap: true,
      cell: (s) => {
        const st = statusOf(s);
        return (
          <span className="flex items-center gap-2">
            <span className="w-20">
              <Meter value={suiteScore(s) * 100} tone={st.tone === "ok" ? "ok" : st.tone === "bad" ? "bad" : "warn"} label={`Score ${formatPercent(suiteScore(s), 0)}`} />
            </span>
            <span className="w-11 text-right tabular-nums">{formatPercent(suiteScore(s), 0)}</span>
          </span>
        );
      },
    },
    { key: "min", header: "Mínimo", align: "right", nowrap: true, mobileHidden: true, cell: (s) => <span className="tabular-nums text-muted">{formatPercent(s.threshold, 0)}</span> },
    { key: "status", header: "Situação", nowrap: true, cell: (s) => <HealthDot tone={statusOf(s).tone} label={statusOf(s).label} /> },
    { key: "last", header: "Última execução", nowrap: true, mobileHidden: true, cell: (s) => <span className="tabular-nums text-muted">{lastRun[s.id] ?? runWhen(s.lastRunAt)}</span> },
    {
      key: "run",
      header: "",
      action: true,
      cell: (s) => (
        <Button size="sm" variant="ghost" disabled={!!running || all.busy} disabledReason="Outra avaliação está rodando" onClick={() => runSuite(s)}>
          <Play /> {running === s.id ? "Rodando…" : "Rodar"}
        </Button>
      ),
    },
  ];

  const failColumns: Column<EvalFailure>[] = [
    {
      key: "case",
      header: "Caso",
      primary: true,
      cell: (f) => (
        <span className="block min-w-0 leading-tight">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{f.title}</span>
            {f.isNew && <Badge tone="bad">Novo</Badge>}
          </span>
          <span className="block truncate text-[12px] font-normal text-muted">{evalSuites.find((s) => s.id === f.suiteId)?.name}</span>
        </span>
      ),
    },
    { key: "expected", header: "Esperado", cell: (f) => <span className="text-[13px] text-ink-soft">{f.expected}</span> },
    { key: "got", header: "O agente fez", cell: (f) => <span className="text-[13px]">{f.got}</span> },
    {
      key: "open",
      header: "",
      action: true,
      cell: (f) => (
        <Button size="sm" variant="ghost" href={frameHref("ai-agent-run", f.runId)}>
          Ver execução
        </Button>
      ),
    },
  ];

  return (
    <AgentShell current={agentRoutes.evals}>
      <Page>
        <PageHeading
          title="Avaliações"
          description="Casos de teste que cada versão precisa passar antes de atender clientes. Rodam sozinhas a cada publicação."
          actions={
            <OperationButton operation={all} onClick={() => void all.run(() => wait(2200), `9 suítes rodadas · ${regressions.length} abaixo do mínimo`)} disabled={!!running || !visible.length} disabledReason={!visible.length ? "Nenhuma suíte criada" : "Outra avaliação está rodando"}>
              <Play /> Rodar todas as suítes
            </OperationButton>
          }
        />
        <div className="space-y-6">
          <OperationFeedback operation={all} />
          <OperationFeedback operation={one} />
          {estado === "carregando" ? (
            <AgentListSkeleton rows={6} label="Carregando avaliações" />
          ) : estado === "erro" ? (
            <AgentListError noun="as avaliações" />
          ) : !visible.length ? (
            <Empty
              icon={<FlaskConical />}
              title="Nenhuma suíte de avaliação"
              hint="Comece com 20 casos reais de um agente (entrada e o resultado certo). O construtor sugere casos a partir das últimas execuções."
              action={<Button onClick={() => go("ai-agent-builder", { id: "sdr-inbound", secao: "avaliacoes" })}>Criar suíte</Button>}
            />
          ) : (
            <>
              <StatGrid cols={4}>
                <StatCell label="Suítes" value={visible.length} hint={`${agents.filter((a) => evalSuites.some((s) => s.agentId === a.id)).length} agentes cobertos`} />
                <StatCell label="Casos" value={formatNumber(totalCases)} hint={`${formatNumber(passed)} passando`} />
                <StatCell label="Score geral" value={formatPercent(passed / totalCases)} hint="média ponderada por casos" />
                <StatCell label="Abaixo do mínimo" value={regressions.length} tone={regressions.length ? "bad" : undefined} hint="bloqueiam a publicação" />
              </StatGrid>

              <ChartCard
                title={`${agent.name}: a qualidade subiu a cada versão?`}
                description={`Score médio das ${suites.length} suítes em cada versão testada · %`}
                action={
                  <Select
                    label="Agente"
                    hideLabel
                    size="compact"
                    value={agent.id}
                    onValueChange={(v) => setFrameQuery({ agente: v })}
                    options={agents.filter((a) => evalSuites.some((s) => s.agentId === a.id)).map((a) => ({ value: a.id, label: a.name }))}
                  />
                }
              >
                {suites.length ? (
                  <LineChart
                    label={`Score das suítes de ${agent.name} por versão`}
                    data={chart}
                    index="versao"
                    series={[{ key: "score", label: "Score médio" }]}
                    reference={{ value: Math.round(Math.max(...suites.map((s) => s.threshold)) * 100), label: "Mínimo para publicar" }}
                    format={(n) => `${formatNumber(n, 1)} %`}
                    height={240}
                    dots
                  />
                ) : (
                  <p className="m-0 py-10 text-center text-[13px] text-muted">Este agente ainda não tem suíte de avaliação.</p>
                )}
              </ChartCard>

              <PageToolbar>
                <FilterBar filters={filters} noun="suíte" search={<TableSearch value={q} onChange={filters.setQuery} total={visible.length} noun="suíte" searchIn="nome, descrição e agente" />} />
              </PageToolbar>
              <DataTable
                label="Suítes de avaliação"
                rows={filters.rows}
                columns={columns}
                rowKey={(s) => s.id}
                onRowClick={(s) => setFrameQuery({ agente: s.agentId })}
                rowLabel={(s) => `Ver gráfico de ${agentById(s.agentId)?.name}`}
                rowSelected={(s) => s.agentId === agent.id}
                rowTone={(s) => (statusOf(s).tone === "bad" ? "bad" : statusOf(s).tone === "warn" ? "warn" : undefined)}
                empty={<EmptyFilterResult filters={filters} noun="suíte" />}
              />

              <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="m-0 text-[15px] font-medium">Casos que falharam</h2>
                    <p className="m-0 mt-0.5 text-[12.5px] text-muted">Abra a execução para ver o passo a passo e o erro.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => notify(`${failures.length} casos enviados ao canal #agentes-qualidade`)}>
                    Avisar os donos
                  </Button>
                </div>
                <DataTable label="Casos que falharam" rows={failures} columns={failColumns} rowKey={(f) => f.id} empty={<p className="m-0 px-4 py-8 text-center text-[13px] text-muted">Nenhum caso falhando no recorte.</p>} />
              </section>
            </>
          )}
        </div>
      </Page>
    </AgentShell>
  );
}
