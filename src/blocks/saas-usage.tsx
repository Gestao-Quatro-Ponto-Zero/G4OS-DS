import { Download, Mail } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  ActionMenu,
  Badge,
  Button,
  DataTable,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FilterBar,
  Highlight,
  KpiCard,
  KpiGrid,
  Meter,
  Page,
  PageHeading,
  PageToolbar,
  Pagination,
  SortHeader,
  TableSearch,
  downloadCsv,
  formatCompact,
  formatCurrency,
  formatNumber,
  formatPercent,
  gridToCsv,
  notify,
  useFilters,
  usePagination,
  useSort,
  type Column,
  type FilterField,
  type GridColumn,
} from "@g4ai/ds";
import { customerById, customers, go, iso, planById, plans, resourceLabel, resources, usage, usageRatio, useFrameParam, type Customer, type Resource, type UsageRow } from "./data/saas";
import { ListError, ListSkeleton, SaasShell, useDemoState } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Uso e limites",
  description: "Consumo do ciclo por conta e recurso (usuários, painéis, eventos, API) contra o limite do plano; quem está perto ou acima do limite primeiro, com filtro por conta (?id=).",
  category: "SaaS",
  order: 10,
  height: 1080,
  concept: {
    goal: "Achar as contas que vão bater (ou já bateram) no limite do plano, para avisar antes do bloqueio e oferecer upgrade.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (faixa, recurso, plano, busca)",
      "Ordenada por % do limite: acima e perto primeiro",
      "Barra de uso + número + palavra; só acima/perto ganham cor",
      "Linha abre a conta; ?id= filtra uma conta vinda da página dela",
    ],
    adapt: ["Cotas de armazenamento, créditos de IA, franquia de minutos ou mensagens"],
    avoid: ["Mostrar só a porcentagem sem o limite", "Pintar de verde quem está dentro do limite"],
  },
} as const;

const here = "#/frame/saas-usage";
type Band = "acima" | "perto" | "dentro";
const bandOf = (u: UsageRow): Band => (usageRatio(u) >= 1 ? "acima" : usageRatio(u) >= 0.9 ? "perto" : "dentro");
const bandLabel: Record<Band, string> = { acima: "Acima do limite", perto: "Perto do limite", dentro: "Dentro do limite" };
type Row = UsageRow & { key: string; customer: Customer; band: Band };
const showValue = (r: Resource, n: number) => (r === "eventos" || r === "api" ? formatCompact(n) : formatNumber(n));

const rowsAll: Row[] = usage.filter((u) => u.limit).map((u) => ({ ...u, key: `${u.customerId}-${u.resource}`, customer: customerById(u.customerId), band: bandOf(u) }));

const fields: FilterField<Row>[] = [
  { key: "band", label: "Faixa", type: "enum", quick: true, accessor: (r) => r.band, options: (Object.keys(bandLabel) as Band[]).map((b) => ({ value: b, label: bandLabel[b] })) },
  { key: "resource", label: "Recurso", type: "enum", quick: true, accessor: (r) => r.resource, options: resources.map((r) => ({ value: r, label: resourceLabel[r] })) },
  { key: "plan", label: "Plano", type: "enum", accessor: (r) => r.customer.plan, options: plans.map((p) => ({ value: p, label: p })) },
  { key: "account", label: "Conta", type: "enum", accessor: (r) => r.customerId, options: customers.map((c) => ({ value: c.id, label: c.name })) },
];
const initial = { query: "", conditions: [{ id: "faixa", field: "band", op: "is" as const, value: ["acima", "perto"] }] };

const csvColumns: GridColumn<Row>[] = [
  { key: "conta", header: "Conta", value: (r) => r.customer.name },
  { key: "plano", header: "Plano", value: (r) => r.customer.plan },
  { key: "recurso", header: "Recurso", value: (r) => resourceLabel[r.resource] },
  { key: "uso", header: "Uso", value: (r) => r.used },
  { key: "limite", header: "Limite", value: (r) => r.limit ?? "" },
  { key: "pct", header: "% do limite", value: (r) => Math.round(usageRatio(r) * 100) },
];

export default function SaasUsage() {
  const estado = useDemoState();
  const id = useFrameParam("id");
  const data = estado === "vazio" ? [] : rowsAll;
  const filters = useFilters(data, { fields, search: (r) => [r.customer.name, resourceLabel[r.resource]], initial });
  const { setState } = filters;
  useEffect(() => {
    if (id) setState({ query: "", conditions: [{ id: "conta", field: "account", op: "is", value: [id] }] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const q = filters.state.query;
  const sort = useSort(filters.rows, { pct: (r) => usageRatio(r), conta: (r) => r.customer.name }, { key: "pct", dir: "desc" });
  const pages = usePagination(sort.rows, 10, { resetKey: [filters.state, sort.sort] });

  const over = useMemo(() => new Set(rowsAll.filter((r) => r.band === "acima").map((r) => r.customerId)), []);
  const near = useMemo(() => new Set(rowsAll.filter((r) => r.band === "perto").map((r) => r.customerId)), []);
  // Upgrade potencial: contas acima/perto de usuários que não estão no Enterprise, ao preço do plano seguinte.
  const upgrade = useMemo(
    () =>
      [...new Set([...over, ...near])]
        .map(customerById)
        .filter((c) => c.plan !== "Enterprise")
        .reduce((s, c) => s + c.seats * (planById(plans[plans.indexOf(c.plan) + 1]).monthly - planById(c.plan).monthly), 0),
    [over, near],
  );

  const columns: Column<Row>[] = [
    {
      key: "account",
      header: <SortHeader label="Conta" {...sort.header("conta")} />,
      primary: true,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={r.customer.name} tint={r.customer.tint} className="h-7 w-7 text-[11px]" />
          <span className="min-w-0">
            <Highlight text={r.customer.name} query={q} className="block truncate" />
            <span className="block truncate text-[12px] font-normal text-muted">Plano {r.customer.plan}</span>
          </span>
        </span>
      ),
    },
    { key: "resource", header: "Recurso", nowrap: true, cell: (r) => resourceLabel[r.resource] },
    {
      key: "usage",
      header: <SortHeader label="Uso do limite" {...sort.header("pct")} />,
      cell: (r) => (
        <span className="block min-w-[150px]">
          <span className="flex justify-between gap-2 text-[12px] tabular-nums">
            <span>
              {showValue(r.resource, r.used)} <span className="text-muted">de {showValue(r.resource, r.limit ?? 0)}</span>
            </span>
            <span className={r.band === "dentro" ? "text-muted" : "font-medium"}>{formatPercent(usageRatio(r), 0)}</span>
          </span>
          <span className="mt-1.5 block">
            <Meter value={usageRatio(r) * 100} thick tone={r.band === "acima" ? "bad" : r.band === "perto" ? "warn" : "ink"} label={`${resourceLabel[r.resource]}: ${formatPercent(usageRatio(r), 0)} do limite`} />
          </span>
        </span>
      ),
    },
    { key: "band", header: "Situação", mobileHidden: true, cell: (r) => (r.band === "dentro" ? <Badge>{bandLabel[r.band]}</Badge> : <Badge tone={r.band === "acima" ? "bad" : "warn"}>{bandLabel[r.band]}</Badge>) },
    {
      key: "actions",
      header: "",
      action: true,
      cell: (r) => (
        <ActionMenu
          actions={[
            { label: "Abrir conta", onSelect: () => go("saas-customer", r.customerId) },
            { label: "Avisar o administrador", icon: <Mail className="h-4 w-4" />, onSelect: () => notify(`Aviso de limite enviado para ${r.customer.contact} (${r.customer.name})`) },
          ]}
        />
      ),
    },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Uso e limites"
          description="Consumo do ciclo atual (setembro) contra o limite de cada plano. Ao passar de 100 %, a conta tem 7 dias antes do bloqueio."
          actions={
            <Button
              variant="ghost"
              disabled={!filters.shown}
              disabledReason="Nenhuma linha no recorte atual"
              onClick={() => {
                downloadCsv(`uso-e-limites-${iso(0)}`, gridToCsv(sort.rows, csvColumns));
                notify(`${formatNumber(sort.rows.length)} linhas de uso exportadas em CSV`);
              }}
            >
              <Download /> Exportar CSV
            </Button>
          }
        />
        <div className="space-y-4">
          {!estado && (
            <KpiGrid className="mb-2">
              <KpiCard label="Contas acima do limite" value={formatNumber(over.size)} hint="bloqueio em até 7 dias" />
              <KpiCard label="Perto do limite" value={formatNumber(near.size)} hint="acima de 90 % em algum recurso" />
              <KpiCard label="Upgrade potencial" value={formatCurrency(upgrade, { cents: false })} hint="MRR se todas subirem um plano" />
            </KpiGrid>
          )}
          <PageToolbar>
            <FilterBar filters={filters} noun="linha" search={<TableSearch value={q} onChange={filters.setQuery} total={filters.total} noun="linha" searchIn="conta e recurso" />} />
          </PageToolbar>
          {estado === "carregando" ? (
            <ListSkeleton label="Carregando uso das contas" />
          ) : estado === "erro" ? (
            <ListError noun="o uso das contas" />
          ) : !filters.total ? (
            <Empty title="Nenhum consumo medido neste ciclo" hint="O uso aparece quando as contas começam a enviar eventos. Confira se o SDK está instalado nos apps dos clientes." action={<Button variant="ghost" href="#/frame/saas-integrations">Ver integrações</Button>} />
          ) : (
            <>
              <DataTable rows={pages.rows} columns={columns} rowKey={(r) => r.key} onRowClick={(r) => go("saas-customer", r.customerId)} rowLabel={(r) => `Abrir ${r.customer.name}`} empty={<EmptyFilterResult filters={filters} noun="linha" gender="f" />} />
              <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
            </>
          )}
        </div>
      </Page>
    </SaasShell>
  );
}
