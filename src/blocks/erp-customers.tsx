import { Lock, Mail, Phone, ShoppingCart, Unlock, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Drawer,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  ListRow,
  Meter,
  Page,
  PageHeading,
  PropertyList,
  SortHeader,
  TableSearch,
  formatCurrency,
  notify,
  useFilters,
  useSort,
  type Column,
  type FilterField, PageToolbar
} from "@g4os/ds";
import { br, customers as seed, orderStatus, orderTotal, ordersOf, sellers, today, user, type Customer } from "./data/erp";
import { lateDays, receivables } from "./data/fin";
import { go, useFrameParam } from "./shells/frame-route";
import { NexoShell } from "./shells/nexo-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Clientes",
  description: "Carteira de clientes B2B: CNPJ, segmento, vendedor, uso do limite de crédito e títulos vencidos. Detalhe em gaveta com pedidos recentes, bloqueio de crédito e novo pedido.",
  category: "ERP",
  order: 4,
  height: 900,
  concept: {
    goal: "Ver a carteira de clientes B2B com risco de crédito e agir sem perder a lista.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Uso do limite de crédito e títulos vencidos na linha",
      "Detalhe em gaveta com bloqueio de crédito e novo pedido",
    ],
    adapt: [
      "Contas (CRM), clientes (SaaS)",
    ],
    avoid: [
      "Abrir página nova só para ver o limite de crédito",
    ],
  },
} as const;

const openOf = (c: Customer) => receivables.filter((r) => r.customerId === c.id);
const exposure = (c: Customer) => openOf(c).reduce((s, r) => s + r.value, 0) + ordersOf(c.id).filter((o) => o.status === "aprovado" || o.status === "faturado").reduce((s, o) => s + orderTotal(o), 0);
const overdue = (c: Customer) => openOf(c).filter((r) => lateDays(r) > 0).reduce((s, r) => s + r.value, 0);

const fields: FilterField<Customer>[] = [
  { key: "segment", label: "Segmento", type: "enum", quick: true, accessor: (c) => c.segment, options: [...new Set(seed.map((c) => c.segment))].map((s) => ({ value: s, label: s })) },
  { key: "seller", label: "Vendedor", type: "person", quick: true, accessor: (c) => c.seller, options: sellers.map((s) => ({ value: s.id, label: s.name })) },
  { key: "status", label: "Crédito", type: "enum", accessor: (c) => c.status, options: [{ value: "ativo", label: "Liberado" }, { value: "bloqueado", label: "Bloqueado" }] },
  { key: "uf", label: "UF", type: "enum", accessor: (c) => c.uf, options: [...new Set(seed.map((c) => c.uf))].sort().map((u) => ({ value: u, label: u })) },
  { key: "overdue", label: "Vencido", type: "currency", accessor: overdue },
  { key: "since", label: "Cliente desde", type: "date", accessor: (c) => c.since },
];

export default function ErpCustomers() {
  const id = useFrameParam("id");
  const [list, setList] = useState(seed);
  const [open, setOpen] = useState<string | null>(id);
  const filters = useFilters(list, { fields, search: (c) => [c.name, c.cnpj, c.cnpj.replace(/\D/g, ""), c.city, c.contact], now: today, url: "k_" });
  const sort = useSort(filters.rows, { nome: (c) => c.name, exposicao: exposure, vencido: overdue }, { key: "exposicao", dir: "desc" });
  const q = filters.state.query;
  const c = open ? list.find((x) => x.id === open) : undefined;
  const toggleCredit = (k: Customer) => {
    const next = k.status === "ativo" ? "bloqueado" : "ativo";
    setList((all) => all.map((x) => (x.id === k.id ? { ...x, status: next } : x)));
    notify(next === "bloqueado" ? `Crédito de ${k.name} bloqueado: novos pedidos ficam como orçamento` : `Crédito de ${k.name} liberado`, () => setList((all) => all.map((x) => (x.id === k.id ? { ...x, status: k.status } : x))));
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: <SortHeader label="Cliente" {...sort.header("nome")} />,
      primary: true,
      cell: (k) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={k.name} tint={k.tint} className="h-8 w-8 text-[12px]" />
          <span className="min-w-0">
            <Highlight text={k.name} query={q} className="block truncate" />
            <Highlight text={k.cnpj} query={q} className="block text-[12px] font-normal tabular-nums text-muted" />
          </span>
        </span>
      ),
    },
    { key: "segment", header: "Segmento", mobileHidden: true, cell: (k) => k.segment },
    { key: "city", header: "Cidade", mobileHidden: true, nowrap: true, cell: (k) => <span className="text-ink-soft">{k.city}/{k.uf}</span> },
    { key: "seller", header: "Vendedor", mobileHidden: true, cell: (k) => user(k.seller).name.split(" ")[0] },
    {
      key: "credit",
      header: <SortHeader label="Uso do limite" {...sort.header("exposicao")} />,
      cell: (k) => {
        const pct = (exposure(k) / k.creditLimit) * 100;
        return (
          <span className="block w-36">
            <span className="flex justify-between text-[12px] tabular-nums">
              <span>{formatCurrency(exposure(k), { compact: true })}</span>
              <span className="text-muted">de {formatCurrency(k.creditLimit, { compact: true })}</span>
            </span>
            <span className="mt-1 block">
              <Meter value={pct} thick tone={pct > 90 ? "bad" : pct > 70 ? "warn" : "ink"} label={`Uso do limite de ${k.name}`} />
            </span>
          </span>
        );
      },
    },
    { key: "overdue", header: <SortHeader label="Vencido" align="right" {...sort.header("vencido")} />, align: "right", nowrap: true, cell: (k) => (overdue(k) ? <span className="font-medium tabular-nums text-rose">{formatCurrency(overdue(k))}</span> : <span className="text-muted">—</span>) },
    { key: "status", header: "Crédito", cell: (k) => <Badge tone={k.status === "ativo" ? "ok" : "bad"}>{k.status === "ativo" ? "Liberado" : "Bloqueado"}</Badge> },
  ];

  return (
    <NexoShell section="clientes">
      <Page>
        <PageHeading
          title="Clientes"
          description="Carteira B2B. O uso do limite soma títulos em aberto e pedidos aprovados ainda não pagos."
          actions={
            <Button onClick={() => notify("Cadastro de cliente: consulte o CNPJ na Receita para preencher os dados", undefined, "info")}>
              <UserPlus /> Novo cliente
            </Button>
          }
        />
        <div className="mt-6 space-y-4">
          <PageToolbar>
            <FilterBar filters={filters} noun="cliente" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="cliente" searchIn="nome, CNPJ, cidade e contato" />} />
          </PageToolbar>
          <DataTable rows={sort.rows} columns={columns} rowKey={(k) => k.id} onRowClick={(k) => setOpen(k.id)} rowLabel={(k) => `Abrir ${k.name}`} empty={<EmptyFilterResult filters={filters} noun="cliente" />} />
        </div>
      </Page>
      <Drawer
        open={!!c}
        onClose={() => setOpen(null)}
        kicker={c ? `${c.segment} · cliente desde ${br(c.since).slice(3)}` : undefined}
        title={c?.name ?? ""}
        width={520}
        footer={
          c && (
            <>
              <Button variant="ghost" onClick={() => toggleCredit(c)}>
                {c.status === "ativo" ? <Lock /> : <Unlock />} {c.status === "ativo" ? "Bloquear crédito" : "Liberar crédito"}
              </Button>
              <Button onClick={() => go("erp-order", "novo")}>
                <ShoppingCart /> Novo pedido
              </Button>
            </>
          )
        }
      >
        {c && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" href={`mailto:${c.email}`}>
                <Mail /> E-mail
              </Button>
              <Button size="sm" variant="ghost" href={`tel:${c.phone.replace(/\D/g, "")}`}>
                <Phone /> Ligar
              </Button>
            </div>
            <PropertyList
              items={[
                { label: "CNPJ", value: <span className="tabular-nums">{c.cnpj}</span> },
                { label: "Cidade", value: `${c.city}/${c.uf}` },
                { label: "Contato", value: c.contact, hint: c.email },
                { label: "Vendedor", value: user(c.seller).name },
                { label: "Limite de crédito", value: formatCurrency(c.creditLimit, { cents: false }), hint: `${formatCurrency(exposure(c), { cents: false })} em uso` },
                { label: "Títulos vencidos", value: overdue(c) ? <span className="font-medium text-rose">{formatCurrency(overdue(c))}</span> : undefined },
              ]}
            />
            <section>
              <h3 className="m-0 mb-2 text-[13px] font-medium">Pedidos recentes</h3>
              <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                {ordersOf(c.id)
                  .slice(0, 5)
                  .map((o) => (
                    <li key={o.id}>
                      <ListRow onClick={() => go("erp-order", o.id)} kicker={br(o.date)} title={<span className="font-mono text-[12.5px]">{o.number}</span>} meta={<span className="inline-flex items-center gap-2"><Badge tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</Badge>{formatCurrency(orderTotal(o), { compact: true })}</span>} />
                    </li>
                  ))}
              </ul>
            </section>
            {openOf(c).length > 0 && (
              <section>
                <h3 className="m-0 mb-2 text-[13px] font-medium">Títulos em aberto</h3>
                <ul className="list-none divide-y divide-line overflow-hidden rounded-xl border border-line p-0">
                  {openOf(c).map((r) => (
                    <li key={r.id}>
                      <ListRow onClick={() => go("fin-receivables")} kicker={`${r.doc} · parcela ${r.installment}`} title={formatCurrency(r.value)} meta={lateDays(r) ? <span className="text-rose">{lateDays(r)} dias de atraso</span> : `vence ${br(r.due)}`} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Drawer>
    </NexoShell>
  );
}
