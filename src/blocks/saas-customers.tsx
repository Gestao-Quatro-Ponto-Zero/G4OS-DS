import { Archive, Download, Mail, Plus, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionMenu,
  Badge,
  BulkBar,
  Button,
  DataTable,
  Empty,
  EmptyFilterResult,
  EntityMark,
  FieldBlock,
  FieldGrid,
  FilterBar,
  Highlight,
  Modal,
  NumberField,
  Page,
  PageHeading,
  Pagination,
  SavedViews,
  Select,
  SortHeader,
  Sparkline,
  TableSearch,
  TextField,
  downloadCsv,
  formatCurrency,
  formatNumber,
  gridToCsv,
  notify,
  selectionColumn,
  useFilters,
  usePagination,
  useSavedViews,
  useSelection,
  useSort,
  type Column,
  type FilterField,
  type GridColumn,
  type SavedView,
  PageToolbar,
  Popover,
} from "@g4ai/ds";
import { customers as baseCustomers, go, healthLabel, healthTone, iso, personById, planPrice, plans, segments, team, useFrameParam, type Customer, type Health, type Plan } from "./data/saas";
import { ListError, ListSkeleton, SaasShell, useDemoState } from "./shells/saas-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Lista de clientes",
  description: "Tabela com visões salvas, busca local (/), filtros por campo (plano, saúde, MRR, uso…), estado na URL, seleção em massa, paginação e drawer.",
  category: "SaaS",
  order: 3,
  height: 900,
  concept: {
    goal: "Achar e agir sobre contas em escala: quem está em risco, quem pode expandir.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões, filtros, busca)",
      "Visões salvas por pergunta de negócio ('Em risco', 'Potencial de expansão')",
      "Estado na URL; seleção em massa com BulkBar; paginação",
      "Linha abre a conta",
    ],
    adapt: [
      "Empresas (CRM), clientes (ERP), candidatos (ATS)",
    ],
    avoid: [
      "Filtros fora da PageToolbar (somem ao rolar)",
    ],
  },
} as const;

const healthBadge = (h: Health) => <Badge tone={healthTone[h]}>{healthLabel[h]}</Badge>;
const owners = team.filter((p) => p.role === "Customer Success");

const fields: FilterField<Customer>[] = [
  { key: "plan", label: "Plano", type: "enum", quick: true, accessor: (c) => c.plan, options: plans.map((p) => ({ value: p, label: p })) },
  { key: "health", label: "Saúde", type: "enum", quick: true, accessor: (c) => c.health, options: (Object.keys(healthLabel) as Health[]).map((h) => ({ value: h, label: healthLabel[h] })) },
  { key: "segment", label: "Segmento", type: "enum", accessor: (c) => c.segment, options: segments.map((s) => ({ value: s, label: s })) },
  { key: "owner", label: "Responsável", type: "person", accessor: (c) => c.owner, options: owners.map((o) => ({ value: o.id, label: o.name })) },
  { key: "mrr", label: "MRR", type: "currency", accessor: (c) => c.mrr },
  { key: "seats", label: "Usuários", type: "number", accessor: (c) => c.seats },
  { key: "usage", label: "Uso (30 dias)", type: "number", unit: "%", accessor: (c) => c.usage },
  { key: "city", label: "Cidade", type: "text", accessor: (c) => c.city },
];
const views: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "risco", label: "Em risco", system: true, state: { query: "", conditions: [{ id: "r", field: "health", op: "is", value: ["risco"] }] } },
  { id: "enterprise", label: "Enterprise", system: true, state: { query: "", conditions: [{ id: "e", field: "plan", op: "is", value: ["Enterprise"] }] } },
  { id: "expansao", label: "Potencial de expansão", system: true, state: { query: "", conditions: [{ id: "u", field: "usage", op: "gt", value: 80 }, { id: "p", field: "plan", op: "is_not", value: ["Enterprise"] }] } },
];

/** Colunas do CSV exportado (separador ";", decimal ","). */
const csvColumns: GridColumn<Customer>[] = [
  { key: "name", header: "Cliente", value: (c) => c.name },
  { key: "cnpj", header: "CNPJ", value: (c) => c.cnpj },
  { key: "plan", header: "Plano", value: (c) => c.plan },
  { key: "seats", header: "Usuários", value: (c) => c.seats },
  { key: "mrr", header: "MRR (R$)", value: (c) => c.mrr },
  { key: "usage", header: "Uso 30 dias (%)", value: (c) => c.usage },
  { key: "health", header: "Saúde", value: (c) => healthLabel[c.health] },
  { key: "owner", header: "Responsável", value: (c) => personById(c.owner).name },
];
const exportCsv = (rows: Customer[]) => {
  downloadCsv(`clientes-pulso-${iso(0)}`, gridToCsv(rows, csvColumns));
  notify(`${formatNumber(rows.length)} ${rows.length === 1 ? "cliente exportado" : "clientes exportados"} em CSV`);
};

/* ------------------------------------------------------------------ */

const here = "#/frame/saas-customers";

/** Etiquetas de exemplo: livres, criadas pela equipe (não confundir com plano ou saúde). */
const seedLabels = ["Renovação 2027", "Expansão", "Case de sucesso", "Onboarding assistido"];
const seedTags: Record<string, string[]> = { "1": ["Case de sucesso"], "4": ["Renovação 2027"], "9": ["Expansão"], "12": ["Onboarding assistido"] };

export default function SaasCustomers() {
  const [customers, setCustomers] = useState(baseCustomers);
  const [labels, setLabels] = useState(seedLabels);
  const [tags, setTags] = useState(seedTags);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const novo = useFrameParam("novo");
  const estado = useDemoState();
  const visible = estado === "vazio" ? [] : customers;
  useEffect(() => {
    if (novo) setCreating(true);
  }, [novo]);
  const filters = useFilters(visible, { fields, search: (c) => [c.name, c.city, personById(c.owner).name, c.segment, c.contact, c.cnpj], url: true });
  // Busca vinda do ⌘K ("Ver todos"): #/frame/saas-customers?q=aurora
  const hashQuery = useFrameParam("q");
  // Visão vinda de outro lugar (KPI de churn → #/frame/saas-customers?visao=risco).
  const hashView = useFrameParam("visao");
  const hashPlan = useFrameParam("plano");
  const { setQuery, setState } = filters;
  useEffect(() => {
    if (hashQuery) setQuery(hashQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashQuery]);
  useEffect(() => {
    const v = views.find((x) => x.id === hashView);
    if (v) setState(v.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashView]);
  useEffect(() => {
    if (hashPlan && plans.includes(hashPlan as Plan)) setState({ query: "", conditions: [{ id: "plano", field: "plan", op: "is", value: [hashPlan] }] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashPlan]);
  const saved = useSavedViews(filters, views, "saas-clientes-visoes");
  const q = filters.state.query;
  const sort = useSort(filters.rows, { nome: (c) => c.name, mrr: (c) => c.mrr, uso: (c) => c.usage, usuarios: (c) => c.seats }, { key: "mrr", dir: "desc" });
  const pages = usePagination(sort.rows, 10, { resetKey: [filters.state, sort.sort] });
  const sel = useSelection(pages.rows.map((c) => c.id));

  /** Aplica a etiqueta às selecionadas (cria se for nova) e oferece Desfazer. */
  const applyLabel = (raw: string) => {
    const label = raw.trim();
    if (!label) return;
    const ids = customers.filter((c) => sel.has(c.id)).map((c) => c.id);
    const before = { tags, labels };
    const existing = labels.find((l) => l.toLowerCase() === label.toLowerCase());
    const name = existing ?? label;
    if (!existing) setLabels((all) => [...all, name]);
    setTags((all) => ({ ...all, ...Object.fromEntries(ids.map((id) => [id, all[id]?.includes(name) ? all[id] : [...(all[id] ?? []), name]])) }));
    setNewLabel("");
    sel.clear();
    notify(`Etiqueta “${name}” aplicada a ${ids.length === 1 ? "1 cliente" : `${formatNumber(ids.length)} clientes`}`, () => {
      setTags(before.tags);
      setLabels(before.labels);
    });
  };

  const columns: Column<Customer>[] = [
    selectionColumn<Customer>(sel, (c) => c.id, (c) => c.name),
    {
      key: "name",
      header: <SortHeader label="Cliente" {...sort.header("nome")} />,
      primary: true,
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 text-[11px]" />
          <span className="min-w-0">
            <Highlight text={c.name} query={q} className="block truncate" />
            <Highlight text={`${c.segment} · ${c.city}`} query={q} className="block truncate text-[12px] font-normal text-muted" />
            {!!tags[c.id]?.length && (
              <span className="mt-1 flex flex-wrap gap-1">
                {tags[c.id].map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </span>
            )}
          </span>
        </span>
      ),
    },
    { key: "plan", header: "Plano", cell: (c) => c.plan },
    { key: "seats", header: <SortHeader label="Usuários" align="right" {...sort.header("usuarios")} />, align: "right", nowrap: true, cell: (c) => formatNumber(c.seats) },
    { key: "mrr", header: <SortHeader label="MRR" align="right" {...sort.header("mrr")} />, align: "right", nowrap: true, cell: (c) => <span className="font-medium tabular-nums">{formatCurrency(c.mrr, { cents: false })}</span> },
    {
      key: "usage",
      header: <SortHeader label="Uso (30 dias)" {...sort.header("uso")} />,
      nowrap: true,
      cell: (c) => (
        <span className="flex items-center gap-2">
          <Sparkline values={c.trend} tone={c.health === "risco" ? "bad" : "neutral"} width={64} height={22} area={false} />
          <span className="w-9 text-right text-[12px] tabular-nums text-muted">{c.usage}%</span>
        </span>
      ),
    },
    { key: "health", header: "Saúde", cell: (c) => healthBadge(c.health) },
    {
      key: "actions",
      header: "",
      action: true,
      cell: (c) => (
        <ActionMenu
          actions={[
            { label: "Abrir conta", onSelect: () => go("saas-customer", c.id) },
            { label: "Enviar e-mail", icon: <Mail className="h-4 w-4" />, onSelect: () => notify(`E-mail enviado para ${c.contact} (${c.name})`) },
            {
              label: "Arquivar",
              icon: <Archive className="h-4 w-4" />,
              tone: "danger",
              separator: true,
              onSelect: () => {
                setCustomers((all) => all.filter((x) => x.id !== c.id));
                notify(`${c.name} arquivada`, () => setCustomers((all) => [c, ...all]));
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <SaasShell current={here}>
      <Page>
        <PageHeading
          title="Clientes"
          description="Contas pagantes e em trial. Saúde calculada pelo uso dos últimos 30 dias."
          actions={
            <>
              <Button variant="ghost" disabled={!filters.shown} disabledReason="Nenhum cliente no recorte atual" onClick={() => exportCsv(sort.rows)}>
                <Download /> Exportar CSV
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus /> Novo cliente
              </Button>
            </>
          }
        />
        <div className="mt-4 space-y-4">
          <PageToolbar>
            <SavedViews views={saved} counts={Object.fromEntries(views.map((v) => [v.id, filters.countFor(v.state)]))} />
            <FilterBar
              filters={filters}
              noun="cliente"
              search={<TableSearch value={q} onChange={filters.setQuery} total={customers.length} noun="cliente" searchIn="nome, cidade, segmento e responsável" />}
            />
          </PageToolbar>
          {estado === "carregando" ? (
            <ListSkeleton label="Carregando clientes" />
          ) : estado === "erro" ? (
            <ListError noun="os clientes" />
          ) : !visible.length ? (
            <Empty
              title="Nenhum cliente ainda"
              hint="Crie a primeira conta ou importe a base do seu CRM. Novas contas começam em trial de 14 dias."
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus /> Novo cliente
                </Button>
              }
            />
          ) : (
            <>
              <DataTable rows={pages.rows} columns={columns} rowKey={(c) => c.id} onRowClick={(c) => go("saas-customer", c.id)} rowLabel={(c) => `Abrir ${c.name}`} empty={<EmptyFilterResult filters={filters} noun="cliente" />} />
              <Pagination page={pages.page} pageCount={pages.pageCount} onPage={pages.setPage} total={pages.total} pageSize={pages.pageSize} />
            </>
          )}
          <BulkBar count={sel.count} noun="cliente" onClear={sel.clear}>
            <button type="button" onClick={() => notify(`E-mail enviado para ${sel.count} clientes`)}>
              <Mail /> Enviar e-mail
            </button>
            <Popover
              trigger={
                <>
                  <Tag /> Etiquetar
                </>
              }
              triggerLabel="Etiquetar clientes selecionados"
              triggerClassName="text-on-ink hover:bg-on-ink/10 data-popup-open:bg-on-ink/10"
              title={`Etiquetar ${sel.count === 1 ? "1 cliente" : `${formatNumber(sel.count)} clientes`}`}
              side="top"
              width={280}
            >
              <ul className="m-0 -mx-2 list-none p-0">
                {labels.map((l) => {
                  const all = customers.filter((c) => sel.has(c.id)).every((c) => tags[c.id]?.includes(l));
                  return (
                    <li key={l}>
                      <button type="button" disabled={all} onClick={() => applyLabel(l)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-soft disabled:cursor-default disabled:text-muted disabled:hover:bg-transparent">
                        <Tag className="h-3.5 w-3.5 text-muted" aria-hidden />
                        <span className="flex-1">{l}</span>
                        {all && <span className="text-[11px] text-muted">já aplicada</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <form
                className="mt-3 border-t border-line pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyLabel(newLabel);
                }}
              >
                <TextField label="Nova etiqueta" value={newLabel} onChange={setNewLabel} placeholder="Ex.: Renovação 2027" />
                <Button type="submit" size="sm" className="mt-2 w-full" disabled={!newLabel.trim()} disabledReason="Digite o nome da etiqueta.">
                  <Plus /> Criar e aplicar
                </Button>
              </form>
            </Popover>
            <button type="button" onClick={() => (exportCsv(customers.filter((c) => sel.has(c.id))), sel.clear())}>
              <Download /> Exportar
            </button>
          </BulkBar>
        </div>
      </Page>

      <NewCustomerModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(c) => {
          setCustomers((all) => [c, ...all]);
          notify(`${c.name} criada em trial de 14 dias`, () => setCustomers((all) => all.filter((x) => x.id !== c.id)));
        }}
      />
    </SaasShell>
  );
}

function NewCustomerModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (c: Customer) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("Pro");
  const [seats, setSeats] = useState<number | null>(10);
  const [segment, setSegment] = useState(segments[0]);
  const [tried, setTried] = useState(false);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const submit = () => {
    setTried(true);
    if (!name.trim() || !emailOk || !seats) return;
    onCreate({
      id: String(Date.now()),
      name: name.trim(),
      segment,
      plan,
      seats,
      mrr: seats * planPrice[plan],
      usage: 0,
      health: "atencao",
      owner: owners[0].id,
      city: "—",
      trend: [0, 0, 0, 0, 0, 0, 0, 0],
      since: iso(0),
      tint: "#184560",
      status: "trial",
      nps: 0,
      contact: email.split("@")[0],
      email,
      cnpj: "—",
    });
    setName("");
    setEmail("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo cliente"
      description="Começa em trial de 14 dias. O convite vai para o e-mail do administrador."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar e enviar convite</Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField label="Nome da empresa" value={name} onChange={setName} error={tried && !name.trim() ? "Informe o nome." : undefined} autoFocus />
        <TextField label="E-mail do administrador" type="email" value={email} onChange={setEmail} placeholder="nome@empresa.com.br" error={tried && !emailOk ? "Use um e-mail válido, como nome@empresa.com.br." : undefined} />
        <FieldGrid>
          <FieldBlock label="Plano">
            <Select label="Plano" value={plan} onValueChange={(v) => setPlan(v as Plan)} options={plans.map((p) => ({ value: p, label: p, description: `${formatCurrency(planPrice[p], { cents: false })} por usuário/mês` }))} />
          </FieldBlock>
          <NumberField label="Usuários" value={seats} onChange={setSeats} min={1} max={2000} />
        </FieldGrid>
        <FieldBlock label="Segmento">
          <Select label="Segmento" value={segment} onValueChange={setSegment} options={segments.map((s) => ({ value: s, label: s }))} />
        </FieldBlock>
        {seats ? <p className="m-0 text-[12.5px] text-muted">MRR previsto após o trial: <span className="font-medium text-ink">{formatCurrency(seats * planPrice[plan])}</span></p> : null}
      </div>
    </Modal>
  );
}
