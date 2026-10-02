# Fornecedores

- Arquivo: `src/blocks/erp-suppliers.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-suppliers` (`?theme=dark` para o escuro)

Fornecedores com classificação A/B/C, OTIF contra a meta, prazo de entrega, gasto no ano e compras em aberto. Dispersão prazo × pontualidade, detalhe em gaveta (?id=), pedido de cotação com itens e prazo e cadastro com consulta de CNPJ.

## Conceito

**Objetivo:** Escolher e acompanhar fornecedores por pontualidade, prazo e gasto.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada
- Classificação A/B/C e OTIF contra a meta
- Dispersão prazo × pontualidade para achar os problemáticos
- Detalhe em gaveta pela URL; pedir cotação troca o conteúdo da mesma gaveta (gaveta nunca abre gaveta)
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Parceiros, agências, transportadoras

**Evite**

- Nota do fornecedor sem os critérios
- Pedido de cotação sem itens nem prazo de resposta

## Componentes usados

`Badge`, `BarList`, `BulletChart`, `Button`, `ChartCard`, `Column`, `Combobox`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `Highlight`, `IconButton`, `ListRow`, `MaskedField`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `ScatterChart`, `Select`, `SortHeader`, `TableSearch`, `TextField`, `TextareaField`, `formatCurrency`, `formatPercent`, `masks`, `useFilters`, `useOperation`, `useSort`
