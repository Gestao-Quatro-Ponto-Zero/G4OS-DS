# tasks-ai

Arquivo: `src/components/tasks-ai.tsx` · importe de `@g4ai/ds`.

Tarefas propostas pela IA (a partir de uma reunião, documento ou análise).

## ProposalState (type)

```ts
type ProposalState = "pendente" | "aceita" | "recusada"
```

## Subtask (type)

```ts
type Subtask = { id: string; title: string; type?: SubtaskType; done?: boolean; assignee?: Person }
```

## SubtaskRow

Sub-tarefa: círculo de concluído, título, tipo (pílula com ponto), responsável.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `subtask` * | `Subtask` |  |  |
| `onToggle` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## SubtaskType (type)

```ts
type SubtaskType = "melhoria" | "funcionalidade" | "bug"
```

## TaskDestination (type)

```ts
type TaskDestination = { id: string; label: string; icon?: ReactNode }
```

## TaskProposal (type)

```ts
type TaskProposal = { id: string; destination: string; title: string; description?: ReactNode; emphasis?: ReactNode; subtasks?: Subtask[]; project?: string; status?: TaskStatus; priority?: Priority; assignee?: Person; labels?: string[]; estimate?: string; }
```

## TaskProposalCard

Card de tarefa proposta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `destinations` * | `TaskDestination[]` |  |  |
| `proposal` * | `TaskProposal` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultOpen` | `boolean \| undefined` | `true` |  |
| `onAccept` | `(() => void) \| undefined` |  |  |
| `onChange` | `((patch: Partial<TaskProposal>) => void) \| undefined` |  |  |
| `onDecline` | `(() => void) \| undefined` |  |  |
| `onUndo` | `(() => void) \| undefined` |  |  |
| `people` | `Person[] \| undefined` | `[]` |  |
| `projects` | `string[] \| undefined` | `[]` |  |
| `state` | `ProposalState \| undefined` | `"pendente"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-propostas`):

```tsx
<TaskProposalList pending={n} total={total} onAcceptAll={…} onDeclineAll={…}>
  {propostas.map((p) => (
    <TaskProposalCard key={p.id} proposal={p} state={estado[p.id]} destinations={destinos}
      people={time} projects={projetos}
      onChange={(patch) => atualizar(p.id, patch)}
      onAccept={() => aceitar(p.id)} onDecline={() => recusar(p.id)} onUndo={() => voltar(p.id)} />
  ))}
</TaskProposalList>
```

## TaskProposalList

Painel de propostas: cabeçalho com contagem e "Aceitar todas / Recusar todas", cards em coluna (o primeiro aberto; os seguintes recolhidos e esmaecidos).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `pending` * | `number` |  |  |
| `total` * | `number` |  |  |
| `className` | `string \| undefined` |  |  |
| `onAcceptAll` | `(() => void) \| undefined` |  |  |
| `onDeclineAll` | `(() => void) \| undefined` |  |  |
| `title` | `string \| undefined` | `"Tarefas"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-tarefas-propostas`):

```tsx
<TaskProposalList pending={n} total={total} onAcceptAll={…} onDeclineAll={…}>
  {propostas.map((p) => (
    <TaskProposalCard key={p.id} proposal={p} state={estado[p.id]} destinations={destinos}
      people={time} projects={projetos}
      onChange={(patch) => atualizar(p.id, patch)}
      onAccept={() => aceitar(p.id)} onDecline={() => recusar(p.id)} onUndo={() => voltar(p.id)} />
  ))}
</TaskProposalList>
```
