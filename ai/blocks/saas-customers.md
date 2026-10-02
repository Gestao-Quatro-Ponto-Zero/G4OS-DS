# Lista de clientes

- Arquivo: `src/blocks/saas-customers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: SaaS
- Preview: showcase `#/frame/saas-customers` (`?theme=dark` para o escuro)

Tabela com visões salvas, busca local (/), filtros por campo (plano, saúde, MRR, uso…), estado na URL, seleção em massa, paginação e drawer.

## Conceito

**Objetivo:** Achar e agir sobre contas em escala: quem está em risco, quem pode expandir.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada (visões, filtros, busca)
- Visões salvas por pergunta de negócio ('Em risco', 'Potencial de expansão')
- Estado na URL; seleção em massa com BulkBar; paginação
- Linha abre a conta

**Quando usar e o que adaptar**

- Empresas (CRM), clientes (ERP), candidatos (ATS)

**Evite**

- Filtros fora da PageToolbar (somem ao rolar)

## Componentes usados

`ActionMenu`, `Badge`, `BulkBar`, `Button`, `Column`, `DataTable`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FieldBlock`, `FieldGrid`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Modal`, `NumberField`, `Page`, `PageHeading`, `PageToolbar`, `Pagination`, `SavedView`, `SavedViews`, `Select`, `SortHeader`, `Sparkline`, `TableSearch`, `TextField`, `downloadCsv`, `formatCurrency`, `formatNumber`, `gridToCsv`, `notify`, `selectionColumn`, `useFilters`, `usePagination`, `useSavedViews`, `useSelection`, `useSort`
