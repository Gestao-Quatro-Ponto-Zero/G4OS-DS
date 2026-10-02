# Pedido de venda

- Arquivo: `src/blocks/erp-order.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-order` (`?theme=dark` para o escuro)

Detalhe do pedido: etapas, itens com estoque, cliente, pagamento e ações que mudam com a situação (aprovar, liberar crédito, faturar, despachar, entregar, cancelar). ?id=novo abre o cadastro.

## Conceito

**Objetivo:** Levar um pedido de venda do cadastro à entrega com as ações certas em cada etapa.

**Padrões aplicados**

- Anatomia C · Registro: etapas no topo; resumo fixo à direita
- Ações mudam com a situação (aprovar, liberar crédito, faturar…)
- Itens com saldo em estoque
- ?id=novo abre o cadastro na mesma tela

**Quando usar e o que adaptar**

- Negócio (CRM), proposta (ATS), requisição de compra

**Evite**

- Todas as ações visíveis em todas as situações

## Componentes usados

`Badge`, `Button`, `Callout`, `Combobox`, `ConfirmDialog`, `EntityMark`, `FieldBlock`, `IconButton`, `NumberField`, `Page`, `PageHeading`, `PropertyList`, `Select`, `SplitLayout`, `Stepper`, `Table`, `TableBody`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`, `formatCurrency`, `notify`
