import { ArrowLeftRight, Landmark, TriangleAlert } from "lucide-react";
import {
  BarList,
  Button,
  ChartCard,
  Empty,
  GaugeChart,
  Meter,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  ProportionBar,
  formatCurrency,
  formatPercent,
} from "@g4ai/ds";
import { agingBuckets, bankLines, br, budget, cashBalance, customerById, customers, finUser, lateDays, minimumCash, payables, receivables, weeks } from "./data/fin";
import { go } from "./shells/frame-route";
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
      "Filas de ação (aprovar, conciliar) antes dos detalhes",
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

export default function FinDashboard() {
  let running = cashBalance;
  const projection = weeks.slice(4).map((w) => {
    running += w.entradas + w.saidas;
    return { semana: w.semana, saldo: running, minimo: minimumCash };
  });
  const toApprove = payables.filter((p) => p.status === "aprovacao");
  const overdue = receivables.filter((r) => lateDays(r) > 0);
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
        <PageHeading kicker={`Bom dia, ${finUser.name.split(" ")[0]}`} title="Visão financeira" description="Distribuidora Aço Forte · posição consolidada das contas às 08:00." />
        <div className="mt-6 space-y-6">
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
                  format={(n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
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
            <ListPanel title="Pagamentos para aprovar" icon={<Landmark />} count={toApprove.length} tone="attention" action={<a href="#/frame/fin-payables">Contas a pagar</a>}>
              {toApprove.length ? (
                <ul className="list-none divide-y divide-line p-0">
                  {toApprove.map((p) => (
                    <li key={p.id}>
                      <ListRow onClick={() => go("fin-payables", p.id)} kicker={`vence ${br(p.due)}`} title={p.supplier} meta={formatCurrency(p.value, { cents: false })} />
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty framed={false} icon={<Landmark />} title="Nada para aprovar" hint="Títulos acima de R$ 20 mil chegam aqui antes de ir ao banco." />
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
                      <ListRow onClick={() => go("fin-budget")} kicker={b.owner} title={b.center} meta={<span className="text-rose">+{formatPercent(b.actual / b.planned - 1, 0)}</span>} />
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
        </div>
      </Page>
    </NexoShell>
  );
}
