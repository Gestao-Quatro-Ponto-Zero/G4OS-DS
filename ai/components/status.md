# status

Arquivo: `src/components/status.tsx` · importe de `@g4ai/ds`.

Status de trabalho (5 estados), StatusLabel, StatusBar, HealthDot, Stepper, NextStep, Timeline.

## HealthDot

Saúde de uma entidade: ponto + palavra.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `tone` * | `"neutral" \| "ok" \| "warn" \| "bad"` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## NextStep

Moldura de "próximo passo": o único lugar em que o dourado emoldura algo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `children` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## StatusBar

Barra empilhada de distribuição (quantos em cada estado) + legenda.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `counts` * | `Partial<Record<WorkStatus, number>>` |  |  |
| `className` | `string \| undefined` |  |  |
| `labels` | `Record<WorkStatus, string> \| undefined` | `statusLabel` |  |
| `legend` | `boolean \| undefined` | `true` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## statusColor (const)

## statusLabel (const)

## StatusLabel

Ponto de status + rótulo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `status` * | `WorkStatus` |  |  |
| `label` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## statusOrder (const)

## Step (type)

```ts
type Step = { id: string; label: string; hint?: string; state: "done" | "current" | "upcoming" }
```

## Stepper

Etapas de um ciclo/processo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `steps` * | `Step[]` |  |  |
| `label` | `string \| undefined` | `"Etapas"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## Timeline

Linha do tempo vertical: o que aconteceu, em ordem.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `items` * | `TimelineItem[]` |  |  |
| `leadingWidth` | `number \| undefined` | `96` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/exibicao-historico-e-versoes`):

```tsx
<Timeline items={[
  { id: "v12", current: true, leading: <><b>v1.2</b><br />29 set</>, title: "Passagem para o vendedor", body: "Agenda a reunião…" },
  { id: "v11", leading: <><b>v1.1</b><br />19 set</>, title: "Consulta ao ERP", body: "…" },
]} />
```

## TimelineItem (type)

```ts
type TimelineItem = { id: string; title: ReactNode; meta?: ReactNode; tone?: Tone; body?: ReactNode; leading?: ReactNode; current?: boolean; }
```

## WorkStatus (type)

```ts
type WorkStatus = "queued" | "active" | "review" | "done" | "blocked"
```
