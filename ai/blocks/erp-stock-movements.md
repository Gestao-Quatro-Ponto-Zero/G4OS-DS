# Movimentações de estoque

- Arquivo: `src/blocks/erp-stock-movements.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-stock-movements` (`?theme=dark` para o escuro)

Kardex em DataGrid: entradas, saídas, transferências entre CDs e ajustes de inventário com motivo, saldo corrente por produto, documento de origem clicável, valor ao custo e ajuste de inventário em gaveta com diferença calculada.

## Conceito

**Objetivo:** Explicar o saldo: de onde veio e para onde foi cada unidade, e corrigir o estoque com motivo registrado.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: abas por tipo, filtros, total no rodapé, rolagem interna
- Saldo corrente por produto (kardex) ao filtrar um SKU (?sku=)
- Ajuste de inventário em Drawer: saldo do sistema × contado, diferença e motivo obrigatórios
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Extrato de pontos, movimentação de ativos, histórico de lotes

**Evite**

- Ajuste sem motivo
- Saldo sem o documento que o mudou

## Componentes usados

`Badge`, `Button`, `Callout`, `Combobox`, `DataGrid`, `Drawer`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `SegmentedControl`, `Select`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `TextareaField`, `formatCurrency`, `formatNumber`, `useFilters`, `useOperation`
