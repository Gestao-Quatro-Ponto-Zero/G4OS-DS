import { CalendarClock, FileText, Inbox, TriangleAlert } from "lucide-react";
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
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  ParetoChart,
  SegmentedControl,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { activities, activityLabel, companyById, daysFromToday, deals, funnel, leads, lostReasons, me, monthly, quotes, repById, reps } from "./data/crm";
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
      "KPIs levam à lista já filtrada (drill-down)",
      "“Precisa de você” logo abaixo dos KPIs: negócios parados, atividades atrasadas, leads e propostas vencendo",
      "Meta com ritmo esperado (GoalMeter)",
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
// Links com filtro na URL (useFilters url: true lê ?f=campo~op~valor).
const stalledHref = `?f=${encodeURIComponent("age~gt~30")}#/frame/crm-pipeline`;
const stalled = deals.filter((d) => d.age > 30).sort((a, b) => b.age - a.age);
const overdue = activities.filter((a) => !a.done && daysFromToday(a.due) < 0).sort((a, b) => a.due.localeCompare(b.due));
const newLeads = leads.filter((l) => l.status === "novo");
const expiring = quotes.filter((q) => q.status === "enviada" && daysFromToday(q.validUntil) <= 3);

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
            <KpiCard label="Receita fechada no trimestre" value={money(won)} delta={won / prev - 1} period="vs. 2º trimestre" size="lg" href="#/frame/crm-team" />
            <KpiCard label="Taxa de ganho" value={formatPercent(71 / 212)} delta={0.021} period="propostas → ganho" href="#/frame/crm-quotes" />
            <KpiCard label="Ticket médio" value={money(50_845)} delta={-0.063} period="vs. 2º trimestre" href="#/frame/crm-pipeline" />
            <KpiCard label="Ciclo de venda" value="41 dias" delta={-0.09} goodWhen="down" period="da qualificação ao ganho" href={stalledHref} hint={`${stalled.length} negócios parados há mais de 30 dias`} />
          </KpiGrid>

          <section aria-labelledby="precisa-de-voce">
            <h2 id="precisa-de-voce" className="m-0 mb-3 text-[14px] font-medium">
              Precisa de você
            </h2>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <ListPanel title="Negócios parados" icon={<TriangleAlert />} tone={stalled.length ? "attention" : "neutral"} count={stalled.length} action={<a href={stalledHref}>Ver no pipeline</a>}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {stalled.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <ListRow href={`#/frame/crm-deal?id=${d.id}`} kicker={`${companyById(d.companyId).name} · ${repById(d.owner).name.split(" ")[0]}`} title={d.title} meta={<span className="font-medium text-amber">{d.age} dias na etapa</span>} />
                    </li>
                  ))}
                  {!stalled.length && <li className="px-4 py-4 text-[13px] text-muted">Nenhum negócio parado. Bom ritmo.</li>}
                </ul>
              </ListPanel>
              <ListPanel title="Atividades atrasadas" icon={<CalendarClock />} tone={overdue.length ? "attention" : "neutral"} count={overdue.length} action={<a href="#/frame/crm-activities">Abrir atividades</a>}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {overdue.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <ListRow
                        href={a.dealId ? `#/frame/crm-deal?id=${a.dealId}` : `#/frame/crm-company?id=${a.companyId}`}
                        kicker={`${activityLabel[a.type]} · ${a.owner === me ? "você" : repById(a.owner).name.split(" ")[0]}`}
                        title={a.title}
                        meta={<span className="font-medium text-rose">{-daysFromToday(a.due) === 1 ? "desde ontem" : `há ${-daysFromToday(a.due)} dias`}</span>}
                      />
                    </li>
                  ))}
                </ul>
              </ListPanel>
              <ListPanel title="Leads novos para qualificar" icon={<Inbox />} count={newLeads.length} action={<a href="#/frame/crm-leads">Caixa de leads</a>}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {newLeads.slice(0, 3).map((l) => (
                    <li key={l.id}>
                      <ListRow href={`#/frame/crm-leads?id=${l.id}`} kicker={`${l.source} · pontuação ${l.score}`} title={`${l.name} · ${l.company}`} meta={money(l.estimate)} />
                    </li>
                  ))}
                </ul>
              </ListPanel>
              <ListPanel title="Propostas vencendo" icon={<FileText />} count={expiring.length} action={<a href="#/frame/crm-quotes">Todas as propostas</a>}>
                <ul className="m-0 list-none divide-y divide-line p-0">
                  {expiring.map((q) => (
                    <li key={q.id}>
                      <ListRow
                        href={`#/frame/crm-quotes?id=${q.id}`}
                        kicker={q.number}
                        title={companyById(q.companyId).name}
                        meta={<span className={daysFromToday(q.validUntil) < 0 ? "font-medium text-rose" : "text-amber"}>{daysFromToday(q.validUntil) < 0 ? "vencida" : daysFromToday(q.validUntil) === 0 ? "vence hoje" : `vence em ${daysFromToday(q.validUntil)} d`}</span>}
                      />
                    </li>
                  ))}
                  {!expiring.length && <li className="px-4 py-4 text-[13px] text-muted">Nenhuma proposta perto do vencimento.</li>}
                </ul>
              </ListPanel>
            </div>
          </section>

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
