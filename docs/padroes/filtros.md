# Filtros

Padrão único para estreitar qualquer coleção (contatos, pedidos, vagas, chamados). Showcase: **Filtros e busca › Padrão de filtros**. Código: `src/components/filters.tsx`.

## Quatro ferramentas

| Ferramenta | Tecla | Faz | Componente |
|---|---|---|---|
| Busca local | `/` | Texto livre sobre a lista na tela | `TableSearch` |
| Filtro | `+ Filtro` | Campo + operador + valor | `FilterBar`, `AddFilterMenu` |
| Visão salva | abas | Recorte nomeado (busca + filtros) | `SavedViews` |
| Busca global | `⌘K` | Qualquer registro, página ou ação | `SearchPalette` (busca.md) |

Busca e filtros combinam em **E**. Valores dentro de um filtro de lista combinam em **OU**.

## Anatomia (ordem fixa)

```
[Todos · Meus · Atrasados •]                      [Descartar] [Salvar alterações] [+ Salvar visão]
[Buscar em 312 contatos  /] [Etapa ▾] [Responsável ▾] [+ Filtro] ····· 48 de 312  [Lista|Cards] [⋯]
[Valor > R$ 100 mil ×] [Fechamento nos últimos 30 dias ×]  Limpar tudo
```

## Qual controle, por tamanho do problema

| Situação | Use |
| --- | --- |
| Menos de 12 itens | nada (só a lista) |
| 12+ itens, um atributo que importa | `TableToolbar` + `TableSearch` + 1–2 `FacetFilter` |
| Lista de trabalho com 3+ atributos filtráveis | `FilterBar` (atalhos `quick` + “+ Filtro” + chips) |
| Recortes que a pessoa repete todo dia | `SavedViews` acima da `FilterBar` |
| Combinações “isto OU aquilo” | `FilterBar` com 2+ filtros → “Atende a todos ▾” vira “qualquer um” (`state.match = "or"`) |
| Período (dashboard, relatório) | `DateRangeFilter` com presets (Hoje, 7 dias, Este mês, Trimestre, Personalizado) |
| Faixa numérica (valor, dias) | campo `number`/`currency` → operador “entre” |
| Celular | `FilterSheet` (“Filtros (N)”) com “Aplicar (N resultados)” |

## Onde colocar

- **Lista/tabela:** SavedViews + FilterBar completa.
- **Dashboard:** um `DateRangeFilter` no topo à direita, valendo para a tela toda. Nada de filtro por card.
- **Kanban:** busca + dono/prioridade. A etapa é a coluna — nunca filtre por etapa.
- **Abas de situação:** a aba é o recorte principal; busca e filtros atuam dentro dela.
- **Celular:** atalhos e “+ Filtro” viram “Filtros (N)” → `FilterSheet` com “Aplicar (N resultados)”.

## Código mínimo

```tsx
const fields: FilterField<Deal>[] = [
  { key: "stage", label: "Etapa", type: "enum", quick: true, accessor: (d) => d.stage, options },
  { key: "value", label: "Valor", type: "currency", accessor: (d) => d.value },
];
// tudo junto (filtros + ordenação + paginação + seleção + URL): useDataView — ver tabelas-e-colecoes.md
const filters = useFilters(deals, { fields, search: (d) => [d.name, d.company], me: userId, url: true });
const views = useSavedViews(filters, systemViews, "negocios-visoes");

<SavedViews views={views} />
<FilterBar filters={filters} noun="negócio"
  search={<TableSearch value={filters.state.query} onChange={filters.setQuery} total={deals.length} noun="negócio" />} />
<DataTable rows={filters.rows} … empty={<EmptyFilterResult filters={filters} noun="negócio" />} />
```

## URL

`?q=aurora&f=stage~is~Proposta|Negociação&f=value~gt~100000&f=closes~range~2026-10-01..2026-10-31&m=or`

`m=or` só aparece quando a pessoa troca para “qualquer um”; a busca livre (`q`) sempre restringe.
(`useFilters({ url: true })`, ou `serializeFilters` / `parseFilters`). No servidor, espelhe os operadores de `applyFilters`.

## Regras

- 1–3 atalhos de faceta (`quick`); o resto em “+ Filtro”.
- Contagem “X de Y” sempre visível (aria-live).
- Filtro aplicado sempre vira chip editável; “Limpar tudo” aparece com qualquer filtro ativo (inclusive só atalhos).
- E/OU em linguagem de gente (“Atende a todos / a qualquer um”), só com 2+ filtros. Nada de grupos aninhados na barra: recorte complexo vira visão salva.
- Resultado vazio diz o recorte e oferece “Remover último filtro” e “Limpar”.
- Rótulo do filtro = cabeçalho da coluna.
