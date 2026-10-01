"use client";

import { Check, ChevronDown, ChevronRight, CircleDashed, Clock, Hash, Plus, Tag, Undo2, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Menu } from "./overlays-extra";
import { Avatar } from "./primitives";
import { PropertyPill } from "./record-panel";
import { PriorityIcon, StatusPill, priorityLabel, taskStatusLabel, type Priority, type TaskStatus } from "./tags";

/*
 * Tarefas propostas pela IA (a partir de uma reunião, documento ou análise).
 * A IA sugere; a pessoa decide: cada card tem Aceitar/Recusar e todos os
 * campos são editáveis antes de criar. Aceito = vira linha compacta com
 * "Desfazer". Ver docs/padroes/agentes.md › Propostas.
 */

export type SubtaskType = "melhoria" | "funcionalidade" | "bug";
export type Subtask = { id: string; title: string; type?: SubtaskType; done?: boolean; assignee?: Person };
type Person = { name: string; initials: string; tint?: string };
export type TaskDestination = { id: string; label: string; icon?: ReactNode };
export type TaskProposal = {
  id: string;
  destination: string;
  title: string;
  description?: ReactNode;
  /** Parágrafo em destaque (a ação concreta). */
  emphasis?: ReactNode;
  subtasks?: Subtask[];
  project?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: Person;
  labels?: string[];
  estimate?: string;
};
export type ProposalState = "pendente" | "aceita" | "recusada";

const typeStyle: Record<SubtaskType, { label: string; dot: string }> = {
  melhoria: { label: "Melhoria", dot: "bg-tag-blue-fg" },
  funcionalidade: { label: "Funcionalidade", dot: "bg-tag-purple-fg" },
  bug: { label: "Bug", dot: "bg-tag-red-fg" },
};

function MiniRing({ value, total }: { value: number; total: number }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  const f = total ? value / total : 0;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90" aria-hidden>
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--ds-line-strong)" strokeWidth="2" />
      <circle cx="8" cy="8" r={r} fill="none" stroke={f === 1 ? "var(--ds-ok)" : "var(--ds-ink)"} strokeWidth="2" strokeDasharray={`${f * c} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

/** Sub-tarefa: círculo de concluído, título, tipo (pílula com ponto), responsável. */
export function SubtaskRow({ subtask, onToggle }: { subtask: Subtask; onToggle?: () => void }) {
  const t = subtask.type ? typeStyle[subtask.type] : null;
  return (
    <li className="flex min-h-9 items-center gap-2.5 py-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={!!subtask.done}
        aria-label={`${subtask.done ? "Reabrir" : "Concluir"}: ${subtask.title}`}
        onClick={onToggle}
        className={cn("ds-hit grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors", subtask.done ? "border-ok bg-ok text-on-ink" : "border-line-strong hover:border-ink")}
      >
        {subtask.done && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <span className={cn("min-w-0 flex-1 truncate text-[13px]", subtask.done && "text-muted line-through")}>{subtask.title}</span>
      {t && (
        <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-surface px-2 text-[11.5px] text-ink-soft ring-1 ring-inset ring-line">
          <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
          {t.label}
        </span>
      )}
      {subtask.assignee && <Avatar {...subtask.assignee} size="sm" />}
    </li>
  );
}

/**
 * Card de tarefa proposta. Edite destino, título e propriedades antes de
 * aceitar. `state="aceita"` vira linha compacta com Desfazer.
 */
export function TaskProposalCard({
  proposal,
  state = "pendente",
  destinations,
  people = [],
  projects = [],
  onChange,
  onAccept,
  onDecline,
  onUndo,
  defaultOpen = true,
  className,
}: {
  proposal: TaskProposal;
  state?: ProposalState;
  destinations: TaskDestination[];
  people?: Person[];
  projects?: string[];
  onChange?: (patch: Partial<TaskProposal>) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onUndo?: () => void;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dest = destinations.find((d) => d.id === proposal.destination) ?? destinations[0];
  const subs = proposal.subtasks ?? [];
  const done = subs.filter((s) => s.done).length;

  if (state !== "pendente")
    return (
      <div className={cn("flex min-h-12 items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-[13px]", className)} role="status">
        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", state === "aceita" ? "bg-ok text-on-ink" : "bg-soft text-muted")}>
          {state === "aceita" ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" />}
        </span>
        <span className="min-w-0 flex-1 truncate">
          <span className="text-muted">{state === "aceita" ? `Criada no ${dest?.label}: ` : "Recusada: "}</span>
          <span className={cn("font-medium", state === "recusada" && "text-muted line-through")}>{proposal.title}</span>
        </span>
        {onUndo && (
          <button type="button" onClick={onUndo} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-[12px] text-muted hover:bg-soft hover:text-ink">
            <Undo2 className="h-3.5 w-3.5" /> Desfazer
          </button>
        )}
      </div>
    );

  return (
    <article className={cn("min-w-0 rounded-2xl border border-line bg-surface shadow-surface", className)} aria-label={`Tarefa proposta: ${proposal.title}`}>
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <Menu
          label="Destino da tarefa"
          triggerClassName="!h-8 gap-1.5 !px-2.5 !text-[12.5px]"
          trigger={
            <>
              {dest?.icon}
              {dest?.label}
              <ChevronDown className="!h-3.5 !w-3.5 text-muted" />
            </>
          }
          items={destinations.map((d) => ({ type: "item" as const, label: d.label, icon: d.icon, onSelect: () => onChange?.({ destination: d.id }) }))}
        />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Recolher" : "Expandir"} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-soft hover:text-ink">
          <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} />
        </button>
      </div>
      <div className="px-4 pb-4 pt-3">
        {onChange ? (
          <textarea
            value={proposal.title}
            onChange={(e) => onChange({ title: e.target.value })}
            rows={1}
            aria-label="Título da tarefa"
            className="ds-bare block w-full min-w-0 resize-none bg-transparent text-[17px] font-semibold leading-snug tracking-tight text-ink outline-none [field-sizing:content]"
          />
        ) : (
          <h3 className="m-0 text-[17px] font-semibold leading-snug tracking-tight">{proposal.title}</h3>
        )}
        {open && (
          <>
            {proposal.description && <div className="mt-2 text-[13.5px] leading-relaxed text-muted">{proposal.description}</div>}
            {proposal.emphasis && <div className="mt-2.5 text-[13.5px] leading-relaxed text-ink">{proposal.emphasis}</div>}
            {subs.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-[12.5px] text-muted">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" aria-hidden />
                  Sub-tarefas
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <MiniRing value={done} total={subs.length} /> {done}/{subs.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange?.({ subtasks: [...subs, { id: `s${Date.now()}`, title: "Nova sub-tarefa", type: "melhoria" }] })}
                    aria-label="Adicionar sub-tarefa"
                    className="ml-auto grid h-7 w-7 place-items-center rounded-md hover:bg-soft hover:text-ink"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="mt-1 list-none p-0">
                  {subs.map((s) => (
                    <SubtaskRow key={s.id} subtask={s} onToggle={() => onChange?.({ subtasks: subs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })} />
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <PropertyPill
                icon={<Hash className="text-muted" />}
                value={proposal.project}
                placeholder="Projeto"
                items={projects.map((p) => ({ type: "item" as const, label: p, onSelect: () => onChange?.({ project: p }) }))}
              />
              <PropertyPill
                icon={<CircleDashed className="text-muted" />}
                value={proposal.status && proposal.status !== "sem-status" ? <StatusPill status={proposal.status} size="sm" className="-mx-1" /> : undefined}
                placeholder="Sem status"
                items={(Object.keys(taskStatusLabel) as TaskStatus[]).map((st) => ({ type: "item" as const, label: taskStatusLabel[st], onSelect: () => onChange?.({ status: st }) }))}
              />
              <PropertyPill
                icon={<PriorityIcon priority={proposal.priority ?? "sem"} />}
                value={proposal.priority && proposal.priority !== "sem" ? priorityLabel[proposal.priority] : undefined}
                placeholder="Prioridade"
                items={(Object.keys(priorityLabel) as Priority[]).map((p) => ({ type: "item" as const, label: priorityLabel[p], icon: <PriorityIcon priority={p} />, onSelect: () => onChange?.({ priority: p }) }))}
              />
              {proposal.assignee ? (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-surface pl-1.5 pr-1 text-[12.5px] ring-1 ring-line">
                  <Avatar {...proposal.assignee} size="sm" />
                  {proposal.assignee.name.split(" ")[0]}
                  <button type="button" onClick={() => onChange?.({ assignee: undefined })} aria-label="Remover responsável" className="ds-hit grid h-5 w-5 place-items-center rounded text-muted hover:bg-soft hover:text-ink">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <PropertyPill
                  icon={<Users className="text-muted" />}
                  placeholder="Responsável"
                  items={people.map((p) => ({ type: "item" as const, label: p.name, onSelect: () => onChange?.({ assignee: p }) }))}
                />
              )}
              <PropertyPill
                icon={<Tag className="text-muted" />}
                value={proposal.labels?.length ? proposal.labels.join(", ") : undefined}
                placeholder="Rótulos"
                items={["Importação", "UX", "Back-end", "Dados"].map((l) => ({
                  type: "checkbox" as const,
                  label: l,
                  checked: !!proposal.labels?.includes(l),
                  onCheckedChange: (c: boolean) => onChange?.({ labels: c ? [...(proposal.labels ?? []), l] : (proposal.labels ?? []).filter((x) => x !== l) }),
                }))}
              />
              <PropertyPill
                icon={<Clock className="text-muted" />}
                value={proposal.estimate}
                placeholder="Estimativa"
                items={["1 h", "4 h", "1 dia", "3 dias", "1 semana"].map((e) => ({ type: "item" as const, label: e, onSelect: () => onChange?.({ estimate: e }) }))}
              />
            </div>
          </>
        )}
      </div>
      <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
        <button type="button" onClick={onDecline} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] text-muted ring-1 ring-line hover:bg-soft hover:text-ink">
          <X className="h-3.5 w-3.5" /> Recusar
        </button>
        <button type="button" onClick={onAccept} className="ui-button ui-button-primary inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-on-primary hover:bg-primary/90">
          <Check className="h-3.5 w-3.5" /> Aceitar
        </button>
      </footer>
    </article>
  );
}

/**
 * Painel de propostas: cabeçalho com contagem e "Aceitar todas / Recusar todas",
 * cards em coluna (o primeiro aberto; os seguintes recolhidos e esmaecidos).
 */
export function TaskProposalList({
  title = "Tarefas",
  pending,
  total,
  onAcceptAll,
  onDeclineAll,
  children,
  className,
}: {
  title?: string;
  pending: number;
  total: number;
  onAcceptAll?: () => void;
  onDeclineAll?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)} aria-label={title}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-3">
        <h2 className="m-0 text-[13.5px] font-medium">
          {title} <span className="font-normal tabular-nums text-muted">{pending ? `${pending} de ${total} pendentes` : "todas revisadas"}</span>
        </h2>
        {pending > 0 && (
          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={onAcceptAll} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink">
              <Check className="h-3.5 w-3.5" /> Aceitar todas
            </button>
            <button type="button" onClick={onDeclineAll} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] text-ink-soft hover:bg-soft hover:text-ink">
              <X className="h-3.5 w-3.5" /> Recusar todas
            </button>
          </div>
        )}
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">{children}</div>
    </section>
  );
}
