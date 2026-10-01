# Lista com filtros (desktop e celular)

- Arquivo: `src/blocks/app-filtered-list.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Aplicação
- Preview: showcase `#/frame/app-filtered-list` (`?theme=dark` para o escuro)

Central de atendimento: período no topo, visões salvas, busca local, atalhos de faceta, filtros por SLA/canal/data. No celular os filtros vão para uma folha com “Aplicar (N)”.

## Conceito

**Objetivo:** Atender a fila de chamados com o recorte certo: período, visões salvas e filtros por SLA, canal e data.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo com período à direita + PageToolbar colada
- Visões salvas por pergunta ('Meus', 'SLA estourando')
- No celular os filtros vão para FilterSheet com 'Aplicar (N)'
- Detalhe em gaveta (?id=) sem perder a lista

**Quando usar e o que adaptar**

- Qualquer fila operacional: pedidos, títulos, candidatos

**Evite**

- Filtros que não aparecem na URL (não dá para compartilhar o recorte)

## Componentes usados

`Avatar`, `Badge`, `Button`, `Column`, `DataTable`, `DateRange`, `DateRangeFilter`, `Drawer`, `EmptyFilterResult`, `FieldBlock`, `FieldGrid`, `FilterBar`, `FilterField`, `Highlight`, `Modal`, `Page`, `PageHeading`, `PageToolbar`, `Pagination`, `PropertyList`, `SavedView`, `SavedViews`, `Select`, `SortHeader`, `TableSearch`, `TextField`, `TextareaField`, `Timeline`, `Tone`, `notify`, `resolveDateRange`, `useFilters`, `usePagination`, `useSavedViews`, `useSort`
