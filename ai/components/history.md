# history

Arquivo: `src/components/history.tsx` · importe de `@g4ai/ds`.

Histórico e progresso no tempo.

## Milestone (type)

```ts
type Milestone = { id: string; title: ReactNode; description?: ReactNode; status: "done" | "current" | "todo"; date?: string; }
```

## ProjectProgressCard

Projeto em um cartão: título, responsável, prazo, progresso e marcos numa linha do tempo vertical; um único próximo passo no rodapé.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `milestones` * | `Milestone[]` |  |  |
| `title` * | `ReactNode` |  |  |
| `action` | `ReactNode` |  | O próximo passo: um `Button` (primário) ou link. |
| `className` | `string \| undefined` |  |  |
| `due` | `string \| undefined` |  | Prazo final (ISO). |
| `late` | `boolean \| undefined` | `false` | Prazo vencido: a data fica em `rose` com a palavra "Atrasado". |
| `owner` | `ReactNode` |  | Responsável ("Ana Lopes"). |
| `subtitle` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-progresso-e-presenca`):

```tsx
<ProjectProgressCard late due="2026-09-26" … />
```

## Revision (type)

```ts
type Revision = { id: string; date: string; title: ReactNode; time?: string; author?: ReactNode; kind?: "major" | "minor"; tag?: ReactNode; content?: ReactNode; }
```

## RevisionTimeline

Histórico de revisões navegável por dia.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `revisions` * | `Revision[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `defaultValue` | `string \| undefined` |  | Id inicial. Padrão: a mais recente. |
| `futureDays` | `number \| undefined` | `7` | Dias futuros (tracejados) depois de hoje. |
| `height` | `number \| undefined` |  | Altura fixa da área de conteúdo (rola por dentro). |
| `label` | `string \| undefined` | `"Histórico de revisões"` | Nome acessível do dial. |
| `onChange` | `((id: string) => void) \| undefined` |  |  |
| `padDays` | `number \| undefined` | `14` | Dias vazios desenhados antes da primeira revisão. |
| `today` | `string \| undefined` |  | "Hoje" do dial (ISO). |
| `value` | `string \| undefined` |  | Id da revisão aberta (controlado). |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/exibicao-historico-e-versoes`):

```tsx
<RevisionTimeline today="2026-10-01" revisions={[
  { id: "r1", date: "2026-09-08", kind: "major", title: "v1.0 · primeira versão", author: "Ana Lopes", time: "10:12", content: <Notas /> },
  { id: "r5", date: "2026-09-29", kind: "major", title: "v1.2 · passagem para o vendedor", tag: <Badge tone="ok">Em produção</Badge>, content: <Notas /> },
]} />
```
