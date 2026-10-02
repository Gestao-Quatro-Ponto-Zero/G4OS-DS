import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Badge,
  BarChart,
  Button,
  ChartCard,
  DataTable,
  Empty,
  EntityMark,
  ErrorState,
  KpiCard,
  KpiGrid,
  NpsChart,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  Tabs,
  cn,
  downloadCsv,
  formatCurrency,
  formatNumber,
  formatPercent,
  gridToCsv,
  notify,
  type Column,
  type GridColumn,
} from "@g4ai/ds";
import { customers, daily, go, iso, healthLabel, healthTone, mrrMovements, npsScores, totalMrr, type Customer } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Dashboard de produto SaaS",
  description: "KPIs com variação, visitantes com seletor de período, movimento de MRR, NPS e contas recentes que abrem a página da conta.",
  category: "SaaS",
  order: 1,
  height: 1320,
  concept: {
    goal: "Mostrar a saúde do produto SaaS em uma olhada: receita, aquisição, retenção e satisfação.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com Exportar e Nova conta",
      "KPIs com variação e sparkline",
      "Visitantes com seletor de período; movimento de MRR; NPS",
      "Contas recentes abrem a página da conta",
    ],
    adapt: [
      "Painel de qualquer produto: troque os KPIs e as perguntas",
    ],
    avoid: [
      "Mais de 5 KPIs no topo",
    ],
  },
} as const;

const here = "#/frame/saas-dashboard";
const money = (n: number) => formatCurrency(n, { compact: true });

const statusBadge = {
  ativa: <Badge tone="ok">Ativa</Badge>,
  trial: <Badge tone="info">Trial</Badge>,
  atraso: <Badge tone="warn">Pagamento em atraso</Badge>,
};

type DailyRow = (typeof daily)[number];
const csvColumns: GridColumn<DailyRow>[] = [
  { key: "dia", header: "Dia", value: (d) => d.dia },
  { key: "desktop", header: "Visitantes desktop", value: (d) => d.desktop },
  { key: "celular", header: "Visitantes celular", value: (d) => d.celular },
];

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

export default function SaasDashboard() {
  const [period, setPeriod] = useState<"90" | "30" | "7">("90");
  const [tab, setTab] = useState("recentes");
  const data = useMemo(() => daily.slice(-Number(period)), [period]);
  const total = data.reduce((s, d) => s + d.desktop + d.celular, 0);
  const recent = [...customers].sort((a, b) => b.since.localeCompare(a.since));
  const rows = tab === "risco" ? customers.filter((c) => c.health === "risco") : tab === "trial" ? customers.filter((c) => c.status === "trial") : recent.slice(0, 6);
  const last = mrrMovements[mrrMovements.length - 1];
  const estado = useFrameParam("estado");

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Conta",
      primary: true,
      cell: (a) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={a.name} tint={a.tint} className="h-7 w-7 text-[11px]" />
          <span className="truncate">{a.name}</span>
        </span>
      ),
    },
    { key: "plan", header: "Plano", cell: (a) => a.plan },
    { key: "seats", header: "Usuários", align: "right", nowrap: true, cell: (a) => formatNumber(a.seats) },
    { key: "mrr", header: "MRR", align: "right", nowrap: true, cell: (a) => <span className="font-medium tabular-nums">{formatCurrency(a.mrr, { cents: false })}</span> },
    { key: "status", header: "Situação", cell: (a) => (tab === "risco" ? <Badge tone={healthTone[a.health]}>{healthLabel[a.health]}</Badge> : statusBadge[a.status]) },
    { key: "since", header: "Cliente desde", nowrap: true, mobileHidden: true, cell: (a) => <span className="tabular-nums text-muted">{new Date(`${a.since}T00:00:00`).toLocaleDateString("pt-BR")}</span> },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Visão geral"
          description={estado === "vazio" ? "Uso e receita das contas ativas." : "Uso e receita das contas ativas. Atualizado há 4 minutos."}
          actions={
            <>
              {estado !== "vazio" && (
              <Button
                variant="ghost"
                onClick={() => {
                  downloadCsv(`visao-geral-pulso-${iso(0)}`, gridToCsv(data, csvColumns));
                  notify(`Visitantes dos últimos ${period} dias exportados em CSV`);
                }}
              >
                <Download /> Exportar CSV
              </Button>
              )}
              <Button href="#/frame/saas-customers?novo=1">
                <Plus /> Nova conta
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 1, cards: [{ kind: "chart", h: 260 }] },
                { cols: 5, cards: [{ kind: "chart", span: 3, h: 240 }, { kind: "chart", span: 2, h: 240 }] },
                { cols: 1, cards: [{ kind: "list" }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="a visão geral" alt={{ label: "Ver contas", href: "#/frame/saas-customers" }} />
          ) : estado === "vazio" ? (
            <Empty
              title="Nenhuma conta ainda"
              hint="Receita, uso e NPS aparecem aqui assim que a primeira conta assinar ou começar um trial."
              action={
                <Button href="#/frame/saas-customers?novo=1">
                  <Plus /> Criar a primeira conta
                </Button>
              }
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Receita recorrente (MRR)" value={formatCurrency(totalMrr, { cents: false })} delta={0.125} period="vs. agosto" spark={[31, 33, 32, 35, 36, 38, 41]} href="#/frame/saas-billing" />
                <KpiCard label="Novas contas" value="38" delta={-0.2} period="Aquisição abaixo do esperado" spark={[52, 48, 50, 44, 41, 39, 38]} href="#/frame/saas-analytics" />
                <KpiCard label="Contas ativas" value={formatNumber(customers.filter((c) => c.status !== "trial").length)} delta={0.042} period="Retenção forte no trimestre" spark={[28, 29, 30, 31, 32, 33, 34]} href="#/frame/saas-customers" />
                <KpiCard label="Churn mensal" value={formatPercent(0.018)} delta={-0.045} goodWhen="down" period="Menor em 6 meses" spark={[2.6, 2.4, 2.3, 2.1, 2, 1.9, 1.8]} href="#/frame/saas-customers?visao=risco" />
              </KpiGrid>

              <ChartCard
                title="Visitantes"
                description={`Total nos últimos ${period} dias`}
                value={formatNumber(total)}
                action={
                  <SegmentedControl
                    label="Período"
                    value={period}
                    onChange={setPeriod}
                    options={[
                      { value: "90", label: "3 meses" },
                      { value: "30", label: "30 dias" },
                      { value: "7", label: "7 dias" },
                    ]}
                  />
                }
              >
                <AreaChart
                  label={`Visitantes por dia nos últimos ${period} dias, desktop e celular`}
                  data={data}
                  index="dia"
                  series={[
                    { key: "desktop", label: "Desktop" },
                    { key: "celular", label: "Celular" },
                  ]}
                  stacked
                  height={260}
                  formatAxis={(n) => formatNumber(n)}
                />
              </ChartCard>

              <div className="grid gap-6 lg:grid-cols-5">
                <ChartCard className="lg:col-span-3" title="De onde vem (e para onde vai) o MRR?" description={`Setembro: +${money(last.novo + last.expansao)} entrou · ${money(last.contracao + last.churn)} saiu`}>
                  <BarChart
                    label="Movimento de MRR por mês: novo, expansão, contração e churn"
                    data={mrrMovements}
                    index="mes"
                    series={[
                      { key: "novo", label: "Novo", color: "var(--ds-chart-1)" },
                      { key: "expansao", label: "Expansão", color: "var(--ds-ok)" },
                      { key: "contracao", label: "Contração", color: "var(--ds-amber)" },
                      { key: "churn", label: "Churn", color: "var(--ds-rose)" },
                    ]}
                    stacked
                    format={(n) => formatCurrency(n, { cents: false })}
                    formatAxis={money}
                    height={240}
                  />
                </ChartCard>
                <ChartCard className="lg:col-span-2" title="Os clientes recomendam?" description="NPS do trimestre · 412 respostas">
                  <NpsChart scores={npsScores} previous={58} />
                </ChartCard>
              </div>

              <section>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <Tabs
                    label="Contas"
                    value={tab}
                    onChange={setTab}
                    items={[
                      { id: "recentes", label: "Contas recentes" },
                      { id: "risco", label: "Em risco", count: customers.filter((c) => c.health === "risco").length },
                      { id: "trial", label: "Em trial" },
                    ]}
                  />
                  <Button size="sm" variant="ghost" href="#/frame/saas-customers">
                    Ver todas
                  </Button>
                </div>
                <DataTable rows={rows} columns={columns} rowKey={(a) => a.id} onRowClick={(c) => go("saas-customer", c.id)} rowLabel={(c) => `Abrir ${c.name}`} />
              </section>
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
