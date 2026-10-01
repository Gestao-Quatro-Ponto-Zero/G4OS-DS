import { CalendarDays, CheckSquare, List, Mail, Phone, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  EmptyFilterResult,
  FieldBlock,
  FieldGrid,
  FilterBar,
  Highlight,
  Modal,
  Page,
  PageHeading,
  SegmentedControl,
  Select,
  TableSearch,
  TextField,
  cn,
  formatDate,
  notify,
  useFilters,
  type FilterField, PageToolbar
} from "@g4ai/ds";
import { activities as initial, activityLabel, companies, companyById, daysFromToday, dealById, iso, me, repById, reps, today, useFrameParam, type Activity, type ActivityType } from "./data/crm";
import { CrmShell } from "./shells/crm-shell";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Atividades e agenda",
  description: "Tarefas, ligações, reuniões e e-mails agrupados por prazo (atrasadas primeiro) ou na semana, com conclusão rápida, filtros e nova atividade.",
  category: "CRM",
  order: 7,
  height: 900,
  concept: {
    goal: "Não deixar follow-up cair: ver o que está atrasado, o que é hoje e fechar rápido.",
    patterns: [
      "Anatomia A · Lista: cabeçalho fixo + PageToolbar colada",
      "Agrupado por prazo (atrasadas primeiro) ou por semana",
      "Conclusão rápida na linha; nova atividade em modal",
    ],
    adapt: [
      "Tarefas do ATS (entrevistas, retornos), cobranças do financeiro",
    ],
    avoid: [
      "Ordenar por criação em vez de prazo",
    ],
  },
} as const;

const here = "#/frame/crm-activities";
const typeIcon: Record<ActivityType, ReactNode> = { ligacao: <Phone />, reuniao: <Users />, email: <Mail />, tarefa: <CheckSquare /> };
const types = Object.keys(activityLabel) as ActivityType[];

const fields: FilterField<Activity>[] = [
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (a) => a.owner, options: reps.map((r) => ({ value: r.id, label: r.name })) },
  { key: "type", label: "Tipo", type: "enum", quick: true, accessor: (a) => a.type, options: types.map((t) => ({ value: t, label: activityLabel[t] })) },
  { key: "due", label: "Prazo", type: "date", accessor: (a) => a.due },
  { key: "company", label: "Empresa", type: "enum", accessor: (a) => a.companyId, options: companies.map((c) => ({ value: c.id, label: c.name })) },
];

const groupOf = (a: Activity) => {
  if (a.done) return "Concluídas";
  const d = daysFromToday(a.due);
  return d < 0 ? "Atrasadas" : d === 0 ? "Hoje" : d === 1 ? "Amanhã" : "Próximos dias";
};
const groupOrder = ["Atrasadas", "Hoje", "Amanhã", "Próximos dias", "Concluídas"];

export default function CrmActivities() {
  const [items, setItems] = useState(initial);
  const [view, setView] = useState<"lista" | "semana">("lista");
  const [creating, setCreating] = useState(false);
  const novo = useFrameParam("novo");
  useEffect(() => {
    if (novo) setCreating(true);
  }, [novo]);
  const filters = useFilters(items, {
    fields,
    search: (a) => [a.title, companyById(a.companyId).name, repById(a.owner).name],
    me,
    now: today,
    url: true,
    initial: { query: "", conditions: [{ id: "mine", field: "owner", op: "is", value: [me] }] },
  });
  const q = filters.state.query;
  const groups = useMemo(() => groupOrder.map((g) => ({ label: g, items: filters.rows.filter((a) => groupOf(a) === g).sort((a, b) => a.due.localeCompare(b.due) || (a.time ?? "").localeCompare(b.time ?? "")) })).filter((g) => g.items.length), [filters.rows]);

  const toggle = (a: Activity) => {
    setItems((all) => all.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)));
    if (!a.done) notify(`“${a.title}” concluída`, () => setItems((all) => all.map((x) => (x.id === a.id ? { ...x, done: false } : x))));
  };

  // Semana atual (segunda a domingo)
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return iso(Math.round((d.getTime() - today.getTime()) / 86400000));
  });

  const row = (a: Activity) => {
    const d = daysFromToday(a.due);
    const deal = a.dealId ? dealById(a.dealId) : undefined;
    const company = companyById(a.companyId);
    const when = d === 0 ? `Hoje${a.time ? ` · ${a.time}` : ""}` : `${formatDate(a.due, { short: true })}${a.time ? ` · ${a.time}` : ""}`;
    return (
      <li key={a.id} className="flex items-start gap-3 px-4 py-3">
        <Checkbox hideLabel label={`Concluir ${a.title}`} checked={a.done} onCheckedChange={() => toggle(a)} className="mt-0.5" />
        <span className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-md bg-soft text-muted [&_svg]:h-3.5 [&_svg]:w-3.5" title={activityLabel[a.type]}>
          {typeIcon[a.type]}
        </span>
        <div className="min-w-0 flex-1">
          <Highlight text={a.title} query={q} className={cn("block text-[13.5px]", a.done ? "text-muted line-through" : "font-medium")} />
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] text-muted">
            <a href={`#/frame/crm-company?id=${company.id}`} className="hover:text-ink hover:underline">
              {company.name}
            </a>
            {deal && (
              <>
                <span aria-hidden>·</span>
                <a href={`#/frame/crm-deal?id=${deal.id}`} className="hover:text-ink hover:underline">
                  {deal.title}
                </a>
              </>
            )}
          </div>
          {/* No celular, prazo e responsável descem para baixo do título. */}
          <div className="mt-2 flex items-center gap-2 sm:hidden">
            <Badge tone={!a.done && d < 0 ? "bad" : d === 0 && !a.done ? "accent" : "neutral"}>{when}</Badge>
            <span className="text-[12px] text-muted">{repById(a.owner).name.split(" ")[0]}</span>
          </div>
        </div>
        <span className="hidden sm:inline-flex">
          <Avatar {...repById(a.owner)} size="sm" name={repById(a.owner).name} />
        </span>
        <span className="hidden shrink-0 sm:block">
          <Badge tone={!a.done && d < 0 ? "bad" : d === 0 && !a.done ? "accent" : "neutral"}>{when}</Badge>
        </span>
      </li>
    );
  };

  return (
    <CrmShell current={here}>
      <Page>
        <PageHeading
          title="Atividades"
          description="O próximo passo de cada negócio. Atrasadas primeiro; concluir leva um clique."
          actions={
            <>
              <SegmentedControl
                label="Visualização"
                value={view}
                onChange={setView}
                options={[
                  { value: "lista", label: "Lista", icon: <List className="h-3.5 w-3.5" /> },
                  { value: "semana", label: "Semana", icon: <CalendarDays className="h-3.5 w-3.5" /> },
                ]}
              />
              <Button onClick={() => setCreating(true)}>
                <Plus /> Nova atividade
              </Button>
            </>
          }
        />
        <div className="mt-6 space-y-5">
          <PageToolbar>
            <FilterBar filters={filters} noun="atividade" search={<TableSearch value={q} onChange={filters.setQuery} total={items.length} noun="atividade" searchIn="título, empresa e responsável" />} />
          </PageToolbar>
          {view === "lista" ? (
            groups.length ? (
              groups.map((g) => (
                <section key={g.label}>
                  <h2 className={cn("m-0 mb-2 flex items-center gap-2 text-[13px] font-medium", g.label === "Atrasadas" ? "text-rose" : "text-ink")}>
                    {g.label}
                    <span className="text-[11.5px] font-normal tabular-nums text-muted">{g.items.length}</span>
                  </h2>
                  <ul className={cn("m-0 list-none divide-y divide-line overflow-hidden rounded-xl border bg-surface p-0", g.label === "Atrasadas" ? "border-rose/25" : "border-line")}>{g.items.map(row)}</ul>
                </section>
              ))
            ) : (
              <EmptyFilterResult filters={filters} noun="atividade" framed />
            )
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[840px] grid-cols-7 gap-2">
                {week.map((day) => {
                  const list = filters.rows.filter((a) => a.due === day).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
                  const isToday = daysFromToday(day) === 0;
                  const date = new Date(`${day}T00:00:00`);
                  return (
                    <section key={day} className={cn("min-h-[320px] rounded-xl border p-2", isToday ? "border-accent/50 bg-accent-soft/30" : "border-line bg-soft/50")}>
                      <header className="mb-2 flex items-baseline justify-between px-1">
                        <span className="text-[12px] font-medium capitalize">{date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                        <span className={cn("text-[12px] tabular-nums", isToday ? "font-semibold text-accent-deep" : "text-muted")}>{date.getDate()}</span>
                      </header>
                      <ul className="m-0 list-none space-y-1.5 p-0">
                        {list.map((a) => (
                          <li key={a.id}>
                            <button type="button" onClick={() => toggle(a)} className={cn("w-full rounded-lg border bg-surface p-2 text-left hover:border-line-strong", a.done ? "border-line opacity-60" : "border-line")}>
                              <span className="flex items-center gap-1.5 text-[11px] text-muted [&_svg]:h-3 [&_svg]:w-3">
                                {typeIcon[a.type]}
                                {a.time ?? activityLabel[a.type]}
                              </span>
                              <span className={cn("mt-0.5 block text-[12px] leading-snug", a.done && "line-through")}>{a.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
              <p className="m-0 mt-2 text-[12px] text-muted">Clique numa atividade para marcar como concluída.</p>
            </div>
          )}
        </div>
      </Page>
      <NewActivityModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(a) => {
          setItems((all) => [a, ...all]);
          notify(`${activityLabel[a.type]} agendada para ${formatDate(a.due, { short: true })}`, () => setItems((all) => all.filter((x) => x.id !== a.id)));
        }}
      />
    </CrmShell>
  );
}

function NewActivityModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (a: Activity) => void }) {
  const [type, setType] = useState<ActivityType>("ligacao");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(iso(1));
  const [time, setTime] = useState("10:00");
  const [company, setCompany] = useState("");
  const [owner, setOwner] = useState(me);
  const [tried, setTried] = useState(false);
  const submit = () => {
    setTried(true);
    if (!title.trim() || !company) return;
    onCreate({ id: `a${Date.now()}`, type, title: title.trim(), due, time: type === "tarefa" || type === "email" ? undefined : time, owner, companyId: company, done: false });
    setTitle("");
    setCompany("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova atividade"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>Agendar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldBlock label="Tipo">
          <Select label="Tipo" value={type} onValueChange={(v) => setType(v as ActivityType)} options={types.map((t) => ({ value: t, label: activityLabel[t] }))} />
        </FieldBlock>
        <TextField label="O que fazer" placeholder="Ex.: Retomar proposta com o financeiro" value={title} onChange={setTitle} error={tried && !title.trim() ? "Descreva a atividade." : undefined} />
        <FieldBlock label="Empresa" error={tried && !company ? "Escolha a empresa." : undefined}>
          <Combobox label="Empresa" value={company} onValueChange={setCompany} options={companies.map((c) => ({ value: c.id, label: c.name }))} placeholder="Buscar empresa…" />
        </FieldBlock>
        <FieldGrid>
          <FieldBlock label="Data">
            <DatePicker label="Data" value={due} onValueChange={setDue} min={iso(0)} />
          </FieldBlock>
          {type !== "tarefa" && type !== "email" ? <TextField label="Horário" type="time" value={time} onChange={setTime} /> : <span />}
        </FieldGrid>
        <FieldBlock label="Responsável">
          <Select label="Responsável" value={owner} onValueChange={setOwner} options={reps.map((r) => ({ value: r.id, label: r.name }))} />
        </FieldBlock>
      </div>
    </Modal>
  );
}
