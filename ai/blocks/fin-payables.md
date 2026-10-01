# Contas a pagar

- Arquivo: `src/blocks/fin-payables.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: Financeiro
- Preview: showcase `#/frame/fin-payables` (`?theme=dark` para o escuro)

Títulos de fornecedores, folha e impostos: aprovação em massa, agendamento, pagamento, recusa com motivo e gaveta com boleto anexo. Filtros por categoria, centro de custo e vencimento.

## Conceito

**Objetivo:** Pagar em dia e só o que foi aprovado, com o comprovante à mão.

**Padrões aplicados**

- Anatomia A · Lista: cabeçalho fixo + PageToolbar colada; abas por situação
- Aprovação e agendamento em massa (BulkBar)
- Recusa com motivo; boleto anexo na gaveta

**Quando usar e o que adaptar**

- Reembolsos, comissões, faturas de fornecedor

**Evite**

- Pagar em massa sem confirmação do total

## Componentes usados

`Badge`, `BulkBar`, `Button`, `Column`, `DataTable`, `Drawer`, `EmptyFilterResult`, `FileCard`, `FilterBar`, `FilterField`, `Highlight`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `SortHeader`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `TextareaField`, `formatCurrency`, `notify`, `plural`, `selectionColumn`, `useFilters`, `useSelection`, `useSort`
