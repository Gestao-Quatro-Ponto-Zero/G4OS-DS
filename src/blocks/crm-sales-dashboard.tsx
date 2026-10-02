import { CalendarClock, FileText, Inbox, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Button,
  ChartCard,
  CompareStat,
  Empty,
  ErrorState,
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
  Skeleton,
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { activities, activityLabel, companyById, daysFromToday, deals, funnel, leads, lostReasons, me, monthly, quotes, repById, reps } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

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
      "“Precisa de você” num só painel logo abaixo dos KPIs: atividades atrasadas, negócios parados, propostas vencendo e leads novos",
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

/* ------------------------------------------------------------------ */
/* Estados do painel. No showcase, `?estado=carregando|erro|vazio`    */
/* simula cada um; no SEU app troque pelo estado da consulta          */
/* (isLoading, error, sem dados). O cabeçalho fica visível em todos;  */
/* no vazio ele não mostra números, período nem exportar.             */
/* ------------------------------------------------------------------ */

type SkeletonCard = { kind: "chart" | "list"; span?: 1 | 2 | 3; h?: number };
const skeletonCols = { 1: "", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 5: "lg:grid-cols-5" } as const;
const skeletonSpan = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;

/** Carregando com a forma final: faixa de KPIs, cartões de gráfico e painéis de lista. */
function PanelSkeleton({ kpis = 4, rows }: { kpis?: 4 | 5; rows: { cols: keyof typeof skeletonCols; cards: SkeletonCard[] }[] }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando painel" className="space-y-6">
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", kpis === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
        {Array.from({ length: kpis }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-line bg-surface p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} className={cn("grid items-start gap-6", skeletonCols[r.cols])}>
          {r.cards.map((c, j) =>
            c.kind === "chart" ? (
              <div key={j} className={cn("min-w-0 rounded-xl border border-line bg-surface px-6 py-5", skeletonSpan[c.span ?? 1])}>
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="mt-2 h-3 w-40 max-w-full" />
                <div className="mt-5" style={{ height: c.h ?? 220 }}>
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              </div>
            ) : (
              <div key={j} className={cn("min-w-0 rounded-2xl border border-line bg-soft/70 p-[3px]", skeletonSpan[c.span ?? 1])}>
                <div className="px-3 py-3">
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  {Array.from({ length: 4 }, (_, k) => (
                    <div key={k} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-2.5 w-1/4" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/** Erro ao carregar o painel, com saída: tentar de novo (limpa o estado simulado) ou ir para outra tela. */
function PanelError({ what, alt }: { what: string; alt?: { label: string; href: string } }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <ErrorState
        size="md"
        title={`Não foi possível carregar ${what}`}
        description="O servidor não respondeu. Nada do que você fez foi perdido; tente de novo em instantes."
        retryLabel="Tentar de novo"
        onRetry={() => setFrameQuery({ estado: undefined })}
        secondaryAction={
          alt && (
            <Button variant="ghost" href={alt.href}>
              {alt.label}
            </Button>
          )
        }
      />
    </div>
  );
}

export default function CrmSalesDashboard() {
  const [team, setTeam] = useState<"todos" | "enterprise" | "pme">("todos");
  const shown = reps.filter((r) => team === "todos" || r.team.toLowerCase() === team);
  const won = shown.reduce((s, r) => s + r.won, 0);
  const quota = shown.reduce((s, r) => s + r.quota, 0);
  const prev = shown.reduce((s, r) => s + r.wonPrev, 0);
  const board = [...shown].sort((a, b) => b.won - a.won).map((r) => ({ id: r.id, name: r.name, initials: r.initials, tint: r.tint, value: r.won, sub: `${formatPercent(r.won / r.quota, 0)} da meta`, delta: r.won / r.wonPrev - 1, href: "#/frame/crm-team" }));
  const needsMe = overdue.length + stalled.length + expiring.length + newLeads.length;
  const estado = useFrameParam("estado");
  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Painel comercial"
          description={estado === "vazio" ? "Receita, previsão e eficiência do funil do time Sudeste." : "3º trimestre de 2026, fechado em 30/09. Receita, previsão e eficiência do funil do time Sudeste."}
          actions={
            estado === "vazio" ? undefined : (
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
            )
          }
        />
        <div className="mt-6 space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 1, cards: [{ kind: "list" }] },
                { cols: 3, cards: [{ kind: "chart", span: 2, h: 420 }, { kind: "chart", h: 420 }] },
                { cols: 2, cards: [{ kind: "chart", h: 260 }, { kind: "chart", h: 260 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="o painel comercial" alt={{ label: "Abrir o pipeline", href: "#/frame/crm-pipeline" }} />
          ) : estado === "vazio" ? (
            <Empty
              title="Nenhum negócio no trimestre"
              hint="Receita, meta e funil aparecem aqui quando o time registrar os primeiros negócios."
              action={
                <Button href="#/frame/crm-pipeline?novo=1">
                  <Plus /> Criar o primeiro negócio
                </Button>
              }
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Receita fechada no trimestre" value={money(won)} delta={won / prev - 1} period="vs. 2º trimestre" size="lg" href="#/frame/crm-team" />
                <KpiCard label="Taxa de ganho" value={formatPercent(71 / 212)} delta={0.021} period="propostas → ganho" href="#/frame/crm-quotes" />
                <KpiCard label="Ticket médio" value={money(50_845)} delta={-0.063} period="vs. 2º trimestre" href="#/frame/crm-pipeline" />
                <KpiCard label="Ciclo de venda" value="41 dias" delta={-0.09} goodWhen="down" period="da qualificação ao ganho" href={stalledHref} hint={`${stalled.length} negócios parados há mais de 30 dias`} />
              </KpiGrid>

              <ListPanel title="Precisa de você" icon={<TriangleAlert />} tone="attention" count={needsMe} action={<a href="#/frame/crm-activities">Abrir atividades</a>}>
                {needsMe ? (
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {overdue.slice(0, 3).map((a) => (
                      <li key={a.id}>
                        <ListRow
                          href={a.dealId ? `#/frame/crm-deal?id=${a.dealId}` : `#/frame/crm-company?id=${a.companyId}`}
                          leading={<CalendarClock className="h-4 w-4 text-muted" aria-hidden />}
                          kicker={`Atividade atrasada · ${activityLabel[a.type]} · ${a.owner === me ? "você" : repById(a.owner).name.split(" ")[0]}`}
                          title={a.title}
                          meta={<span className="font-medium text-rose">{-daysFromToday(a.due) === 1 ? "desde ontem" : `há ${-daysFromToday(a.due)} dias`}</span>}
                        />
                      </li>
                    ))}
                    {stalled.slice(0, 3).map((d) => (
                      <li key={d.id}>
                        <ListRow
                          href={`#/frame/crm-deal?id=${d.id}`}
                          leading={<TriangleAlert className="h-4 w-4 text-muted" aria-hidden />}
                          kicker={`Negócio parado · ${companyById(d.companyId).name} · ${repById(d.owner).name.split(" ")[0]}`}
                          title={d.title}
                          meta={<span className="font-medium text-amber">{d.age} dias na etapa</span>}
                        />
                      </li>
                    ))}
                    {expiring.map((q) => (
                      <li key={q.id}>
                        <ListRow
                          href={`#/frame/crm-quotes?id=${q.id}`}
                          leading={<FileText className="h-4 w-4 text-muted" aria-hidden />}
                          kicker={`Proposta vencendo · ${q.number}`}
                          title={companyById(q.companyId).name}
                          meta={<span className={daysFromToday(q.validUntil) < 0 ? "font-medium text-rose" : "text-amber"}>{daysFromToday(q.validUntil) < 0 ? "vencida" : daysFromToday(q.validUntil) === 0 ? "vence hoje" : `vence em ${daysFromToday(q.validUntil)} d`}</span>}
                        />
                      </li>
                    ))}
                    {newLeads.slice(0, 2).map((l) => (
                      <li key={l.id}>
                        <ListRow
                          href={`#/frame/crm-leads?id=${l.id}`}
                          leading={<Inbox className="h-4 w-4 text-muted" aria-hidden />}
                          kicker={`Lead para qualificar · ${l.source} · pontuação ${l.score}`}
                          title={`${l.name} · ${l.company}`}
                          meta={money(l.estimate)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty framed={false} icon={<TriangleAlert />} title="Nada pedindo ação agora" hint="Atividades atrasadas, negócios parados, propostas vencendo e leads novos aparecem aqui." />
                )}
              </ListPanel>

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
                        format={(n) => formatPercent(n / 100, 0)}
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
            </>
          )}
        </div>
      </Page>
    </CrmShell>
  );
}
