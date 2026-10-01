# collections

Arquivo: `src/components/collections.tsx` · importe de `@g4ai/ds`.

Coleções: TableToolbar, FacetFilter, DataTable (vira cards no celular), DisplayControls, ListPanel/ListRow, Kanban.

## collectionThresholds (const)

## CollectionView (type)

```ts
type CollectionView = "cards" | "list" | "board"
```

## Column (type)

```ts
type Column = { key: string; header: ReactNode; cell: (row: T) => ReactNode; primary?: boolean; wide?: boolean; action?: boolean; selection?: boolean; mobileHidden?: boolean; nowrap?: boolean; align?: "left" | "right" | "center"; sortKey?: string; footer?: ReactNode; width?: number | string; className?: string; }
```

## DataTable

Tabela padrão: contorno arredondado, cabeçalho gelo 12px, linhas 13.5px com divisória, vira blocos rotulados abaixo de 1024px (o rótulo vem do header quando é string).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `columns` * | `Column<T>[]` |  |  |
| `rowKey` * | `(row: T) => string` |  |  |
| `rows` * | `T[]` |  |  |
| `className` | `string \| undefined` |  |  |
| `density` | `Density \| undefined` |  |  |
| `empty` | `ReactNode` |  |  |
| `error` | `{ message: string; onRetry?: () => void; } \| undefined` |  |  |
| `footerLabel` | `string \| undefined` |  | Rótulo da primeira célula do rodapé quando ela não tem `footer`. |
| `label` | `string \| undefined` |  | Nome da tabela para leitores de tela ("Contas a receber"). |
| `loading` | `boolean \| undefined` |  |  |
| `loadingRows` | `number \| undefined` | `5` | Linhas de esqueleto no primeiro carregamento. |
| `maxHeight` | `string \| number \| undefined` |  | Altura máxima: rola por dentro com o cabeçalho fixo. |
| `onRowClick` | `((row: T) => void) \| undefined` |  |  |
| `rowLabel` | `((row: T) => string) \| undefined` |  |  |
| `rowSelected` | `((row: T) => boolean) \| undefined` |  | Linha selecionada (seleção em massa ou registro aberto ao lado). |
| `rowTone` | `((row: T) => "warn" \| "bad" \| undefined) \| undefined` |  | Linha que pede atenção (atrasado, bloqueado): faixa à esquerda. |
| `sort` | `TableSort \| undefined` |  | Retorno do useSort; colunas com `sortKey` ganham cabeçalho ordenável. |
| `view` | `"cards" \| "list" \| undefined` | `"list"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

**Uso certo**

- ✓ Dados assíncronos: passe `loading`, `error` e `empty={<Empty title=… action=… />}`. Seleção: `selectionColumn(sel, rowKey, rowLabel)` + `BulkBar`. Ordenação `useSort`, páginas `usePagination` + `Pagination`.

**Evite**

- ✗ `<table>` cru (regra `raw-table`); checkbox de linha sem `hideLabel`; `Select` por linha.

Exemplo (showcase `#/p/busca-tabelas`):

```tsx
<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />
```

## Density (type)

```ts
type Density = "comfortable" | "compact"
```

## DensityControl

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `density` * | `Density` |  |  |
| `onChange` * | `(value: Density) => void` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## DisplayControls

Cards|Lista (ou Quadro|Lista) + Compacto.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `density` * | `Density` |  |  |
| `onDensity` * | `(value: Density) => void` |  |  |
| `onView` * | `(value: CollectionView) => void` |  |  |
| `view` * | `CollectionView` |  |  |
| `board` | `boolean \| undefined` | `false` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-padrao`):

```tsx
const fields: FilterField<Deal>[] = [
  { key: "stage", label: "Etapa", type: "enum", quick: true, accessor: (d) => d.stage, options },
  { key: "owner", label: "Responsável", type: "person", quick: true, accessor: (d) => d.owner, options: owners },
  { key: "value", label: "Valor", type: "currency", accessor: (d) => d.value },
  { key: "closes", label: "Fechamento previsto", type: "date", accessor: (d) => d.closes },
];

const filters = useFilters(deals, { fields, search: (d) => [d.name, d.company], me: "ana", url: true });
const views = useSavedViews(filters, systemViews, "negocios-visoes");

<SavedViews views={views} />
<FilterBar
  filters={filters}
  noun="negócio"
  search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={deals.length} noun="negócio" />}
  actions={<DisplayControls … />}
/>
<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />
```

## FacetFilter

Filtro multi-seleção por atributo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `label` * | `string` |  |  |
| `onChange` * | `(next: string[]) => void` |  |  |
| `options` * | `FacetOption[]` |  |  |
| `value` * | `string[]` |  |  |
| `align` | `"left" \| "right" \| undefined` | `"right"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## FacetOption (type)

```ts
type FacetOption = { id?: string; value?: string; label: string; count?: number; icon?: ReactNode; }
```

## KanbanBoard

Contêiner horizontal do quadro, com rolagem própria.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `className` | `string \| undefined` |  |  |

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

## KanbanCard

Card de quadro: só título, responsável e prazo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `string` |  |  |
| `actions` | `ReactNode` |  |  |
| `blocked` | `boolean \| undefined` |  |  |
| `draggable` | `boolean \| undefined` | `true` |  |
| `due` | `string \| undefined` |  |  |
| `dueOverdue` | `boolean \| undefined` |  |  |
| `flag` | `ReactNode` |  |  |
| `onDragStart` | `((event: DragEvent) => void) \| undefined` |  |  |
| `onOpen` | `(() => void) \| undefined` |  |  |
| `owner` | `{ name: string; initials: string; } \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## KanbanColumn

Coluna de quadro: cabeçalho com ponto de status + contagem, área de soltar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `count` * | `number` |  |  |
| `title` * | `string` |  |  |
| `dotColor` | `string \| undefined` |  |  |
| `dropActive` | `boolean \| undefined` |  |  |
| `footer` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  | Resumo à direita do cabeçalho (soma de valor, WIP limite). |
| `onDrop` | `((event: DragEvent) => void) \| undefined` |  |  |
| `width` | `number \| undefined` | `288` | Largura mínima; a coluna cresce até 400px quando sobra espaço. |

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

## ListPanel

Prévia titulada dentro de um painel com vários assuntos (dashboard/home).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `children` * | `ReactNode` |  |  |
| `title` * | `string` |  |  |
| `action` | `ReactNode` |  |  |
| `count` | `number \| undefined` |  |  |
| `icon` | `ReactNode` |  |  |
| `tone` | `"neutral" \| "attention" \| undefined` | `"neutral"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## ListRow

Linha de uma ListPanel: marcador · (contexto / título) · meta · seta.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `title` * | `ReactNode` |  |  |
| `href` | `string \| undefined` |  |  |
| `kicker` | `ReactNode` |  |  |
| `leading` | `ReactNode` |  |  |
| `meta` | `ReactNode` |  |  |
| `onClick` | `(() => void) \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## TableSort (type)

O que a tabela precisa de um `useSort` (passe o retorno inteiro).

```ts
type TableSort = { sort: SortState; toggle: (key: string) => void }
```

## TableToolbar

Busca + filtros + "Limpar" + contagem "X de Y" (aria-live).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onQuery` * | `(v: string) => void` |  |  |
| `query` * | `string` |  |  |
| `shown` * | `number` |  |  |
| `total` * | `number` |  |  |
| `children` | `ReactNode` |  |  |
| `dirty` | `boolean \| undefined` |  |  |
| `hideSearch` | `boolean \| undefined` |  | Força esconder a busca (padrão: escondida abaixo de 12 itens). |
| `noun` | `string \| undefined` | `"resultado"` |  |
| `nounPlural` | `string \| undefined` |  |  |
| `onClear` | `(() => void) \| undefined` |  |  |
| `placeholder` | `string \| undefined` | `"Filtrar…"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## useCollectionDisplay (hook)

Estado de visualização/densidade persistido por área.

```ts
useCollectionDisplay(scope, initial?): { view: CollectionView; setView: (v: CollectionView) => void; density: Density; setDensity: (d: Density) =>…
```
