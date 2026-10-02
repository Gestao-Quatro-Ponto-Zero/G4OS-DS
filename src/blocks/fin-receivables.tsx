import { CheckCircle2, Download, FileText, Mail, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  BarChart,
  Button,
  ChartCard,
  DataGrid,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FieldBlock,
  FilterBar,
  Highlight,
  KpiCard,
  KpiGrid,
  Page,
  PageHeading,
  PropertyList,
  TableSearch,
  Tabs,
  formatCurrency,
  formatPercent,
  notify,
  useFilters,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { agingBuckets, br, customerById, iso, lateDays, receivables as seed, today, type Receivable } from "./data/fin";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contas a receber",
  description: "Vencidos e a vencer em abas, aging em barras, DataGrid com tom por atraso, total fixo, cobrança em massa, ações rápidas (receber, cobrar), CSV e gaveta para registrar pagamento ou promessa.",
  category: "Financeiro",
  order: 3,
  height: 1180,
  concept: {
    goal: "Cobrar quem está atrasado, começando pelo maior risco.",
    patterns: [
      "Anatomia A · Lista com resumo de aging no topo e DataGrid abaixo",
      "Tom da linha por atraso; total fixo no rodapé da grade",
      "Cobrança em massa e ações rápidas (receber, cobrar)",
      "Registrar pagamento ou promessa em gaveta",
    ],
    adapt: [
      "Faturas em atraso (SaaS), devoluções pendentes",
    ],
    avoid: [
      "Ordenar por nome em vez de atraso",
    ],
  },
} as const;

const money = (n: number) => formatCurrency(n, { compact: true });
const bucketOf = (r: Receivable) => agingBuckets.find((b) => b.test(lateDays(r)))?.id ?? "a vencer";

const fields: FilterField<Receivable>[] = [
  { key: "bucket", label: "Faixa de atraso", type: "enum", quick: true, accessor: bucketOf, options: agingBuckets.map((b) => ({ value: b.id, label: b.label })) },
  { key: "method", label: "Forma", type: "enum", quick: true, accessor: (r) => r.method, options: ["Boleto", "Pix", "Cartão"].map((m) => ({ value: m, label: m })) },
  { key: "value", label: "Valor", type: "currency", accessor: (r) => r.value },
  { key: "due", label: "Vencimento", type: "date", accessor: (r) => r.due },
  { key: "customer", label: "Cliente", type: "text", accessor: (r) => customerById(r.customerId).name },
];

export default function FinReceivables() {
  const demo = useDemoState();
  const [list, setList] = useState<Receivable[]>(() => (demo === "vazio" ? [] : [...seed]));
  // O título aberto vem da URL (?id=): ⌘K, cliente e painel abrem a gaveta certa.
  const openId = useFrameParam("id");
  const open = openId ? list.find((r) => r.id === openId) ?? null : null;
  const setOpen = (r: Receivable | null) => setFrameQuery({ id: r?.id });
  const tabOf = (r: Receivable) => (lateDays(r) > 0 ? "vencidos" : "vencer");
  const [tab, setTab] = useState<"vencidos" | "vencer">(() => (open ? tabOf(open) : "vencidos"));
  const [lastOpen, setLastOpen] = useState(openId);
  if (openId !== lastOpen) {
    setLastOpen(openId);
    if (open && tabOf(open) !== tab) setTab(tabOf(open));
  }
  const [promise, setPromise] = useState(iso(3));
  const inTab = useMemo(() => list.filter((r) => (tab === "vencidos" ? lateDays(r) > 0 : lateDays(r) === 0)), [list, tab]);
  const filters = useFilters(inTab, { fields, search: (r) => [r.doc, customerById(r.customerId).name, customerById(r.customerId).cnpj.replace(/\D/g, "")], now: today, url: "r_" });
  const q = filters.state.query;
  const overdue = list.filter((r) => lateDays(r) > 0);
  const totalOpen = list.reduce((s, r) => s + r.value, 0);
  const aging = agingBuckets.map((b) => ({ faixa: b.label, valor: overdue.filter((r) => b.test(lateDays(r))).reduce((s, r) => s + r.value, 0) }));

  const receive = (r: Receivable) => {
    const before = list;
    setList((all) => all.filter((x) => x.id !== r.id));
    setOpen(null);
    notify(`Recebimento de ${formatCurrency(r.value)} registrado · ${r.doc}`, () => setList(before));
  };

  const columns: GridColumn<Receivable>[] = [
    {
      key: "customer",
      header: "Cliente",
      value: (r) => customerById(r.customerId).name,
      width: 300,
      pinned: "left",
      hideable: false,
      mobile: "title",
      cell: (r) => {
        const c = customerById(r.customerId);
        return (
          <span className="flex items-center gap-2.5">
            <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 shrink-0 text-[11px]" />
            <span className="min-w-0 leading-tight">
              <Highlight text={c.name} query={q} className="block truncate" />
              <span className="block truncate text-[11.5px] font-normal text-muted">
                <Highlight text={r.doc} query={q} /> · parcela {r.installment} · {r.method}
              </span>
            </span>
          </span>
        );
      },
    },
    { key: "due", header: "Vencimento", value: (r) => r.due, width: 120, cell: (r) => <span className="tabular-nums text-muted">{br(r.due)}</span> },
    {
      key: "late",
      header: "Atraso",
      value: lateDays,
      width: 120,
      mobile: "subtitle",
      cell: (r) => (lateDays(r) ? <Badge tone={lateDays(r) > 60 ? "bad" : lateDays(r) > 15 ? "warn" : "neutral"}>{`${lateDays(r)} dias`}</Badge> : <span className="text-muted">a vencer</span>),
    },
    {
      key: "value",
      header: "Valor",
      value: (r) => r.value,
      width: 140,
      align: "right",
      cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.value)}</span>,
      footer: (rows) => formatCurrency(rows.reduce((s, r) => s + r.value, 0)),
      tooltip: "Soma dos títulos no filtro atual",
    },
    { key: "method", header: "Forma", value: (r) => r.method, width: 110, defaultHidden: true },
    {
      key: "contact",
      header: "Cobrança",
      value: (r) => r.promise ?? r.lastContact ?? "",
      width: 240,
      cell: (r) => (
        <span className="block truncate text-[12.5px] leading-tight">
          {r.promise ? <span className="font-medium text-ok">{r.promise}</span> : <span className="text-muted">{r.lastContact ?? "Sem contato"}</span>}
          {r.promise && r.lastContact && <span className="block truncate text-[11px] text-muted">{r.lastContact}</span>}
        </span>
      ),
    },
  ];

  return (
    <NexoShell section="receber">
      <Page>
        <PageHeading
          title="Contas a receber"
          description={`Títulos gerados pelas notas fiscais. Posição de ${br(iso(0))}.`}
          actions={
            <Button variant="ghost" onClick={() => notify("Posição de contas a receber exportada (XLSX)", undefined, "info")}>
              <Download /> Exportar posição
            </Button>
          }
        />
        <div className="mt-6 space-y-6">
          <KpiGrid>
            <KpiCard label="Total a receber" value={money(totalOpen)} hint={`${list.length} títulos em aberto`} />
            <KpiCard label="Vencido" value={money(overdue.reduce((s, r) => s + r.value, 0))} delta={0.092} goodWhen="down" period="vs. 31/08" />
            <KpiCard label="Inadimplência (90+ dias)" value={formatPercent(overdue.filter((r) => lateDays(r) > 90).reduce((s, r) => s + r.value, 0) / (totalOpen || 1))} delta={-0.011} goodWhen="down" period="vs. 31/08" />
            <KpiCard label="Prazo médio de recebimento" value="38 dias" delta={0.05} goodWhen="down" period="vs. média do semestre" />
          </KpiGrid>

          <ChartCard title="Há quanto tempo o vencido está em aberto?" description="Saldo vencido por faixa de atraso (aging) · quanto mais à direita, menor a chance de receber">
            <BarChart label="Saldo vencido por faixa de atraso" data={aging} index="faixa" series={[{ key: "valor", label: "Saldo" }]} format={(n) => formatCurrency(n, { cents: false })} formatAxis={money} height={200} />
          </ChartCard>

          <section className="space-y-4">
            <Tabs
              label="Situação"
              value={tab}
              onChange={(v) => setTab(v as typeof tab)}
              items={[
                { id: "vencidos", label: `Vencidos · ${overdue.length}` },
                { id: "vencer", label: `A vencer · ${list.length - overdue.length}` },
              ]}
            />
            <DataGrid
              key={tab}
              label={tab === "vencidos" ? "Títulos vencidos" : "Títulos a vencer"}
              rows={filters.rows}
              columns={columns}
              rowKey={(r) => r.id}
              rowLabel={(r) => `${customerById(r.customerId).name} ${r.doc}`}
              maxHeight={560}
              storageKey="fin-receber"
              defaultSort={tab === "vencidos" ? { key: "late", dir: "desc" } : { key: "due", dir: "asc" }}
              query={q}
              selectable
              noun="título"
              exportFileName={tab === "vencidos" ? "titulos-vencidos" : "titulos-a-vencer"}
              toolbar={<FilterBar filters={filters} noun="título" search={<TableSearch value={q} onChange={filters.setQuery} total={inTab.length} noun="título" searchIn="cliente, CNPJ e nº da nota" />} />}
              rowTone={(r) => (lateDays(r) > 60 ? "bad" : lateDays(r) > 15 ? "warn" : undefined)}
              onRowOpen={setOpen}
              rowActions={(r) => [
                { label: "Registrar recebimento", icon: <CheckCircle2 />, inline: true, onSelect: () => receive(r) },
                { label: "Cobrar por e-mail", icon: <Mail />, inline: true, onSelect: () => notify(`Lembrete enviado para ${customerById(r.customerId).email}`) },
                { label: "Cobrar por WhatsApp", icon: <MessageCircle />, onSelect: () => notify(`Mensagem de cobrança enviada para ${customerById(r.customerId).contact}`) },
                { label: "Segunda via do boleto", icon: <FileText />, disabled: r.method !== "Boleto", onSelect: () => notify(`Segunda via de ${r.doc} gerada`, undefined, "info") },
              ]}
              bulkActions={(rows, { clear }) => (
                <>
                  <button type="button" onClick={() => { notify(`Cobrança por e-mail enviada para ${rows.length} títulos`); clear(); }}>
                    <Mail /> E-mail
                  </button>
                  <button type="button" onClick={() => { notify(`Mensagem de cobrança enviada por WhatsApp (${rows.length})`); clear(); }}>
                    <MessageCircle /> WhatsApp
                  </button>
                  <button type="button" onClick={() => { notify(`${rows.length} segundas vias de boleto geradas`, undefined, "info"); clear(); }}>
                    <FileText /> Segunda via
                  </button>
                </>
              )}
              loading={demo === "carregando"}
              error={demoError(demo, "os títulos a receber")}
              empty={
                inTab.length === 0 ? (
                  <Empty framed={false} icon={<CheckCircle2 />} title={tab === "vencidos" ? "Nenhum título vencido" : "Nenhum título a vencer"} hint={tab === "vencidos" ? "Carteira em dia: nada para cobrar agora." : "Os títulos nascem quando a NF-e do pedido é autorizada."} action={tab === "vencer" ? <Button size="sm" variant="ghost" onClick={() => go("erp-invoices")}>Ver notas fiscais</Button> : undefined} />
                ) : (
                  <EmptyFilterResult filters={filters} noun="título" />
                )
              }
              mobile="cards"
            />
          </section>
        </div>
      </Page>
      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        kicker={open ? `${open.doc} · parcela ${open.installment}` : undefined}
        title={open ? customerById(open.customerId).name : ""}
        width={480}
        footer={
          open && (
            <>
              <Button variant="ghost" onClick={() => notify(`Lembrete enviado para ${customerById(open.customerId).email}`)}>
                <Mail /> Cobrar
              </Button>
              <Button onClick={() => receive(open)}>
                <CheckCircle2 /> Registrar recebimento
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="text-[28px] font-semibold tabular-nums tracking-tight">{formatCurrency(open.value)}</div>
            <PropertyList
              items={[
                { label: "Vencimento", value: br(open.due), hint: lateDays(open) ? `${lateDays(open)} dias de atraso` : "a vencer" },
                { label: "Forma", value: open.method },
                { label: "Último contato", value: open.lastContact },
                { label: "Promessa", value: open.promise },
                { label: "Cliente", value: <a className="text-blue hover:underline" href={`#/frame/erp-customers?id=${open.customerId}`}>Ver cadastro e limite</a> },
              ]}
            />
            <div className="rounded-xl border border-line bg-soft/40 p-4">
              <FieldBlock label="Registrar promessa de pagamento" hint="O título sai da fila de cobrança até a data.">
                <div className="flex flex-wrap gap-2">
                  <DatePicker label="Data prometida" value={promise} onValueChange={setPromise} min={iso(0)} />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setList((all) => all.map((x) => (x.id === open.id ? { ...x, promise: `Pagar em ${br(promise).slice(0, 5)}`, lastContact: "Hoje · registrado por você" } : x)));
                      setOpen(null);
                      notify(`Promessa registrada para ${br(promise)}`);
                    }}
                  >
                    Registrar
                  </Button>
                </div>
              </FieldBlock>
            </div>
          </div>
        )}
      </Drawer>
    </NexoShell>
  );
}
