import { Check, Copy, Landmark, Plus, Printer, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  BulkBar,
  Button,
  Callout,
  Combobox,
  CurrencyField,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FileCard,
  FileDropzone,
  Modal,
  OperationButton,
  OperationFeedback,
  Select,
  TextField,
  useOperation,
  type UploadItem,
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
import { addPayable, br, company, costCenters, iso, payableCategories, payableStatus, payables as seed, suppliers, today, type Payable } from "./data/fin";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

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

const tabOf = (p: Payable): Tab => (inTabOf("aprovacao")(p) ? "aprovacao" : p.status === "pago" ? "pagos" : "abertos");

export default function FinPayables() {
  const demo = useDemoState();
  // O título aberto vem da URL (?id=): ⌘K, painel e fornecedor trocam a gaveta sem remontar a tela.
  const open = useFrameParam("id");
  const creating = useFrameParam("novo") === "1";
  const setOpen = (v: string | null) => setFrameQuery({ id: v ?? undefined });
  const [list, setList] = useState<Payable[]>(() => (demo === "vazio" ? [] : [...seed]));
  const [tab, setTab] = useState<Tab>(() => {
    const initial = seed.find((p) => p.id === open);
    return initial ? tabOf(initial) : "aprovacao";
  });
  // Abriu outro título pela URL: a aba acompanha para a linha estar visível atrás da gaveta.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    const target = list.find((p) => p.id === open);
    if (target && tabOf(target) !== tab) setTab(tabOf(target));
  }
  const [reason, setReason] = useState("");
  const [boleto, setBoleto] = useState(false);
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
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
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
          <DataTable
            label="Contas a pagar"
            rows={sort.rows}
            columns={columns}
            rowKey={(x) => x.id}
            onRowClick={(x) => setOpen(x.id)}
            rowLabel={(x) => `Abrir ${x.doc}`}
            loading={demo === "carregando"}
            error={demoError(demo, "as contas a pagar")}
            empty={
              rows.length === 0 ? (
                <Empty
                  framed={false}
                  icon={<Landmark />}
                  title={tab === "aprovacao" ? "Nada aguardando aprovação" : tab === "pagos" ? "Nenhum pagamento no mês" : "Nenhum título a pagar"}
                  hint={tab === "aprovacao" ? "Títulos acima de R$ 20 mil chegam aqui antes de ir ao banco." : "Lance a NF do fornecedor ou o boleto: o título entra na fila de aprovação ou é agendado."}
                  action={tab === "pagos" ? undefined : <Button size="sm" variant="ghost" onClick={() => setFrameQuery({ novo: "1" })}><Plus /> Lançar título</Button>}
                />
              ) : (
                <EmptyFilterResult filters={filters} noun="título" />
              )
            }
          />
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
            <FileCard name={`${p.doc.replace(/\s/g, "-").toLowerCase()}.pdf`} size={184_000} meta={p.method === "Boleto" ? "Boleto · lido automaticamente" : `${p.method} · documento anexo`} onOpen={() => setBoleto(true)} />
            {p.status === "aprovacao" && <TextareaField label="Motivo (se for recusar)" value={reason} onChange={setReason} autosize minRows={2} optional />}
          </div>
        )}
      </Drawer>
      {p && <BoletoModal open={boleto} onClose={() => setBoleto(false)} p={p} />}
      {creating && (
        <NewPayable
          onClose={() => setFrameQuery({ novo: undefined })}
          onCreated={(x) => {
            setList((all) => [x, ...all]);
            setTab(tabOf(x));
            setFrameQuery({ novo: undefined, id: x.id });
          }}
        />
      )}
    </NexoShell>
  );
}

/* ------------------------------------------------------------------ */
/* Pré-visualização do boleto                                          */
/* ------------------------------------------------------------------ */

/** Linha digitável de exemplo derivada do valor e do vencimento (formato FEBRABAN). */
function digitable(p: Payable) {
  const v = String(Math.round(p.value * 100)).padStart(10, "0");
  const due = String(9_000 + Math.round((new Date(`${p.due}T00:00:00`).getTime() - new Date(2022, 4, 29).getTime()) / 86_400_000)).slice(-4);
  return `34191.09008 ${p.id.replace(/\D/g, "").padStart(5, "0")}.${due.slice(0, 1)}01234 56789.012345 1 ${due}${v}`;
}

function BoletoModal({ open, onClose, p }: { open: boolean; onClose: () => void; p: Payable }) {
  const line = digitable(p);
  // Código de barras ilustrativo: larguras alternadas a partir dos dígitos.
  const bars = line.replace(/\D/g, "").split("").map(Number);
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      kicker={`${p.doc} · ${p.method}`}
      title={p.method === "Boleto" ? "Boleto" : "Documento de cobrança"}
      description="Conferido contra a NF e o pedido de compra antes do pagamento."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(line.replace(/\D/g, ""));
              notify("Linha digitável copiada", undefined, "info");
            }}
          >
            <Copy /> Copiar linha digitável
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer /> Imprimir
          </Button>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-line px-4 py-3">
          <span className="border-r border-line pr-3 font-mono text-[15px] font-semibold">341-7</span>
          <span className="truncate text-right font-mono text-[12.5px] tabular-nums sm:text-[13.5px]">{line}</span>
        </div>
        <dl className="m-0 grid grid-cols-2 text-[12.5px] sm:grid-cols-4">
          {[
            ["Beneficiário", p.supplier],
            ["Vencimento", br(p.due)],
            ["Valor do documento", formatCurrency(p.value)],
            ["Nosso número", `109/${p.id.replace(/\D/g, "").padStart(8, "0")}-4`],
            ["Pagador", company.name],
            ["CNPJ do pagador", company.cnpj],
            ["Documento", p.doc],
            ["Centro de custo", p.costCenter],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 border-b border-r border-line px-3 py-2">
              <dt className="text-[11px] text-muted">{k}</dt>
              <dd className="m-0 truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="px-4 py-4">
          <div aria-label="Código de barras do boleto" role="img" className="flex h-14 items-stretch gap-px overflow-hidden">
            {bars.map((n, i) => (
              <span key={i} className={i % 2 ? "bg-surface" : "bg-ink"} style={{ width: 1 + (n % 3) }} />
            ))}
          </div>
          <p className="m-0 mt-2 text-[11.5px] text-muted">Autenticação mecânica · ficha de compensação</p>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Novo título (gaveta)                                                */
/* ------------------------------------------------------------------ */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const APPROVAL_LIMIT = 20_000;

function NewPayable({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Payable) => void }) {
  const [supplierId, setSupplierId] = useState("");
  const [doc, setDoc] = useState("");
  const [category, setCategory] = useState(payableCategories[0]);
  const [center, setCenter] = useState(costCenters[0]);
  const [value, setValue] = useState<number | null>(null);
  const [due, setDue] = useState(iso(10));
  const [method, setMethod] = useState<Payable["method"]>("Boleto");
  const [barcode, setBarcode] = useState("");
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Lançando…" });
  const sup = suppliers.find((s) => s.id === supplierId);
  const errors = {
    supplier: !supplierId ? "Escolha o favorecido." : undefined,
    doc: !doc.trim() ? "Informe o nº da NF, fatura ou guia." : undefined,
    value: !value ? "Informe o valor." : undefined,
    barcode: method === "Boleto" && barcode.replace(/\D/g, "").length < 44 ? "Linha digitável com 47 dígitos (ou 44 do código de barras)." : undefined,
  };
  const needsApproval = (value ?? 0) > APPROVAL_LIMIT;

  const save = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean) || !sup || !value) return;
    let created: Payable | null = null;
    const failed = await op.run(async () => {
      await wait(800);
      created = addPayable({ id: `p${Date.now()}`, doc: doc.trim(), supplier: sup.name, supplierId: sup.id, category, costCenter: center, due, value, status: needsApproval ? "aprovacao" : "agendado", method, approver: needsApproval ? "Helena Duarte" : undefined });
    }, needsApproval ? `Título ${doc.trim()} lançado · aguarda aprovação da controladoria` : `Título ${doc.trim()} lançado e agendado para ${br(due)}`);
    if (failed || !created) return;
    onCreated(created);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker="Contas a pagar"
      title="Novo título"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Lançar título
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <FileDropzone
          label="Boleto ou NF (PDF, XML)"
          hint="Lemos favorecido, valor e vencimento do documento. Confira antes de lançar."
          accept=".pdf,.xml,image/*"
          maxFiles={2}
          items={files}
          onRemove={(id) => setFiles((all) => all.filter((f) => f.id !== id))}
          onFiles={(list) => {
            setFiles((all) => [...all, ...list.map((f, i) => ({ id: `${Date.now()}${i}`, name: f.name, size: f.size }))]);
            if (!supplierId) {
              setSupplierId("s1");
              setDoc("NF 88.519");
              setValue(64_280);
              setDue(iso(28));
              setBarcode("34191.09008 00519.401234 56789.012345 1 99880006428000");
            }
          }}
          optional
        />
        <Combobox label="Favorecido" placeholder="Fornecedor, órgão ou prestador" value={supplierId} onValueChange={setSupplierId} error={tried ? errors.supplier : undefined} options={suppliers.map((s) => ({ value: s.id, label: s.name, description: `${s.cnpj} · ${s.category}` }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Documento" value={doc} onChange={setDoc} placeholder="NF 88.519" error={tried ? errors.doc : undefined} />
          <CurrencyField label="Valor" value={value} onChange={setValue} error={tried ? errors.value : undefined} hint={needsApproval ? "Acima de R$ 20 mil: vai para aprovação" : undefined} />
          <DatePicker label="Vencimento" value={due} onValueChange={setDue} min={iso(0)} businessDaysOnly />
          <Select label="Forma de pagamento" value={method} onValueChange={(v) => setMethod(v as Payable["method"])} options={["Boleto", "Pix", "TED", "DARF"].map((m) => ({ value: m, label: m }))} />
          {method === "Boleto" && <TextField className="sm:col-span-2" label="Linha digitável" value={barcode} onChange={setBarcode} inputMode="numeric" placeholder="34191.09008 00000.000000 00000.000000 0 00000000000000" error={tried ? errors.barcode : undefined} />}
          <Select label="Categoria" value={category} onValueChange={setCategory} options={payableCategories.map((c) => ({ value: c, label: c }))} />
          <Select label="Centro de custo" value={center} onValueChange={setCenter} options={costCenters.map((c) => ({ value: c, label: c }))} />
        </div>
        {needsApproval && <Callout tone="info">Vai para Helena Duarte aprovar. Depois de aprovado, é agendado para o vencimento.</Callout>}
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
