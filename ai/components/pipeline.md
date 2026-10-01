# pipeline

Arquivo: `src/components/pipeline.tsx` · importe de `@g4os/ds`.

Pipelines por etapa: StagePath, RecordCard.

## PathStage (type)

```ts
type PathStage = { id: string; label: string }
```

## RecordCard

Card de registro em quadro: título, subtítulo (empresa, vaga, cliente), valor em destaque, etiquetas, dono e data.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `draggable` | `boolean \| undefined` | `true` |  |
| `leading` | `ReactNode` |  | Marca à esquerda do título (EntityMark, Avatar). |
| `meta` | `ReactNode` |  | Canto inferior direito: prazo, idade, score. |
| `onDragStart` | `((event: DragEvent) => void) \| undefined` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `owner` | `{ name: string; initials: string; tint?: string; } \| undefined` |  |  |
| `subtitle` | `ReactNode` |  |  |
| `tags` | `ReactNode` |  |  |
| `tone` | `"warn" \| "bad" \| undefined` |  | Borda de atenção: parado há muito tempo (warn) ou bloqueado (bad). |
| `value` | `ReactNode` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-pipelines`):

```tsx
<KanbanBoard>
  {stages.map((st) => {
    const list = deals.filter((d) => d.stage === st.id);
    return (
      <KanbanColumn key={st.id} title={st.label} count={list.length}
        meta={formatCurrency(sum(list), { compact: true })}
        onDrop={drop(st.id)} width={240}>
        {list.map((d) => <RecordCard key={d.id} … />)}
      </KanbanColumn>
    );
  })}
</KanbanBoard>
```

## StagePath

Caminho de etapas de UM registro (topo da página de negócio/candidato).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `current` * | `string` |  |  |
| `stages` * | `PathStage[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Etapas"` |  |
| `onSelect` | `((id: string) => void) \| undefined` |  |  |
| `outcome` | `{ tone: "ok" \| "bad"; label: string; } \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/dash-pipelines`):

```tsx
<StagePath stages={stages} current={current} onSelect={setCurrent} label="Etapa do negócio" />
<StagePath stages={stages} current="negociacao" outcome={{ tone: "ok", label: "Ganho" }} />
<StagePath stages={stages} current="diagnostico" outcome={{ tone: "bad", label: "Perdido" }} />
```
