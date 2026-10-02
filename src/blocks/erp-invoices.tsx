import { Download, FilePlus2, FileText, FileWarning, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  Callout,
  ChoiceCards,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  NumberField,
  OperationButton,
  OperationFeedback,
  PropertyList,
  Select,
  TextField,
  useOperation,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  SortHeader,
  StatCell,
  StatGrid,
  TableSearch,
  formatCurrency,
  notify,
  selectionColumn,
  useFilters,
  useSelection,
  useSort,
  type Column,
  type FilterField, PageToolbar
} from "@g4ai/ds";
import { addInvoice, br, carriers, customerById, iso, invoiceStatus, invoices as seed, orderById, orderTotal, orders, products, today, updateOrder, warehouses, type Invoice, type InvoiceStatus, type Order } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Notas fiscais",
  description: "NF-e emitidas com situação na SEFAZ, rejeições em destaque com o motivo e reenvio, busca por número, chave ou cliente (/), download de XML em massa. Linha abre a nota.",
  category: "ERP",
  order: 9,
  height: 900,
  concept: {
    goal: "Achar notas com problema na SEFAZ e resolver rápido.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Rejeições em destaque com o motivo e reenvio",
      "Busca por número, chave ou cliente (/); XML em massa",
    ],
    adapt: [
      "Faturas (SaaS), títulos (financeiro)",
    ],
    avoid: [
      "Rejeição sem o motivo na linha",
    ],
  },
} as const;

const fields: FilterField<Invoice>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (n) => n.status, options: (Object.keys(invoiceStatus) as InvoiceStatus[]).map((s) => ({ value: s, label: invoiceStatus[s].label })) },
  { key: "cfop", label: "CFOP", type: "enum", quick: true, accessor: (n) => n.cfop, options: [{ value: "5102", label: "5102 · dentro do estado" }, { value: "6102", label: "6102 · fora do estado" }] },
  { key: "total", label: "Valor", type: "currency", accessor: (n) => n.total },
  { key: "issued", label: "Emissão", type: "date", accessor: (n) => n.issuedAt },
  { key: "customer", label: "Cliente", type: "text", accessor: (n) => customerById(n.customerId).name },
];

export default function ErpInvoices() {
  const demo = useDemoState();
  const emitting = useFrameParam("emitir") === "1";
  const fixId = useFrameParam("corrigir");
  const [list, setList] = useState<Invoice[]>(() => (demo === "vazio" ? [] : [...seed]));
  const fixing = fixId ? list.find((n) => n.id === fixId && n.status === "rejeitada") : undefined;
  // A SEFAZ responde em segundos: depois do envio, a nota sai de "Processando" sozinha.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const authorizeLater = (id: string) => {
    timers.current.push(
      window.setTimeout(() => {
        setList((all) => all.map((x) => (x.id === id ? { ...x, status: "autorizada", reason: undefined, rejected: undefined } : x)));
        const n = seed.find((x) => x.id === id);
        if (n) Object.assign(n, { status: "autorizada", reason: undefined, rejected: undefined });
        notify(`NF-e ${n?.number ?? id} autorizada pela SEFAZ`);
      }, 2200),
    );
  };
  const filters = useFilters(list, { fields, search: (n) => [n.number, n.id, n.key, customerById(n.customerId).name, customerById(n.customerId).cnpj.replace(/\D/g, "")], now: today, url: "n_" });
  const sort = useSort(filters.rows, { numero: (n) => n.id, valor: (n) => n.total, data: (n) => n.issuedAt }, { key: "numero", dir: "desc" });
  const sel = useSelection(sort.rows.map((n) => n.id));
  const q = filters.state.query;
  const rejected = list.filter((n) => n.status === "rejeitada");
  const authorized = list.filter((n) => n.status === "autorizada");

  const resend = (n: Invoice) => setFrameQuery({ corrigir: n.id });

  const columns: Column<Invoice>[] = [
    selectionColumn<Invoice>(sel, (n) => n.id, (n) => n.number),
    {
      key: "number",
      header: <SortHeader label="NF-e" {...sort.header("numero")} />,
      primary: true,
      nowrap: true,
      cell: (n) => (
        <span className="block">
          <Highlight text={n.number} query={q} className="font-mono text-[12.5px]" />
          <span className="block text-[11.5px] font-normal text-muted">série {n.series} · CFOP {n.cfop}</span>
        </span>
      ),
    },
    {
      key: "customer",
      header: "Destinatário",
      cell: (n) => {
        const c = customerById(n.customerId);
        return (
          <span className="block min-w-0">
            <Highlight text={c.name} query={q} className="block truncate" />
            <span className="block truncate text-[12px] text-muted">pedido {orderById(n.orderId).number}</span>
          </span>
        );
      },
    },
    { key: "issued", header: <SortHeader label="Emissão" {...sort.header("data")} />, nowrap: true, mobileHidden: true, cell: (n) => <span className="tabular-nums text-muted">{br(n.issuedAt)}</span> },
    { key: "total", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", nowrap: true, cell: (n) => <span className="font-medium tabular-nums">{formatCurrency(n.total)}</span> },
    {
      key: "status",
      header: "SEFAZ",
      cell: (n) => (
        <span className="flex items-center gap-2">
          <Badge tone={invoiceStatus[n.status].tone}>{invoiceStatus[n.status].label}</Badge>
          {n.status === "rejeitada" && (
            <button type="button" onClick={(e) => { e.stopPropagation(); resend(n); }} className="inline-flex items-center gap-1 text-[12px] font-medium text-blue hover:underline">
              <RotateCw className="h-3 w-3" /> Reenviar
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <NexoShell section="notas">
      <Page>
        <PageHeading
          title="Notas fiscais"
          description="NF-e de saída. Autorizadas podem ser canceladas em até 24 h da emissão."
          actions={
            <>
              <Button variant="ghost" onClick={() => notify(`XML de ${authorized.length} notas do mês enviado para a contabilidade`)}>
                <Download /> Enviar XML do mês
              </Button>
              <Button onClick={() => setFrameQuery({ emitir: "1" })}>
                <FilePlus2 /> Emitir nota
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-6">
          <StatGrid cols={4}>
            <StatCell label="Autorizadas" value={authorized.length} hint={formatCurrency(authorized.reduce((s, n) => s + n.total, 0), { compact: true })} />
            <StatCell label="Rejeitadas" value={rejected.length} tone={rejected.length ? "bad" : undefined} hint="corrigir e reenviar" />
            <StatCell label="Em processamento" value={list.filter((n) => n.status === "processando").length} hint="aguardando SEFAZ" />
            <StatCell label="Canceladas" value={list.filter((n) => n.status === "cancelada").length} hint="no mês" />
          </StatGrid>
          {rejected.map((n) => (
            <Callout
              key={n.id}
              tone="bad"
              title={`NF-e ${n.number} rejeitada · ${customerById(n.customerId).name}`}
              action={
                <Button size="sm" variant="ghost" onClick={() => resend(n)}>
                  <RotateCw /> Corrigir e reenviar
                </Button>
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <FileWarning className="h-3.5 w-3.5" /> {n.reason}
              </span>
            </Callout>
          ))}
          <div className="space-y-4">
            <PageToolbar>
              <FilterBar filters={filters} noun="nota" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="nota" searchIn="número, chave de acesso, cliente e CNPJ" />} />
            </PageToolbar>
            <DataTable
              label="Notas fiscais"
              rows={sort.rows}
              columns={columns}
              rowKey={(n) => n.id}
              onRowClick={(n) => go("erp-invoice", n.id)}
              rowLabel={(n) => `Abrir NF-e ${n.number}`}
              loading={demo === "carregando"}
              error={demoError(demo, "as notas fiscais")}
              empty={
                list.length === 0 ? (
                  <Empty framed={false} icon={<FileText />} title="Nenhuma NF-e emitida" hint="Emita a nota a partir de um pedido aprovado: itens, cliente e impostos vêm do pedido." action={<Button size="sm" variant="ghost" onClick={() => setFrameQuery({ emitir: "1" })}><FilePlus2 /> Emitir nota</Button>} />
                ) : (
                  <EmptyFilterResult filters={filters} noun="nota" />
                )
              }
            />
            <BulkBar count={sel.count} noun="nota" onClear={sel.clear}>
              <button type="button" onClick={() => { notify(`${sel.count} XML baixados (ZIP)`, undefined, "info"); sel.clear(); }}>
                <Download /> Baixar XML
              </button>
            </BulkBar>
          </div>
        </div>
      </Page>
      {emitting && (
        <EmitDrawer
          onClose={() => setFrameQuery({ emitir: undefined })}
          onEmitted={(n) => {
            setList((all) => [n, ...all]);
            authorizeLater(n.id);
          }}
        />
      )}
      {fixing && (
        <FixDrawer
          key={fixing.id}
          n={fixing}
          onClose={() => setFrameQuery({ corrigir: undefined })}
          onSent={() => {
            setList((all) => all.map((x) => (x.id === fixing.id ? { ...x, status: "processando" } : x)));
            authorizeLater(fixing.id);
          }}
        />
      )}
    </NexoShell>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cfopOf = (uf: string) => (uf === "GO" ? "5102" : "6102");

/* ------------------------------------------------------------------ */
/* Emitir NF-e a partir de pedido aprovado                             */
/* ------------------------------------------------------------------ */

function EmitDrawer({ onClose, onEmitted }: { onClose: () => void; onEmitted: (n: Invoice) => void }) {
  const ready = orders.filter((o) => o.status === "aprovado");
  const [orderId, setOrderId] = useState(ready[0]?.id ?? "");
  const [carrier, setCarrier] = useState(carriers[0]);
  const [volumes, setVolumes] = useState<number | null>(4);
  const [shipDate, setShipDate] = useState(iso(0));
  const op = useOperation({ busyLabel: "Transmitindo…" });
  const o: Order | undefined = ready.find((x) => x.id === orderId);
  const c = o ? customerById(o.customerId) : undefined;
  const total = o ? orderTotal(o) : 0;
  const icms = c ? total * (c.uf === "GO" ? 0.17 : 0.12) : 0;
  const nextId = String(Math.max(...seed.map((n) => Number(n.id))) + 1);

  const emit = async () => {
    if (!o || !c) return;
    let created: Invoice | null = null;
    const failed = await op.run(async () => {
      await wait(1100);
      created = addInvoice({
        id: nextId,
        number: `000.0${nextId.slice(0, 2)}.${nextId.slice(2)}`,
        series: "1",
        orderId: o.id,
        customerId: c.id,
        issuedAt: iso(0),
        total,
        status: "processando",
        key: `5226${iso(0).slice(2, 4)}${iso(0).slice(5, 7)}12345678000190550010000${nextId}1${String(Date.now()).slice(-8)}`,
        cfop: cfopOf(c.uf),
      });
      updateOrder(o.id, { status: "faturado", invoice: nextId });
    }, `NF-e ${nextId} do pedido ${o.number} enviada à SEFAZ`);
    if (failed || !created) return;
    onEmitted(created);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker="Faturamento"
      title="Emitir NF-e"
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={emit} disabled={!o} disabledReason="Escolha um pedido aprovado.">
            Emitir e transmitir
          </OperationButton>
        </>
      }
    >
      {ready.length === 0 ? (
        <Empty title="Nenhum pedido pronto para faturar" hint="Só pedidos aprovados viram NF-e. Aprove um orçamento ou libere o crédito do cliente." action={<Button size="sm" variant="ghost" onClick={() => go("erp-orders")}>Ver pedidos</Button>} />
      ) : (
        <div className="space-y-6">
          <ChoiceCards
            label={`Pedido aprovado · ${ready.length} prontos para faturar`}
            columns={1}
            value={orderId}
            onChange={setOrderId}
            options={ready.slice(0, 6).map((x) => {
              const k = customerById(x.customerId);
              return { value: x.id, label: `${x.number} · ${k.name}`, description: `${x.items.length} ${x.items.length === 1 ? "item" : "itens"} · ${k.city}/${k.uf} · ${warehouses.find((w) => w.id === x.warehouse)?.name}`, aside: <span className="text-[13px] font-medium tabular-nums">{formatCurrency(orderTotal(x), { cents: false })}</span> };
            })}
          />
          {o && c && (
            <>
              <section className="rounded-xl border border-line bg-soft/40 p-4">
                <PropertyList
                  items={[
                    { label: "Natureza", value: "Venda de mercadoria adquirida de terceiros" },
                    { label: "CFOP", value: cfopOf(c.uf), hint: c.uf === "GO" ? "dentro do estado" : `interestadual · ${c.uf}` },
                    { label: "Número", value: `000.0${nextId.slice(0, 2)}.${nextId.slice(2)} · série 1` },
                    { label: "Destinatário", value: c.name, hint: `CNPJ ${c.cnpj}${c.ie ? ` · IE ${c.ie}` : ""}` },
                    { label: "Itens", value: o.items.map((it) => `${it.qty} × ${products.find((p) => p.sku === it.sku)?.sku}`).join(", ") },
                    { label: "ICMS estimado", value: formatCurrency(icms), hint: c.uf === "GO" ? "17 %" : "12 % interestadual" },
                    { label: "Total da nota", value: <span className="text-[15px] font-semibold tabular-nums">{formatCurrency(total)}</span> },
                  ]}
                />
              </section>
              <section className="grid gap-3 sm:grid-cols-3">
                <Select className="sm:col-span-3" label="Transportadora" value={carrier} onValueChange={setCarrier} options={carriers.map((x) => ({ value: x, label: x }))} />
                <NumberField label="Volumes" value={volumes} onChange={setVolumes} min={1} />
                <DatePicker className="sm:col-span-2" label="Data de saída" value={shipDate} onValueChange={setShipDate} min={iso(0)} />
              </section>
              {c.status === "bloqueado" && <Callout tone="warn" title="Cliente com crédito bloqueado">A nota sai, mas o título a receber já nasce marcado para cobrança antecipada.</Callout>}
            </>
          )}
          <OperationFeedback operation={op} />
        </div>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Corrigir rejeição e reenviar                                        */
/* ------------------------------------------------------------------ */

function FixDrawer({ n, onClose, onSent }: { n: Invoice; onClose: () => void; onSent: () => void }) {
  const field = n.rejected;
  const [value, setValue] = useState(field?.value ?? "");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Reenviando…" });
  const c = customerById(n.customerId);
  const unchanged = !!field && value.trim() === field.value;
  const send = async () => {
    setTried(true);
    if (unchanged || !value.trim()) return;
    const failed = await op.run(() => wait(900), `NF-e ${n.number} corrigida e reenviada à SEFAZ`);
    if (failed) return;
    onSent();
    onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      kicker={`NF-e ${n.number} · ${c.name}`}
      title="Corrigir e reenviar"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={() => go("erp-invoice", n.id)}>
            Abrir nota
          </Button>
          <OperationButton operation={op} onClick={send}>
            <RotateCw /> Corrigir e reenviar
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <Callout tone="bad" title="Motivo da rejeição">
          {n.reason}
        </Callout>
        {field ? (
          <TextField label={field.label} value={value} onChange={setValue} hint={field.hint} error={tried && unchanged ? "Ainda é o valor recusado pela SEFAZ: corrija antes de reenviar." : tried && !value.trim() ? "Informe o valor correto." : undefined} />
        ) : (
          <p className="m-0 text-[13px] text-ink-soft">Revise o cadastro do cliente e os dados do pedido; o reenvio usa o mesmo número.</p>
        )}
        <PropertyList
          items={[
            { label: "Destinatário", value: c.name, hint: `CNPJ ${c.cnpj} · ${c.city}/${c.uf}` },
            { label: "Pedido", value: orderById(n.orderId).number },
            { label: "Valor", value: formatCurrency(n.total) },
            { label: "Mesmo número", value: `${n.number} · série ${n.series}`, hint: "A rejeição não consome a numeração." },
          ]}
        />
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
