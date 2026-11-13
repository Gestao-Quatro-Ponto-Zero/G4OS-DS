import { CalendarClock, Check, ClipboardCheck, Clock, Database, FileText, PencilLine, Radio, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import {
  AgentRunCard,
  AgentTrace,
  AiBadge,
  Badge,
  Button,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandMenu,
  IconButton,
  JsonView,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  StatCell,
  StatGrid,
  SystemMessage,
  Tabs,
  TokenUsageMeter,
  ToolCallsSection,
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  notify,
  useOperation,
  type AgentRunScript,
  type ToolCall,
  type TraceStep,
} from "@g4ai/ds";
import { agentById, agents, creditPlan, modelById, runById, runStatusLabel, runWhen, runs, traceOf, triggerKindLabel, type Run } from "./data/agents";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { frameHref, go, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Execução de agente",
  description: "Detalhe de uma execução (?id=): trace em cascata com o passo selecionado, entrada e saída, ferramentas usadas, custo e tokens, saída para aprovar, executar de novo e 'O que você quer fazer agora?' navegável por teclado. Ao vivo (?estado=ao-vivo): AgentRunCard com passos chegando, portão de aprovação com diff e resultado.",
  category: "IA",
  order: 12,
  height: 1120,
  concept: {
    goal: "Explicar uma execução do agente passo a passo para quem precisa auditar, aprovar o resultado ou corrigir o agente.",
    patterns: [
      "Anatomia C · Registro: trilha (Execuções › agente) + título fixos, trace em cascata no conteúdo",
      "Passo selecionado mostra entrada e saída lado a lado; falha com mensagem em linguagem de gente",
      "Custo, tokens e tempo sempre visíveis",
      "Executar de novo com useOperation (o botão informa enquanto roda)",
      "Fim da execução: 'O que você quer fazer agora?' com 3 opções numeradas (↑ ↓ Enter, 1–3, Esc) e campo livre",
      "Ao vivo (?estado=ao-vivo): AgentRunCard — passos chegam um a um (o atual brilha), o agente para num portão com o diff (Aprovar e aplicar / Devolver com comentário) e, ao concluir, os passos recolhem numa linha e aparece o resultado com as verificações",
    ],
    adapt: [
      "Logs de automação, jobs de integração, pipelines de dados",
      "Troque 'tokens' por 'registros processados' fora de IA",
    ],
    avoid: [
      "Mostrar só o resultado final sem como chegou nele",
      "Terminar a execução sem próximo passo (o usuário volta para a lista sem saber o que fazer)",
      "Agente que escreve (lançamentos, arquivos, e-mails) sem parar para aprovação com o diff à vista",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const kindLabel = { agent: "Agente", thinking: "Raciocínio", tool: "Ferramenta", search: "Busca", output: "Saída", error: "Erro" } as const;
const toolIcon = { tool: <Database />, search: <Search />, output: <FileText />, thinking: <Sparkles />, agent: <Sparkles />, error: <X /> } as const;

function flat(steps: TraceStep[], out: TraceStep[] = []) {
  steps.forEach((s) => {
    out.push(s);
    if (s.children) flat(s.children, out);
  });
  return out;
}

/** "O que você quer fazer agora?": opções numeradas + pedido livre, tudo por teclado. */
function NextActions({ agentId, agentName, onRerun, onDismiss }: { agentId: string; agentName: string; onRerun: () => void; onDismiss: () => void }) {
  const [q, setQ] = useState("");
  const options = [
    { id: "rerun", label: "Rodar de novo com a mesma entrada", hint: "Útil depois de corrigir um conector", icon: <RotateCcw />, run: onRerun },
    { id: "edit", label: "Alterar o agente", hint: `Abre ${agentName} no construtor: instruções, ferramentas e verificações`, icon: <PencilLine />, run: () => go("ai-agent-builder", agentId) },
    { id: "schedule", label: "Ajustar agenda ou gatilho", hint: "Quando e com que frequência o agente roda", icon: <CalendarClock />, run: () => go("ai-agent-builder", { id: agentId, secao: "gatilhos" }) },
  ];
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
      return;
    }
    if (!q && /^[1-3]$/.test(e.key)) {
      e.preventDefault();
      options[Number(e.key) - 1].run();
    }
  };
  return (
    <section aria-labelledby="next-title" className="rounded-xl border border-line bg-surface" onKeyDown={onKey}>
      <header className="flex items-center gap-2 px-4 pt-3.5">
        <h2 id="next-title" className="m-0 flex-1 text-[14px] font-medium">
          O que você quer fazer agora?
        </h2>
        <span className="hidden text-[12px] text-muted sm:inline">↑ ↓ para escolher · Enter · Esc dispensa</span>
        <IconButton label="Dispensar sugestões" size="sm" onClick={onDismiss}>
          <X />
        </IconButton>
      </header>
      <CommandMenu label="Próximo passo" value={q} onValueChange={setQ} filter={false} className="mt-2 rounded-none border-0 border-t border-line bg-transparent">
        <CommandList maxHeight={260}>
          {q.trim() ? (
            <CommandGroup heading="Pedir ao agente">
              <CommandItem value={`pedido ${q}`} icon={<Sparkles />} description="Abre o construtor com o seu pedido na conversa" onSelect={() => go("ai-agent-builder", { id: agentId, pedido: q.trim() })}>
                {q.trim()}
              </CommandItem>
            </CommandGroup>
          ) : (
            options.map((o, i) => (
              <CommandItem key={o.id} value={o.id} icon={o.icon} description={o.hint} shortcut={[String(i + 1)]} onSelect={o.run}>
                {o.label}
              </CommandItem>
            ))
          )}
        </CommandList>
        <CommandInput placeholder="Ou escreva o que fazer…" className="border-b-0 border-t" />
      </CommandMenu>
    </section>
  );
}

export default function AiAgentRun() {
  const id = useFrameParam("id", "RUN-4821");
  const estado = useFrameParam("estado");
  if (estado === "ao-vivo") return <LiveRun />;
  const run = runById(id) ?? runs[0];
  // key: trocar de execução (?id=) zera passo selecionado e sugestões.
  return <RunRecord key={run.id} run={run} />;
}

function RunRecord({ run }: { run: Run }) {
  const agent = agentById(run.agentId) ?? agents[0];
  const { steps, io } = useMemo(() => traceOf(run), [run]);
  const all = useMemo(() => flat(steps), [steps]);
  const firstError = all.find((s) => s.status === "error" && s.id !== "run");
  const [tab, setTab] = useState("execucao");
  const [sel, setSel] = useState(firstError?.id ?? all[1]?.id ?? "run");
  const [showNext, setShowNext] = useState(true);
  const rerun = useOperation({ busyLabel: "Executando de novo…" });
  const step = all.find((s) => s.id === sel) ?? all[0];
  const d = io[step.id];
  const finished = run.status !== "executando";

  const calls: ToolCall[] = all
    .filter((s) => s.kind === "tool" || s.kind === "search")
    .map((s) => ({
      id: s.id,
      name: s.title.split(" ")[0],
      label: s.title,
      icon: toolIcon[s.kind],
      status: s.status === "error" ? "error" : s.status === "running" ? "running" : "success",
      durationMs: s.durationMs,
      input: io[s.id]?.input,
      output: io[s.id]?.output ?? io[s.id]?.error,
    }));

  const doRerun = () => void rerun.run(() => wait(1400), `Execução ${run.id} enviada de novo · RUN-4831 na fila`);
  const triggerText = run.trigger.by ? run.trigger.text : `${triggerKindLabel[run.trigger.kind]} · ${run.trigger.text}`;

  return (
    <AgentShell current={agentRoutes.runs}>
      <Page>
        <PageHeading
          crumbs={[
            { label: "Execuções", href: agentRoutes.runs },
            { label: agent.name, href: frameHref("ai-agent", agent.id) },
          ]}
          title={run.subject}
          description={`${run.id} · v${run.version} · ${triggerText} · ${runWhen(run.startedAt)}`}
          actions={
            <>
              {run.status === "executando" && (
                <Button variant="ghost" href={frameHref("ai-agent-run", { id: run.id, estado: "ao-vivo" })}>
                  <Radio /> Acompanhar ao vivo
                </Button>
              )}
              <Button variant="ghost" href={frameHref("ai-agent-builder", agent.id)}>
                <PencilLine /> Editar agente
              </Button>
              {run.status === "aguardando" && run.approvalId ? (
                <>
                  <OperationButton operation={rerun} variant="ghost" onClick={doRerun} disabled={!finished}>
                    <RotateCcw /> Executar de novo
                  </OperationButton>
                  <Button href={frameHref("ai-approvals", run.approvalId)}>
                    <ClipboardCheck /> Revisar aprovação
                  </Button>
                </>
              ) : (
                <OperationButton operation={rerun} onClick={doRerun} disabled={!finished} disabledReason="A execução ainda está rodando">
                  <RotateCcw /> Executar de novo
                </OperationButton>
              )}
            </>
          }
        />
        <div className="space-y-6">
          <OperationFeedback operation={rerun} />
          <StatGrid cols={4}>
            <StatCell
              label="Status"
              value={
                <span className={run.status === "sucesso" ? "inline-flex items-center gap-1.5 text-ok" : run.status === "falhou" ? "inline-flex items-center gap-1.5 text-rose" : "inline-flex items-center gap-1.5"}>
                  {run.status === "sucesso" ? <Check className="h-4 w-4" /> : run.status === "falhou" ? <X className="h-4 w-4" /> : <Clock className="h-4 w-4" />} {runStatusLabel[run.status]}
                </span>
              }
              hint={run.retriedStep ? "1 falha recuperada" : run.failedStep ? `parou em “${agent.flow.find((f) => f.id === run.failedStep)?.title ?? run.failedStep}”` : undefined}
            />
            <StatCell label="Duração" value={formatDuration(run.durationMs)} hint={`p95 do agente: ${formatDuration(agent.p95Ms)}`} />
            <StatCell label="Tokens" value={formatNumber(run.tokensIn + run.tokensOut)} hint={`entrada ${formatNumber(run.tokensIn)} · saída ${formatNumber(run.tokensOut)}`} />
            <StatCell label="Custo" value={formatCurrency(run.cost)} hint={`${calls.length} ${calls.length === 1 ? "ferramenta" : "ferramentas"} · ${modelById(agent.model).name}`} />
          </StatGrid>

          {run.retriedStep && run.error && (
            <SystemMessage tone="warn" title="Uma ferramenta falhou e foi repetida">
              <span>{run.error}</span>
            </SystemMessage>
          )}
          {run.status === "falhou" && run.error && (
            <SystemMessage tone="error" title="A execução parou">
              <span>{run.error}</span>
            </SystemMessage>
          )}

          <Tabs
            label="Seções da execução"
            value={tab}
            onChange={setTab}
            items={[
              { id: "execucao", label: "Execução" },
              { id: "saida", label: "Saída" },
              { id: "ferramentas", label: "Ferramentas" },
            ]}
          />

          {tab === "execucao" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <AgentTrace steps={steps} selectedId={sel} onSelect={(s) => setSel(s.id)} label={`Trace da execução ${run.id}`} />
              <section className="min-w-0 rounded-xl border border-line bg-surface">
                <header className="border-b border-line px-4 py-3">
                  <p className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Passo selecionado</p>
                  <h2 className="m-0 mt-1 truncate text-[14px] font-semibold">{step.title}</h2>
                </header>
                <div className="space-y-4 px-4 py-4">
                  <PropertyList
                    items={[
                      { label: "Tipo", value: kindLabel[step.kind] },
                      { label: "Início", value: `+${formatDuration(step.startMs)}` },
                      { label: "Duração", value: formatDuration(step.durationMs) },
                      { label: "Tokens", value: step.tokens != null ? formatNumber(step.tokens) : undefined },
                      { label: "Modelo", value: d?.model },
                    ]}
                  />
                  {d?.error && (
                    <SystemMessage tone="error" title="Erro">
                      {d.error}
                    </SystemMessage>
                  )}
                  {d?.input !== undefined && (
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Entrada</p>
                      <JsonView value={d.input} maxHeight={160} />
                    </div>
                  )}
                  {d?.output !== undefined && (
                    <div>
                      <p className="m-0 mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">Saída</p>
                      <JsonView value={d.output} maxHeight={200} />
                    </div>
                  )}
                  {d?.input === undefined && d?.output === undefined && !d?.error && <p className="m-0 text-[12.5px] text-muted">Este passo não registra entrada nem saída (raciocínio interno do modelo).</p>}
                </div>
              </section>
            </div>
          )}

          {tab === "saida" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0 rounded-xl border border-line bg-surface">
                <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
                  <h2 className="m-0 text-[14px] font-semibold">{run.output?.title ?? "Resultado"}</h2>
                  <AiBadge label="Gerado pela IA" />
                  {run.status === "aguardando" && <Badge tone="warn">Aguardando aprovação</Badge>}
                  {run.output?.to && <span className="ml-auto text-[12px] text-muted">para {run.output.to}</span>}
                </header>
                {run.output ? (
                  <pre className="m-0 whitespace-pre-wrap px-5 py-4 font-sans text-[14px] leading-relaxed text-ink">{run.output.body}</pre>
                ) : (
                  <p className="m-0 px-5 py-4 text-[13.5px] leading-relaxed text-ink-soft">
                    {run.status === "falhou"
                      ? "Sem saída: a execução parou antes do último passo. Veja o erro na aba Execução."
                      : run.status === "executando"
                        ? "O agente ainda está trabalhando. A saída aparece aqui quando terminar."
                        : `${agent.name} concluiu “${run.subject}” e registrou o resultado em ${agent.tools[0]?.label ?? "suas ferramentas"}.`}
                  </p>
                )}
                {run.status === "aguardando" && run.approvalId && (
                  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-soft/40 px-5 py-3">
                    <span className="text-[12.5px] text-muted">Nada sai sem aprovação humana.</span>
                    <Button size="sm" href={frameHref("ai-approvals", run.approvalId)}>
                      <ClipboardCheck /> Revisar e aprovar
                    </Button>
                  </footer>
                )}
              </section>
              <aside className="space-y-4">
                <div className="rounded-xl border border-line bg-surface p-4">
                  <TokenUsageMeter used={creditPlan.used} limit={creditPlan.limit} label="Créditos da Acme neste mês" unit="reais" resetsIn="em 1º de outubro" />
                </div>
                <div className="rounded-xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
                  <p className="m-0 flex items-center gap-1.5 font-medium text-ink">
                    <Clock className="h-3.5 w-3.5" /> Aprovação humana
                  </p>
                  <p className="m-0 mt-1">
                    Passos que mexem com clientes ou dinheiro esperam alguém do time. Ajuste em{" "}
                    <a href={frameHref("ai-agent-governance", { secao: "aprovacao" })} className="font-medium text-ink underline-offset-2 hover:underline">
                      Governança › Aprovação humana
                    </a>
                    .
                  </p>
                </div>
              </aside>
            </div>
          )}

          {tab === "ferramentas" && (
            <div className="max-w-[760px] rounded-xl border border-line bg-surface p-4">
              <ToolCallsSection calls={calls} defaultOpen />
            </div>
          )}

          {finished && showNext && <NextActions agentId={agent.id} agentName={agent.name} onRerun={doRerun} onDismiss={() => setShowNext(false)} />}
        </div>
      </Page>
    </AgentShell>
  );
}

/* ------------------------------------------------------------------ */
/* Ao vivo (?estado=ao-vivo)                                           */
/* ------------------------------------------------------------------ */

const ledgerDiff = `--- a/lancamentos/2026-10.csv
+++ b/lancamentos/2026-10.csv
@@ -212,3 +212,9 @@ data;historico;valor;conta
 2026-10-27;Pix recebido · Vértice Logística;18400,00;Clientes a receber
 2026-10-27;Boleto pago · Aço Forte Distribuidora;-9230,15;Fornecedores
 2026-10-28;Pix recebido · Rede Horizonte;12000,00;Clientes a receber
+2026-10-28;Tarifa de manutenção de conta;-38,90;Despesas bancárias
+2026-10-29;Pix recebido · Constr. Alicerce (título 3381);7350,00;Clientes a receber
+2026-10-29;TED recebida · Grupo Aurora (parcela 2 de 3);15360,00;Clientes a receber
+2026-10-30;IOF sobre aplicação;-4,12;Impostos sobre operações financeiras
+2026-10-31;Rendimento da aplicação automática;612,47;Receitas financeiras
+2026-10-31;Estorno de Pix em duplicidade · Hospital São Lucas;-2100,00;Clientes a receber
`;

const rulesDiff = `--- a/regras/conciliacao.yaml
+++ b/regras/conciliacao.yaml
@@ -8,6 +8,10 @@ regras:
   - quando: historico contém "TARIFA"
     lancar_em: Despesas bancárias
-    tolerancia_dias: 0
+    tolerancia_dias: 2
   - quando: favorecido abreviado
     casar_por: [valor, cnpj_raiz]
+  - quando: historico contém "REND APLIC"
+    lancar_em: Receitas financeiras
+  - quando: historico contém "IOF"
+    lancar_em: Impostos sobre operações financeiras
`;

const liveScript: AgentRunScript = {
  steps: [
    { id: "plan", kind: "plan", label: "Planejou a conciliação de outubro", durationMs: 1400, detail: "Ler o extrato, casar cada movimento com um título ou lançamento existente e propor só o que faltar. Nada é lançado sem aprovação." },
    { id: "ofx", kind: "tool", label: "Leu o extrato de outubro da conta principal", durationMs: 1200, tool: { name: "banco.ler_extrato", input: { conta: "Conta principal · Banco Horizonte", periodo: "2026-10" }, output: { movimentos: 214, saldo_final: 1284310.52 } } },
    { id: "csv", kind: "read", label: "Leu lancamentos/2026-10.csv", durationMs: 800 },
    { id: "titulos", kind: "search", label: "Buscou títulos em aberto para os Pix e TEDs recebidos", durationMs: 1600, tool: { name: "erp.buscar_titulos", input: { situacao: "em aberto", vencimento_ate: "2026-10-31" }, output: { encontrados: 37, casados: 31 } } },
    { id: "regras", kind: "read", label: "Leu regras/conciliacao.yaml", durationMs: 700 },
    { id: "casar", kind: "plan", label: "Casou 208 de 214 movimentos", durationMs: 1900, detail: "Sobraram 6: tarifa, IOF, rendimento, um Pix com favorecido abreviado, uma TED parcial e um estorno em duplicidade." },
    { id: "propor", kind: "edit", label: "Preparou 6 lançamentos e 3 regras novas", durationMs: 1500 },
    { id: "aplicar", kind: "edit", label: "Aplicou os lançamentos no razão de outubro", durationMs: 1100 },
    { id: "saldo", kind: "test", label: "Conferiu o saldo final com o extrato", durationMs: 1300 },
    { id: "fechamento", kind: "test", label: "Rodou as verificações de fechamento", durationMs: 1500 },
  ],
  approvalAt: 7,
  approval: {
    id: "chg-out",
    title: "Revisar mudanças em 2 arquivos",
    summary: "Lançar as 6 sobras do extrato (tarifa, IOF, rendimento, Pix abreviado, TED parcial e estorno) e criar 3 regras para que elas se casem sozinhas em novembro.",
    files: [
      { path: "lancamentos/2026-10.csv", diff: ledgerDiff },
      { path: "regras/conciliacao.yaml", diff: rulesDiff },
    ],
  },
  result: {
    summary: `Outubro conciliado: 214 de 214 movimentos casados. O saldo final confere com o extrato (${formatCurrency(1284310.52)}).`,
    checks: [
      { label: "Saldo final igual ao do extrato", status: "passed" },
      { label: "Nenhum movimento sem lançamento", status: "passed", detail: "214 de 214" },
      { label: "Contas do plano de contas válidas", status: "passed" },
      { label: "Período de outubro ainda aberto", status: "passed", detail: `fecha em ${formatDate("2026-11-05")}` },
    ],
    openLabel: "Ver lançamentos",
  },
};

function LiveRun() {
  const agent = agentById("conciliacao") ?? agents[0];
  return (
    <AgentShell current={agentRoutes.runs}>
      <Page>
        <PageHeading
          crumbs={[
            { label: "Execuções", href: agentRoutes.runs },
            { label: agent.name, href: frameHref("ai-agent", agent.id) },
          ]}
          title="Conciliar extrato de outubro e propor lançamentos"
          description={`RUN-4832 · v${agent.version} · pedido por Camila Duarte · ao vivo`}
          actions={
            <Button variant="ghost" href={frameHref("ai-agent-builder", agent.id)}>
              <PencilLine /> Editar agente
            </Button>
          }
        />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <AgentRunCard
            title="Conciliar extrato de outubro e propor lançamentos"
            agent={agent.name}
            model={modelById(agent.model).name}
            script={liveScript}
            onReject={() => notify("Comentário enviado ao agente")}
            onOpenResult={() => go("fin-reconciliation")}
          />
          <aside className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
              <p className="m-0 flex items-center gap-1.5 font-medium text-ink">
                <Clock className="h-3.5 w-3.5" /> Aprovação humana
              </p>
              <p className="m-0">O agente para antes de escrever no razão. Você vê cada linha que entra e pode devolver com um comentário; ele ajusta e pede de novo.</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <TokenUsageMeter used={creditPlan.used} limit={creditPlan.limit} label="Créditos da Acme neste mês" unit="reais" resetsIn="em 1º de novembro" />
            </div>
          </aside>
        </div>
      </Page>
    </AgentShell>
  );
}
