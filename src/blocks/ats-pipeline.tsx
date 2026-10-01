import { Link2, Star, UserPlus } from "lucide-react";
import { useState, type DragEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  KanbanBoard,
  KanbanColumn,
  Modal,
  Page,
  PageHeading,
  RecordCard,
  SegmentedControl,
  Select,
  TextField,
  chartColor,
  notify,
  type Column,
} from "@g4ai/ds";
import { candidatesOf, company, iso, jobById, openDays, person, stageLabel, stages, type Candidate, type StageId } from "./data/ats";
import { go, useFrameParam } from "./shells/frame-route";
import { TalentosShell } from "./shells/talentos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Candidatos da vaga",
  description: "Quadro (ou lista) de candidatos de uma vaga por etapa: nota média, origem, tempo na etapa, arrastar para avançar e adicionar candidato. Card abre o perfil.",
  category: "ATS",
  order: 4,
  height: 860,
  concept: {
    goal: "Mover candidatos de uma vaga entre etapas e ver onde o funil trava.",
    patterns: [
      "Anatomia E · Quadro: colunas por etapa; no desktop a página não rola",
      "Card com nota média, origem e tempo na etapa; arrastar para avançar",
      "Alternar Quadro/Lista sem perder filtros",
      "Card abre o perfil",
    ],
    adapt: [
      "Pipeline de vendas, esteira de pedidos, kanban de chamados",
    ],
    avoid: [
      "Mudar status por botões dentro do card",
    ],
  },
} as const;

/** Nota 1–5 em estrelas pequenas (só leitura). */
function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-[11.5px] text-muted">Sem avaliação</span>;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Nota média ${value.toLocaleString("pt-BR")} de 5`}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="h-3 w-3" strokeWidth={1.5} fill={i <= Math.round(value) ? "var(--ds-accent)" : "none"} stroke={i <= Math.round(value) ? "var(--ds-accent)" : "var(--ds-line-strong)"} />
        ))}
      </span>
      <span className="text-[11.5px] font-medium tabular-nums text-ink-soft">{value.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
    </span>
  );
}

const inStage = (d: number) => (d === 0 ? "entrou hoje" : d === 1 ? "1 dia na etapa" : `${d} dias na etapa`);

export default function AtsPipeline() {
  const id = useFrameParam("id", "j1");
  return <Board key={id} jobId={id} />;
}

function Board({ jobId }: { jobId: string }) {
  const job = jobById(jobId);
  const [list, setList] = useState<Candidate[]>(() => candidatesOf(job.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [view, setView] = useState<"quadro" | "lista">("quadro");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<Candidate["source"]>("Indicação");

  const move = (cid: string, stage: StageId) => {
    const c = list.find((x) => x.id === cid);
    if (!c || c.stage === stage) return;
    const from = c.stage;
    setList((all) => all.map((x) => (x.id === cid ? { ...x, stage, daysInStage: 0 } : x)));
    notify(`${c.name} foi para ${stageLabel(stage)}`, () => setList((all) => all.map((x) => (x.id === cid ? { ...x, stage: from } : x))));
  };
  const drop = (stage: StageId) => (e: DragEvent) => {
    move(e.dataTransfer.getData("text/plain") || dragging || "", stage);
    setDragging(null);
  };
  const add = () => {
    if (!name.trim()) return;
    const n: Candidate = { ...list[0], id: `novo-${Date.now()}`, name, initials: name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(), email, source, stage: "triagem", rating: null, daysInStage: 0, appliedAt: iso(0), headline: "Adicionado manualmente", referral: undefined };
    setList((all) => [n, ...all]);
    setAdding(false);
    setName("");
    setEmail("");
    notify(`${name} entrou na triagem de ${job.short}`);
  };

  const columns: Column<Candidate>[] = [
    { key: "name", header: "Candidato", primary: true, cell: (c) => <span className="flex items-center gap-2.5"><Avatar initials={c.initials} tint={c.tint} name={c.name} size="sm" /><span className="min-w-0"><span className="block truncate">{c.name}</span><span className="block truncate text-[12px] font-normal text-muted">{c.headline}</span></span></span> },
    {
      key: "stage",
      header: "Etapa",
      action: true,
      cell: (c) => <Select size="compact" label={`Etapa de ${c.name}`} value={c.stage} onValueChange={(v) => move(c.id, v as StageId)} options={stages.map((s) => ({ value: s.id, label: s.label }))} />,
    },
    { key: "rating", header: "Nota", nowrap: true, cell: (c) => <Stars value={c.rating} /> },
    { key: "source", header: "Origem", mobileHidden: true, cell: (c) => <Badge>{c.source}</Badge> },
    { key: "days", header: "Na etapa", nowrap: true, cell: (c) => <span className={c.daysInStage > 5 ? "text-amber" : "text-muted"}>{inStage(c.daysInStage)}</span> },
  ];

  return (
    <TalentosShell section="vagas">
      <Page className="flex flex-col">
        <PageHeading
            crumbs={[{ label: "Vagas", href: "#/frame/ats-jobs" }, { label: job.short, href: `#/frame/ats-job?id=${job.id}` }]}
          title={`Candidatos · ${job.short}`}
          description={`${job.location} · ${job.mode} · aberta há ${openDays(job)} dias de ${job.sla} · gestor: ${person(job.manager).name}`}
          actions={
            <>
              <SegmentedControl label="Visualização" value={view} onChange={setView} options={[{ value: "quadro", label: "Quadro" }, { value: "lista", label: "Lista" }]} />
              <Button variant="ghost" onClick={() => notify(`Link copiado: ${company.careersUrl}/vagas/${job.id}`, undefined, "info")}>
                <Link2 /> Link da vaga
              </Button>
              <Button onClick={() => setAdding(true)}>
                <UserPlus /> Adicionar candidato
              </Button>
            </>
          }
        />
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          {view === "lista" ? (
            <DataTable rows={list} columns={columns} rowKey={(c) => c.id} onRowClick={(c) => go("ats-candidate", c.id)} rowLabel={(c) => `Abrir ${c.name}`} />
          ) : (
            <KanbanBoard className="min-h-[520px] flex-1">
              {stages.map((st, i) => {
                const items = list.filter((c) => c.stage === st.id);
                const rated = items.filter((c) => c.rating != null);
                const avg = rated.length ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length : null;
                return (
                  <KanbanColumn key={st.id} title={st.label} count={items.length + job.backlog[i]} dotColor={chartColor(i)} meta={avg ? `média ${avg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}` : undefined} onDrop={drop(st.id)} width={212}>
                    {items.map((c) => (
                      <RecordCard
                        key={c.id}
                        title={c.name}
                        subtitle={c.headline}
                        leading={<Avatar initials={c.initials} tint={c.tint} name={c.name} />}
                        tags={c.referral ? <Badge tone="accent">Indicação interna</Badge> : <Badge>{c.source}</Badge>}
                        meta={inStage(c.daysInStage)}
                        tone={c.daysInStage > 5 && st.id === "triagem" ? "warn" : undefined}
                        onOpen={() => go("ats-candidate", c.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", c.id);
                          setDragging(c.id);
                        }}
                        value={<Stars value={c.rating} />}
                      />
                    ))}
                    {job.backlog[i] > 0 && <p className="m-0 px-1 py-1 text-center text-[11.5px] text-muted">+ {job.backlog[i]} {st.id === "triagem" ? "aguardando triagem" : "nesta etapa"}</p>}
                    {!items.length && !job.backlog[i] && <p className="m-0 rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-muted">Nenhum candidato nesta etapa</p>}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
          )}
        </div>
      </Page>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Adicionar candidato"
        description={`Entra na triagem de ${job.short}. O convite para enviar o currículo vai por e-mail.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={add} disabled={!name.trim()}>
              Adicionar à triagem
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Nome completo" value={name} onChange={setName} />
          <TextField label="E-mail" value={email} onChange={setEmail} placeholder="nome@email.com" optional />
          <Select label="Origem" value={source} onValueChange={(v) => setSource(v as Candidate["source"])} options={["Indicação", "LinkedIn", "Hunting", "Site de carreiras"].map((s) => ({ value: s, label: s }))} />
        </div>
      </Modal>
    </TalentosShell>
  );
}
