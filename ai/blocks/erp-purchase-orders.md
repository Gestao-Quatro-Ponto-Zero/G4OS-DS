# Pedidos de compra

- Arquivo: `src/blocks/erp-purchase-orders.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-purchase-orders` (`?theme=dark` para o escuro)

Ordens de compra por fornecedor: itens e saldo a receber na linha, previsão de entrega com atraso em destaque, abas por situação, envio ao fornecedor em massa e criação a partir de requisição aprovada em gaveta. Linha abre o pedido.

## Conceito

**Objetivo:** Garantir que o que foi comprado chegue no prazo: ver o que está atrasado, o que falta enviar e o que chega esta semana.

**Padrões aplicados**

- Anatomia A · Lista com DataGrid: abas por situação, total no rodapé, itens expansíveis
- Previsão de entrega com atraso em palavra e cor (nunca só cor)
- Novo pedido em Drawer a partir de requisição aprovada (itens e fornecedor já vêm preenchidos)
- Cinco estados: ?estado=carregando|vazio|erro

**Quando usar e o que adaptar**

- Ordens de serviço a terceiros, pedidos de reposição entre filiais

**Evite**

- Criar o pedido sem a requisição aprovada (perde a trilha de aprovação)
- Previsão sem dizer se atrasou

## Componentes usados

`Badge`, `Button`, `ChoiceCards`, `Combobox`, `ConfirmDialog`, `CurrencyField`, `DataGrid`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `EntityMark`, `FilterBar`, `FilterField`, `GridColumn`, `Highlight`, `IconButton`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `SegmentedControl`, `Select`, `StatCell`, `StatGrid`, `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`, `TableSearch`, `Tabs`, `TextareaField`, `formatCurrency`, `formatNumber`, `notify`, `useFilters`, `useOperation`
