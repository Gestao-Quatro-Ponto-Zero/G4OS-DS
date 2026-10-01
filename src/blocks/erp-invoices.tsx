import { Download, FileWarning, RotateCw } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  Callout,
  DataTable,
  EmptyFilterResult,
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
} from "@g4os/ds";
import { br, customerById, invoiceStatus, invoices as seed, orderById, today, type Invoice, type InvoiceStatus } from "./data/erp";
import { go } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

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
  const [list, setList] = useState(seed);
  const filters = useFilters(list, { fields, search: (n) => [n.number, n.id, n.key, customerById(n.customerId).name, customerById(n.customerId).cnpj.replace(/\D/g, "")], now: today, url: "n_" });
  const sort = useSort(filters.rows, { numero: (n) => n.id, valor: (n) => n.total, data: (n) => n.issuedAt }, { key: "numero", dir: "desc" });
  const sel = useSelection(sort.rows.map((n) => n.id));
  const q = filters.state.query;
  const rejected = list.filter((n) => n.status === "rejeitada");
  const authorized = list.filter((n) => n.status === "autorizada");

  const resend = (n: Invoice) => {
    setList((all) => all.map((x) => (x.id === n.id ? { ...x, status: "processando" } : x)));
    notify(`NF-e ${n.number} corrigida e reenviada à SEFAZ`);
    setTimeout(() => setList((all) => all.map((x) => (x.id === n.id ? { ...x, status: "autorizada", reason: undefined } : x))), 1800);
  };

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
            <Button variant="ghost" onClick={() => notify(`XML de ${authorized.length} notas do mês enviado para a contabilidade`, undefined, "info")}>
              <Download /> Enviar XML do mês
            </Button>
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
            <DataTable rows={sort.rows} columns={columns} rowKey={(n) => n.id} onRowClick={(n) => go("erp-invoice", n.id)} rowLabel={(n) => `Abrir NF-e ${n.number}`} empty={<EmptyFilterResult filters={filters} noun="nota" />} />
            <BulkBar count={sel.count} noun="nota" onClear={sel.clear}>
              <button type="button" onClick={() => { notify(`${sel.count} XML baixados (ZIP)`, undefined, "info"); sel.clear(); }}>
                <Download /> Baixar XML
              </button>
            </BulkBar>
          </div>
        </div>
      </Page>
    </NexoShell>
  );
}
