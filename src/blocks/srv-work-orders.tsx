import { CalendarDays, FileText, Wrench } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  Combobox,
  DataTable,
  DatePicker,
  Drawer,
  Empty,
  EmptyFilterResult,
  FilterBar,
  Highlight,
  InlineSelect,
  KanbanBoard,
  KanbanColumn,
  Modal,
  OperationButton,
  OperationFeedback,
  Page,
  PageHeading,
  RecordCard,
  SegmentedControl,
  Select,
  Skeleton,
  TableSearch,
  TextField,
  TextareaField,
  chartColor,
  formatCurrency,
  notify,
  useFilters,
  useOperation,
  type Column,
  type FilterField,
} from "@g4ai/ds";
import { checklistFor, clientById, clients, contracts, iso, isOpen, priorityInfo, slaOf, techById, technicians, woStageLabel, woStages, woValue, workOrders as seed, type Priority, type WoKind, type WoStage, type WorkOrder } from "./data/servicos";
import { frameHref, go, setFrameQuery, useFrameParam } from "./shells/frame-route";
import { LoadError, ScheduleDialog, ServicosShell, useListState, type ScheduleChoice } from "./shells/servicos-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Ordens de serviço",
  description: "Quadro de OS por etapa (Aberta → Agendada → Em execução → Concluída → Faturada) com técnico, cliente, SLA e prioridade; alternador para lista. Arrastar para Agendada pede técnico e horário; para Faturada, confirma a NFS-e. Abrir OS em gaveta (?nova=1).",
  category: "Serviços",
  order: 3,
  height: 900,
  concept: {
    goal: "Ver toda a operação de campo num olhar: o que está sem técnico, o que vai estourar o SLA e o que já pode ser faturado.",
    patterns: [
      "Anatomia E · Quadro: colunas por etapa; no desktop a página não rola",
      "Card com SLA em palavra (Atrasada 1 d, Vence hoje 16:00); borda vermelha só no estourado",
      "Arrastar muda a etapa; Agendada pede técnico e horário em Modal; Faturada confirma a NFS-e",
      "Totais por coluna no cabeçalho (atrasadas, valor a faturar)",
      "Alternar Quadro/Lista sem perder filtros; etapa inline na lista",
      "Abrir OS em Drawer (?nova=1); card abre o registro",
      "Cinco estados: ?estado=carregando|vazio|erro simula; vazio por filtro com Limpar",
    ],
    adapt: [
      "Chamados de suporte, entregas de uma transportadora, obras por fase",
    ],
    avoid: [
      "Status por botões dentro do card",
      "Cor de prioridade sem palavra",
    ],
  },
} as const;

const fields: FilterField<WorkOrder>[] = [
  { key: "tech", label: "Técnico", type: "person", quick: true, accessor: (w) => w.techId ?? "", options: technicians.map((t) => ({ value: t.id, label: t.name })) },
  { key: "priority", label: "Prioridade", type: "enum", quick: true, accessor: (w) => w.priority, options: (Object.keys(priorityInfo) as Priority[]).map((p) => ({ value: p, label: priorityInfo[p].label })) },
  { key: "kind", label: "Tipo", type: "enum", accessor: (w) => w.kind, options: ["Corretiva", "Preventiva", "Instalação", "Chamado de TI", "Emergencial"].map((v) => ({ value: v, label: v })) },
  { key: "due", label: "Prazo do SLA", type: "date", accessor: (w) => w.due },
  { key: "client", label: "Cliente", type: "text", accessor: (w) => clientById(w.clientId).name },
];
const searchText = (w: WorkOrder) => [w.number, w.title, clientById(w.clientId).name, w.site];

export default function SrvWorkOrders() {
  const estado = useListState();
  const nova = useFrameParam("nova");
  const [list, setList] = useState<WorkOrder[]>(() => (estado === "vazio" ? [] : seed));
  const [view, setView] = useState<"quadro" | "lista">("quadro");
  const filters = useFilters(list, { fields, search: searchText });
  const q = filters.state.query;
  const [dragging, setDragging] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<WorkOrder | null>(null);
  const [billing, setBilling] = useState<WorkOrder | null>(null);
  const bill = useOperation({ busyLabel: "Emitindo NFS-e…" });

  const patch = (id: string, p: Partial<WorkOrder>) => setList((all) => all.map((w) => (w.id === id ? { ...w, ...p } : w)));
  const move = (id: string, stage: WoStage) => {
    const w = list.find((x) => x.id === id);
    if (!w || w.stage === stage) return;
    if (stage === "agendada" && !w.techId) return setScheduling(w);
    if (stage === "faturada") {
      if (w.stage !== "concluida") return notify(`${w.number} ainda não foi concluída: só OS concluídas e assinadas são faturadas`, undefined, "info");
      return setBilling(w);
    }
    const before = w.stage;
    patch(id, { stage });
    notify(`${w.number} foi para ${woStageLabel(stage)}`, () => patch(id, { stage: before }));
  };
  const drop = (stage: WoStage) => (e: DragEvent) => {
    move(e.dataTransfer.getData("text/plain") || dragging || "", stage);
    setDragging(null);
  };

  const rows = filters.rows;
  const columns: Column<WorkOrder>[] = [
    {
      key: "os",
      header: "OS",
      primary: true,
      cell: (w) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium">
            <Highlight text={w.title} query={q} />
          </span>
          <span className="block text-[11.5px] text-muted">
            <span className="font-mono">
              <Highlight text={w.number} query={q} />
            </span>{" "}
            · {w.kind}
          </span>
        </span>
      ),
    },
    { key: "client", header: "Cliente", cell: (w) => <Highlight text={clientById(w.clientId).name} query={q} /> },
    {
      key: "tech",
      header: "Técnico",
      nowrap: true,
      cell: (w) => {
        const t = techById(w.techId);
        return t ? (
          <span className="flex items-center gap-2">
            <Avatar initials={t.initials} tint={t.tint} name={t.name} size="sm" />
            {t.name.split(" ")[0]}
          </span>
        ) : (
          <span className="text-amber">Sem técnico</span>
        );
      },
    },
    { key: "priority", header: "Prioridade", nowrap: true, mobileHidden: true, cell: (w) => <Badge tone={priorityInfo[w.priority].tone}>{priorityInfo[w.priority].label}</Badge> },
    { key: "sla", header: "SLA", nowrap: true, cell: (w) => <span className={slaOf(w).late ? "font-medium text-rose" : slaOf(w).tone === "warn" ? "text-amber" : "text-muted"}>{slaOf(w).label}</span> },
    { key: "stage", header: "Etapa", action: true, cell: (w) => <InlineSelect label={`Etapa de ${w.number}`} value={w.stage} onValueChange={(v) => move(w.id, v)} options={woStages.map((s) => ({ value: s.id, label: s.label }))} /> },
  ];

  return (
    <ServicosShell section="os">
      <Page className="flex flex-col">
        <PageHeading
          title="Ordens de serviço"
          description="Arraste o card para mudar a etapa. Concluída com assinatura do cliente pode ser faturada."
          actions={
            <>
              <SegmentedControl label="Visualização" value={view} onChange={setView} options={[{ value: "quadro", label: "Quadro" }, { value: "lista", label: "Lista" }]} />
              <Button variant="ghost" href={frameHref("srv-schedule")}>
                <CalendarDays /> Agenda
              </Button>
              <Button onClick={() => setFrameQuery({ nova: "1" })}>
                <Wrench /> Abrir OS
              </Button>
            </>
          }
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {estado !== "carregando" && estado !== "erro" && list.length > 0 && <FilterBar filters={filters} noun="OS" nounPlural="OS" search={<TableSearch value={q} onChange={filters.setQuery} total={list.length} noun="OS" nounPlural="OS" searchIn="número, título, cliente e local" />} />}
          {estado === "carregando" ? (
            <div className="flex min-h-[520px] gap-3 overflow-hidden" aria-busy="true" aria-label="Carregando ordens de serviço">
              {woStages.map((st, i) => (
                <div key={st.id} className="w-[236px] shrink-0 space-y-2 rounded-xl bg-soft p-2">
                  <Skeleton className="h-4 w-24" />
                  {Array.from({ length: 3 - (i % 2) }, (_, k) => (
                    <div key={k} className="space-y-2 rounded-lg border border-line bg-surface p-3">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : estado === "erro" ? (
            <LoadError what="as ordens de serviço" />
          ) : !list.length ? (
            <Empty
              title="Nenhuma ordem de serviço"
              hint="Abra uma OS quando um cliente pedir atendimento, ou aprove um orçamento para gerar a primeira."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="ghost" href={frameHref("srv-quotes")}>
                    Ver orçamentos
                  </Button>
                  <Button onClick={() => setFrameQuery({ nova: "1" })}>
                    <Wrench /> Abrir OS
                  </Button>
                </div>
              }
            />
          ) : !rows.length ? (
            <EmptyFilterResult filters={filters} noun="OS" nounPlural="OS" gender="f" framed />
          ) : view === "lista" ? (
            <DataTable label="Ordens de serviço" rows={rows} columns={columns} rowKey={(w) => w.id} onRowClick={(w) => go("srv-work-order", w.id)} rowLabel={(w) => `Abrir ${w.number}`} rowTone={(w) => (slaOf(w).late ? "bad" : undefined)} />
          ) : (
            <KanbanBoard className="min-h-[520px] flex-1" label="Ordens de serviço por etapa">
              {woStages.map((st, i) => {
                const items = rows.filter((w) => w.stage === st.id);
                const late = items.filter((w) => slaOf(w).late).length;
                const meta =
                  st.id === "concluida"
                    ? `${formatCurrency(items.reduce((s, w) => s + woValue(w), 0), { compact: true })} a faturar`
                    : st.id === "faturada"
                      ? formatCurrency(items.reduce((s, w) => s + woValue(w), 0), { compact: true })
                      : late
                        ? `${late} atrasada${late > 1 ? "s" : ""}`
                        : undefined;
                return (
                  <KanbanColumn key={st.id} title={st.label} count={items.length} dotColor={chartColor(i)} meta={meta} onDrop={drop(st.id)} width={236}>
                    {items.map((w) => {
                      const t = techById(w.techId);
                      const sla = slaOf(w);
                      return (
                        <RecordCard
                          key={w.id}
                          title={w.title}
                          subtitle={
                            <>
                              <span className="font-mono">{w.number}</span> · {clientById(w.clientId).name}
                            </>
                          }
                          tags={
                            <>
                              {(w.priority === "alta" || w.priority === "urgente") && <Badge tone={priorityInfo[w.priority].tone}>{priorityInfo[w.priority].label}</Badge>}
                              <Badge>{w.kind}</Badge>
                              {!t && isOpen(w) && <Badge tone="warn">Sem técnico</Badge>}
                            </>
                          }
                          owner={t ? { name: t.name, initials: t.initials, tint: t.tint } : undefined}
                          meta={<span className={sla.late ? "font-medium text-rose" : sla.tone === "warn" ? "text-amber" : undefined}>{isOpen(w) ? sla.label : w.signedBy ? `Assinada por ${w.signedBy.split(" ")[0]}` : "Sem assinatura"}</span>}
                          value={w.stage === "concluida" || w.stage === "faturada" ? <span className="tabular-nums">{woValue(w) ? formatCurrency(woValue(w)) : "Coberta pelo contrato"}</span> : undefined}
                          tone={sla.late ? "bad" : undefined}
                          onOpen={() => go("srv-work-order", w.id)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", w.id);
                            setDragging(w.id);
                          }}
                        />
                      );
                    })}
                    {!items.length && <p className="m-0 rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-muted">Nenhuma OS nesta etapa</p>}
                  </KanbanColumn>
                );
              })}
            </KanbanBoard>
          )}
        </div>
      </Page>

      {scheduling && (
        <ScheduleDialog
          wo={scheduling}
          open
          onClose={() => setScheduling(null)}
          onConfirm={(c: ScheduleChoice) => patch(scheduling.id, { stage: "agendada", techId: c.techId, schedule: { date: c.date, start: c.start, end: c.end } })}
        />
      )}
      <Modal
        open={!!billing}
        onClose={() => setBilling(null)}
        size="sm"
        title={billing ? `Faturar ${billing.number}?` : "Faturar OS"}
        description="Gera a NFS-e na Prefeitura de São Paulo e a cobrança (boleto ou Pix) no vencimento do cliente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBilling(null)} disabled={bill.busy}>
              Cancelar
            </Button>
            <OperationButton
              operation={bill}
              onClick={() => {
                if (!billing) return;
                const w = billing;
                void bill.run(() => new Promise((r) => setTimeout(r, 800)), { message: `${w.number} faturada · NFS-e enviada à prefeitura`, undo: () => patch(w.id, { stage: "concluida" }) }, { apply: () => patch(w.id, { stage: "faturada" }), revert: () => patch(w.id, { stage: "concluida" }) }).then((err) => !err && setBilling(null));
              }}
            >
              <FileText /> Faturar e emitir NFS-e
            </OperationButton>
          </>
        }
      >
        <OperationFeedback operation={bill} />
        {billing && (
          <p className="m-0 text-[13.5px]">
            {clientById(billing.clientId).name} · <span className="font-semibold tabular-nums">{woValue(billing) ? formatCurrency(woValue(billing)) : "só materiais (mão de obra coberta pelo contrato)"}</span>
          </p>
        )}
      </Modal>
      <NewWorkOrder
        open={nova === "1"}
        number={`OS-${3195 + list.length - seed.length}`}
        onClose={() => setFrameQuery({ nova: undefined })}
        onCreate={(w) => {
          setList((all) => [w, ...all]);
          setFrameQuery({ nova: undefined });
        }}
      />
    </ServicosShell>
  );
}

function NewWorkOrder({ open, number, onClose, onCreate }: { open: boolean; number: string; onClose: () => void; onCreate: (w: WorkOrder) => void }) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<WoKind>("Corretiva");
  const [priority, setPriority] = useState<Priority>("media");
  const [due, setDue] = useState(iso(1));
  const [site, setSite] = useState("");
  const [description, setDescription] = useState("");
  const [techId, setTechId] = useState("");
  const [tried, setTried] = useState(false);
  const op = useOperation({ busyLabel: "Abrindo OS…" });
  const contract = useMemo(() => contracts.find((k) => k.clientId === clientId && (k.status === "ativo" || k.status === "renovar" || k.status === "implantacao")), [clientId]);

  const submit = () => {
    setTried(true);
    if (!clientId || !title.trim()) return;
    const w: WorkOrder = {
      id: `w${Date.now()}`,
      number,
      clientId,
      title: title.trim(),
      kind,
      stage: "aberta",
      priority,
      techId: techId || undefined,
      openedAt: iso(0),
      due,
      dueTime: "18:00",
      contractId: contract?.id,
      site: site.trim() || clientById(clientId).address,
      description: description.trim() || title.trim(),
      checklist: checklistFor(kind, 0),
      hours: [],
      materials: [],
      covered: !!contract,
      photos: 0,
    };
    void op.run(() => new Promise((r) => setTimeout(r, 600)), `${number} aberta para ${clientById(clientId).name}`).then((err) => {
      if (err) return;
      onCreate(w);
      setClientId("");
      setTitle("");
      setDescription("");
      setSite("");
      setTechId("");
      setTried(false);
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      kicker={number}
      title="Abrir ordem de serviço"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={op.busy}>
            Cancelar
          </Button>
          <OperationButton operation={op} onClick={submit}>
            <Wrench /> Abrir OS
          </OperationButton>
        </>
      }
    >
      <div className="space-y-4">
        <OperationFeedback operation={op} />
        <Combobox label="Cliente" placeholder="Busque por nome ou CNPJ" value={clientId} onValueChange={setClientId} options={clients.filter((k) => k.status !== "inativo").map((k) => ({ value: k.id, label: k.name, description: `${k.cnpj} · ${k.district}` }))} error={tried && !clientId ? "Escolha o cliente." : undefined} />
        {clientId && (
          <p className="m-0 -mt-2 text-[12px] text-muted">
            {contract ? `Coberta pelo ${contract.number} (${contract.plan}) · SLA ${contract.sla}. Mão de obra não fatura.` : "Cliente sem contrato ativo: horas e materiais são faturados."}
          </p>
        )}
        <TextField label="O que precisa ser feito" value={title} onChange={setTitle} placeholder="Ex.: Tomada da recepção em curto" error={tried && !title.trim() ? "Descreva o problema em uma linha." : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Tipo" value={kind} onValueChange={(v) => setKind(v as WoKind)} options={["Corretiva", "Preventiva", "Instalação", "Chamado de TI", "Emergencial"].map((v) => ({ value: v, label: v }))} />
          <Select label="Prioridade" value={priority} onValueChange={(v) => setPriority(v as Priority)} options={(Object.keys(priorityInfo) as Priority[]).map((p) => ({ value: p, label: priorityInfo[p].label }))} />
        </div>
        <DatePicker label="Prazo do SLA" value={due} onValueChange={setDue} min={iso(0)} hint={contract ? `Contrato: ${contract.sla}` : undefined} />
        <TextField label="Local do atendimento" optional value={site} onChange={setSite} placeholder="Ex.: Bloco B · casa de bombas" hint="Sem local, usamos o endereço do cliente." />
        <Select label="Técnico" optional value={techId} onValueChange={setTechId} placeholder="Alocar depois, pela agenda" options={technicians.map((t) => ({ value: t.id, label: t.name, description: t.skill, disabled: t.status === "offline" }))} />
        <TextareaField label="Detalhes" optional value={description} onChange={setDescription} autosize minRows={3} placeholder="Como o cliente descreveu, acesso ao local, contato no dia…" />
      </div>
    </Drawer>
  );
}
