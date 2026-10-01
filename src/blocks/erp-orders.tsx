import { Ban, FileText, Printer, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  DataGrid,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  SegmentedControl,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  formatCurrency,
  notify,
  useFilters,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { br, customerById, customers, orderFlow, orderStatus, orderTotal, orders as seed, products, sellers, today, user, type Order, type OrderStatus, type Payment } from "./data/erp";
import { go } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pedidos de venda",
  description: "Pedidos em DataGrid: abas por situação, agrupamento com subtotal, itens expansíveis na linha, total fixo no rodapé, faturamento em massa, ações rápidas e CSV. Linha abre o pedido.",
  category: "ERP",
  order: 2,
  height: 900,
  concept: {
    goal: "Operar pedidos em volume: agrupar por situação, ver itens sem abrir e faturar em massa.",
    patterns: [
      "Anatomia A · Lista com DataGrid: rolagem interna, total fixo no rodapé",
      "Abas por situação + agrupamento com subtotal",
      "Itens expansíveis na linha; faturamento em massa",
      "Ações rápidas e CSV",
    ],
    adapt: [
      "Chamados agrupados por prioridade, títulos por vencimento",
    ],
    avoid: [
      "Subtotal só no fim da página",
    ],
  },
} as const;

const payments: Payment[] = ["Pix", "Boleto 28 dias", "Cartão 3x", "Boleto 30/60/90"];
const fields: FilterField<Order>[] = [
  { key: "seller", label: "Vendedor", type: "person", quick: true, accessor: (o) => o.seller, options: sellers.map((s) => ({ value: s.id, label: s.name })) },
  { key: "payment", label: "Pagamento", type: "enum", quick: true, accessor: (o) => o.payment, options: payments.map((s) => ({ value: s, label: s })) },
  { key: "total", label: "Total", type: "currency", accessor: orderTotal },
  { key: "date", label: "Emissão", type: "date", accessor: (o) => o.date },
  { key: "uf", label: "UF", type: "enum", accessor: (o) => customerById(o.customerId).uf, options: [...new Set(customers.map((c) => c.uf))].sort().map((u) => ({ value: u, label: u })) },
  { key: "items", label: "Qtd. de itens", type: "number", accessor: (o) => o.items.length },
  { key: "customer", label: "Cliente", type: "text", accessor: (o) => customerById(o.customerId).name },
];
// CNPJ sem pontuação também acha: "98765432" encontra "98.765.432/0001-10".
const searchText = (o: Order) => {
  const c = customerById(o.customerId);
  return [o.number, c.name, c.cnpj, c.cnpj.replace(/\D/g, ""), o.number.replace(/\D/g, "").replace(/^0+/, "")];
};

export default function ErpOrders() {
  const [tab, setTab] = useState<"todos" | OrderStatus>("todos");
  const [list, setList] = useState(seed);
  // Aba = recorte principal (situação). Busca e filtros atuam dentro da aba.
  const tabRows = useMemo(() => (tab === "todos" ? list : list.filter((o) => o.status === tab)), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: searchText, now: today, url: true });
  const q = filters.state.query;
  const [grouped, setGrouped] = useState<"sim" | "nao">("sim");
  const count = (s: OrderStatus) => list.filter((o) => o.status === s).length;
  const todayOrders = list.filter((o) => o.date === seed[0].date && o.status !== "cancelado");
  const month = list.filter((o) => o.status !== "cancelado" && o.status !== "orcamento").reduce((s, o) => s + orderTotal(o), 0);

  const columns: GridColumn<Order>[] = [
    { key: "number", header: "Pedido", value: (o) => o.number, width: 130, pinned: "left", hideable: false, mobile: "title", cell: (o) => <Highlight text={o.number} query={q} className="font-mono text-[12.5px]" /> },
    {
      key: "customer",
      header: "Cliente",
      value: (o) => customerById(o.customerId).name,
      width: 230,
      mobile: "subtitle",
      cell: (o) => {
        const c = customerById(o.customerId);
        return (
          <span className="block min-w-0 leading-tight">
            <Highlight text={c.name} query={q} className="block truncate" />
            <span className="block text-[11.5px] tabular-nums text-muted">
              <Highlight text={c.cnpj} query={q} /> · {c.uf}
            </span>
          </span>
        );
      },
    },
    { key: "date", header: "Emissão", value: (o) => o.date, width: 110, cell: (o) => <span className="tabular-nums text-muted">{br(o.date)}</span> },
    { key: "seller", header: "Vendedor", value: (o) => user(o.seller).name, width: 100, cell: (o) => user(o.seller).name.split(" ")[0] },
    { key: "payment", header: "Pagamento", value: (o) => o.payment, width: 130 },
    { key: "items", header: "Itens", value: (o) => o.items.length, width: 80, align: "right", defaultHidden: true },
    {
      key: "total",
      header: "Total",
      tooltip: "Itens + frete. Subtotal por situação e total do filtro no rodapé.",
      value: orderTotal,
      width: 140,
      align: "right",
      cell: (o) => <span className="font-medium tabular-nums">{formatCurrency(orderTotal(o))}</span>,
      aggregate: (rows) => formatCurrency(rows.reduce((s, o) => s + orderTotal(o), 0), { cents: false }),
      footer: (rows) => formatCurrency(rows.reduce((s, o) => s + orderTotal(o), 0), { cents: false }),
    },
    { key: "status", header: "Situação", value: (o) => orderStatus[o.status].label, width: 130, cell: (o) => <Badge tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</Badge> },
  ];

  const setStatus = (ids: Set<string>, status: OrderStatus, message: string) => {
    const before = list;
    setList((all) => all.map((o) => (ids.has(o.id) ? { ...o, status } : o)));
    notify(message, () => setList(before));
  };

  const invoice = (targets: Order[]) => {
    const ids = new Set(targets.filter((o) => o.status === "aprovado").map((o) => o.id));
    if (!ids.size) return notify("Nenhum pedido aprovado na seleção: só aprovados podem ser faturados", undefined, "info");
    setStatus(ids, "faturado", `${ids.size} pedido${ids.size > 1 ? "s" : ""} faturado${ids.size > 1 ? "s" : ""} · NF-e enviadas à SEFAZ`);
  };

  return (
    <NexoShell section="pedidos">
      <Page>
        <PageHeading
          title="Pedidos de venda"
          description="Aprovados viram NF-e ao faturar. Pedidos com crédito bloqueado ficam em Orçamento."
          actions={
            <>
              <Button variant="ghost" onClick={() => notify(`Lista com ${filters.rows.length} pedidos enviada para impressão`, undefined, "info")}>
                <Printer /> Imprimir lista
              </Button>
              <Button onClick={() => go("erp-order", "novo")}>
                <ShoppingCart /> Novo pedido
              </Button>
            </>
          }
        />
        <div className="mt-6">
          <StatGrid cols={4}>
            <StatCell label="Vendido hoje" value={formatCurrency(todayOrders.reduce((s, o) => s + orderTotal(o), 0))} hint={`${todayOrders.length} pedidos`} />
            <StatCell label="Vendido no período" value={formatCurrency(month, { cents: false })} hint="meta R$ 1,2 mi" tone="ok" />
            <StatCell label="Aguardando faturamento" value={count("aprovado")} hint="aprovados sem NF-e" tone="warn" />
            <StatCell label="Ticket médio" value={formatCurrency(month / Math.max(1, list.filter((o) => o.status !== "cancelado" && o.status !== "orcamento").length))} hint="pedidos aprovados" />
          </StatGrid>
        </div>
        <Tabs
          className="mt-6"
          label="Situação"
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          items={[
            { id: "todos", label: "Todos" },
            { id: "orcamento", label: "Orçamentos" },
            { id: "aprovado", label: "Aprovados", count: count("aprovado") },
            { id: "faturado", label: "Faturados" },
            { id: "enviado", label: "Em transporte" },
            { id: "entregue", label: "Entregues" },
          ]}
        />
        <div className="mt-5 space-y-4">
          <DataGrid
            label="Pedidos de venda"
            rows={filters.rows}
            columns={columns}
            rowKey={(o) => o.id}
            rowLabel={(o) => `pedido ${o.number}`}
            maxHeight="max(440px, calc(100dvh - 430px))"
            storageKey="erp-pedidos"
            defaultSort={{ key: "number", dir: "desc" }}
            query={q}
            selectable
            noun="pedido"
            exportFileName="pedidos"
            showDensity
            toolbar={
              <FilterBar
                filters={filters}
                noun="pedido"
                search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="pedido" searchIn="nº do pedido, cliente e CNPJ" />}
                actions={tab === "todos" && <SegmentedControl label="Agrupar" value={grouped} onChange={setGrouped} options={[{ value: "sim", label: "Por situação" }, { value: "nao", label: "Lista" }]} />}
              />
            }
            groupBy={tab === "todos" && grouped === "sim" ? (o) => orderStatus[o.status].label : undefined}
            groupOrder={[...orderFlow, "cancelado" as const].map((st) => orderStatus[st].label)}
            defaultCollapsedGroups={[orderStatus.cancelado.label]}
            renderExpanded={(o) => (
              <div className="max-w-[720px]">
                <table className="w-full text-[12.5px]">
                  <thead className="text-[11.5px] text-muted">
                    <tr>
                      <th className="pb-1.5 text-left font-medium">Item</th>
                      <th className="pb-1.5 text-right font-medium">Qtd.</th>
                      <th className="pb-1.5 text-right font-medium">Unitário</th>
                      <th className="pb-1.5 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((it) => {
                      const p = products.find((x) => x.sku === it.sku);
                      return (
                        <tr key={it.sku}>
                          <td className="py-1 pr-3">
                            <span className="font-mono text-[11.5px] text-muted">{it.sku}</span> {p?.name}
                          </td>
                          <td className="py-1 text-right tabular-nums">
                            {it.qty} {p?.unit}
                          </td>
                          <td className="py-1 text-right tabular-nums">{formatCurrency(it.price)}</td>
                          <td className="py-1 text-right font-medium tabular-nums">{formatCurrency(it.qty * it.price)}</td>
                        </tr>
                      );
                    })}
                    <tr className="text-muted">
                      <td className="pt-1.5" colSpan={3}>
                        Frete {o.freight ? "" : "(CIF, por conta da Aço Forte)"}
                      </td>
                      <td className="pt-1.5 text-right tabular-nums">{formatCurrency(o.freight)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            onRowOpen={(o) => go("erp-order", o.id)}
            rowActions={(o) => [
              { label: "Faturar", icon: <FileText />, inline: o.status === "aprovado", disabled: o.status !== "aprovado", onSelect: () => invoice([o]) },
              { label: "Imprimir", icon: <Printer />, inline: true, onSelect: () => notify(`Pedido ${o.number} enviado para impressão`, undefined, "info") },
              { label: "Cancelar pedido", icon: <Ban />, tone: "danger", separator: true, disabled: o.status === "cancelado" || o.status === "entregue", onSelect: () => setStatus(new Set([o.id]), "cancelado", `Pedido ${o.number} cancelado`) },
            ]}
            bulkActions={(rows, { clear }) => (
              <>
                <button type="button" onClick={() => { invoice(rows); clear(); }}>
                  <FileText /> Faturar
                </button>
                <button type="button" onClick={() => { notify(`${rows.length === 1 ? "1 pedido enviado" : `${rows.length} pedidos enviados`} para impressão`, undefined, "info"); clear(); }}>
                  <Printer /> Imprimir
                </button>
              </>
            )}
            empty={<EmptyFilterResult filters={filters} noun="pedido" />}
            mobile="cards"
          />
        </div>
      </Page>
    </NexoShell>
  );
}
