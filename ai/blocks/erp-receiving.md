# Recebimento de mercadoria

- Arquivo: `src/blocks/erp-receiving.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-receiving` (`?theme=dark` para o escuro)

Conferência da entrega contra o pedido de compra: fila de pedidos a receber, NF-e de entrada pela chave (com busca na SEFAZ), quantidade recebida por item com divergência em palavra, lote e validade, e entrada no estoque confirmada.

## Conceito

**Objetivo:** Dar entrada só no que chegou de fato: conferir quantidade, nota e lote antes de atualizar o estoque.

**Padrões aplicados**

- Anatomia F · Mestre-detalhe: pedidos a receber à esquerda, conferência à direita; seleção em ?pedido=
- Divergência por item em palavra (Falta 20 · Sobra 5 · Confere), nunca só cor
- Chave da NF-e validada contra o CNPJ do fornecedor
- Confirmação com useOperation: estoque e kardex atualizados só no fim

**Quando usar e o que adaptar**

- Devolução de cliente, recebimento de transferência entre filiais, inventário por contagem

**Evite**

- Dar entrada pela quantidade do pedido sem conferir
- Encerrar o saldo sem perguntar o que fazer com a falta

## Componentes usados

`Badge`, `Button`, `Callout`, `ChoiceCards`, `CurrencyField`, `DatePicker`, `Empty`, `EntityMark`, `NumberField`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `PropertyList`, `Select`, `StateView`, `Tabs`, `TextField`, `formatCurrency`, `formatNumber`, `notify`, `useOperation`
