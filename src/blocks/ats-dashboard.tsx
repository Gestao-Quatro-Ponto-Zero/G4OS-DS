import { BarChart3, BriefcaseBusiness, CalendarDays, ClipboardCheck, FileSignature, Inbox, MessageSquareText, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Avatar,
  Button,
  ChartCard,
  DataTable,
  DonutChart,
  DumbbellChart,
  Empty,
  ErrorState,
  FunnelChart,
  KpiCard,
  KpiGrid,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  type Column,
} from "@g4ai/ds";
import { candidateById, hiresByMonth, hiringFunnel, interviews, iso, jobById, jobs, me, offers, openDays, requisitions, sourceQuality, timeByArea } from "./data/ats";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel de recrutamento",
  description: "Contratações contra a meta, tempo até contratar por área contra o SLA, funil, aceite de propostas, qualidade por origem e o que pede ação hoje (entrevistas e vagas fora do SLA).",
  category: "ATS",
  order: 1,
  height: 1400,
  concept: {
    goal: "Mostrar ao time de recrutamento se as contratações estão no ritmo e o que pede ação hoje.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período, KPIs no topo",
      "Um gráfico por pergunta: meta, tempo × SLA, funil, aceite, origem",
      "“Precisa de você” antes dos detalhes: avaliações pendentes, propostas e requisições para aprovar, cada linha abre o registro",
      "KPIs abrem o detalhe (relatórios, propostas)",
    ],
    adapt: [
      "Painel de vendas, operações ou atendimento: troque as perguntas e as filas",
    ],
    avoid: [
      "Gráficos sem período ou sem meta de referência",
    ],
  },
} as const;

type Source = (typeof sourceQuality)[number];

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

export default function AtsDashboard() {
  const [range, setRange] = useState<"ano" | "tri">("ano");
  const months = range === "ano" ? hiresByMonth : hiresByMonth.slice(-3);
  const hires = months.reduce((s, m) => s + m.contratacoes, 0);
  const scale = range === "ano" ? 1 : 0.36;
  const late = jobs.filter((j) => j.status === "aberta" && openDays(j) > j.sla * 0.8).sort((a, b) => openDays(b) / b.sla - openDays(a) / a.sla);
  const today = interviews.filter((i) => i.date === iso(0) && i.state === "agendada");
  const offerMix = [
    { label: "Aceitas", value: Math.round(58 * scale) + offers.filter((o) => o.status === "aceita").length, color: "var(--ds-ok)" },
    { label: "Recusadas", value: Math.round(9 * scale) + offers.filter((o) => o.status === "recusada").length, color: "var(--ds-rose)" },
    { label: "Aguardando", value: offers.filter((o) => o.status === "enviada" || o.status === "aprovacao").length, color: "var(--ds-chart-6)" },
  ];
  // Precisa de você: o que espera uma decisão sua ou de quem você cobra.
  const pendingReviews = interviews.filter((i) => i.feedback === "pendente");
  const offersToApprove = offers.filter((o) => o.status === "aprovacao");
  const reqsToApprove = requisitions.filter((r) => r.status === "pendente" && r.approvals.some((a) => a.who === me.id && a.state === "current"));
  const needsMe = pendingReviews.length + offersToApprove.length + reqsToApprove.length;
  const estado = useFrameParam("estado");
  const columns: Column<Source>[] = [
    { key: "source", header: "Origem", primary: true, cell: (s) => s.source },
    { key: "applicants", header: "Candidaturas", align: "right", nowrap: true, cell: (s) => formatNumber(Math.round(s.applicants * scale)) },
    { key: "hires", header: "Contratações", align: "right", nowrap: true, cell: (s) => <span className="font-medium">{Math.round(s.hires * scale)}</span> },
    { key: "rate", header: "Conversão", align: "right", nowrap: true, cell: (s) => formatPercent(s.hires / s.applicants) },
    { key: "retention", header: "Retenção 12 meses", align: "right", nowrap: true, mobileHidden: true, cell: (s) => <span className={s.retention < 0.75 ? "font-medium text-amber" : ""}>{formatPercent(s.retention, 0)}</span> },
    { key: "cost", header: "Custo por contratação", align: "right", nowrap: true, cell: (s) => formatCurrency(s.cost, { cents: false }) },
  ];

  return (
    <TalentosShell section="painel">
      <Page>
        <PageHeading
          title="Recrutamento"
          description={estado === "vazio" ? "Eficiência e qualidade das contratações." : range === "ano" ? "Eficiência e qualidade das contratações de 2026." : "3º trimestre de 2026 (jul–set)."}
          actions={
            estado === "vazio" ? undefined : (
            <>
              <SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "ano", label: "2026" }, { value: "tri", label: "3º tri" }]} />
              <Button variant="ghost" href={frameHref("ats-reports")}>
                <BarChart3 /> Relatórios
              </Button>
            </>
            )
          }
        />
        <div className="mt-6 space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 1, cards: [{ kind: "list" }] },
                { cols: 2, cards: [{ kind: "list" }, { kind: "list" }] },
                { cols: 3, cards: [{ kind: "chart", span: 2, h: 240 }, { kind: "chart", h: 240 }] },
                { cols: 2, cards: [{ kind: "chart", h: 240 }, { kind: "chart", h: 240 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="o painel de recrutamento" alt={{ label: "Ver vagas", href: frameHref("ats-jobs") }} />
          ) : estado === "vazio" ? (
            <Empty
              icon={<BriefcaseBusiness />}
              title="Nenhuma vaga aberta ainda"
              hint="Contratações, funil e tempo até contratar aparecem aqui quando a primeira vaga receber candidaturas."
              action={<Button href={frameHref("ats-job", "nova")}>Abrir a primeira vaga</Button>}
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Contratações" value={formatNumber(hires)} delta={range === "ano" ? 0.31 : 0.18} period={range === "ano" ? "vs. mesmo período de 2025" : "vs. 2º trimestre"} spark={months.map((m) => m.contratacoes)} href={frameHref("ats-reports")} />
                <KpiCard label="Tempo médio até contratar" value={range === "ano" ? "34 dias" : "31 dias"} delta={-0.12} goodWhen="down" period="da abertura ao aceite" href={frameHref("ats-reports")} />
                <KpiCard label="Aceite de propostas" value={formatPercent(offerMix[0].value / (offerMix[0].value + offerMix[1].value), 0)} delta={0.04} period="propostas respondidas" href="#/frame/ats-offers" />
                <KpiCard label="Custo por contratação" value={formatCurrency(3_870, { cents: false })} delta={0.08} goodWhen="down" period="anúncios, hunting e bônus" href={frameHref("ats-reports")} />
              </KpiGrid>

              {needsMe > 0 && (
                <ListPanel title="Precisa de você" tone="attention" icon={<Inbox />} count={needsMe}>
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {pendingReviews.slice(0, 3).map((i) => {
                      const c = candidateById(i.candidateId);
                      return (
                        <li key={i.id}>
                          <ListRow onClick={() => go("ats-candidate", c.id)} leading={<MessageSquareText className="h-4 w-4 text-muted" aria-hidden />} kicker={`Avaliação de entrevista · ${i.kind} · ${jobById(i.jobId).short}`} title={c.name} meta="Enviar avaliação" />
                        </li>
                      );
                    })}
                    {offersToApprove.map((o) => (
                      <li key={o.id}>
                        <ListRow href={frameHref("ats-offers", { candidato: o.candidateId })} leading={<FileSignature className="h-4 w-4 text-muted" aria-hidden />} kicker={`Proposta para aprovar · ${jobById(o.jobId).short}`} title={`${candidateById(o.candidateId).name} · ${formatCurrency(o.salary, { cents: false })}`} meta="Aprovar ou recusar" />
                      </li>
                    ))}
                    {reqsToApprove.map((r) => (
                      <li key={r.id}>
                        <ListRow href={frameHref("ats-requisitions", r.id)} leading={<ClipboardCheck className="h-4 w-4 text-muted" aria-hidden />} kicker={`Requisição de vaga · ${r.number} · ${r.area}`} title={r.title} meta={`${formatCurrency(r.budget, { compact: true })}/ano`} />
                      </li>
                    ))}
                  </ul>
                </ListPanel>
              )}

              <div className="grid items-start gap-6 lg:grid-cols-2">
                <ListPanel title="Vagas perto ou fora do SLA" icon={<TriangleAlert />} count={late.length} action={<a href="#/frame/ats-jobs">Todas as vagas</a>}>
                  <ul className="list-none divide-y divide-line p-0">
                    {late.slice(0, 4).map((j) => (
                      <li key={j.id}>
                        <ListRow onClick={() => go("ats-job", j.id)} kicker={j.area} title={j.title} meta={<span className={openDays(j) > j.sla ? "font-medium text-rose" : "text-amber"}>{openDays(j)}/{j.sla} dias</span>} />
                      </li>
                    ))}
                  </ul>
                </ListPanel>
                <ListPanel title="Entrevistas de hoje" icon={<CalendarDays />} count={today.length} action={<a href="#/frame/ats-interviews">Agenda</a>}>
                  <ul className="list-none divide-y divide-line p-0">
                    {today.map((i) => {
                      const c = candidateById(i.candidateId);
                      return (
                        <li key={i.id}>
                          <ListRow onClick={() => go("ats-candidate", c.id)} leading={<Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />} kicker={`${i.time} · ${i.kind}`} title={c.name} meta={jobById(i.jobId).short} />
                        </li>
                      );
                    })}
                  </ul>
                </ListPanel>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <ChartCard className="lg:col-span-2" title="Estamos contratando no ritmo planejado?" description="Contratações por mês · meta de 12">
                  <AreaChart label="Contratações por mês com meta de 12" data={months} index="mes" series={[{ key: "contratacoes", label: "Contratações" }]} reference={{ value: 12, label: "Meta 12/mês" }} height={240} />
                </ChartCard>
                <ChartCard title="As propostas são aceitas?" description={`${offerMix.reduce((s, o) => s + o.value, 0)} propostas no período`}>
                  <DonutChart items={offerMix} label="Situação das propostas" centerLabel="Propostas" />
                </ChartCard>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Quais áreas demoram mais para contratar?" description="SLA da área → tempo real, em dias. Verde = dentro do SLA.">
                  <DumbbellChart rows={timeByArea.map((t) => ({ label: t.area, a: t.sla, b: t.dias }))} aLabel="SLA" bLabel="Tempo real" format={(n) => `${n} d`} goodWhen="down" />
                </ChartCard>
                <ChartCard title="Onde o funil de contratação afunila?" description="Candidaturas por etapa alcançada">
                  <FunnelChart stages={hiringFunnel.map((f) => ({ ...f, value: Math.round(f.value * scale) }))} label="Funil de contratação" />
                </ChartCard>
              </div>

              <section>
                <div className="mb-3">
                  <h2 className="m-0 text-[14px] font-medium">Qual origem traz as melhores contratações?</h2>
                  <p className="m-0 mt-0.5 text-[12px] text-muted">Volume, conversão, retenção após 12 meses e custo · retenção abaixo de 75 % em destaque</p>
                </div>
                <DataTable rows={sourceQuality} columns={columns} rowKey={(s) => s.source} />
              </section>
            </>
          )}
        </div>
      </Page>
    </TalentosShell>
  );
}
