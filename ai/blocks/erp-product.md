# Produto

- Arquivo: `src/blocks/erp-product.tsx` (copie inteiro; os dados de exemplo ficam no topo)
- Categoria: ERP
- Preview: showcase `#/frame/erp-product` (`?theme=dark` para o escuro)

Página do SKU: saldo por depósito contra o mínimo, projeção de estoque em 30 dias, preço e margem, fornecedor e histórico de movimentações. Ajuste de preço e pedido de compra.

## Conceito

**Objetivo:** Entender um SKU: onde está o estoque, quando acaba, margem e quem fornece.

**Padrões aplicados**

- Anatomia C · Registro: propriedades fixas à direita
- Saldo por depósito contra o mínimo; projeção de 30 dias
- Ajuste de preço e pedido de compra em modal

**Quando usar e o que adaptar**

- Plano (SaaS), vaga (ATS), contrato

**Evite**

- Projeção sem a linha do mínimo

## Componentes usados

`AreaChart`, `Badge`, `Button`, `ChartCard`, `Column`, `CurrencyField`, `DataTable`, `Empty`, `KpiCard`, `KpiGrid`, `Meter`, `Modal`, `Page`, `PageHeading`, `PropertyList`, `SplitLayout`, `formatCurrency`, `formatNumber`, `formatPercent`, `notify`
