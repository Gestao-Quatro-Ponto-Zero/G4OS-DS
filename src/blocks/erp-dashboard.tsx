import { Boxes, ClipboardList, FileText, Plus, ShoppingBag, TriangleAlert, Truck } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Badge,
  BarList,
  Button,
  ChartCard,
  Empty,
  ErrorState,
  KpiCard,
  KpiGrid,
  LineChart,
  ListPanel,
  ListRow,
  Page,
  PageHeading,
  ParetoChart,
  SegmentedControl,
  Skeleton,
  cn,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@g4ai/ds";
import { br, customerById, customers, levelInfo, levelOf, me, orderTotal, orders, otifByWeek, lateReasons, poLate, products, purchaseOrders, qtyOf, requestTotal, requestsAwaitingMe, salesByDay, shipmentLate, shipments, supplierById } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Painel de operações",
  description: "Vendas do dia contra a meta, OTIF por semana, causas de atraso (Pareto), maiores clientes e as filas que pedem ação: faturar, repor estoque e aprovar compras.",
  category: "ERP",
  order: 1,
  height: 1640,
  concept: {
    goal: "Mostrar à operação se as vendas estão no ritmo e quais filas pedem ação agora (faturar, repor, aprovar).",
    patterns: [
      "Anatomia B · Painel: cabeçalho fixo com período",
      "Vendas × meta diária, OTIF, causas de atraso (Pareto)",
      "“Precisa de você” num só painel (compras na sua etapa, estoque crítico, compras e entregas atrasadas); a faturar em painel neutro ao lado",
    ],
    adapt: [
      "Painel financeiro, de atendimento ou de recrutamento",
    ],
    avoid: [
      "Gráficos bonitos sem a fila de ação",
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

export default function ErpDashboard() {
  const [range, setRange] = useState<"30" | "7">("30");
  const days = salesByDay.slice(range === "30" ? 0 : -5);
  const sold = days.reduce((s, d) => s + d.vendas, 0);
  const toInvoice = orders.filter((o) => o.status === "aprovado");
  const awaiting = requestsAwaitingMe();
  const latePOs = purchaseOrders.filter(poLate);
  const lateShipments = shipments.filter(shipmentLate);
  const ruptures = products.filter((p) => levelOf(p) === "ruptura" || levelOf(p) === "baixo");
  const needsMe = awaiting.length + ruptures.length + latePOs.length + lateShipments.length;
  const estado = useFrameParam("estado");
  const byCustomer = customers
    .map((c) => ({ label: c.name, value: orders.filter((o) => o.customerId === c.id && o.status !== "cancelado").reduce((s, o) => s + orderTotal(o), 0), href: `#/frame/erp-customers?id=${c.id}` }))
    .filter((c) => c.value);

  return (
    <NexoShell section="painel">
      <Page>
        <PageHeading
          kicker={`Bom dia, ${me.name.split(" ")[0]}`}
          title="Operações"
          description={estado === "vazio" ? "Distribuidora Aço Forte · catálogo ainda sem produtos." : "Distribuidora Aço Forte · Matriz Goiânia e CD Campinas."}
          actions={estado === "vazio" ? undefined : <SegmentedControl label="Período" value={range} onChange={setRange} options={[{ value: "30", label: "Mês" }, { value: "7", label: "Semana" }]} />}
        />
        <div className="mt-6 space-y-6">
          {estado === "carregando" ? (
            <PanelSkeleton
              rows={[
                { cols: 1, cards: [{ kind: "chart", h: 220 }] },
                { cols: 3, cards: [{ kind: "list", span: 2 }, { kind: "list" }] },
                { cols: 2, cards: [{ kind: "chart", h: 240 }, { kind: "chart", h: 240 }] },
              ]}
            />
          ) : estado === "erro" ? (
            <PanelError what="o painel de operações" alt={{ label: "Ver pedidos", href: "#/frame/erp-orders" }} />
          ) : estado === "vazio" ? (
            <Empty
              icon={<Boxes />}
              title="Nenhum produto cadastrado"
              hint="Vendas, estoque, compras e entregas aparecem aqui depois que o catálogo tiver o primeiro produto."
              action={
                <Button href="#/frame/erp-products?novo=1">
                  <Plus /> Cadastrar o primeiro produto
                </Button>
              }
            />
          ) : (
            <>
              <KpiGrid>
                <KpiCard label="Vendido no período" value={formatCurrency(sold, { compact: true })} delta={range === "30" ? 0.071 : 0.034} period={range === "30" ? "vs. mês anterior" : "vs. semana anterior"} spark={days.map((d) => d.vendas)} href="#/frame/erp-orders" />
                <KpiCard label="Aguardando faturamento" value={toInvoice.length} hint={`${formatCurrency(toInvoice.reduce((s, o) => s + orderTotal(o), 0), { compact: true })} em pedidos aprovados`} href="#/frame/erp-orders" />
                <KpiCard label="OTIF da semana" value={formatPercent(otifByWeek[otifByWeek.length - 1].otif / 100, 0)} delta={-0.05} period="vs. semana anterior · meta 95 %" />
                <KpiCard label="Itens críticos" value={ruptures.length} hint="em ruptura ou abaixo do mínimo" href="#/frame/erp-inventory" />
              </KpiGrid>

              <ChartCard title="Estamos vendendo no ritmo da meta?" description={`Vendas por dia útil · meta de ${formatCurrency(42_000, { compact: true })}/dia`} value={formatCurrency(sold, { cents: false })}>
                <AreaChart label="Vendas por dia contra a meta diária" data={days} index="dia" series={[{ key: "vendas", label: "Vendas" }]} reference={{ value: 42_000, label: "Meta diária" }} format={(n) => formatCurrency(n, { cents: false })} formatAxis={formatCompact} height={220} />
              </ChartCard>

              <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-2">
                  <ListPanel title="Precisa de você" icon={<TriangleAlert />} count={needsMe} tone="attention" action={<a href="#/frame/erp-purchase-requests">Requisições</a>}>
                    {needsMe ? (
                      <ul className="m-0 list-none divide-y divide-line p-0">
                        {awaiting.slice(0, 3).map((r) => (
                          <li key={r.id}>
                            <ListRow
                              onClick={() => go("erp-purchase-requests", r.id)}
                              leading={<ClipboardList className="h-4 w-4 text-muted" aria-hidden />}
                              kicker={`Compra aguardando você · ${r.number}${r.urgent ? " · urgente" : ""}`}
                              title={r.title}
                              meta={r.quotes.length ? formatCurrency(requestTotal(r), { compact: true }) : "em cotação"}
                            />
                          </li>
                        ))}
                        {ruptures.slice(0, 3).map((p) => (
                          <li key={p.sku}>
                            <ListRow
                              onClick={() => go("erp-product", p.sku)}
                              leading={<Boxes className="h-4 w-4 text-muted" aria-hidden />}
                              kicker={<>Estoque crítico · <span className="font-mono">{p.sku}</span></>}
                              title={p.name}
                              meta={<Badge tone={levelInfo[levelOf(p)].tone}>{`${formatNumber(qtyOf(p))} ${p.unit}`}</Badge>}
                            />
                          </li>
                        ))}
                        {latePOs.map((o) => (
                          <li key={o.id}>
                            <ListRow
                              onClick={() => go("erp-purchase-order", o.id)}
                              leading={<ShoppingBag className="h-4 w-4 text-muted" aria-hidden />}
                              kicker={<>Compra atrasada · <span className="font-mono">{o.number}</span></>}
                              title={supplierById(o.supplierId).name}
                              meta={<Badge tone="bad">{`previsto ${br(o.expected).slice(0, 5)}`}</Badge>}
                            />
                          </li>
                        ))}
                        {lateShipments.map((sh) => (
                          <li key={sh.id}>
                            <ListRow
                              onClick={() => go("erp-shipping", sh.id)}
                              leading={<Truck className="h-4 w-4 text-muted" aria-hidden />}
                              kicker={`Entrega atrasada · ${sh.id} · ${sh.carrier}`}
                              title={customerById(orders.find((o) => o.id === sh.orderId)?.customerId ?? "").name}
                              meta={`${sh.dest.city}/${sh.dest.uf}`}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty framed={false} icon={<TriangleAlert />} title="Nada pedindo ação agora" hint="Compras na sua etapa, estoque crítico e entregas ou compras atrasadas aparecem aqui." />
                    )}
                  </ListPanel>
                </div>
                <ListPanel title="Aguardando faturamento" icon={<FileText />} count={toInvoice.length} action={<a href="#/frame/erp-orders">Pedidos</a>}>
                  {toInvoice.length ? (
                    <ul className="m-0 list-none divide-y divide-line p-0">
                      {toInvoice.slice(0, 5).map((o) => (
                        <li key={o.id}>
                          <ListRow onClick={() => go("erp-order", o.id)} kicker={<span className="font-mono">{o.number}</span>} title={customerById(o.customerId).name} meta={formatCurrency(orderTotal(o), { compact: true })} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty framed={false} icon={<FileText />} title="Nada para faturar" hint="Pedidos aprovados aparecem aqui até virar NF-e." />
                  )}
                </ListPanel>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Por que atrasamos entregas?" description="Pedidos entregues fora do prazo em setembro, por causa">
                  <ParetoChart items={lateReasons} height={240} />
                </ChartCard>
                <div className="grid gap-6">
                  <ChartCard title="Entregamos no prazo e completo?" description="OTIF por semana · meta 95 %">
                    <LineChart label="OTIF por semana" data={otifByWeek} index="semana" series={[{ key: "otif", label: "OTIF" }]} reference={{ value: 95, label: "Meta 95 %" }} format={(n) => formatPercent(n / 100, 0)} height={150} />
                  </ChartCard>
                  <ChartCard title="Quem mais compra?" description="Pedidos não cancelados no período">
                    <BarList items={byCustomer} format={(n) => formatCurrency(n, { compact: true })} limit={5} />
                  </ChartCard>
                </div>
              </div>
            </>
          )}
        </div>
      </Page>
    </NexoShell>
  );
}
