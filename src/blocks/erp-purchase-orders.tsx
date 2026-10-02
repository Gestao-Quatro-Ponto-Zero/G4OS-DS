import { Ban, PackageCheck, Plus, Send, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  ChoiceCards,
  Combobox,
  ConfirmDialog,
  CurrencyField,
  DataGrid,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  IconButton,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  SegmentedControl,
  Select,
  StatCell,
  StatGrid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSearch,
  Tabs,
  TextareaField,
  formatCurrency,
  formatNumber,
  notify,
  useFilters,
  useOperation,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import {
  addPurchaseOrder,
  awaitingReceipt,
  br,
  daysAgo,
  iso,
  poLate,
  poStatus,
  poTotal,
  productBySku,
  products,
  purchaseOrders as seed,
  purchaseRequests,
  supplierById,
  supplierByName,
  suppliers,
  today,
  updatePurchaseOrder,
  updatePurchaseRequest,
  warehouses,
  type PoItem,
  type PoStatus,
  type PurchaseOrder,
  type WarehouseId,
} from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pedidos de compra",
  description: "Ordens de compra por fornecedor: itens e saldo a receber na linha, previsão de entrega com atraso em destaque, abas por situação, envio ao fornecedor em massa e criação a partir de requisição aprovada em gaveta. Linha abre o pedido.",
  category: "ERP",
  order: 12,
  height: 960,
  concept: {
    goal: "Garantir que o que foi comprado chegue no prazo: ver o que está atrasado, o que falta enviar e o que chega esta semana.",
    patterns: [
      "Anatomia A · Lista com DataGrid: abas por situação, total no rodapé, itens expansíveis",
      "Previsão de entrega com atraso em palavra e cor (nunca só cor)",
      "Novo pedido em Drawer a partir de requisição aprovada (itens e fornecedor já vêm preenchidos)",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Ordens de serviço a terceiros, pedidos de reposição entre filiais",
    ],
    avoid: [
      "Criar o pedido sem a requisição aprovada (perde a trilha de aprovação)",
      "Previsão sem dizer se atrasou",
    ],
  },
} as const;

type Tab = "abertos" | "atrasados" | "recebidos" | "cancelados" | "todos";
const inTab = (t: Tab) => (o: PurchaseOrder) =>
  t === "todos" ? true : t === "abertos" ? o.status !== "recebido" && o.status !== "cancelado" : t === "atrasados" ? poLate(o) : t === "recebidos" ? o.status === "recebido" : o.status === "cancelado";

const fields: FilterField<PurchaseOrder>[] = [
  { key: "supplier", label: "Fornecedor", type: "enum", quick: true, accessor: (o) => o.supplierId, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (o) => o.status, options: (Object.keys(poStatus) as PoStatus[]).map((s) => ({ value: s, label: poStatus[s].label })) },
  { key: "warehouse", label: "Depósito", type: "enum", accessor: (o) => o.warehouse, options: warehouses.map((w) => ({ value: w.id, label: w.name })) },
  { key: "expected", label: "Previsão de entrega", type: "date", accessor: (o) => o.expected },
  { key: "total", label: "Total", type: "currency", accessor: poTotal },
  { key: "sku", label: "Produto", type: "text", accessor: (o) => o.items.map((it) => `${it.sku} ${productBySku(it.sku).name}`).join(" ") },
];

const terms = ["à vista", "28 dias", "30 dias", "28/56 dias", "30/60/90 dias"];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const whName = (id: WarehouseId) => warehouses.find((w) => w.id === id)?.name ?? id;

/** Previsão com palavra: "Atrasado 2 dias", "Chega hoje", "em 4 dias". */
function Expected({ o }: { o: PurchaseOrder }) {
  const late = poLate(o);
  const d = -daysAgo(o.expected);
  return (
    <span className="block leading-tight">
      <span className="block tabular-nums">{br(o.expected)}</span>
      {o.status === "recebido" || o.status === "cancelado" ? null : late ? (
        <span className="block text-[11.5px] font-medium text-rose">Atrasado {-d === 1 ? "1 dia" : `${-d} dias`}</span>
      ) : (
        <span className="block text-[11.5px] text-muted">{d === 0 ? "Chega hoje" : d === 1 ? "Chega amanhã" : `em ${d} dias`}</span>
      )}
    </span>
  );
}

export default function ErpPurchaseOrders() {
  const demo = useDemoState();
  const creating = useFrameParam("novo") === "1";
  const reqParam = useFrameParam("req");
  const [list, setList] = useState<PurchaseOrder[]>(() => (demo === "vazio" ? [] : [...seed]));
  const [tab, setTab] = useState<Tab>("abertos");
  const [cancel, setCancel] = useState<PurchaseOrder | null>(null);
  const tabRows = useMemo(() => list.filter(inTab(tab)), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: (o) => [o.number, supplierById(o.supplierId).name, supplierById(o.supplierId).cnpj.replace(/\D/g, ""), ...o.items.map((it) => it.sku)], now: today, url: "oc_" });
  const q = filters.state.query;

  const open = list.filter((o) => o.status !== "recebido" && o.status !== "cancelado");
  const late = list.filter(poLate);
  const thisWeek = list.filter((o) => awaitingReceipt(o) && o.expected >= iso(0) && o.expected <= iso(7));
  const receivedMonth = list.filter((o) => o.status === "recebido" && o.receivedAt && o.receivedAt.slice(0, 7) === iso(0).slice(0, 7));

  const patch = (ids: Set<string>, p: Partial<PurchaseOrder>, message: string) => {
    const before = list;
    setList((all) => all.map((o) => (ids.has(o.id) ? { ...o, ...p } : o)));
    ids.forEach((id) => updatePurchaseOrder(id, p));
    notify(message, () => {
      setList(before);
      before.filter((o) => ids.has(o.id)).forEach((o) => updatePurchaseOrder(o.id, o));
    });
  };
  const send = (rows: PurchaseOrder[]) => {
    const ids = new Set(rows.filter((o) => o.status === "rascunho").map((o) => o.id));
    if (!ids.size) return notify("Nenhum rascunho na seleção: só rascunhos podem ser enviados", undefined, "info");
    patch(ids, { status: "enviado", sentAt: iso(0) }, ids.size === 1 ? `Pedido ${rows.find((o) => ids.has(o.id))!.number} enviado ao fornecedor por e-mail` : `${ids.size} pedidos enviados aos fornecedores`);
  };

  const columns: GridColumn<PurchaseOrder>[] = [
    { key: "number", header: "Pedido", value: (o) => o.number, width: 128, pinned: "left", hideable: false, mobile: "title", cell: (o) => <Highlight text={o.number} query={q} className="font-mono text-[12.5px]" /> },
    {
      key: "supplier",
      header: "Fornecedor",
      value: (o) => supplierById(o.supplierId).name,
      width: 240,
      mobile: "subtitle",
      cell: (o) => {
        const s = supplierById(o.supplierId);
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <EntityMark name={s.name} tint={s.tint} className="h-7 w-7 shrink-0 text-[11px]" />
            <span className="min-w-0 leading-tight">
              <Highlight text={s.name} query={q} className="block truncate" />
              <span className="block truncate text-[11.5px] tabular-nums text-muted">{s.cnpj}</span>
            </span>
          </span>
        );
      },
    },
    {
      key: "items",
      header: "Itens",
      value: (o) => o.items.length,
      width: 220,
      cell: (o) => {
        const first = productBySku(o.items[0].sku);
        return (
          <span className="block min-w-0 leading-tight">
            <span className="block truncate">{first.name}</span>
            <span className="block text-[11.5px] text-muted">{o.items.length > 1 ? `e mais ${o.items.length - 1} ${o.items.length === 2 ? "item" : "itens"}` : `${formatNumber(o.items[0].qty)} ${first.unit}`}</span>
          </span>
        );
      },
    },
    { key: "expected", header: "Previsão", value: (o) => o.expected, width: 130, cell: (o) => <Expected o={o} /> },
    { key: "warehouse", header: "Entrega em", value: (o) => whName(o.warehouse), width: 120, defaultHidden: true },
    {
      key: "total",
      header: "Total",
      tooltip: "Itens + frete FOB. Total do filtro no rodapé.",
      value: poTotal,
      width: 130,
      align: "right",
      cell: (o) => <span className="font-medium tabular-nums">{formatCurrency(poTotal(o))}</span>,
      footer: (rows) => formatCurrency(rows.reduce((s, o) => s + poTotal(o), 0), { cents: false }),
    },
    { key: "status", header: "Situação", value: (o) => poStatus[o.status].label, width: 150, cell: (o) => <Badge tone={poStatus[o.status].tone}>{poStatus[o.status].label}</Badge> },
  ];

  const emptyAll = (
    <Empty
      icon={<ShoppingBag />}
      title={tab === "atrasados" ? "Nenhum pedido atrasado" : tab === "cancelados" ? "Nenhum pedido cancelado" : "Nenhum pedido de compra aqui"}
      hint={tab === "atrasados" ? "Todos os fornecedores estão dentro do prazo combinado." : "Pedidos de compra nascem de requisições aprovadas. Gere o primeiro a partir de uma delas."}
      action={tab === "atrasados" || tab === "cancelados" ? undefined : <Button size="sm" variant="ghost" onClick={() => setFrameQuery({ novo: "1" })}><Plus /> Novo pedido de compra</Button>}
      framed={false}
    />
  );

  return (
    <NexoShell section="compras-pedidos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Compras" }]}
          title="Pedidos de compra"
          description="Enviado: o fornecedor recebeu por e-mail. Confirmado: aceitou preço e prazo. O saldo entra no estoque no recebimento."
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <Plus /> Novo pedido de compra
            </Button>
          }
        />
        <StatGrid cols={4}>
          <StatCell label="Em aberto" value={formatCurrency(open.reduce((s, o) => s + poTotal(o), 0), { compact: true })} hint={`${open.length} pedidos`} />
          <StatCell label="Atrasados" value={late.length} tone={late.length ? "bad" : undefined} hint={late.length ? "cobrar o fornecedor" : "nenhum fora do prazo"} />
          <StatCell label="Chegam em 7 dias" value={thisWeek.length} hint="agendar doca no recebimento" />
          <StatCell label="Recebido no mês" value={formatCurrency(receivedMonth.reduce((s, o) => s + poTotal(o), 0), { compact: true })} tone="ok" />
        </StatGrid>
        <Tabs
          className="mt-6"
          label="Situação"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { id: "abertos", label: "Em aberto" },
            { id: "atrasados", label: "Atrasados", count: late.length || undefined },
            { id: "recebidos", label: "Recebidos" },
            { id: "cancelados", label: "Cancelados" },
            { id: "todos", label: "Todos" },
          ]}
        />
        <div className="mt-5">
          <DataGrid
            key={tab}
            label="Pedidos de compra"
            rows={demo === "carregando" ? [] : filters.rows}
            columns={columns}
            rowKey={(o) => o.id}
            rowLabel={(o) => `pedido ${o.number}`}
            maxHeight="max(440px, calc(100dvh - 420px))"
            storageKey="erp-pedidos-compra"
            defaultSort={{ key: "expected", dir: "asc" }}
            query={q}
            selectable
            noun="pedido"
            exportFileName="pedidos-de-compra"
            loading={demo === "carregando"}
            error={demoError(demo, "os pedidos de compra")}
            rowTone={(o) => (poLate(o) ? "bad" : undefined)}
            toolbar={<FilterBar filters={filters} noun="pedido" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="pedido" searchIn="nº, fornecedor, CNPJ e SKU" />} />}
            renderExpanded={(o) => (
              <Table label={`Itens do pedido ${o.number}`} className="max-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead numeric>Pedido</TableHead>
                    <TableHead numeric>Recebido</TableHead>
                    <TableHead numeric>Custo un.</TableHead>
                    <TableHead numeric>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.items.map((it) => {
                    const p = productBySku(it.sku);
                    return (
                      <TableRow key={it.sku}>
                        <TableCell className="text-[12.5px]">
                          <span className="font-mono text-[11.5px] text-muted">{it.sku}</span> {p.name}
                        </TableCell>
                        <TableCell numeric className="text-[12.5px]">
                          {formatNumber(it.qty)} {p.unit}
                        </TableCell>
                        <TableCell numeric className={it.received < it.qty && it.received > 0 ? "text-[12.5px] font-medium text-amber" : "text-[12.5px]"}>
                          {formatNumber(it.received)}
                        </TableCell>
                        <TableCell numeric className="text-[12.5px]">{formatCurrency(it.cost)}</TableCell>
                        <TableCell numeric className="text-[12.5px] font-medium">{formatCurrency(it.qty * it.cost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            onRowOpen={(o) => go("erp-purchase-order", o.id)}
            rowActions={(o) => [
              { label: "Enviar ao fornecedor", icon: <Send />, inline: o.status === "rascunho", disabled: o.status !== "rascunho", onSelect: () => send([o]) },
              { label: "Registrar recebimento", icon: <PackageCheck />, inline: awaitingReceipt(o), disabled: !awaitingReceipt(o), onSelect: () => go("erp-receiving", { pedido: o.id }) },
              { label: "Cancelar pedido", icon: <Ban />, tone: "danger", separator: true, disabled: o.status === "recebido" || o.status === "cancelado" || o.status === "parcial", onSelect: () => setCancel(o) },
            ]}
            bulkActions={(rows, { clear }) => (
              <button type="button" onClick={() => { send(rows); clear(); }}>
                <Send /> Enviar ao fornecedor
              </button>
            )}
            empty={tabRows.length === 0 ? emptyAll : <EmptyFilterResult filters={filters} noun="pedido" />}
            mobile="cards"
          />
        </div>
      </Page>
      <ConfirmDialog
        open={!!cancel}
        onClose={() => setCancel(null)}
        title={`Cancelar o pedido ${cancel?.number ?? ""}?`}
        description={cancel?.status === "rascunho" ? "O rascunho é descartado. A requisição volta a ficar disponível para outro pedido." : "O fornecedor recebe o cancelamento por e-mail. Se ele já faturou, a NF de entrada precisa ser recusada no recebimento."}
        confirmLabel="Cancelar pedido"
        cancelLabel="Manter pedido"
        tone="danger"
        onConfirm={() => {
          if (cancel) patch(new Set([cancel.id]), { status: "cancelado" }, `Pedido ${cancel.number} cancelado`);
          setCancel(null);
        }}
      />
      {creating && <NewPurchaseOrder key={reqParam ?? "avulso"} requestId={reqParam} onClose={() => setFrameQuery({ novo: undefined, req: undefined })} />}
    </NexoShell>
  );
}

/* ------------------------------------------------------------------ */
/* Novo pedido de compra (gaveta)                                      */
/* ------------------------------------------------------------------ */

function NewPurchaseOrder({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const approved = purchaseRequests.filter((r) => r.status === "aprovada" && !r.orderId && r.items.some((it) => it.sku));
  const [source, setSource] = useState<"requisicao" | "avulso">(approved.length ? "requisicao" : "avulso");
  const [reqId, setReqId] = useState(requestId && approved.some((r) => r.id === requestId) ? requestId : approved[0]?.id ?? "");
  const req = approved.find((r) => r.id === reqId);
  const fromReq = (id: string) => {
    const r = approved.find((x) => x.id === id);
    return {
      supplierId: (r?.chosen && supplierByName(r.chosen)?.id) || "",
      items: (r?.items ?? []).filter((it) => it.sku).map<PoItem>((it) => ({ sku: it.sku!, qty: it.qty, cost: productBySku(it.sku!).cost, received: 0 })),
    };
  };
  const [supplierId, setSupplierId] = useState(source === "requisicao" ? fromReq(reqId).supplierId : "");
  const [items, setItems] = useState<PoItem[]>(source === "requisicao" ? fromReq(reqId).items : []);
  const [warehouse, setWarehouse] = useState<WarehouseId>("gyn");
  const supplier = supplierId ? supplierById(supplierId) : null;
  const [expected, setExpected] = useState(iso(supplier?.leadTime ?? 7));
  const [payment, setPayment] = useState("28 dias");
  const [freight, setFreight] = useState<"CIF" | "FOB">("CIF");
  const [freightValue, setFreightValue] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState<number | null>(10);
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Criando pedido…" });

  const pickRequest = (id: string) => {
    setReqId(id);
    const f = fromReq(id);
    setSupplierId(f.supplierId);
    setItems(f.items);
    if (f.supplierId) setExpected(iso(supplierById(f.supplierId).leadTime));
  };
  const pickSource = (v: "requisicao" | "avulso") => {
    setSource(v);
    if (v === "avulso") {
      setItems([]);
      setSupplierId("");
    } else pickRequest(reqId);
  };
  const add = () => {
    if (!sku || !qty) return;
    const p = productBySku(sku);
    setItems((all) => (all.some((i) => i.sku === sku) ? all.map((i) => (i.sku === sku ? { ...i, qty: i.qty + qty } : i)) : [...all, { sku, qty, cost: p.cost, received: 0 }]));
    setSku("");
  };
  const total = poTotal({ items, freightValue: freight === "FOB" ? freightValue ?? 0 : 0 });
  const errors = { supplier: !supplierId ? "Escolha o fornecedor." : undefined, items: !items.length ? "Adicione pelo menos um item." : undefined, expected: expected < iso(0) ? "A previsão não pode ser no passado." : undefined };

  const save = async () => {
    setTried(true);
    if (errors.supplier || errors.items || errors.expected) return;
    let created: PurchaseOrder | null = null;
    const failed = await op.run(async () => {
      await wait(800);
      created = addPurchaseOrder({ supplierId, requestId: source === "requisicao" ? reqId : undefined, buyer: "debora", createdAt: iso(0), expected, payment, freight, freightValue: freight === "FOB" ? freightValue ?? 0 : 0, warehouse, items, status: "rascunho", notes: notes || undefined });
      if (source === "requisicao" && reqId) updatePurchaseRequest(reqId, { orderId: created.id });
    });
    if (failed || !created) return;
    const c: PurchaseOrder = created;
    notify(`Pedido ${c.number} criado como rascunho · revise e envie ao fornecedor`);
    onClose();
    go("erp-purchase-order", c.id);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker={req ? `A partir de ${req.number}` : "Compra avulsa"}
      title="Novo pedido de compra"
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Criar pedido
          </OperationButton>
        </>
      }
    >
      <div className="space-y-6">
        <ChoiceCards
          label="Origem"
          columns={2}
          value={source}
          onChange={pickSource}
          options={[
            { value: "requisicao", label: "Requisição aprovada", description: approved.length ? `${approved.length} sem pedido` : "Nenhuma disponível", disabled: !approved.length },
            { value: "avulso", label: "Compra avulsa", description: "Sem requisição: precisa de justificativa" },
          ]}
        />
        {source === "requisicao" && approved.length > 0 && (
          <Select label="Requisição" value={reqId} onValueChange={pickRequest} options={approved.map((r) => ({ value: r.id, label: `${r.number} · ${r.title}`, description: r.chosen ? `Cotação escolhida: ${r.chosen}` : undefined }))} />
        )}
        <Combobox label="Fornecedor" placeholder="Busque por nome ou CNPJ" value={supplierId} onValueChange={(v) => { setSupplierId(v); if (v) setExpected(iso(supplierById(v).leadTime)); }} error={tried ? errors.supplier : undefined} hint={supplier ? `OTIF ${Math.round(supplier.otif * 100)} % · prazo médio ${supplier.leadTime} dias · ${supplier.contact}` : undefined} options={suppliers.map((s) => ({ value: s.id, label: s.name, description: `${s.cnpj} · ${s.category}` }))} />

        <section>
          <h3 className="m-0 mb-2 text-[13px] font-medium">Itens</h3>
          {source === "avulso" && (
            <div className="mb-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
              <Combobox label="Produto" placeholder="SKU ou descrição" value={sku} onValueChange={setSku} options={products.map((p) => ({ value: p.sku, label: p.name, description: `${p.sku} · custo ${formatCurrency(p.cost)}` }))} />
              <NumberField label="Quantidade" value={qty} onChange={setQty} min={1} />
              <Button variant="ghost" onClick={add} disabled={!sku || !qty} disabledReason="Escolha o produto e a quantidade.">
                <Plus /> Adicionar
              </Button>
            </div>
          )}
          {items.length ? (
            <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
              {items.map((it) => {
                const p = productBySku(it.sku);
                return (
                  <li key={it.sku} className="grid grid-cols-[minmax(0,1fr)_168px_auto] items-center gap-3 px-3 py-2.5">
                    <span className="min-w-0 text-[13px]">
                      <span className="block truncate">{p.name}</span>
                      <span className="block font-mono text-[11px] text-muted">
                        {p.sku} · {formatCurrency(it.cost)}/{p.unit} · {formatCurrency(it.qty * it.cost)}
                      </span>
                    </span>
                    <NumberField label={`Quantidade de ${p.sku}`} hideLabel value={it.qty} onChange={(v) => setItems((all) => all.map((x) => (x.sku === it.sku ? { ...x, qty: v ?? 1 } : x)))} min={1} suffix={p.unit} />
                    <IconButton size="sm" label={`Remover ${p.name}`} onClick={() => setItems((all) => all.filter((x) => x.sku !== it.sku))}>
                      <Trash2 />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={tried ? "m-0 rounded-lg border border-dashed border-rose/40 px-4 py-5 text-center text-[13px] text-rose" : "m-0 rounded-lg border border-dashed border-line px-4 py-5 text-center text-[13px] text-muted"}>{source === "avulso" ? "Nenhum item ainda. Adicione o primeiro produto acima." : "A requisição não tem itens de estoque."}</p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Select label="Entregar em" value={warehouse} onValueChange={(v) => setWarehouse(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name, description: w.city }))} />
          <DatePicker label="Previsão de entrega" value={expected} onValueChange={setExpected} min={iso(0)} businessDaysOnly error={tried ? errors.expected : undefined} />
          <Select label="Condição de pagamento" value={payment} onValueChange={setPayment} options={terms.map((t) => ({ value: t, label: t }))} />
          <div className="space-y-2">
            <SegmentedControl label="Frete" value={freight} onChange={setFreight} options={[{ value: "CIF", label: "CIF (fornecedor)" }, { value: "FOB", label: "FOB (nosso)" }]} />
            {freight === "FOB" && <CurrencyField label="Valor do frete" value={freightValue} onChange={setFreightValue} />}
          </div>
          <TextareaField className="sm:col-span-2" label="Observações para o fornecedor" value={notes} onChange={setNotes} minRows={2} optional placeholder="Ex.: entregar na doca 2, das 7h às 16h. Certificado de qualidade junto com a NF." />
        </section>

        <section className="rounded-xl border border-line bg-soft/40 p-4">
          <PropertyList
            items={[
              { label: "Itens", value: items.length ? `${items.length} · ${formatCurrency(poTotal({ items, freightValue: 0 }))}` : undefined },
              { label: "Frete", value: freight === "CIF" ? "Incluso no preço (CIF)" : formatCurrency(freightValue ?? 0) },
              { label: "Total do pedido", value: <span className="text-[15px] font-semibold tabular-nums">{formatCurrency(total)}</span>, hint: total > 50_000 ? "acima de R$ 50 mil: a diretoria é avisada no envio" : undefined },
            ]}
          />
        </section>
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
