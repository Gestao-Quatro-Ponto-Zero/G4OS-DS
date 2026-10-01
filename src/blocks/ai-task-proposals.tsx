import { CalendarDays, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  AvatarGroup,
  SegmentedControl,
  TaskProposalCard,
  TaskProposalList,
  ToolGlyph,
  cn,
  notify,
  type ProposalState,
  type TaskDestination,
  type TaskProposal,
} from "@g4ai/ds";
import { AgentShell, agentRoutes } from "./shells/agent-shell";
import { meeting, projects, proposals as initial, team } from "./data/task-proposals";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Tarefas propostas pela IA",
  description: "Resumo de reunião à esquerda e as tarefas que a IA sugere à direita: destino (Linear, Jira, Asana), sub-tarefas, propriedades editáveis, aceitar/recusar por tarefa ou todas, com desfazer.",
  category: "IA",
  order: 7,
  height: 880,
  concept: {
    goal: "Transformar o resumo de uma reunião em tarefas reais com revisão humana: aceitar, editar ou recusar cada uma.",
    patterns: [
      "Anatomia G · App de altura total: documento à esquerda, propostas à direita",
      "Aceitar todas / Recusar todas no topo, com desfazer",
      "Card editável: destino (Linear, Jira…), sub-tarefas com progresso, propriedades em chips",
      "Card aceito vira uma linha com 'Desfazer'",
    ],
    adapt: [
      "Ações de ata de reunião, pendências de auditoria, itens de onboarding de cliente",
    ],
    avoid: [
      "Criar tarefas automaticamente sem revisão",
    ],
  },
} as const;

// ds-audit-ignore-start hex-color: cores de marca dos destinos (apps de terceiros)
const destinations: TaskDestination[] = [
  { id: "linear", label: "Linear", icon: <ToolGlyph name="Linear" color="#5e6ad2" /> },
  { id: "jira", label: "Jira", icon: <ToolGlyph name="Jira" color="#0052cc" /> },
  { id: "asana", label: "Asana", icon: <ToolGlyph name="Asana" color="#f06a6a" /> },
  { id: "g4", label: "G4 Tarefas", icon: <ToolGlyph name="G4" color="#184560" /> },
];
// ds-audit-ignore-end

export default function TaskProposals() {
  const [items, setItems] = useState<TaskProposal[]>(initial);
  const [state, setState] = useState<Record<string, ProposalState>>({});
  const [view, setView] = useState<"doc" | "tasks">("tasks");
  const pending = items.filter((t) => (state[t.id] ?? "pendente") === "pendente");
  const firstPending = pending[0]?.id;

  const decide = (id: string, s: ProposalState) => {
    setState((m) => ({ ...m, [id]: s }));
    const t = items.find((x) => x.id === id)!;
    const dest = destinations.find((d) => d.id === t.destination)?.label;
    notify(s === "aceita" ? `Tarefa criada no ${dest}` : "Tarefa recusada", () => setState((m) => ({ ...m, [id]: "pendente" })));
  };
  const decideAll = (s: ProposalState) => {
    const before = state;
    const next = { ...state };
    pending.forEach((t) => (next[t.id] = s));
    setState(next);
    notify(s === "aceita" ? `${pending.length} tarefas criadas` : `${pending.length} tarefas recusadas`, () => setState(before));
  };

  const doc = (
    <article className="min-w-0 rounded-2xl border border-line bg-surface" aria-label="Resumo da reunião">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
          <CalendarDays className="h-3.5 w-3.5" /> {meeting.date}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <AvatarGroup people={meeting.attendees} max={4} />
          <button type="button" onClick={() => notify("Link do resumo copiado", undefined, "info")} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] ring-1 ring-line hover:bg-soft">
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </button>
        </span>
      </header>
      <div className="space-y-6 px-5 py-6 sm:px-8">
        <h1 className="m-0 text-[24px] font-semibold leading-tight tracking-[-0.02em]" style={{ fontFamily: "var(--ds-font-display)" }}>
          {meeting.title}
        </h1>
        <section className="rounded-xl border border-line bg-soft/40 p-4">
          <p className="m-0 mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-deep" /> Resumo gerado pela IA
          </p>
          <ul className="m-0 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink-soft">
            {meeting.summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="m-0 text-[17px] font-semibold">Decisões</h2>
          <ol className="m-0 mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed">
            {meeting.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="m-0 text-[17px] font-semibold">Status da importação</h2>
          <p className="m-0 mt-2 text-[14px] leading-relaxed text-ink-soft">
            Importações estão processando com sucesso. Os tipos de campo são detectados corretamente na maior parte das colunas. A informação de progresso existe, mas precisa ficar mais clara para quem importa.
          </p>
        </section>
      </div>
    </article>
  );

  const panel = (
    <TaskProposalList pending={pending.length} total={items.length} onAcceptAll={() => decideAll("aceita")} onDeclineAll={() => decideAll("recusada")} className="min-h-0">
      {items.map((t) => {
        const st = state[t.id] ?? "pendente";
        const isNext = t.id === firstPending;
        return (
          <TaskProposalCard
            key={t.id}
            proposal={t}
            state={st}
            destinations={destinations}
            people={team}
            projects={projects}
            defaultOpen={isNext}
            onChange={(patch) => setItems((xs) => xs.map((x) => (x.id === t.id ? { ...x, ...patch } : x)))}
            onAccept={() => decide(t.id, "aceita")}
            onDecline={() => decide(t.id, "recusada")}
            onUndo={() => setState((m) => ({ ...m, [t.id]: "pendente" }))}
          />
        );
      })}
    </TaskProposalList>
  );

  return (
    <AgentShell current={agentRoutes.tasks}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5 lg:hidden">
          <SegmentedControl
            label="Visualização"
            value={view}
            onChange={setView}
            options={[
              { value: "doc", label: "Resumo" },
              { value: "tasks", label: `Tarefas · ${pending.length}` },
            ]}
          />
        </div>
        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className={cn("min-h-0 min-w-0 overflow-y-auto", view !== "doc" && "hidden lg:block")}>{doc}</div>
          <div className={cn("flex min-h-0 min-w-0 flex-col", view !== "tasks" && "hidden lg:flex")}>{panel}</div>
        </div>
      </div>
    </AgentShell>
  );
}
