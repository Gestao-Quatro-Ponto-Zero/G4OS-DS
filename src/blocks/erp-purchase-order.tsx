import { Ban, BellRing, CheckCircle2, Mail, PackageCheck, Printer, Send } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Callout,
  ConfirmDialog,
  DatePicker,
  EntityMark,
  Meter,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  ProjectProgressCard,
  PropertyList,
  SplitLayout,
  StagePath,
  StateView,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
  Timeline,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  useOperation,
  type TimelineItem,
} from "@g4ai/ds";
import { br, daysAgo, iso, poLate, poSubtotal, poTotal, productBySku, purchaseOrderById, requestById, supplierById, updatePurchaseOrder, user, warehouses, type PurchaseOrder } from "./data/erp";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Pedido de compra",
  description: "Registro da ordem de compra: ciclo cotação → aprovado → enviado → recebido, itens com saldo a receber, condições, marcos com o próximo passo, histórico e ações que mudam com a situação (enviar, registrar confirmação, receber, cancelar).",
  category: "ERP",
  order: 13,
  height: 1100,
  concept: {
    goal: "Acompanhar um pedido de compra do envio ao recebimento sabendo sempre qual é o próximo passo.",
    patterns: [
      "Anatomia C · Registro: trilha, StagePath do ciclo, itens no corpo e condições fixas à direita",
      "Ações mudam com a situação (enviar ao fornecedor, registrar confirmação, registrar recebimento)",
      "ProjectProgressCard com o próximo passo + Timeline do histórico",
      "Atraso vira Callout com a ação de cobrar o fornecedor",
    ],
    adapt: [
      "Ordem de serviço, contrato com marcos, pedido de transferência entre filiais",
    ],
    avoid: [
      "Todas as ações visíveis em todas as situações",
      "Saldo a receber escondido dentro do item",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stages = [
  { id: "cotacao", label: "Cotação" },
  { id: "aprovado", label: "Aprovado" },
  { id: "enviado", label: "Enviado" },
  { id: "recebido", label: "Recebido" },
];
const stageOf = (o: PurchaseOrder) => (o.status === "rascunho" ? "aprovado" : o.status === "recebido" ? "recebido" : o.status === "cancelado" ? (o.sentAt ? "enviado" : "aprovado") : "enviado");

export default function ErpPurchaseOrder() {
  const id = useFrameParam("id", "4131");
  const order = purchaseOrderById(id);
  if (!order)
    return (
      <NexoShell section="compras-pedidos">
        <Page>
          <StateView title="Pedido de compra não encontrado" description={`Não existe pedido com o número ${id}. Ele pode ter sido excluído ainda como rascunho.`} action={<Button onClick={() => go("erp-purchase-orders")}>Ver pedidos de compra</Button>} />
        </Page>
      </NexoShell>
    );
  return <OrderRecord key={order.id} initial={order} />;
}

function OrderRecord({ initial }: { initial: PurchaseOrder }) {
  const [o, setO] = useState(initial);
  const [cancel, setCancel] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [ref, setRef] = useState("");
  const [promised, setPromised] = useState(initial.expected);
  const sendOp = useOperation({ busyLabel: "Enviando…" });
  const confirmOp = useOperation({ busyLabel: "Registrando…" });
  const s = supplierById(o.supplierId);
  const req = o.requestId ? requestById(o.requestId) : undefined;
  const late = poLate(o);
  const lateDays = late ? daysAgo(o.expected) : 0;
  const received = o.items.reduce((sum, it) => sum + it.received * it.cost, 0);
  const pct = poSubtotal(o) ? received / poSubtotal(o) : 0;
  const wh = warehouses.find((w) => w.id === o.warehouse)!;

  const patch = (p: Partial<PurchaseOrder>) => {
    const next = { ...o, ...p };
    setO(next);
    updatePurchaseOrder(o.id, p);
    return next;
  };
  const send = () =>
    sendOp.run(() => wait(900), { message: `Pedido ${o.number} enviado para ${s.email}`, undo: () => patch({ status: "rascunho", sentAt: undefined }) }, { apply: () => patch({ status: "enviado", sentAt: iso(0) }), revert: () => patch({ status: "rascunho", sentAt: undefined }) });
  const confirm = async () => {
    const failed = await confirmOp.run(() => wait(700), `Confirmação de ${s.name} registrada · entrega em ${br(promised)}`, { apply: () => patch({ status: "confirmado", confirmedAt: iso(0), supplierRef: ref || undefined, expected: promised }), revert: () => patch({ status: "enviado", confirmedAt: undefined }) });
    if (!failed) setConfirming(false);
  };

  const action = () => {
    switch (o.status) {
      case "rascunho":
        return (
          <OperationButton operation={sendOp} onClick={send}>
            <Send /> Enviar ao fornecedor
          </OperationButton>
        );
      case "enviado":
        return (
          <Button onClick={() => setConfirming(true)}>
            <CheckCircle2 /> Registrar confirmação
          </Button>
        );
      case "confirmado":
      case "parcial":
        return (
          <Button onClick={() => go("erp-receiving", { pedido: o.id })}>
            <PackageCheck /> Registrar recebimento
          </Button>
        );
      default:
        return null;
    }
  };

  const milestones = [
    { id: "req", title: req ? `Requisição ${req.number} aprovada` : "Compra avulsa", description: req ? `Cotação escolhida: ${req.chosen ?? s.name}` : "Sem requisição: justificativa no histórico", status: "done" as const },
    { id: "env", title: "Enviado ao fornecedor", description: o.sentAt ? `por e-mail para ${s.email}` : "Revise itens e condições e envie", date: o.sentAt, status: o.sentAt ? ("done" as const) : ("current" as const) },
    { id: "conf", title: "Confirmado pelo fornecedor", description: o.supplierRef ? `Pedido no fornecedor: ${o.supplierRef}` : "Preço e prazo aceitos", date: o.confirmedAt, status: o.confirmedAt ? ("done" as const) : o.sentAt ? ("current" as const) : ("todo" as const) },
    { id: "rec", title: o.status === "parcial" ? `Recebido em parte · ${formatPercent(pct, 0)}` : "Mercadoria recebida e conferida", description: o.status === "recebido" ? `Entrada no ${wh.name}` : `Entrega no ${wh.name}`, date: o.receivedAt, status: o.status === "recebido" ? ("done" as const) : o.confirmedAt ? ("current" as const) : ("todo" as const) },
  ];

  const history: TimelineItem[] = [
    o.status === "recebido" && o.receivedAt && { id: "h5", title: "Recebimento concluído", meta: `${br(o.receivedAt)} · Sérgio Moura`, tone: "ok" as const, body: o.nfeKey ? `NF-e de entrada ${o.nfeKey.slice(25, 34)} · estoque atualizado no ${wh.name}` : undefined },
    o.status === "parcial" && o.receivedAt && { id: "h4", title: "Recebimento parcial", meta: `${br(o.receivedAt)} · Sérgio Moura`, tone: "warn" as const, body: o.notes },
    late && { id: "hl", title: `Entrega atrasada ${lateDays === 1 ? "1 dia" : `${lateDays} dias`}`, meta: br(iso(0)), tone: "bad" as const, body: `Previsão era ${br(o.expected)}.` },
    o.confirmedAt && { id: "h3", title: `Confirmado por ${s.contact}`, meta: `${br(o.confirmedAt)} · e-mail`, tone: "info" as const, body: o.supplierRef ? `Nº no fornecedor: ${o.supplierRef}` : undefined },
    o.sentAt && { id: "h2", title: "Enviado ao fornecedor", meta: `${br(o.sentAt)} · ${user(o.buyer).name}`, body: `PDF do pedido para ${s.email}` },
    { id: "h1", title: `Pedido criado${req ? ` a partir de ${req.number}` : ""}`, meta: `${br(o.createdAt)} · ${user(o.buyer).name}`, current: o.status === "rascunho" },
    o.status === "cancelado" && { id: "hc", title: "Pedido cancelado", meta: br(iso(0)), tone: "bad" as const, body: o.notes },
  ].filter(Boolean) as TimelineItem[];

  return (
    <NexoShell section="compras-pedidos">
      {/* Impressão: só o pedido. */}
      <style>{`@media print { aside[aria-label="Menu principal"], nav[aria-label="Navegação principal"], .no-print { display: none !important; } }`}</style>
      <Page>
        <div className="no-print contents">
          <PageHeading
            crumbs={[{ label: "Compras" }, { label: "Pedidos de compra", href: "#/frame/erp-purchase-orders" }]}
            title={`Pedido ${o.number}`}
            description={`${s.name} · criado em ${br(o.createdAt)} · comprador ${user(o.buyer).name}`}
            actions={
              <>
                {(o.status === "rascunho" || o.status === "enviado" || o.status === "confirmado") && (
                  <Button variant="ghost" onClick={() => setCancel(true)}>
                    <Ban /> Cancelar
                  </Button>
                )}
                <Button variant="ghost" onClick={() => window.print()}>
                  <Printer /> Imprimir
                </Button>
                {action()}
              </>
            }
          />
        </div>
        <StagePath className="mt-6" label="Ciclo do pedido de compra" stages={stages} current={stageOf(o)} outcome={o.status === "recebido" ? { tone: "ok", label: "Recebido" } : o.status === "cancelado" ? { tone: "bad", label: "Cancelado" } : undefined} />
        <div className="mt-6 space-y-3 empty:hidden">
          {late && (
            <Callout
              tone="bad"
              title={`Entrega atrasada ${lateDays === 1 ? "1 dia" : `${lateDays} dias`}`}
              action={
                <Button size="sm" variant="ghost" onClick={() => notify(`Cobrança de prazo enviada para ${s.contact} (${s.email})`)}>
                  <BellRing /> Cobrar fornecedor
                </Button>
              }
            >
              Previsão era {br(o.expected)}. OTIF de {s.name} nos últimos 90 dias: {formatPercent(s.otif, 0)}.
            </Callout>
          )}
          {o.status === "parcial" && (
            <Callout tone="warn" title={`Recebido ${formatPercent(pct, 0)} do valor`}>
              {o.notes ?? "Há saldo a receber. O pedido fica aberto até a última entrega ou até você encerrar o saldo."}
            </Callout>
          )}
          <OperationFeedback operation={sendOp} />
        </div>
        <div className="mt-6">
          <SplitLayout
            asideWidth={340}
            main={
              <div className="space-y-6">
                <Table label={`Itens do pedido ${o.number}`} className="[&_table]:min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead numeric>Pedido</TableHead>
                      <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                      <TableHead numeric>Custo un.</TableHead>
                      <TableHead numeric>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.items.map((it) => {
                      const p = productBySku(it.sku);
                      return (
                        <TableRow key={it.sku}>
                          <TableCell>
                            <a href={`#/frame/erp-product?id=${p.sku}`} className="hover:underline">
                              {p.name}
                            </a>
                            <div className="font-mono text-[11px] text-muted">
                              {p.sku} · NCM {p.ncm}
                            </div>
                          </TableCell>
                          <TableCell numeric>
                            {formatNumber(it.qty)} {p.unit}
                          </TableCell>
                          <TableCell className="hidden w-36 sm:table-cell">
                            <span className="flex justify-between text-[12px] tabular-nums">
                              <span className={it.received > 0 && it.received < it.qty ? "font-medium text-amber" : undefined}>{formatNumber(it.received)}</span>
                              <span className="text-muted">de {formatNumber(it.qty)}</span>
                            </span>
                            <span className="mt-1 block">
                              <Meter value={(it.received / it.qty) * 100} tone={it.received >= it.qty ? "ok" : it.received > 0 ? "warn" : "ink"} label={`Recebido de ${p.sku}`} />
                            </span>
                          </TableCell>
                          <TableCell numeric>{formatCurrency(it.cost)}</TableCell>
                          <TableCell numeric>{formatCurrency(it.qty * it.cost)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted">
                        Frete {o.freight}
                      </TableCell>
                      <TableCell numeric>{o.freight === "CIF" ? "Incluso" : formatCurrency(o.freightValue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} className="font-medium">
                        Total
                      </TableCell>
                      <TableCell numeric className="font-semibold">
                        {formatCurrency(poTotal(o))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
                <section>
                  <h2 className="m-0 mb-3 text-[14px] font-medium">Histórico</h2>
                  <Timeline items={history} />
                </section>
              </div>
            }
            aside={
              <>
                <ProjectProgressCard
                  title="Próximos passos"
                  subtitle={o.status === "cancelado" ? "Pedido cancelado" : o.status === "recebido" ? "Ciclo concluído" : undefined}
                  owner={user(o.buyer).name}
                  due={o.status === "recebido" || o.status === "cancelado" ? undefined : o.expected}
                  late={late}
                  milestones={milestones}
                />
                <section className="rounded-xl border border-line bg-surface p-4">
                  <button type="button" onClick={() => go("erp-suppliers", s.id)} className="mb-3 flex w-full items-center gap-3 rounded-lg text-left">
                    <EntityMark name={s.name} tint={s.tint} className="h-9 w-9 text-[12px]" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium hover:underline">{s.name}</span>
                      <span className="block text-[12px] tabular-nums text-muted">{s.cnpj}</span>
                    </span>
                  </button>
                  <PropertyList
                    items={[
                      { label: "Contato", value: s.contact, hint: s.email },
                      { label: "OTIF", value: formatPercent(s.otif, 0), hint: `prazo médio ${s.leadTime} dias` },
                      { label: "Pedido no fornecedor", value: o.supplierRef },
                    ]}
                  />
                  <Button size="sm" variant="ghost" href={`mailto:${s.email}?subject=${encodeURIComponent(`Pedido ${o.number}`)}`} className="mt-3">
                    <Mail /> Escrever para o fornecedor
                  </Button>
                </section>
                <section className="rounded-xl border border-line bg-surface p-4">
                  <PropertyList
                    items={[
                      { label: "Previsão de entrega", value: br(o.expected), hint: late ? "atrasado" : undefined },
                      { label: "Entregar em", value: wh.name, hint: wh.city },
                      { label: "Pagamento", value: o.payment },
                      { label: "Frete", value: o.freight === "CIF" ? "CIF · por conta do fornecedor" : `FOB · ${formatCurrency(o.freightValue)}` },
                      { label: "Requisição", value: req ? <a className="font-medium text-blue hover:underline" href={`#/frame/erp-purchase-requests?id=${req.id}`}>{req.number}</a> : undefined, hint: req ? undefined : "compra avulsa" },
                      { label: "NF-e de entrada", value: o.nfeKey ? <span className="break-all font-mono text-[11.5px]">{o.nfeKey.match(/.{1,4}/g)?.join(" ")}</span> : undefined, hint: o.nfeKey ? undefined : "informada no recebimento" },
                      { label: "Observações", value: o.notes },
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
        title={`Cancelar o pedido ${o.number}?`}
        description={o.status === "rascunho" ? "O rascunho é descartado e a requisição volta a ficar disponível." : `${s.name} recebe o cancelamento por e-mail. Se já faturou, recuse a NF de entrada no recebimento.`}
        confirmLabel="Cancelar pedido"
        cancelLabel="Manter pedido"
        tone="danger"
        onConfirm={() => {
          setCancel(false);
          const before = o;
          patch({ status: "cancelado" });
          notify(`Pedido ${o.number} cancelado`, () => patch(before));
        }}
      />
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Registrar confirmação do fornecedor"
        description={`${s.name} aceitou o pedido? Informe o número no sistema dele e a data prometida.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <OperationButton operation={confirmOp} onClick={confirm}>
              Registrar confirmação
            </OperationButton>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nº do pedido no fornecedor" value={ref} onChange={setRef} placeholder="Ex.: USI-88131" optional />
          <DatePicker label="Entrega prometida" value={promised} onValueChange={setPromised} min={iso(0)} businessDaysOnly hint={promised !== initial.expected ? `Muda a previsão de ${br(initial.expected)}` : undefined} />
          <div className="sm:col-span-2">
            <OperationFeedback operation={confirmOp} />
          </div>
        </div>
      </Modal>
    </NexoShell>
  );
}
