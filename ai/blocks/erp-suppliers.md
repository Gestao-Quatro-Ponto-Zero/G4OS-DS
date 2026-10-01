# Fornecedores

- Arquivo: `src/blocks/erp-suppliers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-suppliers` (`?theme=dark` para o escuro)

Fornecedores com classificação A/B/C, OTIF contra a meta, prazo de entrega, gasto no ano e compras em aberto. Dispersão prazo × pontualidade e detalhe em gaveta.

## Conceito

**Objetivo:** Escolher e acompanhar fornecedores por pontualidade, prazo e gasto.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Classificação A/B/C e OTIF contra a meta
- Dispersão prazo × pontualidade para achar os problemáticos
- Detalhe em gaveta

**Quando usar e o que adaptar**

- Parceiros, agências, transportadoras

**Evite**

- Nota do fornecedor sem os critérios

## Componentes usados

`Badge`, `BarList`, `BulletChart`, `Button`, `ChartCard`, `Column`, `DataTable`, `Drawer`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `ListRow`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `ScatterChart`, `SortHeader`, `TableSearch`, `formatCurrency`, `formatPercent`, `notify`, `useFilters`, `useSort`
