import { Archive, Briefcase, Mail, Phone, Plus, Upload, UserRoundPen } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AvatarGroup,
  Avatar,
  Badge,
  Button,
  DataGrid,
  EmptyFilterResult,
  EntityMark,
  FieldBlock,
  FieldGrid,
  FilterBar,
  Highlight,
  Modal,
  Page,
  PageHeading,
  SavedViews,
  Select,
  TableSearch,
  Tabs,
  TextField,
  formatCurrency,
  matchesQuery,
  downloadCsv,
  gridToCsv,
  notify,
  useFilters,
  useSavedViews,
  type FilterField,
  type GridColumn,
  type SavedView,
} from "@g4os/ds";
import { companies as baseCompanies, companyById, contacts, deals, go, iso, me, repById, reps, today, type Company, type Lifecycle } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Empresas e contatos",
  description: "Base de contas em DataGrid: rolagem interna com cabeçalho e total fixos, empresa fixa à esquerda, seleção em massa, ações rápidas (ligar, e-mail, ⋯, clique direito), estágio e responsável editáveis na célula, colunas configuráveis e CSV.",
  category: "CRM",
  order: 3,
  height: 900,
  concept: {
    goal: "Trabalhar a base de contas em escala: filtrar, editar na célula e agir em massa sem abrir cada registro.",
    patterns: [
      "Anatomia A · Lista com DataGrid: rolagem interna, cabeçalho e total fixos, empresa fixa à esquerda",
      "Estágio e responsável editáveis na célula com desfazer",
      "Ações rápidas na linha (ligar, e-mail, ⋯ e clique direito)",
      "Seleção em massa; colunas configuráveis; CSV; cards no celular",
    ],
    adapt: [
      "Clientes (ERP), candidatos (ATS), contas (SaaS)",
    ],
    avoid: [
      "Rolagem interna no celular (a grade já passa a rolar com a página)",
    ],
  },
} as const;

type Row = Company & { openDeals: number; pipeline: number; lastTouchDate: string };
const stagesOfLife: Lifecycle[] = ["Lead", "Oportunidade", "Cliente", "Ex-cliente"];
const lifecycleTone = { Lead: "neutral", Oportunidade: "info", Cliente: "ok", "Ex-cliente": "warn" } as const;
const industries = [...new Set(baseCompanies.map((c) => c.industry))].sort();

const toRow = (c: Company): Row => {
  const open = deals.filter((d) => d.companyId === c.id);
  return { ...c, openDeals: open.length, pipeline: open.reduce((s, d) => s + d.value, 0), lastTouchDate: iso(-c.lastTouch) };
};

/* Campos filtráveis: a mesma lista alimenta atalhos, "+ Filtro", chips e o painel do celular. */
const fields: FilterField<Row>[] = [
  { key: "lifecycle", label: "Estágio", type: "enum", quick: true, accessor: (c) => c.lifecycle, options: stagesOfLife.map((s) => ({ value: s, label: s })) },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (c) => c.owner, options: reps.map((r) => ({ value: r.id, label: r.name })) },
  { key: "industry", label: "Setor", type: "enum", accessor: (c) => c.industry, options: industries.map((s) => ({ value: s, label: s })) },
  { key: "pipeline", label: "Em aberto", type: "currency", accessor: (c) => c.pipeline },
  { key: "openDeals", label: "Negócios abertos", type: "number", accessor: (c) => c.openDeals },
  { key: "lastTouch", label: "Dias sem contato", type: "number", unit: "dias", accessor: (c) => c.lastTouch },
  { key: "lastTouchDate", label: "Último contato", type: "date", accessor: (c) => c.lastTouchDate },
  { key: "city", label: "Cidade", type: "text", accessor: (c) => c.city },
];
const searchText = (c: Row) => [c.name, c.domain, c.city, c.cnpj, ...contacts.filter((p) => p.companyId === c.id).map((p) => p.name)];

/* Visões do sistema. As da pessoa ficam salvas no navegador (useSavedViews). */
const systemViews: SavedView[] = [
  { id: "todas", label: "Todas", system: true, state: { query: "", conditions: [] } },
  { id: "minhas", label: "Minhas", system: true, state: { query: "", conditions: [{ id: "v1", field: "owner", op: "is", value: [me] }] } },
  { id: "esfriando", label: "Esfriando", system: true, state: { query: "", conditions: [{ id: "v2", field: "lastTouch", op: "gt", value: 20 }, { id: "v3", field: "openDeals", op: "gt", value: 0 }] } },
  { id: "clientes", label: "Clientes", system: true, state: { query: "", conditions: [{ id: "v4", field: "lifecycle", op: "is", value: ["Cliente"] }] } },
];

const here = "#/frame/crm-contacts";

export default function CrmContacts() {
  const [all, setAll] = useState<Row[]>(() => baseCompanies.map(toRow));
  const [tab, setTab] = useState("empresas");
  const [contactQuery, setContactQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", domain: "", industry: industries[0], city: "", owner: me });
  const [tried, setTried] = useState(false);
  // Busca + filtros + URL (?q=…&f=…): o link desta tela reproduz o recorte.
  const filters = useFilters(all, { fields, search: searchText, me, now: today, url: true });
  const views = useSavedViews(filters, systemViews, "crm-empresas-visoes");
  const counts = Object.fromEntries(views.views.map((v) => [v.id, filters.countFor(v.state)]));
  const q = filters.state.query;
  const people = useMemo(() => contacts.filter((p) => matchesQuery(contactQuery, [p.name, p.role, p.email, companyById(p.companyId).name])), [contactQuery]);

  const update = (ids: Set<string>, patch: Partial<Row>, message: string) => {
    const before = all;
    setAll((rows) => rows.map((r) => (ids.has(r.id) ? { ...r, ...patch } : r)));
    notify(message, () => setAll(before));
  };
  const archive = (targets: Row[]) => {
    const ids = new Set(targets.map((t) => t.id));
    const before = all;
    setAll((rows) => rows.filter((r) => !ids.has(r.id)));
    notify(targets.length === 1 ? `${targets[0].name} arquivada` : `${targets.length} empresas arquivadas`, () => setAll(before));
  };

  const columns: GridColumn<Row>[] = [
    {
      key: "name",
      header: "Empresa",
      value: (c) => c.name,
      width: 260,
      pinned: "left",
      hideable: false,
      mobile: "title",
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <EntityMark name={c.name} tint={c.tint} className="h-7 w-7 shrink-0 text-[11px]" />
          <span className="min-w-0">
            <Highlight text={c.name} query={q} className="block truncate" />
            <Highlight text={c.domain} query={q} className="block truncate text-[11.5px] font-normal text-muted" />
          </span>
        </span>
      ),
    },
    {
      key: "lifecycle",
      header: "Estágio",
      value: (c) => c.lifecycle,
      width: 140,
      editable: { type: "select", options: stagesOfLife.map((s) => ({ value: s, label: s })) },
      cell: (c) => <Badge tone={lifecycleTone[c.lifecycle]}>{c.lifecycle}</Badge>,
    },
    { key: "industry", header: "Setor", value: (c) => c.industry, width: 150, mobile: "subtitle" },
    {
      key: "owner",
      header: "Responsável",
      value: (c) => c.owner,
      width: 160,
      editable: { type: "select", options: reps.map((r) => ({ value: r.id, label: r.name })) },
      cell: (c) => (
        <span className={c.owner === me ? "font-medium" : "text-ink-soft"}>
          {repById(c.owner).name.split(" ")[0]}
          {c.owner === me && <span className="font-normal text-muted"> (eu)</span>}
        </span>
      ),
    },
    { key: "contacts", header: "Contatos", width: 130, sortable: false, mobile: "hidden", cell: (c) => <AvatarGroup people={contacts.filter((p) => p.companyId === c.id)} max={3} /> },
    {
      key: "pipeline",
      header: "Em aberto",
      tooltip: "Soma dos negócios abertos da empresa. O total do rodapé segue o filtro.",
      value: (c) => c.pipeline,
      width: 140,
      align: "right",
      cell: (c) =>
        c.openDeals ? (
          <span className="leading-tight">
            <span className="block font-medium tabular-nums">{formatCurrency(c.pipeline, { compact: true })}</span>
            <span className="block text-[11px] text-muted">
              {c.openDeals} negócio{c.openDeals > 1 ? "s" : ""}
            </span>
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
      footer: (rows) => formatCurrency(rows.reduce((s, r) => s + r.pipeline, 0), { compact: true }),
    },
    {
      key: "touch",
      header: "Último contato",
      value: (c) => c.lastTouch,
      width: 140,
      cell: (c) => <span className={c.lastTouch > 30 ? "font-medium text-amber" : "text-muted"}>{c.lastTouch === 0 ? "hoje" : c.lastTouch === 1 ? "ontem" : `há ${c.lastTouch} dias`}</span>,
    },
    { key: "city", header: "Cidade", value: (c) => c.city, width: 170, defaultHidden: true },
    { key: "cnpj", header: "CNPJ", value: (c) => c.cnpj, width: 170, defaultHidden: true },
  ];

  const create = () => {
    setTried(true);
    if (!draft.name.trim()) return;
    const c: Row = toRow({ id: `c${Date.now()}`, name: draft.name.trim(), domain: draft.domain || "—", industry: draft.industry, size: "—", city: draft.city || "—", owner: draft.owner, tint: "#184560", lifecycle: "Lead", lastTouch: 0, cnpj: "—" });
    setAll((a) => [c, ...a]);
    setCreating(false);
    setTried(false);
    setDraft({ name: "", domain: "", industry: industries[0], city: "", owner: me });
    notify(`${c.name} adicionada como Lead`, () => setAll((a) => a.filter((x) => x.id !== c.id)));
  };

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Empresas e contatos"
          description="Todas as contas do time, de lead a ex-cliente."
          actions={
            <>
              <Button variant="ghost" onClick={() => notify("Exemplo: importa uma planilha CSV/XLSX com mapeamento de colunas.", undefined, "info")}>
                <Upload /> Importar
              </Button>
              <Button onClick={() => setCreating(true)}>
                <Plus /> Nova empresa
              </Button>
            </>
          }
        />
        <Tabs
          className="mt-4"
          label="Base"
          value={tab}
          onChange={setTab}
          items={[
            { id: "empresas", label: `Empresas · ${all.length}` },
            { id: "contatos", label: `Contatos · ${contacts.length}` },
          ]}
        />
        <div className="mt-5 space-y-4">
          {tab === "empresas" ? (
            <>
              <SavedViews views={views} counts={counts} />
              <DataGrid
                label="Empresas"
                rows={filters.rows}
                columns={columns}
                rowKey={(c) => c.id}
                rowLabel={(c) => c.name}
                maxHeight="max(420px, calc(100dvh - 360px))"
                storageKey="crm-empresas"
                defaultSort={{ key: "pipeline", dir: "desc" }}
                query={q}
                showDensity
                exportFileName="empresas"
                selectable
                noun="empresa"
                gender="f"
                toolbar={<FilterBar filters={filters} noun="empresa" search={<TableSearch value={q} onChange={filters.setQuery} total={all.length} noun="empresa" searchIn="nome, domínio, CNPJ, cidade e contatos" />} />}
                rowTone={(c) => (c.lastTouch > 30 && c.openDeals > 0 ? "warn" : undefined)}
                onRowOpen={(c) => go("crm-company", c.id)}
                onEdit={(c, key, value) => {
                  if (key === "owner") update(new Set([c.id]), { owner: String(value) }, `${c.name} agora é de ${repById(String(value)).name.split(" ")[0]}`);
                  if (key === "lifecycle") update(new Set([c.id]), { lifecycle: value as Lifecycle }, `${c.name} movida para ${value}`);
                }}
                rowActions={(c) => [
                  { label: "Registrar ligação", icon: <Phone />, inline: true, onSelect: () => notify(`Ligação para ${c.name} registrada`) },
                  { label: "Enviar e-mail", icon: <Mail />, inline: true, onSelect: () => notify(`Exemplo: abre o e-mail para ${contacts.find((p) => p.companyId === c.id)?.email ?? c.domain}.`, undefined, "info") },
                  { label: "Ver negócios", icon: <Briefcase />, onSelect: () => go("crm-company", c.id) },
                  { label: "Trocar para mim", icon: <UserRoundPen />, disabled: c.owner === me, onSelect: () => update(new Set([c.id]), { owner: me }, `${c.name} agora é sua`) },
                  { label: "Arquivar", icon: <Archive />, tone: "danger", separator: true, onSelect: () => archive([c]) },
                ]}
                bulkActions={(rows, { clear }) => (
                  <>
                    <button type="button" onClick={() => { update(new Set(rows.map((r) => r.id)), { owner: me }, `${rows.length} empresas agora são suas`); clear(); }}>
                      <UserRoundPen /> Assumir
                    </button>
                    <button type="button" onClick={() => downloadCsv("empresas-selecionadas", gridToCsv(rows, columns))}>
                      <Upload className="rotate-180" /> CSV
                    </button>
                    <button type="button" onClick={() => { archive(rows); clear(); }}>
                      <Archive /> Arquivar
                    </button>
                  </>
                )}
                empty={<EmptyFilterResult filters={filters} noun="empresa" />}
                mobile="cards"
              />
            </>
          ) : (
            <>
              <TableSearch value={contactQuery} onChange={setContactQuery} total={contacts.length} noun="contato" searchIn="nome, cargo, e-mail e empresa" className="max-w-[360px]" />
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
                {people.map((p) => {
                  const c = companyById(p.companyId);
                  return (
                    <li key={p.id}>
                      <a href={`#/frame/crm-contact?id=${p.id}`} className="surface-card surface-interactive flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong">
                        <Avatar initials={p.initials} tint={p.tint} name={p.name} />
                        <div className="min-w-0 flex-1">
                          <Highlight text={p.name} query={contactQuery} className="block truncate text-[13.5px] font-medium" />
                          <div className="truncate text-[12px] text-muted">
                            {p.role} · {c.name}
                          </div>
                        </div>
                        {p.tag && <Badge tone={p.tag.startsWith("Decisor") ? "accent" : "neutral"}>{p.tag}</Badge>}
                      </a>
                    </li>
                  );
                })}
                {!people.length && <li className="col-span-full py-10 text-center text-[13px] text-muted">Nenhum contato encontrado para “{contactQuery}”.</li>}
              </ul>
            </>
          )}
        </div>
      </Page>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nova empresa"
        description="Entra como Lead. Contatos e negócios podem ser adicionados na página da empresa."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={create}>Adicionar empresa</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Razão social ou nome fantasia" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} error={tried && !draft.name.trim() ? "Informe o nome da empresa." : undefined} autoFocus />
          <FieldGrid>
            <TextField label="Site" optional placeholder="empresa.com.br" value={draft.domain} onChange={(v) => setDraft((d) => ({ ...d, domain: v }))} />
            <TextField label="Cidade" optional placeholder="São Paulo, SP" value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} />
          </FieldGrid>
          <FieldGrid>
            <FieldBlock label="Setor">
              <Select label="Setor" value={draft.industry} onValueChange={(v) => setDraft((d) => ({ ...d, industry: v }))} options={industries.map((s) => ({ value: s, label: s }))} />
            </FieldBlock>
            <FieldBlock label="Responsável">
              <Select label="Responsável" value={draft.owner} onValueChange={(v) => setDraft((d) => ({ ...d, owner: v }))} options={reps.map((r) => ({ value: r.id, label: r.name }))} />
            </FieldBlock>
          </FieldGrid>
        </div>
      </Modal>
    </CrmShell>
  );
}
