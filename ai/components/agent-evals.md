# agent-evals

Arquivo: `src/components/agent-evals.tsx` · importe de `@g4ai/ds`.

------------------------------------------------------------------

## EvalCase (type)

Um caso de teste da suíte.

```ts
type EvalCase = { id: string; title: string; status: EvalCaseStatus }
```

## EvalCaseCompare

Um caso da avaliação aberto lado a lado: a entrada, o que a versão-base e a candidata responderam, a rubrica do juiz (✓/× por critério nas duas) e a nota.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `evalCase` * | `EvalCaseDetail` |  |  |
| `className` | `string \| undefined` |  |  |
| `onAccept` | `((evalCase: EvalCaseDetail) => void) \| undefined` |  | "Aceitar mudança": a saída da candidata vira a referência do caso. |
| `onClose` | `(() => void) \| undefined` |  |  |
| `onOpenIssue` | `((evalCase: EvalCaseDetail) => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<EvalCaseCompare evalCase={{ title, status: "regression", input, baseline: { label: "Base · v11", output, score: 1 },\n  candidate: { label: "Candidata · v12", output, score: 0.5 }, criteria, judge }} onAccept={aceitar} onOpenIssue={abrirChamado} />
```

## EvalCaseDetail (type)

Um caso aberto para comparar: entrada, saída da base e da candidata, rubrica do juiz.

```ts
type EvalCaseDetail = { id: string; title: string; category?: string; status: EvalCaseStatus; input: ReactNode; baseline: EvalSide; candidate: EvalSide; criteria: { label: string; baseline: boolean; candidate: boolean }[]; judge?: { name: string; note?: ReactNode }; }
```

## EvalCaseStatus (type)

Resultado de um caso na versão candidata.

```ts
type EvalCaseStatus = "pass" | "fail" | "error" | "regression" | "improved" | "pending"
```

## EvalCategory (type)

Uma categoria da suíte (Reembolso, Frete, Tom…) com os seus casos e o score da versão-base (fração).

```ts
type EvalCategory = { id: string; label: string; cases: EvalCase[]; baseline?: number }
```

## EvalDotGrid

Resultado de uma suíte de avaliação caso a caso: por categoria, o score com a marca da versão-base e uma grade de pontos (um por caso) que se preenche conforme os resultados chegam.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `categories` * | `EvalCategory[]` |  |  |
| `baselineLabel` | `string \| undefined` | `"base"` | Nome da versão-base na legenda e na marca da barra ("v11"). |
| `className` | `string \| undefined` |  |  |
| `filter` | `EvalFilter \| undefined` |  | Recorte controlado. Sem ele, a grade guarda o próprio. |
| `label` | `string \| undefined` | `"Resultados por caso"` | Nome acessível da grade. |
| `onFilterChange` | `((filter: EvalFilter) => void) \| undefined` |  |  |
| `onOpenCase` | `((evalCase: EvalCase, category: EvalCategory) => void) \| undefined` |  |  |
| `selectedId` | `string \| undefined` |  | Caso aberto (destacado na grade). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<EvalRunHeader title="Agente de atendimento" candidate={{ label: "v12", model: "G4 Pro" }} baseline={{ label: "v11" }}
  judge="G4 Analítico" caseCount={48} score={0.854} baselineScore={0.833} history={ultimas8}
  cost={2.9} durationMs={180000} action={<OperationButton operation={op} onClick={rodar}>Rodar</OperationButton>} />
<EvalDotGrid categories={[{ id: "refund", label: "Reembolso", baseline: 0.88, cases: [{ id, title, status: "regression" }, …] }]}
  baselineLabel="v11" onOpenCase={(c) => abrir(c.id)} />
```

## EvalFilter (type)

Recorte da grade: todos, só falhas (falhou, erro, regressão), só regressões ou só melhorias.

```ts
type EvalFilter = "all" | "failed" | "regressions" | "improved"
```

## EvalRunHeader

Cabeçalho de uma execução de suíte: candidata × base, juiz, score atual contra o da base, as últimas execuções numa linha, custo e tempo estimados e a ação de rodar (passe um `OperationButton`).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `baseline` * | `EvalVersion` |  |  |
| `baselineScore` * | `number` |  |  |
| `candidate` * | `EvalVersion` |  |  |
| `caseCount` * | `number` |  |  |
| `score` * | `number \| null` |  | Score da candidata (fração) ou `null` se ainda não rodou. |
| `title` * | `string` |  | Nome da suíte ou do agente avaliado. |
| `action` | `ReactNode` |  | Ação de rodar (`OperationButton`). |
| `className` | `string \| undefined` |  |  |
| `cost` | `number \| undefined` |  | Custo estimado da execução, em reais. |
| `durationMs` | `number \| undefined` |  | Tempo estimado da execução. |
| `history` | `{ label: string; score: number; }[] \| undefined` | `[]` | Últimas execuções, da mais antiga à mais recente (fração). |
| `judge` | `string \| undefined` |  | Modelo ou pessoa que julga as respostas. |
| `progress` | `{ done: number; total: number; } \| undefined` |  | Casos já rodados nesta execução. |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<EvalRunHeader title="Agente de atendimento" candidate={{ label: "v12", model: "G4 Pro" }} baseline={{ label: "v11" }}
  judge="G4 Analítico" caseCount={48} score={0.854} baselineScore={0.833} history={ultimas8}
  cost={2.9} durationMs={180000} action={<OperationButton operation={op} onClick={rodar}>Rodar</OperationButton>} />
<EvalDotGrid categories={[{ id: "refund", label: "Reembolso", baseline: 0.88, cases: [{ id, title, status: "regression" }, …] }]}
  baselineLabel="v11" onOpenCase={(c) => abrir(c.id)} />
```

## EvalSide (type)

Saída de uma versão num caso: rótulo ("Base · v11"), texto e nota do juiz (fração).

```ts
type EvalSide = { label: string; output: ReactNode; score: number }
```

## EvalStatusMark

Marca de um estado, para legenda e cabeçalhos (mesma forma do ponto da grade).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `EvalCaseStatus` |  |  |
| `size` | `"sm" \| "md" \| undefined` | `"md"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## EvalVersion (type)

Uma versão avaliada: rótulo ("v12") e modelo.

```ts
type EvalVersion = { label: string; model?: string }
```
