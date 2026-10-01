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
├─ Início        painel de operação
├─ Pedidos       lista (padrão) | quadro por status → Pedido (página de registro)
├─ Produtos      lista com estoque                  → Produto (entidade: Visão | Movimentações | Fornecedores)
├─ Estoque       posição e movimentações
├─ Compras       lista | quadro                      → Pedido de compra
├─ Notas fiscais lista
└─ Cadastros     clientes, fornecedores
   Configurações empresa, impostos, integrações (SEFAZ, e-commerce)
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

Blocos: `erp-orders` (pedidos de venda), `erp-inventory` (estoque), `erp-purchase-requests` (requisições de compra com aprovação e cotações), `erp-invoice` (NF-e em formato de leitura/impressão). Categoria **ERP** no showcase.

## Regras específicas

- Quantidades e valores `tabular-nums`, à direita; totais em linha de rodapé da tabela, `font-semibold`.
- Operações fiscais são irreversíveis: `ConfirmDialog` com consequência ("A nota será enviada à SEFAZ").
- Emissão é operação longa: `OperationButton` com "Emitindo nota…" e resultado incerto tratado (`UncertainFailure`: "Verifique na lista antes de emitir de novo").
- CNPJ, CPF, CEP sempre com máscara na tela.
