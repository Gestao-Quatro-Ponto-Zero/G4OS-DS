# Pedidos de venda

- Arquivo: `src/blocks/erp-orders.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-orders` (`?theme=dark` para o escuro)

Pedidos em DataGrid: abas por situação, agrupamento com subtotal, itens expansíveis na linha, total fixo no rodapé, faturamento em massa, ações rápidas e CSV. Linha abre o pedido.

## Conceito

**Objetivo:** Operar pedidos em volume: agrupar por situação, ver itens sem abrir e faturar em massa.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: rolagem interna, total fixo no rodapé
- Abas por situação + agrupamento com subtotal
- Itens expansíveis na linha; faturamento em massa
- Ações rápidas e CSV

**Quando usar e o que adaptar**

- Chamados agrupados por prioridade, títulos por vencimento

**Evite**

- Subtotal só no fim da página

## Componentes usados

`Badge`, `Button`, `DataGrid`, `Empty`, `EmptyFilterResult`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `Page`, `PageHeading`, `SegmentedControl`, `StatCell`, `StatGrid`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `TableSearch`, `Tabs`, `formatCurrency`, `notify`, `useFilters`
