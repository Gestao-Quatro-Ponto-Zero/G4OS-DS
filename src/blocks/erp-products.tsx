import { Archive, ArchiveRestore, PackagePlus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Combobox,
  CurrencyField,
  DataGrid,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Meter,
  NumberField,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  Select,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  TextField,
  formatCurrency,
  formatNumber,
  formatPercent,
  notify,
  useFilters,
  useOperation,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { addProduct, addPurchaseRequest, categories, levelInfo, levelOf, productStatusOf, products as seed, qtyOf, suggestedQty, supplierById, suppliers, today, type Level, type Product } from "./data/erp";
import { go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { NexoShell, demoError, useDemoState } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Produtos",
  description: "Catálogo de SKUs: categoria, saldo contra o mínimo, custo, preço e margem com alerta abaixo da meta, ativos e inativos em abas, cadastro em gaveta com margem calculada na hora. Linha abre o produto.",
  category: "ERP",
  order: 11,
  height: 940,
  concept: {
    goal: "Manter o catálogo saudável: preço com margem, estoque contra o mínimo e cadastro rápido de SKU novo.",
    patterns: [
      "Anatomia A · Lista com DataGrid: abas Ativos/Inativos, filtros e busca na barra da grade",
      "Margem em cor só quando abaixo da meta (número bom não grita)",
      "Novo produto em Drawer com margem calculada enquanto digita",
      "Cinco estados: ?estado=carregando|vazio|erro",
    ],
    adapt: [
      "Catálogo de serviços, planos (SaaS), tabela de preços",
    ],
    avoid: [
      "Página nova só para cadastrar um SKU",
      "Margem sem a referência de meta",
    ],
  },
} as const;

const TARGET_MARGIN = 0.33;
const marginOf = (p: Product) => (p.price ? (p.price - p.cost) / p.price : 0);
const units = ["un", "cx", "kg", "lt", "par", "m", "br"];

const fields: FilterField<Product>[] = [
  { key: "category", label: "Categoria", type: "enum", quick: true, accessor: (p) => p.category, options: categories.map((c) => ({ value: c, label: c })) },
  { key: "level", label: "Estoque", type: "enum", quick: true, accessor: levelOf, options: (Object.keys(levelInfo) as Level[]).map((l) => ({ value: l, label: levelInfo[l].label })) },
  { key: "supplier", label: "Fornecedor", type: "enum", accessor: (p) => p.supplierId, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
  { key: "margin", label: "Margem (%)", type: "number", accessor: (p) => Math.round(marginOf(p) * 100) },
  { key: "price", label: "Preço", type: "currency", accessor: (p) => p.price },
];

type Draft = { name: string; category: string; unit: string; ncm: string; ean: string; supplierId: string; cost: number | null; price: number | null; min: number | null };
const emptyDraft: Draft = { name: "", category: "Fixação", unit: "un", ncm: "", ean: "", supplierId: "", cost: null, price: null, min: 50 };
const prefixOf = (category: string) => category.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function ErpProducts() {
  const demo = useDemoState();
  const creating = useFrameParam("novo") === "1";
  const [list, setList] = useState<Product[]>(() => (demo === "vazio" ? [] : [...seed]));
  const [tab, setTab] = useState<"ativo" | "inativo">("ativo");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Cadastrando…" });

  const tabRows = useMemo(() => list.filter((p) => productStatusOf(p) === tab), [list, tab]);
  const filters = useFilters(tabRows, { fields, search: (p) => [p.sku, p.name, p.ncm, p.category, supplierById(p.supplierId).name], now: today, url: "pr_" });
  const q = filters.state.query;
  const active = list.filter((p) => productStatusOf(p) === "ativo");
  const lowMargin = active.filter((p) => marginOf(p) < TARGET_MARGIN);
  const stockValue = active.reduce((s, p) => s + qtyOf(p) * p.cost, 0);
  const avgMargin = active.length ? active.reduce((s, p) => s + marginOf(p), 0) / active.length : 0;

  const nextSku = `${prefixOf(draft.category)}-${String(900 + list.filter((p) => p.category === draft.category).length).padStart(4, "0")}`;
  const draftMargin = draft.cost && draft.price ? (draft.price - draft.cost) / draft.price : null;
  const errors = {
    name: !draft.name.trim() ? "Informe a descrição que vai na nota fiscal." : undefined,
    ncm: !/^\d{4}\.\d{2}\.\d{2}$/.test(draft.ncm) ? "NCM no formato 0000.00.00 (8 dígitos)." : undefined,
    supplierId: !draft.supplierId ? "Escolha o fornecedor principal." : undefined,
    price: !draft.price ? "Informe o preço de venda." : draft.cost && draft.price < draft.cost ? "Preço abaixo do custo: a venda daria prejuízo." : undefined,
  };
  const valid = !Object.values(errors).some(Boolean) && !!draft.cost;

  const closeDrawer = () => {
    setFrameQuery({ novo: undefined });
    setDraft(emptyDraft);
    setTried(false);
    op.reset();
  };
  const save = async () => {
    setTried(true);
    if (!valid) return;
    const p: Product = { sku: nextSku, name: draft.name.trim(), category: draft.category, unit: draft.unit, ncm: draft.ncm, ean: draft.ean || undefined, cost: draft.cost ?? 0, price: draft.price ?? 0, min: draft.min ?? 0, dailyUse: 0, stock: { gyn: 0, cps: 0 }, supplierId: draft.supplierId };
    const failed = await op.run(() => wait(700), { message: `Produto ${p.sku} cadastrado`, undo: () => setList((all) => all.filter((x) => x.sku !== p.sku)) }, { apply: () => setList((all) => [p, ...all]), revert: () => setList((all) => all.filter((x) => x.sku !== p.sku)) });
    if (failed) return;
    addProduct(p);
    closeDrawer();
    go("erp-product", p.sku);
  };

  const setStatus = (skus: Set<string>, status: "ativo" | "inativo") => {
    const before = list;
    setList((all) => all.map((p) => (skus.has(p.sku) ? { ...p, status } : p)));
    notify(`${skus.size === 1 ? "1 produto" : `${skus.size} produtos`} ${status === "inativo" ? (skus.size === 1 ? "inativado" : "inativados") : skus.size === 1 ? "reativado" : "reativados"}`, () => setList(before));
  };
  const requestPurchase = (p: Product) => {
    const qty = suggestedQty(p) || p.min;
    const r = addPurchaseRequest({ title: `Reposição de ${p.name}`, items: [{ name: p.name, qty, unit: p.unit, sku: p.sku }], urgent: levelOf(p) === "ruptura" });
    notify(`${r.number} criada com ${formatNumber(qty)} ${p.unit} de ${p.sku}`);
    go("erp-purchase-requests", r.id);
  };

  const columns: GridColumn<Product>[] = [
    { key: "sku", header: "SKU", value: (p) => p.sku, width: 110, pinned: "left", hideable: false, mobile: "meta", cell: (p) => <Highlight text={p.sku} query={q} className="font-mono text-[12px]" /> },
    {
      key: "name",
      header: "Produto",
      value: (p) => p.name,
      width: 300,
      mobile: "title",
      cell: (p) => (
        <span className="block min-w-0 leading-tight">
          <Highlight text={p.name} query={q} className="block truncate" />
          <span className="block truncate text-[11.5px] text-muted">
            NCM {p.ncm} · {supplierById(p.supplierId).name}
          </span>
        </span>
      ),
    },
    { key: "category", header: "Categoria", value: (p) => p.category, width: 120 },
    {
      key: "stock",
      header: "Estoque",
      tooltip: "Saldo nos dois CDs contra o estoque mínimo",
      value: (p) => qtyOf(p),
      width: 170,
      mobile: "subtitle",
      cell: (p) => {
        const l = levelOf(p);
        return (
          <span className="flex w-full flex-col gap-1">
            <span className="flex justify-between gap-2 text-[12px] tabular-nums">
              <span className={l === "ruptura" ? "font-medium text-rose" : l === "baixo" ? "font-medium text-amber" : undefined}>
                {formatNumber(qtyOf(p))} {p.unit}
              </span>
              <span className="text-muted">{p.min ? `mín. ${formatNumber(p.min)}` : "sem mínimo"}</span>
            </span>
            {p.min > 0 && <Meter value={Math.min(100, (qtyOf(p) / (p.min * 3)) * 100)} tone={l === "ruptura" ? "bad" : l === "baixo" ? "warn" : "ink"} label={`Saldo de ${p.name}`} />}
          </span>
        );
      },
    },
    { key: "cost", header: "Custo", value: (p) => p.cost, width: 110, align: "right", cell: (p) => <span className="tabular-nums text-ink-soft">{formatCurrency(p.cost)}</span> },
    { key: "price", header: "Preço", value: (p) => p.price, width: 110, align: "right", cell: (p) => <span className="font-medium tabular-nums">{formatCurrency(p.price)}</span> },
    {
      key: "margin",
      header: "Margem",
      tooltip: `Meta de margem bruta: ${formatPercent(TARGET_MARGIN, 0)}`,
      value: marginOf,
      width: 100,
      align: "right",
      cell: (p) => <span className={marginOf(p) < TARGET_MARGIN ? "font-medium tabular-nums text-amber" : "tabular-nums"}>{formatPercent(marginOf(p), 1)}</span>,
    },
    { key: "level", header: "Situação", value: (p) => levelInfo[levelOf(p)].label, width: 150, cell: (p) => <Badge tone={levelInfo[levelOf(p)].tone}>{levelInfo[levelOf(p)].label}</Badge> },
  ];

  const emptyAll =
    tab === "ativo" ? (
      <Empty icon={<PackagePlus />} title="Nenhum produto cadastrado" hint="Cadastre o primeiro SKU com custo, preço e estoque mínimo. Ele já entra no pedido de venda." action={<Button size="sm" variant="ghost" onClick={() => setFrameQuery({ novo: "1" })}><PackagePlus /> Cadastrar produto</Button>} framed={false} />
    ) : (
      <Empty icon={<Archive />} title="Nenhum produto inativo" hint="Produtos que saem de linha ficam aqui com o saldo restante, sem aparecer no pedido de venda." framed={false} />
    );

  return (
    <NexoShell section="produtos">
      <Page>
        <PageHeading
          crumbs={[{ label: "Cadastros" }]}
          title="Produtos"
          description={`Catálogo de revenda. Meta de margem bruta: ${formatPercent(TARGET_MARGIN, 0)} sobre o preço.`}
          actions={
            <Button onClick={() => setFrameQuery({ novo: "1" })}>
              <PackagePlus /> Novo produto
            </Button>
          }
        />
        <StatGrid cols={4}>
          <StatCell label="Produtos ativos" value={active.length} hint={`${categories.length} categorias`} />
          <StatCell label="Abaixo da meta de margem" value={lowMargin.length} tone={lowMargin.length ? "warn" : undefined} hint="revisar preço" />
          <StatCell label="Margem média" value={formatPercent(avgMargin, 1)} hint={`meta ${formatPercent(TARGET_MARGIN, 0)}`} />
          <StatCell label="Valor em estoque" value={formatCurrency(stockValue, { compact: true })} hint="a preço de custo" />
        </StatGrid>
        <Tabs
          className="mt-6"
          label="Situação do cadastro"
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          items={[
            { id: "ativo", label: "Ativos" },
            { id: "inativo", label: "Inativos" },
          ]}
        />
        <div className="mt-5">
          <DataGrid
            key={tab}
            label={tab === "ativo" ? "Produtos ativos" : "Produtos inativos"}
            rows={demo === "carregando" ? [] : filters.rows}
            columns={columns}
            rowKey={(p) => p.sku}
            rowLabel={(p) => `${p.sku} ${p.name}`}
            maxHeight="max(440px, calc(100dvh - 420px))"
            storageKey="erp-produtos"
            defaultSort={{ key: "name", dir: "asc" }}
            query={q}
            selectable
            noun="produto"
            exportFileName="produtos"
            loading={demo === "carregando"}
            error={demoError(demo, "os produtos")}
            toolbar={<FilterBar filters={filters} noun="produto" search={<TableSearch value={q} onChange={filters.setQuery} total={tabRows.length} noun="produto" searchIn="SKU, descrição, NCM e fornecedor" />} />}
            onRowOpen={(p) => go("erp-product", p.sku)}
            rowActions={(p) => [
              { label: "Pedir compra", icon: <ShoppingBag />, inline: levelOf(p) === "ruptura" || levelOf(p) === "baixo", disabled: productStatusOf(p) === "inativo", onSelect: () => requestPurchase(p) },
              productStatusOf(p) === "ativo"
                ? { label: "Inativar", icon: <Archive />, separator: true, onSelect: () => setStatus(new Set([p.sku]), "inativo") }
                : { label: "Reativar", icon: <ArchiveRestore />, onSelect: () => setStatus(new Set([p.sku]), "ativo") },
            ]}
            bulkActions={(rows, { clear }) =>
              tab === "ativo" ? (
                <button type="button" onClick={() => { setStatus(new Set(rows.map((p) => p.sku)), "inativo"); clear(); }}>
                  <Archive /> Inativar
                </button>
              ) : (
                <button type="button" onClick={() => { setStatus(new Set(rows.map((p) => p.sku)), "ativo"); clear(); }}>
                  <ArchiveRestore /> Reativar
                </button>
              )
            }
            empty={tabRows.length === 0 ? emptyAll : <EmptyFilterResult filters={filters} noun="produto" />}
            mobile="cards"
          />
        </div>
      </Page>
      <Drawer
        open={creating}
        onClose={closeDrawer}
        kicker={`Código sugerido: ${nextSku}`}
        title="Novo produto"
        width={540}
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>
              Cancelar
            </Button>
            <OperationButton operation={op} onClick={save}>
              Cadastrar produto
            </OperationButton>
          </>
        }
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <TextField className="sm:col-span-2" label="Descrição" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Ex.: Chapa aço carbono 4,75 mm 1200 × 3000" error={tried ? errors.name : undefined} hint="Sai assim na NF-e e no pedido." />
            <Select label="Categoria" value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })} options={[...categories, "Ferramentas"].filter((c, i, a) => a.indexOf(c) === i).map((c) => ({ value: c, label: c }))} />
            <Select label="Unidade" value={draft.unit} onValueChange={(v) => setDraft({ ...draft, unit: v })} options={units.map((u) => ({ value: u, label: u }))} />
            <TextField label="NCM" value={draft.ncm} onChange={(v) => setDraft({ ...draft, ncm: v })} placeholder="7208.39.00" inputMode="numeric" error={tried ? errors.ncm : undefined} />
            <TextField label="Código de barras (EAN)" value={draft.ean} onChange={(v) => setDraft({ ...draft, ean: v.replace(/\D/g, "").slice(0, 13) })} placeholder="7891234567895" inputMode="numeric" optional />
            <Combobox className="sm:col-span-2" label="Fornecedor principal" placeholder="Busque por nome ou CNPJ" error={tried ? errors.supplierId : undefined} value={draft.supplierId} onValueChange={(v) => setDraft({ ...draft, supplierId: v })} options={suppliers.map((s) => ({ value: s.id, label: s.name, description: `${s.category} · prazo ${s.leadTime} dias` }))} />
          </section>
          <section className="rounded-xl border border-line bg-soft/40 p-4">
            <h3 className="m-0 mb-3 text-[13px] font-medium">Preço e estoque</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField label="Custo de compra" value={draft.cost} onChange={(v) => setDraft({ ...draft, cost: v })} error={tried && !draft.cost ? "Informe o custo." : undefined} />
              <CurrencyField label="Preço de venda" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} error={tried || (draft.price && draft.cost) ? errors.price : undefined} />
              <NumberField label="Estoque mínimo" value={draft.min} onChange={(v) => setDraft({ ...draft, min: v })} min={0} suffix={draft.unit} hint="Abaixo dele, o item entra em Estoque crítico." />
              <div className="self-end rounded-lg border border-line bg-surface px-3 py-2.5">
                <div className="text-[12px] text-muted">Margem bruta</div>
                <div className={draftMargin != null && draftMargin < TARGET_MARGIN ? "text-[18px] font-semibold tabular-nums text-amber" : "text-[18px] font-semibold tabular-nums"}>{draftMargin == null ? "—" : formatPercent(draftMargin, 1)}</div>
                <div className="text-[11.5px] text-muted">{draftMargin == null ? "preencha custo e preço" : draftMargin < TARGET_MARGIN ? `abaixo da meta de ${formatPercent(TARGET_MARGIN, 0)}` : "dentro da meta"}</div>
              </div>
            </div>
          </section>
          <OperationFeedback operation={op} />
        </div>
      </Drawer>
    </NexoShell>
  );
}
