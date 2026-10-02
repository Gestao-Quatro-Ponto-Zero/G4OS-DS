# Produtos

- Arquivo: `src/blocks/erp-products.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-products` (`?theme=dark` para o escuro)

Catálogo de SKUs: categoria, saldo contra o mínimo, custo, preço e margem com alerta abaixo da meta, ativos e inativos em abas, cadastro em gaveta com margem calculada na hora. Linha abre o produto.

## Conceito

**Objetivo:** Manter o catálogo saudável: preço com margem, estoque contra o mínimo e cadastro rápido de SKU novo.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: abas Ativos/Inativos, filtros e busca na barra da grade
- Margem em cor só quando abaixo da meta (número bom não grita)
- Novo produto em Drawer com margem calculada enquanto digita
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Catálogo de serviços, planos (SaaS), tabela de preços

**Evite**

- Página nova só para cadastrar um SKU
- Margem sem a referência de meta

## Componentes usados

`Badge`, `Button`, `Combobox`, `CurrencyField`, `DataGrid`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Meter`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `Select`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `TextField`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`, `useFilters`, `useOperation`
