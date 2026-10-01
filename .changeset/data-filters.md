---
"@g4ai/ds": patch
---

Dados e filtros: `useDataView` (busca, filtros, ordenação, paginação, seleção e URL num hook só) e `useUrlState`.

- **DataTable**: `label`, `sort` + `Column.sortKey` (cabeçalho ordenável com `aria-sort`), `loading` (esqueleto no primeiro carregamento; com linhas, mantém as linhas e mostra barra de progresso), `error`, `maxHeight` com cabeçalho fixo, `Column.footer` (totais), `rowSelected`, `rowTone`, `Column.width` e `align: "center"`.
- **Seleção no celular**: `selectionColumn` agora aparece ao lado do título nos blocos rotulados (antes sumia abaixo de 1024 px). `useSelection` ganhou `visibleCount`, `hiddenCount`, `keepOnly` e `set`.
- **Paginação**: `usePagination(rows, size, { resetKey })` volta à página 1 quando o filtro/ordenação muda e ganhou `setPageSize`; `Pagination` ganhou "Por página" (`pageSizeOptions` + `onPageSizeChange`), `noun` e "2 de 9" no celular.
- **useSort**: números dentro do texto em ordem natural ("Pedido 2" antes de "Pedido 10").
- **DataGrid**: menu em cada cabeçalho (ordenar, mover, fixar à esquerda, ocultar; salvo com `storageKey`), `columns[].validate` na edição inline (erro visível, antes a mensagem ficava cortada pela célula), `loading` com linhas mantém as linhas, `filtered` + `onClearFilters` para o vazio por filtro com concordância de gênero.
- **Filtros**: E/OU (`state.match`, `MatchToggle`, `m=or` na URL); "Limpar tudo" aparece também quando só atalhos de faceta estão ativos e no celular; `EmptyFilterResult` com `gender`.
- **FacetFilter**: opções com `value` ou `id`, `count` por opção, ícone, busca sem acento a partir de 8 opções, nome acessível com os valores escolhidos.
