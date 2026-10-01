import { Check, Plus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  DataTable,
  Drawer,
  EmptyFilterResult,
  FileCard,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  PropertyList,
  SortHeader,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  TextareaField,
  formatCurrency,
  notify,
  plural,
  selectionColumn,
  useFilters,
  useSelection,
  useSort,
  type Column,
  type FilterField, PageToolbar
} from "@g4ai/ds";
import { br, iso, payableStatus, payables as seed, today, type Payable } from "./data/fin";
import { useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Contas a pagar",
  description: "Títulos de fornecedores, folha e impostos: aprovação em massa, agendamento, pagamento, recusa com motivo e gaveta com boleto anexo. Filtros por categoria, centro de custo e vencimento.",
  category: "Financeiro",
  order: 4,
  height: 960,
  concept: {
    goal: "Pagar em dia e só o que foi aprovado, com o comprovante à mão.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada; abas por situação",
      "Aprovação e agendamento em massa (BulkBar)",
      "Recusa com motivo; boleto anexo na gaveta",
    ],
    adapt: [
      "Reembolsos, comissões, faturas de fornecedor",
    ],
    avoid: [
      "Pagar em massa sem confirmação do total",
    ],
  },
} as const;

type Tab = "aprovacao" | "abertos" | "pagos";
const inTabOf = (t: Tab) => (p: Payable) => (t === "aprovacao" ? p.status === "aprovacao" : t === "pagos" ? p.status === "pago" : p.status === "agendado" || p.status === "atrasado");

const fields: FilterField<Payable>[] = [
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (p) => p.category, options: [...new Set(seed.map((p) => p.category))].map((c) => ({ value: c, label: c })) },
  { key: "center", label: "Centro de custo", type: "enum", quick: true, accessor: (p) => p.costCenter, options: [...new Set(seed.map((p) => p.costCenter))].map((c) => ({ value: c, label: c })) },
  { key: "method", label: "Forma", type: "enum", accessor: (p) => p.method, options: ["Boleto", "Pix", "TED", "DARF"].map((m) => ({ value: m, label: m })) },
  { key: "value", label: "Valor", type: "currency", accessor: (p) => p.value },
  { key: "due", label: "Vencimento", type: "date", accessor: (p) => p.due },
];

export default function FinPayables() {
  const id = useFrameParam("id");
  const initial = seed.find((p) => p.id === id);
  const [list, setList] = useState(seed);
  const [tab, setTab] = useState<Tab>(initial ? (inTabOf("aprovacao")(initial) ? "aprovacao" : initial.status === "pago" ? "pagos" : "abertos") : "aprovacao");
  const [open, setOpen] = useState<string | null>(id);
  const [reason, setReason] = useState("");
  const rows = useMemo(() => list.filter(inTabOf(tab)), [list, tab]);
  const filters = useFilters(rows, { fields, search: (p) => [p.doc, p.supplier, p.costCenter], now: today, url: "p_" });
  const sort = useSort(filters.rows, { venc: (p) => p.due, valor: (p) => p.value }, { key: "venc", dir: "asc" });
  const sel = useSelection(sort.rows.map((p) => p.id));
  const q = filters.state.query;
  const p = list.find((x) => x.id === open);

  const update = (ids: string[], status: Payable["status"], msg: string) => {
    const before = list;
    setList((all) => all.map((x) => (ids.includes(x.id) ? { ...x, status } : x)));
    sel.clear();
    notify(msg, () => setList(before));
  };
  const sum = (s: Payable["status"][]) => list.filter((x) => s.includes(x.status)).reduce((a, x) => a + x.value, 0);

  const columns: Column<Payable>[] = [
    ...(tab === "pagos" ? [] : [selectionColumn<Payable>(sel, (x) => x.id, (x) => `${x.supplier} ${x.doc}`)]),
    {
      key: "supplier",
      header: "Favorecido",
      primary: true,
      cell: (x) => (
        <span className="block min-w-0">
          <Highlight text={x.supplier} query={q} className="block truncate" />
          <span className="block truncate text-[12px] font-normal text-muted">
            <Highlight text={x.doc} query={q} /> · {x.costCenter}
          </span>
        </span>
      ),
    },
    { key: "due", header: <SortHeader label="Vencimento" {...sort.header("venc")} />, nowrap: true, cell: (x) => <span className={x.status === "atrasado" ? "font-medium text-rose" : x.due === iso(0) ? "font-medium text-amber" : "tabular-nums"}>{x.due === iso(0) ? "Hoje" : br(x.due)}</span> },
    { key: "method", header: "Forma", mobileHidden: true, cell: (x) => <span className="text-muted">{x.method}</span> },
    { key: "value", header: <SortHeader label="Valor" align="right" {...sort.header("valor")} />, align: "right", nowrap: true, cell: (x) => <span className="font-medium tabular-nums">{formatCurrency(x.value)}</span> },
    { key: "status", header: "Situação", cell: (x) => <Badge tone={payableStatus[x.status].tone}>{payableStatus[x.status].label}</Badge> },
  ];

  return (
    <NexoShell section="pagar">
      <Page>
        <PageHeading
          title="Contas a pagar"
          description="Acima de R$ 20 mil, o pagamento precisa de aprovação da controladoria antes de ir ao banco."
          actions={
            <Button onClick={() => notify("Envie o boleto ou a NF: o título é criado com os dados lidos do documento", undefined, "info")}>
              <Plus /> Novo título
            </Button>
          }
        />
        <div className="mt-6">
          <StatGrid cols={4}>
            <StatCell label="Aguardando aprovação" value={formatCurrency(sum(["aprovacao"]), { compact: true })} hint={`${list.filter((x) => x.status === "aprovacao").length} títulos`} tone="warn" />
            <StatCell label="Atrasado" value={formatCurrency(sum(["atrasado"]), { compact: true })} tone={sum(["atrasado"]) ? "bad" : undefined} hint="pagar hoje evita juros" />
            <StatCell label="Agendado (7 dias)" value={formatCurrency(list.filter((x) => x.status === "agendado" && x.due <= iso(7)).reduce((a, x) => a + x.value, 0), { compact: true })} />
            <StatCell label="Pago no mês" value={formatCurrency(sum(["pago"]), { compact: true })} tone="ok" />
          </StatGrid>
        </div>
        <Tabs
          className="mt-6"
          label="Situação"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { id: "aprovacao", label: "Aguardando aprovação", count: list.filter(inTabOf("aprovacao")).length },
            { id: "abertos", label: "A pagar" },
            { id: "pagos", label: "Pagos" },
          ]}
        />
        <div className="mt-5 space-y-4">
          <PageToolbar>
            <FilterBar filters={filters} noun="título" search={<TableSearch value={q} onChange={filters.setQuery} total={rows.length} noun="título" searchIn="favorecido, documento e centro de custo" />} />
          </PageToolbar>
          <DataTable rows={sort.rows} columns={columns} rowKey={(x) => x.id} onRowClick={(x) => setOpen(x.id)} rowLabel={(x) => `Abrir ${x.doc}`} empty={<EmptyFilterResult filters={filters} noun="título" />} />
          <BulkBar count={sel.count} noun="título" onClear={sel.clear}>
            {tab === "aprovacao" ? (
              <button type="button" onClick={() => update([...sel.selected], "agendado", sel.count === 1 ? "1 título aprovado e agendado" : `${sel.count} títulos aprovados e agendados`)}>
                <Check /> Aprovar
              </button>
            ) : (
              <button type="button" onClick={() => update([...sel.selected], "pago", `Remessa com ${plural(sel.count, "pagamento")} enviada ao banco`)}>
                <Send /> Pagar agora
              </button>
            )}
          </BulkBar>
        </div>
      </Page>
      <Drawer
        open={!!p}
        onClose={() => setOpen(null)}
        kicker={p ? `${p.doc} · ${p.category}` : undefined}
        title={p?.supplier ?? ""}
        width={480}
        footer={
          p &&
          (p.status === "aprovacao" ? (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  if (reason.trim().length < 5) return notify("Escreva o motivo da recusa (o solicitante recebe)", undefined, "info");
                  setList((all) => all.filter((x) => x.id !== p.id));
                  setOpen(null);
                  setReason("");
                  notify(`Título ${p.doc} recusado e devolvido ao solicitante`);
                }}
              >
                <X /> Recusar
              </Button>
              <Button onClick={() => { update([p.id], "agendado", `${p.doc} aprovado · pagamento agendado para ${br(p.due)}`); setOpen(null); }}>
                <Check /> Aprovar
              </Button>
            </>
          ) : p.status !== "pago" ? (
            <Button onClick={() => { update([p.id], "pago", `Pagamento de ${formatCurrency(p.value)} enviado ao banco`); setOpen(null); }}>
              <Send /> Pagar agora
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => notify("Comprovante baixado (PDF)", undefined, "info")}>
              Baixar comprovante
            </Button>
          ))
        }
      >
        {p && (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[28px] font-semibold tabular-nums tracking-tight">{formatCurrency(p.value)}</span>
              <Badge tone={payableStatus[p.status].tone}>{payableStatus[p.status].label}</Badge>
            </div>
            <PropertyList
              items={[
                { label: "Vencimento", value: br(p.due) },
                { label: "Forma", value: p.method },
                { label: "Centro de custo", value: p.costCenter },
                { label: "Fornecedor", value: p.supplierId ? <a className="text-blue hover:underline" href={`#/frame/erp-suppliers?id=${p.supplierId}`}>Ver cadastro</a> : undefined },
                { label: "Aprovador", value: p.approver },
              ]}
            />
            <FileCard name={`${p.doc.replace(/\s/g, "-").toLowerCase()}.pdf`} size={184_000} meta="Boleto · lido automaticamente" onOpen={() => notify("Abrindo o boleto…", undefined, "info")} />
            {p.status === "aprovacao" && <TextareaField label="Motivo (se for recusar)" value={reason} onChange={setReason} autosize minRows={2} optional />}
          </div>
        )}
      </Drawer>
    </NexoShell>
  );
}
