# Receita: ERP (operação)

Pedidos de venda, produtos e estoque, compras, fornecedores, notas fiscais.

## Entidades

| Entidade | Identidade | Campos que decidem | Relações |
| --- | --- | --- | --- |
| **Pedido de venda** | número + cliente | status, valor, itens, prazo de entrega | cliente, itens, nota fiscal |
| **Produto** | nome + SKU | preço, custo, estoque atual, mínimo, localização | pedidos, movimentações, fornecedor |
| **Movimentação de estoque** | tipo + data | entrada/saída/ajuste, quantidade, motivo | produto |
| **Pedido de compra** | número + fornecedor | status, valor, previsão de recebimento | fornecedor, itens |
| **Fornecedor / Cliente** | razão social + CNPJ | condições de pagamento, situação | pedidos |
| **Nota fiscal** | número + série | status (autorizada, rejeitada, cancelada), valor | pedido |

## Mapa de navegação

```
Sidebar
├─ Painel             painel de operação
├─ Vendas             (subitens)
│  ├─ Pedidos de venda  lista com abas por situação → Pedido (página de registro)
│  └─ Notas fiscais     lista → Nota fiscal (documento)
├─ Compras            (subitens)
│  ├─ Requisições       mestre-detalhe com aprovação
│  ├─ Pedidos de compra lista → Pedido de compra (página de registro)
│  └─ Recebimento       conferência contra o pedido
├─ Estoque            (subitens)
│  ├─ Posição de estoque  saldo × mínimo → Produto
│  ├─ Movimentações       kardex
│  └─ Expedição           quadro do separar à entrega
└─ Cadastros          (subitens)
   ├─ Clientes, Fornecedores  lista → detalhe em drawer
   └─ Produtos                catálogo → Produto (página com projeção e movimentações)
   Financeiro         contas bancárias, fluxo de caixa, conciliação, receber/pagar (blocos fin-*)
   Configurações      empresa, impostos, integrações (SEFAZ, e-commerce)
```

## Telas e componentes

| Tela | Componentes-chave |
| --- | --- |
| Painel | `KpiCard` (pedidos, faturamento, ticket médio, ruptura), `BarChart` pedidos/dia, `BarList` top produtos, `ListPanel tone="attention"` itens abaixo do mínimo e pedidos atrasados |
| Pedidos | `DataTable` com `useSort`, `useSelection` + `BulkBar` (faturar, imprimir etiquetas), `Pagination`, `FacetFilter` status/canal; número em mono ou `tabular-nums` |
| Pedido | `ContextBar` (Pedidos ›), `StagePath` (Recebido → Entregue), tabela de itens com totais alinhados à direita, lateral `PropertyList` (cliente, pagamento, entrega), `Timeline` |
| Produtos / estoque | `DataTable` com `Meter` de estoque × mínimo (`tone="warn"` abaixo do mínimo, `bad` zerado), `Badge` só na exceção |
| Ajuste de estoque | `Modal sm`: `NumberField`, `Select` motivo, `TextareaField` |
| Notas fiscais | `DataTable`; status rejeitada em `bad` com motivo da SEFAZ e "Corrigir e reenviar" |

Blocos: `erp-dashboard` (painel de operação), `erp-orders` e `erp-order` (pedidos de venda), `erp-invoices` e `erp-invoice` (NF-e em lista e em formato de leitura/impressão), `erp-purchase-requests` (requisições com aprovação e cotações), `erp-purchase-orders` e `erp-purchase-order` (pedidos de compra), `erp-receiving` (recebimento com NF-e de entrada e divergências), `erp-inventory` (posição de estoque), `erp-stock-movements` (kardex e ajuste de inventário), `erp-shipping` (expedição em quadro com rastreio), `erp-products` e `erp-product` (catálogo e página do produto), `erp-customers` e `erp-suppliers` (cadastros), `fin-bank-accounts` (contas bancárias, no módulo financeiro). Casca: `shells/nexo-shell.tsx`. Categoria **ERP** no showcase. Para empresa que vende serviço (OS, NFS-e, contratos recorrentes), veja a [receita de ERP de serviços](erp-servicos.md).

## Regras específicas

- Quantidades e valores `tabular-nums`, à direita; totais em linha de rodapé da tabela, `font-semibold`.
- Operações fiscais são irreversíveis: `ConfirmDialog` com consequência ("A nota será enviada à SEFAZ").
- Emissão é operação longa: `OperationButton` com "Emitindo nota…" e resultado incerto tratado (`UncertainFailure`: "Verifique na lista antes de emitir de novo").
- CNPJ, CPF, CEP sempre com máscara na tela.
