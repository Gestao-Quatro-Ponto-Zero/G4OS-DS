import { ClipboardCheck, History, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Combobox,
  DataGrid,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
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
  TableSearch,
  Tabs,
  TextareaField,
  formatCurrency,
  formatNumber,
  useFilters,
  useOperation,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { addStockMove, adjustReasons, br, daysAgo, moveKind, productBySku, products, stockMoves, today, warehouses, type MoveKind, type StockMove, type WarehouseId } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Movimentações de estoque",
  description: "Kardex em DataGrid: entradas, saídas, transferências entre CDs e ajustes de inventário com motivo, saldo corrente por produto, documento de origem clicável, valor ao custo e ajuste de inventário em gaveta com diferença calculada.",
  category: "ERP",
  order: 16,
  height: 980,
  concept: {
    goal: "Explicar o saldo: de onde veio e para onde foi cada unidade, e corrigir o estoque com motivo registrado.",
    patterns: [
      "Anatomia A · Lista com DataGrid: abas por tipo, filtros, total no rodapé, rolagem interna",
      "Saldo corrente por produto (kardex) ao filtrar um SKU (?sku=)",
      "Ajuste de inventário em Drawer: saldo do sistema × contado, diferença e motivo obrigatórios",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Extrato de pontos, movimentação de ativos, histórico de lotes",
    ],
    avoid: [
      "Ajuste sem motivo",
      "Saldo sem o documento que o mudou",
    ],
  },
} as const;

type Tab = "todos" | MoveKind;
const whName = (id: WarehouseId) => warehouses.find((w) => w.id === id)?.name ?? id;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fields: FilterField<StockMove>[] = [
  { key: "warehouse", label: "Depósito", type: "enum", quick: true, accessor: (m) => (m.to ? [m.warehouse, m.to] : m.warehouse), options: warehouses.map((w) => ({ value: w.id, label: w.name })) },
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (m) => productBySku(m.sku).category, options: [...new Set(products.map((p) => p.category))].map((c) => ({ value: c, label: c })) },
  { key: "date", label: "Data", type: "date", accessor: (m) => m.date },
  { key: "who", label: "Responsável", type: "text", accessor: (m) => m.who },
  { key: "reason", label: "Motivo do ajuste", type: "enum", accessor: (m) => m.reason ?? "", options: adjustReasons.map((r) => ({ value: r, label: r })) },
];

/** Documento de origem leva à tela certa (pedido de venda, de compra). */
function DocLink({ m, q }: { m: StockMove; q: string }) {
  const href = m.doc.startsWith("PV-") ? `#/frame/erp-order?id=${Number(m.doc.slice(3))}` : m.doc.startsWith("OC-") ? `#/frame/erp-purchase-order?id=${Number(m.doc.slice(3))}` : undefined;
  const text = <Highlight text={m.doc} query={q} className="font-mono text-[12px]" />;
  return href ? (
    <a href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
      {text}
    </a>
  ) : (
    text
  );
}

export default function ErpStockMovements() {
  const demo = useDemoState();
  const skuParam = useFrameParam("sku");
  const tipo = useFrameParam("tipo");
  const adjusting = useFrameParam("ajuste") === "1";
  const [rows, setRows] = useState<StockMove[]>(() => (demo === "vazio" ? [] : [...stockMoves]));
  const [tab, setTab] = useState<Tab>(tipo && tipo in moveKind ? (tipo as MoveKind) : "todos");
  const [grouped, setGrouped] = useState<"sim" | "nao">("nao");
  const product = skuParam ? productBySku(skuParam) : null;
  const scoped = useMemo(() => rows.filter((m) => (!skuParam || m.sku === skuParam) && (tab === "todos" || m.kind === tab)), [rows, skuParam, tab]);
  const filters = useFilters(scoped, { fields, search: (m) => [m.doc, m.sku, productBySku(m.sku).name, m.who, m.reason], now: today, url: "mv_" });
  const q = filters.state.query;

  const last30 = rows.filter((m) => daysAgo(m.date) <= 30 && (!skuParam || m.sku === skuParam));
  const valueOf = (m: StockMove) => Math.abs(m.qty) * productBySku(m.sku).cost;
  const sumValue = (k: MoveKind) => last30.filter((m) => m.kind === k).reduce((s, m) => s + valueOf(m), 0);
  const losses = last30.filter((m) => m.kind === "ajuste" && m.qty < 0).reduce((s, m) => s + valueOf(m), 0);

  const columns: GridColumn<StockMove>[] = [
    { key: "date", header: "Data", value: (m) => `${m.date} ${m.time}`, width: 130, pinned: "left", hideable: false, mobile: "meta", cell: (m) => <span className="tabular-nums text-muted">{br(m.date).slice(0, 5)} · {m.time}</span> },
    {
      key: "product",
      header: "Produto",
      value: (m) => productBySku(m.sku).name,
      width: 250,
      mobile: "title",
      cell: (m) => (
        <span className="block min-w-0 leading-tight">
          <Highlight text={productBySku(m.sku).name} query={q} className="block truncate" />
          <Highlight text={m.sku} query={q} className="block font-mono text-[11.5px] text-muted" />
        </span>
      ),
    },
    { key: "kind", header: "Tipo", value: (m) => moveKind[m.kind].label, width: 130, mobile: "subtitle", cell: (m) => <Badge tone={moveKind[m.kind].tone}>{moveKind[m.kind].label}</Badge> },
    { key: "doc", header: "Documento", value: (m) => m.doc, width: 130, cell: (m) => <DocLink m={m} q={q} /> },
    { key: "warehouse", header: "Depósito", value: (m) => whName(m.warehouse), width: 170, cell: (m) => <span className="text-ink-soft">{m.to ? `${whName(m.warehouse).replace("CD ", "")} → ${whName(m.to).replace("CD ", "")}` : whName(m.warehouse)}</span> },
    {
      key: "qty",
      header: "Quantidade",
      tooltip: "Entradas e ajustes positivos somam; saídas e perdas subtraem. Transferência não muda o saldo total.",
      value: (m) => m.qty,
      width: 120,
      align: "right",
      cell: (m) => {
        const unit = productBySku(m.sku).unit;
        return m.kind === "transferencia" ? (
          <span className="tabular-nums text-muted">
            ⇄ {formatNumber(m.qty)} {unit}
          </span>
        ) : (
          <span className={m.qty > 0 ? "font-medium tabular-nums text-ok" : m.kind === "ajuste" ? "font-medium tabular-nums text-amber" : "tabular-nums"}>
            {m.qty > 0 ? "+" : "−"}
            {formatNumber(Math.abs(m.qty))} {unit}
          </span>
        );
      },
    },
    { key: "balance", header: "Saldo", tooltip: "Saldo total do produto (os dois CDs) depois do movimento", value: (m) => m.balance, width: 100, align: "right", cell: (m) => <span className="tabular-nums text-ink-soft">{formatNumber(m.balance)}</span> },
    {
      key: "value",
      header: "Valor ao custo",
      value: valueOf,
      width: 130,
      align: "right",
      cell: (m) => <span className="tabular-nums">{formatCurrency(valueOf(m))}</span>,
      footer: (list) => formatCurrency(list.filter((m) => m.kind !== "transferencia").reduce((s, m) => s + Math.sign(m.qty) * valueOf(m), 0), { cents: false }),
    },
    { key: "who", header: "Responsável", value: (m) => m.who, width: 170, defaultHidden: true },
    { key: "reason", header: "Motivo", value: (m) => m.reason ?? "", width: 180, defaultHidden: tab !== "ajuste", cell: (m) => (m.reason ? <span className="block truncate text-ink-soft">{m.reason}</span> : <span className="text-muted">—</span>) },
  ];

  const emptyAll = skuParam ? (
    <Empty framed={false} icon={<History />} title={`Sem movimentações de ${skuParam}`} hint="Este produto ainda não teve entrada, saída ou ajuste." action={<Button size="sm" variant="ghost" onClick={() => setFrameQuery({ sku: undefined })}>Ver todos os produtos</Button>} />
  ) : (
    <Empty framed={false} icon={<History />} title={tab === "todos" ? "Nenhuma movimentação ainda" : `Nenhuma ${moveKind[tab as MoveKind].label.toLowerCase()} no período`} hint="Recebimentos, faturamento, transferências e ajustes aparecem aqui assim que acontecem." action={tab === "todos" ? <Button size="sm" variant="ghost" onClick={() => go("erp-receiving")}>Registrar recebimento</Button> : undefined} />
  );

  return (
    <NexoShell section="movimentacoes">
      <Page>
        <PageHeading
          crumbs={product ? [{ label: "Estoque" }, { label: "Movimentações", href: "#/frame/erp-stock-movements" }] : [{ label: "Estoque" }]}
          title={product ? `Kardex · ${product.sku}` : "Movimentações de estoque"}
          description={product ? `${product.name} · saldo atual ${formatNumber(product.stock.gyn + product.stock.cps)} ${product.unit}` : "Tudo o que mudou o saldo: entradas de compra, saídas por venda, transferências entre CDs e ajustes de inventário."}
          actions={
            <Button onClick={() => setFrameQuery({ ajuste: "1" })}>
              <ClipboardCheck /> Ajuste de inventário
            </Button>
          }
        />
        <StatGrid cols={4}>
          <StatCell label="Entradas (30 dias)" value={formatCurrency(sumValue("entrada"), { compact: true })} hint={`${last30.filter((m) => m.kind === "entrada").length} lançamentos`} />
          <StatCell label="Saídas (30 dias)" value={formatCurrency(sumValue("saida"), { compact: true })} hint={`${last30.filter((m) => m.kind === "saida").length} lançamentos`} />
          <StatCell label="Transferências" value={last30.filter((m) => m.kind === "transferencia").length} hint="entre Goiânia e Campinas" />
          <StatCell label="Perdas em ajustes" value={formatCurrency(losses)} tone={losses > 5_000 ? "warn" : undefined} hint="meta: até R$ 5 mil/mês" />
        </StatGrid>
        <Tabs
          className="mt-6"
          label="Tipo de movimento"
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          items={[
            { id: "todos", label: "Todos" },
            { id: "entrada", label: "Entradas" },
            { id: "saida", label: "Saídas" },
            { id: "transferencia", label: "Transferências" },
            { id: "ajuste", label: "Ajustes" },
          ]}
        />
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {product ? (
              <Button size="sm" variant="ghost" onClick={() => setFrameQuery({ sku: undefined })}>
                <X /> Tirar filtro de {product.sku}
              </Button>
            ) : (
              <div className="w-full sm:w-80">
                <Combobox label="Kardex do produto" hideLabel placeholder="Ver o kardex de um produto…" value="" onValueChange={(v) => v && setFrameQuery({ sku: v })} options={products.map((p) => ({ value: p.sku, label: p.name, description: p.sku }))} />
              </div>
            )}
            {!product && <SegmentedControl label="Agrupar" value={grouped} onChange={setGrouped} options={[{ value: "nao", label: "Lista" }, { value: "sim", label: "Por produto" }]} />}
          </div>
          <DataGrid
            key={`${tab}-${skuParam ?? ""}`}
            label={product ? `Kardex de ${product.sku}` : "Movimentações de estoque"}
            rows={demo === "carregando" ? [] : filters.rows}
            columns={columns}
            rowKey={(m) => m.id}
            rowLabel={(m) => `${moveKind[m.kind].label} ${m.doc} ${m.sku}`}
            maxHeight="max(440px, calc(100dvh - 420px))"
            storageKey="erp-kardex"
            defaultSort={{ key: "date", dir: "desc" }}
            query={q}
            noun="movimentação"
            nounPlural="movimentações"
            gender="f"
            exportFileName={product ? `kardex-${product.sku}` : "movimentacoes-estoque"}
            loading={demo === "carregando"}
            error={demoError(demo, "as movimentações")}
            footerLabel="Saldo em valor"
            groupBy={grouped === "sim" && !skuParam ? (m) => `${m.sku} · ${productBySku(m.sku).name}` : undefined}
            toolbar={
              <FilterBar
                filters={filters}
                noun="movimentação"
                nounPlural="movimentações"
                search={<TableSearch value={q} onChange={filters.setQuery} total={scoped.length} noun="movimentação" nounPlural="movimentações" searchIn="documento, SKU, produto e responsável" />}
              />
            }
            empty={scoped.length === 0 ? emptyAll : <EmptyFilterResult filters={filters} noun="movimentação" nounPlural="movimentações" gender="f" />}
            mobile="cards"
          />
        </div>
      </Page>
      {adjusting && (
        <AdjustDrawer
          initialSku={skuParam ?? products[1].sku}
          onClose={() => setFrameQuery({ ajuste: undefined })}
          onSaved={() => setRows([...stockMoves])}
        />
      )}
    </NexoShell>
  );
}

function AdjustDrawer({ initialSku, onClose, onSaved }: { initialSku: string; onClose: () => void; onSaved: () => void }) {
  const [sku, setSku] = useState(initialSku);
  const [warehouse, setWarehouse] = useState<WarehouseId>("gyn");
  const [counted, setCounted] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Ajustando…" });
  const p = productBySku(sku);
  const system = p.stock[warehouse];
  const diff = counted == null ? 0 : counted - system;
  const value = Math.abs(diff) * p.cost;
  const needsNote = value > 1_000;
  const errors = {
    counted: counted == null ? "Informe a quantidade contada." : undefined,
    diff: counted != null && diff === 0 ? "Contagem igual ao sistema: não há o que ajustar." : undefined,
    reason: !reason ? "Escolha o motivo." : undefined,
    note: needsNote && note.trim().length < 10 ? "Acima de R$ 1 mil, descreva o que aconteceu (vai para a controladoria)." : undefined,
  };

  const save = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    const failed = await op.run(async () => {
      await wait(800);
      addStockMove({ sku, kind: "ajuste", warehouse, qty: diff, doc: `AJ-00${30 + (Date.now() % 60)}`, who: "Paulo Menezes", reason: note ? `${reason} · ${note}` : reason });
    }, `Ajuste de ${diff > 0 ? "+" : "−"}${formatNumber(Math.abs(diff))} ${p.unit} de ${p.sku} registrado`);
    if (failed) return;
    onSaved();
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      kicker="Inventário"
      title="Ajuste de inventário"
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={save}>
            Registrar ajuste
          </OperationButton>
        </>
      }
    >
      <div className="space-y-5">
        <Combobox label="Produto" value={sku} onValueChange={(v) => v && setSku(v)} options={products.map((x) => ({ value: x.sku, label: x.name, description: `${x.sku} · ${formatNumber(x.stock.gyn)} em Goiânia · ${formatNumber(x.stock.cps)} em Campinas` }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Depósito" value={warehouse} onValueChange={(v) => setWarehouse(v as WarehouseId)} options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
          <NumberField label="Quantidade contada" value={counted} onChange={setCounted} min={0} suffix={p.unit} hint={`No sistema: ${formatNumber(system)} ${p.unit}`} error={tried ? errors.counted ?? errors.diff : undefined} />
        </div>
        <div className="rounded-xl border border-line bg-soft/40 p-4">
          <PropertyList
            items={[
              { label: "Saldo no sistema", value: `${formatNumber(system)} ${p.unit}` },
              { label: "Contado", value: counted == null ? undefined : `${formatNumber(counted)} ${p.unit}` },
              { label: "Diferença", value: counted == null ? undefined : diff === 0 ? <Badge tone="ok">Confere</Badge> : <Badge tone={diff < 0 ? "warn" : "info"}>{`${diff > 0 ? "Sobra" : "Falta"} ${formatNumber(Math.abs(diff))} ${p.unit}`}</Badge> },
              { label: "Impacto ao custo", value: counted == null || diff === 0 ? undefined : <span className={diff < 0 ? "font-medium tabular-nums text-amber" : "tabular-nums"}>{`${diff < 0 ? "−" : "+"}${formatCurrency(value)}`}</span> },
            ]}
          />
        </div>
        <Select label="Motivo" value={reason} onValueChange={setReason} placeholder="Escolha o motivo" options={adjustReasons.map((r) => ({ value: r, label: r }))} error={tried ? errors.reason : undefined} />
        <TextareaField label="O que aconteceu" value={note} onChange={setNote} minRows={2} optional={!needsNote} placeholder="Ex.: 3 chapas amassadas na descarga do caminhão da Usiminas, fotos no chamado 2231." error={tried ? errors.note : undefined} />
        {needsNote && <Callout tone="warn">Ajustes acima de R$ 1 mil entram no relatório mensal de perdas da controladoria.</Callout>}
        <OperationFeedback operation={op} />
      </div>
    </Drawer>
  );
}
