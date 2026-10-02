import { Download } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Button,
  ChartCard,
  DataTable,
  DumbbellChart,
  Empty,
  ErrorState,
  FunnelChart,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  ParetoChart,
  SegmentedControl,
  Skeleton,
  cn,
  downloadCsv,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  type Column,
} from "@g4ai/ds";
import { hiringFunnel, offerDeclineReasons, sourceQuality, timeByArea, timeByStage } from "./data/ats";
import { TalentosShell } from "./shells/talentos-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Relatórios de recrutamento",
  description: "Funil de contratação com conversão entre etapas, qualidade e custo por origem, tempo para contratar por área contra o SLA, tempo por etapa e motivos de recusa de proposta. Período no cabeçalho e exportação em CSV.",
  category: "ATS",
  order: 11,
  height: 1500,
  concept: {
    goal: "Explicar onde o processo seletivo perde tempo e candidatos, e quais origens valem o investimento.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período à direita; exportar como ação secundária",
      "Um gráfico por pergunta: funil, tempo × SLA, tempo por etapa, recusas (Pareto), origem",
      "Tabela de origens com conversão, retenção e custo (o detalhe acionável no fim)",
      "Drill-down a partir dos KPIs do painel de recrutamento",
    ],
    adapt: [
      "Relatório comercial (funil e origem de leads), relatório de atendimento (tempo por etapa)",
    ],
    avoid: [
      "Gráfico sem pergunta no título ou sem referência (meta, SLA)",
      "Exportar como ação principal da tela",
    ],
  },
} as const;

type Source = (typeof sourceQuality)[number];
const periods = { ano: { label: "2026", scale: 1, desc: "jan–set de 2026" }, tri: { label: "3º tri", scale: 0.36, desc: "3º trimestre de 2026 (jul–set)" } } as const;

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

export default function AtsReports() {
  const [range, setRange] = useState<keyof typeof periods>("ano");
  const p = periods[range];
  const funnel = hiringFunnel.map((f, i, all) => ({ label: f.label, value: Math.round(f.value * p.scale), hint: i ? `${formatPercent(f.value / all[i - 1].value, 0)} da etapa anterior` : undefined }));
  const sources = sourceQuality.map((s) => ({ ...s, applicants: Math.round(s.applicants * p.scale), hires: Math.max(1, Math.round(s.hires * p.scale)) }));
  const hires = funnel[funnel.length - 1].value;
  const totalDays = timeByStage.reduce((s, t) => s + t.dias, 0);
  const estado = useFrameParam("estado");

  const columns: Column<Source>[] = [
    { key: "source", header: "Origem", primary: true, cell: (s) => s.source },
    { key: "applicants", header: "Candidaturas", align: "right", nowrap: true, cell: (s) => <span className="tabular-nums">{formatNumber(s.applicants)}</span> },
    { key: "hires", header: "Contratações", align: "right", nowrap: true, cell: (s) => <span className="font-medium tabular-nums">{formatNumber(s.hires)}</span> },
    { key: "rate", header: "Conversão", align: "right", nowrap: true, cell: (s) => <span className="tabular-nums">{formatPercent(s.hires / s.applicants)}</span> },
    { key: "retention", header: "Retenção 12 meses", align: "right", nowrap: true, mobileHidden: true, cell: (s) => <span className={s.retention < 0.75 ? "font-medium text-amber tabular-nums" : "tabular-nums"}>{formatPercent(s.retention, 0)}</span> },
    { key: "cost", header: "Custo por contratação", align: "right", nowrap: true, cell: (s) => <span className="tabular-nums">{formatCurrency(s.cost, { cents: false })}</span> },
  ];

  const exportCsv = () => {
    const rows = [["Origem", "Candidaturas", "Contratações", "Conversão", "Retenção 12 meses", "Custo por contratação"], ...sources.map((s) => [s.source, String(s.applicants), String(s.hires), formatPercent(s.hires / s.applicants), formatPercent(s.retention, 0), formatCurrency(s.cost, { cents: false })])];
    downloadCsv(`recrutamento-origens-${range}`, rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n"));
    notify("Relatório exportado em CSV");
  };

  return (
    <TalentosShell section="relatorios">
      <Page>
        <PageHeading
          crumbs={[{ label: "Painel", href: "#/frame/ats-dashboard" }]}
          title="Relatórios de recrutamento"
          description={`Funil, tempo e origem das contratações · ${p.desc}.`}
          actions={
            estado === "vazio" ? undefined : (
              <>
                <SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "ano", label: periods.ano.label }, { value: "tri", label: periods.tri.label }]} />
                <Button variant="ghost" onClick={exportCsv}>
                  <Download /> Exportar CSV
                </Button>
              </>
            )
          }
        />
        <div className="space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 2, cards: [{ kind: "chart", h: 260 }, { kind: "chart", h: 260 }] },
                { cols: 2, cards: [{ kind: "chart", h: 260 }, { kind: "chart", h: 260 }] },
                { cols: 1, cards: [{ kind: "chart", h: 240 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="os relatórios de recrutamento" alt={{ label: "Voltar ao painel", href: "#/frame/ats-dashboard" }} />
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há dados no período"
              hint="Funil, tempo por etapa e origem das contratações aparecem aqui quando as vagas do período receberem as primeiras candidaturas."
              action={<Button href="#/frame/ats-jobs">Ver vagas</Button>}
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Contratações" value={formatNumber(hires)} delta={range === "ano" ? 0.31 : 0.18} period={range === "ano" ? "vs. mesmo período de 2025" : "vs. 2º trimestre"} />
                <KpiCard label="Conversão candidatura → contratação" value={formatPercent(hiringFunnel[4].value / hiringFunnel[0].value, 1)} delta={0.002} period="vs. mesmo período de 2025" />
                <KpiCard label="Tempo médio até contratar" value={`${totalDays} dias`} delta={-0.12} goodWhen="down" period="soma das etapas, vs. 2025" />
                <KpiCard label="Aceite de propostas" value={formatPercent(58 / 71, 0)} delta={0.04} period="propostas respondidas" href="#/frame/ats-offers" />
              </KpiGrid>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Onde o funil de contratação afunila?" description="Candidaturas por etapa alcançada · conversão sobre a etapa anterior">
                  <FunnelChart stages={funnel} label="Funil de contratação por etapa" />
                </ChartCard>
                <ChartCard title="Em qual etapa o processo demora mais?" description={`Dias médios por etapa · meta somada ${timeByStage.reduce((s, t) => s + t.meta, 0)} dias`}>
                  <BarChart
                    label="Dias médios em cada etapa do processo seletivo contra a meta"
                    data={timeByStage}
                    index="etapa"
                    layout="horizontal"
                    series={[
                      { key: "dias", label: "Tempo real" },
                      { key: "meta", label: "Meta", color: "var(--ds-chart-6)" },
                    ]}
                    format={(n) => `${formatNumber(n)} d`}
                    height={260}
                  />
                </ChartCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Quais áreas estouram o SLA de contratação?" description="SLA da área → tempo real, em dias. Verde = dentro do SLA.">
                  <DumbbellChart rows={timeByArea.map((t) => ({ label: t.area, a: t.sla, b: t.dias }))} aLabel="SLA" bLabel="Tempo real" format={(n) => `${n} d`} goodWhen="down" />
                </ChartCard>
                <ChartCard title="Por que recusam nossas propostas?" description={`Motivo registrado na recusa · ${offerDeclineReasons.reduce((s, r) => s + r.value, 0)} recusas em 2026`}>
                  <ParetoChart items={offerDeclineReasons} height={260} />
                </ChartCard>
              </div>

              <ChartCard title="Qual origem traz mais contratações?" description="Contratações por origem no período">
                <BarChart label="Contratações por origem de candidatura" data={sources} index="source" series={[{ key: "hires", label: "Contratações" }]} format={(n) => formatNumber(n)} labels height={240} />
              </ChartCard>

              <section>
                <div className="mb-3">
                  <h2 className="m-0 text-[14px] font-medium">Qual origem vale o investimento?</h2>
                  <p className="m-0 mt-0.5 text-[12px] text-muted">Volume, conversão, retenção após 12 meses e custo · retenção abaixo de 75 % em destaque</p>
                </div>
                <DataTable rows={sources} columns={columns} rowKey={(s) => s.source} />
              </section>
            </>
          )}
        </div>
      </Page>
    </TalentosShell>
  );
}
