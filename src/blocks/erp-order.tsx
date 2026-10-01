import { Ban, CheckCircle2, FileText, PackageCheck, Plus, Printer, Trash2, Truck, Unlock } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Combobox,
  ConfirmDialog,
  EntityMark,
  FieldBlock,
  IconButton,
  NumberField,
  Page,
  PageHeading,
  PropertyList,
  Select,
  SplitLayout,
  Stepper,
  formatCurrency,
  notify,
} from "@g4os/ds";
import { br, customerById, customers, orderById, orderFlow, orderStatus, orderTotal, productBySku, products, qtyOf, user, warehouses, type Order, type OrderStatus, type Payment, type WarehouseId } from "./data/erp";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pedido de venda",
  description: "Detalhe do pedido: etapas, itens com estoque, cliente, pagamento e ações que mudam com a situação (aprovar, liberar crédito, faturar, despachar, entregar, cancelar). ?id=novo abre o cadastro.",
  category: "ERP",
  order: 3,
  height: 1000,
  concept: {
    goal: "Levar um pedido de venda do cadastro à entrega com as ações certas em cada etapa.",
    patterns: [
      "Anatomia C · Registro: etapas no topo; resumo fixo à direita",
      "Ações mudam com a situação (aprovar, liberar crédito, faturar…)",
      "Itens com saldo em estoque",
      "?id=novo abre o cadastro na mesma tela",
    ],
    adapt: [
      "Negócio (CRM), proposta (ATS), requisição de compra",
    ],
    avoid: [
      "Todas as ações visíveis em todas as situações",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n);

export default function ErpOrder() {
  const id = useFrameParam("id", "24870");
  return id === "novo" ? <NewOrder /> : <OrderDetail key={id} order={orderById(id)} />;
}

function ItemsTable({ order, onRemove }: { order: Pick<Order, "items" | "freight" | "warehouse">; onRemove?: (sku: string) => void }) {
  const subtotal = order.items.reduce((s, it) => s + it.qty * it.price, 0);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead className="border-b border-line bg-soft/60 text-[12px] text-muted">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Item</th>
            <th className="px-4 py-2.5 text-right font-medium">Qtd.</th>
            <th className="px-4 py-2.5 text-right font-medium">Preço un.</th>
            <th className="px-4 py-2.5 text-right font-medium">Subtotal</th>
            {onRemove && <th className="w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {order.items.map((it) => {
            const p = productBySku(it.sku);
            const available = p.stock[order.warehouse];
            return (
              <tr key={it.sku}>
                <td className="px-4 py-2.5">
                  <a href={`#/frame/erp-product?id=${p.sku}`} className="hover:underline">
                    {p.name}
                  </a>
                  <div className="font-mono text-[11px] text-muted">
                    {p.sku} · {available >= it.qty ? `${available} ${p.unit} disponíveis` : <span className="font-sans font-medium text-amber">só {available} {p.unit} no {warehouses.find((w) => w.id === order.warehouse)?.name}</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {it.qty} {p.unit}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(it.price)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{money(it.qty * it.price)}</td>
                {onRemove && (
                  <td className="pr-2 text-right">
                    <IconButton size="sm" label={`Remover ${p.name}`} onClick={() => onRemove(it.sku)}>
                      <Trash2 />
                    </IconButton>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-line bg-soft/40 text-[13px]">
          <tr>
            <td className="px-4 pt-2.5 text-muted" colSpan={3}>
              Subtotal
            </td>
            <td className="px-4 pt-2.5 text-right tabular-nums">{money(subtotal)}</td>
            {onRemove && <td />}
          </tr>
          <tr>
            <td className="px-4 text-muted" colSpan={3}>
              Frete
            </td>
            <td className="px-4 text-right tabular-nums">{order.freight ? money(order.freight) : "Grátis (CIF)"}</td>
            {onRemove && <td />}
          </tr>
          <tr>
            <td className="px-4 pb-2.5 font-medium" colSpan={3}>
              Total
            </td>
            <td className="px-4 pb-2.5 text-right font-semibold tabular-nums">{money(subtotal + order.freight)}</td>
            {onRemove && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [invoice, setInvoice] = useState(order.invoice);
  const [cancel, setCancel] = useState(false);
  const c = customerById(order.customerId);
  const [blocked, setBlocked] = useState(c.status === "bloqueado");
  const idx = orderFlow.indexOf(status);
  const set = (next: OrderStatus, msg: string, patch?: () => void) => {
    const before = status;
    setStatus(next);
    patch?.();
    notify(msg, () => setStatus(before));
  };
  const action = () => {
    switch (status) {
      case "orcamento":
        return (
          <Button disabled={blocked} onClick={() => set("aprovado", `Pedido ${order.number} aprovado`)}>
            <CheckCircle2 /> Aprovar pedido
          </Button>
        );
      case "aprovado":
        return (
          <Button onClick={() => set("faturado", `NF-e emitida e autorizada para ${order.number}`, () => setInvoice(invoice ?? "12346"))}>
            <FileText /> Faturar
          </Button>
        );
      case "faturado":
        return (
          <Button onClick={() => set("enviado", "Carga despachada com Rápido Sul Transportes")}>
            <Truck /> Despachar
          </Button>
        );
      case "enviado":
        return (
          <Button onClick={() => set("entregue", "Entrega confirmada pelo cliente")}>
            <PackageCheck /> Confirmar entrega
          </Button>
        );
      default:
        return null;
    }
  };
  return (
    <NexoShell section="pedidos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Pedidos de venda", href: "#/frame/erp-orders" }]}
          title={`Pedido ${order.number}`}
          description={`${c.name} · emitido em ${br(order.date)} · vendedor ${user(order.seller).name}`}
          actions={
            <>
              {status !== "entregue" && status !== "cancelado" && (
                <Button variant="ghost" onClick={() => setCancel(true)}>
                  <Ban /> Cancelar
                </Button>
              )}
              <Button variant="ghost" onClick={() => notify("Espelho do pedido enviado para impressão", undefined, "info")}>
                <Printer /> Imprimir
              </Button>
              {action()}
            </>
          }
        />
        <div className="mt-6">{status === "cancelado" ? <Badge tone="bad">Pedido cancelado</Badge> : <Stepper steps={orderFlow.map((s, i) => ({ id: s, label: orderStatus[s].label, state: i < idx ? "done" : i === idx ? "current" : "upcoming" }))} label="Etapas do pedido" />}</div>
        {blocked && status === "orcamento" && (
          <div className="mt-6">
            <Callout
              tone="warn"
              title="Crédito do cliente bloqueado"
              action={
                <Button size="sm" variant="ghost" onClick={() => { setBlocked(false); notify(`Crédito de ${c.name} liberado para este pedido`, () => setBlocked(true)); }}>
                  <Unlock /> Liberar para este pedido
                </Button>
              }
            >
              {c.name} tem títulos vencidos há mais de 60 dias. O pedido só pode ser aprovado com liberação do financeiro.
            </Callout>
          </div>
        )}
        <div className="mt-6">
          <SplitLayout
            asideWidth={320}
            main={<ItemsTable order={order} />}
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <button type="button" onClick={() => go("erp-customers", c.id)} className="mb-3 flex w-full items-center gap-3 text-left">
                    <EntityMark name={c.name} tint={c.tint} className="h-9 w-9 text-[12px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium hover:underline">{c.name}</span>
                      <span className="block text-[12px] tabular-nums text-muted">{c.cnpj}</span>
                    </span>
                  </button>
                  <PropertyList
                    items={[
                      { label: "Cidade", value: `${c.city}/${c.uf}` },
                      { label: "Contato", value: c.contact, hint: c.phone },
                      { label: "Limite de crédito", value: formatCurrency(c.creditLimit, { cents: false }) },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <PropertyList
                    items={[
                      { label: "Pagamento", value: order.payment },
                      { label: "Depósito", value: warehouses.find((w) => w.id === order.warehouse)?.name },
                      { label: "Transportadora", value: status === "enviado" || status === "entregue" ? "Rápido Sul Transportes" : undefined },
                      {
                        label: "NF-e",
                        value: invoice ? (
                          <a className="font-medium text-blue hover:underline" href={`#/frame/erp-invoice?id=${invoice}`}>
                            Ver nota {invoice}
                          </a>
                        ) : undefined,
                        hint: invoice ? undefined : "emitida ao faturar",
                      },
                    ]}
                  />
                </section>
              </>
            }
          />
        </div>
      </Page>
      <ConfirmDialog
        open={cancel}
        onClose={() => setCancel(false)}
        title={`Cancelar o pedido ${order.number}?`}
        description={invoice ? "A NF-e vinculada também será cancelada na SEFAZ (prazo de 24 h da emissão). O estoque reservado volta a ficar disponível." : "O estoque reservado volta a ficar disponível. O cliente é avisado por e-mail."}
        confirmLabel="Cancelar pedido"
        cancelLabel="Manter pedido"
        tone="danger"
        onConfirm={() => {
          setCancel(false);
          set("cancelado", `Pedido ${order.number} cancelado`);
        }}
      />
    </NexoShell>
  );
}

function NewOrder() {
  const [customer, setCustomer] = useState("");
  const [warehouse, setWarehouse] = useState<WarehouseId>("gyn");
  const [payment, setPayment] = useState<Payment>("Boleto 28 dias");
  const [items, setItems] = useState<Order["items"]>([]);
  const [sku, setSku] = useState(products[0].sku);
  const [qty, setQty] = useState<number | null>(10);
  const c = customer ? customerById(customer) : null;
  const add = () => {
    const p = productBySku(sku);
    if (!qty) return;
    setItems((all) => (all.some((i) => i.sku === sku) ? all.map((i) => (i.sku === sku ? { ...i, qty: i.qty + qty } : i)) : [...all, { sku, qty, price: p.price }]));
  };
  const draft = { items, freight: items.length ? 280 : 0, warehouse };
  const total = orderTotal({ ...draft, id: "", number: "", customerId: "", date: "", payment, status: "orcamento", seller: "ana" });
  const save = (status: OrderStatus) => {
    notify(status === "orcamento" ? "Orçamento salvo · PV-024871" : "Pedido PV-024871 criado e aprovado");
    go("erp-order", "24870");
  };
  return (
    <NexoShell section="pedidos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Pedidos de venda", href: "#/frame/erp-orders" }]}
          title="Novo pedido"
          description="Escolha o cliente, o depósito de saída e os itens. O estoque é conferido na hora."
          actions={
            <>
              <Button variant="ghost" disabled={!c || !items.length} onClick={() => save("orcamento")}>
                Salvar como orçamento
              </Button>
              <Button disabled={!c || !items.length || c.status === "bloqueado"} onClick={() => save("aprovado")}>
                Criar pedido
              </Button>
            </>
          }
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
              <FieldBlock label="Cliente" className="sm:col-span-2">
                <Combobox label="Cliente" placeholder="Busque por nome ou CNPJ" value={customer} onValueChange={setCustomer} options={customers.map((k) => ({ value: k.id, label: k.name, description: `${k.cnpj} · ${k.city}/${k.uf}` }))} />
              </FieldBlock>
              <FieldBlock label="Depósito de saída">
                <Select label="Depósito" value={warehouse} onValueChange={(v) => setWarehouse(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
              </FieldBlock>
              <FieldBlock label="Pagamento">
                <Select label="Pagamento" value={payment} onValueChange={(v) => setPayment(v as Payment)} options={(["Pix", "Boleto 28 dias", "Cartão 3x", "Boleto 30/60/90"] as Payment[]).map((p) => ({ value: p, label: p }))} />
              </FieldBlock>
            </section>
            {c?.status === "bloqueado" && (
              <Callout tone="warn" title="Cliente com crédito bloqueado">
                Dá para salvar como orçamento; para virar pedido, o financeiro precisa liberar o crédito.
              </Callout>
            )}
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="m-0 text-[14px] font-medium">Itens</h2>
              <div className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <FieldBlock label="Produto">
                  <Combobox label="Produto" value={sku} onValueChange={setSku} options={products.map((p) => ({ value: p.sku, label: p.name, description: `${p.sku} · ${p.stock[warehouse]} ${p.unit} no depósito · ${formatCurrency(p.price)}`, disabled: p.stock[warehouse] === 0 }))} />
                </FieldBlock>
                <NumberField label="Quantidade" value={qty} onChange={setQty} min={1} />
                <Button variant="ghost" onClick={add}>
                  <Plus /> Adicionar
                </Button>
              </div>
              <div className="mt-4">
                {items.length ? <ItemsTable order={draft} onRemove={(s) => setItems((all) => all.filter((i) => i.sku !== s))} /> : <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">Nenhum item ainda. Adicione o primeiro produto acima.</p>}
              </div>
            </section>
          </div>
          <aside className="page-aside space-y-3">
            <section className="rounded-xl border border-line bg-surface p-4">
              <div className="text-[12px] text-muted">Total do pedido</div>
              <div className="mt-1 text-[24px] font-semibold tabular-nums tracking-tight">{formatCurrency(total)}</div>
              <PropertyList
                className="mt-3"
                items={[
                  { label: "Itens", value: items.length || undefined },
                  { label: "Cliente", value: c?.name },
                  { label: "Crédito disponível", value: c ? formatCurrency(c.creditLimit, { cents: false }) : undefined },
                  { label: "Estoque total do item", value: `${qtyOf(productBySku(sku))} ${productBySku(sku).unit}` },
                ]}
              />
            </section>
          </aside>
        </div>
      </Page>
    </NexoShell>
  );
}
