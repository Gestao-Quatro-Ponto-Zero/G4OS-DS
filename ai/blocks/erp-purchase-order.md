# Pedido de compra

- Arquivo: `src/blocks/erp-purchase-order.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-purchase-order` (`?theme=dark` para o escuro)

Registro da ordem de compra: ciclo cotação → aprovado → enviado → recebido, itens com saldo a receber, condições, marcos com o próximo passo, histórico e ações que mudam com a situação (enviar, registrar confirmação, receber, cancelar).

## Conceito

**Objetivo:** Acompanhar um pedido de compra do envio ao recebimento sabendo sempre qual é o próximo passo.

**Padrões aplicados**

- Anatomia C · Registro: trilha, StagePath do ciclo, itens no corpo e condições fixas à direita
- Ações mudam com a situação (enviar ao fornecedor, registrar confirmação, registrar recebimento)
- ProjectProgressCard com o próximo passo + Timeline do histórico
- Atraso vira Callout com a ação de cobrar o fornecedor

**Quando usar e o que adaptar**

- Ordem de serviço, contrato com marcos, pedido de transferência entre filiais

**Evite**

- Todas as ações visíveis em todas as situações
- Saldo a receber escondido dentro do item

## Componentes usados

`Button`, `Callout`, `ConfirmDialog`, `DatePicker`, `EntityMark`, `Meter`, `Modal`, `OperationButton`, `OperationFeedback`, `Page`, `PageHeading`, `ProjectProgressCard`, `PropertyList`, `SplitLayout`, `StagePath`, `StateView`, `Table`, `TableBody`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`, `TextField`, `Timeline`, `TimelineItem`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`, `useOperation`
