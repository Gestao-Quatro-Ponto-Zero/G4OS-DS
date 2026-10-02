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

`Badge`, `BulkBar`, `Button`, `Callout`, `Column`, `Combobox`, `CurrencyField`, `DataTable`, `DatePicker`, `Drawer`, `Empty`, `EmptyFilterResult`, `FileCard`, `FileDropzone`, `FilterBar`, `FilterField`, `Highlight`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PageToolbar`, `PropertyList`, `Select`, `SortHeader`, `StatCell`, `StatGrid`, `TableSearch`, `Tabs`, `TextField`, `TextareaField`, `UploadItem`, `formatCurrency`, `notify`, `plural`, `selectionColumn`, `useFilters`, `useOperation`, `useSelection`, `useSort`
