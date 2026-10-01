import { Archive, ArrowRightLeft, CalendarPlus, Mail, Star, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataGrid,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Menu,
  Modal,
  Page,
  PageHeading,
  SavedViews,
  Select,
  TableSearch,
  TextField,
  formatCurrency,
  notify,
  plural,
  useFilters,
  useSavedViews,
  type FilterField,
  type GridColumn,
  type SavedView,
} from "@g4os/ds";
import { candidates as seed, iso, jobById, jobs, me, shortDate, stageLabel, stages, today, type Candidate, type StageId } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Banco de talentos",
  description: "Todos os candidatos em DataGrid: visões salvas, filtros, busca local (/), seleção com mover etapa em massa, ações rápidas (e-mail, agendar), colunas configuráveis, CSV e cadastro manual.",
  category: "ATS",
  order: 6,
  height: 900,
} as const;

const statusInfo = {
  ativo: { label: "Em processo", tone: "info" as const },
  banco: { label: "Banco de talentos", tone: "neutral" as const },
  contratado: { label: "Contratado(a)", tone: "ok" as const },
  reprovado: { label: "Reprovado(a)", tone: "bad" as const },
};

const fields: FilterField<Candidate>[] = [
  { key: "job", label: "Vaga", type: "enum", quick: true, accessor: (c) => c.jobId, options: jobs.map((j) => ({ value: j.id, label: j.short })) },
  { key: "stage", label: "Etapa", type: "enum", quick: true, accessor: (c) => c.stage, options: stages.map((s) => ({ value: s.id, label: s.label })) },
  { key: "status", label: "Situação", type: "enum", accessor: (c) => c.status, options: Object.entries(statusInfo).map(([value, v]) => ({ value, label: v.label })) },
  { key: "source", label: "Origem", type: "enum", accessor: (c) => c.source, options: [...new Set(seed.map((c) => c.source))].map((s) => ({ value: s, label: s })) },
  { key: "rating", label: "Nota média", type: "number", accessor: (c) => c.rating ?? 0 },
  { key: "salary", label: "Pretensão", type: "currency", accessor: (c) => c.salaryExpectation },
  { key: "applied", label: "Candidatura", type: "date", accessor: (c) => c.appliedAt },
  { key: "city", label: "Cidade", type: "text", accessor: (c) => c.city },
];

const views: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "processo", label: "Em processo", system: true, state: { query: "", conditions: [{ id: "v1", field: "status", op: "is", value: ["ativo"] }] } },
  { id: "banco", label: "Banco de talentos", system: true, state: { query: "", conditions: [{ id: "v2", field: "status", op: "is", value: ["banco"] }] } },
  { id: "bem", label: "Bem avaliados", system: true, state: { query: "", conditions: [{ id: "v3", field: "rating", op: "gt", value: 3.9 }] } },
  { id: "indicacoes", label: "Indicações", system: true, state: { query: "", conditions: [{ id: "v4", field: "source", op: "is", value: ["Indicação"] }] } },
];

export default function AtsCandidates() {
  const novo = useFrameParam("novo");
  const [rows, setRows] = useState(seed);
  const [adding, setAdding] = useState(!!novo);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [job, setJob] = useState("j1");
  const filters = useFilters(rows, { fields, search: (c) => [c.name, c.email, c.headline, c.city, ...c.skills], me: me.id, now: today, url: "c_" });
  const saved = useSavedViews(filters, views, "ats-talentos-visoes");
  const counts = Object.fromEntries(saved.views.map((v) => [v.id, filters.countFor(v.state)]));
  const q = filters.state.query;

  const moveTo = (targets: Candidate[], stage: StageId) => {
    const ids = new Set(targets.map((c) => c.id));
    const before = rows;
    setRows((all) => all.map((c) => (ids.has(c.id) ? { ...c, stage, status: "ativo" } : c)));
    notify(`${plural(ids.size, "candidato")} em ${stageLabel(stage)}`, () => setRows(before));
  };
  const archive = (targets: Candidate[]) => {
    const ids = new Set(targets.map((c) => c.id));
    const before = rows;
    setRows((all) => all.map((c) => (ids.has(c.id) ? { ...c, status: "banco" } : c)));
    notify(`${ids.size === 1 ? "1 candidato movido" : `${ids.size} candidatos movidos`} para o banco de talentos`, () => setRows(before));
  };

  const columns: GridColumn<Candidate>[] = [
    {
      key: "name",
      header: "Candidato",
      value: (c) => c.name,
      width: 280,
      pinned: "left",
      hideable: false,
      mobile: "title",
      cell: (c) => (
        <span className="flex items-center gap-2.5">
          <Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" />
          <span className="min-w-0 leading-tight">
            <Highlight text={c.name} query={q} className="block truncate" />
            <Highlight text={c.headline} query={q} className="block truncate text-[11.5px] font-normal text-muted" />
          </span>
        </span>
      ),
    },
    {
      key: "job",
      header: "Vaga e etapa",
      value: (c) => jobById(c.jobId).short,
      width: 200,
      mobile: "subtitle",
      cell: (c) => (
        <span className="block leading-tight">
          <span className="block truncate">{jobById(c.jobId).short}</span>
          <span className="block text-[11.5px] text-muted">{stageLabel(c.stage)}</span>
        </span>
      ),
    },
    { key: "status", header: "Situação", value: (c) => statusInfo[c.status].label, width: 160, cell: (c) => <Badge tone={statusInfo[c.status].tone}>{statusInfo[c.status].label}</Badge> },
    {
      key: "rating",
      header: "Nota",
      tooltip: "Média das avaliações dos entrevistadores (1 a 5)",
      value: (c) => c.rating ?? undefined,
      width: 90,
      align: "right",
      cell: (c) =>
        c.rating == null ? (
          <span className="text-muted">—</span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium tabular-nums">
            <Star aria-hidden className="h-3.5 w-3.5" fill="var(--ds-accent)" stroke="var(--ds-accent)" />
            {c.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
          </span>
        ),
    },
    { key: "source", header: "Origem", value: (c) => c.source, width: 130, cell: (c) => <span className="text-ink-soft">{c.source}</span> },
    { key: "salary", header: "Pretensão", value: (c) => c.salaryExpectation, width: 130, align: "right", cell: (c) => <span className="tabular-nums">{formatCurrency(c.salaryExpectation, { cents: false })}</span> },
    { key: "applied", header: "Candidatura", value: (c) => c.appliedAt, width: 120, cell: (c) => <span className="text-muted">{shortDate(c.appliedAt)}</span> },
    { key: "city", header: "Cidade", value: (c) => c.city, width: 160, defaultHidden: true },
    { key: "email", header: "E-mail", value: (c) => c.email, width: 220, defaultHidden: true },
  ];

  return (
    <TalentosShell section="candidatos">
      <Page>
        <PageHeading
          title="Candidatos"
          description="Banco de talentos da Nexo S.A.: quem está em processo, quem já passou e quem vale chamar de novo."
          actions={
            <Button onClick={() => setAdding(true)}>
              <UserPlus /> Adicionar candidato
            </Button>
          }
        />
        <div className="mt-5 space-y-4">
          <SavedViews views={saved} counts={counts} />
          <DataGrid
            label="Candidatos"
            rows={filters.rows}
            columns={columns}
            rowKey={(c) => c.id}
            rowLabel={(c) => c.name}
            maxHeight="max(440px, calc(100dvh - 330px))"
            storageKey="ats-talentos"
            defaultSort={{ key: "applied", dir: "desc" }}
            query={q}
            selectable
            noun="candidato"
            exportFileName="candidatos"
            showDensity
            toolbar={<FilterBar filters={filters} noun="candidato" search={<TableSearch value={q} onChange={filters.setQuery} total={rows.length} noun="candidato" searchIn="nome, e-mail, cargo, cidade e habilidades" />} />}
            rowTone={(c) => (c.status === "ativo" && c.rating != null && c.rating >= 4.5 ? "ok" : undefined)}
            onRowOpen={(c) => go("ats-candidate", c.id)}
            rowActions={(c) => [
              { label: "Enviar e-mail", icon: <Mail />, inline: true, onSelect: () => notify(`Rascunho para ${c.email}`, undefined, "info") },
              { label: "Agendar entrevista", icon: <CalendarPlus />, inline: true, onSelect: () => go("ats-interviews", c.id) },
              { label: "Avançar etapa", icon: <ArrowRightLeft />, disabled: c.status !== "ativo", onSelect: () => { const i = stages.findIndex((s) => s.id === c.stage); if (stages[i + 1]) moveTo([c], stages[i + 1].id); } },
              { label: "Mover para o banco", icon: <Archive />, separator: true, disabled: c.status === "banco", onSelect: () => archive([c]) },
            ]}
            bulkActions={(sel, { clear }) => (
              <>
                <Menu
                  label="Mover para etapa"
                  side="top"
                  triggerClassName="h-8 bg-transparent px-2.5 text-[12.5px] font-normal text-on-ink ring-0 hover:bg-on-ink/10 data-popup-open:bg-on-ink/10"
                  trigger={
                    <>
                      <ArrowRightLeft /> Mover etapa
                    </>
                  }
                  items={stages.map((st) => ({ label: st.label, onSelect: () => { moveTo(sel, st.id); clear(); } }))}
                />
                <button type="button" onClick={() => { notify(`E-mail enviado para ${plural(sel.length, "candidato")}`, undefined, "info"); clear(); }}>
                  <Mail /> E-mail
                </button>
                <button type="button" onClick={() => { archive(sel); clear(); }}>
                  <Archive /> Para o banco
                </button>
              </>
            )}
            empty={<EmptyFilterResult filters={filters} noun="candidato" />}
            mobile="cards"
          />
        </div>
      </Page>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Adicionar candidato"
        description="Cadastro manual: indicação, hunting ou currículo recebido por e-mail."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim()}
              onClick={() => {
                const c: Candidate = { ...seed[0], id: `n${Date.now()}`, name, email, jobId: job, stage: "triagem", status: "ativo", rating: null, source: "Indicação", headline: "Cadastro manual", appliedAt: iso(0), initials: name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(), referral: undefined };
                setRows((all) => [c, ...all]);
                setAdding(false);
                setName("");
                setEmail("");
                notify(`${name} adicionado(a) à triagem de ${jobById(job).short}`);
              }}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Nome completo" value={name} onChange={setName} />
          <TextField label="E-mail" value={email} onChange={setEmail} placeholder="nome@email.com" optional />
          <Select label="Vaga" value={job} onValueChange={setJob} options={jobs.filter((j) => j.status === "aberta").map((j) => ({ value: j.id, label: j.title }))} />
        </div>
      </Modal>
    </TalentosShell>
  );
}
