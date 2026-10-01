import { ArrowDownUp, PackagePlus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ChartCard,
  DataTable,
  EmptyFilterResult,
  FieldBlock,
  FilterBar,
  Highlight,
  KpiCard,
  Meter,
  Modal,
  NumberField,
  Page,
  PageHeading,
  Select,
  SortHeader,
  TableSearch,
  TextField,
  Treemap,
  formatCurrency,
  formatNumber,
  notify,
  useFilters,
  useSort,
  type Column,
  type FilterField, PageToolbar
} from "@g4os/ds";
import { categories, coverageDays, levelInfo, levelOf, products as seed, qtyOf, today, warehouses, type Level, type Product, type WarehouseId } from "./data/erp";
import { go } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Estoque",
  description: "Saldo por item com quebra por depósito, régua contra o mínimo, cobertura em dias, ruptura com requisição de compra, transferência e entrada de mercadoria. Linha abre o produto.",
  category: "ERP",
  order: 5,
  height: 1180,
  concept: {
    goal: "Evitar ruptura: ver o saldo por depósito contra o mínimo e repor a tempo.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Régua de saldo contra o mínimo e cobertura em dias",
      "Ruptura vira requisição de compra em um clique",
      "Linha abre o produto",
    ],
    adapt: [
      "Licenças (SaaS), capacidade de equipes, vagas por área",
    ],
    avoid: [
      "Mostrar saldo sem o mínimo de referência",
    ],
  },
} as const;

const fields: FilterField<Product>[] = [
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (p) => p.category, options: categories.map((c) => ({ value: c, label: c })) },
  { key: "level", label: "Situação", type: "enum", quick: true, accessor: levelOf, options: (Object.keys(levelInfo) as Level[]).map((l) => ({ value: l, label: levelInfo[l].label })) },
  { key: "warehouse", label: "Com saldo em", type: "enum", accessor: (p) => warehouses.filter((w) => p.stock[w.id] > 0).map((w) => w.id), options: warehouses.map((w) => ({ value: w.id, label: w.name })) },
  { key: "coverage", label: "Cobertura", type: "number", unit: "dias", accessor: (p) => (coverageDays(p) === Infinity ? 999 : coverageDays(p)) },
  { key: "value", label: "Valor em estoque", type: "currency", accessor: (p) => qtyOf(p) * p.cost },
];

export default function ErpInventory() {
  const [items, setItems] = useState(seed);
  const [modal, setModal] = useState<"transfer" | "entry" | null>(null);
  const [sku, setSku] = useState(seed[1].sku);
  const [from, setFrom] = useState<WarehouseId>("gyn");
  const [qty, setQty] = useState<number | null>(10);
  const [nf, setNf] = useState("");
  const filters = useFilters(items, { fields, search: (p) => [p.sku, p.name, p.ncm], now: today, url: "e_" });
  const sort = useSort(filters.rows, { item: (p) => p.name, saldo: (p) => qtyOf(p) / p.min, cobertura: coverageDays, valor: (p) => qtyOf(p) * p.cost }, { key: "saldo", dir: "asc" });
  const q = filters.state.query;
  const critical = items.filter((p) => levelOf(p) === "ruptura" || levelOf(p) === "baixo");
  const stockValue = items.reduce((s, p) => s + qtyOf(p) * p.cost, 0);
  const byCategory = categories.map((label) => ({ label, value: items.filter((p) => p.category === label).reduce((s, p) => s + qtyOf(p) * p.cost, 0) }));
  const to: WarehouseId = from === "gyn" ? "cps" : "gyn";

  const apply = () => {
    if (!qty) return;
    const p = items.find((x) => x.sku === sku)!;
    const before = items;
    if (modal === "transfer") {
      const n = Math.min(qty, p.stock[from]);
      setItems((all) => all.map((x) => (x.sku === sku ? { ...x, stock: { ...x.stock, [from]: x.stock[from] - n, [to]: x.stock[to] + n } } : x)));
      notify(`${n} ${p.unit} de ${p.sku} transferidos para ${warehouses.find((w) => w.id === to)?.name}`, () => setItems(before));
    } else {
      setItems((all) => all.map((x) => (x.sku === sku ? { ...x, stock: { ...x.stock, [from]: x.stock[from] + qty } } : x)));
      notify(`Entrada de ${qty} ${p.unit} de ${p.sku} registrada${nf ? ` (NF ${nf})` : ""}`, () => setItems(before));
    }
    setModal(null);
  };

  const columns: Column<Product>[] = [
    {
      key: "item",
      header: <SortHeader label="Item" {...sort.header("item")} />,
      primary: true,
      cell: (p) => (
        <span className="block min-w-0">
          <Highlight text={p.name} query={q} className="block truncate" />
          <span className="block font-mono text-[11.5px] font-normal text-muted">
            <Highlight text={p.sku} query={q} /> · {p.category}
          </span>
        </span>
      ),
    },
    {
      key: "wh",
      header: "Por depósito",
      mobileHidden: true,
      nowrap: true,
      cell: (p) => (
        <span className="block text-[12px] tabular-nums text-ink-soft">
          {warehouses.map((w) => (
            <span key={w.id} className={p.stock[w.id] === 0 ? "block text-muted" : "block"}>
              {w.name.replace("CD ", "")}: {formatNumber(p.stock[w.id])}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: "qty",
      header: <SortHeader label="Saldo × mínimo" {...sort.header("saldo")} />,
      nowrap: true,
      cell: (p) => {
        const l = levelOf(p);
        return (
          <span className="flex w-44 flex-col gap-1.5">
            <span className="flex justify-between text-[12.5px] tabular-nums">
              <span className={l === "ruptura" ? "font-medium text-rose" : l === "baixo" ? "font-medium text-amber" : "font-medium"}>
                {formatNumber(qtyOf(p))} {p.unit}
              </span>
              <span className="text-muted">mín. {formatNumber(p.min)}</span>
            </span>
            <Meter value={Math.min(100, (qtyOf(p) / (p.min * 3)) * 100)} thick tone={l === "ruptura" ? "bad" : l === "baixo" ? "warn" : "ink"} label={`Saldo de ${p.name}`} />
          </span>
        );
      },
    },
    {
      key: "cov",
      header: <SortHeader label="Cobertura" {...sort.header("cobertura")} />,
      nowrap: true,
      cell: (p) => {
        const c = coverageDays(p);
        return <span className={c < 7 ? "font-medium text-rose" : c < 15 ? "text-amber" : "text-ink-soft"}>{c === Infinity ? "—" : `${c} dias`}</span>;
      },
    },
    { key: "value", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", nowrap: true, mobileHidden: true, cell: (p) => <span className="tabular-nums">{formatCurrency(qtyOf(p) * p.cost, { cents: false })}</span> },
    { key: "level", header: "Situação", cell: (p) => <Badge tone={levelInfo[levelOf(p)].tone}>{levelInfo[levelOf(p)].label}</Badge> },
  ];

  return (
    <NexoShell section="estoque">
      <Page>
        <PageHeading
          title="Estoque"
          description="Saldo físico por depósito. Cobertura: quantos dias o saldo dura no consumo médio dos últimos 30 dias."
          actions={
            <>
              <Button variant="ghost" onClick={() => setModal("transfer")}>
                <ArrowDownUp /> Transferir
              </Button>
              <Button onClick={() => setModal("entry")}>
                <PackagePlus /> Entrada de mercadoria
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          {critical.length > 0 && (
            <Callout
              tone="bad"
              title={`${critical.length} itens em ruptura ou abaixo do mínimo`}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    notify(`Requisição de compra criada com ${critical.length} itens · aguarda aprovação`);
                    go("erp-purchase-requests");
                  }}
                >
                  <ShoppingBag /> Gerar requisição
                </Button>
              }
            >
              {critical.map((p) => p.name).slice(0, 3).join(", ")}
              {critical.length > 3 ? ` e mais ${critical.length - 3}` : ""}. Sugestão: repor até 3× o mínimo.
            </Callout>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-2">
              <KpiCard label="Valor em estoque" value={formatCurrency(stockValue, { cents: false })} delta={-0.034} goodWhen="neutral" period="vs. 31/08" />
              <KpiCard label="Giro (30 dias)" value="2,4×" delta={0.08} period="vs. média do semestre" />
              <KpiCard label="Itens em ruptura" value={items.filter((p) => levelOf(p) === "ruptura").length} hint="vendas perdidas: R$ 18,4 mil na semana" />
              <KpiCard label="Acurácia do inventário" value="98,6 %" delta={0.004} period="último inventário rotativo" />
            </div>
            <ChartCard title="Onde está o dinheiro parado?" description="Valor em estoque por categoria">
              <Treemap items={byCategory} format={(n) => formatCurrency(n, { compact: true })} label="Valor em estoque por categoria" height={300} />
            </ChartCard>
          </div>

          <div className="space-y-4">
            <PageToolbar>
              <FilterBar filters={filters} noun="item" nounPlural="itens" search={<TableSearch value={q} onChange={filters.setQuery} total={items.length} noun="item" nounPlural="itens" searchIn="SKU, descrição e NCM" />} />
            </PageToolbar>
            <DataTable rows={sort.rows} columns={columns} rowKey={(p) => p.sku} onRowClick={(p) => go("erp-product", p.sku)} rowLabel={(p) => `Abrir ${p.name}`} empty={<EmptyFilterResult filters={filters} noun="item" nounPlural="itens" />} />
          </div>
        </div>
      </Page>
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "transfer" ? "Transferir entre depósitos" : "Entrada de mercadoria"}
        description={modal === "transfer" ? "Gera a NF de transferência e baixa o saldo na origem." : "Sem nota do fornecedor, a entrada fica como provisória até a conferência."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={apply} disabled={!qty}>
              {modal === "transfer" ? "Transferir" : "Registrar entrada"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldBlock label="Produto" className="sm:col-span-2">
            <Select label="Produto" value={sku} onValueChange={setSku} options={items.map((p) => ({ value: p.sku, label: `${p.sku} · ${p.name}` }))} />
          </FieldBlock>
          <FieldBlock label={modal === "transfer" ? `De (saldo ${items.find((p) => p.sku === sku)?.stock[from]})` : "Depósito"}>
            <Select label="Depósito" value={from} onValueChange={(v) => setFrom(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          </FieldBlock>
          <NumberField label="Quantidade" value={qty} onChange={setQty} min={1} />
          {modal === "transfer" ? (
            <p className="m-0 text-[12.5px] text-muted sm:col-span-2">Destino: {warehouses.find((w) => w.id === to)?.name}</p>
          ) : (
            <TextField className="sm:col-span-2" label="Nº da NF do fornecedor" value={nf} onChange={setNf} optional />
          )}
        </div>
      </Modal>
    </NexoShell>
  );
}
