# agent-run

Arquivo: `src/components/agent-run.tsx` · importe de `@g4ai/ds`.

------------------------------------------------------------------

## AgentRunCard

Um cartão que acompanha uma execução de agente do começo ao fim: tarefa, agente e modelo, status (ponto + palavra) e cronômetro; passos que chegam um a um (o atual brilha); portão de aprovação com o diff quando o agente

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  | A tarefa, como a pessoa pediu ("Adicionar limite de requisições na API pública"). |
| `agent` | `string \| undefined` |  | Nome do agente. |
| `autoPlay` | `boolean \| undefined` | `true` | No modo demonstração, anda sozinho. |
| `className` | `string \| undefined` |  |  |
| `model` | `string \| undefined` |  | Modelo usado (nome do catálogo do app). |
| `onApprove` | `((change: AgentRunChange) => void) \| undefined` |  |  |
| `onOpenResult` | `(() => void) \| undefined` |  | Abre o resultado (pull request, lançamentos). |
| `onReject` | `((change: AgentRunChange, reason: string) => void) \| undefined` |  |  |
| `onRestart` | `(() => void) \| undefined` |  | Executar de novo. No modo demonstração recomeça o roteiro mesmo sem este callback. |
| `run` | `AgentRunState \| undefined` |  | Estado controlado: status, tempo, passos, aprovação pendente e resultado. |
| `script` | `AgentRunScript \| undefined` |  | Modo demonstração: roteiro simulado quando `run` não vem. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
// Modo demonstração: roteiro simulado (anda só com a aba visível)
<AgentRunCard title="Adicionar limite de requisições na API pública" agent="Agente de código" model="G4 Pro"
  script={{ steps, approvalAt: 5, approval: change, result }} onOpenResult={abrirPr} />

// Controlado: o seu backend manda o estado
<AgentRunCard title={tarefa} run={{ status: "waiting", elapsedMs, steps, approval: change }}
  onApprove={(c) => aplicar(c)} onReject={(c, motivo) => devolver(c, motivo)} />
```

## AgentRunChange (type)

A mudança que o agente quer aplicar e que espera aprovação.

```ts
type AgentRunChange = { id: string; title: string; summary?: ReactNode; files: AgentRunChangeFile[] }
```

## AgentRunChangeFile (type)

Um arquivo da mudança proposta, como diff unificado.

```ts
type AgentRunChangeFile = { path: string; diff: string }
```

## AgentRunCheck (type)

Uma verificação ao fim da execução (testes, lint, conferência de saldo).

```ts
type AgentRunCheck = { label: string; status: "passed" | "failed"; detail?: string }
```

## AgentRunOutcome (type)

O que a execução entregou.

```ts
type AgentRunOutcome = { summary?: ReactNode; files?: { path: string; added: number; removed: number }[]; checks?: AgentRunCheck[]; openLabel?: string; openIcon?: ReactNode; }
```

## AgentRunResult

Fim de uma execução: arquivos alterados com +/−, verificações que passaram, abrir o resultado e executar de novo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `result` * | `AgentRunOutcome` |  |  |
| `className` | `string \| undefined` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `onRestart` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<AgentRunResult result={{ files, checks, openLabel: "Abrir pull request", openIcon: <GitPullRequest /> }} onOpen={abrir} onRestart={deNovo} />
```

## AgentRunScript (type)

Roteiro do modo demonstração: passos, onde o portão de aprovação para a execução e o resultado.

```ts
type AgentRunScript = { steps: AgentRunStep[]; approvalAt?: number; approval?: AgentRunChange; result: AgentRunOutcome; }
```

## AgentRunState (type)

Estado controlado do AgentRunCard.

```ts
type AgentRunState = { status: AgentRunStatus; elapsedMs: number; steps: AgentRunStep[]; approval?: AgentRunChange; result?: AgentRunOutcome; error?: ReactNode; }
```

## AgentRunStatus (type)

Situação da execução inteira.

```ts
type AgentRunStatus = "running" | "waiting" | "done" | "failed"
```

## AgentRunStep (type)

Um passo da execução: texto curto no particípio ("Leu src/api/rotas.ts"), duração e, se for ferramenta, entrada e saída.

```ts
type AgentRunStep = { id: string; kind: AgentRunStepKind; label: string; status?: AgentRunStepStatus; durationMs?: number; tool?: { name: string; input?: unknown; output?: unknown; error?: string }; detail?: ReactNode; }
```

## AgentRunStepKind (type)

O que o agente fez naquele passo.

```ts
type AgentRunStepKind = "plan" | "read" | "search" | "edit" | "test" | "tool"
```

## AgentRunSteps

Passos de uma execução de agente, um por linha: ícone do tipo (planejar, ler, buscar, editar, testar, ferramenta), texto, duração e check.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `AgentRunStep[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Passos da execução"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<AgentRunSteps steps={[{ id: "1", kind: "read", label: "Leu src/api/rotas.ts", status: "done", durationMs: 900 }, …]} />
```

## AgentRunStepStatus (type)

Situação de um passo.

```ts
type AgentRunStepStatus = "pending" | "running" | "done" | "error"
```

## DiffApproval

Portão de aprovação de uma mudança proposta pelo agente: resumo, diff com uma aba por arquivo (com +/−), "Aprovar e aplicar" e "Devolver com comentário" (abre o campo do motivo).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `change` * | `AgentRunChange` |  |  |
| `autoFocus` | `boolean \| undefined` | `false` | Leva o foco ao portão quando ele aparece. |
| `busy` | `boolean \| undefined` | `false` | Aplicando: os botões ficam ocupados. |
| `className` | `string \| undefined` |  |  |
| `onApprove` | `((change: AgentRunChange) => void) \| undefined` |  |  |
| `onReject` | `((change: AgentRunChange, reason: string) => void) \| undefined` |  | Devolve ao agente com o comentário (obrigatório). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<DiffApproval change={{ id, title: "Revisar mudanças em 2 arquivos", summary, files: [{ path, diff }] }}\n  onApprove={aplicar} onReject={(c, motivo) => devolver(c, motivo)} />
```
