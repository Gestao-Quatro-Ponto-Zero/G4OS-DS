import { AlertTriangle, FileText, Receipt, Repeat, Wrench } from "lucide-react";
import {
  Badge,
  BarChart,
  Button,
  ChartCard,
  Empty,
  ErrorState,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  MiniBarChart,
  Page,
  PageHeading,
  Skeleton,
  StackedList,
  cn,
  formatCompact,
  formatCurrency,
  formatNumber,
} from "@g4ai/ds";
import {
  cash,
  cashflow,
  charges,
  clientById,
  contracts,
  daysFrom,
  dm,
  doneByDay,
  invoices,
  isOpen,
  isOverdue,
  me,
  mrr,
  mrrHistory,
  payables,
  slaOf,
  techById,
  technicians,
  workOrders,
} from "./data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { ServicosShell } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Início do ERP de serviços",
  description: "Início no estilo Conta Azul: saldo em caixa, a receber e a pagar do mês, receita recorrente dos contratos, OS abertas e atrasadas, fluxo de caixa previsto, OS concluídas por dia e as filas que pedem ação.",
  category: "Serviços",
  order: 1,
  height: 1500,
  concept: {
    goal: "Mostrar ao dono da empresa de serviços, em um minuto, se o caixa aguenta o mês e o que está travando a operação.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo, 5 KPIs com base explícita, um gráfico por pergunta",
      "Fluxo de caixa previsto em barras com entradas e saídas (negativas) por semana; insight do menor saldo",
      "“Precisa de você” logo abaixo dos KPIs, num só painel: cobranças vencidas, OS sem técnico, NFS-e rejeitadas e contratos a renovar, cada linha com o tipo no topo",
      "MiniBarChart de OS concluídas por dia; técnicos em campo em StackedList",
      "Cada linha abre o registro certo (OS, cobrança, nota, contrato)",
    ],
    adapt: [
      "Início de qualquer ERP de PME (Omie, Conta Azul, Bling): troque OS por pedidos",
      "Empresa de limpeza, segurança, dedetização, assistência técnica",
    ],
    avoid: [
      "KPI sem base de comparação (“R$ 76 mil” de quê?)",
      "Fila de ação escondida abaixo dos gráficos",
    ],
  },
} as const;

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

export default function SrvDashboard() {
  const monthCharges = charges.filter((b) => b.status === "aberta" && daysFrom(b.due) <= 31);
  const toReceive = monthCharges.reduce((s, b) => s + b.value, 0);
  const overdueList = charges.filter(isOverdue).sort((a, b) => a.due.localeCompare(b.due));
  const overdueSum = overdueList.reduce((s, b) => s + b.value, 0);
  const toPay = payables.reduce((s, p) => s + p.value, 0);
  const open = workOrders.filter(isOpen);
  const late = open.filter((w) => slaOf(w).late || daysFrom(w.due) === 0);
  const noTech = workOrders.filter((w) => w.stage === "aberta" && !w.techId);
  const rejected = invoices.filter((n) => n.status === "rejeitada");
  const renewals = contracts.filter((k) => k.status === "renovar").sort((a, b) => a.renewal.localeCompare(b.renewal));
  const needsMe = overdueList.length + noTech.length + rejected.length + renewals.length;
  const estado = useFrameParam("estado");

  // Saldo projetado semana a semana, para achar o pior momento.
  let running = cash.balance;
  const projected = cashflow.map((w) => {
    running += w.entradas + w.saidas;
    return { ...w, saldo: running };
  });
  const worst = projected.reduce((a, b) => (b.saldo < a.saldo ? b : a));
  const doneWeek = doneByDay.slice(-5).reduce((s, d) => s + d.value, 0);

  return (
    <ServicosShell section="inicio">
      <Page>
        <PageHeading
          kicker={`Bom dia, ${me.name.split(" ")[0]}`}
          title="Início"
          description="Vértice Manutenção Predial e TI · competência setembro de 2026"
          actions={
            <Button onClick={() => go("srv-work-orders", { nova: "1" })}>
              <Wrench /> Abrir OS
            </Button>
          }
        />
        <div className="space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              kpis={5}
              rows={[
                { cols: 1, cards: [{ kind: "list" }] },
                { cols: 3, cards: [{ kind: "chart", span: 2, h: 240 }, { kind: "list" }] },
                { cols: 3, cards: [{ kind: "chart", span: 2, h: 180 }, { kind: "list" }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="o início" alt={{ label: "Ver ordens de serviço", href: frameHref("srv-work-orders") }} />
          ) : estado === "vazio" ? (
            <Empty
              icon={<Wrench />}
              title="Nenhuma OS nem cobrança ainda"
              hint="Caixa, contratos e a fila do que pede ação aparecem aqui quando a primeira ordem de serviço for aberta."
              action={
                <Button onClick={() => go("srv-work-orders", { nova: "1" })}>
                  <Wrench /> Abrir a primeira OS
                </Button>
              }
            />
          ) : (
            <>
              <KpiGrid cols={5}>
                <KpiCard label="Saldo em caixa" value={formatCurrency(cash.balance, { compact: true })} hint={cash.accounts.map((a) => `${a.bank.split(" ·")[0]} ${formatCurrency(a.value, { compact: true })}`).join(" · ")} href={frameHref("srv-billing", { aba: "conciliacao" })} />
                <KpiCard label="A receber em 30 dias" value={formatCurrency(toReceive, { compact: true })} hint={<span className="text-rose">{formatCurrency(overdueSum, { compact: true })} vencidos</span>} href={frameHref("srv-billing")} />
                <KpiCard label="A pagar em 30 dias" value={formatCurrency(toPay, { compact: true })} delta={0.034} goodWhen="down" period="vs. outubro de 2025" />
                <KpiCard label="MRR dos contratos" value={formatCurrency(mrr, { compact: true })} delta={mrrHistory[5].mrr / mrrHistory[4].mrr - 1} period="vs. agosto" spark={mrrHistory.map((m) => m.mrr)} href={frameHref("srv-contracts")} />
                <KpiCard label="OS abertas" value={open.length} hint={<span className={late.length ? "text-rose" : undefined}>{late.length} atrasadas ou vencendo hoje</span>} href={frameHref("srv-work-orders")} />
              </KpiGrid>

              <ListPanel title="Precisa de você" icon={<AlertTriangle />} count={needsMe} tone="attention" action={<a href={frameHref("srv-billing", { aba: "vencidas" })}>Cobranças vencidas</a>}>
                {needsMe ? (
                  <ul className="m-0 list-none divide-y divide-line p-0">
                    {overdueList.slice(0, 3).map((b) => (
                      <li key={b.id}>
                        <ListRow onClick={() => go("srv-billing", b.id)} leading={<Receipt className="h-4 w-4 text-muted" aria-hidden />} kicker={`Cobrança vencida · ${b.number} · há ${-daysFrom(b.due)} dias`} title={clientById(b.clientId).name} meta={<span className="font-medium tabular-nums">{formatCurrency(b.value, { cents: false })}</span>} />
                      </li>
                    ))}
                    {noTech.map((w) => (
                      <li key={w.id}>
                        <ListRow onClick={() => go("srv-work-order", w.id)} leading={<Wrench className="h-4 w-4 text-muted" aria-hidden />} kicker={<>OS sem técnico · <span className="font-mono">{w.number}</span></>} title={`${w.title} · ${clientById(w.clientId).name}`} meta={<Badge tone={slaOf(w).tone}>{slaOf(w).label}</Badge>} />
                      </li>
                    ))}
                    {rejected.map((n) => (
                      <li key={n.id}>
                        <ListRow onClick={() => go("srv-invoices", n.id)} leading={<FileText className="h-4 w-4 text-muted" aria-hidden />} kicker={`NFS-e rejeitada · ${n.rps} · ${n.rejection?.code}`} title={`${clientById(n.clientId).name} · ${n.rejection?.fieldLabel}`} meta={<span className="tabular-nums">{formatCurrency(n.value, { compact: true })}</span>} />
                      </li>
                    ))}
                    {renewals.map((k) => (
                      <li key={k.id}>
                        <ListRow
                          onClick={() => go("srv-contracts", k.id)}
                          leading={<Repeat className="h-4 w-4 text-muted" aria-hidden />}
                          kicker={`Contrato a renovar · ${k.number} · ${daysFrom(k.renewal) <= 0 ? "venceu" : `em ${daysFrom(k.renewal)} dias`} · reajuste ${k.index}`}
                          title={clientById(k.clientId).name}
                          meta={<span className="tabular-nums">{formatCurrency(k.monthly, { compact: true })}/mês</span>}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty framed={false} icon={<AlertTriangle />} title="Nada pedindo ação agora" hint="Cobranças vencidas, OS sem técnico, notas rejeitadas e contratos a renovar aparecem aqui." />
                )}
              </ListPanel>

              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ChartCard
                  title="O caixa aguenta as próximas 8 semanas?"
                  description="Entradas (cobranças emitidas e mensalidades) e saídas (folha, impostos, fornecedores) previstas por semana"
                  value={`${formatCurrency(projected[projected.length - 1].saldo, { cents: false })} em 25/11`}
                  insight={`Menor saldo previsto: ${formatCurrency(worst.saldo, { cents: false })} na semana de ${worst.semana}`}
                  insightTrend={worst.saldo < cash.balance ? "down" : "flat"}
                  insightDetail="Folha e DAS caem antes das mensalidades do dia 10. Cobrar os vencidos cobre a diferença."
                >
                  <BarChart
                    label="Entradas e saídas previstas por semana, próximas 8 semanas"
                    data={cashflow}
                    index="semana"
                    series={[
                      { key: "entradas", label: "Entradas" },
                      { key: "saidas", label: "Saídas" },
                    ]}
                    format={(n) => formatCurrency(n, { cents: false })}
                    formatAxis={formatCompact}
                    height={240}
                  />
                </ChartCard>
                <div className="grid gap-6">
                  <MiniBarChart label="OS concluídas por dia" data={doneByDay} format={(n) => `${formatNumber(n)} OS`} caption={`Setembro, por dia útil · ${doneWeek} nos últimos 5 dias`} height={110} />
                  <ListPanel title="Contas a pagar em 30 dias" icon={<Receipt />}>
                    <ul className="m-0 list-none divide-y divide-line p-0">
                      {[...payables]
                        .sort((a, b) => a.due.localeCompare(b.due))
                        .map((p) => (
                          <li key={p.id}>
                            <ListRow kicker={`Vence ${dm(p.due)}`} title={p.label} meta={<span className="tabular-nums">{formatCurrency(p.value, { compact: true })}</span>} />
                          </li>
                        ))}
                    </ul>
                  </ListPanel>
                </div>
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ChartCard title="A receita recorrente está crescendo?" description="Soma das mensalidades de contratos ativos, a renovar e em implantação" value={formatCurrency(mrr, { cents: false })} insight="Dois contratos novos em setembro (Bioanálise e Metalúrgica Paulista)" insightTrend="up">
                  <LineChart label="Receita recorrente mensal de abril a setembro" data={mrrHistory} index="mes" series={[{ key: "mrr", label: "MRR" }]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={formatCompact} height={180} endLabels />
                </ChartCard>
                <StackedList
                  title="Técnicos em campo"
                  height={320}
                  directoryLabel="Todos os técnicos"
                  searchPlaceholder="Buscar técnico…"
                  emptyFeatured="Nenhum técnico em campo agora."
                  items={technicians.map((t) => {
                    const now = workOrders.find((w) => w.techId === t.id && w.stage === "execucao");
                    return {
                      id: t.id,
                      name: t.name,
                      initials: t.initials,
                      tint: t.tint,
                      status: t.status,
                      description: now ? `${now.number} · ${clientById(now.clientId).name}` : t.where,
                      meta: <Badge>{t.skill}</Badge>,
                      href: frameHref("srv-schedule", { tecnico: t.id }),
                      keywords: t.role,
                    };
                  })}
                />
              </div>
              <p className="m-0 flex items-center gap-2 text-[12px] text-muted">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Previsão considera só títulos emitidos; {techById("rogerio")?.name.split(" ")[0]} está de folga e não entra na capacidade desta semana.
              </p>
            </>
          )}
        </div>
      </Page>
    </ServicosShell>
  );
}
