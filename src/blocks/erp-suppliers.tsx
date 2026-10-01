import { FileQuestion, Mail, Plus } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BarList,
  BulletChart,
  Button,
  ChartCard,
  DataTable,
  Drawer,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  ListRow,
  Page,
  PageHeading,
  PropertyList,
  ScatterChart,
  SortHeader,
  TableSearch,
  formatCurrency,
  formatPercent,
  notify,
  useFilters,
  useSort,
  type Column,
  type FilterField, PageToolbar
} from "@g4os/ds";
import { br, products, suppliers, today, type Supplier } from "./data/erp";
import { payableStatus, payables } from "./data/fin";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Fornecedores",
  description: "Fornecedores com classificação A/B/C, OTIF contra a meta, prazo de entrega, gasto no ano e compras em aberto. Dispersão prazo × pontualidade e detalhe em gaveta.",
  category: "ERP",
  order: 8,
  height: 1100,
  concept: {
    goal: "Escolher e acompanhar fornecedores por pontualidade, prazo e gasto.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Classificação A/B/C e OTIF contra a meta",
      "Dispersão prazo × pontualidade para achar os problemáticos",
      "Detalhe em gaveta",
    ],
    adapt: [
      "Parceiros, agências, transportadoras",
    ],
    avoid: [
      "Nota do fornecedor sem os critérios",
    ],
  },
} as const;

const ratingTone = { A: "ok", B: "info", C: "warn" } as const;
const fields: FilterField<Supplier>[] = [
  { key: "rating", label: "Classificação", type: "enum", quick: true, accessor: (s) => s.rating, options: ["A", "B", "C"].map((r) => ({ value: r, label: `Classe ${r}` })) },
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (s) => s.category, options: [...new Set(suppliers.map((s) => s.category))].map((c) => ({ value: c, label: c })) },
  { key: "otif", label: "OTIF (%)", type: "number", accessor: (s) => Math.round(s.otif * 100) },
  { key: "lead", label: "Prazo de entrega", type: "number", unit: "dias", accessor: (s) => s.leadTime },
  { key: "spend", label: "Gasto no ano", type: "currency", accessor: (s) => s.spendYtd },
];

export default function ErpSuppliers() {
  const id = useFrameParam("id");
  const [open, setOpen] = useState<string | null>(id);
  const filters = useFilters(suppliers, { fields, search: (s) => [s.name, s.cnpj, s.cnpj.replace(/\D/g, ""), s.category, s.contact], now: today, url: "f_" });
  const sort = useSort(filters.rows, { nome: (s) => s.name, otif: (s) => s.otif, gasto: (s) => s.spendYtd }, { key: "gasto", dir: "desc" });
  const q = filters.state.query;
  const s = suppliers.find((x) => x.id === open);

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: <SortHeader label="Fornecedor" {...sort.header("nome")} />,
      primary: true,
      cell: (x) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={x.name} tint={x.tint} className="h-8 w-8 text-[12px]" />
          <span className="min-w-0">
            <Highlight text={x.name} query={q} className="block truncate" />
            <span className="block truncate text-[12px] font-normal text-muted">{x.category} · {x.city}</span>
          </span>
        </span>
      ),
    },
    { key: "rating", header: "Classe", cell: (x) => <Badge tone={ratingTone[x.rating]}>{x.rating}</Badge> },
    { key: "otif", header: <SortHeader label="OTIF" align="right" {...sort.header("otif")} />, align: "right", nowrap: true, cell: (x) => <span className={x.otif < 0.85 ? "font-medium text-rose" : x.otif < 0.92 ? "text-amber" : "font-medium"}>{formatPercent(x.otif, 0)}</span> },
    { key: "lead", header: "Prazo", align: "right", nowrap: true, cell: (x) => `${x.leadTime} dias` },
    { key: "open", header: "Em aberto", align: "right", nowrap: true, mobileHidden: true, cell: (x) => (x.openPOs ? formatCurrency(x.openPOs, { cents: false }) : <span className="text-muted">—</span>) },
    { key: "spend", header: <SortHeader label="Gasto no ano" align="right" {...sort.header("gasto")} />, align: "right", nowrap: true, cell: (x) => <span className="tabular-nums">{formatCurrency(x.spendYtd, { compact: true })}</span> },
  ];

  return (
    <NexoShell section="fornecedores">
      <Page>
        <PageHeading
          title="Fornecedores"
          description="OTIF: pedidos entregues no prazo e completos nos últimos 90 dias. Meta: 95 %."
          actions={
            <Button onClick={() => notify("Cadastro de fornecedor: informe o CNPJ para buscar os dados na Receita", undefined, "info")}>
              <Plus /> Novo fornecedor
            </Button>
          }
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Quem entrega rápido e no prazo?" description="Prazo médio × OTIF · bolha = gasto no ano">
            <ScatterChart
              points={suppliers.map((x) => ({ id: x.id, label: x.name, x: x.leadTime, y: Math.round(x.otif * 100), size: x.spendYtd, group: `Classe ${x.rating}` }))}
              xLabel="Prazo de entrega (dias)"
              yLabel="OTIF (%)"
              groups={["Classe A", "Classe B", "Classe C"]}
              height={240}
            />
          </ChartCard>
          <ChartCard title="Com quem mais gastamos?" description="Compras em 2026">
            <BarList items={suppliers.map((x) => ({ label: x.name, value: x.spendYtd, href: `#/frame/erp-suppliers?id=${x.id}` }))} format={(n) => formatCurrency(n, { compact: true })} showShare limit={6} />
          </ChartCard>
        </div>
        <div className="mt-6 space-y-4">
          <PageToolbar>
            <FilterBar filters={filters} noun="fornecedor" nounPlural="fornecedores" search={<TableSearch value={q} onChange={filters.setQuery} total={suppliers.length} noun="fornecedor" nounPlural="fornecedores" searchIn="nome, CNPJ, categoria e contato" />} />
          </PageToolbar>
          <DataTable rows={sort.rows} columns={columns} rowKey={(x) => x.id} onRowClick={(x) => setOpen(x.id)} rowLabel={(x) => `Abrir ${x.name}`} empty={<EmptyFilterResult filters={filters} noun="fornecedor" nounPlural="fornecedores" />} />
        </div>
      </Page>
      <Drawer
        open={!!s}
        onClose={() => setOpen(null)}
        kicker={s ? `${s.category} · Classe ${s.rating}` : undefined}
        title={s?.name ?? ""}
        width={520}
        footer={
          s && (
            <>
              <Button variant="ghost" href={`mailto:${s.email}`}>
                <Mail /> E-mail
              </Button>
              <Button onClick={() => notify(`Pedido de cotação enviado para ${s.name}`)}>
                <FileQuestion /> Pedir cotação
              </Button>
            </>
          )
        }
      >
        {s && (
          <div className="space-y-6">
            <div className="space-y-3">
              <BulletChart label="OTIF" hint="últimos 90 dias" value={Math.round(s.otif * 100)} target={95} max={100} format={(n) => `${n}%`} />
              <BulletChart label="Prazo" hint="dias úteis · meta 5" value={s.leadTime} target={5} max={15} format={(n) => `${n} d`} />
            </div>
            <PropertyList
              items={[
                { label: "CNPJ", value: <span className="tabular-nums">{s.cnpj}</span> },
                { label: "Cidade", value: s.city },
                { label: "Contato", value: s.contact, hint: s.email },
                { label: "Última compra", value: br(s.lastPurchase) },
                { label: "Produtos que fornece", value: products.filter((p) => p.supplierId === s.id).map((p) => p.sku).join(", ") || undefined },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">Títulos a pagar</h3>
              {payables.filter((p) => p.supplierId === s.id).length ? (
                <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                  {payables
                    .filter((p) => p.supplierId === s.id)
                    .map((p) => (
                      <li key={p.id}>
                        <ListRow onClick={() => go("fin-payables", p.id)} kicker={`${p.doc} · vence ${br(p.due)}`} title={formatCurrency(p.value)} meta={<Badge tone={payableStatus[p.status].tone}>{payableStatus[p.status].label}</Badge>} />
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="m-0 text-[12.5px] text-muted">Nenhum título em aberto.</p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </NexoShell>
  );
}
