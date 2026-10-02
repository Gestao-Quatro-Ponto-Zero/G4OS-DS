import { ArrowLeft, CheckCircle2, FileSearch, History, PackageCheck, ScanLine } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  ChoiceCards,
  CurrencyField,
  DatePicker,
  Empty,
  EntityMark,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  PropertyList,
  Select,
  StateView,
  Tabs,
  TextField,
  cn,
  formatCurrency,
  formatNumber,
  notify,
  useOperation,
} from "@g4ai/ds";
import { addStockMove, awaitingReceipt, br, daysAgo, iso, poLate, poStatus, poTotal, productBySku, purchaseOrders, supplierById, updatePurchaseOrder, warehouses, type PurchaseOrder, type WarehouseId } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { CardsSkeleton, DemoErrorState, NexoShell, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Recebimento de mercadoria",
  description: "Conferência da entrega contra o pedido de compra: fila de pedidos a receber, NF-e de entrada pela chave (com busca na SEFAZ), quantidade recebida por item com divergência em palavra, lote e validade, e entrada no estoque confirmada.",
  category: "ERP",
  order: 14,
  height: 1100,
  concept: {
    goal: "Dar entrada só no que chegou de fato: conferir quantidade, nota e lote antes de atualizar o estoque.",
    patterns: [
      "Anatomia F · Mestre-detalhe: pedidos a receber à esquerda, conferência à direita; seleção em ?pedido=",
      "Divergência por item em palavra (Falta 20 · Sobra 5 · Confere), nunca só cor",
      "Chave da NF-e validada contra o CNPJ do fornecedor",
      "Confirmação com useOperation: estoque e kardex atualizados só no fim",
    ],
    adapt: [
      "Devolução de cliente, recebimento de transferência entre filiais, inventário por contagem",
    ],
    avoid: [
      "Dar entrada pela quantidade do pedido sem conferir",
      "Encerrar o saldo sem perguntar o que fazer com a falta",
    ],
  },
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Itens que controlam lote e validade (consumíveis e químicos). */
const tracksLot = (sku: string) => ["Soldagem", "Acabamento"].includes(productBySku(sku).category);
const keyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 44);
const groupKey = (d: string) => d.match(/.{1,4}/g)?.join(" ") ?? "";

export default function ErpReceiving() {
  const demo = useDemoState();
  const pedido = useFrameParam("pedido");
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<"receber" | "hoje">("receber");
  // eslint-disable-next-line react-hooks/exhaustive-deps -- relê o "banco" depois de cada entrada confirmada
  const queue = useMemo(() => (demo === "vazio" ? [] : purchaseOrders.filter(awaitingReceipt).sort((a, b) => a.expected.localeCompare(b.expected))), [demo, version]);
  const done = purchaseOrders.filter((o) => o.receivedAt === iso(0) && o.status === "recebido");
  const visible = tab === "receber" ? queue : done;
  const current = pedido ? purchaseOrders.find((o) => o.id === pedido) : undefined;

  return (
    <NexoShell section="recebimento">
      <Page>
        <PageHeading
          crumbs={[{ label: "Compras" }]}
          title="Recebimento de mercadoria"
          description="Confira o que chegou contra o pedido de compra. O estoque só muda quando você confirma a entrada."
          actions={
            <Button variant="ghost" onClick={() => go("erp-stock-movements", { tipo: "entrada" })}>
              <History /> Entradas no kardex
            </Button>
          }
        />
        {demo === "carregando" ? (
          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <CardsSkeleton label="Carregando pedidos a receber" />
            <div className="hidden rounded-2xl border border-line bg-surface p-6 lg:block">
              <CardsSkeleton rows={3} label="Carregando conferência" />
            </div>
          </div>
        ) : demo === "erro" ? (
          <DemoErrorState noun="os pedidos a receber" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Mestre: no celular some quando há um pedido aberto (o detalhe tem "Voltar"). */}
            <div className={cn("min-w-0 space-y-3", current && "hidden lg:block")}>
              <Tabs
                label="Fila"
                value={tab}
                onChange={(v) => setTab(v as typeof tab)}
                items={[
                  { id: "receber", label: "A receber", count: queue.length || undefined },
                  { id: "hoje", label: "Recebidos hoje" },
                ]}
              />
              {visible.length === 0 ? (
                tab === "receber" ? (
                  <Empty icon={<PackageCheck />} title="Nada para receber" hint="Pedidos enviados ou confirmados pelos fornecedores aparecem aqui até a entrega." action={<Button size="sm" variant="ghost" onClick={() => go("erp-purchase-orders")}>Ver pedidos de compra</Button>} />
                ) : (
                  <Empty title="Nenhuma entrada hoje" hint="As entradas confirmadas hoje ficam aqui para consulta." />
                )
              ) : (
                <ul className="m-0 list-none space-y-2 p-0" aria-label="Pedidos a receber">
                  {visible.map((o) => (
                    <li key={o.id}>
                      <QueueCard o={o} active={o.id === current?.id} onOpen={() => setFrameQuery({ pedido: o.id })} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Detalhe */}
            <div className={cn("min-w-0", !current && "hidden lg:block")}>
              {current ? (
                <Conference key={`${current.id}-${version}`} order={current} onDone={() => setVersion((v) => v + 1)} />
              ) : (
                <div className="rounded-2xl border border-line bg-surface">
                  <StateView icon={<ScanLine />} title="Escolha o pedido que chegou" description="Selecione na fila à esquerda ou procure o nº da OC no ⌘K. A conferência abre aqui." />
                </div>
              )}
            </div>
          </div>
        )}
      </Page>
    </NexoShell>
  );
}

function QueueCard({ o, active, onOpen }: { o: PurchaseOrder; active: boolean; onOpen: () => void }) {
  const s = supplierById(o.supplierId);
  const late = poLate(o);
  const d = -daysAgo(o.expected);
  return (
    <button type="button" aria-current={active ? "true" : undefined} onClick={onOpen} className={cn("w-full rounded-xl border bg-surface px-4 py-3 text-left transition-colors", active ? "border-line-strong shadow-raised" : "border-line hover:border-line-strong")}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11.5px] text-muted">{o.number}</span>
        <Badge tone={late ? "bad" : poStatus[o.status].tone}>{late ? `Atrasado ${-d === 1 ? "1 dia" : `${-d} dias`}` : poStatus[o.status].label}</Badge>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <EntityMark name={s.name} tint={s.tint} className="h-6 w-6 shrink-0 text-[10px]" />
        <span className="truncate text-[13.5px] font-medium">{s.name}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-muted">
        <span className="truncate">
          {o.items.length} {o.items.length === 1 ? "item" : "itens"} · {warehouses.find((w) => w.id === o.warehouse)?.name} · {o.status === "recebido" ? "recebido" : d === 0 ? "chega hoje" : d > 0 ? `chega em ${d === 1 ? "1 dia" : `${d} dias`}` : `previsto ${br(o.expected).slice(0, 5)}`}
        </span>
        <span className="shrink-0 font-medium tabular-nums text-ink">{formatCurrency(poTotal(o), { cents: false })}</span>
      </div>
    </button>
  );
}

type Line = { sku: string; now: number | null; lot: string; expiry: string };

function Conference({ order, onDone }: { order: PurchaseOrder; onDone: () => void }) {
  const s = supplierById(order.supplierId);
  const [lines, setLines] = useState<Line[]>(() => order.items.map((it) => ({ sku: it.sku, now: it.qty - it.received, lot: "", expiry: "" })));
  const [key, setKey] = useState(order.nfeKey && order.status !== "parcial" ? order.nfeKey : "");
  const [nfValue, setNfValue] = useState<number | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseId>(order.warehouse);
  const [gap, setGap] = useState<"manter" | "encerrar">("manter");
  const [tried, setTried] = useState(false);
  const [finished, setFinished] = useState<PurchaseOrder | null>(order.status === "recebido" ? order : null);
  const lookup = useOperation({ busyLabel: "Consultando SEFAZ…" });
  const op = useOperation({ busyLabel: "Dando entrada…" });

  const lineOf = (sku: string) => lines.find((l) => l.sku === sku)!;
  const setLine = (sku: string, p: Partial<Line>) => setLines((all) => all.map((l) => (l.sku === sku ? { ...l, ...p } : l)));
  const rows = order.items.map((it) => {
    const open = it.qty - it.received;
    const now = lineOf(it.sku).now ?? 0;
    return { it, p: productBySku(it.sku), open, now, diff: now - open };
  });
  const short = rows.filter((r) => r.diff < 0);
  const over = rows.filter((r) => r.diff > 0);
  const checkedValue = rows.reduce((sum, r) => sum + r.now * r.it.cost, 0) + (order.freight === "FOB" ? order.freightValue : 0);
  const digits = keyDigits(key);
  const cnpj = s.cnpj.replace(/\D/g, "");
  const keyError = !digits ? "Informe a chave de acesso da NF-e (44 dígitos)." : digits.length < 44 ? `Faltam ${44 - digits.length} dígitos.` : digits.slice(6, 20) !== cnpj ? `A chave é de outro emitente (CNPJ ${digits.slice(6, 20)}). Esta entrega é de ${s.name}.` : undefined;
  const lotError = (r: (typeof rows)[number]) => (tracksLot(r.it.sku) && r.now > 0 && !lineOf(r.it.sku).lot.trim() ? "Informe o lote." : undefined);
  const valueGap = nfValue != null ? nfValue - checkedValue : 0;
  const invalid = !!keyError || rows.some((r) => lotError(r)) || rows.every((r) => r.now === 0);

  const fetchKey = () =>
    lookup.run(async () => {
      await wait(900);
      const n = String(4_000 + Number(order.id)).padStart(9, "0");
      setKey(groupKey(`5226${iso(0).slice(2, 4)}${iso(0).slice(5, 7)}${cnpj}55001${n}1${String(Number(order.id) * 97).padStart(8, "0")}`));
      setNfValue(Math.round(poTotal({ items: order.items.map((it) => ({ ...it, qty: it.qty - it.received })), freightValue: order.freightValue }) * 100) / 100);
    }, `NF-e de ${s.name} encontrada no manifesto do destinatário`);

  const confirm = async () => {
    setTried(true);
    if (invalid) return;
    let result: PurchaseOrder | undefined;
    const failed = await op.run(async () => {
      await wait(1000);
      const nf = `NF ${Number(digits.slice(25, 34)).toLocaleString("pt-BR")}`;
      rows.forEach((r) => r.now > 0 && addStockMove({ sku: r.it.sku, kind: "entrada", warehouse, qty: r.now, doc: nf, who: "Sérgio Moura", reason: lineOf(r.it.sku).lot ? `Lote ${lineOf(r.it.sku).lot}${lineOf(r.it.sku).expiry ? ` · validade ${br(lineOf(r.it.sku).expiry)}` : ""}` : undefined }));
      const items = order.items.map((it) => ({ ...it, received: it.received + (lineOf(it.sku).now ?? 0) }));
      const complete = items.every((it) => it.received >= it.qty) || gap === "encerrar";
      result = updatePurchaseOrder(order.id, { items, status: complete ? "recebido" : "parcial", receivedAt: iso(0), nfeKey: digits, notes: complete ? order.notes : `Saldo de ${short.map((r) => `${formatNumber(-r.diff)} ${r.p.unit} de ${r.p.sku}`).join(", ")} em aberto.` });
    });
    if (failed || !result) return;
    notify(`Entrada de ${rows.filter((r) => r.now > 0).length} ${rows.filter((r) => r.now > 0).length === 1 ? "item confirmada" : "itens confirmada"} no ${warehouses.find((w) => w.id === warehouse)?.name} · ${order.number}`);
    setFinished(result);
  };

  if (finished)
    return (
      <div className="rounded-2xl border border-line bg-surface">
        <StateView
          tone="ok"
          icon={<CheckCircle2 />}
          title={finished.status === "recebido" ? `${order.number} recebido` : `${order.number} recebido em parte`}
          description={finished.status === "recebido" ? "Estoque e kardex atualizados. O título a pagar foi gerado para o financeiro aprovar." : "Estoque atualizado com o que chegou. O saldo segue em aberto no pedido."}
          action={<Button onClick={() => { setFrameQuery({ pedido: undefined }); onDone(); }}>Próximo recebimento</Button>}
          secondaryAction={<Button variant="ghost" onClick={() => go("erp-purchase-order", order.id)}>Abrir pedido</Button>}
        />
      </div>
    );

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface" aria-label={`Conferência do pedido ${order.number}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <button type="button" onClick={() => setFrameQuery({ pedido: undefined })} className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink lg:hidden">
            <ArrowLeft className="h-3.5 w-3.5" /> Pedidos a receber
          </button>
          <div className="text-[12px] text-muted">
            <a href={`#/frame/erp-purchase-order?id=${order.id}`} className="font-mono hover:underline">
              {order.number}
            </a>{" "}
            · previsto para {br(order.expected)} · frete {order.freight}
          </div>
          <h2 className="m-0 mt-1 flex items-center gap-2 text-[18px] font-semibold tracking-tight">
            <EntityMark name={s.name} tint={s.tint} className="h-7 w-7 text-[11px]" />
            {s.name}
          </h2>
        </div>
        <Badge tone={poLate(order) ? "bad" : poStatus[order.status].tone}>{poLate(order) ? "Atrasado" : poStatus[order.status].label}</Badge>
      </header>

      <div className="space-y-7 px-5 py-6 sm:px-6">
        <section>
          <h3 className="m-0 mb-3 text-[13px] font-medium">1 · Nota fiscal de entrada</h3>
          <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <TextField
              label="Chave de acesso da NF-e"
              value={key}
              onChange={(v) => setKey(groupKey(keyDigits(v)))}
              placeholder="5226 0912 3456 7800 0190 5500 1000 0123 4510 0000 0012"
              inputMode="numeric"
              error={tried ? keyError : digits.length === 44 ? keyError : undefined}
              hint={`44 dígitos do DANFE ou do XML. Emitente esperado: ${s.cnpj}.`}
            />
            <div className="sm:pt-[26px]">
              <OperationButton operation={lookup} variant="ghost" onClick={fetchKey}>
                <FileSearch /> Buscar na SEFAZ
              </OperationButton>
            </div>
          </div>
          <OperationFeedback operation={lookup} inline />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CurrencyField label="Valor total da NF" value={nfValue} onChange={setNfValue} hint={nfValue != null && Math.abs(valueGap) > 0.01 ? `Diferença de ${formatCurrency(Math.abs(valueGap))} ${valueGap > 0 ? "a mais" : "a menos"} que o conferido` : "Confere com o valor dos itens recebidos?"} />
            <Select label="Dar entrada em" value={warehouse} onValueChange={(v) => setWarehouse(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name, description: w.id === order.warehouse ? "depósito do pedido" : "outro depósito" }))} />
          </div>
        </section>

        <section>
          <h3 className="m-0 mb-3 text-[13px] font-medium">2 · Conferência física</h3>
          <ul className="m-0 list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
            {rows.map((r) => {
              const l = lineOf(r.it.sku);
              return (
                <li key={r.it.sku} className="space-y-3 px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">{r.p.name}</div>
                      <div className="font-mono text-[11.5px] text-muted">
                        {r.p.sku} · pedido {formatNumber(r.it.qty)} {r.p.unit}
                        {r.it.received ? ` · já recebido ${formatNumber(r.it.received)}` : ""}
                      </div>
                    </div>
                    {r.diff === 0 ? <Badge tone="ok">Confere</Badge> : r.diff < 0 ? <Badge tone="warn">{`Falta ${formatNumber(-r.diff)} ${r.p.unit}`}</Badge> : <Badge tone="bad">{`Sobra ${formatNumber(r.diff)} ${r.p.unit}`}</Badge>}
                  </div>
                  <div className={cn("grid gap-3", tracksLot(r.it.sku) ? "sm:grid-cols-3" : "sm:grid-cols-[180px]")}>
                    <NumberField label="Recebido agora" value={l.now} onChange={(v) => setLine(r.it.sku, { now: v })} min={0} suffix={r.p.unit} hint={`Saldo a receber: ${formatNumber(r.open)}`} />
                    {tracksLot(r.it.sku) && (
                      <>
                        <TextField label="Lote" value={l.lot} onChange={(v) => setLine(r.it.sku, { lot: v.toUpperCase() })} placeholder="L2609-114" error={tried ? lotError(r) : undefined} />
                        <DatePicker label="Validade" value={l.expiry} onValueChange={(v) => setLine(r.it.sku, { expiry: v })} min={iso(30)} optional />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {tried && rows.every((r) => r.now === 0) && <p className="m-0 mt-2 text-[12.5px] text-rose">Nada a dar entrada: informe a quantidade recebida de pelo menos um item.</p>}
        </section>

        {(short.length > 0 || over.length > 0) && (
          <section className="space-y-3">
            <h3 className="m-0 text-[13px] font-medium">3 · Divergências</h3>
            {over.length > 0 && (
              <Callout tone="bad" title="Chegou mais do que o pedido">
                {over.map((r) => `${formatNumber(r.diff)} ${r.p.unit} de ${r.p.sku}`).join(", ")}. Recuse o excedente no canhoto ou peça a carta de correção ao fornecedor antes de dar entrada.
              </Callout>
            )}
            {short.length > 0 && (
              <ChoiceCards
                label="O que fazer com o que faltou?"
                columns={2}
                value={gap}
                onChange={setGap}
                options={[
                  { value: "manter", label: "Manter saldo em aberto", description: "O pedido fica Recebido parcial até a próxima entrega." },
                  { value: "encerrar", label: "Encerrar o saldo", description: "O fornecedor não vai entregar o resto; o pedido fecha como Recebido." },
                ]}
              />
            )}
          </section>
        )}

        <div className="rounded-xl border border-line bg-soft/40 p-4">
          <PropertyList
            items={[
              { label: "Valor conferido", value: <span className="font-semibold tabular-nums">{formatCurrency(checkedValue)}</span>, hint: order.freight === "FOB" ? `inclui frete FOB de ${formatCurrency(order.freightValue)}` : undefined },
              { label: "Itens com divergência", value: short.length + over.length || "Nenhum" },
              { label: "Depósito", value: warehouses.find((w) => w.id === warehouse)?.name },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <OperationFeedback operation={op} inline />
            <Button variant="ghost" onClick={() => go("erp-purchase-order", order.id)}>
              Abrir pedido
            </Button>
            <OperationButton operation={op} onClick={confirm}>
              <PackageCheck /> Confirmar entrada no estoque
            </OperationButton>
          </div>
        </div>
      </div>
    </section>
  );
}
