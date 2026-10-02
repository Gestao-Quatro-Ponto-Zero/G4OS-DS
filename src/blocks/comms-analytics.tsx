import { AlertTriangle, BellRing, Download } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BarChart,
  BarList,
  Button,
  ChartCard,
  DataTable,
  Empty,
  ErrorState,
  HeatmapMatrix,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  MiniBarChart,
  OperationButton,
  Page,
  PageHeading,
  SegmentedControl,
  Skeleton,
  cn,
  downloadCsv,
  formatDate,
  formatNumber,
  formatPercent,
  plural,
  useOperation,
  useSort,
  type Column,
} from "@g4ai/ds";
import { areaLabel, channelReach, engagementByHour, now, published, readByAreaCity, readRate, timeToRead, todayIso, weeklyReach, type Announcement } from "./data/comms";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CommsShell } from "./shells/comms-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Mural · alcance da comunicação",
  description: "Painel de alcance: taxa de leitura contra a meta, tempo até a leitura, confirmações de leitura obrigatória, engajamento por canal, área e cidade, horário de leitura e comunicados com baixa leitura que pedem reforço.",
  category: "Comunicação",
  order: 8,
  height: 1650,
  concept: {
    goal: "Saber se a comunicação está chegando, em quem não chega e o que reforçar hoje.",
    patterns: [
      "Anatomia B · Painel: período e exportar no cabeçalho; 4 KPIs com base explícita",
      "“Precisa de você” antes dos gráficos: comunicados com leitura baixa ou confirmação atrasada, com ação de reforço",
      "Um gráfico por pergunta: leitura × meta, canal, área × cidade (matriz), tempo até ler, horário",
      "Tabela de comunicados ordenável no fim, linha abre o comunicado",
    ],
    adapt: [
      "Alcance de campanhas para clientes, adesão a treinamentos obrigatórios, leitura de políticas de compliance",
    ],
    avoid: [
      "Contar entrega como leitura (e abertura como confirmação)",
      "Pintar de verde o que está bom: só o que pede atenção ganha cor",
    ],
  },
} as const;

const periods = { "30d": { label: "30 dias", desc: "1º a 30 de setembro" }, tri: { label: "Trimestre", desc: "3º trimestre de 2026 (jul–set)" } } as const;

/** Precisa de você: leitura baixa ou confirmação obrigatória atrasada. */
const attention = published
  .map((a) => {
    const ackRate = a.mandatory && a.acks != null ? a.acks / a.audienceSize : null;
    const worst = a.readsByArea.slice().sort((x, y) => x.read / x.total - y.read / y.total)[0];
    const hours = Math.round((now.getTime() - new Date(a.publishedAt).getTime()) / 36e5);
    const reason =
      ackRate != null && a.mandatory!.due >= todayIso && ackRate < 0.8
        ? `${formatPercent(ackRate, 0)} confirmaram · prazo ${formatDate(a.mandatory!.due, { short: true })}`
        : readRate(a) < 0.5 && hours >= 24
          ? `${formatPercent(readRate(a), 0)} leram em ${formatNumber(hours)} h`
          : null;
    return reason ? { a, reason, worst } : null;
  })
  .filter((x): x is { a: Announcement; reason: string; worst: Announcement["readsByArea"][number] } => !!x);

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

export default function CommsAnalytics() {
  const [range, setRange] = useState<keyof typeof periods>("tri");
  const [boosted, setBoosted] = useState<string[]>([]);
  const boost = useOperation({ busyLabel: "Enviando…" });
  const p = periods[range];
  const estado = useFrameParam("estado");
  const weeks = range === "tri" ? weeklyReach : weeklyReach.slice(-5);
  const sort = useSort(published, { title: (a) => a.title, published: (a) => a.publishedAt, rate: (a) => readRate(a), median: (a) => a.medianHours, comments: (a) => a.comments }, { key: "published", dir: "desc" });

  const columns: Column<Announcement>[] = [
    {
      key: "title",
      header: "Comunicado",
      sortKey: "title",
      primary: true,
      cell: (a) => (
        <span className="block min-w-0 leading-tight">
          <span className="block truncate font-medium">{a.title}</span>
          <span className="mt-0.5 block truncate text-[12px] text-muted">
            {a.category} · {a.audience.label}
          </span>
        </span>
      ),
    },
    { key: "published", header: "Publicado", sortKey: "published", nowrap: true, cell: (a) => <span className="text-ink-soft">{formatDate(a.publishedAt, { short: true })}</span> },
    {
      key: "rate",
      header: "Leitura",
      sortKey: "rate",
      align: "right",
      nowrap: true,
      cell: (a) => <span className={readRate(a) < 0.5 ? "font-medium tabular-nums text-amber" : "tabular-nums"}>{formatPercent(readRate(a), 0)}</span>,
    },
    { key: "acks", header: "Confirmações", align: "right", nowrap: true, mobileHidden: true, cell: (a) => (a.mandatory && a.acks != null ? <span className="tabular-nums">{formatPercent(a.acks / a.audienceSize, 0)}</span> : <span className="text-muted">—</span>) },
    { key: "median", header: "Mediana até ler", sortKey: "median", align: "right", nowrap: true, mobileHidden: true, cell: (a) => <span className="tabular-nums">{formatNumber(a.medianHours, 1)} h</span> },
    { key: "comments", header: "Comentários", sortKey: "comments", align: "right", nowrap: true, mobileHidden: true, cell: (a) => <span className="tabular-nums">{formatNumber(a.comments)}</span> },
  ];

  const exportCsv = () => {
    const rows = [["Comunicado", "Publicado", "Público", "Leitura", "Confirmações", "Mediana até ler (h)", "Comentários"], ...published.map((a) => [a.title, formatDate(a.publishedAt), a.audience.label, formatPercent(readRate(a), 0), a.acks != null ? formatPercent(a.acks / a.audienceSize, 0) : "", formatNumber(a.medianHours, 1), String(a.comments)])];
    downloadCsv(`alcance-comunicados-${range}`, rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n"));
  };

  return (
    <CommsShell section="alcance">
      <Page>
        <PageHeading
          title="Alcance da comunicação"
          description={`Quem leu, em quanto tempo e por qual canal · ${p.desc}.`}
          actions={
            estado === "vazio" ? undefined : (
              <>
                <SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "30d", label: periods["30d"].label }, { value: "tri", label: periods.tri.label }]} />
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
                { cols: 1, cards: [{ kind: "list" }] },
                { cols: 2, cards: [{ kind: "chart", h: 240 }, { kind: "chart", h: 240 }] },
                { cols: 1, cards: [{ kind: "chart", h: 260 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="o alcance da comunicação" alt={{ label: "Voltar ao início", href: frameHref("comms-home") }} />
          ) : estado === "vazio" ? (
            <Empty
              title="Ainda não há dados no período"
              hint="Leitura, confirmações e alcance por canal aparecem aqui quando o primeiro comunicado do período for publicado."
              action={<Button href={frameHref("comms-compose")}>Escrever comunicado</Button>}
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Taxa de leitura" value={formatPercent(range === "tri" ? 0.71 : 0.74, 0)} delta={range === "tri" ? 0.09 : 0.04} period={range === "tri" ? "vs. 2º trimestre" : "vs. agosto"} spark={weeks.map((w) => w.leitura)} hint="meta: 75 %" />
                <KpiCard label="Tempo até a leitura" value={`${formatNumber(range === "tri" ? 4.1 : 3.6, 1)} h`} delta={range === "tri" ? -0.18 : -0.12} goodWhen="down" period={range === "tri" ? "mediana · vs. 2º trimestre" : "mediana · vs. agosto"} />
                <KpiCard label="Confirmação de obrigatórios" value={formatPercent(0.78, 0)} delta={-0.03} period="no prazo · vs. 2º trimestre" />
                <KpiCard label="Engajamento por comunicado" value={formatNumber(range === "tri" ? 142 : 168)} delta={0.22} period="reações + comentários · vs. 2º trimestre" />
              </KpiGrid>

              <ListPanel title="Precisa de você" tone="attention" count={attention.length} icon={<AlertTriangle />}>
                {attention.length ? (
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {attention.slice(0, 4).map(({ a, reason, worst }) => (
                      <li key={a.id}>
                        <ListRow
                          kicker={worst ? `${reason} · menor leitura em ${areaLabel(worst.area)} (${formatPercent(worst.read / worst.total, 0)})` : reason}
                          title={
                            <a href={frameHref("comms-announcement", a.id)} className="text-ink hover:underline">
                              {a.title}
                            </a>
                          }
                          meta={
                            boosted.includes(a.id) ? (
                              <Badge>Reforço enviado</Badge>
                            ) : (
                              <OperationButton
                                operation={boost}
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  void boost.run(
                                    () => new Promise((r) => setTimeout(r, 600)).then(() => setBoosted((b) => [...b, a.id])),
                                    `Reforço enviado no WhatsApp para ${formatNumber(a.audienceSize - (a.acks ?? a.reads))} pessoas`,
                                  )
                                }
                              >
                                <BellRing /> Reforçar no WhatsApp
                              </OperationButton>
                            )
                          }
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty framed={false} icon={<BellRing />} title="Nenhum comunicado precisa de reforço" hint="Comunicados com leitura abaixo de 50 % depois de 24 h, ou confirmação obrigatória abaixo de 80 % no prazo, aparecem aqui." />
                )}
              </ListPanel>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="A leitura está chegando na meta?" description="Pessoas do público que leram cada comunicado, média por semana" insight={`${formatPercent(weeks[weeks.length - 1].leitura, 0)} na última semana`} insightDetail="Primeira semana acima da meta de 75 % no trimestre" insightTrend="up">
                  <LineChart label="Taxa de leitura semanal dos comunicados contra a meta de 75 %" data={weeks} index="semana" series={[{ key: "leitura", label: "Leitura" }]} reference={{ value: 0.75, label: "Meta 75 %" }} format={(n) => formatPercent(n, 0)} height={240} dots />
                </ChartCard>
                <ChartCard title="Qual canal faz a mensagem ser lida?" description="Envios entregues e abertos por canal no período">
                  <BarChart
                    label="Comunicados entregues e abertos por canal"
                    data={channelReach}
                    index="canal"
                    series={[
                      { key: "entregues", label: "Entregues" },
                      { key: "abertos", label: "Abertos" },
                    ]}
                    format={(n) => formatNumber(n)}
                    height={240}
                  />
                  <p className="m-0 mt-3 text-[12.5px] text-ink-soft">
                    WhatsApp abre {formatPercent(channelReach[2].abertos / channelReach[2].entregues, 0)}, e-mail {formatPercent(channelReach[1].abertos / channelReach[1].entregues, 0)}: na operação de CD o e-mail quase não chega.
                  </p>
                </ChartCard>
              </div>

              <ChartCard title="Onde a mensagem não chega?" description="Taxa de leitura por área e cidade · célula vazia = sem pessoas da área naquela cidade">
                <div className="overflow-x-auto">
                  <HeatmapMatrix label="Taxa de leitura por área e cidade" rows={readByAreaCity.rows} columns={readByAreaCity.columns} values={readByAreaCity.values} format={(n) => formatPercent(n / 100, 0)} max={100} />
                </div>
              </ChartCard>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Quanto tempo até lerem?" description={`Leituras por tempo desde a publicação · ${plural(published.length, "comunicado")}`}>
                  <BarList items={timeToRead} sort={false} showShare />
                </ChartCard>
                <div className="grid content-start gap-4">
                  <MiniBarChart label="Em que horário as pessoas leem?" caption="Leituras por faixa de horário (horário de Brasília)" data={engagementByHour.map((h) => ({ label: h.hora, value: h.leituras }))} format={(n) => `${formatNumber(n)} leituras`} height={120} />
                  <p className="m-0 rounded-xl border border-line bg-surface p-4 text-[12.5px] text-ink-soft">
                    Picos às 8h e ao meio-dia, e um terceiro às 6h na troca de turno dos CDs. Agende comunicados para a operação às 6h ou 14h.
                  </p>
                </div>
              </div>

              <section aria-labelledby="tabela-alcance">
                <div className="mb-3">
                  <h2 id="tabela-alcance" className="m-0 text-[14px] font-medium">
                    Comunicados do período
                  </h2>
                  <p className="m-0 mt-0.5 text-[12px] text-muted">Leitura abaixo de 50 % em destaque · clique para abrir o comunicado</p>
                </div>
                <DataTable label="Alcance por comunicado" rows={sort.rows} columns={columns} rowKey={(a) => a.id} rowLabel={(a) => a.title} sort={sort} onRowClick={(a) => go("comms-announcement", a.id)} />
              </section>
            </>
          )}
        </div>
      </Page>
    </CommsShell>
  );
}
