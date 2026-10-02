import { Archive, Briefcase, Download, FileSpreadsheet, Mail, Phone, Plus, Upload, UserRoundPen, UserSearch } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertCard,
  AvatarGroup,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ComposeEmailDialog,
  DataGrid,
  Drawer,
  Empty,
  EmptyFilterResult,
  EntityMark,
  ErrorState,
  FieldBlock,
  FileDropzone,
  FieldGrid,
  FilterBar,
  Highlight,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  SavedViews,
  Select,
  Skeleton,
  Stepper,
  TableSearch,
  Tabs,
  TextField,
  formatCurrency,
  matchesQuery,
  downloadCsv,
  gridToCsv,
  notify,
  formatNumber,
  useFilters,
  useOperation,
  useSavedViews,
  type FilterField,
  type GridColumn,
  type Person,
  type SavedView,
  type UploadItem,
} from "@g4ai/ds";
import { companies as baseCompanies, companyById, contacts, deals, go, iso, me, repById, reps, today, useFrameParam, type Company, type Lifecycle } from "./data/crm";
import { setFrameQuery } from "./shells/frame-route";
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
      "Importar planilha em gaveta: arquivo → mapear colunas → revisar (linhas com erro antes de gravar)",
      "E-mail pela linha abre o compositor com o contato principal",
      "Cinco estados: ?estado=carregando|vazio|erro simula; recorte vazio limpa filtros",
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

/* E-mail: remetente e diretório de destinatários do compositor. */
const sender: Person = { id: "ana", name: "Ana Lopes", email: "ana.lopes@acme.com.br", initials: "AL" };
const directory: Person[] = contacts.map((p) => ({ id: p.id, name: p.name, email: p.email, initials: p.initials, tint: p.tint }));

export default function CrmContacts() {
  const [all, setAll] = useState<Row[]>(() => baseCompanies.map(toRow));
  const [tab, setTab] = useState("empresas");
  const [contactQuery, setContactQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", domain: "", industry: industries[0], city: "", owner: me });
  const [tried, setTried] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mail, setMail] = useState<{ to: Person[]; subject: string; body: string; company: string } | null>(null);
  const estado = useFrameParam("estado");
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
              <Button variant="ghost" onClick={() => setImporting(true)}>
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
          {estado === "carregando" ? (
            <div className="space-y-2" aria-busy="true" aria-label="Carregando empresas">
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-11 w-full rounded-xl" />
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-1 py-1.5">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="ml-auto h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          ) : estado === "erro" ? (
            <ErrorState size="md" title="Não foi possível carregar as empresas" description="Nada foi perdido. Verifique a conexão e tente de novo." onRetry={() => setFrameQuery({ estado: undefined })} />
          ) : estado === "vazio" ? (
            <Empty
              icon={<FileSpreadsheet />}
              title="Nenhuma empresa na base"
              hint="Importe a planilha que o time já usa ou cadastre a primeira conta. Contatos e negócios ficam dentro de cada empresa."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="ghost" onClick={() => setImporting(true)}>
                    <Upload /> Importar planilha
                  </Button>
                  <Button onClick={() => setCreating(true)}>
                    <Plus /> Adicionar empresa
                  </Button>
                </div>
              }
            />
          ) : tab === "empresas" ? (
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
                  {
                    label: "Enviar e-mail",
                    icon: <Mail />,
                    inline: true,
                    onSelect: () => {
                      const main = contacts.find((p) => p.companyId === c.id);
                      setMail({ to: main ? directory.filter((d) => d.id === main.id) : [], subject: `${c.name} · próximos passos`, body: `Olá${main ? `, ${main.name.split(" ")[0]}` : ""}.\n\nSigo com os próximos passos que combinamos.\n\nAbraço,\nAna`, company: c.name });
                    },
                  },
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
                {!people.length && (
                  <li className="col-span-full">
                    <Empty
                      icon={<UserSearch />}
                      title={`Nenhum contato encontrado para “${contactQuery}”`}
                      hint="A busca considera nome, cargo, e-mail e empresa."
                      action={
                        <Button variant="ghost" onClick={() => setContactQuery("")}>
                          Limpar busca
                        </Button>
                      }
                    />
                  </li>
                )}
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

      <ImportDrawer
        open={importing}
        onClose={() => setImporting(false)}
        onImported={(rows) => {
          setAll((a) => [...rows, ...a]);
          return () => setAll((a) => a.filter((x) => !rows.includes(x)));
        }}
      />

      <ComposeEmailDialog
        open={!!mail}
        onClose={() => setMail(null)}
        title={mail ? `E-mail · ${mail.company}` : "Escrever e-mail"}
        from={sender}
        to={mail?.to ?? []}
        onToChange={(to) => setMail((m) => (m ? { ...m, to } : m))}
        directory={directory}
        subject={mail?.subject ?? ""}
        onSubjectChange={(subject) => setMail((m) => (m ? { ...m, subject } : m))}
        body={mail?.body ?? ""}
        onBodyChange={(body) => setMail((m) => (m ? { ...m, body } : m))}
        onSend={() => {
          const who = mail?.to.map((p) => p.name.split(" ")[0]).join(", ");
          setMail(null);
          notify(`E-mail enviado para ${who}`);
        }}
      />
    </CrmShell>
  );
}

/* ------------------------------------------------------------------ */
/* Importar planilha: arquivo → mapear colunas → revisar               */
/* ------------------------------------------------------------------ */

type Target = "name" | "domain" | "city" | "industry" | "owner" | "phone" | "skip";
const targetLabel: Record<Target, string> = { name: "Nome da empresa", domain: "Site", city: "Cidade", industry: "Setor", owner: "Responsável", phone: "Telefone", skip: "Não importar" };
// Colunas lidas da planilha de exemplo (no seu app, venha do parser de CSV/XLSX).
const detected: { column: string; sample: string; guess: Target }[] = [
  { column: "Razão social", sample: "Lumen Energia S.A.", guess: "name" },
  { column: "Website", sample: "lumen.com.br", guess: "domain" },
  { column: "Cidade/UF", sample: "São Paulo, SP", guess: "city" },
  { column: "Segmento", sample: "Energia", guess: "industry" },
  { column: "Dono da conta", sample: "Ana Lopes", guess: "owner" },
  { column: "Observações", sample: "Veio da feira de março", guess: "skip" },
];
const sampleRows: [string, string, string, string][] = [
  ["Lumen Energia", "lumen.com.br", "São Paulo, SP", "Energia"],
  ["Transvale Cargas", "transvale.com.br", "São José dos Campos, SP", "Logística"],
  ["Universidade Metropolitana", "unimetro.edu.br", "Rio de Janeiro, RJ", "Educação"],
];
const importStats = { total: 128, created: 112, updated: 9, invalid: 7 };
const invalidLines = [
  { id: "14", label: "Linha 14 · Razão social vazia" },
  { id: "37", label: "Linha 37 · Site inválido (“www”)" },
  { id: "52", label: "Linha 52 · Responsável “Marcos T.” não está no time" },
];
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function ImportDrawer({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: (rows: Row[]) => () => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [map, setMap] = useState<Record<string, Target>>(() => Object.fromEntries(detected.map((d) => [d.column, d.guess])));
  const [update, setUpdate] = useState(true);
  const op = useOperation({ busyLabel: "Importando…" });
  const mapped = Object.values(map);
  const hasName = mapped.includes("name");
  const dupTarget = (["name", "domain", "city", "industry", "owner", "phone"] as Target[]).find((t) => mapped.filter((m) => m === t).length > 1);

  const reset = () => {
    setStep(0);
    setFiles([]);
    setMap(Object.fromEntries(detected.map((d) => [d.column, d.guess])));
    op.reset();
  };
  const close = () => {
    onClose();
    reset();
  };
  const run = async () => {
    const rows = sampleRows.map(([name, domain, city, industry], i) => toRow({ id: `imp${Date.now()}${i}`, name, domain, industry, size: "—", city, owner: me, tint: "#184560", lifecycle: "Lead", lastTouch: 0, cnpj: "—" }));
    let undo = () => {};
    const failed = await op.run(() => wait(900), {
      message: `${formatNumber(importStats.created)} empresas importadas como Lead${update ? ` · ${importStats.updated} atualizadas` : ""}`,
      undo: () => undo(),
    });
    if (!failed) {
      undo = onImported(rows);
      close();
    }
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      width={560}
      kicker="Empresas e contatos"
      title="Importar planilha"
      footer={
        <>
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as 0 | 1)}>
              Voltar
            </Button>
          ) : (
            <Button variant="ghost" onClick={close}>
              Cancelar
            </Button>
          )}
          {step === 0 && (
            <Button onClick={() => setStep(1)} disabled={!files.length} disabledReason="Envie a planilha primeiro.">
              Mapear colunas
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!hasName || !!dupTarget} disabledReason={!hasName ? "Indique a coluna com o nome da empresa." : "Dois campos apontam para o mesmo destino."}>
              Revisar importação
            </Button>
          )}
          {step === 2 && (
            <OperationButton operation={op} onClick={run}>
              Importar {formatNumber(importStats.created + (update ? importStats.updated : 0))} empresas
            </OperationButton>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <Stepper
          label="Etapas da importação"
          steps={["Arquivo", "Mapear colunas", "Revisar"].map((label, i) => ({ id: String(i), label, state: i < step ? "done" : i === step ? "current" : "upcoming" }))}
        />
        {step === 0 && (
          <>
            <FileDropzone
              label="Planilha"
              accept=".csv,.xlsx"
              multiple={false}
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              hint="CSV ou XLSX até 10 MB. Uma empresa por linha, com cabeçalho na primeira."
              items={files}
              onRemove={() => setFiles([])}
              onFiles={(list) => {
                const f = list[0];
                if (f) setFiles([{ id: f.name, name: f.name, size: f.size, progress: 100 }]);
              }}
            />
            <Button
              variant="quiet"
              size="sm"
              onClick={() => downloadCsv("modelo-empresas", ["Razão social;Website;Cidade/UF;Segmento;Dono da conta", "Exemplo Ltda.;exemplo.com.br;São Paulo, SP;Varejo;Ana Lopes"].join("\n"))}
            >
              <Download /> Baixar planilha modelo
            </Button>
          </>
        )}
        {step === 1 && (
          <section aria-label="Mapear colunas">
            <p className="m-0 mb-3 text-[13px] text-muted">
              Lemos {detected.length} colunas em <span className="text-ink">{files[0]?.name}</span>. Diga para qual campo do CRM vai cada uma.
            </p>
            <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
              {detected.map((d) => (
                <li key={d.column} className="grid items-center gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_200px]">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium">{d.column}</div>
                    <div className="truncate text-[12px] text-muted">Ex.: {d.sample}</div>
                  </div>
                  <Select
                    label={`Destino de ${d.column}`}
                    hideLabel
                    value={map[d.column]}
                    onValueChange={(v) => setMap((m) => ({ ...m, [d.column]: v as Target }))}
                    options={(Object.keys(targetLabel) as Target[]).map((t) => ({ value: t, label: targetLabel[t] }))}
                  />
                </li>
              ))}
            </ul>
            {!hasName && <p className="m-0 mt-2 text-[12.5px] text-rose">Indique a coluna com o nome da empresa: é o único campo obrigatório.</p>}
            {dupTarget && <p className="m-0 mt-2 text-[12.5px] text-rose">Duas colunas vão para “{targetLabel[dupTarget]}”. Escolha só uma.</p>}
          </section>
        )}
        {step === 2 && (
          <>
            <OperationFeedback operation={op} />
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {[
                { label: "Novas", value: importStats.created },
                { label: "Já existem", value: importStats.updated },
                { label: "Com erro", value: importStats.invalid },
              ].map((k) => (
                <div key={k.label} className="bg-surface px-4 py-3">
                  <div className="text-[12px] text-muted">{k.label}</div>
                  <div className={k.label === "Com erro" ? "text-[18px] font-semibold tabular-nums text-rose" : "text-[18px] font-semibold tabular-nums"}>{formatNumber(k.value)}</div>
                </div>
              ))}
            </div>
            <Checkbox label={`Atualizar as ${importStats.updated} empresas que já existem (mesmo site)`} checked={update} onCheckedChange={setUpdate} />
            <AlertCard tone="warn" title={`${importStats.invalid} linhas não serão importadas`} description="Corrija na planilha e importe só essas linhas depois. As outras entram agora." items={invalidLines} />
            <p className="m-0 text-[12.5px] text-muted">Todas entram como Lead, com você como responsável quando a coluna estiver vazia.</p>
          </>
        )}
      </div>
    </Drawer>
  );
}
