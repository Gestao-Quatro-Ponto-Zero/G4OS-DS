# agent-tasks

Arquivo: `src/components/agent-tasks.tsx` · importe de `@g4ai/ds`.

Tarefas delegadas a agentes: a pessoa escolhe o que sai da mão dela, entrega a um ou mais agentes e acompanha o trabalho ao vivo até o resultado.

## AgentQueue

Painel "Agentes": uma linha por tarefa delegada ainda em curso, com o rosto do agente, o título e o que ele está fazendo agora (anunciado ao leitor de tela, troca com um fade curto).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tasks` * | `DelegableTask[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `id` | `string \| undefined` |  | Para a pílula apontar (`aria-controls`). |
| `onOpen` | `((taskId: string) => void) \| undefined` |  |  |
| `onRetry` | `((taskId: string) => void) \| undefined` |  |  |
| `onReview` | `((taskId: string) => void) \| undefined` |  | Abrir o que o agente pede (aprovação, dado que falta). |
| `onStop` | `((taskId: string) => void) \| undefined` |  | Interromper o agente: a tarefa volta para você. |
| `title` | `string \| undefined` | `"Agentes"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-delegadas`):

```tsx
<AgentQueue
  tasks={tarefas}
  onStop={parar}
  onOpen={abrirExecucao}
  onRetry={tentarDeNovo}
  onReview={revisar}
/>
```

## AgentRef (type)

Um agente que recebe tarefas.

```ts
type AgentRef = { id: string; name: string; seed?: string; palette?: number; shape?: AgentOrbShape; }
```

## DelegableTask (type)

Uma tarefa que pode ser delegada.

```ts
type DelegableTask = { id: string; title: string; due?: Date | string; priority?: "alta" | "normal"; agent?: AgentRef; status?: DelegableTaskStatus; activity?: string; suggestedAgentId?: string; }
```

## DelegableTaskList

Lista de tarefas com seleção múltipla para delegar a agentes.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tasks` * | `DelegableTask[]` |  |  |
| `agents` | `AgentRef[] \| undefined` | `[]` | Agentes do seletor da barra. |
| `className` | `string \| undefined` |  |  |
| `now` | `Date \| undefined` |  | Referência de "hoje" para os prazos. |
| `onComplete` | `((ids: string[]) => void) \| undefined` |  | Marcar as tarefas como concluídas pela própria pessoa. |
| `onCreate` | `(() => void) \| undefined` |  | Botão "+" do cabeçalho. |
| `onDelegate` | `((ids: string[], agentId: string \| null) => void) \| undefined` |  | Delegar as tarefas marcadas. |
| `onSelectedChange` | `((ids: string[]) => void) \| undefined` |  |  |
| `selected` | `string[] \| undefined` |  | Seleção controlada (ids). |
| `showCompleted` | `boolean \| undefined` | `false` | Mantém as concluídas na lista (riscadas) em vez de tirá-las. |
| `title` | `string \| undefined` | `"Esta semana"` | Título do cartão. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-delegadas`):

```tsx
<DelegableTaskList
  title="Esta semana"
  tasks={tarefas}
  agents={agentes}
  selected={marcadas}
  onSelectedChange={setMarcadas}
  onDelegate={(ids, agentId) => delegar(ids, agentId)}
  onCreate={criarTarefa}
/>
```

## DelegableTaskStatus (type)

Situação da tarefa. `aberta` é da pessoa; `delegada` está na fila do agente; `trabalhando` está em execução; `aguardando` travou e pede você (aprovação, dado que falta); `falhou` parou com erro; `concluida` terminou.

```ts
type DelegableTaskStatus = "aberta" | "delegada" | "trabalhando" | "aguardando" | "falhou" | "concluida"
```

## DelegationDemoStep (type)

Um passo do roteiro de demonstração: texto, ou texto que trava pedindo você ou que falha.

```ts
type DelegationDemoStep = string | { text: string; waitForYou?: boolean; fail?: boolean }
```

## DelegationPill

Pílula flutuante do trabalho delegado: rostos dos agentes e uma frase ("2 agentes trabalhando", "1 aguardando você", "Financeiro respondeu ✓").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `tasks` * | `DelegableTask[]` |  |  |
| `answered` | `AgentRef \| null \| undefined` |  | Agente que acabou de entregar: mostra "<nome> respondeu" quando ninguém mais trabalha. |
| `className` | `string \| undefined` |  |  |
| `controls` | `string \| undefined` |  | Id do painel que a pílula abre. |
| `expanded` | `boolean \| undefined` |  | Painel aberto (folha no celular). |
| `onClick` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-delegadas`):

```tsx
<DelegationPill tasks={tarefas} answered={ultimoAgente} onClick={abrirPainel} />
```

## describeTaskDue (function)

Prazo de tarefa em palavras: "Hoje", "Amanhã", "Sexta" (até 6 dias), "21 nov" depois disso e "Atrasada" antes de hoje.

```ts
describeTaskDue(due, now?): { label: string; full: string; tone: "atrasada"; } | { label: string; full: string; tone: "hoje"; } | { lab…
```

## TaskResultCard

Resultado de uma tarefa delegada: título, quem fez, "Trabalhou por 2 min 14 s ›" (abre os passos), a frase de resultado, uma tabela-resumo opcional, os arquivos entregues (com "Abrir em") e, se a entrega pede revisão, "A

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  | Ações extras no rodapé (ou no lugar das de revisão). |
| `agent` | `AgentRef \| undefined` |  |  |
| `children` | `ReactNode` |  | A frase de resultado. |
| `className` | `string \| undefined` |  |  |
| `durationMs` | `number \| undefined` |  | Tempo de trabalho do agente. |
| `files` | `TaskResultFile[] \| undefined` |  |  |
| `needsReview` | `boolean \| undefined` | `false` | A entrega espera sua decisão: mostra Aprovar e Pedir ajuste. |
| `onApprove` | `(() => void) \| undefined` |  |  |
| `onRequestChanges` | `(() => void) \| undefined` |  |  |
| `steps` | `(string \| AgentRunStep)[] \| undefined` |  | Passos (texto simples ou `AgentRunStep`) que abrem sob "Trabalhou por". |
| `table` | `TaskResultTable \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-delegadas`):

```tsx
<TaskResultCard
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
</TaskResultCard>
```

## TaskResultFile (type)

Arquivo entregue pelo agente, com destinos de "Abrir em".

```ts
type TaskResultFile = { name: string; size?: number; meta?: ReactNode; openWith?: { label: string; icon?: ReactNode; onSelect?: () => void }[]; }
```

## TaskResultTable (type)

Tabela-resumo do resultado.

```ts
type TaskResultTable = { columns: { label: string; align?: "start" | "end" }[]; rows: (ReactNode | number)[][]; caption?: string; }
```

## useDelegationDemo (hook)

Simula o ciclo de delegação para showcase, protótipo e testes de usabilidade: delegada → passos do roteiro (um por compasso, só com a aba visível) → concluída.

```ts
useDelegationDemo(initial, props): { tasks: DelegableTask[]; answered: { taskId: string; agent: AgentRef; } | null; running: boolean; delegate…
```

Exemplo (showcase `#/p/ia-tarefas-delegadas`):

```tsx
const demo = useDelegationDemo(tarefas, { agents, scripts });

<DelegationPill tasks={demo.tasks} answered={demo.answered?.agent} onClick={abrirPainel} />
<AgentQueue tasks={demo.tasks} onStop={demo.stop} onRetry={demo.retry} onReview={revisar} />
<DelegableTaskList tasks={demo.tasks} agents={agents} onDelegate={demo.delegate} />
```
