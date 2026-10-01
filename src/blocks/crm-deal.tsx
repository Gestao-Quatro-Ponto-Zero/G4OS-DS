import { CalendarClock, FileText, KanbanSquare, Mail, MessageSquare, Phone, Plus, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionMenu,
  ActivityFeed,
  Avatar,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  CurrencyField,
  DatePicker,
  Drawer,
  EntityMark,
  FieldBlock,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  Select,
  SplitLayout,
  StagePath,
  Tabs,
  TextField,
  areaClass,
  formatCurrency,
  formatDate,
  formatPercent,
  notify,
  type ActivityItem,
} from "@g4ai/ds";
import { activities, companyById, contactById, daysFromToday, dealById, go, iso, lostReasons, me, repById, reps, stageById, stages, useFrameParam, type Activity, type Deal } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Página do negócio",
  description: "Registro de um negócio (?id=): caminho de etapas, ganho/perda com motivo, nota rápida, feed, tarefas, arquivos, edição em gaveta.",
  category: "CRM",
  order: 2,
  height: 1000,
  concept: {
    goal: "Avançar um negócio: ver em que etapa está, registrar o que aconteceu e decidir ganho ou perda.",
    patterns: [
      "Anatomia C · Registro: trilha + título + Perdido/Ganho fixos; propriedades fixas à direita",
      "StagePath clicável; perda pede motivo",
      "Nota rápida alimenta o feed de atividade",
      "Edição longa em gaveta (Drawer)",
    ],
    adapt: [
      "Proposta (ATS), pedido (ERP), chamado (suporte)",
    ],
    avoid: [
      "Ganho/perda sem motivo (perde o dado para o painel)",
    ],
  },
} as const;

const here = "#/frame/crm-pipeline"; // item ativo na navegação

const feedFor = (d: Deal): ActivityItem[] => {
  const owner = repById(d.owner);
  const main = contactById(d.contactIds[0]);
  return [
    { id: "f1", actor: owner, action: "moveu para", target: stageById(d.stage).label, time: d.age === 0 ? "Hoje" : `Há ${d.age} dias`, icon: <KanbanSquare /> },
    ...(d.contactIds.length
      ? [
          {
            id: "f2",
            actor: owner,
            action: "registrou uma ligação com",
            target: main.name,
            time: "Ontem, 16:40 · 22 min",
            icon: <Phone />,
            quote: `${main.name.split(" ")[0]} confirmou interesse. Próximo passo: validar escopo e prazo de implantação com a diretoria.`,
          },
          { id: "f3", actor: { name: main.name, initials: main.initials, tint: main.tint }, action: "abriu a proposta", target: "Proposta v2.pdf", time: "Há 3 dias", icon: <Mail /> },
        ]
      : []),
    { id: "f4", actor: owner, action: "criou o negócio a partir de", target: d.source, time: formatDate(d.created, { short: true }), icon: <Plus /> },
  ];
};

export default function CrmDeal() {
  const id = useFrameParam("id");
  const base = dealById(id);
  const [deal, setDeal] = useState(base);
  const [outcome, setOutcome] = useState<{ tone: "ok" | "bad"; label: string } | undefined>();
  const [tab, setTab] = useState("atividade");
  const [note, setNote] = useState("");
  const [feed, setFeed] = useState(() => feedFor(base));
  const [tasks, setTasks] = useState<Activity[]>(() => activities.filter((a) => a.dealId === base.id));
  const [newTask, setNewTask] = useState("");
  const [lostOpen, setLostOpen] = useState(false);
  const [reason, setReason] = useState(lostReasons[0].label);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(base);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Outro ?id= na mesma tela (ex.: busca ⌘K): recarrega o registro.
  useEffect(() => {
    setDeal(base);
    setDraft(base);
    setOutcome(undefined);
    setFeed(feedFor(base));
    setTasks(activities.filter((a) => a.dealId === base.id));
  }, [base]);

  const company = companyById(deal.companyId);
  const owner = repById(deal.owner);
  const people = useMemo(() => deal.contactIds.map(contactById), [deal]);
  const overdue = tasks.filter((t) => !t.done && daysFromToday(t.due) < 0).length;

  const log = (item: Omit<ActivityItem, "id" | "actor" | "time">) => setFeed((f) => [{ id: `n${Date.now()}`, actor: repById(me), time: "Agora", ...item }, ...f]);
  const addNote = () => {
    if (!note.trim()) return;
    log({ action: "adicionou uma nota", icon: <MessageSquare />, quote: note.trim() });
    setNote("");
    notify("Nota adicionada");
  };
  const setStage = (s: string) => {
    const prev = deal.stage;
    setDeal((d) => ({ ...d, stage: s as Deal["stage"], age: 0 }));
    log({ action: "moveu para", target: stageById(s).label, icon: <KanbanSquare /> });
    notify(`Etapa: ${stageById(s).label}`, () => setDeal((d) => ({ ...d, stage: prev })));
  };

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          crumbs={[{ label: "Pipeline", href: "#/frame/crm-pipeline" }, { label: company.name, href: `#/frame/crm-company?id=${company.id}` }]}
          title={deal.title}
          description={`${company.name} · aberto há ${-daysFromToday(deal.created)} dias · previsão de fechamento em ${formatDate(deal.close)}`}
          actions={
            <>
              {!outcome && (
                <Button variant="ghost" onClick={() => setLostOpen(true)}>
                  <X /> Perdido
                </Button>
              )}
              {!outcome ? (
                <Button
                  onClick={() => {
                    setDeal((d) => ({ ...d, stage: "fechamento" }));
                    setOutcome({ tone: "ok", label: "Ganho" });
                    log({ action: "marcou como ganho", icon: <Trophy /> });
                    notify(`Negócio ganho: ${formatCurrency(deal.value, { cents: false })}`, () => setOutcome(undefined));
                  }}
                >
                  <Trophy /> Marcar como ganho
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setOutcome(undefined)}>
                  Reabrir negócio
                </Button>
              )}
              <ActionMenu
                actions={[
                  { label: "Editar negócio", onSelect: () => setEditOpen(true) },
                  { label: "Duplicar", onSelect: () => notify("Exemplo: cria uma cópia em Qualificação.", undefined, "info") },
                  { label: "Excluir negócio", tone: "danger", separator: true, onSelect: () => setConfirmDelete(true) },
                ]}
              />
            </>
          }
        />

        <StagePath className="mt-5" stages={stages} current={deal.stage} onSelect={outcome ? undefined : setStage} outcome={outcome} label="Etapa do negócio" />

        <div className="mt-8">
          <SplitLayout
            asideWidth={340}
            main={
              <>
                <Tabs
                  label="Seções do negócio"
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: "atividade", label: "Atividade" },
                    { id: "tarefas", label: "Tarefas", count: overdue },
                    { id: "arquivos", label: "Arquivos" },
                  ]}
                />
                <div className="mt-5">
                  {tab === "tarefas" ? (
                    <div className="space-y-3">
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!newTask.trim()) return;
                          setTasks((t) => [{ id: `t${Date.now()}`, type: "tarefa", title: newTask.trim(), due: iso(1), owner: me, dealId: deal.id, companyId: deal.companyId, done: false }, ...t]);
                          setNewTask("");
                          notify("Tarefa criada para amanhã");
                        }}
                      >
                        <TextField aria-label="Nova tarefa" placeholder="Nova tarefa para este negócio…" value={newTask} onChange={setNewTask} className="flex-1" />
                        <Button type="submit" variant="ghost" disabled={!newTask.trim()}>
                          <Plus /> Adicionar
                        </Button>
                      </form>
                      <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0">
                        {tasks.map((t) => {
                          const late = !t.done && daysFromToday(t.due) < 0;
                          return (
                            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                              <Checkbox label={t.title} checked={t.done} onCheckedChange={(v) => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: v } : x)))} />
                              <span className={t.done ? "min-w-0 flex-1 text-[13.5px] text-muted line-through" : "min-w-0 flex-1 text-[13.5px]"}>{t.title}</span>
                              <Badge tone={late ? "bad" : "neutral"}>{late ? `Atrasada · ${formatDate(t.due, { short: true })}` : daysFromToday(t.due) === 0 ? "Hoje" : formatDate(t.due, { short: true })}</Badge>
                            </li>
                          );
                        })}
                        {!tasks.length && <li className="px-4 py-8 text-center text-[13px] text-muted">Nenhuma tarefa. Crie o próximo passo acima.</li>}
                      </ul>
                    </div>
                  ) : tab === "arquivos" ? (
                    <ul className="m-0 list-none divide-y divide-line rounded-xl border border-line bg-surface p-0 text-[13.5px]">
                      {[
                        ["Proposta v2.pdf", "1,2 MB"],
                        ["Minuta de contrato.docx", "84 KB"],
                        ["Escopo de implantação.pdf", "640 KB"],
                      ].map(([f, size]) => (
                        <li key={f}>
                          <button type="button" onClick={() => notify(`Exemplo: abre a prévia de ${f}.`, undefined, "info")} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-soft/50">
                            <FileText className="h-4 w-4 text-muted" />
                            <span className="flex-1">{f}</span>
                            <span className="text-[12px] text-muted">{size}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div className="rounded-xl border border-line bg-surface p-3">
                        <label htmlFor="deal-note" className="sr-only">
                          Nova nota
                        </label>
                        <textarea
                          id="deal-note"
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Registre uma nota, ligação ou próximo passo…"
                          className={`${areaClass} resize-none border-0 px-1 shadow-none focus-visible:shadow-none`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                          <div className="flex gap-1 text-muted">
                            <Button size="sm" variant="quiet" onClick={() => (log({ action: "registrou uma ligação com", target: people[0]?.name ?? company.name, icon: <Phone /> }), notify("Ligação registrada"))}>
                              <Phone /> Ligação
                            </Button>
                            <Button size="sm" variant="quiet" onClick={() => (log({ action: "enviou e-mail para", target: people[0]?.name ?? company.name, icon: <Mail /> }), notify("E-mail registrado"))}>
                              <Mail /> E-mail
                            </Button>
                          </div>
                          <Button size="sm" onClick={addNote} disabled={!note.trim()}>
                            Salvar nota
                          </Button>
                        </div>
                      </div>
                      <ActivityFeed className="mt-6" items={feed} />
                    </>
                  )}
                </div>
              </>
            }
            aside={
              <>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="m-0 text-[13px] font-medium">Detalhes</h2>
                    <Button size="sm" variant="quiet" onClick={() => setEditOpen(true)}>
                      Editar
                    </Button>
                  </div>
                  <PropertyList
                    items={[
                      { label: "Valor", value: <span className="font-semibold tabular-nums">{formatCurrency(deal.value)}</span>, hint: deal.note },
                      { label: "Probabilidade", value: formatPercent(stageById(deal.stage).probability, 0) },
                      { label: "Fechamento previsto", value: formatDate(deal.close) },
                      { label: "Responsável", value: owner.name },
                      { label: "Origem", value: deal.source },
                      { label: "Concorrente", value: deal.competitor },
                    ]}
                  />
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <a href={`#/frame/crm-company?id=${company.id}`} className="flex items-center gap-3 rounded-lg hover:bg-soft/50">
                    <EntityMark name={company.name} tint={company.tint} className="h-9 w-9 text-[12px]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{company.name}</div>
                      <div className="truncate text-[12px] text-muted">
                        {company.industry} · {company.city}
                      </div>
                    </div>
                  </a>
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="m-0 text-[13px] font-medium">Contatos</h2>
                    <Button size="sm" variant="quiet" onClick={() => notify("Exemplo: busca contatos da empresa para vincular.", undefined, "info")}>
                      <Plus /> Adicionar
                    </Button>
                  </div>
                  <ul className="m-0 list-none space-y-1 p-0">
                    {people.map((c) => (
                      <li key={c.id}>
                        <a href={`#/frame/crm-contact?id=${c.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-soft/60">
                          <Avatar initials={c.initials} tint={c.tint} name={c.name} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium">{c.name}</div>
                            <div className="truncate text-[12px] text-muted">{c.role}</div>
                          </div>
                          {c.tag && <Badge tone={c.tag.startsWith("Decisor") ? "accent" : "neutral"}>{c.tag}</Badge>}
                        </a>
                      </li>
                    ))}
                    {!people.length && <li className="text-[12.5px] text-muted">Nenhum contato vinculado.</li>}
                  </ul>
                </section>
                <section className="rounded-xl border border-line bg-surface px-4 py-4">
                  <h2 className="m-0 mb-3 flex items-center gap-2 text-[13px] font-medium">
                    <CalendarClock className="h-4 w-4 text-muted" /> Próxima atividade
                  </h2>
                  {tasks.find((t) => !t.done) ? (
                    <p className="m-0 text-[13px]">
                      {tasks.find((t) => !t.done)!.title}
                      <span className="block text-[12px] text-muted">{formatDate(tasks.find((t) => !t.done)!.due)}</span>
                    </p>
                  ) : (
                    <p className="m-0 text-[12.5px] text-muted">Sem próxima atividade. Negócio sem próximo passo esfria.</p>
                  )}
                </section>
              </>
            }
          />
        </div>
      </Page>

      <Modal
        open={lostOpen}
        onClose={() => setLostOpen(false)}
        size="sm"
        title="Marcar como perdido"
        description="O motivo alimenta o relatório “Por que perdemos?” do painel."
        footer={
          <>
            <Button variant="ghost" onClick={() => setLostOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setOutcome({ tone: "bad", label: "Perdido" });
                log({ action: "marcou como perdido:", target: reason, icon: <X /> });
                setLostOpen(false);
                notify("Negócio marcado como perdido", () => setOutcome(undefined), "info");
              }}
            >
              Marcar como perdido
            </Button>
          </>
        }
      >
        <FieldBlock label="Motivo da perda">
          <Select label="Motivo da perda" value={reason} onValueChange={setReason} options={lostReasons.map((r) => ({ value: r.label, label: r.label }))} />
        </FieldBlock>
      </Modal>

      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        kicker={company.name}
        title="Editar negócio"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const prev = deal;
                setDeal(draft);
                setEditOpen(false);
                notify("Negócio atualizado", () => setDeal(prev));
              }}
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Título" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
          <CurrencyField label="Valor" value={draft.value} onChange={(v) => setDraft((d) => ({ ...d, value: v ?? 0 }))} />
          <FieldBlock label="Fechamento previsto">
            <DatePicker label="Fechamento previsto" value={draft.close} onValueChange={(v) => setDraft((d) => ({ ...d, close: v }))} min={iso(0)} />
          </FieldBlock>
          <FieldBlock label="Responsável">
            <Select label="Responsável" value={draft.owner} onValueChange={(v) => setDraft((d) => ({ ...d, owner: v }))} options={reps.map((r) => ({ value: r.id, label: r.name }))} />
          </FieldBlock>
          <TextField label="Concorrente" optional value={draft.competitor ?? ""} onChange={(v) => setDraft((d) => ({ ...d, competitor: v || undefined }))} />
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          notify(`Negócio “${deal.title}” excluído`);
          go("crm-pipeline");
        }}
        title={`Excluir o negócio “${deal.title}”?`}
        description="O histórico, as tarefas e os arquivos deste negócio serão apagados. Isso não pode ser desfeito."
        confirmLabel="Excluir negócio"
        tone="danger"
      />
    </CrmShell>
  );
}
