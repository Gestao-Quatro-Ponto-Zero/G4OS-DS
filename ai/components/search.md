# search

Arquivo: `src/components/search.tsx` · importe de `@g4os/ds`.

Busca: SearchPalette (⌘K global com escopos e prévia) e busca local de tabela ("/").

## SearchPalette

Busca global ⌘K. Escopos em abas (Tab alterna; prefixos ">" "@" "#" entram direto), resultados agrupados por tipo com o trecho destacado, prévia à direita, buscas recentes quando vazio, "Ver todos em X" que leva à tabela

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onClose` * | `() => void` |  |  |
| `open` * | `boolean` |  |  |
| `scopes` * | `SearchScope[]` |  |  |
| `createLabel` | `((query: string, scope: string) => string) \| undefined` | `(q: string) => `Criar “${q}”`` |  |
| `debounce` | `number \| undefined` | `160` |  |
| `defaultPreview` | `boolean \| undefined` | `true` |  |
| `initialQuery` | `string \| undefined` | `""` |  |
| `initialScope` | `string \| undefined` | `"all"` |  |
| `items` | `SearchResult[] \| undefined` | `[]` |  |
| `onCreate` | `((query: string, scope: string) => void) \| undefined` |  |  |
| `onSeeAll` | `((scope: SearchScope, query: string) => void) \| undefined` |  |  |
| `onSelect` | `((result: SearchResult, options: { newTab: boolean; }) => void) \| undefined` |  |  |
| `perGroup` | `number \| undefined` | `4` |  |
| `placeholder` | `string \| undefined` | `"Buscar negócios, contatos, pedidos ou a` |  |
| `portalContainer` | `HTMLElement \| null \| undefined` |  | Onde montar (padrão: body). |
| `recentItems` | `SearchResult[] \| undefined` | `[]` |  |
| `recentQueries` | `string[] \| undefined` | `[]` |  |
| `source` | `SearchSource \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/busca-cmdk`):

```tsx
const [open, setOpen] = useState(false);
useCommandShortcut(() => setOpen(true)); // ⌘K / Ctrl+K

<SearchPalette
  open={open}
  onClose={() => setOpen(false)}
  scopes={[
    { id: "deals", label: "Negócios", icon: <Briefcase />, prefix: "#" },
    { id: "contacts", label: "Contatos", icon: <Users />, prefix: "@" },
    { id: "actions", label: "Ações", icon: <Keyboard />, prefix: ">" },
  ]}
  items={localResults}               // navegação, ações, registros recentes
  source={searchApi}                 // (q, scope, signal) => Promise<SearchResult[]>
  recentQueries={["aurora", "PV-024861"]}
  recentItems={recent}
  onSelect={(r, { newTab }) => router.push(r.href!)}
  onSeeAll={(scope, q) => router.push(`/${scope.id}?q=${encodeURIComponent(q)}`)}
  onCreate={(q) => createDeal(q)}
/>
```

## SearchResult (type)

```ts
type SearchResult = { id: string; scope: string; title: string; subtitle?: string; icon?: ReactNode; meta?: ReactNode; href?: string; keywords?: string[]; shortcut?: string[]; preview?: { title?: string; subtitle?: string; badge?: ReactNode; icon?: ReactNode; properties?: { label: string; value?: ReactNode }[]; body?: ReactNode; actions?: ReactNode }; onSelect?: () => void; }
```

## SearchScope (type)

```ts
type SearchScope = { id: string; label: string; icon?: ReactNode; prefix?: string; noun?: string; }
```

## SearchSource (type)

```ts
type SearchSource = (query: string, scope: string, signal: AbortSignal) => Promise<SearchResult[]> | SearchResult[]
```

## TableSearch

Campo de busca da lista.

| Prop | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `onChange` * | `(value: string) => void` |  |  |
| `value` * | `string` |  |  |
| `className` | `string \| undefined` |  |  |
| `globalHint` | `boolean \| undefined` | `true` | Mostra "⌘K busca em todo o app" na dica. |
| `noun` | `string \| undefined` | `"item"` |  |
| `nounPlural` | `string \| undefined` |  |  |
| `placeholder` | `string \| undefined` |  |  |
| `searchIn` | `string \| undefined` |  | Onde procura: "nome, empresa e e-mail". |
| `shortcut` | `string \| null \| undefined` | `"/"` | Tecla de atalho; null desliga. |
| `total` | `number \| undefined` |  |  |

`*` obrigatória. Atributos HTML nativos repassados não são listados.

Exemplo (showcase `#/p/busca-tabelas`):

```tsx
const search = useTableSearch(deals, (d) => [d.name, d.company, d.city]);

<TableSearch value={search.query} onChange={search.setQuery} total={deals.length} noun="negócio" searchIn="nome, empresa e cidade" />
<DataTable rows={search.rows} columns={[{ key: "name", header: "Negócio", cell: (d) => <Highlight text={d.name} query={search.query} /> }, …]} />
```

## useSlashShortcut (hook)

"/" foca o campo (fora de outro campo).

```ts
useSlashShortcut(ref, enabled?, key?): void
```

## useTableSearch (hook)

Busca livre local, sem filtros estruturados.

```ts
useTableSearch(rows, texts, initial?): { query: string; setQuery: Dispatch<SetStateAction<string>>; rows: T[]; total: number; shown: number; }
```

Exemplo (showcase `#/p/busca-tabelas`):

```tsx
const search = useTableSearch(deals, (d) => [d.name, d.company, d.city]);

<TableSearch value={search.query} onChange={search.setQuery} total={deals.length} noun="negócio" searchIn="nome, empresa e cidade" />
<DataTable rows={search.rows} columns={[{ key: "name", header: "Negócio", cell: (d) => <Highlight text={d.name} query={search.query} /> }, …]} />
```
