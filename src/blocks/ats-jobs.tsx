import { Copy, KanbanSquare, Pause, Play, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  DataTable,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  Page,
  PageHeading,
  SortHeader,
  StatCell,
  StatGrid,
  TableSearch,
  Tabs,
  chartColor,
  notify,
  useFilters,
  useSort,
  type Column,
  type FilterField,
} from "@g4os/ds";
import { areas, candidatesOf, company, jobs as allJobs, me, offers, openDays, person, stages, team, today, type Job, type JobStatus } from "./data/ats";
import { go } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Vagas",
  description: "Vagas com funil por etapa, tempo em aberto contra o SLA, filtros por área e recrutador, busca local (/) e estado na URL. Linha abre a vaga.",
  category: "ATS",
  order: 2,
  height: 900,
} as const;

/** Candidatos por etapa: os listados + o volume da triagem. */
const funnelOf = (j: Job) => stages.map((s, i) => j.backlog[i] + candidatesOf(j.id).filter((c) => c.stage === s.id).length);

/** Barra empilhada de candidatos por etapa (a cor segue a ordem da etapa). */
function StageMix({ counts }: { counts: number[] }) {
  const total = counts.reduce((s, n) => s + n, 0) || 1;
  return (
    <div className="w-40">
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-line" role="img" aria-label={counts.map((n, i) => `${stages[i].label} ${n}`).join(", ")}>
        {counts.map((n, i) => (n ? <span key={i} style={{ width: `${(n / total) * 100}%`, background: chartColor(i) }} /> : null))}
      </div>
      <div className="mt-1 text-[11px] tabular-nums text-muted">
        {counts.slice(1).reduce((s, n) => s + n, 0)} em processo · {counts[4]} proposta{counts[4] === 1 ? "" : "s"}
      </div>
    </div>
  );
}

const fields: FilterField<Job>[] = [
  { key: "area", label: "Área", type: "enum", quick: true, accessor: (j) => j.area, options: areas.map((a) => ({ value: a, label: a })) },
  { key: "recruiter", label: "Recrutador(a)", type: "person", quick: true, accessor: (j) => j.recruiter, options: team.slice(0, 3).map((p) => ({ value: p.id, label: p.name })) },
  { key: "mode", label: "Modelo", type: "enum", accessor: (j) => j.mode, options: ["Presencial", "Híbrido", "Remoto"].map((m) => ({ value: m, label: m })) },
  { key: "level", label: "Nível", type: "enum", accessor: (j) => j.level, options: [...new Set(allJobs.map((j) => j.level))].map((l) => ({ value: l, label: l })) },
  { key: "days", label: "Dias em aberto", type: "number", unit: "dias", accessor: openDays },
  { key: "opened", label: "Aberta em", type: "date", accessor: (j) => j.openedAt },
];

export default function AtsJobs() {
  const [jobs, setJobs] = useState(allJobs);
  const [tab, setTab] = useState<JobStatus>("aberta");
  const inTab = useMemo(() => jobs.filter((j) => j.status === tab), [jobs, tab]);
  // Estado de busca e filtros na URL (?v_q=…&v_f=…): o link reproduz o recorte.
  const filters = useFilters(inTab, { fields, search: (j) => [j.title, j.area, j.location], me: me.id, now: today, url: "v_" });
  const sort = useSort(filters.rows, { vaga: (j) => j.title, dias: openDays, candidatos: (j) => funnelOf(j).reduce((s, n) => s + n, 0) }, { key: "dias", dir: "desc" });
  const q = filters.state.query;
  const open = jobs.filter((j) => j.status === "aberta");
  const late = open.filter((j) => openDays(j) > j.sla);

  const setStatus = (j: Job, status: JobStatus) => {
    const before = j.status;
    setJobs((all) => all.map((x) => (x.id === j.id ? { ...x, status } : x)));
    notify(status === "pausada" ? `Vaga “${j.short}” pausada` : `Vaga “${j.short}” reaberta`, () => setJobs((all) => all.map((x) => (x.id === j.id ? { ...x, status: before } : x))));
  };

  const columns: Column<Job>[] = [
    {
      key: "title",
      header: <SortHeader label="Vaga" {...sort.header("vaga")} />,
      primary: true,
      cell: (j) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-2">
            <Highlight text={j.title} query={q} className="truncate" />
            {j.priority && <Badge tone="accent">Prioritária</Badge>}
          </span>
          <span className="block truncate text-[12px] font-normal text-muted">
            {j.area} · {j.level} · {j.location === "Remoto" ? "Remoto" : `${j.location} · ${j.mode}`}
          </span>
        </span>
      ),
    },
    {
      key: "candidates",
      header: <SortHeader label="Candidatos" align="right" {...sort.header("candidatos")} />,
      align: "right",
      nowrap: true,
      cell: (j) => (
        <span>
          <span className="font-medium tabular-nums">{funnelOf(j).reduce((s, n) => s + n, 0)}</span>
          {j.newToday > 0 && <span className="block text-[11.5px] text-ok">+{j.newToday} hoje</span>}
        </span>
      ),
    },
    { key: "mix", header: "Funil", mobileHidden: true, cell: (j) => <StageMix counts={funnelOf(j)} /> },
    {
      key: "days",
      header: <SortHeader label="Em aberto" {...sort.header("dias")} />,
      nowrap: true,
      cell: (j) => {
        const d = openDays(j);
        return (
          <span className={d > j.sla ? "font-medium text-rose" : d > j.sla * 0.8 ? "text-amber" : "text-ink-soft"}>
            {d} dias
            <span className="block text-[11.5px] font-normal text-muted">SLA {j.sla} dias</span>
          </span>
        );
      },
    },
    {
      key: "recruiter",
      header: "Recrutador(a)",
      mobileHidden: true,
      cell: (j) => {
        const r = person(j.recruiter);
        return (
          <span className="flex items-center gap-2">
            <Avatar initials={r.initials} tint={r.tint} size="sm" name={r.name} />
            <span className="truncate text-[13px]">{r.name.split(" ")[0]}</span>
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      action: true,
      cell: (j) => (
        <ActionMenu
          label={`Ações da vaga ${j.short}`}
          actions={[
            { label: "Ver candidatos", icon: <KanbanSquare />, onSelect: () => go("ats-pipeline", j.id) },
            { label: "Copiar link da vaga", icon: <Copy />, onSelect: () => notify(`Link copiado: ${company.careersUrl}/vagas/${j.id}`, undefined, "info") },
            j.status === "aberta"
              ? { label: "Pausar vaga", icon: <Pause />, onSelect: () => setStatus(j, "pausada"), separator: true }
              : { label: "Reabrir vaga", icon: <Play />, onSelect: () => setStatus(j, "aberta"), separator: true },
          ]}
        />
      ),
    },
  ];

  return (
    <TalentosShell section="vagas">
      <Page>
        <PageHeading
          title="Vagas"
          description="Processos seletivos da Nexo S.A. O SLA conta a partir da aprovação da vaga."
          actions={
            <Button onClick={() => go("ats-job", "nova")}>
              <Plus /> Abrir vaga
            </Button>
          }
        />
        <div className="mt-6">
          <StatGrid cols={4}>
            <StatCell label="Vagas abertas" value={open.length} hint={`${open.reduce((s, j) => s + j.openings, 0)} posições`} />
            <StatCell label="Candidatos em processo" value={open.reduce((s, j) => s + funnelOf(j).slice(1).reduce((a, n) => a + n, 0), 0)} hint="fora da triagem" />
            <StatCell label="Fora do SLA" value={late.length} tone={late.length ? "bad" : undefined} hint={late.map((j) => j.short).join(", ") || "nenhuma"} />
            <StatCell label="Propostas pendentes" value={offers.filter((o) => o.status === "aprovacao" || o.status === "enviada").length} tone="warn" hint="aprovação ou resposta" />
          </StatGrid>
        </div>
        <Tabs
          className="mt-6"
          label="Situação da vaga"
          value={tab}
          onChange={(v) => setTab(v as JobStatus)}
          items={[
            { id: "aberta", label: `Abertas · ${jobs.filter((j) => j.status === "aberta").length}` },
            { id: "pausada", label: `Pausadas · ${jobs.filter((j) => j.status === "pausada").length}` },
            { id: "encerrada", label: `Encerradas · ${jobs.filter((j) => j.status === "encerrada").length}` },
          ]}
        />
        <div className="mt-5 space-y-4">
          <FilterBar filters={filters} noun="vaga" search={<TableSearch value={q} onChange={filters.setQuery} total={inTab.length} noun="vaga" searchIn="título, área e cidade" />} />
          <DataTable
            rows={sort.rows}
            columns={columns}
            rowKey={(j) => j.id}
            onRowClick={(j) => go("ats-job", j.id)}
            rowLabel={(j) => `Abrir vaga ${j.title}`}
            empty={<EmptyFilterResult filters={filters} noun="vaga" />}
          />
        </div>
      </Page>
    </TalentosShell>
  );
}
