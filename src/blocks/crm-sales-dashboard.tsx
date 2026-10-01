import { useState } from "react";
import {
  BarChart,
  ChartCard,
  CompareStat,
  FunnelChart,
  GaugeChart,
  GoalMeter,
  KpiCard,
  KpiGrid,
  Leaderboard,
  Page,
  PageHeading,
  ParetoChart,
  SegmentedControl,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { funnel, lostReasons, monthly, reps } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel comercial",
  description: "Meta do trimestre com ritmo esperado, receita por mês contra a meta, funil de conversão, ranking de vendedores e motivos de perda.",
  category: "CRM",
  order: 4,
  height: 1400,
  concept: {
    goal: "Responder se o time vai bater a meta do trimestre e onde está perdendo negócios.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com seletor de time",
      "Meta com ritmo esperado (GoalMeter) antes de tudo",
      "Receita × meta, funil, ranking e motivos de perda (Pareto)",
    ],
    adapt: [
      "Painel de recrutamento, de cobrança ou de operações",
    ],
    avoid: [
      "Mostrar receita sem meta nem ritmo esperado",
    ],
  },
} as const;

// Dados de exemplo em ./data/crm (os mesmos do pipeline e de Time e metas).
const money = (n: number) => formatCurrency(n, { compact: true });
const here = "#/frame/crm-sales-dashboard";

export default function CrmSalesDashboard() {
  const [team, setTeam] = useState<"todos" | "enterprise" | "pme">("todos");
  const shown = reps.filter((r) => team === "todos" || r.team.toLowerCase() === team);
  const won = shown.reduce((s, r) => s + r.won, 0);
  const quota = shown.reduce((s, r) => s + r.quota, 0);
  const prev = shown.reduce((s, r) => s + r.wonPrev, 0);
  const board = [...shown].sort((a, b) => b.won - a.won).map((r) => ({ id: r.id, name: r.name, initials: r.initials, tint: r.tint, value: r.won, sub: `${formatPercent(r.won / r.quota, 0)} da meta`, delta: r.won / r.wonPrev - 1, href: "#/frame/crm-team" }));
  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Painel comercial"
          description="3º trimestre de 2026, fechado em 30/09. Receita, previsão e eficiência do funil do time Sudeste."
          actions={
            <SegmentedControl
              label="Time"
              value={team}
              onChange={setTeam}
              options={[
                { value: "todos", label: "Todos" },
                { value: "enterprise", label: "Enterprise" },
                { value: "pme", label: "PME" },
              ]}
            />
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Receita fechada no trimestre" value={money(won)} delta={won / prev - 1} period="vs. 2º trimestre" size="lg" />
            <KpiCard label="Taxa de ganho" value={formatPercent(71 / 212)} delta={0.021} period="propostas → ganho" />
            <KpiCard label="Ticket médio" value={money(50_845)} delta={-0.063} period="vs. 2º trimestre" />
            <KpiCard label="Ciclo de venda" value="41 dias" delta={-0.09} goodWhen="down" period="da qualificação ao ganho" />
          </KpiGrid>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard className="lg:col-span-2" title="Estamos batendo a meta mensal?" description="Receita ganha e prevista por mês · meta de R$ 1,1 mi">
              <BarChart
                label="Receita ganha e prevista por mês com meta de 1,1 milhão"
                data={monthly}
                index="mes"
                series={[
                  { key: "ganho", label: "Ganho" },
                  { key: "previsto", label: "Previsto (ponderado)", color: "var(--ds-chart-6)" },
                ]}
                stacked
                reference={{ value: 1_100_000, label: "Meta R$ 1,1 mi" }}
                format={(n) => formatCurrency(n, { cents: false })}
                formatAxis={money}
                height={420}
              />
            </ChartCard>
            <ChartCard title="Meta do trimestre" description="Marca vertical = ritmo esperado para hoje">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <GaugeChart
                    value={Math.round((won / quota) * 100)}
                    max={130}
                    label="Atingimento da meta do trimestre"
                    format={(n) => `${n} %`}
                    bands={[
                      { to: 80, tone: "bad", label: "Abaixo" },
                      { to: 100, tone: "warn", label: "Quase lá" },
                      { to: 130, tone: "ok", label: "Meta batida" },
                    ]}
                    size={200}
                    caption="da meta do time"
                  />
                </div>
                {(["Enterprise", "PME"] as const).map((t) => {
                  const rs = reps.filter((r) => r.team === t);
                  const q = rs.reduce((s, r) => s + r.quota, 0);
                  return <GoalMeter key={t} label={t} value={rs.reduce((s, r) => s + r.won, 0)} target={q} expected={q} format={money} />;
                })}
                <CompareStat label="Novos clientes" current={71} previous={58} currentLabel="3º tri" previousLabel="2º tri" format={(n) => formatNumber(n)} />
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Onde o funil perde mais?" description="Negócios que entraram em cada etapa no trimestre">
              <FunnelChart stages={funnel} label="Funil comercial do trimestre" />
            </ChartCard>
            <ChartCard title="Quem mais vendeu?" description="Receita fechada no trimestre · variação vs. 2º tri" footer="Ranking considera só negócios com contrato assinado.">
              <Leaderboard rows={board} format={money} />
            </ChartCard>
          </div>

          <ChartCard title="Por que perdemos?" description="Motivo registrado ao marcar como perdido · 94 negócios no trimestre">
            <ParetoChart items={lostReasons} format={(n) => formatNumber(n)} height={260} />
          </ChartCard>
        </div>
      </Page>
    </CrmShell>
  );
}
