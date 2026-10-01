import { useState } from "react";
import { TaskProposalCard, TaskProposalList, ToolGlyph, type ProposalState, type TaskProposal } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tarefas propostas pela IA",
  group: "IA e interação",
  order: 41,
  description: "A IA sugere tarefas a partir de uma reunião ou documento; a pessoa revisa, ajusta e aceita (ou recusa) uma a uma ou todas de uma vez, com desfazer.",
};

const dest = [
  { id: "linear", label: "Linear", icon: <ToolGlyph name="Linear" color="var(--ds-tag-purple-fg)" /> },
  { id: "jira", label: "Jira", icon: <ToolGlyph name="Jira" color="var(--ds-tag-blue-fg)" /> },
];
const people = [
  { name: "Eduardo Barros", initials: "EB" },
  { name: "Carla Nogueira", initials: "CN" },
];

export default function Page() {
  const [items, setItems] = useState<TaskProposal[]>([
    {
      id: "a",
      destination: "linear",
      title: "Corrigir a detecção de tipo de campo na importação",
      description: "Uma coluna de texto foi classificada como e-mail.",
      emphasis: "Exigir 90 % de valores válidos antes de sugerir “e-mail”.",
      subtasks: [
        { id: "1", title: "Ajustar o limiar de detecção", type: "melhoria", done: true },
        { id: "2", title: "Coluna “Observações” vira e-mail", type: "bug" },
      ],
      priority: "alta",
      assignee: people[0],
    },
    { id: "b", destination: "jira", title: "Mostrar o progresso da importação em etapas", priority: "media" },
  ]);
  const [st, setSt] = useState<Record<string, ProposalState>>({});
  const pending = items.filter((i) => (st[i.id] ?? "pendente") === "pendente").length;
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection title="TaskProposalList + TaskProposalCard" rule="Tudo editável antes de aceitar: destino, título, sub-tarefas, projeto, status, prioridade, responsável, rótulos, estimativa.">
        <Demo
          bare
          code={`<TaskProposalList pending={n} total={total} onAcceptAll={…} onDeclineAll={…}>
  {propostas.map((p) => (
    <TaskProposalCard key={p.id} proposal={p} state={estado[p.id]} destinations={destinos}
      people={time} projects={projetos}
      onChange={(patch) => atualizar(p.id, patch)}
      onAccept={() => aceitar(p.id)} onDecline={() => recusar(p.id)} onUndo={() => voltar(p.id)} />
  ))}
</TaskProposalList>`}
        >
          <div className="max-w-[480px] rounded-2xl bg-soft/60 p-4">
            <TaskProposalList pending={pending} total={items.length} onAcceptAll={() => setSt({ a: "aceita", b: "aceita" })} onDeclineAll={() => setSt({ a: "recusada", b: "recusada" })}>
              {items.map((p, i) => (
                <TaskProposalCard
                  key={p.id}
                  proposal={p}
                  state={st[p.id]}
                  destinations={dest}
                  people={people}
                  projects={["Importação de dados", "Gestão"]}
                  defaultOpen={i === 0}
                  onChange={(patch) => setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, ...patch } : x)))}
                  onAccept={() => setSt((s) => ({ ...s, [p.id]: "aceita" }))}
                  onDecline={() => setSt((s) => ({ ...s, [p.id]: "recusada" }))}
                  onUndo={() => setSt((s) => ({ ...s, [p.id]: "pendente" }))}
                />
              ))}
            </TaskProposalList>
          </div>
        </Demo>
        <PropsTable
          rows={[
            ["proposal", "TaskProposal", "—", "destination, title, description, emphasis, subtasks, project, status, priority, assignee, labels, estimate"],
            ["state", '"pendente" | "aceita" | "recusada"', '"pendente"', "Aceita/recusada vira linha compacta com Desfazer"],
            ["destinations", "{ id, label, icon }[]", "—", "Linear, Jira, Asana, G4 Tarefas…"],
            ["onChange", "(patch) => void", "—", "Sem ele, o card fica só leitura"],
          ]}
        />
      </DocSection>
      <DocSection title="Regras">
        <Rules
          items={[
            { do: "A IA propõe, a pessoa decide: nada é criado no destino sem “Aceitar”.", dont: "Criar tarefas automaticamente e avisar depois." },
            { do: "Mostrar de onde veio (reunião, documento) ao lado das propostas.", dont: "Propostas sem contexto de origem." },
            { do: "“Aceitar todas” sempre com desfazer.", dont: "Ação em massa irreversível." },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
