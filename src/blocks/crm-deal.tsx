import { CalendarClock, Download, KanbanSquare, Mail, MessageSquare, Phone, Plus, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionMenu,
  ActivityFeed,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  CurrencyField,
  DatePicker,
  Drawer,
  Empty,
  EntityMark,
  FieldBlock,
  FileCard,
  IconButton,
  Lightbox,
  Modal,
  Page,
  PageHeading,
  PropertyList,
  Select,
  SplitLayout,
  StagePath,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TextField,
  areaClass,
  formatCurrency,
  formatBytes,
  formatDate,
  formatNumber,
  formatPercent,
  notify,
  type ActivityItem,
} from "@g4ai/ds";
import { activities, addDeal, companyById, contactById, contacts, daysFromToday, dealById, go, iso, lostReasons, me, repById, reps, stageById, stages, useFrameParam, type Activity, type Deal } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";
import { pdfBlob, saveBlob, saveText } from "./shells/download";

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
      "Duplicar cria a cópia em Qualificação e abre o novo registro; vincular contato com busca",
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

/* Arquivos do negócio: prévia e download gerados no navegador (sem servidor). */
type DealFile = { name: string; size: number; by: string; when: string };
const dealFiles = (d: Deal): DealFile[] => [
  { name: "Proposta v2.pdf", size: 1_240_000, by: repById(d.owner).name, when: iso(-3) },
  { name: "Cálculo de ROI.csv", size: 18_400, by: repById(d.owner).name, when: iso(-5) },
  { name: "Minuta de contrato.doc", size: 84_000, by: "Jurídico", when: iso(-2) },
  { name: "Foto do quadro · workshop.png", size: 912_000, by: repById(d.owner).name, when: iso(-8) },
];
const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const isImage = (f: DealFile) => ["png", "jpg", "jpeg"].includes(extOf(f.name));

/** Imagem de exemplo desenhada com os tokens do tema (segue claro/escuro e a marca). */
function boardImage() {
  // Resolve o token pela cor computada (cobre var(), color-mix e o tema atual).
  const probe = document.createElement("span");
  document.body.append(probe);
  const v = (n: string) => {
    probe.style.color = `var(${n})`;
    return getComputedStyle(probe).color;
  };
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 800;
  const g = c.getContext("2d");
  if (!g) {
    probe.remove();
    return "";
  }
  g.fillStyle = v("--ds-soft");
  g.fillRect(0, 0, 1200, 800);
  g.fillStyle = v("--ds-surface");
  g.fillRect(60, 60, 1080, 680);
  const notes: [number, number, string, string][] = [
    [120, 140, "--ds-accent-soft", "Dor: retrabalho"],
    [420, 140, "--ds-info-soft", "Meta: -30 % prazo"],
    [720, 140, "--ds-ok-soft", "Piloto em 60 dias"],
    [120, 420, "--ds-rose-soft", "Risco: TI interna"],
    [420, 420, "--ds-amber-soft", "Decisor: diretoria"],
    [720, 420, "--ds-accent-soft", "Próximo: escopo"],
  ];
  g.font = "600 30px Figtree, system-ui, sans-serif";
  for (const [x, y, token, label] of notes) {
    g.fillStyle = v(token);
    g.fillRect(x, y, 260, 220);
    g.fillStyle = v("--ds-ink");
    g.fillText(label, x + 22, y + 60, 220);
  }
  probe.remove();
  return c.toDataURL("image/png");
}

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
  const [linking, setLinking] = useState(false);
  const [linkId, setLinkId] = useState("");
  const [preview, setPreview] = useState<DealFile | null>(null);
  const [image, setImage] = useState<{ src: string; file: DealFile } | null>(null);

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
  // Contatos da mesma empresa primeiro; os demais depois (consultor, parceiro).
  const linkOptions = contacts
    .filter((c) => !deal.contactIds.includes(c.id))
    .sort((a, b) => Number(b.companyId === deal.companyId) - Number(a.companyId === deal.companyId))
    .map((c) => ({ value: c.id, label: c.name, description: `${c.role} · ${companyById(c.companyId).name}` }));

  const duplicate = () => {
    const copy = addDeal({ ...deal, id: `d${Date.now()}`, title: `${deal.title} (cópia)`, stage: "qualificacao", age: 0, created: iso(0), close: iso(30), hot: false });
    notify(`Cópia criada em Qualificação: ${copy.title}`);
    go("crm-deal", copy.id);
  };
  const link = () => {
    const p = contactById(linkId);
    if (!linkId) return;
    setDeal((d) => ({ ...d, contactIds: [...d.contactIds, p.id] }));
    log({ action: "vinculou o contato", target: p.name, icon: <Plus /> });
    setLinking(false);
    setLinkId("");
    notify(`${p.name} vinculado ao negócio`, () => setDeal((d) => ({ ...d, contactIds: d.contactIds.filter((x) => x !== p.id) })));
  };

  const files = dealFiles(deal);
  const roi: [string, number, number][] = [
    ["Horas de retrabalho por mês", 320, 120],
    ["Prazo médio de entrega (dias)", 18, 12],
    ["Custo operacional mensal (R$)", Math.round(deal.value / 6), Math.round(deal.value / 9)],
  ];
  const docLines = (f: DealFile) =>
    extOf(f.name) === "pdf"
      ? [`Proposta comercial · ${deal.title}`, `Cliente: ${company.name}`, `Investimento: ${formatCurrency(deal.value, { cents: false })}`, `Previsão de fechamento: ${formatDate(deal.close)}`, `Responsável: ${owner.name}`, "Validade da proposta: 15 dias"]
      : [`Minuta de contrato · ${company.name}`, `Objeto: ${deal.title}`, `Valor global: ${formatCurrency(deal.value, { cents: false })}`, "Vigência: 12 meses, renovação automática", "Foro: comarca de São Paulo (SP)"];
  const openFile = (f: DealFile) => (isImage(f) ? setImage({ src: boardImage(), file: f }) : setPreview(f));
  const download = (f: DealFile) => {
    const ext = extOf(f.name);
    if (isImage(f)) {
      const a = document.createElement("a");
      a.href = image?.file.name === f.name ? image.src : boardImage();
      a.download = f.name;
      a.click();
    } else if (ext === "pdf") saveBlob(f.name, pdfBlob(docLines(f)));
    else if (ext === "csv") {
      saveText(f.name, ["Indicador;Hoje;Com a solução", ...roi.map((r) => r.join(";"))].join("\r\n"), "text/csv");
    } else {
      const html = `<html><head><meta charset="utf-8"><title>${f.name}</title></head><body>${docLines(f).map((l, i) => (i ? `<p>${l}</p>` : `<h1>${l}</h1>`)).join("")}</body></html>`;
      saveBlob(f.name, new Blob([html], { type: "application/msword" }));
    }
    notify(`${f.name} baixado`);
  };

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
                  { label: "Criar proposta", onSelect: () => (location.hash = `/frame/crm-quotes?novo=1&negocio=${deal.id}`) },
                  { label: "Duplicar", onSelect: duplicate },
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
                              <Checkbox hideLabel label={t.title} checked={t.done} onCheckedChange={(v) => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, done: v } : x)))} />
                              <span className={t.done ? "min-w-0 flex-1 text-[13.5px] text-muted line-through" : "min-w-0 flex-1 text-[13.5px]"}>{t.title}</span>
                              <Badge tone={late ? "bad" : "neutral"}>{late ? `Atrasada · ${formatDate(t.due, { short: true })}` : daysFromToday(t.due) === 0 ? "Hoje" : formatDate(t.due, { short: true })}</Badge>
                            </li>
                          );
                        })}
                        {!tasks.length && (
                          <li>
                            <Empty framed={false} title="Nenhuma tarefa" hint="Negócio sem próximo passo esfria. Crie a próxima tarefa no campo acima." />
                          </li>
                        )}
                      </ul>
                    </div>
                  ) : tab === "arquivos" ? (
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {files.map((f) => (
                        <li key={f.name}>
                          <FileCard
                            name={f.name}
                            size={f.size}
                            meta={`${f.by} · ${formatDate(f.when, { short: true })}`}
                            onOpen={() => openFile(f)}
                            actions={
                              <IconButton label={`Baixar ${f.name}`} onClick={() => download(f)}>
                                <Download />
                              </IconButton>
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      <div className="focus-field rounded-xl border border-line bg-surface p-3">
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
                    <Button size="sm" variant="quiet" onClick={() => setLinking(true)}>
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
                    {!people.length && (
                      <li>
                        <Empty framed={false} title="Nenhum contato vinculado" hint="Vincule quem decide e quem influencia." action={<Button size="sm" variant="ghost" onClick={() => setLinking(true)}><Plus /> Vincular contato</Button>} />
                      </li>
                    )}
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

      <Modal
        open={linking}
        onClose={() => setLinking(false)}
        size="sm"
        title="Vincular contato"
        description={`Contatos de ${company.name} aparecem primeiro. O papel na decisão vem do cadastro do contato.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLinking(false)}>
              Cancelar
            </Button>
            <Button onClick={link} disabled={!linkId} disabledReason="Escolha um contato.">
              Vincular contato
            </Button>
          </>
        }
      >
        <Combobox label="Contato" value={linkId} onValueChange={(v: string) => setLinkId(v)} placeholder="Buscar por nome, cargo ou empresa…" options={linkOptions} />
      </Modal>

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
      {/* Prévia de documento: página renderizada + metadados; "Baixar" gera o arquivo de verdade. */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        size="lg"
        kicker="Arquivo do negócio"
        title={preview?.name ?? "Arquivo"}
        description={preview ? `${formatBytes(preview.size)} · enviado por ${preview.by} em ${formatDate(preview.when)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Fechar
            </Button>
            <Button onClick={() => preview && download(preview)}>
              <Download /> Baixar
            </Button>
          </>
        }
      >
        {preview && extOf(preview.name) === "csv" ? (
          <Table label={`Prévia de ${preview.name}`}>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead numeric>Hoje</TableHead>
                <TableHead numeric>Com a solução</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roi.map(([label, now, next]) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell numeric>{formatNumber(now)}</TableCell>
                  <TableCell numeric>{formatNumber(next)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : preview ? (
          <div className="rounded-lg border border-line bg-soft p-4 sm:p-6">
            <div className="mx-auto max-w-[460px] rounded-md border border-line bg-surface px-6 py-7">
              {docLines(preview).map((l, i) =>
                i === 0 ? (
                  <h3 key={l} className="mb-4 text-[15px] font-semibold">{l}</h3>
                ) : (
                  <p key={l} className="mt-1.5 text-[13px] text-ink-soft">{l}</p>
                ),
              )}
              <p className="mt-5 text-[12px] text-muted">Página 1 de {extOf(preview.name) === "pdf" ? 4 : 7}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Lightbox images={image ? [{ src: image.src, alt: image.file.name, caption: `${image.file.name} · ${image.file.by}, ${formatDate(image.file.when)}` }] : []} index={image ? 0 : null} onIndexChange={(i) => i == null && setImage(null)} />
    </CrmShell>
  );
}
