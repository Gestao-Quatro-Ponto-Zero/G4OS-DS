# feedback

Arquivo: `src/components/feedback.tsx` · importe de `@g4ai/ds`.

Feedback de operação: notify/Toaster, Callout, useOperation, OperationButton, OperationFeedback, Skeleton.

## Callout

Aviso fixo dentro da página (não some).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |
| `title` | `string \| undefined` |  |  |
| `tone` | `"ok" \| "warn" \| "bad" \| "info" \| undefined` | `"info"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-avisos`):

```tsx
<Callout tone="warn" title="Integração com Google desconectada" action={<Button size="sm" variant="ghost">Reconectar</Button>}>…</Callout>
```

## ListSkeleton

Linhas de uma lista enquanto ela abre: marca, duas linhas de texto e um valor à direita, dentro da mesma moldura da lista final.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `delay` | `number \| undefined` | `180` |  |
| `rows` | `number \| undefined` | `4` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
{members.loading ? <ListSkeleton label="Abrindo os membros" rows={3} /> : <RowList>…</RowList>}
```

## notify (function)

Dispara um toast de qualquer lugar (não precisa de contexto React).

```ts
notify(message, undoOrOptions?, tone?): void
```

Exemplo (showcase `#/p/fb-toasts`):

```tsx
arquivar(candidato);
notify("Candidato arquivado", () => restaurar(candidato));
```

## NotifyAction (type)

Ação do toast que leva ao resultado ("Ver título", "Abrir pedido").

```ts
type NotifyAction = { label: string; onClick: () => void }
```

## NotifyOptions (type)

```ts
type NotifyOptions = { undo?: () => void; action?: NotifyAction; tone?: Notice["tone"] }
```

## Operation (type)

```ts
type Operation = ReturnType<typeof useOperation>
```

## OperationButton

Botão que conta o progresso ("Salvando…") e se desabilita enquanto confirma ou após falha.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `operation` * | `Pick<{ busy: boolean; error: string; uncertain: boolean; pending: boolean; busyLabel: string; run: (task: (…` |  |  |
| `busyLabel` | `string \| undefined` |  |  |
| `disabledReason` | `ReactNode` |  | Por que está desabilitado (tooltip + leitor de tela), igual a Button. |
| `size` | `"sm" \| "md" \| undefined` |  |  |
| `variant` | `ButtonVariant \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/ia-execucao-e-avaliacao`):

```tsx
<EvalRunHeader title="Agente de atendimento" candidate={{ label: "v12", model: "G4 Pro" }} baseline={{ label: "v11" }}
  judge="G4 Analítico" caseCount={48} score={0.854} baselineScore={0.833} history={ultimas8}
  cost={2.9} durationMs={180000} action={<OperationButton operation={op} onClick={rodar}>Rodar</OperationButton>} />
<EvalDotGrid categories={[{ id: "refund", label: "Reembolso", baseline: 0.88, cases: [{ id, title, status: "regression" }, …] }]}
  baselineLabel="v11" onOpenCase={(c) => abrir(c.id)} />
```

## OperationFeedback

Bloco de erro com a saída certa.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `operation` * | `Pick<{ busy: boolean; error: string; uncertain: boolean; pending: boolean; busyLabel: string; run: (task: (…` |  |  |
| `className` | `string \| undefined` |  |  |
| `inline` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## OperationSuccess (type)

```ts
type OperationSuccess = { message: string; undo?: () => void; action?: NotifyAction }
```

## PageSkeleton

A página enquanto abre, na forma da anatomia que ela vai ter: cabeçalho, abas e o corpo certo (linhas de lista, cartões de indicador e gráfico, registro com coluna de propriedades, seções de configuração).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  | Dito a leitores de tela: "Abrindo o time". |
| `anatomy` | `"list" \| "dashboard" \| "record" \| "settings" \| undefined` | `"list"` | Forma do corpo: `list` (toolbar + linhas), `dashboard` (indicadores + gráfico), `record` (corpo + coluna de propriedades), `settings` (seções rótulo/campos). |
| `className` | `string \| undefined` |  |  |
| `delay` | `number \| undefined` | `180` |  |
| `rows` | `number \| undefined` | `5` |  |
| `tabs` | `number \| undefined` | `0` | Quantas abas o cabeçalho tem (0 = sem abas). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
if (query.loading) return (
  <Page>
    <PageSkeleton label="Abrindo o agente" anatomy="record" tabs={4} />
  </Page>
);
```

## Skeleton

Esqueleto de carregamento: blocos gelo com pulso suave.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-carregando`):

```tsx
<Skeleton className="h-3 w-24" />
<Skeleton className="mt-3 h-7 w-32" />
<Skeleton className="mt-3 h-3 w-40" />
```

## Toaster

Monte uma vez perto da raiz (AppShell já monta).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `duration` | `number \| undefined` | `6500` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/fb-toasts`):

```tsx
import { Toaster, notify } from "@g4ai/ds";

// raiz do app (se não usar AppShell)
<Toaster duration={6500} />

// qualquer lugar, depois que a ação terminou
notify("Proposta enviada para Ana Lima");
```

## UncertainFailure (class)

Falha em que não se sabe se o servidor gravou (rede caiu, timeout).

## useDelayed (hook)

`true` depois de `ms`: atrasa o que só deve aparecer se a espera for longa (esqueleto, "Carregando…").

```ts
useDelayed(ms?): boolean
```

## useOperation (hook)

Um gesto que espera confirmação, com a mesma forma em todo o produto.

```ts
useOperation(options?): { busy: boolean; error: string; uncertain: boolean; pending: boolean; busyLabel: string; run: (task: () => …
```
