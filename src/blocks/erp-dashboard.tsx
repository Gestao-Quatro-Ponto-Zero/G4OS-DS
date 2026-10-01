import { Boxes, ClipboardList, FileText } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Badge,
  BarList,
  ChartCard,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  ParetoChart,
  SegmentedControl,
  formatCompact,
  formatCurrency,
  formatNumber,
} from "@g4ai/ds";
import { customerById, customers, levelInfo, levelOf, me, orderTotal, orders, otifByWeek, lateReasons, products, qtyOf, salesByDay } from "./data/erp";
import { go } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel de operações",
  description: "Vendas do dia contra a meta, OTIF por semana, causas de atraso (Pareto), maiores clientes e as filas que pedem ação: faturar, repor estoque e aprovar compras.",
  category: "ERP",
  order: 1,
  height: 1300,
  concept: {
    goal: "Mostrar à operação se as vendas estão no ritmo e quais filas pedem ação agora (faturar, repor, aprovar).",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período",
      "Vendas × meta diária, OTIF, causas de atraso (Pareto)",
      "Filas de ação antes dos detalhes",
    ],
    adapt: [
      "Painel financeiro, de atendimento ou de recrutamento",
    ],
    avoid: [
      "Gráficos bonitos sem a fila de ação",
    ],
  },
} as const;

export default function ErpDashboard() {
  const [range, setRange] = useState<"30" | "7">("30");
  const days = salesByDay.slice(range === "30" ? 0 : -5);
  const sold = days.reduce((s, d) => s + d.vendas, 0);
  const toInvoice = orders.filter((o) => o.status === "aprovado");
  const ruptures = products.filter((p) => levelOf(p) === "ruptura" || levelOf(p) === "baixo");
  const byCustomer = customers
    .map((c) => ({ label: c.name, value: orders.filter((o) => o.customerId === c.id && o.status !== "cancelado").reduce((s, o) => s + orderTotal(o), 0), href: `#/frame/erp-customers?id=${c.id}` }))
    .filter((c) => c.value);

  return (
    <NexoShell section="painel">
      <Page>
        <PageHeading
          kicker={`Bom dia, ${me.name.split(" ")[0]}`}
          title="Operações"
          description="Distribuidora Aço Forte · Matriz Goiânia e CD Campinas."
          actions={<SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "30", label: "Mês" }, { value: "7", label: "Semana" }]} />}
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Vendido no período" value={formatCurrency(sold, { compact: true })} delta={range === "30" ? 0.071 : 0.034} period={range === "30" ? "vs. mês anterior" : "vs. semana anterior"} spark={days.map((d) => d.vendas)} href="#/frame/erp-orders" />
            <KpiCard label="Aguardando faturamento" value={toInvoice.length} hint={`${formatCurrency(toInvoice.reduce((s, o) => s + orderTotal(o), 0), { compact: true })} em pedidos aprovados`} href="#/frame/erp-orders" />
            <KpiCard label="OTIF da semana" value={`${Math.round(otifByWeek[otifByWeek.length - 1].otif)} %`} delta={-0.05} period="vs. semana anterior · meta 95 %" />
            <KpiCard label="Itens críticos" value={ruptures.length} hint="em ruptura ou abaixo do mínimo" href="#/frame/erp-inventory" />
          </KpiGrid>

          <ChartCard title="Estamos vendendo no ritmo da meta?" description={`Vendas por dia útil · meta de ${formatCurrency(42_000, { compact: true })}/dia`} value={formatCurrency(sold, { cents: false })}>
            <AreaChart label="Vendas por dia contra a meta diária" data={days} index="dia" series={[{ key: "vendas", label: "Vendas" }]} reference={{ value: 42_000, label: "Meta diária" }} format={(n) => formatCurrency(n, { cents: false })} formatAxis={formatCompact} height={220} />
          </ChartCard>

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <ListPanel title="Aguardando faturamento" icon={<FileText />} count={toInvoice.length} action={<a href="#/frame/erp-orders">Pedidos</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {toInvoice.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <ListRow onClick={() => go("erp-order", o.id)} kicker={<span className="font-mono">{o.number}</span>} title={customerById(o.customerId).name} meta={formatCurrency(orderTotal(o), { compact: true })} />
                  </li>
                ))}
              </ul>
            </ListPanel>
            <ListPanel title="Estoque crítico" icon={<Boxes />} count={ruptures.length} tone="attention" action={<a href="#/frame/erp-inventory">Estoque</a>}>
              <ul className="list-none divide-y divide-line p-0">
                {ruptures.slice(0, 5).map((p) => (
                  <li key={p.sku}>
                    <ListRow onClick={() => go("erp-product", p.sku)} kicker={<span className="font-mono">{p.sku}</span>} title={p.name} meta={<Badge tone={levelInfo[levelOf(p)].tone}>{formatNumber(qtyOf(p))} {p.unit}</Badge>} />
                  </li>
                ))}
              </ul>
            </ListPanel>
            <ListPanel title="Compras aguardando você" icon={<ClipboardList />} count={2} action={<a href="#/frame/erp-purchase-requests">Compras</a>}>
              <ul className="list-none divide-y divide-line p-0">
                <li>
                  <ListRow onClick={() => go("erp-purchase-requests")} kicker="RC-2026-0412 · urgente" title="Reposição de chapas 2 e 3 mm" meta="R$ 96 mil" />
                </li>
                <li>
                  <ListRow onClick={() => go("erp-purchase-requests")} kicker="RC-2026-0409" title="Notebooks para o time comercial" meta="R$ 31 mil" />
                </li>
              </ul>
            </ListPanel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Por que atrasamos entregas?" description="Pedidos entregues fora do prazo em setembro, por causa">
              <ParetoChart items={lateReasons} height={240} />
            </ChartCard>
            <div className="grid gap-6">
              <ChartCard title="Entregamos no prazo e completo?" description="OTIF por semana · meta 95 %">
                <LineChart label="OTIF por semana" data={otifByWeek} index="semana" series={[{ key: "otif", label: "OTIF" }]} reference={{ value: 95, label: "Meta 95 %" }} format={(n) => `${n.toFixed(0)} %`} height={150} />
              </ChartCard>
              <ChartCard title="Quem mais compra?" description="Pedidos não cancelados no período">
                <BarList items={byCustomer} format={(n) => formatCurrency(n, { compact: true })} limit={5} />
              </ChartCard>
            </div>
          </div>
        </div>
      </Page>
    </NexoShell>
  );
}
