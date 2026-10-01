# sortable

Arquivo: `src/components/sortable.tsx` · importe de `@g4ai/ds`.

SortableList: reordenar por arraste e teclado, com anúncios pt-BR.

## SortableList

Lista reordenável (etapas do pipeline, campos do formulário, prioridade de fila, ordem de colunas).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `getKey` * | `(item: T) => string` |  |  |
| `getLabel` * | `(item: T) => string` |  | Nome do item nos anúncios ("Proposta enviada movida para a posição 2 de 5"). |
| `items` * | `T[]` |  |  |
| `label` * | `string` |  | Nome acessível da lista. |
| `onReorder` * | `(items: T[]) => void` |  |  |
| `renderItem` * | `(item: T, state: { dragging: boolean; index: number; }) => ReactNode` |  | Conteúdo da linha (a alça já vem à esquerda). |
| `className` | `string \| undefined` |  |  |
| `disabled` | `boolean \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/colecoes-reordenar`):

```tsx
<SortableList
  label="Etapas do pipeline"
  items={etapas}
  getKey={(e) => e.id}
  getLabel={(e) => e.nome}
  onReorder={(next) => { setEtapas(next); notify("Ordem das etapas salva"); }}
  renderItem={(e, { index }) => (
    <div className="flex items-center justify-between gap-3">
      <span>{index + 1}. {e.nome}</span>
      <Badge>{formatPercent(e.prob, 0)}</Badge>
    </div>
  )}
/>
```
