import { Download, RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  ChartCard,
  DataTable,
  Drawer,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  Pagination,
  PropertyList,
  ProportionBar,
  SortHeader,
  TableSearch,
  WaterfallChart,
  formatCurrency,
  formatDate,
  notify,
  selectionColumn,
  useFilters,
  usePagination,
  useSelection,
  useSort,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { customerById, daysFromToday, go, invoiceLabel, invoices as baseInvoices, invoiceTone, mrrMovements, today, totalMrr, useFrameParam, type Invoice, type InvoiceStatus } from "./data/saas";
import { SaasShell } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Cobrança e faturas",
  description: "Ponte de MRR do mês, situação das faturas, régua de cobrança com retentativa, filtros, ações em massa e detalhe da fatura em gaveta (?id=).",
  category: "SaaS",
  order: 5,
  height: 1240,
  concept: {
    goal: "Proteger o MRR: ver de onde ele vem e recuperar cobranças que falharam.",
    patterns: [
      "Anatomia B · Painel + lista: ponte de MRR no topo, faturas abaixo",
      "Régua de cobrança com retentativa",
      "Ações em massa; detalhe da fatura em gaveta (?id=)",
    ],
    adapt: [
      "Contas a receber (financeiro), assinaturas de serviço",
    ],
    avoid: [
      "Falha de cobrança sem próxima tentativa visível",
    ],
  },
} as const;

const here = "#/frame/saas-billing";
const money = (n: number) => formatCurrency(n, { compact: true });
const statuses = Object.keys(invoiceLabel) as InvoiceStatus[];

const fields: FilterField<Invoice>[] = [
  { key: "status", label: "Situação", type: "enum", quick: true, accessor: (i) => i.status, options: statuses.map((s) => ({ value: s, label: invoiceLabel[s] })) },
  { key: "method", label: "Forma", type: "enum", quick: true, accessor: (i) => i.method, options: ["Cartão", "Boleto", "Pix"].map((m) => ({ value: m, label: m })) },
  { key: "amount", label: "Valor", type: "currency", accessor: (i) => i.amount },
  { key: "issued", label: "Emissão", type: "date", accessor: (i) => i.issued },
];

export default function SaasBilling() {
  const [invoices, setInvoices] = useState(baseInvoices);
  const id = useFrameParam("id");
  const [open, setOpen] = useState<Invoice | null>(null);
  useEffect(() => {
    if (id) setOpen(baseInvoices.find((i) => i.id === id) ?? null);
  }, [id]);

  const filters = useFilters(invoices, {
    fields,
    search: (i) => [i.number, customerById(i.customerId).name],
    now: today,
    url: true,
    initial: { query: "", conditions: [{ id: "pend", field: "status", op: "is", value: ["falhou", "vencida", "aberta"] }] },
  });
  const q = filters.state.query;
  const sort = useSort(filters.rows, { valor: (i) => i.amount, venc: (i) => i.due }, { key: "venc", dir: "asc" });
  const pages = usePagination(sort.rows, 10, { resetKey: [filters.state, sort.sort] });
  const sel = useSelection(pages.rows.map((i) => i.id));

  const sum = (s: InvoiceStatus[]) => invoices.filter((i) => s.includes(i.status)).reduce((t, i) => t + i.amount, 0);
  const sept = mrrMovements[mrrMovements.length - 1];
  const start = totalMrr - (sept.novo + sept.expansao + sept.contracao + sept.churn);

  const retry = (list: Invoice[]) => {
    const ids = new Set(list.map((i) => i.id));
    const prev = invoices;
    setInvoices((all) => all.map((i) => (ids.has(i.id) && i.status === "falhou" ? { ...i, status: "paga" as const, attempts: (i.attempts ?? 0) + 1 } : i)));
    notify(`${list.length} cobrança${list.length > 1 ? "s" : ""} reprocessada${list.length > 1 ? "s" : ""}`, () => setInvoices(prev));
  };

  const columns: Column<Invoice>[] = [
    selectionColumn<Invoice>(sel, (i) => i.id, (i) => i.number),
    {
      key: "customer",
      header: "Cliente",
      primary: true,
      cell: (i) => {
        const c = customerById(i.customerId);
        return (
          <span className="flex items-center gap-2.5">
            <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 text-[11px]" />
            <span className="min-w-0">
              <Highlight text={c.name} query={q} className="block truncate" />
              <Highlight text={i.number} query={q} className="block text-[12px] font-normal text-muted" />
            </span>
          </span>
        );
      },
    },
    { key: "status", header: "Situação", cell: (i) => <Badge tone={invoiceTone[i.status]}>{invoiceLabel[i.status]}</Badge> },
    { key: "method", header: "Forma", mobileHidden: true, cell: (i) => i.method },
    {
      key: "due",
      header: <SortHeader label="Vencimento" {...sort.header("venc")} />,
      nowrap: true,
      cell: (i) => {
        const d = daysFromToday(i.due);
        return <span className={i.status !== "paga" && d < 0 ? "font-medium text-rose" : "text-muted"}>{i.status !== "paga" && d < 0 ? `${-d} dias em atraso` : formatDate(i.due)}</span>;
      },
    },
    { key: "attempts", header: "Tentativas", mobileHidden: true, align: "right", cell: (i) => (i.attempts ? <span className="tabular-nums">{i.attempts} de 4</span> : <span className="text-muted">—</span>) },
    { key: "amount", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", nowrap: true, cell: (i) => <span className="font-medium tabular-nums">{formatCurrency(i.amount)}</span> },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Cobrança"
          description="Receita recorrente, faturas e a régua de cobrança automática (4 tentativas em 10 dias)."
          actions={
            <Button variant="ghost" onClick={() => notify("Exemplo: exporta as faturas do período para o contador (XML + PDF).", undefined, "info")}>
              <Download /> Exportar para contabilidade
            </Button>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="MRR" value={money(totalMrr)} delta={(totalMrr - start) / start} period="vs. agosto" />
            <KpiCard label="A receber" value={money(sum(["aberta"]))} hint="faturas dentro do prazo" />
            <KpiCard label="Em atraso" value={money(sum(["vencida", "falhou"]))} delta={0.08} goodWhen="down" period="vs. agosto" />
            <KpiCard label="Recuperado pela régua" value={money(48_320)} delta={0.21} period="cobranças que falharam e depois passaram" />
          </KpiGrid>

          <div className="grid gap-6 lg:grid-cols-5">
            <ChartCard className="lg:col-span-3" title="Como o MRR mudou em setembro?" description="De agosto (início) a setembro (fim), por tipo de movimento">
              <WaterfallChart
                steps={[
                  { label: "Agosto", value: start, kind: "total" },
                  { label: "Novo", value: sept.novo },
                  { label: "Expansão", value: sept.expansao },
                  { label: "Contração", value: sept.contracao },
                  { label: "Churn", value: sept.churn },
                  { label: "Setembro", value: totalMrr, kind: "total" },
                ]}
                format={money}
                height={240}
              />
            </ChartCard>
            <ChartCard className="lg:col-span-2" title="Situação das faturas" description={`${invoices.length} faturas nos últimos 3 meses`}>
              <ProportionBar
                items={statuses.map((s) => ({ label: invoiceLabel[s], value: invoices.filter((i) => i.status === s).length, color: { paga: "var(--ds-ok)", aberta: "var(--ds-chart-6)", vencida: "var(--ds-amber)", falhou: "var(--ds-rose)" }[s] }))}
              />
              <p className="m-0 mt-5 text-[12.5px] leading-relaxed text-muted">A régua tenta de novo em 1, 3, 7 e 10 dias. Depois disso a conta vai para o time de Customer Success.</p>
            </ChartCard>
          </div>

          <section className="space-y-4">
            <FilterBar filters={filters} noun="fatura" search={<TableSearch value={q} onChange={filters.setQuery} total={invoices.length} noun="fatura" searchIn="cliente e número da nota" />} />
            <DataTable rows={pages.rows} columns={columns} rowKey={(i) => i.id} onRowClick={setOpen} rowLabel={(i) => `Abrir ${i.number}`} empty={<EmptyFilterResult filters={filters} noun="fatura" />} />
            <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
          </section>
        </div>
        <BulkBar count={sel.count} noun="fatura" onClear={sel.clear}>
          <button type="button" onClick={() => (retry(invoices.filter((i) => sel.has(i.id))), sel.clear())}>
            <RefreshCw /> Tentar cobrar agora
          </button>
          <button type="button" onClick={() => (notify(`2ª via enviada para ${sel.count} clientes`), sel.clear())}>
            <Send /> Enviar 2ª via
          </button>
        </BulkBar>
      </Page>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        kicker={open ? customerById(open.customerId).name : undefined}
        title={open?.number ?? ""}
        footer={
          open && (
            <>
              <Button variant="ghost" onClick={() => go("saas-customer", open.customerId)}>
                Abrir conta
              </Button>
              {open.status !== "paga" ? (
                <Button
                  onClick={() => {
                    retry([open]);
                    setOpen(null);
                  }}
                >
                  <RefreshCw /> Tentar cobrar agora
                </Button>
              ) : (
                <Button onClick={() => notify(`Recibo de ${open.number} enviado`)}>
                  <Send /> Reenviar recibo
                </Button>
              )}
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge tone={invoiceTone[open.status]}>{invoiceLabel[open.status]}</Badge>
              <span className="text-[22px] font-semibold tabular-nums">{formatCurrency(open.amount)}</span>
            </div>
            <PropertyList
              items={[
                { label: "Cliente", value: customerById(open.customerId).name },
                { label: "Emissão", value: formatDate(open.issued) },
                { label: "Vencimento", value: formatDate(open.due) },
                { label: "Forma de pagamento", value: open.method },
                { label: "Tentativas de cobrança", value: open.attempts ? `${open.attempts} de 4` : undefined },
                { label: "Plano", value: `${customerById(open.customerId).plan} · ${customerById(open.customerId).seats} usuários` },
              ]}
            />
            {open.status === "falhou" && (
              <div className="rounded-xl border border-rose/25 bg-rose-soft/50 px-4 py-3 text-[13px] text-rose">
                Cartão recusado pelo emissor (saldo insuficiente). Próxima tentativa automática em 3 dias.
              </div>
            )}
          </div>
        )}
      </Drawer>
    </SaasShell>
  );
}
