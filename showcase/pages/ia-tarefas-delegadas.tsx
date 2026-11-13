import { useState } from "react";
import { AgentQueue, Button, DelegableTaskList, DelegationPill, TaskResultCard, formatCurrency, notify, useDelegationDemo, type AgentRef, type DelegableTask, type DelegationDemoStep } from "@g4ai/ds";
import { Demo, DocPage, DocSection, PropsTable, Rules, type PageMeta } from "../kit";

export const meta: PageMeta = {
  title: "Tarefas delegadas",
  group: "IA e interação",
  order: 42,
  description: "A pessoa marca várias tarefas e entrega a agentes; acompanha quem está trabalhando, decide o que trava pedindo aprovação e recebe a entrega pronta para conferir.",
};

const agents: AgentRef[] = [
  {
    id: "financeiro",
    name: "Financeiro",
    seed: "agente-financeiro",
    palette: 2,
  },
  { id: "compras", name: "Compras", seed: "agente-compras", palette: 5 },
  { id: "agenda", name: "Agenda", seed: "agente-agenda", palette: 0 },
];

const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const sample: DelegableTask[] = [
  {
    id: "a",
    title: "Conciliar o extrato de outubro",
    due: inDays(2),
    priority: "alta",
    suggestedAgentId: "financeiro",
  },
  {
    id: "b",
    title: "Pagar o boleto de energia",
    due: inDays(0),
    suggestedAgentId: "financeiro",
  },
  {
    id: "c",
    title: "Cancelar assinaturas sem uso",
    suggestedAgentId: "compras",
  },
  {
    id: "d",
    title: "Agendar a revisão do carro",
    due: inDays(1),
    suggestedAgentId: "agenda",
  },
  {
    id: "e",
    title: "Renovar o seguro do escritório",
    due: inDays(-2),
    suggestedAgentId: "compras",
  },
];

const scripts: Record<string, DelegationDemoStep[]> = {
  a: ["Lendo o extrato do banco", "Cruzando lançamentos", "Separando divergências", "Montando a planilha"],
  b: ["Lendo o boleto", `Conferindo o valor: ${formatCurrency(842.3)}`, { text: "Aguardando sua aprovação para pagar", waitForYou: true }, "Agendando o pagamento"],
  c: ["Procurando cobranças recorrentes", "Encontrei 3 sem uso", "Escrevendo os cancelamentos"],
  d: ["Procurando horários", { text: "Não consegui acessar a agenda da oficina", fail: true }, "Reservando quinta, 9h"],
  e: ["Lendo a apólice", "Pedindo cotações", "Comparando coberturas"],
};

const queueSample: DelegableTask[] = [
  {
    id: "q1",
    title: "Conciliar o extrato de outubro",
    agent: agents[0],
    status: "trabalhando",
    activity: "Cruzando 214 lançamentos",
  },
  {
    id: "q2",
    title: "Pagar o boleto de energia",
    agent: agents[0],
    status: "aguardando",
    activity: "Aguardando sua aprovação para pagar",
  },
  {
    id: "q3",
    title: "Agendar a revisão do carro",
    agent: agents[2],
    status: "falhou",
    activity: "Não consegui acessar a agenda da oficina",
  },
  {
    id: "q4",
    title: "Cancelar assinaturas sem uso",
    agent: agents[1],
    status: "delegada",
  },
];

function Flow() {
  const demo = useDelegationDemo(sample, { agents, scripts, tickMs: 1600 });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-9 items-center justify-center">
        <DelegationPill tasks={demo.tasks} answered={demo.answered?.agent} />
      </div>
      <AgentQueue tasks={demo.tasks} onStop={demo.stop} onRetry={demo.retry} onReview={demo.approve} />
      <DelegableTaskList tasks={demo.tasks} agents={agents} onDelegate={demo.delegate} onComplete={demo.complete} />
      <Button size="sm" variant="quiet" className="self-start" onClick={demo.reset}>
        Recomeçar
      </Button>
    </div>
  );
}

export default function Page() {
  const [list, setList] = useState(sample);
  const [selected, setSelected] = useState<string[]>(["a", "b"]);
  return (
    <DocPage title={meta.title} kicker="IA e interação" description={meta.description}>
      <DocSection
        title="Fluxo completo"
        rule="Marque com clique, arrasto ou Shift; Delegar; acompanhe a pílula e o painel. A tarefa de energia trava pedindo você (Revisar aprova); a do carro falha (Tentar de novo)."
      >
        <Demo
          bare
          code={`const demo = useDelegationDemo(tarefas, { agents, scripts });

<DelegationPill tasks={demo.tasks} answered={demo.answered?.agent} onClick={abrirPainel} />
<AgentQueue tasks={demo.tasks} onStop={demo.stop} onRetry={demo.retry} onReview={revisar} />
<DelegableTaskList tasks={demo.tasks} agents={agents} onDelegate={demo.delegate} />`}
        >
          <div className="max-w-[520px] rounded-2xl bg-soft/60 p-4 max-sm:p-2">
            <Flow />
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="DelegableTaskList"
        rule="Seleção múltipla: clique, arrasto com o mouse, Shift+clique; no teclado, setas, Espaço, Shift+setas, Ctrl/⌘+A e Esc. Prazo em palavras: Hoje e Atrasada em tom, sempre com texto."
      >
        <Demo
          bare
          code={`<DelegableTaskList
  title="Esta semana"
  tasks={tarefas}
  agents={agentes}
  selected={marcadas}
  onSelectedChange={setMarcadas}
  onDelegate={(ids, agentId) => delegar(ids, agentId)}
  onCreate={criarTarefa}
/>`}
        >
          <div className="max-w-[520px] rounded-2xl bg-soft/60 p-4 max-sm:p-2">
            <DelegableTaskList
              tasks={list}
              agents={agents}
              selected={selected}
              onSelectedChange={setSelected}
              onDelegate={(ids, agentId) => {
                setList((all) =>
                  all.map((t) =>
                    ids.includes(t.id)
                      ? {
                          ...t,
                          status: "trabalhando",
                          agent: agents.find((a) => a.id === (agentId ?? t.suggestedAgentId)) ?? agents[0],
                        }
                      : t,
                  ),
                );
                notify(ids.length === 1 ? "Tarefa delegada" : `${ids.length} tarefas delegadas`);
              }}
              onCreate={() => notify("Tarefa criada")}
            />
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="AgentQueue"
        rule="Uma linha por tarefa em curso: rosto, título e o passo atual (anunciado). Quem trava vira Aguardando você; quem falha diz o motivo e oferece Tentar de novo. Parar e Ver detalhes no ⋯."
      >
        <Demo
          code={`<AgentQueue
  tasks={tarefas}
  onStop={parar}
  onOpen={abrirExecucao}
  onRetry={tentarDeNovo}
  onReview={revisar}
/>`}
        >
          <div className="w-full max-w-[480px]">
            <AgentQueue tasks={queueSample} onStop={() => notify("Agente parado")} onOpen={() => {}} onRetry={() => notify("Tarefa enviada de novo")} onReview={() => {}} />
          </div>
        </Demo>
      </DocSection>

      <DocSection title="DelegationPill" rule="Diz o que está acontecendo, não quantas tarefas existem. Prioridade: aguardando você, falha, trabalhando, respondeu.">
        <Demo code={`<DelegationPill tasks={tarefas} answered={ultimoAgente} onClick={abrirPainel} />`}>
          <div className="flex flex-wrap items-center gap-3">
            <DelegationPill tasks={queueSample.filter((t) => t.status === "trabalhando" || t.status === "delegada")} />
            <DelegationPill tasks={queueSample.filter((t) => t.status === "aguardando")} />
            <DelegationPill tasks={[]} answered={agents[0]} />
          </div>
        </Demo>
      </DocSection>

      <DocSection
        title="TaskResultCard"
        rule="A entrega: Trabalhou por (abre os passos), a frase de resultado, a tabela-resumo e o arquivo com Abrir em. Quando a entrega ainda pede você, Aprovar e Pedir ajuste."
      >
        <Demo
          code={`<TaskResultCard
  title="Conciliar o extrato de outubro"
  agent={financeiro}
  durationMs={134_000}
  steps={["Leu o extrato", "Cruzou 214 lançamentos", "Separou 3 divergências"]}
  table={{
    columns: [{ label: "Entradas", align: "end" }, { label: "Saídas", align: "end" }, { label: "Divergências", align: "end" }],
    rows: [[formatCurrency(184320.5), formatCurrency(151870.2), 3]],
  }}
  files={[{ name: "conciliacao-outubro.xlsx", size: 48200, openWith: [{ label: "Planilhas do G4" }] }]}
>
  O extrato de outubro está conciliado. Ficaram 3 divergências para você olhar.
</TaskResultCard>`}
        >
          <div className="grid w-full gap-4 lg:grid-cols-2">
            <TaskResultCard
              title="Conciliar o extrato de outubro"
              agent={agents[0]}
              durationMs={134_000}
              steps={["Leu o extrato do banco (214 lançamentos)", "Cruzou com contas a pagar e a receber", "Separou 3 divergências"]}
              table={{
                caption: "Resumo da conciliação",
                columns: [
                  { label: "Entradas", align: "end" },
                  { label: "Saídas", align: "end" },
                  { label: "Divergências", align: "end" },
                ],
                rows: [[formatCurrency(184_320.5), formatCurrency(151_870.2), 3]],
              }}
              files={[
                {
                  name: "conciliacao-outubro.xlsx",
                  size: 48_200,
                  openWith: [
                    {
                      label: "Planilhas do G4",
                      onSelect: () => notify("Planilha aberta"),
                    },
                    { label: "Aplicativo do computador" },
                  ],
                },
              ]}
            >
              O extrato de outubro está conciliado. Ficaram 3 divergências para você olhar.
            </TaskResultCard>
            <TaskResultCard
              title="Cancelar assinaturas sem uso"
              agent={agents[1]}
              durationMs={71_000}
              steps={["Leu as cobranças recorrentes", "Cruzou com os acessos do time"]}
              needsReview
              onApprove={() => notify("Cancelamentos enviados")}
              onRequestChanges={() => notify("Pedido de ajuste enviado")}
            >
              Encontrei 3 assinaturas sem acesso há mais de 60 dias. Os pedidos estão prontos; nada foi enviado ainda.
            </TaskResultCard>
          </div>
        </Demo>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            [
              "DelegableTask",
              "{ id; title; due?; priority?; agent?; status?; activity?; suggestedAgentId? }",
              "—",
              "status: aberta · delegada · trabalhando · aguardando · falhou · concluida. activity é o passo atual (ou o motivo da falha).",
            ],
            ["DelegableTaskList.tasks", "DelegableTask[]", "—", "Só as abertas podem ser marcadas. Concluídas saem com animação (showCompleted mantém)."],
            ["DelegableTaskList.onDelegate", "(ids, agentId | null) => void", "—", "agentId nulo = Automático (cada tarefa vai ao suggestedAgentId)."],
            ["DelegableTaskList.selected", "string[]", "interno", "Seleção controlada, com onSelectedChange."],
            ["DelegableTaskList.onComplete", "(ids) => void", "—", "Oferece Concluir na barra flutuante."],
            ["DelegableTaskList.now", "Date", "agora", "Referência dos prazos (Hoje, Amanhã, Sexta, Atrasada)."],
            ["AgentQueue.tasks", "DelegableTask[]", "—", "A mesma lista; mostra as que têm agente e não terminaram."],
            ["AgentQueue.onReview / onRetry / onStop / onOpen", "(id) => void", "—", "Revisar (aguardando), Tentar de novo (falhou), Parar e Ver detalhes (⋯)."],
            ["DelegationPill.answered", "AgentRef | null", "—", "Quem acabou de entregar: “<nome> respondeu” quando ninguém mais trabalha."],
            ["TaskResultCard.steps", "(string | AgentRunStep)[]", "—", "Abrem sob “Trabalhou por”. AgentRunStep usa AgentRunSteps."],
            ["TaskResultCard.table", "{ columns; rows; caption? }", "—", "Números puros saem com formatNumber; valores em dinheiro, passe formatados."],
            ["TaskResultCard.files", "{ name; size?; openWith? }[]", "—", "Cartão de arquivo com o menu Abrir em."],
            ["TaskResultCard.needsReview", "boolean", "false", "Aprovar e Pedir ajuste no rodapé."],
            ["useDelegationDemo", "(tasks, { agents, scripts, tickMs? })", "—", "Simula o ciclo (só com a aba visível). Passo { waitForYou } trava; { fail } falha até retry."],
          ]}
        />
      </DocSection>

      <DocSection title="Regras">
        <Rules
          items={[
            {
              do: "Delegue só o que tem dono e prazo: o agente sabe para quem entrega e quando é tarde.",
              dont: "Delegar “ver isso aí” sem prazo nem resultado esperado.",
            },
            {
              do: "O que mexe em dinheiro (pagar, cancelar, cobrar) para em Aguardando você com o valor, até a pessoa aprovar.",
              dont: "Agente pagar ou enviar em nome da pessoa sem aprovação explícita.",
            },
            {
              do: "Status sempre com palavra: Na fila, Aguardando você, Falhou; o passo atual em texto.",
              dont: "Só a cor do rosto ou só o ícone animado dizendo o que acontece.",
            },
            {
              do: "Agente que trava vira Aguardando você, na pílula e no painel, com Revisar.",
              dont: "Deixar o agente “trabalhando” para sempre enquanto espera um dado que só você tem.",
            },
            {
              do: "A conclusão aparece (check, riscado) antes de sair; a entrega abre como cartão para conferir.",
              dont: "Tirar a tarefa da lista sem mostrar o resultado.",
            },
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
