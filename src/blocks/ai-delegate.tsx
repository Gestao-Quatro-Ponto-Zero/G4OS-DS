import { ListPlus } from "lucide-react";
import { useId, useState } from "react";
import {
  AgentQueue,
  ApprovalRequest,
  Button,
  DelegableTaskList,
  DelegationPill,
  Empty,
  Page,
  PageHeading,
  Sheet,
  Skeleton,
  TaskResultCard,
  formatCurrency,
  formatNumber,
  notify,
  useDelegationDemo,
  useReducedMotion,
  type AgentRef,
  type DelegableTask,
  type DelegationDemoStep,
} from "@g4ai/ds";
import { AssistantShell, assistantRoutes } from "./shells/assistant-shell";
import { setFrameQuery, useFrameParam } from "./shells/frame-route";

/** Metadados do showcase. Pode apagar ao copiar para o seu app. */
export const meta = {
  title: "Tarefas da semana",
  description:
    "A lista da semana de uma gestora: marque várias tarefas (clique, arraste ou Shift), delegue aos agentes e acompanhe ao vivo. Pílula com quem está trabalhando, painel de agentes com o passo atual, pedido de aprovação antes de pagar, conclusões uma a uma e o resultado em cartão com tabela e planilha. Cinco estados (?estado=).",
  category: "IA",
  order: 5,
  height: 1040,
  concept: {
    goal: "Tirar da mão o que um agente resolve sozinho sem perder o controle: ver quem está fazendo o quê, decidir o que mexe em dinheiro e receber a entrega pronta para conferir.",
    patterns: [
      'Anatomia A · Lista em coluna de leitura (Page width="reading"): um cartão "Esta semana", sem filtros (lista curta, abaixo do limiar de collectionThresholds)',
      "DelegableTaskList: seleção múltipla (clique, arrasto, Shift, teclado) e barra flutuante com Delegar (n) e o agente (Automático ou um nome)",
      "DelegationPill no topo: rostos empilhados + frase (2 agentes trabalhando · 1 aguardando você · Financeiro respondeu ✓); no celular abre o painel em folha",
      "AgentQueue: uma linha por tarefa em curso com o passo ao vivo (aria-live); Parar e Ver detalhes no ⋯; falha com Tentar de novo",
      "O que mexe em dinheiro trava em Aguardando você e vira ApprovalRequest com o valor (R$ 842,30) antes de pagar",
      "Concluída: check, riscado e sai da lista; a entrega abre como TaskResultCard (Trabalhou por ›, tabela-resumo, planilha com Abrir em, Aprovar/Pedir ajuste)",
      "Estados: carregando (forma da lista), vazio (Criar tarefa), erro de um agente (linha com falha e Tentar de novo). Sem estado de filtro: a tela não filtra",
    ],
    adapt: [
      "Gestão pessoal, backoffice financeiro, operação de compras, assistente de agenda: troque tarefas, agentes e roteiros",
      "Ligue useDelegationDemo ao seu orquestrador: status e activity vêm do servidor; o resto da tela não muda",
    ],
    avoid: [
      "Delegar tarefa sem dono ou sem prazo (o agente não sabe quando é tarde)",
      "Agente pagar, enviar ou cancelar sem aprovação explícita",
      "Status só por cor ou só pelo ícone: sempre com palavra",
      "Contador de total na pílula: ela diz o que está acontecendo, não quantas tarefas existem",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dados de exemplo (troque pelos seus agentes e pela sua lista)       */
/* ------------------------------------------------------------------ */

const agents: AgentRef[] = [
  {
    id: "financeiro",
    name: "Financeiro",
    seed: "agente-financeiro",
    palette: 2,
  },
  { id: "compras", name: "Compras", seed: "agente-compras", palette: 5 },
  { id: "agenda", name: "Agenda", seed: "agente-agenda", palette: 0 },
  { id: "redacao", name: "Redação", seed: "agente-redacao", palette: 7 },
];
const agent = (id: string) => agents.find((a) => a.id === id)!;

/** Datas relativas a hoje, para a demonstração ter sempre "Hoje" e "Amanhã". */
const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const week = (): DelegableTask[] => [
  {
    id: "conciliar",
    title: "Conciliar o extrato de outubro",
    due: inDays(2),
    priority: "alta",
    suggestedAgentId: "financeiro",
  },
  {
    id: "energia",
    title: "Pagar o boleto de energia",
    due: inDays(0),
    suggestedAgentId: "financeiro",
  },
  {
    id: "assinaturas",
    title: "Cancelar assinaturas sem uso",
    suggestedAgentId: "compras",
  },
  {
    id: "fatura",
    title: "Enviar a fatura de outubro para a Nexo",
    due: inDays(1),
    priority: "alta",
    suggestedAgentId: "financeiro",
  },
  {
    id: "pauta",
    title: "Preparar a pauta da reunião de segunda",
    due: inDays(3),
    suggestedAgentId: "redacao",
  },
  {
    id: "carro",
    title: "Agendar a revisão do carro",
    due: inDays(6),
    suggestedAgentId: "agenda",
  },
  {
    id: "seguro",
    title: "Renovar o seguro do escritório",
    due: inDays(-1),
    suggestedAgentId: "compras",
  },
];

const BOLETO = 842.3;

const scripts: Record<string, DelegationDemoStep[]> = {
  conciliar: ["Lendo o extrato do Banco Horizonte", "Cruzando 214 lançamentos com o sistema", "Separando as divergências", "Montando a planilha de conciliação", "Conferindo os totais"],
  energia: [
    "Lendo o boleto da Luz Paulista",
    `Conferindo o valor: ${formatCurrency(BOLETO)}`,
    { text: "Aguardando sua aprovação para pagar", waitForYou: true },
    "Agendando o pagamento para hoje",
    "Guardando o comprovante",
  ],
  assinaturas: ["Procurando cobranças recorrentes", "Encontrei 3 assinaturas sem uso", "Escrevendo os pedidos de cancelamento"],
  fatura: ["Lendo as horas lançadas em outubro", "Criando a fatura nº 1042", "Escrevendo o e-mail para a Nexo", "Enviando a fatura"],
  pauta: ["Lendo as notas da última reunião", "Juntando os pendentes do time", "Escrevendo a pauta"],
  carro: ["Procurando horários na oficina", { text: "Não consegui acessar a agenda da oficina", fail: true }, "Reservando quinta, 9h", "Mandando o convite para sua agenda"],
  seguro: ["Lendo a apólice atual", "Pedindo três cotações", "Comparando coberturas", "Separando a melhor proposta"],
};

type Result = Omit<Parameters<typeof TaskResultCard>[0], "title" | "agent">;

const results: Record<string, Result> = {
  conciliar: {
    durationMs: 134_000,
    steps: [
      "Leu o extrato do Banco Horizonte (214 lançamentos)",
      "Cruzou cada lançamento com contas a pagar e a receber",
      "Separou 3 divergências: duas tarifas e um Pix sem nota",
      "Montou a planilha com uma aba por divergência",
    ],
    children: "O extrato de outubro está conciliado. Ficaram 3 divergências para você olhar.",
    table: {
      caption: "Resumo da conciliação de outubro",
      columns: [
        { label: "Entradas", align: "end" },
        { label: "Saídas", align: "end" },
        { label: "Divergências", align: "end" },
      ],
      rows: [[formatCurrency(184_320.5), formatCurrency(151_870.2), 3]],
    },
    files: [
      {
        name: "conciliacao-outubro.xlsx",
        size: 48_200,
        openWith: [
          {
            label: "Planilhas do G4",
            onSelect: () => notify("Planilha aberta em Planilhas do G4"),
          },
          {
            label: "Aplicativo do computador",
            onSelect: () => notify("Planilha baixada"),
          },
        ],
      },
    ],
  },
  assinaturas: {
    durationMs: 71_000,
    steps: ["Leu as cobranças recorrentes dos últimos 3 meses", "Cruzou com os acessos do time", "Escreveu 3 pedidos de cancelamento"],
    children: "Encontrei 3 assinaturas sem acesso há mais de 60 dias. Os pedidos de cancelamento estão prontos; nada foi enviado ainda.",
    table: {
      caption: "Assinaturas sem uso",
      columns: [
        { label: "Assinaturas", align: "end" },
        { label: "Economia por mês", align: "end" },
        { label: "Economia no ano", align: "end" },
      ],
      rows: [[3, formatCurrency(389.7), formatCurrency(389.7 * 12)]],
    },
    needsReview: true,
  },
  fatura: {
    durationMs: 52_000,
    steps: ["Somou 86 horas lançadas em outubro", "Criou a fatura nº 1042", "Enviou para financeiro@nexo.com.br"],
    children: `A fatura nº 1042 (${formatCurrency(17_200)}) foi enviada para a Nexo, com vencimento em 15 dias.`,
    files: [{ name: "fatura-1042-nexo.pdf", size: 182_400 }],
  },
};

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */

export default function AiDelegate() {
  const estado = useFrameParam("estado");
  return (
    <AssistantShell current={assistantRoutes.tasks}>
      <Page width="reading">
        <PageHeading title="Tarefas" description="O que é seu nesta semana e o que os agentes estão fazendo por você." />
        {estado === "carregando" ? <Loading /> : estado === "vazio" ? <NoTasks /> : <Delegation key={estado ?? "ok"} failed={estado === "erro"} />}
      </Page>
    </AssistantShell>
  );
}

function Loading() {
  return (
    <div role="status" aria-label="Carregando tarefas" className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="mb-3 h-4 w-28" />
      {["w-[72%]", "w-[58%]", "w-[64%]", "w-[80%]", "w-[52%]"].map((w) => (
        <div key={w} className="flex h-11 items-center gap-3">
          <Skeleton className="h-[18px] w-[18px] rounded-full" />
          <Skeleton className={`h-3.5 ${w}`} />
        </div>
      ))}
    </div>
  );
}

function NoTasks() {
  return (
    <Empty
      icon={<ListPlus strokeWidth={1.5} aria-hidden />}
      title="Nenhuma tarefa nesta semana"
      description="Anote o que precisa sair até sexta. Você faz ou entrega a um agente."
      action={
        <Button size="sm" onClick={() => setFrameQuery({ estado: undefined })}>
          <ListPlus /> Criar tarefa
        </Button>
      }
    />
  );
}

/** Com `failed`, a revisão do carro já está com a Agenda e falhou (estado de erro de um agente). */
const happyScripts: Record<string, DelegationDemoStep[]> = Object.fromEntries(
  Object.entries(scripts).map(([id, steps]) => [id, steps.filter((step) => !(typeof step === "object" && "fail" in step && step.fail))]),
);

function initialTasks(failed: boolean): DelegableTask[] {
  const list = week();
  if (!failed) return list;
  return list.map((t) =>
    t.id === "carro"
      ? {
          ...t,
          agent: agent("agenda"),
          status: "falhou",
          activity: "Não consegui acessar a agenda da oficina",
        }
      : t.id === "conciliar"
      ? { ...t, agent: agent("financeiro"), status: "delegada" }
      : t,
  );
}

function Delegation({ failed }: { failed: boolean }) {
  // Fluxo normal sem falha; a falha da Agenda só aparece em ?estado=erro.
  const demo = useDelegationDemo(initialTasks(failed), {
    agents,
    scripts: failed ? scripts : happyScripts,
    tickMs: 2000,
  });
  const [finished, setFinished] = useState<string[]>([]);
  const [seen, setSeen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const reduce = useReducedMotion();
  const queueId = useId();
  const created = demo.tasks.some((t) => t.id === "nova");

  // Cada entrega com resultado entra no topo uma vez.
  const answeredId = demo.answered?.taskId ?? null;
  if (answeredId !== seen) {
    setSeen(answeredId);
    if (answeredId && results[answeredId] && !finished.includes(answeredId)) setFinished([answeredId, ...finished]);
  }

  const waiting = demo.tasks.find((t) => t.id === "energia" && t.status === "aguardando");
  const active = demo.tasks.some((t) => t.agent && t.status !== "concluida" && t.status !== "aberta");

  const openQueue = () => {
    if (window.matchMedia("(max-width: 767.98px)").matches) return setSheet(true);
    const target = document.getElementById(active ? queueId : `resultado-${finished[0]}`);
    target?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const queue = (id: string, title?: string, className?: string) => (
    <AgentQueue
      id={id}
      title={title}
      tasks={demo.tasks}
      className={className}
      onStop={(id) => {
        demo.stop(id);
        notify("Agente parado; a tarefa voltou para você");
      }}
      onOpen={() => notify("Detalhes abrem na execução do agente")}
      onRetry={demo.retry}
      onReview={() => {
        setSheet(false);
        document.getElementById("aprovacao")?.scrollIntoView({
          block: "nearest",
          behavior: reduce ? "auto" : "smooth",
        });
      }}
    />
  );

  return (
    <div className="flex flex-col gap-4 pb-12">
      {(active || demo.answered) && (
        <div className="flex justify-center">
          <DelegationPill tasks={demo.tasks} answered={demo.answered?.agent} onClick={openQueue} expanded={sheet} controls={queueId} />
        </div>
      )}

      {active && <div className="max-md:hidden">{queue(queueId)}</div>}

      {waiting && (
        <div id="aprovacao" className="scroll-mt-4">
          <ApprovalRequest
            title="Pagar o boleto de energia"
            eyebrow="Financeiro pede aprovação"
            description="Luz Paulista, vencimento hoje. O valor bate com a média dos últimos 6 meses."
            impact={formatCurrency(BOLETO)}
            preview="Débito em conta no Banco Horizonte (final 4021), agendado para hoje. Código de barras conferido com a conta de outubro."
            onApprove={() => {
              demo.approve("energia");
              notify("Pagamento aprovado");
            }}
            onReject={() => {
              demo.stop("energia");
              notify("Pagamento recusado; a tarefa voltou para você");
            }}
          />
        </div>
      )}

      {finished.map((id) => {
        const task = demo.tasks.find((t) => t.id === id)!;
        const r = results[id];
        const done = reviewed.includes(id);
        return (
          <div key={id} id={`resultado-${id}`} className="enter scroll-mt-4">
            <TaskResultCard
              title={task.title}
              agent={task.agent}
              {...r}
              needsReview={r.needsReview && !done}
              onApprove={() => {
                setReviewed((list) => [...list, id]);
                notify(`${formatNumber(3)} cancelamentos enviados`);
              }}
              onRequestChanges={() => notify("Pedido de ajuste enviado ao agente")}
              actions={
                !r.needsReview || done ? (
                  <Button size="sm" variant="quiet" className="-ml-2" onClick={() => setFinished((list) => list.filter((x) => x !== id))}>
                    Arquivar
                  </Button>
                ) : undefined
              }
            />
          </div>
        );
      })}

      <DelegableTaskList
        title="Esta semana"
        tasks={demo.tasks}
        agents={agents}
        onDelegate={(ids, agentId) => demo.delegate(ids, agentId)}
        onComplete={(ids) => {
          demo.complete(ids);
          notify(ids.length === 1 ? "Tarefa concluída" : `${formatNumber(ids.length)} tarefas concluídas`);
        }}
        onCreate={
          created
            ? undefined
            : () => {
                demo.add({
                  id: "nova",
                  title: "Revisar o contrato com a Nexo",
                  due: inDays(4),
                  suggestedAgentId: "redacao",
                });
                notify("Tarefa criada");
              }
        }
      />
      <p className="m-0 text-center text-[12px] text-muted">Marque várias com clique, arrasto ou Shift. No teclado: setas e Espaço.</p>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Agentes" description="O que cada agente está fazendo agora.">
        {queue(`${queueId}-folha`, "Em curso", "border-0 [&>header]:px-0 [&>ul]:px-0")}
      </Sheet>
    </div>
  );
}
