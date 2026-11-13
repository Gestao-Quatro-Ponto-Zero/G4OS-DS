import { FlaskConical, Play } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  ChartCard,
  DataTable,
  Empty,
  EvalCaseCompare,
  EvalDotGrid,
  EvalRunHeader,
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
  useReducedMotion,
  useVisibleInterval,
  type Column,
  type EvalCase,
  type EvalCaseDetail,
  type EvalCaseStatus,
  type EvalCategory,
  type FilterField,
} from "@g4ai/ds";
import { agentById, agents, evalFailures, evalSuites, runWhen, suiteScore, type EvalFailure, type EvalSuite } from "./data/agents";
import { AgentListError, AgentListSkeleton, AgentShell, agentRoutes, useAgentDemoState } from "./shells/agent-shell";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Avaliações de agentes",
  description: "Suítes de teste de cada agente: última execução caso a caso (grade de pontos por categoria com regressões e melhorias, filtros e comparação base × candidata com a rubrica do juiz), score contra o mínimo para publicar, score por versão em gráfico, rodar avaliação (uma suíte ou todas) e casos que falharam com link para a execução. Cinco estados (?estado=).",
  category: "IA",
  order: 14,
  height: 1180,
  concept: {
    goal: "Saber se uma versão nova do agente ficou melhor ou pior antes de ela atender clientes, e achar o caso que quebrou.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar com filtros; gráfico do agente escolhido acima da tabela",
      "Última execução: EvalRunHeader (candidata × base, juiz, score contra a base, últimas 8 execuções, custo e tempo) + EvalDotGrid (um ponto por caso, forma além da cor, setas percorrem) + EvalCaseCompare (entrada, base × candidata, rubrica com ✓/×)",
      "Rodar a suíte transmite caso a caso (só com a aba visível); movimento reduzido mostra o resultado de uma vez",
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
      "Resultado só por cor (regressão e falha precisam de forma e palavra)",
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

              <LatestEvalRun />

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

/* ------------------------------------------------------------------ */
/* Última execução: SDR de inbound v3.6 contra v3.5, caso a caso       */
/* ------------------------------------------------------------------ */

const CASES_PER_CATEGORY = 24;
const categorySpec: { id: string; label: string; baseline: number; marks: Partial<Record<number, EvalCaseStatus>>; titles: string[] }[] = [
  {
    id: "faixa",
    label: "Faixa do lead",
    baseline: 0.96,
    marks: { 5: "regression", 9: "improved", 17: "regression", 21: "fail" },
    titles: ["Diretor que pediu demonstração", "Estagiário pedindo material", "Empresa de 40 pessoas com urgência", "Lead de e-mail pessoal", "Gerente de TI comparando opções", "Rede de escolas com 1.200 funcionários"],
  },
  {
    id: "dup",
    label: "Duplicados",
    baseline: 0.92,
    marks: { 3: "fail", 14: "error" },
    titles: ["Mesmo e-mail, nome com acento", "Mesma empresa, outro contato", "CNPJ igual, razão social diferente", "Reenvio do formulário em 2 min"],
  },
  {
    id: "rota",
    label: "Roteamento",
    baseline: 0.88,
    marks: { 2: "regression", 7: "improved", 11: "fail", 15: "improved", 19: "fail" },
    titles: ["Lead do Sul em educação", "Conta estratégica já atendida", "Região sem executivo", "Lead em espanhol", "Executivo de férias"],
  },
  {
    id: "tom",
    label: "Tom do e-mail",
    baseline: 0.94,
    marks: { 4: "improved", 12: "improved", 20: "improved", 22: "fail" },
    titles: ["Primeiro contato formal", "Lead que reclamou do preço", "Pedido urgente", "Cliente antigo voltando"],
  },
  {
    id: "ferr",
    label: "Uso de ferramentas",
    baseline: 0.9,
    marks: { 6: "error", 13: "regression", 18: "fail" },
    titles: ["Agenda sem horário livre", "CRM fora do ar", "Lead sem CNPJ", "Busca na web sem resultado"],
  },
];

const finalCategories: EvalCategory[] = categorySpec.map((c) => ({
  id: c.id,
  label: c.label,
  baseline: c.baseline,
  cases: Array.from({ length: CASES_PER_CATEGORY }, (_, i) => ({ id: `${c.id}-${i + 1}`, title: `${c.titles[i % c.titles.length]} · caso ${i + 1}`, status: c.marks[i] ?? "pass" })),
}));
const finalCases = finalCategories.flatMap((c) => c.cases);
const TOTAL_CASES = finalCases.length;
const PASSED_FINAL = finalCases.filter((c) => c.status === "pass" || c.status === "improved").length;
const REGRESSIONS = finalCases.filter((c) => c.status === "regression").length;
// Ordem de chegada: intercalada entre categorias, para a grade se preencher por inteiro.
const arrival = new Map<string, number>();
finalCategories.forEach((c, ci) => c.cases.forEach((x, i) => arrival.set(x.id, i * finalCategories.length + ci)));

const crafted: Record<string, Omit<EvalCaseDetail, "id" | "title" | "category" | "status">> = {
  "faixa-6": {
    input: "Formulário /demo · Renata Prado, diretora de operações da Rede Vale Norte (1.200 funcionários): “Queremos ver a plataforma ainda este mês, temos orçamento aprovado.”",
    baseline: { label: "Base · v3.5", output: "Faixa A. Motivo: decisora, pediu demonstração, orçamento aprovado. Encaminhado a Bruno Takeda com 3 horários.", score: 1 },
    candidate: { label: "Candidata · v3.6", output: "Faixa B. Motivo: cargo de operações, não de compras. Enviado o material de apresentação.", score: 0.4 },
    criteria: [
      { label: "Faixa certa (A, B, C)", baseline: true, candidate: false },
      { label: "Considerou orçamento e urgência", baseline: true, candidate: false },
      { label: "Encaminhou ao executivo da região", baseline: true, candidate: false },
      { label: "Sem promessa de preço ou prazo", baseline: true, candidate: true },
    ],
    judge: { name: "G4 Analítico", note: "A v3.6 passou a pesar o cargo acima do pedido explícito de demonstração com orçamento. A instrução nova sobre “cargo de compras” parece ter causado a troca." },
  },
  "rota-8": {
    input: "Formulário /contato · Diego Paredes, Distribuidora Andina (Montevidéu): “Necesitamos una demo para 300 usuarios.”",
    baseline: { label: "Base · v3.5", output: "Encaminhado a Bruno Takeda (Sul). E-mail em português.", score: 0.5 },
    candidate: { label: "Candidata · v3.6", output: "Encaminhado a Lívia Monteiro (América Latina). E-mail em espanhol, valores em dólar.", score: 1 },
    criteria: [
      { label: "Executivo certo para a região", baseline: false, candidate: true },
      { label: "Idioma do lead", baseline: false, candidate: true },
      { label: "Encaminhou em menos de 5 min", baseline: true, candidate: true },
    ],
    judge: { name: "G4 Analítico", note: "A regra nova de América Latina resolveu o caso." },
  },
  "dup-15": {
    input: "Lead repetido · Carla Mendes, Grupo Aurora Alimentos. Mesmo e-mail de um lead de 12 dias atrás.",
    baseline: { label: "Base · v3.5", output: "Juntou ao lead LD-9874 e avisou a executiva.", score: 1 },
    candidate: { label: "Candidata · v3.6", output: "Erro: crm.buscar_lead não respondeu em 30 s. Nada foi feito.", score: 0 },
    criteria: [
      { label: "Encontrou o duplicado", baseline: true, candidate: false },
      { label: "Avisou o dono do lead", baseline: true, candidate: false },
    ],
    judge: { name: "G4 Analítico", note: "Erro de ferramenta, não de raciocínio. Rode de novo antes de tratar como regressão." },
  },
};

function detailOf(c: EvalCase, cat: EvalCategory): EvalCaseDetail {
  const base = { id: c.id, title: c.title, category: cat.label, status: c.status };
  const hand = crafted[c.id];
  if (hand) return { ...base, ...hand };
  const name = c.title.split(" · ")[0];
  const baseOk = c.status === "pass" || c.status === "regression";
  const candOk = c.status === "pass" || c.status === "improved";
  const right = `Resultado igual ao conferido pelo time de vendas para “${name.toLowerCase()}”.`;
  const wrong = c.status === "error" ? "Erro: a ferramenta não respondeu. Nada foi feito." : "Resultado diferente do conferido pelo time de vendas.";
  return {
    ...base,
    input: `${name}. Lead real anonimizado, com o resultado esperado conferido pelo time de vendas.`,
    baseline: { label: "Base · v3.5", output: baseOk ? right : "Resultado diferente do conferido pelo time de vendas.", score: baseOk ? 1 : 0.3 },
    candidate: { label: "Candidata · v3.6", output: candOk ? right : wrong, score: candOk ? 1 : c.status === "error" ? 0 : 0.3 },
    criteria: [
      { label: `${cat.label}: resultado esperado`, baseline: baseOk, candidate: candOk },
      { label: "Sem promessa de preço ou prazo", baseline: true, candidate: true },
    ],
    judge: { name: "G4 Analítico" },
  };
}

function LatestEvalRun() {
  const reduce = useReducedMotion();
  const [revealed, setRevealed] = useState(TOTAL_CASES);
  const [streaming, setStreaming] = useState(false);
  const [openId, setOpenId] = useState<string | null>("faixa-6");
  const done = useRef<(() => void) | null>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const op = useOperation({ busyLabel: "Rodando…" });

  const categories = useMemo<EvalCategory[]>(
    () => finalCategories.map((c) => ({ ...c, cases: c.cases.map((x) => ((arrival.get(x.id) ?? 0) < revealed ? x : { ...x, status: "pending" as const })) })),
    [revealed],
  );

  // Os resultados chegam caso a caso, só com a aba visível.
  useVisibleInterval(() => {
    const next = Math.min(TOTAL_CASES, revealed + 3);
    setRevealed(next);
    if (next >= TOTAL_CASES) {
      setStreaming(false);
      done.current?.();
      done.current = null;
    }
  }, streaming ? 90 : null);

  const ran = categories.flatMap((c) => c.cases).filter((c) => c.status !== "pending");
  const score = ran.length ? ran.filter((c) => c.status === "pass" || c.status === "improved").length / ran.length : null;

  const run = () =>
    void op.run(
      () =>
        new Promise<void>((resolve) => {
          setOpenId(null);
          if (reduce) {
            setRevealed(TOTAL_CASES);
            resolve();
            return;
          }
          done.current = resolve;
          setRevealed(0);
          setStreaming(true);
        }),
      `Qualificação de leads rodada · ${PASSED_FINAL} de ${TOTAL_CASES} casos passaram, ${REGRESSIONS} regressões`,
    );

  const openCat = openId ? categories.find((c) => c.cases.some((x) => x.id === openId)) : undefined;
  const openCase = openCat?.cases.find((x) => x.id === openId);

  return (
    <section aria-labelledby="ultima-execucao" className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="ultima-execucao" className="m-0 text-[15px] font-medium">
          Última execução
        </h2>
        <p className="m-0 text-[12.5px] text-muted">A versão nova do SDR de inbound contra a que está no ar. Abra um ponto para comparar as respostas.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="p-4 sm:p-5">
          <EvalRunHeader
            title="Qualificação de leads · SDR de inbound"
            candidate={{ label: "v3.6", model: "G4 Pro" }}
            baseline={{ label: "v3.5", model: "G4 Pro" }}
            judge="G4 Analítico"
            caseCount={TOTAL_CASES}
            score={score}
            baselineScore={0.94}
            history={[
              { label: "v2.0", score: 0.81 },
              { label: "v2.2", score: 0.84 },
              { label: "v3.0", score: 0.87 },
              { label: "v3.2", score: 0.88 },
              { label: "v3.3", score: 0.9 },
              { label: "v3.4", score: 0.93 },
              { label: "v3.5", score: 0.94 },
              { label: "v3.6", score: PASSED_FINAL / TOTAL_CASES },
            ]}
            cost={14.5}
            durationMs={180000}
            progress={streaming ? { done: revealed, total: TOTAL_CASES } : undefined}
            action={
              <OperationButton operation={op} variant="ghost" busyLabel={`Rodando ${revealed} de ${TOTAL_CASES}…`} onClick={run}>
                <Play /> Rodar
              </OperationButton>
            }
          />
        </div>
        <div className="grid border-t border-line xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="min-w-0 p-4 sm:p-5">
            <EvalDotGrid
              categories={categories}
              baselineLabel="v3.5"
              selectedId={openId ?? undefined}
              onOpenCase={(c) => {
                setOpenId(c.id);
                requestAnimationFrame(() => compareRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }));
              }}
              label="Casos da suíte Qualificação de leads"
            />
          </div>
          <div ref={compareRef} className="min-w-0 border-t border-line p-4 xl:border-l xl:border-t-0">
            {openCase && openCat ? (
              <EvalCaseCompare
                evalCase={detailOf(openCase, openCat)}
                onClose={() => setOpenId(null)}
                onAccept={(c) => notify(`Saída da v3.6 aceita como esperada em “${c.title}”`)}
                onOpenIssue={(c) => notify(`Chamado AG-1184 aberto para “${c.title}”`)}
              />
            ) : (
              <p className="m-0 py-8 text-center text-[13px] text-muted">{streaming ? "Os resultados chegam caso a caso." : "Escolha um ponto da grade para comparar a resposta da v3.5 com a da v3.6."}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
