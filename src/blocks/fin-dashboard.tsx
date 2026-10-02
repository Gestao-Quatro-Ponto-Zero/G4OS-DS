import { ArrowLeftRight, HandCoins, Landmark, Plus, TriangleAlert } from "lucide-react";
import {
  BarList,
  Button,
  ChartCard,
  Empty,
  ErrorState,
  GaugeChart,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  Meter,
  Page,
  PageHeading,
  ProportionBar,
  Skeleton,
  cn,
  formatCurrency,
  formatDelta,
  formatNumber,
} from "@g4ai/ds";
import { agingBuckets, bankLines, br, budget, cashBalance, customerById, customers, finUser, lateDays, minimumCash, payables, receivables, weeks } from "./data/fin";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Visão financeira",
  description: "O dia da controladoria em uma tela: caixa e projeção contra o mínimo, liquidez, aging do a receber, aprovações de pagamento, conciliação pendente, maiores devedores e centros estourados.",
  category: "Financeiro",
  order: 1,
  height: 1280,
  concept: {
    goal: "O dia da controladoria em uma tela: caixa, recebíveis, aprovações e pendências.",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período",
      "KPIs de liquidez, aging e caixa contra o mínimo",
      "“Precisa de você” (aprovar pagamentos, cobrar vencidos sem promessa) ao lado da conciliação, antes dos detalhes",
    ],
    adapt: [
      "Painel de operações, de RH",
    ],
    avoid: [
      "Painel só com gráficos, sem o que fazer hoje",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });

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

export default function FinDashboard() {
  let running = cashBalance;
  const projection = weeks.slice(4).map((w) => {
    running += w.entradas + w.saidas;
    return { semana: w.semana, saldo: running, minimo: minimumCash };
  });
  const toApprove = payables.filter((p) => p.status === "aprovacao");
  const overdue = receivables.filter((r) => lateDays(r) > 0);
  // Vencidos sem promessa de pagamento: alguém precisa cobrar.
  const toCollect = overdue.filter((r) => !r.promise).sort((a, b) => b.value - a.value);
  const needsMe = toApprove.length + toCollect.length;
  const estado = useFrameParam("estado");
  const debtors = customers
    .map((c) => ({ label: c.name, value: overdue.filter((r) => r.customerId === c.id).reduce((s, r) => s + r.value, 0), href: `#/frame/erp-customers?id=${c.id}` }))
    .filter((d) => d.value);
  const overBudget = budget.filter((b) => b.kind === "despesa" && b.actual > b.planned);
  const biggest = [...overdue].sort((a, b) => b.value - a.value)[0];
  const receivable30 = receivables.reduce((s, r) => s + r.value, 0);
  const payable30 = payables.filter((p) => p.status !== "pago").reduce((s, p) => s + p.value, 0);

  return (
    <NexoShell section="fin-painel">
      <Page>
        <PageHeading
          kicker={`Bom dia, ${finUser.name.split(" ")[0]}`}
          title="Visão financeira"
          description={estado === "vazio" ? "Distribuidora Aço Forte · nenhuma conta bancária conectada ainda." : "Distribuidora Aço Forte · posição consolidada das contas às 08:00."}
        />
        <div className="mt-6 space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 3, cards: [{ kind: "chart", span: 2, h: 220 }, { kind: "chart", h: 220 }] },
                { cols: 3, cards: [{ kind: "list" }, { kind: "list" }, { kind: "list" }] },
                { cols: 2, cards: [{ kind: "chart", h: 120 }, { kind: "chart", h: 120 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="a visão financeira" alt={{ label: "Ver contas a receber", href: "#/frame/fin-receivables" }} />
          ) : estado === "vazio" ? (
            <Empty
              icon={<Landmark />}
              title="Nenhuma conta bancária conectada"
              hint="Saldo, fluxo de caixa, recebíveis e contas a pagar aparecem aqui assim que a primeira conta for conectada."
              action={
                <Button href="#/frame/fin-bank-accounts">
                  <Plus /> Conectar a primeira conta bancária
                </Button>
              }
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Saldo em contas" value={money(cashBalance)} delta={-0.069} goodWhen="neutral" period="vs. 01/09" href="#/frame/fin-bank-accounts" />
                <KpiCard label="A receber" value={money(receivable30)} hint={`${money(overdue.reduce((s, r) => s + r.value, 0))} vencido`} href="#/frame/fin-receivables" />
                <KpiCard label="A pagar" value={money(payable30)} hint={`${toApprove.length} aguardando sua aprovação`} href="#/frame/fin-payables" />
                <KpiCard label="Lucro líquido do mês" value={money(76_930)} delta={0.143} period="vs. orçado" href="#/frame/fin-dre" />
              </KpiGrid>

              <div className="grid gap-6 lg:grid-cols-3">
                <ChartCard className="lg:col-span-2" title="O caixa fica acima do mínimo nas próximas semanas?" description={`Saldo projetado · mínimo de segurança ${money(minimumCash)}`}>
                  <LineChart
                    label="Saldo projetado por semana"
                    data={projection}
                    index="semana"
                    series={[
                      { key: "saldo", label: "Saldo projetado" },
                      { key: "minimo", label: "Mínimo", dashed: true, color: "var(--ds-amber)" },
                    ]}
                    format={(n) => formatCurrency(n, { cents: false })}
                    formatAxis={money}
                    height={220}
                  />
                </ChartCard>
                <ChartCard title="Liquidez corrente" description="Ativo circulante ÷ passivo circulante">
                  <div className="flex justify-center">
                    <GaugeChart
                      value={1.42}
                      min={0}
                      max={3}
                      label="Liquidez corrente"
                      format={(n) => formatNumber(n, 2)}
                      bands={[
                        { to: 1, tone: "bad", label: "Risco" },
                        { to: 1.5, tone: "warn", label: "Atenção" },
                        { to: 3, tone: "ok", label: "Saudável" },
                      ]}
                      caption="meta ≥ 1,5 até dezembro"
                    />
                  </div>
                </ChartCard>
              </div>

              <div className="grid items-start gap-6 lg:grid-cols-3">
                <ListPanel title="Precisa de você" icon={<TriangleAlert />} count={needsMe} tone="attention" action={<a href="#/frame/fin-payables">Contas a pagar</a>}>
                  {needsMe ? (
                    <ul className="m-0 list-none divide-y divide-line p-0">
                      {toApprove.map((p) => (
                        <li key={p.id}>
                          <ListRow onClick={() => go("fin-payables", p.id)} leading={<Landmark className="h-4 w-4 text-muted" aria-hidden />} kicker={`Aprovar pagamento · vence ${br(p.due)}`} title={p.supplier} meta={formatCurrency(p.value, { cents: false })} />
                        </li>
                      ))}
                      {toCollect.slice(0, 3).map((r) => (
                        <li key={r.id}>
                          <ListRow onClick={() => go("fin-receivables", r.id)} leading={<HandCoins className="h-4 w-4 text-muted" aria-hidden />} kicker={`Cobrar · ${r.doc} · vencido há ${lateDays(r)} dias`} title={customerById(r.customerId).name} meta={formatCurrency(r.value, { cents: false })} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty framed={false} icon={<Landmark />} title="Nada pedindo ação agora" hint="Títulos acima de R$ 20 mil chegam aqui antes de ir ao banco, junto com os vencidos sem promessa de pagamento." />
                  )}
                </ListPanel>
                <section className="rounded-2xl border border-line bg-soft/70 p-[3px]">
                  <div className="flex items-center gap-2 px-3 py-2.5 text-[14px] font-medium">
                    <ArrowLeftRight className="h-4 w-4" /> Conciliação bancária
                  </div>
                  <div className="space-y-4 rounded-card border border-line bg-surface p-4">
                    <div>
                      <div className="flex justify-between text-[13px]">
                        <span className="font-medium">Itaú · extrato de hoje</span>
                        <span className="tabular-nums text-muted">0 de {bankLines.length}</span>
                      </div>
                      <div className="mt-2">
                        <Meter value={0} thick label="Linhas conciliadas" />
                      </div>
                    </div>
                    <p className="m-0 text-[12.5px] leading-relaxed text-muted">{bankLines.filter((b) => (b.confidence ?? 0) >= 0.9).length} linhas têm sugestão segura: dá para conciliar em um clique.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => go("fin-reconciliation", { conta: "itau" })}>
                        Conciliar agora
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => go("fin-bank-accounts")}>
                        Ver contas
                      </Button>
                    </div>
                  </div>
                </section>
                <ListPanel title="Centros acima do orçamento" icon={<TriangleAlert />} count={overBudget.length} action={<a href="#/frame/fin-budget">Orçamento</a>}>
                  {overBudget.length ? (
                    <ul className="list-none divide-y divide-line p-0">
                      {overBudget.map((b) => (
                        <li key={b.id}>
                          <ListRow onClick={() => go("fin-budget")} kicker={b.owner} title={b.center} meta={<span className="text-rose">{formatDelta(b.actual / b.planned - 1, 0)}</span>} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty framed={false} icon={<TriangleAlert />} title="Todos dentro do orçado" hint="Nenhum centro de custo passou do orçamento no mês." />
                  )}
                </ListPanel>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Há quanto tempo o vencido está em aberto?" description="Saldo vencido por faixa de atraso">
                  <ProportionBar
                    items={agingBuckets.map((b, i) => ({ label: b.label, value: overdue.filter((r) => b.test(lateDays(r))).reduce((s, r) => s + r.value, 0), color: ["var(--ds-chart-6)", "var(--ds-amber)", "var(--ds-chart-4)", "var(--ds-rose)", "var(--ds-ink)"][i] }))}
                    format={money}
                  />
                </ChartCard>
                <ChartCard title="Quem mais deve?" description="Títulos vencidos por cliente">
                  <BarList items={debtors} format={money} limit={5} />
                </ChartCard>
              </div>
              {biggest && (
                <p className="m-0 text-[12px] text-muted">
                  Maior título vencido: {customerById(biggest.customerId).name} ({formatCurrency(biggest.value, { cents: false })}). Detalhe em{" "}
                  <a className="text-blue hover:underline" href={`#/frame/fin-receivables?id=${biggest.id}`}>
                    Contas a receber
                  </a>
                  .
                </p>
              )}
            </>
          )}
        </div>
      </Page>
    </NexoShell>
  );
}
