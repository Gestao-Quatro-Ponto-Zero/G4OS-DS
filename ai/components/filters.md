# filters

Arquivo: `src/components/filters.tsx` · importe de `@g4os/ds`.

Filtros estruturados: FilterBar, filtros ativos, construtor campo/operador/valor, visões salvas, período, estado na URL.

## ActiveFilterChip

Filtro aplicado: clique edita, × remove.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `condition` * | `FilterCondition` |  |  |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-construtor`):

```tsx
<QuickFilter filters={filters} field={fields[0]} />     // Etapa ▾
<AddFilterMenu filters={filters} />                       // + Filtro: campo → operador → valor
{filters.active.map((c) => <ActiveFilterChip key={c.id} filters={filters} condition={c} />)}
<FilterSheet filters={filters} open={open} onClose={…} /> // todos os campos, “Aplicar (N)”
```

## AddFilterMenu

"+ Filtro": escolhe o campo (com busca), depois operador e valor, e aplica.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |
| `compact` | `boolean \| undefined` |  |  |
| `label` | `string \| undefined` | `"Filtro"` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-construtor`):

```tsx
<QuickFilter filters={filters} field={fields[0]} />     // Etapa ▾
<AddFilterMenu filters={filters} />                       // + Filtro: campo → operador → valor
{filters.active.map((c) => <ActiveFilterChip key={c.id} filters={filters} condition={c} />)}
<FilterSheet filters={filters} open={open} onClose={…} /> // todos os campos, “Aplicar (N)”
```

## applyFilters (function)

Aplica busca + filtros (tudo em E).

```ts
applyFilters(rows, fields, state, options?): T[]
```

## ConditionEditor

Editor de um filtro: operador + valor, pelo tipo do campo.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `field` * | `FilterField<T>` |  |  |
| `onChange` * | `(c: FilterCondition) => void` |  |  |
| `value` * | `FilterCondition` |  |  |
| `autoFocus` | `boolean \| undefined` | `true` |  |
| `me` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-construtor`):

```tsx
<ConditionEditor field={valorField} value={cond} onChange={setCond} />
```

## DateRange (type)

```ts
type DateRange = { preset: DateRangePreset; from: string; to: string }
```

## DateRangeFilter

Seletor de período. Em dashboard fica no topo à direita e vale para a tela toda; em lista, vira um filtro de data comum.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(range: DateRange) => void` |  |  |
| `value` * | `DateRange` |  |  |
| `className` | `string \| undefined` |  |  |
| `label` | `string \| undefined` | `"Período"` |  |
| `now` | `Date \| undefined` |  |  |
| `presets` | `("today" \| "last7" \| "last30" \| "this_month" \| "yesterday" \| "last90" \| "last_month" \| "this_quarter" \| "th…` | `dateRangePresets.map((p) => p.id)` |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

## DateRangePreset (type)

```ts
type DateRangePreset = "today" | "yesterday" | "last7" | "last30" | "last90" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom"
```

## dateRangePresets (const)

## describeCondition (function)

"Status é Ativo, Pendente" — texto do chip e do leitor de tela.

```ts
describeCondition(field, c, ctx?): { field: string; op: string; value: string; text: string; }
```

## describeDateRange (function)

```ts
describeDateRange(range): string
```

Exemplo (showcase `#/p/filtros-datas`):

```tsx
const [range, setRange] = useState(resolveDateRange("last30"));

<PageHeading
  title="Vendas"
  description={`${describeDateRange(range)} · comparado ao período anterior\
```

## EmptyFilterResult

Nenhum resultado com o recorte atual.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |
| `framed` | `boolean \| undefined` | `false` |  |
| `noun` | `string \| undefined` | `"resultado"` |  |
| `nounPlural` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/busca-tabelas`):

```tsx
<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />
```

## emptyFilterState (const)

## FilterBar

Barra de filtros de uma lista.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |
| `actions` | `ReactNode` |  | Controles à direita: visualização, densidade, ordenação, exportar. |
| `className` | `string \| undefined` |  |  |
| `noun` | `string \| undefined` | `"resultado"` |  |
| `nounPlural` | `string \| undefined` |  |  |
| `search` | `ReactNode` |  | Normalmente <TableSearch …/> ligado a filters.state.query. |
| `showCount` | `boolean \| undefined` | `true` |  |

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

## FilterCondition (type)

```ts
type FilterCondition = { id: string; field: string; op: FilterOperator; value?: FilterValue }
```

## FilterContext (type)

```ts
type FilterContext = { me?: string; now?: Date }
```

## FilterField (type)

```ts
type FilterField = { key: string; label: string; type: FilterType; accessor: (row: T) => unknown; options?: FilterOption[]; icon?: ReactNode; quick?: boolean; unit?: string; }
```

## FilterOperator (type)

```ts
type FilterOperator = | "contains" | "not_contains" | "is" | "is_not" | "empty" | "not_empty" | "eq" | "neq" | "gt" | "lt" | "between" | "today" | "last7" | "last30" | "this_month" | "range" | "me"
```

## filterOperators (function)

Operadores disponíveis por tipo de campo, na ordem de uso mais comum.

```ts
filterOperators(type): { op: FilterOperator; label: string; }[]
```

## FilterOption (type)

```ts
type FilterOption = { value: string; label: string; icon?: ReactNode; hint?: string }
```

## FiltersApi (type)

```ts
type FiltersApi = ReturnType<typeof useFilters<T>>
```

## FilterSheet

Todos os campos num Sheet (folha inferior no celular).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `noun` | `string \| undefined` | `"resultado"` |  |
| `nounPlural` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-construtor`):

```tsx
<QuickFilter filters={filters} field={fields[0]} />     // Etapa ▾
<AddFilterMenu filters={filters} />                       // + Filtro: campo → operador → valor
{filters.active.map((c) => <ActiveFilterChip key={c.id} filters={filters} condition={c} />)}
<FilterSheet filters={filters} open={open} onClose={…} /> // todos os campos, “Aplicar (N)”
```

## FilterState (type)

```ts
type FilterState = { query: string; conditions: FilterCondition[] }
```

## FilterType (type)

```ts
type FilterType = "text" | "number" | "currency" | "date" | "enum" | "person" | "boolean"
```

## FilterValue (type)

```ts
type FilterValue = string | number | string[] | [string | number, string | number] | undefined
```

## Highlight

Destaca os trechos buscados, ignorando acento e caixa ("joao" acha "João").

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `query` * | `string` |  |  |
| `text` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/busca-tabelas`):

```tsx
<Highlight text="São João Metalúrgica" query="sao joao" />
```

## matchesQuery (function)

Busca textual: todas as palavras precisam aparecer em algum dos textos (E).

```ts
matchesQuery(query, texts): boolean
```

## parseFilters (function)

```ts
parseFilters(params): FilterState
```

Exemplo (showcase `#/p/filtros-padrao`):

```tsx
/contatos?q=aurora&f=stage~is~Proposta|Negociação&f=value~gt~100000&f=closes~range~2026-10-01..2026-10-31

useFilters(rows, { fields, url: true })       // lê e escreve ?q= e ?f=
useFilters(rows, { fields, url: "neg_" })     // prefixo quando há 2 listas na tela
serializeFilters(state) / parseFilters(params) // para montar links ou enviar ao servidor
```

## QuickFilter

Botão de faceta na barra (Status ▾).

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `field` * | `FilterField<T>` |  |  |
| `filters` * | `{ fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-construtor`):

```tsx
<QuickFilter filters={filters} field={fields[0]} />     // Etapa ▾
<AddFilterMenu filters={filters} />                       // + Filtro: campo → operador → valor
{filters.active.map((c) => <ActiveFilterChip key={c.id} filters={filters} condition={c} />)}
<FilterSheet filters={filters} open={open} onClose={…} /> // todos os campos, “Aplicar (N)”
```

## resolveDateRange (function)

Converte um preset em datas ISO (inclusivas).

```ts
resolveDateRange(preset, now?): DateRange
```

Exemplo (showcase `#/p/filtros-datas`):

```tsx
const [range, setRange] = useState(resolveDateRange("last30"));

<PageHeading
  title="Vendas"
  description={`${describeDateRange(range)} · comparado ao período anterior\
```

## SavedView (type)

```ts
type SavedView = { id: string; label: string; state: FilterState; system?: boolean }
```

## SavedViews

Abas de visões ("Todos · Meus · Atrasados") acima da FilterBar.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `views` * | `{ views: SavedView[]; active: SavedView \| undefined; activeId: string; dirty: boolean; select: (id: string)…` |  |  |
| `className` | `string \| undefined` |  |  |
| `counts` | `Record<string, number> \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/filtros-visoes-salvas`):

```tsx
const system: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "a", field: "owner", op: "me" }] } },
];
const views = useSavedViews(filters, system, "negocios-visoes"); // 3º arg: chave do localStorage
<SavedViews views={views} counts={{ todos: 312, meus: 48 }} />
```

## SavedViewsApi (type)

```ts
type SavedViewsApi = ReturnType<typeof useSavedViews>
```

## serializeFilters (function)

Serializa para querystring: q=texto & f=campo~op~valor (valores múltiplos com "|", faixa com "..").

```ts
serializeFilters(state): URLSearchParams
```

Exemplo (showcase `#/p/filtros-padrao`):

```tsx
/contatos?q=aurora&f=stage~is~Proposta|Negociação&f=value~gt~100000&f=closes~range~2026-10-01..2026-10-31

useFilters(rows, { fields, url: true })       // lê e escreve ?q= e ?f=
useFilters(rows, { fields, url: "neg_" })     // prefixo quando há 2 listas na tela
serializeFilters(state) / parseFilters(params) // para montar links ou enviar ao servidor
```

## useFilters (hook)

Estado de busca + filtros de uma coleção.

```ts
useFilters(rows, options): { fields: FilterField<T>[]; state: FilterState; setState: Dispatch<SetStateAction<FilterState>>; rows: T[];…
```

Exemplo (showcase `#/p/filtros-padrao`):

```tsx
/contatos?q=aurora&f=stage~is~Proposta|Negociação&f=value~gt~100000&f=closes~range~2026-10-01..2026-10-31

useFilters(rows, { fields, url: true })       // lê e escreve ?q= e ?f=
useFilters(rows, { fields, url: "neg_" })     // prefixo quando há 2 listas na tela
serializeFilters(state) / parseFilters(params) // para montar links ou enviar ao servidor
```

## useSavedViews (hook)

Visões salvas de uma lista.

```ts
useSavedViews(filters, initial, storageKey?): { views: SavedView[]; active: SavedView | undefined; activeId: string; dirty: boolean; select: (id: string)…
```

Exemplo (showcase `#/p/filtros-visoes-salvas`):

```tsx
const system: SavedView[] = [
  { id: "todos", label: "Todos", system: true, state: { query: "", conditions: [] } },
  { id: "meus", label: "Meus", system: true, state: { query: "", conditions: [{ id: "a", field: "owner", op: "me" }] } },
];
const views = useSavedViews(filters, system, "negocios-visoes"); // 3º arg: chave do localStorage
<SavedViews views={views} counts={{ todos: 312, meus: 48 }} />
```

## useUrlFilters (hook)

Espelha o estado na URL (location.search) sem recarregar e sem mexer no hash nem em outros parâmetros.

```ts
useUrlFilters(state, setState, props?): void
```
