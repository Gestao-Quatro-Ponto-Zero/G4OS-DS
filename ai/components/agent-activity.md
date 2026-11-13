# agent-activity

Arquivo: `src/components/agent-activity.tsx` · importe de `@g4ai/ds`.

Atividade do agente, por fases: um card compacto que mostra O QUE o agente está fazendo agora (lendo, buscando, pensando, escrevendo, revisando), o plano com o passo atual, o contexto da fase e quanto já custou.

## AgentActivityCard

Card de atividade do agente, por fases: marca + fase no topo, barra de progresso na cor da fase, plano com o passo atual, o contexto da fase (arquivo, busca, ideias, escrita, revisão, resultado), ferramentas, modelo e co

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `phase` * | `AgentPhase` |  |  |
| `plan` * | `AgentPlanStep[]` |  |  |
| `progress` * | `number` |  | Progresso da tarefa, de 0 a 1. |
| `task` * | `string` |  | Título da tarefa ("Adicionar alternador de tema escuro"). |
| `usage` * | `AgentUsage` |  |  |
| `agentName` | `string \| undefined` | `"Agente de código"` |  |
| `animate` | `boolean \| undefined` | `true` | `false` mostra cada painel já no estado final (documentação, listas, impressão). |
| `className` | `string \| undefined` |  |  |
| `context` | `AgentPhaseContext \| undefined` |  | Painel da fase atual. |
| `label` | `string \| undefined` |  | Nome acessível do card. |
| `model` | `string \| { models: ModelOption[]; value: string; onChange: (id: string) => void; } \| undefined` |  | Nome do modelo (chip estático) ou o `ModelPicker` controlado. |
| `onPause` | `(() => void) \| undefined` |  |  |
| `onRestart` | `(() => void) \| undefined` |  | "Executar de novo" depois de concluído, parado ou falhou. |
| `onResume` | `(() => void) \| undefined` |  |  |
| `onStop` | `(() => void) \| undefined` |  |  |
| `phaseLabel` | `string \| undefined` |  | Troca a palavra da fase no cabeçalho ("Lendo tokens.css"). |
| `tools` | `AgentTool[] \| undefined` |  |  |
| `unsavedChanges` | `boolean \| undefined` | `false` | Há alterações não salvas: Parar pede confirmação antes. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-atividade-do-agente`):

```tsx
<AgentActivityCard {...props} phase="${p}" animate={false} />
```

## agentActivitySample (function)

Um quadro estático de cada fase da demonstração (para documentação e estados).

```ts
agentActivitySample(phase): Omit<{ phase: AgentPhase; progress: number; task: string; plan: AgentPlanStep[]; context?: AgentPhaseContex…
```

## AgentMark

Marca do agente: quatro barras de equalizador na cor da fase.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |
| `live` | `boolean \| undefined` |  |  |
| `phase` | `AgentPhase \| undefined` | `"concluido"` |  |
| `size` | `number \| undefined` | `20` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-atividade-do-agente`):

```tsx
<AgentMark phase="escrevendo" />
<AgentPhaseBadge phase="escrevendo" />
```

## AgentPhase (type)

Fase do agente. As cinco de trabalho + concluído, pausado, parado e falhou.

```ts
type AgentPhase = "lendo" | "buscando" | "pensando" | "escrevendo" | "revisando" | "concluido" | "pausado" | "parado" | "falhou"
```

## AgentPhaseBadge

A fase como ponto + palavra, na cor da fase.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `phase` * | `AgentPhase` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-atividade-do-agente`):

```tsx
<AgentMark phase="escrevendo" />
<AgentPhaseBadge phase="escrevendo" />
```

## AgentPhaseContext (type)

O que a fase está mostrando: o arquivo lido, a busca, as ideias, o texto escrito, a revisão ou o resultado.

```ts
type AgentPhaseContext = | { kind: "arquivo"; path: string } | { kind: "busca"; query: string; results: { title: string; source: string }[] } | { kind: "ideias"; items: string[] } | { kind: "escrita"; path: string; text: string } | { kind: "revisao"; path: string; before: string; after: string } | { kind: "resultado"; title: string; summary: string; changes?: string[] } | { kind: "erro"; title: string; detail?: string }
```

## agentPhaseLabel (function)

Rótulo de cada fase ("Buscando na web").

```ts
agentPhaseLabel(phase): string
```

## AgentPlanStep (type)

Um passo do plano do agente.

```ts
type AgentPlanStep = { id: string; label: string; status: "pendente" | "atual" | "feito" }
```

## AgentTool (type)

Ferramenta conectada ao agente; `active` realça a que está em uso.

```ts
type AgentTool = { id: string; label: string; active?: boolean }
```

## AgentUsage (type)

Consumo da execução: tokens, custo (em reais) e tempo decorrido.

```ts
type AgentUsage = { tokens: number; cost: number; elapsedMs: number }
```

## useAgentActivityDemo (hook)

Percorre as fases do `AgentActivityCard` em ~15 s (só com a aba visível), com Pausar, Retomar, Parar e Executar de novo funcionando.

```ts
useAgentActivityDemo(props?): { phase: AgentPhase; task: string; progress: number; plan: AgentPlanStep[]; context: AgentPhaseContext; too…
```

Exemplo (showcase `#/p/ia-atividade-do-agente`):

```tsx
const demo = useAgentActivityDemo();
<AgentActivityCard {...demo} />

// No app: controlado pelo que o agente reporta.
<AgentActivityCard
  phase={run.phase}               // "lendo" | "buscando" | … | "concluido"
  progress={run.done / run.total}
  task="Adicionar alternador de tema escuro"
  plan={run.plan}                 // [{ id, label, status: "pendente" | "atual" | "feito" }]
  context={run.context}           // { kind: "escrita", path, text } …
  tools={run.tools}
  model={{ models, value: model, onChange: setModel }}
  usage={{ tokens: run.tokens, cost: run.cost, elapsedMs: run.elapsedMs }}
  unsavedChanges={run.dirty}
  onPause={pause} onResume={resume} onStop={stop} onRestart={rerun}
/>
```
