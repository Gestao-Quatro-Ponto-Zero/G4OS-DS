import { ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Badge,
  Button,
  ChartCard,
  CurrencyField,
  DataTable,
  KpiCard,
  KpiGrid,
  Meter,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  SplitLayout,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  type Column,
} from "@g4ai/ds";
import { br, coverageDays, levelInfo, levelOf, movementsOf, productBySku, qtyOf, supplierById, warehouses, type Product } from "./data/erp";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Produto",
  description: "Página do SKU: saldo por depósito contra o mínimo, projeção de estoque em 30 dias, preço e margem, fornecedor e histórico de movimentações. Ajuste de preço e pedido de compra.",
  category: "ERP",
  order: 6,
  height: 1100,
  concept: {
    goal: "Entender um SKU: onde está o estoque, quando acaba, margem e quem fornece.",
    patterns: [
      "Anatomia C · Registro: propriedades fixas à direita",
      "Saldo por depósito contra o mínimo; projeção de 30 dias",
      "Ajuste de preço e pedido de compra em modal",
    ],
    adapt: [
      "Plano (SaaS), vaga (ATS), contrato",
    ],
    avoid: [
      "Projeção sem a linha do mínimo",
    ],
  },
} as const;

type Movement = ReturnType<typeof movementsOf>[number];

export default function ErpProduct() {
  const id = useFrameParam("id", "CHP-2210");
  return <ProductPage key={id} product={productBySku(id)} />;
}

function ProductPage({ product }: { product: Product }) {
  const [price, setPrice] = useState(product.price);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<number | null>(product.price);
  const p = { ...product, price };
  const total = qtyOf(p);
  const margin = (p.price - p.cost) / p.price;
  const supplier = supplierById(p.supplierId);
  const l = levelOf(p);
  const projection = Array.from({ length: 31 }, (_, d) => ({ dia: d === 0 ? "hoje" : `+${d}d`, saldo: Math.max(0, total - p.dailyUse * d) + (d >= supplier.leadTime && total < p.min * 2 ? p.min * 2 : 0), minimo: p.min }));
  const columns: Column<Movement>[] = [
    { key: "date", header: "Data", nowrap: true, cell: (m) => <span className="tabular-nums text-muted">{br(m.date)}</span> },
    { key: "kind", header: "Movimento", primary: true, cell: (m) => m.kind },
    { key: "doc", header: "Documento", nowrap: true, mobileHidden: true, cell: (m) => <span className="font-mono text-[12px]">{m.doc}</span> },
    { key: "wh", header: "Depósito", mobileHidden: true, cell: (m) => m.warehouse },
    { key: "qty", header: "Quantidade", align: "right", nowrap: true, cell: (m) => <span className={m.qty > 0 ? "font-medium tabular-nums text-ok" : "tabular-nums"}>{m.qty > 0 ? "+" : "−"}{formatNumber(Math.abs(m.qty))} {p.unit}</span> },
  ];
  return (
    <NexoShell section="estoque">
      <Page>
        <PageHeading
          crumbs={[{ label: "Estoque", href: "#/frame/erp-inventory" }, { label: p.category }]}
          title={p.name}
          description={`${p.sku} · NCM ${p.ncm} · unidade: ${p.unit}`}
          actions={
            <>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                <Tag /> Ajustar preço
              </Button>
              <Button
                onClick={() => {
                  notify(`Requisição de ${formatNumber(p.min * 3 - total)} ${p.unit} de ${p.sku} enviada para Compras`);
                  go("erp-purchase-requests");
                }}
                disabled={total >= p.min * 3}
              >
                <ShoppingBag /> Pedir compra
              </Button>
            </>
          }
        />
        <div className="mt-3">
          <Badge tone={levelInfo[l].tone}>{levelInfo[l].label}</Badge>
        </div>
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Saldo total" value={`${formatNumber(total)} ${p.unit}`} hint={`mínimo ${formatNumber(p.min)} ${p.unit}`} />
            <KpiCard label="Cobertura" value={coverageDays(p) === Infinity ? "—" : `${coverageDays(p)} dias`} hint={`consumo médio ${p.dailyUse} ${p.unit}/dia`} />
            <KpiCard label="Preço de venda" value={formatCurrency(p.price)} hint={`custo ${formatCurrency(p.cost)}`} />
            <KpiCard label="Margem bruta" value={formatPercent(margin)} delta={margin - 0.33} goodWhen="up" period="vs. meta de 33 %" />
          </KpiGrid>
          <SplitLayout
            asideWidth={320}
            main={
              <div className="space-y-6">
                <ChartCard title="Quando o estoque acaba?" description={`Projeção no consumo médio · reposição chega em ${supplier.leadTime} dias se pedida hoje`}>
                  <AreaChart label={`Projeção de saldo de ${p.sku} nos próximos 30 dias`} data={projection} index="dia" series={[{ key: "saldo", label: "Saldo projetado" }]} reference={{ value: p.min, label: `Mínimo ${p.min}` }} height={200} format={(n) => `${formatNumber(n)} ${p.unit}`} />
                </ChartCard>
                <section>
                  <h2 className="mb-3 text-[14px] font-medium">Movimentações recentes</h2>
                  <DataTable rows={movementsOf(p)} columns={columns} rowKey={(m) => m.id} />
                </section>
              </div>
            }
            aside={
              <>
                <section className="space-y-4 rounded-xl border border-line bg-surface p-4">
                  <h2 className="m-0 text-[13px] font-medium">Por depósito</h2>
                  {warehouses.map((w) => (
                    <div key={w.id}>
                      <div className="flex justify-between text-[12.5px]">
                        <span>{w.name}</span>
                        <span className={p.stock[w.id] === 0 ? "font-medium text-rose" : "tabular-nums"}>
                          {formatNumber(p.stock[w.id])} {p.unit}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <Meter value={Math.min(100, (p.stock[w.id] / (p.min * 1.5)) * 100)} thick tone={p.stock[w.id] === 0 ? "bad" : "ink"} label={`Saldo no ${w.name}`} />
                      </div>
                    </div>
                  ))}
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <PropertyList
                    items={[
                      { label: "Fornecedor", value: <a className="text-blue hover:underline" href={`#/frame/erp-suppliers?id=${supplier.id}`}>{supplier.name}</a>, hint: `OTIF ${formatPercent(supplier.otif, 0)} · prazo ${supplier.leadTime} dias` },
                      { label: "Custo médio", value: formatCurrency(p.cost) },
                      { label: "Valor em estoque", value: formatCurrency(total * p.cost, { cents: false }) },
                      { label: "Categoria", value: p.category },
                    ]}
                  />
                </section>
              </>
            }
          />
        </div>
      </Page>
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Ajustar preço de venda"
        description="Vale para novos pedidos. Pedidos já aprovados mantêm o preço combinado."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!draft}
              onClick={() => {
                const before = price;
                setPrice(draft ?? price);
                setEditing(false);
                notify(`Preço de ${p.sku} alterado para ${formatCurrency(draft ?? price)}`, () => setPrice(before));
              }}
            >
              Salvar preço
            </Button>
          </>
        }
      >
        <CurrencyField label="Novo preço" value={draft} onChange={setDraft} hint={draft ? `Margem resultante: ${formatPercent((draft - p.cost) / draft)}` : `Custo: ${formatCurrency(p.cost)}`} error={draft && draft < p.cost ? "Abaixo do custo: a venda daria prejuízo." : undefined} />
      </Modal>
    </NexoShell>
  );
}
