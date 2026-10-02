import { AlertTriangle, ClipboardCheck, FlaskConical, Globe, History, Wallet, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BarChart,
  BarList,
  Button,
  ChartCard,
  Meter,
  KpiCard,
  KpiGrid,
  ListPanel,
  ListRow,
  MiniBarChart,
  Page,
  PageHeading,
  SegmentedControl,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import {
  agentById,
  agents,
  approvals,
  budgetUse,
  costByArea,
  creditPlan,
  evalSuites,
  fleetDaily,
  fleetTotals,
  runStatusLabel,
  runWhen,
  runs,
  suiteScore,
} from "./data/agents";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { frameHref } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel da frota de agentes",
  description: "Saúde de todos os agentes num olhar: execuções, sucesso, custo e latência p95 com base explícita, execuções × falhas por dia, quem mais roda, custo por área, créditos do mês, 'Precisa de você' clicável e incidentes recentes.",
  category: "IA",
  order: 9,
  height: 1280,
  concept: {
    goal: "Quem responde pela operação de IA da empresa vê em segundos se a frota está saudável, quanto custa e o que precisa de uma pessoa agora.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período à direita",
      "5 KPIs com delta e base explícita; custo e latência com goodWhen='down'",
      "Gráfico principal responde uma pergunta (execuções × falhas); MiniBarChart para custo por área",
      "'Precisa de você' antes do detalhe: aprovações, agentes com erro, orçamento perto do limite, regressão",
      "Incidentes recentes abrem a execução que falhou",
    ],
    adapt: [
      "Painel de automações/RPA: troque tokens e custo de modelo por horas de robô",
      "Painel de integrações: execuções viram sincronizações; falhas por conector",
    ],
    avoid: [
      "Mais de 5 KPIs no topo",
      "Falhas só como número, sem levar à execução",
      "Custo sem orçamento ao lado (ninguém sabe se é muito)",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { cents: false });

export default function AiAgentsDashboard() {
  const [period, setPeriod] = useState<"30" | "7">("30");
  const data = useMemo(() => fleetDaily.slice(-Number(period)), [period]);
  const total = data.reduce((s, d) => s + d.execucoes + d.falhas, 0);
  const fails = data.reduce((s, d) => s + d.falhas, 0);

  const withError = agents.filter((a) => a.status === "erro");
  const nearBudget = agents.filter((a) => budgetUse(a) > 0.9);
  const outside = agents.filter((a) => !a.region.brazil);
  const regressions = evalSuites.filter((s) => suiteScore(s) < s.threshold);
  const incidents = runs.filter((r) => r.status === "falhou").slice(0, 5);
  const oldest = approvals[approvals.length - 1];

  return (
    <AgentShell current={agentRoutes.dashboard}>
      <Page>
        <PageHeading
          title="Painel da frota"
          description={`${agents.filter((a) => a.status !== "rascunho").length} agentes em produção · setembro de 2026 · atualizado há 2 minutos`}
          actions={
            <>
              <SegmentedControl
                label="Período"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: "30", label: "30 dias" },
                  { value: "7", label: "7 dias" },
                ]}
              />
              <Button variant="ghost" href={agentRoutes.runs}>
                <History /> Ver execuções
              </Button>
            </>
          }
        />
        <div className="space-y-6">
          <KpiGrid cols={5}>
            <KpiCard label="Execuções" value={formatNumber(fleetTotals.runs30d)} delta={fleetTotals.runs30d / fleetTotals.runsPrev - 1} period="vs. agosto" spark={fleetDaily.slice(-7).map((d) => d.execucoes + d.falhas)} href={agentRoutes.runs} />
            <KpiCard label="Taxa de sucesso" value={formatPercent(fleetTotals.success)} delta={fleetTotals.success / fleetTotals.successPrev - 1} period="vs. agosto (98,4 %)" href={frameHref("ai-runs", { status: "falhou" })} />
            <KpiCard label="Custo no mês" value={money(fleetTotals.cost30d)} delta={fleetTotals.cost30d / fleetTotals.costPrev - 1} goodWhen="down" period="vs. agosto · 3 agentes novos" href={agentRoutes.governance} />
            <KpiCard label="Latência p95" value={formatDuration(fleetTotals.p95Ms)} delta={fleetTotals.p95Ms / fleetTotals.p95Prev - 1} goodWhen="down" period="vs. agosto" />
            <KpiCard label="Aprovações pendentes" value={approvals.length} delta={approvals.length / 3 - 1} goodWhen="down" period="vs. ontem (3)" href={agentRoutes.approvals} />
          </KpiGrid>

          <ChartCard
            title="A frota está rodando mais sem falhar mais?"
            description={`Execuções concluídas e falhas por dia · últimos ${period} dias`}
            value={formatNumber(total)}
            insight={`${formatPercent(fails / total)} falharam no período`}
            insightDetail="Pico em 28–30/09: extrato do Itaú mudou de formato e o Notion limitou a triagem"
            insightTrend="up"
          >
            <BarChart
              label={`Execuções concluídas e falhas por dia nos últimos ${period} dias`}
              data={data}
              index="dia"
              series={[
                { key: "execucoes", label: "Concluídas", color: "var(--ds-chart-1)" },
                { key: "falhas", label: "Falhas", color: "var(--ds-rose)" },
              ]}
              stacked
              height={240}
              formatAxis={(n) => formatNumber(n)}
            />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <ListPanel title="Precisa de você" tone="attention" count={approvals.length + withError.length + nearBudget.length + outside.length + regressions.length} icon={<AlertTriangle />}>
                <ListRow
                  leading={<ClipboardCheck className="h-4 w-4 text-amber" />}
                  kicker="Aprovações"
                  title={`${approvals.length} ações esperando decisão humana`}
                  meta={`mais antiga: ${runWhen(oldest.requestedAt)}`}
                  href={agentRoutes.approvals}
                />
                {withError.map((a) => (
                  <ListRow key={a.id} leading={<XCircle className="h-4 w-4 text-rose" />} kicker={`${a.name} · com erro`} title={a.issue ?? "Execuções falhando"} meta="abrir agente" href={frameHref("ai-agent", a.id)} />
                ))}
                {nearBudget.map((a) => (
                  <ListRow key={a.id} leading={<Wallet className="h-4 w-4 text-amber" />} kicker={`${a.name} · orçamento`} title={`${formatPercent(budgetUse(a), 0)} do orçamento usado (${money(a.cost30d)} de ${money(a.budget)})`} meta="ajustar limite" href={frameHref("ai-agent-governance", { secao: "orcamento" })} />
                ))}
                {outside.map((a) => (
                  <ListRow key={a.id} leading={<Globe className="h-4 w-4 text-amber" />} kicker={`${a.name} · LGPD`} title={a.issue ?? `Roda em ${a.region.place}`} meta="revisar dados" href={frameHref("ai-agent-governance", { secao: "dados" })} />
                ))}
                {regressions.map((s) => (
                  <ListRow key={s.id} leading={<FlaskConical className="h-4 w-4 text-rose" />} kicker={`${agentById(s.agentId)?.name} · avaliação`} title={`${s.name} abaixo do mínimo: ${formatPercent(suiteScore(s), 0)} (mínimo ${formatPercent(s.threshold, 0)})`} meta="ver casos" href={frameHref("ai-agent-evals", { agente: s.agentId })} />
                ))}
              </ListPanel>

              <ListPanel title="Incidentes recentes" icon={<XCircle />} action={<Button size="sm" variant="ghost" href={frameHref("ai-runs", { status: "falhou" })}>Ver falhas</Button>}>
                {incidents.map((r) => (
                  <ListRow
                    key={r.id}
                    leading={<XCircle className="h-4 w-4 text-rose" aria-label={runStatusLabel[r.status]} />}
                    kicker={`${r.id} · ${agentById(r.agentId)?.name}`}
                    title={r.error ?? r.subject}
                    meta={runWhen(r.startedAt)}
                    href={frameHref("ai-agent-run", r.id)}
                  />
                ))}
              </ListPanel>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="m-0 text-[13px] font-medium">Créditos do mês</h2>
                  <Button size="sm" variant="quiet" href={frameHref("ai-agent-governance", { secao: "orcamento" })}>
                    Ver uso
                  </Button>
                </div>
                <p className="m-0 flex items-baseline justify-between gap-2 text-[12.5px] text-muted">
                  <span>{creditPlan.plan}</span>
                  <span className="tabular-nums">
                    <span className="text-[15px] font-semibold text-ink">{money(creditPlan.used)}</span> de {money(creditPlan.limit)}
                  </span>
                </p>
                <div className="mt-2">
                  <Meter value={(creditPlan.used / creditPlan.limit) * 100} tone={creditPlan.used / creditPlan.limit >= 0.9 ? "warn" : "ink"} label={`${formatPercent(creditPlan.used / creditPlan.limit, 0)} dos créditos usados`} />
                </div>
                <p className="m-0 mt-2 text-[12px] text-muted">{formatPercent(creditPlan.used / creditPlan.limit, 0)} usados com 1 dia para renovar (01/10). Ao passar de 90 %, os donos recebem aviso no Slack.</p>
              </section>
              <MiniBarChart label="Custo por área" caption="Setembro · R$" data={costByArea.filter((d) => d.value > 0)} format={money} />
              <ChartCard title="Quais agentes mais rodam?" description="Execuções em 30 dias">
                <BarList
                  items={[...agents]
                    .filter((a) => a.runs30d > 0)
                    .sort((a, b) => b.runs30d - a.runs30d)
                    .slice(0, 6)
                    .map((a) => ({ label: a.name, value: a.runs30d, href: frameHref("ai-agent", a.id) }))}
                  showShare
                />
              </ChartCard>
            </div>
          </div>
        </div>
      </Page>
    </AgentShell>
  );
}
